import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Square, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onSendVoice: (audioBlob: Blob, duration: number, extension: string) => void;
  onCancel: () => void;
}

export const getSupportedAudioMimeType = (): { mimeType: string; extension: string } => {
  const candidates = [
    { mimeType: "audio/webm;codecs=opus", extension: "webm" },
    { mimeType: "audio/mp4", extension: "m4a" },
    { mimeType: "audio/aac", extension: "aac" },
    { mimeType: "audio/webm", extension: "webm" },
    { mimeType: "audio/ogg;codecs=opus", extension: "ogg" },
  ];

  if (typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function") {
    for (const candidate of candidates) {
      if (MediaRecorder.isTypeSupported(candidate.mimeType)) {
        return candidate;
      }
    }
  }
  return { mimeType: "audio/webm", extension: "webm" };
};

export default function VoiceRecorder({ onSendVoice, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedExtension, setRecordedExtension] = useState<string>("webm");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
    };
  }, []);

  const startTimer = () => {
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const { mimeType, extension } = getSupportedAudioMimeType();
      setRecordedExtension(extension);

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const actualType = mediaRecorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: actualType });
        setRecordedBlob(blob);
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error(err);
      toast.error("Không thể truy cập Microphone");
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const handleSend = () => {
    if (recordedBlob) {
      onSendVoice(recordedBlob, seconds, recordedExtension);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-muted/60 rounded-2xl border border-primary/30 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2 px-3">
        <span className="size-3 bg-red-500 rounded-full animate-ping" />
        <span className="text-xs font-mono font-bold text-foreground">{formatTime(seconds)}</span>
      </div>

      {/* Simulated Waveform bars */}
      <div className="flex items-center gap-1 flex-1 h-6">
        {[40, 70, 30, 90, 50, 80, 60, 100, 40, 70, 90, 50].map((h, i) => (
          <span
            key={i}
            className={`w-1 bg-primary/70 rounded-full transition-all ${isRecording ? "animate-pulse" : ""}`}
            style={{ height: `${isRecording ? Math.min(100, h + Math.random() * 20) : 30}%` }}
          />
        ))}
      </div>

      {isRecording ? (
        <Button variant="ghost" size="icon" onClick={stopRecording} className="size-8 rounded-full text-red-500 hover:bg-red-500/10">
          <Square className="size-4" />
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onCancel} className="size-8 rounded-full text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" />
          </Button>
          <Button size="icon" onClick={handleSend} className="size-8 rounded-full bg-primary text-primary-foreground">
            <Send className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
