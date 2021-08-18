import BaseRoute from "./BaseRoutes";
import UserRoute from "./sub/UserRoute";

class indexRoutes extends BaseRoute {
  /**
   * routes
   */
  public routes(): void {
    this.router.use("/user", UserRoute);
  }
}

export default new indexRoutes().router;
