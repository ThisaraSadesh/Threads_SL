"use client";

import * as Ably from "ably";
import { useEffect, useState, createContext, useContext, useRef } from "react";
import { useUser } from "@clerk/nextjs";

interface AblyClientProviderProps {
  children: React.ReactNode;
}

// Create context for Ably client
const AblyContext = createContext<Ably.Realtime | null>(null);

// Export the context so it can be used by other hooks
export { AblyContext };

export const useAbly = () => {
  const client = useContext(AblyContext);
  if (!client) {
    throw new Error("useAbly must be used within AblyClientProvider");
  }
  return client;
};

export default function AblyClientProvider({
  children,
}: AblyClientProviderProps) {
  const { isLoaded, isSignedIn } = useUser();
  const [client, setClient] = useState<Ably.Realtime | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const clientCreatedRef = useRef(false);

  useEffect(() => {
    // Wait for Clerk to load and user to be signed in
    if (!isLoaded || !isSignedIn) {
      return;
    }

    // Prevent multiple clients using ref
    if (clientCreatedRef.current) return;

    clientCreatedRef.current = true;
    setIsConnecting(true);
    const prefix = process.env.z || "";
    console.log("Initializing Ably with auth URL:", `${prefix}/api/ably-token`);

    // Set a timeout to prevent infinite connecting state
    const connectionTimeout = setTimeout(() => {
      console.error("Ably connection timeout");
      setIsConnecting(false);
      setConnectionError(
        "Connection timeout. Please check your network and try again."
      );
    }, 45000); // 45 seconds timeout

    const ablyClient = new Ably.Realtime({
      authUrl: `${prefix}/api/ably-token`,
      authMethod: "POST",
      authParams: {},
      httpRequestTimeout: 20000,
      realtimeRequestTimeout: 20000,
      disconnectedRetryTimeout: 10000,
      suspendedRetryTimeout: 20000,
    });

    // Add error handling for connection issues
    ablyClient.connection.on("failed", (stateChange) => {
      console.error("Ably connection failed:", stateChange.reason);
      clearTimeout(connectionTimeout);
      setIsConnecting(false);
      setConnectionError("Connection failed. Please try refreshing the page.");
    });

    ablyClient.connection.on("disconnected", (stateChange) => {
      console.warn("Ably disconnected:", stateChange.reason);
      setIsConnecting(false);
    });

    ablyClient.connection.on("connected", () => {
      console.log("Ably connected successfully");
      clearTimeout(connectionTimeout);
      setIsConnecting(false);
      setConnectionError(null);
    });

    ablyClient.connection.on("connecting", () => {
      console.log("Ably connecting...");
      setIsConnecting(true);
      setConnectionError(null);
    });

    ablyClient.connection.on("suspended", () => {
      console.warn("Ably connection suspended");
      setIsConnecting(false);
      setConnectionError("Connection suspended. Retrying...");
    });

    setClient(ablyClient);

    // Cleanup on unmount
    return () => {
      clearTimeout(connectionTimeout);
      if (ablyClient.connection.state !== "closed") {
        ablyClient.close();
      }
    };
  }, [isLoaded, isSignedIn]); // Removed client from dependency array

  // If user is not signed in, just return children without Ably
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <div>{children}</div>;
  }

  // Show error state if connection failed
  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{connectionError}</p>
          <div className="space-x-2">
            <button
              onClick={() => {
                setConnectionError(null);
                setClient(null);
                setIsConnecting(false);
                clientCreatedRef.current = false; // Reset ref to allow retry
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry Connection
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while connecting
  if (!client || isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Connecting to real-time services...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  return <AblyContext.Provider value={client}>{children}</AblyContext.Provider>;
}
