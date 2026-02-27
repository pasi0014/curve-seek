import {
  pgTable,
  serial,
  text,
  doublePrecision,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const accelerometerReadings = pgTable(
  "accelerometer_readings",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    timestamp: doublePrecision("timestamp").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    x: doublePrecision("x").notNull(),
    y: doublePrecision("y").notNull(),
    z: doublePrecision("z").notNull(),
    speed: doublePrecision("speed").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_readings_session").on(table.sessionId)]
);

export const segmentRoughness = pgTable(
  "segment_roughness",
  {
    id: serial("id").primaryKey(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    iriScore: doublePrecision("iri_score").notNull(),
    sampleCount: integer("sample_count").default(1),
    lastUpdated: timestamp("last_updated").defaultNow(),
  },
  (table) => [index("idx_roughness_coords").on(table.lat, table.lng)]
);

export const roadReports = pgTable("road_reports", {
  id: serial("id").primaryKey(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  reportType: text("report_type").notNull(),
  severity: integer("severity").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedRoutes = pgTable(
  "saved_routes",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    originName: text("origin_name").notNull(),
    destName: text("dest_name").notNull(),
    originLat: doublePrecision("origin_lat").notNull(),
    originLng: doublePrecision("origin_lng").notNull(),
    destLat: doublePrecision("dest_lat").notNull(),
    destLng: doublePrecision("dest_lng").notNull(),
    geometry: text("geometry").notNull(),
    distanceM: doublePrecision("distance_m").notNull(),
    durationS: doublePrecision("duration_s").notNull(),
    isPublic: boolean("is_public").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("idx_saved_routes_public").on(table.isPublic, table.createdAt)]
);

export const routeStops = pgTable(
  "route_stops",
  {
    id: text("id").primaryKey(),
    routeId: text("route_id")
      .notNull()
      .references(() => savedRoutes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    stopType: text("stop_type").notNull(),
    name: text("name").notNull(),
    note: text("note"),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_route_stops_route").on(table.routeId, table.position)]
);
