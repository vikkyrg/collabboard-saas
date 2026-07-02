import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    inviteToken: { type: String, required: true, unique: true },
    opCounter: { type: Number, default: 0 },
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

roomSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Room", roomSchema);
