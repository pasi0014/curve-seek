import { Hono } from "hono";
import { geocodeQuery } from "../services/geocoding.service.ts";

const geocoding = new Hono();

geocoding.get("/", async (c) => {
  const query = c.req.query("q");
  if (!query) {
    return c.json({ error: "Missing q param" }, 400);
  }

  const event = c.get("event");
  const results = await geocodeQuery(query, event);
  return c.json(results);
});

export default geocoding;
