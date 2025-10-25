import { Session } from '@app/entities';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as admin from 'firebase-admin';
import { In, Repository } from 'typeorm';

type DataType =
  | 'message'
  | 'add-member'
  | 'delete-group'
  | 'left-group'
  | 'remove-member'
  | 'member-accept-invitation'
  | 'member-reject-invitation'
  | 'system-change';

interface PayloadSingleUser {
  title: string;
  userId: string;
  body?: string;
  link?: string;
  data?: { type: DataType } & Record<string, any>;
}
interface PayloadMultipleUser {
  title: string;
  userIds: string[];
  body?: string;
  link?: string;
  data?: { type: DataType } & Record<string, any>;
}
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

  async sendToUser(payload: PayloadSingleUser) {
    const { body, title, userId, data, link } = payload;
    const sessions = await this.sessionRepo.find({
      where: { user_id: userId, deleted_at: null },
    });
    const tokens = sessions.map((s) => s.device_token).filter(Boolean);
    if (tokens.length === 0) return;

    try {
      const notifyResult = await admin.messaging().sendEachForMulticast({
        tokens,
        data,
        notification: { title, body },
        webpush: link && { fcmOptions: { link } },
      });
      console.log(notifyResult);
    } catch (error) {
      this.logger.warn(
        `Failed to send notification to user ${userId}: ${error}`,
      );
    }
  }

  /**
   * Gửi notify cho nhiều user
   */
  async sendToUsers(payload: PayloadMultipleUser) {
    const { body, title, userIds, data, link } = payload;
    if (!userIds.length) return;
    const sessions = await this.sessionRepo.find({
      where: { user_id: In(userIds), deleted_at: null },
    });
    const tokens = sessions.map((s) => s.device_token).filter(Boolean);
    if (tokens.length === 0) return;
    try {
      const notifyResult = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data,
        webpush: link && { fcmOptions: { link } },
      });
      console.log(notifyResult);
    } catch (error) {
      this.logger.warn(`Failed to send notifications: ${error}`);
    }
  }
}
