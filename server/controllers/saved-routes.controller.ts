import { Hono } from "hono";
import * as savedRoutes from "../services/saved-routes.service.ts";

const app = new Hono();

// Create a saved route
app.post("/", async (c) => {
  const body = await c.req.json();
  const { name, description, originName, destName, originLat, originLng, destLat, destLng, geometry, distanceM, durationS } = body;

  if (!name || !originName || !destName || !geometry) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const event = c.get("event");
  const result = savedRoutes.create(
    { name, description, originName, destName, originLat, originLng, destLat, destLng, geometry, distanceM, durationS },
    event
  );
  return c.json(result, 201);
});

// List public routes
app.get("/", (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20"), 100);
  const offset = parseInt(c.req.query("offset") ?? "0");
  const q = c.req.query("q") || undefined;

  const event = c.get("event");
  return c.json(savedRoutes.list(limit, offset, q, event));
});

// Get a single route
app.get("/:id", (c) => {
  const event = c.get("event");
  const route = savedRoutes.getById(c.req.param("id"), event);
  if (!route) return c.json({ error: "Route not found" }, 404);
  return c.json(route);
});

// Update a route
app.patch("/:id", async (c) => {
  const body = await c.req.json();
  const event = c.get("event");

  const patch: Record<string, any> = {};
  for (const key of ["name", "description", "geometry", "distanceM", "durationS", "destLat", "destLng", "destName"]) {
    if (body[key] !== undefined) patch[key] = key === "geometry" ? JSON.stringify(body[key]) : body[key];
  }

  const updated = savedRoutes.update(c.req.param("id"), patch, event);
  if (!updated) return c.json({ error: "Route not found or no changes" }, 404);
  return c.json({ ok: true });
});

// Delete a route
app.delete("/:id", (c) => {
  const event = c.get("event");
  const deleted = savedRoutes.remove(c.req.param("id"), event);
  if (!deleted) return c.json({ error: "Route not found" }, 404);
  return c.json({ ok: true });
});

// Add a stop
app.post("/:id/stops", async (c) => {
  const body = await c.req.json();
  const { stopType, name, note, lat, lng, position } = body;

  if (!stopType || !name || lat == null || lng == null) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const event = c.get("event");
  const result = savedRoutes.addStop(c.req.param("id"), { stopType, name, note, lat, lng, position }, event);
  return c.json(result, 201);
});

// Edit a stop
app.patch("/:id/stops/:stopId", async (c) => {
  const body = await c.req.json();
  const event = c.get("event");

  const patch: Record<string, any> = {};
  for (const key of ["name", "note", "stopType", "lat", "lng"]) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  const updated = savedRoutes.editStop(c.req.param("stopId"), patch, event);
  if (!updated) return c.json({ error: "Stop not found or no changes" }, 404);
  return c.json({ ok: true });
});

// Delete a stop
app.delete("/:id/stops/:stopId", (c) => {
  const event = c.get("event");
  const deleted = savedRoutes.removeStop(c.req.param("stopId"), event);
  if (!deleted) return c.json({ error: "Stop not found" }, 404);
  return c.json({ ok: true });
});

export default app;
