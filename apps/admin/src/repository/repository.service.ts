import { Repository as RepositoryEntity, Server, User } from '@app/entities';
import { callApi } from '@app/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NodeSSH } from 'node-ssh';
import { Repository } from 'typeorm';
import { CreateRepositoryDto, UpdateRepositoryDto } from './repository.dto';
@Injectable()
export class RepositoryService {
  private clients: Record<string, NodeSSH> = {};

  constructor(
    @InjectRepository(RepositoryEntity)
    private repositoryRepository: Repository<RepositoryEntity>,
  ) {}

  async getListRepository(server: Server, user: User) {
    const list = await this.repositoryRepository.find({
      where: { server_id: server.id, deleted_by: null, deleted_at: null },
    });
    return {
      data: list?.map((item) => {
        return this.convertResponse(item);
      }),
      meta: undefined,
    };
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

    const url = `${process.env.SERVER_API}/repository/clone/${connectionId}`;

    const serverAction = await callApi(url, 'POST', {
      ...repository,
      repo_env: with_env ? repository.repo_env : undefined,
      services: with_docker_compose ? repository.services : undefined,
    });

    await this.repositoryRepository.update(
      { id: serverAction.id },
      { server_path: serverAction.server_path },
    );

    return this.convertResponse({ ...repository, ...serverAction });
  }

  async updateReposiroty(
    repository: RepositoryEntity,
    values: UpdateRepositoryDto,
    user: User,
  ) {
    await this.repositoryRepository.update(
      { id: repository.id },
      { ...values, updated_by: user.id },
    );

    const result = await this.repositoryRepository.findOne({
      where: { id: repository.id },
    });
    return this.convertResponse(result);
  }

  async cloneRepository(
    connectionId: string,
    repository: RepositoryEntity,
    values: UpdateRepositoryDto,
    user: User,
  ) {
    const url = `${process.env.SERVER_API}/repository/clone/${connectionId}`;
    const result = await callApi(url, 'POST', values);

    await this.repositoryRepository.update(
      { id: repository.id },
      { updated_by: user.id, server_path: result?.server_path },
    );
    const newData = await this.repositoryRepository.findOne({
      where: { id: repository.id },
    });
    return this.convertResponse(newData);
  }

  async buildReposiroty(
    connectionId: string,
    repository: RepositoryEntity,
    user: User,
  ) {
    const url = `${process.env.SERVER_API}/repository/build/${connectionId}`;
    const result = await callApi(url, 'POST', {
      name: repository.name,
      server_path: repository.server_path,
      repo_env: repository.repo_env,
      services: repository.services,
    });

    await this.repositoryRepository.update(
      { id: repository.id },
      {
        services: result.service,
        repo_env: repository.repo_env,
        updated_by: user.id,
      },
    );

    const newRepository = await this.repositoryRepository.findOne({
      where: { id: repository.id },
    });

    return this.convertResponse(newRepository);
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

  //hepler
  convertResponse(data: RepositoryEntity) {
    return {
      ...data,
      images: data.services.reduce(
        (acc, item) => (item.image ? [...acc, item.image] : acc),
        [],
      ),
    };
  }
}
