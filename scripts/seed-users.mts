import { NestFactory } from '@nestjs/core';
import { Factory } from '../src/repl-modules/factories/factory';
import { DatabaseSeeder } from '../src/seeders/database.seeder';
import { SeederModule } from '../src/seeders/seeder.module';

async function main() {
  const app = await NestFactory.createApplicationContext(SeederModule);
  const seederService = app.get(DatabaseSeeder);
  const count = Number(process.env.SEED_USERS ?? 5);

  Factory.setModule(app);

  try {
    await seederService.createUsers(count);
  } finally {
    Factory.resetModule();
    await app.close();
  }
}

void main();
