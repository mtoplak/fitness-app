import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type BookingType = "group_class" | "personal_training";
export type BookingStatus = "confirmed" | "cancelled" | "completed";

export interface BookingDocument extends Document {
  userId: Types.ObjectId; // ref User (member)
  type: BookingType;
  status: BookingStatus;
  
  // For group class bookings
  groupClassId?: Types.ObjectId; // ref GroupClass
  classDate?: Date; // specific date of the class instance
  
  // For personal training bookings
  trainerId?: Types.ObjectId; // ref User (trainer)
  startTime?: Date;
  endTime?: Date;
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<BookingDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["group_class", "personal_training"], required: true },
    status: { type: String, enum: ["confirmed", "cancelled", "completed"], default: "confirmed", required: true },
    
    // Group class fields
    groupClassId: { type: Schema.Types.ObjectId, ref: "GroupClass" },
    classDate: { type: Date },
    
    // Personal training fields
    trainerId: { type: Schema.Types.ObjectId, ref: "User" },
    startTime: { type: Date },
    endTime: { type: Date },
    
    notes: { type: String }
  },
  { timestamps: true }
);

// Index for efficient queries
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ trainerId: 1, startTime: 1 });
bookingSchema.index({ groupClassId: 1, classDate: 1 });

export const Booking: Model<BookingDocument> =
  mongoose.models.Booking || mongoose.model<BookingDocument>("Booking", bookingSchema);
