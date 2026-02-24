import type { MiddlewareHandler } from "hono";
import { WideEvent } from "../logger.ts";

declare module "hono" {
  interface ContextVariableMap {
    event: WideEvent;
  }
}

export const wideEventMiddleware: MiddlewareHandler = async (c, next) => {
  const event = new WideEvent();
  event.set("method", c.req.method);
  event.set("path", c.req.path);
  event.set("user_agent", c.req.header("user-agent") ?? "");

  c.set("event", event);

  try {
    await next();
    event.set("status", c.res.status);
  } catch (err) {
    event.set("status", 500);
    event.set("error", err instanceof Error ? err.message : String(err));
    throw err;
  } finally {
    event.emit();
  }
};
