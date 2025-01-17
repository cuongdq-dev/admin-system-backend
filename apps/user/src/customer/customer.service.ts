import { Customer } from '@app/entities';
import { MediaService } from '@app/modules';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { RegisterDto } from '../auth-email/email.dto';
import { CustomerUpdateDto } from './customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private mediaService: MediaService,
  ) {}

  async create(
    customerCreateDto:
      | RegisterDto
      | Pick<Customer, 'email_verified_at' | 'is_active' | 'provider'>,
  ) {
    const customer = Customer.create({ ...customerCreateDto });
    return this.customerRepository.save(customer);
  }

  async update(
    customer: Customer,
    avatar: Express.Multer.File,
    updateDto: CustomerUpdateDto,
  ) {
    const updateData: Record<string, string> = {
      ...updateDto,
    };
    const previousImage = customer.avatar_id;
    if (avatar) {
      updateData.avatar_id = (await this.mediaService.update(avatar)).id;
    }

    await this.customerRepository.update(customer.id, updateData);
    if (avatar && previousImage && updateData.avatar_id !== previousImage) {
      await this.mediaService.deleteMedia(previousImage);
    }

    return plainToInstance(Customer, {
      ...customer,
      ...updateData,
    });
  }
}
