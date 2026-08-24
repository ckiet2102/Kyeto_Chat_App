import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Sparkles, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface ChatSummaryCardProps {
  messages: any[];
}

export default function ChatSummaryCard({ messages }: ChatSummaryCardProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    if (!messages || messages.length === 0) {
      toast.warning("Chưa có tin nhắn để tóm tắt");
      return;
    }

    try {
      setLoading(true);
      const formattedMsgs = messages.slice(-20).map((m) => ({
        senderName: m.senderId?.displayName || "Thành viên",
        content: m.content || "[Media/Tệp]",
      }));

      const res = await api.post("/ai/summarize", { messages: formattedMsgs }, { withCredentials: true });
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tạo tóm tắt hội thoại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (val && !summary) generateSummary();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
          <Sparkles className="size-3.5" />
          Tóm tắt AI
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-5 text-amber-500" />
            Tóm tắt Cuộc trò chuyện (AI Powered)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="size-8 animate-spin text-amber-500" />
              <p className="text-xs text-muted-foreground">AI đang phân tích 20 tin nhắn gần nhất...</p>
            </div>
          ) : (
            <div className="p-4 bg-card rounded-2xl border border-border/50 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                <FileText className="size-4 text-primary" />
                Nội dung tóm tắt chính:
              </div>
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed font-sans">
                {summary}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => generateSummary()} disabled={loading} className="text-xs gap-1.5">
              <Sparkles className="size-3.5" /> Tạo lại
            </Button>
            <Button onClick={() => setOpen(false)} className="text-xs">Đóng</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
