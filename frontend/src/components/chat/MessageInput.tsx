import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation, Participant } from "@/types/chat";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Send, X, CornerDownRight, Edit2, Plus, Image as ImageIcon, Paperclip, Loader2, Mic, MapPin, AtSign, Megaphone } from "lucide-react";
import EmojiPicker from "./EmojiPicker";
import VoiceRecorder from "./VoiceRecorder";
import PollCreator from "./PollCreator";
import LocationPickerModal from "./LocationPickerModal";
import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { userService } from "@/services/userService";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    sendDirectMessage,
    sendGroupMessage,
    replyingToMessage,
    setReplyingToMessage,
    editingMessage,
    setEditingMessage,
    editMessage,
  } = useChatStore();
  const socket = useSocketStore((state) => state.socket);
  const [value, setValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{
    fileUrl: string;
    fileName: string;
    fileSize: string;
    fileType: string;
    isImage: boolean;
  } | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  // Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [showMentionPopover, setShowMentionPopover] = useState<boolean>(false);

  // Location Modal State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSendVoice = async (blob: Blob, duration?: number, extension: string = "webm") => {
    try {
      setUploading(true);
      const filename = `voice-message.${extension}`;
      const formData = new FormData();
      formData.append("file", blob, filename);
      const cloudFile = await chatService.uploadCloudFile(formData);

      const voiceContent = duration && duration > 0 ? `${duration}s` : "";

      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.find((p) => p._id !== user?._id);
        if (otherUser) {
          await sendDirectMessage(otherUser._id, voiceContent, undefined, selectedConvo._id, undefined, cloudFile.fileUrl, filename, cloudFile.fileSize, "voice");
        }
      } else {
        await sendGroupMessage(selectedConvo._id, voiceContent, undefined, undefined, cloudFile.fileUrl, filename, cloudFile.fileSize, "voice");
      }
      toast.success("Đã gửi tin nhắn thoại!");
      setIsRecordingVoice(false);
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
        setAudioStream(null);
      }
    } catch (err) {
      toast.error("Lỗi khi gửi tin nhắn thoại");
    } finally {
      setUploading(false);
    }
  };

  const handleStartRecordingClick = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      toast.error("Vui lòng truy cập trang qua HTTPS hoặc dùng trình duyệt hiện đại để sử dụng Micro.");
      return;
    }
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (cErr) {
        console.warn("Advanced audio constraints failed, falling back to simple audio:", cErr);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      setAudioStream(stream);
      setIsRecordingVoice(true);
    } catch (err: any) {
      console.error("Microphone permission error:", err);
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        toast.error("Bạn đã chặn quyền Micro. Hãy nhấp vào biểu tượng 🔒 ở thanh địa chỉ web để bật lại!");
      } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
        toast.error("Không tìm thấy thiết bị Microphone trên máy tính/điện thoại của bạn!");
      } else {
        toast.error(`Lỗi mở Micro (${err?.name || "Lỗi"}): ${err?.message || "Vui lòng kiểm tra lại thiết bị"}`);
      }
    }
  };

  const handleSendLocation = async (loc: { latitude: number; longitude: number; address: string }) => {
    try {
      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.find((p) => p._id !== user?._id);
        if (otherUser) {
          await sendDirectMessage(
            otherUser._id,
            `📍 ${loc.address}`,
            undefined,
            selectedConvo._id,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            "location",
            loc
          );
        }
      } else {
        await sendGroupMessage(
          selectedConvo._id,
          `📍 ${loc.address}`,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          "location",
          loc
        );
      }
      toast.success("Đã gửi vị trí bản đồ!");
    } catch (err) {
      toast.error("Lỗi khi gửi vị trí bản đồ");
    }
  };

  useEffect(() => {
    if (editingMessage) {
      setValue(editingMessage.content || "");
    }
  }, [editingMessage]);

  if (!user) return null;

  const isGroup = selectedConvo.type === "group";
  const otherUser = isGroup ? null : selectedConvo.participants.find((p) => p._id !== user?._id);
  const isBlockedByMe = !isGroup && otherUser && user && (user.blockedUsers || []).some((id: any) => (typeof id === 'string' ? id : id._id) === otherUser._id);
  const onlyAdminSend = isGroup && selectedConvo.settings?.onlyAdminSend;
  const createdBy = isGroup ? selectedConvo.group?.createdBy?.toString() : null;
  const admins = isGroup
    ? (selectedConvo.admins || []).map((a) =>
      typeof a === "object" ? a._id.toString() : a.toString()
    )
    : [];
  const isOwner = createdBy === user?._id;
  const isAdmin = isOwner || admins.includes(user?._id || "");
  const cannotSend = (onlyAdminSend && !isAdmin) || isBlockedByMe;

  if (isBlockedByMe) {
    return (
      <div className="p-3 bg-card/80 border-t border-border/40 text-center flex items-center justify-center gap-3 backdrop-blur-md">
        <span className="text-xs text-muted-foreground font-medium">
          Bạn đã chặn người dùng này. Bỏ chặn để tiếp tục gửi tin nhắn.
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            if (!otherUser) return;
            try {
              await userService.unblockUser(otherUser._id);
              const updatedBlocked = (user.blockedUsers || []).filter((id: any) => (typeof id === "string" ? id : id._id) !== otherUser._id);
              useAuthStore.getState().setUser({ ...user, blockedUsers: updatedBlocked });
              toast.success(`Đã bỏ chặn người dùng ${otherUser.displayName}`);
            } catch (err) {
              toast.error("Lỗi khi bỏ chặn người dùng");
            }
          }}
          className="h-7 text-xs font-semibold rounded-lg border-amber-500/40 text-amber-600 hover:bg-amber-500/10 cursor-pointer"
        >
          Bỏ chặn
        </Button>
      </div>
    );
  }

  const emitTyping = () => {
    if (!socket || !selectedConvo._id) return;
    socket.emit("typing", { conversationId: selectedConvo._id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", { conversationId: selectedConvo._id });
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    emitTyping();

    // Check for @mention trigger in group chat
    if (isGroup) {
      const lastAtIndex = val.lastIndexOf("@");
      if (lastAtIndex !== -1 && (lastAtIndex === 0 || val[lastAtIndex - 1] === " ")) {
        const query = val.slice(lastAtIndex + 1);
        setMentionQuery(query.toLowerCase());
        setShowMentionPopover(true);
      } else {
        setShowMentionPopover(false);
      }
    }
  };

  const handleSelectMention = (p: Participant) => {
    if (!value) return;
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const newValue = value.slice(0, lastAtIndex) + `@${p.displayName} `;
      setValue(newValue);
      if (!mentionedUserIds.includes(p._id)) {
        setMentionedUserIds([...mentionedUserIds, p._id]);
      }
    }
    setShowMentionPopover(false);
  };

  const handleSelectMentionAll = () => {
    if (!value) return;
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const newValue = value.slice(0, lastAtIndex) + "@moinguoi ";
      setValue(newValue);
      if (!mentionedUserIds.includes("everyone")) {
        setMentionedUserIds([...mentionedUserIds, "everyone"]);
      }
    }
    setShowMentionPopover(false);
  };

  const filteredMembers = isGroup
    ? selectedConvo.participants.filter(
        (p) =>
          p._id !== user._id &&
          (mentionQuery === null ||
            p.displayName.toLowerCase().includes(mentionQuery) ||
            p._id.toLowerCase().includes(mentionQuery))
      )
    : [];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const cloudFile = await chatService.uploadCloudFile(formData);
      setAttachedFile({
        fileUrl: cloudFile.fileUrl,
        fileName: cloudFile.fileName,
        fileSize: cloudFile.fileSize,
        fileType: isImage ? "image" : cloudFile.fileType,
        isImage,
      });
      toast.success(`Đã đính kèm tệp: ${cloudFile.fileName}`);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi đính kèm tệp tin");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const sendMessage = async () => {
    if ((!value.trim() && !attachedFile) || cannotSend || uploading) return;

    const contentText = value.trim();
    const currentAttachment = attachedFile;
    const mentionsToPass = mentionedUserIds;

    setValue("");
    setAttachedFile(null);
    setMentionedUserIds([]);
    setShowMentionPopover(false);

    if (socket && selectedConvo._id) {
      socket.emit("stop-typing", { conversationId: selectedConvo._id });
    }

    try {
      if (editingMessage) {
        await editMessage(editingMessage._id, contentText);
        toast.success("Đã chỉnh sửa tin nhắn");
        return;
      }

      const imgUrl = currentAttachment?.isImage ? currentAttachment.fileUrl : undefined;
      const fileUrl = !currentAttachment?.isImage ? currentAttachment?.fileUrl : undefined;
      const fileName = currentAttachment?.fileName;
      const fileSize = currentAttachment?.fileSize;
      const fileType = currentAttachment?.fileType;

      if (selectedConvo.type === "direct") {
        const participants = selectedConvo.participants;
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(
          otherUser._id,
          contentText,
          imgUrl,
          selectedConvo._id,
          replyingToMessage?._id,
          fileUrl,
          fileName,
          fileSize,
          fileType
        );
      } else {
        await sendGroupMessage(
          selectedConvo._id,
          contentText,
          imgUrl,
          replyingToMessage?._id,
          fileUrl,
          fileName,
          fileSize,
          fileType,
          undefined,
          undefined,
          mentionsToPass
        );
      }

      setReplyingToMessage(null);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  if (cannotSend) {
    return (
      <div className="p-3 bg-muted/40 text-center text-xs text-muted-foreground border-t border-border/40 italic">
        Chỉ Quản trị viên nhóm mới có thể gửi tin nhắn trong cuộc trò chuyện này.
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-card/80 backdrop-blur-md border-t border-border/40 select-none relative">
      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={handleSendLocation}
      />

      {/* Mention Suggestion Popover */}
      {showMentionPopover && (filteredMembers.length > 0 || mentionQuery === null || "moinguoi".includes(mentionQuery || "") || "tat ca".includes(mentionQuery || "")) && (
        <div className="absolute bottom-full left-12 mb-2 w-72 bg-background/95 backdrop-blur-xl border border-amber-500/30 rounded-xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-border/40 bg-muted/40 text-[11px] font-bold text-amber-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AtSign className="size-3.5" />
              Nhắc đến thành viên (Tag member)
            </span>
          </div>

          {/* Option: Tag Everyone (@moinguoi) */}
          {(mentionQuery === null || "moinguoi".includes(mentionQuery || "") || "tat ca".includes(mentionQuery || "") || "everyone".includes(mentionQuery || "")) && (
            <button
              onClick={handleSelectMentionAll}
              className="w-full flex items-center gap-2.5 p-2 text-left hover:bg-amber-500/20 transition-colors text-xs cursor-pointer border-b border-amber-500/30 bg-amber-500/10 group"
            >
              <div className="size-7 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Megaphone className="size-3.5 fill-slate-950 text-slate-950" />
              </div>
              <div className="truncate">
                <p className="font-bold text-amber-500 dark:text-amber-400 truncate flex items-center gap-1">
                  <span>@moinguoi</span>
                  <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 rounded text-amber-400 font-extrabold uppercase">Tất cả</span>
                </p>
                <p className="text-[10px] text-muted-foreground truncate">Thông báo khẩn tới tất cả mọi người trong nhóm</p>
              </div>
            </button>
          )}
          {filteredMembers.map((member) => (
            <button
              key={member._id}
              onClick={() => handleSelectMention(member)}
              className="w-full flex items-center gap-2.5 p-2 text-left hover:bg-amber-500/10 transition-colors text-xs cursor-pointer border-b border-border/20 last:border-0"
            >
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.displayName}
                  className="size-7 rounded-full object-cover"
                />
              ) : (
                <div className="size-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-[10px]">
                  {member.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="truncate">
                <p className="font-semibold text-foreground truncate">{member.displayName}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, true)}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.doc,.docx,.zip,.rar,.txt,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => handleFileSelect(e, false)}
      />

      {/* Uploading Spinner Banner */}
      {uploading && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-xs text-primary border-b border-border/40">
          <Loader2 className="size-3.5 animate-spin" />
          <span>Đang tải tệp đính kèm lên server...</span>
        </div>
      )}

      {/* Attached File Banner */}
      {attachedFile && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-primary/10 text-xs text-primary border-b border-border/40">
          <div className="flex items-center gap-1.5 truncate">
            <Paperclip className="size-3.5" />
            <span>Đã đính kèm:</span>
            <span className="font-semibold truncate max-w-md">{attachedFile.fileName} ({attachedFile.fileSize})</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-5 hover:bg-primary/20 rounded-full"
            onClick={() => setAttachedFile(null)}
          >
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* Reply Banner */}
      {replyingToMessage && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-primary/10 text-xs text-muted-foreground border-b border-border/40">
          <div className="flex items-center gap-1.5 truncate">
            <CornerDownRight className="size-3.5 text-primary" />
            <span>Trả lời:</span>
            <span className="font-medium text-foreground truncate max-w-md">
              "{replyingToMessage.content}"
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-5 hover:bg-primary/10 rounded-full"
            onClick={() => setReplyingToMessage(null)}
          >
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* Edit Banner */}
      {editingMessage && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400 border-b border-border/40">
          <div className="flex items-center gap-1.5 truncate">
            <Edit2 className="size-3.5" />
            <span>Chỉnh sửa tin nhắn:</span>
            <span className="font-medium truncate max-w-md">
              "{editingMessage.content}"
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-5 hover:bg-amber-500/20 rounded-full"
            onClick={() => {
              setEditingMessage(null);
              setValue("");
            }}
          >
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* Voice Recorder Overlay */}
      {isRecordingVoice ? (
        <div className="p-3 border-t border-amber-500/20 bg-card">
          <VoiceRecorder
            initialStream={audioStream}
            onSendVoice={handleSendVoice}
            onCancel={() => {
              setIsRecordingVoice(false);
              if (audioStream) {
                audioStream.getTracks().forEach((track) => track.stop());
                setAudioStream(null);
              }
            }}
          />
        </div>
      ) : (
        /* Input controls container */
        <div className="flex items-center gap-1 sm:gap-1.5 p-2 sm:p-3 pb-safe">
          {/* Left Action Buttons (+, image, sticker, file, voice, location, poll) */}
          <div className="flex items-center gap-0.5 text-muted-foreground shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 sm:p-2 rounded-full hover:bg-muted hover:text-foreground transition-smooth"
              title="Thêm đính kèm"
            >
              <Plus className="size-4" />
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-1.5 sm:p-2 rounded-full hover:bg-muted hover:text-foreground transition-smooth"
              title="Gửi ảnh HD"
            >
              <ImageIcon className="size-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="hidden sm:inline-flex p-1.5 sm:p-2 rounded-full hover:bg-muted hover:text-foreground transition-smooth"
              title="Đính kèm file"
            >
              <Paperclip className="size-4" />
            </button>

            {/* Location Pin Button */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="p-1.5 sm:p-2 rounded-full hover:bg-muted hover:text-amber-500 text-muted-foreground transition-smooth"
              title="Gửi vị trí bản đồ"
            >
              <MapPin className="size-4" />
            </button>

            {/* Voice Recorder Button */}
            <button
              onClick={handleStartRecordingClick}
              className="p-1.5 sm:p-2 rounded-full hover:bg-muted hover:text-foreground text-muted-foreground transition-smooth"
              title="Ghi âm giọng nói"
            >
              <Mic className="size-4" />
            </button>

            {/* Poll Creator Button for Group Chat */}
            {selectedConvo.type === "group" && (
              <PollCreator conversationId={selectedConvo._id} />
            )}
          </div>

          {/* Text Input Pill */}
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              onKeyDown={handleKeyPress}
              value={value}
              onChange={handleInputChange}
              placeholder={
                editingMessage
                  ? t("chat.type_message")
                  : replyingToMessage
                    ? t("chat.type_message")
                    : t("chat.type_message")
              }
              className="w-full h-10 pl-4 pr-10 bg-muted/60 hover:bg-muted focus:bg-background border border-transparent focus:border-amber-500/40 rounded-full text-xs text-foreground placeholder:text-muted-foreground focus:outline-none transition-smooth"
            />
            <div className="absolute right-2 flex items-center">
              <EmojiPicker
                onChange={(emoji: string) => setValue(`${value}${emoji}`)}
              />
            </div>
          </div>

          {/* Circular Send Button */}
          <button
            onClick={sendMessage}
            disabled={(!value.trim() && !attachedFile) || uploading}
            className="size-10 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-smooth shrink-0 font-bold"
            title="Gửi tin nhắn"
          >
            <Send className="size-4 fill-slate-950 text-slate-950 ml-0.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
