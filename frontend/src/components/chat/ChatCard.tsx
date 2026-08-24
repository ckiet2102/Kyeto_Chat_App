import { Card } from "@/components/ui/card";
import { formatOnlineTime, cn } from "@/lib/utils";
import { MoreHorizontal, Archive, ArchiveRestore, Trash2, Mail, BellOff, Bell, PhoneCall } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { chatService } from "@/services/chatService";
import { useChatStore } from "@/stores/useChatStore";
import { useGroupCallStore } from "@/stores/useGroupCallStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ChatCardProps {
  convoId: string;
  name: string;
  timestamp?: Date;
  isActive: boolean;
  onSelect: (id: string) => void;
  unreadCount?: number;
  leftSection: React.ReactNode;
  subtitle: React.ReactNode;
  isArchived?: boolean;
  isMuted?: boolean;
}

const ChatCard = ({
  convoId,
  name,
  timestamp,
  isActive,
  onSelect,
  unreadCount,
  leftSection,
  subtitle,
  isArchived = false,
  isMuted = false,
}: ChatCardProps) => {
  const { fetchConversations } = useChatStore();
  const { activeCalls, startGroupCall, isGroupCallActive } = useGroupCallStore();
  const activeCall = activeCalls[convoId];

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await chatService.toggleArchiveConversation(convoId);
      toast.success(res.message);
      fetchConversations();
    } catch {
      toast.error("Lỗi khi lưu trữ cuộc trò chuyện");
    }
  };

  const handleMute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await chatService.toggleMuteConversation(convoId);
      toast.success(res.message);
      fetchConversations();
    } catch {
      toast.error("Lỗi khi thay đổi trạng thái thông báo");
    }
  };



  const handleDeleteConversation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn cuộc trò chuyện với "${name}" cùng tất cả tin nhắn?`)) return;
    try {
      await useChatStore.getState().deleteConversation(convoId);
      toast.success("Đã xóa cuộc trò chuyện");
    } catch {
      toast.error("Lỗi khi xóa cuộc trò chuyện");
    }
  };

  const handleMarkUnread = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await chatService.markAsUnread(convoId);
      toast.success(res.message);
      fetchConversations();
    } catch {
      toast.error("Lỗi khi đánh dấu chưa đọc");
    }
  };

  const handleJoinCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeCall) {
      startGroupCall(convoId, name, activeCall.isVideo);
    }
  };

  return (
    <Card
      key={convoId}
      className={cn(
        "group relative border-none p-3 cursor-pointer transition-smooth hover:bg-muted/60 select-none rounded-xl",
        isActive ? "bg-primary/15 border-l-4 border-primary font-medium" : "glass",
        activeCall && "border border-emerald-500/40 bg-emerald-950/20"
      )}
      onClick={() => onSelect(convoId)}
    >
      <div className="flex items-center gap-3">
        <div className="relative">{leftSection}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3
              className={cn(
                "font-semibold text-sm truncate flex items-center gap-1.5",
                unreadCount && unreadCount > 0 && "text-foreground"
              )}
            >
              {name}
              {activeCall && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/40 shrink-0">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cuộc gọi
                </span>
              )}
              {isMuted && (
                <span title="Đã tắt thông báo">
                  <BellOff className="size-3 text-muted-foreground shrink-0" />
                </span>
              )}
            </h3>

            <span className="text-xs text-muted-foreground">
              {timestamp ? formatOnlineTime(timestamp) : ""}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {activeCall ? (
                <p className="text-xs font-semibold text-emerald-400 truncate flex items-center gap-1">
                  <PhoneCall className="size-3 animate-bounce" />
                  Đang có cuộc gọi...
                </p>
              ) : (
                subtitle
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {activeCall && !isGroupCallActive && (
                <Button
                  size="sm"
                  className="h-6 px-2 text-[10px] rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shrink-0 shadow-sm cursor-pointer"
                  onClick={handleJoinCall}
                >
                  Tham gia
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Thao tác nhanh"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 z-30 select-none">
                  {/* Archive / Unarchive */}
                  <DropdownMenuItem onClick={handleArchive} className="cursor-pointer text-xs">
                    {isArchived ? (
                      <>
                        <ArchiveRestore className="size-3.5 mr-2 text-emerald-500" />
                        Bỏ lưu trữ cuộc trò chuyện
                      </>
                    ) : (
                      <>
                        <Archive className="size-3.5 mr-2 text-amber-500" />
                        Lưu trữ cuộc trò chuyện
                      </>
                    )}
                  </DropdownMenuItem>

                  {/* Mute / Unmute */}
                  <DropdownMenuItem onClick={handleMute} className="cursor-pointer text-xs">
                    {isMuted ? (
                      <>
                        <Bell className="size-3.5 mr-2 text-primary" />
                        Bật thông báo
                      </>
                    ) : (
                      <>
                        <BellOff className="size-3.5 mr-2 text-muted-foreground" />
                        Tắt thông báo
                      </>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleMarkUnread} className="cursor-pointer text-xs">
                    <Mail className="size-3.5 mr-2 text-primary" />
                    Đánh dấu là chưa đọc
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleDeleteConversation}
                    className="cursor-pointer text-xs text-destructive focus:text-destructive font-semibold"
                  >
                    <Trash2 className="size-3.5 mr-2" />
                    Xóa cuộc trò chuyện
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChatCard;
