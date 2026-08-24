import { useEffect, useRef } from "react";
import { useCallStore } from "@/stores/useCallStore";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Monitor,
  User,
} from "lucide-react";
import { Button } from "../ui/button";
import UserAvatar from "./UserAvatar";
import { soundService } from "@/services/soundService";

const CallModal = () => {
  const {
    callState,
    isVideo,
    caller,
    callee,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    callDuration,
    formatDuration,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    endCall,
  } = useCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (callState === "calling") {
      soundService.playDialingTone();
    } else {
      soundService.stopSound();
    }
    return () => {
      soundService.stopSound();
    };
  }, [callState]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      const playAudio = () => {
        remoteAudioRef.current?.play().catch((err) => {
          console.warn("[WebRTC Audio] Remote audio autoplay error:", err);
        });
      };
      playAudio();
      remoteStream.onaddtrack = () => playAudio();
    }
  }, [remoteStream]);

  if (callState !== "calling" && callState !== "connected") return null;

  const targetUser = callee || caller;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Hidden Audio Element for WebRTC Remote Stream Audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Header Info */}
      <div className="flex items-center justify-between text-white z-10">
        <div className="flex items-center gap-3">
          <UserAvatar
            type="chat"
            name={targetUser?.displayName ?? "Người dùng"}
            avatarUrl={targetUser?.avatarUrl}
          />
          <div>
            <h4 className="font-semibold text-base">{targetUser?.displayName}</h4>
            <span className="text-xs text-white/70 flex items-center gap-1.5">
              {callState === "calling" ? (
                "Đang Đổ Chuông..."
              ) : (
                <>
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono font-medium text-emerald-300">
                    {formatDuration(callDuration)}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Main Video Section */}
      <div className="relative flex-1 my-4 flex items-center justify-center rounded-2xl overflow-hidden bg-zinc-900/80 border border-white/10 shadow-2xl">
        {/* Remote Video Stream */}
        {remoteStream && !isVideoOff ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/80 animate-pulse">
            <UserAvatar
              type="chat"
              name={targetUser?.displayName ?? "User"}
              avatarUrl={targetUser?.avatarUrl}
              size="lg"
            />
            <span className="text-sm font-medium flex items-center gap-1.5">
              {callState === "calling" ? (
                "Đang chờ phản hồi..."
              ) : (
                <>
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-emerald-300">
                    {formatDuration(callDuration)}
                  </span>
                </>
              )}
            </span>
          </div>
        )}

        {/* Local Video Stream (PIP Window) */}
        {localStream && isVideo && (
          <div className="absolute bottom-4 right-4 w-32 sm:w-44 aspect-video bg-zinc-950 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-20">
            {!isVideoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white/60">
                <User className="size-6" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-center gap-4 z-10 py-2">
        {/* Mic toggle */}
        <Button
          variant="outline"
          size="icon"
          className={`size-12 rounded-full border-white/20 transition-transform hover:scale-105 ${
            isMuted
              ? "bg-red-500/20 text-red-500 border-red-500/40"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
          onClick={toggleMute}
          title={isMuted ? "Bật Micro" : "Tắt Micro"}
        >
          {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </Button>

        {/* Camera toggle */}
        {isVideo && (
          <Button
            variant="outline"
            size="icon"
            className={`size-12 rounded-full border-white/20 transition-transform hover:scale-105 ${
              isVideoOff
                ? "bg-red-500/20 text-red-500 border-red-500/40"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
            onClick={toggleVideo}
            title={isVideoOff ? "Bật Camera" : "Tắt Camera"}
          >
            {isVideoOff ? (
              <VideoOff className="size-5" />
            ) : (
              <VideoIcon className="size-5" />
            )}
          </Button>
        )}

        {/* Screen share toggle */}
        {callState === "connected" && (
          <Button
            variant="outline"
            size="icon"
            className={`size-12 rounded-full border-white/20 transition-transform hover:scale-105 ${
              isScreenSharing
                ? "bg-primary text-white border-primary"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
            onClick={toggleScreenShare}
            title="Chia sẻ màn hình"
          >
            <Monitor className="size-5" />
          </Button>
        )}

        {/* End Call button */}
        <Button
          variant="destructive"
          size="icon"
          className="size-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl hover:scale-110 transition-transform ml-2"
          onClick={endCall}
          title="Kết thúc cuộc gọi"
        >
          <PhoneOff className="size-6" />
        </Button>
      </div>
    </div>
  );
};

export default CallModal;
