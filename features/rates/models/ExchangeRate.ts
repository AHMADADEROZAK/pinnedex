import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ExchangeRateDocument extends Document {
  code: string;
  idrPerUsd: number;
  base: string;
  updatedAt: Date;
  fetchedAt: Date;
}

const exchangeRateSchema = new Schema<ExchangeRateDocument>(
  {
    code: { type: String, required: true, unique: true },
    idrPerUsd: { type: Number, required: true },
    base: { type: String, required: true, default: "USD" },
    updatedAt: { type: Date, required: true },
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const ExchangeRate: Model<ExchangeRateDocument> =
  (mongoose.models.ExchangeRate as Model<ExchangeRateDocument> | undefined) ??
  mongoose.model<ExchangeRateDocument>("ExchangeRate", exchangeRateSchema);
