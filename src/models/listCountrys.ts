import { Document, model, Schema } from "mongoose";

export interface iListCountry extends Document {
  code: String;
  name: String;
}

const listCountrySchema = new Schema<iListCountry>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true, versionKey: false }
);

export default model<iListCountry>("listCountrys", listCountrySchema);
