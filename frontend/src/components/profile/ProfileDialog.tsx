import type { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import ProfileCard from "./ProfileCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import PersonalInfoForm from "./PersonalInfoForm";
import PreferencesForm from "./PreferencesForm";
import PrivacySettings from "./PrivacySettings";
import { LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";

interface ProfileDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const ProfileDialog = ({ open, setOpen }: ProfileDialogProps) => {
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      setOpen(false);
      signOut();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogContent className="overflow-y-auto max-h-[95vh] p-0 bg-transparent border-0 shadow-2xl">
        <div className="bg-gradient-glass">
          <div className="max-w-4xl mx-auto p-4">
            {/* heading */}
            <DialogHeader className="mb-6 flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {t("settings.title")}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Profile & Settings
                </DialogDescription>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="gap-2 rounded-xl text-xs font-semibold"
              >
                <LogOut className="size-4" />
                {t("settings.logout")}
              </Button>
            </DialogHeader>

            <ProfileCard user={user} />

            <Tabs
              defaultValue="personal"
              className="my-4"
            >
              <TabsList className="grid w-full grid-cols-3 glass-light">
                <TabsTrigger
                  value="personal"
                  className="data-[state=active]:glass-strong"
                >
                  {t("settings.account")}
                </TabsTrigger>
                <TabsTrigger
                  value="preferences"
                  className="data-[state=active]:glass-strong"
                >
                  {t("settings.preferences")}
                </TabsTrigger>
                <TabsTrigger
                  value="privacy"
                  className="data-[state=active]:glass-strong"
                >
                  {t("settings.security")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <PersonalInfoForm userInfo={user} />
              </TabsContent>

              <TabsContent value="preferences">
                <PreferencesForm />
              </TabsContent>

              <TabsContent value="privacy">
                <PrivacySettings />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
