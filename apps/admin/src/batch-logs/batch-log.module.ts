import { BatchLogs } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchLogsController } from './batch-log.controler';
import { BatchLogsService } from './batch-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([BatchLogs])],
  providers: [BatchLogsService],
  controllers: [BatchLogsController],
})
export class BatchLogsModule {}
