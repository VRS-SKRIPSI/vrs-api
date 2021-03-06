import { pbkdf2Sync, randomBytes } from "crypto";
import { Request, Response } from "express";
import { unlink } from "fs";
import Jwt from "jsonwebtoken";
import { NativeError } from "mongoose";
import path from "path";
import { uid } from "uid";
import { iToken } from "../interfaces/tokenInterface";
import UserRepository from "../repositorys/UserRepository";
import EmailService from "../services/EmailService";

interface iUserController {
  login(req: Request, res: Response): Promise<Response>;
  register(req: Request, res: Response): Promise<Response>;
  activation(req: Request, res: Response): Promise<Response>;
  getLinkForgetPassword(req: Request, res: Response): Promise<Response>;
  forgetPassword(req: Request, res: Response): Promise<Response>;
  changePassword(req: Request, res: Response): Promise<Response>;
  checkAlreadyKey(req: Request, res: Response): Promise<Response>;
  reSendEmail(req: Request, res: Response): Promise<Response>;
  searchUser(req: Request, res: Response): Promise<Response>;
  getMyProfile(req: Request, res: Response): Promise<Response>;
  editMyProfile(req: Request, res: Response): Promise<Response>;
  uploadPhotoProfile(req: Request, res: Response): Promise<Response>;
}

interface iQuerySearch {
  $and: [{ _id: { $ne: any } }, { $or: [{ username: { $regex: string } }, { fullName: { $regex: string } }] }];
}

class UserController implements iUserController {
  private setPassword(pwd: string): { salt: string; password: string } {
    const salt = randomBytes(16).toString("hex");
    const password = pbkdf2Sync(pwd, salt, 1000, 64, `sha512`).toString(`hex`);
    return { salt: salt, password: password };
  }
  /**
   * login
   */
  public async login(req: Request, res: Response): Promise<Response> {
    const priveteKey: string = `${process.env.SIGNATURE}`;

    try {
      const data = await UserRepository.findUsernameOrEmail(req.body.usernameOrEmail);
      if (data === null) {
        return res.status(400).send({ status: 400, msg: "Failed login.!", err: "username or email not found.!", data: null });
      }

      if (!data.validPassword(req.body.password)) {
        return res.status(400).send({ status: 400, msg: "Failed login.!", err: "wrong password.!", data: null });
      }

      if (!data.confidential.isActivated) {
        return res.status(400).send({ status: 400, msg: "Failed login.!", err: "account not activated.!", data: null });
      }

      const token = Jwt.sign({ id: data.id, username: data.username }, priveteKey, { algorithm: "HS384", expiresIn: "168h" });
      const result = {
        user: data.toJSON(),
        accessToken: token,
      };

      return res.status(200).send({ status: 200, msg: "Success login.!", err: null, data: result });
    } catch (err: any) {
      return res.status(500).send({ status: 500, msg: "Failed login.!", err: "Something went wrong.!", data: null });
    }
  }

