import mongoose, { Schema, type Document, type Model, type ObjectId } from "mongoose";

export type PurchaseStatus = "pending" | "verified" | "rejected";

export interface PurchaseDocument extends Document {
  userId: ObjectId;
  walletAddress: string;
  txSignature: string;
  solLamports: number;
  tokenAllocation: number;
  status: PurchaseStatus;
  createdAt: Date;
}

const purchaseSchema = new Schema<PurchaseDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    walletAddress: { type: String, required: true, index: true },
    txSignature: { type: String, required: true, unique: true },
    solLamports: { type: Number, required: true },
    tokenAllocation: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true },
);

export const Purchase: Model<PurchaseDocument> =
  (mongoose.models.Purchase as Model<PurchaseDocument> | undefined) ??
  mongoose.model<PurchaseDocument>("Purchase", purchaseSchema);
