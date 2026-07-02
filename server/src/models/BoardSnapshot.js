import mongoose from "mongoose";

const boardSnapshotSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dataJson: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

boardSnapshotSchema.index({ roomId: 1, createdAt: -1 });

export default mongoose.model("BoardSnapshot", boardSnapshotSchema);
