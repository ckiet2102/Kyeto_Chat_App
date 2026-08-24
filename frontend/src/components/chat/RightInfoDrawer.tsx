import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  Edit2,
  Phone,
  Video,
  Search,
  BellOff,
  Star,
  FileText,
  Image as ImageIcon,
  Palette,
  Pin,
  UserX,
  Download,
  Archive,
  Check,
  Camera,
  Loader2,
  Users,
  Trash2,
} from "lucide-react";
import type { Conversation, Participant } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCallStore } from "@/stores/useCallStore";
import { useGroupCallStore } from "@/stores/useGroupCallStore";
import { useChatStore } from "@/stores/useChatStore";
import UserAvatar from "./UserAvatar";
import GroupChatAvatar from "./GroupChatAvatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { toast } from "sonner";
import { userService } from "@/services/userService";
import { chatService } from "@/services/chatService";
import { useTranslation } from "react-i18next";

interface RightInfoDrawerProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
}

const THEME_OPTIONS = [
  { id: "default", name: "Hoàng Kim (Mặc định)", color: "bg-amber-500", hex: "#f59e0b" },
  { id: "emerald", name: "Ngọc Lục Bảo", color: "bg-emerald-500", hex: "#10b981" },
  { id: "sunset", name: "Hoàng Hôn Cam", color: "bg-orange-500", hex: "#f97316" },
  { id: "crimson", name: "Đỏ Hồng Ngọc", color: "bg-rose-500", hex: "#f43f5e" },
  { id: "purple", name: "Huyền Bí Tím", color: "bg-purple-500", hex: "#a855f7" },
  { id: "ocean", name: "Đại Dương Xanh", color: "bg-sky-500", hex: "#0ea5e9" },
];

