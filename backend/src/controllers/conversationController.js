import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { io } from "../socket/index.js";

export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;

    if (
      !type ||
      (type === "group" && !name) ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Tên nhóm và danh sách thành viên là bắt buộc" });
    }

    let conversation;

    if (type === "direct") {
      const participantId = memberIds[0];

      conversation = await Conversation.findOne({
        type: "direct",
        "participants.userId": { $all: [userId, participantId] },
      });

      if (!conversation) {
        conversation = new Conversation({
          type: "direct",
          participants: [{ userId }, { userId: participantId }],
          lastMessageAt: new Date(),
        });

        await conversation.save();
      }
    }

    if (type === "group") {
      conversation = new Conversation({
        type: "group",
        participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
        group: {
          name,
          createdBy: userId,
        },
        lastMessageAt: new Date(),
      });

      await conversation.save();
    }

    if (!conversation) {
      return res.status(400).json({ message: "Conversation type không hợp lệ" });
    }

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl showOnlineStatus" },
      {
        path: "seenBy",
        select: "displayName avatarUrl",
      },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    const participants = (conversation.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      showOnlineStatus: p.userId?.showOnlineStatus ?? true,
      joinedAt: p.joinedAt,
    }));

    const formatted = { ...conversation.toObject(), participants };

    if (type === "group") {
      memberIds.forEach((userId) => {
        io.to(userId).emit("new-group", formatted);
      });
    }

    if (type === "direct") {
      io.to(userId).emit("new-group", formatted);
      io.to(memberIds[0]).emit("new-group", formatted);
    }

    return res.status(201).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi tạo conversation", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("archivedConversations mutedConversations");
    const archivedSet = new Set((user?.archivedConversations || []).map(id => id.toString()));
    const mutedSet = new Set((user?.mutedConversations || []).map(id => id.toString()));

    const conversations = await Conversation.find({
      "participants.userId": userId,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({
        path: "participants.userId",
        select: "displayName avatarUrl showOnlineStatus",
      })
      .populate({
        path: "lastMessage.senderId",
        select: "displayName avatarUrl",
      })
      .populate({
        path: "seenBy",
        select: "displayName avatarUrl",
      });

    const formatted = conversations.map((convo) => {
      const participants = (convo.participants || []).map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        showOnlineStatus: p.userId?.showOnlineStatus ?? true,
        joinedAt: p.joinedAt,
      }));

      return {
        ...convo.toObject(),
        unreadCounts: convo.unreadCounts || {},
        participants,
        isArchived: archivedSet.has(convo._id.toString()),
        isMuted: mutedSet.has(convo._id.toString()),
      };
    });

    return res.status(200).json({ conversations: formatted });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy conversations", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};


