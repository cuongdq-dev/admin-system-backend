import { Customer, CustomerToken, CustomerTokenType } from '@app/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(CustomerToken)
    private readonly tokenRepository: Repository<CustomerToken>,
  ) {}

  async create(
    customer: Customer,
    type: keyof typeof CustomerTokenType = 'REGISTER_VERIFY',
    expires_at: Date = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  ) {
    const token = CustomerToken.create({
      customer_id: customer.id,
      type: CustomerTokenType[type],
      expires_at,
    });
    return this.tokenRepository.save(token);
  }

  async verify(token: string, type: keyof typeof CustomerTokenType) {
    const tokenEntity = await this.tokenRepository.findOne({
      relations: ['customer'],
      loadEagerRelations: true,
      where: { token, type: CustomerTokenType[type], is_used: false },
    });
    if (!tokenEntity) {
      throw new Error('Token not found');
    }
    if (tokenEntity.expires_at < new Date()) {
      throw new Error('Token expired');
    }
    tokenEntity.is_used = true;
    await tokenEntity.save();
    return tokenEntity.customer;
  }
}
