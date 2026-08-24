import Conversation from "../models/Conversation.js";

export const checkGroupAdmin = async (req, res, next) => {
  try {
    const conversationId = req.params.conversationId || req.body.conversationId;
    const userId = req.user._id.toString();

    const conversation = req.conversation || (await Conversation.findById(conversationId));

    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy nhóm chat" });
    }

    if (conversation.type !== "group") {
      return res.status(400).json({ message: "Thao tác chỉ áp dụng cho nhóm chat" });
    }

    const isOwner = conversation.group?.createdBy?.toString() === userId;
    const isAdmin = conversation.admins?.some((adminId) => adminId.toString() === userId);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Bạn cần quyền Quản trị viên (Admin) để thực hiện thao tác này" });
    }

    req.conversation = conversation;
    req.userRole = isOwner ? "owner" : "admin";
    next();
  } catch (error) {
    console.error("Lỗi rbacMiddleware checkGroupAdmin:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const checkGroupOwner = async (req, res, next) => {
  try {
    const conversationId = req.params.conversationId || req.body.conversationId;
    const userId = req.user._id.toString();

    const conversation = req.conversation || (await Conversation.findById(conversationId));

    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy nhóm chat" });
    }

    if (conversation.type !== "group") {
      return res.status(400).json({ message: "Thao tác chỉ áp dụng cho nhóm chat" });
    }

    const isOwner = conversation.group?.createdBy?.toString() === userId;

    if (!isOwner) {
      return res.status(403).json({ message: "Chỉ Trưởng nhóm (Owner) mới có quyền thực hiện thao tác này" });
    }

    req.conversation = conversation;
    req.userRole = "owner";
    next();
  } catch (error) {
    console.error("Lỗi rbacMiddleware checkGroupOwner:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const checkCanSendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id.toString();

    if (!conversationId) return next();

    const conversation = req.conversation || (await Conversation.findById(conversationId));

    if (!conversation || conversation.type !== "group") return next();

    if (conversation.settings?.onlyAdminSend) {
      const isOwner = conversation.group?.createdBy?.toString() === userId;
      const isAdmin = conversation.admins?.some((adminId) => adminId.toString() === userId);

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Nhóm hiện chỉ cho phép Quản trị viên gửi tin nhắn" });
      }
    }

    next();
  } catch (error) {
    console.error("Lỗi checkCanSendMessage:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
