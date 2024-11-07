import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Collection, Connection } from 'mongoose';
import { BaseLogger } from '../../core/logger';

@Injectable()
export class LandingService extends BaseLogger {
  private readonly landingCollection: Collection;

  constructor(@InjectConnection() private connection: Connection) {
    super(LandingService.name);
    this.landingCollection = this.connection.collection('cv');
  }

  async getCvLanding(username?: string) {
    return {
      username,
      title: 'All Cv Landing'
    };
  }
}