  /**
   * register
   */
  public async register(req: Request, res: Response): Promise<Response> {
    const date = new Date().getTime().toString();
    const aCode: string = `${uid(3)}${date.substring(date.length - 3)}`.toUpperCase();
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        const decoded = Jwt.verify(token, `${process.env.SIGNATURE}`);
        const result = decoded as iToken;
        if (result.role === "dev") {
          const data = await UserRepository.create(req.body, aCode);
          return res.status(200).send({ status: 200, msg: "Success.!", err: null, data: data });
        }
      }
      const data = await UserRepository.create(req.body, aCode);
      const urlHref: string = `${process.env.FRONT_URL}/auth/verification/me/${data.username}?code=${aCode}`;
      EmailService.sender({
        to: `${data.email}`,
        subject: "otp verification",
        text: "verification",
        html: `<p><b>Kode otp anda adalah : <h3>${aCode}</h3></b></p><br/><p><b>Atau <a href="${urlHref}">klik me</a> untuk melanjutkan verifikasi</b></p>`,
      }).catch((err) => {
        console.log(err);
      });
      return res.status(200).send({ status: 200, msg: "Success register.!", err: null, data: data });
    } catch (error) {
      const err = error as NativeError;
      const errors = error as Jwt.VerifyErrors;
      if (err.message.includes("username_1")) {
        return res.status(400).send({ status: 400, msg: "Failed register validation.!", err: "Username already exist.!", data: null });
      }
      if (err.message.includes("email_1")) {
        return res.status(400).send({ status: 400, msg: "Failed register validation.!", err: "Email already exist.!", data: null });
      }
      if (err.message.includes("numberPhone_1")) {
        return res.status(400).send({ status: 400, msg: "Failed register validation.!", err: "Number phone already exist.!", data: null });
      }
      //err jwt account dev registered
      if (errors.message.includes("jwt malformed")) {
        return res.status(403).send({ status: 403, msg: "Failed register.!", err: "jwt malformed", data: null });
      }
      if (errors.message.includes("jwt expired")) {
        return res.status(403).send({ status: 403, msg: "Failed register.!", err: "jwt expired", data: null });
      }
      //err undefined
      return res.status(500).send({ status: 500, msg: "Failed register.!", err: "Something went wrong.!", data: null });
    }
  }

  /**
   * activation
   */
  public async activation(req: Request, res: Response): Promise<Response> {
    try {
      const user = await UserRepository.findOne<{ $and: [{ "confidential.activationCode": string }, { username: string }] }>({
        $and: [{ "confidential.activationCode": req.params.code.toUpperCase() }, { username: req.params.username }],
      });

      if (user === null) {
        return res.status(404).send({ status: 404, msg: "Failed user not found.!", err: "invalid otp or username!", data: null });
      }

      if (user.confidential.isActivated) {
        return res.status(200).send({ status: 200, msg: "Success, user has been activated.!", err: null, data: null });
      }

      const data = await UserRepository.updateOne<{ _id: any }, { "confidential.isActivated": boolean; "confidential.activatedAt": Date }>(
        { _id: user._id },
        { "confidential.isActivated": true, "confidential.activatedAt": new Date() }
      );
      return res.status(200).send({ status: 200, msg: "Success activation account.!", err: null, data: data });
    } catch (error) {
      return res.status(500).send({ status: 500, msg: "Failed.!", err: "Something went wrong.!", data: null });
    }
  }

  /**
   * getLinkForgetPassword
   */
  public async getLinkForgetPassword(req: Request, res: Response): Promise<Response> {
    const { email } = req.body;
    try {
      const link = `${uid(16)}.${new Date().getTime()}.${uid(16)}`;
      const data = await UserRepository.findOneAndUpdate<{ email: string }, { "confidential.linkResetPassword": string }>(
        { email: email },
        { "confidential.linkResetPassword": link }
      );

      if (data === null) {
        return res.status(404).send({ status: 404, msg: "Failed request link reset password.!", err: "Email not found, try again.!", data: null });
      }

      //kirim email
      EmailService.sender({
        to: `${data.email}`,
        subject: "otp forget-password",
        text: "verification forget-password",
        html: `<p><b>Silahkan untuk melanjutkan reset password <a href="${process.env.FRONT_URL}/auth/reset-password?username=${data.username}&key=${data.confidential.linkResetPassword}">klik me</a></b></p>`,
      }).catch((err) => {
        console.log(err);
      });
      return res.status(200).send({ status: 200, msg: "Success request link reset password.!", err: null, data: data });
    } catch (error) {
      const err = error as NativeError;
      return res.status(500).send({ status: 500, msg: "Failed request link reset password.!", err: "Something went wrong.!", data: null });
    }
  }

  /**
   * forgetPassword
   */
  public async forgetPassword(req: Request, res: Response): Promise<Response> {
    const { username, link } = req.params;
    const { nPassword, cPassword } = req.body;
    try {
      const userCheck = await UserRepository.findOne<{ $and: [{ username: string }, { "confidential.linkResetPassword": string }] }>({
        $and: [{ username: username }, { "confidential.linkResetPassword": link }],
      });

      if (userCheck === null) {
        return res.status(403).send({ status: 403, msg: "Failed reset password.!", err: "invalid username or link", data: null });
      }

      if (userCheck.confidential.linkResetPassword === null) {
        return res.status(403).send({ status: 403, msg: "Failed reset password.!", err: "invalid username or link", data: null });
      }

      if (nPassword !== cPassword) {
        return res.status(403).send({ status: 403, msg: "Failed reset password.!", err: "password doesn't match.!", data: null });
      }
      const setPassword = this.setPassword(nPassword);
      const data = await UserRepository.findOneAndUpdate<
        { $and: [{ username: string }, { "confidential.linkResetPassword": string }] },
        { "confidential.password": string; "confidential.salt": string; "confidential.linkResetPassword": null }
      >(
        {
          $and: [{ username: username }, { "confidential.linkResetPassword": link }],
        },
        { "confidential.password": setPassword.password, "confidential.salt": setPassword.salt, "confidential.linkResetPassword": null }
      );

      if (data === null) {
        return res.status(403).send({ status: 403, msg: "Failed reset password.!", err: "invalid username or link", data: null });
      }

      return res.status(200).send({ status: 200, msg: "Success reset password.!", err: null, data: data });
    } catch (error) {
      const err = error as NativeError;
      return res.status(500).send({ status: 500, msg: "Failed reset password.!", err: "Something went wrong.!", data: null });
    }
  }

  /**
   * changePassword
   */
  public async changePassword(req: Request, res: Response): Promise<Response> {
    const jwtPayload = res.locals as iToken;
    const { lPassword, nPassword, cPassword } = req.body;
    const _id = jwtPayload.id;
    try {
      const user = await UserRepository.findOne<{ _id: any }>({ _id: _id });

      if (user === null) {
        return res.status(404).send({ status: 404, msg: "Failed change password.!", err: "user not found.!", data: null });
      }
      if (!user.validPassword(lPassword)) {
        return res.status(403).send({ status: 403, msg: "Failed change password.!", err: "Old password doesn't match.!", data: null });
      }
      if (nPassword !== cPassword) {
        return res.status(403).send({ status: 403, msg: "Failed change password.!", err: "password doesn't match.!", data: null });
      }

      const setPassword = this.setPassword(nPassword);
      const data = await UserRepository.findOneAndUpdate<{ _id: any }, { "confidential.password": string; "confidential.salt": string }>(
        { _id: user._id },
        { "confidential.password": setPassword.password, "confidential.salt": setPassword.salt }
      );

      if (data !== null) {
        return res.status(200).send({ status: 200, msg: "Success change password.!", err: null, data: data });
      }
      return res.status(404).send({ status: 404, msg: "Failed change password.!", err: "user not found.!", data: null });
    } catch (error) {
      const err = error as NativeError;
      return res.status(500).send({ status: 500, msg: "Failed change password.!", err: "Something went wrong.!", data: null });
    }
  }

  /**
   * checkAlreadyKey
   */
  public async checkAlreadyKey(req: Request, res: Response): Promise<Response> {
    const { q, val } = req.query;
    const query = q as string;
    const value = val as string;
    try {
      if (query.includes("username")) {
        const data = await UserRepository.checkDupKey<{ username: string }>({ username: value }, "-_id username");
        return res.status(200).send({ status: 200, msg: "Success.!", err: null, data: data });
      } else if (query.includes("email")) {
        const data = await UserRepository.checkDupKey<{ email: string }>({ email: value }, "-_id email");
        return res.status(200).send({ status: 200, msg: "Success.!", err: null, data: data });
      }
      return res.status(400).send({ status: 400, msg: "Failed.!", err: "query required.!", data: null });
    } catch (error) {
      const err = error as NativeError;
      return res.status(500).send({ status: 500, msg: "Failed.!", err: "Something went wrong.!", data: null });
    }
  }

  /**
   * reSendEmail
   */
  public async reSendEmail(req: Request, res: Response): Promise<Response> {
    const { username, ctx } = req.params;
    const data = await UserRepository.findOne<{ username: string }>({ username: `${username}` });
    if (data === null) {
      return res.status(404).send({ status: 404, msg: "Failed user not found.!", err: "invalid username.!", data: null });
    }

    if (ctx === "reset-password") {
      if (data.confidential.linkResetPassword === null) {
        return res.status(403).send({ status: 403, msg: "Failed resend link reset-password.!", err: "link is empty.!", data: null });
      }

      const urlResetPassword: string = `${process.env.FRONT_URL}/auth/reset-password?username=${data.username}&key=${data.confidential.linkResetPassword}`;
      EmailService.sender({
        to: `${data.email}`,
        subject: "otp forget-password",
        text: "verification forget-password",
        html: `<p><b>Silahkan untuk melanjutkan reset password <a href="${urlResetPassword}">klik me</a></b></p>`,
      }).catch((err) => {
        console.log(err);
      });
      return res.status(200).send({ status: 200, msg: "Success resend email link forget-password.!", err: null, data: data });
    }

    if (ctx === "activation") {
      const urlActivation: string = `${process.env.FRONT_URL}/auth/verification/me/${data.username}?code=${data.confidential.activationCode}`;

      if (data.confidential.isActivated) {
        return res.status(200).send({ status: 200, msg: "Success account has been activated.!", err: null, data: data });
      }
      EmailService.sender({
        to: `${data.email}`,
        subject: "otp verification",
        text: "verification",
        html: `<p><b>Kode otp anda adalah : <h3>${data.confidential.activationCode}</h3></b></p><br/><p><b>Atau <a href="${urlActivation}">klik me</a> untuk melanjutkan verifikasi</b></p>`,
      }).catch((err) => {
        console.log(err);
      });
      return res.status(200).send({ status: 200, msg: "Success resend email link || otp activation.!", err: null, data: data });
    }

    return res.status(400).send({ status: 400, msg: "Failed ctx not found.!", err: "invalid ctx.!", data: null });
  }

  /**
   * search user
   */
  public async searchUser(req: Request, res: Response): Promise<Response> {
    const data = await UserRepository.findAllQuery<iQuerySearch>({
      $and: [
        { _id: { $ne: res.locals.id } },
        { $or: [{ username: { $regex: `${req.query.keyword}` } }, { fullName: { $regex: `${req.query.keyword}` } }] },
      ],
    });
    return res.status(200).send({ status: 200, msg: "Sucess search users.!", err: null, data: data });
  }

  /**
   * getMyProfile */
  public async getMyProfile(req: Request, res: Response): Promise<Response> {
    try {
      const _id = res.locals.id;
      const data = await UserRepository.findOne({ _id: _id });
      if (data !== null) {
        return res.status(200).send({ status: 200, msg: "Sucess get my profile.!", err: null, data: data });
      }
      return res.status(400).send({ status: 400, msg: "Sucess data not found.!", err: null, data: null });
    } catch (error) {
      return res.status(500).send({ status: 500, msg: "Failed.!", err: "Something went wrong.!", data: null });
    }
  }

  /**
   * EditMyProfile
   */
  public async editMyProfile(req: Request, res: Response): Promise<Response> {
    const { username, fullName, country, countryCode } = req.body;
    try {
      const _id = res.locals.id;
      const data = await UserRepository.findOneAndUpdate<{ _id: any }, { username: string; fullName: string; country: string; countryCode: string }>(
        { _id: _id },
        { username: username, fullName: fullName, country: country, countryCode: countryCode }
      );
      if (data === null) {
        return res.status(200).send({ status: 200, msg: "Failed edit profile.!", err: "user not found", data: data });
      }
      return res.status(200).send({ status: 200, msg: "Sucess edit profile.!", err: null, data: data });
    } catch (error) {
      const err = error as NativeError;
      if (err.message.includes("username_1")) {
        return res.status(400).send({ status: 400, msg: "Failed register validation.!", err: "Username already exist.!", data: null });
      }
      return res.status(500).send({ status: 500, msg: "Failed.!", err: "Something went wrong.!", data: null });
    }
  }

  /**
   * name
   */
  public async uploadPhotoProfile(req: Request, res: Response): Promise<Response> {
    const _id = res.locals.id;
    const filename = req?.file?.filename;
    try {
      const data = await UserRepository.findOne<{ _id: any }>({ _id: _id });
      if (data === null) {
        return res.status(404).send({ status: 404, msg: "Success.!", err: "user not found", data: data });
      }
      unlink(path.join(__dirname, `../../public/uploads/${data.photoProfile}`), (r) => {});
      if (filename) {
        const upload = await UserRepository.findOneAndUpdate<{ _id: any }, { photoProfile: string }>({ _id: _id }, { photoProfile: filename });
        if (upload === null) {
          return res.status(404).send({ status: 404, msg: "Success.!", err: "user not found", data: data });
        }
        return res.status(200).send({ status: 200, msg: "Sucess upload photo profile.!", err: null, data: upload });
      }
      return res.status(404).send({ status: 404, msg: "Success.!", err: "user not found", data: data });
    } catch (err: any) {
      return res.status(500).send({ status: 500, msg: "Failed.!", err: "Something went wrong.!", data: null });
    }
  }

  /**
   * validateToken
   */
  public async validateToken(req: Request, res: Response): Promise<Response> {
    const _id = res.locals.id;
    try {
      const data = await UserRepository.findOne<{ _id: any }>({ _id: _id });
      if (data !== null) {
        return res.status(200).send({ status: 200, msg: "OK", err: null, data: [] });
      }
      return res.status(404).send({ status: 404, msg: "!Failed", err: "Failed something went wrong", data: [] });
    } catch (error) {
      return res.status(404).send({ status: 404, msg: "!Failed", err: "Failed something went wrong", data: [] });
    }
  }
}

export default new UserController();
