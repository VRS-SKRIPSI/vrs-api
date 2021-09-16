import { NextFunction, Request, Response } from "express";
import { verify, VerifyErrors } from "jsonwebtoken";
import { iToken } from "../interfaces/tokenInterface";

interface iAuthorize {
  _id: any;
  username: string;
}

interface iAuthMiddleware {
  authorize(req: Request, res: Response, next: NextFunction): Promise<void | Response | NextFunction>;
  accessAdimOrDev(req: Request, res: Response, next: NextFunction): Promise<void | Response | NextFunction>;
}

class AuthMiddleware implements iAuthMiddleware {
  private response(res: Response, err: string): Response {
    return res.status(403).send({ status: 403, msg: "Failed next request.!", err: err, data: null });
  }
  /**
   * authorize
   */
  public async authorize(req: Request, res: Response, next: NextFunction): Promise<void | Response | NextFunction> {
    const { authorization } = req.headers;
    if (!authorization) return this.response(res, "jwt required.!");
    if (authorization.split(" ")[0] !== "Bearer") return this.response(res, "invalid jwt.!");
    const token: string = authorization.split(" ")[1];
    if (!token || token === undefined) return this.response(res, "jwt required.!");

    try {
      const decoded = verify(token, `${process.env.SIGNATURE}`);
      const payload = decoded as iToken;
      res.locals = payload;
      return next();
    } catch (error) {
      const err = error as VerifyErrors;
      return this.response(res, `${err.message}`);
    }
  }

  /**
   * adminOrdev
   */
  public async accessAdimOrDev(req: Request, res: Response, next: NextFunction): Promise<void | Response | NextFunction> {
    const jwtPayload = res.locals as iToken;
    if (jwtPayload.role.toLowerCase() === "dev" || jwtPayload.role.toLowerCase() === "admin") {
      return next();
    }
    return res.status(403).send({ status: 403, msg: "Failed request.!", err: "access denied.!", data: null });
  }
}

export default new AuthMiddleware();
