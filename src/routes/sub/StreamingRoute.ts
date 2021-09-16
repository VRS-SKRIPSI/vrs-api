import { body } from "express-validator";
import StreamingController from "../../controllers/StreamingController";
import AuthMiddleware from "../../middlewares/AuthMiddleware";
import BaseRoute from "../BaseRoutes";

class StreamingRoute extends BaseRoute {
  routes(): void {
    this.router.get("/", StreamingController.getIsLive.bind(StreamingController));
    this.router.post(
      "/create",
      [
        AuthMiddleware.authorize.bind(AuthMiddleware),
        AuthMiddleware.accessAdimOrDev,
        body("title").notEmpty().isString().isLength({ min: 3, max: 225 }),
        body("isPrivate").notEmpty().isBoolean(),
        body("tags").notEmpty().isString(),
        body("desc").isString().isLength({ min: 1, max: 5000 }),
        this.preRequest,
      ],
      StreamingController.store.bind(StreamingController)
    );
  }
}

export default new StreamingRoute().router;
