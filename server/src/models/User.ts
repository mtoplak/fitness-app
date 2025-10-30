import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "admin" | "trainer" | "member";

export interface UserDocument extends Document {
  email: string;
  passwordHash: string;
  fullName: string; // kept for backward compatibility and UI greeting
  firstName?: string;
  lastName?: string;
  address?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    address: { type: String },
    role: { type: String, enum: ["admin", "trainer", "member"], default: "member", required: true }
  },
  { timestamps: true }
);

export const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);


