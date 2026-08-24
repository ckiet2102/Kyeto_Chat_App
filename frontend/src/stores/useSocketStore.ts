import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";
import { useCallStore } from "./useCallStore";
import { useGroupCallStore } from "./useGroupCallStore";
import { useFriendStore } from "./useFriendStore";
import { toast } from "sonner";

import { NotificationService } from "@/services/notificationService";
import { PushNotificationService } from "@/services/pushNotificationService";

const rawSocketUrl = (import.meta.env.VITE_SOCKET_URL || "").trim();
const baseURL = (rawSocketUrl && rawSocketUrl.length > 10 && rawSocketUrl.startsWith("http"))
  ? rawSocketUrl
  : "https://kyeto-backend.onrender.com";

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    if (existingSocket) return; // tránh tạo nhiều socket

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });

    set({ socket });

    // Bind global call socket listeners immediately
    useCallStore.getState().bindGlobalCallSocket();
    useGroupCallStore.getState().bindGlobalGroupCallSocket();

    socket.on("connect", () => {
      console.log("Đã kết nối với socket");
      NotificationService.requestPermission();
      PushNotificationService.registerAndSubscribe();
      useCallStore.getState().bindGlobalCallSocket();
      useGroupCallStore.getState().bindGlobalGroupCallSocket();
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
      toast.success("Đã khôi phục kết nối thời gian thực! 🟢");
      useChatStore.getState().fetchConversations();
    });

    socket.on("reconnect_error", (error) => {
      console.warn("[Socket] Reconnection error:", error);
    });

    socket.on("reconnect_failed", () => {
      toast.error("Mất kết nối máy chủ. Vui lòng làm mới trang.");
    });

    // online users
    socket.on("online-users", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // friend request real-time listeners
    socket.on("new-friend-request", (data) => {
      useFriendStore.getState().getAllFriendRequests();
      toast.info(`Bạn vừa nhận được lời mời kết bạn từ ${data.from?.displayName || "người dùng mới"}!`);
    });

    socket.on("friend-request-accepted", (data) => {
      useFriendStore.getState().getFriends();
      useChatStore.getState().fetchConversations();
      toast.success(`${data.user?.displayName || "Người bạn mới"} đã chấp nhận lời mời kết bạn!`);
    });

    socket.on("user-mentioned", (data) => {
      // Mention ALWAYS plays urgent notification sound & desktop push notification, overriding mute settings
      NotificationService.playMentionNotificationSound();

      const title = data.isMentionAll
        ? `📣 ${data.senderName || "Ai đó"} đã nhắc đến tất cả mọi người!`
        : `🔔 ${data.senderName || "Ai đó"} đã nhắc đến bạn!`;

      const groupLabel = data.groupName ? ` [${data.groupName}]` : "";

      NotificationService.sendDesktopNotification(title, {
        body: `${data.senderName || "Ai đó"}${groupLabel}: "${data.content || ""}"`,
      });

      toast.warning(`${title}${groupLabel}`, {
        duration: 7000,
        action: {
          label: "Xem ngay",
          onClick: () => {
            if (data.conversationId) {
              useChatStore.getState().setActiveConversation(data.conversationId);
            }
          },
        },
      });
    });

    // new message
    socket.on("new-message", (data) => {
      if (!data) return;
      // Handle both { message, conversation, unreadCounts } format and raw message format
      const message = data.message || (data._id ? data : null);
      const conversation = data.conversation;
      const unreadCounts = data.unreadCounts;

      if (message) {
        useChatStore.getState().addMessage(message);
      }

      if (conversation && conversation.lastMessage) {
        const lastMessage = {
          _id: conversation.lastMessage._id,
          content: conversation.lastMessage.content,
          createdAt: conversation.lastMessage.createdAt,
          sender: {
            _id: conversation.lastMessage.senderId,
            displayName: "",
            avatarUrl: null,
          },
        };

        const updatedConversation = {
          ...conversation,
          lastMessage,
          unreadCounts,
        };

        if (message && useChatStore.getState().activeConversationId === message.conversationId) {
          useChatStore.getState().markAsSeen();
        }

        useChatStore.getState().updateConversation(updatedConversation);
      }

      if (message?.content) {
        NotificationService.playNotificationSound();
        NotificationService.sendDesktopNotification("Tin nhắn mới từ Kyeto", {
          body: message.content,
        });
      }
    });

    // read message
    socket.on("read-message", ({ conversation, lastMessage, readerId }) => {
      const updated = {
        _id: conversation._id,
        lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
        seenBy: conversation.seenBy,
      };

      useChatStore.getState().updateConversation(updated, readerId);
    });

    // new group chat
    socket.on("new-group", (conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });

    // message edited
    socket.on("message-edited", ({ message }) => {
      useChatStore.getState().updateMessageInState(message);
    });

    // message deleted
    socket.on("message-deleted", ({ messageId, conversationId, deletedAt }) => {
      useChatStore.getState().removeMessageFromState(messageId, conversationId, deletedAt);
    });

    // conversation deleted
    socket.on("conversation-deleted", ({ conversationId }: { conversationId: string }) => {
      useChatStore.getState().removeConversationFromState(conversationId);
      toast.info("Cuộc trò chuyện đã bị xóa.");
    });

    // message reaction updated
    socket.on("message-reaction-updated", ({ messageId, conversationId, reactions }) => {
      useChatStore.getState().updateReactionsInState(messageId, conversationId, reactions);
    });

    // user typing
    socket.on("user-typing", ({ conversationId, user }) => {
      useChatStore.getState().setUserTyping(conversationId, user);
    });

    // user stop typing
    socket.on("user-stop-typing", ({ conversationId, userId }) => {
      useChatStore.getState().setUserStopTyping(conversationId, userId);
    });

    // group updated
    socket.on("group-updated", (conversation) => {
      useChatStore.getState().updateConversation(conversation);
    });

    socket.on("groupUpdated", (conversation) => {
      useChatStore.getState().updateConversation(conversation);
    });

    // group removed
    socket.on("group-removed", ({ conversationId }) => {
      const activeId = useChatStore.getState().activeConversationId;
      if (activeId === conversationId) {
        useChatStore.getState().setActiveConversation(null);
      }
      useChatStore.setState((state) => ({
        conversations: state.conversations.filter((c) => c._id !== conversationId),
      }));
    });

    // WebRTC Call Events
    socket.on("incoming-call", (data) => {
      useCallStore.getState().handleIncomingCall(data);
    });

    useGroupCallStore.getState().bindGlobalGroupCallSocket();

    socket.on("call-accepted", (data) => {
      useCallStore.getState().handleCallAccepted(data);
    });

    socket.on("ice-candidate", ({ candidate }) => {
      useCallStore.getState().handleIceCandidate(candidate);
    });

    socket.on("call-rejected", () => {
      useCallStore.getState().handleCallRejected();
    });

    socket.on("call-ended", () => {
      useCallStore.getState().handleCallEnded();
    });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
