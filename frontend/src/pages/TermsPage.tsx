import { ArrowLeft, FileText, ShieldAlert, UserCheck, Lock, Award } from "lucide-react";
import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";

export function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 md:p-10">
      <Card className="w-full max-w-3xl border border-amber-500/30 rounded-2xl shadow-2xl bg-card/90 backdrop-blur-xl">
        <CardContent className="p-6 sm:p-10 space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-3 border-b border-amber-500/20 pb-6">
            <div className="mx-auto size-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
              <FileText className="size-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              ĐIỀU KHOẢN DỊCH VỤ
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Kyeto Chat App - Quy định và điều khoản sử dụng nền tảng nhắn tin bảo mật.
            </p>
          </div>

          {/* Section 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <UserCheck className="size-5" />
              <h2>1. Chấp nhận điều khoản</h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed pl-7">
              Bằng việc đăng ký, truy cập hoặc sử dụng ứng dụng <strong>Kyeto Chat App</strong>, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản này. Nếu không đồng ý với bất kỳ phần nào, vui lòng ngừng sử dụng dịch vụ ngay lập tức.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Lock className="size-5" />
              <h2>2. Tài khoản người dùng</h2>
            </div>
            <ul className="list-disc list-inside text-sm text-slate-300 leading-relaxed pl-7 space-y-1.5">
              <li>Bạn có trách nhiệm bảo mật thông tin tài khoản, mật khẩu và mã OTP xác thực của mình.</li>
              <li>Mọi hoạt động diễn ra dưới tài khoản của bạn sẽ hoàn toàn thuộc trách nhiệm của bạn.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <ShieldAlert className="size-5" />
              <h2>3. Quy tắc ứng xử khi trò chuyện</h2>
            </div>
            <ul className="list-disc list-inside text-sm text-slate-300 leading-relaxed pl-7 space-y-1.5">
              <li>Nghiêm cấm sử dụng Kyeto Chat App để phát tán nội dung đồi trụy, bạo lực, lừa đảo, vi phạm pháp luật hoặc xâm phạm quyền riêng tư của người khác.</li>
              <li>Không gửi mã độc, spam hoặc can thiệp trái phép vào hệ thống máy chủ và bảo mật của ứng dụng.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Award className="size-5" />
              <h2>4. Quyền sở hữu trí tuệ</h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed pl-7">
              Toàn bộ mã nguồn, giao diện UI/UX, logo và thương hiệu <strong>Kyeto Chat App</strong> thuộc quyền sở hữu độc quyền của đội ngũ phát triển Kyeto.
            </p>
          </div>

          {/* Footer Navigation */}
          <div className="border-t border-amber-500/20 pt-6 flex justify-between items-center text-xs">
            <Link
              to="/signup"
              className="inline-flex items-center text-amber-500 hover:text-amber-400 font-semibold gap-1 transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Quay lại Trang Đăng ký
            </Link>
            <Link
              to="/privacy"
              className="text-amber-500 hover:text-amber-400 font-semibold underline underline-offset-4 transition-colors"
            >
              Chính sách Bảo mật ➔
            </Link>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
export default TermsPage;
