import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DockerService } from './docker.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('docker')
@Controller({ path: 'docker', version: '1' })
export class DockerController {
  constructor(private serverService: DockerService) {}

  // LIST IN DOCKER
  @Get('/containers/:connectionId/list')
  getListContainers(@Param() params: { connectionId: string }) {
    return this.serverService.getListContainers(params.connectionId);
  }

  @Get('/images/:connectionId/list')
  getListImages(@Param() params: { connectionId: string }) {
    return this.serverService.getListImages(params.connectionId);
  }

  // CONTAINER ACTION
  @Post('/container/:connectionId/:containerId/start')
  startContainer(
    @Param('connectionId') connectionId: string,
    @Param('containerId') containerId: string,
  ) {
    return this.serverService.startContainer(connectionId, containerId);
  }

  @Post('/container/:connectionId/:containerId/pause')
  pauseContainer(
    @Param('connectionId') connectionId: string,
    @Param('containerId') containerId: string,
  ) {
    return this.serverService.pauseContainer(connectionId, containerId);
  }

  @Post('/container/:connectionId/:containerId/stop')
  stopContainer(
    @Param('connectionId') connectionId: string,
    @Param('containerId') containerId: string,
  ) {
    return this.serverService.stopContainer(connectionId, containerId);
  }

  @Post('/container/:connectionId/:containerId/restart')
  restartContainer(
    @Param('connectionId') connectionId: string,
    @Param('containerId') containerId: string,
  ) {
    return this.serverService.restartContainer(connectionId, containerId);
  }

  @Post('/container/:connectionId/:containerId/resume')
  resumeContainer(
    @Param('connectionId') connectionId: string,
    @Param('containerId') containerId: string,
  ) {
    return this.serverService.restartContainer(connectionId, containerId);
  }

  @Post('/container/:connectionId/:containerId/remove')
  removeContainer(
    @Param('connectionId') connectionId: string,
    @Param('containerId') containerId: string,
  ) {
    return this.serverService.removeContainer(connectionId, containerId);
  }

  // IMAGE ACTION
  @Post('/image/:connectionId/run')
  runDockerImages(
    @Param('connectionId') connectionId: string,
    @Body('imageName') imageName: string,
    @Body('containerName') containerName?: string,
  ) {
    return this.serverService.runDockerImage(
      connectionId,
      imageName,
      containerName,
    );
  }

  @Delete('/docker/image/:connectionId/:imageName')
  deleteDockerImage(
    @Param('connectionId') connectionId: string,
    @Param('imageName') imageName: string,
  ) {
    return this.serverService.deleteDockerImage(connectionId, imageName);
  }

  @Post('/docker/image/:connectionId/build')
  buildRepository(
    @Param('connectionId') connectionId: string,
    @Body('repositoryId') repositoryId: string,
  ) {
    return this.serverService.buildDockerImage(connectionId, repositoryId);
  }
}
