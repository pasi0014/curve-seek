import React from "react";
import clsx from "clsx";
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
    <div className="flex gap-2 px-6 py-3 overflow-x-auto border-b border-slate-700 route-picker-scroll">
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
            className={clsx(
              "flex-none min-w-[140px] p-3 bg-slate-900 border rounded-lg cursor-pointer transition-[border-color,background] duration-150 text-left font-sans text-slate-100",
              isSelected
                ? "border-blue-500 bg-[color-mix(in_srgb,#3b82f6_8%,#0f172a)]"
                : "border-slate-700 hover:bg-slate-700"
            )}
            onClick={() => onSelect(c.id)}
          >
            <div className="flex items-center gap-1 mb-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-400">{c.label}</span>
              {isFastest && (
                <span className="inline-block px-1 py-px rounded-[3px] text-[9px] font-bold uppercase tracking-wide bg-blue-500/20 text-blue-500">
                  Fastest
                </span>
              )}
              {isRecommended && viewMode === "enthusiast" && (
                <span className="inline-block px-1 py-px rounded-[3px] text-[9px] font-bold uppercase tracking-wide bg-violet-500/20 text-violet-500">
                  Recommended
                </span>
              )}
            </div>
            <div className="text-[22px] font-bold tabular-nums mb-1">{score}</div>
            <div className="flex gap-3 text-[11px] text-slate-500 mb-1">
              <span>{formatDistance(c.route.distanceMeters)}</span>
              <span>{formatDuration(c.route.durationSeconds)}</span>
            </div>
            {!isFastest && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
                  {formatDelta(distDelta, "km")}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
                  {formatDelta(durDelta, "min")}
                </span>
                {scoreDelta !== 0 && (
                  <span className={clsx(
                    "text-[10px] font-semibold tabular-nums",
                    scoreDelta > 0 ? "text-green-500" : "text-slate-500"
                  )}>
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
