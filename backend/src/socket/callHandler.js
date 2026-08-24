import Conversation from "../models/Conversation.js";

const activeGroupCalls = new Map();
const activeCallsMap = new Map();

const broadcastActiveCalls = (io) => {
  const list = Array.from(activeCallsMap.values());
  io.emit("active-calls-updated", list);
};

export const registerCallHandlers = (io, socket, user) => {
  // Sync active calls upon connection
  socket.emit("active-calls-updated", Array.from(activeCallsMap.values()));

  // 1. Caller initiates a call
  socket.on("call-user", ({ recipientId, conversationId, offer, isVideo }) => {
    if (conversationId) {
      activeCallsMap.set(conversationId, {
        conversationId,
        callType: "direct",
        isVideo,
        startedAt: Date.now(),
        callerName: user.displayName,
      });
      broadcastActiveCalls(io);
    }

    io.to(recipientId.toString()).emit("incoming-call", {
      caller: {
        _id: user._id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      conversationId,
      offer,
      isVideo,
    });
  });

  // 2. Callee answers call
  socket.on("answer-call", ({ callerId, answer }) => {
    io.to(callerId.toString()).emit("call-accepted", {
      callee: {
        _id: user._id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      answer,
    });

    // Multi-device sync: Notify callee's other logged in devices to dismiss incoming call popup & ring
    socket.to(user._id.toString()).emit("dismiss-incoming-call", {
      callerId,
      reason: "answered_on_other_device",
    });
  });

  // 3. ICE Candidates exchange
  socket.on("ice-candidate", ({ targetId, candidate }) => {
    if (targetId) {
      io.to(targetId.toString()).emit("ice-candidate", {
        senderId: user._id,
        candidate,
      });
    }
  });

  // 4. Reject call
  socket.on("reject-call", ({ callerId, conversationId }) => {
    if (conversationId && activeCallsMap.has(conversationId)) {
      activeCallsMap.delete(conversationId);
      broadcastActiveCalls(io);
    }
    if (callerId) {
      io.to(callerId.toString()).emit("call-rejected", {
        calleeId: user._id,
      });
    }

    // Multi-device sync: Notify callee's other logged in devices to dismiss incoming call popup & ring
    socket.to(user._id.toString()).emit("dismiss-incoming-call", {
      callerId,
      conversationId,
      reason: "rejected_on_other_device",
    });
  });

  // 5. End call
  socket.on("end-call", ({ targetId, conversationId }) => {
    if (conversationId && activeCallsMap.has(conversationId)) {
      activeCallsMap.delete(conversationId);
      broadcastActiveCalls(io);
    }
    if (targetId) {
      io.to(targetId.toString()).emit("call-ended", { senderId: user._id });
    } else if (conversationId) {
      socket.to(conversationId).emit("call-ended", { senderId: user._id });
    }
  });

  // 6. Toggle audio / video
  socket.on("toggle-media", ({ targetId, type, enabled }) => {
    if (targetId) {
      io.to(targetId.toString()).emit("peer-toggle-media", {
        senderId: user._id,
        type,
        enabled,
      });
    }
  });

  // ==================== 7. GROUP CALL SIGNALING ====================
  socket.on("group-call:start", async ({ groupId, groupName, isVideo }) => {
    activeCallsMap.set(groupId, {
      conversationId: groupId,
      groupName: groupName || "Cuộc gọi nhóm",
      callType: "group",
      isVideo,
      startedAt: Date.now(),
      callerName: user.displayName,
    });
    broadcastActiveCalls(io);

    try {
      const conversation = await Conversation.findById(groupId);
      const payload = {
        caller: {
          _id: user._id.toString(),
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        groupId,
        groupName: groupName || (conversation?.group?.name || "Cuộc gọi nhóm"),
        isVideo,
      };

      // 1. Broadcast to the conversation socket room (excluding sender)
      socket.to(groupId.toString()).emit("incoming-group-call", payload);

      // 2. Broadcast to each participant's individual user socket room
      if (conversation && conversation.participants) {
        const callerIdStr = user._id.toString();
        conversation.participants.forEach((p) => {
          const pIdStr = typeof p === "object" ? (p._id ? p._id.toString() : p.toString()) : p.toString();
          if (pIdStr !== callerIdStr) {
            io.to(pIdStr).emit("incoming-group-call", payload);
          }
        });
      }
    } catch (err) {
      console.error("Lỗi broadcast thông báo cuộc gọi nhóm:", err);
    }
  });

  socket.on("group-call:join", ({ groupId, isVideo }) => {
    const roomName = `group-call:${groupId}`;
    socket.join(roomName);

    if (!activeGroupCalls.has(groupId)) {
      activeGroupCalls.set(groupId, new Map());
    }
    const roomUsers = activeGroupCalls.get(groupId);

    // Get list of existing users before adding current user
    const existingParticipants = Array.from(roomUsers.values()).map((p) => ({
      socketId: p.socketId,
      user: p.user,
      isVideo: p.isVideo,
    }));

    // Add current user to room Map
    roomUsers.set(socket.id, {
      socketId: socket.id,
      user: {
        _id: user._id.toString(),
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      isVideo,
    });

    // Send existing users to joining participant
    socket.emit("group-call:room-users", { participants: existingParticipants });

    // Notify existing participants about new joiner
    socket.to(roomName).emit("group-call:user-joined", {
      socketId: socket.id,
      user: {
        _id: user._id.toString(),
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      isVideo,
    });
  });

  socket.on("group-call:signal", ({ toSocketId, signalData }) => {
    io.to(toSocketId).emit("group-call:signal", {
      fromSocketId: socket.id,
      fromUser: {
        _id: user._id.toString(),
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      signalData,
    });
  });

  socket.on("group-call:leave", ({ groupId }) => {
    const roomName = `group-call:${groupId}`;
    socket.leave(roomName);

    if (activeGroupCalls.has(groupId)) {
      const roomUsers = activeGroupCalls.get(groupId);
      roomUsers.delete(socket.id);
      if (roomUsers.size === 0) {
        activeGroupCalls.delete(groupId);
        activeCallsMap.delete(groupId);
        broadcastActiveCalls(io);
      }
    }

    socket.to(roomName).emit("group-call:user-left", {
      socketId: socket.id,
      userId: user._id.toString(),
    });
  });

  socket.on("disconnect", () => {
    activeGroupCalls.forEach((roomUsers, groupId) => {
      if (roomUsers.has(socket.id)) {
        roomUsers.delete(socket.id);
        const roomName = `group-call:${groupId}`;
        socket.to(roomName).emit("group-call:user-left", {
          socketId: socket.id,
          userId: user._id.toString(),
        });
        if (roomUsers.size === 0) {
          activeGroupCalls.delete(groupId);
          activeCallsMap.delete(groupId);
          broadcastActiveCalls(io);
        }
      }
    });
  });
};

