import mongoose, { Schema, type InferSchemaType } from "mongoose";

const tokenMarketSnapshotSchema = new Schema(
  {
    tokenAddress: { type: String, required: true, index: true },
    priceUsd: { type: Number, required: true },
    volume24h: { type: Number, default: 0 },
    marketCap: { type: Number, default: null },
    fdv: { type: Number, default: null },
    liquidityUsd: { type: Number, default: null },
    priceChange24h: { type: Number, default: null },
    txnsBuys24h: { type: Number, default: 0 },
    txnsSells24h: { type: Number, default: 0 },
    pairAddress: { type: String, default: "" },
    dexId: { type: String, default: "" },
    fetchedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

tokenMarketSnapshotSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 604_800 });

export type TokenMarketSnapshotDoc = InferSchemaType<typeof tokenMarketSnapshotSchema>;

export const TokenMarketSnapshot =
  mongoose.models.TokenMarketSnapshot ??
  mongoose.model("TokenMarketSnapshot", tokenMarketSnapshotSchema);
