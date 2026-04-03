import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import UserEntity from '@src/modules/user/user.entity';
import { UserService } from '@src/modules/user/user.service';
import {
  channelMessage as channelMessageFactory,
  messageButtonClicked as messageButtonClickedFactory,
  user as userFactory,
} from './factories';
import { SeederService } from './seeder';
import type { ChannelMessage } from 'mezon-sdk';
import type { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';

@Injectable()
export class ReplService {
  private readonly logger = new Logger(ReplService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly seederService: SeederService,
  ) {}

  async hello() {
    const count = await this.countUsers();
    const message = `sample-campus repl ready. users=${count}`;

    this.logger.log(message);

    return message;
  }

  async listUsers(limit = 20) {
    return this.dataSource.getRepository(UserEntity).find({
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findUser(mezonId: string) {
    return this.userService.findByMezonId(mezonId);
  }

  async createUser(input: Partial<UserEntity> = {}) {
    return userFactory(input);
  }

  async createUsers(count = 1, input: Partial<UserEntity> = {}) {
    return this.seederService.createUsers(count, input);
  }

  createBotMessage(input: Partial<ChannelMessage> = {}) {
    return channelMessageFactory(input);
  }

  createBotMessages(count = 1, input: Partial<ChannelMessage> = {}) {
    return this.seederService.createBotMessages(count, input);
  }

  createButtonClick(input: Partial<MessageButtonClicked> = {}) {
    return messageButtonClickedFactory(input);
  }

  createButtonClicks(count = 1, input: Partial<MessageButtonClicked> = {}) {
    return this.seederService.createButtonClicks(count, input);
  }

  async countUsers() {
    return this.dataSource.getRepository(UserEntity).count();
  }

  async resetDatabase() {
    await this.seederService.resetDatabase();

    return {
      reset: true,
    };
  }

  async reseedUsers(count = 5, input: Partial<UserEntity> = {}) {
    await this.seederService.resetDatabase();

    return this.seederService.createUsers(count, input);
  }
}
