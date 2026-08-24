import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import type { Conversation } from "@/types/chat";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";

const sortConversations = (conversations: Conversation[]): Conversation[] => {
  return [...conversations].sort((a, b) => {
    const getTs = (c: Conversation) => {
      if (c.lastMessageAt) {
        const t = new Date(c.lastMessageAt).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      if (c.lastMessage?.createdAt) {
        const t = new Date(c.lastMessage.createdAt).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      if (c.updatedAt) {
        const t = new Date(c.updatedAt).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      if (c.createdAt) {
        const t = new Date(c.createdAt).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      return 0;
    };
    return getTs(b) - getTs(a);
  });
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      convoLoading: false, // convo loading
      messageLoading: false,
      loading: false,
      replyingToMessage: null,
      editingMessage: null,
      typingUsers: {},

      setReplyingToMessage: (message) => set({ replyingToMessage: message }),
      setEditingMessage: (message) => set({ editingMessage: message }),
      setActiveConversation: (id) => set({ activeConversationId: id }),
      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          messageLoading: false,
          replyingToMessage: null,
          editingMessage: null,
          typingUsers: {},
        });
      },
      fetchConversations: async () => {
        try {
          set({ convoLoading: true });
          const { conversations } = await chatService.fetchConversations();

          set({ conversations: sortConversations(conversations), convoLoading: false });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchConversations:", error);
          set({ convoLoading: false });
        }
      },
      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages } = get();
        const { user } = useAuthStore.getState();

        const convoId = conversationId ?? activeConversationId;

        if (!convoId) return;

        const current = messages?.[convoId];
        const nextCursor =
          current?.nextCursor === undefined ? "" : current?.nextCursor;

        if (nextCursor === null) return;

        set({ messageLoading: true });

        try {
          const { messages: fetched, cursor } = await chatService.fetchMessages(
            convoId,
            nextCursor
          );

          const processed = fetched.map((m) => ({
            ...m,
            isOwn: m.senderId === user?._id,
          }));

          set((state) => {
            const prev = state.messages[convoId]?.items ?? [];
            const merged = prev.length > 0 ? [...processed, ...prev] : processed;

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchMessages:", error);
        } finally {
          set({ messageLoading: false });
        }
      },
      sendDirectMessage: async (
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
      ) => {
        try {
          const { activeConversationId, replyingToMessage } = get();
          const targetConvoId = conversationId || activeConversationId;
          await chatService.sendDirectMessage(
            recipientId,
            content,
            imgUrl,
            targetConvoId || undefined,
            parentMessageId || replyingToMessage?._id,
            fileUrl,
            fileName,
            fileSize,
            fileType,
            type,
            location,
            mentions
          );
          const now = new Date().toISOString();
          set((state) => {
            const updated = state.conversations.map((c) =>
              c._id === targetConvoId ? { ...c, seenBy: [], lastMessageAt: now, updatedAt: now } : c
            );
            return {
              replyingToMessage: null,
              conversations: sortConversations(updated),
            };
          });
        } catch (error) {
          console.error("Lỗi xảy ra khi gửi direct message", error);
        }
      },
      sendGroupMessage: async (
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
      ) => {
        try {
          const { replyingToMessage } = get();
          await chatService.sendGroupMessage(
            conversationId,
            content,
            imgUrl,
            parentMessageId || replyingToMessage?._id,
            fileUrl,
            fileName,
            fileSize,
            fileType,
            type,
            location,
            mentions
          );
          const now = new Date().toISOString();
          set((state) => {
            const updated = state.conversations.map((c) =>
              c._id === conversationId ? { ...c, seenBy: [], lastMessageAt: now, updatedAt: now } : c
            );
            return {
              replyingToMessage: null,
              conversations: sortConversations(updated),
            };
          });
        } catch (error) {
          console.error("Lỗi xảy ra gửi group message", error);
        }
      },
      editMessage: async (messageId, content) => {
        try {
          const message = await chatService.editMessage(messageId, content);
          get().updateMessageInState(message);
          set({ editingMessage: null });
        } catch (error) {
          console.error("Lỗi xảy ra khi chỉnh sửa tin nhắn:", error);
        }
      },
      deleteMessage: async (messageId) => {
        try {
          const data = await chatService.deleteMessage(messageId);
          const activeConvoId = get().activeConversationId;
          if (activeConvoId) {
            get().removeMessageFromState(messageId, activeConvoId, data.deletedAt);
          }
        } catch (error) {
          console.error("Lỗi xảy ra khi xóa tin nhắn:", error);
        }
      },
      toggleReaction: async (messageId, emoji) => {
        try {
          const reactions = await chatService.toggleReaction(messageId, emoji);
          const activeConvoId = get().activeConversationId;
          if (activeConvoId) {
            get().updateReactionsInState(messageId, activeConvoId, reactions);
          }
        } catch (error) {
          console.error("Lỗi xảy ra khi thả cảm xúc:", error);
        }
      },
      updateMessageInState: (message) => {
        const { user } = useAuthStore.getState();
        const convoId = message.conversationId;
        message.isOwn = message.senderId === user?._id;

        set((state) => {
          const prevItems = state.messages[convoId]?.items ?? [];
          const updatedItems = prevItems.map((m) =>
            m._id === message._id ? { ...m, ...message } : m
          );

          const updatedConversations: Conversation[] = state.conversations.map((convo) => {
            if (convo._id === convoId && convo.lastMessage?._id === message._id) {
              return {
                ...convo,
                lastMessage: {
                  ...convo.lastMessage,
                  content: message.content,
                },
              };
            }
            return convo;
          });

          return {
            conversations: sortConversations(updatedConversations),
            messages: {
              ...state.messages,
              [convoId]: {
                ...state.messages[convoId],
                items: updatedItems,
              },
            },
          };
        });
      },
      removeMessageFromState: (messageId, conversationId, deletedAt) => {
        set((state) => {
          const prevItems = state.messages[conversationId]?.items ?? [];
          const updatedItems = prevItems.map((m) =>
            m._id === messageId
              ? { ...m, deletedAt, content: "Tin nhắn đã bị thu hồi" }
              : m
          );

          const updatedConversations = state.conversations.map((convo) => {
            if (convo._id === conversationId && convo.lastMessage?._id === messageId) {
              return {
                ...convo,
                lastMessage: {
                  ...convo.lastMessage,
                  content: "Tin nhắn đã bị thu hồi",
                },
              };
            }
            return convo;
          });

          return {
            conversations: sortConversations(updatedConversations),
            messages: {
              ...state.messages,
              [conversationId]: {
                ...state.messages[conversationId],
                items: updatedItems,
              },
            },
          };
        });
      },
      updateReactionsInState: (messageId, conversationId, reactions) => {
        set((state) => {
          const prevItems = state.messages[conversationId]?.items ?? [];
          const updatedItems = prevItems.map((m) =>
            m._id === messageId ? { ...m, reactions } : m
          );
          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...state.messages[conversationId],
                items: updatedItems,
              },
            },
          };
        });
      },
      setUserTyping: (conversationId, typingUser) => {
        const { user } = useAuthStore.getState();
        if (typingUser._id === user?._id) return;

        set((state) => {
          const currentTyping = state.typingUsers[conversationId] ?? [];
          if (currentTyping.some((u) => u._id === typingUser._id)) return state;

          return {
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: [...currentTyping, typingUser],
            },
          };
        });
      },
      setUserStopTyping: (conversationId, userId) => {
        set((state) => {
          const currentTyping = state.typingUsers[conversationId] ?? [];
          return {
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: currentTyping.filter((u) => u._id !== userId),
            },
          };
        });
      },
      addMessage: async (message) => {
        try {
          if (!message || !message.conversationId) return;

          const { user } = useAuthStore.getState();
          const { fetchMessages } = get();

          const senderIdStr = typeof message.senderId === "object"
            ? (message.senderId as any)?._id?.toString()
            : message.senderId?.toString();

          message.isOwn = message.isOwn ?? (senderIdStr === user?._id?.toString());

          const convoId = message.conversationId;

          let prevItems = get().messages[convoId]?.items ?? [];

          if (prevItems.length === 0) {
            await fetchMessages(message.conversationId);
            prevItems = get().messages[convoId]?.items ?? [];
          }

          set((state) => {
            if (prevItems.some((m) => m._id === message._id)) {
              return state;
            }

            const currentConvoState = state.messages[convoId] || { hasMore: false, nextCursor: undefined };

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: [...prevItems, message],
                  hasMore: currentConvoState.hasMore,
                  nextCursor: currentConvoState.nextCursor ?? undefined,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy khi ra add message:", error);
        }
      },
      updateConversation: (conversation: any, readerId?: string) => {
        set((state) => {
          const updatedConversations = state.conversations.map((c) =>
            c._id === conversation._id ? { ...c, ...conversation } : c
          );
          const sorted = sortConversations(updatedConversations);

          if (readerId && state.messages[conversation._id]) {
            const prevItems = state.messages[conversation._id].items;
            const updatedItems = prevItems.map((m) => {
              const readByArray = (m as any).readBy || [];
              const alreadyRead = readByArray.some((r: any) => {
                const rId = typeof r.userId === "object" ? r.userId?._id : r.userId;
                return rId?.toString() === readerId;
              });
              if (alreadyRead) return m;

              return {
                ...m,
                readBy: [...readByArray, { userId: readerId, readAt: new Date().toISOString() }],
              };
            });

            return {
              conversations: sorted,
              messages: {
                ...state.messages,
                [conversation._id]: {
                  ...state.messages[conversation._id],
                  items: updatedItems,
                },
              },
            };
          }

          return { conversations: sorted };
        });
      },
      markAsSeen: async () => {
        try {
          const { user } = useAuthStore.getState();
          const { activeConversationId, conversations } = get();

          if (!activeConversationId || !user) {
            return;
          }

          const convo = conversations.find((c) => c._id === activeConversationId);

          if (!convo) {
            return;
          }

          if ((convo.unreadCounts?.[user._id] ?? 0) === 0) {
            return;
          }

          await chatService.markAsSeen(activeConversationId);

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId && c.lastMessage
                ? {
                    ...c,
                    unreadCounts: {
                      ...c.unreadCounts,
                      [user._id]: 0,
                    },
                  }
                : c
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra khi gọi markAsSeen trong store", error);
        }
      },
      addConvo: (convo) => {
        set((state) => {
          const exists = state.conversations.some(
            (c) => c._id.toString() === convo._id.toString()
          );

          const updated = exists ? state.conversations : [convo, ...state.conversations];

          return {
            conversations: sortConversations(updated),
            activeConversationId: convo._id,
          };
        });
      },
      createConversation: async (type, name, memberIds) => {
        try {
          set({ loading: true });
          const conversation = await chatService.createConversation(
            type,
            name,
            memberIds
          );

          get().addConvo(conversation);

          useSocketStore
            .getState()
            .socket?.emit("join-conversation", conversation._id);
        } catch (error) {
          console.error("Lỗi xảy ra khi gọi createConversation trong store", error);
        } finally {
          set({ loading: false });
        }
      },
      togglePinMessageInStore: (messageId) => {
        const { activeConversationId, messages } = get();
        if (!activeConversationId || !messages[activeConversationId]) return;
        const currentItems = messages[activeConversationId].items;
        const updatedItems = currentItems.map((m) =>
          m._id === messageId ? { ...m, isPinned: !m.isPinned } : m
        );
        set((state) => ({
          messages: {
            ...state.messages,
            [activeConversationId]: {
              ...state.messages[activeConversationId],
              items: updatedItems,
            },
          },
        }));
      },
      deleteMessageForSelf: (messageId, conversationId) => {
        set((state) => {
          const prevItems = state.messages[conversationId]?.items ?? [];
          const updatedItems = prevItems.filter((m) => m._id !== messageId);
          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...state.messages[conversationId],
                items: updatedItems,
              },
            },
          };
        });
      },
      deleteConversation: async (conversationId: string) => {
        try {
          await chatService.deleteConversation(conversationId);
          get().removeConversationFromState(conversationId);
        } catch (error) {
          console.error("Lỗi xảy ra khi xóa cuộc trò chuyện:", error);
          throw error;
        }
      },
      removeConversationFromState: (conversationId: string) => {
        set((state) => {
          const updatedConversations = state.conversations.filter(
            (c) => c._id !== conversationId
          );
          const updatedMessages = { ...state.messages };
          delete updatedMessages[conversationId];

          return {
            conversations: updatedConversations,
            messages: updatedMessages,
            activeConversationId:
              state.activeConversationId === conversationId
                ? null
                : state.activeConversationId,
          };
        });
      },
    }),

    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
);
