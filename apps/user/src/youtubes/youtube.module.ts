import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YoutubesController } from './youtube.controller';
import { YoutubesService } from './youtube.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([])],
  controllers: [YoutubesController],
  providers: [YoutubesService],
})
export class YoutubesModule {}
