import { useState } from "react";
import { Search, SquarePen, X, Archive, ChevronDown, ChevronRight } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import { useGroupCallStore } from "@/stores/useGroupCallStore";
import { cn } from "@/lib/utils";
import DirectMessageCard from "./DirectMessageCard";
import GroupChatCard from "./GroupChatCard";
import ActiveCallBanner from "./ActiveCallBanner";
import ConversationSkeleton from "../skeleton/ConversationSkeleton";
import FriendListModal from "../createNewChat/FriendListModal";
import NewGroupChatModal from "./NewGroupChatModal";
import AddFriendModal from "./AddFriendModal";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";

export function ChatListSidebar() {
  const { t } = useTranslation();
  const { conversations, convoLoading, activeConversationId } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "groups" | "favorites">("all");
  const [friendModalOpen, setFriendModalOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const filterTabs = [
    { id: "all", label: t("sidebar.all_chats") },
    { id: "unread", label: t("sidebar.unread") },
    { id: "groups", label: t("sidebar.group_chats") },
    { id: "favorites", label: t("sidebar.favorites") },
  ] as const;

  const applyTabFilter = (convo: (typeof conversations)[0]) => {
    if (activeFilter === "unread") {
      const totalUnread = Object.values(convo.unreadCounts || {}).reduce((a, b) => a + b, 0);
      return totalUnread > 0;
    }
    if (activeFilter === "groups") return convo.type === "group";
    if (activeFilter === "favorites") return false; // TODO: hook into favoriteConversations
    return true;
  };

  const applySearch = (convo: (typeof conversations)[0]) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (convo.type === "group") {
      return (convo.group?.name?.toLowerCase() || "").includes(q);
    }
    return convo.participants
      .map((p) => p.displayName?.toLowerCase() || "")
      .join(" ")
      .includes(q);
  };

  const activeConversations = (conversations || []).filter(
    (convo) => !convo.isArchived && applySearch(convo) && applyTabFilter(convo)
  );

  const archivedConversations = (conversations || []).filter(
    (convo) => convo.isArchived && applySearch(convo)
  );

  const renderConvoCard = (convo: (typeof conversations)[0]) =>
    convo.type === "group" ? (
      <GroupChatCard key={convo._id} convo={convo} />
    ) : (
      <DirectMessageCard key={convo._id} convo={convo} />
    );

  const { activeCalls } = useGroupCallStore();

  const activeCallList = Object.values(activeCalls);

  return (
    <aside
      className={cn(
        "w-full md:w-[320px] lg:w-[360px] h-full flex flex-col bg-card/80 border-r border-border/40 backdrop-blur-md shrink-0 select-none",
        activeConversationId ? "hidden md:flex" : "flex"
      )}
    >
      {/* Header */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/kyeto.png" alt="logo" className="size-9 object-contain" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Kyeto</h1>
        </div>
        <div className="flex items-center gap-1">
          {/* Add Friend Button */}
          <AddFriendModal />

          {/* New Direct Chat Button */}
          <Dialog open={friendModalOpen} onOpenChange={setFriendModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Tạo cuộc trò chuyện mới"
              >
                <SquarePen className="size-5" />
              </Button>
            </DialogTrigger>
            <FriendListModal />
          </Dialog>

          {/* New Group Chat Button */}
          <NewGroupChatModal />
        </div>
      </div>

      {/* Search Input */}
      <div className="px-4 py-2">
        <div className="relative flex items-center">
          <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("sidebar.search_chats")}
            className="w-full h-9 pl-9 pr-8 bg-muted/60 hover:bg-muted focus:bg-background border border-transparent focus:border-primary/40 rounded-full text-xs text-foreground placeholder:text-muted-foreground focus:outline-none transition-smooth"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 p-0.5 rounded-full hover:bg-muted-foreground/20 text-muted-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto beautiful-scrollbar">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${isActive
                ? "bg-primary/15 text-primary font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 beautiful-scrollbar">
        {/* Active Call Banners */}
        {activeCallList.length > 0 && (
          <div className="mb-2 space-y-1">
            {activeCallList.map((call) => {
              const convo = conversations.find((c) => c._id === call.conversationId);
              const name = call.groupName || convo?.group?.name || "Cuộc gọi đang diễn ra";
              return (
                <ActiveCallBanner
                  key={call.conversationId}
                  groupId={call.conversationId}
                  groupName={name}
                  isVideo={call.isVideo}
                  callerName={call.callerName}
                />
              );
            })}
          </div>
        )}

        {convoLoading ? (
          <ConversationSkeleton />
        ) : activeConversations.length > 0 ? (
          activeConversations.map(renderConvoCard)
        ) : (
          <div className="text-center py-12 text-xs text-muted-foreground">
            Không tìm thấy cuộc trò chuyện nào
          </div>
        )}

        {/* Archived Section */}
        {archivedConversations.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setArchivedOpen((p) => !p)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-smooth"
            >
              <Archive className="size-3.5 text-amber-500" />
              <span className="font-medium">Đã lưu trữ ({archivedConversations.length})</span>
              {archivedOpen ? (
                <ChevronDown className="size-3.5 ml-auto" />
              ) : (
                <ChevronRight className="size-3.5 ml-auto" />
              )}
            </button>

            {archivedOpen && (
              <div className="mt-1.5 space-y-1.5 pl-1 border-l-2 border-amber-500/30">
                {archivedConversations.map(renderConvoCard)}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default ChatListSidebar;
