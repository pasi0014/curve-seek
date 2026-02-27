import type { Hono } from "hono";
import routeController from "../app/controllers/route.controller.ts";
import geocodingController from "../app/controllers/geocoding.controller.ts";
import accelerometerController from "../app/controllers/accelerometer.controller.ts";
import savedRoutesController from "../app/controllers/saved-routes.controller.ts";
import discoverController from "../app/controllers/discover.controller.ts";

export function registerApiRoutes(app: Hono): void {
  app.route("/api/route", routeController);
  app.route("/api/geocode", geocodingController);
  app.route("/api/accelerometer", accelerometerController);
  app.route("/api/saved-routes", savedRoutesController);
  app.route("/api/discover", discoverController);
}
