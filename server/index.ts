import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { wideEventMiddleware } from "./middleware/wide-event.ts";
import routeController from "./controllers/route.controller.ts";
import geocodingController from "./controllers/geocoding.controller.ts";
import accelerometerController from "./controllers/accelerometer.controller.ts";
import savedRoutesController from "./controllers/saved-routes.controller.ts";
import discoverController from "./controllers/discover.controller.ts";

const app = new Hono();

// Wide event logging for all API routes
app.use("/api/*", wideEventMiddleware);

// Error handling
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: err.message }, 500);
});

// Mount controllers
app.route("/api/route", routeController);
app.route("/api/geocode", geocodingController);
app.route("/api/accelerometer", accelerometerController);
app.route("/api/saved-routes", savedRoutesController);
app.route("/api/discover", discoverController);

// In production, serve the built client files
app.use("/*", serveStatic({ root: "./client/dist" }));
app.use("/*", serveStatic({ root: "./client/dist", path: "/index.html" }));

const server = Bun.serve({
  port: 3000,
  fetch: app.fetch,
});

console.log(`Server running at http://localhost:${server.port}`);
