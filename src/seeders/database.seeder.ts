import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseSeeder {
  constructor() {}

  async seed(): Promise<void> {
    console.log('Starting database seeding...');

    try {
    } catch (error) {
      console.error('Error during database seeding:', error);
      throw error;
    }
  }
}
