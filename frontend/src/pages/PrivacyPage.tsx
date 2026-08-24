import { ArrowLeft, ShieldCheck, Database, Target, Lock, UserCheck } from "lucide-react";
import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 md:p-10">
      <Card className="w-full max-w-3xl border border-amber-500/30 rounded-2xl shadow-2xl bg-card/90 backdrop-blur-xl">
        <CardContent className="p-6 sm:p-10 space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-3 border-b border-amber-500/20 pb-6">
            <div className="mx-auto size-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
              <ShieldCheck className="size-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              CHÍNH SÁCH BẢO MẬT
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Kyeto Chat App - Cam kết bảo mật dữ liệu và quyền riêng tư người dùng.
            </p>
          </div>

          {/* Section 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Database className="size-5" />
              <h2>1. Thu thập thông tin cá nhân</h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed pl-7">
              Chúng tôi chỉ thu thập các thông tin cần thiết khi bạn đăng ký tài khoản (như Email, Tên hiển thị, Ảnh đại diện từ Google/GitHub) hoặc thông tin bạn chủ động chia sẻ trong quá trình sử dụng (vị trí GPS, tệp phương tiện).
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Target className="size-5" />
              <h2>2. Mục đích sử dụng dữ liệu</h2>
            </div>
            <ul className="list-disc list-inside text-sm text-slate-300 leading-relaxed pl-7 space-y-1.5">
              <li>Cung cấp, duy trì và nâng cao chất lượng dịch vụ nhắn tin thời gian thực.</li>
              <li>Xác thực tài khoản qua mã OTP email và hỗ trợ khôi phục mật khẩu an toàn.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Lock className="size-5" />
              <h2>3. Bảo mật thông tin & E2EE</h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed pl-7">
              Dữ liệu tin nhắn và thông tin cá nhân của bạn được mã hóa và bảo vệ bằng các tiêu chuẩn bảo mật hiện đại. Chúng tôi cam kết không mua bán, chia sẻ hoặc trao đổi thông tin cá nhân của bạn với bên thứ ba dưới mọi hình thức, trừ khi có yêu cầu từ cơ quan pháp luật có thẩm quyền.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <UserCheck className="size-5" />
              <h2>4. Quyền của người dùng</h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed pl-7">
              Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa vĩnh viễn tài khoản và dữ liệu cá nhân của mình bất cứ lúc nào thông qua phần Cài đặt hệ thống.
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
              to="/terms"
              className="text-amber-500 hover:text-amber-400 font-semibold underline underline-offset-4 transition-colors"
            >
              Điều khoản Dịch vụ ➔
            </Link>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
export default PrivacyPage;
