import { Session } from '@app/entities';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as admin from 'firebase-admin';
import { In, Repository } from 'typeorm';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);

  @InjectRepository(Session)
  private readonly sessionRepo: Repository<Session>;

  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  async verifyIdToken(idToken: string) {
    return admin.auth().verifyIdToken(idToken);
  }

  async sendNotification(
    token: string,
    title: string,
    body: string,
    data?: any,
  ) {
    try {
      const message = {
        token,
        notification: { title, body },
        data: data ?? {},
      };
      await admin.messaging().send(message);
      this.logger.log(`✅ Notification sent to ${token}`);
    } catch (err) {
      this.logger.error(`❌ Failed to send notification`, err.message);
    }
  }

  async sendToMany(tokens: string[], title: string, body: string, data?: any) {
    if (!tokens.length) return;
    try {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: data ?? {},
      });

      this.logger.log(`✅ Notification sent to ${tokens.length} devices`);
    } catch (err) {
      this.logger.error(`❌ Failed to send multicast`, err.message);
    }
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    const sessions = await this.sessionRepo.find({
      where: { user_id: userId, deleted_at: null },
    });
    const tokens = sessions.map((s) => s.device_token).filter(Boolean);
    if (tokens.length === 0) return;

    try {
      const result = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: data,
      });
      console.log('--->', result);
      console.log(tokens, { title, body }, data ?? {});
    } catch (error) {
      this.logger.warn(
        `Failed to send notification to user ${userId}: ${error}`,
      );
    }
  }

  /**
   * Gửi notify cho nhiều user
   */
  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    if (!userIds.length) return;
    const sessions = await this.sessionRepo.find({
      where: { user_id: In(userIds), deleted_at: null },
    });

    const tokens = sessions.map((s) => s.device_token).filter(Boolean);
    if (tokens.length === 0) return;

    try {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: data,
      });
    } catch (error) {
      this.logger.warn(`Failed to send notifications: ${error}`);
    }
  }
}
