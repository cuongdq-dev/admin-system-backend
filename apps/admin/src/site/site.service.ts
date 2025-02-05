import { Site } from '@app/entities';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { sitePaginateConfig } from './site.pagination';
import { SiteBodyDto } from './site.dto';

@Injectable()
export class SiteService {
  constructor(
    @InjectRepository(Site) private siteRepository: Repository<Site>,
  ) {}

  async getAll(query: PaginateQuery) {
    return paginate(
      { ...query, filter: { ...query.filter } },
      this.siteRepository,
      sitePaginateConfig,
    );
  }

  async create(createDto: SiteBodyDto) {
    const result = await this.siteRepository.create({ ...createDto }).save();
    return this.siteRepository.findOne({
      where: { id: result.id },
      relations: ['posts', 'categories'],
    });
  }

  async update(site: Site, updateDto: SiteBodyDto) {
    await this.siteRepository.save({ ...site, ...updateDto });
    return this.siteRepository.findOne({
      where: { id: site.id },
      relations: ['posts', 'categories'],
    });
  }

  async delete(site: Site) {
    await this.siteRepository.softDelete(site.id);
  }
}
