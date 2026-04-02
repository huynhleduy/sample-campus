export enum EMessageComponentType {
  ANIMATION = 'ANIMATION',
  BUTTON = 'BUTTON',
}

export enum EButtonMessageStyle {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  SUCCESS = 'SUCCESS',
  DANGER = 'DANGER',
  LINK = 'LINK',
}

export enum EMarkdownType {
  PRE = 'PRE',
}

export type IButtonMessage = {
  label?: string;
  style?: EButtonMessageStyle;
  disable?: boolean;
  url?: string;
  [key: string]: unknown;
};

export type ButtonComponent = {
  id: string;
  type: EMessageComponentType;
  component: IButtonMessage;
};

export type IMessageActionRow = {
  components: ButtonComponent[];
  [key: string]: unknown;
};

export type ApiMessageAttachment = {
  url?: string;
  filetype?: string;
  filename?: string;
  width?: number;
  height?: number;
  size?: number;
  [key: string]: unknown;
};

export type ApiMessageMention = {
  user_id?: string;
  username?: string;
  role_id?: string;
  s?: number;
  e?: number;
  [key: string]: unknown;
};

export type ApiRole = {
  id?: string;
  title?: string;
  slug?: string;
  role_icon?: string;
  [key: string]: unknown;
};

export type ReactMessagePayload = {
  emoji_id: string;
  emoji: string;
  count: number;
  action_delete: boolean;
  [key: string]: unknown;
};

export type ChannelMessageContent = {
  t?: string;
  mk?: Array<{
    type?: EMarkdownType;
    s?: number;
    e?: number;
    [key: string]: unknown;
  }>;
  components?: IMessageActionRow[];
  embed?: IInteractiveMessageProps[];
  [key: string]: unknown;
};

export type IInteractiveMessageProps = {
  color?: string;
  title?: string;
  url?: string;
  author?: Record<string, unknown>;
  description?: string;
  thumbnail?: Record<string, unknown>;
  fields?: Array<Record<string, unknown>>;
  image?: Record<string, unknown>;
  timestamp?: string;
  footer?: Record<string, unknown>;
  [key: string]: unknown;
};

export class StreamingJoinedEvent {}
export class StreamingLeavedEvent {}
