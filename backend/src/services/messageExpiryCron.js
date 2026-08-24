import Message from "../models/Message.js";
import { io } from "../socket/index.js";

export const startMessageExpiryCron = () => {
  console.log("[MessageExpiryCron] Service started. Checking every 5 minutes.");

  setInterval(async () => {
    try {
      const now = new Date();
      const expiredMessages = await Message.find({
        expiresAt: { $lte: now },
        deletedAt: null,
      });

      if (expiredMessages.length === 0) return;

      console.log(`[MessageExpiryCron] Cleaning up ${expiredMessages.length} expired self-destructing messages.`);

      for (const msg of expiredMessages) {
        msg.deletedAt = now;
        msg.content = "[Tin nhắn đã tự hủy]";
        msg.imgUrl = null;
        msg.fileUrl = null;
        await msg.save();

        io.to(msg.conversationId.toString()).emit("message-deleted", {
          messageId: msg._id,
          conversationId: msg.conversationId,
          deletedAt: now,
          content: "[Tin nhắn đã tự hủy]",
        });
      }
    } catch (err) {
      console.error("[MessageExpiryCron Error]:", err);
    }
  }, 5 * 60 * 1000);
};