const WALLPAPER_PRESETS = [
  { id: "none", name: "Mặc định", url: "" },
  { id: "space", name: "Galaxy", url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80" },
  { id: "nature", name: "Thiên nhiên", url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&auto=format&fit=crop&q=80" },
  { id: "cyber", name: "Cyberpunk", url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80" },
];

export function RightInfoDrawer({
  conversation,
  isOpen,
  onClose,
}: RightInfoDrawerProps) {
  const { user } = useAuthStore();
  const { startCall } = useCallStore();
  const { startGroupCall } = useGroupCallStore();
  const { messages, updateConversation } = useChatStore();
  const { t } = useTranslation();
  
  const [isMuted, setIsMuted] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [newOtherNickname, setNewOtherNickname] = useState("");
  const [newMyNickname, setNewMyNickname] = useState("");

  const [showAllImages, setShowAllImages] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [liveOtherUser, setLiveOtherUser] = useState<any>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isUploadingGroupAvatar, setIsUploadingGroupAvatar] = useState(false);
  const [isSavingGroupInfo, setIsSavingGroupInfo] = useState(false);

  const [showMemberNicknameModal, setShowMemberNicknameModal] = useState(false);
  const [selectedMemberForNickname, setSelectedMemberForNickname] = useState<Participant | null>(null);
  const [memberNicknameInput, setMemberNicknameInput] = useState("");
  const [isSavingMemberNickname, setIsSavingMemberNickname] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);

  const handleSaveMemberNickname = async () => {
    if (!selectedMemberForNickname) return;
    try {
      setIsSavingMemberNickname(true);
      const updatedConvo = await chatService.updateMemberNickname(
        conversation._id,
        selectedMemberForNickname._id,
        memberNicknameInput.trim()
      );
      updateConversation(updatedConvo);
      setShowMemberNicknameModal(false);
      toast.success("Đã cập nhật biệt danh thành viên thành công!");
    } catch (error) {
      console.error("Lỗi khi đặt biệt danh", error);
      toast.error("Không thể cập nhật biệt danh thành viên");
    } finally {
      setIsSavingMemberNickname(false);
    }
  };

  const isGroup = conversation.type === "group";
  const otherUser = isGroup
    ? null
    : conversation.participants.find((p) => p._id !== user?._id);

  const userIdStr = user?._id ? user._id.toString() : "";

  const createdByStr = conversation.group?.createdBy
    ? (typeof conversation.group.createdBy === "object"
        ? (conversation.group.createdBy as any)._id?.toString()
        : conversation.group.createdBy.toString())
    : null;

  const adminIds = (conversation.admins || []).map((a: any) =>
    typeof a === "object" ? (a._id ? a._id.toString() : a.toString()) : a.toString()
  );

  const moderatorIds = (conversation.moderators || []).map((m: any) =>
    typeof m === "object" ? (m._id ? m._id.toString() : m.toString()) : m.toString()
  );

  const isMemberOfGroup = isGroup && conversation.participants.some((p: any) => {
    const pId = typeof p === "object" ? (p._id ? p._id.toString() : String(p)) : String(p);
    return pId === userIdStr;
  });

  const isOwner = !!createdByStr && createdByStr === userIdStr;
  const isAdmin = isOwner || adminIds.includes(userIdStr) || moderatorIds.includes(userIdStr);

  const canEditGroup = isGroup && (isMemberOfGroup || isAdmin || isOwner || !createdByStr);

  const handleUploadGroupAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingGroupAvatar(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await chatService.uploadCloudFile(formData);
      if (res.fileUrl) {
        const updatedConvo = await chatService.updateGroupInfo(conversation._id, {
          avatarUrl: res.fileUrl,
        });
        updateConversation(updatedConvo);
        toast.success("Đã cập nhật ảnh nhóm thành công!");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật ảnh nhóm", error);
      toast.error("Không thể cập nhật ảnh đại diện nhóm");
    } finally {
      setIsUploadingGroupAvatar(false);
    }
  };

  const handleSaveGroupName = async () => {
    if (!editedName.trim()) {
      toast.error("Tên nhóm không được để trống");
      return;
    }
    try {
      setIsSavingGroupInfo(true);
      const updatedConvo = await chatService.updateGroupInfo(conversation._id, {
        name: editedName.trim(),
      });
      updateConversation(updatedConvo);
      setIsEditingName(false);
      toast.success("Đã đổi tên nhóm thành công!");
    } catch (error) {
      console.error("Lỗi khi đổi tên nhóm", error);
      toast.error("Không thể đổi tên nhóm");
    } finally {
      setIsSavingGroupInfo(false);
    }
  };

  useEffect(() => {
    if (isOpen && otherUser?._id) {
      userService
        .getUserProfile(otherUser._id)
        .then((freshUser) => {
          if (freshUser) setLiveOtherUser(freshUser);
        })
        .catch(console.error);
    } else {
      setLiveOtherUser(null);
    }
  }, [isOpen, otherUser?._id]);

  if (!isOpen || !user) return null;

  const activeOtherUser = liveOtherUser || otherUser;

  const isBlockedByMe = !isGroup && otherUser && (user.blockedUsers || []).some((id: any) => (typeof id === 'string' ? id : id._id) === otherUser._id);

  const handleCustomColor = async (colorHex: string) => {
    try {
      const updatedConvo = await chatService.updateThemeOrNickname(conversation._id, { customColor: colorHex });
      updateConversation(updatedConvo);
      toast.success("Đã áp dụng màu chủ đề tùy chỉnh!");
    } catch (error) {
      toast.error("Lỗi khi cập nhật màu chủ đề");
    }
  };

  const handleWallpaperChange = async (wallpaperUrl: string) => {
    try {
      const updatedConvo = await chatService.updateThemeOrNickname(conversation._id, { wallpaper: wallpaperUrl });
      updateConversation(updatedConvo);
      toast.success("Đã thay đổi hình nền cuộc trò chuyện!");
    } catch (error) {
      toast.error("Lỗi khi cập nhật hình nền");
    }
  };

  const handleUploadWallpaperFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await chatService.uploadCloudFile(formData);
      if (res.fileUrl) {
        await handleWallpaperChange(res.fileUrl);
      }
    } catch (error) {
      toast.error("Lỗi khi tải ảnh nền lên");
    }
  };

  const currentOtherNickname = !isGroup && otherUser
    ? (conversation.settings as any)?.nicknames?.[otherUser._id] ||
      (typeof (conversation.settings as any)?.nicknames?.get === "function"
        ? (conversation.settings as any).nicknames.get(otherUser._id)
        : null)
    : null;

  const currentMyNickname = user
    ? (conversation.settings as any)?.nicknames?.[user._id] ||
      (typeof (conversation.settings as any)?.nicknames?.get === "function"
        ? (conversation.settings as any).nicknames.get(user._id)
        : null)
    : null;

  const openNicknameModal = () => {
    setNewOtherNickname(currentOtherNickname || "");
    setNewMyNickname(currentMyNickname || "");
    setShowNicknameModal(true);
  };

  const displayName = isGroup
    ? conversation.group?.name || "Nhóm Chat"
    : currentOtherNickname || activeOtherUser?.displayName || "Người dùng";

  const statusQuote = isGroup
    ? `${conversation.participants.length} thành viên`
    : activeOtherUser?.bio || "Tham gia Kyeto Chat";

  const otherUserAvatar = activeOtherUser?.avatarUrl || activeOtherUser?.avatar || undefined;
  const otherUserCover = activeOtherUser?.coverUrl || activeOtherUser?.coverPhoto || activeOtherUser?.cover || undefined;

  // Access current conversation messages safely from store dictionary
  const convoMessageData = messages[conversation._id]?.items;
  const safeMessages = Array.isArray(convoMessageData) ? convoMessageData : [];

  // Filter real shared images from active conversation messages (newest first)
  const sharedImages = [...safeMessages]
    .filter((m) => m?.imgUrl)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((m) => m.imgUrl as string);

  // Filter real shared files from active conversation messages (newest first with full date & time)
  const sharedFiles = [...safeMessages]
    .filter((m) => m?.fileUrl && !m?.imgUrl)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((m) => {
      const d = m.createdAt ? new Date(m.createdAt) : new Date();
      const validDate = isNaN(d.getTime()) ? new Date() : d;
      const timeStr = validDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
      const dateStr = validDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
      return {
        id: m._id,
        name: m.fileName || "Tệp đính kèm",
        size: m.fileSize || "File",
        url: m.fileUrl,
        time: `${timeStr} • ${dateStr}`,
      };
    });

  const pinnedCount = safeMessages.filter((m) => m?.isPinned).length;

  const handleStartCall = (isVideo: boolean) => {
    if (isGroup) {
      const gName = conversation.group?.name || (conversation as any).name || "Cuộc gọi nhóm";
      startGroupCall(conversation._id, gName, isVideo);
      return;
    }
    if (otherUser) {
      startCall(otherUser._id, conversation._id, isVideo, {
        _id: otherUser._id,
        displayName: otherUser.displayName,
        avatarUrl: otherUser.avatarUrl || undefined,
      });
    }
  };

  const handleBlockUser = async () => {
    if (!otherUser) return;
    try {
      setIsBlocking(true);
      if (isBlockedByMe) {
        await userService.unblockUser(otherUser._id);
        const updatedBlocked = (user.blockedUsers || []).filter((id: any) => (typeof id === 'string' ? id : id._id) !== otherUser._id);
        useAuthStore.getState().setUser({ ...user, blockedUsers: updatedBlocked });
        toast.success(`Đã bỏ chặn người dùng ${otherUser.displayName}`);
      } else {
        await userService.blockUser(otherUser._id);
        const updatedBlocked = [...(user.blockedUsers || []), otherUser._id];
        useAuthStore.getState().setUser({ ...user, blockedUsers: updatedBlocked });
        toast.success(`Đã chặn người dùng ${otherUser.displayName}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi thay đổi trạng thái chặn");
    } finally {
      setIsBlocking(false);
    }
  };

  const handleSearchMessages = async () => {
    if (!searchQuery.trim()) return;
    try {
      const results = await chatService.searchMessages(conversation._id, searchQuery);
      setSearchResults(results || []);
      toast.info(`Tìm thấy ${results.length} tin nhắn phù hợp`);
    } catch (error) {
      toast.error("Lỗi khi tìm kiếm tin nhắn");
    }
  };

  const handleSelectSearchResult = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "p-1", "rounded-xl", "bg-primary/10");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "p-1", "rounded-xl", "bg-primary/10");
      }, 3000);
    } else {
      toast.info("Tin nhắn không ở trong vùng xem hiện tại.");
    }
  };

  const handleToggleArchiveConvo = async () => {
    try {
      const res = await chatService.toggleArchiveConversation(conversation._id);
      toast.success(res.message);
      useChatStore.getState().fetchConversations();
    } catch (error) {
      toast.error("Lỗi khi lưu trữ cuộc trò chuyện");
    }
  };

  const handleChangeTheme = async (themeOption: typeof THEME_OPTIONS[0]) => {
    try {
      const updatedConvo = await chatService.updateThemeOrNickname(conversation._id, {
        theme: themeOption.id,
        customColor: themeOption.hex,
      });
      updateConversation(updatedConvo);
      setShowThemeModal(false);
      toast.success("Đã thay đổi chủ đề cuộc trò chuyện!");
    } catch (error) {
      toast.error("Lỗi khi cập nhật chủ đề");
    }
  };

  const handleSaveNickname = async () => {
    try {
      const nicknamePayload: Record<string, string> = {};
      if (otherUser) {
        nicknamePayload[otherUser._id] = newOtherNickname;
      }
      if (user) {
        nicknamePayload[user._id] = newMyNickname;
      }

      const updatedConvo = await chatService.updateThemeOrNickname(conversation._id, {
        nicknames: nicknamePayload,
      });
      updateConversation(updatedConvo);
      setShowNicknameModal(false);
      toast.success("Đã cập nhật biệt danh!");
    } catch (error) {
      toast.error("Lỗi khi đặt biệt danh");
    }
  };

  const handleDeleteConversation = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn cuộc trò chuyện này cùng tất cả tin nhắn?")) return;
    try {
      await useChatStore.getState().deleteConversation(conversation._id);
      toast.success("Đã xóa cuộc trò chuyện");
      onClose();
    } catch {
      toast.error("Lỗi khi xóa cuộc trò chuyện");
    }
  };

  return (
    <>
      {/* Mobile / Tablet Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
      />
      <aside className="fixed inset-y-0 right-0 z-50 lg:static w-full sm:w-[320px] h-full flex flex-col bg-card/95 lg:bg-card/90 border-l border-border/40 backdrop-blur-xl shrink-0 overflow-y-auto beautiful-scrollbar select-none shadow-2xl lg:shadow-none animate-in slide-in-from-right duration-300">
        {/* Header Actions */}
        <div className="p-3 flex items-center justify-between border-b border-border/30">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-smooth"
            title="Đóng"
          >
            <X className="size-5" />
          </button>
          <span className="text-xs font-bold text-foreground">{t("drawer.conversation_info")}</span>
          {isGroup && canEditGroup ? (
            <button
              onClick={() => {
                setEditedName(conversation.group?.name || "");
                setIsEditingName(true);
              }}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-smooth"
              title="Chỉnh sửa tên nhóm"
            >
              <Edit2 className="size-4" />
            </button>
          ) : !isGroup ? (
            <button
              onClick={openNicknameModal}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-smooth"
              title="Đặt biệt danh"
            >
              <Edit2 className="size-4" />
            </button>
          ) : (
            <div className="w-7" />
          )}
        </div>

        {/* Profile Cover & Avatar Banner */}
        <div className="relative">
          <div className="h-28 w-full bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 overflow-hidden relative">
            {otherUserCover ? (
              <img src={otherUserCover} alt="Cover" className="w-full h-full object-cover opacity-90" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-indigo-600 to-purple-600" />
            )}
          </div>
          <div className="flex justify-center -mt-12">
            <div className="relative p-1 rounded-full bg-card shadow-lg group">
              {isGroup ? (
                <GroupChatAvatar
                  participants={conversation.participants}
                  type="chat"
                  avatarUrl={conversation.group?.avatarUrl || (conversation.group as any)?.avatar}
                  groupName={displayName}
                />
              ) : (
                <UserAvatar
                  type="sidebar"
                  name={displayName}
                  avatarUrl={otherUserAvatar}
                />
              )}
              {canEditGroup && (
                <label
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md cursor-pointer hover:scale-110 transition-transform z-20"
                  title="Thay đổi ảnh nhóm"
                >
                  {isUploadingGroupAvatar ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Camera className="size-3.5" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadGroupAvatar}
                    disabled={isUploadingGroupAvatar}
                  />
                </label>
              )}
              {!isGroup && <span className="absolute bottom-1 right-1 size-3.5 rounded-full bg-emerald-500 border-2 border-card" />}
            </div>
          </div>
        </div>

        {/* Name & Quote */}
        <div className="text-center px-4 mt-2">
          {isEditingName ? (
            <div className="flex items-center justify-center gap-1.5 my-1">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveGroupName()}
                className="text-xs font-semibold px-2 py-1.5 rounded-lg bg-muted border border-border text-foreground outline-none focus:ring-1 focus:ring-primary w-48 text-center"
                placeholder="Nhập tên nhóm..."
                autoFocus
              />
              <button
                onClick={handleSaveGroupName}
                disabled={isSavingGroupInfo}
                className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-smooth"
                title="Lưu"
              >
                {isSavingGroupInfo ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-smooth"
                title="Hủy"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <h3 className="font-bold text-base text-foreground flex items-center justify-center gap-1.5">
              <span>{displayName}</span>
              {canEditGroup ? (
                <button
                  onClick={() => {
                    setEditedName(conversation.group?.name || "");
                    setIsEditingName(true);
                  }}
                  className="p-1 rounded-full text-muted-foreground hover:text-primary hover:bg-muted/80 transition-smooth"
                  title="Chỉnh sửa tên nhóm"
                >
                  <Edit2 className="size-3.5" />
                </button>
              ) : (
                <Star className="size-4 text-muted-foreground fill-muted-foreground/30" />
              )}
            </h3>
          )}
          <p className="text-xs text-muted-foreground mt-0.5 italic">"{statusQuote}"</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-4 gap-2 px-4 my-5">
          <button
            onClick={() => handleStartCall(false)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="size-10 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-smooth shadow-xs">
              <Phone className="size-4" />
            </div>
            <span className="text-[11px] text-muted-foreground">{t("drawer.voice_call")}</span>
          </button>

          <button
            onClick={() => handleStartCall(true)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="size-10 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-smooth shadow-xs">
              <Video className="size-4" />
            </div>
            <span className="text-[11px] text-muted-foreground">{t("drawer.video_call")}</span>
          </button>

          <button
            onClick={() => setShowSearchInput(!showSearchInput)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className={`size-10 rounded-full flex items-center justify-center transition-smooth shadow-xs ${
              showSearchInput ? "bg-primary text-primary-foreground" : "bg-muted/80 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
            }`}>
              <Search className="size-4" />
            </div>
            <span className="text-[11px] text-muted-foreground">{t("common.search")}</span>
          </button>

          <button
            onClick={handleToggleArchiveConvo}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="size-10 rounded-full flex items-center justify-center transition-smooth shadow-xs bg-muted/80 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground">
              <Archive className="size-4" />
            </div>
            <span className="text-[11px] text-muted-foreground">
              {conversation.isArchived ? t("drawer.unarchive") : t("drawer.archive")}
            </span>
          </button>
        </div>

        {/* Search Message Box */}
        {showSearchInput && (
          <div className="px-4 mb-4 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchMessages()}
                placeholder={t("drawer.search_placeholder")}
                className="flex-1 h-8 px-3 rounded-xl bg-muted text-xs border border-border/40 focus:outline-none"
              />
              <Button size="sm" onClick={handleSearchMessages} className="h-8 text-xs px-3">
                {t("common.search")}
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="p-2 bg-muted/40 rounded-xl space-y-1.5 max-h-48 overflow-y-auto beautiful-scrollbar">
                {searchResults.map((res) => (
                  <div
                    key={res._id}
                    onClick={() => handleSelectSearchResult(res._id)}
                    className="p-2 rounded-xl bg-card text-[11px] border border-border/40 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all space-y-0.5"
                  >
                    <div className="flex items-center justify-between font-semibold text-primary">
                      <span>{res.senderId?.displayName || "Người dùng"}</span>
                      <span className="text-[9px] text-muted-foreground font-normal">
                        {res.createdAt
                          ? (() => {
                              const d = new Date(res.createdAt);
                              return isNaN(d.getTime())
                                ? ""
                                : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
                            })()
                          : ""}
                      </span>
                    </div>
                    <p className="text-foreground line-clamp-2">{res.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Accordion List Sections */}
        <div className="p-4 space-y-5">
          {/* Photos & Videos (Real Data) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ImageIcon className="size-3.5 text-muted-foreground" />
                {t("drawer.shared_images")} ({sharedImages.length})
              </h4>
              {sharedImages.length > 0 && (
                <button
                  onClick={() => setShowAllImages(!showAllImages)}
                  className="text-[11px] text-primary font-medium hover:underline transition-smooth"
                >
                  {showAllImages ? t("common.collapse") : t("common.view_all")}
                </button>
              )}
            </div>
            {sharedImages.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">{t("drawer.no_images")}</p>
            ) : showAllImages ? (
              <div className="grid grid-cols-4 gap-1.5 mt-2 animate-in fade-in duration-200">
                {sharedImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImg(img)}
                    className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-85 transition-smooth"
                  >
                    <img src={img} alt="Shared" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Shared Files (Real Data) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-muted-foreground" />
                {t("drawer.shared_files")} ({sharedFiles.length})
              </h4>
              {sharedFiles.length > 0 && (
                <button
                  onClick={() => setShowAllFiles(!showAllFiles)}
                  className="text-[11px] text-primary font-medium hover:underline transition-smooth"
                >
                  {showAllFiles ? t("common.collapse") : t("common.view_all")}
                </button>
              )}
            </div>
            {sharedFiles.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">{t("drawer.no_files")}</p>
            ) : showAllFiles ? (
              <div className="space-y-2 mt-2 animate-in fade-in duration-200">
                {sharedFiles.map((file) => (
                  <a
                    key={file.id}
                    href={file.url || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-card border border-border/40 hover:bg-muted/60 transition-smooth group"
                  >
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{file.size} • {file.time}</p>
                    </div>
                    <div className="p-1.5 rounded-full text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                      <Download className="size-3.5" />
                    </div>
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {/* Group Members Section */}
          {isGroup && (
            <div className="border-t border-border/40 pt-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="size-3.5 text-muted-foreground" />
                  {t("drawer.group_members")} ({conversation.participants.length})
                </h4>
                <button
                  onClick={() => setShowAllMembers(!showAllMembers)}
                  className="text-[11px] text-primary font-medium hover:underline transition-smooth"
                >
                  {showAllMembers ? t("common.collapse") : t("common.view_all")}
                </button>
              </div>

              <div className="space-y-1.5 mt-2">
                {(showAllMembers
                  ? conversation.participants
                  : conversation.participants.slice(0, 5)
                ).map((member: Participant) => {
                  const mId = member._id.toString();
                  const memberNick = (conversation.settings as any)?.nicknames?.[mId] ||
                    (typeof (conversation.settings as any)?.nicknames?.get === "function"
                      ? (conversation.settings as any).nicknames.get(mId)
                      : null);

                  const isOwner = createdByStr === mId;
                  const isAdmin = isOwner || adminIds.includes(mId);

                  return (
                    <div
                      key={mId}
                      className="flex items-center justify-between p-1.5 rounded-xl hover:bg-muted/50 transition-smooth group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar
                          type="chat"
                          name={member.displayName}
                          avatarUrl={member.avatarUrl ?? undefined}
                        />
                        <div className="min-w-0 flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold text-foreground truncate">
                              {memberNick || member.displayName}
                            </span>
                            {mId === user?._id && (
                              <span className="text-[10px] text-muted-foreground font-normal">({t("common.member")})</span>
                            )}
                          </div>
                          {memberNick && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              ({member.displayName})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isOwner ? (
                          <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[9px] px-1.5 py-0 h-4 shrink-0">
                            {t("common.owner")}
                          </Badge>
                        ) : isAdmin ? (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] px-1.5 py-0 h-4 shrink-0">
                            {t("common.admin")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground shrink-0">
                            {t("common.member")}
                          </Badge>
                        )}

                        <button
                          onClick={() => {
                            setSelectedMemberForNickname(member);
                            setMemberNicknameInput(memberNick || "");
                            setShowMemberNicknameModal(true);
                          }}
                          className="p-1 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-smooth ml-1"
                          title="Đặt biệt danh nhóm"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conversation Options */}
          <div className="space-y-1 border-t border-border/40 pt-3">
            {!isGroup && otherUser && (
              <button
                onClick={openNicknameModal}
                className="w-full p-2 rounded-xl flex items-center justify-between hover:bg-muted/50 transition-smooth text-xs"
              >
                <div className="flex items-center gap-2.5 text-foreground">
                  <Edit2 className="size-4 text-muted-foreground" />
                  <span>{t("drawer.set_nickname")}</span>
                </div>
                <span className="text-[11px] text-muted-foreground truncate max-w-[110px]">
                  {currentOtherNickname || t("drawer.not_set")}
                </span>
              </button>
            )}

            <button
              onClick={() => setShowThemeModal(true)}
              className="w-full p-2 rounded-xl flex items-center justify-between hover:bg-muted/50 transition-smooth text-xs"
            >
              <div className="flex items-center gap-2.5 text-foreground">
                <Palette className="size-4 text-muted-foreground" />
                <span>{t("drawer.chat_theme")}</span>
              </div>
              <span
                className="size-4 rounded-full border border-black/10 shadow-xs shrink-0 transition-all"
                style={{
                  backgroundColor:
                    (conversation.settings as any)?.customColor ||
                    THEME_OPTIONS.find((t) => t.id === (conversation.settings as any)?.theme)?.hex ||
                    "#f59e0b",
                }}
              />
            </button>

            <button
              onClick={() => {
                setIsMuted(!isMuted);
                toast.success(isMuted ? t("common.success") : t("drawer.muted"));
              }}
              className="w-full p-2 rounded-xl flex items-center justify-between hover:bg-muted/50 transition-smooth text-xs"
            >
              <div className="flex items-center gap-2.5 text-foreground">
                <BellOff className="size-4 text-muted-foreground" />
                <span>{t("drawer.mute_notifications")}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {isMuted ? t("drawer.muted") : t("drawer.on")}
              </span>
            </button>

            <button
              onClick={() => toast.info(`Pinned messages: ${pinnedCount}`)}
              className="w-full p-2 rounded-xl flex items-center justify-between hover:bg-muted/50 transition-smooth text-xs"
            >
              <div className="flex items-center gap-2.5 text-foreground">
                <Pin className="size-4 text-muted-foreground" />
                <span>{t("drawer.pinned_messages")}</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold text-[10px]">
                {pinnedCount}
              </span>
            </button>
          </div>

          {/* Danger Actions */}
          <div className="pt-2 space-y-2">
            {!isGroup && (
              <Button
                variant="outline"
                onClick={handleBlockUser}
                disabled={isBlocking}
                className={cn(
                  "w-full text-xs font-semibold rounded-xl gap-2",
                  isBlockedByMe
                    ? "border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
                    : "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                )}
              >
                <UserX className="size-4" />
                {isBlockedByMe ? t("drawer.unblock_user") : t("drawer.block_user")}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleDeleteConversation}
              className="w-full text-xs font-semibold rounded-xl gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" />
              <span>Xóa cuộc trò chuyện</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Shared Image Lightbox */}
      {selectedImg && (
        <Dialog open={!!selectedImg} onOpenChange={() => setSelectedImg(null)}>
          <DialogContent className="max-w-2xl bg-black/90 border-none p-0 overflow-hidden flex items-center justify-center">
            <img src={selectedImg} alt="Enlarged shared media" className="w-full h-auto max-h-[80vh] object-contain" />
          </DialogContent>
        </Dialog>
      )}

      {/* Theme & Wallpaper Customization Modal */}
      <Dialog open={showThemeModal} onOpenChange={setShowThemeModal}>
        <DialogContent className="max-w-sm bg-card border-border/40 select-none max-h-[85vh] overflow-y-auto beautiful-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Palette className="size-4 text-purple-500" />
              Chủ đề & Hình nền trò chuyện
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {/* Color Presets */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Màu sắc chủ đề</label>
              <div className="grid grid-cols-1 gap-1.5">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleChangeTheme(theme)}
                    className="w-full p-2 rounded-xl border border-border/30 hover:bg-muted/60 flex items-center justify-between text-xs font-medium transition-smooth"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`size-4 rounded-full ${theme.color}`} />
                      <span>{theme.name}</span>
                    </div>
                    {(conversation.settings as any)?.theme === theme.id && (
                      <Check className="size-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Picker */}
            <div className="pt-2 border-t border-border/30">
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Chọn màu tùy chỉnh (Color Picker)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={(conversation.settings as any)?.customColor || "#6366f1"}
                  onChange={(e) => handleCustomColor(e.target.value)}
                  className="size-8 rounded-lg cursor-pointer border border-border/40 bg-transparent p-0"
                />
                <span className="text-xs font-mono text-muted-foreground">
                  {(conversation.settings as any)?.customColor || "Mặc định"}
                </span>
              </div>
            </div>

            {/* Wallpaper Presets */}
            <div className="pt-2 border-t border-border/30">
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Hình nền cuộc trò chuyện</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {WALLPAPER_PRESETS.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => handleWallpaperChange(wp.url)}
                    className="p-2 rounded-xl border border-border/30 hover:bg-muted/60 flex flex-col items-center gap-1.5 text-xs text-center transition-smooth"
                  >
                    <div className="w-full h-12 rounded-lg bg-muted overflow-hidden relative border border-border/20">
                      {wp.url ? (
                        <img src={wp.url} alt={wp.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-card flex items-center justify-center text-[10px] text-muted-foreground">
                          Không nền
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-medium truncate w-full">{wp.name}</span>
                  </button>
                ))}
              </div>

              {/* Upload Custom Wallpaper */}
              <label className="w-full mt-1 px-3 py-2 rounded-xl border border-dashed border-primary/40 hover:bg-primary/5 flex items-center justify-center gap-2 text-xs font-semibold text-primary cursor-pointer transition-smooth">
                <ImageIcon className="size-4" />
                <span>Tải ảnh nền riêng từ máy</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadWallpaperFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nickname Editor Modal */}
      <Dialog open={showNicknameModal} onOpenChange={setShowNicknameModal}>
        <DialogContent className="max-w-sm bg-card border-border/40 select-none">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Edit2 className="size-4 text-primary" />
              Đặt biệt danh cuộc trò chuyện
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Biệt danh đặt ở đây chỉ hiển thị riêng trong cuộc trò chuyện này.
            </p>

            {/* Field 1: Nickname for the Other User */}
            {otherUser && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Biệt danh cho {otherUser.displayName}</span>
                  {currentOtherNickname && (
                    <span className="text-[10px] text-muted-foreground font-normal">Đang đặt: {currentOtherNickname}</span>
                  )}
                </label>
                <input
                  type="text"
                  value={newOtherNickname}
                  onChange={(e) => setNewOtherNickname(e.target.value)}
                  placeholder={`Nhập biệt danh cho ${otherUser.displayName}...`}
                  className="w-full h-9 px-3 rounded-xl bg-muted text-xs border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Field 2: Nickname for Myself */}
            {user && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Biệt danh của bạn ({user.displayName})</span>
                  {currentMyNickname && (
                    <span className="text-[10px] text-muted-foreground font-normal">Đang đặt: {currentMyNickname}</span>
                  )}
                </label>
                <input
                  type="text"
                  value={newMyNickname}
                  onChange={(e) => setNewMyNickname(e.target.value)}
                  placeholder={`Nhập biệt danh hiển thị của chính bạn...`}
                  className="w-full h-9 px-3 rounded-xl bg-muted text-xs border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
              <Button variant="ghost" size="sm" onClick={() => setShowNicknameModal(false)} className="text-xs">
                Hủy
              </Button>
              <Button size="sm" onClick={handleSaveNickname} className="text-xs">
                Lưu biệt danh
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Chỉnh sửa Biệt danh Thành viên trong Nhóm */}
      {showMemberNicknameModal && selectedMemberForNickname && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-card border border-border/50 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Edit2 className="size-4 text-primary" />
                <span>Đặt biệt danh thành viên</span>
              </h3>
              <button
                onClick={() => setShowMemberNicknameModal(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/30">
              <UserAvatar
                type="chat"
                name={selectedMemberForNickname.displayName}
                avatarUrl={selectedMemberForNickname.avatarUrl ?? undefined}
              />
              <div className="min-w-0">
                <p className="font-semibold text-xs text-foreground truncate">
                  {selectedMemberForNickname.displayName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Biệt danh chỉ hiển thị trong nhóm này
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Biệt danh mới:
              </label>
              <input
                type="text"
                value={memberNicknameInput}
                onChange={(e) => setMemberNicknameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveMemberNickname()}
                placeholder="Nhập biệt danh cho thành viên này..."
                className="w-full h-9 px-3 text-xs bg-muted border border-border/50 rounded-xl outline-none focus:ring-1 focus:ring-primary text-foreground"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {memberNicknameInput.trim() !== "" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMemberNicknameInput("");
                  }}
                  className="text-xs text-destructive hover:underline"
                >
                  Xóa biệt danh
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMemberNicknameModal(false)}
                  className="h-8 text-xs"
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveMemberNickname}
                  disabled={isSavingMemberNickname}
                  className="h-8 text-xs gap-1.5"
                >
                  {isSavingMemberNickname ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  Lưu biệt danh
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RightInfoDrawer;
