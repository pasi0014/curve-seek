import { getRoute, getRoutes } from "../lib/routing.ts";
import { splitIntoSegments, segmentMidpoint } from "../lib/segments.ts";
import { queryOSMData } from "../lib/overpass.ts";
import { scoreOSM, buildSegmentScores, buildReport } from "../lib/scoring.ts";
import { analyzeEnthusiastSegments } from "../lib/enthusiast.ts";
import { getWeatherForSegments, getOntario511Conditions } from "../lib/weather.ts";
import { getCrowdScoresForSegments } from "../lib/db.ts";
import type { WideEvent } from "../logger.ts";
import type { RouteGeometry, RouteReport, RouteCandidate, MultiRouteResult } from "../lib/types.ts";

interface RouteAnalysisInput {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  origin: string;
  destination: string;
  waypoints?: { lat: number; lng: number }[];
}

async function analyzeOneRoute(
  route: RouteGeometry,
  origin: string,
  destination: string,
  event: WideEvent
): Promise<{ route: RouteGeometry; report: RouteReport }> {
  // Split into ~500m segments
  const segments = splitIntoSegments(route.coordinates, 500);

  // Query data layers in parallel
  const [osmResult, weatherData, winterConditions] = await Promise.all([
    queryOSMData(segments),
    getWeatherForSegments(segments),
    getOntario511Conditions(segments),
  ]);

  const { surfaceData, roadTags } = osmResult;

  // Get crowd-sourced data from DB
  const crowdScores = await getCrowdScoresForSegments(
    segments.map((s) => ({
      index: s.index,
      ...segmentMidpoint(s),
    }))
  );

  // Score each segment
  const segmentScores = buildSegmentScores(
    segments,
    surfaceData,
    winterConditions,
    weatherData,
    crowdScores
  );

  // Enthusiast scoring
  const elevationMap = new Map<number, number[]>();
  for (const seg of segments) {
    elevationMap.set(
      seg.index,
      seg.coordinates.map((c) => c.elevation ?? 0)
    );
  }

  const osmScoreMap = new Map<number, number>();
  for (const seg of segments) {
    const data = surfaceData.get(seg.index) ?? null;
    osmScoreMap.set(seg.index, scoreOSM(data));
  }

  const enthusiastMap = analyzeEnthusiastSegments(
    segments,
    elevationMap,
    roadTags,
    osmScoreMap
  );

  for (const ss of segmentScores) {
    const ed = enthusiastMap.get(ss.segment.index);
    if (ed) {
      ss.enthusiastData = ed;
      ss.enthusiastScore = ed.enthusiastScore;
    }
  }

  const report = buildReport(
    origin || "Start",
    destination || "End",
    route.distanceMeters / 1000,
    segmentScores
  );

  return {
    route: {
      coordinates: route.coordinates,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      bbox: route.bbox,
    },
    report,
  };
}

function labelToId(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "-");
}

export async function analyzeRoutes(
  input: RouteAnalysisInput,
  event: WideEvent
): Promise<MultiRouteResult> {
  const { startLat, startLng, endLat, endLng, origin, destination, waypoints } = input;

  // 1. Get multiple route geometries
  const labeledRoutes = await event.time("ors_routing", () =>
    getRoutes({ lat: startLat, lng: startLng }, { lat: endLat, lng: endLng }, waypoints)
  );

  event.set("candidate_count", labeledRoutes.length);

  // 2. Analyze each route in parallel
  const analyses = await Promise.all(
    labeledRoutes.map((lr) =>
      analyzeOneRoute(lr.route, origin, destination, event)
    )
  );

  // 3. Build candidates
  const candidates: RouteCandidate[] = labeledRoutes.map((lr, i) => ({
    id: labelToId(lr.label),
    label: lr.label,
    route: analyses[i]!.route,
    report: analyses[i]!.report,
  }));

  // 4. Find recommended (highest enthusiast score)
  let recommended = candidates[0]!.id;
  let bestScore = -1;
  for (const c of candidates) {
    if (c.report.overallEnthusiastScore > bestScore) {
      bestScore = c.report.overallEnthusiastScore;
      recommended = c.id;
    }
  }

  event.set("overall_score", candidates[0]!.report.overallScore);
  event.set("overall_enthusiast_score", candidates[0]!.report.overallEnthusiastScore);
  event.set("recommended_candidate", recommended);

  return { candidates, recommended };
}

export async function analyzeRoute(input: RouteAnalysisInput, event: WideEvent) {
  const result = await analyzeRoutes(input, event);
  const fastest = result.candidates[0]!;
  return {
    route: fastest.route,
    report: fastest.report,
    candidates: result.candidates,
    recommended: result.recommended,
  };
}
