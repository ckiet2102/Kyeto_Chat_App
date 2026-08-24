import { useState, useEffect } from "react";
import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import ChatWindowHeader from "./ChatWindowHeader";
import ChatWindowBody from "./ChatWindowBody";
import MessageInput from "./MessageInput";
import RightInfoDrawer from "./RightInfoDrawer";
import ChatWindowSkeleton from "../skeleton/ChatWindowSkeleton";
import { Pin, X } from "lucide-react";
import { chatService } from "@/services/chatService";

const ChatWindowLayout = () => {
  const {
    activeConversationId,
    conversations,
    messages,
    messageLoading: loading,
    markAsSeen,
    togglePinMessageInStore,
  } = useChatStore();

  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsInfoDrawerOpen(false);
    }
  }, [activeConversationId]);

  const selectedConvo =
    conversations.find((c) => c._id === activeConversationId) ?? null;

  const currentMessages = activeConversationId ? messages[activeConversationId]?.items || [] : [];
  const pinnedMessages = currentMessages.filter((m) => m.isPinned);
  const latestPinned = pinnedMessages.length > 0 ? pinnedMessages[pinnedMessages.length - 1] : null;

  useEffect(() => {
    if (!selectedConvo) return;

    const markSeen = async () => {
      try {
        await markAsSeen();
      } catch (error) {
        console.error("Lỗi khi markSeen", error);
      }
    };

    markSeen();
  }, [markAsSeen, selectedConvo]);

  if (!selectedConvo) {
    return (
      <div className="hidden md:flex flex-1 h-full">
        <ChatWelcomeScreen />
      </div>
    );
  }

  if (loading) {
    return <ChatWindowSkeleton />;
  }

  const handleUnpin = async (messageId: string) => {
    togglePinMessageInStore(messageId);
    await chatService.togglePin(messageId);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-background select-none relative">
      {/* Main Chat Area Column */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Header */}
        <ChatWindowHeader
          chat={selectedConvo}
          onToggleInfoDrawer={() => setIsInfoDrawerOpen(!isInfoDrawerOpen)}
        />

        {/* Pinned Messages Header Bar inside this conversation */}
        {latestPinned && (
          <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between transition-all">
            <div className="flex items-center gap-2.5 min-w-0">
              <Pin className="size-4 text-amber-500 shrink-0 animate-bounce" />
              <div className="text-xs min-w-0">
                <span className="font-semibold text-amber-600 dark:text-amber-400 mr-1.5">
                  Tin nhắn đã ghim ({pinnedMessages.length}):
                </span>
                <span className="text-foreground/90 truncate inline-block max-w-[450px] align-bottom">
                  {latestPinned.content || (latestPinned.imgUrl ? "[Hình ảnh]" : "[Tệp đính kèm]")}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleUnpin(latestPinned._id)}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors"
              title="Bỏ ghim tin nhắn này"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background/40 to-muted/20 beautiful-scrollbar">
          <ChatWindowBody />
        </div>

        {/* Footer */}
        <MessageInput selectedConvo={selectedConvo} />
      </div>

      {/* Right Info Drawer Column (~320px width) */}
      <RightInfoDrawer
        conversation={selectedConvo}
        isOpen={isInfoDrawerOpen}
        onClose={() => setIsInfoDrawerOpen(false)}
      />
    </div>
  );
};

export default ChatWindowLayout;
