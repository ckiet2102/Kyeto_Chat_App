import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { authService } from "@/services/authService";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token xác minh không hợp lệ.");
      return;
    }

    authService
      .verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err?.response?.data?.message || "Xác minh email thất bại.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border border-amber-500/30 rounded-2xl shadow-2xl bg-card/90 backdrop-blur-xl">
        <CardContent className="p-8 text-center space-y-6">
          {status === "loading" && (
            <div className="space-y-4">
              <Loader2 className="size-12 text-amber-500 animate-spin mx-auto" />
              <h2 className="text-xl font-bold">Đang xác minh email...</h2>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <CheckCircle2 className="size-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                Xác Minh Thành Công!
              </h2>
              <p className="text-xs text-muted-foreground">{message}</p>
              <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl h-11">
                <Link to="/signin">Đăng nhập ngay</Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <XCircle className="size-16 text-destructive mx-auto" />
              <h2 className="text-2xl font-bold text-destructive">Lỗi Xác Minh</h2>
              <p className="text-xs text-muted-foreground">{message}</p>
              <Button asChild variant="outline" className="w-full rounded-xl border-amber-500/30">
                <Link to="/signin">Quay lại Đăng nhập</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
