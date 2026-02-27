import { loadConfig } from "./config/index.ts";
import { Server } from "./bootstrap/server.ts";

// 1. Load and validate configuration
const config = loadConfig();

// 2. Construct the server
const server = new Server(config);

// 3. Start listening
server.start();

// 4. Graceful shutdown
function shutdown() {
  console.log("\nShutting down...");
  server.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
