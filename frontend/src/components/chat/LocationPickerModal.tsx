import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Loader2, Search, Compass, Check } from "lucide-react";
import L from "leaflet";
import { toast } from "sonner";

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: { latitude: number; longitude: number; address: string }) => void;
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  onSelectLocation,
}: LocationPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: 10.7769, // Default: Ho Chi Minh City
    lng: 106.7009,
  });
  const [address, setAddress] = useState<string>("Đang tải địa chỉ...");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [fetchingAddress, setFetchingAddress] = useState<boolean>(false);

  // Reverse Geocoding (Lat/Lng -> Address string)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setFetchingAddress(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`
      );
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setFetchingAddress(false);
    }
  };

  // Forward Geocoding (Search Query -> Lat/Lng)
  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&accept-language=vi&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setPosition({ lat, lng });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
        }
        setAddress(data[0].display_name || searchQuery);
        toast.success("Đã tìm thấy vị trí!");
      } else {
        toast.error("Không tìm thấy địa điểm này. Vui lòng thử lại!");
      }
    } catch {
      toast.error("Lỗi khi tìm kiếm địa điểm");
    } finally {
      setSearching(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        // Fix Leaflet marker icon URLs
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        const map = L.map(mapContainerRef.current).setView([position.lat, position.lng], 15);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        const marker = L.marker([position.lat, position.lng], { draggable: true }).addTo(map);
        markerRef.current = marker;

        // Drag end listener
        marker.on("dragend", () => {
          const newPos = marker.getLatLng();
          setPosition({ lat: newPos.lat, lng: newPos.lng });
          reverseGeocode(newPos.lat, newPos.lng);
        });

        // Click map listener
        map.on("click", (e: L.LeafletMouseEvent) => {
          marker.setLatLng(e.latlng);
          setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
          reverseGeocode(e.latlng.lat, e.latlng.lng);
        });

        mapInstanceRef.current = map;
        reverseGeocode(position.lat, position.lng);
      } else {
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
  }, [isOpen]);

  // Fallback to IP-based Geolocation if browser GPS is blocked/unavailable on PC
  const fetchIPLocation = async () => {
    try {
      const res = await fetch("https://ipwho.is/");
      const data = await res.json();
      if (data && data.success && data.latitude && data.longitude) {
        const lat = data.latitude;
        const lng = data.longitude;
        setPosition({ lat, lng });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 14);
          markerRef.current.setLatLng([lat, lng]);
        }
        reverseGeocode(lat, lng);
        toast.info(`Đã định vị theo khu vực mạng (${data.city || data.region || "Việt Nam"})!`);
        return true;
      }
    } catch (e) {
      console.warn("IP Geolocation fallback error:", e);
    }
    return false;
  };

  // Geolocation API: Get Current User Position with IP Fallback
  const handleGetCurrentLocation = () => {
    setLoading(true);

    if (!navigator.geolocation) {
      fetchIPLocation().finally(() => setLoading(false));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition({ lat, lng });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
        }
        reverseGeocode(lat, lng);
        setLoading(false);
        toast.success("Đã định vị thành công vị trí của bạn!");
      },
      async (err) => {
        console.warn("Browser GPS error/denied, trying IP Geolocation fallback...", err);
        const success = await fetchIPLocation();
        setLoading(false);
        if (!success) {
          toast.error(
            err.code === 1
              ? "Quyền vị trí bị chặn trên trình duyệt. Bạn có thể kéo ghim hoặc tìm địa điểm thủ công."
              : "Không thể định vị tự động. Vui lòng nhấp trên bản đồ hoặc gõ tìm địa điểm."
          );
        }
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
    );
  };

  const handleSend = () => {
    onSelectLocation({
      latitude: position.lat,
      longitude: position.lng,
      address,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[620px] p-0 overflow-hidden border-amber-500/20 bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl">
        <DialogHeader className="p-3 sm:p-4 border-b border-border/40 bg-muted/30">
          <DialogTitle className="flex items-center justify-between text-sm sm:text-base font-bold text-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 sm:size-5 text-amber-500 animate-bounce" />
              <span>Gửi vị trí bản đồ (Location Pinning)</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-3 sm:p-4 space-y-3">
          {/* Search Box & Quick GPS Button */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearchAddress} className="relative flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên địa điểm..."
                className="pl-9 pr-9 text-xs h-9 rounded-xl border-border/40 bg-muted/30 focus-visible:ring-amber-400"
              />
              <Search className="size-4 text-muted-foreground absolute left-3 top-2.5" />
              <button
                type="submit"
                disabled={searching}
                className="absolute right-2 top-1.5 p-1 rounded-lg text-amber-500 hover:bg-amber-500/10 cursor-pointer"
              >
                {searching ? <Loader2 className="size-4 animate-spin" /> : <Compass className="size-4" />}
              </button>
            </form>

            <Button
              size="sm"
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={loading}
              className="h-9 px-2.5 sm:px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shrink-0 gap-1 sm:gap-1.5 text-[11px] sm:text-xs shadow-md cursor-pointer transition-all"
              title="Tự động dịch tâm bản đồ về GPS vị trí hiện tại"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Navigation className="size-3.5 fill-slate-950" />}
              <span>Vị trí hiện tại</span>
            </Button>
          </div>

          {/* Selected Address & Coords Display Banner */}
          <div className="bg-muted/50 p-2.5 rounded-xl border border-border/40 flex items-start gap-2">
            <MapPin className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {fetchingAddress ? "Đang xác định địa chỉ..." : address}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                Vĩ độ: <span className="text-amber-500 font-bold">{position.lat.toFixed(5)}</span> | Kinh độ: <span className="text-amber-500 font-bold">{position.lng.toFixed(5)}</span>
              </p>
            </div>
          </div>

          {/* Interactive Leaflet Map Container with Floating GPS Button */}
          <div className="relative w-full h-[240px] sm:h-[320px] rounded-xl border border-border/50 shadow-inner overflow-hidden">
            <div
              ref={mapContainerRef}
              className="w-full h-full z-0"
            />
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={loading}
              className="absolute bottom-3 right-3 z-[1000] bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold px-3 py-2 rounded-xl shadow-xl border border-amber-300 flex items-center gap-1.5 text-xs cursor-pointer transition-all"
              title="Định vị trí hiện tại của tôi"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Navigation className="size-4 fill-slate-950" />}
              <span>Lấy vị trí hiện tại</span>
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
            <Compass className="size-3 text-amber-500" />
            <span>Click vào bất kỳ vị trí nào hoặc kéo thả ghim đỏ để chọn vị trí mong muốn</span>
          </p>
        </div>

        <DialogFooter className="p-4 border-t border-border/40 bg-muted/30 gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} className="rounded-xl text-xs cursor-pointer">
            Hủy
          </Button>
          <Button
            onClick={handleSend}
            disabled={fetchingAddress}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold text-xs gap-1.5 shadow-md cursor-pointer"
          >
            <Check className="size-4" />
            Xác nhận gửi vị trí này
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
