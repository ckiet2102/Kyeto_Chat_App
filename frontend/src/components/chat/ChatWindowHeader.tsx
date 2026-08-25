import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { useSocketStore } from "@/stores/useSocketStore";
import { Settings, Phone, Video, Search, PanelRight, Bell, BellOff, Lock, ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import GroupSettingsDrawer from "./GroupSettingsDrawer";
import { useCallStore } from "@/stores/useCallStore";
import { useGroupCallStore } from "@/stores/useGroupCallStore";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface ChatWindowHeaderProps {
  chat?: Conversation;
  onToggleInfoDrawer?: () => void;
}

const ChatWindowHeader = ({ chat, onToggleInfoDrawer }: ChatWindowHeaderProps) => {
  const { t } = useTranslation();
  const { conversations, activeConversationId, setActiveConversation } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const { startCall } = useCallStore();
  const { startGroupCall } = useGroupCallStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  chat = chat ?? conversations.find((c) => c._id === activeConversationId);

  if (!chat) return null;

  const isGroup = chat.type === "group";
  const otherUser = isGroup
    ? null
    : chat.participants.find((p) => p._id !== user?._id);

  const isOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

  const nickname = !isGroup && otherUser
    ? (chat.settings as any)?.nicknames?.[otherUser._id] ||
      (typeof (chat.settings as any)?.nicknames?.get === "function"
        ? (chat.settings as any).nicknames.get(otherUser._id)
        : null)
    : null;

  const headerTitle = isGroup
    ? conversationName(chat)
    : nickname || otherUser?.displayName || "Trò chuyện";

  function conversationName(c: Conversation) {
    if (c.group?.name) return c.group.name;
    if ((c as any).name) return (c as any).name;
    const names = c.participants
      .filter((p) => p._id !== user?._id)
      .map((p) => p.displayName);
    return names.join(", ") || "Nhóm trò chuyện";
  }

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? "Đã bật thông báo cuộc hội thoại" : "Đã tắt thông báo cuộc hội thoại");
  };

  const handleStartCall = (isVideo: boolean) => {
    if (chat?.type === "direct" && otherUser) {
      startCall(otherUser._id, chat._id, isVideo, {
        _id: otherUser._id,
        displayName: otherUser.displayName,
        avatarUrl: otherUser.avatarUrl ?? undefined,
      });
    } else if (chat?.type === "group") {
      startGroupCall(chat._id, headerTitle, isVideo);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 px-2 sm:px-4 py-2 flex items-center justify-between border-b border-border/40 bg-card/80 backdrop-blur-md select-none shrink-0 min-w-0">
        {/* Left Side: Avatar & Name */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 mr-1 sm:mr-2">
          {/* Mobile Back Button */}
          <button
            onClick={() => setActiveConversation(null)}
            className="md:hidden p-1.5 -ml-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted cursor-pointer transition-colors shrink-0"
            title="Quay lại danh sách trò chuyện"
          >
            <ArrowLeft className="size-5" />
          </button>

          {/* Avatar */}
          <div className="relative shrink-0">
            {chat.type === "direct" ? (
              <>
                <UserAvatar
                  type="sidebar"
                  name={headerTitle || "User"}
                  avatarUrl={otherUser?.avatarUrl || undefined}
                />
                <StatusBadge status={isOnline ? "online" : "offline"} />
              </>
            ) : (
              <GroupChatAvatar
                participants={chat.participants}
                type="sidebar"
                avatarUrl={chat.group?.avatarUrl || (chat.group as any)?.avatar}
                groupName={headerTitle}
              />
            )}
          </div>

          {/* Name & Online Status */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="font-bold text-xs sm:text-sm text-foreground leading-tight truncate">
                {headerTitle}
              </h2>
              {chat.type === "direct" && (
                <div
                  className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] sm:text-[11px] font-medium select-none shrink-0"
                  title={t("chat.end_to_end_encrypted")}
                >
                  <Lock className="size-3 shrink-0" />
                  <span className="hidden sm:inline">{t("chat.end_to_end_encrypted")}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground truncate">
              <span className={`size-2 rounded-full shrink-0 ${isOnline || chat.type === "group" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"}`} />
              <span className="truncate text-[11px] sm:text-xs">
                {chat.type === "direct"
                  ? isOnline ? t("common.online") : t("common.offline")
                  : `${chat.participants.length} ${t("common.members")}`}
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 sm:size-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-smooth shrink-0"
            title="Tìm kiếm tin nhắn"
          >
            <Search className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 sm:size-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-smooth shrink-0"
            title="Gọi thoại"
            onClick={() => handleStartCall(false)}
          >
            <Phone className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 sm:size-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-smooth shrink-0"
            title="Gọi video"
            onClick={() => handleStartCall(true)}
          >
            <Video className="size-4" />
          </Button>

          {chat.type === "group" && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 sm:size-9 rounded-xl hover:bg-muted text-muted-foreground shrink-0"
              title="Cài đặt nhóm"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              <Settings className="size-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="size-8 sm:size-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-smooth shrink-0"
            title={isMuted ? "Bật thông báo cuộc hội thoại" : "Tắt thông báo cuộc hội thoại"}
            onClick={handleToggleMute}
          >
            {isMuted ? <BellOff className="size-4 text-amber-500" /> : <Bell className="size-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 sm:size-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-smooth shrink-0"
            title="Thông tin cuộc hội thoại"
            onClick={onToggleInfoDrawer}
          >
            <PanelRight className="size-4" />
          </Button>
        </div>
      </header>

      {chat.type === "group" && (
        <GroupSettingsDrawer
          conversation={chat}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </>
  );
};

export default ChatWindowHeader;
