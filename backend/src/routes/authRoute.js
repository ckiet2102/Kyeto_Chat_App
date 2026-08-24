import express from "express";
import passport from "../config/passport.js";
import User from "../models/User.js";
import {
  refreshToken,
  signIn,
  signOut,
  signUp,
  verifyRegistrationOTP,
  resendRegistrationOTP,
  setup2FA,
  verify2FA,
  validate2FALogin,
  verifyEmail,
  forgotPassword,
  verifyOTPCode,
  resetPassword,
  handleOAuthSuccess,
  generateTokensAndSession,
  verifyGoogleToken,
  testEmailDiagnostic,
} from "../controllers/authController.js";
import { loginRateLimiter } from "../middlewares/rateLimitMiddleware.js";
import { protectRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/test-email", testEmailDiagnostic);
router.post("/signup", signUp);
router.post("/verify-registration-otp", verifyRegistrationOTP);
router.post("/resend-registration-otp", resendRegistrationOTP);
router.post("/signin", loginRateLimiter, signIn);
router.post("/login", loginRateLimiter, signIn);
router.post("/signout", signOut);
router.post("/refresh", refreshToken);

// Real Google OAuth ID Token Verification
router.post("/google/verify", verifyGoogleToken);

// 2FA Routes
router.post("/2fa/setup", protectRoute, setup2FA);
router.post("/2fa/verify", protectRoute, verify2FA);
router.post("/2fa/validate", validate2FALogin);

// Email Verification & Password Reset
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTPCode);
router.post("/reset-password", resetPassword);

// OAuth Routes
router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes("demo")) {
    // Dev fallback demo OAuth login
    User.findOne({ email: "google.user@example.com" }).then(async (user) => {
      if (!user) {
        user = await User.create({
          username: "google_user",
          email: "google.user@example.com",
          displayName: "Google User",
          avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Google",
          emailVerified: true,
        });
      }
      const accessToken = await generateTokensAndSession(user, res);
      return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/oauth-callback?token=${accessToken}`);
    }).catch(next);
  } else {
    passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
  }
});

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) {
      console.error("Passport Google Auth Error:", err);
      const targetUrl = process.env.CLIENT_URL || "https://kyeto-chat-app.vercel.app";
      return res.redirect(`${targetUrl}/signin?error=google_auth_failed`);
    }
    if (!user) {
      console.warn("Passport Google Auth No User:", info);
      const targetUrl = process.env.CLIENT_URL || "https://kyeto-chat-app.vercel.app";
      return res.redirect(`${targetUrl}/signin?error=no_user`);
    }
    req.user = user;
    return handleOAuthSuccess(req, res);
  })(req, res, next);
});

router.get("/github", (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID.includes("demo")) {
    // Dev fallback demo OAuth login
    User.findOne({ email: "github.user@example.com" }).then(async (user) => {
      if (!user) {
        user = await User.create({
          username: "github_user",
          email: "github.user@example.com",
          displayName: "GitHub User",
          avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=GitHub",
          emailVerified: true,
        });
      }
      const accessToken = await generateTokensAndSession(user, res);
      return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/oauth-callback?token=${accessToken}`);
    }).catch(next);
  } else {
    passport.authenticate("github", { scope: ["user:email"], session: false })(req, res, next);
  }
});

router.get("/github/callback", (req, res, next) => {
  passport.authenticate("github", { session: false }, (err, user, info) => {
    if (err) {
      console.error("Passport GitHub Auth Error:", err);
      const targetUrl = process.env.CLIENT_URL || "https://kyeto-chat-app.vercel.app";
      return res.redirect(`${targetUrl}/signin?error=github_auth_failed`);
    }
    if (!user) {
      console.warn("Passport GitHub Auth No User:", info);
      const targetUrl = process.env.CLIENT_URL || "https://kyeto-chat-app.vercel.app";
      return res.redirect(`${targetUrl}/signin?error=no_user`);
    }
    req.user = user;
    return handleOAuthSuccess(req, res);
  })(req, res, next);
});

export default router;
