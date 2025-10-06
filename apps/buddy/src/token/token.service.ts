import { Token, UserTokenType, User } from '@app/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
  ) {}

  async create(
    user: User,
    type: keyof typeof UserTokenType = 'REGISTER_VERIFY',
    expires_at: Date = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  ) {
    const token = Token.create({
      user_id: user.id,
      type: UserTokenType[type],
      expires_at,
    });
    return this.tokenRepository.save(token);
  }

  async verify(token: string, type: keyof typeof UserTokenType) {
    const tokenEntity = await this.tokenRepository.findOne({
      relations: ['user'],
      loadEagerRelations: true,
      where: { token, type: UserTokenType[type], is_used: false },
    });
    if (!tokenEntity) {
      throw new Error('Token not found');
    }
    if (tokenEntity.expires_at < new Date()) {
      throw new Error('Token expired');
    }
    tokenEntity.is_used = true;
    await tokenEntity.save();
    return tokenEntity.user;
  }
}
