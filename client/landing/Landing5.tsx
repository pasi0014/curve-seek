import React, { useEffect, useState, useRef, useCallback } from "react";

// ─── Utility: run a counter animation from 0 → target ───────────────────────
function useCountUp(target: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setValue(target);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return value;
}

// ─── SVG arc helpers ─────────────────────────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

// ─── Animated score ring ─────────────────────────────────────────────────────
interface ScoreRingProps {
  score: number;
  label: string;
  color: string;
  active: boolean;
  delay: number;
}

function ScoreRing({ score, label, color, active, delay }: ScoreRingProps) {
  const [triggered, setTriggered] = useState(false);
  useEffect(() => {
    if (active && !triggered) {
      const t = setTimeout(() => setTriggered(true), delay);
      return () => clearTimeout(t);
    }
  }, [active, delay, triggered]);

  const animatedScore = useCountUp(score, 1600, triggered);
  const cx = 54;
  const cy = 54;
  const r = 44;
  const totalArc = 240;
  const startAngle = -120;
  const trackEnd = startAngle + totalArc;
  const fillEnd = startAngle + (animatedScore / 100) * totalArc;
  const circumference = 2 * Math.PI * r;
  const trackLength = (totalArc / 360) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="108" height="108" viewBox="0 0 108 108">
        {/* Track */}
        <path
          d={arcPath(cx, cy, r, startAngle, trackEnd)}
          fill="none"
          stroke="#2a2421"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={arcPath(cx, cy, r, startAngle, Math.max(startAngle + 0.01, fillEnd))}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          style={{ transition: "none" }}
        />
        {/* Score number */}
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fill="#f5f0e8"
          fontSize="22"
          fontFamily="'Playfair Display', serif"
          fontWeight="700"
        >
          {animatedScore}
        </text>
      </svg>
      <span
        className="text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "rgba(245,240,232,0.45)", fontFamily: "'Libre Franklin', sans-serif" }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Scroll-triggered section wrapper ────────────────────────────────────────
interface RevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right" | "fade";
  delay?: number;
  threshold?: number;
}

