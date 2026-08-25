import { useState, useEffect } from "react";
import type { Conversation } from "@/types/chat";
import ChatCard from "./ChatCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import UnreadCountBadge from "./UnreadCountBadge";
import { useSocketStore } from "@/stores/useSocketStore";
import { CryptoService } from "@/services/cryptoService";

const DirectMessageCard = ({ convo }: { convo: Conversation }) => {
  const { user } = useAuthStore();
  const { activeConversationId, setActiveConversation, messages, fetchMessages } =
    useChatStore();
  const { onlineUsers } = useSocketStore();

  if (!user) return null;

  const otherUser = convo.participants.find((p) => p._id !== user._id);
  if (!otherUser) return null;

  const otherUserNickname =
    (convo.settings as any)?.nicknames?.[otherUser._id] ||
    (typeof (convo.settings as any)?.nicknames?.get === "function"
      ? (convo.settings as any).nicknames.get(otherUser._id)
      : null);

  const displayName = otherUserNickname || otherUser.displayName || "";

  const unreadCount = convo.unreadCounts[user._id];
  const lastMessageObj = convo.lastMessage as any;
  const isVoice =
    lastMessageObj?.fileType === "voice" ||
    (lastMessageObj?.fileUrl && lastMessageObj?.fileName?.includes("voice"));

  const [displayContent, setDisplayContent] = useState<string>(() => {
    const raw = lastMessageObj?.content || "";
    if (raw.startsWith("ECDH:") || raw.startsWith("E2EE:")) {
      return "[Tin nhắn mã hóa]";
    }
    return raw;
  });

  useEffect(() => {
    let isMounted = true;
    const rawContent = lastMessageObj?.content || "";

    if (rawContent.startsWith("ECDH:") || rawContent.startsWith("E2EE:")) {
      CryptoService.decryptMessage(rawContent, "moji-default-key", user._id, otherUser._id)
        .then((decrypted) => {
          if (isMounted) setDisplayContent(decrypted);
        })
        .catch(() => {
          if (isMounted) setDisplayContent("[Tin nhắn mã hóa]");
        });
    } else {
      setDisplayContent(rawContent);
    }

    return () => {
      isMounted = false;
    };
  }, [lastMessageObj?.content, user._id, otherUser._id]);

  const lastMessage = isVoice
    ? "[Tin nhắn thoại]"
    : lastMessageObj?.imgUrl
    ? "[Hình ảnh]"
    : lastMessageObj?.fileUrl
    ? "[Tệp đính kèm]"
    : displayContent;

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    if (!messages[id]) {
      await fetchMessages();
    }
  };

  const isOnline = onlineUsers.some(
    (uId) => uId === otherUser._id || uId?.toString() === otherUser._id?.toString()
  );

  return (
    <ChatCard
      convoId={convo._id}
      name={displayName}
      timestamp={
        convo.lastMessage?.createdAt
          ? new Date(convo.lastMessage.createdAt)
          : undefined
      }
      isActive={activeConversationId === convo._id}
      onSelect={handleSelectConversation}
      unreadCount={unreadCount}
      isArchived={convo.isArchived}
      isMuted={convo.isMuted}
      leftSection={
        <>
          <UserAvatar
            type="sidebar"
            name={displayName}
            avatarUrl={otherUser.avatarUrl ?? undefined}
          />
          <StatusBadge status={isOnline ? "online" : "offline"} />
          {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
        </>
      }
      subtitle={
        <p
          className={cn(
            "text-sm truncate",
            unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {lastMessage}
        </p>
      }
    />
  );
};

export default DirectMessageCard;
