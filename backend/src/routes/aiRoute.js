import express from "express";
import {
  handleAIChat,
  handleAITranslate,
  handleAISummarize,
  handleAIModerate,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", handleAIChat);
router.post("/translate", handleAITranslate);
router.post("/summarize", handleAISummarize);
router.post("/moderate", handleAIModerate);

export default router;
