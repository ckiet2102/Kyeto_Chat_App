import { useEffect, useRef, useState } from "react";
import {
  Cloud,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  Sparkles,
  Loader2,
  CheckSquare,
  Square,
  Trash2,
  X,
  CheckCheck,
  MoreVertical,
  Forward,
} from "lucide-react";
import { chatService } from "@/services/chatService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/chat/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ForwardMessageModal from "@/components/chat/ForwardMessageModal";
import { useTranslation } from "react-i18next";

interface SelfMessage {
  _id: string;
  content: string | null;
  imgUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: string | null;
  fileType?: string | null;
  createdAt: string;
  conversationId?: string;
}

export function KyetoCloudChatPanel() {
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const { t } = useTranslation();

  const [messages, setMessages] = useState<SelfMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Selection mode states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Forward message states
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState<SelfMessage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    initSelfChat();
  }, []);

  useEffect(() => {
    if (!isSelectionMode) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSelectionMode]);

  // Real-time socket updates for new messages in Kyeto Cloud
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit("join-room", conversationId);

    const handleNewMessage = (msg: SelfMessage) => {
      const msgConvoId = typeof msg.conversationId === "object"
        ? (msg.conversationId as any)._id
        : msg.conversationId;

      if (msgConvoId === conversationId || !msgConvoId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [socket, conversationId]);

  const initSelfChat = async () => {
    try {
      setLoading(true);
      const convo = await chatService.getSelfConversation();
      setConversationId(convo._id);
      const { messages: msgs } = await chatService.fetchMessages(convo._id);
      setMessages(msgs as SelfMessage[]);
    } catch (err) {
      console.error("Khởi tạo Kyeto Cloud thất bại:", err);
      toast.error("Không thể kết nối đến không gian Kyeto Cloud");
    } finally {
      setLoading(false);
    }
  };

  const getOrFetchConvoId = async () => {
    if (conversationId) return conversationId;
    try {
      const convo = await chatService.getSelfConversation();
      setConversationId(convo._id);
      return convo._id;
    } catch (err) {
      console.error("Lấy conversationId thất bại:", err);
      return null;
    }
  };

  const sendText = async () => {
    if (!text.trim()) return;
    const content = text.trim();
    setText("");

    const currentConvoId = await getOrFetchConvoId();
    if (!currentConvoId) {
      toast.error("Lỗi khởi tạo cuộc trò chuyện cá nhân");
      return;
    }

    try {
      setSending(true);
      const msg = await chatService.sendSelfMessage({ content, conversationId: currentConvoId });
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    } catch (err) {
      console.error("Gửi tin nhắn thất bại:", err);
      toast.error("Lỗi khi gửi ghi chú");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  const handleFileUpload = async (file: File) => {
    const currentConvoId = await getOrFetchConvoId();
    if (!currentConvoId) {
      toast.error("Chưa kết nối được không gian Kyeto Cloud");
      return;
    }

    try {
      setSending(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversationId", currentConvoId);

      const msg = await chatService.sendSelfFile(formData);
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      toast.success(`Đã tải lên Kyeto Cloud: ${file.name}`);
    } catch (err) {
      console.error("Tải file thất bại:", err);
      toast.error("Lỗi khi tải file lên Kyeto Cloud");
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  // Selection mode helpers
  const handleStartDeleteMode = (initialMessageId: string) => {
    setIsSelectionMode(true);
    setSelectedIds([initialMessageId]);
  };

  const toggleSelectMessage = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === messages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(messages.map((m) => m._id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} mục đã chọn khỏi Kyeto Cloud?`)) {
      return;
    }

    try {
      setDeleting(true);
      await chatService.deleteSelfMessagesBatch(selectedIds);
      setMessages((prev) => prev.filter((m) => !selectedIds.includes(m._id)));
      toast.success(`Đã xóa ${selectedIds.length} mục khỏi Kyeto Cloud`);
      setSelectedIds([]);
      setIsSelectionMode(false);
    } catch (err) {
      console.error("Xóa thất bại:", err);
      toast.error("Lỗi khi xóa các mục đã chọn");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenForwardModal = (msg: SelfMessage) => {
    setMessageToForward(msg);
    setForwardModalOpen(true);
  };

  const formatTime = (date: string) => {
    const d = date ? new Date(date) : new Date();
    const valid = isNaN(d.getTime()) ? new Date() : d;
    return valid.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const formatDate = (date: string) => {
    const d = date ? new Date(date) : new Date();
    const valid = isNaN(d.getTime()) ? new Date() : d;
    return valid.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: SelfMessage[] }[] = [];
  for (const msg of messages) {
    const date = formatDate(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date, msgs: [msg] });
    }
  }

  const isImageFile = (type?: string | null, url?: string | null) => {
    if (!type && !url) return false;
    const checkStr = (type || url || "").toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].some((ext) => checkStr.includes(ext));
  };

  return (
    <>
      <div
        className="flex flex-col h-full bg-background/50 relative overflow-hidden select-none"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/40 bg-card/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="size-10 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Cloud className="size-5 text-white" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 size-3.5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                Kyeto Cloud
                <span className="text-[10px] font-normal px-1.5 py-0.5 bg-sky-500/10 text-sky-500 rounded-full border border-sky-500/20">
                  {t("kyeto_cloud.personal_space")}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                {isSelectionMode
                  ? `Selected ${selectedIds.length} / ${messages.length}`
                  : t("kyeto_cloud.subtitle")}
              </p>
            </div>
          </div>

          {/* Header Action Toolbar */}
          <div className="flex items-center gap-2">
            {sending && (
              <div className="flex items-center gap-1.5 text-xs text-sky-500 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20 animate-pulse">
                <Loader2 className="size-3.5 animate-spin" />
                Đang lưu...
              </div>
            )}

            {isSelectionMode && (
              <div className="flex items-center gap-2">
                {/* Condition: Only show "Chọn tất cả" / "Bỏ chọn tất cả" when selectedIds.length >= 2 */}
                {selectedIds.length >= 2 && (
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground transition-smooth border border-border/40"
                  >
                    <CheckSquare className="size-3.5 text-sky-500" />
                    {selectedIds.length === messages.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </button>
                )}

                <button
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.length === 0 || deleting}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all shadow-sm",
                    selectedIds.length > 0
                      ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 cursor-pointer"
                      : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                  )}
                >
                  {deleting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  Xóa đã chọn ({selectedIds.length})
                </button>

                <button
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedIds([]);
                  }}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
                  title="Hủy chế độ chọn"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 beautiful-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-xs text-muted-foreground">
                <Cloud className="size-10 mx-auto mb-2 opacity-30 animate-pulse" />
                Đang tải không gian cá nhân...
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="size-20 rounded-3xl bg-gradient-to-br from-sky-400/20 to-indigo-500/20 flex items-center justify-center border border-sky-500/20">
                <Cloud className="size-10 text-sky-400 opacity-60" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">
                  Không gian cá nhân của bạn
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Gửi ghi chú, lưu link, chia sẻ ảnh và tài liệu chỉ với chính mình. Mọi thứ được lưu trữ an toàn.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {["📝 Ghi chú", "🔗 Link", "📁 File", "🖼️ Ảnh"].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 text-xs bg-muted/50 rounded-full text-muted-foreground border border-border/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedMessages.map(({ date, msgs }) => (
                <div key={date}>
                  {/* Date separator */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-border/30" />
                    <span className="text-[10px] text-muted-foreground px-2 py-0.5 bg-muted/30 rounded-full">
                      {date}
                    </span>
                    <div className="flex-1 h-px bg-border/30" />
                  </div>

                  <div className="space-y-2">
                    {msgs.map((msg) => {
                      const isSelected = selectedIds.includes(msg._id);

                      const hasAttachment = Boolean(msg.imgUrl || msg.fileUrl || msg.fileType);
                      const isAutoGeneratedFileText = hasAttachment && Boolean(
                        !msg.content ||
                        msg.content.startsWith("Đã lưu từ cuộc trò chuyện:") ||
                        msg.content.startsWith("Đã lưu từ") ||
                        msg.content.startsWith("Đã gửi tệp:") ||
                        msg.content.startsWith("Đã gửi tệp") ||
                        msg.content.startsWith("Tệp:") ||
                        msg.content.startsWith("Tệp") ||
                        msg.content.startsWith("File:") ||
                        msg.content.startsWith("Đã gửi hình ảnh:") ||
                        msg.content.startsWith("Đã gửi hình ảnh") ||
                        msg.content.startsWith("Hình ảnh:") ||
                        msg.content === "[Hình ảnh]" ||
                        msg.content === "[File]" ||
                        (msg.fileName && msg.content.toLowerCase().includes(msg.fileName.toLowerCase()))
                      );

                      const isDocFile = msg.fileUrl && !msg.imgUrl && !isImageFile(msg.fileType, msg.fileUrl);

                      return (
                        <div
                          key={msg._id}
                          onClick={() => {
                            if (isSelectionMode) toggleSelectMessage(msg._id);
                          }}
                          className={cn(
                            "flex items-end gap-2 justify-end group transition-all duration-200 relative",
                            isSelectionMode && "cursor-pointer"
                          )}
                        >
                          {/* Hover 3-Dots Action Menu (when not in selection mode) */}
                          {!isSelectionMode && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center mr-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="p-1.5 rounded-full hover:bg-card border border-border/40 text-muted-foreground hover:text-foreground shadow-xs transition-colors"
                                    title="Tùy chọn tin nhắn"
                                  >
                                    <MoreVertical className="size-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36 z-30">
                                  <DropdownMenuItem
                                    onClick={() => handleOpenForwardModal(msg)}
                                    className="cursor-pointer text-xs"
                                  >
                                    <Forward className="size-3.5 mr-2 text-sky-500" />
                                    Chuyển tiếp
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => handleStartDeleteMode(msg._id)}
                                    className="cursor-pointer text-xs text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="size-3.5 mr-2" />
                                    Xóa
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}

                          {/* Checkbox when in Selection Mode */}
                          {isSelectionMode && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectMessage(msg._id);
                              }}
                              className={cn(
                                "size-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 mb-2",
                                isSelected
                                  ? "bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/30 scale-105"
                                  : "border-border/60 bg-card hover:border-sky-400"
                              )}
                            >
                              {isSelected ? (
                                <CheckCheck className="size-4 stroke-[3]" />
                              ) : (
                                <Square className="size-3.5 text-transparent" />
                              )}
                            </div>
                          )}

                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm shadow-sm transition-all duration-200",
                              isDocFile
                                ? "bg-card dark:bg-card/90 text-foreground border border-border/60"
                                : isSelected
                                ? "bg-gradient-to-br from-sky-500 to-indigo-600 text-white ring-2 ring-sky-400 ring-offset-2 ring-offset-background scale-[1.01]"
                                : "bg-gradient-to-br from-sky-500/90 to-indigo-500/90 text-white"
                            )}
                          >
                            {/* Image */}
                            {msg.imgUrl && (
                              <a
                                href={msg.imgUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => isSelectionMode && e.preventDefault()}
                              >
                                <img
                                  src={msg.imgUrl}
                                  alt="ảnh"
                                  className="rounded-xl max-w-[240px] max-h-[240px] object-cover mb-1 hover:opacity-90 transition-opacity border border-white/20"
                                />
                              </a>
                            )}

                            {/* File attachment */}
                            {msg.fileUrl && !msg.imgUrl && (
                              <div className="flex items-center gap-2">
                                {isImageFile(msg.fileType, msg.fileUrl) ? (
                                  <a
                                    href={msg.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => isSelectionMode && e.preventDefault()}
                                  >
                                    <img
                                      src={msg.fileUrl}
                                      alt={msg.fileName || "ảnh"}
                                      className="rounded-xl max-w-[240px] max-h-[220px] object-cover hover:opacity-90 transition-opacity border border-white/20"
                                    />
                                  </a>
                                ) : (
                                  <div className="flex items-center gap-3 p-1 transition-colors">
                                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                      <FileText className="size-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-semibold truncate max-w-[180px] text-foreground">
                                        {msg.fileName || "Tệp đính kèm"}
                                      </p>
                                      {msg.fileSize && (
                                        <p className="text-[10px] text-muted-foreground">{msg.fileSize}</p>
                                      )}
                                    </div>
                                    <a
                                      href={msg.fileUrl}
                                      download={msg.fileName || "file"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => isSelectionMode && e.preventDefault()}
                                      className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-1 shrink-0"
                                      title="Lưu về máy"
                                    >
                                      <Download className="size-4" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Text content (Only render if NOT auto-generated file caption) */}
                            {msg.content && !isAutoGeneratedFileText && (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words mt-1">
                                {msg.content}
                              </p>
                            )}

                            <p className={cn(
                              "text-[10px] text-right mt-1",
                              isDocFile ? "text-muted-foreground" : "opacity-60"
                            )}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>

                          <UserAvatar
                            type="sidebar"
                            name={user?.displayName || "Me"}
                            avatarUrl={user?.avatarUrl ?? undefined}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Drag overlay */}
          {dragOver && (
            <div className="absolute inset-0 bg-sky-500/10 border-2 border-dashed border-sky-500/50 rounded-xl flex items-center justify-center z-50 backdrop-blur-xs">
              <div className="text-center">
                <Cloud className="size-12 mx-auto mb-2 text-sky-500 animate-bounce" />
                <p className="text-sm font-medium text-sky-500">Thả file để tải lên Kyeto Cloud</p>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-4 py-3 border-t border-border/40 bg-card/60 backdrop-blur-md shrink-0">
          <div className="flex items-end gap-2 bg-muted/40 border border-border/30 rounded-2xl px-3 py-2 focus-within:border-sky-500/40 transition-colors">
            {/* File attachments */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
              className="hidden"
            />
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
              className="hidden"
            />

            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10 transition-smooth shrink-0"
              title="Gửi ảnh"
            >
              <ImageIcon className="size-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10 transition-smooth shrink-0"
              title="Gửi file"
            >
              <Paperclip className="size-4" />
            </button>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("kyeto_cloud.placeholder")}
              rows={1}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none max-h-32 beautiful-scrollbar"
              style={{ minHeight: "24px" }}
            />

            <button
              onClick={sendText}
              disabled={!text.trim() || sending}
              className={cn(
                "p-2 rounded-xl transition-all duration-200 shrink-0",
                text.trim()
                  ? "bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 hover:scale-105"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              )}
            >
              <Send className="size-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            💡 Kéo & thả file vào đây để tải lên nhanh
          </p>
        </div>
      </div>

      {/* Forward Message Modal */}
      <ForwardMessageModal
        open={forwardModalOpen}
        setOpen={setForwardModalOpen}
        messageToForward={messageToForward}
      />
    </>
  );
}

export default KyetoCloudChatPanel;
