import { useGroupCallStore } from "@/stores/useGroupCallStore";
import { Phone, Video, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";

interface ActiveCallBannerProps {
  groupId: string;
  groupName: string;
  isVideo: boolean;
  callerName?: string;
}

export default function ActiveCallBanner({
  groupId,
  groupName,
  isVideo,
  callerName,
}: ActiveCallBannerProps) {
  const { startGroupCall, isGroupCallActive } = useGroupCallStore();

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    startGroupCall(groupId, groupName || "Cuộc gọi nhóm", isVideo);
  };

  return (
    <div className="mx-3 my-2 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-slate-900/80 border border-emerald-500/50 backdrop-blur-md flex items-center justify-between shadow-lg shadow-emerald-950/20 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex items-center justify-center size-9 rounded-full bg-emerald-500 text-slate-950 font-bold shrink-0 shadow-md">
          <span className="absolute size-full rounded-full bg-emerald-400 animate-ping opacity-40" />
          {isVideo ? <Video className="size-4 z-10" /> : <Phone className="size-4 z-10" />}
        </div>
        <div className="min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs font-bold text-emerald-400 truncate">Cuộc gọi đang diễn ra...</p>
          </div>
          <p className="text-xs font-semibold text-foreground truncate mt-0.5">
            {groupName || "Nhóm Kyeto"}
          </p>
          {callerName && (
            <p className="text-[10px] text-muted-foreground truncate">
              Bởi {callerName}
            </p>
          )}
        </div>
      </div>

      {!isGroupCallActive && (
        <Button
          size="sm"
          className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 shadow-md gap-1.5 cursor-pointer hover:scale-105 transition-transform"
          onClick={handleJoin}
        >
          <span>Tham gia</span>
          <ArrowRight className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
