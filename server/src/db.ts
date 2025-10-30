import mongoose from "mongoose";
import { env } from "./config/env.js";

export async function connectToDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(env.mongoUri);
}


