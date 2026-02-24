import type { WideEvent } from "../logger.ts";
import {
  createSavedRoute,
  getSavedRoute,
  listSavedRoutes,
  updateSavedRoute,
  deleteSavedRoute,
  getRouteStops,
  addRouteStop,
  updateRouteStop,
  deleteRouteStop,
} from "../lib/db.ts";

export function create(
  input: {
    name: string;
    description?: string;
    originName: string;
    destName: string;
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    geometry: [number, number][];
    distanceM: number;
    durationS: number;
  },
  event: WideEvent
): { id: string } {
  const id = crypto.randomUUID();
  createSavedRoute({
    id,
    name: input.name,
    description: input.description,
    originName: input.originName,
    destName: input.destName,
    originLat: input.originLat,
    originLng: input.originLng,
    destLat: input.destLat,
    destLng: input.destLng,
    geometry: JSON.stringify(input.geometry),
    distanceM: input.distanceM,
    durationS: input.durationS,
  });
  event.set("saved_route_id", id);
  return { id };
}

export function getById(id: string, event: WideEvent) {
  const route = getSavedRoute(id);
  if (!route) return null;

  const stops = getRouteStops(id);
  event.set("saved_route_id", id);
  event.set("stop_count", stops.length);

  return {
    id: route.id,
    name: route.name,
    description: route.description,
    originName: route.origin_name,
    destName: route.dest_name,
    originLat: route.origin_lat,
    originLng: route.origin_lng,
    destLat: route.dest_lat,
    destLng: route.dest_lng,
    geometry: JSON.parse(route.geometry),
    distanceM: route.distance_m,
    durationS: route.duration_s,
    isPublic: route.is_public === 1,
    createdAt: route.created_at,
    updatedAt: route.updated_at,
    stops: stops.map((s) => ({
      id: s.id,
      position: s.position,
      stopType: s.stop_type,
      name: s.name,
      note: s.note,
      lat: s.lat,
      lng: s.lng,
    })),
  };
}

export function list(limit: number, offset: number, search: string | undefined, event: WideEvent) {
  const { rows, total } = listSavedRoutes(limit, offset, search);
  event.set("saved_routes_total", total);
  event.set("saved_routes_returned", rows.length);

  return {
    routes: rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      originName: r.origin_name,
      destName: r.dest_name,
      distanceM: r.distance_m,
      stopCount: r.stop_count,
      createdAt: r.created_at,
    })),
    total,
  };
}

export function update(
  id: string,
  patch: Parameters<typeof updateSavedRoute>[1],
  event: WideEvent
): boolean {
  event.set("saved_route_id", id);
  return updateSavedRoute(id, patch);
}

export function remove(id: string, event: WideEvent): boolean {
  event.set("saved_route_id", id);
  return deleteSavedRoute(id);
}

export function addStop(
  routeId: string,
  input: {
    stopType: string;
    name: string;
    note?: string;
    lat: number;
    lng: number;
    position?: number;
  },
  event: WideEvent
) {
  // If no position given, append after existing stops
  const existing = getRouteStops(routeId);
  const position = input.position ?? existing.length;

  const id = crypto.randomUUID();
  addRouteStop({
    id,
    routeId,
    position,
    stopType: input.stopType,
    name: input.name,
    note: input.note,
    lat: input.lat,
    lng: input.lng,
  });

  event.set("saved_route_id", routeId);
  event.set("stop_id", id);
  return { id, position };
}

export function editStop(
  stopId: string,
  patch: Parameters<typeof updateRouteStop>[1],
  event: WideEvent
): boolean {
  event.set("stop_id", stopId);
  return updateRouteStop(stopId, patch);
}

export function removeStop(stopId: string, event: WideEvent): boolean {
  event.set("stop_id", stopId);
  return deleteRouteStop(stopId);
}
