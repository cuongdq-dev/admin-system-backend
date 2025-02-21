import { User } from '@app/entities';
import { MediaService } from '@app/modules';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { RegisterDto } from '../auth-email/email.dto';
import { UserUpdateDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private mediaService: MediaService,
  ) {}

  async create(userCreateDto: RegisterDto | Pick<User, 'is_active'>) {
    const user = User.create({ ...userCreateDto });
    return this.userRepository.save(user);
  }

  async update(
    user: User,
    avatar: Express.Multer.File,
    updateDto: UserUpdateDto,
  ) {
    const updateData: Record<string, string> = {
      ...updateDto,
    };
    const previousImage = user.avatar_id;
    if (avatar) {
      updateData.avatar_id = (await this.mediaService.update(avatar)).id;
    }

    await this.userRepository.update(user.id, updateData);
    if (avatar && previousImage && updateData.avatar_id !== previousImage) {
      await this.mediaService.deleteMedia(previousImage);
    }

    return plainToInstance(User, {
      ...user,
      ...updateData,
    });
  }
}
