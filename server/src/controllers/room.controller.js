import mongoose from "mongoose";
import Room from "../models/Room.js";
import RoomMember from "../models/RoomMember.js";
import crypto from "crypto";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildInviteLink } from "../utils/invite.util.js";
import ChatMessage from "../models/ChatMessage.js";
import BoardOp from "../models/BoardOp.js";
import BoardSnapshot from "../models/BoardSnapshot.js";
import AIConversation from "../models/AIConversation.js";
import RemovedMember from "../models/RemovedMember.js";
import { cleanupRoomSocketState } from "../services/socket.service.js";

export const createRoom = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Room name is required");
  }

  const existingRoom = await Room.findOne({
    ownerId: req.user.id,
    name: name.trim(),
  });

  if (existingRoom) {
    throw new ApiError(
      400,
      "You already have a room with this name"
    );
  }

  const inviteToken = crypto.randomBytes(16).toString("hex");

  const room = await Room.create({
    name: name.trim(),
    ownerId: req.user.id,
    inviteToken,
  });

  await RoomMember.create({
    roomId: room._id,
    userId: req.user.id,
    role: "host",
  });

  res.status(201).json({
    success: true,
    roomId: room._id,
    name: room.name,
    inviteToken: room.inviteToken,
    inviteLink: buildInviteLink(room._id, room.inviteToken),
  });
});

export const getMyRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ ownerId: req.user.id })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    rooms: rooms.map((room) => ({
    _id: room._id,
    name: room.name,
    ownerId: room.ownerId,
    inviteToken: room.inviteToken,
    inviteLink: buildInviteLink(room._id, room.inviteToken),
    createdAt: room.createdAt,
  })),
  });
});

export const joinRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, "Invite token is required");
  }

  const room = await Room.findById(id).lean();
  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  if (room.inviteToken !== token) {
    throw new ApiError(403, "Invalid invite token");
  }

  const isOwner = room.ownerId.toString() === req.user.id;
  const role = isOwner ? "host" : "member";

  await RoomMember.findOneAndUpdate(
    { roomId: room._id, userId: req.user.id },
    { roomId: room._id, userId: req.user.id, role },
    { upsert: true, returnDocument: "after" }
  );

  res.json({
    success: true,
    role,
    room: { _id: room._id, name: room.name },
  });
});

export const getRoomById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const room = await Room.findById(id).lean();
  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  const membership = await RoomMember.findOne({
    roomId: room._id,
    userId: req.user.id,
  }).lean();

  if (!membership) {
    throw new ApiError(403, "You are not a member of this room");
  }

  const members = await RoomMember.find({ roomId: room._id })
    .populate("userId", "name email")
    .lean();

  res.json({
    success: true,
    room: {
      _id: room._id,
      name: room.name,
      ownerId: room.ownerId,
      inviteLink: buildInviteLink(room._id, room.inviteToken),
      createdAt: room.createdAt,
    },
    members: members
      .filter((m) => m && m.userId)
      .map((m) => ({
        userId: m.userId?._id,
        name: m.userId?.name,
        email: m.userId?.email,
        role: m.role,
        joinedAt: m.createdAt,
      })),
    myRole: membership.role,
  });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;

  const membership = await RoomMember.findOne({
    roomId: id,
    userId: req.user.id,
  }).lean();

  if (!membership || membership.role !== "host") {
    throw new ApiError(403, "Only the host can remove members");
  }

  if (userId === req.user.id) {
    throw new ApiError(400, "Host cannot remove themselves");
  }

  const deleted = await RoomMember.findOneAndDelete({
    roomId: id,
    userId,
    role: "member",
  });

  if (!deleted) {
    throw new ApiError(404, "Member not found");
  }

  res.json({ success: true, message: "Member removed" });
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const room = await Room.findById(id);

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  const currentUserId = req.user.id || req.user._id;

  if (room.ownerId.toString() !== currentUserId.toString()) {
    throw new ApiError(
      403,
      "Only room owner can delete room"
    );
  }

  // Helper function for complete cascade deletion across all room-related collections
  const performCascadeDelete = async (options = {}) => {
    await Promise.all([
      RoomMember.deleteMany({ roomId: id }, options),
      ChatMessage.deleteMany({ roomId: id }, options),
      BoardOp.deleteMany({ roomId: id }, options),
      BoardSnapshot.deleteMany({ roomId: id }, options),
      AIConversation.deleteMany({ roomId: id }, options),
      RemovedMember.deleteMany({ roomId: id }, options),
      Room.findByIdAndDelete(id, options),
    ]);
  };

  let session = null;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    await performCascadeDelete({ session });
    await session.commitTransaction();
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch {
        // Ignore abort errors if transaction failed to initialize
      }
    }

    const fullErrorStr = `${err.message || ""} ${err.originalError?.message || ""} ${err.errorResponse?.errmsg || ""} ${err.errorResponse?.message || ""}`;

    // Check if error is due to standalone MongoDB instance without replica sets or retryable writes support
    const isTransactionUnsupported =
      fullErrorStr.includes("Transaction numbers are only allowed") ||
      fullErrorStr.includes("replica set") ||
      fullErrorStr.includes("retryable writes") ||
      fullErrorStr.includes("sharded cluster") ||
      err.code === 20 ||
      err.codeName === "IllegalOperation";

    if (isTransactionUnsupported || err.name === "MongoServerError") {
      // Fallback: Perform parallel cascade delete without session
      await performCascadeDelete();
    } else {
      throw err;
    }
  } finally {
    if (session) {
      session.endSession();
    }
  }

  // Real-Time Socket.IO Notification & In-Memory State Cleanup
  cleanupRoomSocketState(id);

  res.json({
    success: true,
    message: "Room deleted successfully",
  });
});