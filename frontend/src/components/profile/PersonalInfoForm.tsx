import { useState } from "react";
import { Heart } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type Props = {
  userInfo: User | null;
};

const PersonalInfoForm = ({ userInfo }: Props) => {
  const { t } = useTranslation();
  if (!userInfo) return null;

  const [displayName, setDisplayName] = useState(userInfo.displayName || "");
  const [bio, setBio] = useState(userInfo.bio || "");
  const [phone, setPhone] = useState(userInfo.phone || "");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await userService.updateProfile({ displayName, bio, phone });
      setUser(res.user);
      toast.success(t("common.success"));
    } catch (error) {
      console.error(error);
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="size-5 text-primary" />
          {t("settings.personal_info")}
        </CardTitle>
        <CardDescription>
          {t("settings.personal_info_desc")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">{t("settings.display_name")}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="glass-light border-border/30"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">{t("settings.username")}</Label>
              <Input
                id="username"
                value={userInfo.username}
                disabled
                className="glass-light border-border/30 opacity-60 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("settings.email")}</Label>
              <Input
                id="email"
                value={userInfo.email}
                disabled
                className="glass-light border-border/30 opacity-60 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("settings.phone")}</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0987654321"
                className="glass-light border-border/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t("settings.bio")}</Label>
            <Textarea
              id="bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("settings.bio_placeholder")}
              className="glass-light border-border/30 resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            {loading ? t("settings.saving") : t("settings.save_changes")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;
