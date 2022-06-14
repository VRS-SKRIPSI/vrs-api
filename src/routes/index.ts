import countryController from "./../controllers/CountryController";
import BaseRoute from "./BaseRoutes";
import ChatRoutes from "./sub/ChatRoutes";
import UserRoute from "./sub/UserRoute";

class indexRoutes extends BaseRoute {
  /**
   * routes
   */
  public routes(): void {
    this.router.get("/server-status", (req, res) => {
      return res.status(200).send({ statusCode: res.statusCode, msg: "OK", err: null, desc: "server running.." });
    });
    this.router.use("/user", UserRoute);
    this.router.use("/chat", ChatRoutes);
    this.router.get("/list-country", countryController.get);
  }
}

export default new indexRoutes().router;
