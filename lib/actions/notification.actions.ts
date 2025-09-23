'use server';
import Notification from "../models/notification.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

export const fetchUserNotifications = async (clerkUserId: string) => {
  try {
    connectToDB();

    console.log("USERID GOT FOR NOTIFICATIONS", clerkUserId);

    // ✅ STEP 1: Find user by Clerk ID (string) → get MongoDB ObjectId
    const user = await User.findOne({ id: clerkUserId }).select("_id");
    
    if (!user) {
      console.log("User not found with Clerk ID:", clerkUserId);
      return [];
    }

    // ✅ STEP 2: Find notifications by user's ObjectId
    const notifications = await Notification.find({ userId: user._id })
      .populate({
        path: "actorId",
        model: "User",
        select: "name username image",
      })
      .sort({ createdAt: -1 }) // ← Sort here instead of client
      .lean();

    return JSON.parse(JSON.stringify(notifications));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};
export const markAsRead = async (notificationId: string) => {
  try {
    connectToDB();
    const result = await Notification.updateOne(
      { _id: notificationId },
      { $set: { read: true } }
    );

    if (result.modifiedCount === 0) {
      console.log("No notification found or already read");
    }
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
};
