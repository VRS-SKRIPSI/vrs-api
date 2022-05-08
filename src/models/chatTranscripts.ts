import { Schema, Document, model } from "mongoose";

export interface iChatTranscript extends Document {
  _listChatTranscriptId: Schema.Types.ObjectId;
  _sender: {
    _userId: Schema.Types.ObjectId;
    send: Boolean;
  };
  _receiver: {
    _userId: Schema.Types.ObjectId;
    read: Boolean;
  };
  body: {
    fromLang: String;
    fromChat: String;
    targetLang: String;
    targetChat: String;
  };
}

const chatTranscriptSchema = new Schema<iChatTranscript>(
  {
    _listChatTranscriptId: { type: Schema.Types.ObjectId, required: true, ref: "listChatTranscripts" },
    _sender: {
      _userId: { type: Schema.Types.ObjectId, requred: true, ref: "users" },
      send: { type: Boolean, required: true, default: true },
    },
    _receiver: {
      _userId: { type: Schema.Types.ObjectId, requred: true, ref: "users" },
      read: { type: Boolean, required: true, default: true },
    },
    body: {
      fromLang: { type: String, required: true },
      fromChat: { type: String, required: true },
      targetLang: { type: String, required: true },
      targetChat: { type: String, required: true },
    },
  },
  { timestamps: true, versionKey: false }
);

export default model<iChatTranscript>("chatTranscripts", chatTranscriptSchema);
