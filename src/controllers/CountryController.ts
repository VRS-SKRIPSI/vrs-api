import { Request, Response } from "express";
import listCountrys from "../models/listCountrys";

interface iCountryController {
  get(req: Request, res: Response): Promise<Response>;
}

class CountryController implements iCountryController {
  async get(req: Request, res: Response): Promise<Response> {
    return await listCountrys
      .find({})
      .select("code name")
      .then((result) => {
        const data = result.map((i) => {
          return {
            value: i.code,
            label: i.name,
          };
        });
        return res.status(200).send({ status: 200, msg: "Success get country.!", err: null, data: data });
      })
      .catch((err) => {
        return res.status(400).send({ status: 400, msg: "Failed get country.!", err: "something went wrong.!", data: null });
      });
  }
}

export default new CountryController();
