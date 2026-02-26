import React, { useEffect, useState, useRef } from "react";

/**
 * Landing 4 — "Kinetic Data"
 * Bloomberg Terminal meets F1 telemetry. Dense, data-forward dashboard aesthetic.
 * Near-black background, cyan/teal accent, orange highlights.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface PanelProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  accent?: string;
}

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  triggered: boolean;
}

interface BarChartItem {
  label: string;
  score: number;
  color: string;
}

interface RouteData {
  name: string;
  color: string;
  scores: { label: string; value: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CYAN = "#22d3ee";
const ORANGE = "#f97316";
const BG = "#0b0f14";

const TICKER_ITEMS = [
  "CURVATURE: 47°/km",
  "ELEV: +340m",
  "SURFACE: ASPHALT",
  "FLOW: 92",
  "ROADS INDEXED: 48,291",
  "ACTIVE SESSIONS: 127",
  "TOP SCORE: 98 — HWY-60 ONTARIO",
  "AVG CURVATURE: 31°/km",
  "NEW ROUTES: +14 TODAY",
  "SCAN REGION: BC INTERIOR",
  "PEAK ELEVATION: 1,847m",
  "SURFACE QUALITY: 84/100",
];

const BAR_DATA: BarChartItem[] = [
  { label: "CURVATURE", score: 94, color: CYAN },
  { label: "ELEVATION", score: 88, color: "#06b6d4" },
  { label: "SURFACE", score: 76, color: "#0891b2" },
  { label: "FLOW INDEX", score: 92, color: CYAN },
  { label: "DISCOVERY", score: 81, color: "#0e7490" },
];

const ROUTE_DATA: RouteData[] = [
  {
    name: "ICEFIELDS PKWY — AB",
    color: CYAN,
    scores: [
      { label: "CURVE", value: 91 },
      { label: "ELEV", value: 97 },
      { label: "SURF", value: 88 },
      { label: "FLOW", value: 94 },
    ],
  },
  {
    name: "SEA-TO-SKY — BC",
    color: ORANGE,
    scores: [
      { label: "CURVE", value: 87 },
      { label: "ELEV", value: 93 },
      { label: "SURF", value: 92 },
      { label: "FLOW", value: 89 },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function DashPanel({ label, children, className = "", accent = CYAN }: PanelProps) {
  return (
    <div
      className={`relative border bg-opacity-5 ${className}`}
      style={{
        borderColor: `${accent}30`,
        background: `linear-gradient(135deg, ${accent}06 0%, transparent 60%)`,
      }}
    >
      {/* Panel header bar */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b text-[10px] tracking-[0.25em] uppercase"
        style={{
          borderColor: `${accent}25`,
          fontFamily: "'IBM Plex Mono', monospace",
          color: `${accent}99`,
        }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
        />
        {label}
        <div className="ml-auto flex gap-1">
          <div className="w-4 h-[1px]" style={{ background: `${accent}40` }} />
          <div className="w-2 h-[1px]" style={{ background: `${accent}40` }} />
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function AnimatedCounter({
  target,
  duration = 1800,
  suffix = "",
  prefix = "",
  decimals = 0,
  triggered,
}: AnimatedCounterProps) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!triggered) return;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [triggered, target, duration, decimals]);

  return (
    <span>
      {prefix}
      {decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString()}
      {suffix}
    </span>
  );
}

