import { body, query } from "express-validator";
import multer, { Multer } from "multer";
import { uid } from "uid";
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
    this.router.get("/got-profile", [AuthMiddleware.authorize.bind(AuthMiddleware), this.preRequest], UserController.getMyProfile);
    this.router.put(
      "/update-profile",
      [
        AuthMiddleware.authorize.bind(AuthMiddleware),
        body("username").notEmpty().isString().isLength({ min: 6, max: 30 }),
        body("fullName").notEmpty().isString().isLength({ min: 1, max: 30 }),
        body("country").notEmpty().withMessage("country is required.!").isString().withMessage("country is string.!"),
        body("countryCode").notEmpty().withMessage("countryCode is required.!").isString().withMessage("countryCode is string.!"),
        this.preRequest,
      ],
      UserController.editMyProfile
    );

    // const upload = multer({ dest: "public/uploads/" });
    const storage = multer.diskStorage({
      destination: function (req: any, file: any, cb: any) {
        cb(null, "dist/public/uploads");
      },

      filename: function (req: any, file: any, cb: any) {
        cb(null, `${uid(16)}${new Date().getTime()}_${file.originalname.replace(/\s/g, "_")}`);
      },
    });

    const upload: Multer = multer({
      limits: { fieldSize: 2 * 1024 * 1024 },
      storage: storage,
      fileFilter: (req: any, file: any, cb: any) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == "image/JPG") {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
    });
    this.router.put(
      "/upload/me/photo-profile",
      [AuthMiddleware.authorize.bind(AuthMiddleware), upload.single("file")],
      UserController.uploadPhotoProfile
    );

    this.router.get("/validate-token", [AuthMiddleware.authorize.bind(AuthMiddleware)], UserController.validateToken);
  }
}

export default new UserRoute().router;
