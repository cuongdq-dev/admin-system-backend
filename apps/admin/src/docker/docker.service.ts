import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as RepositoryEntity } from 'common/entities/repository.entity';
import { callApi } from 'common/utils/call-api';
import { Repository } from 'typeorm';
@Injectable()
export class DockerService {
  constructor(
    @InjectRepository(RepositoryEntity)
    private repositoryRepository: Repository<RepositoryEntity>,
  ) {}

  async getListContainers(connectionId: string) {
    const container = await callApi(
      process.env.SERVER_API + '/docker/containers/' + connectionId,
      'GET',
    );

    return { data: container, meta: undefined };
  }

  async getListImages(connectionId: string) {
    const url = process.env.SERVER_API + '/docker/images/' + connectionId;
    const container = await callApi(url, 'GET');
    return { data: container, meta: undefined };
  }

  // ACTION CONTAINER
  async startContainer(connectionId: string, containerId: string) {
    const url = `${process.env.SERVER_API}/docker/container/start/${connectionId}/${containerId}`;
    return await callApi(url, 'POST');
  }

  async pauseContainer(connectionId: string, containerId: string) {
    const url = `${process.env.SERVER_API}/docker/container/pause/${connectionId}/${containerId}`;
    return await callApi(url, 'POST');
  }

  async stopContainer(connectionId: string, containerId: string) {
    const url = `${process.env.SERVER_API}/docker/container/stop/${connectionId}/${containerId}`;
    return await callApi(url, 'POST');
  }

  async restartContainer(connectionId: string, containerId: string) {
    const url = `${process.env.SERVER_API}/docker/container/restart/${connectionId}/${containerId}`;
    return await callApi(url, 'POST');
  }

  async removeContainer(connectionId: string, containerId: string) {
    const url = `${process.env.SERVER_API}/docker/container/remove/${connectionId}/${containerId}`;
    return await callApi(url, 'POST');
  }

  async resumeContainer(connectionId: string, containerId: string) {
    const url = `${process.env.SERVER_API}/docker/container/resume/${connectionId}/${containerId}`;
    return await callApi(url, 'POST');
  }

  //ACTION IMAGE
  async runDockerImage(
    connectionId: string,
    imageName: string,
    containerName?: string,
  ) {
    const url =
      process.env.SERVER_API + '/docker/image/' + connectionId + '/run';
    const body = { imageName, containerName };
    return await callApi(url, 'POST', body);
  }

  async deleteDockerImage(connectionId: string, imageName: string) {
    const url =
      process.env.SERVER_API +
      '/docker/image/' +
      connectionId +
      '/' +
      imageName;

    return await callApi(url, 'DELETE');
  }
  async buildDockerImage(connectionId: string, repositoryId: string) {
    const repository = await this.repositoryRepository.findOne({
      where: { id: repositoryId },
    });

    const url =
      process.env.SERVER_API + '/docker/image/' + connectionId + '/build';

    const body = {
      repository_name: repository.name,
      github_url: repository.github_url,
      fine_grained_token: repository.fine_grained_token,
      username: repository.username,
    };
    return await callApi(url, 'POST', body);
  }
}
