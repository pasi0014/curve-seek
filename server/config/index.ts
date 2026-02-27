export interface AppConfig {
  env: "development" | "production";
  port: number;
  database: {
    url: string;
  };
  ors: {
    apiKey: string;
  };
  clientDistPath: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadConfig(): AppConfig {
  const env = (process.env.NODE_ENV ?? "development") as AppConfig["env"];

  const config: AppConfig = {
    env,
    port: parseInt(process.env.PORT ?? "3000", 10),
    database: {
      url: requireEnv("DATABASE_URL"),
    },
    ors: {
      apiKey: process.env.ORS_API_KEY ?? "",
    },
    clientDistPath: "./client/dist",
  };

  return Object.freeze(config);
}
