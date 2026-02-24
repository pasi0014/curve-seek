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
    <div className="report">
      {/* Score hero */}
      <div className="score-hero">
        <ScoreRing score={report.overallScore} />
        <div className="score-meta">
          <h2>
            {report.origin} to {report.destination}
          </h2>
          <span
            className="quality-badge"
            data-quality={report.overallQuality}
          >
            {report.overallQuality} condition
          </span>
          <div className="score-stats">
            <span className="score-stat">
              <strong>{formatDistance(report.totalDistanceKm)}</strong>
            </span>
            <span className="score-stat">
              <strong>{formatDuration(route.durationSeconds)}</strong>
            </span>
            <span className="score-stat">
              {report.segments.length} segments
            </span>
          </div>
        </div>
      </div>

      {/* Problem sections */}
      {report.problemSections.length > 0 && (
        <div className="report-section">
          <h3>Problem Sections</h3>
          <div className="problem-list">
            {report.problemSections.map((seg) => {
              const quality = scoreToQuality(seg.compositeScore);
              return (
                <div
                  className="problem-card"
                  data-quality={quality}
                  key={seg.segment.index}
                >
                  <div className="problem-info">
                    <div className="problem-title">
                      Segment {seg.segment.index + 1}
                    </div>
                    <div className="problem-detail">
                      {describeProblem(seg)} &middot;{" "}
                      {formatDistance(seg.segment.lengthMeters / 1000)}
                    </div>
                  </div>
                  <span
                    className="problem-score"
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
      <div className="report-section">
        <h3>Segment Breakdown</h3>
        <table className="segment-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Score</th>
              <th>Surface</th>
              <th>Winter</th>
              <th>Weather</th>
            </tr>
          </thead>
          <tbody>
            {report.segments.map((seg) => {
              const quality = scoreToQuality(seg.compositeScore);
              const isExpanded = expandedSeg === seg.segment.index;
              return (
                <React.Fragment key={seg.segment.index}>
                  <tr
                    onClick={() =>
                      setExpandedSeg(isExpanded ? null : seg.segment.index)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <td>{seg.segment.index + 1}</td>
                    <td className="score-cell">
                      <span
                        className="score-dot"
                        style={{ background: qualityColor(quality) }}
                      />
                      {Math.round(seg.compositeScore)}
                    </td>
                    <td>{seg.osmData?.surface ?? "--"}</td>
                    <td>
                      {seg.winterCondition
                        ? seg.winterCondition.status.replace("_", " ")
                        : "--"}
                    </td>
                    <td>
                      {seg.weatherData
                        ? `${seg.weatherData.temperature}C`
                        : "--"}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="segment-detail">
                      <td colSpan={5}>
                        <dl className="detail-grid">
                          <dt>Length</dt>
                          <dd>
                            {formatDistance(seg.segment.lengthMeters / 1000)}
                          </dd>
                          <dt>Smoothness</dt>
                          <dd>{seg.osmData?.smoothness ?? "unknown"}</dd>
                          <dt>OSM score</dt>
                          <dd>{Math.round(seg.osmScore)}</dd>
                          <dt>Winter score</dt>
                          <dd>{Math.round(seg.winterScore)}</dd>
                          <dt>Weather score</dt>
                          <dd>{Math.round(seg.weatherScore)}</dd>
                          <dt>Crowd score</dt>
                          <dd>{Math.round(seg.crowdScore)}</dd>
                          {seg.weatherData && (
                            <>
                              <dt>Wind</dt>
                              <dd>{seg.weatherData.windSpeed} km/h</dd>
                              <dt>Ice risk</dt>
                              <dd>{seg.weatherData.iceRisk ? "Yes" : "No"}</dd>
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
    <div className="report">
      {/* Enthusiast score hero */}
      <div className="score-hero">
        <ScoreRing score={report.overallEnthusiastScore} color={color} />
        <div className="score-meta">
          <h2>
            {report.origin} to {report.destination}
          </h2>
          <span
            className="quality-badge enthusiast-badge"
            data-enthusiast={rating}
          >
            {rating}
          </span>
          <div className="score-stats">
            <span className="score-stat">
              <strong>{formatDistance(report.totalDistanceKm)}</strong>
            </span>
            <span className="score-stat">
              <strong>{formatDuration(route.durationSeconds)}</strong>
            </span>
            <span className="score-stat">
              {report.segments.length} segments
            </span>
          </div>
        </div>
      </div>

      {/* Enthusiast highlights */}
      {report.enthusiastHighlights.length > 0 && (
        <div className="report-section">
          <h3>Enthusiast Highlights</h3>
          <div className="problem-list">
            {report.enthusiastHighlights.map((seg) => {
              const ed = seg.enthusiastData;
              return (
                <div
                  className="enthusiast-highlight"
                  key={seg.segment.index}
                >
                  <div className="problem-info">
                    <div className="problem-title">
                      {ed?.roadName ?? `Segment ${seg.segment.index + 1}`}
                    </div>
                    <div className="problem-detail">
                      {ed ? `${ed.curvaturePerKm} deg/km` : ""}
                      {ed?.elevationPerKm ? ` · ${ed.elevationPerKm} m/km elevation` : ""}
                      {ed?.highwayType ? ` · ${ed.highwayType}` : ""}
                    </div>
                  </div>
                  <span
                    className="problem-score"
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
      <div className="report-section">
        <h3>Segment Breakdown</h3>
        <table className="segment-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Fun</th>
              <th>Curves</th>
              <th>Elev</th>
              <th>Road</th>
            </tr>
          </thead>
          <tbody>
            {report.segments.map((seg) => {
              const ed = seg.enthusiastData;
              const isExpanded = expandedSeg === seg.segment.index;
              return (
                <React.Fragment key={seg.segment.index}>
                  <tr
                    onClick={() =>
                      setExpandedSeg(isExpanded ? null : seg.segment.index)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <td>{seg.segment.index + 1}</td>
                    <td className="score-cell">
                      <span
                        className="score-dot"
                        style={{ background: enthusiastColor(seg.enthusiastScore) }}
                      />
                      {Math.round(seg.enthusiastScore)}
                    </td>
                    <td>{ed ? `${ed.curvaturePerKm}` : "--"}</td>
                    <td>{ed ? `${ed.elevationPerKm}` : "--"}</td>
                    <td>{ed?.highwayType ?? "--"}</td>
                  </tr>
                  {isExpanded && ed && (
                    <tr className="segment-detail">
                      <td colSpan={5}>
                        <dl className="detail-grid">
                          <dt>Road name</dt>
                          <dd>{ed.roadName ?? "unknown"}</dd>
                          <dt>Length</dt>
                          <dd>{formatDistance(seg.segment.lengthMeters / 1000)}</dd>
                          <dt>Curvature score</dt>
                          <dd>{ed.curvatureScore}</dd>
                          <dt>Elevation score</dt>
                          <dd>{ed.elevationScore}</dd>
                          <dt>Surface score</dt>
                          <dd>{ed.surfaceScore}</dd>
                          <dt>Character score</dt>
                          <dd>{ed.characterScore}</dd>
                          <dt>Corners</dt>
                          <dd>{ed.cornerCount}</dd>
                          <dt>Flow</dt>
                          <dd>{ed.flowScore}</dd>
                          <dt>Max gradient</dt>
                          <dd>{ed.maxGradientPct}%</dd>
                          <dt>Speed limit</dt>
                          <dd>{ed.maxspeed ?? "unknown"}</dd>
                          <dt>Lanes</dt>
                          <dd>{ed.lanes ?? "unknown"}</dd>
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
