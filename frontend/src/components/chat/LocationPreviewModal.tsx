import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ExternalLink, Copy, Check } from "lucide-react";
import L from "leaflet";
import { useState } from "react";
import { toast } from "sonner";

interface LocationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export default function LocationPreviewModal({
  isOpen,
  onClose,
  location,
}: LocationPreviewModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !location) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        const map = L.map(mapContainerRef.current).setView(
          [location.latitude, location.longitude],
          16
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        L.marker([location.latitude, location.longitude])
          .addTo(map)
          .bindPopup(location.address || "Vị trí đã chọn")
          .openPopup();

        mapInstanceRef.current = map;
      } else {
        mapInstanceRef.current.setView([location.latitude, location.longitude], 16);
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (!isOpen && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, location]);

  const handleCopyCoords = () => {
    const coordsStr = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(coordsStr);
    setCopied(true);
    toast.success("Đã chép tọa độ vào bộ nhớ tạm!");
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] p-0 overflow-hidden border-amber-500/20 bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl">
        <DialogHeader className="p-3 sm:p-4 border-b border-border/40 bg-muted/30">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
            <MapPin className="size-4 sm:size-5 text-amber-500 animate-bounce" />
            Chi tiết vị trí bản đồ (Location Details)
          </DialogTitle>
        </DialogHeader>

        <div className="p-3 sm:p-4 space-y-3">
          {/* Address & Coords Header */}
          <div className="bg-muted/50 p-2.5 sm:p-3 rounded-xl border border-border/40 space-y-1.5">
            <div className="flex items-start gap-2">
              <MapPin className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-foreground leading-snug">
                  {location.address || "Vị trí đã ghim"}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                  <span>
                    Tọa độ: <strong className="font-mono text-amber-500">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</strong>
                  </span>
                  <button
                    onClick={handleCopyCoords}
                    className="inline-flex items-center gap-1 text-amber-500 hover:underline font-medium cursor-pointer"
                  >
                    {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    <span>{copied ? "Đã sao chép" : "Sao chép"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Leaflet Map Preview Container */}
          <div
            ref={mapContainerRef}
            className="w-full h-[240px] sm:h-[340px] rounded-xl border border-border/50 shadow-inner overflow-hidden z-0"
          />
        </div>

        <DialogFooter className="p-4 border-t border-border/40 bg-muted/30 flex items-center justify-between sm:justify-between">
          <Button variant="ghost" onClick={onClose} className="rounded-xl text-xs">
            Đóng
          </Button>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold text-xs shadow-md transition-all"
          >
            <Navigation className="size-4 fill-slate-950" />
            <span>Mở chỉ đường Google Maps</span>
            <ExternalLink className="size-3.5 opacity-80" />
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
