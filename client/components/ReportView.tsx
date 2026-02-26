import React, { useState } from "react";
import type { RouteReport, RouteGeometry } from "../types";
import { ScoreRing } from "./ScoreRing";
import {
  scoreToQuality,
  qualityColor,
  scoreColor,
  formatDistance,
  formatDuration,
  describeProblem,
  enthusiastRating,
  enthusiastColor,
} from "../utils/helpers";
import { qualityBadgeColors, enthusiastBadgeColors } from "../utils/tw";

const badgeBase = "inline-block px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide";

export function ReportView({
  report,
  route,
  viewMode,
}: {
  report: RouteReport;
  route: RouteGeometry;
  viewMode: "condition" | "enthusiast";
}) {
  const [expandedSeg, setExpandedSeg] = useState<number | null>(null);

  if (viewMode === "enthusiast") {
    return <EnthusiastReport report={report} route={route} expandedSeg={expandedSeg} setExpandedSeg={setExpandedSeg} />;
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Score hero */}
      <div className="flex items-center gap-5">
        <ScoreRing score={report.overallScore} />
        <div>
          <h2 className="text-[15px] font-semibold mb-1">
            {report.origin} to {report.destination}
          </h2>
          <span className={`${badgeBase} ${qualityBadgeColors[report.overallQuality] ?? ""}`}>
            {report.overallQuality} condition
          </span>
          <div className="flex gap-4 mt-2">
            <span className="text-xs text-slate-500">
              <strong className="text-slate-400 font-semibold">{formatDistance(report.totalDistanceKm)}</strong>
            </span>
            <span className="text-xs text-slate-500">
              <strong className="text-slate-400 font-semibold">{formatDuration(route.durationSeconds)}</strong>
            </span>
            <span className="text-xs text-slate-500">
              {report.segments.length} segments
            </span>
          </div>
        </div>
      </div>

      {/* Problem sections */}
      {report.problemSections.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Problem Sections
          </h3>
          <div className="flex flex-col gap-2">
            {report.problemSections.map((seg) => {
              const quality = scoreToQuality(seg.compositeScore);
              const borderColor = quality === "fair" ? "border-l-amber-500" : quality === "poor" ? "border-l-orange-500" : "border-l-red-500";
              return (
                <div
                  className={`px-4 py-3 bg-slate-900 rounded-md border-l-[3px] ${borderColor} flex justify-between items-center gap-3`}
                  key={seg.segment.index}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-slate-100 mb-0.5">
                      Segment {seg.segment.index + 1}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {describeProblem(seg)} &middot;{" "}
                      {formatDistance(seg.segment.lengthMeters / 1000)}
                    </div>
                  </div>
                  <span
                    className="text-sm font-bold tabular-nums shrink-0"
                    style={{ color: scoreColor(seg.compositeScore) }}
                  >
                    {Math.round(seg.compositeScore)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Segment breakdown */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
          Segment Breakdown
        </h3>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-slate-500 border-b border-slate-700 text-[11px] uppercase tracking-wide">#</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-500 border-b border-slate-700 text-[11px] uppercase tracking-wide">Score</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-500 border-b border-slate-700 text-[11px] uppercase tracking-wide">Surface</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-500 border-b border-slate-700 text-[11px] uppercase tracking-wide">Winter</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-500 border-b border-slate-700 text-[11px] uppercase tracking-wide">Weather</th>
            </tr>
          </thead>
          <tbody>
            {report.segments.map((seg) => {
              const quality = scoreToQuality(seg.compositeScore);
              const isExpanded = expandedSeg === seg.segment.index;
              return (
                <React.Fragment key={seg.segment.index}>
                  <tr
                    onClick={() => setExpandedSeg(isExpanded ? null : seg.segment.index)}
                    className="cursor-pointer hover:bg-slate-700/30"
                  >
                    <td className="px-3 py-2 text-slate-400 border-b border-slate-700/50 align-middle">{seg.segment.index + 1}</td>
                    <td className="px-3 py-2 text-slate-400 border-b border-slate-700/50 align-middle font-bold tabular-nums">
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
                        style={{ background: qualityColor(quality) }}
                      />
                      {Math.round(seg.compositeScore)}
                    </td>
                    <td className="px-3 py-2 text-slate-400 border-b border-slate-700/50 align-middle">{seg.osmData?.surface ?? "--"}</td>
                    <td className="px-3 py-2 text-slate-400 border-b border-slate-700/50 align-middle">
                      {seg.winterCondition ? seg.winterCondition.status.replace("_", " ") : "--"}
                    </td>
                    <td className="px-3 py-2 text-slate-400 border-b border-slate-700/50 align-middle">
                      {seg.weatherData ? `${seg.weatherData.temperature}C` : "--"}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="text-[11px] text-slate-500 leading-relaxed">
                      <td colSpan={5} className="px-3 py-2 pb-3 border-b border-slate-700">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <dt className="text-slate-500">Length</dt>
                          <dd className="text-slate-400 font-medium">{formatDistance(seg.segment.lengthMeters / 1000)}</dd>
                          <dt className="text-slate-500">Smoothness</dt>
                          <dd className="text-slate-400 font-medium">{seg.osmData?.smoothness ?? "unknown"}</dd>
                          <dt className="text-slate-500">OSM score</dt>
                          <dd className="text-slate-400 font-medium">{Math.round(seg.osmScore)}</dd>
                          <dt className="text-slate-500">Winter score</dt>
                          <dd className="text-slate-400 font-medium">{Math.round(seg.winterScore)}</dd>
                          <dt className="text-slate-500">Weather score</dt>
                          <dd className="text-slate-400 font-medium">{Math.round(seg.weatherScore)}</dd>
                          <dt className="text-slate-500">Crowd score</dt>
                          <dd className="text-slate-400 font-medium">{Math.round(seg.crowdScore)}</dd>
                          {seg.weatherData && (
                            <>
                              <dt className="text-slate-500">Wind</dt>
                              <dd className="text-slate-400 font-medium">{seg.weatherData.windSpeed} km/h</dd>
                              <dt className="text-slate-500">Ice risk</dt>
                              <dd className="text-slate-400 font-medium">{seg.weatherData.iceRisk ? "Yes" : "No"}</dd>
                            </>
                          )}
                        </dl>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EnthusiastReport({
  report,
  route,
  expandedSeg,
  setExpandedSeg,
}: {
  report: RouteReport;
  route: RouteGeometry;
  expandedSeg: number | null;
  setExpandedSeg: (v: number | null) => void;
}) {
  const rating = enthusiastRating(report.overallEnthusiastScore);
  const color = enthusiastColor(report.overallEnthusiastScore);

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Enthusiast score hero */}
      <div className="flex items-center gap-5">
        <ScoreRing score={report.overallEnthusiastScore} color={color} />
        <div>
          <h2 className="text-[15px] font-semibold mb-1">
            {report.origin} to {report.destination}
          </h2>
          <span className={`${badgeBase} ${enthusiastBadgeColors[rating] ?? ""}`}>
            {rating}
          </span>
          <div className="flex gap-4 mt-2">
            <span className="text-xs text-slate-500">
              <strong className="text-slate-400 font-semibold">{formatDistance(report.totalDistanceKm)}</strong>
            </span>
            <span className="text-xs text-slate-500">
              <strong className="text-slate-400 font-semibold">{formatDuration(route.durationSeconds)}</strong>
            </span>
            <span className="text-xs text-slate-500">
              {report.segments.length} segments
            </span>
          </div>
        </div>
      </div>

      {/* Enthusiast highlights */}
      {report.enthusiastHighlights.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Enthusiast Highlights
          </h3>
          <div className="flex flex-col gap-2">
            {report.enthusiastHighlights.map((seg) => {
              const ed = seg.enthusiastData;
              return (
                <div
                  className="px-4 py-3 bg-slate-900 rounded-md border-l-[3px] border-l-violet-500 flex justify-between items-center gap-3"
                  key={seg.segment.index}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-slate-100 mb-0.5">
                      {ed?.roadName ?? `Segment ${seg.segment.index + 1}`}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {ed ? `${ed.curvaturePerKm} deg/km` : ""}
                      {ed?.elevationPerKm ? ` · ${ed.elevationPerKm} m/km elevation` : ""}
                      {ed?.highwayType ? ` · ${ed.highwayType}` : ""}
                    </div>
                  </div>
                  <span
                    className="text-sm font-bold tabular-nums shrink-0"
                    style={{ color: enthusiastColor(seg.enthusiastScore) }}
                  >
                    {Math.round(seg.enthusiastScore)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Segment breakdown — enthusiast mode */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
          Segment Breakdown
        </h3>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-slate-500 border-b border-slate-700 text-[11px] uppercase tracking-wide">#</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-500 border-b border-slate-700 text-[11px] uppercase tracking-wide">Fun</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-500 border-b border-slate-700 text-[11px] uppercase tracking-wide">Curves</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-500 border-b border-slate-700 text-[11px] uppercase tracking-wide">Elev</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-500 border-b border-slate-700 text-[11px] uppercase tracking-wide">Road</th>
            </tr>
          </thead>
          <tbody>
            {report.segments.map((seg) => {
              const ed = seg.enthusiastData;
              const isExpanded = expandedSeg === seg.segment.index;
              return (
                <React.Fragment key={seg.segment.index}>
                  <tr
                    onClick={() => setExpandedSeg(isExpanded ? null : seg.segment.index)}
                    className="cursor-pointer hover:bg-slate-700/30"
                  >
                    <td className="px-3 py-2 text-slate-400 border-b border-slate-700/50 align-middle">{seg.segment.index + 1}</td>
                    <td className="px-3 py-2 text-slate-400 border-b border-slate-700/50 align-middle font-bold tabular-nums">
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
                        style={{ background: enthusiastColor(seg.enthusiastScore) }}
                      />
                      {Math.round(seg.enthusiastScore)}
                    </td>
                    <td className="px-3 py-2 text-slate-400 border-b border-slate-700/50 align-middle">{ed ? `${ed.curvaturePerKm}` : "--"}</td>
                    <td className="px-3 py-2 text-slate-400 border-b border-slate-700/50 align-middle">{ed ? `${ed.elevationPerKm}` : "--"}</td>
                    <td className="px-3 py-2 text-slate-400 border-b border-slate-700/50 align-middle">{ed?.highwayType ?? "--"}</td>
                  </tr>
                  {isExpanded && ed && (
                    <tr className="text-[11px] text-slate-500 leading-relaxed">
                      <td colSpan={5} className="px-3 py-2 pb-3 border-b border-slate-700">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <dt className="text-slate-500">Road name</dt>
                          <dd className="text-slate-400 font-medium">{ed.roadName ?? "unknown"}</dd>
                          <dt className="text-slate-500">Length</dt>
                          <dd className="text-slate-400 font-medium">{formatDistance(seg.segment.lengthMeters / 1000)}</dd>
                          <dt className="text-slate-500">Curvature score</dt>
                          <dd className="text-slate-400 font-medium">{ed.curvatureScore}</dd>
                          <dt className="text-slate-500">Elevation score</dt>
                          <dd className="text-slate-400 font-medium">{ed.elevationScore}</dd>
                          <dt className="text-slate-500">Surface score</dt>
                          <dd className="text-slate-400 font-medium">{ed.surfaceScore}</dd>
                          <dt className="text-slate-500">Character score</dt>
                          <dd className="text-slate-400 font-medium">{ed.characterScore}</dd>
                          <dt className="text-slate-500">Corners</dt>
                          <dd className="text-slate-400 font-medium">{ed.cornerCount}</dd>
                          <dt className="text-slate-500">Flow</dt>
                          <dd className="text-slate-400 font-medium">{ed.flowScore}</dd>
                          <dt className="text-slate-500">Max gradient</dt>
                          <dd className="text-slate-400 font-medium">{ed.maxGradientPct}%</dd>
                          <dt className="text-slate-500">Speed limit</dt>
                          <dd className="text-slate-400 font-medium">{ed.maxspeed ?? "unknown"}</dd>
                          <dt className="text-slate-500">Lanes</dt>
                          <dd className="text-slate-400 font-medium">{ed.lanes ?? "unknown"}</dd>
                        </dl>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
