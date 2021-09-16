import { Request, Response } from "express";
import { NativeError } from "mongoose";
import { iToken } from "../interfaces/tokenInterface";
import StreamingRepository from "../repositorys/StreamingRepository";
import { socketIo } from "../server";
import StreamingService from "../services/StreamingService";

interface iStreamingController {
  getIsLive(req: Request, res: Response): Promise<Response>;
  store(req: Request, res: Response): Promise<Response>;
}

class StreamingController implements iStreamingController {
  private streamService;
  private streamRepo;
  constructor() {
    this.streamRepo = StreamingRepository;
    this.streamService = StreamingService;
  }

  /**
   * getIsLive
   */
  public async getIsLive(req: Request, res: Response): Promise<Response> {
    try {
      const data = await this.streamRepo.findOne<{ isLive: boolean }>({ isLive: true });
      return res.status(200).send({ status: 200, msg: "Success get streaming.!", err: null, data: data });
    } catch (error) {
      const err = error as NativeError;
      console.log(error);
      return res.status(200).send({ status: 200, msg: "Failed create streaming.!", err: "something went wrong.!", data: err });
    }
  }

  /**
   * create store
   */
  public async store(req: Request, res: Response): Promise<Response> {
    const jwtPayload = res.locals as iToken;
    try {
      const data = await this.streamService.create(req, jwtPayload.id);
      const socket = socketIo.emit("refStreaming", { id: data._id, slug: data.slug, title: data.title });
      console.log("info new stream", socket);
      return res.status(200).send({ status: 200, msg: "Success create streaming.!", err: null, data: data });
    } catch (error) {
      const err = error as NativeError;
      if (err.message.includes("slug_1")) {
        return res.status(400).send({ status: 400, msg: "Failed create streaming.!", err: "slug already exist, try again.!", data: null });
      }
      return res.status(200).send({ status: 200, msg: "Failed create streaming.!", err: "something went wrong.!", data: null });
    }
  }
}

export default new StreamingController();
