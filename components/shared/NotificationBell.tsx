"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import NotificationContainer from "./NotificationContainer";
import { markAsRead } from "@/lib/actions/notification.actions";
import { useEffect, useState } from "react";
import { useAbly } from "@/app/providers/AblyClientProvider";
import { useUser } from "@clerk/nextjs";
import { fetchUserNotifications } from "@/lib/actions/notification.actions"; // 👈 ADD THIS

export function NotificationBell({
  initialNotifications,
}: {
  initialNotifications: any[];
}) {
  const ably = useAbly();
  const { user } = useUser();

  // ✅ Track notifications in state (not just prop)
  const [notifications, setNotifications] = useState(
    initialNotifications || []
  );

  // ✅ Track unread count
  const [unreadCount, setUnreadCount] = useState(
    initialNotifications?.filter((n: any) => !n.read).length || 0
  );

  // ✅ Listen for NEW notifications via Ably
  useEffect(() => {
    if (!user?.id) return;

    const channel = ably.channels.get(`user-${user.id}`);

    const handleNewNotification = async (message: any) => {
      setUnreadCount((prev) => prev + 1);

      // ✅ Just show loading state or temporary item
      const tempId = "temp-" + Date.now();
      const tempNotification = {
        _id: tempId,
        actorId: {
          name: "Loading...",
          image: "/default-avatar.png", // placeholder
        },
        type: "loading",
        entityId: "",
        excerpt: "Loading notification...",
        read: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => [tempNotification, ...prev]);

      // ✅ FETCH REAL NOTIFICATION FROM DB
      try {
        if (user?.id) {
          const freshNotifications = await fetchUserNotifications(user.id);
          setNotifications(freshNotifications);
          setUnreadCount(freshNotifications.filter((n: any) => !n.read).length);
        }
      } catch (error) {
        console.error("Failed to refresh notifications:", error);
        // Remove temp notification if fetch fails
        setNotifications((prev) => prev.filter((n) => n._id !== tempId));
        setUnreadCount((prev) => prev - 1);
      }
    };

    channel.subscribe("new-notification", handleNewNotification);

    return () => {
      channel.unsubscribe("new-notification", handleNewNotification);
    };
  }, [ably, user?.id]);

  // ✅ Handle mark as read
  const handleClickNotification = async (id: string, read: boolean) => {
    if (!read) {
      const result = await markAsRead(id);
      if (result?.success) {
        // ✅ Update local state optimistically
        setUnreadCount((prev) => prev - 1);
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
      }
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="rounded-full relative">
          <div className="flex items-center text-subtle-medium">
            <img
              src={"/assets/notif.svg"}
              width={15}
              height={15}
              alt="bellImg"
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-black">
        <NotificationContainer
          notifications={notifications} // ← Now uses local state!
          handleClickNotification={handleClickNotification}
        />
      </PopoverContent>
    </Popover>
  );
}
