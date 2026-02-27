"use client";

import { TerrainRoadCanvas } from "@/components/terrain-road-canvas";
import React, { useEffect, useState, useRef } from "react";

/**
 * Landing 2 — "RAW CONCRETE"
 * Brutalist: exposed structure, raw edges, monospaced type, harsh contrast.
 * Concrete gray + electric lime accents. Overlapping elements, visible grid,
 * glitch effects, aggressive SVG path animations. Nothing is precious.
 *
 * Canvas: Real OpenTopoMap tiles of Gatineau Park (Champlain Parkway) with
 * animated car icon driving along the winding road.
 */

/* ── Glitch text component ── */
function GlitchText({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden
        className="absolute top-0 left-0 z-0 text-[#a3e635] opacity-70"
        style={{
          clipPath: "polygon(0 0, 100% 0, 100% 35%, 0 35%)",
          transform: "translate(3px, -2px)",
          animation: "glitchTop 3s infinite",
        }}
      >
        {children}
      </span>
      <span
        aria-hidden
        className="absolute top-0 left-0 z-0 text-[#f43f5e] opacity-50"
        style={{
          clipPath: "polygon(0 65%, 100% 65%, 100% 100%, 0 100%)",
          transform: "translate(-3px, 2px)",
          animation: "glitchBottom 3s infinite",
        }}
      >
        {children}
      </span>
    </span>
  );
}

/* ── Counter that counts up on scroll ── */
function Counter({
  value,
  suffix = "",
  label,
  delay = 0,
}: {
  value: number;
  suffix?: string;
  label: string;
  delay?: number;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) setTimeout(() => setStarted(true), delay);
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let frame: number;
    const duration = 1500;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Eased
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, value]);

  return (
    <div
      ref={ref}
      className="border border-[#a3e635]/20 p-6 md:p-8 relative group hover:bg-[#a3e635]/5 transition-colors duration-300"
    >
      <div
        className="text-5xl md:text-7xl font-bold text-[#a3e635] tabular-nums leading-none mb-3"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {count}
        {suffix}
      </div>
      <div
        className="text-xs uppercase tracking-[0.3em] text-neutral-500"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {label}
      </div>
      {/* Corner markers */}
      <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#a3e635]" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#a3e635]" />
    </div>
  );
}

/* ── Horizontal marquee ── */
function Marquee() {
  const items = [
    "CURVATURE ●",
    "ELEVATION ●",
    "SURFACE ●",
    "FLOW ●",
    "SWITCHBACKS ●",
    "GRADIENT ●",
    "CORNERS ●",
    "RHYTHM ●",
  ];
  const text = items.join("  ");
  return (
    <div className="overflow-hidden border-y border-[#a3e635]/20 py-4 select-none">
      <div
        className="flex whitespace-nowrap"
        style={{ animation: "marqueeScroll 20s linear infinite" }}
      >
        <span
          className="text-sm tracking-[0.4em] uppercase text-[#a3e635]/30 px-4"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          {text}&nbsp;&nbsp;{text}
        </span>
        <span
          className="text-sm tracking-[0.4em] uppercase text-[#a3e635]/30 px-4"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          {text}&nbsp;&nbsp;{text}
        </span>
      </div>
    </div>
  );
}

/* ── Pulsing cursor block ── */
function Cursor() {
  return (
    <span
      className="inline-block w-[0.6em] h-[1.1em] bg-[#a3e635] align-text-bottom ml-1"
      style={{ animation: "cursorBlink 1s steps(2) infinite" }}
    />
  );
}

/* ── Scroll-triggered reveal wrapper ── */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Animated curvature waveform SVG ── */
function CurvatureWaveform() {
  const [inView, setInView] = useState(false);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Generate a winding curvature path
  const points: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const x = (i / 100) * 600;
    const y =
      60 +
      Math.sin(i * 0.12) * 25 +
      Math.sin(i * 0.05) * 15 +
      Math.cos(i * 0.08) * 10;
    points.push(`${x},${y}`);
  }
  const pathD = `M${points.join(" L")}`;

  return (
    <svg
      ref={ref}
      viewBox="0 0 600 120"
      className="w-full h-auto"
      preserveAspectRatio="none"
    >
      {/* Grid lines */}
      {[20, 40, 60, 80, 100].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="600"
          y2={y}
          stroke="rgba(163,230,53,0.06)"
          strokeWidth="1"
        />
      ))}
      {/* Glow fill */}
      <defs>
        <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a3e635" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathD} L600,120 L0,120 Z`}
        fill="url(#waveFill)"
        style={{
          animation: inView ? "elevationReveal 2s ease-out forwards" : "none",
          clipPath: inView ? undefined : "inset(0 100% 0 0)",
        }}
      />
      {/* Main line */}
      <path
        d={pathD}
        fill="none"
        stroke="#a3e635"
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          strokeDasharray: 1200,
          strokeDashoffset: inView ? 0 : 1200,
          transition: "stroke-dashoffset 2.5s ease-out",
        }}
      />
      {/* Peak markers */}
      {[15, 38, 62, 85].map((i) => {
        const x = (i / 100) * 600;
        const y =
          60 +
          Math.sin(i * 0.12) * 25 +
          Math.sin(i * 0.05) * 15 +
          Math.cos(i * 0.08) * 10;
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r="4"
              fill="#a3e635"
              opacity={inView ? 1 : 0}
              style={{ transition: `opacity 0.5s ${1 + i * 0.02}s` }}
            />
            <circle
              cx={x}
              cy={y}
              r="8"
              fill="none"
              stroke="#a3e635"
              strokeWidth="1"
              opacity={inView ? 0.3 : 0}
              style={{ transition: `opacity 0.5s ${1 + i * 0.02}s` }}
            />
          </g>
        );
      })}
    </svg>
  );
}

