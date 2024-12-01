import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Server } from 'common/entities/server.entity';
import { User } from 'common/entities/user.entity';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { ServerCreateDto, ServerUpdateDto } from './server.dto';
import { serverPaginateConfig } from './server.pagination';
@Injectable()
export class ServerService {
  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
  ) {}

  async getListServer(query: PaginateQuery, user: User) {
    const list = await paginate(
      { ...query, filter: { ...query.filter } },
      this.serverRepository,
      { ...serverPaginateConfig, where: { owner_id: user.id } },
    );
    return list;
  }

  async getServerById(server: Server, user: User) {
    return server;
  }

  async createServer(createDto: ServerCreateDto, user: User) {
    const server = await Server.create({
      ...createDto,
      created_by: user.id,
      owner_id: user.id,
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
}
