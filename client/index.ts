import { Socket } from "dgram";
import { config as dotenv } from "dotenv";
import express, { Application } from "express";
import io from "socket.io-client";

class App {
  public app: Application;
  public socket = io("http://localhost:3001");
  constructor() {
    console.clear();
    this.app = express();
    dotenv();
    this.broadcast();
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
