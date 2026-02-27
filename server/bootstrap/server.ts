import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import type { AppConfig } from "../config/index.ts";
import { wideEventMiddleware } from "../app/middleware/wide-event.ts";
import { registerApiRoutes } from "../routes/api.ts";

export class Server {
  private app: Hono;
  private server: ReturnType<typeof Bun.serve> | null = null;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.app = new Hono();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupStaticFiles();
  }

  private setupMiddleware(): void {
    this.app.use("/api/*", wideEventMiddleware);
  }

  private setupRoutes(): void {
    registerApiRoutes(this.app);
  }

  private setupErrorHandling(): void {
    this.app.onError((err, c) => {
      console.error("Unhandled error:", err);
      return c.json({ error: err.message }, 500);
    });
  }

  private setupStaticFiles(): void {
    this.app.use("/*", serveStatic({ root: this.config.clientDistPath }));
    this.app.use(
      "/*",
      serveStatic({ root: this.config.clientDistPath, path: "/index.html" })
    );
  }

  start(): void {
    this.server = Bun.serve({
      port: this.config.port,
      fetch: this.app.fetch,
    });
    console.log(
      `Server running at http://localhost:${this.server.port} [${this.config.env}]`
    );
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
      console.log("Server stopped.");
      this.server = null;
    }
  }
}
