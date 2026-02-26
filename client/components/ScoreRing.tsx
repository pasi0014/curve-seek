import React from "react";
import { scoreColor } from "../utils/helpers";

export function ScoreRing({ score, size = 80, color: colorOverride }: { score: number; size?: number; color?: string }) {
  const radius = size * 0.425;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = colorOverride ?? scoreColor(score);
  const fontSize = size * 0.275;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle className="score-ring-bg" cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className="score-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-bold tabular-nums"
        style={{ color, fontSize }}
      >
        {Math.round(score)}
      </span>
    </div>
  );
}
