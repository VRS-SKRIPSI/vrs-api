import streaming, { iStreaming } from "../models/streaming";

interface iStreamingRepository {
  findOne<T>(query: T): Promise<iStreaming | null>;
  findAll(): Promise<iStreaming[]>;
  create(body: iStreaming): Promise<iStreaming>;
  findOneAndUpdate<T, type>(query: T, body: type): Promise<iStreaming | null>;
}

class StreamingRepository implements iStreamingRepository {
  protected Streaming;

  constructor() {
    this.Streaming = streaming;
  }

  async findOne<T>(query: T): Promise<iStreaming | null> {
    return await this.Streaming.findOne(query).exec();
  }

  async findAll(): Promise<iStreaming[]> {
    return await this.Streaming.find().exec();
  }

  async create(body: iStreaming): Promise<iStreaming> {
    return await this.Streaming.create(body);
  }

  async findOneAndUpdate<T, type>(query: T, body: type): Promise<iStreaming | null> {
    return await this.Streaming.findOneAndUpdate(query, body, { new: true }).exec();
  }
}

export default new StreamingRepository();
