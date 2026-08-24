import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { toast } from "sonner";

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "vi";

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("kyeto_lang", lang);
    toast.success(lang === "vi" ? "Đã chuyển sang Tiếng Việt 🇻🇳" : "Switched to English 🇬🇧");
  };

  return (
    <div className="flex items-center justify-between p-3 border border-amber-500/20 rounded-2xl bg-amber-500/5 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
          <Globe className="size-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground">{t("settings.interface_language")}</h4>
          <p className="text-[11px] text-muted-foreground">{t("settings.choose_language")}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/40">
        <Button
          size="sm"
          variant={currentLang === "vi" ? "default" : "ghost"}
          onClick={() => changeLanguage("vi")}
          className={`h-7 px-2.5 text-xs font-bold rounded-lg ${currentLang === "vi" ? "bg-amber-500 text-slate-950 shadow-sm" : ""}`}
        >
          🇻🇳 Tiếng Việt
        </Button>
        <Button
          size="sm"
          variant={currentLang === "en" ? "default" : "ghost"}
          onClick={() => changeLanguage("en")}
          className={`h-7 px-2.5 text-xs font-bold rounded-lg ${currentLang === "en" ? "bg-amber-500 text-slate-950 shadow-sm" : ""}`}
        >
          🇬🇧 English
        </Button>
      </div>
    </div>
  );
}

export default LanguageSelector;
