import { Sun, Moon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useThemeStore } from "@/stores/useThemeStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";

const PreferencesForm = () => {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useThemeStore();
  const { user, setUser } = useAuthStore();

  const showOnlineStatus = user?.showOnlineStatus ?? true;

  const handleToggleOnlineStatus = async (checked: boolean) => {
    if (!user) return;
    try {
      setUser({ ...user, showOnlineStatus: checked });
      await userService.updateProfile({ showOnlineStatus: checked });
      toast.success(t("common.success"));
    } catch (err) {
      toast.error(t("common.error"));
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-primary" />
          {t("settings.preferences_title")}
        </CardTitle>
        <CardDescription>{t("settings.preferences_subtitle")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Language Selector */}
        <LanguageSelector />

        {/* Dark Mode */}
        <div className="flex items-center justify-between">
          <div>
            <Label
              htmlFor="theme-toggle"
              className="text-base font-medium"
            >
              {t("settings.dark_mode_title")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("settings.dark_mode_desc")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <Switch
              id="theme-toggle"
              checked={isDark}
              onCheckedChange={toggleTheme}
              className="data-[state=checked]:bg-primary-glow"
            />
            <Moon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Online Status */}
        <div className="flex items-center justify-between">
          <div>
            <Label
              htmlFor="online-status"
              className="text-base font-medium"
            >
              {t("settings.online_status_title")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("settings.online_status_desc")}
            </p>
          </div>
          <Switch
            id="online-status"
            checked={showOnlineStatus}
            onCheckedChange={handleToggleOnlineStatus}
            className="data-[state=checked]:bg-primary-glow"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PreferencesForm;
