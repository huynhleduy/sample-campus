export class MessageButtonClicked {
  user_id?: string;
  channel_id?: string;
  clan_id?: string;
  message_id?: string;
  button_id?: string;

  constructor(input: Partial<MessageButtonClicked> = {}) {
    Object.assign(this, input);
  }
}

export class UserChannelRemoved {}
export class ChannelCreatedEvent {}
export class ChannelDeletedEvent {}
export class ChannelUpdatedEvent {}
export class RoleEvent {}
export class RoleAssignedEvent {}
export class AddClanUserEvent {}
export class StreamingJoinedEvent {}
export class StreamingLeavedEvent {}
export class DropdownBoxSelected {}
export class WebrtcSignalingFwd {}
export class VoiceStartedEvent {}
export class VoiceEndedEvent {}
export class VoiceJoinedEvent {}
export class VoiceLeavedEvent {}
export class Notifications {}
export class QuickMenuDataEvent {}
