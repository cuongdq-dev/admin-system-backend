import { Group, GroupMember, Message, User } from '@app/entities';
import { FirebaseService } from '@app/modules/firebase/firebase.service';
import { callGeminiApi } from '@app/utils';
import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import {
  AddMemberDto,
  CreateGroupDto,
  GenerateInvoiceDto,
  GROUP_MEMBER_RELATIONS,
  GroupMemberSelect,
  SendMessageDto,
  UserSelect,
} from './dto/group.dto';

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

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create group + add members (transaction)
   */
  async createGroup(creator: User, dto: CreateGroupDto) {
    return await this.dataSource.transaction(async (manager) => {
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
      const groupMember = manager.create(GroupMember, {
        group: savedGroup,
        user: creator,
        role: 'owner',
        status: 'active',
        joinedAt: new Date(),
      });
      await manager.save(GroupMember, groupMember);

      return await manager.findOne(GroupMember, {
        where: { group: { id: savedGroup.id } },
        relations: GROUP_MEMBER_RELATIONS,
      });
    });
  }

  async getGroupsOverview(user: User, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [memberGroups, total] = await this.memberRepo.findAndCount({
      where: { user: { id: user.id }, status: 'active' },
      select: GroupMemberSelect,
      relations: ['group', 'group.members', 'group.members.user', 'user'],
      order: { group: { created_at: 'DESC' } },
      take: limit,
      skip,
    });

    const invitationGroup = await this.memberRepo.find({
      where: { user: { id: user.id }, status: 'invited' },
      select: GroupMemberSelect,
      relations: [
        'group',
        'group.members',
        'group.members.user',
        'invitedBy',
        'user',
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
      invitations: invitationGroup,
    };
  }

  async getMessageByGroupId(page = 1, limit = 20, group: Group, user: User) {
    const skip = (page - 1) * limit;

    const groupMember = await this.memberRepo.findOne({
      where: { user: { id: user.id }, group: { id: group.id } },
    });

    const [messageGroup, total] = await this.messageRepo.findAndCount({
      where: { group: { id: group.id } },
      select: {
        id: true,
        content: true,
        created_at: true,
        sender: UserSelect,
        group: {
          id: true,
          name: true,
          slug: true,
          members: {
            id: true,
            status: true,
            joinedAt: true,
            last_read_at: true,
            last_read_message_id: true,
            last_read_message_number: true,
            user: UserSelect,
          },
        },
      },
      relations: ['sender', 'group', 'group.members', 'group.members.user'],
      order: { created_at: 'DESC' },
      take: limit,
      skip,
    });

    if (!!messageGroup[0]) {
      await this.memberRepo.save({
        ...groupMember,
        last_read_at: messageGroup[0].created_at,
        last_read_message_id: messageGroup[0].id,
        last_read_message_number: 0,
      });
    }

    return {
      data: messageGroup,
      pageSize: Number(limit),
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      hasMore: Math.ceil(total / limit) > page,
    };
  }

  async sendMessage(sender: User, group: Group, body: SendMessageDto) {
    const message = this.messageRepo.create({
      content: body.content,
      group: group,
      sender: sender,
    });
    await message.save();

    const groupMembers = await this.memberRepo.find({
      where: {
        group: { id: group.id },
        user: { id: Not(sender.id) },
        status: 'active',
      },
      select: GroupMemberSelect,
      relations: GROUP_MEMBER_RELATIONS,
    });

    await this.memberRepo.save(
      groupMembers.map((m) => {
        if (m.user.id == sender.id)
          return {
            ...m,
            last_read_at: message.created_at,
            last_read_message_id: message.id,
            last_read_message_number: 0,
          };

        return {
          ...m,
          last_read_message_number: (m.last_read_message_number || 0) + 1,
        };
      }),
    );

    if (groupMembers.length > 0) {
      this.firebaseService.sendToUsers(
        groupMembers.map((m) => m?.user?.id),
        `${sender.name} sent a new message to group ${group?.name}`,
        '',
        {
          type: 'message',
          data: JSON.stringify(message),
          sender: JSON.stringify(sender),
        },
      );
    }

    return message;
  }

  async addMembers(user: User, group: Group, body: AddMemberDto) {
    const userId = user.id;
    const { emails } = body;
    if (!emails?.length) throw new BadRequestException('No emails provided');
    if (!group) throw new NotFoundException('Group not found');

    const emailActived = group.members
      .filter((m) => m.status === 'active')
      .map((m) => m.user?.email?.toLowerCase())
      .filter(Boolean);

    // 1️⃣ Chuẩn hóa & validate email
    const normalized = Array.from(
      new Set(
        emails
          .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
          .filter(Boolean),
      ),
    )
      .map((e) => e.toLowerCase())
      .filter((email) => !emailActived.includes(email));

    if (normalized.includes(user.email)) {
      throw new BadRequestException({ message: 'Not update owner member' });
    }

    const invalid = normalized.filter(
      (e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
    );

    if (invalid.length > 0)
      throw new BadRequestException({
        message: 'Invalid email addresses',
        invalid,
      });

    // 2️⃣ Tìm user đã tồn tại

    const users = await this.userRepo.find({
      where: { email: In(normalized) },
      select: UserSelect,
    });

    const userByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));

    const missingEmails = normalized.filter((email) => !userByEmail.has(email));

    if (missingEmails.length > 0) {
      const newUsers = missingEmails.map((email) =>
        this.userRepo.create({
          email,
          name: email.split('@')[0],
          is_active: false,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: user.id,
        }),
      );
      const inserted = await this.userRepo.save(newUsers);

      // merge lại để đảm bảo tất cả email đều có user
      for (const u of inserted) {
        userByEmail.set(u.email.toLowerCase(), u);
      }
    }

    // 3️⃣ Chuẩn bị các record GroupMember
    const membersToUpsert = normalized.map((email) => {
      const existingUser = userByEmail.get(email);
      return this.memberRepo.create({
        group: group,
        user: existingUser || null,
        invitedBy: { id: user.id, email: user.email, name: user.name },
        invitedAt: new Date(),
        created_by: userId,
        role: 'member',
        status: 'invited',
      });
    });

    // 4️⃣ Upsert: nếu đã tồn tại (từng left), update lại status -> invited
    await this.memberRepo.upsert(membersToUpsert, {
      conflictPaths: ['group.id', 'user.id'], // cần có unique index trên DB
    });

    // 5️⃣ Gửi mail (fire-and-forget)
    const inviter = await this.userRepo.findOne({
      where: { id: userId },
      select: UserSelect,
    });
    const appName = this.configService.get('app.name') ?? 'App';
    const frontendDomain = this.configService.get('app.frontendDomain') ?? '';

    for (const member of membersToUpsert) {
      const toEmail = member.user?.email;
      if (!toEmail) continue;
      this.mailerService
        .sendMail({
          to: toEmail,
          subject: `${inviter?.name ?? 'Someone'} invited you to join "${
            group.name
          }" on ${appName}`,
          template: 'group/invitation',
          context: {
            title: 'Group Invitation',
            actionTitle: 'Join Group',
            url: `${frontendDomain}/group/${group.id}`,
            app_name: appName,
            group_name: group.name,
            inviter_name: inviter?.name,
            user_exists: !!member.user,
            year: new Date().getFullYear(),
          },
        })
        .catch((err) =>
          console.error(`Failed to send invite to ${toEmail}`, err.message),
        );
      this.firebaseService.sendToUser(
        member?.user?.id,
        'New invitation group',
        `${inviter?.name ?? 'Someone'} invited you to join "${group.name}"`,
        {
          type: 'add-member', //screen
          data: JSON.stringify(member),
          sender: JSON.stringify(user),
        },
      );
    }

    // 6️⃣ Trả về group mới nhất (bao gồm members)
    return this.memberRepo.findOne({
      where: { group: { id: group.id } },
      select: GroupMemberSelect,
      relations: GROUP_MEMBER_RELATIONS,
    });
  }

  async removeMember(member: User, group: Group, user: User) {
    const memberGroup = await this.memberRepo.findOne({
      where: {
        role: In(['member', 'admin']),
        status: In(['active', 'invited']),
        user: { id: member.id },
        group: { id: group.id },
      },
      select: GroupMemberSelect,
      relations: GROUP_MEMBER_RELATIONS,
    });
    if (!memberGroup || memberGroup.role === 'owner')
      throw new NotFoundException('Cannot remove the group owner');

    const result = await this.memberRepo.save({
      ...memberGroup,
      status: 'left',
      leftAt: new Date(),
      leftBy: user,
    });

    this.firebaseService.sendToUser(
      member?.id,
      '',
      `${user?.name ?? 'Someone'} removed you from group "${group.name}" `,
      {
        type: 'remove-member', //screen
        data: JSON.stringify(result),
        sender: JSON.stringify(user),
      },
    );

    return result;
  }

  async acceptInvitation(user: User, invitation: GroupMember) {
    if (!invitation || invitation.status != 'invited')
      throw new NotFoundException('Invitation not found or already handled');

    await this.memberRepo.save({
      ...invitation,
      status: 'active',
      leftAt: undefined,
      leftBy: undefined,
      joinedAt: new Date(),
      updated_by: user.id,
    });

    const result = await this.memberRepo.findOne({
      where: { id: invitation.id },
      select: GroupMemberSelect,
      relations: GROUP_MEMBER_RELATIONS,
    });

    if (result?.invitedBy) {
      this.firebaseService.sendToUser(
        result?.invitedBy.id,
        `${result?.user?.name} accepted your invitation`, // title
        ``,
        {
          type: 'member-accept-invitation',
          data: JSON.stringify(result),
          sender: JSON.stringify(user),
        },
      );
    }
    return result;
  }

  /**
   * ❌ Reject group invitation
   */
  async rejectInvitation(user: User, invitation: GroupMember) {
    if (!invitation || invitation.status != 'invited')
      throw new NotFoundException('Invitation not found or already handled');

    await this.memberRepo.save({
      ...invitation,
      status: 'reject',
      leftAt: new Date(),
      leftBy: undefined,
      joinedAt: undefined,
      updated_by: user.id,
    });

    const result = await this.memberRepo.findOne({
      where: { id: invitation.id },
      select: GroupMemberSelect,
      relations: GROUP_MEMBER_RELATIONS,
    });

    if (result?.invitedBy) {
      this.firebaseService.sendToUser(
        result?.invitedBy.id,
        `${result.user.name} rejected your invitation`, // title
        `They won't join the group "${result?.group?.name}"`,
        {
          type: 'member-reject-invitation', //screen
          data: JSON.stringify(result),
          sender: JSON.stringify(user),
        }, // data in response notify
      );
    }
    return result;
  }

  async generateInvoice(user: User, dto: GenerateInvoiceDto) {
    const geminiResponse = await callGeminiApi(`
      Sử dụng **${dto.text}** được cung cấp dưới đây. Nhiệm vụ của bạn là **trích xuất** tất cả các thông tin liên quan và **chuyển đổi** chúng thành một đối tượng JSON.

      **Yêu cầu Cấu trúc JSON:**
      Tuân thủ chính xác các giao diện sau cho dữ liệu đầu ra:
      declare interface Bill extends Base {
        title: string;
        note?: string;
        totalAmount: number;
        groupId: string;
        items: BillItem[];
        shares: BillShare[];
        payer: User;
      }

      declare interface BillItem extends Base {
        name: string; // Tên món
        quantity: number; // Số lượng
        price: number; // Giá mỗi món
        total: number; // = quantity * price
      }

      
      `);
    const contentData =
      geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const data = JSON.parse(contentData.replace(/```json|```/g, ''));
    return data;
  }
}
