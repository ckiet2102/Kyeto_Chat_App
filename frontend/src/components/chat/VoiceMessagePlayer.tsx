import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "../ui/button";
import { fixFileUrl } from "@/lib/urlFix";

interface VoiceMessagePlayerProps {
  src: string;
  isOwn?: boolean;
  initialDuration?: number;
  customColor?: string;
}

// 20 vertical waveform bar heights representing realistic audio spectrum
const WAVEFORM_HEIGHTS = [
  35, 65, 40, 85, 55, 95, 70, 45, 80, 100, 60, 40, 75, 90, 50, 65, 80, 45, 30, 60,
];

export default function VoiceMessagePlayer({
  src,
  isOwn = false,
  initialDuration = 0,
  customColor,
}: VoiceMessagePlayerProps) {
  const fixedSrc = fixFileUrl(src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(initialDuration);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0 || !isFinite(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const togglePlay = () => {
    if (!audioRef.current || hasError) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Audio playback error:", err);
        setHasError(true);
        setIsPlaying(false);
      });
      setIsPlaying(true);
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
    console.warn("[VoiceMessagePlayer] Audio error:", e);
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
    effectiveDuration > 0 ? Math.min(1, Math.max(0, currentTime / effectiveDuration)) : 0;

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * (effectiveDuration || 100);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const getContainerStyle = () => {
    if (isOwn && customColor) {
      return { backgroundColor: customColor, color: "#ffffff" };
    }
    return {};
  };

  const isPausedMidtrack = !isPlaying && currentTime > 0 && currentTime < effectiveDuration;

  return (
    <div
      style={getContainerStyle()}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-full min-w-[200px] max-w-[280px] sm:max-w-[320px] shadow-sm transition-all select-none ${
        isOwn
          ? !customColor && "bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-medium"
          : "bg-card dark:bg-zinc-800/90 text-foreground border border-border/60"
      }`}
    >
      <audio
        ref={audioRef}
        src={fixedSrc}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
      />

      {/* Solid Play/Pause Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        className="size-8 rounded-full shrink-0 hover:scale-105 active:scale-95 transition-transform p-0 text-current hover:bg-black/10 dark:hover:bg-white/10"
      >
        {isPlaying ? (
          <Pause className="size-5 fill-current" />
        ) : (
          <Play className="size-5 fill-current ml-0.5" />
        )}
      </Button>

      {/* Waveform Visualizer & Seek Area */}
      <div
        onClick={handleWaveformClick}
        className="flex items-center gap-[3px] flex-1 h-7 cursor-pointer py-1 group/wave"
        title="Bấm để tua"
      >
        {WAVEFORM_HEIGHTS.map((height, i) => {
          const barRatio = (i + 1) / WAVEFORM_HEIGHTS.length;
          const isFilled = barRatio <= progressRatio;

          return (
            <div
              key={i}
              className="flex-1 flex items-center justify-center h-full"
            >
              <span
                className={`w-full max-w-[3px] rounded-full transition-all duration-150 ${
                  isOwn
                    ? isFilled
                      ? "bg-current opacity-100"
                      : "bg-current opacity-40 group-hover/wave:opacity-60"
                    : isFilled
                    ? "bg-amber-500 dark:bg-amber-400 opacity-100"
                    : "bg-muted-foreground/30 dark:bg-muted-foreground/40 group-hover/wave:opacity-60"
                } ${isPlaying && isFilled ? "animate-pulse" : ""}`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Duration & Playback Timer Display */}
      <span className="text-xs font-mono font-bold shrink-0 opacity-90 text-right">
        {isPlaying || isPausedMidtrack
          ? `${formatTime(currentTime)} / ${formatTime(effectiveDuration)}`
          : formatTime(effectiveDuration)}
      </span>
    </div>
  );
}
