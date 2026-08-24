import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
  PhoneCall,
} from "lucide-react";
import { chatService } from "@/services/chatService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCallStore } from "@/stores/useCallStore";
import { useChatStore } from "@/stores/useChatStore";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/chat/UserAvatar";
import { useTranslation } from "react-i18next";

interface CallHistoryModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

type SubTab = "all" | "missed";

export function CallHistoryModal({ open, setOpen }: CallHistoryModalProps) {
  const { t } = useTranslation();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState<SubTab>("all");
  const { user } = useAuthStore();
  const { startCall } = useCallStore();
  const { conversations, createConversation } = useChatStore();

  useEffect(() => {
    if (open) {
      loadCallLogs();
    }
  }, [open]);

  const loadCallLogs = async () => {
    try {
      setLoading(true);
      const data = await chatService.getCallLogs();
      setCalls(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const displayedCalls = subTab === "missed"
    ? calls.filter((c) => c.status === "missed")
    : calls;

  const handleCallback = async (call: any) => {
    const isOutgoing = call.caller?._id === user?._id;
    const peer = isOutgoing ? call.receiver : call.caller;
    if (!peer?._id) return;

    // Find existing direct conversation or create one
    const existing = conversations.find(
      (c) => c.type === "direct" && c.participants.some((p) => p._id === peer._id)
    );
    let convoId = existing?._id;
    if (!convoId) {
      await createConversation("direct", "", [peer._id]);
      const updated = useChatStore.getState().conversations;
      const newConvo = updated.find(
        (c) => c.type === "direct" && c.participants.some((p) => p._id === peer._id)
      );
      convoId = newConvo?._id;
    }
    if (!convoId) return;

    startCall(peer._id, convoId, !!call.isVideo, {
      _id: peer._id,
      displayName: peer.displayName || "User",
      avatarUrl: peer.avatarUrl,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border-border/40 select-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Phone className="size-5 text-indigo-500" />
            {t("calls.title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("calls.subtitle")}
          </DialogDescription>
        </DialogHeader>

        {/* Sub Tabs */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-xl">
          {(["all", "missed"] as SubTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                subTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "all" ? t("calls.all") : t("calls.missed")}
            </button>
          ))}
        </div>

        <div className="space-y-2 my-1 max-h-[340px] overflow-y-auto beautiful-scrollbar pr-1">
          {loading ? (
            <p className="text-xs text-center py-6 text-muted-foreground">{t("common.loading")}</p>
          ) : displayedCalls.length > 0 ? (
            displayedCalls.map((call) => {
              const isOutgoing = call.caller?._id === user?._id;
              const peer = isOutgoing ? call.receiver : call.caller;
              const peerName = peer?.displayName || "User";
              const peerAvatar = peer?.avatarUrl;
              const isMissed = call.status === "missed";
              const isCompleted = call.status === "completed";

              return (
                <div
                  key={call._id}
                  className="p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-smooth border border-border/30 flex items-center gap-3"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <UserAvatar
                      type="sidebar"
                      name={peerName}
                      avatarUrl={peerAvatar}
                    />
                    {/* Call direction icon overlay */}
                    <span
                      className={`absolute -bottom-1 -right-1 size-4 rounded-full flex items-center justify-center border border-card ${
                        isMissed
                          ? "bg-red-500"
                          : isOutgoing
                          ? "bg-blue-500"
                          : "bg-emerald-500"
                      }`}
                    >
                      {isMissed ? (
                        <PhoneMissed className="size-2.5 text-white" />
                      ) : isOutgoing ? (
                        <PhoneOutgoing className="size-2.5 text-white" />
                      ) : (
                        <PhoneIncoming className="size-2.5 text-white" />
                      )}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 truncate">
                      {peerName}
                      {call.isVideo && <Video className="size-3 text-purple-500 shrink-0" />}
                    </h4>
                    <p className={`text-[10px] mt-0.5 ${isMissed ? "text-red-400" : "text-muted-foreground"}`}>
                      {isMissed
                        ? t("calls.status_missed")
                        : isOutgoing
                        ? t("calls.status_outgoing")
                        : t("calls.status_incoming")}
                      {" • "}
                      {new Date(call.createdAt).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {isCompleted && call.duration && call.duration !== "00:00" && (
                      <p className="text-[10px] text-emerald-500 font-medium mt-0.5">
                        ⏱ {call.duration}
                      </p>
                    )}
                  </div>

                  {/* Callback Button for missed calls */}
                  {isMissed ? (
                    <Button
                      size="sm"
                      onClick={() => handleCallback(call)}
                      className="h-7 px-2.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30"
                      variant="ghost"
                    >
                      <PhoneCall className="size-3 mr-1" />
                      {t("calls.call_back")}
                    </Button>
                  ) : (
                    <button
                      onClick={() => handleCallback(call)}
                      className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-smooth"
                      title={t("calls.call_back")}
                    >
                      <PhoneCall className="size-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-xs text-muted-foreground">
              <Phone className="size-10 mx-auto mb-2 opacity-40" />
              {subTab === "missed"
                ? t("calls.no_missed_calls")
                : t("calls.no_calls")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CallHistoryModal;
