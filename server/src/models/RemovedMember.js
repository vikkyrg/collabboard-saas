import mongoose from "mongoose";

const removedMemberSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One removal record per user per room
removedMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });

export default mongoose.model("RemovedMember", removedMemberSchema);
