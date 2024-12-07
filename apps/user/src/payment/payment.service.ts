import { Address, Customer, Payment } from '@app/entities';
import { PaymentStatus } from '@app/entities/payment.entity';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { AddressService } from '../address/address.service';
import { CartService } from '../cart/cart.service';
import { OrderService } from '../order/order.service';
import { StripeService } from '../stripe/stripe.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { paymentPaginateConfig } from './payment.pagination';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private cartService: CartService,
    private orderService: OrderService,
    private addressService: AddressService,
    private stripeService: StripeService,
  ) {}

  async getAll(query: PaginateQuery, customer: Customer) {
    return paginate(
      {
        ...query,
        filter: {
          ...query.filter,
          customer_id: customer.id,
        },
      },
      this.paymentRepository,
      paymentPaginateConfig,
    );
  }

  async create(createPaymentDto: CreatePaymentDto, customer: Customer) {
    const cart = await this.cartService.getOrCreateActiveCart(customer);
    const address = await this.addressService.getOne(
      plainToClass(Address, { id: createPaymentDto.address_id }),
      customer,
    );

    if (!address) {
      throw new UnprocessableEntityException({
        address_id: 'Address not found.',
      });
    }

    const order = await this.orderService.upsert(customer, address, cart);

    const payment = await this.paymentRepository.findOneBy({
      order_id: order.id,
      status: PaymentStatus.PENDING,
    });
    if (payment) {
      await this.stripeService.cancelIntent(payment.transaction_id);
      payment.status = PaymentStatus.CANCELED;
      await payment.save();
    }

    const amount = cart.items.reduce(
      (total, item) => total + item.variant.price,
      0,
    );

    const intent = await this.stripeService.createPaymentIntent(amount * 100);

    const newPayment = await this.paymentRepository.save({
      transaction_id: intent.id,
      order_id: order.id,
      customer_id: customer.id,
    });

    return {
      metadata: {
        clientSecret: intent.client_secret,
      },
      ...newPayment,
    };
  }

  async getPaymentByTransactionId(transaction_id: string) {
    return this.paymentRepository.findOne({
      where: {
        transaction_id,
      },
      relations: {
        order: {
          customer: true,
          address: true,
        },
      },
    });
  }
}
