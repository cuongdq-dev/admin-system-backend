import {
  Injectable,
  Logger,
  MiddlewareConsumer,
  Module,
  NestMiddleware,
  NestModule,
  RequestMethod
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServerResponse } from 'http';
import { ConfigService } from './config';
import { LandingModule } from './modules/cv/landing.module';

const config = ConfigService.getInstance();

@Injectable()
class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: ServerResponse, next: () => any) {
    const start = Date.now();
    res.on('close', async () => {
      const message = `${req.method} ${req.url} (${Date.now() - start} ms) ${res.statusCode}`;
      this.logger.log(message);
    });
    next?.();
  }
}

@Module({
  imports: [MongooseModule.forRoot(config.get('DATABASE_URL'), { dbName: config.get('DATABASE_NAME') }), LandingModule]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
