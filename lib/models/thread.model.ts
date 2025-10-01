// models/thread.model.ts
import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
  text: {
    title: { type: String, required: true },
    images: [{ type: String }],
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true, 
  },
  community: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Community",
    index: true,
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true, 
  },

  parentId: { 
    type: String,
    index: true, 
  },
  children: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Thread" 
  }],

  upvotes: [{ type: String }], 

  isShared: { 
    type: Boolean, 
    default: false,
    index: true, 
  },

  originalPost: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Thread",
    index: true, 
  },

  sharedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],

  originalCommunity: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Community",
    index: true, 
  },

  focusMode:{
    type:Boolean,
    required:true,
    default:false
  },
    expiresAt: { type: Date }, 
  replyCount: { type: Number, default: 0 },


});


threadSchema.index({ author: 1, createdAt: -1 });

threadSchema.index({ community: 1, createdAt: -1 });

threadSchema.index({ parentId: 1, createdAt: -1 });

threadSchema.index({ originalCommunity: 1, createdAt: -1, isShared: 1 });
threadSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


const Thread = mongoose.models.Thread || mongoose.model("Thread", threadSchema);
export default Thread;