import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  type NestExpressApplication,
} from '@nestjs/platform-express';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from './app.module';
import bootstrapConfig from './common/configs/boostrap-config';
import { AppConfigService } from './common/shared/services/app-config.service';
import { SharedModule } from './common/shared/shared.module';

export async function bootstrap(): Promise<NestExpressApplication> {
  initializeTransactionalContext();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
  );

  await bootstrapConfig(app);
  const configService = app.select(SharedModule).get(AppConfigService);
  const port = configService.appConfig.port;
  await app.listen(port);
  const url = await app.getUrl();
  Logger.log(`Server running on ${url}`);
  return app;
}
void bootstrap();

process.on('unhandledRejection', (reason, promise) => {
  Logger.error(
    `Unhandled Rejection at: ${promise}, reason: ${reason}`,
    '',
    'UnhandledRejection',
  );
});

process.on('uncaughtException', (error) => {
  Logger.error(`Uncaught Exception: ${error.message}`, '', 'UncaughtException');
});
