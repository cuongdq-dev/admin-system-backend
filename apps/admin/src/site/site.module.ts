import { Post, Category, Site, User } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, Category, Site])],
  providers: [SiteService],
  controllers: [SiteController],
})
export class SiteModule {}
