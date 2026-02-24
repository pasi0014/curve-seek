export interface Coordinate {
  lat: number;
  lng: number;
}

export interface GeocodedPlace {
  name: string;
  coordinate: Coordinate;
}

export interface RouteGeometry {
  coordinates: Coordinate[];
  distanceMeters: number;
  durationSeconds: number;
  bbox: [number, number, number, number];
}

export interface SegmentEnthusiastData {
  curvaturePerKm: number;
  cornerCount: number;
  flowScore: number;
  elevationChangeM: number;
  elevationPerKm: number;
  maxGradientPct: number;
  highwayType: string | null;
  maxspeed: string | null;
  lanes: string | null;
  roadName: string | null;
  curvatureScore: number;
  elevationScore: number;
  surfaceScore: number;
  characterScore: number;
  enthusiastScore: number;
}

export interface SegmentScore {
  segment: {
    index: number;
    start: Coordinate;
    end: Coordinate;
    coordinates: Coordinate[];
    lengthMeters: number;
  };
  osmScore: number;
  winterScore: number;
  weatherScore: number;
  crowdScore: number;
  compositeScore: number;
  osmData: { surface: string | null; smoothness: string | null } | null;
  winterCondition: {
    status: string;
    source: string;
    updatedAt: string;
  } | null;
  weatherData: {
    temperature: number;
    precipitation: string | null;
    windSpeed: number;
    iceRisk: boolean;
  } | null;
  enthusiastData: SegmentEnthusiastData | null;
  enthusiastScore: number;
}

export type RoadQuality = "good" | "fair" | "poor" | "bad";

export interface RouteReport {
  origin: string;
  destination: string;
  totalDistanceKm: number;
  overallScore: number;
  overallQuality: RoadQuality;
  segments: SegmentScore[];
  problemSections: SegmentScore[];
  overallEnthusiastScore: number;
  enthusiastHighlights: SegmentScore[];
  generatedAt: string;
}

export interface RouteCandidate {
  id: string;
  label: string;
  route: RouteGeometry;
  report: RouteReport;
}

export type StopType =
  | "waypoint"
  | "sightseeing"
  | "gas"
  | "grocery"
  | "cafe"
  | "rest"
  | "other";

export interface SavedStop {
  id: string;
  position: number;
  stopType: StopType;
  name: string;
  note: string | null;
  lat: number;
  lng: number;
}

export interface SavedRouteSummary {
  id: string;
  name: string;
  description: string | null;
  originName: string;
  destName: string;
  distanceM: number;
  stopCount: number;
  createdAt: string;
}

export interface SavedRouteDetail extends SavedRouteSummary {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  geometry: [number, number][];
  durationS: number;
  isPublic: boolean;
  updatedAt: string;
  stops: SavedStop[];
}

export interface DiscoveredRoad {
  id: string;
  name: string;
  highwayType: string;
  lengthMeters: number;
  enthusiastScore: number;
  curvatureScore: number;
  elevationScore: number;
  surfaceScore: number;
  characterScore: number;
  curvaturePerKm: number;
  cornerCount: number;
  flowScore: number;
  surface: string | null;
  maxspeed: string | null;
  lanes: string | null;
  center: Coordinate;
  bbox: [number, number, number, number];
  geometry: Coordinate[];
}

export interface DiscoverRoadsResult {
  center: Coordinate;
  radiusKm: number;
  totalWaysScanned: number;
  roads: DiscoveredRoad[];
  generatedAt: string;
}

export interface AccelerometerReading {
  timestamp: number;
  lat: number;
  lng: number;
  x: number;
  y: number;
  z: number;
  speed: number;
}
