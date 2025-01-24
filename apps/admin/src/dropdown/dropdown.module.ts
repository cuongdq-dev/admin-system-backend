import { Category, Post, Site } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DropdownController } from './dropdown.controller';
import { DropdownService } from './dropdown.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Site, Category])],
  providers: [DropdownService],
  controllers: [DropdownController],
})
export class DropdownModule {}
