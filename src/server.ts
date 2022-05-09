import translate from "@vitalets/google-translate-api";
import bodyParser from "body-parser";
import cors from "cors";
import { config as dotenv } from "dotenv";
import express, { Application } from "express";
import { createServer } from "http";
import mongoose, { Schema } from "mongoose";
import path from "path";
import { Server, Socket } from "socket.io";
import notifChat, { iNotifChat } from "./models/notfChat";
import chatRepository, { iSendChatResponse } from "./repositorys/chatRepository";
import UserRepository from "./repositorys/UserRepository";
import mainRoute from "./routes";
import countryInitData from "./services/countryInitData";

class App {
  public app: Application;
  public server: any;
  public io: Server;
  public listUserIsOnline: string[] = [];

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
    //create notification
    await notifChat.create({ _listChatTranscriptId: `${payload.credential._id}`, _userId: `${payload.payload._receiver._userId}` });
    this.io.emit(`client-notif-chat-${payload.payload._receiver._userId}`, {
      _userId: `${payload.payload._receiver._userId}`,
      _listChatTranscriptId: `${payload.credential._id}`,
    });

    //send chat to _sender and receiver
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
      this.Translate(msg);
    });

    socket.on("server-read-chat", async (msg: { _listChatTranscriptId: string; _userId: string }) => {
      const _listChatId: any = `${msg._listChatTranscriptId}`;
      const userId: any = `${msg._userId}`;
      await notifChat.deleteMany({ _userId: userId, _listChatTranscriptId: _listChatId }).exec();
    });
  }

  protected broadcast(): void {
    this.io.use((socket, next) => {
      const username = `${socket.handshake.query.username}`;
      if (username) {
        this.listUserIsOnline.push(username);
        this.io.emit("got-user-is-online", username);
        next();
      } else {
        next(new Error("username required"));
      }
    });

    this.io.on("connection", async (socket) => {
      console.log("form app", socket.id);
      this.chat(socket);
      socket.on("req-list-user-is-online", (userId: string) => {
        this.io.to(userId).emit("got-list-user-is-online", this.listUserIsOnline);
      });

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
        const username = `${socket.handshake.query.username}`;
        console.log(`${reason} : ${socket.id}`);
        const index = this.listUserIsOnline.findIndex((f) => f === username);
        this.listUserIsOnline.splice(index, 1);
        console.log(this.listUserIsOnline);
        this.io.emit("got-user-is-leave", username);
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
