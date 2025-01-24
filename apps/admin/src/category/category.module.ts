import { Post, Category, User } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, Category])],
  providers: [CategoryService],
  controllers: [CategoryController],
})
export class CategoryModule {}
