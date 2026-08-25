import { useEffect, useState } from "react";
import { Shield, Bell, ShieldBan, Lock } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import UserAvatar from "../chat/UserAvatar";
import { TwoFactorSetup } from "./TwoFactorSetup";
import LanguageSelector from "./LanguageSelector";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "@/stores/useAuthStore";

const PrivacySettings = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  const [notificationsOn, setNotificationsOn] = useState(user?.notificationsEnabled ?? true);
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  useEffect(() => {
    if (user && typeof user.notificationsEnabled === "boolean") {
      setNotificationsOn(user.notificationsEnabled);
    }
  }, [user?.notificationsEnabled]);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      const data = await userService.getBlockedUsers();
      setBlockedUsers(data.blockedUsers || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setChangingPass(true);
      await userService.changePassword({ oldPassword, newPassword });
      toast.success(t("common.success"));
      setShowPasswordForm(false);
      setOldPassword("");
      setNewPassword("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("common.error"));
    } finally {
      setChangingPass(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      const data = await userService.toggleNotifications();
      setNotificationsOn(data.notificationsEnabled);
      if (user) {
        setUser({ ...user, notificationsEnabled: data.notificationsEnabled });
      }
      toast.success(data.message);
    } catch (error) {
      toast.error(t("common.error"));
    }
  };

  const handleUnblock = async (targetUserId: string) => {
    try {
      await userService.unblockUser(targetUserId);
      setBlockedUsers((prev) => prev.filter((u) => u._id !== targetUserId));
      toast.success(t("common.success"));
    } catch (error) {
      toast.error(t("common.error"));
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {t("settings.privacy_security")}
        </CardTitle>
        <CardDescription>
          {t("settings.privacy_security_desc")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Change Password */}
          <div>
            <Button
              variant="outline"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="w-full justify-start glass-light border-border/30 hover:text-primary"
            >
              <Lock className="h-4 w-4 mr-2" />
              {t("settings.change_password")}
            </Button>

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="mt-3 p-4 bg-muted/40 rounded-2xl space-y-3 border border-border/30">
                <div className="space-y-1">
                  <Label htmlFor="oldPass" className="text-xs">{t("settings.current_password")}</Label>
                  <Input
                    id="oldPass"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className="h-9 text-xs glass-light"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="newPass" className="text-xs">{t("settings.new_password")}</Label>
                  <Input
                    id="newPass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="h-9 text-xs glass-light"
                  />
                </div>
                <Button type="submit" size="sm" disabled={changingPass} className="w-full h-8 text-xs">
                  {changingPass ? t("settings.processing") : t("settings.confirm_change_password")}
                </Button>
              </form>
            )}
          </div>

          {/* Notifications Toggle */}
          <Button
            variant="outline"
            onClick={handleToggleNotifications}
            className="w-full justify-between glass-light border-border/30 hover:text-info"
          >
            <div className="flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              {t("settings.app_notifications")}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${notificationsOn ? "bg-emerald-500/20 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
              {notificationsOn ? t("settings.status_on") : t("settings.status_off")}
            </span>
          </Button>

          {/* Two Factor Authentication Setup */}
          <TwoFactorSetup />

          {/* Language Selector */}
          <LanguageSelector />

          {/* Blocked Users */}
          <div>
            <Button
              variant="outline"
              onClick={() => setShowBlockedList(!showBlockedList)}
              className="w-full justify-between glass-light border-border/30 hover:text-destructive"
            >
              <div className="flex items-center">
                <ShieldBan className="size-4 mr-2" />
                {t("settings.blocked_users_list")}
              </div>
              <span className="text-xs text-muted-foreground font-semibold">
                {blockedUsers.length} {t("settings.people_count")}
              </span>
            </Button>

            {showBlockedList && (
              <div className="mt-3 p-3 bg-muted/40 rounded-2xl space-y-2 border border-border/30 max-h-40 overflow-y-auto beautiful-scrollbar">
                {blockedUsers.map((bu) => (
                  <div key={bu._id} className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/30">
                    <div className="flex items-center gap-2">
                      <UserAvatar type="sidebar" name={bu.displayName} avatarUrl={bu.avatarUrl} />
                      <span className="text-xs font-semibold">{bu.displayName}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnblock(bu._id)}
                      className="h-7 text-[10px] rounded-lg"
                    >
                      {t("settings.unblock")}
                    </Button>
                  </div>
                ))}
                {blockedUsers.length === 0 && (
                  <p className="text-xs text-center py-3 text-muted-foreground">{t("settings.no_blocked_users")}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;
