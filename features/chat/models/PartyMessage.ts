import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface PartyMessageDocument extends Document {
  id: string;
  memberId: string;
  name: string;
  text: string;
  createdAt: Date;
}

const partyMessageSchema = new Schema<PartyMessageDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    memberId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: false, collection: "chat_messages" },
);

export const PartyMessage: Model<PartyMessageDocument> =
  (mongoose.models.PartyMessage as Model<PartyMessageDocument> | undefined) ??
  mongoose.model<PartyMessageDocument>("PartyMessage", partyMessageSchema);