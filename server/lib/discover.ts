import type { Coordinate, DiscoveredRoad } from "./types.ts";
import type { OverpassWay } from "./overpass.ts";
import { surfaceToScore, smoothnessToScore } from "./overpass.ts";
import { haversineDistance } from "./segments.ts";
import {
  analyzeCurvature,
  scoreCurvature,
  scoreRoadCharacter,
  computeEnthusiastScore,
} from "./enthusiast.ts";

export interface WayGroup {
  name: string;
  highwayType: string;
  ways: OverpassWay[];
  coords: Coordinate[];
  tags: {
    surface: string | null;
    smoothness: string | null;
    maxspeed: string | null;
    lanes: string | null;
  };
  lengthMeters: number;
}

/**
 * Groups raw Overpass ways into logical roads by name + highway type.
 * Unnamed roads are grouped by spatial proximity (~1km grid cells).
 */
export function groupWaysIntoRoads(ways: OverpassWay[]): WayGroup[] {
  const namedGroups = new Map<string, OverpassWay[]>();
  const unnamedWays: OverpassWay[] = [];

  for (const way of ways) {
    if (!way.geometry || way.geometry.length < 2) continue;
    const name = way.tags.name;
    const hw = way.tags.highway || "unclassified";

    if (name) {
      const key = `${name}::${hw}`;
      const existing = namedGroups.get(key);
      if (existing) {
        existing.push(way);
      } else {
        namedGroups.set(key, [way]);
      }
    } else {
      unnamedWays.push(way);
    }
  }

  // Group unnamed ways by spatial grid (~1km cells)
  const gridSize = 0.009; // ~1km in degrees
  const unnamedGroups = new Map<string, OverpassWay[]>();
  for (const way of unnamedWays) {
    const firstNode = way.geometry![0]!;
    const hw = way.tags.highway || "unclassified";
    const gridKey = `unnamed::${hw}::${Math.floor(firstNode.lat / gridSize)}::${Math.floor(firstNode.lon / gridSize)}`;
    const existing = unnamedGroups.get(gridKey);
    if (existing) {
      existing.push(way);
    } else {
      unnamedGroups.set(gridKey, [way]);
    }
  }

  const groups: WayGroup[] = [];

  for (const [key, groupWays] of namedGroups) {
    const [name, hw] = key.split("::");
    groups.push(buildWayGroup(name!, hw!, groupWays));
  }

  for (const [key, groupWays] of unnamedGroups) {
    const parts = key.split("::");
    const hw = parts[1]!;
    groups.push(buildWayGroup("Unnamed Road", hw, groupWays));
  }

  return groups;
}

function buildWayGroup(
  name: string,
  highwayType: string,
  ways: OverpassWay[]
): WayGroup {
  // Chain way geometries using greedy nearest-neighbor
  const coords = chainGeometries(ways);
  const lengthMeters = computePolylineLength(coords);

  // Aggregate tags by most common value
  const tags = aggregateTags(ways);

  return { name, highwayType, ways, coords, tags, lengthMeters };
}

function chainGeometries(ways: OverpassWay[]): Coordinate[] {
  if (ways.length === 1) {
    return ways[0]!.geometry!.map((n) => ({ lat: n.lat, lng: n.lon }));
  }

  // Convert each way to a coordinate array
  const segments = ways.map((w) =>
    w.geometry!.map((n) => ({ lat: n.lat, lng: n.lon }))
  );

  // Greedy nearest-neighbor chaining
  const used = new Set<number>();
  const result: Coordinate[] = [...segments[0]!];
  used.add(0);

  while (used.size < segments.length) {
    const tail = result[result.length - 1]!;
    const head = result[0]!;
    let bestIdx = -1;
    let bestDist = Infinity;
    let bestReverse = false;
    let bestAppend = true; // true = append to tail, false = prepend to head

    for (let i = 0; i < segments.length; i++) {
      if (used.has(i)) continue;
      const seg = segments[i]!;
      const segHead = seg[0]!;
      const segTail = seg[seg.length - 1]!;

      // Try appending (tail -> seg head)
      const d1 = quickDist(tail, segHead);
      if (d1 < bestDist) {
        bestDist = d1;
        bestIdx = i;
        bestReverse = false;
        bestAppend = true;
      }
      // Try appending reversed (tail -> seg tail)
      const d2 = quickDist(tail, segTail);
      if (d2 < bestDist) {
        bestDist = d2;
        bestIdx = i;
        bestReverse = true;
        bestAppend = true;
      }
      // Try prepending (head -> seg tail)
      const d3 = quickDist(head, segTail);
      if (d3 < bestDist) {
        bestDist = d3;
        bestIdx = i;
        bestReverse = false;
        bestAppend = false;
      }
      // Try prepending reversed (head -> seg head)
      const d4 = quickDist(head, segHead);
      if (d4 < bestDist) {
        bestDist = d4;
        bestIdx = i;
        bestReverse = true;
        bestAppend = false;
      }
    }

    if (bestIdx === -1) break;
    used.add(bestIdx);

    let seg = segments[bestIdx]!;
    if (bestReverse) seg = [...seg].reverse();

    if (bestAppend) {
      result.push(...seg);
    } else {
      result.unshift(...seg);
    }
  }

  return result;
}

