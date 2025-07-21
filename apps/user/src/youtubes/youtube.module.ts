import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YoutubesController } from './youtube.controller';
import { YoutubesService } from './youtube.service';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [YoutubesController],
  providers: [YoutubesService],
})
export class YoutubesModule {}
