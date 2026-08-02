import mongoose, { Schema, type Document, type Model } from "mongoose";

export type UserRole = "user" | "admin";

export interface UserWallet {
  address: string;
  linkedAt: Date;
}

export interface UserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  wallets: UserWallet[];
  createdAt: Date;
}

const userWalletSchema = new Schema<UserWallet>(
  {
    address: { type: String, required: true },
    linkedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    wallets: { type: [userWalletSchema], default: [] },
  },
  { timestamps: true },
);

export const User: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument> | undefined) ??
  mongoose.model<UserDocument>("User", userSchema);
