import express from "express";
import { getChatMessages, postChatMessage } from "../controllers/chat.controller.js";
import protect from "../middleware/auth.middleware.js";
import { requireRoomMember } from "../middleware/roomAccess.middleware.js";

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get("/:room_id", requireRoomMember, getChatMessages);
router.post("/:room_id", requireRoomMember, postChatMessage);

export default router;
