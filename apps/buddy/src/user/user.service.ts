import { User } from '@app/entities';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserUpdateDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findMe(user: User) {
    const [profile] = await Promise.all([
      this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.avatar', 'avatar')
        .leftJoinAndSelect('user.banner', 'banner')
        .where('user.id = :userId', { userId: user.id })
        .select([
          'user.id',
          'user.name',
          'user.email',
          'user.address',
          'user.phoneNumber',
          'user.is_active',
          'user.created_at',
          'user.updated_at',

          'avatar.id',
          'avatar.url',
          'avatar.filename',

          'banner.id',
          'banner.url',
          'banner.filename',
        ])
        .groupBy('user.id')
        .addGroupBy('avatar.id')
        .addGroupBy('banner.id')
        .getOne(),
    ]);

    return { ...profile };
  }

  /**
   * Xóa site (soft delete)
   */
  async delete(user: User) {
    await this.userRepository.delete({ id: user.id });
    return {
      message: 'User deleted successfully.',
    };
  }

  async updateProfile(user: User, updateDto: UserUpdateDto) {
    const findUser = await this.userRepository.findOne({
      where: [{ id: user.id }, { created_by: user.id }],
      select: [
        'id',
        'name',
        'email',
        'phoneNumber',
        'address',
        'is_active',
        'created_at',
        'updated_at',
      ],
    });

    if (!findUser) throw new NotFoundException('User not found.');

    await this.userRepository.update({ id: findUser.id }, updateDto);

    return { ...findUser, ...updateDto };
  }
}
