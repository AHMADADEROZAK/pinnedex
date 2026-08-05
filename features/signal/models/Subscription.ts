import mongoose, { type Document, type Model, type Types } from "mongoose";

export type SubscriptionPlan = "weekly" | "monthly";
export type SubscriptionStatus = "active" | "expired" | "refunded";
export type TelegramStatus = "pending" | "connected";

export interface SubscriptionDocument extends Document {
  userId: Types.ObjectId;
  walletAddress: string;
  plan: SubscriptionPlan;
  amountLamports: number;
  txSignature: string;
  status: SubscriptionStatus;
  startedAt: Date;
  expiresAt: Date;
  telegramChatId?: string;
  telegramPhone?: string;
  telegramLinkCode?: string;
  telegramLinkExpiresAt?: Date;
  telegramStatus?: TelegramStatus;
  createdAt: Date;
}

const SubscriptionSchema = new mongoose.Schema<SubscriptionDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    walletAddress: { type: String, required: true, index: true },
    plan: { type: String, enum: ["weekly", "monthly"], required: true },
    amountLamports: { type: Number, required: true },
    txSignature: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["active", "expired", "refunded"],
      default: "active",
    },
    startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  telegramChatId: { type: String, sparse: true },
  telegramPhone: { type: String, sparse: true },
  telegramLinkCode: { type: String, sparse: true, index: true },
  telegramLinkExpiresAt: { type: Date },
  telegramStatus: { type: String, enum: ["pending", "connected"] },
},
{ timestamps: true },
);

SubscriptionSchema.index({ userId: 1, status: 1, expiresAt: -1 });

export const Subscription: Model<SubscriptionDocument> =
  (mongoose.models.Subscription as Model<SubscriptionDocument> | undefined) ??
  mongoose.model<SubscriptionDocument>("Subscription", SubscriptionSchema);