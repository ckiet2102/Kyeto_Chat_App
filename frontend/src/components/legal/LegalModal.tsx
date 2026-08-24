import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileText, ShieldCheck, UserCheck, Lock, ShieldAlert, Award, Database, Target } from "lucide-react";

interface LegalModalProps {
  type: "terms" | "privacy" | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LegalModal({ type, isOpen, onClose }: LegalModalProps) {
  if (!type) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border border-amber-500/30 bg-slate-950/95 text-slate-100 backdrop-blur-xl rounded-2xl p-6 sm:p-8">
        
        {type === "terms" && (
          <>
            <DialogHeader className="space-y-2 text-center border-b border-amber-500/20 pb-4">
              <div className="mx-auto size-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FileText className="size-6" />
              </div>
              <DialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                ĐIỀU KHOẢN DỊCH VỤ (TERMS OF SERVICE)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Quy định sử dụng ứng dụng Kyeto Chat App
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4 text-slate-200 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <UserCheck className="size-4" />
                  <h3>1. Chấp nhận điều khoản</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 pl-6 leading-relaxed">
                  Bằng việc đăng ký, truy cập hoặc sử dụng ứng dụng Kyeto Chat App, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản này. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ ngay lập tức.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Lock className="size-4" />
                  <h3>2. Tài khoản người dùng</h3>
                </div>
                <ul className="list-disc list-inside text-xs sm:text-sm text-slate-300 pl-6 space-y-1">
                  <li>Bạn có trách nhiệm bảo mật thông tin tài khoản, mật khẩu và mã OTP xác thực của mình.</li>
                  <li>Mọi hoạt động diễn ra dưới tài khoản của bạn sẽ hoàn toàn thuộc trách nhiệm của bạn.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldAlert className="size-4" />
                  <h3>3. Quy tắc ứng xử khi trò chuyện</h3>
                </div>
                <ul className="list-disc list-inside text-xs sm:text-sm text-slate-300 pl-6 space-y-1">
                  <li>Nghiêm cấm sử dụng Kyeto Chat App để phát tán nội dung đồi trụy, bạo lực, lừa đảo, vi phạm pháp luật hoặc xâm phạm quyền riêng tư của người khác.</li>
                  <li>Không gửi mã độc, spam hoặc can thiệp trái phép vào hệ thống máy chủ và bảo mật của ứng dụng.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Award className="size-4" />
                  <h3>4. Quyền sở hữu trí tuệ</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 pl-6 leading-relaxed">
                  Toàn bộ mã nguồn, giao diện UI/UX, logo và thương hiệu Kyeto Chat App thuộc quyền sở hữu độc quyền của đội ngũ phát triển.
                </p>
              </div>
            </div>
          </>
        )}

        {type === "privacy" && (
          <>
            <DialogHeader className="space-y-2 text-center border-b border-amber-500/20 pb-4">
              <div className="mx-auto size-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldCheck className="size-6" />
              </div>
              <DialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                CHÍNH SÁCH BẢO MẬT (PRIVACY POLICY)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Cam kết bảo vệ dữ liệu cá nhân tại Kyeto Chat App
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4 text-slate-200 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Database className="size-4" />
                  <h3>1. Thu thập thông tin cá nhân</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 pl-6 leading-relaxed">
                  Chúng tôi chỉ thu thập các thông tin cần thiết khi bạn đăng ký tài khoản (như Email, Tên hiển thị, Ảnh đại diện từ Google/GitHub) hoặc thông tin bạn chủ động chia sẻ trong quá trình sử dụng (vị trí GPS, tệp phương tiện).
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Target className="size-4" />
                  <h3>2. Mục đích sử dụng dữ liệu</h3>
                </div>
                <ul className="list-disc list-inside text-xs sm:text-sm text-slate-300 pl-6 space-y-1">
                  <li>Cung cấp, duy trì và nâng cao chất lượng dịch vụ nhắn tin thời gian thực.</li>
                  <li>Xác thực tài khoản qua mã OTP email và hỗ trợ khôi phục mật khẩu an toàn.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Lock className="size-4" />
                  <h3>3. Bảo mật thông tin & E2EE</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 pl-6 leading-relaxed">
                  Dữ liệu tin nhắn và thông tin cá nhân của bạn được mã hóa và bảo vệ bằng các tiêu chuẩn bảo mật hiện đại. Chúng tôi cam kết không mua bán, chia sẻ hoặc trao đổi thông tin cá nhân của bạn với bên thứ ba dưới mọi hình thức, trừ khi có yêu cầu từ cơ quan pháp luật có thẩm quyền.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <UserCheck className="size-4" />
                  <h3>4. Quyền của người dùng</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 pl-6 leading-relaxed">
                  Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa vĩnh viễn tài khoản và dữ liệu cá nhân của mình bất cứ lúc nào thông qua phần Cài đặt hệ thống.
                </p>
              </div>
            </div>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
