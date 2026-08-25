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
  return { mimeType: "", extension: "m4a" };
};

export default function VoiceRecorder({ onSendVoice, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedExtension, setRecordedExtension] = useState<string>("webm");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  useEffect(() => {
    isMountedRef.current = true;
    startRecording();

    return () => {
      isMountedRef.current = false;
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        toast.error("Trình duyệt không hỗ trợ ghi âm hoặc cần kết nối HTTPS / Localhost");
        onCancel();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const { mimeType, extension } = getSupportedAudioMimeType();
      setRecordedExtension(extension);

      let mediaRecorder: MediaRecorder;
      try {
        const options = mimeType ? { mimeType } : undefined;
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (mimeErr) {
        console.warn("Failed to use preferred mimeType, using default MediaRecorder:", mimeErr);
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualType = mediaRecorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: actualType });
        setRecordedBlob(blob);
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Request data every 250ms for reliable chunks
      try {
        mediaRecorder.start(250);
      } catch (startErr) {
        // Fallback without timeslice for Safari
        mediaRecorder.start();
      }
      setIsRecording(true);
      startTimer();
    } catch (err: any) {
      console.error("Microphone access error:", err);
      const errMsg = err?.name === "NotAllowedError" 
        ? "Bạn đã từ chối quyền truy cập Micro" 
        : "Không thể truy cập Microphone";
      toast.error(errMsg);
      onCancel();
    }
  };

  const stopRecording = () => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      if (typeof mediaRecorderRef.current.requestData === "function") {
        try {
          mediaRecorderRef.current.requestData();
        } catch (e) {
          // ignore
        }
      }
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSend = () => {
    stopTimer();
    const currentSeconds = seconds;
    const extension = recordedExtension;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      if (typeof mediaRecorderRef.current.requestData === "function") {
        try {
          mediaRecorderRef.current.requestData();
        } catch (e) {
          // ignore
        }
      }
      mediaRecorderRef.current.onstop = () => {
        const actualType = mediaRecorderRef.current?.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: actualType });
        if (blob.size > 0) {
          onSendVoice(blob, currentSeconds, extension);
        } else {
          toast.error("File ghi âm rỗng, vui lòng thử lại");
        }
      };
      mediaRecorderRef.current.stop();
    } else if (recordedBlob) {
      onSendVoice(recordedBlob, seconds, recordedExtension);
    } else {
      toast.error("Chưa có dữ liệu ghi âm");
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

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="size-8 rounded-full text-muted-foreground hover:text-destructive"
          title="Hủy ghi âm"
        >
          <Trash2 className="size-4" />
        </Button>

        {isRecording && (
          <Button
            variant="ghost"
            size="icon"
            onClick={stopRecording}
            className="size-8 rounded-full text-red-500 hover:bg-red-500/10"
            title="Dừng ghi âm"
          >
            <Square className="size-4" />
          </Button>
        )}

        <Button
          size="icon"
          onClick={handleSend}
          className="size-8 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 hover:scale-105 transition-transform"
          title="Gửi tin nhắn thoại"
        >
          <Send className="size-4 fill-slate-950 text-slate-950 ml-0.5" />
        </Button>
      </div>
    </div>
  );
}
