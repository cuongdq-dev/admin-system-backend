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
import { UserParam } from '@app/decorators';
import { User } from '@app/entities';

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
  getListImages(
    @Param() params: { connectionId: string },
    @UserParam() user: User,
  ) {
    return this.serverService.getListImages(params.connectionId, user);
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
  @Post('/image/:connectionId/up')
  upDockerImages(
    @Param('connectionId') connectionId: string,
    @Body('imageName') imageName: string,
    @Body('imageId') imageId: string,
    @Body('serverPath') serverPath: string,
    @Body('serviceName') serviceName: string,
  ) {
    const body = {
      imageName,
      imageId,
      serverPath,
      serviceName,
    };
    return this.serverService.upDockerImage(connectionId, body);
  }

  @Post('/image/:connectionId/down')
  downDockerImages(
    @Param('connectionId') connectionId: string,
    @Body('imageName') imageName: string,
    @Body('imageId') imageId: string,
    @Body('serverPath') serverPath: string,
    @Body('serviceName') serviceName: string,
  ) {
    const body = {
      imageName,
      imageId,
      serverPath,
      serviceName,
    };
    return this.serverService.downDockerImage(connectionId, body);
  }

  @Delete('/image/:connectionId/:imageName')
  deleteDockerImage(
    @Param('connectionId') connectionId: string,
    @Param('imageName') imageName: string,
  ) {
    return this.serverService.deleteDockerImage(connectionId, imageName);
  }

  @Post('/image/:connectionId/build')
  buildRepository(
    @Param('connectionId') connectionId: string,
    @Body() body: Record<string, any>,
  ) {
    return true;
  }
}
