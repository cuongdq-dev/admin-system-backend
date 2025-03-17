import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

@Injectable()
export class IndexingService {
  private readonly logger = new Logger(IndexingService.name);

  private auth = new GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Đường dẫn file JSON
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });

  private indexing = google.indexing({
    version: 'v3',
    auth: this.auth, // Truyền auth đúng kiểu dữ liệu
  });

  async notifyGoogle(url: string) {
    try {
      const res = await this.indexing.urlNotifications.publish({
        requestBody: {
          type: 'URL_UPDATED',
          url,
        },
      });

      this.logger.log(`✅ Google Indexing API: ${url} - Status: ${res.status}`);
    } catch (error) {
      this.logger.error(`❌ Google Indexing API Error: ${error.message}`);
    }
  }
}
