import { body, query } from "express-validator";
import UserController from "../../controllers/UserController";
import AuthMiddleware from "../../middlewares/AuthMiddleware";
import BaseRoute from "../BaseRoutes";

class UserRoute extends BaseRoute {
  routes(): void {
    this.router.post(
      "/auth/login",
      [
        body("usernameOrEmail").notEmpty().withMessage("username or email required").isString().withMessage("username or email is string"),
        body("password")
          .notEmpty()
          .withMessage("password required")
          .isString()
          .withMessage("password is string")
          .isLength({ min: 6, max: 20 })
          .withMessage("password min 6 max 20"),
        this.preRequest,
      ],
      UserController.login
    );

    this.router.post(
      "/auth/register",
      [
        body("username").notEmpty().isString().isLength({ min: 6, max: 30 }),
        body("fullName").notEmpty().isString().isLength({ min: 1, max: 30 }),
        body("email").notEmpty().isString().isEmail(),
        body("country").notEmpty().withMessage("country is required.!").isString().withMessage("country is string.!"),
        body("countryCode").notEmpty().withMessage("countryCode is required.!").isString().withMessage("countryCode is string.!"),
        body("password").notEmpty().isString(),
        body("cPassword").notEmpty().isString(),
        this.preRequest,
      ],
      UserController.register
    );

    this.router.get(
      "/auth/register-validator",
      [query("q").notEmpty().isString(), query("val").notEmpty().isString(), this.preRequest],
      UserController.checkAlreadyKey
    );

    this.router.get("/activation/:username/:code", UserController.activation);
    this.router.put(
      "/change-password",
      [
        AuthMiddleware.authorize.bind(AuthMiddleware),
        body("lPassword").notEmpty().isLength({ min: 6, max: 20 }).isString(),
        body("nPassword").notEmpty().isLength({ min: 6, max: 20 }).isString(),
        body("cPassword").notEmpty().isLength({ min: 6, max: 20 }).isString(),
        this.preRequest,
      ],
      UserController.changePassword.bind(UserController)
    );

    this.router.put("/forget-password", [body("email").notEmpty().isEmail(), this.preRequest], UserController.getLinkForgetPassword);
    this.router.put(
      "/verify-forget-password/:username/:link",
      [
        body("nPassword").notEmpty().isLength({ min: 6, max: 20 }).isString(),
        body("cPassword").notEmpty().isLength({ min: 6, max: 20 }).isString(),
        this.preRequest,
      ],
      UserController.forgetPassword.bind(UserController)
    );

    this.router.get("/auth/resend-email/:username/:ctx", UserController.reSendEmail);
    this.router.get(
      "/search",
      [AuthMiddleware.authorize.bind(AuthMiddleware), query("keyword").notEmpty().isString(), this.preRequest],
      UserController.searchUser
    );
  }
}

export default new UserRoute().router;
