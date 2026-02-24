import type {
  Coordinate,
  RouteSegment,
  OSMRoadTags,
  SegmentEnthusiastData,
} from "./types.ts";

/** Bearing in degrees (0-360) between two coordinates. */
export function bearing(a: Coordinate, b: Coordinate): number {
  const toRad = Math.PI / 180;
  const lat1 = a.lat * toRad;
  const lat2 = b.lat * toRad;
  const dLng = (b.lng - a.lng) * toRad;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Absolute bearing change between two bearings (0-180). */
export function bearingDelta(a: number, b: number): number {
  let diff = Math.abs(b - a) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

interface CurvatureResult {
  curvaturePerKm: number;
  cornerCount: number;
  flowScore: number;
}

/** Analyze curvature from a sequence of coordinates over a given distance. */
export function analyzeCurvature(
  coords: Coordinate[],
  lengthMeters: number
): CurvatureResult {
  if (coords.length < 3 || lengthMeters < 1) {
    return { curvaturePerKm: 0, cornerCount: 0, flowScore: 0.5 };
  }

  const deltas: number[] = [];
  for (let i = 0; i < coords.length - 2; i++) {
    const b1 = bearing(coords[i]!, coords[i + 1]!);
    const b2 = bearing(coords[i + 1]!, coords[i + 2]!);
    deltas.push(bearingDelta(b1, b2));
  }

  const totalDelta = deltas.reduce((sum, d) => sum + d, 0);
  const curvaturePerKm = (totalDelta / lengthMeters) * 1000;

  const cornerCount = deltas.filter((d) => d > 15).length;

  // Flow score: 1 - coefficient of variation. Low variance = rhythmic turns.
  let flowScore = 0.5;
  if (deltas.length > 1) {
    const mean = totalDelta / deltas.length;
    if (mean > 0) {
      const variance =
        deltas.reduce((sum, d) => sum + (d - mean) ** 2, 0) / deltas.length;
      const cv = Math.sqrt(variance) / mean;
      flowScore = Math.max(0, Math.min(1, 1 - cv));
    }
  }

  return { curvaturePerKm, cornerCount, flowScore };
}

/**
 * Score curvature 0-100.
 * Sweet spots: 80-400 deg/km = 70-100.
 * Straights (< 20) = 10-30. Extreme hairpins (> 400) get slight penalty.
 * Flow bonus ±10.
 */
export function scoreCurvature(
  curvaturePerKm: number,
  flowScore: number
): number {
  let score: number;

  if (curvaturePerKm < 20) {
    // Straight road
    score = 10 + (curvaturePerKm / 20) * 20; // 10-30
  } else if (curvaturePerKm < 80) {
    // Gentle curves
    score = 30 + ((curvaturePerKm - 20) / 60) * 40; // 30-70
  } else if (curvaturePerKm <= 400) {
    // Sweet spot
    score = 70 + ((curvaturePerKm - 80) / 320) * 30; // 70-100
  } else {
    // Extreme hairpins — slight penalty
    score = Math.max(60, 100 - ((curvaturePerKm - 400) / 200) * 20); // 100→60
  }

  // Flow bonus: ±10
  const flowBonus = (flowScore - 0.5) * 20; // -10 to +10
  score = Math.max(0, Math.min(100, score + flowBonus));

  return Math.round(score);
}

/**
 * Score elevation drama 0-100.
 * Flat (< 5 m/km) = 10-25. Rolling (5-30) = 25-60.
 * Mountain (30-60) = 60-90. Alpine (60-100) = 85-100.
 * Bonus for 3-12% gradients.
 */
export function scoreElevation(
  elevPerKm: number,
  maxGradientPct: number
): number {
  let score: number;

  if (elevPerKm < 5) {
    score = 10 + (elevPerKm / 5) * 15; // 10-25
  } else if (elevPerKm < 30) {
    score = 25 + ((elevPerKm - 5) / 25) * 35; // 25-60
  } else if (elevPerKm < 60) {
    score = 60 + ((elevPerKm - 30) / 30) * 30; // 60-90
  } else if (elevPerKm <= 100) {
    score = 85 + ((elevPerKm - 60) / 40) * 15; // 85-100
  } else {
    score = 100;
  }

  // Gradient bonus: 3-12% is the sweet spot
  if (maxGradientPct >= 3 && maxGradientPct <= 12) {
    score = Math.min(100, score + 5);
  }

  return Math.round(score);
}

/**
 * Score road character 0-100.
 * highway type 50%, speed limit 30%, lanes 20%.
 */
export function scoreRoadCharacter(
  highwayType: string | null,
  maxspeed: string | null,
  lanes: string | null
): number {
  // Highway type score
  const typeScores: Record<string, number> = {
    tertiary: 95,
    tertiary_link: 90,
    secondary: 90,
    secondary_link: 85,
    unclassified: 85,
    residential: 70,
    primary: 60,
    primary_link: 55,
    trunk: 30,
    trunk_link: 30,
    motorway: 10,
    motorway_link: 10,
    service: 50,
    living_street: 40,
  };
  const typeScore = highwayType ? (typeScores[highwayType] ?? 50) : 50;

  // Speed limit score — sweet spot 50-90 km/h
  let speedScore = 50;
  if (maxspeed) {
    const speed = parseInt(maxspeed, 10);
    if (!isNaN(speed)) {
      if (speed >= 50 && speed <= 90) {
        speedScore = 80 + ((90 - Math.abs(speed - 70)) / 20) * 20; // peaks at 70
        speedScore = Math.min(100, speedScore);
      } else if (speed < 50) {
        speedScore = 30 + (speed / 50) * 30; // 30-60
      } else {
        speedScore = Math.max(10, 80 - ((speed - 90) / 40) * 70); // 80→10
      }
    }
  }

  // Lane score — 2 lanes is ideal
  let laneScore = 70; // default unknown
  if (lanes) {
    const n = parseInt(lanes, 10);
    if (!isNaN(n)) {
      if (n === 2) laneScore = 95;
      else if (n === 1) laneScore = 80;
      else if (n === 3) laneScore = 60;
      else laneScore = Math.max(10, 60 - (n - 3) * 15);
    }
  }

  return Math.round(typeScore * 0.5 + speedScore * 0.3 + laneScore * 0.2);
}

/** Weighted composite enthusiast score. */
export function computeEnthusiastScore(
  curvature: number,
  elevation: number,
  surface: number,
  character: number
): number {
  return Math.round(
    curvature * 0.35 + elevation * 0.25 + surface * 0.2 + character * 0.2
  );
}

/** Compute elevation metrics from a sequence of elevations over a distance. */
function analyzeElevation(
  elevations: number[],
  lengthMeters: number
): { elevationChangeM: number; elevationPerKm: number; maxGradientPct: number } {
  if (elevations.length < 2 || lengthMeters < 1) {
    return { elevationChangeM: 0, elevationPerKm: 0, maxGradientPct: 0 };
  }

  let totalChange = 0;
  let maxGradientPct = 0;
  const stepDist = lengthMeters / (elevations.length - 1);

  for (let i = 1; i < elevations.length; i++) {
    // Smooth by averaging over 3 consecutive points when possible
    const prev =
      i >= 2
        ? (elevations[i - 2]! + elevations[i - 1]! + elevations[i]!) / 3
        : elevations[i - 1]!;
    const curr =
      i + 1 < elevations.length
        ? (elevations[i - 1]! + elevations[i]! + elevations[i + 1]!) / 3
        : elevations[i]!;

    const change = Math.abs(curr - prev);
    totalChange += Math.abs(elevations[i]! - elevations[i - 1]!);

    if (stepDist > 0) {
      const gradient = (change / stepDist) * 100;
      if (gradient > maxGradientPct) maxGradientPct = gradient;
    }
  }

  return {
    elevationChangeM: totalChange,
    elevationPerKm: (totalChange / lengthMeters) * 1000,
    maxGradientPct: Math.round(maxGradientPct * 10) / 10,
  };
}

/**
 * Main entry point: analyze enthusiast data for all segments.
 * Returns a Map from segment index to SegmentEnthusiastData.
 */
export function analyzeEnthusiastSegments(
  segments: RouteSegment[],
  elevationMap: Map<number, number[]>,
  roadTags: Map<number, OSMRoadTags>,
  osmSurfaceScores: Map<number, number>
): Map<number, SegmentEnthusiastData> {
  const result = new Map<number, SegmentEnthusiastData>();

  for (const segment of segments) {
    // Short segments (< 100m): skip detailed analysis, default to 50
    if (segment.lengthMeters < 100) {
      result.set(segment.index, {
        curvaturePerKm: 0,
        cornerCount: 0,
        flowScore: 0.5,
        elevationChangeM: 0,
        elevationPerKm: 0,
        maxGradientPct: 0,
        highwayType: null,
        maxspeed: null,
        lanes: null,
        roadName: null,
        curvatureScore: 50,
        elevationScore: 50,
        surfaceScore: 50,
        characterScore: 50,
        enthusiastScore: 50,
      });
      continue;
    }

    // Curvature
    const { curvaturePerKm, cornerCount, flowScore } = analyzeCurvature(
      segment.coordinates,
      segment.lengthMeters
    );
    const curvatureScore = scoreCurvature(curvaturePerKm, flowScore);

    // Elevation
    const elevations = elevationMap.get(segment.index) ?? [];
    const hasElevation = elevations.length > 0 && elevations.some((e) => e !== 0);
    const elevData = hasElevation
      ? analyzeElevation(elevations, segment.lengthMeters)
      : { elevationChangeM: 0, elevationPerKm: 0, maxGradientPct: 0 };
    const elevationScore = hasElevation
      ? scoreElevation(elevData.elevationPerKm, elevData.maxGradientPct)
      : 50; // Default when no elevation data

    // Surface (reuse existing OSM score)
    const surfaceScore = osmSurfaceScores.get(segment.index) ?? 70;

    // Road character
    const tags = roadTags.get(segment.index);
    const characterScore = scoreRoadCharacter(
      tags?.highway ?? null,
      tags?.maxspeed ?? null,
      tags?.lanes ?? null
    );

    const enthusiastScore = computeEnthusiastScore(
      curvatureScore,
      elevationScore,
      surfaceScore,
      characterScore
    );

    result.set(segment.index, {
      curvaturePerKm: Math.round(curvaturePerKm * 10) / 10,
      cornerCount,
      flowScore: Math.round(flowScore * 100) / 100,
      elevationChangeM: Math.round(elevData.elevationChangeM * 10) / 10,
      elevationPerKm: Math.round(elevData.elevationPerKm * 10) / 10,
      maxGradientPct: elevData.maxGradientPct,
      highwayType: tags?.highway ?? null,
      maxspeed: tags?.maxspeed ?? null,
      lanes: tags?.lanes ?? null,
      roadName: tags?.name ?? null,
      curvatureScore,
      elevationScore,
      surfaceScore,
      characterScore,
      enthusiastScore,
    });
  }

  return result;
}
