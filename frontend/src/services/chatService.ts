import api from "@/lib/axios";
import type { ConversationResponse, Message } from "@/types/chat";

interface FetchMessageProps {
  messages: Message[];
  cursor?: string;
}

const pageLimit = 50;

export const chatService = {
  async fetchConversations(): Promise<ConversationResponse> {
    const res = await api.get("/conversations");
    return res.data;
  },

  async fetchMessages(id: string, cursor?: string): Promise<FetchMessageProps> {
    const res = await api.get(
      `/conversations/${id}/messages?limit=${pageLimit}&cursor=${cursor}`
    );

    return { messages: res.data.messages, cursor: res.data.nextCursor };
  },

  async sendDirectMessage(
    recipientId: string,
    content: string = "",
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
  ) {
    const res = await api.post("/messages/direct", {
      recipientId,
      content,
      imgUrl,
      conversationId,
      parentMessageId,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      type,
      location,
      mentions,
    });

    return res.data.message;
  },

  async sendGroupMessage(
    conversationId: string,
    content: string = "",
    imgUrl?: string,
    parentMessageId?: string,
    fileUrl?: string,
    fileName?: string,
    fileSize?: string,
    fileType?: string,
    type?: string,
    location?: { latitude: number; longitude: number; address?: string },
    mentions?: string[]
  ) {
    const res = await api.post("/messages/group", {
      conversationId,
      content,
      imgUrl,
      parentMessageId,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      type,
      location,
      mentions,
    });
    return res.data.message;
  },

  async getMessageReadStatus(messageId: string) {
    const res = await api.get(`/messages/${messageId}/read-status`);
    return res.data;
  },

  async editMessage(messageId: string, content: string) {
    const res = await api.put(`/messages/${messageId}`, { content });
    return res.data.message;
  },

  async deleteMessage(messageId: string) {
    const res = await api.delete(`/messages/${messageId}`);
    return res.data;
  },

  async toggleReaction(messageId: string, emoji: string) {
    const res = await api.post(`/messages/${messageId}/react`, { emoji });
    return res.data.reactions;
  },

  async toggleBookmark(messageId: string) {
    const res = await api.post(`/messages/${messageId}/bookmark`);
    return res.data;
  },

  async getBookmarks() {
    const res = await api.get("/messages/bookmarks");
    return res.data.bookmarks;
  },

  async togglePin(messageId: string) {
    const res = await api.post(`/messages/${messageId}/pin`);
    return res.data;
  },

  async getPinnedMessages(conversationId: string) {
    const res = await api.get(`/messages/pinned/${conversationId}`);
    return res.data.pinnedMessages;
  },

  async searchMessages(conversationId: string, query: string) {
    const res = await api.get(`/messages/search?conversationId=${conversationId}&query=${encodeURIComponent(query)}`);
    return res.data.messages;
  },

  async getCallLogs() {
    const res = await api.get("/messages/call-logs");
    return res.data.logs;
  },

  async createCallLog(data: { receiverId: string; conversationId?: string; isVideo?: boolean; status?: string; duration?: string }) {
    const res = await api.post("/messages/call-logs", data);
    return res.data.log;
  },

  async getCloudFiles() {
    const res = await api.get("/messages/cloud");
    return res.data.files;
  },

  async uploadCloudFile(formData: FormData) {
    const res = await api.post("/messages/cloud", formData);
    return res.data;
  },

  async saveFileToCloud(fileData: { fileName: string; fileUrl: string; fileSize?: string; fileType?: string }) {
    const res = await api.post("/messages/cloud/save", fileData);
    return res.data;
  },

  async markAsSeen(conversationId: string) {
    const res = await api.patch(`/conversations/${conversationId}/seen`);
    return res.data;
  },

  async createConversation(
    type: "direct" | "group",
    name: string,
    memberIds: string[]
  ) {
    const res = await api.post("/conversations", { type, name, memberIds });
    return res.data.conversation;
  },

  async addMembers(conversationId: string, memberIds: string[]) {
    const res = await api.post(`/conversations/${conversationId}/members`, {
      memberIds,
    });
    return res.data.conversation;
  },

  async removeMember(conversationId: string, memberId: string) {
    const res = await api.delete(
      `/conversations/${conversationId}/members/${memberId}`
    );
    return res.data.conversation;
  },

  async updateAdminRole(
    conversationId: string,
    targetUserId: string,
    action: "promote" | "demote"
  ) {
    const res = await api.put(`/conversations/${conversationId}/roles`, {
      targetUserId,
      action,
    });
    return res.data.conversation;
  },

  async updateGroupSettings(
    conversationId: string,
    settings: { onlyAdminSend?: boolean; isPublic?: boolean; inviteLink?: string }
  ) {
    const res = await api.patch(
      `/conversations/${conversationId}/settings`,
      settings
    );
    return res.data.conversation;
  },

  async updateGroupInfo(
    conversationId: string,
    data: { name?: string; avatarUrl?: string; avatar?: string }
  ) {
    const res = await api.put(`/conversations/${conversationId}/group`, data);
    return res.data.conversation;
  },

  async updateMemberNickname(
    conversationId: string,
    memberId: string,
    nickname: string
  ) {
    const res = await api.put(
      `/conversations/${conversationId}/members/${memberId}/nickname`,
      { nickname }
    );
    return res.data.conversation;
  },

  async toggleFavoriteConversation(conversationId: string) {
    const res = await api.post(`/conversations/${conversationId}/favorite`);
    return res.data;
  },

  async getFavoriteConversations() {
    const res = await api.get("/conversations/favorites");
    return res.data.favorites;
  },

  async updateThemeOrNickname(
    conversationId: string,
    data: {
      theme?: string;
      nickname?: string;
      targetUserId?: string;
      nicknames?: Record<string, string>;
      customColor?: string;
      wallpaper?: string;
    }
  ) {
    const res = await api.patch(`/conversations/${conversationId}/theme-nickname`, data);
    return res.data.conversation;
  },

  async clearConversationMessages(conversationId: string) {
    const res = await api.delete(`/conversations/${conversationId}/messages`);
    return res.data;
  },

  async deleteConversation(conversationId: string) {
    const res = await api.delete(`/conversations/${conversationId}`);
    return res.data;
  },

  async markAsUnread(conversationId: string) {
    const res = await api.patch(`/conversations/${conversationId}/unread`);
    return res.data;
  },

  async toggleArchiveConversation(conversationId: string) {
    const res = await api.post(`/conversations/${conversationId}/archive`);
    return res.data;
  },

  async toggleMuteConversation(conversationId: string) {
    const res = await api.post(`/conversations/${conversationId}/mute`);
    return res.data;
  },

  async getSelfConversation() {
    const res = await api.get("/messages/self");
    return res.data.conversation;
  },

  async sendSelfMessage(data: {
    content?: string;
    imgUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    fileType?: string;
    conversationId?: string;
  }) {
    const res = await api.post("/messages/self", data);
    return res.data.message;
  },

  async sendSelfFile(formData: FormData) {
    const res = await api.post("/messages/self", formData);
    return res.data.message;
  },

  async deleteSelfMessagesBatch(messageIds: string[]) {
    const res = await api.post("/messages/self/batch-delete", { messageIds });
    return res.data;
  },
};

