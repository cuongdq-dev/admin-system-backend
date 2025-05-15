import { ValidationGroup } from '@app/crud/validation-group';
import { IsOptional } from 'class-validator';
import { randomBytes } from 'node:crypto';
import {
  BeforeInsert,
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  Relation,
} from 'typeorm';
import { BaseEntity } from './base';
import { Category } from './category.entity';
import { SiteBook } from './site_books.entity';
import { SitePost } from './site_posts.entity';

export enum SiteType {
  POST = 'POST',
  BOOK = 'BOOK',
}

export type AdSlotType =
  | 'horizontal'
  | 'vertical'
  | 'square'
  | 'detail'
  | 'mutiplex';

@Entity({ name: 'sites' })
export class Site extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  name: string;

  @Column({ type: 'boolean', default: false })
  autoPost: boolean;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  domain: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  description: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  teleToken: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  teleBotName: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  teleChatName: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  teleChatId: string;

  @OneToMany(() => SitePost, (sitePost) => sitePost.site)
  sitePosts: Relation<SitePost[]>; // Quan hệ với bảng trung gian SitePost

  @OneToMany(() => SiteBook, (siteBook) => siteBook.site)
  siteBooks: Relation<SiteBook[]>; // Quan hệ với bảng trung gian SiteBook

  @ManyToMany(() => Category, (category) => category.sites, { cascade: true })
  @JoinTable({
    name: 'site_categories',
    joinColumn: { name: 'site_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Relation<Category[]>;

  @Column({ type: 'text', nullable: true })
  token: string;

  // 🔹 GA code
  @Column({ type: 'varchar', length: 250, nullable: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  adsense_ga: string; // ga-xxx

  // 🔹 Google AdSense Client ID
  @Column({ type: 'varchar', length: 250, nullable: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  adsense_client: string; // ca-pub-xxxxxxxxxxxxx

  // 🔹 Lưu nhiều Slot Quảng Cáo với TypeORM JSONB (PostgreSQL) hoặc JSON (MySQL)
  @Column({ type: 'jsonb', nullable: true }) // Đổi thành 'json' nếu dùng MySQL
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  adsense_slots: {
    slot_name: string;
    slot_id: string;
    slot_type: AdSlotType;
  }[]; // Danh sách slot quảng cáo
  @BeforeInsert()
  generateToken() {
    this.token = randomBytes(32).toString('hex'); // 64 ký tự hex
  }

  @Column({ type: 'enum', enum: SiteType, nullable: true })
  @Index()
  type: SiteType;
}
