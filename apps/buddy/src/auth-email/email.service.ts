import { User } from '@app/entities';
import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { FirebaseService } from '../firebase/firebase.service';
import { TokenService } from '../token/token.service';
import { RegisterDto, ResetPasswordDto, SendVerifyMailDto } from './email.dto';

@Injectable()
export class EmailService {
  constructor(
    private firebaseService: FirebaseService,
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

  async login(idToken: string, deviceToken?: string) {
    const decoded = await this.firebaseService
      .verifyIdToken(idToken)
      .catch(() => {
        throw new UnauthorizedException('Invalid Firebase token');
      });

    const firebaseUid = decoded.uid;
    const email = decoded.email;
    const name = decoded.name || decoded.displayName;
    const isActive = decoded.email_verified;
    // Kiểm tra user trong DB
    const user = await this.userRepository.findOne({
      where: { email: email },
    });

    if (!user) {
      const createdUser = this.userRepository.create({
        firebase_uid: firebaseUid,
        email: email,
        name: name,
        is_active: isActive,
      });

      const result = await this.userRepository.save(createdUser);
      return this.authService.createJwtToken(result, deviceToken);
    }
    await this.userRepository.update(
      { id: user.id },
      {
        firebase_uid: firebaseUid,
        is_active: isActive,
      },
    );
    return this.authService.createJwtToken(user, deviceToken);
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
