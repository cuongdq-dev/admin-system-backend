import { Customer, CustomerSession } from '@app/entities';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(CustomerSession)
    private sessionRepository: Repository<CustomerSession>,
  ) {}

  create(customer: Customer) {
    return this.sessionRepository
      .create({
        customer,
      })
      .save();
  }

  async get(id: string) {
    const session = await this.sessionRepository.findOneBy({
      id,
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }

  async delete(id: string) {
    await this.sessionRepository.softDelete({
      id,
    });
  }
}
