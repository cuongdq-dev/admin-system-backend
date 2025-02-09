import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as url from 'url';
import { Site } from '@app/entities';

@Injectable()
export class NewsTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Site) private readonly siteRepo: Repository<Site>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = request.headers['authorization']?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const site = await this.siteRepo.findOne({ where: { token } });
    // if (!site) {
    //   throw new UnauthorizedException('Invalid token');
    // }

    // const requestDomain = request.headers.origin || request.headers.referer;
    // console.log(request.headers);
    // if (!requestDomain) {
    //   throw new ForbiddenException('Missing Origin or Referer');
    // }

    // const parsedUrl = url.parse(requestDomain);
    // const domainName = parsedUrl.host;
    // const siteDomain = url.parse(site.domain).host;

    // if (domainName !== siteDomain) {
    //   throw new ForbiddenException(`Access denied from domain: ${domainName}`);
    // }

    request.site = site;
    return true;
  }
}
