import { Post, Trending, User } from '@app/entities';
import { PostStatus } from '@app/entities/post.entity';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { postPaginateConfig, trendingPaginateConfig } from './post.pagination';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,

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

  async getPostBySlug(post: Post) {
    const result = await this.postRepository.update(
      { id: post.id, status: PostStatus.NEW },
      { status: PostStatus.DRAFT },
    );

    return {
      ...post,
      status: !!result.affected ? PostStatus.DRAFT : post.status,
    };
  }

  create(createDto: Post, user: User) {
    return this.postRepository
      .create({ ...createDto, user_id: user.id })
      .save();
  }

  async update(post: Post, updateDto: Post) {
    await this.postRepository.update({ id: post.id }, { ...updateDto });
    if (updateDto.status == PostStatus.DELETED)
      await this.postRepository.softDelete({ id: post.id });

    return { ...post, ...updateDto };
  }

  async delete(post: Post, user: User) {
    if (post.user_id !== user.id) {
      throw new ForbiddenException('You are now allowed to edit this post.');
    }
    await this.postRepository.delete(post.id);
  }
}
