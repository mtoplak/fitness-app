import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface NotificationDocument extends Document {
  userId: Types.ObjectId; // recipient user
  groupClassId?: Types.ObjectId; // related class
  startDateTime?: Date; // specific occurrence if applicable
  message: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    groupClassId: { type: Schema.Types.ObjectId, ref: "GroupClass" },
    startDateTime: { type: Date },
    message: { type: String, required: true },
    readAt: { type: Date }
  },
  { timestamps: true }
);

export const Notification: Model<NotificationDocument> =
  mongoose.models.Notification || mongoose.model<NotificationDocument>("Notification", notificationSchema);


