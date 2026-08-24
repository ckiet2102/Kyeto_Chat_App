import express from "express";
import {
  getVapidKey,
  subscribePush,
  unsubscribePush,
  updateNotificationPreferences,
} from "../controllers/notificationController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/vapid-key", getVapidKey);
router.post("/subscribe", protectedRoute, subscribePush);
router.post("/unsubscribe", protectedRoute, unsubscribePush);
router.put("/preferences", protectedRoute, updateNotificationPreferences);

export default router;
