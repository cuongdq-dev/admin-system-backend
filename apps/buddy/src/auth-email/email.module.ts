import { Media, User } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { TokenModule } from '../token/token.module';
import { UserModule } from '../user/user.module';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { FirebaseModule } from '@app/modules/firebase/firebase.module';

@Module({
  imports: [
    UserModule,
    TokenModule,
    AuthModule,
    FirebaseModule,
    TypeOrmModule.forFeature([User, Media]),
  ],
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailAuthModule {}
