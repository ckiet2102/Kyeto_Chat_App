import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, ArrowLeft, CheckCircle2 } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

export function JoinGroupPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoinGroup = async () => {
    if (!inviteCode) return;
    try {
      setLoading(true);
      await api.post(`/conversations/join/${inviteCode}`, {}, { withCredentials: true });
      toast.success("Tham gia nhóm thành công!");
      setJoined(true);
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể tham gia nhóm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border border-amber-500/30 rounded-2xl shadow-2xl bg-card/90 backdrop-blur-xl">
        <CardContent className="p-8 space-y-6 text-center">
          <div className="mx-auto size-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            {joined ? (
              <CheckCircle2 className="size-8 text-green-500" />
            ) : (
              <Users className="size-8" />
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Lời Mời Tham Gia Nhóm Chat
            </h2>
            <p className="text-xs text-muted-foreground">
              Mã mời: <span className="font-mono text-amber-500 font-bold">{inviteCode}</span>
            </p>
          </div>

          {joined ? (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold">
              🎉 Bạn đã gia nhập nhóm thành công! Đang chuyển hướng...
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={handleJoinGroup}
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 gap-2 cursor-pointer"
              >
                <UserPlus className="size-5" />
                {loading ? "Đang tham gia..." : "Tham Gia Nhóm Ngay"}
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full rounded-xl border-amber-500/20 text-xs gap-2"
              >
                <ArrowLeft className="size-4" />
                Quay lại Trang chính
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default JoinGroupPage;
