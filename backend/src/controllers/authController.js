// @ts-nocheck
import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";
import { generateSecret, generateURI, verify as verifyOTP } from "otplib";
import QRCode from "qrcode";
import { sendEmail } from "../utils/emailService.js";
import { OAuth2Client } from "google-auth-library";

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 days

export const generateTokensAndSession = async (user, res) => {
  const accessToken = jwt.sign(
    { userId: user._id.toString() },
    process.env.ACCESS_TOKEN_SECRET || "default-access-secret",
    { expiresIn: ACCESS_TOKEN_TTL }
  );

  const refreshToken = crypto.randomBytes(64).toString("hex");

  await Session.create({
    userId: user._id,
    refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
  });

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: REFRESH_TOKEN_TTL,
  });

  return accessToken;
};

export const signUp = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const firstName = req.body.firstName || req.body.firstname || "";
    const lastName = req.body.lastName || req.body.lastname || "";

    if (!username || !password || !email) {
      return res.status(400).json({
        message: "Không thể thiếu username, password, và email",
      });
    }

    const displayName = `${lastName} ${firstName}`.trim() || username;

    const [existingEmailUser, existingUsernameUser] = await Promise.all([
      User.findOne({ email: email.toLowerCase() }).maxTimeMS(5000),
      User.findOne({ username: username.toLowerCase() }).maxTimeMS(5000),
    ]);

    if (existingEmailUser && existingEmailUser.emailVerified) {
      return res.status(409).json({ message: "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác." });
    }

    if (existingUsernameUser && existingUsernameUser.emailVerified && existingUsernameUser.email !== email.toLowerCase()) {
      return res.status(409).json({ message: "Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên đăng nhập khác." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    const signupOtp = Math.floor(100000 + Math.random() * 900000).toString();

    let user;

    if (existingEmailUser && !existingEmailUser.emailVerified) {
      existingEmailUser.username = username.toLowerCase();
      existingEmailUser.hashedPassword = hashedPassword;
      existingEmailUser.displayName = displayName;
      existingEmailUser.signupOtp = signupOtp;
      existingEmailUser.signupOtpExpires = Date.now() + 10 * 60 * 1000;
      user = await existingEmailUser.save();
    } else {
      user = await User.create([{
        username: username.toLowerCase(),
        hashedPassword,
        email: email.toLowerCase(),
        displayName,
        emailVerifyToken,
        signupOtp,
        signupOtpExpires: Date.now() + 10 * 60 * 1000,
        emailVerified: false,
      }]).then(docs => docs[0]);
    }

    console.log(`[Sign Up OTP for ${user.email}]: ${signupOtp}`);

    // Send email asynchronously in background so signup HTTP response returns instantly
    sendEmail({
      to: user.email,
      subject: `Mã OTP Xác thực Đăng ký Kyeto Chat: ${signupOtp}`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #fbbf24; text-align: center; font-size: 24px; margin-top: 0;">Xác Thực Đăng Ký Tài Khoản</h2>
        <p style="color: #cbd5e1; font-size: 15px;">Chào mừng <strong>${user.displayName}</strong> đến với Kyeto Chat!</p>
        <p style="color: #cbd5e1; font-size: 15px;">Mã OTP 6 số để hoàn tất đăng ký tài khoản của bạn là:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fbbf24; background: rgba(251, 191, 36, 0.1); padding: 12px 24px; border-radius: 8px; border: 1px dashed #fbbf24; display: inline-block;">${signupOtp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 13px; text-align: center;">Mã OTP có hiệu lực trong 10 phút. Vui lòng nhập mã để kích hoạt tài khoản.</p>
      </div>`,
    }).catch((emailErr) => {
      console.warn("Could not send registration email:", emailErr);
    });

    return res.status(201).json({
      message: "Đăng ký thành công! Vui lòng nhập mã OTP 6 số đã được gửi đến email của bạn.",
      requiresOTP: true,
      email: user.email,
    });
  } catch (error) {
    console.error("Lỗi khi gọi signUp:", error);
    if (error.code === 11000 || error.name === "MongoServerError") {
      const key = Object.keys(error.keyValue || {})[0] || "";
      const fieldName = key === "email" ? "Email" : key === "username" ? "Tên đăng nhập" : "Thông tin";
      return res.status(409).json({ message: `${fieldName} này đã được sử dụng. Vui lòng chọn ${fieldName} khác!` });
    }
    return res.status(500).json({ message: "Lỗi hệ thống khi đăng ký: " + (error.message || "Vui lòng thử lại") });
  }
};

// Verify Registration OTP
export const verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ email và mã OTP" });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      signupOtp: otp,
      signupOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Mã OTP xác thực đăng ký không đúng hoặc đã hết hạn!" });
    }

    user.emailVerified = true;
    user.signupOtp = undefined;
    user.signupOtpExpires = undefined;
    await user.save();

    const accessToken = await generateTokensAndSession(user, res);

    return res.status(200).json({
      message: "Xác thực đăng ký tài khoản thành công! Tự động đăng nhập.",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        twoFactorEnabled: user.twoFactorEnabled,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Lỗi verifyRegistrationOTP", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xác thực OTP đăng ký" });
  }
};

// Resend Registration OTP
export const resendRegistrationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Vui lòng cung cấp email" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản với email này" });
    }
    if (user.emailVerified) {
      return res.status(400).json({ message: "Tài khoản đã được xác minh thành công trước đó." });
    }

    const signupOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.signupOtp = signupOtp;
    user.signupOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    console.log(`[Resend Sign Up OTP for ${user.email}]: ${signupOtp}`);

    await sendEmail({
      to: user.email,
      subject: `Mã OTP Xác thực Đăng ký Kyeto Chat: ${signupOtp}`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #fbbf24; text-align: center; font-size: 24px; margin-top: 0;">Xác Thực Đăng Ký Tài Khoản</h2>
        <p style="color: #cbd5e1; font-size: 15px;">Chào <strong>${user.displayName}</strong>,</p>
        <p style="color: #cbd5e1; font-size: 15px;">Mã OTP 6 số mới để xác thực đăng ký tài khoản Kyeto Chat của bạn là:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fbbf24; background: rgba(251, 191, 36, 0.1); padding: 12px 24px; border-radius: 8px; border: 1px dashed #fbbf24; display: inline-block;">${signupOtp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 13px; text-align: center;">Mã OTP có hiệu lực trong 10 phút.</p>
      </div>`,
    });

    return res.status(200).json({ message: "Đã gửi lại mã OTP 6 số thành công!" });
  } catch (error) {
    console.error("Lỗi resendRegistrationOTP", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi gửi lại mã OTP" });
  }
};

export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu." });
    }

    const cleanUsername = String(username).trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanUsername }],
    });

    if (!user || !user.hashedPassword) {
      if (req.rateLimit?.recordFailure) req.rateLimit.recordFailure();
      return res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
    }

    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordCorrect) {
      if (req.rateLimit?.recordFailure) req.rateLimit.recordFailure();
      return res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
    }

    if (req.rateLimit?.clear) req.rateLimit.clear();

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { userId: user._id, is2FA: true },
        process.env.ACCESS_TOKEN_SECRET || "default-access-secret",
        { expiresIn: "5m" }
      );
      return res.status(200).json({
        requires2FA: true,
        tempToken,
        message: "Yêu cầu nhập mã xác thực 2 yếu tố (2FA)",
      });
    }

    const accessToken = await generateTokensAndSession(user, res);

    return res.status(200).json({
      message: `User ${user.displayName} đã đăng nhập!`,
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        twoFactorEnabled: user.twoFactorEnabled,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Lỗi khi gọi signIn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signOut = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await Session.deleteOne({ refreshToken: token });
      const isProduction = process.env.NODE_ENV === "production";
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
      });
    }
    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signOut", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Token không tồn tại." });
    }

    const session = await Session.findOne({ refreshToken: token });
    if (!session || session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token đã hết hạn hoặc không hợp lệ" });
    }

    const accessToken = jwt.sign(
      { userId: session.userId },
      process.env.ACCESS_TOKEN_SECRET || "default-access-secret",
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi refreshToken", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 2FA Setup
export const setup2FA = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const secret = generateSecret();
    const otpauthUrl = generateURI({ secret, label: user.email, issuer: "Kyeto Chat" });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Temp save secret until verified
    user.twoFactorSecret = secret;
    await user.save();

    return res.status(200).json({
      secret,
      qrCodeDataUrl,
    });
  } catch (error) {
    console.error("Lỗi setup2FA", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi thiết lập 2FA" });
  }
};

