import { useState, useEffect } from "react";
import { Palette, Check } from "lucide-react";
import { toast } from "sonner";

export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  bgPreview: string;
}

export const THEMES: ThemePreset[] = [
  { id: "luxury-gold", name: "Luxury Gold", primary: "#eab308", bgPreview: "bg-zinc-950 border-amber-500/50" },
  { id: "ocean-blue", name: "Ocean Blue", primary: "#06b6d4", bgPreview: "bg-slate-950 border-cyan-500/50" },
  { id: "forest-green", name: "Forest Green", primary: "#10b981", bgPreview: "bg-emerald-950 border-emerald-500/50" },
  { id: "sunset-orange", name: "Sunset Orange", primary: "#f97316", bgPreview: "bg-stone-950 border-orange-500/50" },
  { id: "midnight-purple", name: "Midnight Purple", primary: "#a855f7", bgPreview: "bg-purple-950 border-purple-500/50" },
  { id: "minimal-white", name: "Minimal White", primary: "#0f172a", bgPreview: "bg-slate-50 border-slate-300" },
];

export default function ThemePicker() {
  const [currentTheme, setCurrentTheme] = useState(
    () => localStorage.getItem("kyeto_theme") || "luxury-gold"
  );

  const applyTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem("kyeto_theme", themeId);
    document.documentElement.setAttribute("data-theme", themeId);
    toast.success(`Đã áp dụng chủ đề ${THEMES.find((t) => t.id === themeId)?.name}`);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Palette className="size-4 text-primary" />
        Chọn bộ màu Giao diện (6 Presets)
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {THEMES.map((theme) => {
          const isSelected = currentTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => applyTheme(theme.id)}
              className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-20 ${theme.bgPreview} ${
                isSelected ? "border-primary shadow-lg ring-2 ring-primary/30" : "hover:scale-105"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="size-4 rounded-full border border-white/20" style={{ backgroundColor: theme.primary }} />
                {isSelected && <Check className="size-4 text-primary" />}
              </div>
              <span className="text-xs font-bold text-foreground truncate">{theme.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
