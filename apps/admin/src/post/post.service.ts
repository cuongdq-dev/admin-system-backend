import { Post, Trending, User } from '@app/entities';
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

  async getAll(query: PaginateQuery) {
    return paginate(
      { ...query, filter: { ...query.filter } },
      this.postRepository,
      postPaginateConfig,
    );
  }

  async getTrendings() {
    const data = await paginate(
      { path: '' },
      this.trendingRepository,
      trendingPaginateConfig,
    );
    return data.data;
  }

  create(createDto: Post, user: User) {
    return this.postRepository
      .create({ ...createDto, user_id: user.id })
      .save();
  }

  async update(post: Post, user: User, updateDto: Post) {
    if (post.user_id !== user.id) {
      throw new ForbiddenException('You are now allowed to edit this post.');
    }
    await this.postRepository.update({ id: post.id }, updateDto);

    return { ...post, ...updateDto };
  }

  async delete(post: Post, user: User) {
    if (post.user_id !== user.id) {
      throw new ForbiddenException('You are now allowed to edit this post.');
    }
    await this.postRepository.delete(post.id);
  }
}
