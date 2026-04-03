import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import UserEntity from '@src/modules/user/user.entity';
import type { ChannelMessage } from 'mezon-sdk';
import type { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';
import {
  channelMessage as channelMessageFactory,
  messageButtonClicked as messageButtonClickedFactory,
  user as userFactory,
} from '@src/repl-modules/factories';

@Injectable()
export class DatabaseSeeder {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(private readonly dataSource: DataSource) {}

  async seed(options: SeedOptions = {}): Promise<SeedResult> {
    const { users = 5, user = {} } = options;

    this.logger.log('Starting database seeding...');

    await this.resetDatabase();
    const seededUsers = await this.createUsers(users, user);

    this.logger.log(`Seeded ${seededUsers.length} users`);

    return {
      users: seededUsers,
    };
  }

  async createUsers(count = 1, input: Partial<UserEntity> = {}) {
    return userFactory(
      Array.from({ length: count }, () => ({
        ...input,
      })),
    );
  }

  createBotMessages(count = 1, input: Partial<ChannelMessage> = {}) {
    return Array.from({ length: count }, (_, index) =>
      channelMessageFactory({
        message_id: `message-${index + 1}`,
        ...input,
      }),
    );
  }

  createButtonClicks(count = 1, input: Partial<MessageButtonClicked> = {}) {
    return Array.from({ length: count }, (_, index) =>
      messageButtonClickedFactory({
        button_id: `button-${index + 1}`,
        message_id: `message-${index + 1}`,
        ...input,
      }),
    );
  }

  async truncateUsers() {
    await this.dataSource.getRepository(UserEntity).clear();
  }

  async resetDatabase() {
    const tables = this.dataSource.entityMetadatas
      .filter((entity) => entity.tableType === 'regular')
      .map((entity) => `"${entity.tableName}"`);

    if (tables.length === 0) {
      return;
    }

    await this.dataSource.query(
      `TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE;`,
    );
  }
}

type SeedOptions = {
  users?: number;
  user?: Partial<UserEntity>;
};

type SeedResult = {
  users: UserEntity[];
};
