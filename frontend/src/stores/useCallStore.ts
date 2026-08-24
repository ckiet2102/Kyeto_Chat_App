import { create } from "zustand";
import { useSocketStore } from "./useSocketStore";
import { toast } from "sonner";
import { chatService } from "@/services/chatService";
import { soundService } from "@/services/soundService";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

export type CallState = "idle" | "calling" | "incoming" | "connected";

interface CallUser {
  _id: string;
  displayName: string;
  avatarUrl?: string;
}

interface CallStore {
  callState: CallState;
  isVideo: boolean;
  caller: CallUser | null;
  callee: CallUser | null;
  conversationId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  incomingOffer: RTCSessionDescriptionInit | null;
  peerConnection: RTCPeerConnection | null;
  targetId: string | null;
  connectedAt: number | null;
  callDuration: number;
  timerIntervalId: any | null;

  startCall: (
    recipientId: string,
    conversationId: string,
    isVideo: boolean,
    recipientInfo: CallUser
  ) => Promise<void>;
  handleIncomingCall: (data: {
    caller: CallUser;
    conversationId: string;
    offer: RTCSessionDescriptionInit;
    isVideo: boolean;
  }) => void;
  handleDismissIncomingCall: () => void;
  answerCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  handleCallAccepted: (data: { callee: CallUser; answer: RTCSessionDescriptionInit }) => Promise<void>;
  handleIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  handleCallRejected: () => void;
  handleCallEnded: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  resetCallState: () => void;
  bindGlobalCallSocket: () => void;
  startTimer: () => void;
  formatDuration: (seconds: number) => string;
}

