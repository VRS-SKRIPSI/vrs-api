import { Request, Response } from "express";
import { Types } from "mongoose";
import { Server } from "socket.io";
import notifChat, { iNotifChat } from "../models/notfChat";
import chatRepository from "../repositorys/chatRepository";

interface iChatController {
  createRoom(req: Request, res: Response): Promise<Response>;
  sendMessage(req: Request, res: Response): Promise<Response>;
  getChat(req: Request, res: Response): Promise<Response>;
  getListChat(req: Request, res: Response): Promise<Response>;
  getListChatById(req: Request, res: Response): Promise<Response>;
  getListNotifChat(req: Request, res: Response): Promise<Response>;
}

class ChatController implements iChatController {
  // public socket: Server;
  // constructor(io: Server) {
  //   this.socket = io;
  // }

  public async createRoom(req: Request, res: Response): Promise<Response> {
    try {
      const data = await chatRepository.createRoom(req.body);
      return res.status(200).send({ status: 200, msg: "Success send message.!", err: null, data: data });
    } catch (err) {
      return res.status(500).send({ status: 500, msg: "Failed, something went wrong.!", err: null, data: null });
    }
  }

  public async sendMessage(req: Request, res: Response): Promise<Response> {
    try {
      // this.socket.emit("room", data);
      const data = await chatRepository.sendMessage(req.body);
      if (data === null) {
        return res.status(400).send({ status: 400, msg: "Failed send chat.!", err: "first create room chat.!" });
      }
      return res.status(200).send({ status: 200, msg: "Success send message.!", err: null, data: data });
    } catch (err) {
      return res.status(500).send({ status: 500, msg: "Failed, something went wrong.!", err: null, data: null });
    }
  }

  /**
   * getChat
   */
  public async getChat(req: Request, res: Response): Promise<Response> {
    try {
      const { _skip, _limit, _listchatId }: any = req.query;
      const limit = parseInt(_limit);
      const skip: number = parseInt(_skip);
      const chat = await chatRepository.findCurrentChat(`${_listchatId}`, limit, skip);
      return res.status(200).send({ status: 200, msg: "success get chat", err: null, data: chat });
    } catch (err) {
      return res.status(500).send({ status: 500, msg: "Failed get chat.!", err: "something went wrong.!", data: null });
    }
  }

  /**
   * getListChat
   */
  public async getListChat(req: Request, res: Response): Promise<Response> {
    try {
      const data = await chatRepository.getListChat(res.locals.id);
      return res.status(200).send({ status: 200, msg: "success get chat", err: null, data: data });
    } catch (err) {
      return res.status(500).send({ status: 500, msg: "Failed get chat.!", err: "something went wrong.!", data: null });
    }
  }

  /**
   * getListChat
   */
  public async getListChatById(req: Request, res: Response): Promise<Response> {
    const _id: any = req.params._id;
    try {
      const data = await chatRepository.getListChatById(_id);
      if (data !== null) {
        return res.status(200).send({ status: 200, msg: "success get chat", err: null, data: data });
      }
      return res.status(404).send({ status: 404, msg: "Success get chat.!", err: "list chat not found" });
    } catch (err) {
      return res.status(500).send({ status: 500, msg: "Failed get chat.!", err: "something went wrong.!", data: null });
    }
  }

  /**
   * get notification list chat
   */
  public async getListNotifChat(req: Request, res: Response): Promise<Response> {
    const { _userId } = req.params;
    const uid: any = _userId;
    try {
      const data = await notifChat.find({ _userId: uid }).exec();
      return res.status(200).send({ status: 200, msg: "Success get notf chat.!", err: "list chat not found", data: data });
    } catch (err) {
      return res.status(500).send({ status: 500, msg: "Failed get notif chat.!", err: "something went wrong.!", data: null });
    }
  }
}

export default ChatController;
