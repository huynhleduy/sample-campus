import type { ChannelMessage } from 'mezon-sdk';

export function channelMessage(
  input: Partial<ChannelMessage> = {},
): ChannelMessage {
  const now = new Date().toISOString();

  return {
    attachments: [],
    avatar: '',
    channel_id: 'channel-1',
    channel_label: 'general',
    clan_id: 'clan-1',
    code: 0,
    content: { t: 'hello from sample-campus' },
    create_time: now,
    mentions: [],
    message_id: 'message-1',
    sender_id: 'user-1',
    update_time: now,
    username: 'mock-user',
    ...input,
  } as ChannelMessage;
}
