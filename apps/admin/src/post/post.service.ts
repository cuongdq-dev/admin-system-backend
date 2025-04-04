import {
  Category,
  Media,
  Post,
  Site,
  SitePost,
  Trending,
  TrendingArticle,
  User,
} from '@app/entities';
import { PostStatus } from '@app/entities/post.entity';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { In, LessThan, Repository } from 'typeorm';
import { PostBodyDto } from './post.dto';
import {
  postArchivedPaginateConfig,
  postPaginateConfig,
  trendingPaginateConfig,
} from './post.pagination';
import { IndexStatus } from '@app/entities/site_posts.entity';
import { DataSource } from 'typeorm';

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
    const data = await paginate(
      { ...query, filter: { ...query.filter } },
      this.trendingRepository,
      trendingPaginateConfig,
    );
    return data.data;
  }

  async getAll(query: PaginateQuery) {
    return paginate(
      { ...query, filter: { ...query.filter } },
      this.postRepository,
      postPaginateConfig,
    );
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
          indexStatus: d.indexStatus ?? null,
          created_at: d.created_at ?? null,
          updated_at: d.updated_at ?? null,
        };
      }),
    };
  }

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
          await manager.delete(Media, { id: post_thumbnail_id });
        } catch (error) {
          console.log(
            `POST Media with ID ${post_thumbnail_id} could not be deleted. Skipping...`,
          );
        }
      }

      if (article?.thumbnail_id) {
        try {
          await manager.delete(Media, { id: article.thumbnail_id });
        } catch (error) {
          console.log(
            `ARTICLE Media with ID ${article.thumbnail_id} could not be deleted. Skipping...`,
          );
        }
      }

      if (article?.trending?.thumbnail_id) {
        try {
          await manager.delete(Media, { id: article.trending.thumbnail_id });
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
  async getPostBySlug(post: Post) {
    const result = await this.postRepository.update(
      { id: post.id, status: PostStatus.NEW },
      { status: PostStatus.DRAFT },
    );

    return {
      ...post,
      status: !!result.affected ? PostStatus.DRAFT : post.status,
      sites: post.sitePosts.map((st) => {
        return st.site;
      }),
    };
  }

  create(createDto: Post, user: User) {
    return this.postRepository
      .create({ ...createDto, user_id: user.id })
      .save();
  }

  async update(post: Post, updateDto: Post & PostBodyDto) {
    await this.postRepository.save({ ...post, ...updateDto });

    if (updateDto.sites) {
      const siteIds = updateDto.sites.map((site) => site.id);

      const existingSitePosts = await this.sitePostRepository.find({
        where: { post_id: post.id },
      });

      const existingSiteIds = existingSitePosts.map((sp) => sp.site_id);

      const sitesToRemove = existingSiteIds.filter(
        (id) => !siteIds.includes(id),
      );
      if (sitesToRemove.length > 0) {
        await this.sitePostRepository.delete({
          post_id: post.id,
          site_id: In(sitesToRemove),
        });
      }

      const sitesToAdd = siteIds.filter((id) => !existingSiteIds.includes(id));
      if (sitesToAdd.length > 0) {
        const newSitePosts = sitesToAdd.map((siteId) => ({
          post_id: post.id,
          site_id: siteId,
        }));
        await this.sitePostRepository.insert(newSitePosts);
      }
    }

    if (updateDto.status == PostStatus.DELETED) {
      await this.postRepository.softDelete({ id: post.id });
    }

    return { ...post, ...updateDto };
  }

  async delete(post: Post, user: User) {
    if (post.user_id !== user.id) {
      throw new ForbiddenException('You are now allowed to edit this post.');
    }
    await this.postRepository.delete(post.id);
  }
}
