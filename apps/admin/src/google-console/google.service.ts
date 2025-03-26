import { GoogleIndexRequest, Post, Site, SitePost } from '@app/entities';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GoogleAuth } from 'google-auth-library';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { FindOptionsWhere, In, IsNull, Repository } from 'typeorm';
import { googleIndexingPaginateConfig } from './google.pagination';

@Injectable()
export class GoogleService {
  constructor(
    @InjectRepository(Site) private siteRepository: Repository<Site>,
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(GoogleIndexRequest)
    private googleIndexRequestRepository: Repository<GoogleIndexRequest>,
    @InjectRepository(SitePost)
    private sitePostRepository: Repository<SitePost>,
  ) {}
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
  async listSitemaps(site_id: string) {
    if (!site_id) return undefined;
    const site = await this.siteRepository.findOne({ where: { id: site_id } });
    const siteUrl = new URL(site.domain).href;
    if (!siteUrl) return undefined;

    try {
      const client = await this.getAuthClient(
        'https://www.googleapis.com/auth/webmasters.readonly',
      );

      const response: any = await client.request({
        url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
        method: 'GET',
      });

      this.logger.log(`✅ Retrieved sitemaps for: ${siteUrl}`);
      if (response?.data?.sitemap)
        return {
          data: response?.data?.sitemap?.map((sm) => {
            return { ...sm, id: Date.parse(sm.lastSubmitted).toString() };
          }),
          meta: {
            totalItems: Number(response?.data?.sitemap?.length),
            totalPages: 1,
            itemsPerpage: Number(response?.data?.sitemap?.length),
            currentPage: 1,
          },
        };
      else {
        return undefined;
      }
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

  async getSiteIndexing(
    paginateQuery: PaginateQuery,
    query: { indexStatus?: string[]; site_id?: string },
  ) {
    const where: FindOptionsWhere<SitePost> = {
      deleted_at: IsNull(),
    };

    // Chỉ thêm `indexStatus` vào `where` nếu có giá trị hợp lệ
    if (query?.indexStatus) {
      const indexStatuses = Array.isArray(query.indexStatus)
        ? query.indexStatus
        : [query.indexStatus];
      where.indexStatus = In(indexStatuses);
    }

    // Chỉ thêm `site_id` nếu có giá trị hợp lệ
    if (query?.site_id) where.site_id = query.site_id;

    const data = await paginate(paginateQuery, this.sitePostRepository, {
      ...googleIndexingPaginateConfig,
      where: where,
    });

    return {
      ...data,
      data: data.data.map((d) => {
        return {
          site_id: d.site?.id ?? null,
          site_name: d.site?.name ?? null,
          site_domain: d.site?.domain ?? null,
          post_slug: d.post?.slug ?? null,
          post_title: d.post?.title ?? null,
          post_id: d.post?.id ?? null,
          indexStatus: d.indexStatus ?? null,
          created_at: d.created_at ?? null,
          updated_at: d.updated_at ?? null,
        };
      }),
    };
  }
  async getLogs(
    paginateQuery: PaginateQuery,
    query: { site_id?: string; type?: string[] },
  ) {
    const where: FindOptionsWhere<GoogleIndexRequest> = {
      type: In(['URL_UPDATED', 'URL_METADATA']),
    };

    if (query?.site_id) where.site_id = query.site_id;
    if (query?.type) {
      const indexStatuses = Array.isArray(query.type)
        ? query.type
        : [query.type];
      where.type = In(indexStatuses);
    }

    const data = await paginate(
      paginateQuery,
      this.googleIndexRequestRepository,
      {
        defaultSortBy: [['requested_at', 'DESC']],
        sortableColumns: ['requested_at', 'post_slug'],
        where: where,
        defaultLimit: 200,
        maxLimit: 500,
      },
    );

    return data;
  }
}
