import { useState } from "react";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams, Link } from "react-router";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải từ 6 ký tự trở lên.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu nhập lại không khớp.");
      return;
    }
    try {
      setLoading(true);
      const res = await authService.resetPassword({ token, newPassword });
      toast.success(res.message);
      navigate("/signin");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Đặt lại mật khẩu không thành công");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border border-amber-500/30 rounded-2xl shadow-2xl bg-card/90 backdrop-blur-xl">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto size-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Lock className="size-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Đặt Lai Mật Khẩu Mới
            </h2>
            <p className="text-xs text-muted-foreground">
              Nhập mật khẩu mới cho tài khoản Kyeto Chat của bạn.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Input
                type="password"
                required
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 text-sm rounded-xl border-amber-500/30 focus-visible:ring-amber-500"
              />
              <Input
                type="password"
                required
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 text-sm rounded-xl border-amber-500/30 focus-visible:ring-amber-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !token}
              className="w-full h-11 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </Button>
          </form>

          <div className="text-center pt-2">
            <Link
              to="/signin"
              className="inline-flex items-center text-xs text-amber-500 hover:text-amber-400 font-semibold gap-1"
            >
              <ArrowLeft className="size-3.5" /> Quay lại Đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
