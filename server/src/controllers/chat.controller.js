import ChatMessage from "../models/ChatMessage.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getChatMessages = asyncHandler(async (req, res) => {
  const { room_id } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const before = req.query.before;

  const filter = { roomId: room_id };
  if (before) {
    filter.createdAt = { $lt: new Date(before) };
  }

  const messages = await ChatMessage.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "name")
    .lean();

  res.json({
    success: true,
    messages: messages.reverse().map((m) => ({
      messageId: m._id,
      userId: m.userId._id,
      userName: m.userId.name,
      text: m.text,
      createdAt: m.createdAt,
    })),
  });
});

export const postChatMessage = asyncHandler(async (req, res) => {
  const { room_id } = req.params;
  const { text } = req.body;

  if (!text?.trim()) {
    throw new ApiError(400, "Message text is required");
  }

  const message = await ChatMessage.create({
    roomId: room_id,
    userId: req.user.id,
    text: text.trim(),
  });

  const populated = await ChatMessage.findById(message._id)
    .populate("userId", "name")
    .lean();

  res.status(201).json({
    success: true,
    message: {
      messageId: populated._id,
      userId: populated.userId._id,
      userName: populated.userId.name,
      text: populated.text,
      createdAt: populated.createdAt,
    },
  });
});
