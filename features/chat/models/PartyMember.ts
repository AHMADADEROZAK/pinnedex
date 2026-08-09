import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface PartyMemberDocument extends Document {
  memberId: string;
  name: string;
  username?: string;
  createdAt: Date;
}

const partyMemberSchema = new Schema<PartyMemberDocument>(
  {
    memberId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    username: { type: String, index: true },
  },
  { timestamps: true, collection: "party_members" },
);

export const PartyMember: Model<PartyMemberDocument> =
  (mongoose.models.PartyMember as Model<PartyMemberDocument> | undefined) ??
  mongoose.model<PartyMemberDocument>("PartyMember", partyMemberSchema);