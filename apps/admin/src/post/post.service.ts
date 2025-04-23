import {
  Category,
  Media,
  Post,
  Site,
  SitePost,
  StorageType,
  Trending,
  TrendingArticle,
  User,
} from '@app/entities';
import { PostStatus } from '@app/entities/post.entity';
import { IndexStatus } from '@app/entities/site_posts.entity';
import { generateSlug, uploadImageCdn } from '@app/utils';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import * as path from 'path';
import { DataSource, In, LessThan, Repository } from 'typeorm';
import { CreatePostDto, PostBodyDto } from './post.dto';
import { postArchivedPaginateConfig } from './post.pagination';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,

    @InjectRepository(Site) private siteRepository: Repository<Site>,
    @InjectRepository(Media) private mediaRepository: Repository<Media>,

    @InjectRepository(SitePost)
    private sitePostRepository: Repository<SitePost>,

    @InjectRepository(Trending)
    private trendingRepository: Repository<Trending>,

    @InjectRepository(TrendingArticle)
    private trendingArticleRepository: Repository<TrendingArticle>,

    private readonly dataSource: DataSource,
  ) {}

  async getTrendings(query: PaginateQuery) {
    const qb = this.trendingRepository
      .createQueryBuilder('trending')
      .leftJoinAndSelect('trending.thumbnail', 'thumbnail')
      .leftJoinAndSelect('trending.articles', 'articles')
      .leftJoinAndSelect('articles.thumbnail', 'articles_thumbnail')
      .leftJoinAndSelect('articles.posts', 'articles_posts')
      .leftJoinAndSelect('articles_posts.sitePosts', 'site_posts')
      .leftJoinAndSelect('site_posts.site', 'site')
      .leftJoinAndSelect('articles_posts.thumbnail', 'articles_posts_thumbnail')
      .loadRelationCountAndMap('trending.postCount', 'articles.posts')
      .loadRelationCountAndMap('trending.articleCount', 'trending.articles')
      .loadRelationCountAndMap(
        'articles_posts.siteCount',
        'articles_posts.sitePosts',
      )
      .select([
        'trending.id',
        'trending.created_at',
        'trending.titleQuery',
        'trending.formattedTraffic',
        'trending.trendDate',
        'trending.relatedQueries',
        'thumbnail.id',
        'thumbnail.url',
        'thumbnail.slug',
        'articles.id',
        'articles.created_at',
        'articles.relatedQueries',
        'articles.slug',
        'articles.title',
        'articles.source',
        'articles.meta_description',

        'articles_thumbnail.id',
        'articles_thumbnail.url',
        'articles_thumbnail.slug',

        'articles_posts.id',
        'articles_posts.slug',
        'articles_posts.title',
        'articles_posts.meta_description',
        'articles_posts.created_at',

        'articles_posts_thumbnail.id',
        'articles_posts_thumbnail.url',
        'articles_posts_thumbnail.slug',

        'site_posts.id',
        'site_posts.post_id',
        'site_posts.site_id',

        'site.id',
        'site.domain',
        'site.name',
      ])
      .groupBy('trending.id')
      .addGroupBy('thumbnail.id')
      .addGroupBy('articles.id')
      .addGroupBy('articles_thumbnail.id')
      .addGroupBy('articles_posts.id')
      .addGroupBy('site_posts.id')
      .addGroupBy('site.id')
      .addGroupBy('articles_posts_thumbnail.id');

    const paginatedData = await paginate(
      { ...query, filter: { ...query.filter } },
      qb,
      {
        sortableColumns: ['created_at'],
        defaultSortBy: [['created_at', 'DESC']],
        maxLimit: 500,
        defaultLimit: 20,
      },
    );

    return paginatedData;
  }

  async getAll(query: PaginateQuery & Record<string, any>) {
    const postsQb = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.thumbnail', 'thumbnail')
      .leftJoinAndSelect('post.categories', 'categories')
      .leftJoinAndSelect('post.sitePosts', 'sitePosts')
      .leftJoinAndSelect('post.article', 'article')
      .innerJoinAndSelect('sitePosts.site', 'sp_site')
      .innerJoinAndSelect('sitePosts.post', 'sp_post')
      .loadRelationCountAndMap('sitePosts.siteCount', 'post.sitePosts')
      .select([
        'post.id',
        'post.title',
        'post.slug',
        'post.meta_description',
        'post.status',
        'post.created_at',
        'post.article_id',
        'article.id',
        'article.source',
        'article.slug',

        'thumbnail.id',
        'thumbnail.url',
        'thumbnail.slug',

        'categories.id',
        'categories.slug',
        'categories.name',

        'sitePosts.id',
        'sitePosts.created_at',

        'sp_site.id',
        'sp_site.name',
        'sp_site.domain',
        'sp_site.created_at',

        'sp_post.id',
        'sp_post.title',
        'sp_post.slug',
        'sp_post.created_at',
      ])
      .groupBy('post.id')
      .addGroupBy('thumbnail.id')
      .addGroupBy('article.id')
      .addGroupBy('sitePosts.id')
      .addGroupBy('categories.id')
      .addGroupBy('sp_site.id')
      .addGroupBy('sp_post.id');

    if (query?.site_id)
      postsQb.andWhere('sp_site.id = :site_id', { site_id: query.site_id });

    if (query?.status?.length) {
      postsQb.andWhere('post.status IN (:...status)', { status: query.status });
    } else {
      postsQb.andWhere('post.status IN (:...status)', {
        status: ['NEW', 'DRAFT', 'PUBLISHED'],
      });
    }
    if (query?.categories_id) {
      const categoriesIds = query.categories_id
        .split(',')
        .map((id) => id.trim());
      postsQb.andWhere('categories.id IN (:...categoriesIds)', {
        categoriesIds,
      });
    }

    return paginate({ ...query, filter: { ...query.filter } }, postsQb, {
      sortableColumns: ['created_at'],
      defaultSortBy: [['created_at', 'DESC']],
      maxLimit: 500,
      defaultLimit: 23,
    });
  }

  async getListUnused(query: PaginateQuery & Record<string, any>) {
    const postsQb = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.thumbnail', 'thumbnail')
      .leftJoinAndSelect('post.categories', 'categories')
      .leftJoinAndSelect('post.article', 'article')
      .leftJoinAndSelect('post.sitePosts', 'sitePosts')
      .select([
        'post.id',
        'post.title',

        'sitePosts.id',
        'sitePosts.post_id',
        'sitePosts.site_id',
        'sitePosts.created_at',

        'post.slug',
        'post.status',
        'post.meta_description',
        'post.created_at',
        'post.article_id',

        'article.id',
        'article.slug',
        'article.source',

        'thumbnail.id',
        'thumbnail.url',
        'thumbnail.slug',

        'categories.id',
        'categories.slug',
        'categories.name',
      ])
      .addSelect('article.source', 'post_source')
      .where('sitePosts.id IS NULL')
      .groupBy('post.id')
      .addGroupBy('thumbnail.id')
      .addGroupBy('article.id')
      .addGroupBy('sitePosts.id')
      .addGroupBy('categories.id');

    if (query?.site_id)
      postsQb.andWhere('sitePosts.id = :site_id', { site_id: query.site_id });

    if (query?.categories_id) {
      const categoriesIds = query.categories_id
        .split(',')
        .map((id) => id.trim());
      postsQb.andWhere('categories.id IN (:...categoriesIds)', {
        categoriesIds,
      });
    }

    return paginate({ ...query, filter: { ...query.filter } }, postsQb, {
      sortableColumns: ['created_at'],
      defaultSortBy: [['created_at', 'DESC']],
      maxLimit: 500,
      defaultLimit: 23,
    });
  }

  async getArchived(query: PaginateQuery) {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 2);

    const data = await paginate(
      { ...query, filter: { ...query.filter } },
      this.sitePostRepository,

      {
        ...postArchivedPaginateConfig,
        where: {
          created_at: LessThan(fiveDaysAgo),
          indexStatus: In([
            IndexStatus.NEW,
            IndexStatus.INDEXING,
            IndexStatus.DELETED,
            IndexStatus.NEUTRAL,
            IndexStatus.DELETED,
          ]),
        },
      },
    );
    return {
      ...data,
      data: data.data.map((d) => {
        return {
          id: d.id,
          site_id: d.site?.id ?? null,
          site_name: d.site?.name ?? null,
          site_domain: d.site?.domain ?? null,
          post_slug: d.post?.slug ?? null,
          post_title: d.post?.title ?? null,
          post_id: d.post?.id ?? null,
          post_meta_description: d.post?.meta_description ?? null,
          indexStatus: d.indexStatus ?? null,
          created_at: d.created_at ?? null,
          updated_at: d.updated_at ?? null,
          thumbnail: d?.post?.thumbnail ?? null,
          categories: d?.post?.categories ?? null,
        };
      }),
    };
  }

  // USE WITH POST ARCHIVED, POST ACTIVE
  async deletePostArchived(sitePost: SitePost) {
    const postId = sitePost.post_id;
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['article', 'article.trending', 'categories'],
      select: ['id', 'slug', 'title', 'thumbnail_id', 'article', 'categories'],
    });

    const {
      id: post_id,
      title: post_title,
      slug: post_slug,
      thumbnail_id: post_thumbnail_id,
      article,
      categories,
    } = post || {
      post_id: undefined,
      title: undefined,
      slug: undefined,
      thumbnail_id: undefined,
      article: undefined,
      categories: undefined,
    };

    const deletedData = {
      sitePost: {
        id: sitePost.id,
        site_id: sitePost.site_id,
        post_id: sitePost.post_id,
        created_at: sitePost.created_at,
      },
      post: {
        id: post_id,
        title: post_title,
        slug: post_slug,
        thumbnail_id: post_thumbnail_id,
      },
      article: article && {
        id: article.id,
        title: article.title,
        thumbnail_id: article.thumbnail_id,
      },
      trending: article?.trending && {
        id: article.trending.id,
        title: article.trending.titleQuery,
        thumbnail_id: article.trending.thumbnail_id,
      },
      mediaIds: {
        post: post_thumbnail_id,
        article: article?.thumbnail_id,
        trending: article?.trending?.thumbnail_id,
      },
      categories: categories?.map((c) => ({
        id: c.id,
        name: c.name,
      })),
    };

    const categoryIds = categories?.map((c) => c.id);

    await this.dataSource.transaction(async (manager) => {
      if (sitePost.id) {
        await manager.delete(SitePost, { id: sitePost.id });
      }

      if (Number(categoryIds?.length) > 0) {
        await manager
          .createQueryBuilder()
          .delete()
          .from('category_posts')
          .where('post_id = :postId', { postId: post_id })
          .execute();
      }

      post_id && (await manager.delete(Post, { id: post_id }));

      article?.id &&
        (await manager.delete(TrendingArticle, { id: article.id }));

      article?.trending_id &&
        (await manager.delete(Trending, { id: article.trending_id }));

      if (post_thumbnail_id) {
        try {
          await this.mediaRepository.softDelete({ id: post_thumbnail_id });
        } catch (error) {
          console.log(
            `POST Media with ID ${post_thumbnail_id} could not be deleted. Skipping...`,
          );
        }
      }

      if (article?.thumbnail_id) {
        try {
          await this.mediaRepository.softDelete({ id: article.thumbnail_id });
        } catch (error) {
          console.log(
            `ARTICLE Media with ID ${article.thumbnail_id} could not be deleted. Skipping...`,
          );
        }
      }

      if (article?.trending?.thumbnail_id) {
        try {
          await this.mediaRepository.softDelete({
            id: article.trending.thumbnail_id,
          });
        } catch (error) {
          console.log(
            `TRENDING Media with ID ${article.trending.thumbnail_id} could not be deleted. Skipping...`,
          );
        }
      }
    });

    return {
      message: 'Post and related data deleted successfully',
      deleted: deletedData,
    };
  }

  async deletePostUnused(postValues: Post) {
    if (postValues?.sitePosts?.length > 0) {
      throw new BadRequestException(
        'Some posts in this trending are currently in use by sites. Cannot delete!',
      );
    }
    const {
      id: post_id,
      title: post_title,
      slug: post_slug,
      thumbnail_id: post_thumbnail_id,
      article,
      categories,
    } = postValues || {
      post_id: undefined,
      title: undefined,
      slug: undefined,
      thumbnail_id: undefined,
      article: undefined,
      categories: undefined,
    };

    const deletedData = {
      post: {
        id: post_id,
        title: post_title,
        slug: post_slug,
        thumbnail_id: post_thumbnail_id,
      },
      article: article && {
        id: article.id,
        title: article.title,
        thumbnail_id: article.thumbnail_id,
      },
      trending: article?.trending && {
        id: article.trending.id,
        title: article.trending.titleQuery,
        thumbnail_id: article.trending.thumbnail_id,
      },
      mediaIds: {
        post: post_thumbnail_id,
        article: article?.thumbnail_id,
        trending: article?.trending?.thumbnail_id,
      },
      categories: categories?.map((c) => ({ id: c.id, name: c.name })),
    };

    const categoryIds = categories?.map((c) => c.id);

    await this.dataSource.transaction(async (manager) => {
      if (Number(categoryIds?.length) > 0) {
        await manager
          .createQueryBuilder()
          .delete()
          .from('category_posts')
          .where('post_id = :postId', { postId: post_id })
          .execute();
      }

      post_id && (await manager.delete(Post, { id: post_id }));

      article?.id &&
        (await manager.delete(TrendingArticle, { id: article.id }));

      article?.trending_id &&
        (await manager.delete(Trending, { id: article.trending_id }));

      if (post_thumbnail_id) {
        try {
          await this.mediaRepository.softDelete({ id: post_thumbnail_id });
        } catch (error) {
          console.log(
            `POST Media with ID ${post_thumbnail_id} could not be deleted. Skipping...`,
          );
        }
      }

      if (article?.thumbnail_id) {
        try {
          await this.mediaRepository.softDelete({ id: article.thumbnail_id });
        } catch (error) {
          console.log(
            `ARTICLE Media with ID ${article.thumbnail_id} could not be deleted. Skipping...`,
          );
        }
      }

      if (article?.trending?.thumbnail_id) {
        try {
          await this.mediaRepository.softDelete({
            id: article.trending.thumbnail_id,
          });
        } catch (error) {
          console.log(
            `TRENDING Media with ID ${article.trending.thumbnail_id} could not be deleted. Skipping...`,
          );
        }
      }
    });

    return {
      message: 'Post and related data deleted successfully',
      deleted: deletedData,
    };
  }
  async deleteTrending(trendingId: string) {
    const trending = await this.trendingRepository
      .createQueryBuilder('trending')
      .leftJoinAndSelect('trending.thumbnail', 'thumbnail')
      .leftJoinAndSelect('trending.articles', 'articles')
      .leftJoinAndSelect('articles.thumbnail', 'articles_thumbnail')
      .leftJoinAndSelect('articles.posts', 'articles_posts')
      .leftJoinAndSelect('articles_posts.sitePosts', 'site_posts')
      .leftJoinAndSelect('site_posts.site', 'site')
      .leftJoinAndSelect('articles_posts.thumbnail', 'articles_posts_thumbnail')
      .loadRelationCountAndMap('trending.postCount', 'articles.posts')
      .loadRelationCountAndMap('trending.articleCount', 'trending.articles')
      .loadRelationCountAndMap(
        'articles_posts.siteCount',
        'articles_posts.sitePosts',
      )
      .select([
        'trending.id',
        'trending.created_at',
        'trending.titleQuery',
        'trending.formattedTraffic',
        'trending.trendDate',
        'trending.relatedQueries',
        'trending.thumbnail_id',
        'articles.id',
        'articles.created_at',
        'articles.relatedQueries',
        'articles.slug',
        'articles.title',
        'articles.thumbnail_id',
        'articles.source',
        'articles.meta_description',

        'articles_thumbnail.id',
        'articles_thumbnail.url',
        'articles_thumbnail.slug',

        'articles_posts.id',
        'articles_posts.slug',
        'articles_posts.title',
        'articles_posts.meta_description',
        'articles_posts.created_at',
        'articles_posts.thumbnail_id',

        'site_posts.id',
        'site_posts.post_id',
        'site_posts.site_id',

        'site.id',
        'site.domain',
        'site.name',
      ])
      .where('trending.id = :id', { id: trendingId })
      .groupBy('trending.id')
      .addGroupBy('thumbnail.id')
      .addGroupBy('articles.id')
      .addGroupBy('articles_thumbnail.id')
      .addGroupBy('articles_posts.id')
      .addGroupBy('site_posts.id')
      .addGroupBy('site.id')
      .addGroupBy('articles_posts_thumbnail.id')
      .getOne();

    if (!trending) {
      throw new BadRequestException('Trending Not Exist!');
    }

    const totalSiteCount = trending?.articles?.reduce(
      (total: number, article: any) => {
        const siteCountInArticle = article?.posts?.reduce(
          (count: number, post: any) => {
            return count + (Number(post?.siteCount) || 0);
          },
          0,
        );

        return total + siteCountInArticle;
      },
      0,
    );

    if (totalSiteCount > 0) {
      throw new BadRequestException(
        'Some posts in this trending are currently in use by sites. Cannot delete!',
      );
    }

    const deletedData = {
      articles: trending.articles && {
        id: trending.articles.map((a) => a.id),
        thumbnail_id: trending.articles.map((a) => a.thumbnail_id),
      },
      trending: trending && {
        id: trending.id,
        title: trending.titleQuery,
        thumbnail_id: trending.thumbnail_id,
      },
    };

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Trending, { id: deletedData?.trending?.id });

      for (const article of trending.articles) {
        if (article.thumbnail_id)
          await this.mediaRepository.softDelete({ id: article.thumbnail_id });
      }
      if (trending.thumbnail_id)
        await this.mediaRepository.softDelete({ id: trending.thumbnail_id });
    });

    return {
      message: 'Trending has been successfully deleted!',
      deleted: true,
    };
  }

  async getPostBySlug(post: Post, user: User) {
    const result = await this.postRepository.update(
      { id: post.id, status: PostStatus.NEW },
      { status: PostStatus.DRAFT },
    );
    const categories = await this.categoryRepository.find({
      where: {
        posts: { id: post.id }, // Liên kết qua bài viết
        created_by: user.id, // Điều kiện lọc theo user
      },
      relations: ['posts'], // Nếu cần quan hệ với bài viết
    });

    const sites =
      post?.sitePosts &&
      (await this.siteRepository.find({
        where: {
          id: In(post?.sitePosts?.map((st) => st.site_id)), // Liên kết qua bài viết
          created_by: user.id, // Điều kiện lọc theo user
        },
      }));

    return {
      ...post,
      status: !!result.affected ? PostStatus.DRAFT : post.status,
      categories,
      sites,
    };
  }

  async create(body: CreatePostDto, thumbnail?: Express.Multer.File) {
    const [categories] = await Promise.all([
      this.categoryRepository.find({
        where: { id: In(body?.categories?.map((cate) => cate?.id)) },
      }),
    ]);

    const data = {
      title: body.title,
      slug: generateSlug(body.title),
      created_by: body?.created_by,
      meta_description: body?.meta_description,

      content: body?.content || '',
      categories: categories,
      user_id: body?.created_by,
      relatedQueries: body?.relatedQueries?.map((query) => {
        return { query: query.title, slug: generateSlug(query.title) };
      }),
    } as Post;

    const result = await this.postRepository.create(data).save();

    if (result.id && body?.sites?.length > 0) {
      const sitePosts = body?.sites?.map((site) => {
        return { site_id: site.id, post_id: result.id };
      });
      await this.sitePostRepository.insert(sitePosts);
    }

    if (result.id && thumbnail) {
      const base64Image = thumbnail.buffer.toString('base64');
      const mediaEntity = {
        data: `data:image/png;base64, ${base64Image}`,
        filename: thumbnail.originalname,
        slug: generateSlug(path.parse(thumbnail.originalname).name),
        mimetype: thumbnail.mimetype,
        size: thumbnail.size,
        storage_type: StorageType.BASE64,
        url: '',
      };

      const cdnResult = await uploadImageCdn(mediaEntity);

      if (!!cdnResult.url) {
        mediaEntity.url = process.env.CDN_DOMAIN + cdnResult?.url;
        mediaEntity.storage_type = StorageType.LOCAL;
        mediaEntity.data = null;
      }
      const thumbnailResult = await this.mediaRepository.upsert(
        { ...mediaEntity, deleted_at: null, deleted_by: null },
        {
          conflictPaths: ['slug'],
        },
      );

      await this.postRepository.update(
        { id: result.id },
        { thumbnail_id: thumbnailResult.generatedMaps[0]?.id },
      );
    }

    return body;
  }

  async update(
    id: string,
    body: CreatePostDto,
    user: User,
    thumbnail?: Express.Multer.File,
  ) {
    const { categories, status, sites, relatedQueries, ...values } = body;
    const dataToUpdate = {
      ...values,
      updated_by: body.updated_by,
    };

    if (status) dataToUpdate['status'] = body.status;
    if (categories) {
      const categories = await this.categoryRepository.find({
        where: { id: In(body?.categories?.map((cate) => cate.id)) },
      });
      dataToUpdate['categories'] = categories;
    }
    if (sites) {
      const sites = await this.siteRepository.find({
        where: {
          id: In(body?.sites?.map((site) => site.id)),
          created_by: user.id,
        },
        select: ['id'],
      });

      dataToUpdate['sitePosts'] = sites.map((site) => {
        return {
          site_id: site.id,
          post_id: id,
          indexStatus: IndexStatus.NEW,
          created_by: user.id,
        };
      });
    }
    if (relatedQueries) {
      dataToUpdate['relatedQueries'] = body?.relatedQueries.map((query) => {
        return { slug: generateSlug(query.title), query: query.title };
      });
    }
    if (thumbnail) {
      const base64Image = thumbnail.buffer.toString('base64');
      const mediaEntity = {
        data: `data:image/png;base64, ${base64Image}`,
        filename: thumbnail.originalname,
        slug: generateSlug(path.parse(thumbnail.originalname).name),
        mimetype: thumbnail.mimetype,
        size: thumbnail.size,
        storage_type: StorageType.BASE64,
        url: '',
      };

      const cdnResult = await uploadImageCdn(mediaEntity);

      if (!!cdnResult.url) {
        mediaEntity.url = process.env.CDN_DOMAIN + cdnResult?.url;
        mediaEntity.storage_type = StorageType.LOCAL;
        mediaEntity.data = null;
      }
      const thumbnailResult = await this.mediaRepository.upsert(
        { ...mediaEntity, deleted_at: null, deleted_by: null },
        {
          conflictPaths: ['slug'],
        },
      );

      dataToUpdate['thumbnail_id'] = thumbnailResult.generatedMaps[0].id;
    }

    console.log(dataToUpdate);

    await this.dataSource.transaction(async (manager) => {
      if (dataToUpdate['sitePosts']) {
        await manager.delete(SitePost, { post_id: id });
        await manager.insert(SitePost, dataToUpdate['sitePosts']);
      }
      await manager.save(Post, {
        ...dataToUpdate,
        id: id,
        sitePosts: undefined,
      });
    });

    const result = await this.postRepository.findOne({
      where: { id: id },
      relations: [
        'user',
        'thumbnail',
        'article.trending',
        'categories',
        'sitePosts',
        'sitePosts.site',
        'article.thumbnail',
        'article.trending.thumbnail',
        'article.trending.articles',
      ],
    });

    return {
      ...result,

      categories: await this.categoryRepository.find({
        where: {
          posts: { id: id }, // Liên kết qua bài viết
          created_by: user.id, // Điều kiện lọc theo user
        },
        relations: ['posts'], // Nếu cần quan hệ với bài viết
      }),
      sitePosts: null,
      sites: await this.siteRepository.find({
        where: {
          id: In(result?.sitePosts?.map((st) => st.site_id)), // Liên kết qua bài viết
        },
      }),
    };
  }

  async delete(post: Post) {
    if (post.status == PostStatus.DELETED) {
      throw new BadRequestException('Post already deleted!');
    }

    const checkUsed = await this.sitePostRepository.findOne({
      where: { post_id: post.id },
      relations: ['site'],
    });
    if (checkUsed) {
      throw new BadRequestException(
        'Some posts in this trending are currently in use by sites. Cannot delete!',
      );
    }

    await this.deletePostUnused(post);
  }
}
