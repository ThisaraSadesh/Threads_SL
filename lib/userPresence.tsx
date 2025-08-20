import { usePresence } from "ably/react";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import type { Types } from "ably";

export interface PresenceUser {
  clientId: string;
  userId: string;
  username: string;
  imageUrl?: string;
  isOnline: boolean;
}

export function useUserPresence(channelName: string) {
  const { user } = useUser();
  const [isReady, setIsReady] = useState(false);
  
  // Add a small delay to ensure Ably client is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Only use presence when ready
  let presenceMembers: Types.PresenceMessage[] = [];
  let updateStatus: any = () => {};
  
  try {
    if (isReady) {
      const presenceResult = usePresence(channelName);
      presenceMembers = presenceResult.presenceMembers;
      updateStatus = presenceResult.updateStatus;
    }
  } catch (error) {
    console.error("Error initializing presence:", error);
  }

  // Enter presence when component mounts and user is available
  useEffect(() => {
    if (user && isReady && updateStatus) {
      updateStatus({
        userId: user.id,
        username: user.username || user.firstName || "Anonymous",
        imageUrl: user.imageUrl,
        isOnline: true,
      });
    }

    // Leave presence when component unmounts
    return () => {
      if (user && isReady && updateStatus) {
        updateStatus({
          userId: user.id,
          username: user.username || user.firstName || "Anonymous",
          imageUrl: user.imageUrl,
          isOnline: false,
        });
      }
    };
  }, [user, isReady, updateStatus]);

  // Transform presence data to include online status
  const onlineUsers: PresenceUser[] = presenceMembers.map((presence: Types.PresenceMessage) => ({
    clientId: presence.clientId || "",
    userId: presence.data?.userId || "",
    username: presence.data?.username || "Anonymous",
    imageUrl: presence.data?.imageUrl,
    isOnline: presence.data?.isOnline || true,
  }));

  return {
    onlineUsers,
    currentUser: user,
    updatePresence: updateStatus,
    isReady,
  };
}