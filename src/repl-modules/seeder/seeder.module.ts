import { Module } from '@nestjs/common';
import { DatabaseSeeder } from '@src/seeders/database.seeder';
import { SeederService } from './seeder.service';

@Module({
  providers: [DatabaseSeeder, SeederService],
  exports: [SeederService],
})
export class SeederModule {}
