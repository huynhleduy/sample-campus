import { NestFactory } from '@nestjs/core';
import { Factory } from '@src/repl-modules/factories/factory';
import { DatabaseSeeder } from '@src/seeders/database.seeder';
import { SeederModule } from '@src/seeders/seeder.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);
  const seeder = app.get(DatabaseSeeder);

  Factory.setModule(app);

  try {
    await seeder.seed();
  } finally {
    Factory.resetModule();
    await app.close();
  }
}

void bootstrap();
