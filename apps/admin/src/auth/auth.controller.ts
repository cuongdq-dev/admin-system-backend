import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SessionService } from '../session/session.service';
import { SessionParam } from '@app/decorators';
import { Session } from '@app/entities';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private authService: AuthService,
    private sessionService: SessionService,
  ) {}

  @UseGuards(AuthGuard('refresh'))
  @Post('/refresh-token')
  @ApiOperation({ summary: 'Refresh your access token.' })
  @HttpCode(HttpStatus.OK)
  async refreshToken(@SessionParam() { id }: Session) {
    return this.authService.createAccessToken(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/logout')
  @ApiOperation({ summary: 'Expire session key' })
  @HttpCode(HttpStatus.OK)
  async logout(@SessionParam() { id }: Session) {
    return this.sessionService.delete(id);
  }
}
