import mongoose from "mongoose";

const isConnected = false;

export const connectToDB = async () => {
  mongoose.set("strictQuery", true);

  if (!process.env.MONGODB_URL) return console.log("MONGODB_URL not found");
  if (isConnected) {
    return console.log("Already connected");
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("connected to mongoDB");
  } catch (error) {
    console.log(error);
  }
};
