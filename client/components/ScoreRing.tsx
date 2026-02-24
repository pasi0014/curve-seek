import React from "react";
import { scoreColor } from "../utils/helpers";

export function ScoreRing({ score, color: colorOverride }: { score: number; color?: string }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = colorOverride ?? scoreColor(score);

  return (
    <div className="score-ring">
      <svg viewBox="0 0 80 80">
        <circle className="score-ring-bg" cx="40" cy="40" r={radius} />
        <circle
          className="score-ring-fill"
          cx="40"
          cy="40"
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="score-ring-value" style={{ color }}>
        {Math.round(score)}
      </span>
    </div>
  );
}
