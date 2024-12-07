import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as RepositoryEntity } from 'common/entities/repository.entity';
import { Server } from 'common/entities/server.entity';
import { User } from 'common/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateRepositoryDto, UpdateRepositoryDto } from './repository.dto';
@Injectable()
export class RepositoryService {
  constructor(
    @InjectRepository(RepositoryEntity)
    private repositoryRepository: Repository<RepositoryEntity>,
  ) {}

  async getListRepository(server: Server, user: User) {
    const list = await this.repositoryRepository.find({
      where: { server_id: server.id, deleted_by: null, deleted_at: null },
    });
    return { data: list, meta: undefined };
  }

  async createReposiroty(
    server: Server,
    createDto: CreateRepositoryDto,
    user: User,
  ) {
    const repository = this.repositoryRepository.create({
      ...createDto,
      server_id: server.id,
      created_by: user.id,
    });
    return await this.repositoryRepository.save(repository);
  }

  async updateReposiroty(
    repository: RepositoryEntity,
    updateDto: UpdateRepositoryDto,
    user: User,
  ) {
    await this.repositoryRepository.update(
      { id: repository.id },
      { ...updateDto, updated_by: user.id },
    );
    return await this.repositoryRepository.findOne({
      where: { id: repository.id },
    });
  }

  async deleteReposiroty(repository: RepositoryEntity, user: User) {
    await this.repositoryRepository.update(
      { id: repository.id },
      { deleted_by: user.id },
    );
    return await this.repositoryRepository.softDelete({
      id: repository.id,
    });
  }
}
