import { Document, model, Schema } from "mongoose";

export enum privasiEnum {
  private = "private",
  public = "public",
}

export interface iStreaming extends Document {
  _userId: Schema.Types.ObjectId;
  title: String;
  slug: String;
  tags: String;
  privasi: privasiEnum;
  desc?: String;
  isLive?: Boolean;
}

const streamingSchema = new Schema<iStreaming>(
  {
    _userId: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    tags: { type: String, required: true },
    privasi: { type: privasiEnum, required: true },
    desc: { type: String },
    isLive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, versionKey: false }
);

export default model<iStreaming>("streamings", streamingSchema);
