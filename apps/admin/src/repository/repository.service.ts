import { Repository as RepositoryEntity, Server, User } from '@app/entities';
import { callApi } from '@app/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
    connectionId: string,
    server: Server,
    createDto: CreateRepositoryDto,
    user: User,
  ) {
    const { with_docker_compose, with_env, ...values } = createDto;

    const repository = this.repositoryRepository.create({
      ...values,
      server_id: server.id,
      created_by: user.id,
    });

    const url = `${process.env.SERVER_API}/docker/image/build/${connectionId}`;
    const serverAction = await callApi(url, 'POST', {
      ...repository,
      repo_env: with_env ? repository.repo_env : undefined,
      services: with_docker_compose ? repository.services : undefined,
    });

    return await this.repositoryRepository.save(repository);
  }

  async updateReposiroty(
    connectionId: string,
    repository: RepositoryEntity,
    updateDto: UpdateRepositoryDto,
    user: User,
  ) {
    const { with_docker_compose, with_env, ...values } = updateDto;

    await this.repositoryRepository.update(
      { id: repository.id },
      { ...values, updated_by: user.id },
    );

    const repositoryResult = await this.repositoryRepository.findOne({
      where: { id: repository.id },
    });

    const url = `${process.env.SERVER_API}/docker/image/build/${connectionId}`;
    const serverAction = await callApi(url, 'POST', {
      ...repository,
      repo_env: with_env ? repository.repo_env : undefined,
      services: with_docker_compose ? repository.services : undefined,
    });

    await this.repositoryRepository.update(
      { id: serverAction.id },
      { server_path: serverAction.server_path },
    );

    return { ...repositoryResult, ...serverAction };
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
