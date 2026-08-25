export const updateConversationAfterCreateMessage = (
  conversation,
  message,
  senderId
) => {
  conversation.set({
    seenBy: [],
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      content: message.content,
      senderId,
      createdAt: message.createdAt,
    },
  });

  conversation.participants.forEach((p) => {
    const memberId = p.userId.toString();
    const isSender = memberId === senderId.toString();
    const prevCount = conversation.unreadCounts.get(memberId) || 0;
    conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
  });
};

export const emitNewMessage = (io, conversation, message) => {
  const payload = {
    message,
    conversation: {
      _id: conversation._id,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
    },
    unreadCounts: conversation.unreadCounts,
  };

  // 1. Broadcast to conversation room
  io.to(conversation._id.toString()).emit("new-message", payload);

  // 2. Broadcast to each participant's user room
  if (conversation && conversation.participants) {
    conversation.participants.forEach((p) => {
      const pIdStr = p.userId ? p.userId.toString() : p.toString();
      io.to(pIdStr).emit("new-message", payload);
    });
  }
};
