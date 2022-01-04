import translate from "@iamtraction/google-translate";
import bodyParser from "body-parser";
import cors from "cors";
import { config as dotenv } from "dotenv";
import express, { Application } from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import { Server, Socket } from "socket.io";
import ChatController from "./controllers/chatController";
import mainRoute from "./routes";
import countryInitData from "./services/countryInitData";

interface iRequestStream {
  _streamingId: string;
  _userId: string;
}

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
    this.initTranslate();
  }

  protected package(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  protected routes(): void {
    this.app.use(cors());
    this.app.use("/api/v1", mainRoute);
    // this.app.post("/ws", new ChatController(this.io).sendMessage.bind(new ChatController(this.io)));
  }

  protected broadcast(): void {
    this.io.on("connection", async (socket) => {
      console.log("form app", socket.id);

      //listen and send message ent to end
      socket.on("textCaptionRequest", async (msg) => {
        await translate(`${msg.msg.length >= 1 ? msg.msg : "hello world"}`, { from: "id", to: `${msg.language}` })
          .then((r) => {
            console.log("---------------------------------------------------------------");
            console.log(`from id: ${msg.msg}`);
            console.log(`to ${msg.language}: ${JSON.stringify(r.text)}`);
            console.log("---------------------------------------------------------------");
          })
          .catch((err) => {
            console.log("translate", err);
          });
      });

      //request stream
      socket.on("requestStream", async (msg: any) => {
        console.log("message", msg);
        this.io.emit("resultUserRequest", msg);
      });

      socket.on("join-room", (roomId, userId) => {
        console.log("roomId", `${roomId} ++ userId ${userId}`);

        socket.join(roomId);
        // socket.to(roomId).emit("user-connected", userId);
        this.io.to(roomId).emit("user-connected", userId);

        socket.on("disconnect-stream", () => {
          this.io.to(roomId).emit("user-disconnected", userId);
        });
      });

      //disconnect or offline user
      socket.on("disconnect", (reason) => {
        console.log(`${reason} : ${socket.id}`);
      });
    });
  }

  private async initTranslate(): Promise<void> {
    await translate(`ketika semua terasa begitu berat!`, { from: "id", to: "en" })
      .then((r) => {
        console.log("initial translate.text", r.text);
      })
      .catch((err) => {
        console.log(err);
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
