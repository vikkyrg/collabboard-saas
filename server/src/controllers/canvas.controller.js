import BoardOp from "../models/BoardOp.js";
import BoardSnapshot from "../models/BoardSnapshot.js";
import Room from "../models/Room.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const VALID_OP_TYPES = ["line", "shape", "text", "freehand", "delete", "move"];

export const getCanvasOps = asyncHandler(async (req, res) => {
  const { room_id } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 500, 1000);
  const afterSeq = parseInt(req.query.afterSeq, 10) || 0;

  const ops = await BoardOp.find({
    roomId: room_id,
    seq: { $gt: afterSeq },
  })
    .sort({ seq: 1 })
    .limit(limit)
    .lean();

  res.json({ success: true, ops });
});

export const addCanvasOp = asyncHandler(async (req, res) => {
  const { room_id } = req.params;
  const { opType, payload } = req.body;

  if (!VALID_OP_TYPES.includes(opType)) {
    throw new ApiError(400, `Invalid opType. Must be one of: ${VALID_OP_TYPES.join(", ")}`);
  }

  if (!payload || typeof payload !== "object") {
    throw new ApiError(400, "Payload is required");
  }

  const room = await Room.findByIdAndUpdate(
    room_id,
    { $inc: { opCounter: 1 } },
    { new: true, projection: { opCounter: 1 } }
  );

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  const op = await BoardOp.create({
    roomId: room_id,
    userId: req.user.id,
    opType,
    payload,
    seq: room.opCounter,
  });

  res.status(201).json({
    success: true,
    op: {
      _id: op._id,
      opType: op.opType,
      payload: op.payload,
      seq: op.seq,
      userId: op.userId,
    },
  });
});

export const saveSnapshot = asyncHandler(async (req, res) => {
  const { room_id } = req.params;
  const { dataJson } = req.body;

  if (!dataJson || typeof dataJson !== "object") {
    throw new ApiError(400, "dataJson is required");
  }

  const snapshot = await BoardSnapshot.create({
    roomId: room_id,
    userId: req.user.id,
    dataJson,
  });

  await BoardSnapshot.deleteMany({
    roomId: room_id,
    _id: { $ne: snapshot._id }
  });

  if (dataJson.latestSeq !== undefined) {
    await BoardOp.deleteMany({
      roomId: room_id,
      seq: { $lte: dataJson.latestSeq }
    });
  } else {
    await BoardOp.deleteMany({
      roomId: room_id,
      createdAt: { $lte: snapshot.createdAt }
    });
  }

  res.status(201).json({
    success: true,
    snapshotId: snapshot._id,
    createdAt: snapshot.createdAt,
  });
});

export const getLatestSnapshot = asyncHandler(async (req, res) => {
  const { room_id } = req.params;

  const snapshot = await BoardSnapshot.findOne({ roomId: room_id })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    snapshot: snapshot
      ? { snapshotId: snapshot._id, dataJson: snapshot.dataJson, createdAt: snapshot.createdAt }
      : null,
  });
});
