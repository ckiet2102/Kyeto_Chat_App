import { useState, useEffect, useRef } from "react";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { KeyRound, Mail, ArrowLeft, ShieldCheck, RefreshCw, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";

export function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // Handle countdown timer for Resend OTP
  useEffect(() => {
    let interval: any = null;
    if (step === 2 && resendTimer > 0) {
      setCanResend(false);
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Step 1: Submit Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Vui lòng nhập địa chỉ email");
      return;
    }
    try {
      setLoading(true);
      const res = await authService.forgotPassword(email.trim());
      toast.success(res.message || "Mã OTP 6 số đã được gửi đến email của bạn!");
      setStep(2);
      setResendTimer(60);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Địa chỉ email không tồn tại trong hệ thống!");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!canResend || loading) return;
    try {
      setLoading(true);
      const res = await authService.forgotPassword(email.trim());
      toast.success(res.message || "Đã gửi lại mã OTP 6 số!");
      setResendTimer(60);
      setCanResend(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể gửi lại mã OTP");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP 6 Digit Inputs
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Pasted full OTP code
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted.length === 6) {
        const digits = pasted.split("");
        setOtpDigits(digits);
        otpInputRefs.current[5]?.focus();
        return;
      }
    }
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    // Move to next input box automatically
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2 & 3: Submit OTP + New Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      toast.error("Vui lòng nhập đầy đủ 6 chữ số mã OTP");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);
      const res = await authService.resetPassword({
        email: email.trim(),
        otp: fullOtp,
        newPassword,
      });
      toast.success(res.message || "Đặt lại mật khẩu thành công!");
      setStep(3);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border border-amber-500/30 rounded-2xl shadow-2xl bg-card/90 backdrop-blur-xl">
        <CardContent className="p-8 space-y-6">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto size-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
              {step === 1 && <KeyRound className="size-7 animate-pulse" />}
              {step === 2 && <ShieldCheck className="size-7 text-amber-400" />}
              {step === 3 && <CheckCircle2 className="size-7 text-emerald-400" />}
            </div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              {step === 1 && "Quên Mật Khẩu"}
              {step === 2 && "Xác Thực Mã OTP"}
              {step === 3 && "Thành Công!"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {step === 1 && "Nhập Gmail đã đăng ký để nhận mã OTP xác thực 6 chữ số."}
              {step === 2 && `Mã OTP 6 số đã được gửi tới ${email}`}
              {step === 3 && "Mật khẩu của bạn đã được cập nhật thành công."}
            </p>
          </div>

          {/* Step 1: Input Email */}
          {step === 1 && (
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 size-4 text-amber-500/60" />
                  <Input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 text-sm rounded-xl border-amber-500/30 focus-visible:ring-amber-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-[1.01] transition-all"
              >
                {loading ? "Đang gửi mã OTP..." : "Gửi Mã OTP Xác Thực"}
              </Button>
            </form>
          )}

          {/* Step 2: Input 6-Digit OTP & New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              
              {/* 6 Digit OTP Inputs */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-300">Nhập mã OTP 6 chữ số</label>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={!canResend || loading}
                    className={`text-xs flex items-center gap-1 font-semibold transition-colors ${
                      canResend
                        ? "text-amber-500 hover:text-amber-400 cursor-pointer"
                        : "text-muted-foreground cursor-not-allowed opacity-70"
                    }`}
                  >
                    <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
                    {canResend ? "Gửi lại mã OTP" : `Gửi lại sau (${resendTimer}s)`}
                  </button>
                </div>

                <div className="flex justify-between gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="size-11 sm:size-12 text-center text-lg font-bold rounded-xl border border-amber-500/30 bg-background/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-amber-400 shadow-inner transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* New Password Form */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 size-4 text-amber-500/60" />
                    <Input
                      type="password"
                      required
                      placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 h-11 text-sm rounded-xl border-amber-500/30 focus-visible:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 size-4 text-amber-500/60" />
                    <Input
                      type="password"
                      required
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-11 text-sm rounded-xl border-amber-500/30 focus-visible:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-[1.01] transition-all"
              >
                {loading ? "Đang xử lý..." : "Xác Thực OTP & Đổi Mật Khẩu"}
              </Button>
            </form>
          )}

          {/* Step 3: Success Screen */}
          {step === 3 && (
            <div className="space-y-4 pt-2 text-center">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
                Mật khẩu của bạn đã được cập nhật thành công! Hãy đăng nhập lại để tiếp tục sử dụng Kyeto Chat.
              </div>
              <Button
                type="button"
                onClick={() => navigate("/signin")}
                className="w-full h-11 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Chuyển Đến Trang Đăng Nhập
              </Button>
            </div>
          )}

          {/* Navigation Link */}
          <div className="text-center pt-2">
            <Link
              to="/signin"
              className="inline-flex items-center text-xs text-amber-500 hover:text-amber-400 font-semibold gap-1 transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Quay lại Đăng nhập
            </Link>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
