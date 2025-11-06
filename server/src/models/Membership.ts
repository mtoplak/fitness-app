import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface MembershipPackageDocument extends Document {
  name: string;
  price: number; // monthly price in major currency units
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipDocument extends Document {
  userId: Types.ObjectId; // ref User
  packageId: Types.ObjectId; // ref MembershipPackage
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const membershipPackageSchema = new Schema<MembershipPackageDocument>(
  {
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

const membershipSchema = new Schema<MembershipDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    packageId: { type: Schema.Types.ObjectId, ref: "MembershipPackage", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  { timestamps: true }
);

export const MembershipPackage: Model<MembershipPackageDocument> =
  mongoose.models.MembershipPackage || mongoose.model<MembershipPackageDocument>("MembershipPackage", membershipPackageSchema);

export const Membership: Model<MembershipDocument> =
  mongoose.models.Membership || mongoose.model<MembershipDocument>("Membership", membershipSchema);