function quickDist(a: Coordinate, b: Coordinate): number {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return dLat * dLat + dLng * dLng;
}

function computePolylineLength(coords: Coordinate[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversineDistance(coords[i - 1]!, coords[i]!);
  }
  return total;
}

function aggregateTags(ways: OverpassWay[]): WayGroup["tags"] {
  function mostCommon(key: string): string | null {
    const counts = new Map<string, number>();
    for (const w of ways) {
      const val = w.tags[key];
      if (val) counts.set(val, (counts.get(val) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestCount = 0;
    for (const [val, count] of counts) {
      if (count > bestCount) {
        best = val;
        bestCount = count;
      }
    }
    return best;
  }

  return {
    surface: mostCommon("surface"),
    smoothness: mostCommon("smoothness"),
    maxspeed: mostCommon("maxspeed"),
    lanes: mostCommon("lanes"),
  };
}

/**
 * Score a way group using the existing enthusiast pipeline.
 * Returns null if the group fails hard gates:
 * - Must be >= 2km long
 * - Must have >= 10 coordinate points
 * - Must have curvature >= 30 deg/km (rejects straight roads)
 * - Must have curvatureScore >= 35 (meaningful curves)
 */
export function scoreWayGroup(group: WayGroup): DiscoveredRoad | null {
  // Hard gate: minimum 2km length — short segments aren't "roads"
  if (group.lengthMeters < 2000) return null;

  // Hard gate: need enough geometry points for curvature analysis
  if (group.coords.length < 10) return null;

  // Curvature
  const curvResult = analyzeCurvature(group.coords, group.lengthMeters);

  // Hard gate: reject straight roads — need at least 30 deg/km of turning
  if (curvResult.curvaturePerKm < 30) return null;

  const curvatureScore = scoreCurvature(
    curvResult.curvaturePerKm,
    curvResult.flowScore
  );

  // Hard gate: curvature score must indicate at least gentle curves
  if (curvatureScore < 35) return null;

  // Elevation: default 50 for MVP (Overpass doesn't return elevation)
  const elevationScore = 50;

  // Surface
  const surfScore = surfaceToScore(group.tags.surface);
  const smoothScore = smoothnessToScore(group.tags.smoothness);
  const surfaceScore = group.tags.smoothness
    ? Math.round(surfScore * 0.6 + smoothScore * 0.4)
    : surfScore;

  // Character
  const characterScore = scoreRoadCharacter(
    group.highwayType,
    group.tags.maxspeed,
    group.tags.lanes
  );

  const enthusiastScore = computeEnthusiastScore(
    curvatureScore,
    elevationScore,
    surfaceScore,
    characterScore
  );

  // Compute center and bbox
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;
  let sumLat = 0,
    sumLng = 0;

  for (const c of group.coords) {
    minLat = Math.min(minLat, c.lat);
    maxLat = Math.max(maxLat, c.lat);
    minLng = Math.min(minLng, c.lng);
    maxLng = Math.max(maxLng, c.lng);
    sumLat += c.lat;
    sumLng += c.lng;
  }

  const center: Coordinate = {
    lat: sumLat / group.coords.length,
    lng: sumLng / group.coords.length,
  };

  const id = `${group.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${group.highwayType}-${Math.round(center.lat * 1000)}-${Math.round(center.lng * 1000)}`;

  return {
    id,
    name: group.name,
    highwayType: group.highwayType,
    lengthMeters: Math.round(group.lengthMeters),
    enthusiastScore,
    curvatureScore,
    elevationScore,
    surfaceScore,
    characterScore,
    curvaturePerKm: Math.round(curvResult.curvaturePerKm * 10) / 10,
    cornerCount: curvResult.cornerCount,
    flowScore: Math.round(curvResult.flowScore * 100) / 100,
    surface: group.tags.surface,
    maxspeed: group.tags.maxspeed,
    lanes: group.tags.lanes,
    center,
    bbox: [minLng, minLat, maxLng, maxLat],
    geometry: group.coords,
  };
}
