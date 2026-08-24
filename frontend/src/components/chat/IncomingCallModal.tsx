import { useEffect } from "react";
import { useCallStore } from "@/stores/useCallStore";
import { Phone, PhoneOff, Video } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { Button } from "../ui/button";
import { soundService } from "@/services/soundService";
import { toast } from "sonner";

const IncomingCallModal = () => {
  const { callState, caller, isVideo, answerCall, rejectCall } = useCallStore();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (callState === "incoming") {
      soundService.playIncomingRingtone();
      // Auto timeout after 25 seconds if no answer
      timer = setTimeout(() => {
        toast.info("Cuộc gọi nhỡ (Không có phản hồi)");
        rejectCall();
      }, 25000);
    } else {
      soundService.stopSound();
    }

    return () => {
      if (timer) clearTimeout(timer);
      soundService.stopSound();
    };
  }, [callState, rejectCall]);

  if (callState !== "incoming" || !caller) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-background border border-border/60 rounded-2xl p-6 w-80 sm:w-96 shadow-2xl flex flex-col items-center text-center space-y-5 animate-in zoom-in-95">
        <div className="relative">
          <UserAvatar
            type="chat"
            name={caller.displayName}
            avatarUrl={caller.avatarUrl}
            size="lg"
          />
          <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-md">
            {isVideo ? <Video className="size-4" /> : <Phone className="size-4" />}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-lg">{caller.displayName}</h3>
          <p className="text-sm text-muted-foreground mt-0.5 animate-pulse">
            Đang gọi {isVideo ? "Video" : "Thoại"} cho bạn...
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2 w-full">
          <Button
            variant="destructive"
            className="flex-1 h-12 rounded-xl shadow-lg hover:scale-105 transition-transform cursor-pointer font-bold gap-2 text-xs"
            onClick={rejectCall}
          >
            <PhoneOff className="size-4" />
            <span>Từ chối</span>
          </Button>

          <Button
            className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg hover:scale-105 transition-transform cursor-pointer gap-2 text-xs"
            onClick={answerCall}
          >
            <Phone className="size-4 animate-bounce" />
            <span>Chấp nhận</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
