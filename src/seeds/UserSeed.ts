import { eRoles } from "../models/users";
import UserRepository from "../repositorys/UserRepository";

class UserSeed {
  constructor() {
    this.createAccountDev();
  }

  private async createAccountDev(): Promise<boolean> {
    const body = {
      username: "apuystereo717",
      fullName: "apuy stereo",
      email: "abdulgopur2306@gmail.com",
      numberPhone: "08980354641",
      password: "password717",
    };

    try {
      const data = await UserRepository.create(body, eRoles.dev, "000001");
      console.log(`[Success create account dev] ${data}`);
      return true;
    } catch (err: any) {
      if (err?.message.includes("username_1")) {
        console.log(`[Success replace account dev]`);
        return true;
      }
      console.log(`[Failed create account dev] = ${err}`);
      return false;
    }
  }
}

export default UserSeed;
