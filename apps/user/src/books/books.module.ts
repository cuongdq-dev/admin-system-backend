import { Book, Category, Chapter, Site, SiteBook } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BooksTokenGuard } from './guards/books-token.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Site, Category, Book, Chapter, SiteBook]),
  ],
  controllers: [BooksController],
  providers: [BooksService, BooksTokenGuard],
})
export class BooksModule {}
