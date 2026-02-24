import type { Coordinate, GeocodedPlace, RouteGeometry } from "./types.ts";

interface LabeledRoute {
  label: string;
  route: RouteGeometry;
}

const ORS_BASE = "https://api.openrouteservice.org";

function getApiKey(): string {
  const key = process.env.ORS_API_KEY;
  if (!key) throw new Error("ORS_API_KEY environment variable is required. Get one free at https://openrouteservice.org");
  return key;
}

export async function geocode(query: string): Promise<GeocodedPlace[]> {
  // Use Nominatim (OSM's free geocoder) — no API key needed
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ca&limit=5&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "DriverCompanion/1.0" },
  });
  if (!res.ok) throw new Error(`Geocode failed: ${res.status} ${await res.text()}`);
  const data = await res.json();

  return data.map((item: any) => ({
    name: item.display_name,
    coordinate: {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    },
  }));
}

export async function getRoute(
  start: Coordinate,
  end: Coordinate,
  waypoints?: Coordinate[]
): Promise<RouteGeometry> {
  const key = getApiKey();
  const url = `${ORS_BASE}/v2/directions/driving-car/geojson`;

  const coords = [
    [start.lng, start.lat],
    ...(waypoints ?? []).map((w) => [w.lng, w.lat]),
    [end.lng, end.lat],
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates: coords,
      elevation: true,
    }),
  });

  if (!res.ok) throw new Error(`Routing failed: ${res.status} ${await res.text()}`);
  const data = await res.json();

  const route = data.features?.[0];
  if (!route) throw new Error("No route found");

  const routeCoords: Coordinate[] = route.geometry.coordinates.map(
    (c: number[]) => ({
      lat: c[1]!,
      lng: c[0]!,
      ...(c[2] != null ? { elevation: c[2] } : {}),
    })
  );

  return {
    coordinates: routeCoords,
    distanceMeters: route.properties.summary.distance,
    durationSeconds: route.properties.summary.duration,
    bbox: data.bbox,
  };
}

function parseFeatures(data: any): RouteGeometry[] {
  const features = data.features ?? [];
  return features.map((f: any) => {
    const coords: Coordinate[] = f.geometry.coordinates.map((c: number[]) => ({
      lat: c[1]!,
      lng: c[0]!,
      ...(c[2] != null ? { elevation: c[2] } : {}),
    }));
    return {
      coordinates: coords,
      distanceMeters: f.properties.summary.distance,
      durationSeconds: f.properties.summary.duration,
      bbox: data.bbox,
    } as RouteGeometry;
  });
}

function isDuplicate(a: RouteGeometry, b: RouteGeometry): boolean {
  const distRatio = Math.abs(a.distanceMeters - b.distanceMeters) / Math.max(a.distanceMeters, b.distanceMeters);
  return distRatio < 0.02;
}

export async function getRoutes(
  start: Coordinate,
  end: Coordinate,
  waypoints?: Coordinate[]
): Promise<LabeledRoute[]> {
  const key = getApiKey();
  const url = `${ORS_BASE}/v2/directions/driving-car/geojson`;
  const coords = [
    [start.lng, start.lat],
    ...(waypoints ?? []).map((w) => [w.lng, w.lat]),
    [end.lng, end.lat],
  ];

  // Estimate straight-line distance to decide if alternatives are possible
  const dlat = end.lat - start.lat;
  const dlng = end.lng - start.lng;
  const approxKm = Math.sqrt(dlat * dlat + dlng * dlng) * 111;
  const useAlternatives = approxKm < 100;

  const baseBody: any = { coordinates: coords, elevation: true };
  if (useAlternatives) {
    baseBody.alternative_routes = {
      target_count: 2,
      share_factor: 0.6,
      weight_factor: 1.4,
    };
  }

  const avoidBody: any = {
    ...baseBody,
    alternative_routes: useAlternatives ? baseBody.alternative_routes : undefined,
    options: { avoid_features: ["highways"] },
  };

  const headers = {
    Authorization: key,
    "Content-Type": "application/json",
  };

  const [normalRes, avoidRes] = await Promise.all([
    fetch(url, { method: "POST", headers, body: JSON.stringify(baseBody) }),
    fetch(url, { method: "POST", headers, body: JSON.stringify(avoidBody) }).catch(() => null),
  ]);

  if (!normalRes.ok) {
    throw new Error(`Routing failed: ${normalRes.status} ${await normalRes.text()}`);
  }

  const normalData = await normalRes.json();
  const normalRoutes = parseFeatures(normalData);

  const results: LabeledRoute[] = [];

  // Label normal routes
  for (let i = 0; i < normalRoutes.length; i++) {
    results.push({
      label: i === 0 ? "Fastest Route" : `Alternative ${i}`,
      route: normalRoutes[i]!,
    });
  }

  // Parse highway-avoided routes
  if (avoidRes && avoidRes.ok) {
    const avoidData = await avoidRes.json();
    const avoidRoutes = parseFeatures(avoidData);
    for (let i = 0; i < avoidRoutes.length; i++) {
      const candidate = avoidRoutes[i]!;
      // Deduplicate against existing results
      const isDup = results.some((r) => isDuplicate(r.route, candidate));
      if (!isDup) {
        results.push({
          label: i === 0 ? "Backroads" : `Backroads Alt ${i}`,
          route: candidate,
        });
      }
    }
  }

  if (results.length === 0) {
    throw new Error("No route found");
  }

  return results;
}
