export interface Participant {
  _id: string;
  displayName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  showOnlineStatus?: boolean;
  activityStatus?: boolean;
  joinedAt: string;
}

export interface SeenUser {
  _id: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export interface Group {
  _id?: string;
  name: string;
  createdBy: string;
  avatarUrl?: string | null;
}

export interface LastMessage {
  _id: string;
  content: string | null;
  createdAt: string;
  sender: {
    _id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export interface GroupSettings {
  onlyAdminSend?: boolean;
  inviteLink?: string | null;
  isPublic?: boolean;
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  group: Group;
  participants: Participant[];
  admins?: (string | { _id: string; displayName?: string })[];
  moderators?: (string | { _id: string; displayName?: string })[];
  settings?: GroupSettings;
  lastMessageAt: string;
  seenBy: SeenUser[];
  lastMessage: LastMessage | null;
  unreadCounts: Record<string, number>; // key = userId, value = unread count
  isArchived?: boolean;
  isMuted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationResponse {
  conversations: Conversation[];
}

export interface Reaction {
  userId: string | { _id: string; displayName?: string; avatarUrl?: string };
  emoji: string;
  createdAt?: string;
}

export interface ParentMessage {
  _id: string;
  content: string;
  senderId: string | { _id: string; displayName: string; avatarUrl?: string };
  createdAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string | { _id: string; displayName?: string; avatarUrl?: string };
  type?: "text" | "voice" | "video" | "gif" | "poll" | "file" | "location" | "call_log";
  content: string | null;
  imgUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: string | null;
  fileType?: string | null;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  mentions?: (string | { _id: string; displayName?: string })[];
  readBy?: {
    userId: string | { _id: string; displayName?: string; avatarUrl?: string };
    readAt: string;
  }[];
  isPinned?: boolean;
  parentMessageId?: ParentMessage | string | null;
  isEdited?: boolean;
  editHistory?: { content: string; editedAt: string }[];
  deletedAt?: string | null;
  reactions?: Reaction[];
  updatedAt?: string | null;
  createdAt: string;
  isOwn?: boolean;
}
