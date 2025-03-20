import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);

  private async getAuthClient(scope: string) {
    const serviceAccountBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
    if (!serviceAccountBase64) {
      this.logger.error('❌ GOOGLE_CREDENTIALS_BASE64 is missing in .env');
      throw new Error('Missing GOOGLE_CREDENTIALS_BASE64');
    }

    // 🔹 Decode Base64 về JSON
    const serviceAccountJson = Buffer.from(
      serviceAccountBase64,
      'base64',
    ).toString('utf-8');
    const credentials = JSON.parse(serviceAccountJson);

    // 🔹 Khởi tạo Google Auth Client
    const auth = new GoogleAuth({
      credentials,
      scopes: [scope],
    });

    return await auth.getClient();
  }

  // ✅ Gửi URL lên Google Indexing API
  async submitToGoogleIndex(url: string) {
    try {
      const client = await this.getAuthClient(
        'https://www.googleapis.com/auth/indexing',
      );

      const response = await client.request({
        url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
        method: 'POST',
        data: { url, type: 'URL_UPDATED' },
      });

      this.logger.log(`✅ Indexed: ${url}`);
      return response.data;
    } catch (error) {
      this.logger.error(`❌ Google Indexing Error: ${error.message}`);
      throw error;
    }
  }

  // ✅ Lấy Metadata từ Google Search Console
  async getMetaDataGoogleConsole(url: string, domain: string) {
    try {
      const client = await this.getAuthClient(
        'https://www.googleapis.com/auth/webmasters.readonly',
      );

      const response = await client.request({
        url: 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
        method: 'POST',
        data: { inspectionUrl: url, siteUrl: domain, languageCode: 'en-US' },
      });

      this.logger.log(`✅ Metadata retrieved for: ${url}`);
      return response.data;
    } catch (error) {
      this.logger.error(`❌ Metadata retrieval error: ${error.message}`);
      throw error;
    }
  }

  // ✅ Lấy danh sách tất cả các trang web trong Search Console
  async listWebsites() {
    try {
      const client = await this.getAuthClient(
        'https://www.googleapis.com/auth/webmasters.readonly',
      );

      const response = await client.request({
        url: 'https://www.googleapis.com/webmasters/v3/sites',
        method: 'GET',
      });

      this.logger.log(`✅ Retrieved website list`);
      return response.data;
    } catch (error) {
      this.logger.error(`❌ Error fetching website list: ${error.message}`);
      throw error;
    }
  }

  // ✅ Lấy danh sách các sitemap đã gửi
  async listSitemaps(siteUrl: string) {
    try {
      const client = await this.getAuthClient(
        'https://www.googleapis.com/auth/webmasters.readonly',
      );

      const response = await client.request({
        url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
        method: 'GET',
      });

      this.logger.log(`✅ Retrieved sitemaps for: ${siteUrl}`);
      return response.data;
    } catch (error) {
      this.logger.error(`❌ Error fetching sitemaps: ${error.message}`);
      throw error;
    }
  }

  // ✅ Gửi một Sitemap lên Google Search Console
  async submitSitemap(siteUrl: string, sitemapUrl: string) {
    try {
      const client = await this.getAuthClient(
        'https://www.googleapis.com/auth/webmasters',
      );

      const response = await client.request({
        url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
        method: 'PUT',
      });

      this.logger.log(`✅ Submitted sitemap: ${sitemapUrl} for ${siteUrl}`);
      return response.data;
    } catch (error) {
      this.logger.error(`❌ Sitemap submission error: ${error.message}`);
      throw error;
    }
  }

  // ✅ Xóa một Sitemap khỏi Google Search Console
  async deleteSitemap(siteUrl: string, sitemapUrl: string) {
    try {
      const client = await this.getAuthClient(
        'https://www.googleapis.com/auth/webmasters',
      );

      const response = await client.request({
        url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
        method: 'DELETE',
      });

      this.logger.log(`✅ Deleted sitemap: ${sitemapUrl} from ${siteUrl}`);
      return response.data;
    } catch (error) {
      this.logger.error(`❌ Sitemap deletion error: ${error.message}`);
      throw error;
    }
  }
}
