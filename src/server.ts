import bodyParser from "body-parser";
import { config as dotenv } from "dotenv";
import express, { Application } from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import { Server, Socket } from "socket.io";

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
  }

  protected package(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  protected routes(): void {}

  protected broadcast(): void {
    this.io.on("connection", async (socket: Socket) => {
      // check data userId newF
      console.log(socket.id);

      //listen and send message ent to end
      socket.on("chatMessage", async (msg: Socket) => {
        this.io.emit("hello", { msg: "tes" });
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
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`⚡️[server ${process.env.NODE_ENV}] running on PORT ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
