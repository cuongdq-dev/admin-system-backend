import { Module } from '@nestjs/common';
import { ServerModule } from '../server/server.module';
import { RepositoryController } from './repository.controller';
import { RepositoryService } from './repository.service';

@Module({
  imports: [ServerModule],
  controllers: [RepositoryController],
  providers: [RepositoryService],
})
export class RepositoryModule {}
