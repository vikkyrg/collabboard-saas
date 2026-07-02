import express from "express";
import {
  chatWithAI,
  getAIHistory,
} from "../controllers/ai.controller.js";
import protect from "../middleware/auth.middleware.js";
import { requireRoomMember } from "../middleware/roomAccess.middleware.js";
import { aiLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/chat", protect, aiLimiter, chatWithAI);
router.get("/history/:room_id", protect, requireRoomMember, getAIHistory);

export default router;
