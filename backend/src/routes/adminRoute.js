import express from "express";
import { getSystemStats, updateUserPlan } from "../controllers/adminController.js";

const router = express.Router();

router.get("/stats", getSystemStats);
router.put("/users/:userId/plan", updateUserPlan);

export default router;
