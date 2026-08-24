import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "../ui/label";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router";
import { useState } from "react";
import { LegalModal } from "@/components/legal/LegalModal";

const signInSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function SigninForm({ className, ...props }: React.ComponentProps<"div">) {
  const { signIn, loading } = useAuthStore();
  const navigate = useNavigate();
  const [legalModalType, setLegalModalType] = useState<"terms" | "privacy" | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    }
    return "https://kyeto-backend.onrender.com/api";
  };
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormValues) => {
    setAuthError(null);
    const { username, password } = data;
    const result = await signIn(username, password);
    if (result?.success) {
      navigate("/");
    } else if (result?.error) {
      setAuthError(result.error);
    }
  };

  return (
    <div
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <Card className="overflow-hidden p-0 border border-amber-500/30 dark:border-amber-500/25 shadow-2xl shadow-amber-500/10 rounded-2xl bg-card/90 backdrop-blur-xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="p-6 md:p-8"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-6">
              {/* header - logo */}
              <div className="flex flex-col items-center text-center gap-2">
                <a
                  href="/"
                  className="mx-auto block w-fit text-center"
                >
                  <img
                    src="/kyeto.png"
                    alt="logo"
                    className="size-16 object-contain filter drop-shadow-md"
                  />
                </a>

                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent tracking-tight drop-shadow-sm">Kyeto</h1>
                <p className="text-muted-foreground text-balance text-sm">
                  Đăng nhập vào tài khoản Kyeto của bạn
                </p>
              </div>

              {/* Error Alert Box */}
              {authError && (
                <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-semibold text-center animate-in fade-in duration-200">
                  ⚠️ {authError}
                </div>
              )}

              {/* username */}
              <div className="flex flex-col gap-3">
                <Label
                  htmlFor="username"
                  className="block text-sm font-medium"
                >
                  Tên đăng nhập
                </Label>
                <Input
                  type="text"
                  id="username"
                  autoComplete="username"
                  placeholder="kyeto"
                  className="rounded-xl border-amber-500/25 dark:border-amber-500/20 focus-visible:ring-amber-500 focus-visible:border-amber-500"
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-destructive text-sm">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* password */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="block text-sm font-medium"
                  >
                    Mật khẩu
                  </Label>
                  <a
                    href="/forgot-password"
                    className="text-xs text-amber-500 hover:text-amber-400 font-medium underline underline-offset-4"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <Input
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  className="rounded-xl border-amber-500/25 dark:border-amber-500/20 focus-visible:ring-amber-500 focus-visible:border-amber-500"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-destructive text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* nút đăng nhập */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 rounded-xl h-11 text-sm tracking-wide cursor-pointer border border-amber-300/40"
                disabled={isSubmitting || loading}
              >
                {isSubmitting || loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="size-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : (
                  "Đăng nhập"
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-amber-500/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-medium">
                    Hoặc đăng nhập với
                  </span>
                </div>
              </div>

              {/* OAuth Social Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`${getApiUrl()}/auth/google`}
                  className="w-full rounded-xl border border-amber-500/20 hover:bg-amber-500/10 text-xs font-semibold h-10 inline-flex items-center justify-center transition-colors bg-background text-foreground"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </a>

                <a
                  href={`${getApiUrl()}/auth/github`}
                  className="w-full rounded-xl border border-amber-500/20 hover:bg-amber-500/10 text-xs font-semibold h-10 inline-flex items-center justify-center transition-colors bg-background text-foreground"
                >
                  <svg className="mr-2 h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              </div>

              <div className="text-center text-sm">
                Chưa có tài khoản?{" "}
                <a
                  href="/signup"
                  className="font-bold text-amber-500 hover:text-amber-400 dark:text-amber-400 dark:hover:text-amber-300 underline underline-offset-4 transition-colors"
                >
                  Đăng ký
                </a>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block overflow-hidden">
            <img
              src="/bannersgn.png"
              alt="Image"
              className="w-full h-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
      <LegalModal
        type={legalModalType}
        isOpen={!!legalModalType}
        onClose={() => setLegalModalType(null)}
      />
      <div className="text-xs text-balance px-6 text-center text-muted-foreground mt-4">
        Bằng cách tiếp tục, bạn đồng ý với{" "}
        <button
          type="button"
          onClick={() => setLegalModalType("terms")}
          className="text-amber-500 hover:text-amber-400 dark:text-amber-400 font-semibold underline underline-offset-4 cursor-pointer transition-colors"
        >
          Điều khoản dịch vụ
        </button>{" "}
        và{" "}
        <button
          type="button"
          onClick={() => setLegalModalType("privacy")}
          className="text-amber-500 hover:text-amber-400 dark:text-amber-400 font-semibold underline underline-offset-4 cursor-pointer transition-colors"
        >
          Chính sách bảo mật
        </button>{" "}
        của chúng tôi.
      </div>
    </div>
  );
}
