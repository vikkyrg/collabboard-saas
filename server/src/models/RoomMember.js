import mongoose from "mongoose";

const roomMemberSchema = new mongoose.Schema(
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

    role: {
      type: String,
      enum: ["host", "member"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

roomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });

export default mongoose.model("RoomMember", roomMemberSchema);