function CurvatureLineChart() {
  const pathRef = useRef<SVGPathElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDrawn(true), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!drawn || !pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    pathRef.current.style.strokeDasharray = `${len}`;
    pathRef.current.style.strokeDashoffset = `${len}`;
    pathRef.current.getBoundingClientRect();
    pathRef.current.style.transition = "stroke-dashoffset 2.4s cubic-bezier(0.4, 0, 0.2, 1)";
    pathRef.current.style.strokeDashoffset = "0";
  }, [drawn]);

  const w = 480;
  const h = 120;
  // Curvature profile — peaks representing sharp curves
  const points = [
    [0, 100], [30, 95], [55, 60], [70, 40], [85, 70], [105, 35], [125, 20],
    [145, 50], [165, 80], [185, 55], [210, 15], [235, 40], [255, 65],
    [275, 30], [300, 18], [325, 45], [350, 70], [375, 40], [400, 25],
    [420, 55], [445, 80], [470, 90], [480, 88],
  ];

  const d = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");

  const fillD = `${d} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 120 }}>
      <defs>
        <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CYAN} stopOpacity="0.3" />
          <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Grid lines */}
      {[20, 50, 80].map((y) => (
        <line key={y} x1="0" y1={y} x2={w} y2={y} stroke={`${CYAN}12`} strokeWidth="1" />
      ))}
      {/* Fill area */}
      {drawn && (
        <path d={fillD} fill="url(#curveGrad)" style={{ animation: "fadeIn 2.8s ease forwards" }} />
      )}
      {/* Main line */}
      <path ref={pathRef} d={d} fill="none" stroke={CYAN} strokeWidth="2" filter="url(#glow)" />
      {/* Highlight peaks */}
      {[[125, 20], [300, 18]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill={CYAN} filter="url(#glow)" style={{ animation: "pulse 2s infinite" }} />
      ))}
    </svg>
  );
}

function SpeedometerGauge({ value, max = 100, label, color = CYAN }: { value: number; max?: number; label: string; color?: string }) {
  const [sweepValue, setSweepValue] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setSweepValue(value), 200);
        }
      },
      { threshold: 0.5 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [value]);

  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = 44;
  const startAngle = -220;
  const endAngle = 40;
  const totalArc = endAngle - startAngle;
  const fillArc = (sweepValue / max) * totalArc;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (from: number, to: number, radius: number) => {
    const x1 = cx + radius * Math.cos(toRad(from));
    const y1 = cy + radius * Math.sin(toRad(from));
    const x2 = cx + radius * Math.cos(toRad(to));
    const y2 = cy + radius * Math.sin(toRad(to));
    const large = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  const needleAngle = startAngle + fillArc;
  const needleTipX = cx + (r - 8) * Math.cos(toRad(needleAngle));
  const needleTipY = cy + (r - 8) * Math.sin(toRad(needleAngle));

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-2">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <defs>
          <linearGradient id={`gaugeGrad-${label}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={`${color}66`} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d={arcPath(startAngle, endAngle, r)}
          fill="none"
          stroke={`${color}18`}
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Fill arc */}
        <path
          d={arcPath(startAngle, startAngle + fillArc, r)}
          fill="none"
          stroke={`url(#gaugeGrad-${label})`}
          strokeWidth="6"
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const ang = startAngle + (pct / 100) * totalArc;
          const innerR = r - 10;
          const outerR = r - 6;
          return (
            <line
              key={pct}
              x1={cx + innerR * Math.cos(toRad(ang))}
              y1={cy + innerR * Math.sin(toRad(ang))}
              x2={cx + outerR * Math.cos(toRad(ang))}
              y2={cy + outerR * Math.sin(toRad(ang))}
              stroke={`${color}55`}
              strokeWidth="1"
            />
          );
        })}
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleTipX}
          y2={needleTipY}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ transition: "all 1.6s cubic-bezier(0.34, 1.56, 0.64, 1)", filter: `drop-shadow(0 0 4px ${color})` }}
        />
        <circle cx={cx} cy={cy} r="3" fill={color} />
        {/* Value text */}
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fill={color}
          fontSize="14"
          fontWeight="700"
          fontFamily="'IBM Plex Mono', monospace"
        >
          {sweepValue}
        </text>
      </svg>
      <span
        className="text-[9px] tracking-[0.25em] uppercase"
        style={{ fontFamily: "'IBM Plex Mono', monospace", color: `${color}80` }}
      >
        {label}
      </span>
    </div>
  );
}

