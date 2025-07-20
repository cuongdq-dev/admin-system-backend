import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { TokenService } from '../token/token.service';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SendVerifyMailDto,
} from './email.dto';
import { User } from '@app/entities';

@Injectable()
export class EmailService {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async register(registerDto: RegisterDto) {
    const userRegister = User.create({ ...registerDto });
    const user = await this.userRepository.save(userRegister);
    const token = await this.tokenService.create(user, 'REGISTER_VERIFY');
    await this.authService.userRegisterEmail({
      to: user.email,
      data: {
        hash: token.token,
      },
    });
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnprocessableEntityException({
        errors: { email: 'User not found' },
      });
    }
    if (!user.is_active) {
      throw new UnprocessableEntityException({
        errors: { email: 'User not active' },
      });
    }
    if (!user.comparePassword(loginDto.password)) {
      throw new UnprocessableEntityException({
        errors: { password: 'Password is incorrect' },
      });
    }
    return this.authService.createJwtToken(user);
  }

  async sendForgotMail(sendForgotMailDto: SendVerifyMailDto) {
    const user = await this.userRepository.findOne({
      where: { email: sendForgotMailDto.email.toLowerCase() },
    });

    if (!user)
      throw new UnprocessableEntityException({
        errors: {
          email: 'User not found',
        },
      });

    const token = await this.tokenService.create(user, 'RESET_PASSWORD');
    await this.authService.forgotPasswordEmail({
      to: user.email,
      data: { hash: token.token },
    });
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const user = await this.tokenService.verify(
        resetPasswordDto.reset_token,
        'RESET_PASSWORD',
      );
      user.password = resetPasswordDto.password;
      await user.save();
    } catch (e) {
      throw new UnprocessableEntityException({
        errors: {
          reset_token: e.message,
        },
      });
    }
  }
}
