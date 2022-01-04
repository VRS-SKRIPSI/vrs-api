import countryController from "../controllers/countryController";
import BaseRoute from "./BaseRoutes";
import ChatRoutes from "./sub/ChatRoutes";
import UserRoute from "./sub/UserRoute";

class indexRoutes extends BaseRoute {
  /**
   * routes
   */
  public routes(): void {
    this.router.use("/user", UserRoute);
    this.router.use("/chat", ChatRoutes);
    this.router.get("/list-country", countryController.get);
  }
}

export default new indexRoutes().router;
