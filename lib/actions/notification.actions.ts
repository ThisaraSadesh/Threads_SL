import Notification from "../models/notification.model";
import User from "../models/user.model";
export const fetchUserNotifications = async (userId: string) => {
  console.log("USERID GOT FOR NOTIFICATIONS", userId);
  const notifications = await Notification.find({ userId: userId })
    .populate({ path: "actorId",model:User })
    .lean();
  if (!notifications) {
    console.error("No notifications found for this user");
  }
  return notifications;
};
