import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Image as ImageIcon, Search, Loader2 } from "lucide-react";

interface GifPickerProps {
  onSelectGif: (gifUrl: string) => void;
}

const POPULAR_GIFS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc29mdnU0eXNndmlnbWFndWl4ZmVxdXlycGFxNXRiOGkyeDFxdTBlNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlHFRbmaZtBRhXG/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Zud3E1bnhiaWs0bW0zYnVxeHVycm41bWVwZnQyMXc5OGx2ZThvNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d31w24psGYeekCXY/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWRmbWxsYnhmdnFnNmExaDRsc2d2ZHpvdzhscXUzOXdta2kydHFvOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKsjLu9KflWnkyI/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGcxYWxudmkyNmdrOW52eW5kdzZ0Z3k4dmhkeGF3OW8zcTBwdHRucyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/13G7mmmGPN95v2/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnZzaHZwNXNkbTVmdjM1bzRwODNmd3lxcjBhYzltNHRmdnVmd3kybyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT0xezQGU5xCDJuCPe/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2F3OXd2OXBsMHAxbHdrdWpsM2RtcGNvZGtzZWszbmk2OGdvaXVicSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPnAiaMCws8nOsE/giphy.gif",
];

export default function GifPicker({ onSelectGif }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<string[]>(POPULAR_GIFS);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchGifs = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setGifs(POPULAR_GIFS);
      return;
    }

    try {
      setLoading(true);
      const apiKey = import.meta.env.VITE_GIPHY_API_KEY || "dc6zaTOxFJmzC"; // Giphy public beta key
      const res = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(
          searchQuery
        )}&limit=12&rating=g`
      );
      const data = await res.json();
      if (data?.data && Array.isArray(data.data)) {
        const urls = data.data.map((item: any) => item.images?.fixed_height?.url).filter(Boolean);
        setGifs(urls.length > 0 ? urls : POPULAR_GIFS);
      }
    } catch (err) {
      console.warn("Giphy API error, using popular fallbacks:", err);
      setGifs(POPULAR_GIFS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGifs(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9 rounded-xl text-muted-foreground hover:text-foreground" title="Chọn GIF">
          <ImageIcon className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 shadow-xl" align="start">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm GIF trên GIPHY..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-36">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto beautiful-scrollbar">
              {gifs.map((gifUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectGif(gifUrl);
                    setOpen(false);
                  }}
                  className="rounded-xl overflow-hidden border border-border/40 hover:border-primary transition-all hover:scale-105"
                >
                  <img src={gifUrl} alt="GIF" className="w-full h-24 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
