import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Download, X } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 rounded-2xl bg-card border border-amber-500/40 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-bottom-3 max-w-sm">
      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
        <Download className="size-5 animate-bounce" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-xs text-foreground">Cài đặt Kyeto Chat App</h4>
        <p className="text-[11px] text-muted-foreground">Cài ứng dụng về máy để có trải nghiệm mượt mà như app gốc.</p>
      </div>
      <Button size="sm" onClick={handleInstall} className="text-xs bg-amber-500 hover:bg-amber-600 text-white shrink-0">
        Cài đặt
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setShowPrompt(false)} className="size-6 rounded-full shrink-0">
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
