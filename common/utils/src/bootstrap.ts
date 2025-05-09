import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as morgan from 'morgan';
import { SerializerInterceptor } from './serializer.interceptor';
import validationOptions from './validation-options';

export const documentationBuilder = (
  app: INestApplication,
  configService: ConfigService,
  name = 'User',
) => {
  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(`${configService.get('app.name')} (${name})`)
    .setDescription('The Danimai API description')
    .setVersion('1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
};

export const createApplication = (app: INestApplication) => {
  app.enableShutdownHooks();
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.enableCors({
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalInterceptors(
    new SerializerInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  app.useGlobalPipes(new ValidationPipe(validationOptions));

  app.use(morgan('dev'));

  return app;
};
