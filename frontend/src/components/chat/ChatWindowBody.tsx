import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import MessageItem from "./MessageItem";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { CheckSquare, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ChatWindowBody = () => {
  const {
    activeConversationId,
    conversations,
    messages: allMessages,
    fetchMessages,
    typingUsers,
    deleteMessageForSelf,
  } = useChatStore();

  const [lastMessageStatus, setLastMessageStatus] = useState<"delivered" | "seen">(
    "delivered"
  );

  // Multi-select state for Main Chat
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const messages = allMessages[activeConversationId!]?.items ?? [];
  const reversedMessages = [...messages].reverse();
  const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
  const selectedConvo = conversations.find((c) => c._id === activeConversationId);
  const currentTypingUsers =
    activeConversationId ? typingUsers[activeConversationId] || [] : [];
  const key = `chat-scroll-${activeConversationId}`;

  // ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // seen status
  useEffect(() => {
    const lastMessage = selectedConvo?.lastMessage;
    if (!lastMessage) {
      return;
    }

    const seenBy = selectedConvo?.seenBy ?? [];

    setLastMessageStatus(seenBy.length > 0 ? "seen" : "delivered");
  }, [selectedConvo]);

  // Reset multi select when switching conversations
  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  }, [activeConversationId]);

  // kéo xuống dưới khi load convo
  useLayoutEffect(() => {
    if (!messagesEndRef.current || isSelectionMode) return;

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeConversationId, isSelectionMode]);

  const fetchMoreMessages = async () => {
    if (!activeConversationId) {
      return;
    }

    try {
      await fetchMessages(activeConversationId);
    } catch (error) {
      console.error("Lỗi xảy ra khi fetch thêm tin", error);
    }
  };

  const handleScrollSave = () => {
    const container = containerRef.current;
    if (!container || !activeConversationId) {
      return;
    }

    sessionStorage.setItem(
      key,
      JSON.stringify({
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
      })
    );
  };

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const item = sessionStorage.getItem(key);

    if (item) {
      const { scrollTop } = JSON.parse(item);
      requestAnimationFrame(() => {
        container.scrollTop = scrollTop;
      });
    }
  }, [messages.length]);

  const handleStartMultiSelect = (initialId: string) => {
    setIsSelectionMode(true);
    setSelectedIds([initialId]);
  };

  const toggleSelectMessage = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === reversedMessages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reversedMessages.map((m) => m._id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0 || !activeConversationId) return;

    if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.length} tin nhắn đã chọn ở phía bạn?`)) {
      return;
    }

    try {
      setDeleting(true);
      for (const id of selectedIds) {
        deleteMessageForSelf(id, activeConversationId);
      }
      toast.success(`Đã xóa ${selectedIds.length} tin nhắn khỏi giao diện của bạn`);
      setSelectedIds([]);
      setIsSelectionMode(false);
    } catch (err) {
      console.error("Lỗi khi xóa nhiều tin nhắn:", err);
      toast.error("Gặp lỗi khi xóa tin nhắn");
    } finally {
      setDeleting(false);
    }
  };

  if (!selectedConvo) {
    return <ChatWelcomeScreen />;
  }

  if (!messages?.length) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground ">
        Chưa có tin nhắn nào trong cuộc trò chuyện này.
      </div>
    );
  }

  const wallpaper = (selectedConvo.settings as any)?.wallpaper;

  return (
    <div
      className="p-4 h-full flex flex-col overflow-hidden relative transition-all"
      style={{
        backgroundImage: wallpaper ? `url(${wallpaper})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Multi-select Header Toolbar for Main Chat */}
      {isSelectionMode && (
        <div className="absolute top-3 left-4 right-4 z-30 p-2.5 rounded-2xl bg-card/95 border border-sky-500/30 shadow-xl backdrop-blur-md flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-500">
              Đã chọn: {selectedIds.length} tin nhắn
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length >= 2 && (
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground transition-smooth border border-border/40"
              >
                <CheckSquare className="size-3.5 text-sky-500" />
                {selectedIds.length === reversedMessages.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            )}

            <button
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0 || deleting}
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-sm",
                selectedIds.length > 0
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 cursor-pointer"
                  : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
              )}
            >
              {deleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Xóa đã chọn ({selectedIds.length})
            </button>

            <button
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedIds([]);
              }}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
              title="Hủy"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div
        id="scrollableDiv"
        ref={containerRef}
        onScroll={handleScrollSave}
        className="flex flex-col-reverse overflow-y-auto beautiful-scrollbar"
      >
        <div ref={messagesEndRef}></div>

        {/* Typing indicator */}
        {currentTypingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground italic my-2 pl-2 animate-pulse">
            <div className="flex gap-1 items-center">
              <span className="size-1.5 bg-primary rounded-full animate-bounce"></span>
              <span className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <span>
              {currentTypingUsers.map((u) => u.displayName).join(", ")} đang nhập tin nhắn...
            </span>
          </div>
        )}

        <InfiniteScroll
          dataLength={messages.length}
          next={fetchMoreMessages}
          hasMore={hasMore}
          scrollableTarget="scrollableDiv"
          loader={<p>Đang tải...</p>}
          inverse={true}
          style={{
            display: "flex",
            flexDirection: "column-reverse",
            overflow: "visible",
          }}
        >
          {reversedMessages.map((message, index) => (
            <MessageItem
              key={message._id ?? index}
              message={message}
              index={index}
              messages={reversedMessages}
              selectedConvo={selectedConvo}
              lastMessageStatus={lastMessageStatus}
              onStartMultiSelect={handleStartMultiSelect}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.includes(message._id)}
              onToggleSelect={toggleSelectMessage}
            />
          ))}
        </InfiniteScroll>
      </div>
    </div>
  );
};

export default ChatWindowBody;
