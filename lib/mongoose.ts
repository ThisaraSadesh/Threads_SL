import mongoose from "mongoose";

let isConnected = false;

export const connectToDB = async () => {
  mongoose.set("strictQuery", true);

  if (!process.env.MONGODB_URL) return console.log("MONGODB_URL not found");
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      bufferCommands: true, // ✅ Disable mongoose buffering
      serverSelectionTimeoutMS: 5000, // ✅ Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // ✅ Close socket after 45s
      maxPoolSize: 10, // ✅ Limit connection pool
    });
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }
};
