import { ValidationGroup } from '@app/crud/validation-group';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { BaseEntity } from './base';
import { User } from './user.entity';

export enum NotificationStatus {
  NEW = 'NEW', // Just created
  RECEIVED = 'RECEIVED', // Acknowledged by the system
  READED = 'READED', // Marked as read by the user
  PENDING = 'PENDING', // Queued but not yet delivered
  FAILED = 'FAILED', // Delivery failed
  ARCHIVED = 'ARCHIVED', // Archived for reference
}

export enum NotificationType {
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  COMMENT = 'COMMENT',
  ORDER = 'ORDER',
  DELIVERY = 'DELIVERY',
  PROMOTION = 'PROMOTION', // Sales or discount notifications
  PAYMENT = 'PAYMENT', // Payment-related updates
  REFUND = 'REFUND', // Refund processing notifications
  FEEDBACK = 'FEEDBACK', // Feedback requests or updates
  REMINDER = 'REMINDER', // Scheduled reminders
  ACCOUNT = 'ACCOUNT', // Account-related notifications
}

@Entity({ name: 'notifications' })
export class Notification extends BaseEntity {
  @ApiProperty({ example: 'Notification title....' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @Column({ type: 'text', nullable: true })
  title: string;

  @ApiProperty({ example: 'Notification message....' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({
    enum: NotificationStatus,
    type: 'enum',
    default: NotificationStatus.NEW,
  })
  status: NotificationStatus;

  @Column({ enum: NotificationType, type: 'enum', nullable: true })
  type: NotificationType;

  @ApiProperty({ example: 'meta_data' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @Column({ type: 'text', nullable: true })
  meta_data: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne('users', 'notifications')
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;
}
