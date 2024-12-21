import { Repository as RepositoryEntity, User } from '@app/entities';
import { callApi, convertImageData } from '@app/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RunDockerDto } from './docker.dto';
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

  async getListImages(connectionId: string, user: User) {
    const url = process.env.SERVER_API + '/docker/images/' + connectionId;
    const repoDb = await this.repositoryRepository.find({
      where: { created_by: user.id },
    });

    const images = await callApi(url, 'GET');
    return {
      data: images.map((image) => {
        const mergeData = convertImageData(repoDb, image?.name);
        return { ...image, ...mergeData };
      }),
      meta: undefined,
    };
  }

  // ACTION CONTAINER
  async startContainer(connectionId: string, containerId: string) {
    const url = `${process.env.SERVER_API}/docker/container/start/${connectionId}/${containerId}`;
    const result = await callApi(url, 'POST');
    return result;
  }

  async pauseContainer(connectionId: string, containerId: string) {
    const url = `${process.env.SERVER_API}/docker/container/pause/${connectionId}/${containerId}`;
    const result = await callApi(url, 'POST');
    return result;
  }

  async stopContainer(connectionId: string, containerId: string) {
    const url = `${process.env.SERVER_API}/docker/container/stop/${connectionId}/${containerId}`;
    const result = await callApi(url, 'POST');
    return result;
  }

  async restartContainer(connectionId: string, containerId: string) {
    const url = `${process.env.SERVER_API}/docker/container/restart/${connectionId}/${containerId}`;
    const result = await callApi(url, 'POST');

    return result;
  }

  async removeContainer(connectionId: string, containerId: string) {
    const url = `${process.env.SERVER_API}/docker/container/remove/${connectionId}/${containerId}`;
    const result = await callApi(url, 'POST');
    return result;
  }

  async resumeContainer(connectionId: string, containerId: string) {
    const url = `${process.env.SERVER_API}/docker/container/resume/${connectionId}/${containerId}`;
    const result = await callApi(url, 'POST');
    return result;
  }

  //ACTION IMAGE
  async upDockerImage(connectionId: string, body: RunDockerDto) {
    const url = process.env.SERVER_API + '/docker/image/up/' + connectionId;
    const result = await callApi(url, 'POST', body);
    return result;
  }

  async downDockerImage(connectionId: string, body: RunDockerDto) {
    const url = process.env.SERVER_API + '/docker/image/down/' + connectionId;
    const result = await callApi(url, 'POST', body);
    return result;
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
  async buildDockerImage(
    connectionId: string,
    repositoryId: string,
    info: Record<string, any>,
  ) {
    const repository = await this.repositoryRepository.findOne({
      where: { id: repositoryId },
    });

    const url = process.env.SERVER_API + '/docker/image/build/' + connectionId;

    const body = {
      repository_name: repository.name,
      github_url: repository.github_url,
      fine_grained_token: repository.fine_grained_token,
      username: repository.username,
      ...info,
    };
    return await callApi(url, 'POST', body);
  }

  //hepler
}
