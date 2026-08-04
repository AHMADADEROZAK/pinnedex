import mongoose, { type Document, type Model, type Types } from "mongoose"

export interface PostDocument extends Document {
  content: string
  images: string[]
  userId: Types.ObjectId
  txSignature: string
  solLamports: number
  likes: Types.ObjectId[]
  createdAt: Date
}

const PostSchema = new mongoose.Schema<PostDocument>(
  {
    content: { type: String, required: true },
    images: [{ type: String }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    txSignature: { type: String, unique: true, sparse: true },
    solLamports: { type: Number, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
)

PostSchema.index({ createdAt: -1 })

export const Post: Model<PostDocument> =
  (mongoose.models.Post as Model<PostDocument> | undefined) ??
  mongoose.model<PostDocument>("Post", PostSchema)
