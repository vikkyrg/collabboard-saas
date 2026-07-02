import ApiError from "../utils/ApiError.js";
import RoomMember from "../models/RoomMember.js";

export const requireRoomMember = async (req, res, next) => {
  const roomId = req.params.room_id || req.params.roomId || req.params.id;

  if (!roomId) {
    return next(new ApiError(400, "Room ID is required"));
  }

  const membership = await RoomMember.findOne({
    roomId,
    userId: req.user.id,
  }).lean();

  if (!membership) {
    return next(new ApiError(403, "You are not a member of this room"));
  }

  req.roomId = roomId;
  req.membership = membership;
  next();
};

export const requireHost = async (req, res, next) => {
  if (req.membership?.role !== "host") {
    return next(new ApiError(403, "Host permission required"));
  }
  next();
};
