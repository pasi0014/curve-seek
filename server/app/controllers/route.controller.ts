import { Hono } from "hono";
import { analyzeRoute } from "../services/route.service.ts";

const route = new Hono();

route.post("/", async (c) => {
  const body = await c.req.json();
  const { startLat, startLng, endLat, endLng, origin, destination, waypoints } = body;

  const event = c.get("event");
  const result = await analyzeRoute(
    { startLat, startLng, endLat, endLng, origin, destination, waypoints },
    event
  );

  return c.json(result);
});

export default route;
