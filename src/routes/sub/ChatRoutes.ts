import BaseRoute from "../BaseRoutes";
import ChatController from "../../controllers/chatController";
import AuthMiddleware from "../../middlewares/AuthMiddleware";
import { query } from "express-validator";

class ChatRoutes extends BaseRoute {
  routes(): void {
    this.router.post("/send", new ChatController().sendMessage);
    this.router.post("/new-chat", new ChatController().createRoom);
    this.router.get(
      "/current-chat",
      [
        AuthMiddleware.authorize.bind(AuthMiddleware),
        query("_page").notEmpty().isInt(),
        query("_limit").notEmpty().isInt(),
        query("_listchatId").notEmpty().isString(),
        this.preRequest,
      ],
      new ChatController().getChat
    );
    this.router.get("/list-chat", [AuthMiddleware.authorize.bind(AuthMiddleware)], new ChatController().getListChat);
  }
}

export default new ChatRoutes().router;
