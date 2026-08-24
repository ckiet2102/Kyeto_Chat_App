import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Video, Square, Send, Trash2, Camera } from "lucide-react";
import { toast } from "sonner";

interface VideoRecorderProps {
  onSendVideo: (videoBlob: Blob) => void;
}

export default function VideoRecorder({ onSendVideo }: VideoRecorderProps) {
  const [open, setOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể mở Camera");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setIsRecording(false);
      setRecordedBlob(null);
      setVideoPreviewUrl(null);
      setSeconds(0);
    }
  }, [open]);

  const startRecording = () => {
    if (!streamRef.current) return;
    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      setVideoPreviewUrl(URL.createObjectURL(blob));
    };

    mediaRecorder.start();
    setIsRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev >= 59) {
          stopRecording();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (recordedBlob) {
      onSendVideo(recordedBlob);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9 rounded-xl text-muted-foreground hover:text-foreground">
          <Camera className="size-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="size-5 text-primary" />
            Quay Video ngắn (Tối đa 60s)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-border/40">
            {videoPreviewUrl ? (
              <video src={videoPreviewUrl} controls className="w-full h-full object-cover" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}

            {isRecording && (
              <div className="absolute top-3 left-3 bg-red-600/90 text-white text-xs font-mono px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                <span className="size-2 bg-white rounded-full" />
                0:{seconds < 10 ? `0${seconds}` : seconds} / 0:60
              </div>
            )}
          </div>

          <div className="flex justify-center gap-3">
            {!videoPreviewUrl ? (
              isRecording ? (
                <Button variant="destructive" onClick={stopRecording} className="gap-2 rounded-full px-6">
                  <Square className="size-4" /> Dừng quay
                </Button>
              ) : (
                <Button onClick={startRecording} className="gap-2 rounded-full px-6 bg-red-600 hover:bg-red-700 text-white">
                  <Video className="size-4" /> Bắt đầu quay
                </Button>
              )
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setVideoPreviewUrl(null)} className="gap-2 rounded-full">
                  <Trash2 className="size-4 text-destructive" /> Quay lại
                </Button>
                <Button onClick={handleSend} className="gap-2 rounded-full px-6">
                  <Send className="size-4" /> Gửi Video
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
