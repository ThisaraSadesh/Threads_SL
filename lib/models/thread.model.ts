import mongoose from "mongoose";


const threadSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  community: { type: mongoose.Schema.Types.ObjectId, ref: "Community" },
  createdAt: { type: Date, default: Date.now },

  // For comments/replies
  parentId: { type: String },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Thread" }],

  // Likes
  upvotes: [{ type: String }],

  // Sharing-related fields
  isShared: { type: Boolean, default: false },

  // If this post is shared, store the original post ID
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: "Thread" },

  // Store all users who shared it in order
  sharedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Original community (if post was created there)
  originalCommunity: { type: mongoose.Schema.Types.ObjectId, ref: "Community" },
});

const Thread = mongoose.models.Thread || mongoose.model("Thread", threadSchema);
export default Thread;