export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;

    const query = { conversationId };

    if (cursor && cursor !== "undefined" && cursor !== "null") {
      const parsedDate = new Date(cursor);
      if (!isNaN(parsedDate.getTime())) {
        query.createdAt = { $lt: parsedDate };
      }
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1)
      .populate({
        path: "parentMessageId",
        select: "content senderId createdAt",
        populate: { path: "senderId", select: "displayName avatarUrl" },
      })
      .populate({
        path: "reactions.userId",
        select: "displayName avatarUrl",
      });

    let nextCursor = null;

    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages.pop();
    }

    messages = messages.reverse();

    return res.status(200).json({
      messages,
      nextCursor,
    });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy messages", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getUserConversationsForSocketIO = async (userId) => {
  try {
    const conversations = await Conversation.find(
      { "participants.userId": userId },
      { _id: 1 },
    );

    return conversations.map((c) => c._id.toString());
  } catch (error) {
    console.error("Lỗi khi fetch conversations: ", error);
    return [];
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation) {
      return res.status(404).json({ message: "Conversation không tồn tại" });
    }

    const last = conversation.lastMessage;

    if (!last) {
      return res.status(200).json({ message: "Không có tin nhắn để mark as seen" });
    }

    if (last.senderId.toString() === userId) {
      return res.status(200).json({ message: "Sender không cần mark as seen" });
    }

    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { seenBy: userId },
        $set: { [`unreadCounts.${userId}`]: 0 },
      },
      {
        new: true,
      },
    );

    // Also update readBy array on messages in this conversation
    await Message.updateMany(
      { conversationId, "readBy.userId": { $ne: userId } },
      { $push: { readBy: { userId, readAt: new Date() } } }
    );

    io.to(conversationId).emit("read-message", {
      conversation: updated,
      readerId: userId,
      lastMessage: {
        _id: updated?.lastMessage._id,
        content: updated?.lastMessage.content,
        createdAt: updated?.lastMessage.createdAt,
        sender: {
          _id: updated?.lastMessage.senderId,
        },
      },
    });

    return res.status(200).json({
      message: "Marked as seen",
      seenBy: updated?.seenBy || [],
      myUnreadCount: updated?.unreadCounts[userId] || 0,
    });
  } catch (error) {
    console.error("Lỗi khi mark as seen", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const addMembers = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "Cần cung cấp danh sách memberIds" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Nhóm chat không tồn tại" });
    }

    const existingMemberIds = conversation.participants.map((p) => p.userId.toString());
    const newMembers = memberIds.filter((id) => !existingMemberIds.includes(id));

    if (newMembers.length === 0) {
      return res.status(400).json({ message: "Tất cả các người dùng này đã ở trong nhóm" });
    }

    newMembers.forEach((id) => {
      conversation.participants.push({ userId: id, joinedAt: new Date() });
    });

    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "admins", select: "displayName avatarUrl" },
    ]);

    const formattedParticipants = conversation.participants.map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const updatedConvo = {
      ...conversation.toObject(),
      participants: formattedParticipants,
    };

    newMembers.forEach((id) => {
      io.to(id).emit("new-group", updatedConvo);
    });

    io.to(conversationId).emit("group-updated", updatedConvo);

    return res.status(200).json({ conversation: updatedConvo });
  } catch (error) {
    console.error("Lỗi khi thêm thành viên:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { conversationId, memberId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId);

    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Nhóm chat không tồn tại" });
    }

    const isOwner = conversation.group?.createdBy?.toString() === userId;
    const isAdmin = conversation.admins?.some((a) => a.toString() === userId);
    const isSelf = userId === memberId;

    if (!isSelf && !isOwner && !isAdmin) {
      return res.status(403).json({ message: "Bạn không có quyền xóa thành viên này" });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.userId.toString() !== memberId
    );

    conversation.admins = conversation.admins.filter(
      (a) => a.toString() !== memberId
    );

    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "admins", select: "displayName avatarUrl" },
    ]);

    const formattedParticipants = conversation.participants.map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const updatedConvo = {
      ...conversation.toObject(),
      participants: formattedParticipants,
    };

    io.to(conversationId).emit("group-updated", updatedConvo);
    io.to(memberId).emit("group-removed", { conversationId });

    return res.status(200).json({ conversation: updatedConvo });
  } catch (error) {
    console.error("Lỗi khi xóa thành viên:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateAdminRole = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { targetUserId, action } = req.body; // action: "promote" | "demote"

    if (!targetUserId || !["promote", "demote"].includes(action)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ (cần targetUserId và action)" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Nhóm chat không tồn tại" });
    }

    if (action === "promote") {
      if (!conversation.admins.some((a) => a.toString() === targetUserId)) {
        conversation.admins.push(targetUserId);
      }
    } else if (action === "demote") {
      conversation.admins = conversation.admins.filter(
        (a) => a.toString() !== targetUserId
      );
    }

    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "admins", select: "displayName avatarUrl" },
    ]);

    const formattedParticipants = conversation.participants.map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const updatedConvo = {
      ...conversation.toObject(),
      participants: formattedParticipants,
    };

    io.to(conversationId).emit("group-updated", updatedConvo);

    return res.status(200).json({ conversation: updatedConvo });
  } catch (error) {
    console.error("Lỗi khi cập nhật quyền admin:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateGroupSettings = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { onlyAdminSend, isPublic, inviteLink } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Nhóm chat không tồn tại" });
    }

    if (!conversation.settings) {
      conversation.settings = {};
    }

    if (typeof onlyAdminSend === "boolean") conversation.settings.onlyAdminSend = onlyAdminSend;
    if (typeof isPublic === "boolean") conversation.settings.isPublic = isPublic;
    if (typeof inviteLink === "string") conversation.settings.inviteLink = inviteLink;

    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "admins", select: "displayName avatarUrl" },
    ]);

    const formattedParticipants = conversation.participants.map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const updatedConvo = {
      ...conversation.toObject(),
      participants: formattedParticipants,
    };

    io.to(conversationId).emit("group-updated", updatedConvo);

    return res.status(200).json({ conversation: updatedConvo });
  } catch (error) {
    console.error("Lỗi khi cập nhật cài đặt nhóm:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const toggleFavoriteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    if (!user.favoriteConversations) {
      user.favoriteConversations = [];
    }

    const index = user.favoriteConversations.findIndex(
      (id) => id.toString() === conversationId
    );

    let isFavorite = false;
    if (index > -1) {
      user.favoriteConversations.splice(index, 1);
    } else {
      user.favoriteConversations.push(conversationId);
      isFavorite = true;
    }

    await user.save();
    return res.status(200).json({
      message: isFavorite ? "Đã thêm cuộc trò chuyện vào mục Đã lưu/Yêu thích" : "Đã xóa khỏi mục Đã lưu",
      isFavorite,
      favoriteConversations: user.favoriteConversations,
    });
  } catch (error) {
    console.error("Lỗi khi toggleFavoriteConversation", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getFavoriteConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: "favoriteConversations",
      populate: [
        { path: "participants.userId", select: "displayName avatarUrl" },
        { path: "lastMessage.senderId", select: "displayName avatarUrl" },
      ],
    });

    const favorites = user?.favoriteConversations || [];
    return res.status(200).json({ favorites });
  } catch (error) {
    console.error("Lỗi khi getFavoriteConversations", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateThemeOrNickname = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { theme, nickname, targetUserId, nicknames, customColor, wallpaper } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Cuộc trò chuyện không tồn tại" });
    }

    if (!conversation.settings) {
      conversation.settings = {};
    }

    if (theme !== undefined) {
      conversation.settings.theme = theme;
    }

    if (customColor !== undefined) {
      conversation.settings.customColor = customColor;
    }

    if (wallpaper !== undefined) {
      conversation.settings.wallpaper = wallpaper;
    }

    if (nicknames && typeof nicknames === "object") {
      if (!conversation.settings.nicknames) {
        conversation.settings.nicknames = new Map();
      }

      Object.entries(nicknames).forEach(([uId, nickVal]) => {
        const targetIdStr = uId.toString();
        const trimmed = typeof nickVal === "string" ? nickVal.trim() : "";
        if (trimmed.length > 0) {
          if (typeof conversation.settings.nicknames.set === "function") {
            conversation.settings.nicknames.set(targetIdStr, trimmed);
          } else {
            conversation.settings.nicknames[targetIdStr] = trimmed;
          }
        } else {
          if (typeof conversation.settings.nicknames.delete === "function") {
            conversation.settings.nicknames.delete(targetIdStr);
          } else if (typeof conversation.settings.nicknames === "object") {
            delete conversation.settings.nicknames[targetIdStr];
          }
        }
      });
      conversation.markModified("settings");
    } else if (targetUserId && nickname !== undefined) {
      if (!conversation.settings.nicknames) {
        conversation.settings.nicknames = new Map();
      }

      const targetIdStr = targetUserId.toString();
      const trimmedNickname = typeof nickname === "string" ? nickname.trim() : "";

      if (trimmedNickname.length > 0) {
        if (typeof conversation.settings.nicknames.set === "function") {
          conversation.settings.nicknames.set(targetIdStr, trimmedNickname);
        } else {
          conversation.settings.nicknames[targetIdStr] = trimmedNickname;
        }
      } else {
        if (typeof conversation.settings.nicknames.delete === "function") {
          conversation.settings.nicknames.delete(targetIdStr);
        } else if (typeof conversation.settings.nicknames === "object") {
          delete conversation.settings.nicknames[targetIdStr];
        }
      }
      conversation.markModified("settings");
    }

    conversation.markModified("settings");
    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    const formattedParticipants = conversation.participants.map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const rawConvo = conversation.toObject();
    if (rawConvo.settings && rawConvo.settings.nicknames instanceof Map) {
      rawConvo.settings.nicknames = Object.fromEntries(rawConvo.settings.nicknames);
    }

    const updatedConvo = {
      ...rawConvo,
      participants: formattedParticipants,
    };

    io.to(conversationId).emit("group-updated", updatedConvo);

    return res.status(200).json({ conversation: updatedConvo });
  } catch (error) {
    console.error("Lỗi khi updateThemeOrNickname", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const clearConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    await Message.deleteMany({ conversationId });
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: null,
    });
    io.to(conversationId).emit("conversation-cleared", { conversationId });
    return res.status(200).json({ message: "Đã xóa toàn bộ nội dung trò chuyện" });
  } catch (error) {
    console.error("Lỗi khi clearConversationMessages", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Cuộc trò chuyện không tồn tại" });
    }

    // Delete all messages associated with this conversation
    await Message.deleteMany({ conversationId });

    // Delete the conversation document itself
    await Conversation.findByIdAndDelete(conversationId);

    // Notify all participants via socket
    io.to(conversationId).emit("conversation-deleted", { conversationId });

    return res.status(200).json({
      message: "Đã xóa hoàn toàn cuộc trò chuyện và toàn bộ tin nhắn",
      conversationId,
    });
  } catch (error) {
    console.error("Lỗi khi xóa cuộc trò chuyện:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const markAsUnread = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Cuộc trò chuyện không tồn tại" });
    }

    conversation.seenBy = conversation.seenBy.filter(
      (id) => id.toString() !== userId
    );

    if (!conversation.unreadCounts) {
      conversation.unreadCounts = new Map();
    }
    const currentUnread = conversation.unreadCounts.get(userId) || 0;
    conversation.unreadCounts.set(userId, Math.max(1, currentUnread + 1));

    await conversation.save();
    return res.status(200).json({ message: "Đã đánh dấu là chưa đọc", conversation });
  } catch (error) {
    console.error("Lỗi khi markAsUnread", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const toggleArchiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    if (!user.archivedConversations) user.archivedConversations = [];

    const idx = user.archivedConversations.findIndex(
      (id) => id.toString() === conversationId
    );

    let isArchived = false;
    if (idx > -1) {
      user.archivedConversations.splice(idx, 1);
    } else {
      user.archivedConversations.push(conversationId);
      isArchived = true;
    }

    await user.save();
    return res.status(200).json({
      message: isArchived ? "Đã lưu trữ cuộc trò chuyện" : "Đã bỏ lưu trữ cuộc trò chuyện",
      isArchived,
    });
  } catch (error) {
    console.error("Lỗi khi toggleArchiveConversation", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const toggleMuteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    if (!user.mutedConversations) user.mutedConversations = [];

    const idx = user.mutedConversations.findIndex(
      (id) => id.toString() === conversationId
    );

    let isMuted = false;
    if (idx > -1) {
      user.mutedConversations.splice(idx, 1);
    } else {
      user.mutedConversations.push(conversationId);
      isMuted = true;
    }

    await user.save();
    return res.status(200).json({
      message: isMuted ? "Đã tắt thông báo" : "Đã bật lại thông báo",
      isMuted,
    });
  } catch (error) {
    console.error("Lỗi khi toggleMuteConversation", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// --- PHASE 2A: ADVANCED GROUP MANAGEMENT & POLLS ---

export const kickMember = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { targetUserId } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Nhóm không tồn tại" });

    conversation.participants = conversation.participants.filter(
      (p) => p.userId.toString() !== targetUserId
    );
    conversation.admins = conversation.admins.filter((a) => a.toString() !== targetUserId);
    conversation.moderators = conversation.moderators.filter((m) => m.toString() !== targetUserId);

    await conversation.save();
    io.to(conversationId).emit("group-updated", conversation);
    io.to(targetUserId).emit("group-removed", { conversationId });

    return res.status(200).json({ message: "Đã xóa thành viên khỏi nhóm", conversation });
  } catch (error) {
    console.error("Lỗi khi kickMember", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const banMember = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { targetUserId } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Nhóm không tồn tại" });

    conversation.participants = conversation.participants.filter(
      (p) => p.userId.toString() !== targetUserId
    );
    conversation.admins = conversation.admins.filter((a) => a.toString() !== targetUserId);
    conversation.moderators = conversation.moderators.filter((m) => m.toString() !== targetUserId);

    if (!conversation.banList.some((b) => b.toString() === targetUserId)) {
      conversation.banList.push(targetUserId);
    }

    await conversation.save();
    io.to(conversationId).emit("group-updated", conversation);
    io.to(targetUserId).emit("group-removed", { conversationId, isBanned: true });

    return res.status(200).json({ message: "Đã cấm thành viên khỏi nhóm", conversation });
  } catch (error) {
    console.error("Lỗi khi banMember", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateModeratorRole = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { targetUserId, action } = req.body; // action: "promote" | "demote"

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Nhóm không tồn tại" });

    if (action === "promote") {
      if (!conversation.moderators.some((m) => m.toString() === targetUserId)) {
        conversation.moderators.push(targetUserId);
      }
    } else {
      conversation.moderators = conversation.moderators.filter(
        (m) => m.toString() !== targetUserId
      );
    }

    await conversation.save();
    io.to(conversationId).emit("group-updated", conversation);
    return res.status(200).json({ message: "Đã cập nhật quyền Kiểm duyệt viên", conversation });
  } catch (error) {
    console.error("Lỗi khi updateModeratorRole", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const generateInviteCode = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Nhóm không tồn tại" });

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    conversation.inviteCode = code;
    await conversation.save();

    return res.status(200).json({ inviteCode: code });
  } catch (error) {
    console.error("Lỗi khi generateInviteCode", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const joinByInviteCode = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({ inviteCode });
    if (!conversation) {
      return res.status(404).json({ message: "Mã mời nhóm không hợp lệ hoặc đã hết hạn" });
    }

    if (conversation.banList?.some((b) => b.toString() === userId.toString())) {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị cấm tham gia nhóm này" });
    }

    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );

    if (!isMember) {
      conversation.participants.push({ userId, joinedAt: new Date() });
      await conversation.save();
      io.to(conversation._id.toString()).emit("group-updated", conversation);
    }

    return res.status(200).json({ message: "Tham gia nhóm thành công", conversation });
  } catch (error) {
    console.error("Lỗi khi joinByInviteCode", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const createPoll = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { question, options } = req.body;
    const userId = req.user._id;

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: "Bình chọn cần ít nhất 1 câu hỏi và 2 lựa chọn" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Nhóm không tồn tại" });

    const newPoll = {
      question,
      options: options.map((opt) => ({ text: opt, votes: [] })),
      createdBy: userId,
      createdAt: new Date(),
    };

    conversation.polls.push(newPoll);
    await conversation.save();

    const createdPoll = conversation.polls[conversation.polls.length - 1];
    io.to(conversationId).emit("poll-created", { conversationId, poll: createdPoll });

    return res.status(201).json({ poll: createdPoll });
  } catch (error) {
    console.error("Lỗi khi createPoll", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const votePoll = async (req, res) => {
  try {
    const { conversationId, pollId } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Nhóm không tồn tại" });

    const poll = conversation.polls.id(pollId);
    if (!poll) return res.status(404).json({ message: "Bình chọn không tồn tại" });

    if (poll.isClosed) return res.status(400).json({ message: "Cuộc bình chọn đã kết thúc" });

    // Remove user's previous votes in this poll
    poll.options.forEach((opt) => {
      opt.votes = opt.votes.filter((v) => v.toString() !== userId.toString());
    });

    // Add vote to target option
    if (poll.options[optionIndex]) {
      poll.options[optionIndex].votes.push(userId);
    }

    await conversation.save();
    io.to(conversationId).emit("poll-updated", { conversationId, poll });

    return res.status(200).json({ poll });
  } catch (error) {
    console.error("Lỗi khi votePoll", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateGroupInfo = async (req, res) => {
  try {
    const conversationId = req.params.conversationId || req.params.groupId;
    const { name, avatarUrl, avatar } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Nhóm không tồn tại" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "Bạn không phải thành viên của nhóm này" });
    }

    if (!conversation.group) {
      conversation.group = { name: "Nhóm Chat", createdBy: userId };
    }

    if (name !== undefined && typeof name === "string" && name.trim()) {
      conversation.group.name = name.trim();
    }

    const newAvatar = avatarUrl || avatar;
    if (newAvatar !== undefined) {
      conversation.group.avatar = newAvatar;
      conversation.group.avatarUrl = newAvatar;
    }

    conversation.markModified("group");
    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    const formattedParticipants = conversation.participants.map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const updatedConvo = {
      ...conversation.toObject(),
      participants: formattedParticipants,
    };

    io.to(conversationId).emit("group-updated", updatedConvo);
    io.to(conversationId).emit("groupUpdated", updatedConvo);

    return res.status(200).json({
      message: "Cập nhật thông tin nhóm thành công",
      conversation: updatedConvo,
    });
  } catch (error) {
    console.error("Lỗi khi updateGroupInfo", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateMemberNickname = async (req, res) => {
  try {
    const conversationId = req.params.conversationId || req.params.groupId;
    const memberId = req.params.memberId || req.body.memberId;
    const { nickname } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Cuộc trò chuyện không tồn tại" });
    }

    if (!conversation.settings) {
      conversation.settings = {};
    }

    if (!conversation.settings.nicknames) {
      conversation.settings.nicknames = new Map();
    }

    const targetIdStr = memberId.toString();
    const trimmedNickname = typeof nickname === "string" ? nickname.trim() : "";

    if (trimmedNickname.length > 0) {
      if (typeof conversation.settings.nicknames.set === "function") {
        conversation.settings.nicknames.set(targetIdStr, trimmedNickname);
      } else {
        conversation.settings.nicknames[targetIdStr] = trimmedNickname;
      }
    } else {
      if (typeof conversation.settings.nicknames.delete === "function") {
        conversation.settings.nicknames.delete(targetIdStr);
      } else if (typeof conversation.settings.nicknames === "object") {
        delete conversation.settings.nicknames[targetIdStr];
      }
    }

    conversation.markModified("settings");
    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    const formattedParticipants = conversation.participants.map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const rawConvo = conversation.toObject();
    if (rawConvo.settings && rawConvo.settings.nicknames instanceof Map) {
      rawConvo.settings.nicknames = Object.fromEntries(rawConvo.settings.nicknames);
    }

    const updatedConvo = {
      ...rawConvo,
      participants: formattedParticipants,
    };

    io.to(conversationId).emit("group-updated", updatedConvo);
    io.to(conversationId).emit("groupUpdated", updatedConvo);

    return res.status(200).json({
      message: "Đã cập nhật biệt danh thành viên",
      conversation: updatedConvo,
    });
  } catch (error) {
    console.error("Lỗi khi updateMemberNickname", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

