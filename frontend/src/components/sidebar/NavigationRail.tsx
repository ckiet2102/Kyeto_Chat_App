import { useEffect, useState } from "react";
import {
  MessageCircle,
  Users,
  Bookmark,
  Phone,
  Cloud,
  Settings,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { useChatStore } from "@/stores/useChatStore";
import { cn } from "@/lib/utils";
import UserAvatar from "../chat/UserAvatar";
import ProfileDialog from "../profile/ProfileDialog";
import FriendRequestDialog from "../friendRequest/FriendRequestDialog";
import { useTranslation } from "react-i18next";
import BookmarksModal from "./BookmarksModal";
import CallHistoryModal from "./CallHistoryModal";

interface NavigationRailProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export function NavigationRail({ activeTab = "chats", setActiveTab }: NavigationRailProps) {
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?")) {
      signOut();
    }
  };
  const { isDark, toggleTheme } = useThemeStore();
  const { receivedList, getAllFriendRequests, getFriends } = useFriendStore();
  const { conversations, activeConversationId } = useChatStore();

  const [profileOpen, setProfileOpen] = useState(false);
  const [friendRequestOpen, setFriendRequestOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [callsOpen, setCallsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      getAllFriendRequests();
      getFriends();
    }
  }, [user]);

  const totalUnreadChats = (conversations || []).reduce(
    (acc, c) => acc + (user ? (c.unreadCounts?.[user._id] || 0) : 0),
    0
  );

  const navItems = [
    {
      id: "chats",
      icon: MessageCircle,
      label: t("sidebar.conversations"),
      badge: totalUnreadChats > 0 ? totalUnreadChats : undefined,
    },
    {
      id: "contacts",
      icon: Users,
      label: t("sidebar.contacts"),
      badge: receivedList.length > 0 ? receivedList.length : undefined,
      action: () => setFriendRequestOpen(true),
    },
    { id: "bookmarks", icon: Bookmark, label: "Đã ghim", action: () => setBookmarksOpen(true) },
    { id: "calls", icon: Phone, label: t("sidebar.calls"), action: () => setCallsOpen(true) },
    {
      id: "cloud",
      icon: Cloud,
      label: t("sidebar.cloud"),
      // No action — handled by tab switch in ChatAppPage
    },
    { id: "settings", icon: Settings, label: t("sidebar.settings"), action: () => setProfileOpen(true) },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.action) {
      item.action();
    }
    if (setActiveTab) {
      setActiveTab(item.id);
    }
  };

  return (
    <>
      <aside
        className={cn(
          "w-12 sm:w-[72px] h-full flex flex-col items-center justify-between py-2.5 sm:py-4 bg-card/95 border-r border-border/40 backdrop-blur-md shrink-0 z-30 select-none",
          activeConversationId ? "hidden md:flex" : "flex"
        )}
      >
        {/* Top Logo */}
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          <img 
            src="/kyetolg.png" 
            alt="Kyeto Chat" 
            className="size-9 sm:size-11 rounded-xl sm:rounded-2xl object-cover shadow-md hover:scale-105 transition-smooth cursor-pointer"
            title="Kyeto Chat"
          />

          {/* Navigation Icons */}
          <nav className="flex flex-col gap-2 sm:gap-3 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  title={item.label}
                  className={`relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 group ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full size-4 flex items-center justify-center animate-bounce shadow-md">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions: Theme, User Avatar & Logout */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={toggleTheme}
            title={isDark ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}
            className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-smooth"
          >
            {isDark ? <Sun className="size-5 text-amber-400" /> : <Moon className="size-5 text-indigo-500" />}
          </button>

          <button
            onClick={handleLogout}
            title="Đăng xuất tài khoản"
            className="p-2.5 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-smooth"
          >
            <LogOut className="size-5" />
          </button>

          {user && (
            <div
              onClick={() => setProfileOpen(true)}
              className="relative cursor-pointer hover:opacity-90 hover:scale-105 transition-smooth group"
              title={user.displayName}
            >
              <UserAvatar
                type="sidebar"
                name={user.displayName}
                avatarUrl={user.avatarUrl}
              />
              <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-card" />
            </div>
          )}
        </div>
      </aside>

      {/* Modals & Dialogs */}
      <ProfileDialog open={profileOpen} setOpen={setProfileOpen} />
      <FriendRequestDialog open={friendRequestOpen} setOpen={setFriendRequestOpen} />
      <BookmarksModal open={bookmarksOpen} setOpen={setBookmarksOpen} />
      <CallHistoryModal open={callsOpen} setOpen={setCallsOpen} />
    </>
  );
}

export default NavigationRail;