// 2FA Enable/Verify
export const verify2FA = async (req, res) => {
  try {
    const userId = req.user._id;
    const { code } = req.body;
    const user = await User.findById(userId);

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: "Chưa khởi tạo 2FA secret" });
    }

    const isValid = verifyOTP({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      return res.status(400).json({ message: "Mã 2FA không chính xác" });
    }

    user.twoFactorEnabled = true;
    await user.save();

    return res.status(200).json({ message: "Đã bật Xác thực 2 yếu tố thành công!" });
  } catch (error) {
    console.error("Lỗi verify2FA", error);
    return res.status(500).json({ message: "Lỗi khi bật 2FA" });
  }
};

// 2FA Validate on login
export const validate2FALogin = async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({ message: "Thiếu tempToken hoặc mã 2FA" });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        tempToken,
        process.env.ACCESS_TOKEN_SECRET || "default-access-secret"
      );
    } catch {
      return res.status(401).json({ message: "Phiên 2FA đã hết hạn. Vui lòng đăng nhập lại." });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: "Tài khoản không hợp lệ" });
    }

    const isValid = verifyOTP({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      return res.status(400).json({ message: "Mã 2FA không chính xác" });
    }

    const accessToken = await generateTokensAndSession(user, res);

    return res.status(200).json({
      message: `Đăng nhập 2FA thành công!`,
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        twoFactorEnabled: user.twoFactorEnabled,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Lỗi validate2FALogin", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xác thực 2FA" });
  }
};

