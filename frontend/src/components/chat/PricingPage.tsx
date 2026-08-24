import { Button } from "../ui/button";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { toast } from "sonner";

export default function PricingPage() {
  const handleUpgrade = (planName: string) => {
    toast.success(`Cảm ơn bạn đã lựa chọn gói ${planName}! Đang chuyển hướng đến cổng thanh toán...`);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto beautiful-scrollbar bg-background space-y-6 max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-foreground flex items-center justify-center gap-2">
          <Crown className="size-6 text-amber-500" />
          Bảng giá & Gói Dịch vụ Kyeto Chat
        </h2>
        <p className="text-xs text-muted-foreground">Nâng cấp trải nghiệm trò chuyện với đầy đủ tính năng AI, E2EE và lưu trữ không giới hạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* FREE */}
        <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="p-2 rounded-xl bg-muted w-fit text-xs font-bold">MIỄN PHÍ</div>
            <h3 className="text-xl font-bold text-foreground">Gói Miễn Phí</h3>
            <div className="text-3xl font-black text-foreground">0đ <span className="text-xs font-normal text-muted-foreground">/tháng</span></div>
            <ul className="space-y-2 text-xs text-muted-foreground pt-2">
              <li className="flex items-center gap-2"><Check className="size-4 text-emerald-500" /> Nhắn tin 1-1 & Chat nhóm</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-emerald-500" /> Mã hóa đầu cuối E2EE</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-emerald-500" /> Lưu trữ Kyeto Cloud 1GB</li>
            </ul>
          </div>
          <Button variant="outline" className="w-full text-xs rounded-xl">Đang sử dụng</Button>
        </div>

        {/* PREMIUM */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-500/10 to-card border-2 border-amber-500/50 shadow-xl flex flex-col justify-between space-y-4 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-[10px] font-black text-black uppercase tracking-wider">
            Phổ biến nhất
          </div>
          <div className="space-y-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 w-fit text-xs font-bold flex items-center gap-1">
              <Zap className="size-3.5" /> PREMIUM
            </div>
            <h3 className="text-xl font-bold text-foreground">Gói Cao Cấp</h3>
            <div className="text-3xl font-black text-amber-500">99.000đ <span className="text-xs font-normal text-muted-foreground">/tháng</span></div>
            <ul className="space-y-2 text-xs text-foreground pt-2">
              <li className="flex items-center gap-2"><Check className="size-4 text-amber-500" /> Mọi tính năng Gói Miễn Phí</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-amber-500" /> Trợ lý AI Gemini không giới hạn</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-amber-500" /> Ghi âm & Quay video thời lượng dài</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-amber-500" /> Dịch thuật tin nhắn đa ngôn ngữ</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-amber-500" /> Lưu trữ Kyeto Cloud 50GB</li>
            </ul>
          </div>
          <Button onClick={() => handleUpgrade("Premium")} className="w-full text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold">
            Nâng cấp Premium
          </Button>
        </div>

        {/* ENTERPRISE */}
        <div className="p-6 rounded-3xl bg-card border border-purple-500/30 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 w-fit text-xs font-bold flex items-center gap-1">
              <Sparkles className="size-3.5" /> ENTERPRISE
            </div>
            <h3 className="text-xl font-bold text-foreground">Doanh Nghiệp</h3>
            <div className="text-3xl font-black text-purple-400">299.000đ <span className="text-xs font-normal text-muted-foreground">/tháng</span></div>
            <ul className="space-y-2 text-xs text-muted-foreground pt-2">
              <li className="flex items-center gap-2"><Check className="size-4 text-purple-400" /> Mọi tính năng Gói Premium</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-purple-400" /> Tùy chỉnh thương hiệu (Custom Branding)</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-purple-400" /> Kênh phát sóng & Cộng đồng lớn</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-purple-400" /> Lưu trữ Cloud không giới hạn</li>
            </ul>
          </div>
          <Button onClick={() => handleUpgrade("Enterprise")} variant="outline" className="w-full text-xs rounded-xl border-purple-500/40 text-purple-400 hover:bg-purple-500/10">
            Liên hệ Doanh nghiệp
          </Button>
        </div>
      </div>
    </div>
  );
}
