import express from "express";
import {
  authMe,
  searchUserByUsername,
  uploadAvatar,
  uploadCover,
  updateProfile,
  changePassword,
  toggleNotifications,
  blockUser,
  unblockUser,
  getBlockedUsers,
  reportUser,
  uploadPublicKey,
  getUserPublicKey,
  getUserById,
} from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/me", authMe);
router.get("/search", searchUserByUsername);
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);
router.post("/uploadCover", upload.single("file"), uploadCover);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);
router.put("/notifications", toggleNotifications);
router.post("/block", blockUser);
router.post("/unblock", unblockUser);
router.get("/blocked", getBlockedUsers);
router.post("/report", reportUser);
router.post("/keys", uploadPublicKey);
router.get("/:id/key", getUserPublicKey);
router.get("/:id", getUserById);

export default router;
