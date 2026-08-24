import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Link, Copy, Check, QrCode } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface InviteLinkModalProps {
  conversationId: string;
}

export default function InviteLinkModal({ conversationId }: InviteLinkModalProps) {
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchOrGenerateCode = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/conversations/${conversationId}/invite-code`, {}, { withCredentials: true });
      setInviteCode(res.data.inviteCode);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tạo mã mời tham gia nhóm.");
    } finally {
      setLoading(false);
    }
  };

  const inviteUrl = `${window.location.origin}/join/${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Đã sao chép liên kết mời!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val && !inviteCode) fetchOrGenerateCode();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Link className="size-3.5" />
          Mã mời & QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-5 text-primary" />
            Mã & Link Mời Tham Gia Nhóm
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground py-4">Đang tạo mã mời...</p>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-900 rounded-xl border border-border/40">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(inviteUrl)}`}
                  alt="Group Invite QR Code"
                  className="w-40 h-40 rounded-lg shadow-md"
                />
                <span className="text-xs text-muted-foreground mt-2 font-mono">Mã nhóm: {inviteCode}</span>
              </div>

              <div className="flex items-center gap-2 bg-muted p-2 rounded-xl border border-border/40">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="flex-1 bg-transparent border-none text-xs font-mono text-foreground focus:outline-none"
                />
                <Button size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                  {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  {copied ? "Đã chép" : "Sao chép"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