function Reveal({ children, className = "", direction = "up", delay = 0, threshold = 0.15 }: RevealProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  const initial: Record<string, string> = {
    up: "opacity-0 translate-y-12",
    left: "opacity-0 -translate-x-12",
    right: "opacity-0 translate-x-12",
    fade: "opacity-0",
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${visible ? "opacity-100 translate-x-0 translate-y-0" : initial[direction]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Horizontal scroll feature card ─────────────────────────────────────────
interface FeatureCardProps {
  number: string;
  title: string;
  body: string;
  accent: string;
}

function FeatureCard({ number, title, body, accent }: FeatureCardProps) {
  return (
    <div
      className="flex-shrink-0 w-72 md:w-80 rounded-2xl p-8 flex flex-col gap-5"
      style={{ background: "#1c1915", border: "1px solid rgba(193,127,89,0.12)" }}
    >
      <span
        className="text-[10px] tracking-[0.5em] uppercase"
        style={{ color: accent, fontFamily: "'Libre Franklin', sans-serif" }}
      >
        {number}
      </span>
      <h3
        className="text-2xl leading-tight"
        style={{ fontFamily: "'Playfair Display', serif", color: "#f5f0e8", fontWeight: 600 }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed flex-1"
        style={{ color: "rgba(245,240,232,0.45)", fontFamily: "'Libre Franklin', sans-serif" }}
      >
        {body}
      </p>
      <div
        className="w-8 h-[1px]"
        style={{ background: accent, opacity: 0.4 }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Landing5() {
  const [heroVisible, setHeroVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [scoresActive, setScoresActive] = useState(false);
  const scoresRef = useRef<HTMLDivElement>(null);
  const roadPathRef = useRef<SVGPathElement>(null);
  const [roadLength, setRoadLength] = useState(0);
  const [roadProgress, setRoadProgress] = useState(0);
  const horizontalRef = useRef<HTMLDivElement>(null);

  // Hero entrance
  useEffect(() => {
    const t = requestAnimationFrame(() => setTimeout(() => setHeroVisible(true), 80));
    return () => cancelAnimationFrame(t);
  }, []);

  // Scroll listener
  const onScroll = useCallback(() => setScrollY(window.scrollY), []);
  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  // Road SVG draw-in animation
  useEffect(() => {
    if (!roadPathRef.current) return;
    const len = roadPathRef.current.getTotalLength();
    setRoadLength(len);

    let start: number | null = null;
    const duration = 3200;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      setRoadProgress(eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    const t = setTimeout(() => requestAnimationFrame(animate), 500);
    return () => clearTimeout(t);
  }, []);

  // Score reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setScoresActive(true); },
      { threshold: 0.3 }
    );
    if (scoresRef.current) observer.observe(scoresRef.current);
    return () => observer.disconnect();
  }, []);

  const dashOffset = roadLength * (1 - roadProgress);

  return (
    <>
      {/* ── Google Fonts & global keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=Libre+Franklin:wght@300;400;500;600&display=swap');

        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10%       { transform: translate(-2%, -3%); }
          20%       { transform: translate(2%, 1%); }
          30%       { transform: translate(-1%, 4%); }
          40%       { transform: translate(3%, -2%); }
          50%       { transform: translate(-3%, 2%); }
          60%       { transform: translate(1%, -4%); }
          70%       { transform: translate(-2%, 3%); }
          80%       { transform: translate(2%, -1%); }
          90%       { transform: translate(-1%, -2%); }
        }

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.9; }
        }

        .cs5-grain::after {
          content: '';
          position: fixed;
          inset: -50%;
          width: 200%;
          height: 200%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 200px 200px;
          animation: grain 0.5s steps(2) infinite;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.5;
          mix-blend-mode: overlay;
        }

        .cs5-shimmer-text {
          background: linear-gradient(90deg, #c17f59 0%, #e8b89a 40%, #c17f59 60%, #a06840 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .cs5-float { animation: float-slow 6s ease-in-out infinite; }

        .cs5-chapter-nav {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }

        .cs5-horizontal-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .cs5-horizontal-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Film grain overlay ── */}
      <div className="cs5-grain" aria-hidden="true" />

      <div
        className="min-h-screen overflow-x-hidden"
        style={{
          background: "#12100e",
          color: "#f5f0e8",
          fontFamily: "'Libre Franklin', sans-serif",
        }}
      >

        {/* ══════════════════════════════════════════════════════════
            NAV
        ══════════════════════════════════════════════════════════ */}
        <nav
          className="fixed top-0 w-full z-50 flex items-center justify-between px-8 md:px-16 py-5"
          style={{
            background: "linear-gradient(to bottom, rgba(18,16,14,0.95), rgba(18,16,14,0))",
            backdropFilter: "blur(0px)",
          }}
        >
          <span
            className="text-xl tracking-wider"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#f5f0e8" }}
          >
            CurveSeek
          </span>

          <div className="hidden md:flex items-center gap-10">
            {["The Score", "The Method", "The Discovery"].map((item, i) => (
              <a
                key={item}
                href={`#chapter-${i + 1}`}
                className="text-[10px] tracking-[0.35em] uppercase transition-colors hover:text-[#c17f59]"
                style={{ color: "rgba(245,240,232,0.4)" }}
              >
                {item}
              </a>
            ))}
          </div>

          <a
            href="/"
            className="text-[10px] tracking-[0.25em] uppercase px-7 py-3 rounded-full transition-all hover:scale-105"
            style={{
              background: "#c17f59",
              color: "#12100e",
              fontWeight: 600,
            }}
          >
            Open Map
          </a>
        </nav>

        {/* ══════════════════════════════════════════════════════════
            HERO — SPLIT SCREEN
        ══════════════════════════════════════════════════════════ */}
        <section className="relative min-h-screen flex items-center overflow-hidden">

          {/* Ambient glow */}
          <div
            className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(193,127,89,0.07) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />

          <div className="relative w-full max-w-7xl mx-auto px-8 md:px-16 grid md:grid-cols-2 gap-8 md:gap-16 items-center pt-24 pb-16">

            {/* Left: text */}
            <div className="flex flex-col gap-8">
              <div
                className={`text-[10px] tracking-[0.6em] uppercase transition-all duration-700 ${heroVisible ? "opacity-100" : "opacity-0 translate-y-4"}`}
                style={{ color: "#c17f59", transitionDelay: "100ms" }}
              >
                Canadian Road Intelligence
              </div>

              <h1
                className={`text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.92] transition-all duration-1000 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, transitionDelay: "300ms" }}
              >
                The Art
                <br />
                of the
                <br />
                <em className="cs5-shimmer-text italic">Detour</em>
              </h1>

              <p
                className={`text-base leading-relaxed max-w-sm transition-all duration-1000 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ color: "rgba(245,240,232,0.5)", transitionDelay: "600ms" }}
              >
                CurveSeek scores every road across curvature, elevation,
                surface quality, and driving flow — giving you a 0–100
                enthusiasm rating before you turn the key.
              </p>

              <div
                className={`flex items-center gap-6 transition-all duration-1000 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: "900ms" }}
              >
                <a
                  href="/"
                  className="px-9 py-4 rounded-full text-[11px] tracking-[0.25em] uppercase font-semibold transition-all hover:scale-105 hover:shadow-2xl"
                  style={{ background: "#c17f59", color: "#12100e", boxShadow: "0 0 40px rgba(193,127,89,0.3)" }}
                >
                  Discover Roads
                </a>
                <a
                  href="#chapter-1"
                  className="text-[11px] tracking-[0.2em] uppercase transition-colors hover:text-[#c17f59]"
                  style={{ color: "rgba(245,240,232,0.3)" }}
                >
                  Learn more ↓
                </a>
              </div>
            </div>

            {/* Right: animated road SVG */}
            <div
              className={`relative flex items-center justify-center transition-all duration-1200 ${heroVisible ? "opacity-100" : "opacity-0"}`}
              style={{ transitionDelay: "400ms" }}
            >
              <div
                className="cs5-float relative w-full max-w-sm"
                style={{ transform: `translateY(${scrollY * -0.035}px)` }}
              >
                <svg
                  viewBox="0 0 400 600"
                  className="w-full"
                  style={{ filter: "drop-shadow(0 0 60px rgba(193,127,89,0.15))" }}
                >
                  <defs>
                    {/* Gradient for the road stroke */}
                    <linearGradient id="cs5-road-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#c17f59" stopOpacity="0.2" />
                      <stop offset="25%"  stopColor="#e8a878" stopOpacity="1" />
                      <stop offset="50%"  stopColor="#c17f59" stopOpacity="0.9" />
                      <stop offset="75%"  stopColor="#a06040" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#c17f59" stopOpacity="0.3" />
                    </linearGradient>

                    {/* Glow filter */}
                    <filter id="cs5-glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>

                    {/* Clip path to reveal road top-to-bottom */}
                    <clipPath id="cs5-road-clip">
                      <rect x="0" y="0" width="400" height={600 * roadProgress} />
                    </clipPath>
                  </defs>

                  {/* Background road glow (static, wide) */}
                  <path
                    d={[
                      "M 200,0",
                      "C 200,50 320,80 310,150",
                      "C 300,220 80,240 90,310",
                      "C 100,380 330,390 320,460",
                      "C 310,530 150,550 160,600",
                    ].join(" ")}
                    fill="none"
                    stroke="rgba(193,127,89,0.06)"
                    strokeWidth="48"
                    strokeLinecap="round"
                  />

                  {/* Main road path — draws itself in */}
                  <path
                    ref={roadPathRef}
                    d={[
                      "M 200,0",
                      "C 200,50 320,80 310,150",
                      "C 300,220 80,240 90,310",
                      "C 100,380 330,390 320,460",
                      "C 310,530 150,550 160,600",
                    ].join(" ")}
                    fill="none"
                    stroke="url(#cs5-road-grad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: roadLength || 10000,
                      strokeDashoffset: dashOffset,
                      filter: "url(#cs5-glow)",
                    }}
                  />

                  {/* Center dashed line (centre-line markings) */}
                  <path
                    d={[
                      "M 200,0",
                      "C 200,50 320,80 310,150",
                      "C 300,220 80,240 90,310",
                      "C 100,380 330,390 320,460",
                      "C 310,530 150,550 160,600",
                    ].join(" ")}
                    fill="none"
                    stroke="rgba(193,127,89,0.35)"
                    strokeWidth="1"
                    strokeDasharray="16 12"
                    strokeLinecap="round"
                    clipPath="url(#cs5-road-clip)"
                  />

                  {/* Hairpin turn highlight dots */}
                  {[
                    { cx: 310, cy: 150 },
                    { cx: 90,  cy: 310 },
                    { cx: 320, cy: 460 },
                  ].map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.cx}
                      cy={pt.cy}
                      r="5"
                      fill="#c17f59"
                      style={{
                        opacity: roadProgress > (i + 1) * 0.25 ? 1 : 0,
                        transition: "opacity 0.4s ease",
                        animation: "pulse-glow 2s ease-in-out infinite",
                        animationDelay: `${i * 0.6}s`,
                      }}
                    />
                  ))}
                </svg>

                {/* Floating score badge */}
                <div
                  className="absolute top-16 -right-4 md:-right-10 rounded-2xl px-5 py-4 flex flex-col gap-1"
                  style={{
                    background: "rgba(28,25,21,0.92)",
                    border: "1px solid rgba(193,127,89,0.25)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    transform: `translateY(${scrollY * -0.06}px)`,
                    opacity: heroVisible ? 1 : 0,
                    transition: "opacity 1s ease 1.2s",
                  }}
                >
                  <span
                    className="text-[9px] tracking-[0.3em] uppercase"
                    style={{ color: "rgba(245,240,232,0.35)" }}
                  >
                    Enthusiasm Score
                  </span>
                  <span
                    className="cs5-shimmer-text text-4xl leading-none"
                    style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}
                  >
                    92
                  </span>
                </div>

                {/* Floating curvature badge */}
                <div
                  className="absolute bottom-24 -left-4 md:-left-10 rounded-2xl px-5 py-4 flex flex-col gap-1"
                  style={{
                    background: "rgba(28,25,21,0.92)",
                    border: "1px solid rgba(193,127,89,0.15)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    transform: `translateY(${scrollY * -0.02}px)`,
                    opacity: heroVisible ? 1 : 0,
                    transition: "opacity 1s ease 1.8s",
                  }}
                >
                  <span
                    className="text-[9px] tracking-[0.3em] uppercase"
                    style={{ color: "rgba(245,240,232,0.35)" }}
                  >
                    Curvature Index
                  </span>
                  <span
                    className="text-2xl leading-none"
                    style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#f5f0e8" }}
                  >
                    Extreme
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
            style={{ opacity: heroVisible ? 0.4 : 0, transition: "opacity 1s ease 2s" }}
          >
            <span className="text-[9px] tracking-[0.5em] uppercase" style={{ color: "rgba(245,240,232,0.6)" }}>
              Scroll
            </span>
            <div
              className="w-[1px] h-12"
              style={{
                background: "linear-gradient(to bottom, rgba(193,127,89,0.8), transparent)",
                animation: "pulse-glow 2s ease-in-out infinite",
              }}
            />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            PHILOSOPHY STATEMENT
        ══════════════════════════════════════════════════════════ */}
        <section className="relative py-40 md:py-56 px-8 md:px-16 overflow-hidden">
          {/* Large decorative quote mark */}
          <div
            className="absolute top-20 left-8 md:left-16 select-none pointer-events-none"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(200px, 25vw, 400px)",
              lineHeight: 1,
              color: "rgba(193,127,89,0.04)",
              fontWeight: 900,
            }}
          >
            "
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            <Reveal direction="up">
              <p
                className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-tight italic"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400, color: "#f5f0e8" }}
              >
                A great road doesn&rsquo;t take you somewhere.
                <br />
                <span style={{ color: "#c17f59" }}>It makes the journey the destination.</span>
              </p>
            </Reveal>

            <Reveal direction="up" delay={200}>
              <div className="mt-16 flex items-center justify-center gap-6">
                <div className="h-[1px] w-16" style={{ background: "rgba(193,127,89,0.3)" }} />
                <span
                  className="text-[10px] tracking-[0.5em] uppercase"
                  style={{ color: "rgba(245,240,232,0.3)", fontFamily: "'Libre Franklin', sans-serif" }}
                >
                  CurveSeek Philosophy
                </span>
                <div className="h-[1px] w-16" style={{ background: "rgba(193,127,89,0.3)" }} />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            CHAPTER I — THE SCORE
        ══════════════════════════════════════════════════════════ */}
        <section id="chapter-1" className="relative py-32 md:py-44 px-8 md:px-16 overflow-hidden">
          {/* Ambient */}
          <div
            className="absolute bottom-0 right-0 w-[500px] h-[500px] pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(193,127,89,0.06) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />

          <div className="relative max-w-7xl mx-auto">
            {/* Chapter label */}
            <Reveal direction="left">
              <div className="flex items-center gap-5 mb-20">
                <span
                  className="text-[9px] tracking-[0.6em] uppercase"
                  style={{ color: "#c17f59", fontFamily: "'Libre Franklin', sans-serif" }}
                >
                  Chapter I
                </span>
                <div className="h-[1px] flex-1 max-w-xs" style={{ background: "rgba(193,127,89,0.2)" }} />
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
              {/* Left: heading + description */}
              <div>
                <Reveal direction="up">
                  <h2
                    className="text-5xl md:text-6xl lg:text-7xl leading-tight mb-8"
                    style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
                  >
                    The
                    <br />
                    <em className="cs5-shimmer-text italic">Score</em>
                  </h2>
                </Reveal>
                <Reveal direction="up" delay={150}>
                  <p
                    className="text-base leading-loose max-w-md"
                    style={{ color: "rgba(245,240,232,0.5)" }}
                  >
                    Every road in Canada receives a composite enthusiasm score
                    from 0 to 100, synthesised from four independent dimensions
                    measured with precision.
                  </p>
                </Reveal>
                <Reveal direction="up" delay={300}>
                  <div className="mt-10 flex flex-col gap-4">
                    {[
                      { label: "Curvature", pct: 87 },
                      { label: "Elevation", pct: 74 },
                      { label: "Surface",   pct: 91 },
                      { label: "Flow",      pct: 68 },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-4">
                        <span
                          className="w-20 text-[10px] tracking-[0.25em] uppercase"
                          style={{ color: "rgba(245,240,232,0.4)" }}
                        >
                          {item.label}
                        </span>
                        <div className="flex-1 h-[2px] rounded-full" style={{ background: "rgba(245,240,232,0.06)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${item.pct}%`, background: "#c17f59", opacity: 0.7 }}
                          />
                        </div>
                        <span
                          className="w-8 text-right text-[11px]"
                          style={{ color: "rgba(245,240,232,0.3)", fontFamily: "'Playfair Display', serif" }}
                        >
                          {item.pct}
                        </span>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>

              {/* Right: animated score rings */}
              <div ref={scoresRef}>
                <Reveal direction="right">
                  <div className="grid grid-cols-2 gap-10 md:gap-14">
                    {[
                      { score: 87, label: "Curvature",  color: "#c17f59",  delay: 0   },
                      { score: 74, label: "Elevation",  color: "#d4956a",  delay: 200 },
                      { score: 91, label: "Surface",    color: "#b86d48",  delay: 400 },
                      { score: 68, label: "Flow",       color: "#e8a878",  delay: 600 },
                    ].map((ring) => (
                      <ScoreRing
                        key={ring.label}
                        score={ring.score}
                        label={ring.label}
                        color={ring.color}
                        active={scoresActive}
                        delay={ring.delay}
                      />
                    ))}
                  </div>

                  {/* Composite score */}
                  <div
                    className="mt-12 p-6 rounded-2xl text-center"
                    style={{ background: "rgba(193,127,89,0.06)", border: "1px solid rgba(193,127,89,0.15)" }}
                  >
                    <div
                      className="text-[9px] tracking-[0.5em] uppercase mb-3"
                      style={{ color: "rgba(245,240,232,0.35)" }}
                    >
                      Composite Enthusiasm Score
                    </div>
                    <div
                      className="cs5-shimmer-text text-6xl leading-none"
                      style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}
                    >
                      {scoresActive ? "92" : "--"}
                    </div>
                    <div className="mt-2 text-[10px] tracking-[0.3em]" style={{ color: "rgba(245,240,232,0.25)" }}>
                      out of 100
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            CHAPTER II — THE METHOD (horizontal scroll)
        ══════════════════════════════════════════════════════════ */}
        <section id="chapter-2" className="py-32 md:py-44 overflow-hidden" style={{ background: "#0e0c0a" }}>
          <div className="px-8 md:px-16 max-w-7xl mx-auto mb-16">
            <Reveal direction="left">
              <div className="flex items-center gap-5 mb-10">
                <span
                  className="text-[9px] tracking-[0.6em] uppercase"
                  style={{ color: "#c17f59" }}
                >
                  Chapter II
                </span>
                <div className="h-[1px] flex-1 max-w-xs" style={{ background: "rgba(193,127,89,0.2)" }} />
              </div>
            </Reveal>

            <Reveal direction="up">
              <h2
                className="text-5xl md:text-6xl lg:text-7xl leading-tight"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
              >
                The
                <br />
                <em className="cs5-shimmer-text italic">Method</em>
              </h2>
            </Reveal>

            <Reveal direction="up" delay={150}>
              <p
                className="mt-6 text-base max-w-xl"
                style={{ color: "rgba(245,240,232,0.45)" }}
              >
                Four tools, one purpose: helping you find the roads worth driving.
              </p>
            </Reveal>
          </div>

          {/* Horizontal scroll strip */}
          <div
            ref={horizontalRef}
            className="cs5-horizontal-scroll flex gap-5 overflow-x-auto px-8 md:px-16 pb-6"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {[
              {
                number: "01",
                title: "Route Intelligence",
                body: "Enter any start and destination. CurveSeek calculates multiple route alternatives and scores each one. Pick the road that rewards you most, not just the fastest.",
                accent: "#c17f59",
              },
              {
                number: "02",
                title: "Live Curvature Map",
                body: "Every road on the map glows with its curvature rating. Zoom into British Columbia or the Laurentians and watch the high-scoring passes light up in warm amber.",
                accent: "#d4956a",
              },
              {
                number: "03",
                title: "Surface Intelligence",
                body: "Real-world accelerometer data from thousands of drivers feeds a continuously updated surface quality layer — so you know what's waiting beyond the next bend.",
                accent: "#b86d48",
              },
              {
                number: "04",
                title: "Elevation Profiles",
                body: "Visualise the climb before you commit. Dramatic elevation profiles show every crest and descent, calculated from high-resolution DEM data across all of Canada.",
                accent: "#e8a878",
              },
              {
                number: "05",
                title: "Discovery Mode",
                body: "Tell CurveSeek a region you want to explore. It surfaces the top-rated roads nearby — no destination required. Just curiosity, and a full tank of fuel.",
                accent: "#c17f59",
              },
            ].map((card) => (
              <div key={card.number} style={{ scrollSnapAlign: "start" }}>
                <FeatureCard {...card} />
              </div>
            ))}

            {/* Trailing spacer */}
            <div className="flex-shrink-0 w-8 md:w-16" />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            CHAPTER III — THE DISCOVERY (full-width CTA)
        ══════════════════════════════════════════════════════════ */}
        <section
          id="chapter-3"
          className="relative py-40 md:py-64 px-8 md:px-16 overflow-hidden flex items-center justify-center text-center"
        >
          {/* Large animated background road shapes */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="xMidYMid slice">
              <path
                d="M -100,300 C 100,100 300,500 500,300 C 700,100 900,600 1100,300 C 1300,0 1500,400 1700,200"
                fill="none"
                stroke="#c17f59"
                strokeWidth="120"
                strokeLinecap="round"
              />
              <path
                d="M -100,600 C 200,400 400,700 700,500 C 1000,300 1100,700 1400,500 C 1600,350 1700,550 1900,400"
                fill="none"
                stroke="#c17f59"
                strokeWidth="80"
                strokeLinecap="round"
              />
            </svg>

            {/* Central glow */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full"
              style={{
                background: "radial-gradient(ellipse, rgba(193,127,89,0.12) 0%, transparent 65%)",
                filter: "blur(40px)",
              }}
            />
          </div>

          <div className="relative max-w-3xl mx-auto">
            {/* Chapter label */}
            <Reveal direction="fade">
              <div className="flex items-center justify-center gap-5 mb-16">
                <div className="h-[1px] w-12" style={{ background: "rgba(193,127,89,0.3)" }} />
                <span
                  className="text-[9px] tracking-[0.6em] uppercase"
                  style={{ color: "#c17f59" }}
                >
                  Chapter III
                </span>
                <div className="h-[1px] w-12" style={{ background: "rgba(193,127,89,0.3)" }} />
              </div>
            </Reveal>

            <Reveal direction="up">
              <h2
                className="text-5xl md:text-7xl lg:text-8xl leading-tight mb-8"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}
              >
                The
                <br />
                <em className="cs5-shimmer-text italic">Discovery</em>
              </h2>
            </Reveal>

            <Reveal direction="up" delay={200}>
              <p
                className="text-lg md:text-xl leading-relaxed mb-14 mx-auto max-w-xl"
                style={{ color: "rgba(245,240,232,0.5)" }}
              >
                Open source. Free to use. Built for Canadian drivers who believe
                the journey is the point. Every road, scored. Every detour, worth it.
              </p>
            </Reveal>

            <Reveal direction="up" delay={400}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <a
                  href="/"
                  className="px-12 py-5 rounded-full text-[11px] tracking-[0.3em] uppercase font-semibold transition-all hover:scale-105"
                  style={{
                    background: "#c17f59",
                    color: "#12100e",
                    boxShadow: "0 0 60px rgba(193,127,89,0.35)",
                  }}
                >
                  Start Exploring
                </a>
                <a
                  href="https://github.com"
                  className="px-10 py-5 rounded-full text-[11px] tracking-[0.3em] uppercase transition-all hover:scale-105"
                  style={{
                    border: "1px solid rgba(193,127,89,0.3)",
                    color: "rgba(245,240,232,0.6)",
                  }}
                >
                  View Source
                </a>
              </div>
            </Reveal>

            {/* Stats row */}
            <Reveal direction="up" delay={600}>
              <div className="mt-20 grid grid-cols-3 gap-6 pt-12" style={{ borderTop: "1px solid rgba(193,127,89,0.1)" }}>
                {[
                  { value: "100", unit: "pt", label: "Scale" },
                  { value: "4",   unit: "D",  label: "Dimensions" },
                  { value: "∞",   unit: "",   label: "Roads" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div
                      className="text-3xl md:text-4xl leading-none mb-2"
                      style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#f5f0e8" }}
                    >
                      {stat.value}<span style={{ color: "#c17f59" }}>{stat.unit}</span>
                    </div>
                    <div
                      className="text-[9px] tracking-[0.4em] uppercase"
                      style={{ color: "rgba(245,240,232,0.25)" }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════════════ */}
        <footer
          className="py-12 px-8 md:px-16"
          style={{ borderTop: "1px solid rgba(245,240,232,0.04)" }}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <span
              className="text-lg tracking-wider"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "rgba(245,240,232,0.5)" }}
            >
              CurveSeek
            </span>

            <div className="flex items-center gap-8 text-[9px] tracking-[0.35em] uppercase" style={{ color: "rgba(245,240,232,0.2)" }}>
              <span>© 2026</span>
              <span style={{ color: "rgba(193,127,89,0.4)" }}>·</span>
              <span>MIT License</span>
              <span style={{ color: "rgba(193,127,89,0.4)" }}>·</span>
              <span>Built for Canadian Roads</span>
            </div>

            <a
              href="/"
              className="text-[9px] tracking-[0.35em] uppercase transition-colors hover:text-[#c17f59]"
              style={{ color: "rgba(245,240,232,0.2)" }}
            >
              Open App →
            </a>
          </div>
        </footer>

      </div>
    </>
  );
}
