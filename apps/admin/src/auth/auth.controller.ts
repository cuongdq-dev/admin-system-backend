import { SessionParam, UserParam } from '@app/decorators';
import { Session, User } from '@app/entities';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionService } from '../session/session.service';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private authService: AuthService,
    private sessionService: SessionService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('/profile')
  @ApiOperation({ summary: 'Refresh your access token.' })
  @HttpCode(HttpStatus.OK)
  async getProfile(@UserParam() user: User) {
    return this.authService.getProfile(user);
  }

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
