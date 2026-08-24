export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  phone?: string;
  blockedUsers?: (string | { _id: string; displayName?: string })[];
  twoFactorEnabled?: boolean;
  showOnlineStatus?: boolean;
  activityStatus?: boolean;
  status?: { emoji?: string; text?: string };
  subscriptionPlan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Friend {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface FriendRequest {
  _id: string;
  from?: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  to?: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  message: string;
  createdAt: string;
  updatedAt: string;
}
