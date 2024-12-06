import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as RepositoryEntity } from 'common/entities/repository.entity';
import { Server } from 'common/entities/server.entity';
import { Service } from 'common/entities/service.entity';
import { ServerService as ServerServiceEntity } from 'common/entities/service_service.entity';
import { User } from 'common/entities/user.entity';
import { callApi } from 'common/utils/call-api';
import { ServiceStatusEnum } from 'common/utils/enum';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import {
  ServerCreateDto,
  CreateRepositoryDto,
  ServerUpdateDto,
  UpdateRepositoryDto,
} from './server.dto';
import { serverPaginateConfig } from './server.pagination';
@Injectable()
export class ServerService {
  constructor(
    @InjectRepository(Server) private serverRepository: Repository<Server>,

    @InjectRepository(RepositoryEntity)
    private repositoryRepository: Repository<RepositoryEntity>,

    @InjectRepository(Service) private serviceRepository: Repository<Service>,

    @InjectRepository(ServerService)
    private serverServiceRepository: Repository<ServerServiceEntity>,
  ) {}

  // API SERVER
  async getListServer(query: PaginateQuery, user: User) {
    const list = await paginate(
      { ...query, filter: { ...query.filter } },
      this.serverRepository,
      { ...serverPaginateConfig, where: { owner_id: user.id } },
    );
    return list;
  }

  async getServerById(server: Server, user: User) {
    const serverDB = await this.serverRepository.findOne({
      where: { id: server.id },
      select: {
        name: true,
        id: true,
        host: true,
        port: true,
        password: true,
        is_active: true,
        is_connected: true,
        server_services: true,
        owner_id: true,
        repositories: true,
      },
      relations: ['server_services', 'server_services.service'],
    });

    const connectionId = await callApi(
      process.env.SERVER_API + '/server/connect',
      'POST',
      {
        host: server.host,
        username: server.user,
        password: server.password,
        owner_id: serverDB.owner_id,
      },
    )
      .then((res) => {
        return res.connectionId;
      })
      .catch((err) => {
        throw new BadRequestException();
      });

    return {
      ...serverDB,
      is_connected: !!connectionId,
      connectionId: connectionId,
      server_services: serverDB.server_services.map((s) => {
        return {
          ...s,
          icon: s.service.icon,
          name: s.service.name,
          description: s.service.description,
        };
      }),
    };
  }

  async createServer(createDto: ServerCreateDto, user: User) {
    const services = await this.serviceRepository.find();
    const server = this.serverRepository.create({
      ...createDto,
      created_by: user.id,
      owner_id: user.id,
      server_services: services.map((service) => ({
        service_id: service.id,
        installed: ServiceStatusEnum.UN_INSTALLED,
      })),
    });
    return await this.serverRepository.save(server);
  }

  async updateServer(server: Server, updateDto: ServerUpdateDto, user: User) {
    await this.serverRepository.update(
      { id: server.id },
      { ...updateDto, updated_by: user.id },
    );

    return await this.serverRepository.findOne({ where: { id: server.id } });
  }

  async deleteServer(server: Server, user: User) {
    await this.serverRepository.update(
      { id: server.id },
      { deleted_by: user.id },
    );
    const result = await this.serverRepository.softDelete({ id: server.id });
    return result;
  }

  // API REPOSITORY
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
    console.log({
      ...createDto,
      server_id: server.id,
      created_by: user.id,
    });
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
    const result = await this.repositoryRepository.softDelete({
      id: repository.id,
    });
    return result;
  }

  // CALL TO API SERVER CONTROL
  async getServiceInfo(id: string, connectionId: string) {
    const service = await this.serverServiceRepository.findOne({
      where: { id: id },
      relations: ['service'],
    });
    return await callApi(
      process.env.SERVER_API + '/server/service/' + connectionId,
      'POST',
      {
        service: service.service.name.toLocaleLowerCase(),
      },
    );
  }

  async getDockerContainers(connectionId: string) {
    const container = await callApi(
      process.env.SERVER_API + '/docker/containers/' + connectionId,
      'GET',
    );

    return { data: container, meta: undefined };
  }

  async getDockerImages(connectionId: string) {
    const container = await callApi(
      process.env.SERVER_API + '/docker/images/' + connectionId,
      'GET',
    );

    return { data: container, meta: undefined };
  }

  async runDockerImage(
    connectionId: string,
    imageName: string,
    containerName?: string,
  ) {
    const url =
      process.env.SERVER_API + '/docker/image/' + connectionId + '/run';
    const body = { imageName, containerName };
    return await callApi(url, 'POST', body);
  }

  async deleteDockerImage(connectionId: string, imageName: string) {
    const url =
      process.env.SERVER_API +
      '/docker/image/' +
      connectionId +
      '/' +
      imageName;

    return await callApi(url, 'DELETE');
  }
  async buildDockerImage(connectionId: string, repositoryId: string) {
    const repository = await this.repositoryRepository.findOne({
      where: { id: repositoryId },
    });

    const url =
      process.env.SERVER_API + '/docker/image/' + connectionId + '/build';

    const body = {
      repository_name: repository.name,
      github_url: repository.github_url,
      fine_grained_token: repository.fine_grained_token,
      username: repository.username,
    };
    return await callApi(url, 'POST', body);
  }
}
