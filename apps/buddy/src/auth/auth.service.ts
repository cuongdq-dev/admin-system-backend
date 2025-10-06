import { Category, Post, Site, User } from '@app/entities';
import { MailData } from '@app/modules';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../session/session.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService,
    private sessionService: SessionService,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async createJwtToken(user: User, deviceToken?: string) {
    const refreshTokenExpiresIn = this.configService.get(
      'auth.refreshTokenExpiresIn',
    );
    const session = await this.sessionService.create(user, deviceToken);

    const accessToken = await this.createAccessToken(session.id);
    const refreshToken = this.jwtService.sign(
      { id: session.id, type: 'REFRESH' },
      { expiresIn: refreshTokenExpiresIn },
    );

    return {
      id: user.id,
      avatar: user.avatar,
      isActive: user.is_active,
      email: user.email,
      name: user.name,
      accessToken,
      refreshToken,
    };
  }

  async createAccessToken(sessionId: string) {
    const accessTokenExpiresIn = this.configService.get(
      'auth.accessTokenExpiresIn',
    );

    const payload = {
      id: sessionId,
      type: 'ACCESS',
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn,
    });

    return accessToken;
  }

  async userRegisterEmail(
    mailData: MailData<{
      hash: string;
    }>,
  ) {
    await this.mailerService.sendMail({
      to: mailData.to,
      subject: 'Thank You For Registration, Verify Your Account.',
      text: `${this.configService.get(
        'app.frontendDomain',
      )}/auth/verify?token=${mailData.data.hash}`,
      template: 'auth/registration',
      context: {
        url: `${this.configService.get(
          'app.frontendDomain',
        )}/auth/verify?token=${mailData.data.hash}`,
        app_name: this.configService.get('app.name'),
        title: 'Thank You For Registration, Verify Your Account.',
        actionTitle: 'Verify Your Account',
      },
    });
  }

  async forgotPasswordEmail(
    mailData: MailData<{
      hash: string;
    }>,
  ) {
    await this.mailerService.sendMail({
      to: mailData.to,
      subject: 'Here is your Link for Reset Password.',
      text: `${this.configService.get(
        'app.frontendDomain',
      )}/auth/reset-password?token=${mailData.data.hash}`,
      template: 'auth/registration',
      context: {
        url: `${this.configService.get(
          'app.frontendDomain',
        )}/auth/reset-password?token=${mailData.data.hash}`,
        app_name: this.configService.get('app.name'),
        title: 'Here is your Link for Reset Password.',
        actionTitle: 'Reset Password',
      },
    });
  }

  async getProfile(user: User) {
    const [profile, sites, categories, posts] = await Promise.all([
      this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.avatar', 'avatar')
        .where('user.id = :userId', { userId: user.id })
        .select([
          'user.id',
          'user.name',
          'user.email',
          'user.is_active',
          'user.created_at',
          'user.updated_at',
          'avatar.id',
          'avatar.url',
          'avatar.filename',
        ])
        .groupBy('user.id')
        .addGroupBy('avatar.id')
        .getOne(),
      this.siteRepository
        .createQueryBuilder('site')
        .where('site.created_by = :userId', { userId: user.id })
        .getMany(),

      this.categoryRepository
        .createQueryBuilder('category')
        .where('category.created_by = :userId', { userId: user.id })
        .getMany(),
      this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.thumbnail', 'thumbnail')
        .leftJoinAndSelect('post.categories', 'categories')
        .leftJoinAndSelect('post.sitePosts', 'sitePosts')
        .where('post.created_by = :userId', { userId: user.id })
        .limit(10)
        .getMany(),
    ]);

    return { ...profile, sites, categories, posts };
  }
}
