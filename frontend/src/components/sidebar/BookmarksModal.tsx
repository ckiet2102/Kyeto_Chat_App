import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bookmark, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatService } from "@/services/chatService";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import UserAvatar from "../chat/UserAvatar";
import GroupChatAvatar from "../chat/GroupChatAvatar";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface BookmarksModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function BookmarksModal({ open, setOpen }: BookmarksModalProps) {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { setActiveConversation } = useChatStore();

  useEffect(() => {
    if (open) {
      loadFavorites();
    }
  }, [open]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await chatService.getFavoriteConversations();
      setFavorites(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (conversationId: string) => {
    try {
      await chatService.toggleFavoriteConversation(conversationId);
      setFavorites((prev) => prev.filter((c) => c._id !== conversationId));
      toast.success(t("common.success"));
    } catch (error) {
      toast.error(t("common.error"));
    }
  };

  const handleOpenChat = (conversationId: string) => {
    setActiveConversation(conversationId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border-border/40 select-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Bookmark className="size-5 text-primary" />
            {t("bookmarks.title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("bookmarks.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 my-3 max-h-[350px] overflow-y-auto beautiful-scrollbar pr-1">
          {loading ? (
            <p className="text-xs text-center py-6 text-muted-foreground">{t("common.loading")}</p>
          ) : favorites.length > 0 ? (
            favorites.map((convo) => {
              const isGroup = convo.type === "group";
              const otherUser = !isGroup
                ? convo.participants?.find((p: any) => p._id !== user?._id || p.userId?._id !== user?._id)
                : null;

              const name = isGroup
                ? convo.group?.name
                : otherUser?.displayName || otherUser?.userId?.displayName || "User";
              const avatar = isGroup
                ? null
                : otherUser?.avatarUrl || otherUser?.userId?.avatarUrl;

              return (
                <div
                  key={convo._id}
                  className="p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-smooth border border-border/30 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isGroup ? (
                      <GroupChatAvatar participants={convo.participants || []} type="sidebar" />
                    ) : (
                      <UserAvatar type="sidebar" name={name} avatarUrl={avatar} />
                    )}

                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-foreground truncate">{name}</h4>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {convo.lastMessage?.content || "..."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handleOpenChat(convo._id)}
                      className="h-8 gap-1.5 rounded-xl text-xs bg-primary text-primary-foreground hover:opacity-90"
                    >
                      <MessageSquare className="size-3.5" />
                      {t("bookmarks.open_chat")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFavorite(convo._id)}
                      className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                      title={t("common.delete")}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-xs text-muted-foreground">
              <Bookmark className="size-10 mx-auto mb-2 opacity-40" />
              {t("bookmarks.no_bookmarks")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BookmarksModal;
