import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFriendStore } from "@/stores/useFriendStore";
import { useChatStore } from "@/stores/useChatStore";
import SentRequests from "./SentRequests";
import ReceivedRequests from "./ReceivedRequests";
import AddFriendModal from "../chat/AddFriendModal";
import UserAvatar from "../chat/UserAvatar";
import { Button } from "../ui/button";
import { MessageSquare, Users, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FriendRequestDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const FriendRequestDialog = ({ open, setOpen }: FriendRequestDialogProps) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState("received");
  const [searchFriend, setSearchFriend] = useState("");
  const { getAllFriendRequests, getFriends, friends, receivedList } = useFriendStore();
  const { createConversation } = useChatStore();

  useEffect(() => {
    if (open) {
      getAllFriendRequests();
      getFriends();
    }
  }, [open]);

  const handleStartChat = async (friendId: string) => {
    try {
      await createConversation("direct", "", [friendId]);
      setOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredFriends = friends.filter((f) => {
    if (!searchFriend.trim()) return true;
    const q = searchFriend.toLowerCase();
    return (
      f.displayName.toLowerCase().includes(q) ||
      f.username.toLowerCase().includes(q)
    );
  });

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogContent className="sm:max-w-lg select-none">
        <DialogHeader className="flex flex-row items-center justify-between pr-6">
          <div>
            <DialogTitle className="text-lg font-bold text-foreground">{t("contacts.title")}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("contacts.subtitle")}
            </DialogDescription>
          </div>
          <AddFriendModal />
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={setTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="received" className="relative">
              {t("contacts.received")}
              {receivedList.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-red-500 text-white text-[10px] rounded-full font-bold">
                  {receivedList.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">{t("contacts.sent")}</TabsTrigger>
            <TabsTrigger value="friends">
              {t("contacts.friends")} ({friends.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-3">
            <ReceivedRequests />
          </TabsContent>

          <TabsContent value="sent" className="mt-3">
            <SentRequests />
          </TabsContent>

          <TabsContent value="friends" className="mt-3 space-y-3">
            {/* Search Friends Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchFriend}
                onChange={(e) => setSearchFriend(e.target.value)}
                placeholder={t("contacts.search_friends")}
                className="w-full h-8 pl-9 pr-3 bg-muted/60 focus:bg-background border border-transparent focus:border-primary/40 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none transition-smooth"
              />
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto beautiful-scrollbar pr-1">
              {filteredFriends.map((friend) => (
                <div
                  key={friend._id}
                  className="p-2.5 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-smooth border border-border/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      type="sidebar"
                      name={friend.displayName}
                      avatarUrl={friend.avatarUrl}
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-foreground truncate">{friend.displayName}</h4>
                      <p className="text-[10px] text-muted-foreground">@{friend.username}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleStartChat(friend._id)}
                    className="h-8 gap-1.5 rounded-xl text-xs bg-primary text-primary-foreground hover:opacity-90"
                  >
                    <MessageSquare className="size-3.5" />
                    {t("contacts.message")}
                  </Button>
                </div>
              ))}

              {filteredFriends.length === 0 && (
                <div className="text-center py-10 text-xs text-muted-foreground">
                  <Users className="size-10 mx-auto mb-2 opacity-40" />
                  {searchFriend ? t("contacts.no_matching_friends") : t("contacts.no_friends")}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default FriendRequestDialog;
