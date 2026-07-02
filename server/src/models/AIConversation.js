import mongoose from "mongoose";

const aiConversationSchema = new mongoose.Schema(
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
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true }
);

aiConversationSchema.index({ roomId: 1, createdAt: -1 });

export default mongoose.model("AIConversation", aiConversationSchema);
