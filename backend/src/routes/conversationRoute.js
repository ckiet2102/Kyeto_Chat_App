import express from "express";
import {
  createConversation,
  getConversations,
  getMessages,
  markAsSeen,
  addMembers,
  removeMember,
  updateAdminRole,
  updateGroupSettings,
  toggleFavoriteConversation,
  getFavoriteConversations,
  updateThemeOrNickname,
  clearConversationMessages,
  deleteConversation,
  markAsUnread,
  toggleArchiveConversation,
  toggleMuteConversation,
  kickMember,
  banMember,
  updateModeratorRole,
  generateInviteCode,
  joinByInviteCode,
  createPoll,
  votePoll,
  updateGroupInfo,
  updateMemberNickname,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";
import {
  checkGroupAdmin,
  checkGroupOwner,
} from "../middlewares/rbacMiddleware.js";
import { checkGroupRole } from "../middlewares/groupRoleMiddleware.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.get("/", getConversations);
router.get("/favorites", getFavoriteConversations);
router.post("/join/:inviteCode", joinByInviteCode);

router.post("/:conversationId/favorite", toggleFavoriteConversation);
router.post("/:conversationId/archive", toggleArchiveConversation);
router.post("/:conversationId/mute", toggleMuteConversation);
router.patch("/:conversationId/theme-nickname", updateThemeOrNickname);
router.delete("/:conversationId/messages", clearConversationMessages);
router.delete("/:conversationId", deleteConversation);
router.patch("/:conversationId/unread", markAsUnread);
router.get("/:conversationId/messages", getMessages);
router.patch("/:conversationId/seen", markAsSeen);

// Group Info Update Routes (Supports PUT /api/groups/:groupId & PUT /api/conversations/:id/group)
router.put("/:conversationId/group", checkGroupRole("member"), updateGroupInfo);
router.patch("/:conversationId/group", checkGroupRole("member"), updateGroupInfo);
router.put("/:conversationId/members/:memberId/nickname", checkGroupRole("member"), updateMemberNickname);
router.patch("/:conversationId/members/:memberId/nickname", checkGroupRole("member"), updateMemberNickname);
router.put("/:conversationId", checkGroupRole("member"), updateGroupInfo);

// Group Administration & RBAC Routes
router.post("/:conversationId/members", checkGroupRole("moderator"), addMembers);
router.delete("/:conversationId/members/:memberId", removeMember);
router.post("/:conversationId/kick", checkGroupRole("moderator"), kickMember);
router.post("/:conversationId/ban", checkGroupRole("admin"), banMember);
router.put("/:conversationId/roles", checkGroupOwner, updateAdminRole);
router.post("/:conversationId/moderators", checkGroupRole("admin"), updateModeratorRole);
router.post("/:conversationId/invite-code", checkGroupRole("moderator"), generateInviteCode);
router.patch("/:conversationId/settings", checkGroupAdmin, updateGroupSettings);

// Polls Routes
router.post("/:conversationId/polls", checkGroupRole("member"), createPoll);
router.post("/:conversationId/polls/:pollId/vote", checkGroupRole("member"), votePoll);

export default router;
