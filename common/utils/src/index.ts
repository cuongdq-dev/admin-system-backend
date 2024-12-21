import { Repository as RepositoryEntity } from '@app/entities';
export * from './bootstrap';
export * from './call-api';
export * from './enum';
export * from './serializer.interceptor';
export * from './validation-options';

export const convertImageData = (
  repoDb: RepositoryEntity[],
  imageName: string,
) => {
  const repo = repoDb?.find((repo, index) => {
    const service = repo.services.find(
      (service) => service.image.split(':')[0] == imageName,
    );
    if (service) return true;
  });

  const service = repo?.services?.find(
    (service) => service?.image?.split(':')[0] == imageName,
  );

  return {
    server_path: repo?.server_path || '',
    repository: repo,
    service: service,
  };
};

export function convertResponseRepository(data: RepositoryEntity) {
  return {
    ...data,
    images: data.services.reduce(
      (acc, item) => (item.image ? [...acc, item.image] : acc),
      [],
    ),
  };
}
