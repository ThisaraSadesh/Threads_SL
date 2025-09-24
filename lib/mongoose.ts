// lib/mongoose.ts

import mongoose from "mongoose";

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URL;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDB() {
  // ✅ If we have a connection AND it's active (readyState === 1), reuse it
  if (cached.conn && mongoose.connection.readyState === 1) {
    console.log("✅ Reusing active DB connection. State:", mongoose.connection.readyState);
    return cached.conn;
  }

  // 🚫 If cached.conn exists but disconnected, reset it
  if (cached.conn && mongoose.connection.readyState !== 1) {
    console.warn("⚠️ Cached connection is stale or disconnected. Reconnecting...");
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    console.log("⏳ Attempting new MongoDB connection...");

    mongoose.set("strictQuery", true);

    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("🔌 MongoDB Connected Successfully. State:", mongoose.connection.readyState);
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("❌ MongoDB Connection FAILED:", err.message);
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    console.log("🟢 DB Connection Ready. State:", mongoose.connection.readyState); // Should be 1!
  } catch (e) {
    cached.promise = null;
    console.error("💥 Failed to establish connection:", e.message);
    throw e;
  }

  // ✅ Final safety check — only return if truly connected
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB connection not active after connect()");
  }

  return cached.conn;
}

export default connectToDB;