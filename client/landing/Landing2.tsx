import React, { useEffect, useState, useRef } from "react";

/**
 * Landing 2 — "RAW CONCRETE"
 * Brutalist: exposed structure, raw edges, monospaced type, harsh contrast.
 * Concrete gray + electric lime accents. Overlapping elements, visible grid,
 * glitch effects, aggressive SVG path animations. Nothing is precious.
 */

/* ── Animated SVG: a road that draws itself with sharp switchbacks ── */
function SwitchbackSVG() {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Aggressive switchback path
  const d =
    "M 60,580 L 60,520 L 340,480 L 60,440 L 340,400 L 60,360 L 340,320 L 60,280 L 340,240 L 60,200 L 340,160 L 60,120 L 340,80 L 200,20";

  return (
    <svg viewBox="0 0 400 600" className="w-full h-full" fill="none">
      {/* Grid lines behind */}
      {[...Array(13)].map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 50} x2="400" y2={i * 50} stroke="#a3e635" strokeWidth="0.3" opacity="0.15" />
      ))}
      {[...Array(9)].map((_, i) => (
        <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="600" stroke="#a3e635" strokeWidth="0.3" opacity="0.15" />
      ))}
      {/* The road */}
      <path
        d={d}
        stroke="#a3e635"
        strokeWidth="3"
        strokeLinecap="square"
        strokeDasharray="2000"
        strokeDashoffset={drawn ? 0 : 2000}
        style={{ transition: "stroke-dashoffset 3s cubic-bezier(0.33, 1, 0.68, 1)" }}
      />
      {/* Harsh dots at switchback vertices */}
      {[
        [60, 520], [340, 480], [60, 440], [340, 400], [60, 360], [340, 320],
        [60, 280], [340, 240], [60, 200], [340, 160], [60, 120], [340, 80],
      ].map(([x, y], i) => (
        <rect
          key={i}
          x={x - 4}
          y={y - 4}
          width="8"
          height="8"
          fill="#a3e635"
          opacity={drawn ? 1 : 0}
          style={{ transition: `opacity 0.3s ease ${1.5 + i * 0.15}s` }}
        />
      ))}
      {/* Score at top */}
      <text
        x="200"
        y="16"
        textAnchor="middle"
        fill="#a3e635"
        fontSize="14"
        fontFamily="monospace"
        opacity={drawn ? 1 : 0}
        style={{ transition: "opacity 0.5s ease 3.5s" }}
      >
        SCORE: 94
      </text>
    </svg>
  );
}

