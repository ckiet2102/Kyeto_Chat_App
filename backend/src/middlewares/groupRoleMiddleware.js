import Conversation from "../models/Conversation.js";

export const checkGroupRole = (requiredRole = "member") => {
  return async (req, res, next) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user._id.toString();

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || conversation.type !== "group") {
        return res.status(404).json({ message: "Nhóm chat không tồn tại" });
      }

      // Check ban list
      const isBanned = conversation.banList?.some((b) => b.toString() === userId);
      if (isBanned) {
        return res.status(403).json({ message: "Bạn đã bị cấm khỏi nhóm này" });
      }

      const isOwner = conversation.group?.createdBy?.toString() === userId;
      const isAdmin = conversation.admins?.some((a) => a.toString() === userId) || isOwner;
      const isModerator = conversation.moderators?.some((m) => m.toString() === userId) || isAdmin;
      const isMember = conversation.participants?.some((p) => {
        const pId = p?.userId ? (p.userId._id ? p.userId._id.toString() : p.userId.toString()) : (p?._id ? p._id.toString() : p?.toString());
        return pId === userId;
      });

      if (!isMember) {
        return res.status(403).json({ message: "Bạn không phải là thành viên nhóm" });
      }

      req.groupRole = isOwner ? "owner" : isAdmin ? "admin" : isModerator ? "moderator" : "member";
      req.conversation = conversation;

      if (requiredRole === "owner" && !isOwner) {
        return res.status(403).json({ message: "Chỉ Trưởng nhóm (Owner) mới có quyền thực hiện" });
      }

      if (requiredRole === "admin" && !isAdmin) {
        return res.status(403).json({ message: "Chỉ Quản trị viên (Admin) trở lên mới có quyền thực hiện" });
      }

      if (requiredRole === "moderator" && !isModerator) {
        return res.status(403).json({ message: "Chỉ Kiểm duyệt viên (Moderator) trở lên mới có quyền thực hiện" });
      }

      next();
    } catch (error) {
      console.error("Lỗi checkGroupRole middleware:", error);
      return res.status(500).json({ message: "Lỗi hệ thống" });
    }
  };
};
