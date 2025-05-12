import { Book, Category, Chapter, Media, Site, SiteBook } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookController } from './book.controller';
import { BookService } from './book.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Site, Media, Book, Chapter, SiteBook]),
  ],
  providers: [BookService],
  controllers: [BookController],
})
export class BookModule {}
