import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SendVerifyMailDto,
} from './email.dto';
import { EmailService } from './email.service';

@ApiTags('Auth Email')
@Controller({ path: 'auth/email', version: '1' })
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('/register')
  @ApiOperation({ summary: 'Register by email' })
  @ApiCreatedResponse({
    description: 'User successfully registered.',
  })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.emailService.register(registerDto);
  }

  @Post('/login')
  @ApiOperation({ summary: 'Log in with Email.' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.emailService.login(loginDto);
  }

  @Post('/reset-password-request')
  @ApiOperation({ summary: 'Send Reset Password mail.' })
  @ApiNoContentResponse({
    description: 'Sent Reset Password mail.',
  })
  @ApiForbiddenResponse({
    description: 'Please verify email first.',
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendForgotMail(@Body() sendForgotMailDto: SendVerifyMailDto) {
    return this.emailService.sendForgotMail(sendForgotMailDto);
  }

  @Post('/reset-password')
  @ApiOperation({ summary: 'Password Reset.' })
  @ApiNoContentResponse({
    description: 'Password Reset Successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid Reset token',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.emailService.resetPassword(resetPasswordDto);
  }
}
