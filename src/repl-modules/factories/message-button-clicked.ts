import type { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';

export function messageButtonClicked(
  input: Partial<MessageButtonClicked> = {},
): MessageButtonClicked {
  return {
    button_id: 'button-1',
    channel_id: 'channel-1',
    clan_id: 'clan-1',
    message_id: 'message-1',
    user_id: 'user-1',
    ...input,
  } as MessageButtonClicked;
}
