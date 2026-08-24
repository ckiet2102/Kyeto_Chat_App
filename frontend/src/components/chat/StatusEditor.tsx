import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Smile, Sparkles } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";

export default function StatusEditor() {
  const { user, setUser } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [emoji, setEmoji] = useState(user?.status?.emoji || "💬");
  const [text, setText] = useState(user?.status?.text || "Đang sẵn sàng trò chuyện");
  const [loading, setLoading] = useState(false);

  const EMOJI_OPTIONS = ["💬", "🔥", "🎧", "☕", "🚀", "💻", "🏝️", "😴", "🎮"];

  const handleSaveStatus = async () => {
    try {
      setLoading(true);
      const res = await api.put("/users/profile", { status: { emoji, text } }, { withCredentials: true });
      setUser(res.data.user || { ...user, status: { emoji, text } });
      toast.success("Đã cập nhật trạng thái cá nhân!");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Không thể cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl">
          <Sparkles className="size-3.5 text-amber-500" />
          {user?.status?.emoji || "💬"} {user?.status?.text || "Đặt trạng thái..."}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Smile className="size-5 text-primary" />
            Cập nhật Trạng thái Cá nhân
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <div className="flex gap-1 overflow-x-auto p-1 bg-muted/60 rounded-xl">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`p-1.5 text-base rounded-lg transition-transform ${emoji === e ? "bg-primary/20 scale-110" : "hover:bg-muted"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <Input
            placeholder="Nội dung trạng thái (VD: Đang làm việc...)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="text-xs h-9"
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveStatus} disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu trạng thái"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
