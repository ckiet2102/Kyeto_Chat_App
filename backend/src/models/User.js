import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    oauthProviders: {
      googleId: { type: String, sparse: true },
      githubId: { type: String, sparse: true },
      facebookId: { type: String, sparse: true },
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifyToken: {
      type: String,
    },
    signupOtp: {
      type: String,
    },
    signupOtpExpires: {
      type: Date,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetOtp: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    publicKey: {
      type: String, // ECDH public key (JWK or Base64 string)
    },
    keyUpdatedAt: {
      type: Date,
    },
    notificationPreferences: {
      pushEnabled: { type: Boolean, default: true },
      emailDigest: { type: Boolean, default: true },
      soundEnabled: { type: Boolean, default: true },
    },
    status: {
      emoji: { type: String, default: "💬" },
      text: { type: String, default: "Đang sẵn sàng trò chuyện" },
    },
    locale: {
      type: String,
      default: "vi",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    subscriptionPlan: {
      type: String,
      enum: ["free", "premium", "enterprise"],
      default: "free",
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
    avatarUrl: {
      type: String, // link CDN để hiển thị hình
    },
    avatarId: {
      type: String, // Cloudinary public_id để xoá hình
    },
    coverUrl: {
      type: String, // link CDN để hiển thị ảnh bìa
    },
    coverId: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    phone: {
      type: String,
      sparse: true,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    showOnlineStatus: {
      type: Boolean,
      default: true,
    },
    favoriteConversations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
      },
    ],
    archivedConversations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
      },
    ],
    mutedConversations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
