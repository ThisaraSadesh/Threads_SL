"use client";

import { useAbly } from "@/app/providers/AblyClientProvider";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs"; // ✅ CLIENT-SIDE HOOK

interface NotificationCountProps {
  filterUnreadNotifications: any[];
}

const NotificationCount = ({ filterUnreadNotifications }: NotificationCountProps) => {
  const ably = useAbly();
  const { user } = useUser(); // ✅ Get current user on client

  useEffect(() => {
    // Wait until user is loaded
    if (!user?.id) return;

    const channel = ably.channels.get(`user-${user.id}`);

    const handleNewNotification = (message: any) => {
      alert("New notification: " + message.title);
    };

    channel.subscribe("new-notification", handleNewNotification);

    return () => {
      channel.unsubscribe("new-notification", handleNewNotification);
    };
  }, [ably, user?.id]); 

  return (
    <div>
      <p>
        {filterUnreadNotifications.length > 0
          ? filterUnreadNotifications.length
          : ""}
      </p>
    </div>
  );
};

export default NotificationCount;