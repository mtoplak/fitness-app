import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "admin" | "trainer" | "member";

export interface UserDocument extends Document {
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ["admin", "trainer", "member"], default: "member", required: true }
  },
  { timestamps: true }
);

export const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);