/* ── Glitch text component ── */
function GlitchText({ children, className = "" }: { children: string; className?: string }) {
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
function Counter({ value, suffix = "", label, delay = 0 }: { value: number; suffix?: string; label: string; delay?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setTimeout(() => setStarted(true), delay); },
      { threshold: 0.5 }
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
    <div ref={ref} className="border border-[#a3e635]/20 p-6 md:p-8 relative group hover:bg-[#a3e635]/5 transition-colors duration-300">
      <div className="text-5xl md:text-7xl font-bold text-[#a3e635] tabular-nums leading-none mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>
        {count}{suffix}
      </div>
      <div className="text-xs uppercase tracking-[0.3em] text-neutral-500" style={{ fontFamily: "'Space Mono', monospace" }}>
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
    "CURVATURE ●", "ELEVATION ●", "SURFACE ●", "FLOW ●",
    "SWITCHBACKS ●", "GRADIENT ●", "CORNERS ●", "RHYTHM ●",
  ];
  const text = items.join("  ");
  return (
    <div className="overflow-hidden border-y border-[#a3e635]/20 py-4 select-none">
      <div className="flex whitespace-nowrap" style={{ animation: "marqueeScroll 20s linear infinite" }}>
        <span className="text-sm tracking-[0.4em] uppercase text-[#a3e635]/30 px-4" style={{ fontFamily: "'Space Mono', monospace" }}>
          {text}&nbsp;&nbsp;{text}
        </span>
        <span className="text-sm tracking-[0.4em] uppercase text-[#a3e635]/30 px-4" style={{ fontFamily: "'Space Mono', monospace" }}>
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

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export function Landing2() {
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
            background: "repeating-linear-gradient(to bottom, transparent, transparent 2px, #a3e635 2px, #a3e635 3px)",
          }}
        />

        {/* ═══════ HERO ═══════ */}
        <section className="relative min-h-screen flex flex-col justify-between px-6 md:px-12 lg:px-20 pt-8 pb-6 overflow-hidden">
          {/* Top bar — exposed nav */}
          <div
            className={`flex justify-between items-start border-b border-[#a3e635]/15 pb-4 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
          >
            <div>
              <div className="text-[10px] text-neutral-600 uppercase tracking-[0.3em] mb-1">SYS://NAV</div>
              <div className="text-sm font-bold text-[#a3e635] tracking-wider">CURVESEEK_</div>
            </div>
            <div className="flex gap-6 items-center">
              <a href="#data" className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 hover:text-[#a3e635] transition-colors hidden md:inline">
                [THE SCORE]
              </a>
              <a href="#method" className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 hover:text-[#a3e635] transition-colors hidden md:inline">
                [THE METHOD]
              </a>
              <a href="#discovery" className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 hover:text-[#a3e635] transition-colors hidden md:inline">
                [THE DISCOVERY]
              </a>
              <a
                href="/"
                className="text-[10px] uppercase tracking-[0.3em] border border-[#a3e635] text-[#a3e635] px-4 py-2 hover:bg-[#a3e635] hover:text-black transition-all duration-200"
              >
                LAUNCH→
              </a>
            </div>
          </div>

          {/* Hero content — asymmetric grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-16 items-center py-12 md:py-20">
            <div className="relative">
              {/* Oversized section number */}
              <div
                className={`absolute -top-4 -left-2 text-[12rem] md:text-[18rem] font-bold leading-none text-[#a3e635]/[0.03] select-none transition-opacity duration-1000 ${visible ? "opacity-100" : "opacity-0"}`}
              >
                01
              </div>

              <div className="relative z-10">
                {/* Typewriter tagline */}
                <div
                  className={`text-xs text-[#a3e635]/60 uppercase tracking-[0.5em] mb-6 h-5 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
                  style={{ transitionDelay: "200ms" }}
                >
                  {typed}<Cursor />
                </div>

                {/* Main headline — raw, stacked, overlapping */}
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

                {/* Subtext with harsh line */}
                <div
                  className={`mt-8 md:mt-12 flex items-start gap-4 transition-all duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
                  style={{ transitionDelay: "800ms" }}
                >
                  <div className="w-12 h-[2px] bg-[#a3e635] mt-2.5 shrink-0" />
                  <p className="text-sm text-neutral-500 leading-relaxed max-w-md">
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
                    href="/"
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

            {/* Right column — switchback SVG visualization */}
            <div
              className={`hidden lg:block h-[500px] border border-[#a3e635]/10 relative transition-all duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
              style={{ transitionDelay: "600ms", animation: visible ? "borderPulse 4s ease-in-out infinite" : "none" }}
            >
              <div className="absolute top-3 left-3 text-[9px] text-[#a3e635]/40 uppercase tracking-widest">
                ROUTE_ANALYSIS.SVG
              </div>
              <div className="absolute bottom-3 right-3 text-[9px] text-[#a3e635]/40 uppercase tracking-widest">
                12 SWITCHBACKS
              </div>
              <SwitchbackSVG />
            </div>
          </div>

          {/* Bottom status bar */}
          <div
            className={`flex flex-wrap justify-between text-[9px] uppercase tracking-[0.4em] text-neutral-700 border-t border-[#a3e635]/10 pt-4 transition-opacity duration-1000 ${visible ? "opacity-100" : "opacity-0"}`}
            style={{ transitionDelay: "1200ms" }}
          >
            <span>SYS_STATUS: <span className="text-[#a3e635]">ONLINE</span></span>
            <span className="hidden md:inline">LAT: 45.4215 / LNG: -75.6972</span>
            <span className="hidden md:inline">BUILD: 2026.02</span>
            <span>SCROLL↓</span>
          </div>
        </section>

        {/* ── Marquee strip ── */}
        <Marquee />

        {/* ═══════ DATA SECTION ═══════ */}
        <section id="data" className="py-20 md:py-32 px-6 md:px-12 lg:px-20 relative">
          {/* Ghost number */}
          <div className="absolute top-8 right-8 md:right-20 text-[10rem] md:text-[16rem] font-bold leading-none text-[#a3e635]/[0.02] select-none">
            02
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12 md:mb-16">
              <div className="w-8 h-[2px] bg-[#a3e635]" />
              <span className="text-[10px] uppercase tracking-[0.5em] text-[#a3e635]">CHAPTER_I // THE SCORE</span>
            </div>

            <h2 className="text-3xl md:text-6xl font-bold tracking-tight mb-16 md:mb-20 max-w-3xl leading-[0.95]">
              THE<br />
              <span className="text-neutral-600">SCORE</span><br />
              <span className="text-[#a3e635]">SYSTEM</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#a3e635]/10">
              <Counter value={87} label="Curvature" delay={0} />
              <Counter value={74} label="Elevation" delay={100} />
              <Counter value={91} label="Surface" delay={200} />
              <Counter value={68} label="Flow" delay={300} />
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="mx-6 md:mx-12 lg:mx-20 h-[1px] bg-neutral-900" />

        {/* ═══════ METHOD ═══════ */}
        <section id="method" className="py-20 md:py-32 px-6 md:px-12 lg:px-20 relative">
          <div className="absolute top-8 left-8 md:left-20 text-[10rem] md:text-[16rem] font-bold leading-none text-[#a3e635]/[0.02] select-none">
            03
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12 md:mb-16">
              <div className="w-8 h-[2px] bg-[#a3e635]" />
              <span className="text-[10px] uppercase tracking-[0.5em] text-[#a3e635]">CHAPTER_II // THE METHOD</span>
            </div>

            <div className="grid md:grid-cols-2 gap-16 md:gap-24">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[0.95]">
                THE<br />
                <span className="text-neutral-600">METHOD</span><br />
                <span className="text-[#a3e635]">STACK</span>
              </h2>

              <div className="space-y-0">
                {[
                  { id: "01", name: "ROUTE_INTELLIGENCE", desc: "Enter any start and destination. CurveSeek calculates multiple route alternatives and scores each one. Pick the road that rewards you most, not just the fastest.", bar: 92 },
                  { id: "02", name: "LIVE_CURVATURE_MAP", desc: "Every road on the map glows with its curvature rating. Zoom into British Columbia or the Laurentians and watch the high-scoring passes light up.", bar: 87 },
                  { id: "03", name: "SURFACE_INTELLIGENCE", desc: "Real-world accelerometer data from thousands of drivers feeds a continuously updated surface quality layer so you know what waits beyond the next bend.", bar: 91 },
                  { id: "04", name: "ELEVATION_PROFILES", desc: "Visualize the climb before you commit. Dramatic elevation profiles show every crest and descent from high-resolution terrain data.", bar: 84 },
                  { id: "05", name: "DISCOVERY_MODE", desc: "Tell CurveSeek a region you want to explore. It surfaces top-rated roads nearby with no destination required.", bar: 95 },
                ].map((item, i) => (
                  <div key={item.id} className="border-b border-neutral-900 py-6 group hover:bg-[#a3e635]/[0.02] px-4 -mx-4 transition-colors duration-300">
                    <div className="flex items-baseline gap-4 mb-2">
                      <span className="text-[10px] text-[#a3e635]/60 font-bold">{item.id}</span>
                      <h3 className="text-sm font-bold tracking-wider">{item.name}</h3>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed mb-3">{item.desc}</p>
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
          <div className="flex whitespace-nowrap" style={{ animation: "marqueeScroll 15s linear infinite reverse" }}>
            {[0, 1].map((k) => (
              <span key={k} className="text-[10px] tracking-[0.6em] uppercase text-[#a3e635]/20 px-4">
                NO OPINIONS — JUST DATA ◼ NO OPINIONS — JUST DATA ◼ NO OPINIONS — JUST DATA ◼ NO OPINIONS — JUST DATA ◼
              </span>
            ))}
          </div>
        </div>

        {/* ═══════ QUOTE / PHILOSOPHY ═══════ */}
        <section className="py-24 md:py-36 px-6 md:px-12 lg:px-20 relative overflow-hidden">
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(#a3e635 1px, transparent 1px), linear-gradient(90deg, #a3e635 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="border-l-4 border-[#a3e635] pl-8 md:pl-12">
              <p className="text-2xl md:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight">
                A GREAT ROAD<br />
                DOESN'T TAKE YOU <span className="bg-[#a3e635] text-black px-2 inline-block">SOMEWHERE</span>.<br />
                IT MAKES THE JOURNEY THE DESTINATION<span className="text-[#a3e635]">_</span>
              </p>
            </div>
            <div className="mt-10 flex items-center gap-4 pl-8 md:pl-12">
              <div className="w-12 h-[1px] bg-neutral-800" />
              <span className="text-[10px] uppercase tracking-[0.5em] text-neutral-700">CURVESEEK // PHILOSOPHY STATEMENT</span>
            </div>
          </div>
        </section>

        {/* ═══════ FINAL CTA ═══════ */}
        <section id="discovery" className="relative py-24 md:py-36 px-6 md:px-12 lg:px-20">
          <div className="border border-[#a3e635]/20 p-8 md:p-16 relative">
            {/* Corner markers */}
            <span className="absolute -top-[3px] -left-[3px] w-5 h-5 border-t-2 border-l-2 border-[#a3e635]" />
            <span className="absolute -top-[3px] -right-[3px] w-5 h-5 border-t-2 border-r-2 border-[#a3e635]" />
            <span className="absolute -bottom-[3px] -left-[3px] w-5 h-5 border-b-2 border-l-2 border-[#a3e635]" />
            <span className="absolute -bottom-[3px] -right-[3px] w-5 h-5 border-b-2 border-r-2 border-[#a3e635]" />

            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.5em] text-[#a3e635]/50 mb-6">
                CHAPTER_III // THE DISCOVERY
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
                THE<br />
                <span className="text-neutral-700">DISCOVERY</span><br />
                <GlitchText className="text-[#a3e635]">LOOP</GlitchText>
              </h2>
              <p className="text-sm text-neutral-600 max-w-md mx-auto mb-10 leading-relaxed">
                Open source. Free to use. Built for Canadian drivers who believe
                the journey is the point. Every road, scored. Every detour, worth it.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a
                  href="/"
                  className="group relative inline-block px-12 py-5 bg-[#a3e635] text-black text-xs font-bold uppercase tracking-[0.3em] hover:bg-[#bef264] transition-colors overflow-hidden"
                >
                  <span className="relative z-10">START EXPLORING →</span>
                  <span className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                </a>
                <a
                  href="https://github.com"
                  className="inline-block px-12 py-5 border border-neutral-700 text-neutral-400 text-xs font-bold uppercase tracking-[0.3em] hover:border-[#a3e635] hover:text-[#a3e635] transition-all duration-300"
                >
                  VIEW SOURCE
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ FOOTER ═══════ */}
        <footer className="px-6 md:px-12 lg:px-20 py-8 border-t border-neutral-900">
          <div className="flex flex-wrap justify-between items-center gap-4 text-[9px] uppercase tracking-[0.4em] text-neutral-800">
            <span>CURVESEEK © 2026</span>
            <span>OPEN SOURCE // MIT</span>
            <span>BUILT FOR <span className="text-[#a3e635]">CANADIAN ROADS</span></span>
          </div>
        </footer>
      </div>
    </>
  );
}
