import BaseRoute from "../BaseRoutes";
import ChatController from "../../controllers/chatController";
import AuthMiddleware from "../../middlewares/AuthMiddleware";
import { query } from "express-validator";

class ChatRoutes extends BaseRoute {
  routes(): void {
    this.router.post("/send", [AuthMiddleware.authorize.bind(AuthMiddleware)], new ChatController().sendMessage); //masih tidak dipake
    this.router.post("/new-chat", [AuthMiddleware.authorize.bind(AuthMiddleware)], new ChatController().createRoom);
    this.router.get(
      "/current-chat",
      [
        AuthMiddleware.authorize.bind(AuthMiddleware),
        query("_skip").notEmpty().isInt(),
        query("_limit").notEmpty().isInt(),
        query("_listchatId").notEmpty().isString(),
        this.preRequest,
      ],
      new ChatController().getChat
    );
    this.router.get("/list-chat", [AuthMiddleware.authorize.bind(AuthMiddleware)], new ChatController().getListChat);
    this.router.get("/list-chat/one/:_id", [AuthMiddleware.authorize.bind(AuthMiddleware)], new ChatController().getListChatById);
  }
}

export default new ChatRoutes().router;
