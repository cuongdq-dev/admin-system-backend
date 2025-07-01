import { Module } from '@nestjs/common';
import { BatchLogsService } from './batch-log.service';
import { BatchLogs } from '@app/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([BatchLogs])],
  providers: [BatchLogsService],
  exports: [BatchLogsService],
})
export class BatchLogsModule {}
