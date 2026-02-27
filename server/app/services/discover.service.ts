import { queryRoadsInRadius } from "../../lib/overpass.ts";
import { groupWaysIntoRoads, scoreWayGroup } from "../../lib/discover.ts";
import type { DiscoverRoadsResult, Coordinate } from "../../lib/types.ts";
import type { WideEvent } from "../../logger.ts";

interface DiscoverInput {
  lat: number;
  lng: number;
  radiusKm: number;
}

export async function discoverFunRoads(
  input: DiscoverInput,
  event: WideEvent
): Promise<DiscoverRoadsResult> {
  const { lat, lng, radiusKm } = input;
  const center: Coordinate = { lat, lng };
  const radiusMeters = radiusKm * 1000;

  event.set("discover_center", `${lat},${lng}`);
  event.set("discover_radius_km", radiusKm);

  // 1. Query Overpass for roads in the area
  const ways = await event.time("overpass_area_query", () =>
    queryRoadsInRadius(center, radiusMeters)
  );
  event.set("overpass_ways_returned", ways.length);

  if (ways.length === 0) {
    return {
      center,
      radiusKm,
      totalWaysScanned: 0,
      roads: [],
      generatedAt: new Date().toISOString(),
    };
  }

  // 2. Group ways into logical roads
  const groups = groupWaysIntoRoads(ways);
  event.set("road_groups", groups.length);

  // 3. Score each group
  const scored = groups
    .map(scoreWayGroup)
    .filter((r): r is NonNullable<typeof r> => r !== null && r.enthusiastScore >= 50);

  // 4. Sort by score descending, take top 20
  scored.sort((a, b) => b.enthusiastScore - a.enthusiastScore);
  const roads = scored.slice(0, 20);

  event.set("roads_above_threshold", scored.length);
  event.set("roads_returned", roads.length);
  if (roads.length > 0) {
    event.set("top_score", roads[0]!.enthusiastScore);
  }

  return {
    center,
    radiusKm,
    totalWaysScanned: ways.length,
    roads,
    generatedAt: new Date().toISOString(),
  };
}
