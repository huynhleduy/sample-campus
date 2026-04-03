import { Injectable } from '@nestjs/common';
import type { ChannelMessage } from 'mezon-sdk';
import type { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';
import UserEntity from '@src/modules/user/user.entity';
import { DatabaseSeeder } from '@src/seeders/database.seeder';

@Injectable()
export class SeederService {
  constructor(private readonly databaseSeeder: DatabaseSeeder) {}

  async seed(options?: { users?: number; user?: Partial<UserEntity> }) {
    return this.databaseSeeder.seed(options);
  }

  async resetDatabase() {
    return this.databaseSeeder.resetDatabase();
  }

  async createUsers(count = 1, input: Partial<UserEntity> = {}) {
    return this.databaseSeeder.createUsers(count, input);
  }

  createBotMessages(count = 1, input: Partial<ChannelMessage> = {}) {
    return this.databaseSeeder.createBotMessages(count, input);
  }

  createButtonClicks(count = 1, input: Partial<MessageButtonClicked> = {}) {
    return this.databaseSeeder.createButtonClicks(count, input);
  }
}
