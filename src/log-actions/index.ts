import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Collection, Connection } from 'mongoose';
import { BaseLogger } from '../core/logger';

@Injectable()
export class LogActionService extends BaseLogger {
  private readonly logActionCollection: Collection;
  constructor(@InjectConnection() private connection: Connection) {
    super(LogActionService.name);
    this.logActionCollection = this.connection.collection('log_actions');
  }

  async insertLogActions(params: unknown, body: unknown, userId: string, method: string) {
    await this.logActionCollection.insertOne({
      params: JSON.stringify(params),
      body: JSON.stringify(body),
      userId,
      method,
      createdAt: new Date()
    });
  }
}
