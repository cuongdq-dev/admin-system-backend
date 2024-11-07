import { Module } from '@nestjs/common';
import { LandingController } from './landing.controller';
import { LandingService } from './landing.service';

@Module({
  imports: [],
  controllers: [LandingController],
  providers: [LandingService]
})
export class LandingModule {}
