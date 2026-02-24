import React from "react";
import type { RouteCandidate } from "../types";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDelta(value: number, unit: string): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(unit === "min" ? 0 : 1)} ${unit}`;
}

export function RoutePicker({
  candidates,
  selectedId,
  recommended,
  viewMode,
  onSelect,
}: {
  candidates: RouteCandidate[];
  selectedId: string;
  recommended: string;
  viewMode: "condition" | "enthusiast";
  onSelect: (id: string) => void;
}) {
  if (candidates.length <= 1) return null;

  const fastest = candidates[0]!;
  const baseDist = fastest.route.distanceMeters;
  const baseDur = fastest.route.durationSeconds;
  const baseScore = viewMode === "enthusiast"
    ? fastest.report.overallEnthusiastScore
    : fastest.report.overallScore;

  return (
    <div className="route-picker">
      {candidates.map((c) => {
        const isSelected = c.id === selectedId;
        const isRecommended = c.id === recommended;
        const isFastest = c.id === fastest.id;

        const distDelta = (c.route.distanceMeters - baseDist) / 1000;
        const durDelta = (c.route.durationSeconds - baseDur) / 60;
        const score = viewMode === "enthusiast"
          ? c.report.overallEnthusiastScore
          : c.report.overallScore;
        const scoreDelta = score - baseScore;

        return (
          <button
            key={c.id}
            className={`route-card${isSelected ? " selected" : ""}`}
            onClick={() => onSelect(c.id)}
          >
            <div className="route-card-header">
              <span className="route-card-label">{c.label}</span>
              {isFastest && <span className="route-badge fastest">Fastest</span>}
              {isRecommended && viewMode === "enthusiast" && (
                <span className="route-badge recommended">Recommended</span>
              )}
            </div>
            <div className="route-card-score">{score}</div>
            <div className="route-card-stats">
              <span>{formatDistance(c.route.distanceMeters)}</span>
              <span>{formatDuration(c.route.durationSeconds)}</span>
            </div>
            {!isFastest && (
              <div className="route-card-deltas">
                <span className="route-delta">{formatDelta(distDelta, "km")}</span>
                <span className="route-delta">{formatDelta(durDelta, "min")}</span>
                {scoreDelta !== 0 && (
                  <span className={`route-delta${scoreDelta > 0 ? " positive" : ""}`}>
                    {formatDelta(scoreDelta, "pts")}
                  </span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
