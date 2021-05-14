import express, { Application } from "express";
import bodyParser from "body-parser";
import { config as dotenv } from "dotenv";
import io from "socket.io-client";
import { Socket } from "dgram";

class App {
  public app: Application;
  public socket = io("http://localhost:3001");
  constructor() {
    console.clear();
    this.app = express();
    this.package();
    this.routes();
    dotenv();
    this.broadcast();
  }

  protected package(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  protected routes(): void {
    this.app.get("/", (req, res) => {
      res.status(200).send({ msg: "running" });
    });
  }

  protected broadcast(): void {
    this.app.listen(3002, () => {
      console.log(`⚡️[client ${process.env.NODE_ENV}] running on PORT ${3002}`);
    });

    this.socket.on("hello", (msg: Socket) => {
      console.log(JSON.stringify(msg));
    });
  }
}

new App();
