import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type NotificationType = "reminder" | "info" | "alert";
export type NotificationStatus = "pending" | "sent" | "cancelled" | "failed";

export interface NotificationDocument extends Document {
  userId: Types.ObjectId; // recipient user
  bookingId?: Types.ObjectId; // related booking
  groupClassId?: Types.ObjectId; // related class
  type: NotificationType; // reminder, info, alert
  status: NotificationStatus; // pending, sent, cancelled, failed
  scheduledFor?: Date; // when to send (for reminders)
  sentAt?: Date; // when it was actually sent
  message: string;
  emailSubject?: string; // subject line for email
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", index: true },
    groupClassId: { type: Schema.Types.ObjectId, ref: "GroupClass" },
    type: { type: String, enum: ["reminder", "info", "alert"], default: "info", required: true },
    status: { type: String, enum: ["pending", "sent", "cancelled", "failed"], default: "pending", required: true, index: true },
    scheduledFor: { type: Date, index: true },
    sentAt: { type: Date },
    message: { type: String, required: true },
    emailSubject: { type: String },
    readAt: { type: Date }
  },
  { timestamps: true }
);

// Index for finding pending notifications to send
notificationSchema.index({ status: 1, scheduledFor: 1 });

export const Notification: Model<NotificationDocument> =
  mongoose.models.Notification || mongoose.model<NotificationDocument>("Notification", notificationSchema);


