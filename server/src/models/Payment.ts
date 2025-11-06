import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface PaymentDocument extends Document {
  userId: Types.ObjectId; // ref User
  membershipId: Types.ObjectId; // ref Membership
  amount: number; // znesek v EUR
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod?: string; // kreditna kartica, PayPal, itd.
  paymentDate?: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    membershipId: { type: Schema.Types.ObjectId, ref: "Membership", required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { 
      type: String, 
      enum: ["pending", "completed", "failed", "refunded"], 
      default: "pending" 
    },
    paymentMethod: { type: String },
    paymentDate: { type: Date },
    description: { type: String, required: true }
  },
  { timestamps: true }
);

export const Payment: Model<PaymentDocument> =
  mongoose.models.Payment || mongoose.model<PaymentDocument>("Payment", paymentSchema);
