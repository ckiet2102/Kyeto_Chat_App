import { useEffect } from "react";
import { useGroupCallStore } from "@/stores/useGroupCallStore";
import { Phone, PhoneOff, Video, Users } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { Button } from "../ui/button";
import { soundService } from "@/services/soundService";
import { toast } from "sonner";

export default function IncomingGroupCallModal() {
  const {
    incomingGroupCall,
    joinIncomingGroupCall,
    rejectIncomingGroupCall,
  } = useGroupCallStore();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (incomingGroupCall) {
      soundService.playIncomingRingtone();
      // Auto timeout after 25 seconds if no answer
      timer = setTimeout(() => {
        toast.info("Cuộc gọi nhóm đã kết thúc (Không có phản hồi)");
        rejectIncomingGroupCall();
      }, 25000);
    } else {
      soundService.stopSound();
    }

    return () => {
      if (timer) clearTimeout(timer);
      soundService.stopSound();
    };
  }, [incomingGroupCall, rejectIncomingGroupCall]);

  if (!incomingGroupCall) return null;

  const { caller, groupName, isVideo } = incomingGroupCall;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-background border border-amber-500/40 rounded-2xl p-6 w-80 sm:w-96 shadow-2xl flex flex-col items-center text-center space-y-5 animate-in zoom-in-95">
        <div className="relative">
          <UserAvatar
            type="chat"
            name={caller.displayName}
            avatarUrl={caller.avatarUrl}
            size="lg"
          />
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1.5 rounded-full shadow-md">
            <Users className="size-4" />
          </div>
        </div>

        <div>
          <h3 className="font-extrabold text-lg bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Cuộc gọi nhóm đến
          </h3>
          <p className="text-sm font-semibold text-foreground mt-1">
            Được gọi bởi <span className="text-amber-400 font-bold">{caller.displayName}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1.5 bg-muted/80 px-3 py-1.5 rounded-xl border border-border/50 font-medium">
            Nhóm: <span className="font-bold text-foreground">{groupName || "Kyeto Group"}</span> ({isVideo ? "Gọi Video" : "Gọi Voice"})
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2 w-full">
          <Button
            variant="destructive"
            className="flex-1 h-12 rounded-xl shadow-lg hover:scale-105 transition-transform cursor-pointer font-bold gap-2 text-xs"
            onClick={rejectIncomingGroupCall}
          >
            <PhoneOff className="size-4" />
            <span>Từ chối</span>
          </Button>

          <Button
            className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg hover:scale-105 transition-transform cursor-pointer gap-2 text-xs"
            onClick={joinIncomingGroupCall}
          >
            {isVideo ? <Video className="size-4 animate-bounce" /> : <Phone className="size-4 animate-bounce" />}
            <span>Tham gia</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
