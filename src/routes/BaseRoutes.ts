import { NextFunction, Request, Response, Router } from "express";
import { validationResult } from "express-validator";
import iRoutes from "./iRoutes";

abstract class BaseRoute implements iRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  /**
   * preRequest
   * @returns NextFunction | Response Error validation request
   */
  protected preRequest(req: Request, res: Response, next: NextFunction): any {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(401).send({
        status: 401,
        msg: "Failed, invalid validation.!",
        err: errors.array(),
        data: null,
      });
    }
    return next();
  }

  abstract routes(): void;
}

export default BaseRoute;
