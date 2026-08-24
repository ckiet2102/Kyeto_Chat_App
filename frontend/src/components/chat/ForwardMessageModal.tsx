import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Send, FileText, CheckCircle2, Circle, Forward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import UserAvatar from "./UserAvatar";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ForwardMessageModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  messageToForward: {
    content?: string | null;
    imgUrl?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    fileSize?: string | null;
    fileType?: string | null;
  } | null;
}

export function ForwardMessageModal({ open, setOpen, messageToForward }: ForwardMessageModalProps) {
  const { conversations } = useChatStore();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [forwarding, setForwarding] = useState(false);
  const [customNote, setCustomNote] = useState("");

  if (!messageToForward) return null;

  // Filter conversations & friends based on search query
  const filteredConversations = (conversations || []).filter((c) => {
    if (c.type === "group") {
      return (c.group?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    }
    const otherUser = c.participants.find((p) => p._id !== user?._id);
    return (otherUser?.displayName || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleSelectTarget = (id: string) => {
    setSelectedTargetIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleForward = async () => {
    if (selectedTargetIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một người nhận hoặc nhóm chat");
      return;
    }

    try {
      setForwarding(true);
      let successCount = 0;

      for (const targetId of selectedTargetIds) {
        // Find conversation
        const targetConvo = conversations.find((c) => c._id === targetId);

        const textContent = customNote.trim()
          ? `${customNote.trim()}\n--- (Chuyển tiếp) ---\n${messageToForward.content || ""}`
          : messageToForward.content || (messageToForward.fileName ? `Chuyển tiếp tệp: ${messageToForward.fileName}` : "Chuyển tiếp hình ảnh");

        if (targetConvo) {
          if (targetConvo.type === "direct") {
            const recipient = targetConvo.participants.find((p) => p._id !== user?._id);
            if (recipient) {
              await chatService.sendDirectMessage(
                recipient._id,
                textContent,
                messageToForward.imgUrl || undefined,
                targetConvo._id,
                undefined,
                messageToForward.fileUrl || undefined,
                messageToForward.fileName || undefined,
                messageToForward.fileSize || undefined,
                messageToForward.fileType || undefined
              );
              successCount++;
            }
          } else {
            // Group conversation
            await chatService.sendGroupMessage(
              targetConvo._id,
              textContent,
              messageToForward.imgUrl || undefined,
              undefined,
              messageToForward.fileUrl || undefined,
              messageToForward.fileName || undefined,
              messageToForward.fileSize || undefined,
              messageToForward.fileType || undefined
            );
            successCount++;
          }
        }
      }

      toast.success(`Đã chuyển tiếp tin nhắn đến ${successCount} cuộc trò chuyện!`);
      setSelectedTargetIds([]);
      setCustomNote("");
      setOpen(false);
    } catch (error) {
      console.error("Lỗi khi chuyển tiếp tin nhắn:", error);
      toast.error("Gặp lỗi khi chuyển tiếp tin nhắn");
    } finally {
      setForwarding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border-border/40 select-none p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-3 border-b border-border/40">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Forward className="size-5 text-sky-500" />
            Chuyển tiếp tin nhắn
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Chọn các cuộc trò chuyện bạn muốn gửi tiếp tin nhắn này.
          </DialogDescription>
        </DialogHeader>

        {/* Message Preview Box */}
        <div className="p-3 mx-4 my-2 rounded-xl bg-muted/40 border border-border/30 text-xs space-y-1.5">
          <p className="text-[10px] font-semibold text-sky-500 flex items-center gap-1">
            <Forward className="size-3" />
            Nội dung chuyển tiếp:
          </p>
          {messageToForward.imgUrl && (
            <img
              src={messageToForward.imgUrl}
              alt="Preview"
              className="size-14 rounded-lg object-cover border border-border/40"
            />
          )}
          {messageToForward.fileUrl && !messageToForward.imgUrl && (
            <div className="flex items-center gap-2 p-2 bg-card rounded-lg border border-border/30">
              <FileText className="size-4 text-sky-500 shrink-0" />
              <span className="truncate font-medium">{messageToForward.fileName || "Tệp tin"}</span>
            </div>
          )}
          {messageToForward.content && (
            <p className="text-foreground line-clamp-2 italic">{messageToForward.content}</p>
          )}
        </div>

        {/* Search Bar */}
        <div className="px-4 py-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm người nhận hoặc nhóm..."
              className="pl-9 h-9 text-xs rounded-xl bg-muted/50 border-border/40 focus:border-sky-500/50"
            />
          </div>
        </div>

        {/* Recipient Target List */}
        <div className="px-4 py-2 max-h-[220px] overflow-y-auto beautiful-scrollbar space-y-1">
          {filteredConversations.length === 0 ? (
            <p className="text-xs text-center py-6 text-muted-foreground">
              Không tìm thấy cuộc trò chuyện nào.
            </p>
          ) : (
            filteredConversations.map((convo) => {
              const isSelected = selectedTargetIds.includes(convo._id);
              const isGroup = convo.type === "group";
              const otherUser = isGroup
                ? null
                : convo.participants.find((p) => p._id !== user?._id);

              const name = isGroup
                ? convo.group?.name || "Nhóm trò chuyện"
                : otherUser
                ? otherUser.displayName
                : "Kyeto Cloud (Tôi)";

              const avatarUrl = isGroup
                ? convo.group?.avatarUrl
                : otherUser?.avatarUrl;

              return (
                <div
                  key={convo._id}
                  onClick={() => toggleSelectTarget(convo._id)}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all",
                    isSelected
                      ? "bg-sky-500/10 border border-sky-500/30"
                      : "hover:bg-muted/60 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      type="chat"
                      name={name}
                      avatarUrl={avatarUrl || undefined}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate flex items-center gap-1">
                        {name}
                        {isGroup && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-muted text-muted-foreground rounded-md font-normal">
                            Nhóm
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <CheckCircle2 className="size-5 text-sky-500 fill-sky-500/20" />
                    ) : (
                      <Circle className="size-5 text-muted-foreground/40" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Optional Note & Send Footer */}
        <div className="p-4 border-t border-border/40 bg-muted/20 space-y-3">
          <Input
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Thêm lời nhắn kèm theo (tùy chọn)..."
            className="h-8 text-xs rounded-xl bg-card border-border/40"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Đã chọn: <strong className="text-sky-500">{selectedTargetIds.length}</strong> cuộc trò chuyện
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-8 text-xs rounded-xl"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleForward}
                disabled={selectedTargetIds.length === 0 || forwarding}
                className="h-8 gap-1.5 text-xs rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20"
              >
                <Send className="size-3.5" />
                {forwarding ? "Đang gửi..." : "Chuyển tiếp"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ForwardMessageModal;
