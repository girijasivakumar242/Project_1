import dotenv from "dotenv";
dotenv.config(); // ✅ Load environment variables first

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: DB_NAME, // ensures correct DB is used
    });

    console.log(`✅ MongoDB connected! DB: ${connectionInstance.connection.name}, Host: ${connectionInstance.connection.host}`);
    return connectionInstance;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
