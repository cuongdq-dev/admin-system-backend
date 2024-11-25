import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { BaseEntity } from './base';
import { Lang } from './lang.entity';

@Entity({ name: 'lang_content' })
export class LangContent extends BaseEntity {
  @ApiProperty({ example: 'LANGUAGE_CODE' })
  @Column({ type: 'varchar', length: 200, unique: true })
  code: string;

  @ApiProperty({ example: 'Localized content' })
  @Column({ type: 'varchar' })
  content: string;

  @ApiProperty({ example: 'uuid-of-lang' })
  @Column({ type: 'uuid' })
  lang_id: string;

  @ManyToOne(() => Lang, (lang) => lang.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lang_id' })
  lang: Relation<Lang>;
}