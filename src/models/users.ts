import { Document, model, Schema } from "mongoose";
import { randomBytes, pbkdf2Sync } from "crypto";

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
  photoProfile?: String;
  confidential: iConfidential;
  country: String;
  countryCode: String;
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
    photoProfile: { type: String, default: null },
    country: { type: String, default: null },
    countryCode: { type: String, default: null },
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
    photo_profile: this.photoProfile,
    country: this.country,
    countryCode: this.countryCode,
  };

  return data;
};

export default model<iUser>("users", userSchema);
