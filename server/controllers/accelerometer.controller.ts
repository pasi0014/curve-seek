import { Hono } from "hono";
import { processAccelerometerData } from "../services/accelerometer.service.ts";

const accelerometer = new Hono();

accelerometer.post("/", async (c) => {
  const body = await c.req.json();
  const { sessionId, readings } = body;

  const event = c.get("event");
  const result = processAccelerometerData({ sessionId, readings }, event);
  return c.json(result);
});

export default accelerometer;
