import mongoose, { type Document, type Model } from "mongoose"

export interface EmojiDocument extends Document {
  character: string
  group: string
  subGroup: string
  unicodeName: string
  slug: string
}

const EmojiSchema = new mongoose.Schema<EmojiDocument>(
  {
    character: { type: String, required: true },
    group: { type: String, required: true, index: true },
    subGroup: { type: String, required: true },
    unicodeName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: false },
)

EmojiSchema.index({ group: 1, subGroup: 1 })

export const Emoji: Model<EmojiDocument> =
  (mongoose.models.Emoji as Model<EmojiDocument> | undefined) ??
  mongoose.model<EmojiDocument>("Emoji", EmojiSchema)
