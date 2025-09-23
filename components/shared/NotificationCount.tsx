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

    console.log("NotificationCount - User ID:", user.id);
    console.log("NotificationCount - Subscribing to channel:", `user-${user.id}`);
    
    const channel = ably.channels.get(`user-${user.id}`);

    const handleNewNotification = (message: any) => {
      console.log("Received notification message:", message);
      console.log("Message data:", message.data);
      console.log("User channel:", `user-${user.id}`);
      
      // Try different ways to access the title
      const title = message.data?.title || message.title || "New notification";
      const excerpt = message.data?.excerpt || message.excerpt || "";
      
      alert(`${title}${excerpt ? ': ' + excerpt : ''}`);
    };

    channel.subscribe("new-notification", handleNewNotification);
    console.log("NotificationCount - Subscribed to channel:", `user-${user.id}`);

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