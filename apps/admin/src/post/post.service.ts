import { Post, SitePost, Trending, User } from '@app/entities';
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

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(SitePost)
    private sitePostRepository: Repository<SitePost>,

    @InjectRepository(Trending)
    private trendingRepository: Repository<Trending>,
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

    return paginate(
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
