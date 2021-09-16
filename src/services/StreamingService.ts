import { Request } from "express";
import { uid } from "uid";
import { iStreaming, privasiEnum } from "../models/streaming";
import StreamingRepository from "../repositorys/StreamingRepository";
import CleanInput from "./CleanInput";

interface iStreamingService {
  create(req: Request, _userId: any): Promise<iStreaming>;
}

class StreamingService implements iStreamingService {
  protected streamingRepo;
  protected cleanInput;
  constructor() {
    this.streamingRepo = StreamingRepository;
    this.cleanInput = CleanInput;
  }

  async create(req: Request, _userId: any): Promise<iStreaming> {
    const body: any | iStreaming = {
      _userId: _userId,
      slug: `${uid(16)}${new Date().getSeconds()}`,
      title: this.cleanInput.clearExtraSpaces(`${req.body.title}`),
      privasi: req.body.isPrivate ? privasiEnum.private : privasiEnum.public,
      tags: req.body.tags,
      desc: req.body.desc,
    };

    return await this.streamingRepo.create(body);
  }
}

export default new StreamingService();
