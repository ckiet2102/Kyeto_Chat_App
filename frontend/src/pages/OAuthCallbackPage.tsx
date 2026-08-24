import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { setAccessToken, fetchMe } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      if (token) {
        setAccessToken(token);
        await fetchMe();
        useChatStore.getState().fetchConversations();
        toast.success("Đăng nhập bằng mạng xã hội thành công! 🎉");
        navigate("/");
      } else {
        toast.error("Đăng nhập mạng xã hội thất bại.");
        navigate("/signin");
      }
    };
    handleAuth();
  }, [token, setAccessToken, fetchMe, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-10 text-amber-500 animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">
          Đang xác thực tài khoản OAuth của bạn...
        </p>
      </div>
    </div>
  );
}
