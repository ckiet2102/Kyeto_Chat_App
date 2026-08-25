import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "../ui/button";
import { fixFileUrl } from "@/lib/urlFix";
import api from "@/lib/axios";

interface VoiceMessagePlayerProps {
  src: string;
  isOwn?: boolean;
  initialDuration?: number; // seconds from metadata if available
  customColor?: string;
}

export default function VoiceMessagePlayer({
  src,
  isOwn = false,
  initialDuration = 0,
  customColor,
}: VoiceMessagePlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(initialDuration);
  const [, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    let createdObjectUrl: string | null = null;

    const loadAudio = async () => {
      if (!src) return;
      const targetUrl = fixFileUrl(src);

      if (targetUrl.startsWith("blob:") || targetUrl.startsWith("data:")) {
        if (isMounted) setAudioUrl(targetUrl);
        return;
      }

      setLoadingAudio(true);
      try {
        const response = await api.get(targetUrl, { responseType: "blob" });
        if (isMounted) {
          createdObjectUrl = URL.createObjectURL(response.data);
          setAudioUrl(createdObjectUrl);
          setHasError(false);
        }
      } catch (err) {
        console.warn("Axios audio blob fetch error, falling back to direct targetUrl:", err);
        if (isMounted) {
          setAudioUrl(targetUrl);
        }
      } finally {
        if (isMounted) setLoadingAudio(false);
      }
    };

    loadAudio();

    return () => {
      isMounted = false;
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [src]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0 || !isFinite(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setHasError(false);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Audio playback error:", err, "url:", audioUrl);
          setHasError(true);
          setIsPlaying(false);
        });
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    setHasError(false);
    if (audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleError = (e: any) => {
    console.warn("[VoiceMessagePlayer] Audio error:", e, "src:", audioUrl);
    setHasError(true);
    setIsPlaying(false);
  };

  const effectiveDuration =
    duration && isFinite(duration) && duration > 0
      ? duration
      : initialDuration && initialDuration > 0
      ? initialDuration
      : 0;

  const progressRatio =
    effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !effectiveDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;
    const newTime = ratio * effectiveDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl max-w-[260px] sm:max-w-[300px] shadow-sm select-none transition-colors ${
        isOwn
          ? "bg-primary text-primary-foreground"
          : "bg-muted/80 text-foreground border border-border/50"
      }`}
      style={customColor && isOwn ? { backgroundColor: customColor } : undefined}
    >
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onDurationChange={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={handleError}
        />
      )}

      {/* Solid Play/Pause Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        disabled={loadingAudio || !audioUrl}
        className="size-8 rounded-full shrink-0 hover:scale-105 active:scale-95 transition-transform p-0 text-current hover:bg-black/10 dark:hover:bg-white/10"
      >
        {isPlaying ? (
          <Pause className="size-4 fill-current" />
        ) : (
          <Play className="size-4 fill-current translate-x-0.5" />
        )}
      </Button>

      {/* Waveform / Progress Slider */}
      <div className="flex-1 flex flex-col justify-center gap-1 cursor-pointer" onClick={handleSeek}>
        <div className="relative w-full h-2 rounded-full overflow-hidden bg-black/15 dark:bg-white/15">
          <div
            className="absolute top-0 left-0 bottom-0 bg-current transition-all duration-100 ease-linear rounded-full"
            style={{ width: `${progressRatio}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono opacity-80 leading-none">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(effectiveDuration)}</span>
        </div>
      </div>

      {/* Mute toggle button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleMute}
        className="size-6 rounded-full shrink-0 text-current opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 p-0"
      >
        {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
      </Button>
    </div>
  );
}
