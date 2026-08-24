import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCheck, Eye, Clock, Loader2, User as UserIcon } from "lucide-react";
import { chatService } from "@/services/chatService";

interface ReadUser {
  userId: {
    _id: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
  };
  readAt: string;
}

interface DeliveredUser {
  _id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
}

interface MessageReadStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string | null;
}

export default function MessageReadStatusModal({
  isOpen,
  onClose,
  messageId,
}: MessageReadStatusModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [readBy, setReadBy] = useState<ReadUser[]>([]);
  const [deliveredTo, setDeliveredTo] = useState<DeliveredUser[]>([]);

  useEffect(() => {
    if (!isOpen || !messageId) return;

    let isMounted = true;
    setLoading(true);

    chatService
      .getMessageReadStatus(messageId)
      .then((data) => {
        if (isMounted) {
          setReadBy(data.readBy || []);
          setDeliveredTo(data.deliveredTo || []);
        }
      })
      .catch((err) => console.error("Lỗi lấy trạng thái đọc:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, messageId]);

  const formatReadTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }) + `, ${date.toLocaleDateString("vi-VN")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-amber-500/20 bg-background/95 backdrop-blur-xl rounded-2xl">
        <DialogHeader className="p-4 border-b border-border/40 bg-muted/30">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <CheckCheck className="size-5 text-sky-400" />
            Chi tiết tin nhắn (Message Info)
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Loader2 className="size-7 text-amber-500 animate-spin" />
            <p className="text-xs text-muted-foreground">Đang tải thông tin trạng thái...</p>
          </div>
        ) : (
          <div className="p-4">
            <Tabs defaultValue="read" className="w-full">
              <TabsList className="grid grid-cols-2 w-full bg-muted/60 p-1 rounded-xl border border-border/40">
                <TabsTrigger
                  value="read"
                  className="rounded-lg text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 flex items-center justify-center gap-1.5"
                >
                  <Eye className="size-3.5" />
                  Đã xem ({readBy.length})
                </TabsTrigger>
                <TabsTrigger
                  value="delivered"
                  className="rounded-lg text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 flex items-center justify-center gap-1.5"
                >
                  <Clock className="size-3.5" />
                  Đã nhận / Chưa xem ({deliveredTo.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="read" className="mt-3 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {readBy.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Chưa có ai trong nhóm mở xem tin nhắn này.
                  </p>
                ) : (
                  readBy.map((item, idx) => (
                    <div
                      key={item.userId?._id || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/40 hover:bg-amber-500/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {item.userId?.avatarUrl ? (
                          <img
                            src={item.userId.avatarUrl}
                            alt={item.userId.displayName}
                            className="size-9 rounded-full object-cover border border-border/50"
                          />
                        ) : (
                          <div className="size-9 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                            <UserIcon className="size-4" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {item.userId?.displayName || "Thành viên"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            @{item.userId?.username || "user"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-medium text-sky-400">
                        <CheckCheck className="size-3.5" />
                        <span>{formatReadTime(item.readAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="delivered" className="mt-3 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {deliveredTo.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Tất cả thành viên trong nhóm đã xem tin nhắn này! 🎉
                  </p>
                ) : (
                  deliveredTo.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/40 hover:bg-amber-500/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="size-9 rounded-full object-cover border border-border/50"
                          />
                        ) : (
                          <div className="size-9 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                            <UserIcon className="size-4" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-foreground">{user.displayName}</p>
                          <p className="text-[10px] text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>

                      <span className="text-[11px] font-medium text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Đã gửi đến thiết bị
                      </span>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
