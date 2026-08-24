import { useEffect, useRef } from "react";
import { useGroupCallStore, type GroupParticipant } from "@/stores/useGroupCallStore";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Monitor,
  Users,
  User,
} from "lucide-react";
import { Button } from "../ui/button";
import UserAvatar from "./UserAvatar";

// Video Tile Component for Remote Peer
function PeerVideoTile({ participant }: { participant: GroupParticipant }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const hasVideoTrack =
    participant.stream &&
    participant.stream.getVideoTracks().length > 0 &&
    participant.stream.getVideoTracks()[0].enabled;

  return (
    <div className="relative aspect-video bg-zinc-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center group">
      {participant.stream && hasVideoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-white/70">
          <UserAvatar
            type="chat"
            name={participant.user.displayName}
            avatarUrl={participant.user.avatarUrl}
            size="lg"
          />
          <span className="text-xs font-semibold">{participant.user.displayName}</span>
        </div>
      )}

      {/* Participant Name Tag Overlay */}
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
        <User className="size-3 text-amber-400" />
        <span>{participant.user.displayName}</span>
      </div>
    </div>
  );
}

export default function GroupCallModal() {
  const {
    isGroupCallActive,
    groupName,
    isVideo,
    localStream,
    peers,
    isMuted,
    isVideoOff,
    isScreenSharing,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    leaveGroupCall,
  } = useGroupCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  if (!isGroupCallActive) return null;

  const peerList = Object.values(peers);
  const totalParticipants = peerList.length + 1; // Local user + peers

  // Determine grid columns dynamically based on participant count
  let gridColsClass = "grid-cols-1 sm:grid-cols-2";
  if (totalParticipants > 4) {
    gridColsClass = "grid-cols-2 lg:grid-cols-3";
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between text-white z-10 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Phòng gọi nhóm: {groupName || "Kyeto Group"}
            </h3>
            <span className="text-xs text-white/70 flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-emerald-400 animate-ping" />
              Đang tham gia ({totalParticipants} thành viên)
            </span>
          </div>
        </div>
      </div>

      {/* Main Responsive Multi-Video Grid */}
      <div className="flex-1 my-4 overflow-y-auto pr-1">
        <div className={`grid ${gridColsClass} gap-4 w-full h-full items-center`}>
          
          {/* Local User Stream Tile */}
          <div className="relative aspect-video bg-zinc-950 rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-2xl flex items-center justify-center">
            {localStream && !isVideoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/70">
                <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <User className="size-8" />
                </div>
                <span className="text-xs font-semibold">Bạn (Tôi)</span>
              </div>
            )}

            {/* Local User Tag */}
            <div className="absolute bottom-2 left-2 bg-amber-500/90 text-slate-950 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
              <span>Bạn (Tôi)</span>
              {isMuted && <MicOff className="size-3 text-red-700 ml-1" />}
            </div>
          </div>

          {/* Remote Peers Video Tiles */}
          {peerList.map((participant) => (
            <PeerVideoTile key={participant.socketId} participant={participant} />
          ))}

        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex items-center justify-center gap-4 z-10 border-t border-white/10 pt-3">
        
        {/* Mute Toggle */}
        <Button
          variant="outline"
          size="icon"
          className={`size-12 rounded-full border-white/20 transition-transform hover:scale-105 cursor-pointer ${
            isMuted
              ? "bg-red-500/20 text-red-500 border-red-500/40"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
          onClick={toggleMute}
          title={isMuted ? "Bật Micro" : "Tắt Micro"}
        >
          {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </Button>

        {/* Camera Toggle */}
        {isVideo && (
          <Button
            variant="outline"
            size="icon"
            className={`size-12 rounded-full border-white/20 transition-transform hover:scale-105 cursor-pointer ${
              isVideoOff
                ? "bg-red-500/20 text-red-500 border-red-500/40"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
            onClick={toggleVideo}
            title={isVideoOff ? "Bật Camera" : "Tắt Camera"}
          >
            {isVideoOff ? <VideoOff className="size-5" /> : <VideoIcon className="size-5" />}
          </Button>
        )}

        {/* Screen Share Toggle */}
        <Button
          variant="outline"
          size="icon"
          className={`size-12 rounded-full border-white/20 transition-transform hover:scale-105 cursor-pointer ${
            isScreenSharing
              ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
          onClick={toggleScreenShare}
          title="Chia sẻ màn hình"
        >
          <Monitor className="size-5" />
        </Button>

        {/* Leave Group Call Button */}
        <Button
          variant="destructive"
          className="h-12 px-6 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-xl hover:scale-105 transition-transform ml-2 gap-2 text-xs cursor-pointer"
          onClick={leaveGroupCall}
        >
          <PhoneOff className="size-5" />
          <span>Rời cuộc gọi nhóm</span>
        </Button>
      </div>

    </div>
  );
}
