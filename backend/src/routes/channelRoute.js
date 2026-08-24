import express from "express";
import {
  createChannel,
  getChannels,
  getChannelPosts,
  createChannelPost,
} from "../controllers/channelController.js";

const router = express.Router();

router.post("/", createChannel);
router.get("/", getChannels);
router.get("/:channelId/posts", getChannelPosts);
router.post("/:channelId/posts", createChannelPost);

export default router;
