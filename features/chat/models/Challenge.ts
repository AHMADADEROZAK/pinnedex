import mongoose, { Schema, type Document, type Model } from "mongoose";

export type ChallengeStatus = "pending" | "awaiting_otp" | "verified";

export interface ChallengeDocument extends Document {
  uuid: string;
  username: string;
  name?: string;
  phone?: string;
  chatId?: string;
  status: ChallengeStatus;
  otp?: string;
  otpExpiresAt?: Date;
  room?: "party";
  createdAt: Date;
}

const challengeSchema = new Schema<ChallengeDocument>(
  {
    uuid: { type: String, required: true, unique: true, index: true },
    username: { type: String, default: "" },
    name: { type: String },
    phone: { type: String },
    chatId: { type: String },
    status: {
      type: String,
      enum: ["pending", "awaiting_otp", "verified"],
      default: "pending",
      index: true,
    },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    room: { type: String, enum: ["party"] },
  },
  { timestamps: true, collection: "challenges" },
);

export const Challenge: Model<ChallengeDocument> =
  (mongoose.models.Challenge as Model<ChallengeDocument> | undefined) ??
  mongoose.model<ChallengeDocument>("Challenge", challengeSchema);