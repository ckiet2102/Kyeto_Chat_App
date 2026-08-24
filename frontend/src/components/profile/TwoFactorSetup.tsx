import { useState } from "react";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, QrCode, Lock } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTranslation } from "react-i18next";

export function TwoFactorSetup() {
  const { t } = useTranslation();
  const { user, fetchMe } = useAuthStore();
  const [step, setStep] = useState<"idle" | "qr" | "success">("idle");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleStartSetup = async () => {
    try {
      setLoading(true);
      const res = await authService.setup2FA();
      setQrCodeUrl(res.qrCodeDataUrl);
      setSecret(res.secret);
      setStep("qr");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      toast.error(t("common.error"));
      return;
    }
    try {
      setLoading(true);
      await authService.verify2FA(code);
      toast.success(t("common.success"));
      setStep("success");
      await fetchMe();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border border-amber-500/20 rounded-2xl bg-amber-500/5 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
          {user?.twoFactorEnabled ? (
            <ShieldCheck className="size-6 text-green-500" />
          ) : (
            <ShieldAlert className="size-6 text-amber-500" />
          )}
        </div>
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            {t("settings.two_factor_auth")}
            {user?.twoFactorEnabled && (
              <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-semibold">
                {t("settings.two_factor_enabled")}
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("settings.two_factor_desc")}
          </p>
        </div>
      </div>

      {user?.twoFactorEnabled ? (
        <div className="text-xs text-muted-foreground bg-green-500/10 p-3 rounded-xl border border-green-500/20 text-green-400 font-medium">
          {t("settings.two_factor_protected")}
        </div>
      ) : (
        <>
          {step === "idle" && (
            <Button
              onClick={handleStartSetup}
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs gap-2"
            >
              <QrCode className="size-4" />
              {t("settings.setup_2fa_qr")}
            </Button>
          )}

          {step === "qr" && (
            <div className="space-y-4 pt-2 border-t border-amber-500/10">
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-muted-foreground text-center">
                  {t("settings.qr_step_1")}
                </p>
                {qrCodeUrl && (
                  <div className="p-2 bg-white rounded-xl shadow-lg border border-amber-500/30">
                    <img src={qrCodeUrl} alt="2FA QR Code" className="size-40" />
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground font-mono bg-muted px-2.5 py-1 rounded-lg">
                  Secret: {secret}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {t("settings.qr_step_2")}
                </p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="font-mono text-center text-lg tracking-widest rounded-xl border-amber-500/20"
                  />
                  <Button
                    onClick={handleVerify}
                    disabled={loading || code.length !== 6}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs gap-2"
                  >
                    <Lock className="size-4" />
                    {t("settings.activate")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
