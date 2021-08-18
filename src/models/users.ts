import { Document, model, Schema } from "mongoose";
import { randomBytes, pbkdf2Sync } from "crypto";

export enum eRoles {
  dev = "dev",
  admin = "admin",
  user = "user",
}

interface iConfidential {
  password: String;
  salt: String;
  isActivated: boolean;
  activationCode: String;
  activatedAt: Date;
  linkResetPassword: String;
}

export interface iUser extends Document {
  username: String;
  fullName: String;
  email: String;
  numberPhone: String;
  photo_profile?: String;
  roles: String;
  confidential: iConfidential;
  setPassword(password: String): void;
  validPassword(password: String): boolean;
  toWrap(): any;
}

//schema mongodb
const userSchema = new Schema<iUser>(
  {
    username: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    numberPhone: { type: String, default: null },
    photo_profile: { type: String, default: null },
    roles: { type: String, required: true, default: eRoles.admin },
    confidential: {
      password: { type: String, required: true },
      salt: { type: String, required: true },
      isActivated: { type: Boolean, required: true, default: false },
      activationCode: { type: String, required: true, unique: true },
      activatedAt: { type: Date },
      linkResetPassword: { type: String, default: null },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.confidential;
      },
    },
  }
);

// Method to set salt and hash the password for a user
userSchema.methods.setPassword = function (password: string) {
  this.confidential.salt = randomBytes(16).toString("hex");
  this.confidential.password = pbkdf2Sync(password, `${this.confidential.salt}`, 1000, 64, `sha512`).toString(`hex`);
};

// Method to check the entered password is correct or not
userSchema.methods.validPassword = function (password: string): boolean {
  var password = pbkdf2Sync(password, `${this.confidential.salt}`, 1000, 64, `sha512`).toString(`hex`);
  return this.confidential.password === password;
};

userSchema.methods.toWrap = function () {
  const data = {
    username: this.username,
    fullName: this.fullName,
    email: this.email,
    numberPhone: this.numberPhone,
    photo_profile: this.photo_profile,
    roles: this.roles,
  };

  return data;
};

export default model<iUser>("users", userSchema);
