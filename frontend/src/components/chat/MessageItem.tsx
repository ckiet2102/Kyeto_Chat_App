import { useState } from "react";
import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, ParentMessage, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCallStore } from "@/stores/useCallStore";
import {
  Reply,
  Edit2,
  Trash2,
  CornerDownRight,
  Smile,
  MoreVertical,
  Download,
  Check,
  CheckCheck,
  FileText,
  Pin,
  Bookmark,
  Cloud,
  Forward,
  UserX,
  Users,
  MapPin,
  ExternalLink,
  Eye,
  Megaphone,
  Maximize2,
  Clock,
  PhoneCall,
  PhoneOff,
  Video,
} from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import EmojiPicker from "./EmojiPicker";
import LinkPreviewCard from "./LinkPreviewCard";
import VoiceMessagePlayer from "./VoiceMessagePlayer";
import MessageReadStatusModal from "./MessageReadStatusModal";
import LocationPreviewModal from "./LocationPreviewModal";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";
import ForwardMessageModal from "./ForwardMessageModal";

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus?: "delivered" | "seen";
  onStartMultiSelect?: (messageId: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const QUICK_EMOJIS = ["❤️", "👍", "😂", "🔥", "😮", "🎉"];

const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  onStartMultiSelect,
  isSelectionMode,
  isSelected,
  onToggleSelect,
}: MessageItemProps) => {
  const { user } = useAuthStore();
  const {
    setReplyingToMessage,
    setEditingMessage,
    deleteMessage,
    deleteMessageForSelf,
    toggleReaction,
    togglePinMessageInStore,
  } = useChatStore();

  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [deleteOptionsOpen, setDeleteOptionsOpen] = useState(false);
  const [readStatusModalOpen, setReadStatusModalOpen] = useState(false);
  const [isLocationPreviewOpen, setIsLocationPreviewOpen] = useState(false);

  const renderContentWithMentions = (content: string) => {
    if (!content) return null;

    // Collect participant names & nicknames to match full names correctly
    const participantNames: string[] = ["moinguoi", "everyone", "tatca", "all"];
    if (selectedConvo?.participants) {
      selectedConvo.participants.forEach((p) => {
        if (p.displayName) participantNames.push(p.displayName.trim());
        const nick = (selectedConvo.settings as any)?.nicknames?.[p._id];
        if (nick) participantNames.push(nick.trim());
      });
    }

    // Sort member names by length descending so longer names match first ("Trọng Duy" before "Trọng")
    const sortedNames = Array.from(new Set(participantNames)).filter(Boolean).sort((a, b) => b.length - a.length);

    let pattern: string;
    if (sortedNames.length > 0) {
      const escaped = sortedNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
      pattern = `(@(?:${escaped}|[\\w\\d_À-ỹ]+(?:\\s+[\\w\\d_À-ỹ]+)*))`;
    } else {
      pattern = `(@[\\w\\d_À-ỹ]+(?:\\s+[\\w\\d_À-ỹ]+)*)`;
    }

    const regex = new RegExp(pattern, "gi");
    const parts = content.split(regex);

    const myDisplayName = user?.displayName?.toLowerCase();

    return parts.map((part, i) => {
      if (part && part.startsWith("@")) {
        const rawName = part.slice(1).trim();
        const lowerRaw = rawName.toLowerCase();
        const isEveryone = ["moinguoi", "everyone", "tatca", "all"].includes(lowerRaw);

        if (isEveryone) {
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg text-xs font-extrabold bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-500 dark:text-amber-300 border border-amber-500/50 ring-2 ring-amber-400/30 shadow-xs cursor-pointer select-none animate-pulse"
              title="Đã nhắc đến tất cả mọi người trong nhóm"
            >
              <Megaphone className="size-3 text-amber-400 fill-amber-400" />
              <span>@moinguoi</span>
            </span>
          );
        }

        const isMeMentioned = myDisplayName && lowerRaw.includes(myDisplayName);

        return (
          <span
            key={i}
            className={cn(
              "inline-flex items-center gap-0.5 px-2 py-0.5 mx-0.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer select-none",
              isOwn
                ? "bg-slate-950/20 text-slate-950 dark:bg-white/20 dark:text-white border border-black/15 dark:border-white/25 hover:bg-slate-950/30"
                : isMeMentioned
                  ? "bg-amber-500/25 text-amber-500 dark:text-amber-300 border border-amber-500/40 ring-2 ring-amber-400/40 animate-pulse"
                  : "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 hover:bg-sky-500/25"
            )}
            title={`@${rawName}`}
          >
            <span className="opacity-75 font-mono text-[11px]">@</span>
            <span>{rawName}</span>
          </span>
        );
      }
      return part;
    });
  };

  const senderIdStr =
    typeof message.senderId === "object"
      ? (message.senderId as any)?._id?.toString()
      : message.senderId?.toString();
  const isOwn = message.isOwn ?? (senderIdStr === user?._id?.toString());

  const [showTimestampToggle, setShowTimestampToggle] = useState(false);

  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;
  const next = index - 1 >= 0 ? messages[index - 1] : undefined;

  const nextSenderIdStr =
    typeof next?.senderId === "object"
      ? (next?.senderId as any)?._id?.toString()
      : next?.senderId?.toString();
  const isNextSystem = (next as any)?.type === "system";

  const isLastInCluster =
    !next ||
    isNextSystem ||
    nextSenderIdStr !== senderIdStr ||
    new Date(next.createdAt).getTime() - new Date(message.createdAt).getTime() > 300000;

  const shouldShowTimestamp = isLastInCluster || showTimestampToggle;

  const isShowTime =
    index === messages.length - 1 ||
    !prev ||
    new Date(message.createdAt).getTime() -
    new Date(prev?.createdAt || 0).getTime() >
    600000; // 10 phút

  const isGroupBreak = isShowTime || senderIdStr !== prev?.senderId?.toString();

  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === senderIdStr
  );

  const parentMsg =
    typeof message.parentMessageId === "object"
      ? (message.parentMessageId as ParentMessage)
      : null;

  const handleTogglePin = async () => {
    try {
      togglePinMessageInStore(message._id);
      const res = await chatService.togglePin(message._id);
      toast.success(res.message);
    } catch (error) {
      toast.error("Lỗi khi ghim tin nhắn");
    }
  };

  const handleToggleBookmark = async () => {
    try {
      const res = await chatService.toggleBookmark(message._id);
      toast.success(res.message);
    } catch (error) {
      toast.error("Lỗi khi lưu tin nhắn");
    }
  };

  const handleSaveToCloud = async (
    fileUrl: string,
    fileName: string,
    fileSize?: string,
    fileType?: string
  ) => {
    try {
      const res = await chatService.saveFileToCloud({
        fileUrl,
        fileName,
        fileSize,
        fileType,
      });
      toast.success(res.message || "Đã lưu vào Kyeto Cloud!");
    } catch (error) {
      toast.error("Lỗi khi lưu tệp vào Kyeto Cloud");
    }
  };

  const handleDeleteForSelf = () => {
    deleteMessageForSelf(message._id, selectedConvo._id);
    toast.success("Đã xóa tin nhắn ở phía bạn");
    setDeleteOptionsOpen(false);
  };

  const handleRecallForEveryone = async () => {
    try {
      await deleteMessage(message._id);
      toast.success("Đã thu hồi tin nhắn cho tất cả mọi người");
    } catch (err) {
      toast.error("Lỗi khi thu hồi tin nhắn");
    } finally {
      setDeleteOptionsOpen(false);
    }
  };

  // Group reactions by emoji
  const reactionsGrouped = (message.reactions || []).reduce(
    (acc: Record<string, { count: number; hasUser: boolean }>, r) => {
      const emoji = r.emoji;
      const rUserId = typeof r.userId === "object" ? r.userId._id : r.userId;
      const isMyReaction = rUserId === user?._id;

      if (!acc[emoji]) {
        acc[emoji] = { count: 0, hasUser: false };
      }
      acc[emoji].count += 1;
      if (isMyReaction) {
        acc[emoji].hasUser = true;
      }
      return acc;
    },
    {}
  );

  const rawDate = message.createdAt ? new Date(message.createdAt) : new Date();
  const validDate = isNaN(rawDate.getTime()) ? new Date() : rawDate;
  const timeString = validDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const rawSenderObj = typeof message.senderId === "object" ? message.senderId : null;
  const rawSenderId = rawSenderObj?._id || (typeof message.senderId === "string" ? message.senderId : undefined);
  const senderId = (participant?._id || rawSenderId)?.toString();

  const senderNickname = senderId
    ? (selectedConvo.settings as any)?.nicknames?.[senderId] ||
    (typeof (selectedConvo.settings as any)?.nicknames?.get === "function"
      ? (selectedConvo.settings as any).nicknames.get(senderId)
      : null)
    : null;

  const senderName = senderNickname || participant?.displayName || rawSenderObj?.displayName || "Kyeto";

  const isDirect = selectedConvo.type === "direct";
  const otherUser = isDirect
    ? selectedConvo.participants.find((p) => p._id !== user?._id)
    : null;

  const isOtherUserPrivacyOff =
    isDirect &&
    (otherUser?.showOnlineStatus === false || (otherUser as any)?.activityStatus === false);

  // Single Jumping Avatar: Find the SINGLE LAST/MOST RECENT message read by otherUser in the messages list (newest to oldest)
  const lastReadMessage = isOtherUserPrivacyOff || !otherUser
    ? null
    : (messages || []).find((m) => {
      const readByArray = (m as any).readBy;
      const isReadInArray =
        Array.isArray(readByArray) &&
        readByArray.some((r: any) => {
          const rId = typeof r.userId === "object" ? r.userId?._id : r.userId;
          return rId?.toString() === otherUser._id?.toString();
        });

      const isLastConvoMsgSeen =
        m._id === selectedConvo.lastMessage?._id &&
        (selectedConvo.seenBy || []).some((s: any) => {
          const sId = typeof s === "object" ? s._id : s;
          return sId?.toString() === otherUser._id?.toString();
        });

      return isReadInArray || isLastConvoMsgSeen;
    });

  const lastReadMessageId = lastReadMessage?._id;
  const isLastReadMessage = Boolean(lastReadMessageId && message._id === lastReadMessageId);

  const renderReadReceipt = () => {
    if (!isOwn) return null;

    if (selectedConvo.type === "group") {
      const readCount = message.readBy?.length || 0;
      return (
        <span
          onClick={(e) => {
            e.stopPropagation();
            setReadStatusModalOpen(true);
          }}
          title="Bấm để xem chi tiết trạng thái đọc tin nhắn"
          className="flex items-center gap-1 text-[10px] text-sky-400 font-medium cursor-pointer hover:underline"
        >
          <CheckCheck className="size-3 ml-0.5 text-sky-400" />
          <span>{readCount > 0 ? `Đã xem (${readCount})` : "Đã gửi"}</span>
        </span>
      );
    }

    // Direct message logic
    if (isOtherUserPrivacyOff) {
      return (
        <span title="Đã nhận" className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-medium">
          <Check className="size-3 ml-0.5 text-muted-foreground/60" />
          <span>Đã nhận</span>
        </span>
      );
    }

    if (isLastReadMessage) {
      return null;
    }

    const msgIdx = (messages || []).findIndex((m) => m._id === message._id);
    const lastReadIdx = lastReadMessageId
      ? (messages || []).findIndex((m) => m._id === lastReadMessageId)
      : -1;

    if (lastReadIdx === -1 || (msgIdx !== -1 && msgIdx < lastReadIdx)) {
      return (
        <span title="Đã nhận" className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-medium">
          <Check className="size-3 ml-0.5 text-muted-foreground/60" />
          <span>Đã nhận</span>
        </span>
      );
    }

    return null;
  };

  const isSystemMessage = (message as any).type === "system";

  return (
    <div className="w-full flex flex-col">
      {/* System Message Component */}
      {isSystemMessage && (
        <div className="flex justify-center my-3">
          <span className="px-3 py-1 text-[11px] font-medium text-muted-foreground bg-muted/50 rounded-full border border-border/30">
            {message.content}
          </span>
        </div>
      )}

      {!isSystemMessage && (
        <>
          {/* Time Header Divider */}
          {isShowTime && (
            <div className="flex justify-center my-4 animate-in fade-in duration-200">
              <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-card/80 border border-border/50 text-muted-foreground shadow-2xs backdrop-blur-md">
                {formatMessageTime(new Date(message.createdAt))}
              </span>
            </div>
          )}

          <div
            id={`msg-${message._id}`}
            onClick={() => {
              if (isSelectionMode && onToggleSelect) {
                onToggleSelect(message._id);
              }
            }}
            className={cn(
              "flex gap-2 message-bounce mt-2 group items-end transition-all rounded-xl relative",
              isOwn ? "flex-row-reverse" : "flex-row",
              isSelectionMode && "cursor-pointer"
            )}
          >
            {/* Checkbox when in Multi-Select mode */}
            {isSelectionMode && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSelect) onToggleSelect(message._id);
                }}
                className={cn(
                  "size-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 self-center mx-1",
                  isSelected
                    ? "bg-sky-500 border-sky-500 text-white shadow-xs"
                    : "border-border/60 bg-card hover:border-sky-400"
                )}
              >
                {isSelected && <CheckCheck className="size-3.5 stroke-[3]" />}
              </div>
            )}

            {/* User Avatar */}
            {!isOwn && (
              <div className="w-8 shrink-0">
                {isGroupBreak && (
                  <UserAvatar
                    type="chat"
                    name={senderName}
                    avatarUrl={participant?.avatarUrl ?? undefined}
                  />
                )}
              </div>
            )}

            {/* Message Container */}
            <div
              className={cn(
                "max-w-xs lg:max-w-md space-y-1 flex flex-col",
                isOwn ? "items-end" : "items-start"
              )}
            >
              {/* Group Sender Name */}
              {!isOwn && selectedConvo.type === "group" && isGroupBreak && (
                <span className="text-[11px] font-semibold text-muted-foreground ml-1">
                  {senderName}
                </span>
              )}

              {/* Quote Preview */}
              {parentMsg && (
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-t-xl bg-primary/10 border-l-2 border-primary text-muted-foreground max-w-full truncate",
                    isOwn ? "rounded-bl-xl" : "rounded-br-xl"
                  )}
                >
                  <CornerDownRight className="size-3 text-primary shrink-0" />
                  <span className="italic truncate">{parentMsg.content}</span>
                </div>
              )}

              {/* Helper variable checking if text is auto-generated file text */}
              {(() => {
                const hasAttachment = Boolean(message.imgUrl || message.fileUrl || message.fileType);

                const isAutoGeneratedFileText = hasAttachment && Boolean(
                  !message.content ||
                  message.content.startsWith("Đã lưu từ cuộc trò chuyện:") ||
                  message.content.startsWith("Đã lưu từ") ||
                  message.content.startsWith("Đã gửi tệp:") ||
                  message.content.startsWith("Đã gửi tệp") ||
                  message.content.startsWith("Tệp:") ||
                  message.content.startsWith("Tệp") ||
                  message.content.startsWith("File:") ||
                  message.content.startsWith("Đã gửi hình ảnh:") ||
                  message.content.startsWith("Đã gửi hình ảnh") ||
                  message.content.startsWith("Hình ảnh:") ||
                  message.content === "[Hình ảnh]" ||
                  message.content === "[File]" ||
                  (message.fileName && message.content.toLowerCase().includes(message.fileName.toLowerCase()))
                );

                const isVoiceMessage =
                  message.fileType === "voice" ||
                  (message.fileUrl && message.fileName?.includes("voice")) ||
                  (message.content && (message.content.includes("Voice Message") || message.content.includes("Tin nhắn thoại")));

                let voiceDuration: number | undefined = undefined;
                if (message.content) {
                  const match = message.content.match(/\D*(\d+)\s*s?/);
                  if (match && match[1]) {
                    const parsedSecs = parseInt(match[1], 10);
                    if (!isNaN(parsedSecs) && parsedSecs > 0) {
                      voiceDuration = parsedSecs;
                    }
                  }
                }

                return (
                  <>
                    {/* Image Attachment Preview */}
                    {message.imgUrl && (
                      <div
                        className="flex items-end gap-1.5 cursor-pointer"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setShowTimestampToggle((prev) => !prev);
                        }}
                        title="Nhấp đúp để xem/ẩn thời gian"
                      >
                        <div className="relative rounded-2xl overflow-hidden group/img max-w-xs border border-border/40 shadow-sm">
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                            HD
                          </span>
                          <img
                            src={message.imgUrl}
                            alt="Attachment"
                            className="w-full h-auto max-h-60 object-cover"
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleSaveToCloud(message.imgUrl!, message.fileName || "Image.png", message.fileSize || undefined, "image")}
                              className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white"
                              title="Lưu vào Kyeto Cloud"
                            >
                              <Cloud className="size-4" />
                            </button>
                            <a
                              href={message.imgUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white"
                              title="Lưu về máy"
                            >
                              <Download className="size-4" />
                            </a>
                          </div>
                        </div>

                        {(isAutoGeneratedFileText || !message.content) && shouldShowTimestamp && (
                          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground pb-0.5 shrink-0 animate-in fade-in duration-150">
                            <span>{timeString}</span>
                            {renderReadReceipt()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Voice Message Player */}
                    {isVoiceMessage && message.fileUrl && (
                      <div
                        className="flex items-end gap-1.5 cursor-pointer"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setShowTimestampToggle((prev) => !prev);
                        }}
                        title="Nhấp đúp để xem/ẩn thời gian"
                      >
                        <VoiceMessagePlayer
                          src={message.fileUrl}
                          isOwn={isOwn}
                          initialDuration={voiceDuration}
                          customColor={(selectedConvo.settings as any)?.customColor}
                        />
                        {shouldShowTimestamp && (
                          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground pb-0.5 shrink-0 animate-in fade-in duration-150">
                            <span>{timeString}</span>
                            {renderReadReceipt()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* File Attachment Card Preview (non-voice) */}
                    {message.fileUrl && !message.imgUrl && !isVoiceMessage && (
                      <div
                        className="flex items-end gap-1.5 cursor-pointer"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setShowTimestampToggle((prev) => !prev);
                        }}
                        title="Nhấp đúp để xem/ẩn thời gian"
                      >
                        <div
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl border max-w-xs transition-smooth shadow-xs group/file",
                            isOwn
                              ? "bg-muted/80 dark:bg-muted/40 text-foreground border-border/60"
                              : "bg-card dark:bg-card/90 text-foreground border-border/60"
                          )}
                        >
                          <div className="size-10 rounded-xl bg-muted-foreground/10 text-foreground flex items-center justify-center font-bold text-sm shrink-0">
                            <FileText className="size-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate text-foreground">{message.fileName || "Tệp đính kèm"}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {message.fileSize || "File"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleSaveToCloud(message.fileUrl!, message.fileName || "File", message.fileSize || undefined, message.fileType || undefined)}
                              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Lưu vào Kyeto Cloud"
                            >
                              <Cloud className="size-4" />
                            </button>
                            <a
                              href={message.fileUrl}
                              download={message.fileName || "file"}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Lưu về máy"
                            >
                              <Download className="size-4" />
                            </a>
                          </div>
                        </div>

                        {(isAutoGeneratedFileText || !message.content) && shouldShowTimestamp && (
                          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground pb-0.5 shrink-0 animate-in fade-in duration-150">
                            <span>{timeString}</span>
                            {renderReadReceipt()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Location Pin Card */}
                    {(message.type === "location" || message.location) && (
                      <div
                        className="flex items-end gap-1.5 cursor-pointer"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setShowTimestampToggle((prev) => !prev);
                        }}
                        title="Nhấp đúp để xem/ẩn thời gian"
                      >
                        <div className="rounded-2xl overflow-hidden border border-amber-500/30 bg-card p-3.5 max-w-xs space-y-2.5 shadow-md hover:border-amber-500/60 transition-all">
                          <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                            <div className="size-6 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                              <MapPin className="size-3.5 text-amber-500 animate-bounce" />
                            </div>
                            <span className="truncate text-foreground font-semibold">
                              {message.location?.address || message.content || "Vị trí bản đồ"}
                            </span>
                          </div>

                          {message.location && (
                            <div className="space-y-2">
                              <div className="text-[11px] font-mono text-muted-foreground bg-muted/40 p-2 rounded-xl border border-border/30 flex items-center justify-between">
                                <span>Tọa độ:</span>
                                <span className="font-bold text-amber-500">
                                  {message.location.latitude.toFixed(4)}, {message.location.longitude.toFixed(4)}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setIsLocationPreviewOpen(true)}
                                  className="w-full py-1 h-8 rounded-xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-bold text-[11px] gap-1 cursor-pointer"
                                >
                                  <Maximize2 className="size-3" />
                                  <span>Xem chi tiết</span>
                                </Button>

                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${message.location.latitude},${message.location.longitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center gap-1 w-full py-1 h-8 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-bold text-[11px] hover:from-amber-600 hover:to-yellow-700 transition-colors shadow-2xs"
                                >
                                  <ExternalLink className="size-3" />
                                  <span>Chỉ đường</span>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>

                        {message.location && (
                          <LocationPreviewModal
                            isOpen={isLocationPreviewOpen}
                            onClose={() => setIsLocationPreviewOpen(false)}
                            location={message.location}
                          />
                        )}

                        {shouldShowTimestamp && (
                          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground pb-0.5 shrink-0 animate-in fade-in duration-150">
                            <span>{timeString}</span>
                            {renderReadReceipt()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Call Log Message Card (Image 2 style) */}
                    {message.type === "call_log" && (
                      <div className="flex flex-col">
                        <div
                          className="flex items-end gap-1.5 cursor-pointer"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setShowTimestampToggle((prev) => !prev);
                          }}
                          title="Nhấp đúp để xem/ẩn thời gian"
                        >
                          <Card
                            className={cn(
                              "w-56 xs:w-64 sm:w-72 max-w-[82vw] p-3 sm:p-3.5 rounded-2xl relative shadow-md border transition-all select-none backdrop-blur-md",
                              message.fileName === "missed" || message.fileName === "rejected"
                                ? "bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/30 text-foreground"
                                : "bg-card/90 dark:bg-card/90 border-border/40 text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "size-10 rounded-full flex items-center justify-center shrink-0 shadow-inner",
                                  message.fileName === "missed" || message.fileName === "rejected"
                                    ? "bg-rose-500/20 text-rose-500"
                                    : message.fileType === "video"
                                      ? "bg-sky-500/20 text-sky-500"
                                      : "bg-emerald-500/20 text-emerald-500"
                                )}
                              >
                                {message.fileName === "missed" || message.fileName === "rejected" ? (
                                  <PhoneOff className="size-5" />
                                ) : message.fileType === "video" ? (
                                  <Video className="size-5" />
                                ) : (
                                  <PhoneCall className="size-5" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-xs sm:text-sm leading-snug break-words">
                                  {message.content}
                                </h5>
                                <span className="text-[10px] sm:text-[11px] text-muted-foreground block mt-0.5 font-medium">
                                  {timeString}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const otherParticipant = selectedConvo?.participants.find(
                                  (p) => p._id !== user?._id
                                );
                                const targetUser = otherParticipant || (typeof message.senderId === "object" ? message.senderId : null);
                                if (targetUser && selectedConvo) {
                                  const isVideoCall = message.fileType === "video";
                                  useCallStore.getState().startCall(
                                    targetUser._id,
                                    selectedConvo._id,
                                    isVideoCall,
                                    {
                                      _id: targetUser._id,
                                      displayName: (targetUser as any).displayName || "User",
                                      avatarUrl: (targetUser as any).avatarUrl,
                                    }
                                  );
                                }
                              }}
                              className="mt-2.5 w-full py-1.5 sm:py-2 bg-muted/80 hover:bg-muted dark:bg-muted/60 dark:hover:bg-muted text-foreground font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-border/30 shadow-2xs active:scale-98"
                            >
                              {message.fileType === "video" ? (
                                <Video className="size-3.5 text-sky-500" />
                              ) : (
                                <PhoneCall className="size-3.5 text-emerald-500" />
                              )}
                              <span>Gọi lại</span>
                            </button>
                          </Card>

                          {shouldShowTimestamp && (
                            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground pb-0.5 shrink-0 animate-in fade-in duration-150">
                              <span>{timeString}</span>
                              {renderReadReceipt()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Text Bubble */}
                    {message.content && !isAutoGeneratedFileText && !isVoiceMessage && message.type !== "location" && !message.location && message.type !== "call_log" && (
                      <div className="flex flex-col">
                        <div
                          className="flex items-end gap-1.5 cursor-pointer"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setShowTimestampToggle((prev) => !prev);
                          }}
                          title="Nhấp đúp để xem/ẩn thời gian"
                        >
                          <Card
                            className={cn(
                              "px-4 py-2.5 rounded-2xl relative shadow-xs transition-all border-0 select-text",
                              isOwn
                                ? !((selectedConvo.settings as any)?.customColor) && "bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-medium"
                                : "bg-card dark:bg-card/90 text-foreground border border-border/40",
                              message.deletedAt && "opacity-60 italic bg-muted/50 border-dashed",
                              isSelected && "ring-2 ring-amber-400 ring-offset-2 ring-offset-background"
                            )}
                            style={{
                              backgroundColor: isOwn && (selectedConvo.settings as any)?.customColor ? (selectedConvo.settings as any).customColor : undefined,
                              color: isOwn && (selectedConvo.settings as any)?.customColor ? "#ffffff" : undefined,
                            }}
                          >
                            <p className="text-sm leading-relaxed break-words">
                              {renderContentWithMentions(message.content)}
                            </p>

                            {message.isEdited && !message.deletedAt && (
                              <span className="text-[10px] opacity-70 block text-right mt-0.5">
                                (Đã sửa)
                              </span>
                            )}
                          </Card>

                          {/* Timestamp & Read Status Checkmark */}
                          {shouldShowTimestamp && (
                            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground pb-0.5 shrink-0 animate-in fade-in duration-150">
                              <span>{timeString}</span>
                              {renderReadReceipt()}
                            </div>
                          )}
                        </div>

                        {/* Link Preview Card */}
                        {message.content && message.content.match(/(https?:\/\/[^\s]+)/g) && (
                          <LinkPreviewCard url={message.content.match(/(https?:\/\/[^\s]+)/g)![0]} />
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Avatar "Đã xem" ONLY at bottom right of the single LAST read message bubble */}
              {isOwn && isLastReadMessage && !isOtherUserPrivacyOff && otherUser && (
                <div className="flex justify-end mt-0.5 mr-0.5 animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center gap-1 text-[9.5px] text-slate-300 dark:text-zinc-300 font-medium tracking-tight">
                    <span>Đã xem</span>
                    <UserAvatar
                      name={otherUser.displayName || "User"}
                      avatarUrl={otherUser.avatarUrl ?? undefined}
                      type="chat"
                      className="size-3 text-[6px] ring-1 ring-slate-300/60 dark:ring-zinc-400/60 shadow-2xs shrink-0"
                    />
                  </div>
                </div>
              )}

              {/* Reactions display */}
              {Object.keys(reactionsGrouped).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(reactionsGrouped).map(([emoji, data]) => (
                    <button
                      key={emoji}
                      onClick={() => toggleReaction(message._id, emoji)}
                      className={cn(
                        "flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border transition-all hover:scale-105 shadow-2xs",
                        data.hasUser
                          ? "bg-primary/15 border-primary/40 text-primary font-medium"
                          : "bg-card border-border/60 text-muted-foreground"
                      )}
                    >
                      <span>{emoji}</span>
                      <span className="text-[10px] font-semibold">{data.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Toolbar */}
            {!message.deletedAt && !isSelectionMode && (
              <div
                className={cn(
                  "opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-all duration-200 flex items-center gap-0.5 bg-card/95 backdrop-blur-md border border-border/60 rounded-full px-1 py-0.5 shadow-md z-10 shrink-0 self-center mx-1"
                )}
              >
                {/* Quick Emoji Reaction Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 hover:bg-primary/10 rounded-full text-muted-foreground hover:text-primary transition-colors"
                      title="Thả cảm xúc"
                    >
                      <Smile className="size-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="center"
                    className="w-auto p-1.5 flex items-center gap-1 shadow-xl border-border/60 bg-card/95 backdrop-blur-md z-30"
                  >
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(message._id, emoji)}
                        className="text-base hover:scale-125 transition-transform p-1 rounded-md hover:bg-primary/10"
                      >
                        {emoji}
                      </button>
                    ))}
                    <div className="w-px h-4 bg-border/60 mx-1" />
                    <EmojiPicker
                      onChange={(emoji: string) => toggleReaction(message._id, emoji)}
                    />
                  </PopoverContent>
                </Popover>

                {/* Reply Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 hover:bg-primary/10 rounded-full text-muted-foreground hover:text-primary transition-colors"
                  title="Trả lời"
                  onClick={() => setReplyingToMessage(message)}
                >
                  <Reply className="size-4" />
                </Button>

                {/* More Options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 hover:bg-primary/10 rounded-full text-muted-foreground hover:text-primary transition-colors"
                      title="Tùy chọn khác"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align={isOwn ? "end" : "start"}
                    className="w-44 z-30"
                  >
                    <DropdownMenuItem
                      onClick={() => setForwardModalOpen(true)}
                      className="cursor-pointer text-xs"
                    >
                      <Forward className="size-3.5 mr-2 text-sky-500" />
                      Chuyển tiếp
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleTogglePin} className="cursor-pointer text-xs">
                      <Pin className="size-3.5 mr-2 text-amber-500" />
                      Ghim tin nhắn
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleToggleBookmark} className="cursor-pointer text-xs">
                      <Bookmark className="size-3.5 mr-2 text-primary" />
                      Lưu Bookmark
                    </DropdownMenuItem>

                    {isOwn && (
                      <DropdownMenuItem
                        onClick={() => setEditingMessage(message)}
                        className="cursor-pointer text-xs"
                      >
                        <Edit2 className="size-3.5 mr-2 text-muted-foreground" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      onClick={() => setShowTimestampToggle((prev) => !prev)}
                      className="cursor-pointer text-xs"
                    >
                      <Clock className="size-3.5 mr-2 text-sky-400" />
                      {shouldShowTimestamp ? "Ẩn thời gian" : "Xem thời gian"}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setReadStatusModalOpen(true)}
                      className="cursor-pointer text-xs"
                    >
                      <Eye className="size-3.5 mr-2 text-sky-400" />
                      Chi tiết trạng thái đọc
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setDeleteOptionsOpen(true)}
                      className="cursor-pointer text-xs text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-3.5 mr-2" />
                      Xóa / Thu hồi
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </>
      )}

      {/* Read Status Details Modal */}
      <MessageReadStatusModal
        isOpen={readStatusModalOpen}
        onClose={() => setReadStatusModalOpen(false)}
        messageId={message._id}
      />

      {/* Forward Message Modal */}
      <ForwardMessageModal
        open={forwardModalOpen}
        setOpen={setForwardModalOpen}
        messageToForward={message}
      />

      {/* Delete Options Dialog */}
      <Dialog open={deleteOptionsOpen} onOpenChange={setDeleteOptionsOpen}>
        <DialogContent className="max-w-xs bg-card/95 backdrop-blur-md border-border/40 p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Trash2 className="size-4 text-destructive" />
              Tùy chọn xóa tin nhắn
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Vui lòng chọn hình thức xóa tin nhắn này.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteForSelf}
              className="w-full justify-start text-xs h-9 border-border/50 hover:bg-muted"
            >
              <UserX className="size-3.5 mr-2 text-amber-500" />
              Xóa ở phía tôi
            </Button>

            {isOwn && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRecallForEveryone}
                className="w-full justify-start text-xs h-9 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
              >
                <Users className="size-3.5 mr-2" />
                Thu hồi với tất cả mọi người
              </Button>
            )}

            {onStartMultiSelect && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDeleteOptionsOpen(false);
                  onStartMultiSelect(message._id);
                }}
                className="w-full justify-start text-xs h-9"
              >
                <CheckCheck className="size-3.5 mr-2 text-sky-500" />
                Chọn nhiều tin nhắn để xóa
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageItem;
