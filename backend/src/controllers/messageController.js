import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import CallLog from "../models/CallLog.js";
import CloudFile from "../models/CloudFile.js";
import User from "../models/User.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId, parentMessageId, imgUrl, fileUrl, fileName, fileSize, fileType, type, location, mentions } = req.body;
    const senderId = req.user._id;

    let conversation;

    if (!content && !imgUrl && !fileUrl && !location) {
      return res.status(400).json({ message: "Thiếu nội dung tin nhắn hoặc tệp đính kèm" });
    }

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    const targetRecipientId = recipientId || conversation?.participants.find(p => p.userId.toString() !== senderId.toString())?.userId;

    if (targetRecipientId) {
      const recipientUser = await User.findById(targetRecipientId);
      const senderUser = req.user;

      const isSenderBlockedByRecipient = recipientUser?.blockedUsers?.some(id => id.toString() === senderId.toString());
      const isRecipientBlockedBySender = senderUser?.blockedUsers?.some(id => id.toString() === targetRecipientId.toString());

      if (isSenderBlockedByRecipient || isRecipientBlockedBySender) {
        return res.status(403).json({
          message: isRecipientBlockedBySender
            ? "Bạn đã chặn người dùng này. Vui lòng bỏ chặn trước khi gửi tin nhắn."
            : "Bạn không thể gửi tin nhắn cho người dùng này do tài khoản của bạn đã bị chặn."
        });
      }
    }

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      type: type || (location ? "location" : "text"),
      content: content || (location ? `📍 Vị trí: ${location.address || "Vị trí đã chia sẻ"}` : fileName ? `Đã gửi tệp: ${fileName}` : "Hình ảnh"),
      imgUrl: imgUrl || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      fileType: fileType || null,
      location: location || null,
      mentions: mentions || [],
      parentMessageId: parentMessageId || null,
    });

    if (parentMessageId) {
      await message.populate("parentMessageId", "content senderId createdAt");
    }

    updateConversationAfterCreateMessage(conversation, message, senderId);
    await conversation.save();

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content, parentMessageId, imgUrl, fileUrl, fileName, fileSize, fileType, type, location, mentions } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    if (!content && !imgUrl && !fileUrl && !location) {
      return res.status(400).json("Thiếu nội dung hoặc file đính kèm");
    }

    let finalMentions = Array.isArray(mentions) ? [...mentions] : [];
    const isMentionAll =
      finalMentions.includes("everyone") ||
      finalMentions.includes("moinguoi") ||
      (content && (content.includes("@moinguoi") || content.includes("@everyone") || content.includes("@all")));

    if (isMentionAll) {
      const allOtherParticipants = (conversation.participants || [])
        .map((p) => (p?.userId ? (p.userId._id ? p.userId._id.toString() : p.userId.toString()) : (p?._id ? p._id.toString() : p?.toString())))
        .filter((id) => id && id !== senderId.toString());
      finalMentions = Array.from(
        new Set([...finalMentions.filter((id) => id !== "everyone" && id !== "moinguoi"), ...allOtherParticipants])
      );
    } else {
      finalMentions = finalMentions.filter((id) => id !== "everyone" && id !== "moinguoi");
    }

    const message = await Message.create({
      conversationId,
      senderId,
      type: type || (location ? "location" : "text"),
      content: content || (location ? `📍 Vị trí: ${location.address || "Vị trí đã chia sẻ"}` : fileName ? `Đã gửi tệp: ${fileName}` : "Hình ảnh"),
      imgUrl: imgUrl || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      fileType: fileType || null,
      location: location || null,
      mentions: finalMentions,
      parentMessageId: parentMessageId || null,
    });

    if (parentMessageId) {
      await message.populate("parentMessageId", "content senderId createdAt");
    }

    updateConversationAfterCreateMessage(conversation, message, senderId);
    await conversation.save();
    emitNewMessage(io, conversation, message);

    // Socket mention notification to mentioned users
    if (finalMentions && finalMentions.length > 0) {
      finalMentions.forEach((mentionedUserId) => {
        io.to(mentionedUserId.toString()).emit("user-mentioned", {
          conversationId,
          messageId: message._id,
          senderName: req.user.displayName,
          content: message.content,
          isMentionAll,
          groupName: conversation.name || "Nhóm",
        });
      });
    }

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id.toString();

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Nội dung tin nhắn không được để trống" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Tin nhắn không tồn tại" });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền sửa tin nhắn này" });
    }

    if (message.deletedAt) {
      return res.status(400).json({ message: "Không thể chỉnh sửa tin nhắn đã xóa" });
    }

    message.editHistory.push({
      content: message.content,
      editedAt: new Date(),
    });

    message.content = content.trim();
    message.isEdited = true;

    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    if (
      conversation &&
      conversation.lastMessage &&
      conversation.lastMessage._id.toString() === message._id.toString()
    ) {
      conversation.lastMessage.content = message.content;
      await conversation.save();
    }

    io.to(message.conversationId.toString()).emit("message-edited", {
      message,
    });

    return res.status(200).json({ message });
  } catch (error) {
    console.error("Lỗi khi chỉnh sửa tin nhắn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id.toString();

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Tin nhắn không tồn tại" });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền xóa tin nhắn này" });
    }

    message.deletedAt = new Date();
    message.content = "Tin nhắn đã bị thu hồi";

    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    if (
      conversation &&
      conversation.lastMessage &&
      conversation.lastMessage._id.toString() === message._id.toString()
    ) {
      conversation.lastMessage.content = "Tin nhắn đã bị thu hồi";
      await conversation.save();
    }

    io.to(message.conversationId.toString()).emit("message-deleted", {
      messageId: message._id,
      conversationId: message.conversationId,
      deletedAt: message.deletedAt,
      content: "Tin nhắn đã bị thu hồi",
    });

    return res.status(200).json({ message: "Đã thu hồi tin nhắn", messageId: message._id });
  } catch (error) {
    console.error("Lỗi khi xóa tin nhắn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ message: "Thiếu biểu tượng cảm xúc (emoji)" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Tin nhắn không tồn tại" });
    }

    const existingIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingIndex > -1) {
      message.reactions.splice(existingIndex, 1);
    } else {
      const otherReactionIndex = message.reactions.findIndex(
        (r) => r.userId.toString() === userId.toString()
      );
      if (otherReactionIndex > -1) {
        message.reactions.splice(otherReactionIndex, 1);
      }
      message.reactions.push({
        userId,
        emoji,
        createdAt: new Date(),
      });
    }

    await message.save();

    io.to(message.conversationId.toString()).emit("message-reaction-updated", {
      messageId: message._id,
      conversationId: message.conversationId,
      reactions: message.reactions,
    });

    return res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    console.error("Lỗi khi thả cảm xúc tin nhắn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const toggleBookmark = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Tin nhắn không tồn tại" });
    }

    const index = message.bookmarkedBy.indexOf(userId);
    let isBookmarked = false;
    if (index > -1) {
      message.bookmarkedBy.splice(index, 1);
    } else {
      message.bookmarkedBy.push(userId);
      isBookmarked = true;
    }

    await message.save();
    return res.status(200).json({
      message: isBookmarked ? "Đã lưu tin nhắn" : "Đã bỏ lưu tin nhắn",
      isBookmarked,
    });
  } catch (error) {
    console.error("Lỗi khi toggleBookmark", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getBookmarks = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookmarks = await Message.find({ bookmarkedBy: userId })
      .populate("senderId", "_id displayName avatarUrl username")
      .sort({ createdAt: -1 });

    return res.status(200).json({ bookmarks });
  } catch (error) {
    console.error("Lỗi khi getBookmarks", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const togglePinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Tin nhắn không tồn tại" });
    }

    message.isPinned = !message.isPinned;
    message.pinnedAt = message.isPinned ? new Date() : null;
    await message.save();

    io.to(message.conversationId.toString()).emit("message-pinned-updated", {
      messageId: message._id,
      isPinned: message.isPinned,
    });

    return res.status(200).json({
      message: message.isPinned ? "Đã ghim tin nhắn" : "Đã bỏ ghim tin nhắn",
      isPinned: message.isPinned,
    });
  } catch (error) {
    console.error("Lỗi khi togglePinMessage", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getPinnedMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const pinnedMessages = await Message.find({ conversationId, isPinned: true })
      .populate("senderId", "_id displayName avatarUrl")
      .sort({ pinnedAt: -1 });

    return res.status(200).json({ pinnedMessages });
  } catch (error) {
    console.error("Lỗi khi getPinnedMessages", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const searchMessages = async (req, res) => {
  try {
    const { conversationId, query } = req.query;
    if (!conversationId || !query) {
      return res.status(400).json({ message: "Thiếu thông tin cuộc trò chuyện hoặc từ khóa" });
    }

    const messages = await Message.find({
      conversationId,
      content: { $regex: query, $options: "i" },
      deletedAt: null,
    })
      .populate("senderId", "_id displayName avatarUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Lỗi khi searchMessages", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getCallLogs = async (req, res) => {
  try {
    const userId = req.user._id;
    const logs = await CallLog.find({
      $or: [{ caller: userId }, { receiver: userId }],
    })
      .populate("caller", "_id displayName avatarUrl")
      .populate("receiver", "_id displayName avatarUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json({ logs });
  } catch (error) {
    console.error("Lỗi khi getCallLogs", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const createCallLog = async (req, res) => {
  try {
    const { receiverId, conversationId, isVideo, status, duration } = req.body;
    const callerId = req.user._id;

    const log = await CallLog.create({
      caller: callerId,
      receiver: receiverId,
      isVideo: isVideo || false,
      status: status || "completed",
      duration: duration || "00:00",
    });

    let conversation = null;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }
    if (!conversation && receiverId) {
      conversation = await Conversation.findOne({
        type: "direct",
        "participants.userId": { $all: [callerId, receiverId] },
      });
    }

    if (conversation) {
      const callTypeStr = isVideo ? "cuộc gọi video" : "cuộc gọi thoại";
      let contentText = "";
      if (status === "missed") {
        contentText = `Đã nhỡ ${callTypeStr}`;
      } else if (status === "rejected") {
        contentText = `${callTypeStr} bị từ chối`;
      } else {
        contentText = `${callTypeStr} - ${duration || "00:00"}`;
      }

      const message = await Message.create({
        conversationId: conversation._id,
        senderId: callerId,
        type: "call_log",
        content: contentText,
        fileType: isVideo ? "video" : "voice",
        fileName: status || "completed",
        fileSize: duration || "00:00",
      });

      updateConversationAfterCreateMessage(conversation, message, callerId);
      await conversation.save();

      const populatedMsg = await Message.findById(message._id).populate(
        "senderId",
        "_id displayName avatarUrl"
      );

      const socketIo = req.app.get("io") || io;
      if (socketIo) {
        emitNewMessage(socketIo, conversation, populatedMsg);
      }

      return res.status(201).json({ log, message: populatedMsg });
    }

    return res.status(201).json({ log });
  } catch (error) {
    console.error("Lỗi khi createCallLog", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getCloudFiles = async (req, res) => {
  try {
    const userId = req.user._id;
    const files = await CloudFile.find({ owner: userId }).sort({ createdAt: -1 });
    return res.status(200).json({ files });
  } catch (error) {
    console.error("Lỗi khi getCloudFiles", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadCloudFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const result = await uploadImageFromBuffer(file.buffer, {}, file.originalname);
    const sizeInKb = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(1) + " MB" 
      : (file.size / 1024).toFixed(1) + " KB";
    const ext = file.originalname.split(".").pop() || "file";

    return res.status(201).json({
      fileName: file.originalname,
      fileUrl: result.secure_url,
      fileSize: sizeInKb,
      fileType: ext,
    });
  } catch (error) {
    console.error("Lỗi khi uploadCloudFile", error);
    return res.status(500).json({ message: "Upload failed" });
  }
};

export const saveFileToCloud = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileName, fileUrl, fileSize, fileType } = req.body;

    if (!fileUrl || !fileName) {
      return res.status(400).json({ message: "Thiếu thông tin file cần lưu" });
    }

    const cloudFile = await CloudFile.create({
      owner: userId,
      fileName,
      fileUrl,
      fileSize: fileSize || "File",
      fileType: fileType || "file",
    });

    // Also send a message to self-chat space so it shows up in Kyeto Cloud Chat
    let conversation = await Conversation.findOne({
      type: "direct",
      participants: { $size: 1, $elemMatch: { userId } },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [{ userId, joinedAt: new Date() }],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
    }

    const isImg = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
      (fileType || "").toLowerCase()
    );

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: userId,
      content: `Đã lưu từ cuộc trò chuyện: ${fileName}`,
      imgUrl: isImg ? fileUrl : null,
      fileUrl: fileUrl,
      fileName: fileName,
      fileSize: fileSize || null,
      fileType: fileType || null,
    });

    updateConversationAfterCreateMessage(conversation, message, userId);
    await conversation.save();

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message: "Đã lưu tệp vào Kyeto Cloud!", cloudFile });
  } catch (error) {
    console.error("Lỗi khi saveFileToCloud", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lưu tệp vào Cloud" });
  }
};

// ====================
// Self-Chat (Kyeto Cloud Space)
// ====================
export const getSelfConversation = async (req, res) => {
  try {
    const userId = req.user._id;

    let conversation = await Conversation.findOne({
      type: "direct",
      "participants.userId": { $all: [userId, userId] },
      $expr: { $eq: [{ $size: "$participants" }, 1] },
    });

    if (!conversation) {
      // Find by single participant being self
      conversation = await Conversation.findOne({
        type: "direct",
        participants: { $size: 1, $elemMatch: { userId } },
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [{ userId, joinedAt: new Date() }],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
        group: null,
      });
    }

    return res.status(200).json({ conversation });
  } catch (error) {
    console.error("Lỗi khi getSelfConversation", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendSelfMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    let { content, imgUrl, fileUrl, fileName, fileSize, fileType, conversationId } = req.body;
    const file = req.file;

    // Handle file upload if present
    if (file) {
      const uploadResult = await uploadImageFromBuffer(file.buffer, {}, file.originalname);
      const sizeInKb = file.size > 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(1) + " MB"
        : (file.size / 1024).toFixed(1) + " KB";
      const ext = file.originalname.split(".").pop() || "file";
      const isImg = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext.toLowerCase());

      fileUrl = uploadResult.secure_url;
      fileName = file.originalname;
      fileSize = sizeInKb;
      fileType = ext;
      if (isImg) {
        imgUrl = uploadResult.secure_url;
      }
    }

    if (!content && !imgUrl && !fileUrl) {
      return res.status(400).json({ message: "Thiếu nội dung tin nhắn hoặc tệp đính kèm" });
    }

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    if (!conversation) {
      conversation = await Conversation.findOne({
        type: "direct",
        participants: { $size: 1, $elemMatch: { userId } },
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [{ userId, joinedAt: new Date() }],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: userId,
      content: content || (fileName ? `Tệp: ${fileName}` : "Hình ảnh"),
      imgUrl: imgUrl || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      fileType: fileType || null,
    });

    updateConversationAfterCreateMessage(conversation, message, userId);
    await conversation.save();

    // Also persist in CloudFile table for record-keeping
    if (fileUrl && fileName) {
      await CloudFile.create({
        owner: userId,
        fileName,
        fileUrl,
        fileSize: fileSize || "File",
        fileType: fileType || "file",
      }).catch(err => console.error("CloudFile save error:", err));
    }

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });

  } catch (error) {
    console.error("Lỗi khi sendSelfMessage", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const deleteSelfMessagesBatch = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: "Không có mục nào được chọn" });
    }

    const messages = await Message.find({
      _id: { $in: messageIds },
      senderId: userId,
    });

    const fileUrls = messages.map((m) => m.fileUrl || m.imgUrl).filter(Boolean);

    await Message.deleteMany({
      _id: { $in: messageIds },
      senderId: userId,
    });

    if (fileUrls.length > 0) {
      await CloudFile.deleteMany({
        owner: userId,
        fileUrl: { $in: fileUrls },
      }).catch((err) => console.error("Lỗi xóa CloudFile:", err));
    }

    return res.status(200).json({
      message: `Đã xóa thành công ${messages.length} mục`,
      deletedIds: messages.map((m) => m._id.toString()),
    });
  } catch (error) {
    console.error("Lỗi khi deleteSelfMessagesBatch", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xóa dữ liệu" });
  }
};

// --- PHASE 2C: MESSAGE THREADING & READ RECEIPTS ---

export const getThreadReplies = async (req, res) => {
  try {
    const { messageId } = req.params;
    const parent = await Message.findById(messageId).populate("senderId", "displayName avatarUrl");
    if (!parent) return res.status(404).json({ message: "Tin nhắn không tồn tại" });

    const replies = await Message.find({ threadId: messageId })
      .sort({ createdAt: 1 })
      .populate("senderId", "displayName avatarUrl");

    return res.status(200).json({ parent, replies });
  } catch (error) {
    console.error("Lỗi khi getThreadReplies", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendThreadReply = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const senderId = req.user._id;

    const parent = await Message.findById(messageId);
    if (!parent) return res.status(404).json({ message: "Tin nhắn không tồn tại" });

    const reply = await Message.create({
      conversationId: parent.conversationId,
      senderId,
      content,
      threadId: messageId,
      parentMessageId: messageId,
    });

    await reply.populate("senderId", "displayName avatarUrl");
    io.to(parent.conversationId.toString()).emit("thread-reply-added", {
      threadId: messageId,
      reply,
    });

    return res.status(201).json({ reply });
  } catch (error) {
    console.error("Lỗi khi sendThreadReply", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const markMessageRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Tin nhắn không tồn tại" });

    const alreadyRead = message.readBy.some((r) => r.userId.toString() === userId.toString());
    if (!alreadyRead) {
      message.readBy.push({ userId, readAt: new Date() });
      await message.save();
      io.to(message.conversationId.toString()).emit("message-read-update", {
        messageId,
        readBy: message.readBy,
      });
    }

    return res.status(200).json({ readBy: message.readBy });
  } catch (error) {
    console.error("Lỗi khi markMessageRead", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const hideMessageForSelf = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Tin nhắn không tồn tại" });

    if (!message.hiddenFor.some((id) => id.toString() === userId.toString())) {
      message.hiddenFor.push(userId);
      await message.save();
    }

    return res.status(200).json({ message: "Đã ẩn tin nhắn ở phía bạn" });
  } catch (error) {
    console.error("Lỗi khi hideMessageForSelf", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getMessageReadStatus = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId)
      .populate("readBy.userId", "displayName username avatarUrl status lastSeen")
      .populate("senderId", "displayName username avatarUrl");

    if (!message) {
      return res.status(404).json({ message: "Tin nhắn không tồn tại" });
    }

    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Hội thoại không tồn tại" });
    }

    const readUserIds = message.readBy.map((r) => r.userId?._id?.toString() || r.userId?.toString());
    const senderIdStr = message.senderId._id ? message.senderId._id.toString() : message.senderId.toString();

    // Delivered to users: participants in conversation who haven't read and are not the sender
    const deliveredUserIds = conversation.participants
      .map((p) => p.userId.toString())
      .filter((id) => id !== senderIdStr && !readUserIds.includes(id));

    const deliveredToUsers = await User.find({ _id: { $in: deliveredUserIds } }).select(
      "displayName username avatarUrl status lastSeen"
    );

    return res.status(200).json({
      messageId: message._id,
      createdAt: message.createdAt,
      readBy: message.readBy,
      deliveredTo: deliveredToUsers,
    });
  } catch (error) {
    console.error("Lỗi khi getMessageReadStatus", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};




