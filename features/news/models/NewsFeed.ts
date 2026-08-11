import mongoose, { type Document, type Model } from "mongoose";

export interface NewsEnclosure {
  url: string;
  length?: string;
  type?: string;
}

export interface NewsFeedDocument extends Document {
  guid: string;
  title: string;
  link: string;
  creator: string;
  categories: string[];
  content: string;
  contentSnippet: string;
  enclosure?: NewsEnclosure;
  pubDate: Date;
  isoDate: Date;
  seenAt: Date;
}

const EnclosureSchema = new mongoose.Schema<NewsEnclosure>(
  {
    url: { type: String, default: "" },
    length: { type: String, default: "" },
    type: { type: String, default: "" },
  },
  { _id: false },
);

const NewsFeedSchema = new mongoose.Schema<NewsFeedDocument>(
  {
    guid: { type: String, required: true, unique: true },
    title: { type: String, default: "" },
    link: { type: String, default: "" },
    creator: { type: String, default: "" },
    categories: { type: [String], default: [] },
    content: { type: String, default: "" },
    contentSnippet: { type: String, default: "" },
    enclosure: { type: EnclosureSchema },
    pubDate: { type: Date, default: null },
    isoDate: { type: Date, default: null },
    seenAt: { type: Date, default: Date.now },
  },
  { timestamps: false, collection: "newsfeed" },
);

NewsFeedSchema.index({ pubDate: -1 });
NewsFeedSchema.index({ seenAt: -1 });

export const NewsFeed: Model<NewsFeedDocument> =
  (mongoose.models.NewsFeed as Model<NewsFeedDocument> | undefined) ??
  mongoose.model<NewsFeedDocument>("NewsFeed", NewsFeedSchema);