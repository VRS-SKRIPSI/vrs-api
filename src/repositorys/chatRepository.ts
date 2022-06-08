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
  sendMessage(payloadMessage: iSendChatResponse): Promise<iSendChatResponse | null>;
  createRoom(payloadSender: iSender): Promise<iListChatTranscript | null>;
  findCurrentChat(_listChatId: any, _limit: number, skip: number): Promise<any>;
  getListChat(_userId: Schema.Types.ObjectId): Promise<iListChatTranscript[]>;
  getListChatById(_id: Schema.Types.ObjectId): Promise<iListChatTranscript | null>;
}

class chatRepository implements iChatRepository {
  private lsitChatSchema = listChatTranscripts;
  private chatSchema = chatTranscripts;

  private async saveChat(payload: iChatTranscript): Promise<iChatTranscript> {
    const saveChat = await this.chatSchema.create(payload);
    return saveChat;
  }

  public async findListChat<T>(payload: T | any): Promise<iListChatTranscript | null> {
    return await this.lsitChatSchema.findOne(payload).exec();
  }

  public async createRoom(payloadSender: iSender): Promise<iListChatTranscript | null> {
    const checkHistoryMessage = await this.lsitChatSchema
      .findOne({ _userId: { $all: [payloadSender._sender._id, payloadSender._receiver._id] } })
      .populate({ path: "_userId", select: "_id username fullName photoProfile" })
      .exec();

    if (checkHistoryMessage === null) {
      const save = await this.lsitChatSchema.create({
        _userId: [payloadSender._receiver._id, payloadSender._sender._id],
      });
      return await this.lsitChatSchema.findOne({ _id: save._id }).populate({ path: "_userId", select: "_id username fullName photoProfile" }).exec();
    }

    return checkHistoryMessage;
  }

  public async sendMessage(payloadMessage: iSendChatResponse): Promise<iSendChatResponse | null> {
    const listChat = await this.lsitChatSchema.findOneAndUpdate(
      { _id: payloadMessage.credential._id },
      { currentChat: payloadMessage.payload.body.fromChat },
      { new: true }
    );

    if (listChat !== null) {
      const createChat = await this.saveChat(payloadMessage.payload);
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
      .skip(skip >= 1 ? skip : 0)
      .limit(_limit)
      .sort({ createdAt: -1 });
  }

  async getListChat(_userId: Schema.Types.ObjectId): Promise<iListChatTranscript[]> {
    return await this.lsitChatSchema
      .find({ _userId: { $all: [_userId] } })
      .populate({ path: "_userId", select: "_id username fullName photoProfile" })
      .exec();
  }

  public async getListChatById(_id: Schema.Types.ObjectId): Promise<iListChatTranscript | null> {
    return await this.lsitChatSchema.findOne({ _id: _id }).populate({ path: "_userId", select: "_id username fullName photoProfile" }).exec();
  }
}

export default new chatRepository();
