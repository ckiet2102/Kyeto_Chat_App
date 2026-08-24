import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { io } from "../socket/index.js";

export const startScheduledMessageCron = () => {
  console.log("[ScheduledMessageCron] Service started. Checking every 30 seconds.");

  setInterval(async () => {
    try {
      const now = new Date();
      const pendingMessages = await Message.find({
        scheduledAt: { $lte: now },
      });

      if (pendingMessages.length === 0) return;

      console.log(`[ScheduledMessageCron] Processing ${pendingMessages.length} scheduled messages.`);

      for (const msg of pendingMessages) {
        msg.scheduledAt = null; // Mark as delivered
        await msg.save();

        await Conversation.findByIdAndUpdate(msg.conversationId, {
          lastMessageAt: msg.createdAt,
          lastMessage: {
            _id: msg._id,
            content: msg.content || "[Media/Tệp tin]",
            senderId: msg.senderId,
            createdAt: msg.createdAt,
          },
        });

        io.to(msg.conversationId.toString()).emit("new-message", { message: msg });
      }
    } catch (err) {
      console.error("[ScheduledMessageCron Error]:", err);
    }
  }, 30000);
};