// Email Verification
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ emailVerifyToken: token });

    if (!user) {
      return res.status(400).json({ message: "Token xác minh không hợp lệ hoặc đã sử dụng." });
    }

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    await user.save();

    return res.status(200).json({ message: "Xác minh email thành công! Bạn có thể đăng nhập." });
  } catch (error) {
    console.error("Lỗi verifyEmail", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xác minh email" });
  }
};

// Forgot Password - Send 6-digit OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Vui lòng nhập địa chỉ email" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "Địa chỉ email không tồn tại trong hệ thống!" });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetOtp = otp;
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    console.log(`[Forgot Password OTP for ${user.email}]: ${otp}`);

    await sendEmail({
      to: user.email,
      subject: `Mã OTP Đặt lại Mật khẩu Kyeto Chat: ${otp}`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #fbbf24; text-align: center; font-size: 24px; margin-top: 0;">Xác thực Đặt lại Mật khẩu</h2>
        <p style="color: #cbd5e1; font-size: 15px;">Xin chào <strong>${user.displayName}</strong>,</p>
        <p style="color: #cbd5e1; font-size: 15px;">Mã OTP 6 số xác thực đặt lại mật khẩu cho tài khoản Kyeto Chat của bạn là:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fbbf24; background: rgba(251, 191, 36, 0.1); padding: 12px 24px; border-radius: 8px; border: 1px dashed #fbbf24; display: inline-block;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 13px; text-align: center;">Mã OTP có hiệu lực trong 10 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
      </div>`,
    });

    return res.status(200).json({
      message: "Mã OTP 6 số đã được gửi thành công đến email của bạn!",
      token: resetToken,
    });
  } catch (error) {
    console.error("Lỗi forgotPassword", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi gửi mã OTP" });
  }
};

// Verify OTP 6-digits
export const verifyOTPCode = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ email và mã OTP" });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetOtp: otp,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Mã OTP không đúng hoặc đã hết hạn!" });
    }

    return res.status(200).json({ message: "Mã OTP hợp lệ!", valid: true });
  } catch (error) {
    console.error("Lỗi verifyOTPCode", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi kiểm tra mã OTP" });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, token, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    let query = { passwordResetExpires: { $gt: Date.now() } };
    if (email && otp) {
      query.email = email.toLowerCase();
      query.passwordResetOtp = otp;
    } else if (token) {
      query.passwordResetToken = token;
    } else {
      return res.status(400).json({ message: "Thiếu thông tin xác thực OTP hoặc Token" });
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(400).json({ message: "Mã OTP hoặc Token đặt lại mật khẩu không đúng hoặc đã hết hạn!" });
    }

    user.hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetOtp = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all existing sessions for security
    await Session.deleteMany({ userId: user._id });

    return res.status(200).json({ message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại." });
  } catch (error) {
    console.error("Lỗi resetPassword", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi đặt lại mật khẩu" });
  }
};

// OAuth Callback redirect handler
export const handleOAuthSuccess = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/signin?error=oauth_failed`);
    }

    const accessToken = await generateTokensAndSession(user, res);
    const redirectUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/oauth-callback?token=${accessToken}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("Lỗi handleOAuthSuccess", error);
    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/signin?error=oauth_error`);
  }
};

// Real Google OAuth ID Token verification endpoint
export const verifyGoogleToken = async (req, res) => {
  try {
    const { credential, idToken } = req.body;
    const tokenToVerify = credential || idToken;

    if (!tokenToVerify) {
      return res.status(400).json({ message: "Thiếu Google ID Token." });
    }

    let payload;

    if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes("demo")) {
      const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await googleClient.verifyIdToken({
        idToken: tokenToVerify,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else {
      const parts = tokenToVerify.split(".");
      if (parts.length === 3) {
        payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
      } else {
        const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenToVerify}` },
        });
        payload = await googleRes.json();
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Token Google không hợp lệ hoặc không chứa email." });
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub || payload.id;
    const name = payload.name || payload.given_name || email.split("@")[0];
    const picture = payload.picture;

    let user = await User.findOne({
      $or: [{ email }, { "oauthProviders.googleId": googleId }],
    });

    if (!user) {
      const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      let username = baseUsername;
      let count = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${count++}`;
      }

      user = await User.create({
        username,
        email,
        displayName: name,
        avatarUrl: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        emailVerified: true,
        oauthProviders: { googleId },
      });
    } else {
      let updated = false;
      user.oauthProviders = user.oauthProviders || {};
      if (!user.oauthProviders.googleId) {
        user.oauthProviders.googleId = googleId;
        updated = true;
      }
      if (!user.emailVerified) {
        user.emailVerified = true;
        updated = true;
      }
      if (picture && !user.avatarUrl) {
        user.avatarUrl = picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    const accessToken = await generateTokensAndSession(user, res);

    return res.status(200).json({
      message: `Đăng nhập Google thành công! Welcome ${user.displayName}`,
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        twoFactorEnabled: user.twoFactorEnabled,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Lỗi verifyGoogleToken:", error);
    return res.status(401).json({ message: "Xác thực tài khoản Google thất bại: " + error.message });
  }
};

// Diagnostic Endpoint for Email Delivery Testing
export const testEmailDiagnostic = async (req, res) => {
  const targetEmail = req.query.to || req.body.email || "ckiet2102@gmail.com";
  const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim();
  const smtpHost = (process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);

  const envCheck = {
    smtpUserConfigured: !!smtpUser,
    smtpUserLength: smtpUser.length,
    smtpUserPreview: smtpUser ? `${smtpUser.slice(0, 4)}***${smtpUser.slice(smtpUser.indexOf("@"))}` : "NONE",
    smtpPassConfigured: !!smtpPass,
    smtpPassLength: smtpPass.length,
    smtpHost,
    smtpPort,
  };

  if (!smtpUser || !smtpPass) {
    return res.status(400).json({
      success: false,
      message: "Thiếu cấu hình SMTP_USER hoặc SMTP_PASS trên Render Environment Variables!",
      envCheck,
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Kyeto Chat Diagnostic" <${smtpUser}>`,
      to: targetEmail,
      subject: `[Diagnostic Test] Kyeto Chat Email Delivery Test ${Date.now()}`,
      html: `<h3>Kiểm tra gửi email từ Kyeto Backend Render</h3><p>Mã thử nghiệm: <b>${Math.floor(100000 + Math.random() * 900000)}</b></p>`,
    });

    return res.status(200).json({
      success: true,
      message: `Đã gửi email thử nghiệm thành công tới ${targetEmail}!`,
      messageId: info.messageId,
      accepted: info.accepted,
      envCheck,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gửi email thất bại!",
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.code,
      command: error.command,
      response: error.response,
      envCheck,
    });
  }
};
