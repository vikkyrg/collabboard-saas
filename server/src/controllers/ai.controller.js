import User from "../models/User.js";
import RoomMember from "../models/RoomMember.js";
import AIConversation from "../models/AIConversation.js";
import Room from "../models/Room.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateAIResponse } from "../services/ai.service.js";

export const chatWithAI = asyncHandler(async (req, res) => {
  const { message, roomId, contextImage } = req.body;

  if (!message?.trim()) {
    throw new ApiError(400, "Message is required");
  }

  if (!roomId) {
    throw new ApiError(400, "roomId is required");
  }

  const membership = await RoomMember.findOne({
    roomId,
    userId: req.user.id,
  }).lean();

  if (!membership) {
    throw new ApiError(403, "You are not a member of this room");
  }

  const room = await Room.findById(roomId).lean();
  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  const answer = await generateAIResponse({
    message: message.trim(),
    roomId,
    userId: req.user.id,
    contextImage,
  });

  res.json({ success: true, answer });
});

export const getAIHistory = asyncHandler(async (req, res) => {
  const { room_id } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  const conversations = await AIConversation.find({ roomId: room_id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "name")
    .lean();

  res.json({
    success: true,
    conversations: conversations.reverse().map((c) => ({
      id: c._id,
      userId: c.userId._id,
      userName: c.userId.name,
      question: c.question,
      answer: c.answer,
      createdAt: c.createdAt,
    })),
  });
});
