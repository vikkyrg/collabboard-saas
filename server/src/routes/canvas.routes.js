import express from "express";
import {
  getCanvasOps,
  addCanvasOp,
  saveSnapshot,
  getLatestSnapshot,
} from "../controllers/canvas.controller.js";
import protect from "../middleware/auth.middleware.js";
import { requireRoomMember } from "../middleware/roomAccess.middleware.js";

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get("/:room_id", requireRoomMember, getCanvasOps);
router.post("/:room_id/op", requireRoomMember, addCanvasOp);
router.post("/:room_id/snapshot", requireRoomMember, saveSnapshot);
router.get("/:room_id/snapshot", requireRoomMember, getLatestSnapshot);

export default router;
