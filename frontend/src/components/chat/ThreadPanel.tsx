import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MessageSquare, Send, X, Loader2 } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { toast } from "sonner";
import api from "@/lib/axios";

interface ThreadPanelProps {
  messageId: string;
  onClose: () => void;
}

export default function ThreadPanel({ messageId, onClose }: ThreadPanelProps) {
  const [parent, setParent] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputContent, setInputContent] = useState("");
  const [sending, setSending] = useState(false);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/messages/${messageId}/thread`, { withCredentials: true });
      setParent(res.data.parent);
      setReplies(res.data.replies || []);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải phản hồi chuỗi tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messageId) fetchThread();
  }, [messageId]);

  const handleSendReply = async () => {
    if (!inputContent.trim()) return;

    try {
      setSending(true);
      const res = await api.post(
        `/messages/${messageId}/thread`,
        { content: inputContent.trim() },
        { withCredentials: true }
      );
      setReplies((prev) => [...prev, res.data.reply]);
      setInputContent("");
    } catch (err) {
      console.error(err);
      toast.error("Không thể gửi phản hồi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-background border-l border-border/50 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5 text-primary" />
          <h3 className="font-semibold text-base">Chuỗi phản hồi</h3>
        </div>
        <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 beautiful-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Parent Message Card */}
            {parent && (
              <div className="p-3 bg-primary/5 rounded-2xl border border-primary/20 space-y-2">
                <div className="flex items-center gap-2">
                  <UserAvatar name={parent.senderId?.displayName} avatarUrl={parent.senderId?.avatarUrl} size="sm" />
                  <span className="text-xs font-semibold">{parent.senderId?.displayName}</span>
                </div>
                <p className="text-sm text-foreground">{parent.content}</p>
              </div>
            )}

            <div className="text-xs font-semibold text-muted-foreground uppercase pt-2">
              {replies.length} phản hồi
            </div>

            {/* Replies List */}
            <div className="space-y-3">
              {replies.map((reply, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <UserAvatar name={reply.senderId?.displayName} avatarUrl={reply.senderId?.avatarUrl} size="sm" />
                  <div className="flex-1 bg-muted/40 p-2.5 rounded-2xl border border-border/30">
                    <span className="text-xs font-semibold block mb-0.5">{reply.senderId?.displayName}</span>
                    <p className="text-xs text-foreground">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer Input */}
      <div className="p-3 border-t border-border/40 bg-card flex items-center gap-2">
        <Input
          placeholder="Viết phản hồi..."
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
          className="text-xs h-9"
        />
        <Button size="icon" onClick={handleSendReply} disabled={sending || !inputContent.trim()} className="size-9 rounded-xl shrink-0">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
