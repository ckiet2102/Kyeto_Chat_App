import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";

export const authMe = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const searchUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.trim() === "") {
      return res.status(400).json({ message: "Cần cung cấp username trong query." });
    }

    const user = await User.findOne({ username }).select(
      "_id displayName username avatarUrl coverUrl bio phone"
    );

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi xảy ra khi searchUserByUsername", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadImageFromBuffer(file.buffer);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatarUrl: result.secure_url,
        avatarId: result.public_id,
      },
      { new: true }
    ).select("avatarUrl displayName bio phone coverUrl");

    return res.status(200).json({ avatarUrl: updatedUser.avatarUrl, user: updatedUser });
  } catch (error) {
    console.error("Lỗi xảy ra khi upload avatar", error);
    return res.status(500).json({ message: "Upload failed" });
  }
};

export const uploadCover = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadImageFromBuffer(file.buffer);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        coverUrl: result.secure_url,
        coverId: result.public_id,
      },
      { new: true }
    ).select("coverUrl avatarUrl displayName bio phone");

    return res.status(200).json({ coverUrl: updatedUser.coverUrl, user: updatedUser });
  } catch (error) {
    console.error("Lỗi xảy ra khi upload cover", error);
    return res.status(500).json({ message: "Upload cover failed" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { displayName, bio, phone, showOnlineStatus } = req.body;

    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (showOnlineStatus !== undefined) updateData.showOnlineStatus = Boolean(showOnlineStatus);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-hashedPassword");

    return res.status(200).json({ message: "Cập nhật hồ sơ thành công", user: updatedUser });
  } catch (error) {
    console.error("Lỗi khi updateProfile", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Cần cung cấp mật khẩu cũ và mới" });
    }

    const currentUser = await User.findById(userId);
    const isMatch = await bcrypt.compare(oldPassword, currentUser.hashedPassword);

    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    currentUser.hashedPassword = hashedPassword;
    await currentUser.save();

    return res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi khi changePassword", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const toggleNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentUser = await User.findById(userId);

    currentUser.notificationsEnabled = !currentUser.notificationsEnabled;
    await currentUser.save();

    return res.status(200).json({
      message: `Đã ${currentUser.notificationsEnabled ? "bật" : "tắt"} thông báo`,
      notificationsEnabled: currentUser.notificationsEnabled,
    });
  } catch (error) {
    console.error("Lỗi khi toggleNotifications", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user._id;

    if (!targetUserId) {
      return res.status(400).json({ message: "Thiếu targetUserId" });
    }

    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: targetUserId },
    });

    return res.status(200).json({ message: "Đã chặn người dùng thành công" });
  } catch (error) {
    console.error("Lỗi xảy ra khi blockUser", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user._id;

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { blockedUsers: targetUserId },
    });

    return res.status(200).json({ message: "Đã bỏ chặn người dùng thành công" });
  } catch (error) {
    console.error("Lỗi khi unblockUser", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate(
      "blockedUsers",
      "_id displayName username avatarUrl"
    );

    return res.status(200).json({ blockedUsers: user.blockedUsers || [] });
  } catch (error) {
    console.error("Lỗi khi getBlockedUsers", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const reportUser = async (req, res) => {
  try {
    const { targetUserId, reason } = req.body;
    // Log report logic
    console.log(`User ${req.user._id} reported user ${targetUserId} for: ${reason}`);
    return res.status(200).json({ message: "Báo cáo người dùng đã được gửi tới quản trị viên" });
  } catch (error) {
    console.error("Lỗi khi reportUser", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadPublicKey = async (req, res) => {
  try {
    const userId = req.user._id;
    const { publicKey } = req.body;

    if (!publicKey) {
      return res.status(400).json({ message: "Thiếu public key" });
    }

    await User.findByIdAndUpdate(userId, {
      publicKey,
      keyUpdatedAt: new Date(),
    });

    return res.status(200).json({ message: "Đã tải lên ECDH public key thành công" });
  } catch (error) {
    console.error("Lỗi uploadPublicKey", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getUserPublicKey = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("_id publicKey keyUpdatedAt");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.status(200).json({
      userId: user._id,
      publicKey: user.publicKey || null,
      keyUpdatedAt: user.keyUpdatedAt || null,
    });
  } catch (error) {
    console.error("Lỗi getUserPublicKey", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id).select(
      "_id displayName username avatarUrl coverUrl bio phone status lastSeen"
    );
    if (!targetUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    return res.status(200).json(targetUser);
  } catch (error) {
    console.error("Lỗi khi gọi getUserById", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

