import mongoose from "mongoose";
import { env } from "./config/env.js";

export async function connectToDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  await mongoose.connect(env.mongoUri);
}