export const useCallStore = create<CallStore>((set, get) => ({
  callState: "idle",
  isVideo: true,
  caller: null,
  callee: null,
  conversationId: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  incomingOffer: null,
  peerConnection: null,
  targetId: null,
  connectedAt: null,
  callDuration: 0,
  timerIntervalId: null,

  formatDuration: (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    if (totalSeconds >= 3600) {
      const hrs = Math.floor(totalSeconds / 3600);
      const remMins = mins % 60;
      return `${pad(hrs)}:${pad(remMins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  },

  startTimer: () => {
    const existing = get().timerIntervalId;
    if (existing) clearInterval(existing);
    const now = Date.now();
    const intervalId = setInterval(() => {
      const { connectedAt } = get();
      if (connectedAt) {
        const secs = Math.floor((Date.now() - connectedAt) / 1000);
        set({ callDuration: secs });
      }
    }, 1000);
    set({ connectedAt: now, callDuration: 0, timerIntervalId: intervalId });
  },

  startCall: async (recipientId, conversationId, isVideo, recipientInfo) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });

      const pc = new RTCPeerConnection(ICE_SERVERS);
      const remoteStream = new MediaStream();

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = useSocketStore.getState().socket;
          socket?.emit("ice-candidate", {
            targetId: recipientId,
            candidate: event.candidate,
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const socket = useSocketStore.getState().socket;
      socket?.emit("call-user", {
        recipientId,
        conversationId,
        offer,
        isVideo,
      });

      set({
        callState: "calling",
        isVideo,
        callee: recipientInfo,
        conversationId,
        localStream: stream,
        remoteStream,
        peerConnection: pc,
        targetId: recipientId,
        isMuted: false,
        isVideoOff: !isVideo,
      });
      soundService.playDialingTone();
    } catch (error) {
      console.error("Lỗi khi mở camera/micro:", error);
      toast.error("Không thể truy cập Micro hoặc Camera của thiết bị!");
      get().resetCallState();
    }
  },

  handleIncomingCall: ({ caller, conversationId, offer, isVideo }) => {
    set({
      callState: "incoming",
      caller,
      conversationId,
      incomingOffer: offer,
      isVideo,
      targetId: caller._id,
    });
    soundService.playIncomingRingtone();
  },

  handleDismissIncomingCall: () => {
    const { callState } = get();
    if (callState === "incoming") {
      soundService.stopSound();
      set({
        callState: "idle",
        incomingOffer: null,
        caller: null,
        targetId: null,
      });
    }
  },

  answerCall: async () => {
    const { incomingOffer, targetId, isVideo } = get();
    if (!incomingOffer || !targetId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });

      const pc = new RTCPeerConnection(ICE_SERVERS);
      const remoteStream = new MediaStream();

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = useSocketStore.getState().socket;
          socket?.emit("ice-candidate", {
            targetId,
            candidate: event.candidate,
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const socket = useSocketStore.getState().socket;
      socket?.emit("answer-call", {
        callerId: targetId,
        answer,
      });

      set({
        callState: "connected",
        localStream: stream,
        remoteStream,
        peerConnection: pc,
        isMuted: false,
        isVideoOff: !isVideo,
      });
      soundService.stopSound();
      get().startTimer();
    } catch (error) {
      console.error("Lỗi khi chấp nhận cuộc gọi:", error);
      toast.error("Không thể kết nối thiết bị cuộc gọi!");
      get().resetCallState();
    }
  },

  handleCallAccepted: async ({ callee, answer }) => {
    const { peerConnection } = get();
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      set({
        callState: "connected",
        callee,
      });
      soundService.stopSound();
      get().startTimer();
    }
  },

  handleIceCandidate: async (candidate) => {
    const { peerConnection } = get();
    if (peerConnection && candidate) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Lỗi thêm ICE candidate:", e);
      }
    }
  },

  rejectCall: () => {
    const { targetId, conversationId, isVideo, callState, connectedAt, callDuration, formatDuration } = get();
    const socket = useSocketStore.getState().socket;
    if (targetId || conversationId) {
      socket?.emit("reject-call", { callerId: targetId, conversationId });
      if (targetId) {
        let status = "missed";
        let durationStr = "00:00";
        if (callState === "connected" && connectedAt) {
          status = "completed";
          durationStr = formatDuration(callDuration);
        } else {
          status = callState === "incoming" ? "rejected" : "missed";
        }
        chatService.createCallLog({
          receiverId: targetId,
          conversationId: conversationId ?? undefined,
          isVideo,
          status,
          duration: durationStr,
        }).catch(console.error);
      }
    }
    get().resetCallState();
  },

  handleCallRejected: () => {
    toast.info("Cuộc gọi đã bị từ chối.");
    get().resetCallState();
  },

  endCall: () => {
    const { targetId, conversationId, isVideo, callState, connectedAt, callDuration, formatDuration } = get();
    const socket = useSocketStore.getState().socket;
    socket?.emit("end-call", { targetId, conversationId });
    if (targetId) {
      let status = "completed";
      let durationStr = "00:00";
      if (callState === "connected" && connectedAt) {
        status = "completed";
        durationStr = formatDuration(callDuration);
      } else {
        status = "missed";
      }
      chatService.createCallLog({
        receiverId: targetId,
        conversationId: conversationId ?? undefined,
        isVideo,
        status,
        duration: durationStr,
      }).catch(console.error);
    }
    get().resetCallState();
  },

  handleCallEnded: () => {
    toast.info("Cuộc gọi đã kết thúc.");
    get().resetCallState();
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      set({ isMuted: !isMuted });
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
      set({ isVideoOff: !isVideoOff });
    }
  },

  toggleScreenShare: async () => {
    const { peerConnection, localStream, isScreenSharing, isVideo } = get();
    if (!peerConnection || !localStream) return;

    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        const videoSender = peerConnection
          .getSenders()
          .find((s) => s.track?.kind === "video");

        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          get().toggleScreenShare();
        };

        set({ isScreenSharing: true });
      } else {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        const camTrack = camStream.getVideoTracks()[0];

        const videoSender = peerConnection
          .getSenders()
          .find((s) => s.track?.kind === "video");

        if (videoSender && camTrack) {
          videoSender.replaceTrack(camTrack);
        }

        set({ isScreenSharing: false });
      }
    } catch (error) {
      console.error("Lỗi khi chia sẻ màn hình:", error);
    }
  },

  resetCallState: () => {
    soundService.stopSound();
    const { localStream, peerConnection, timerIntervalId } = get();

    if (timerIntervalId) {
      clearInterval(timerIntervalId);
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (peerConnection) {
      peerConnection.close();
    }

    set({
      callState: "idle",
      isVideo: true,
      caller: null,
      callee: null,
      conversationId: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      incomingOffer: null,
      peerConnection: null,
      targetId: null,
      connectedAt: null,
      callDuration: 0,
      timerIntervalId: null,
    });
  },

  bindGlobalCallSocket: () => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    socket.off("incoming-call");
    socket.on("incoming-call", (data) => {
      console.log("[GlobalCallSocket] Nhận tín hiệu incoming-call (cá nhân):", data);
      get().handleIncomingCall(data);
    });

    socket.off("dismiss-incoming-call");
    socket.on("dismiss-incoming-call", () => {
      console.log("[GlobalCallSocket] Đã xử lý cuộc gọi trên thiết bị khác -> Đóng popup & tắt chuông");
      get().handleDismissIncomingCall();
    });

    socket.off("call-accepted");
    socket.on("call-accepted", (data) => {
      get().handleCallAccepted(data);
    });

    socket.off("ice-candidate");
    socket.on("ice-candidate", ({ candidate }) => {
      get().handleIceCandidate(candidate);
    });

    socket.off("call-rejected");
    socket.on("call-rejected", () => {
      get().handleCallRejected();
    });

    socket.off("call-ended");
    socket.on("call-ended", () => {
      get().handleCallEnded();
    });
  },
}));
