import { channelMessage, messageButtonClicked } from '@src/repl-modules/factories';

describe('Bot Factories', () => {
  it('creates a channel message fixture for bot-side tests', () => {
    expect(
      channelMessage({
        content: { t: 'hello bot' },
      }),
    ).toMatchObject({
      channel_id: 'channel-1',
      clan_id: 'clan-1',
      content: {
        t: 'hello bot',
      },
      message_id: 'message-1',
      sender_id: 'user-1',
    });
  });

  it('creates a button click fixture for bot-side tests', () => {
    expect(
      messageButtonClicked({
        button_id: 'approve',
      }),
    ).toMatchObject({
      button_id: 'approve',
      channel_id: 'channel-1',
      clan_id: 'clan-1',
      message_id: 'message-1',
      user_id: 'user-1',
    });
  });
});
