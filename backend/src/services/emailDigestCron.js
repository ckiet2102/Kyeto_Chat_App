import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { sendEmail } from "../utils/emailService.js";

// Run Email Digest check every 6 hours
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export const startEmailDigestCron = () => {
  console.log("[EmailDigestCron] Service started. Running every 6 hours.");

  setInterval(async () => {
    try {
      console.log("[EmailDigestCron] Checking for unread messages digest...");

      // Find users with email digest enabled
      const users = await User.find({
        "notificationPreferences.emailDigestEnabled": { $ne: false },
        emailVerified: true,
      });

      for (const user of users) {
        // Find conversations of this user
        const conversations = await Conversation.find({
          participants: user._id,
        }).select("_id name type participants");

        let totalUnreadCount = 0;
        const unreadSummaries = [];

        for (const convo of conversations) {
          // Count unread messages created after user's last view or recent 6h
          const count = await Message.countDocuments({
            conversationId: convo._id,
            senderId: { $ne: user._id },
            createdAt: { $gte: new Date(Date.now() - SIX_HOURS_MS) },
          });

          if (count > 0) {
            totalUnreadCount += count;
            const lastMsg = await Message.findOne({ conversationId: convo._id })
              .sort({ createdAt: -1 })
              .populate("senderId", "displayName");

            unreadSummaries.push({
              title: convo.name || lastMsg?.senderId?.displayName || "Cuộc trò chuyện",
              count,
              lastText: lastMsg?.content || "[Media/Tệp tin]",
            });
          }
        }

        if (totalUnreadCount > 0 && unreadSummaries.length > 0) {
          const listHtml = unreadSummaries
            .map(
              (item) =>
                `<li style="margin-bottom: 10px;">
                  <strong>${item.title}</strong> (${item.count} tin mới):
                  <span style="color: #666; font-style: italic;">"${item.lastText}"</span>
                </li>`
            )
            .join("");

          await sendEmail({
            to: user.email,
            subject: `[Kyeto Chat] Bạn có ${totalUnreadCount} tin nhắn mới chưa đọc`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Chào ${user.displayName},</h2>
              <p>Bạn đã bỏ lỡ <strong>${totalUnreadCount}</strong> tin nhắn mới trong 6 giờ qua:</p>
              <ul>${listHtml}</ul>
              <div style="margin-top: 20px;">
                <a href="${process.env.CLIENT_URL || "http://localhost:5173"}" style="background-color: #d4af37; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Truy cập Kyeto Chat ngay</a>
              </div>
            </div>`,
          });
        }
      }
    } catch (error) {
      console.error("[EmailDigestCron Error]:", error);
    }
  }, SIX_HOURS_MS);
};
