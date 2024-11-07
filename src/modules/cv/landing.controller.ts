import { Controller, Get, Param, UsePipes } from '@nestjs/common';
import { MainValidationPipe } from '../../pipes';
import { LandingService } from './landing.service';

@Controller('/cv')
export class LandingController {
  constructor(private readonly _service: LandingService) {}
  @Get('/landing/:username')
  @UsePipes(new MainValidationPipe())
  async getCvLanding(@Param('username') username?: string) {
    return this._service.getCvLanding(username);
  }
}
