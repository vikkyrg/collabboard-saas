import express from "express";
import { createCall } from "../controllers/call.controller.js";
import protect from "../middleware/auth.middleware.js";
import { requireRoomMember } from "../middleware/roomAccess.middleware.js";

const router = express.Router();

router.post("/create", protect, createCall);

export default router;
