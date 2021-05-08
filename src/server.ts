import express, { Application } from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import { config as dotenv } from "dotenv";
import indexRoutes from "./routes/index";
import { Server, Socket } from "socket.io";
import { createServer } from "http";

class App {
  public app: Application;
  public server;
  public io: Server;

  constructor() {
    this.app = express();
    this.isPlugin();
    this.routes();
    dotenv();
    this.server = createServer(this.app);
    this.io = new Server(this.server);
    this.broadcast();
  }

  protected isPlugin(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  protected routes(): void {
    this.app.use(indexRoutes);
  }

  protected broadcast(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log(socket.id);
    });
  }
}

const app: Application = new App().app;
const mongoCon: string = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}?authSource=admin`;
mongoose
  .connect(mongoCon, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.clear();
      console.log(`                          `);
      console.log(`##   ##  ######   #######`);
      console.log(`##   ##  ##  ##   ##     `);
      console.log(` ## ##   #####    #######`);
      console.log(`  ###    ##  ##        ##`);
      console.log(`   #     ##   ##  #######`);
      console.log(`                          `);
      console.log(`(virtual reality school)`);
      console.log(`⚡️[server ${process.env.NODE_ENV}] running on PORT ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error(`[monggose error connection -> {server.js}] ${err}`);
  });
