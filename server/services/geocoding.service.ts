import { geocode } from "../lib/routing.ts";
import type { WideEvent } from "../logger.ts";

export async function geocodeQuery(query: string, event: WideEvent) {
  event.set("geocode_query", query);

  const results = await event.time("nominatim_geocode", () => geocode(query));

  event.set("geocode_results", results.length);
  return results;
}
