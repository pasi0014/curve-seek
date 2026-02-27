import { eq, and, between, like, or, sql, count, desc } from "drizzle-orm";
import { db } from "../db";
import {
  accelerometerReadings,
  segmentRoughness,
  roadReports,
  savedRoutes,
  routeStops,
} from "../db/schema";

// --- Accelerometer ---

export async function saveAccelerometerReadings(
  sessionId: string,
  readings: { timestamp: number; lat: number; lng: number; x: number; y: number; z: number; speed: number }[]
) {
  await db.insert(accelerometerReadings).values(
    readings.map((r) => ({
      sessionId,
      timestamp: r.timestamp,
      lat: r.lat,
      lng: r.lng,
      x: r.x,
      y: r.y,
      z: r.z,
      speed: r.speed,
    }))
  );
}

export async function saveSegmentRoughness(lat: number, lng: number, iri: number) {
  const gridLat = Math.round(lat * 2000) / 2000; // ~50m grid
  const gridLng = Math.round(lng * 2000) / 2000;

  const existing = await db
    .select({
      id: segmentRoughness.id,
      iriScore: segmentRoughness.iriScore,
      sampleCount: segmentRoughness.sampleCount,
    })
    .from(segmentRoughness)
    .where(and(eq(segmentRoughness.lat, gridLat), eq(segmentRoughness.lng, gridLng)))
    .limit(1);

  if (existing.length > 0) {
    const row = existing[0];
    const oldCount = row.sampleCount ?? 1;
    const newCount = oldCount + 1;
    const newIri = (row.iriScore * oldCount + iri) / newCount;
    await db
      .update(segmentRoughness)
      .set({ iriScore: newIri, sampleCount: newCount, lastUpdated: new Date() })
      .where(eq(segmentRoughness.id, row.id));
  } else {
    await db.insert(segmentRoughness).values({ lat: gridLat, lng: gridLng, iriScore: iri });
  }
}

export async function getCrowdRoughness(
  lat: number,
  lng: number,
  radiusDeg = 0.005
): Promise<number | null> {
  const rows = await db
    .select({
      iriScore: segmentRoughness.iriScore,
      sampleCount: segmentRoughness.sampleCount,
    })
    .from(segmentRoughness)
    .where(
      and(
        between(segmentRoughness.lat, lat - radiusDeg, lat + radiusDeg),
        between(segmentRoughness.lng, lng - radiusDeg, lng + radiusDeg)
      )
    );

  if (rows.length === 0) return null;

  const totalSamples = rows.reduce((s, r) => s + (r.sampleCount ?? 1), 0);
  const weightedSum = rows.reduce((s, r) => s + r.iriScore * (r.sampleCount ?? 1), 0);
  return weightedSum / totalSamples;
}

export async function getCrowdScoresForSegments(
  segments: { index: number; lat: number; lng: number }[]
): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  for (const seg of segments) {
    const iri = await getCrowdRoughness(seg.lat, seg.lng);
    if (iri !== null) {
      const score = Math.max(0, Math.min(100, 100 - (iri - 1) * 14));
      result.set(seg.index, Math.round(score));
    }
  }
  return result;
}

// --- Road Reports ---

export async function saveRoadReport(
  lat: number,
  lng: number,
  type: string,
  severity: number,
  description?: string
) {
  await db.insert(roadReports).values({
    lat,
    lng,
    reportType: type,
    severity,
    description: description ?? null,
  });
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
  is_public: boolean;
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

export async function createSavedRoute(route: {
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
}): Promise<void> {
  await db.insert(savedRoutes).values({
    id: route.id,
    name: route.name,
    description: route.description ?? null,
    originName: route.originName,
    destName: route.destName,
    originLat: route.originLat,
    originLng: route.originLng,
    destLat: route.destLat,
    destLng: route.destLng,
    geometry: route.geometry,
    distanceM: route.distanceM,
    durationS: route.durationS,
  });
}

export async function getSavedRoute(id: string): Promise<SavedRouteRow | null> {
  const rows = await db.select().from(savedRoutes).where(eq(savedRoutes.id, id)).limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    origin_name: r.originName,
    dest_name: r.destName,
    origin_lat: r.originLat,
    origin_lng: r.originLng,
    dest_lat: r.destLat,
    dest_lng: r.destLng,
    geometry: r.geometry,
    distance_m: r.distanceM,
    duration_s: r.durationS,
    is_public: r.isPublic,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  };
}

