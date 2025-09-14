import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useContext } from "react";
import * as Ably from "ably";
import { AblyContext } from "@/app/providers/AblyClientProvider";

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
  const [presenceMembers, setPresenceMembers] = useState<
    Ably.PresenceMessage[]
  >([]);
  const ablyClient = useContext(AblyContext);
  const [channel, setChannel] = useState<Ably.RealtimeChannel | null>(null);

  // Initialize channel and set up presence
  useEffect(() => {
    if (!ablyClient || !user) {
      console.log("Ably client or user not available:", {
        ablyClient: !!ablyClient,
        user: !!user,
      });
      return;
    }

    console.log("Setting up Ably channel:", channelName);
    const ch = ablyClient.channels.get(channelName);
    setChannel(ch);

    // Listen for presence changes
    const handlePresenceUpdate = () => {
      ch.presence
        .get()
        .then((members) => {
          console.log("Presence members updated:", members.length);
          setPresenceMembers(members || []);
        })
        .catch((err) => {
          console.error("Error getting presence:", err);
        });
    };

    ch.presence.subscribe("enter", handlePresenceUpdate);
    ch.presence.subscribe("leave", handlePresenceUpdate);
    ch.presence.subscribe("update", handlePresenceUpdate);

    // Get initial presence
    handlePresenceUpdate();

    return () => {
      ch.presence.unsubscribe();
    };
  }, [ablyClient, channelName, user]);

  // Set ready state when Ably client is available
  useEffect(() => {
    if (ablyClient && user) {
      console.log("Setting isReady to true");
      setIsReady(true);
    }
  }, [ablyClient, user]);

  // Enter presence when component mounts and user is available
  useEffect(() => {
    if (!user || !isReady || !channel) return;

    const presenceData = {
      userId: user.id,
      username: user.username || user.firstName || "Anonymous",
      imageUrl: user.imageUrl,
      isOnline: true,
    };

    channel.presence.enter(presenceData);

    return () => {
      channel.presence.leave({
        ...presenceData,
        isOnline: false,
      });
    };
  }, [user, isReady, channel]);

  // Function to update presence status
  const updatePresence = (data: any) => {
    if (channel) {
      channel.presence.update(data);
    }
  };

  // Transform presence data
  const onlineUsers: PresenceUser[] = (presenceMembers || []).map(
    (presence: Ably.PresenceMessage) => ({
      clientId: presence.clientId || "",
      userId: presence.data?.userId || "",
      username: presence.data?.username || "Anonymous",
      imageUrl: presence.data?.imageUrl,
      isOnline: presence.data?.isOnline ?? true,
    })
  );

  return {
    onlineUsers,
    currentUser: user,
    updatePresence,
    isReady: isReady && !!ablyClient && !!user,
  };
}
