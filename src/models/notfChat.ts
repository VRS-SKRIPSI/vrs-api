import { Document, model, Schema } from "mongoose";

export interface iNotifChat extends Document {
  _listChatTranscriptId: Schema.Types.ObjectId;
  _userId: Schema.Types.ObjectId;
}

const notifChatSchema = new Schema<iNotifChat>(
  {
    _listChatTranscriptId: { type: Schema.Types.ObjectId, required: true },
    _userId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true, versionKey: false }
);

export default model<iNotifChat>("notifChat", notifChatSchema);
