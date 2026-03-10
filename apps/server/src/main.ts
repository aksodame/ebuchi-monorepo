import './sentry';

import {ConfigService} from '@nestjs/config';
import {NestFactory} from '@nestjs/core';
import helmet from 'helmet';

import {AppModule} from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  const port = app.get(ConfigService).getOrThrow<number>('PORT');
  await app.listen(port);
}

bootstrap();
