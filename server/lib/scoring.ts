import type {
  RouteSegment,
  SegmentScore,
  OSMSurfaceData,
  WinterCondition,
  WeatherData,
  SegmentEnthusiastData,
  RouteReport,
  RoadQuality,
} from "./types.ts";
import { surfaceToScore, smoothnessToScore } from "./overpass.ts";

const WEIGHTS = {
  osm: 0.3,
  winter: 0.25,
  weather: 0.2,
  crowd: 0.25,
};

export function scoreOSM(data: OSMSurfaceData | null): number {
  if (!data) return 70;
  const surfScore = surfaceToScore(data.surface);
  const smoothScore = smoothnessToScore(data.smoothness);
  // If both available, average; if only one, use it
  if (data.surface && data.smoothness) return (surfScore + smoothScore) / 2;
  if (data.surface) return surfScore;
  if (data.smoothness) return smoothScore;
  return 70;
}

export function scoreWinter(condition: WinterCondition | null): number {
  if (!condition || condition.status === "unknown") return 70;
  const scores: Record<string, number> = {
    bare: 95,
    partly_covered: 60,
    covered: 30,
    ice: 10,
  };
  return scores[condition.status] ?? 70;
}

export function scoreWeather(data: WeatherData | null): number {
  if (!data) return 70;
  let score = 90;
  if (data.temperature < -10) score -= 20;
  else if (data.temperature < 0) score -= 10;
  if (data.iceRisk) score -= 30;
  if (data.precipitation === "snow") score -= 20;
  else if (data.precipitation === "rain") score -= 10;
  if (data.windSpeed > 60) score -= 10;
  return Math.max(0, Math.min(100, score));
}

export function computeCompositeScore(
  osmScore: number,
  winterScore: number,
  weatherScore: number,
  crowdScore: number
): number {
  return Math.round(
    osmScore * WEIGHTS.osm +
      winterScore * WEIGHTS.winter +
      weatherScore * WEIGHTS.weather +
      crowdScore * WEIGHTS.crowd
  );
}

export function scoreToQuality(score: number): RoadQuality {
  if (score >= 75) return "good";
  if (score >= 55) return "fair";
  if (score >= 35) return "poor";
  return "bad";
}

export function buildSegmentScores(
  segments: RouteSegment[],
  osmDataMap: Map<number, OSMSurfaceData>,
  winterConditions: Map<number, WinterCondition>,
  weatherDataMap: Map<number, WeatherData>,
  crowdScores: Map<number, number>
): SegmentScore[] {
  return segments.map((segment) => {
    const osmData = osmDataMap.get(segment.index) ?? null;
    const winterCondition = winterConditions.get(segment.index) ?? null;
    const weatherData = weatherDataMap.get(segment.index) ?? null;
    const crowdScore = crowdScores.get(segment.index) ?? 70;

    const osmScore = scoreOSM(osmData);
    const winterScore = scoreWinter(winterCondition);
    const weatherScore = scoreWeather(weatherData);

    return {
      segment,
      osmScore,
      winterScore,
      weatherScore,
      crowdScore,
      compositeScore: computeCompositeScore(
        osmScore,
        winterScore,
        weatherScore,
        crowdScore
      ),
      osmData,
      winterCondition,
      weatherData,
      enthusiastData: null,
      enthusiastScore: 50,
    };
  });
}

export function buildReport(
  origin: string,
  destination: string,
  totalDistanceKm: number,
  segmentScores: SegmentScore[]
): RouteReport {
  const avgScore =
    segmentScores.length > 0
      ? Math.round(
          segmentScores.reduce((sum, s) => sum + s.compositeScore, 0) /
            segmentScores.length
        )
      : 70;

  const problemSections = segmentScores
    .filter((s) => s.compositeScore < 55)
    .sort((a, b) => a.compositeScore - b.compositeScore);

  const avgEnthusiastScore =
    segmentScores.length > 0
      ? Math.round(
          segmentScores.reduce((sum, s) => sum + s.enthusiastScore, 0) /
            segmentScores.length
        )
      : 50;

  const enthusiastHighlights = segmentScores
    .filter((s) => s.enthusiastScore >= 70)
    .sort((a, b) => b.enthusiastScore - a.enthusiastScore)
    .slice(0, 10);

  return {
    origin,
    destination,
    totalDistanceKm,
    overallScore: avgScore,
    overallQuality: scoreToQuality(avgScore),
    segments: segmentScores,
    problemSections,
    overallEnthusiastScore: avgEnthusiastScore,
    enthusiastHighlights,
    generatedAt: new Date().toISOString(),
  };
}
