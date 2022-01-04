import { Document, model, Schema } from "mongoose";

export interface iListChatTranscript extends Document {
  _userId: Array<Schema.Types.ObjectId>;
  currentChat?: String;
}

const listChatTranscriptSchema = new Schema<iListChatTranscript>(
  {
    _userId: [{ type: Schema.Types.ObjectId, ref: "users" }],
    currentChat: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

export default model<iListChatTranscript>("ListChatTranscripts", listChatTranscriptSchema);
