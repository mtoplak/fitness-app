import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type TrainerType = "personal" | "group" | "both";

export interface TrainerProfileDocument extends Document {
  userId: Types.ObjectId; // references User with role "trainer"
  trainerType: TrainerType;
  hourlyRate: number; // price per hour in major currency units
  groupClassesLed: Types.ObjectId[]; // refs to GroupClass
  createdAt: Date;
  updatedAt: Date;
}

const trainerProfileSchema = new Schema<TrainerProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true, unique: true },
    trainerType: { type: String, enum: ["personal", "group", "both"], required: true },
    hourlyRate: { type: Number, required: true, min: 0 },
    groupClassesLed: [{ type: Schema.Types.ObjectId, ref: "GroupClass" }]
  },
  { timestamps: true }
);

export const TrainerProfile: Model<TrainerProfileDocument> =
  mongoose.models.TrainerProfile || mongoose.model<TrainerProfileDocument>("TrainerProfile", trainerProfileSchema);


