import mongoose from "mongoose";

const boardOpSchema = new mongoose.Schema(
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
    opType: {
      type: String,
      enum: ["line", "shape", "text", "freehand", "delete", "move"],
      required: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    seq: { type: Number, required: true },
  },
  { timestamps: true }
);

boardOpSchema.index({ roomId: 1, seq: 1 }, { unique: true });

export default mongoose.model("BoardOp", boardOpSchema);