/* ── Elevation profile SVG ── */
function ElevationProfile() {
  const [inView, setInView] = useState(false);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const points: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const x = (i / 100) * 600;
    const base = Math.sin(i * 0.035) * 30 + Math.sin(i * 0.08) * 15;
    const y = 90 - base - 10;
    points.push(`${x},${y}`);
  }
  const pathD = `M${points.join(" L")}`;

  return (
    <svg
      ref={ref}
      viewBox="0 0 600 120"
      className="w-full h-auto"
      preserveAspectRatio="none"
    >
      {[30, 50, 70, 90].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="600"
          y2={y}
          stroke="rgba(163,230,53,0.06)"
          strokeWidth="1"
        />
      ))}
      <defs>
        <linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a3e635" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathD} L600,110 L0,110 Z`}
        fill="url(#elevFill)"
        style={{
          animation: inView ? "elevationReveal 2s ease-out 0.5s both" : "none",
          clipPath: inView ? undefined : "inset(0 100% 0 0)",
        }}
      />
      <path
        d={pathD}
        fill="none"
        stroke="#a3e635"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
        style={{
          strokeDasharray: 1200,
          strokeDashoffset: inView ? 0 : 1200,
          transition: "stroke-dashoffset 2.5s ease-out 0.3s",
        }}
      />
      {/* Elevation labels */}
      {[
        { x: 10, label: "240m" },
        { x: 200, label: "380m" },
        { x: 400, label: "310m" },
        { x: 560, label: "420m" },
      ].map((l) => (
        <text
          key={l.x}
          x={l.x}
          y="115"
          fill="rgba(163,230,53,0.4)"
          fontSize="8"
          fontFamily="'Space Mono', monospace"
          opacity={inView ? 1 : 0}
          style={{ transition: "opacity 0.5s 1.5s" }}
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
}

/* ── Animated score ring ── */
function ScoreRing({
  score,
  label,
  delay = 0,
}: {
  score: number;
  label: string;
  delay?: number;
}) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div ref={ref} className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(163,230,53,0.08)"
            strokeWidth="3"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#a3e635"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={inView ? offset : circumference}
            style={{
              transition: `stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-2xl font-bold text-[#a3e635]"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            {score}
          </span>
        </div>
      </div>
      <span
        className="text-[10px] uppercase tracking-[0.3em] text-neutral-500"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── Route Card ── */
function RouteCard({
  name,
  region,
  score,
  distance,
  elevation,
  corners,
  index,
}: {
  name: string;
  region: string;
  score: number;
  distance: string;
  elevation: string;
  corners: number;
  index: number;
}) {
  return (
    <Reveal delay={index * 150}>
      <div
        className="border border-neutral-800 relative group hover:border-[#a3e635]/30 transition-all duration-500"
        style={{
          animation: "pulseGlow 4s ease-in-out infinite",
          animationDelay: `${index * 1.3}s`,
        }}
      >
        {/* Corner markers */}
        <span className="absolute -top-[2px] -left-[2px] w-4 h-4 border-t-2 border-l-2 border-[#a3e635]" />
        <span className="absolute -bottom-[2px] -right-[2px] w-4 h-4 border-b-2 border-r-2 border-[#a3e635]" />

        {/* Score banner */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div>
            <div className="text-[9px] uppercase tracking-[0.4em] text-neutral-600 mb-1">
              {region}
            </div>
            <h3 className="text-sm font-bold tracking-wider text-neutral-200">
              {name}
            </h3>
          </div>
          <div
            className="text-3xl font-bold text-[#a3e635]"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            {score}
          </div>
        </div>

        {/* Mini curvature visualization */}
        <div className="px-6 py-3 border-b border-neutral-900">
          <svg viewBox="0 0 200 30" className="w-full h-6">
            {Array.from({ length: 40 }).map((_, i) => {
              const h =
                Math.abs(Math.sin(i * 0.4 + index) * Math.cos(i * 0.2)) * 20 +
                4;
              return (
                <rect
                  key={i}
                  x={i * 5}
                  y={30 - h}
                  width="3"
                  height={h}
                  fill="#a3e635"
                  opacity={0.2 + (h / 24) * 0.5}
                  style={{
                    animationName: "waveformPulse",
                    animationDuration: `${1.5 + Math.random()}s`,
                    animationTimingFunction: "ease-in-out",
                    animationIterationCount: "infinite",
                    animationDelay: `${i * 0.05}s`,
                    transformOrigin: "bottom",
                  }}
                />
              );
            })}
          </svg>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-neutral-900">
          {[
            { label: "DIST", value: distance },
            { label: "ELEV", value: elevation },
            { label: "CORNERS", value: String(corners) },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-3 text-center">
              <div
                className="text-xs font-bold text-neutral-300"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {stat.value}
              </div>
              <div className="text-[8px] uppercase tracking-[0.3em] text-neutral-600 mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

/* ── Comparison row ── */
function ComparisonRow({
  feature,
  curveseek,
  google,
  waze,
  index,
}: {
  feature: string;
  curveseek: string;
  google: string;
  waze: string;
  index: number;
}) {
  return (
    <Reveal delay={index * 80}>
      <div className="grid grid-cols-4 border-b border-neutral-900 text-xs group hover:bg-[#a3e635]/2 transition-colors duration-300">
        <div className="px-4 py-4 font-bold tracking-wider text-neutral-300">
          {feature}
        </div>
        <div className="px-4 py-4 text-[#a3e635] font-bold text-center">
          {curveseek}
        </div>
        <div className="px-4 py-4 text-neutral-600 text-center">{google}</div>
        <div className="px-4 py-4 text-neutral-600 text-center">{waze}</div>
      </div>
    </Reveal>
  );
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export function Home() {
  const [visible, setVisible] = useState(false);
  const [typed, setTyped] = useState("");
  const fullText = "CANADIAN ROAD INTELLIGENCE";

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!visible) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyped(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        @keyframes glitchTop {
          0%, 90%, 100% { transform: translate(3px, -2px); }
          92% { transform: translate(-4px, -1px); }
          94% { transform: translate(5px, -3px); }
          96% { transform: translate(-2px, 0px); }
        }
        @keyframes glitchBottom {
          0%, 90%, 100% { transform: translate(-3px, 2px); }
          91% { transform: translate(4px, 1px); }
          93% { transform: translate(-5px, 3px); }
          95% { transform: translate(2px, 0px); }
        }
        @keyframes cursorBlink {
          0% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes noiseShift {
          0%, 100% { background-position: 0 0; }
          25% { background-position: -50px 30px; }
          50% { background-position: 20px -20px; }
          75% { background-position: -30px -50px; }
        }
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(163, 230, 53, 0.15); }
          50% { border-color: rgba(163, 230, 53, 0.4); }
        }
        @keyframes revealBlock {
          0% { transform: scaleY(0); }
          100% { transform: scaleY(1); }
        }
        @keyframes drawPath {
          from { stroke-dashoffset: 1200; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideLeft {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(163, 230, 53, 0.3); }
          50% { box-shadow: 0 0 20px 4px rgba(163, 230, 53, 0.15); }
        }
        @keyframes waveformPulse {
          0% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
          100% { transform: scaleY(0.3); }
        }
        @keyframes elevationReveal {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0% 0 0); }
        }
        @keyframes scoreRing {
          from { stroke-dashoffset: 283; }
        }
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      <div
        className="min-h-screen bg-neutral-950 text-neutral-100 overflow-x-hidden selection:bg-[#a3e635] selection:text-black"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {/* ── Noise overlay ── */}
        <div
          className="fixed inset-0 pointer-events-none z-50 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            animation: "noiseShift 0.3s steps(4) infinite",
          }}
        />
        {/* ── Scanline ── */}
        <div
          className="fixed inset-0 pointer-events-none z-40 opacity-[0.015]"
          style={{
            background:
              "repeating-linear-gradient(to bottom, transparent, transparent 2px, #a3e635 2px, #a3e635 3px)",
          }}
        />

        {/* ═══════ HERO ═══════ */}
        <section className="relative min-h-screen overflow-hidden">
          {/* Terrain Map Canvas — Gatineau Park background */}
          <div className="absolute inset-0 z-0">
            <TerrainRoadCanvas />
          </div>

          {/* Gradient overlays for text readability */}
          <div
            className="absolute inset-0 z-1 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.75) 30%, rgba(10,10,10,0.25) 60%, rgba(10,10,10,0.05) 100%)",
            }}
          />
          <div
            className="absolute inset-0 z-1 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(10,10,10,0.5) 0%, transparent 12%, transparent 88%, rgba(10,10,10,0.95) 100%)",
            }}
          />

          {/* Content layer */}
          <div className="relative z-10 flex flex-col justify-between min-h-screen px-6 md:px-12 lg:px-20 pt-8 pb-6">
            {/* Top bar — exposed nav */}
            <div
              className={`flex justify-between items-start border-b border-[#a3e635]/15 pb-4 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
            >
              <div>
                <div className="text-[10px] text-neutral-600 uppercase tracking-[0.3em] mb-1">
                  SYS://NAV
                </div>
                <div className="text-sm font-bold text-[#a3e635] tracking-wider">
                  CURVESEEK_
                </div>
              </div>
              <div className="flex gap-6 items-center">
                <a
                  href="#data"
                  className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 hover:text-[#a3e635] transition-colors hidden md:inline"
                >
                  [SCORE]
                </a>
                <a
                  href="#method"
                  className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 hover:text-[#a3e635] transition-colors hidden md:inline"
                >
                  [METHOD]
                </a>
                <a
                  href="#routes"
                  className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 hover:text-[#a3e635] transition-colors hidden lg:inline"
                >
                  [ROUTES]
                </a>
                <a
                  href="#discovery"
                  className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 hover:text-[#a3e635] transition-colors hidden lg:inline"
                >
                  [DISCOVER]
                </a>
                <a
                  href="/app"
                  className="text-[10px] uppercase tracking-[0.3em] border border-[#a3e635] text-[#a3e635] px-4 py-2 hover:bg-[#a3e635] hover:text-black transition-all duration-200"
                >
                  LAUNCH→
                </a>
              </div>
            </div>

            {/* Hero text ��� left column, canvas visible on right */}
            <div className="flex-1 flex items-center py-12 md:py-20">
              <div className="relative max-w-2xl">
                {/* Oversized section number */}
                <div
                  className={`absolute -top-4 -left-2 text-[12rem] md:text-[18rem] font-bold leading-none text-[#a3e635]/3 select-none transition-opacity duration-1000 ${visible ? "opacity-100" : "opacity-0"}`}
                >
                  01
                </div>

                <div className="relative z-10">
                  {/* Typewriter tagline */}
                  <div
                    className={`text-xs text-[#a3e635]/60 uppercase tracking-[0.5em] mb-6 h-5 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
                    style={{ transitionDelay: "200ms" }}
                  >
                    {typed}
                    <Cursor />
                  </div>

                  {/* Main headline */}
                  <h1
                    className={`transition-all duration-700 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}`}
                    style={{ transitionDelay: "400ms" }}
                  >
                    <span className="block text-[3.5rem] sm:text-[5rem] md:text-[7rem] lg:text-[8rem] font-bold leading-[0.85] tracking-tighter text-white">
                      THE
                    </span>
                    <span className="block text-[3.5rem] sm:text-[5rem] md:text-[7rem] lg:text-[8rem] font-bold leading-[0.85] tracking-tighter text-white -mt-1 md:-mt-3">
                      ART
                    </span>
                    <span className="block text-[3.5rem] sm:text-[5rem] md:text-[7rem] lg:text-[8rem] font-bold leading-[0.85] tracking-tighter -mt-1 md:-mt-3">
                      OF THE
                    </span>
                    <span className="block text-[3.5rem] sm:text-[5rem] md:text-[7rem] lg:text-[8rem] font-bold leading-[0.85] tracking-tighter -mt-1 md:-mt-3">
                      <GlitchText>DETOUR</GlitchText>
                      <span className="text-[#a3e635]">.</span>
                    </span>
                  </h1>

                  {/* Subtext */}
                  <div
                    className={`mt-8 md:mt-12 flex items-start gap-4 transition-all duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
                    style={{ transitionDelay: "800ms" }}
                  >
                    <div className="w-12 h-[2px] bg-[#a3e635] mt-2.5 shrink-0" />
                    <p className="text-sm text-neutral-400 leading-relaxed max-w-md">
                      CurveSeek scores every road across curvature, elevation,
                      surface quality, and driving flow — giving you a 0-100
                      enthusiasm rating before you turn the key.
                    </p>
                  </div>

                  {/* CTA buttons */}
                  <div
                    className={`mt-10 flex flex-wrap gap-3 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                    style={{ transitionDelay: "1000ms" }}
                  >
                    <a
                      href="/app"
                      className="group relative px-8 py-4 bg-[#a3e635] text-black text-xs font-bold uppercase tracking-[0.3em] hover:bg-[#bef264] transition-colors overflow-hidden"
                    >
                      <span className="relative z-10">DISCOVER ROADS</span>
                      <span className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                    </a>
                    <a
                      href="#data"
                      className="px-8 py-4 border border-neutral-700 text-neutral-400 text-xs font-bold uppercase tracking-[0.3em] hover:border-[#a3e635] hover:text-[#a3e635] transition-all duration-300"
                    >
                      LEARN MORE
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom status bar */}
            <div
              className={`flex flex-wrap justify-between text-[9px] uppercase tracking-[0.4em] text-neutral-700 border-t border-[#a3e635]/10 pt-4 transition-opacity duration-1000 ${visible ? "opacity-100" : "opacity-0"}`}
              style={{ transitionDelay: "1200ms" }}
            >
              <span>
                SYS_STATUS: <span className="text-[#a3e635]">ONLINE</span>
              </span>
              <span className="hidden md:inline">
                LAT: 45.4855 / LNG: -75.8061
              </span>
              <span className="hidden md:inline">BUILD: 2026.02</span>
              <span>SCROLL↓</span>
            </div>
          </div>
        </section>

        {/* ── Marquee strip ── */}
        <Marquee />

        {/* ═════���═ DATA SECTION ═══════ */}
        <section
          id="data"
          className="py-20 md:py-32 px-6 md:px-12 lg:px-20 relative"
        >
          {/* Ghost number */}
          <div className="absolute top-8 right-8 md:right-20 text-[10rem] md:text-[16rem] font-bold leading-none text-[#a3e635]/2 select-none">
            02
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12 md:mb-16">
              <div className="w-8 h-[2px] bg-[#a3e635]" />
              <span className="text-[10px] uppercase tracking-[0.5em] text-[#a3e635]">
                CHAPTER_I // THE SCORE
              </span>
            </div>

            <h2 className="text-3xl md:text-6xl font-bold tracking-tight mb-16 md:mb-20 max-w-3xl leading-[0.95]">
              THE
              <br />
              <span className="text-neutral-600">SCORE</span>
              <br />
              <span className="text-[#a3e635]">SYSTEM</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#a3e635]/10">
              <Counter value={87} label="Curvature" delay={0} />
              <Counter value={74} label="Elevation" delay={100} />
              <Counter value={91} label="Surface" delay={200} />
              <Counter value={68} label="Flow" delay={300} />
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="mx-6 md:mx-12 lg:mx-20 h-px bg-neutral-900" />

        {/* ═══════ METHOD ═══════ */}
        <section
          id="method"
          className="py-20 md:py-32 px-6 md:px-12 lg:px-20 relative"
        >
          <div className="absolute top-8 left-8 md:left-20 text-[10rem] md:text-[16rem] font-bold leading-none text-[#a3e635]/2 select-none">
            03
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12 md:mb-16">
              <div className="w-8 h-[2px] bg-[#a3e635]" />
              <span className="text-[10px] uppercase tracking-[0.5em] text-[#a3e635]">
                CHAPTER_II // THE METHOD
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-16 md:gap-24">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[0.95]">
                THE
                <br />
                <span className="text-neutral-600">METHOD</span>
                <br />
                <span className="text-[#a3e635]">STACK</span>
              </h2>

              <div className="space-y-0">
                {[
                  {
                    id: "01",
                    name: "ROUTE_INTELLIGENCE",
                    desc: "Enter any start and destination. CurveSeek calculates multiple route alternatives and scores each one. Pick the road that rewards you most, not just the fastest.",
                    bar: 92,
                  },
                  {
                    id: "02",
                    name: "LIVE_CURVATURE_MAP",
                    desc: "Every road on the map glows with its curvature rating. Zoom into British Columbia or the Laurentians and watch the high-scoring passes light up.",
                    bar: 87,
                  },
                  {
                    id: "03",
                    name: "SURFACE_INTELLIGENCE",
                    desc: "Real-world accelerometer data from thousands of drivers feeds a continuously updated surface quality layer so you know what waits beyond the next bend.",
                    bar: 91,
                  },
                  {
                    id: "04",
                    name: "ELEVATION_PROFILES",
                    desc: "Visualize the climb before you commit. Dramatic elevation profiles show every crest and descent from high-resolution terrain data.",
                    bar: 84,
                  },
                  {
                    id: "05",
                    name: "DISCOVERY_MODE",
                    desc: "Tell CurveSeek a region you want to explore. It surfaces top-rated roads nearby with no destination required.",
                    bar: 95,
                  },
                ].map((item, i) => (
                  <div
                    key={item.id}
                    className="border-b border-neutral-900 py-6 group hover:bg-[#a3e635]/2 px-4 -mx-4 transition-colors duration-300"
                  >
                    <div className="flex items-baseline gap-4 mb-2">
                      <span className="text-[10px] text-[#a3e635]/60 font-bold">
                        {item.id}
                      </span>
                      <h3 className="text-sm font-bold tracking-wider">
                        {item.name}
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed mb-3">
                      {item.desc}
                    </p>
                    {/* Score bar */}
                    <div className="h-[3px] bg-neutral-900 relative overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-[#a3e635] origin-left"
                        style={{
                          width: `${item.bar}%`,
                          animation: `revealBlock 1.2s cubic-bezier(0.22, 1, 0.36, 1) ${0.5 + i * 0.2}s both`,
                          transformOrigin: "left",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Marquee strip reversed ── */}
        <div className="overflow-hidden border-y border-[#a3e635]/20 py-4 select-none">
          <div
            className="flex whitespace-nowrap"
            style={{ animation: "marqueeScroll 15s linear infinite reverse" }}
          >
            {[0, 1].map((k) => (
              <span
                key={k}
                className="text-[10px] tracking-[0.6em] uppercase text-[#a3e635]/20 px-4"
              >
                {
                  "NO OPINIONS \u25FC JUST DATA \u25FC NO OPINIONS \u25FC JUST DATA \u25FC NO OPINIONS \u25FC JUST DATA \u25FC NO OPINIONS \u25FC JUST DATA \u25FC"
                }
              </span>
            ))}
          </div>
        </div>

        {/* ═══════ ROAD DNA — Curvature & Elevation Visualization ═══════ */}
        <section className="py-20 md:py-32 px-6 md:px-12 lg:px-20 relative overflow-hidden">
          <div className="absolute top-8 right-8 md:right-20 text-[10rem] md:text-[16rem] font-bold leading-none text-[#a3e635]/2 select-none">
            04
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12 md:mb-16">
              <div className="w-8 h-[2px] bg-[#a3e635]" />
              <span className="text-[10px] uppercase tracking-[0.5em] text-[#a3e635]">
                {"CHAPTER_III // ROAD DNA"}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-16 md:gap-24 mb-16">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[0.95] mb-8">
                  EVERY ROAD
                  <br />
                  HAS A<br />
                  <span className="text-[#a3e635]">FINGERPRINT</span>
                </h2>
                <p className="text-sm text-neutral-500 leading-relaxed max-w-md">
                  We decompose every road into its fundamental signals:
                  curvature frequency, elevation delta, corner density, and
                  surface rhythm. The result is a unique DNA profile that tells
                  you exactly what to expect before you drive it.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <ScoreRing score={92} label="Overall" delay={0} />
              </div>
            </div>

            {/* Curvature waveform */}
            <Reveal className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-3 h-3 bg-[#a3e635] inline-block" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-500">
                  CURVATURE FREQUENCY ANALYSIS
                </span>
              </div>
              <div className="border border-neutral-800 p-4">
                <CurvatureWaveform />
              </div>
            </Reveal>

            {/* Elevation profile */}
            <Reveal className="mb-4" delay={200}>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-3 h-3 border border-[#a3e635] inline-block" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-500">
                  ELEVATION PROFILE // METRES ASL
                </span>
              </div>
              <div className="border border-neutral-800 p-4">
                <ElevationProfile />
              </div>
            </Reveal>

            {/* Score breakdown rings */}
            <Reveal delay={400}>
              <div className="border border-neutral-800 p-8 mt-8">
                <div className="text-[10px] uppercase tracking-[0.4em] text-neutral-600 mb-8 text-center">
                  COMPONENT SCORE BREAKDOWN
                </div>
                <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                  <ScoreRing score={87} label="Curvature" delay={0} />
                  <ScoreRing score={74} label="Elevation" delay={200} />
                  <ScoreRing score={91} label="Surface" delay={400} />
                  <ScoreRing score={68} label="Flow" delay={600} />
                  <ScoreRing score={95} label="Corners" delay={800} />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="mx-6 md:mx-12 lg:mx-20 h-px bg-neutral-900" />

        {/* ═══════ FEATURED ROUTES ═══════ */}
        <section
          id="routes"
          className="py-20 md:py-32 px-6 md:px-12 lg:px-20 relative"
        >
          <div className="absolute top-8 left-8 md:left-20 text-[10rem] md:text-[16rem] font-bold leading-none text-[#a3e635]/2 select-none">
            05
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12 md:mb-16">
              <div className="w-8 h-[2px] bg-[#a3e635]" />
              <span className="text-[10px] uppercase tracking-[0.5em] text-[#a3e635]">
                {"CHAPTER_IV // FEATURED ROUTES"}
              </span>
            </div>

            <Reveal>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[0.95] mb-6">
                THE <span className="text-neutral-600">HIGHEST</span>
                <br />
                <span className="text-[#a3e635]">RATED</span> ROADS
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-sm text-neutral-500 leading-relaxed max-w-lg mb-16">
                These routes consistently score above 80 across all four
                dimensions. They are the roads that remind you why you drive a
                manual.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-6">
              <RouteCard
                name="PROMENADE DE LA GATINEAU"
                region="QUEBEC // GATINEAU PARK"
                score={92}
                distance="32 km"
                elevation="+480m"
                corners={47}
                index={0}
              />
              <RouteCard
                name="SEA-TO-SKY HIGHWAY"
                region="BRITISH COLUMBIA // SQUAMISH"
                score={88}
                distance="120 km"
                elevation="+920m"
                corners={83}
                index={1}
              />
              <RouteCard
                name="CABOT TRAIL"
                region="NOVA SCOTIA // CAPE BRETON"
                score={94}
                distance="298 km"
                elevation="+1,240m"
                corners={156}
                index={2}
              />
            </div>

            {/* Micro route list */}
            <Reveal delay={500}>
              <div className="mt-12 border-t border-neutral-900 pt-8">
                <div className="text-[10px] uppercase tracking-[0.4em] text-neutral-600 mb-4">
                  MORE TOP-SCORING ROADS
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: "Icefields Parkway", province: "AB", score: 91 },
                    { name: "Route 132 Gaspe", province: "QC", score: 86 },
                    { name: "Trans-Canada Hwy 17", province: "ON", score: 79 },
                    { name: "Route 389 Labrador", province: "NL", score: 82 },
                  ].map((route, i) => (
                    <div
                      key={route.name}
                      className="flex items-center justify-between py-3 px-4 border border-neutral-900 hover:border-[#a3e635]/20 transition-colors group"
                    >
                      <div>
                        <div className="text-xs font-bold text-neutral-300 group-hover:text-neutral-100 transition-colors">
                          {route.name}
                        </div>
                        <div className="text-[9px] uppercase tracking-[0.3em] text-neutral-700">
                          {route.province}
                        </div>
                      </div>
                      <div
                        className="text-lg font-bold text-[#a3e635]"
                        style={{ fontFamily: "'Space Mono', monospace" }}
                      >
                        {route.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Ticker strip ── */}
        <div className="overflow-hidden border-y border-[#a3e635]/20 py-3 select-none">
          <div
            className="flex whitespace-nowrap"
            style={{ animation: "tickerScroll 30s linear infinite" }}
          >
            {[0, 1].map((k) => (
              <span
                key={k}
                className="text-[9px] tracking-[0.3em] text-neutral-700 px-4"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {
                  "GATINEAU:92 \u25AA SEA-TO-SKY:88 \u25AA CABOT:94 \u25AA ICEFIELDS:91 \u25AA GASPE:86 \u25AA TRANS-CAN:79 \u25AA LABRADOR:82 \u25AA DUFFERIN:85 \u25AA FUNDY:78 \u25AA CROWSNEST:83 \u25AA "
                }
                {
                  "GATINEAU:92 \u25AA SEA-TO-SKY:88 \u25AA CABOT:94 \u25AA ICEFIELDS:91 \u25AA GASPE:86 \u25AA TRANS-CAN:79 \u25AA LABRADOR:82 \u25AA DUFFERIN:85 \u25AA FUNDY:78 \u25AA CROWSNEST:83 \u25AA "
                }
              </span>
            ))}
          </div>
        </div>

        {/* ═══════ HOW IT WORKS — 3 Steps ═══════ */}
        <section className="py-20 md:py-32 px-6 md:px-12 lg:px-20 relative">
          <div className="absolute top-8 right-8 md:right-20 text-[10rem] md:text-[16rem] font-bold leading-none text-[#a3e635]/2 select-none">
            06
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12 md:mb-16">
              <div className="w-8 h-[2px] bg-[#a3e635]" />
              <span className="text-[10px] uppercase tracking-[0.5em] text-[#a3e635]">
                {"CHAPTER_V // HOW IT WORKS"}
              </span>
            </div>

            <Reveal>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[0.95] mb-16 md:mb-20">
                THREE
                <br />
                <span className="text-neutral-600">STEPS</span> TO
                <br />
                <span className="text-[#a3e635]">BETTER ROADS</span>
              </h2>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-px bg-[#a3e635]/10">
              {[
                {
                  step: "01",
                  title: "ENTER",
                  subtitle: "YOUR ROUTE",
                  desc: "Type any start and end point across Canada. CurveSeek immediately calculates every possible route between them, not just the fastest.",
                  icon: (
                    <svg viewBox="0 0 48 48" className="w-12 h-12">
                      <rect
                        x="8"
                        y="8"
                        width="32"
                        height="32"
                        rx="2"
                        fill="none"
                        stroke="#a3e635"
                        strokeWidth="2"
                      />
                      <line
                        x1="14"
                        y1="20"
                        x2="34"
                        y2="20"
                        stroke="#a3e635"
                        strokeWidth="1.5"
                        opacity="0.5"
                      />
                      <line
                        x1="14"
                        y1="28"
                        x2="26"
                        y2="28"
                        stroke="#a3e635"
                        strokeWidth="1.5"
                        opacity="0.3"
                      />
                      <circle
                        cx="36"
                        cy="36"
                        r="8"
                        fill="none"
                        stroke="#a3e635"
                        strokeWidth="2"
                      />
                      <line
                        x1="41"
                        y1="41"
                        x2="46"
                        y2="46"
                        stroke="#a3e635"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  ),
                },
                {
                  step: "02",
                  title: "ANALYZE",
                  subtitle: "THE CURVES",
                  desc: "Every alternative is decomposed into curvature, elevation, surface, and flow scores. Side-by-side comparisons let you pick the road that rewards you.",
                  icon: (
                    <svg viewBox="0 0 48 48" className="w-12 h-12">
                      <path
                        d="M4 40 L12 28 L20 32 L28 16 L36 22 L44 8"
                        fill="none"
                        stroke="#a3e635"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="28" r="2" fill="#a3e635" />
                      <circle cx="28" cy="16" r="2" fill="#a3e635" />
                      <circle cx="44" cy="8" r="2" fill="#a3e635" />
                    </svg>
                  ),
                },
                {
                  step: "03",
                  title: "DRIVE",
                  subtitle: "THE BEST ONE",
                  desc: "Export to your favourite nav app or follow CurveSeek's turn-by-turn. Log your drive, rate the road, and contribute back to the community.",
                  icon: (
                    <svg viewBox="0 0 48 48" className="w-12 h-12">
                      <path
                        d="M8 40 Q14 10 24 24 Q34 38 40 8"
                        fill="none"
                        stroke="#a3e635"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <polygon points="40,4 44,12 36,12" fill="#a3e635" />
                    </svg>
                  ),
                },
              ].map((item, i) => (
                <Reveal key={item.step} delay={i * 200}>
                  <div className="bg-neutral-950 p-8 md:p-10 relative group hover:bg-[#a3e635]/3 transition-colors duration-500">
                    {/* Step number */}
                    <div className="text-[8rem] font-bold leading-none text-[#a3e635]/4 absolute -top-2 -right-2 select-none">
                      {item.step}
                    </div>
                    <div className="relative z-10">
                      {item.icon}
                      <div className="mt-8 mb-2">
                        <span className="text-[10px] text-[#a3e635]/60 tracking-[0.4em]">
                          STEP_{item.step}
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-none mb-1 text-neutral-100">
                        {item.title}
                      </h3>
                      <h4 className="text-lg font-bold text-neutral-600 mb-4">
                        {item.subtitle}
                      </h4>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="mx-6 md:mx-12 lg:mx-20 h-px bg-neutral-900" />

        {/* ═══════ VS THE REST — Comparison Table ═══════ */}
        <section className="py-20 md:py-32 px-6 md:px-12 lg:px-20 relative">
          <div className="absolute top-8 left-8 md:left-20 text-[10rem] md:text-[16rem] font-bold leading-none text-[#a3e635]/2 select-none">
            07
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12 md:mb-16">
              <div className="w-8 h-[2px] bg-[#a3e635]" />
              <span className="text-[10px] uppercase tracking-[0.5em] text-[#a3e635]">
                {"CHAPTER_VI // VS THE REST"}
              </span>
            </div>

            <Reveal>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[0.95] mb-16">
                NOT A<br />
                <span className="text-neutral-600">NAV APP</span>.<br />A{" "}
                <span className="text-[#a3e635]">ROAD FINDER</span>.
              </h2>
            </Reveal>

            <div className="border border-neutral-800 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-4 border-b border-neutral-800 bg-neutral-900/50">
                <div className="px-4 py-3 text-[10px] uppercase tracking-[0.3em] text-neutral-600">
                  Feature
                </div>
                <div className="px-4 py-3 text-[10px] uppercase tracking-[0.3em] text-[#a3e635] text-center font-bold">
                  CurveSeek
                </div>
                <div className="px-4 py-3 text-[10px] uppercase tracking-[0.3em] text-neutral-600 text-center">
                  Google Maps
                </div>
                <div className="px-4 py-3 text-[10px] uppercase tracking-[0.3em] text-neutral-600 text-center">
                  Waze
                </div>
              </div>

              <ComparisonRow
                feature="CURVATURE SCORING"
                curveseek="0-100"
                google="--"
                waze="--"
                index={0}
              />
              <ComparisonRow
                feature="ELEVATION PROFILES"
                curveseek="HD"
                google="Basic"
                waze="--"
                index={1}
              />
              <ComparisonRow
                feature="SURFACE QUALITY"
                curveseek="Live"
                google="--"
                waze="Reports"
                index={2}
              />
              <ComparisonRow
                feature="ROUTE ALTERNATIVES"
                curveseek="Scored"
                google="ETA Only"
                waze="ETA Only"
                index={3}
              />
              <ComparisonRow
                feature="DISCOVERY MODE"
                curveseek="Built-in"
                google="--"
                waze="--"
                index={4}
              />
              <ComparisonRow
                feature="CORNER COUNTING"
                curveseek="Per-road"
                google="--"
                waze="--"
                index={5}
              />
              <ComparisonRow
                feature="DRIVING FLOW SCORE"
                curveseek="AI-driven"
                google="--"
                waze="--"
                index={6}
              />
              <ComparisonRow
                feature="CANADIAN FOCUSED"
                curveseek="100%"
                google="Global"
                waze="Global"
                index={7}
              />
              <ComparisonRow
                feature="OPEN SOURCE"
                curveseek="MIT"
                google="No"
                waze="No"
                index={8}
              />
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="mx-6 md:mx-12 lg:mx-20 h-px bg-neutral-900" />

        {/* ═══════ COMMUNITY / SOCIAL PROOF ═══════ */}
        <section className="py-20 md:py-32 px-6 md:px-12 lg:px-20 relative">
          <div className="absolute top-8 right-8 md:right-20 text-[10rem] md:text-[16rem] font-bold leading-none text-[#a3e635]/2 select-none">
            08
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12 md:mb-16">
              <div className="w-8 h-[2px] bg-[#a3e635]" />
              <span className="text-[10px] uppercase tracking-[0.5em] text-[#a3e635]">
                {"CHAPTER_VII // THE COMMUNITY"}
              </span>
            </div>

            <Reveal>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[0.95] mb-16">
                BUILT BY
                <br />
                <span className="text-[#a3e635]">DRIVERS</span>
                <br />
                <span className="text-neutral-600">FOR DRIVERS</span>
              </h2>
            </Reveal>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#a3e635]/10 mb-16">
              <Counter value={24600} suffix="" label="Roads Scored" delay={0} />
              <Counter
                value={3200}
                suffix=""
                label="Active Drivers"
                delay={100}
              />
              <Counter value={140} suffix="K" label="KM Logged" delay={200} />
              <Counter value={10} suffix="" label="Provinces" delay={300} />
            </div>

            {/* Testimonials */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote:
                    "I drove the Trans-Canada for 20 years taking the fastest route. CurveSeek showed me a parallel road 12 km north that changed everything.",
                  author: "M. TREMBLAY",
                  location: "MONTREAL, QC",
                },
                {
                  quote:
                    "The curvature scoring is addictive. I plan weekend drives now like I used to plan vacations. My GT86 has never been happier.",
                  author: "K. PATEL",
                  location: "VANCOUVER, BC",
                },
                {
                  quote:
                    "As a motorcycle rider, surface quality data is everything. CurveSeek is the only app that tells me what the asphalt is actually like.",
                  author: "J. MACLEOD",
                  location: "HALIFAX, NS",
                },
              ].map((t, i) => (
                <Reveal key={i} delay={i * 150}>
                  <div className="border border-neutral-800 p-6 relative hover:border-[#a3e635]/20 transition-colors duration-500">
                    <span className="absolute -top-[2px] -left-[2px] w-3 h-3 border-t-2 border-l-2 border-[#a3e635]" />
                    <span className="absolute -bottom-[2px] -right-[2px] w-3 h-3 border-b-2 border-r-2 border-[#a3e635]" />

                    <div
                      className="text-4xl text-[#a3e635]/20 leading-none mb-4"
                      aria-hidden
                    >
                      {'"'}
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                      {t.quote}
                    </p>
                    <div className="border-t border-neutral-900 pt-4">
                      <div className="text-xs font-bold text-neutral-300">
                        {t.author}
                      </div>
                      <div className="text-[9px] uppercase tracking-[0.3em] text-neutral-700">
                        {t.location}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ QUOTE / PHILOSOPHY ═══════ */}
        <section className="py-24 md:py-36 px-6 md:px-12 lg:px-20 relative overflow-hidden">
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(#a3e635 1px, transparent 1px), linear-gradient(90deg, #a3e635 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-10 max-w-4xl mx-auto">
            <Reveal>
              <div className="border-l-4 border-[#a3e635] pl-8 md:pl-12">
                <p className="text-2xl md:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight">
                  A GREAT ROAD
                  <br />
                  {"DOESN'T TAKE YOU "}
                  <span className="bg-[#a3e635] text-black px-2 inline-block">
                    SOMEWHERE
                  </span>
                  .<br />
                  {"IT MAKES THE JOURNEY THE DESTINATION"}
                  <span className="text-[#a3e635]">_</span>
                </p>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-10 flex items-center gap-4 pl-8 md:pl-12">
                <div className="w-12 h-px bg-neutral-800" />
                <span className="text-[10px] uppercase tracking-[0.5em] text-neutral-700">
                  CURVESEEK // PHILOSOPHY STATEMENT
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════ DATA SOURCES ═══════ */}
        <section className="py-20 md:py-32 px-6 md:px-12 lg:px-20 relative">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12 md:mb-16">
              <div className="w-8 h-[2px] bg-[#a3e635]" />
              <span className="text-[10px] uppercase tracking-[0.5em] text-[#a3e635]">
                {"CHAPTER_VIII // THE DATA STACK"}
              </span>
            </div>

            <Reveal>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[0.95] mb-12">
                POWERED BY
                <br />
                <span className="text-[#a3e635]">REAL DATA</span>
              </h2>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  name: "OpenStreetMap",
                  desc: "Road geometry, surface types, and classification data for every road in Canada.",
                  tag: "GEOMETRY",
                },
                {
                  name: "SRTM / CDEM",
                  desc: "High-resolution digital elevation model data. Sub-30m accuracy for precise climb profiles.",
                  tag: "ELEVATION",
                },
                {
                  name: "Community GPS",
                  desc: "Accelerometer traces from real drives. Crowdsourced surface quality that improves daily.",
                  tag: "SURFACE",
                },
                {
                  name: "NRCan Road Network",
                  desc: "Official Canadian road network data cross-referenced for accuracy and completeness.",
                  tag: "VERIFICATION",
                },
              ].map((src, i) => (
                <Reveal key={src.name} delay={i * 100}>
                  <div className="border border-neutral-800 p-6 hover:border-[#a3e635]/20 transition-colors duration-500 h-full">
                    <div className="text-[9px] uppercase tracking-[0.4em] text-[#a3e635]/60 mb-4 px-2 py-1 border border-[#a3e635]/20 inline-block">
                      {src.tag}
                    </div>
                    <h3 className="text-sm font-bold tracking-wider text-neutral-200 mb-3">
                      {src.name}
                    </h3>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {src.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="mx-6 md:mx-12 lg:mx-20 h-px bg-neutral-900" />

        {/* ═══════ FINAL CTA ═══════ */}
        <section
          id="discovery"
          className="relative py-24 md:py-36 px-6 md:px-12 lg:px-20"
        >
          <div className="border border-[#a3e635]/20 p-8 md:p-16 relative overflow-hidden">
            {/* Animated grid bg */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(#a3e635 1px, transparent 1px), linear-gradient(90deg, #a3e635 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }}
            />
            {/* Corner markers */}
            <span className="absolute -top-[3px] -left-[3px] w-5 h-5 border-t-2 border-l-2 border-[#a3e635]" />
            <span className="absolute -top-[3px] -right-[3px] w-5 h-5 border-t-2 border-r-2 border-[#a3e635]" />
            <span className="absolute -bottom-[3px] -left-[3px] w-5 h-5 border-b-2 border-l-2 border-[#a3e635]" />
            <span className="absolute -bottom-[3px] -right-[3px] w-5 h-5 border-b-2 border-r-2 border-[#a3e635]" />

            <div className="text-center relative z-10">
              <Reveal>
                <div className="text-[10px] uppercase tracking-[0.5em] text-[#a3e635]/50 mb-6">
                  {"CHAPTER_IX // THE DISCOVERY"}
                </div>
                <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
                  THE
                  <br />
                  <span className="text-neutral-700">DISCOVERY</span>
                  <br />
                  <GlitchText className="text-[#a3e635]">LOOP</GlitchText>
                </h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-sm text-neutral-600 max-w-md mx-auto mb-10 leading-relaxed">
                  Open source. Free to use. Built for Canadian drivers who
                  believe the journey is the point. Every road, scored. Every
                  detour, worth it.
                </p>
              </Reveal>
              <Reveal delay={400}>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a
                    href="/app"
                    className="group relative inline-block px-12 py-5 bg-[#a3e635] text-black text-xs font-bold uppercase tracking-[0.3em] hover:bg-[#bef264] transition-colors overflow-hidden"
                  >
                    <span className="relative z-10">
                      {"START EXPLORING \u2192"}
                    </span>
                    <span className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                  </a>
                  <a
                    href="https://github.com"
                    className="inline-block px-12 py-5 border border-neutral-700 text-neutral-400 text-xs font-bold uppercase tracking-[0.3em] hover:border-[#a3e635] hover:text-[#a3e635] transition-all duration-300"
                  >
                    VIEW SOURCE
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══════ FOOTER ═══════ */}
        <footer className="px-6 md:px-12 lg:px-20 py-10 border-t border-neutral-700/40">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="text-sm font-bold text-[#a3e635] tracking-wider mb-1">
                CURVESEEK_
              </div>
              <div className="text-[9px] uppercase tracking-[0.4em] text-neutral-400">
                SCORE THE CURVES // FIND YOUR DRIVE
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              {["ABOUT", "DATA", "API", "CONTRIBUTE", "GITHUB"].map((link) => (
                <a
                  key={link}
                  href="/"
                  className="text-[9px] uppercase tracking-[0.4em] text-neutral-400 hover:text-[#a3e635] transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
            <div className="text-[9px] uppercase tracking-[0.4em] text-neutral-400">
              OPEN SOURCE // MIT
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-neutral-800 flex flex-wrap justify-between items-center gap-4 text-[8px] uppercase tracking-[0.4em] text-neutral-500">
            <span>{"CURVESEEK \u00A9 2026"}</span>
            <span>{"BUILT FOR DRIVERS WHO TAKE THE LONG WAY HOME"}</span>
            <span>
              BUILT IN <span className="text-[#a3e635]/70">CANADA</span>
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
