import { create } from "zustand";
import { useSocketStore } from "./useSocketStore";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";
import { soundService } from "@/services/soundService";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelay",
      credential: "openrelay",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelay",
      credential: "openrelay",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelay",
      credential: "openrelay",
    },
  ],
};

export interface GroupParticipant {
  socketId: string;
  user: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  };
  stream?: MediaStream;
  pc?: RTCPeerConnection;
}

export interface ActiveCallInfo {
  conversationId: string;
  groupName?: string;
  callType: "group" | "direct";
  isVideo: boolean;
  startedAt: number;
  callerName?: string;
}

interface GroupCallStore {
  isGroupCallActive: boolean;
  groupId: string | null;
  groupName: string;
  isVideo: boolean;
  localStream: MediaStream | null;
  peers: Record<string, GroupParticipant>;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;

  activeCalls: Record<string, ActiveCallInfo>;

  incomingGroupCall: {
    caller: { _id: string; displayName: string; avatarUrl?: string };
    groupId: string;
    groupName: string;
    isVideo: boolean;
  } | null;

  startGroupCall: (groupId: string, groupName: string, isVideo: boolean) => Promise<void>;
  leaveGroupCall: () => void;
  joinIncomingGroupCall: () => Promise<void>;
  rejectIncomingGroupCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  initSocketListeners: () => void;
  cleanupSocketListeners: () => void;
  bindGlobalGroupCallSocket: () => void;
}

