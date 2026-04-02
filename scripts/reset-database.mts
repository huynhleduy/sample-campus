import { NestFactory } from '@nestjs/core';
import { DatabaseSeeder } from '../src/seeders/database.seeder';
import { SeederModule } from '../src/seeders/seeder.module';

async function main() {
  const app = await NestFactory.createApplicationContext(SeederModule);
  const seederService = app.get(DatabaseSeeder);

  try {
    await seederService.resetDatabase();
  } finally {
    await app.close();
  }
}

void main();
