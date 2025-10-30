import mongoose, { Schema, Document, Model } from "mongoose";

export interface SubscriptionDocument extends Document {
  name: string; // package name
  price: number; // in major currency units
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<SubscriptionDocument>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  { timestamps: true }
);

export const Subscription: Model<SubscriptionDocument> =
  mongoose.models.Subscription || mongoose.model<SubscriptionDocument>("Subscription", subscriptionSchema);


