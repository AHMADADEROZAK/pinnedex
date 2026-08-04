import mongoose, { Schema, type Document, type Model, type ObjectId } from "mongoose";

export interface LoginPaymentDocument extends Document {
  txSignature: string;
  userId?: ObjectId;
  createdAt: Date;
}

const loginPaymentSchema = new Schema<LoginPaymentDocument>(
  {
    txSignature: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const LoginPayment: Model<LoginPaymentDocument> =
  (mongoose.models.LoginPayment as Model<LoginPaymentDocument> | undefined) ??
  mongoose.model<LoginPaymentDocument>("LoginPayment", loginPaymentSchema);
