import { useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, KeyRound } from "lucide-react";
import { useNavigate } from "react-router";

export function TwoFactorVerify() {
  const [code, setCode] = useState("");
  const { validate2FALogin, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    const ok = await validate2FALogin(code);
    if (ok) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border border-amber-500/30 rounded-2xl shadow-2xl bg-card/90 backdrop-blur-xl">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto size-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <ShieldCheck className="size-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Xác minh 2FA
            </h2>
            <p className="text-xs text-muted-foreground">
              Nhập mã 6 chữ số từ ứng dụng Authenticator để hoàn tất đăng nhập.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 size-5 text-amber-500/60" />
              <Input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="000 000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="pl-11 h-12 text-center text-2xl font-mono tracking-widest rounded-xl border-amber-500/30 focus-visible:ring-amber-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full h-11 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              {loading ? "Đang xác thực..." : "Xác nhận Đăng Nhập"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