export async function listSavedRoutes(
  limit: number,
  offset: number,
  search?: string
): Promise<{ rows: (SavedRouteRow & { stop_count: number })[]; total: number }> {
  const conditions = [eq(savedRoutes.isPublic, true)];
  if (search) {
    conditions.push(
      or(
        like(savedRoutes.name, `%${search}%`),
        like(savedRoutes.originName, `%${search}%`),
        like(savedRoutes.destName, `%${search}%`)
      )!
    );
  }
  const whereClause = and(...conditions);

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(savedRoutes)
    .where(whereClause);
  const total = totalResult[0].count;

  // Get rows with stop count via subquery
  const stopCountSq = db
    .select({
      routeId: routeStops.routeId,
      cnt: count().as("cnt"),
    })
    .from(routeStops)
    .groupBy(routeStops.routeId)
    .as("sc");

  const rows = await db
    .select({
      id: savedRoutes.id,
      name: savedRoutes.name,
      description: savedRoutes.description,
      originName: savedRoutes.originName,
      destName: savedRoutes.destName,
      originLat: savedRoutes.originLat,
      originLng: savedRoutes.originLng,
      destLat: savedRoutes.destLat,
      destLng: savedRoutes.destLng,
      geometry: savedRoutes.geometry,
      distanceM: savedRoutes.distanceM,
      durationS: savedRoutes.durationS,
      isPublic: savedRoutes.isPublic,
      createdAt: savedRoutes.createdAt,
      updatedAt: savedRoutes.updatedAt,
      stopCount: sql<number>`COALESCE(${stopCountSq.cnt}, 0)`.as("stop_count"),
    })
    .from(savedRoutes)
    .leftJoin(stopCountSq, eq(stopCountSq.routeId, savedRoutes.id))
    .where(whereClause)
    .orderBy(desc(savedRoutes.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      origin_name: r.originName,
      dest_name: r.destName,
      origin_lat: r.originLat,
      origin_lng: r.originLng,
      dest_lat: r.destLat,
      dest_lng: r.destLng,
      geometry: r.geometry,
      distance_m: r.distanceM,
      duration_s: r.durationS,
      is_public: r.isPublic,
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
      stop_count: r.stopCount ?? 0,
    })),
    total,
  };
}

export async function updateSavedRoute(
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
): Promise<boolean> {
  const sets: Record<string, any> = {};

  if (patch.name !== undefined) sets.name = patch.name;
  if (patch.description !== undefined) sets.description = patch.description;
  if (patch.geometry !== undefined) sets.geometry = patch.geometry;
  if (patch.distanceM !== undefined) sets.distanceM = patch.distanceM;
  if (patch.durationS !== undefined) sets.durationS = patch.durationS;
  if (patch.destLat !== undefined) sets.destLat = patch.destLat;
  if (patch.destLng !== undefined) sets.destLng = patch.destLng;
  if (patch.destName !== undefined) sets.destName = patch.destName;

  if (Object.keys(sets).length === 0) return false;
  sets.updatedAt = new Date();

  const result = await db.update(savedRoutes).set(sets).where(eq(savedRoutes.id, id));
  return (result as any).rowCount > 0;
}

export async function deleteSavedRoute(id: string): Promise<boolean> {
  const result = await db.delete(savedRoutes).where(eq(savedRoutes.id, id));
  return (result as any).rowCount > 0;
}

export async function getRouteStops(routeId: string): Promise<RouteStopRow[]> {
  const rows = await db
    .select()
    .from(routeStops)
    .where(eq(routeStops.routeId, routeId))
    .orderBy(routeStops.position);

  return rows.map((r) => ({
    id: r.id,
    route_id: r.routeId,
    position: r.position,
    stop_type: r.stopType,
    name: r.name,
    note: r.note,
    lat: r.lat,
    lng: r.lng,
    created_at: r.createdAt.toISOString(),
  }));
}

export async function addRouteStop(stop: {
  id: string;
  routeId: string;
  position: number;
  stopType: string;
  name: string;
  note?: string;
  lat: number;
  lng: number;
}): Promise<void> {
  await db.insert(routeStops).values({
    id: stop.id,
    routeId: stop.routeId,
    position: stop.position,
    stopType: stop.stopType,
    name: stop.name,
    note: stop.note ?? null,
    lat: stop.lat,
    lng: stop.lng,
  });
}

export async function updateRouteStop(
  stopId: string,
  patch: Partial<{ name: string; note: string; stopType: string; lat: number; lng: number }>
): Promise<boolean> {
  const sets: Record<string, any> = {};

  if (patch.name !== undefined) sets.name = patch.name;
  if (patch.note !== undefined) sets.note = patch.note;
  if (patch.stopType !== undefined) sets.stopType = patch.stopType;
  if (patch.lat !== undefined) sets.lat = patch.lat;
  if (patch.lng !== undefined) sets.lng = patch.lng;

  if (Object.keys(sets).length === 0) return false;

  const result = await db.update(routeStops).set(sets).where(eq(routeStops.id, stopId));
  return (result as any).rowCount > 0;
}

export async function deleteRouteStop(stopId: string): Promise<boolean> {
  const result = await db.delete(routeStops).where(eq(routeStops.id, stopId));
  return (result as any).rowCount > 0;
}
