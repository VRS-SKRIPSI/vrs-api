import translate from "@vitalets/google-translate-api";
import bodyParser from "body-parser";
import cors from "cors";
import { config as dotenv } from "dotenv";
import express, { Application } from "express";
import { createServer } from "http";
import mongoose, { Schema } from "mongoose";
import path from "path";
import { Server, Socket } from "socket.io";
import chatRepository, { iSendChatResponse } from "./repositorys/chatRepository";
import UserRepository from "./repositorys/UserRepository";
import mainRoute from "./routes";
import countryInitData from "./services/countryInitData";

class App {
  public app: Application;
  public server: any;
  public io: Server;

  constructor() {
    console.clear();
    dotenv();
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
      },
    });
    this.package();
    this.routes();
    this.broadcast();
    // this.initTranslate();
  }

  protected package(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  protected routes(): void {
    this.app.use(cors());
    this.app.use("/img", express.static(path.join(__dirname, "../public/uploads/")));
    this.app.use("/api/v1", mainRoute);
    // this.app.post("/ws", new ChatController(this.io).sendMessage.bind(new ChatController(this.io)));
  }

  private async Translate(payload: iSendChatResponse): Promise<void> {
    const { fromChat, fromLang } = payload.payload.body;
    let result = payload;
    const chatId = new mongoose.Types.ObjectId();
    Object.assign(result, { ...result, payload: { ...result.payload, _id: chatId } });
    this.io.emit(`client-chat-${payload.payload._sender._userId}`, result); //send back to senders
    this.io.emit(`client-chat-${payload.payload._receiver._userId}`, result); //send to receiver
    const gotLangCodeTarget = await UserRepository.findOne<{ _id: Schema.Types.ObjectId }>({ _id: payload.payload._receiver._userId });
    if (gotLangCodeTarget !== null) {
      await translate(`${fromChat}`, { from: `${fromLang}`, to: `${gotLangCodeTarget.countryCode}` })
        .then(async (r) => {
          Object.assign(result, {
            ...result,
            payload: { ...result.payload, body: { ...result.payload.body, targetLang: `${gotLangCodeTarget.countryCode}`, targetChat: r.text } },
          });
          console.log(`${fromChat}#${fromLang} -> ${r.text}#${gotLangCodeTarget?.countryCode}`);
          console.log("replace payload", result);
          this.io.emit(`client-chat-${payload.payload._sender._userId}`, result); //send back to senders
          this.io.emit(`client-chat-${payload.payload._receiver._userId}`, result); //send to receiver
          Object.assign(result, {
            ...result,
            payload: {
              ...result.payload,
              _sender: { ...result.payload._sender, send: true },
              body: { ...result.payload.body, targetLang: `${gotLangCodeTarget.countryCode}`, targetChat: r.text },
            },
          });
          const data = await chatRepository.sendMessage(result);
          if (data !== null) {
            this.io.emit(`client-chat-${payload.payload._sender._userId}`, data); //send back to senders
            this.io.emit(`client-chat-${payload.payload._receiver._userId}`, data); //send to receiver
          }
        })
        .catch((err) => {
          console.log("error translate chat", err);
          Object.assign(result, {
            ...result,
            payload: { ...result.payload, body: { ...result.payload.body, targetChat: "oopps... failed to translate message!" } },
          });
          this.io.emit(`client-chat-${payload.payload._sender._userId}`, result); //send back to senders
          this.io.emit(`client-chat-${payload.payload._receiver._userId}`, result); //send to receiver
        });
    }
  }

  private chat(socket: Socket): void {
    socket.on("server-post-chat", (msg: iSendChatResponse) => {
      console.log("post chat", msg);
      this.Translate(msg);
    });
  }

  protected broadcast(): void {
    this.io.on("connection", async (socket) => {
      console.log("form app", socket.id);
      this.chat(socket);

      socket.on("calling", (msg) => {
        this.io.emit(msg.data._toUserId, msg);
      });

      socket.on("cancel-calling", (msg) => {
        this.io.emit(msg.data._toUserId, msg);
      });

      socket.on("calling-busy", (msg) => {
        this.io.emit(msg.data._fromUserId, msg);
      });

      socket.on("reject", (msg) => {
        this.io.emit(msg.data._fromUserId, msg);
      });

      socket.on("answer", (msg) => {
        this.io.emit(msg.data._fromUserId, msg);
      });

      socket.on("join-room", (roomId, _userId) => {
        console.log("roomId", `${roomId} ++ userId ${_userId}`);
        socket.join(roomId);
        socket.to(roomId).emit("user-connected", _userId);
        console.log(socket.rooms);
      });

      socket.on("transcript", async (roomId, msg) => {
        if (msg.msg.length >= 1) {
          return await translate(msg.msg, { from: msg.fromLang, to: msg.toLang })
            .then((r) => {
              console.log("msg dan roomid", msg);
              socket.to(roomId).emit("transcript-callback", r.text);
              // this.io.emit(msg.receiverId, JSON.stringify(r.text));
              console.log("---------------------------------------------------------------");
              console.log(`from ${msg.fromLang}: ${msg.msg}`);
              console.log(`to ${msg.toLang}: ${JSON.stringify(r.text)}`);
              console.log("---------------------------------------------------------------");
            })
            .catch((err) => {
              console.log("translate", err);
            });
        }
      });
      socket.on("call-disconnected", (roomId) => {
        socket.leave(roomId);
        socket.to(roomId).emit("user-disconnected", socket.id);
      });

      //listen and send message ent to end
      socket.on("textCaptionRequest", async (msg) => {
        if (msg.msg.length >= 1) {
          return await translate(msg.msg, { from: "id", to: msg.language })
            .then((r) => {
              console.log(msg);
              this.io.emit(msg.receiverId, JSON.stringify(r.text));
              console.log("---------------------------------------------------------------");
              console.log(`from id: ${msg.msg}`);
              console.log(`to ${msg.language}: ${JSON.stringify(r.text)}`);
              console.log("---------------------------------------------------------------");
            })
            .catch((err) => {
              console.log("translate", err);
            });
        }
      });

      //request stream
      socket.on("requestStream", async (msg: any) => {
        console.log("message", msg);
        this.io.emit("resultUserRequest", msg);
      });

      //disconnect or offline user
      socket.on("disconnect", (reason) => {
        console.log(`${reason} : ${socket.id}`);
      });
    });
  }
}

const app = new App().server;
const mongoCon: string = `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DATABASE}?authSource=admin`;

mongoose
  .connect(mongoCon, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(async () => {
    app.listen(process.env.PORT, () => {
      console.log(`⚡️[server ${process.env.NODE_ENV}] running on PORT ${process.env.PORT}`);
      new countryInitData();
    });
  })
  .catch((err) => {
    console.log(err);
  });
