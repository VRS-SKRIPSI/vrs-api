import { throws } from "assert";
import BaseRoute from "./BaseRoutes";
import StreamRoute from "./sub/StreamingRoute";
import UserRoute from "./sub/UserRoute";

class indexRoutes extends BaseRoute {
  /**
   * routes
   */
  public routes(): void {
    this.router.use("/user", UserRoute);
    this.router.use("/streaming", StreamRoute);
  }
}

export default new indexRoutes().router;
