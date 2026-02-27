import { Hono } from "hono";
import { discoverFunRoads } from "../services/discover.service.ts";

const discover = new Hono();

discover.get("/", async (c) => {
  const lat = parseFloat(c.req.query("lat") ?? "");
  const lng = parseFloat(c.req.query("lng") ?? "");
  const radiusKm = Math.min(
    100,
    Math.max(1, parseFloat(c.req.query("radiusKm") ?? "50"))
  );

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return c.json({ error: "Invalid lat/lng parameters" }, 400);
  }

  const event = c.get("event");
  const result = await discoverFunRoads({ lat, lng, radiusKm }, event);

  return c.json(result);
});

export default discover;
