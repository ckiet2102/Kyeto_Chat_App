import { useState, useEffect } from "react";
import { Users, MessageSquare, ShieldCheck, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/stats", { withCredentials: true });
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải thống kê Admin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Đang tải dữ liệu Bảng Quản Trị...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto beautiful-scrollbar bg-background space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary" />
          Bảng Điều Khiển Quản Trị Hệ Thống (Admin Dashboard)
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Tổng Người Dùng</span>
            <Users className="size-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{stats?.totalUsers || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Tổng Tin Nhắn</span>
            <MessageSquare className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{stats?.totalMessages || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Tài Khoản Premium</span>
            <DollarSign className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500">{stats?.premiumUsers || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Tài Khoản Free</span>
            <Users className="size-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-black text-foreground">{stats?.freeUsers || 0}</p>
        </div>
      </div>
    </div>
  );
}
