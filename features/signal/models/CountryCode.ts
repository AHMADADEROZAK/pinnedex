import mongoose, { type Document, type Model } from "mongoose";

export interface CountryCodeDocument extends Document {
  name: string;
  dialCode: string;
  code: string;
}

const CountryCodeSchema = new mongoose.Schema<CountryCodeDocument>(
  {
    name: { type: String, required: true },
    dialCode: { type: String, required: true },
    code: { type: String, required: true, unique: true },
  },
  { timestamps: false },
);

export const CountryCode: Model<CountryCodeDocument> =
  (mongoose.models.CountryCode as Model<CountryCodeDocument> | undefined) ??
  mongoose.model<CountryCodeDocument>("CountryCode", CountryCodeSchema);
