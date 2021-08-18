import { uid } from "uid";
import users, { iUser } from "../models/users";
import CleanInput from "../services/CleanInput";

interface iCreate {
  username: string;
  fullName: string;
  email: string;
  numberPhone?: string;
  isActivated?: boolean;
  password: string;
}

interface iUserRepository {
  findOne<T>(query: T): Promise<iUser | null>;
  findUsernameOrEmail(param: string): Promise<iUser | null>;
  create(body: iCreate, role: string, activationCode: string): Promise<iUser>;
  findAll(skip: number, limit: number): Promise<iUser[]>;
  checkDupKey<T>(query: T, select: string): Promise<iUser | null>;
  updateOne<uid, T>(_id: uid, body: T): Promise<iUser>;
  findOneAndUpdate<_id, T>(_id: _id, body: T): Promise<iUser | null>;
}

class UserRepository implements iUserRepository {
  async findOne<T>(query: T): Promise<iUser | null> {
    return await users.findOne(query).exec();
  }

  async findUsernameOrEmail(param: string): Promise<iUser | null> {
    return await users.findOne({ $or: [{ email: param }, { username: param }] }).exec();
  }

  async findAll(skip: number, limit: number): Promise<iUser[]> {
    return await users
      .find()
      .skip(skip >= 1 ? 1 : 0)
      .limit(limit)
      .exec();
  }

  async create(body: iCreate, role: string, activationCode: string): Promise<iUser> {
    const data = new users();
    data.username = CleanInput.removeSpaces(body.username);
    data.fullName = CleanInput.clearExtraSpaces(body.fullName);
    data.email = body.email;
    if (body.numberPhone !== undefined) data.numberPhone = body.numberPhone;
    data.roles = role;
    data.confidential.activationCode = activationCode;
    data.confidential.isActivated = body.isActivated ? true : false;
    data.setPassword(body.password);
    const result = await data.save();
    return result;
  }

  async checkDupKey<T>(query: T, select: string): Promise<iUser | null> {
    return await users.findOne(query).select(select).exec();
  }

  async updateOne<uid, T>(_id: uid, body: T): Promise<iUser> {
    return await users.updateOne(_id, body, { new: true }).exec();
  }

  async findOneAndUpdate<_id, T>(_id: _id, body: T): Promise<iUser | null> {
    return await users.findOneAndUpdate(_id, body, { new: true }).exec();
  }
}

export default new UserRepository();
