import {
  Bill,
  Group,
  GroupMember,
  Message,
  Session,
  User,
} from '@app/entities';
import { GroupRole } from '@app/entities/group-member.entity';
import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import { FirebaseService } from '../firebase/firebase.service';
import { AddMemberDto, CreateGroupDto, SendMessageDto } from './dto/group.dto';

@Injectable()
export class GroupService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
    private firebaseService: FirebaseService,

    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,

    @InjectRepository(GroupMember)
    private readonly memberRepo: Repository<GroupMember>,

    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,

    @InjectRepository(Bill)
    private readonly billRepo: Repository<Bill>,

    private readonly dataSource: DataSource, // ✅ thay thế getManager()
  ) {}

  /**
   * Create group + add members (transaction)
   */
  async createGroup(creatorId: string, dto: CreateGroupDto) {
    return await this.dataSource.transaction(async (manager) => {
      const creator = await manager.findOne(User, { where: { id: creatorId } });
      if (!creator) throw new NotFoundException('Creator not found');

      // Create group
      const group = manager.create(Group, {
        name: dto.name,
        description: dto.description || null,
        avatar: dto.avatar || null,
        created_by: creator.id,
      });
      const savedGroup = await manager.save(Group, group);

      // Add owner membership
      const owner = manager.create(GroupMember, {
        group: savedGroup,
        user: creator,
        role: 'owner' as GroupRole,
        joinedAt: new Date(),
      });
      await manager.save(GroupMember, owner);

      return await manager.findOne(GroupMember, {
        where: { group: { id: savedGroup.id } },
        relations: [
          'group',
          'group.members',
          'group.messages',
          'group.messages.reads',
          'group.members.user',
          'group.bills',
          'group.bills.items',
        ],
      });
    });
  }

  async getGroupsOverview(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [memberGroups, total] = await this.memberRepo.findAndCount({
      where: { user: { id: userId }, status: 'active' },
      relations: [
        'group',
        'group.members',
        'group.members.user',
        'group.bills',
        'group.bills.items',
        'group.messages',
        'group.messages.reads',
      ],
      order: { group: { created_at: 'DESC' } },
      take: limit,
      skip,
    });

    console.log(memberGroups);
    const [invitationGroup, totalInvitation] =
      await this.memberRepo.findAndCount({
        where: { user: { id: userId }, status: 'invited' },
        relations: [
          'group',
          'group.members',
          'group.members.user',
          'invitedBy',
        ],
        order: { group: { created_at: 'DESC' } },
        take: limit,
        skip,
      });

    return {
      data: memberGroups,
      pageSize: Number(limit),
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      hasMore: Math.ceil(total / limit) > page,
      invitations: { data: invitationGroup, totalRecords: totalInvitation },
    };
  }

  async getMessageByGroupId(
    userId: string,
    groupId: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const [messageGroup, total] = await this.messageRepo.findAndCount({
      where: { group: { id: groupId } },
      relations: ['group', 'sender', 'reads'],
      order: { created_at: 'DESC' },
      take: limit,
      skip,
    });

    return {
      data: messageGroup,
      pageSize: Number(limit),
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      hasMore: Math.ceil(total / limit) > page,
    };
  }
  async sendMessage(userId: string, groupId: string, body: SendMessageDto) {
    const [sender, group] = await Promise.all([
      this.userRepo.findOne({
        where: { id: userId },
        select: {
          id: true,
          avatar: { url: true, id: true },
          name: true,
          email: true,
        },
        relations: ['avatar'],
      }),
      this.groupRepo.findOne({
        where: { id: groupId },
        select: { name: true, avatar: true, id: true, description: true },
      }),
    ]);

    const message = this.messageRepo.create({
      content: body.content,
      group: group,
      sender: sender,
    });
    await message.save();

    const members = await this.memberRepo.find({
      where: {
        group: { id: groupId },
        user: { id: Not(sender.id) },
        status: 'active',
      },
      relations: ['user'],
    });

    const receiverUserIds = members.map((m) => m.user.id);

    if (receiverUserIds.length > 0) {
      const sessions = await this.sessionRepo.find({
        where: { user_id: In(receiverUserIds), deleted_at: null },
      });

      const tokens = sessions.map((s) => s.device_token);
      if (tokens.length > 0) {
        await this.firebaseService.sendToMany(tokens, group.name, sender.name, {
          type: 'message',
          message: JSON.stringify(message),
        });
      }
    }

    return message;
  }

  async checkUser(email: string) {
    const result = await this.userRepo.findOne({
      where: { email: email },
    });
    return result;
  }

  async addMembers(userId: string, groupId: string, body: AddMemberDto) {
    const { emails } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      throw new BadRequestException('No emails provided');
    }

    // Tìm group và inviter, validate
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['members'], // nếu entity có quan hệ members
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const inviter = await this.userRepo.findOne({ where: { id: userId } });
    if (!inviter) {
      throw new NotFoundException('Inviter (user) not found');
    }

    const appName = this.configService.get('app.name') ?? 'App';
    const frontendDomain = this.configService.get('app.frontendDomain') ?? '';

    // Chuẩn hoá email: loại bỏ khoảng trắng, filter email rỗng, unique
    const normalizedEmails = Array.from(
      new Set(
        emails
          .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
          .filter(Boolean),
      ),
    );

    // Nếu muốn, bạn có thể kiểm tra định dạng email bằng regex tại đây
    const invalidEmails = normalizedEmails.filter(
      (e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
    );

    if (invalidEmails.length > 0) {
      // Trả về error chi tiết hoặc loại bỏ invalid emails tuỳ yêu cầu
      throw new BadRequestException({
        message: 'Invalid email addresses',
        invalidEmails,
      });
    }

    // Chuẩn bị gửi: cho mỗi email, kiểm tra đã là member hay đã được mời...
    const tasks = normalizedEmails.map(async (email) => {
      try {
        // Kiểm tra đã là member (nếu group.members là array user entities)
        if (
          group.members &&
          group.members.some((m: any) => m.email === email)
        ) {
          return { email, status: 'skipped', reason: 'already_member' };
        }

        // Kiểm tra user đã đăng ký trong hệ thống chưa
        const existingUser = await this.userRepo.findOne({
          where: { email },
        });

        // TODO: Nếu bạn có repository invitation để lưu invitation record, tạo nó ở đây
        await this.memberRepo
          .create({
            group: { id: groupId },
            user: { id: existingUser.id },
            invitedAt: new Date(),
            created_by: userId,
            invitedBy: { id: userId },
            role: 'member',
            status: 'invited',
          })
          .save();

        // Gửi email (nếu bạn muốn content khác theo trường hợp user tồn tại hay không, xử lý ở đây)
        await this.mailerService.sendMail({
          to: existingUser.email,
          subject: `${inviter.name} invited you to join "${group.name}" on ${appName}`,
          template: 'group/invitation',
          context: {
            url: `${frontendDomain}/group/${groupId}`,
            app_name: appName,
            title: 'Group Invitation',
            actionTitle: 'Join the Group',
            group_name: group.name,
            inviter_name: inviter.name,
            year: new Date().getFullYear(),
            user_exists: Boolean(existingUser),
          },
        });

        return { email, status: 'sent' };
      } catch (err) {
        console.error(`Failed to invite ${email} to group ${groupId}`, err);
        return { email, status: 'failed', reason: err?.message ?? String(err) };
      }
    });

    // Thực thi song song và gom kết quả
    const settled = await Promise.allSettled(tasks);
    const results = settled.map((s) =>
      s.status === 'fulfilled'
        ? s.value
        : { status: 'failed', reason: 'unknown' },
    );

    // Tùy: lọc ra số lượng thành công/failed để trả về
    const summary = {
      total: normalizedEmails.length,
      sent: results.filter((r) => r.status === 'sent').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      failed: results.filter((r) => r.status === 'failed').length,
      details: results,
    };

    return {
      message: 'Invitation process completed',
      summary,
    };
  }

  async acceptInvitation(userId: string, invitationId: string) {
    const member = await this.memberRepo.findOne({
      where: { user: { id: userId }, id: invitationId, status: 'invited' },
      relations: ['group', 'group.members', 'group.members.user'],
    });

    if (!member) {
      throw new NotFoundException('Invitation not found or already handled');
    }

    member.status = 'active';
    member.joinedAt = new Date();
    member.updated_by = userId;
    await this.memberRepo.save(member);

    // Optional: gửi thông báo, hoặc email xác nhận

    // Trả về bản ghi đầy đủ sau khi update
    return await this.memberRepo.findOne({
      where: { id: member.id },
      relations: [
        'group',
        'group.members',
        'group.members.user',
        'group.bills',
        'group.bills.items',
        'group.messages',
        'group.messages.reads',
      ],
    });
  }

  /**
   * ❌ Reject group invitation
   */
  async rejectInvitation(userId: string, invitationId: string) {
    const member = await this.memberRepo.findOne({
      where: { user: { id: userId }, id: invitationId, status: 'invited' },
      relations: ['group', 'invitedBy'],
    });

    if (!member) {
      throw new NotFoundException('Invitation not found or already handled');
    }

    member.status = 'reject';
    member.leftAt = new Date();
    member.updated_by = userId;

    await this.memberRepo.save(member);

    return member;
  }
}
