import { useState } from "react";
import type { Conversation, Participant } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { chatService } from "@/services/chatService";
import { useChatStore } from "@/stores/useChatStore";
import UserAvatar from "./UserAvatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Shield, ShieldAlert, UserMinus, UserPlus, LogOut, Settings, Users, X } from "lucide-react";
import { toast } from "sonner";
import AddMemberModal from "./AddMemberModal";
import InviteLinkModal from "./InviteLinkModal";

interface GroupSettingsDrawerProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
}

const GroupSettingsDrawer = ({
  conversation,
  isOpen,
  onClose,
}: GroupSettingsDrawerProps) => {
  const { user } = useAuthStore();
  const { updateConversation, setActiveConversation } = useChatStore();
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user || conversation.type !== "group") return null;

  const createdBy = conversation.group?.createdBy?.toString();
  const admins = (conversation.admins || []).map((a) =>
    typeof a === "object" ? a._id.toString() : a.toString()
  );

  const isOwner = createdBy === user._id;
  const isAdmin = isOwner || admins.includes(user._id);

  const onlyAdminSend = conversation.settings?.onlyAdminSend ?? false;

  const handleToggleOnlyAdminSend = async (checked: boolean) => {
    try {
      setLoading(true);
      const updated = await chatService.updateGroupSettings(conversation._id, {
        onlyAdminSend: checked,
      });
      updateConversation(updated);
      toast.success(
        checked
          ? "Đã bật chế độ chỉ Quản trị viên mới có thể gửi tin nhắn"
          : "Đã tắt chế độ chỉ Quản trị viên"
      );
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật cài đặt nhóm");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (targetUserId: string, action: "promote" | "demote") => {
    try {
      setLoading(true);
      const updated = await chatService.updateAdminRole(
        conversation._id,
        targetUserId,
        action
      );
      updateConversation(updated);
      toast.success(
        action === "promote"
          ? "Đã thăng cấp Quản trị viên"
          : "Đã hạ cấp Quản trị viên"
      );
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật quyền hạn");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setLoading(true);
      const updated = await chatService.removeMember(conversation._id, memberId);
      updateConversation(updated);
      toast.success("Đã xóa thành viên khỏi nhóm");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi xóa thành viên");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      setLoading(true);
      await chatService.removeMember(conversation._id, user._id);
      setActiveConversation(null);
      useChatStore.setState((state) => ({
        conversations: state.conversations.filter((c) => c._id !== conversation._id),
      }));
      toast.success("Bạn đã rời nhóm");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi rời nhóm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
      />
      <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-background border-l border-border/50 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Settings className="size-5 text-primary" />
          <h3 className="font-semibold text-base">Cài đặt nhóm</h3>
        </div>
        <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 beautiful-scrollbar">
        {/* Info Card */}
        <div className="flex flex-col items-center text-center p-4 bg-muted/40 rounded-xl border border-border/40">
          <UserAvatar type="group" name={conversation.group?.name ?? "Nhóm"} size="lg" />
          <h4 className="font-bold text-lg mt-2">{conversation.group?.name}</h4>
          <span className="text-xs text-muted-foreground mt-1">
            {conversation.participants.length} thành viên
          </span>
        </div>

        {/* Group Settings Section */}
        {isAdmin && (
          <div className="space-y-3">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quyền quản trị
            </h5>

            <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
              <div className="space-y-0.5">
                <span className="text-sm font-medium">Chỉ Admin được gửi tin</span>
                <p className="text-xs text-muted-foreground">
                  Khóa quyền nhắn tin của thành viên thường
                </p>
              </div>
              <Switch
                checked={onlyAdminSend}
                onCheckedChange={handleToggleOnlyAdminSend}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Users className="size-3.5" />
              Thành viên ({conversation.participants.length})
            </h5>
            <div className="flex items-center gap-2">
              <InviteLinkModal conversationId={conversation._id} />
              <AddMemberModal conversation={conversation} />
            </div>
          </div>

          <div className="space-y-2">
            {conversation.participants.map((participant: Participant) => {
              const pId = participant._id.toString();
              const isMemOwner = createdBy === pId;
              const isMemAdmin = isMemOwner || admins.includes(pId);
              const isSelf = pId === user._id;

              return (
                <div
                  key={pId}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors border border-border/30"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar
                      type="chat"
                      name={participant.displayName}
                      avatarUrl={participant.avatarUrl ?? undefined}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">
                          {participant.displayName} {isSelf && "(Bạn)"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mt-0.5">
                        {isMemOwner ? (
                          <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0 h-4">
                            <ShieldAlert className="size-2.5 mr-1 inline" /> Trưởng nhóm
                          </Badge>
                        ) : isMemAdmin ? (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0 h-4">
                            <Shield className="size-2.5 mr-1 inline" /> Quản trị viên
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">
                            Thành viên
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isSelf && (
                    <div className="flex items-center gap-1">
                      {isOwner && !isMemOwner && (
                        <>
                          {isMemAdmin ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:bg-primary/10"
                              title="Hạ cấp Admin"
                              onClick={() => handleUpdateRole(pId, "demote")}
                              disabled={loading}
                            >
                              <UserMinus className="size-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-primary hover:bg-primary/10"
                              title="Thăng cấp Admin"
                              onClick={() => handleUpdateRole(pId, "promote")}
                              disabled={loading}
                            >
                              <UserPlus className="size-3.5" />
                            </Button>
                          )}
                        </>
                      )}

                      {isAdmin && !isMemOwner && (isOwner || !isMemAdmin) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:bg-destructive/10"
                          title="Xóa khỏi nhóm"
                          onClick={() => handleRemoveMember(pId)}
                          disabled={loading}
                        >
                          <UserMinus className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/40 bg-card">
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
          onClick={handleLeaveGroup}
          disabled={loading}
        >
          <LogOut className="size-4" />
          Rời nhóm
        </Button>
      </div>
    </div>
  </>
);
};

export default GroupSettingsDrawer;
