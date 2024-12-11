import { Repository as RepositoryEntity, Server, User } from '@app/entities';
import { callApi } from '@app/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateRepositoryDto,
  ItemRepositoryDto,
  UpdateRepositoryDto,
} from './repository.dto';
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

    await this.repositoryRepository.save(repository);

    const url = `${process.env.SERVER_API}/docker/image/build/${connectionId}`;

    const serverAction = await callApi(url, 'POST', {
      ...repository,
      repo_env: with_env ? repository.repo_env : undefined,
      services: with_docker_compose ? repository.services : undefined,
    });

    await this.repositoryRepository.save({
      ...repository,
      server_path: serverAction.server_path,
    });

    return { ...repository, ...serverAction };
  }

  async updateReposiroty(
    repository: RepositoryEntity,
    updateDto: UpdateRepositoryDto,
    user: User,
  ) {
    const { with_docker_compose, with_env, ...values } = updateDto;

    await this.repositoryRepository.update(
      { id: repository.id },
      { ...values, updated_by: user.id },
    );

    return await this.repositoryRepository.findOne({
      where: { id: repository.id },
    });
  }

  async buildReposiroty(
    connectionId: string,
    repository: RepositoryEntity,
    updateDto: UpdateRepositoryDto,
    user: User,
  ) {
    const { with_docker_compose, with_env, ...values } = updateDto;

    console.log(updateDto);

    const url = `${process.env.SERVER_API}/docker/image/build/${connectionId}`;
    const serverAction = await callApi(url, 'POST', {
      ...values,
      repo_env: with_env ? repository.repo_env : undefined,
      services: with_docker_compose ? repository.services : undefined,
    });

    await this.repositoryRepository.update(
      { id: serverAction.id },
      { server_path: serverAction.server_path, updated_by: user.id },
    );

    return { ...repository, ...serverAction };
  }

  async deleteReposiroty(
    connectionId: string,
    repository: RepositoryEntity,
    user: User,
  ) {
    if (repository.server_path) {
      const url = `${process.env.SERVER_API}/docker/repository/delete/${connectionId}`;
      await callApi(url, 'POST', {
        path: repository.server_path,
      });
    }
    await this.repositoryRepository.update(
      { id: repository.id },
      { deleted_by: user.id },
    );

    return await this.repositoryRepository.softDelete({
      id: repository.id,
    });
  }
}
