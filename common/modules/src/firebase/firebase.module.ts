import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirebaseService } from './firebase.service';
import { Session, User } from '@app/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Session])],
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
