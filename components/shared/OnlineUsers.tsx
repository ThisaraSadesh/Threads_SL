"use client";

import { useUserPresence } from "@/lib/userPresence";
import Image from "next/image";

interface OnlineUsersProps {
  channelName: string;
}

export default function OnlineUsers({ channelName }: OnlineUsersProps) {
  const { onlineUsers, currentUser, isReady } = useUserPresence(channelName);

  // Show loading state while Ably is initializing
  if (!isReady) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Online Users</h3>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // Filter out offline users and current user
  const activeUsers = onlineUsers.filter(
    (user) => user.isOnline && user.userId !== currentUser?.id
  );

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">
        Online Users ({activeUsers.length})
      </h3>
      
      {activeUsers.length === 0 ? (
        <p className="text-gray-500 text-sm">No other users online</p>
      ) : (
        <div className="space-y-2">
          {activeUsers.map((user) => (
            <div
              key={user.clientId}
              className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50"
            >
              <div className="relative">
                <Image
                  src={user.imageUrl || "/default-avatar.png"}
                  alt={user.username}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <span className="text-sm font-medium">{user.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}