export const useGroupCallStore = create<GroupCallStore>((set, get) => ({
  isGroupCallActive: false,
  groupId: null,
  groupName: "",
  isVideo: true,
  localStream: null,
  peers: {},
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  activeCalls: {},
  incomingGroupCall: null,

  startGroupCall: async (groupId, groupName, isVideo) => {
    try {
      soundService.stopSound();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });

      set({
        isGroupCallActive: true,
        groupId,
        groupName,
        isVideo,
        localStream: stream,
        peers: {},
        isMuted: false,
        isVideoOff: !isVideo,
      });

      get().initSocketListeners();

      const socket = useSocketStore.getState().socket;
      socket?.emit("group-call:start", { groupId, groupName, isVideo });
      socket?.emit("group-call:join", { groupId, isVideo });
    } catch (err) {
      console.error("Lỗi khởi tạo cuộc gọi nhóm:", err);
      toast.error("Không thể mở Camera hoặc Micro cho cuộc gọi nhóm!");
      get().leaveGroupCall();
    }
  },

  joinIncomingGroupCall: async () => {
    soundService.stopSound();
    const { incomingGroupCall } = get();
    if (!incomingGroupCall) return;
    const { groupId, groupName, isVideo } = incomingGroupCall;
    set({ incomingGroupCall: null });
    await get().startGroupCall(groupId, groupName, isVideo);
  },

  rejectIncomingGroupCall: () => {
    soundService.stopSound();
    set({ incomingGroupCall: null });
  },

  leaveGroupCall: () => {
    soundService.stopSound();
    const { groupId, localStream, peers } = get();
    const socket = useSocketStore.getState().socket;

    if (groupId) {
      socket?.emit("group-call:leave", { groupId });
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    Object.values(peers).forEach((p) => {
      if (p.pc) {
        try {
          p.pc.close();
        } catch {}
      }
    });

    get().cleanupSocketListeners();

    set({
      isGroupCallActive: false,
      groupId: null,
      groupName: "",
      isVideo: true,
      localStream: null,
      peers: {},
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
    });
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
    const { localStream, isScreenSharing, isVideo, peers } = get();
    if (!localStream) return;

    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        Object.values(peers).forEach((p) => {
          if (p.pc) {
            const videoSender = p.pc.getSenders().find((s) => s.track?.kind === "video");
            if (videoSender) videoSender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          get().toggleScreenShare();
        };

        set({ isScreenSharing: true });
      } else {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        const camTrack = camStream.getVideoTracks()[0];

        Object.values(peers).forEach((p) => {
          if (p.pc && camTrack) {
            const videoSender = p.pc.getSenders().find((s) => s.track?.kind === "video");
            if (videoSender) videoSender.replaceTrack(camTrack);
          }
        });

        set({ isScreenSharing: false });
      }
    } catch (err) {
      console.error("Lỗi chia sẻ màn hình nhóm:", err);
    }
  },

  initSocketListeners: () => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    // Helper: Create Peer Connection for a target participant
    const createPeerConnection = (targetSocketId: string, targetUser: any) => {
      const { localStream } = get();
      const pc = new RTCPeerConnection(ICE_SERVERS);
      const remoteStream = new MediaStream();

      if (localStream) {
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
      }

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
        set((state) => ({
          peers: {
            ...state.peers,
            [targetSocketId]: {
              ...state.peers[targetSocketId],
              stream: remoteStream,
            },
          },
        }));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("group-call:signal", {
            toSocketId: targetSocketId,
            signalData: { type: "candidate", candidate: event.candidate },
          });
        }
      };

      set((state) => ({
        peers: {
          ...state.peers,
          [targetSocketId]: {
            socketId: targetSocketId,
            user: targetUser,
            stream: remoteStream,
            pc,
          },
        },
      }));

      return pc;
    };

    // 1. Current room participants received
    socket.off("group-call:room-users");
    socket.on("group-call:room-users", async ({ participants }) => {
      for (const p of participants) {
        const pc = createPeerConnection(p.socketId, p.user);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("group-call:signal", {
          toSocketId: p.socketId,
          signalData: { type: "offer", offer },
        });
      }
    });

    // 2. New user joined room
    socket.off("group-call:user-joined");
    socket.on("group-call:user-joined", ({ socketId, user }) => {
      toast.info(`${user.displayName} đã tham gia cuộc gọi nhóm!`);
      createPeerConnection(socketId, user);
    });

    // 3. WebRTC Signal exchange (Offer / Answer / ICE Candidate)
    socket.off("group-call:signal");
    socket.on("group-call:signal", async ({ fromSocketId, fromUser, signalData }) => {
      let peer = get().peers[fromSocketId];
      let pc = peer?.pc;

      if (!pc) {
        pc = createPeerConnection(fromSocketId, fromUser);
      }

      try {
        if (signalData.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("group-call:signal", {
            toSocketId: fromSocketId,
            signalData: { type: "answer", answer },
          });
        } else if (signalData.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.answer));
        } else if (signalData.type === "candidate" && signalData.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        }
      } catch (err) {
        console.error("Lỗi tín hiệu WebRTC cuộc gọi nhóm:", err);
      }
    });

    // 4. User left room
    socket.off("group-call:user-left");
    socket.on("group-call:user-left", ({ socketId }) => {
      const peer = get().peers[socketId];
      if (peer) {
        toast.info(`${peer.user.displayName} đã rời cuộc gọi nhóm.`);
        if (peer.pc) {
          try {
            peer.pc.close();
          } catch {}
        }
      }

      set((state) => {
        const nextPeers = { ...state.peers };
        delete nextPeers[socketId];
        return { peers: nextPeers };
      });
    });
  },

  cleanupSocketListeners: () => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    socket.off("group-call:room-users");
    socket.off("group-call:user-joined");
    socket.off("group-call:signal");
    socket.off("group-call:user-left");
  },

  bindGlobalGroupCallSocket: () => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    socket.off("incoming-group-call");
    socket.on("incoming-group-call", ({ caller, groupId, groupName, isVideo }) => {
      const currentUserId = useAuthStore.getState().user?._id;
      if (caller._id === currentUserId) return;

      const isAlreadyInCall = get().isGroupCallActive;
      if (!isAlreadyInCall) {
        set({
          incomingGroupCall: { caller, groupId, groupName, isVideo },
        });
      }
    });

    socket.off("active-calls-updated");
    socket.on("active-calls-updated", (callsList: ActiveCallInfo[]) => {
      const map: Record<string, ActiveCallInfo> = {};
      if (Array.isArray(callsList)) {
        callsList.forEach((c) => {
          if (c && c.conversationId) {
            map[c.conversationId] = c;
          }
        });
      }
      set({ activeCalls: map });
    });
  },
}));
