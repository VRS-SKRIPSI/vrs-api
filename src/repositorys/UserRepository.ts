import users, { iUser } from "../models/users";
import CleanInput from "../services/CleanInput";

interface iCreate {
  username: string;
  fullName: string;
  email: string;
  numberPhone?: string;
  isActivated?: boolean;
  country: String;
  countryCode: String;
  password: string;
}

interface iUserRepository {
  findOne<T>(query: T | any): Promise<iUser | null>;
  findUsernameOrEmail(param: string): Promise<iUser | null>;
  create(body: iCreate, activationCode: string): Promise<iUser>;
  findAll(skip: number, limit: number): Promise<iUser[]>;
  findAllQuery<T>(query: T | any): Promise<iUser[]>;
  checkDupKey<T>(query: T | any, select: string): Promise<iUser | null>;
  updateOne<uid, T>(_id: uid | any, body: T | any): Promise<any>;
  findOneAndUpdate<_id, T>(_id: _id | any, body: T | any): Promise<iUser | null>;
}

class UserRepository implements iUserRepository {
  async findAllQuery<T>(query: T | any): Promise<iUser[]> {
    return users.find(query).exec();
  }

  async findOne<T>(query: T | any): Promise<iUser | null> {
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

  async create(body: iCreate, activationCode: string): Promise<iUser> {
    const data = new users();
    data.username = CleanInput.removeSpaces(body.username);
    data.fullName = CleanInput.clearExtraSpaces(body.fullName);
    data.email = body.email;
    if (body.numberPhone !== undefined) data.numberPhone = body.numberPhone;
    data.confidential.activationCode = activationCode;
    data.confidential.isActivated = body.isActivated ? true : false;
    data.country = body.country;
    data.countryCode = body.countryCode;
    data.setPassword(body.password);
    const result = await data.save();
    return result;
  }

  async checkDupKey<T>(query: T | any, select: string): Promise<iUser | null> {
    return await users.findOne(query).select(select).exec();
  }

  async updateOne<uid, T>(_id: uid | any, body: T | any): Promise<any> {
    const data = await users.updateOne({ _id: _id._id }, body, { new: true }).exec();
    return data;
  }

  async findOneAndUpdate<_id, T>(_id: _id | any, body: T | any): Promise<iUser | null> {
    return await users.findOneAndUpdate(_id, body, { new: true }).exec();
  }
}

export default new UserRepository();
