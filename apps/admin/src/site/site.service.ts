import { Site } from '@app/entities';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { sitePaginateConfig } from './site.pagination';
import { SiteCreateDto } from './site.dto';

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

  async create(createDto: SiteCreateDto) {
    const result = await this.siteRepository.create({ ...createDto }).save();
    return this.siteRepository.findOne({
      where: { id: result.id },
      relations: ['posts', 'categories'],
    });
  }

  async update(site: Site, updateDto: Site) {
    await this.siteRepository.update({ id: site.id }, { ...updateDto });
    return this.siteRepository.findOne({
      where: { id: site.id },
      relations: ['posts', 'categories'],
    });
  }

  async delete(site: Site) {
    await this.siteRepository.softDelete(site.id);
  }
}