function BarChart({ items, triggered }: { items: BarChartItem[]; triggered: boolean }) {
  return (
    <div className="flex items-end gap-3 h-36">
      {items.map((item, i) => (
        <div key={item.label} className="flex flex-col items-center gap-2 flex-1">
          <span
            className="text-[9px] tabular-nums"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: `${item.color}cc` }}
          >
            {triggered ? item.score : 0}
          </span>
          <div className="relative w-full flex items-end" style={{ height: 100 }}>
            <div
              className="absolute bottom-0 w-full rounded-sm"
              style={{
                background: `linear-gradient(0deg, ${item.color}cc 0%, ${item.color}55 100%)`,
                boxShadow: `0 0 12px ${item.color}44`,
                height: triggered ? `${item.score}%` : "0%",
                transition: `height 1.2s cubic-bezier(0.34, 1.2, 0.64, 1) ${i * 120}ms`,
              }}
            />
            {/* Grid lines inside bar area */}
            {[25, 50, 75].map((pct) => (
              <div
                key={pct}
                className="absolute w-full"
                style={{ bottom: `${pct}%`, borderTop: `1px dashed ${item.color}18` }}
              />
            ))}
          </div>
          <span
            className="text-[8px] tracking-[0.15em] text-center"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: `${item.color}55` }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function TerminalTyper({ lines, triggered }: { lines: string[]; triggered: boolean }) {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (!triggered) return;
    setDisplayed([]);
    setCurrentLine(0);
    setCurrentChar(0);
  }, [triggered]);

  useEffect(() => {
    if (!triggered) return;
    if (currentLine >= lines.length) return;

    const line = lines[currentLine];
    if (currentChar < line.length) {
      const t = setTimeout(() => {
        setCurrentChar((c) => c + 1);
        setDisplayed((prev) => {
          const next = [...prev];
          next[currentLine] = line.slice(0, currentChar + 1);
          return next;
        });
      }, 28);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [triggered, currentLine, currentChar, lines]);

  useEffect(() => {
    const t = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="text-xs leading-6 space-y-0.5"
      style={{ fontFamily: "'IBM Plex Mono', monospace", color: `${CYAN}cc` }}
    >
      {lines.map((_, i) => (
        <div key={i} className="flex gap-2">
          <span style={{ color: `${CYAN}50` }}>{">"}</span>
          <span>
            {displayed[i] ?? ""}
            {i === currentLine && showCursor && (
              <span style={{ borderRight: `2px solid ${CYAN}`, marginLeft: 1 }}>&nbsp;</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function DataTicker() {
  const text = TICKER_ITEMS.join("   ·   ");

  return (
    <div
      className="overflow-hidden border-b"
      style={{
        borderColor: `${CYAN}20`,
        background: `${CYAN}06`,
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <div
        className="flex whitespace-nowrap py-2 text-[10px] tracking-widest"
        style={{ color: `${CYAN}88`, animation: "ticker 32s linear infinite" }}
      >
        <span className="px-8">{text}</span>
        <span className="px-8" aria-hidden>{text}</span>
        <span className="px-8" aria-hidden>{text}</span>
      </div>
    </div>
  );
}

function GridBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: `
          linear-gradient(${CYAN}08 1px, transparent 1px),
          linear-gradient(90deg, ${CYAN}08 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
  );
}

function useIntersection(threshold = 0.2): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTriggered(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, triggered];
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function Landing4() {
  const [mounted, setMounted] = useState(false);
  const [telemetryRef, telemetryTriggered] = useIntersection(0.15);
  const [barRef, barTriggered] = useIntersection(0.15);
  const [routeRef, routeTriggered] = useIntersection(0.15);
  const [ctaRef, ctaTriggered] = useIntersection(0.2);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const terminalLines = [
    "INITIALIZING CURVESEEK ENGINE...",
    "LOADING ROAD DATABASE: 48,291 SEGMENTS",
    "CURVATURE ANALYSIS: READY",
    "ELEVATION PROFILER: READY",
    "SURFACE SCORING: ACTIVE",
    "SYSTEM STATUS: ALL SYSTEMS NOMINAL",
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; r: 3; }
          50%       { opacity: 0.4; r: 5; }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes blink {
          0%, 49%  { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes drift {
          0%, 100% { transform: translateX(0px); }
          50%       { transform: translateX(6px); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px ${CYAN}40, 0 0 40px ${CYAN}20; }
          50%       { box-shadow: 0 0 35px ${CYAN}70, 0 0 60px ${CYAN}35; }
        }
        @keyframes statusDot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }

        .kinetic-heading {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 0.92;
        }
        .mono {
          font-family: 'IBM Plex Mono', monospace;
        }
        .panel-container {
          border: 1px solid ${CYAN}22;
          background: linear-gradient(135deg, ${CYAN}05 0%, transparent 60%);
        }
      `}</style>

      <div
        className="min-h-screen overflow-x-hidden text-white"
        style={{ background: BG, fontFamily: "'Outfit', sans-serif" }}
      >
        <GridBackground />

        {/* Scanline overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)`,
          }}
        />

        {/* Corner accent — top-right */}
        <div
          className="fixed top-0 right-0 w-80 h-80 pointer-events-none z-0"
          style={{ background: `radial-gradient(circle at top right, ${CYAN}0a 0%, transparent 60%)` }}
        />
        {/* Corner accent — bottom-left */}
        <div
          className="fixed bottom-0 left-0 w-96 h-96 pointer-events-none z-0"
          style={{ background: `radial-gradient(circle at bottom left, ${ORANGE}06 0%, transparent 60%)` }}
        />

        {/* ───── DATA TICKER ───── */}
        <DataTicker />

        {/* ───── NAV ───── */}
        <nav
          className="relative z-40 px-6 md:px-12 py-4 border-b flex items-center justify-between"
          style={{ borderColor: `${CYAN}15` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full" style={{ background: CYAN, boxShadow: `0 0 10px ${CYAN}` }} />
            <span
              className="text-lg font-bold tracking-[0.1em]"
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: CYAN }}
            >
              CURVESEEK
            </span>
            <div
              className="text-[9px] tracking-[0.2em] px-2 py-0.5 rounded border"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                color: `${CYAN}80`,
                borderColor: `${CYAN}30`,
                background: `${CYAN}08`,
              }}
            >
              v2.4.1
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "statusDot 2s infinite" }}
              />
              <span className="mono text-[10px] tracking-widest text-white/30">LIVE</span>
            </div>
            <a
              href="/"
              className="px-5 py-2 text-xs font-semibold tracking-[0.15em] uppercase border transition-all duration-300 hover:bg-cyan-400/10"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                color: CYAN,
                borderColor: `${CYAN}40`,
              }}
            >
              LAUNCH APP
            </a>
          </div>
        </nav>

        {/* ───── HERO ───── */}
        <section className="relative z-10 px-6 md:px-12 pt-16 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-[1fr_480px] gap-8 items-start">

              {/* Left: headline + terminal */}
              <div>
                {/* System tag */}
                <div
                  className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 border text-[10px] tracking-[0.3em] uppercase"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: `${ORANGE}cc`,
                    borderColor: `${ORANGE}30`,
                    background: `${ORANGE}08`,
                  }}
                >
                  <div className="w-1 h-1 rounded-full" style={{ background: ORANGE, animation: "statusDot 1.5s infinite" }} />
                  CANADIAN ROAD INTELLIGENCE SYSTEM
                </div>

                <h1
                  className="kinetic-heading text-6xl sm:text-7xl md:text-8xl lg:text-[90px] mb-6 text-white"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "none" : "translateY(20px)",
                    transition: "opacity 0.9s ease, transform 0.9s ease",
                  }}
                >
                  EVERY
                  <br />
                  <span style={{ color: CYAN, textShadow: `0 0 60px ${CYAN}50` }}>
                    CURVE
                  </span>
                  <br />
                  COMPUTED
                </h1>

                {/* Horizontal rule */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-[1px] w-16" style={{ background: `linear-gradient(90deg, ${CYAN}, transparent)` }} />
                  <span
                    className="text-[10px] tracking-[0.3em] uppercase"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: `${CYAN}60` }}
                  >
                    48,291 ROADS INDEXED
                  </span>
                </div>

                {/* Terminal block */}
                <div
                  className="panel-container p-4 mt-8"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transition: "opacity 1s ease 0.6s",
                  }}
                >
                  <div
                    className="flex items-center gap-2 pb-3 mb-3 border-b text-[9px] tracking-widest"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: `${CYAN}50`,
                      borderColor: `${CYAN}18`,
                    }}
                  >
                    <span style={{ color: ORANGE }}>SYS</span>
                    <span>/</span>
                    <span>BOOT_SEQUENCE</span>
                  </div>
                  <TerminalTyper lines={terminalLines} triggered={mounted} />
                </div>

                {/* Stats row */}
                <div
                  className="grid grid-cols-3 gap-4 mt-6"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transition: "opacity 1s ease 0.9s",
                  }}
                >
                  {[
                    { value: 48291, label: "ROADS", suffix: "", prefix: "" },
                    { value: 98, label: "TOP SCORE", suffix: "/100", prefix: "" },
                    { value: 127, label: "ACTIVE", suffix: "", prefix: "" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="border p-3 text-center"
                      style={{ borderColor: `${CYAN}20`, background: `${CYAN}04` }}
                    >
                      <div
                        className="text-2xl font-bold tabular-nums"
                        style={{ fontFamily: "'IBM Plex Mono', monospace", color: CYAN }}
                      >
                        <AnimatedCounter
                          target={stat.value}
                          suffix={stat.suffix}
                          prefix={stat.prefix}
                          triggered={mounted}
                          duration={2000}
                        />
                      </div>
                      <div
                        className="text-[9px] tracking-[0.25em] mt-1"
                        style={{ fontFamily: "'IBM Plex Mono', monospace", color: `${CYAN}50` }}
                      >
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: curvature chart panel */}
              <div
                className="panel-container"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "none" : "translateX(20px)",
                  transition: "opacity 1s ease 0.4s, transform 1s ease 0.4s",
                }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-2.5 border-b text-[10px] tracking-[0.2em] uppercase"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: `${CYAN}80`,
                    borderColor: `${CYAN}20`,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: CYAN, boxShadow: `0 0 5px ${CYAN}` }} />
                  CURVATURE PROFILE — ICEFIELDS PKWY
                  <span className="ml-auto text-[9px]" style={{ color: ORANGE }}>LIVE</span>
                </div>
                <div className="p-4">
                  <CurvatureLineChart />

                  {/* Axis labels */}
                  <div
                    className="flex justify-between mt-2 text-[9px] tracking-widest"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: `${CYAN}40` }}
                  >
                    <span>KM 0</span>
                    <span>KM 120</span>
                    <span>KM 240</span>
                  </div>

                  {/* Data rows */}
                  <div className="mt-4 space-y-2">
                    {[
                      { key: "PEAK CURVATURE", val: "47°/km", color: CYAN },
                      { key: "ELEV GAIN", val: "+1,147m", color: CYAN },
                      { key: "FLOW INDEX", val: "94.2", color: ORANGE },
                      { key: "SURFACE", val: "ASPHALT (GOOD)", color: CYAN },
                    ].map(({ key, val, color }) => (
                      <div
                        key={key}
                        className="flex justify-between items-center py-1.5 border-b text-[10px]"
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          borderColor: `${CYAN}10`,
                        }}
                      >
                        <span style={{ color: `${CYAN}55` }}>{key}</span>
                        <span style={{ color }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── LIVE TELEMETRY ───── */}
        <section
          ref={telemetryRef}
          className="relative z-10 px-6 md:px-12 py-16 border-t"
          style={{ borderColor: `${CYAN}12` }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] flex-1" style={{ background: `linear-gradient(90deg, ${CYAN}30, transparent)` }} />
              <span
                className="text-[10px] tracking-[0.4em] uppercase"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: `${CYAN}70` }}
              >
                MODULE_02 / LIVE TELEMETRY
              </span>
              <div className="h-[1px] flex-1" style={{ background: `linear-gradient(270deg, ${CYAN}30, transparent)` }} />
            </div>

            <h2
              className="kinetic-heading text-4xl md:text-5xl mb-10"
              style={{ color: "white" }}
            >
              REAL-TIME{" "}
              <span style={{ color: CYAN }}>ROAD METRICS</span>
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { value: 91, label: "CURVATURE", color: CYAN },
                { value: 88, label: "ELEVATION", color: CYAN },
                { value: 76, label: "SURFACE", color: ORANGE },
                { value: 94, label: "FLOW INDEX", color: CYAN },
              ].map((item) => (
                <div
                  key={item.label}
                  className="panel-container flex flex-col items-center py-6"
                  style={{ borderColor: `${item.color}25` }}
                >
                  <SpeedometerGauge value={item.value} label={item.label} color={item.color} />
                </div>
              ))}
            </div>

            {/* Metric strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {[
                { label: "ROADS SCANNED TODAY", value: 1842, suffix: "" },
                { label: "AVG CURVE SCORE", value: 73, suffix: "/100" },
                { label: "ELEVATION RECORDS", value: 12, suffix: " NEW" },
                { label: "USER SESSIONS", value: 127, suffix: "" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="panel-container px-4 py-3"
                >
                  <div
                    className="text-xl font-bold tabular-nums"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: CYAN }}
                  >
                    <AnimatedCounter target={item.value} suffix={item.suffix} triggered={telemetryTriggered} duration={1600} />
                  </div>
                  <div
                    className="text-[9px] tracking-[0.2em] mt-1"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: `${CYAN}45` }}
                  >
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── FEATURE BAR CHART ───── */}
        <section
          ref={barRef}
          className="relative z-10 px-6 md:px-12 py-16 border-t"
          style={{ borderColor: `${CYAN}12` }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] flex-1" style={{ background: `linear-gradient(90deg, ${CYAN}30, transparent)` }} />
              <span
                className="text-[10px] tracking-[0.4em] uppercase"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: `${CYAN}70` }}
              >
                MODULE_03 / SCORING DIMENSIONS
              </span>
              <div className="h-[1px] flex-1" style={{ background: `linear-gradient(270deg, ${CYAN}30, transparent)` }} />
            </div>

            <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start">
              <div>
                <h2 className="kinetic-heading text-4xl md:text-5xl mb-4 text-white">
                  MULTI-AXIS<br />
                  <span style={{ color: CYAN }}>ROAD SCORING</span>
                </h2>
                <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-sm" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Every road segment analyzed across five independent dimensions.
                  Composite score computed from weighted averages tuned by real drivers.
                </p>

                <div className="space-y-4">
                  {[
                    { label: "Curvature Index", desc: "Degrees of curve per kilometre, normalized over segment length", color: CYAN },
                    { label: "Elevation Profile", desc: "Total climb, max gradient, and sustained grade analysis", color: CYAN },
                    { label: "Surface Quality", desc: "Smoothness, grip rating, and maintenance condition score", color: ORANGE },
                    { label: "Flow Factor", desc: "Pace consistency, sight-lines, and rhythm across the segment", color: CYAN },
                    { label: "Discovery Score", desc: "Remoteness, traffic density, and scenic corridor rating", color: CYAN },
                  ].map((feature) => (
                    <div
                      key={feature.label}
                      className="flex gap-3 items-start p-3 border transition-all duration-300 hover:bg-cyan-400/5"
                      style={{ borderColor: `${feature.color}18` }}
                    >
                      <div
                        className="w-1 mt-1.5 flex-shrink-0 rounded-full"
                        style={{ height: 14, background: feature.color, boxShadow: `0 0 6px ${feature.color}` }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-white/80">{feature.label}</div>
                        <div
                          className="text-[10px] mt-0.5"
                          style={{ fontFamily: "'IBM Plex Mono', monospace", color: "rgba(255,255,255,0.3)" }}
                        >
                          {feature.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel-container">
                <div
                  className="flex items-center gap-2 px-4 py-2.5 border-b text-[10px] tracking-[0.2em] uppercase"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: `${CYAN}80`,
                    borderColor: `${CYAN}20`,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: CYAN, boxShadow: `0 0 5px ${CYAN}` }} />
                  DIMENSION SCORES — NATIONAL AVG
                </div>
                <div className="p-6">
                  <BarChart items={BAR_DATA} triggered={barTriggered} />
                </div>

                {/* Score legend */}
                <div
                  className="px-6 pb-4 pt-0 grid grid-cols-3 gap-2"
                >
                  {[
                    { range: "0–40", label: "LOW", color: "#ef4444" },
                    { range: "41–75", label: "MODERATE", color: ORANGE },
                    { range: "76–100", label: "HIGH", color: CYAN },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 text-[9px]"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      <div className="w-2 h-2 rounded-sm" style={{ background: item.color }} />
                      <span style={{ color: `${item.color}cc` }}>{item.range}</span>
                      <span className="text-white/25">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── ROUTE COMPARISON ───── */}
        <section
          ref={routeRef}
          className="relative z-10 px-6 md:px-12 py-16 border-t"
          style={{ borderColor: `${CYAN}12` }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] flex-1" style={{ background: `linear-gradient(90deg, ${CYAN}30, transparent)` }} />
              <span
                className="text-[10px] tracking-[0.4em] uppercase"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: `${CYAN}70` }}
              >
                MODULE_04 / ROUTE COMPARISON
              </span>
              <div className="h-[1px] flex-1" style={{ background: `linear-gradient(270deg, ${CYAN}30, transparent)` }} />
            </div>

            <h2 className="kinetic-heading text-4xl md:text-5xl mb-10 text-white">
              COMPARE{" "}
              <span style={{ color: CYAN }}>ANY TWO ROADS</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {ROUTE_DATA.map((route) => (
                <div
                  key={route.name}
                  className="panel-container"
                  style={{ borderColor: `${route.color}25` }}
                >
                  <div
                    className="flex items-center gap-2 px-4 py-3 border-b"
                    style={{ borderColor: `${route.color}20` }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: route.color, boxShadow: `0 0 6px ${route.color}` }}
                    />
                    <span
                      className="text-[11px] font-semibold tracking-[0.15em]"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", color: route.color }}
                    >
                      {route.name}
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    {route.scores.map((score, i) => (
                      <div key={score.label}>
                        <div
                          className="flex justify-between items-center mb-1.5 text-[10px] tracking-[0.15em]"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          <span style={{ color: "rgba(255,255,255,0.35)" }}>{score.label}</span>
                          <span style={{ color: route.color }}>{score.value}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${route.color}15` }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: routeTriggered ? `${score.value}%` : "0%",
                              background: `linear-gradient(90deg, ${route.color}80, ${route.color})`,
                              boxShadow: `0 0 8px ${route.color}50`,
                              transition: `width 1.2s cubic-bezier(0.34, 1.2, 0.64, 1) ${i * 150}ms`,
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Composite score */}
                    <div
                      className="flex items-center justify-between pt-3 border-t mt-4"
                      style={{ borderColor: `${route.color}20` }}
                    >
                      <span
                        className="text-[10px] tracking-[0.2em] uppercase"
                        style={{ fontFamily: "'IBM Plex Mono', monospace", color: "rgba(255,255,255,0.3)" }}
                      >
                        COMPOSITE SCORE
                      </span>
                      <div
                        className="text-2xl font-bold tabular-nums"
                        style={{ fontFamily: "'IBM Plex Mono', monospace", color: route.color }}
                      >
                        <AnimatedCounter
                          target={Math.round(route.scores.reduce((a, s) => a + s.value, 0) / route.scores.length)}
                          triggered={routeTriggered}
                          suffix="/100"
                          duration={1400}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* VS divider badge */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center pointer-events-none" style={{ top: "50%", transform: "translate(-50%, -50%)" }}>
              <div
                className="w-10 h-10 flex items-center justify-center border text-xs font-bold"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  background: BG,
                  borderColor: `${CYAN}30`,
                  color: `${CYAN}90`,
                }}
              >
                VS
              </div>
            </div>
          </div>
        </section>

        {/* ───── CTA ───── */}
        <section
          ref={ctaRef}
          className="relative z-10 px-6 md:px-12 py-24 border-t overflow-hidden"
          style={{ borderColor: `${CYAN}12` }}
        >
          {/* CTA background grid accent */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 50% 50%, ${CYAN}06 0%, transparent 70%)` }}
          />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div
              className="inline-block mb-4 text-[10px] tracking-[0.4em] uppercase px-4 py-2 border"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                color: `${CYAN}70`,
                borderColor: `${CYAN}25`,
                background: `${CYAN}06`,
              }}
            >
              MODULE_05 / EXECUTE
            </div>

            <h2 className="kinetic-heading text-5xl md:text-6xl lg:text-7xl mb-6 text-white">
              START DISCOVERING<br />
              <span style={{ color: CYAN }}>CANADA'S BEST ROADS</span>
            </h2>

            <p
              className="text-white/35 text-sm mb-12 max-w-xl mx-auto leading-relaxed"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              48,291 road segments. Scored. Ranked. Ready for your next drive.
              No account required — just open and explore.
            </p>

            {/* Terminal CTA button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/"
                className="group relative px-10 py-4 font-bold text-sm tracking-[0.25em] uppercase border transition-all duration-300"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: BG,
                  background: CYAN,
                  borderColor: CYAN,
                  animation: ctaTriggered ? "glowPulse 3s infinite" : "none",
                  boxShadow: ctaTriggered ? `0 0 30px ${CYAN}50, 0 0 60px ${CYAN}25` : "none",
                }}
              >
                <span className="mr-2" style={{ color: `${BG}80` }}>$</span>
                EXECUTE ./curveseek
              </a>

              <a
                href="/"
                className="px-8 py-4 text-sm font-medium tracking-[0.15em] uppercase border transition-all duration-300 hover:bg-white/5"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: "rgba(255,255,255,0.45)",
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              >
                VIEW SOURCE
              </a>
            </div>
          </div>
        </section>

        {/* ───── FOOTER ───── */}
        <footer
          className="relative z-10 px-6 md:px-12 py-6 border-t"
          style={{ borderColor: `${CYAN}12` }}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-1 h-4 rounded-full"
                style={{ background: CYAN, opacity: 0.5 }}
              />
              <span
                className="text-[10px] tracking-[0.25em] uppercase"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: `${CYAN}50` }}
              >
                CURVESEEK
              </span>
              <span
                className="text-[10px] tracking-widest"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: "rgba(255,255,255,0.15)" }}
              >
                OPEN SOURCE · MIT
              </span>
            </div>

            <div className="flex items-center gap-6">
              {["STATUS: NOMINAL", "BUILD: 2.4.1", "REGION: CA"].map((item) => (
                <span
                  key={item}
                  className="text-[9px] tracking-[0.2em]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: "rgba(255,255,255,0.18)" }}
                >
                  {item}
                </span>
              ))}
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#22c55e", boxShadow: "0 0 5px #22c55e", animation: "statusDot 2.5s infinite" }}
              />
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
