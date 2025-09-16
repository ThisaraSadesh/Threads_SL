import mongoose from "mongoose";
import { boolean } from "zod";

const threadSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  community: { type: mongoose.Schema.Types.ObjectId, ref: "Community" },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  parentId: {
    type: String,
  },
  children: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
    },
  ],
  upvotes: [
    {
      type: String,
    },
  ],
  isShared: { type: Boolean, default: false },

  sharedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  originalCommunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
  },
});

const Thread = mongoose.models.Thread || mongoose.model("Thread", threadSchema);
export default Thread;
