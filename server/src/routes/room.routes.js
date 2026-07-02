import express from "express";
import {
  createRoom,
  getMyRooms,
  joinRoom,
  getRoomById,
  removeMember,
  deleteRoom,
} from "../controllers/room.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create", protect, createRoom);
router.get("/list", protect, getMyRooms);
router.get("/my-rooms", protect, getMyRooms);
router.post("/:id/join", protect, joinRoom);
router.get("/:id", protect, getRoomById);
router.delete("/:id", protect, deleteRoom);
router.delete("/:id/members/:userId", protect, removeMember);

export default router;
