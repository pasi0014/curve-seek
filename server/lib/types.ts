export interface Coordinate {
  lat: number;
  lng: number;
  elevation?: number;
}

export interface RouteSegment {
  index: number;
  start: Coordinate;
  end: Coordinate;
  coordinates: Coordinate[];
  lengthMeters: number;
}

export interface OSMSurfaceData {
  surface: string | null;
  smoothness: string | null;
}

export interface OSMRoadTags {
  highway: string | null;
  maxspeed: string | null;
  lanes: string | null;
  name: string | null;
  surface: string | null;
  smoothness: string | null;
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

export interface WinterCondition {
  status: "bare" | "partly_covered" | "covered" | "ice" | "unknown";
  source: string;
  updatedAt: string;
}

export interface WeatherData {
  temperature: number;
  precipitation: string | null;
  windSpeed: number;
  iceRisk: boolean;
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

export interface SegmentScore {
  segment: RouteSegment;
  osmScore: number;
  winterScore: number;
  weatherScore: number;
  crowdScore: number;
  compositeScore: number;
  osmData: OSMSurfaceData | null;
  winterCondition: WinterCondition | null;
  weatherData: WeatherData | null;
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

export interface MultiRouteResult {
  candidates: RouteCandidate[];
  recommended: string;
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
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  geometry: Coordinate[];
}

export interface DiscoverRoadsResult {
  center: Coordinate;
  radiusKm: number;
  totalWaysScanned: number;
  roads: DiscoveredRoad[];
  generatedAt: string;
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
