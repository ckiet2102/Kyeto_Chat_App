import User from "../models/User.js";
import Message from "../models/Message.js";

export const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMessages = await Message.countDocuments();
    const premiumUsers = await User.countDocuments({ subscriptionPlan: { $ne: "free" } });

    return res.status(200).json({
      stats: {
        totalUsers,
        totalMessages,
        premiumUsers,
        freeUsers: totalUsers - premiumUsers,
      },
    });
  } catch (error) {
    console.error("Lỗi getSystemStats:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateUserPlan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { subscriptionPlan: plan, planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      { new: true }
    );

    return res.status(200).json({ message: "Cập nhật gói dịch vụ thành công", user });
  } catch (error) {
    console.error("Lỗi updateUserPlan:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
