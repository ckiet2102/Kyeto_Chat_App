import { useRef, useState } from "react";
import type { User } from "@/types/user";
import { Card, CardContent } from "../ui/card";
import UserAvatar from "../chat/UserAvatar";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { useSocketStore } from "@/stores/useSocketStore";
import AvatarUploader from "./AvatarUploader";
import { Camera } from "lucide-react";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

interface ProfileCardProps {
  user: User | null;
}

const ProfileCard = ({ user }: ProfileCardProps) => {
  const { onlineUsers } = useSocketStore();
  const { setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  if (!user) return null;

  const isOnline = onlineUsers.includes(user._id);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await userService.uploadCover(formData);
      setUser(res.user);
      toast.success("Cập nhật ảnh bìa thành công");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi upload ảnh bìa");
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <Card className="overflow-hidden p-0 h-52 relative border border-border/30 shadow-lg group">
      {/* Cover Image Background */}
      {user.coverUrl ? (
        <img src={user.coverUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
      )}

      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

      {/* Cover Photo Upload Button */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleCoverUpload}
        accept="image/*"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadingCover}
        title="Đổi ảnh bìa"
        className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-smooth z-10"
      >
        <Camera className="size-4" />
      </button>

      <CardContent className="mt-20 pb-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 relative z-10">
        <div className="relative">
          <UserAvatar
            type="profile"
            name={user.displayName}
            avatarUrl={user.avatarUrl ?? undefined}
            className="ring-4 ring-white/80 shadow-lg"
          />

          <AvatarUploader />
        </div>

        {/* user info */}
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-md">
            {user.displayName}
          </h1>

          {user.bio && (
            <p className="text-white/80 text-sm mt-1 max-w-lg line-clamp-2 drop-shadow-xs">
              {user.bio}
            </p>
          )}
        </div>

        {/* status */}
        <Badge
          className={cn(
            "flex items-center gap-1 capitalize shadow-md",
            isOnline ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-500/20 text-slate-300 border border-slate-500/40"
          )}
        >
          <div
            className={cn(
              "size-2 rounded-full",
              isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
            )}
          />
          {isOnline ? "online" : "offline"}
        </Badge>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
