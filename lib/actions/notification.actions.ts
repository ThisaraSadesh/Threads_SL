import Notification from "../models/notification.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

export const fetchUserNotifications = async (userId: string) => {
  try {
    connectToDB();

    console.log("USERID GOT FOR NOTIFICATIONS", userId);

    const notifications = await Notification.find({ userId })
      .populate({
        path: "actorId",
        model: "User",
        select: "name username image", // ← Only get what you need
      })
      .lean(); // ← Returns plain JS objects

    // ✅ EXTRA SAFE: Serialize to remove any hidden props
    return JSON.parse(JSON.stringify(notifications));
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
};
export const markAsRead = async (notificationId: string) => {
  try {
    const result = await Notification.updateOne(
      { _id: notificationId },
      { $set: { read: true } }
    );

    if (result.modifiedCount === 0) {
      console.log("No notification found or already read");
    }
  } catch (error) {
    console.error(error);
  }
};
