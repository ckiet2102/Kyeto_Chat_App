import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { ExternalLink, Globe } from "lucide-react";

interface LinkPreviewCardProps {
  url: string;
}

interface PreviewData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
}

export default function LinkPreviewCard({ url }: LinkPreviewCardProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      try {
        setLoading(true);
        const res = await api.post("/messages/link-preview", { url });
        if (isMounted && res.data?.preview) {
          setPreview(res.data.preview);
        }
      } catch (err) {
        console.error("Link preview error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPreview();
    return () => {
      isMounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="mt-2 p-2.5 rounded-xl border border-amber-500/20 bg-card/60 animate-pulse text-xs flex items-center gap-2 text-muted-foreground">
        <Globe className="size-4 animate-spin text-amber-500" />
        <span>Đang tải xem trước liên kết...</span>
      </div>
    );
  }

  if (!preview || (!preview.title && !preview.description)) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block rounded-xl border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10 overflow-hidden transition-all duration-200 group text-left"
    >
      {preview.image && (
        <div className="h-32 w-full overflow-hidden bg-muted relative">
          <img
            src={preview.image}
            alt={preview.title || "Link preview"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500">
          <Globe className="size-3.5" />
          <span className="truncate">{preview.siteName || new URL(url).hostname}</span>
          <ExternalLink className="size-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {preview.title && (
          <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-amber-500 transition-colors">
            {preview.title}
          </h4>
        )}
        {preview.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
}
