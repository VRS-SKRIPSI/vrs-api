import { Schema } from "mongoose";
import chatTranscripts, { iChatTranscript } from "../models/chatTranscripts";
import listChatTranscripts, { iListChatTranscript } from "../models/listChatTranscripts";

interface iSender {
  _sender: {
    _id: Schema.Types.ObjectId;
    sent: boolean;
  };
  _receiver: {
    _id: Schema.Types.ObjectId;
    read: boolean;
  };
}

export interface iPayloadMessage extends iSender {
  _listChatId: Schema.Types.ObjectId;
  body: {
    fromLang: string;
    fromChat: string;
    targetLang: string;
    targetChat: string;
  };
}

export interface iSendChatResponse {
  credential: iListChatTranscript;
  payload: iChatTranscript;
}

interface iChatRepository {
  findListChat<T>(payload: T): Promise<iListChatTranscript | null>;
  sendMessage(payloadMessage: iPayloadMessage): Promise<iSendChatResponse | null>;
  createRoom(payloadSender: iSender): Promise<iListChatTranscript | null>;
  findCurrentChat(_listChatId: any, _limit: number, skip: number): Promise<any>;
  getListChat(_userId: Schema.Types.ObjectId): Promise<iListChatTranscript[]>;
}

class chatRepository implements iChatRepository {
  private lsitChatSchema = listChatTranscripts;
  private chatSchema = chatTranscripts;

  private async saveChat(payload: iPayloadMessage, _listMessageId: Schema.Types.ObjectId): Promise<iChatTranscript> {
    const saveChat = await this.chatSchema.create({
      _listChatTranscriptId: _listMessageId,
      _sender: { _userId: payload._sender._id, sent: true },
      _receiver: { _userId: payload._receiver._id, read: false },
      body: {
        fromLang: payload.body.fromLang,
        fromChat: payload.body.fromChat,
        targetLang: payload.body.targetLang,
        targetChat: payload.body.targetChat,
      },
    });

    return saveChat;
  }

  public async findListChat<T>(payload: T): Promise<iListChatTranscript | null> {
    return await this.lsitChatSchema.findOne(payload).exec();
  }

  public async createRoom(payloadSender: iSender): Promise<iListChatTranscript | null> {
    const checkHistoryMessage = await this.findListChat<{ _userId: { $all: any[] } }>({
      _userId: { $all: [payloadSender._sender._id, payloadSender._receiver._id] },
    });
    if (checkHistoryMessage === null) {
      return await this.lsitChatSchema.create({
        _userId: [payloadSender._receiver._id, payloadSender._sender._id],
      });
    }

    return checkHistoryMessage;
  }

  public async sendMessage(payloadMessage: iPayloadMessage): Promise<iSendChatResponse | null> {
    const listChat = await this.lsitChatSchema.findOneAndUpdate(
      { _id: payloadMessage._listChatId },
      { currentChat: payloadMessage.body.fromChat },
      { new: true }
    );
    console.log("list chat _id", listChat?._id);

    if (listChat !== null) {
      const createChat = await this.saveChat(payloadMessage, listChat._id);
      const data: iSendChatResponse = {
        credential: listChat,
        payload: createChat,
      };
      return data;
    }
    return listChat;
  }

  public async findCurrentChat(_listChatId: any, _limit: number, skip: number): Promise<any> {
    return await this.chatSchema
      .find({ _listChatTranscriptId: _listChatId })
      .populate({ path: "_receiver._userId", select: "username" })
      .populate({ path: "_sender._userId", select: "username" })
      .skip(skip >= 1 ? skip : 0)
      .limit(_limit)
      .sort({ createdAt: 1 });
  }

  async getListChat(_userId: Schema.Types.ObjectId): Promise<iListChatTranscript[]> {
    return await this.lsitChatSchema
      .find({ _userId: { $all: [_userId] } })
      .populate({ path: "_userId", select: "_id username fullName photoProfile" })
      .exec();
  }
}

export default new chatRepository();
