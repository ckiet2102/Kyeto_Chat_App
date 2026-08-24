import { useState } from "react";
import { useFriendStore } from "@/stores/useFriendStore";
import { chatService } from "@/services/chatService";
import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";
import type { Friend } from "@/types/user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { UserPlus, Search, Check } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { toast } from "sonner";

interface AddMemberModalProps {
  conversation: Conversation;
}

const AddMemberModal = ({ conversation }: AddMemberModalProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const { friends, getFriends } = useFriendStore();
  const { updateConversation } = useChatStore();

  const existingMemberIds = new Set(
    conversation.participants.map((p) => p._id.toString())
  );

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      await getFriends();
      setSelectedFriends([]);
      setSearch("");
    }
  };

  const availableFriends = friends.filter(
    (f) =>
      !existingMemberIds.has(f._id.toString()) &&
      f.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectFriend = (friend: Friend) => {
    if (selectedFriends.some((f) => f._id === friend._id)) {
      setSelectedFriends(selectedFriends.filter((f) => f._id !== friend._id));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) return;

    try {
      setLoading(true);
      const memberIds = selectedFriends.map((f) => f._id);
      const updated = await chatService.addMembers(conversation._id, memberIds);
      updateConversation(updated);
      toast.success(`Đã thêm ${selectedFriends.length} thành viên vào nhóm`);
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi thêm thành viên vào nhóm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
          <UserPlus className="size-3.5 text-primary" />
          Thêm thành viên
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4 text-primary" />
            Thêm thành viên vào nhóm
          </DialogTitle>
          <DialogDescription className="sr-only">
            Chọn bạn bè để thêm vào nhóm chat hiện tại
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Search input */}
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm bạn bè theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Friends selection list */}
          <div className="max-h-60 overflow-y-auto space-y-1 beautiful-scrollbar pr-1">
            {availableFriends.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-6">
                Không tìm thấy bạn bè nào chưa vào nhóm.
              </p>
            ) : (
              availableFriends.map((friend) => {
                const isSelected = selectedFriends.some((f) => f._id === friend._id);

                return (
                  <div
                    key={friend._id}
                    onClick={() => toggleSelectFriend(friend)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        type="chat"
                        name={friend.displayName}
                        avatarUrl={friend.avatarUrl}
                      />
                      <span className="text-sm font-medium">
                        {friend.displayName}
                      </span>
                    </div>

                    <div
                      className={`size-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-primary border-primary text-white"
                          : "border-border/60"
                      }`}
                    >
                      {isSelected && <Check className="size-3" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAddMembers}
            disabled={selectedFriends.length === 0 || loading}
            className="w-full bg-gradient-chat text-white"
          >
            {loading ? "Đang thêm..." : `Thêm ${selectedFriends.length} thành viên`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberModal;
