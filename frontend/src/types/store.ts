import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { Friend, FriendRequest, User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;
  temp2FAToken: string | null;
  requires2FA: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearState: () => void;
  signUp: (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string
  ) => Promise<any>;
  signIn: (username: string, password: string) => Promise<{ success?: boolean; requires2FA?: boolean; error?: string }>;
  validate2FALogin: (code: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refresh: () => Promise<void>;
  signInWithGoogle: (credentialOrToken: string) => Promise<boolean>;
}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

export interface ChatState {
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean; // infinite-scroll
      nextCursor?: string | null; // phân trang
    }
  >;
  activeConversationId: string | null;
  convoLoading: boolean;
  messageLoading: boolean;
  loading: boolean;
  replyingToMessage: Message | null;
  editingMessage: Message | null;
  typingUsers: Record<string, { _id: string; displayName: string }[]>;
  reset: () => void;

  setReplyingToMessage: (message: Message | null) => void;
  setEditingMessage: (message: Message | null) => void;
  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId?: string) => Promise<void>;
  sendDirectMessage: (
    recipientId: string,
    content: string,
    imgUrl?: string,
    conversationId?: string,
    parentMessageId?: string,
    fileUrl?: string,
    fileName?: string,
    fileSize?: string,
    fileType?: string,
    type?: string,
    location?: { latitude: number; longitude: number; address?: string },
    mentions?: string[]
  ) => Promise<void>;
  sendGroupMessage: (
    conversationId: string,
    content: string,
    imgUrl?: string,
    parentMessageId?: string,
    fileUrl?: string,
    fileName?: string,
    fileSize?: string,
    fileType?: string,
    type?: string,
    location?: { latitude: number; longitude: number; address?: string },
    mentions?: string[]
  ) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  updateMessageInState: (message: Message) => void;
  removeMessageFromState: (
    messageId: string,
    conversationId: string,
    deletedAt: string
  ) => void;
  updateReactionsInState: (
    messageId: string,
    conversationId: string,
    reactions: any[]
  ) => void;
  setUserTyping: (
    conversationId: string,
    user: { _id: string; displayName: string }
  ) => void;
  setUserStopTyping: (conversationId: string, userId: string) => void;
  // add message
  addMessage: (message: Message) => Promise<void>;
  // update convo
  updateConversation: (conversation: unknown, readerId?: string) => void;
  markAsSeen: () => Promise<void>;
  addConvo: (convo: Conversation) => void;
  createConversation: (
    type: "group" | "direct",
    name: string,
    memberIds: string[]
  ) => Promise<void>;
  togglePinMessageInStore: (messageId: string) => void;
  deleteMessageForSelf: (messageId: string, conversationId: string) => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  removeConversationFromState: (conversationId: string) => void;
}


export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export interface FriendState {
  friends: Friend[];
  loading: boolean;
  receivedList: FriendRequest[];
  sentList: FriendRequest[];
  searchByUsername: (username: string) => Promise<User | null>;
  addFriend: (to: string, message?: string) => Promise<string>;
  getAllFriendRequests: () => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  getFriends: () => Promise<void>;
}

export interface UserState {
  updateAvatarUrl: (formData: FormData) => Promise<void>;
}
