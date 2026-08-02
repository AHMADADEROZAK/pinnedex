import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IpRateLimitDocument extends Document {
  ip: string;
  timestamps: Date[];
}

export interface BannedIpDocument extends Document {
  ip: string;
  reason: string;
  createdAt: Date;
}

const ipRateLimitSchema = new Schema<IpRateLimitDocument>(
  {
    ip: { type: String, required: true, unique: true, index: true },
    timestamps: { type: [Date], default: [] },
  },
  { timestamps: true },
);

const bannedIpSchema = new Schema<BannedIpDocument>(
  {
    ip: { type: String, required: true, unique: true, index: true },
    reason: { type: String, default: "Rate limit exceeded" },
  },
  { timestamps: true },
);

export const IpRateLimit: Model<IpRateLimitDocument> =
  (mongoose.models.IpRateLimit as Model<IpRateLimitDocument> | undefined) ??
  mongoose.model<IpRateLimitDocument>("IpRateLimit", ipRateLimitSchema);

export const BannedIp: Model<BannedIpDocument> =
  (mongoose.models.BannedIp as Model<BannedIpDocument> | undefined) ??
  mongoose.model<BannedIpDocument>("BannedIp", bannedIpSchema);
