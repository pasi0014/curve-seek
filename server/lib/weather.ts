import type { Coordinate, WinterCondition, WeatherData, RouteSegment } from "./types.ts";
import { segmentMidpoint } from "./segments.ts";

/**
 * Fetch weather data from Environment Canada / Open-Meteo (free, no key).
 */
export async function getWeatherForSegments(
  segments: RouteSegment[]
): Promise<Map<number, WeatherData>> {
  const result = new Map<number, WeatherData>();
  if (segments.length === 0) return result;

  // Sample weather at a few points along the route to avoid too many API calls
  const sampleInterval = Math.max(1, Math.floor(segments.length / 5));
  const samplePoints: { index: number; coord: Coordinate }[] = [];

  for (let i = 0; i < segments.length; i += sampleInterval) {
    samplePoints.push({ index: i, coord: segmentMidpoint(segments[i]!) });
  }

  const weatherResults = await Promise.all(
    samplePoints.map(async (sp) => {
      try {
        const data = await fetchOpenMeteo(sp.coord);
        return { index: sp.index, data };
      } catch {
        return { index: sp.index, data: null };
      }
    })
  );

  // Fill in all segments using nearest sampled weather
  for (const segment of segments) {
    let nearest = weatherResults[0]!;
    let minDist = Infinity;
    for (const wr of weatherResults) {
      const dist = Math.abs(wr.index - segment.index);
      if (dist < minDist) {
        minDist = dist;
        nearest = wr;
      }
    }
    if (nearest.data) {
      result.set(segment.index, nearest.data);
    }
  }

  return result;
}

async function fetchOpenMeteo(coord: Coordinate): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.lng}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const data = await res.json();
  const current = data.current;

  const temp = current.temperature_2m;
  const precip = current.precipitation > 0
    ? (temp < 0 ? "snow" : "rain")
    : null;

  // Ice risk: near-freezing temps with precipitation or recent precip
  const iceRisk = temp >= -5 && temp <= 2 && (current.precipitation > 0 || current.weather_code >= 51);

  return {
    temperature: temp,
    precipitation: precip,
    windSpeed: current.wind_speed_10m,
    iceRisk,
  };
}

/**
 * Fetch Ontario 511 road conditions (real-time winter data).
 * Returns winter conditions for segments that fall within reported areas.
 */
export async function getOntario511Conditions(
  segments: RouteSegment[]
): Promise<Map<number, WinterCondition>> {
  const result = new Map<number, WinterCondition>();

  try {
    const res = await fetch("https://511on.ca/api/v2/get/roadconditions", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.error(`Ontario 511 API error: ${res.status}`);
      return result;
    }

    const data = await res.json();
    const conditions = Array.isArray(data) ? data : data.RoadConditions ?? [];

    for (const segment of segments) {
      const mid = segmentMidpoint(segment);
      const nearest = findNearestCondition(conditions, mid);
      if (nearest) {
        result.set(segment.index, nearest);
      }
    }
  } catch (e) {
    console.error("Ontario 511 fetch failed:", e);
  }

  return result;
}

function findNearestCondition(
  conditions: any[],
  point: Coordinate
): WinterCondition | null {
  for (const c of conditions) {
    // Ontario 511 provides road condition descriptions
    const raw = c.Condition ?? c.condition ?? "";
    const condText = typeof raw === "string" ? raw.toLowerCase() : "";
    const lat = c.Latitude || c.latitude;
    const lng = c.Longitude || c.longitude;

    if (lat && lng) {
      const dist = Math.hypot(lat - point.lat, lng - point.lng);
      if (dist < 0.1) {
        return {
          status: parseWinterStatus(condText),
          source: "Ontario 511",
          updatedAt: c.LastUpdated || c.lastUpdated || new Date().toISOString(),
        };
      }
    }
  }
  return null;
}

function parseWinterStatus(text: string): WinterCondition["status"] {
  if (text.includes("bare") && text.includes("dry")) return "bare";
  if (text.includes("bare")) return "bare";
  if (text.includes("partly")) return "partly_covered";
  if (text.includes("covered") || text.includes("snow")) return "covered";
  if (text.includes("ice") || text.includes("icy")) return "ice";
  return "unknown";
}
