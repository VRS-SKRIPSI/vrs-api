import bodyParser from "body-parser";
import { config as dotenv } from "dotenv";
import express, { Application } from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import { Server, Socket } from "socket.io";
import mainRoute from "./routes";
import UserSeed from "./seeds/UserSeed";
import cors from "cors";

interface iRequestStream {
  id: string;
}

class App {
  public app: Application;
  public server: any;
  public io: Server;

  constructor() {
    console.clear();
    dotenv();
    this.app = express();
    this.package();
    this.routes();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
      },
    });
    this.broadcast();
    console.log("diinitialisasi socket io nya", this.io);
  }

  protected package(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  protected routes(): void {
    this.app.use(cors());
    this.app.use("/api/v1", mainRoute);
  }

  protected broadcast(): void {
    this.io.on("connection", async (socket: Socket) => {
      console.log(socket.id);
      //listen and send message ent to end
      socket.on("textCaptionRequest", async (msg: Socket) => {
        this.io.emit("textCaptionResponse", msg);
      });

      //request stream
      socket.on("requestStream", async (msg: Socket<iRequestStream>) => {
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
export const socketIo = new App().io;
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
      new UserSeed();
    });
  })
  .catch((err) => {
    console.log(err);
  });
