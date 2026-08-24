import express from "express";
import {
  sendDirectMessage,
  sendGroupMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  toggleBookmark,
  getBookmarks,
  togglePinMessage,
  getPinnedMessages,
  searchMessages,
  getCallLogs,
  createCallLog,
  getCloudFiles,
  uploadCloudFile,
  saveFileToCloud,
  getSelfConversation,
  sendSelfMessage,
  deleteSelfMessagesBatch,
  getThreadReplies,
  sendThreadReply,
  markMessageRead,
  getMessageReadStatus,
  hideMessageForSelf,
} from "../controllers/messageController.js";
import { getLinkPreview } from "../services/linkPreviewService.js";
import {
  checkFriendship,
  checkGroupMembership,
} from "../middlewares/friendMiddleware.js";
import { checkCanSendMessage } from "../middlewares/rbacMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/direct", checkFriendship, sendDirectMessage);
router.post("/group", checkGroupMembership, checkCanSendMessage, sendGroupMessage);
router.put("/:messageId", editMessage);
router.delete("/:messageId", deleteMessage);
router.post("/:messageId/hide", hideMessageForSelf);
router.post("/:messageId/react", toggleReaction);
router.post("/:messageId/read", markMessageRead);
router.get("/:messageId/read-status", getMessageReadStatus);

// Link Preview OG Endpoint
router.post("/link-preview", async (req, res) => {
  const { url } = req.body;
  const data = await getLinkPreview(url);
  return res.status(200).json({ preview: data });
});

// Threading Routes
router.get("/:messageId/thread", getThreadReplies);
router.post("/:messageId/thread", sendThreadReply);

// Bookmarks & Pinning
router.post("/:messageId/bookmark", toggleBookmark);
router.get("/bookmarks", getBookmarks);
router.post("/:messageId/pin", togglePinMessage);
router.get("/pinned/:conversationId", getPinnedMessages);

// Search & Calls & Cloud
router.get("/search", searchMessages);
router.get("/call-logs", getCallLogs);
router.post("/call-logs", createCallLog);
router.get("/cloud", getCloudFiles);
router.post("/cloud", upload.single("file"), uploadCloudFile);
router.post("/cloud/save", saveFileToCloud);

// Self-Chat (Kyeto Cloud Space)
router.get("/self", getSelfConversation);
router.post("/self", upload.single("file"), sendSelfMessage);
router.post("/self/batch-delete", deleteSelfMessagesBatch);

export default router;
