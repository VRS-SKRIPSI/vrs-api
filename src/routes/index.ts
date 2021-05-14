import BaseRoute from "./BaseRoutes";

class indexRoutes extends BaseRoute {
  /**
   * routes
   */
  public routes(): void {
    this.router.get("/", (req, res) => {
      res.status(200).send({ status: true, msg: "Success.!" });
    });
  }
}

export default new indexRoutes().router;
