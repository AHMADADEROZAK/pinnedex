import mongoose, { type Document, type Model } from "mongoose";

export type DexEventType =
  | "token-profile"
  | "community-takeover"
  | "boost"
  | "ad";

export interface DexEventDocument extends Document {
  type: DexEventType;
  chainId: string;
  tokenAddress: string;
  payload: Record<string, unknown>;
  seenAt: Date;
}

const DexEventSchema = new mongoose.Schema<DexEventDocument>(
  {
    type: { type: String, enum: ["token-profile", "community-takeover", "boost", "ad"], required: true },
    chainId: { type: String, required: true },
    tokenAddress: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    seenAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

DexEventSchema.index({ type: 1, chainId: 1, tokenAddress: 1, seenAt: -1 });
DexEventSchema.index({ seenAt: 1 }, { expireAfterSeconds: 86_400 });

export const DexEvent: Model<DexEventDocument> =
  (mongoose.models.DexEvent as Model<DexEventDocument> | undefined) ??
  mongoose.model<DexEventDocument>("DexEvent", DexEventSchema);