import {
  Server,
  ServerService as ServerServiceEntity,
  Service,
  User,
} from '@app/entities';
import { callApi, ServiceStatusEnum } from '@app/utils';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { ServerCreateDto, ServerUpdateDto } from './server.dto';
import { serverPaginateConfig } from './server.pagination';
@Injectable()
export class ServerService {
  constructor(
    @InjectRepository(Server) private serverRepository: Repository<Server>,

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

  async connectServer(server: Server, user: User) {
    const connectionId = await callApi(
      process.env.SERVER_API + '/server/connect',
      'POST',
      {
        host: server.host,
        username: server.user,
        password: server.password,
        owner_id: server.owner_id,
      },
    )
      .then((res) => {
        return res.connectionId;
      })
      .catch((err) => {
        throw new BadRequestException();
      });

    return { is_connected: !!connectionId, connectionId: connectionId };
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

  // CALL TO API SERVER CONTROL

  async getServerStatus(connectionId: string) {
    const url = process.env.SERVER_API + '/server/status/' + connectionId;
    return await callApi(url, 'GET');
  }

  async getServiceInfo(id: string, connectionId: string) {
    const service = await this.serverServiceRepository.findOne({
      where: { id: id },
      relations: ['service'],
    });
    return await callApi(
      process.env.SERVER_API + '/server/service/' + connectionId,
      'POST',
      { service: service.service.name.toLocaleLowerCase() },
    );
  }

  async getNginxInfo(id: string, connectionId: string) {
    return await callApi(
      process.env.SERVER_API + '/server/nginx/' + connectionId,
      'POST',
    );
  }

  async setupService(id: string, connectionId: string) {
    const service = await this.serverServiceRepository.findOne({
      where: { id: id },
      relations: ['service'],
    });
    return await callApi(
      process.env.SERVER_API + '/server/setup/service/' + connectionId,
      'POST',
      { script: service?.service?.script },
    );
  }
  async updateDockerCompose(
    connectionId: string,
    values?: Record<string, any>,
  ) {
    return await callApi(
      process.env.SERVER_API + '/server/update-docker-compose/' + connectionId,
      'POST',
      { values: values },
    );
  }

  async updateNginx(
    connectionId: string,
    fileContent?: string,
    fileName?: string,
  ) {
    return await callApi(
      process.env.SERVER_API + '/server/update-nginx/' + connectionId,
      'POST',
      { fileContent, fileName },
    );
  }

  async deleteNginx(connectionId: string, fileName?: string) {
    return await callApi(
      process.env.SERVER_API + '/server/delete-nginx/' + connectionId,
      'DELETE',
      { fileName },
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
    const url = process.env.SERVER_API + '/docker/images/' + connectionId;
    const container = await callApi(url, 'GET');
    return { data: container, meta: undefined };
  }
}
