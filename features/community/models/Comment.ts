import mongoose, { type Document, type Model, type Types } from "mongoose"

export interface CommentDocument extends Document {
  content: string
  images: string[]
  postId: Types.ObjectId
  userId: Types.ObjectId
  createdAt: Date
}

const CommentSchema = new mongoose.Schema<CommentDocument>(
  {
    content: { type: String, required: true },
    images: [{ type: String }],
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
)

CommentSchema.index({ postId: 1, createdAt: -1 })

export const Comment: Model<CommentDocument> =
  (mongoose.models.Comment as Model<CommentDocument> | undefined) ??
  mongoose.model<CommentDocument>("Comment", CommentSchema)
