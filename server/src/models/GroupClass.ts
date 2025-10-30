import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface WeeklyTimeSlot {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday
  startTime: string; // "HH:mm" in 24h
  endTime: string; // "HH:mm"
}

export interface GroupClassDocument extends Document {
  name: string;
  schedule: WeeklyTimeSlot[]; // weekly recurrence pattern
  trainerUserId?: Types.ObjectId; // optional primary trainer
  capacity?: number;
  createdAt: Date;
  updatedAt: Date;
}

const timeSlotSchema = new Schema<WeeklyTimeSlot>(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },
  { _id: false }
);

const groupClassSchema = new Schema<GroupClassDocument>(
  {
    name: { type: String, required: true },
    schedule: { type: [timeSlotSchema], default: [] },
    trainerUserId: { type: Schema.Types.ObjectId, ref: "User" },
    capacity: { type: Number, min: 1 }
  },
  { timestamps: true }
);

export const GroupClass: Model<GroupClassDocument> =
  mongoose.models.GroupClass || mongoose.model<GroupClassDocument>("GroupClass", groupClassSchema);


