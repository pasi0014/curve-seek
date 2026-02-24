import { Database } from "bun:sqlite";
import { join } from "node:path";

const DB_PATH =
  process.env.DB_PATH ??
  join(import.meta.dir, "..", "..", "road-conditions.sqlite");
const db = new Database(DB_PATH, { create: true });

db.run("PRAGMA journal_mode = WAL");

db.run(`
  CREATE TABLE IF NOT EXISTS accelerometer_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp REAL NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    z REAL NOT NULL,
    speed REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS segment_roughness (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    iri_score REAL NOT NULL,
    sample_count INTEGER DEFAULT 1,
    last_updated TEXT DEFAULT (datetime('now'))
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS road_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    report_type TEXT NOT NULL,
    severity INTEGER NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.run(`CREATE INDEX IF NOT EXISTS idx_roughness_coords ON segment_roughness(lat, lng)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_readings_session ON accelerometer_readings(session_id)`);

db.run(`
  CREATE TABLE IF NOT EXISTS saved_routes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    origin_name TEXT NOT NULL,
    dest_name TEXT NOT NULL,
    origin_lat REAL NOT NULL,
    origin_lng REAL NOT NULL,
    dest_lat REAL NOT NULL,
    dest_lng REAL NOT NULL,
    geometry TEXT NOT NULL,
    distance_m REAL NOT NULL,
    duration_s REAL NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS route_stops (
    id TEXT PRIMARY KEY,
    route_id TEXT NOT NULL REFERENCES saved_routes(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    stop_type TEXT NOT NULL,
    name TEXT NOT NULL,
    note TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.run(`CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops(route_id, position)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_saved_routes_public ON saved_routes(is_public, created_at)`);

export function saveAccelerometerReadings(
  sessionId: string,
  readings: { timestamp: number; lat: number; lng: number; x: number; y: number; z: number; speed: number }[]
) {
  const stmt = db.prepare(
    `INSERT INTO accelerometer_readings (session_id, timestamp, lat, lng, x, y, z, speed)
     VALUES ($sessionId, $timestamp, $lat, $lng, $x, $y, $z, $speed)`
  );
  const tx = db.transaction(() => {
    for (const r of readings) {
      stmt.run({
        $sessionId: sessionId,
        $timestamp: r.timestamp,
        $lat: r.lat,
        $lng: r.lng,
        $x: r.x,
        $y: r.y,
        $z: r.z,
        $speed: r.speed,
      });
    }
  });
  tx();
}

export function saveSegmentRoughness(lat: number, lng: number, iri: number) {
  const gridLat = Math.round(lat * 2000) / 2000; // ~50m grid
  const gridLng = Math.round(lng * 2000) / 2000;

  const existing = db
    .prepare(
      `SELECT id, iri_score, sample_count FROM segment_roughness
       WHERE lat = ? AND lng = ?`
    )
    .get(gridLat, gridLng) as { id: number; iri_score: number; sample_count: number } | null;

  if (existing) {
    const newCount = existing.sample_count + 1;
    const newIri =
      (existing.iri_score * existing.sample_count + iri) / newCount;
    db.prepare(
      `UPDATE segment_roughness SET iri_score = ?, sample_count = ?, last_updated = datetime('now')
       WHERE id = ?`
    ).run(newIri, newCount, existing.id);
  } else {
    db.prepare(
      `INSERT INTO segment_roughness (lat, lng, iri_score) VALUES (?, ?, ?)`
    ).run(gridLat, gridLng, iri);
  }
}

export function getCrowdRoughness(
  lat: number,
  lng: number,
  radiusDeg = 0.005
): number | null {
  const rows = db
    .prepare(
      `SELECT iri_score, sample_count FROM segment_roughness
       WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?`
    )
    .all(
      lat - radiusDeg,
      lat + radiusDeg,
      lng - radiusDeg,
      lng + radiusDeg
    ) as { iri_score: number; sample_count: number }[];

  if (rows.length === 0) return null;

  const totalSamples = rows.reduce((s, r) => s + r.sample_count, 0);
  const weightedSum = rows.reduce(
    (s, r) => s + r.iri_score * r.sample_count,
    0
  );
  return weightedSum / totalSamples;
}

export function getCrowdScoresForSegments(
  segments: { index: number; lat: number; lng: number }[]
): Map<number, number> {
  const result = new Map<number, number>();
  for (const seg of segments) {
    const iri = getCrowdRoughness(seg.lat, seg.lng);
    if (iri !== null) {
      // Convert IRI to 0-100 score. IRI < 2 = excellent, > 8 = terrible
      const score = Math.max(0, Math.min(100, 100 - (iri - 1) * 14));
      result.set(seg.index, Math.round(score));
    }
  }
  return result;
}

export function saveRoadReport(
  lat: number,
  lng: number,
  type: string,
  severity: number,
  description?: string
) {
  db.prepare(
    `INSERT INTO road_reports (lat, lng, report_type, severity, description) VALUES (?, ?, ?, ?, ?)`
  ).run(lat, lng, type, severity, description ?? null);
}

// --- Saved Routes ---

export interface SavedRouteRow {
  id: string;
  name: string;
  description: string | null;
  origin_name: string;
  dest_name: string;
  origin_lat: number;
  origin_lng: number;
  dest_lat: number;
  dest_lng: number;
  geometry: string;
  distance_m: number;
  duration_s: number;
  is_public: number;
  created_at: string;
  updated_at: string;
}

export interface RouteStopRow {
  id: string;
  route_id: string;
  position: number;
  stop_type: string;
  name: string;
  note: string | null;
  lat: number;
  lng: number;
  created_at: string;
}

export function createSavedRoute(route: {
  id: string;
  name: string;
  description?: string;
  originName: string;
  destName: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  geometry: string;
  distanceM: number;
  durationS: number;
}): void {
  db.prepare(
    `INSERT INTO saved_routes (id, name, description, origin_name, dest_name, origin_lat, origin_lng, dest_lat, dest_lng, geometry, distance_m, duration_s)
     VALUES ($id, $name, $description, $originName, $destName, $originLat, $originLng, $destLat, $destLng, $geometry, $distanceM, $durationS)`
  ).run({
    $id: route.id,
    $name: route.name,
    $description: route.description ?? null,
    $originName: route.originName,
    $destName: route.destName,
    $originLat: route.originLat,
    $originLng: route.originLng,
    $destLat: route.destLat,
    $destLng: route.destLng,
    $geometry: route.geometry,
    $distanceM: route.distanceM,
    $durationS: route.durationS,
  });
}

export function getSavedRoute(id: string): SavedRouteRow | null {
  return db.prepare(`SELECT * FROM saved_routes WHERE id = ?`).get(id) as SavedRouteRow | null;
}

export function listSavedRoutes(
  limit: number,
  offset: number,
  search?: string
): { rows: (SavedRouteRow & { stop_count: number })[]; total: number } {
  const baseWhere = `WHERE is_public = 1${search ? ` AND (name LIKE $search OR origin_name LIKE $search OR dest_name LIKE $search)` : ""}`;
  const params: Record<string, any> = {};
  if (search) params.$search = `%${search}%`;

  const total = (
    db.prepare(`SELECT COUNT(*) as count FROM saved_routes ${baseWhere}`).get(params) as { count: number }
  ).count;

  const rows = db
    .prepare(
      `SELECT sr.*, COALESCE(sc.cnt, 0) as stop_count
       FROM saved_routes sr
       LEFT JOIN (SELECT route_id, COUNT(*) as cnt FROM route_stops GROUP BY route_id) sc ON sc.route_id = sr.id
       ${baseWhere}
       ORDER BY sr.created_at DESC
       LIMIT $limit OFFSET $offset`
    )
    .all({ ...params, $limit: limit, $offset: offset }) as (SavedRouteRow & { stop_count: number })[];

  return { rows, total };
}

export function updateSavedRoute(
  id: string,
  patch: Partial<{
    name: string;
    description: string;
    geometry: string;
    distanceM: number;
    durationS: number;
    destLat: number;
    destLng: number;
    destName: string;
  }>
): boolean {
  const sets: string[] = [];
  const params: Record<string, any> = { $id: id };

  if (patch.name !== undefined) { sets.push("name = $name"); params.$name = patch.name; }
  if (patch.description !== undefined) { sets.push("description = $description"); params.$description = patch.description; }
  if (patch.geometry !== undefined) { sets.push("geometry = $geometry"); params.$geometry = patch.geometry; }
  if (patch.distanceM !== undefined) { sets.push("distance_m = $distanceM"); params.$distanceM = patch.distanceM; }
  if (patch.durationS !== undefined) { sets.push("duration_s = $durationS"); params.$durationS = patch.durationS; }
  if (patch.destLat !== undefined) { sets.push("dest_lat = $destLat"); params.$destLat = patch.destLat; }
  if (patch.destLng !== undefined) { sets.push("dest_lng = $destLng"); params.$destLng = patch.destLng; }
  if (patch.destName !== undefined) { sets.push("dest_name = $destName"); params.$destName = patch.destName; }

  if (sets.length === 0) return false;
  sets.push("updated_at = datetime('now')");

  const result = db.prepare(`UPDATE saved_routes SET ${sets.join(", ")} WHERE id = $id`).run(params);
  return result.changes > 0;
}

export function deleteSavedRoute(id: string): boolean {
  const result = db.prepare(`DELETE FROM saved_routes WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function getRouteStops(routeId: string): RouteStopRow[] {
  return db
    .prepare(`SELECT * FROM route_stops WHERE route_id = ? ORDER BY position`)
    .all(routeId) as RouteStopRow[];
}

export function addRouteStop(stop: {
  id: string;
  routeId: string;
  position: number;
  stopType: string;
  name: string;
  note?: string;
  lat: number;
  lng: number;
}): void {
  db.prepare(
    `INSERT INTO route_stops (id, route_id, position, stop_type, name, note, lat, lng)
     VALUES ($id, $routeId, $position, $stopType, $name, $note, $lat, $lng)`
  ).run({
    $id: stop.id,
    $routeId: stop.routeId,
    $position: stop.position,
    $stopType: stop.stopType,
    $name: stop.name,
    $note: stop.note ?? null,
    $lat: stop.lat,
    $lng: stop.lng,
  });
}

export function updateRouteStop(
  stopId: string,
  patch: Partial<{ name: string; note: string; stopType: string; lat: number; lng: number }>
): boolean {
  const sets: string[] = [];
  const params: Record<string, any> = { $id: stopId };

  if (patch.name !== undefined) { sets.push("name = $name"); params.$name = patch.name; }
  if (patch.note !== undefined) { sets.push("note = $note"); params.$note = patch.note; }
  if (patch.stopType !== undefined) { sets.push("stop_type = $stopType"); params.$stopType = patch.stopType; }
  if (patch.lat !== undefined) { sets.push("lat = $lat"); params.$lat = patch.lat; }
  if (patch.lng !== undefined) { sets.push("lng = $lng"); params.$lng = patch.lng; }

  if (sets.length === 0) return false;

  const result = db.prepare(`UPDATE route_stops SET ${sets.join(", ")} WHERE id = $id`).run(params);
  return result.changes > 0;
}

export function deleteRouteStop(stopId: string): boolean {
  const result = db.prepare(`DELETE FROM route_stops WHERE id = ?`).run(stopId);
  return result.changes > 0;
}

export { db };
