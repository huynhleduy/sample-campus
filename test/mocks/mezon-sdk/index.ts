import { EventEmitter } from 'node:events';

export { EMessageComponentType } from './interfaces/client';
import { mezonSdkMethodMocks, resetMezonSdkMethodMocks } from './method-mocks';
import { Clan } from './mezon-client/structures/Clan';
import { Message } from './mezon-client/structures/Message';
import { TextChannel } from './mezon-client/structures/TextChannel';
import { User } from './mezon-client/structures/User';

export class ChannelMessage {
  constructor(input: Partial<ChannelMessage> = {}) {
    Object.assign(this, input);
  }

  message_id = 'message-1';
  channel_id = 'channel-1';
  clan_id = 'clan-1';
  sender_id = 'user-1';
  username = 'mock-user';
  avatar = '';
  content: unknown = { t: 'mock message' };
  attachments: unknown[] = [];
  mentions: unknown[] = [];
}

export class ClientConfigDto {}
export class TokenSentEvent {}

export const Events = new Proxy(
  {},
  {
    get: (_target, property) => String(property),
  },
) as Record<string, string>;

export class MezonClient extends EventEmitter {
  readonly channels = {
    cache: new Map<string, TextChannel>(),
    fetch: async (id: string) => {
      await mezonSdkMethodMocks.fetchChannel(id);

      if (!this.channels.cache.has(id)) {
        this.channels.cache.set(id, new TextChannel({ id }));
      }

      return this.channels.cache.get(id);
    },
  };

  readonly clans = {
    cache: new Map<string, Clan>(),
    fetch: async (id: string) => {
      await mezonSdkMethodMocks.fetchClan(id);

      if (!this.clans.cache.has(id)) {
        this.clans.cache.set(id, new Clan({ id }));
      }

      return this.clans.cache.get(id);
    },
  };

  readonly users = {
    cache: new Map<string, User>(),
    fetch: async (id: string) => {
      await mezonSdkMethodMocks.fetchUser(id);

      if (!this.users.cache.has(id)) {
        this.users.cache.set(id, new User({ id }));
      }

      return this.users.cache.get(id);
    },
  };

  constructor(public readonly options: Record<string, unknown> = {}) {
    super();
    mezonMockState.clients.push(this);
  }

  async login() {
    return mezonSdkMethodMocks.login();
  }

  async onChannelMessage(
    handler: (message: ChannelMessage) => Promise<unknown>,
  ) {
    this.on(Events.ChannelMessage, handler);
    await mezonSdkMethodMocks.onChannelMessage(handler);
  }

  closeSocket() {
    mezonSdkMethodMocks.closeSocket();
    this.emit('close');
  }

  async sendToken() {
    return mezonSdkMethodMocks.sendToken();
  }

  createMessage(input: Partial<ChannelMessage> = {}) {
    return new ChannelMessage(input);
  }

  createTextChannel(input: Partial<TextChannel> = {}) {
    return new TextChannel(input);
  }

  createMessageEntity(input: Partial<Message> = {}) {
    return new Message(input);
  }
}

const mezonMockState = {
  clients: [] as MezonClient[],
};

function resetMezonSdkMocks() {
  resetMezonSdkMethodMocks();
  mezonMockState.clients.length = 0;
}

export { mezonMockState, mezonSdkMethodMocks, resetMezonSdkMocks };
export { Clan, Message, TextChannel, User };
