import BaseRoute from "./BaseRoutes";

class indexRoutes extends BaseRoute {
  /**
   * routes
   */
  public routes(): void {
    this.router.use("/auth", (req, res) => {
      console.log(req);
    });
  }
}

export default new indexRoutes().router;
