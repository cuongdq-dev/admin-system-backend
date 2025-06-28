import { configLoads } from '@app/modules';
import { TypeORMConfigFactory } from '@app/modules/database/typeorm.factory';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskModule } from './task/task.module';
import * as FirebaseAdmin from 'firebase-admin';
import { BullModule } from '@nestjs/bull';

export const global_modules = [
  BullModule.forRoot({
    redis: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    },
  }),

  ConfigModule.forRoot({
    load: configLoads,
    isGlobal: true,
    envFilePath: ['.env'],
  }),
  TypeOrmModule.forRootAsync({ useClass: TypeORMConfigFactory }),
];

@Module({
  imports: [...global_modules, ScheduleModule.forRoot(), TaskModule],
})
export class BatchModule {
  constructor() {
    FirebaseAdmin.initializeApp({
      credential: FirebaseAdmin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
}
