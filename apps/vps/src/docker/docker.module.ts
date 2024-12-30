import { Module } from '@nestjs/common';
import { ServerModule } from '../server/server.module';
import { DockerController } from './docker.controller';
import { DockerService } from './docker.service';

@Module({
  imports: [ServerModule],
  controllers: [DockerController],
  providers: [DockerService],
})
export class DockerModule {}
