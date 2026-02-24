import type { RoadQuality, SegmentScore } from "../types";

export type EnthusiastRating = "thrilling" | "fun" | "moderate" | "boring";

export function enthusiastRating(score: number): EnthusiastRating {
  if (score >= 75) return "thrilling";
  if (score >= 55) return "fun";
  if (score >= 35) return "moderate";
  return "boring";
}

export function enthusiastColor(score: number): string {
  const rating = enthusiastRating(score);
  const colors: Record<EnthusiastRating, string> = {
    thrilling: "#8b5cf6",
    fun: "#3b82f6",
    moderate: "#6b7280",
    boring: "#d1d5db",
  };
  return colors[rating];
}

export function scoreToQuality(score: number): RoadQuality {
  if (score >= 75) return "good";
  if (score >= 55) return "fair";
  if (score >= 35) return "poor";
  return "bad";
}

export function qualityColor(quality: RoadQuality): string {
  const map: Record<RoadQuality, string> = {
    good: "#22c55e",
    fair: "#f59e0b",
    poor: "#f97316",
    bad: "#ef4444",
  };
  return map[quality];
}

export function scoreColor(score: number): string {
  return qualityColor(scoreToQuality(score));
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function describeProblem(seg: SegmentScore): string {
  const parts: string[] = [];
  if (seg.osmData?.surface) parts.push(seg.osmData.surface);
  if (seg.winterCondition && seg.winterCondition.status !== "bare")
    parts.push(seg.winterCondition.status.replace("_", " "));
  if (seg.weatherData?.iceRisk) parts.push("ice risk");
  if (seg.weatherData?.precipitation) parts.push(seg.weatherData.precipitation);
  return parts.length > 0 ? parts.join(", ") : "low composite score";
}
