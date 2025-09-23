
import { Schema, model, models } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", 
      required: true,
        index:true
    },

    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["mention", "upvote", "follow", "repost", "comment"],
      required: true,
      index: true, 
    },

    
    entityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },

    excerpt: {
      type: String,
      maxlength: 200,
    },

 
    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, 

  }
);


notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = models.Notification || model("Notification", notificationSchema);

export default Notification;