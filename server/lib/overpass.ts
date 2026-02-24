import type { Coordinate, OSMSurfaceData, OSMRoadTags, RouteSegment } from "./types.ts";
import { segmentMidpoint } from "./segments.ts";

const OVERPASS_API = "https://overpass-api.de/api/interpreter";

export interface OverpassWay {
  id: number;
  tags: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
}

export interface OSMDataResult {
  surfaceData: Map<number, OSMSurfaceData>;
  roadTags: Map<number, OSMRoadTags>;
}

/**
 * Query OSM for road surface/smoothness data and road tags along a route's segments.
 * Uses "around" queries at sampled points along the route for precision.
 */
export async function queryOSMData(
  segments: RouteSegment[]
): Promise<OSMDataResult> {
  if (segments.length === 0) return { surfaceData: new Map(), roadTags: new Map() };

  // Sample points along the route (~every 2km or at least 5 points)
  const sampleInterval = Math.max(1, Math.floor(segments.length / Math.min(segments.length, 20)));
  const samplePoints: Coordinate[] = [];
  for (let i = 0; i < segments.length; i += sampleInterval) {
    samplePoints.push(segmentMidpoint(segments[i]!));
  }
  // Always include last segment
  if (segments.length > 1) {
    samplePoints.push(segmentMidpoint(segments[segments.length - 1]!));
  }

  // Build a single query using union of "around" filters for all sample points
  const aroundClauses = samplePoints
    .map((p) => `way["highway"](around:100,${p.lat},${p.lng});`)
    .join("\n");

  const query = `
    [out:json][timeout:30];
    (
      ${aroundClauses}
    );
    out tags geom;
  `;

  let ways: OverpassWay[] = [];
  try {
    const res = await fetch(OVERPASS_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      console.error(`Overpass API error: ${res.status}`);
      return defaultOSMData(segments);
    }

    const data = await res.json();
    ways = data.elements.filter((e: any) => e.type === "way");
  } catch (e) {
    console.error("Overpass fetch failed:", e);
    return defaultOSMData(segments);
  }

  if (ways.length === 0) return defaultOSMData(segments);

  console.log(`Overpass returned ${ways.length} ways for ${samplePoints.length} sample points`);

  // Match each segment to its nearest highway way
  const surfaceData = new Map<number, OSMSurfaceData>();
  const roadTags = new Map<number, OSMRoadTags>();
  for (const segment of segments) {
    const mid = segmentMidpoint(segment);
    const nearest = findNearestWay(ways, mid);

    if (nearest) {
      surfaceData.set(segment.index, {
        surface: nearest.tags.surface || null,
        smoothness: nearest.tags.smoothness || null,
      });
      roadTags.set(segment.index, {
        highway: nearest.tags.highway || null,
        maxspeed: nearest.tags.maxspeed || null,
        lanes: nearest.tags.lanes || null,
        name: nearest.tags.name || null,
        surface: nearest.tags.surface || null,
        smoothness: nearest.tags.smoothness || null,
      });
    } else {
      surfaceData.set(segment.index, { surface: null, smoothness: null });
      roadTags.set(segment.index, {
        highway: null, maxspeed: null, lanes: null,
        name: null, surface: null, smoothness: null,
      });
    }
  }

  return { surfaceData, roadTags };
}

/** @deprecated Use queryOSMData instead */
export async function queryOSMSurface(
  segments: RouteSegment[]
): Promise<Map<number, OSMSurfaceData>> {
  const { surfaceData } = await queryOSMData(segments);
  return surfaceData;
}

function defaultOSMData(segments: RouteSegment[]): OSMDataResult {
  const surfaceData = new Map<number, OSMSurfaceData>();
  const roadTags = new Map<number, OSMRoadTags>();
  for (const seg of segments) {
    surfaceData.set(seg.index, { surface: null, smoothness: null });
    roadTags.set(seg.index, {
      highway: null, maxspeed: null, lanes: null,
      name: null, surface: null, smoothness: null,
    });
  }
  return { surfaceData, roadTags };
}

function findNearestWay(
  ways: OverpassWay[],
  point: Coordinate
): OverpassWay | null {
  let bestWay: OverpassWay | null = null;
  let bestDist = Infinity;

  for (const way of ways) {
    if (!way.geometry) continue;
    // Only consider driveable roads
    const hw = way.tags.highway;
    if (!hw) continue;
    const driveable = [
      "motorway", "trunk", "primary", "secondary", "tertiary",
      "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link",
      "unclassified", "residential", "service", "living_street",
    ];
    if (!driveable.includes(hw)) continue;

    for (const node of way.geometry) {
      const dist = Math.hypot(node.lat - point.lat, node.lon - point.lng);
      if (dist < bestDist) {
        bestDist = dist;
        bestWay = way;
      }
    }
  }

  // Match within ~200m (0.002 degrees)
  return bestDist < 0.002 ? bestWay : null;
}

/**
 * Query Overpass for all driveable roads within a radius of a center point.
 * Returns raw OverpassWay objects with geometry for further processing.
 */
export async function queryRoadsInRadius(
  center: { lat: number; lng: number },
  radiusMeters: number
): Promise<OverpassWay[]> {
  const query = `
    [out:json][timeout:60];
    way["highway"~"^(tertiary|secondary|unclassified|primary|tertiary_link|secondary_link|primary_link)$"](around:${radiusMeters},${center.lat},${center.lng});
    out tags geom;
  `;

  try {
    const res = await fetch(OVERPASS_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      console.error(`Overpass area query error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return data.elements.filter((e: any) => e.type === "way") as OverpassWay[];
  } catch (e) {
    console.error("Overpass area query failed:", e);
    return [];
  }
}

export function surfaceToScore(surface: string | null): number {
  const scores: Record<string, number> = {
    asphalt: 95,
    concrete: 90,
    "concrete:plates": 80,
    paving_stones: 75,
    sett: 65,
    cobblestone: 55,
    metal: 85,
    compacted: 60,
    "fine_gravel": 55,
    gravel: 40,
    pebblestone: 35,
    dirt: 25,
    earth: 25,
    mud: 10,
    sand: 15,
    grass: 20,
    unpaved: 30,
  };
  if (!surface) return 70; // Unknown defaults to decent
  return scores[surface] ?? 60;
}

export function smoothnessToScore(smoothness: string | null): number {
  const scores: Record<string, number> = {
    excellent: 100,
    good: 85,
    intermediate: 65,
    bad: 40,
    very_bad: 25,
    horrible: 10,
    impassable: 0,
  };
  if (!smoothness) return 70;
  return scores[smoothness] ?? 60;
}
