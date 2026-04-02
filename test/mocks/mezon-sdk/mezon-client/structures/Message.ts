import { mezonSdkMethodMocks } from '../../method-mocks';

export class Message {
  id: string;
  content: unknown;
  channel?: unknown;
  sender_id?: string;
  attachments?: unknown[];
  mentions?: unknown[];
  create_time_seconds?: number;

  constructor(input: Partial<Message> = {}) {
    this.id = input.id ?? 'message-1';
    this.content = input.content ?? { t: 'mock message' };
    this.channel = input.channel;
    this.sender_id = input.sender_id ?? 'user-1';
    this.attachments = input.attachments ?? [];
    this.mentions = input.mentions ?? [];
    this.create_time_seconds = input.create_time_seconds;
  }

  async reply(...args: unknown[]) {
    return mezonSdkMethodMocks.replyMessage(...args);
  }
}
