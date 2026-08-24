import PushSubscription from "../models/PushSubscription.js";
import User from "../models/User.js";
import { getVapidPublicKey } from "../services/pushService.js";

export const getVapidKey = (req, res) => {
  return res.status(200).json({ publicKey: getVapidPublicKey() });
};

export const subscribePush = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subscription, userAgent } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ message: "Thiếu subscription payload" });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ message: "Đã đăng ký Web Push thành công!" });
  } catch (error) {
    console.error("Lỗi subscribePush", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const unsubscribePush = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await PushSubscription.deleteOne({ endpoint });
    }
    return res.status(200).json({ message: "Đã hủy đăng ký Web Push" });
  } catch (error) {
    console.error("Lỗi unsubscribePush", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const { pushEnabled, emailDigestEnabled, soundEnabled } = req.body;

    const user = await User.findById(userId);
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...(pushEnabled !== undefined && { pushEnabled }),
      ...(emailDigestEnabled !== undefined && { emailDigestEnabled }),
      ...(soundEnabled !== undefined && { soundEnabled }),
    };

    await user.save();

    return res.status(200).json({
      message: "Cập nhật tùy chọn thông báo thành công",
      preferences: user.notificationPreferences,
    });
  } catch (error) {
    console.error("Lỗi updateNotificationPreferences", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
