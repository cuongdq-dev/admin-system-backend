import { Bill, Group, GroupMember, Message, User } from '@app/entities';
import { FirebaseService } from '@app/modules/firebase/firebase.service';
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
  GROUP_RELATIONS,
  GroupMemberSelect,
  GroupSelect,
  MESSAGE_RELATIONS,
  SendMessageDto,
  UserSelect,
} from './dto/group.dto';
import { callGeminiApi } from '@app/utils';

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
        role: 'owner',
        status: 'active',
        joinedAt: new Date(),
      });
      await manager.save(GroupMember, owner);

      return await manager.findOne(GroupMember, {
        where: { group: { id: savedGroup.id } },
        relations: GROUP_MEMBER_RELATIONS,
      });
    });
  }

  async getGroupsOverview(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [memberGroups, total] = await this.memberRepo.findAndCount({
      where: { user: { id: userId }, status: 'active' },
      select: GroupMemberSelect,
      relations: [
        'group',
        'group.members',
        'group.members.user',
        'user',
        'group.bills',
        'group.bills.items',
        'group.messages',
        'group.messages.reads',
      ],
      order: { group: { created_at: 'DESC' } },
      take: limit,
      skip,
    });

    const [invitationGroup, totalInvitation] =
      await this.memberRepo.findAndCount({
        where: { user: { id: userId }, status: 'invited' },
        select: GroupMemberSelect,
        relations: GROUP_MEMBER_RELATIONS,
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

  async getMessageByGroupId(page = 1, limit = 20, group: Group, user: User) {
    const skip = (page - 1) * limit;

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
          members: {
            id: true,
            last_read_at: true,
            last_read_message_id: true,
            user: {
              id: true,
              name: true,
              avatar: { url: true, id: true, slug: true },
            },
          },
        },
      },
      relations: MESSAGE_RELATIONS,
      order: { created_at: 'DESC' },
      take: limit,
      skip,
    });

    if (messageGroup[0]) {
      await this.memberRepo.update(
        { group: { id: group.id }, user: { id: user.id } },
        {
          last_read_at: new Date(),
          last_read_message_id: messageGroup[0].id,
          last_read_message_number: 0,
        },
      );
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

  async sendMessage(userId: string, group: Group, body: SendMessageDto) {
    const sender = await this.userRepo.findOne({
      where: { id: userId },
      select: UserSelect,
      relations: ['avatar'],
    });

    const message = this.messageRepo.create({
      content: body.content,
      group: group,
      sender: sender,
    });
    await message.save();

    const newMesageMG = group.members.map((m) => ({
      ...m,
      last_read_at: m.user.id == userId ? message.created_at : m.last_read_at,
      last_read_message_id:
        m.user.id == userId ? message.id : m.last_read_message_id,
      last_read_message_number:
        m.user.id == userId ? 0 : (m.last_read_message_number || 0) + 1,
    }));

    await this.memberRepo.save(newMesageMG);

    const members = await this.memberRepo.find({
      where: {
        group: { id: group.id },
        user: { id: Not(sender.id) },
        status: 'active',
      },
      select: GroupMemberSelect,
      relations: GROUP_MEMBER_RELATIONS,
    });

    if (members.length > 0) {
      this.firebaseService.sendToUsers(
        members.map((m) => m?.user?.id),
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

    // 1️⃣ Chuẩn hóa & validate email
    const normalized = Array.from(
      new Set(
        emails
          .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
          .filter(Boolean),
      ),
    );

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
        `${inviter?.name ?? 'Someone'} invited you to join "${
          group.name
        }" on ${appName}`,
        {
          type: 'invitation', //screen
          data: JSON.stringify(member),
          sender: JSON.stringify(user),
        },
      );
    }

    // 6️⃣ Trả về group mới nhất (bao gồm members)
    return this.groupRepo.findOne({
      where: { id: group.id },
      select: GroupSelect,
      relations: GROUP_RELATIONS,
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

    await this.memberRepo.update(
      { id: memberGroup.id },
      { status: 'left', leftAt: new Date(), leftBy: user },
    );

    return await this.groupRepo.findOne({
      where: { id: group.id },
      relations: GROUP_RELATIONS,
      select: GroupSelect,
    });
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
          type: 'group',
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
          type: 'group', //screen
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
    console.log(data);
    return data;
  }
}
