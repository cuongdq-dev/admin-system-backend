import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);

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
      console.log(data);
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
}
