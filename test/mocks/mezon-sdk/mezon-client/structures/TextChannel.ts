import { mezonSdkMethodMocks } from '../../method-mocks';

export class TextChannel {
  id: string;
  clan?: { id: string } | undefined;
  messages: {
    fetch: (id: string) => Promise<unknown>;
  };

  constructor(input: Partial<TextChannel> = {}) {
    this.id = input.id ?? 'channel-1';
    this.clan = input.clan;
    this.messages = input.messages ?? {
      fetch: async (id: string) => mezonSdkMethodMocks.fetchChannelMessage(id),
    };
  }
}
