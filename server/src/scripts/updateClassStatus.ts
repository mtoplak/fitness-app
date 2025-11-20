import mongoose from "mongoose";
import { GroupClass } from "../models/GroupClass.js";
import { env } from "../config/env.js";

async function updateExistingClasses() {
  try {
    if (!env.mongoUri) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(env.mongoUri);
    console.log("Connected to MongoDB");

    // Posodobi vse obstoječe vadbe brez statusa na "approved"
    const result = await GroupClass.updateMany(
      { status: { $exists: false } },
      { $set: { status: "approved" } }
    );

    console.log(`Updated ${result.modifiedCount} classes to approved status`);

    await mongoose.disconnect();
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

updateExistingClasses();
