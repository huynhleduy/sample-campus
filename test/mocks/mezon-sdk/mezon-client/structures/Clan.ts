import { mezonSdkMethodMocks } from '../../method-mocks';

export class Clan {
  id: string;
  channels: {
    fetch: (id: string) => Promise<unknown>;
  };

  constructor(input: Partial<Clan> = {}) {
    this.id = input.id ?? 'clan-1';
    this.channels = input.channels ?? {
      fetch: async (id: string) => mezonSdkMethodMocks.fetchClanChannel(id),
    };
  }
}
