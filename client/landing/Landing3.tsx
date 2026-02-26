import React, { useEffect, useState, useRef, useCallback } from "react";

/**
 * Landing 3 — "Topographic Contour"
 * Deep navy background with animated golden contour lines that draw themselves
 * in — like a living USGS topo map. IntersectionObserver-driven scroll triggers,
 * animated elevation SVG profile, circular score rings, and a growing trail line.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContourPath {
  d: string;
  delay: number;
  opacity: number;
  strokeWidth: number;
}

interface ScoreDimension {
  label: string;
  value: number;
  description: string;
  delay: number;
}

// ─── Hook: IntersectionObserver ───────────────────────────────────────────────

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ─── Hook: Scroll position ────────────────────────────────────────────────────

function useScrollY() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return scrollY;
}

// ─── Component: Circular Score Ring ──────────────────────────────────────────

function ScoreRing({ label, value, description, delay }: ScoreDimension) {
  const { ref, inView } = useInView(0.3);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const filled = inView ? circumference - (value / 100) * circumference : circumference;

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-5 group"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="relative w-36 h-36">
        {/* Background ring */}
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="#1a2040"
            strokeWidth="6"
          />
          {/* Animated fill ring */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={filled}
            style={{ transition: `stroke-dashoffset 1.8s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms` }}
          />
          <defs>
            <linearGradient id={`ringGrad-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d4a853" />
              <stop offset="100%" stopColor="#f0c060" />
            </linearGradient>
          </defs>
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={`url(#ringGrad-${label})`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={filled}
            style={{ transition: `stroke-dashoffset 1.8s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms` }}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold leading-none"
            style={{ fontFamily: "'Syne', sans-serif", color: "#f0c060" }}
          >
            {inView ? value : 0}
          </span>
          <span className="text-[9px] tracking-[0.2em] uppercase mt-1" style={{ color: "#d4a853", opacity: 0.6 }}>
            /100
          </span>
        </div>
      </div>
      <div className="text-center max-w-[140px]">
        <div
          className="text-sm font-semibold tracking-widest uppercase mb-2"
          style={{ fontFamily: "'Syne', sans-serif", color: "#d4a853" }}
        >
          {label}
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(220,210,195,0.5)", fontFamily: "'DM Sans', sans-serif" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// ─── Component: Elevation Profile SVG ────────────────────────────────────────

function ElevationProfile() {
  const { ref, inView } = useInView(0.25);
  const [dotPos, setDotPos] = useState({ x: 0, y: 0 });
  const pathRef = useRef<SVGPathElement>(null);
  const animFrameRef = useRef<number>(0);
  const progressRef = useRef(0);

  const pathD =
    "M 0,180 C 60,175 90,160 130,145 C 165,132 180,120 220,95 C 255,72 270,65 310,55 C 345,46 360,50 395,70 C 428,88 445,100 480,105 C 515,110 535,108 570,100 C 605,92 625,88 660,90 C 690,92 710,98 740,110 C 768,122 780,130 800,140 L 800,250 L 0,250 Z";

  const linePath =
    "M 0,180 C 60,175 90,160 130,145 C 165,132 180,120 220,95 C 255,72 270,65 310,55 C 345,46 360,50 395,70 C 428,88 445,100 480,105 C 515,110 535,108 570,100 C 605,92 625,88 660,90 C 690,92 710,98 740,110 C 768,122 780,130 800,140";

  useEffect(() => {
    if (!inView || !pathRef.current) return;

    const path = pathRef.current;
    const totalLength = path.getTotalLength();
    const duration = 3200;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      progressRef.current = eased;

      const point = path.getPointAtLength(eased * totalLength);
      setDotPos({ x: point.x, y: point.y });

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [inView]);

  const strokeLen = 1600;

  return (
    <div ref={ref} className="w-full overflow-hidden">
      <svg
        viewBox="0 0 800 260"
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: "260px" }}
      >
        <defs>
          <linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a853" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#d4a853" stopOpacity="0.02" />
          </linearGradient>
          <filter id="glowLine">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Horizontal grid lines */}
        {[60, 100, 140, 180, 220].map((y) => (
          <line
            key={y}
            x1="0" y1={y} x2="800" y2={y}
            stroke="#d4a853" strokeWidth="0.4" opacity="0.12"
            strokeDasharray="4 8"
          />
        ))}

        {/* Elevation fill */}
        <path d={pathD} fill="url(#elevFill)" />

        {/* Animated stroke line */}
        <path
          ref={pathRef}
          d={linePath}
          fill="none"
          stroke="#d4a853"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#glowLine)"
          strokeDasharray={strokeLen}
          strokeDashoffset={inView ? 0 : strokeLen}
          style={{
            transition: inView ? "stroke-dashoffset 3.2s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
          }}
        />

        {/* Moving dot */}
        {inView && (
          <>
            <circle cx={dotPos.x} cy={dotPos.y} r="6" fill="#0a0e27" stroke="#d4a853" strokeWidth="2.5" />
            <circle cx={dotPos.x} cy={dotPos.y} r="3" fill="#f0c060" />
            <circle cx={dotPos.x} cy={dotPos.y} r="10" fill="none" stroke="#d4a853" strokeWidth="1" opacity="0.4">
              <animate attributeName="r" from="6" to="20" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </>
        )}

        {/* Label markers */}
        {[
          { x: 130, label: "Gatineau Hills", y: 130 },
          { x: 310, label: "Summit", y: 40 },
          { x: 570, label: "Ridge Line", y: 85 },
        ].map(({ x, label, y }) => (
          <g key={label} opacity={inView ? 1 : 0} style={{ transition: "opacity 1s 2s" }}>
            <line x1={x} y1={y - 8} x2={x} y2={y + 18} stroke="#d4a853" strokeWidth="0.8" opacity="0.4" strokeDasharray="3 3" />
            <text x={x} y={y - 14} textAnchor="middle" fill="#d4a853" fontSize="8" opacity="0.55" fontFamily="'DM Sans', sans-serif" letterSpacing="1">
              {label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Component: Topographic Hero SVG ──────────────────────────────────────────

function TopoBackground({ visible }: { visible: boolean }) {
  const contours: ContourPath[] = [
    // Outermost rings — wide, low opacity
    { d: "M 50,500 Q 200,480 350,460 Q 500,440 650,420 Q 800,400 950,380 Q 1100,360 1200,500", delay: 0, opacity: 0.12, strokeWidth: 1 },
    { d: "M 30,460 Q 180,435 340,415 Q 500,395 670,370 Q 840,345 980,325 Q 1120,305 1220,460", delay: 80, opacity: 0.15, strokeWidth: 1 },
    { d: "M 60,420 Q 200,390 370,365 Q 530,340 700,310 Q 860,280 1000,260 Q 1140,240 1240,420", delay: 160, opacity: 0.18, strokeWidth: 1.2 },
    { d: "M 90,380 Q 230,345 400,315 Q 570,285 730,250 Q 890,215 1020,195 Q 1150,178 1260,380", delay: 240, opacity: 0.2, strokeWidth: 1.2 },
    // Mid rings
    { d: "M 150,350 Q 280,308 440,275 Q 600,242 760,210 Q 910,180 1040,165 Q 1160,152 1230,340", delay: 320, opacity: 0.25, strokeWidth: 1.4 },
    { d: "M 200,320 Q 330,275 490,240 Q 640,205 800,172 Q 950,140 1070,125 Q 1185,112 1210,308", delay: 400, opacity: 0.28, strokeWidth: 1.4 },
    { d: "M 260,292 Q 390,245 545,208 Q 690,170 845,138 Q 985,108 1100,96 Q 1200,86 1190,278", delay: 480, opacity: 0.3, strokeWidth: 1.6 },
    { d: "M 320,268 Q 450,218 600,180 Q 745,142 895,110 Q 1025,80 1130,70 Q 1180,65 1170,250", delay: 560, opacity: 0.32, strokeWidth: 1.6 },
    // Inner rings — tighter, brighter
    { d: "M 390,245 Q 510,195 660,156 Q 800,118 940,88 Q 1060,62 1150,55 Q 1165,53 1150,228", delay: 640, opacity: 0.38, strokeWidth: 1.8 },
    { d: "M 460,224 Q 575,172 718,134 Q 858,96 990,68 Q 1100,44 1175,42 Q 1158,42 1130,208", delay: 720, opacity: 0.42, strokeWidth: 1.8 },
    { d: "M 530,206 Q 640,152 775,115 Q 912,78 1035,52 Q 1128,32 1168,32 Q 1145,35 1108,190", delay: 800, opacity: 0.48, strokeWidth: 2 },
    { d: "M 600,190 Q 705,136 832,100 Q 962,64 1076,42 Q 1150,26 1162,26 Q 1132,30 1086,172", delay: 880, opacity: 0.52, strokeWidth: 2 },
    // Summit rings — tight, bright
    { d: "M 670,176 Q 768,122 888,88 Q 1008,54 1110,35 Q 1148,22 1152,24 Q 1120,30 1062,154", delay: 960, opacity: 0.6, strokeWidth: 2.2 },
    { d: "M 740,164 Q 830,110 942,78 Q 1058,46 1140,32 Q 1152,22 1138,24 Q 1098,28 1038,140", delay: 1040, opacity: 0.68, strokeWidth: 2.2 },
    { d: "M 808,154 Q 890,102 994,72 Q 1098,42 1160,34 Q 1150,24 1116,28 Q 1014,46 1012,128", delay: 1120, opacity: 0.76, strokeWidth: 2.4 },
    // Peak cluster
    { d: "M 870,146 Q 944,98 1038,70 Q 1126,44 1150,38 Q 1136,30 1095,35 Q 988,56 985,118", delay: 1200, opacity: 0.82, strokeWidth: 2.4 },
    { d: "M 925,140 Q 992,96 1076,70 Q 1140,48 1150,44 Q 1128,36 1086,44 Q 978,70 958,110", delay: 1280, opacity: 0.88, strokeWidth: 2.6 },
    { d: "M 970,136 Q 1030,96 1104,72 Q 1148,56 1148,52 Q 1120,44 1078,54 Q 975,84 935,106", delay: 1360, opacity: 0.95, strokeWidth: 2.8 },
  ];

  const pathLen = 900;

  return (
    <svg
      viewBox="0 0 1280 560"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden
    >
      <defs>
        <radialGradient id="topoGlow" cx="80%" cy="15%" r="50%">
          <stop offset="0%" stopColor="#d4a853" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#d4a853" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1280" height="560" fill="url(#topoGlow)" />
      {contours.map((c, i) => (
        <path
          key={i}
          d={c.d}
          fill="none"
          stroke="#d4a853"
          strokeWidth={c.strokeWidth}
          opacity={c.opacity}
          strokeLinecap="round"
          strokeDasharray={pathLen}
          strokeDashoffset={visible ? 0 : pathLen}
          style={{
            transition: visible
              ? `stroke-dashoffset 1.6s cubic-bezier(0.4, 0, 0.2, 1) ${c.delay}ms`
              : "none",
          }}
        />
      ))}
    </svg>
  );
}

// ─── Component: Feature Card ──────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  body,
  delay,
  inView,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  delay: number;
  inView: boolean;
}) {
  return (
    <div
      className="relative p-8 border border-[#d4a853]/15 group hover:border-[#d4a853]/40 transition-all duration-500"
      style={{
        background: "linear-gradient(135deg, rgba(212,168,83,0.04) 0%, rgba(10,14,39,0) 60%)",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {/* Corner accent */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#d4a853]/50" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#d4a853]/50" />

      <div className="mb-5 text-[#d4a853]">{icon}</div>
      <h3
        className="text-base font-semibold mb-3 tracking-wide"
        style={{ fontFamily: "'Syne', sans-serif", color: "#e8d5a8" }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "rgba(220,210,195,0.48)", fontFamily: "'DM Sans', sans-serif" }}
      >
        {body}
      </p>
    </div>
  );
}

// ─── Component: Trail Line ────────────────────────────────────────────────────

function TrailLine({ scrollY, totalHeight }: { scrollY: number; totalHeight: number }) {
  const progress = totalHeight > 0 ? Math.min(scrollY / (totalHeight * 0.85), 1) : 0;
  const trailHeight = 2200;
  const filled = progress * trailHeight;

  return (
    <div
      className="fixed left-6 md:left-10 top-0 bottom-0 pointer-events-none z-30"
      style={{ width: "2px" }}
    >
      <svg width="2" height="100%" viewBox={`0 0 2 ${trailHeight}`} preserveAspectRatio="none" className="w-full h-full">
        <line x1="1" y1="0" x2="1" y2={trailHeight} stroke="#d4a853" strokeWidth="1" opacity="0.12" />
        <line
          x1="1" y1="0" x2="1" y2={filled}
          stroke="#d4a853"
          strokeWidth="1.5"
          opacity="0.7"
          style={{ filter: "drop-shadow(0 0 3px rgba(212,168,83,0.5))" }}
        />
        {/* Dot at current position */}
        <circle cx="1" cy={filled} r="3" fill="#d4a853" opacity="0.9" />
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Landing3() {
  const [mounted, setMounted] = useState(false);
  const scrollY = useScrollY();
  const pageRef = useRef<HTMLDivElement>(null);
  const [pageHeight, setPageHeight] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!pageRef.current) return;
    const ro = new ResizeObserver(() => {
      setPageHeight(pageRef.current?.scrollHeight ?? 0);
    });
    ro.observe(pageRef.current);
    return () => ro.disconnect();
  }, []);

  // Parallax offset for hero subtitle
  const heroParallax = scrollY * 0.25;

  const { ref: elevRef, inView: elevInView } = useInView(0.2);
  const { ref: scoresRef, inView: scoresInView } = useInView(0.15);
  const { ref: featuresRef, inView: featuresInView } = useInView(0.1);
  const { ref: quoteRef, inView: quoteInView } = useInView(0.3);
  const { ref: ctaRef, inView: ctaInView } = useInView(0.3);

  const scores: ScoreDimension[] = [
    { label: "Curvature", value: 92, description: "Density and quality of bends per kilometre driven", delay: 0 },
    { label: "Elevation", value: 87, description: "Vertical gain, gradient steepness, and ridge crossings", delay: 200 },
    { label: "Flow", value: 78, description: "Rhythm and cadence — the road's natural driving line", delay: 400 },
    { label: "Surface", value: 95, description: "IRI-calibrated pavement quality and traction rating", delay: 600 },
  ];

  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Composite Road Score",
      body: "Every road reduced to a single 0–100 enthusiast rating, weighted across four independent axes of driving quality.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Side-by-Side Comparison",
      body: "Load up to three route alternatives and compare their radar profiles before you commit to a drive.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Live Drive Recording",
      body: "Accelerometer capture crowdsources real-time surface roughness data. Your drive improves the map for everyone.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
      ),
      title: "Region Discovery",
      body: "Scan any viewport on the Canadian map for roads above your score threshold. Find the unknown classics.",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Syne:wght@400;600;700;800&display=swap');

        @keyframes topoFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-4px) rotate(0.3deg); }
          66%       { transform: translateY(2px) rotate(-0.2deg); }
        }
        @keyframes altitudePulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.04); }
        }
        @keyframes scanDown {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes compassSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }

        .topo-contour-enter {
          animation: topoFloat 8s ease-in-out infinite;
        }
        .score-value-count {
          animation: altitudePulse 3s ease-in-out infinite;
        }
      `}</style>

      <div
        ref={pageRef}
        className="relative min-h-screen overflow-x-hidden"
        style={{ background: "#0a0e27", fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Persistent gradient mesh overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 15% 25%, rgba(212,168,83,0.04) 0%, transparent 70%),
              radial-gradient(ellipse 60% 40% at 85% 75%, rgba(100,120,200,0.05) 0%, transparent 60%),
              radial-gradient(ellipse 40% 60% at 50% 50%, rgba(212,168,83,0.02) 0%, transparent 100%)
            `,
          }}
        />

        {/* Scan line effect */}
        <div
          className="fixed inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(212,168,83,0.012) 3px, rgba(212,168,83,0.012) 4px)",
          }}
        />

        {/* Vertical trail line */}
        <TrailLine scrollY={scrollY} totalHeight={pageHeight} />

        {/* ─── Nav ─────────────────────────────────────────────────────── */}
        <nav
          className="relative z-40 flex items-center justify-between px-12 md:px-20 py-6"
          style={{ borderBottom: "1px solid rgba(212,168,83,0.1)" }}
        >
          <div className="flex items-center gap-4">
            {/* Compass icon */}
            <div style={{ animation: "compassSpin 12s linear infinite", opacity: 0.7 }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#d4a853" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
                <path d="M12 8l2 4-2 4-2-4 2-4z" fill="#d4a853" stroke="none" />
              </svg>
            </div>
            <span
              className="text-sm tracking-[0.3em] uppercase"
              style={{ fontFamily: "'Syne', sans-serif", color: "#d4a853", letterSpacing: "0.25em" }}
            >
              CurveSeek
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#d4a853", animation: "dotBlink 2.4s ease-in-out infinite" }}
            />
            <span
              className="hidden sm:block text-[10px] tracking-[0.25em] uppercase mr-6"
              style={{ color: "rgba(212,168,83,0.45)" }}
            >
              Canada · 0–100 Scale
            </span>
            <a
              href="/"
              className="px-6 py-2.5 text-xs tracking-[0.2em] uppercase transition-all duration-300"
              style={{
                fontFamily: "'Syne', sans-serif",
                color: "#d4a853",
                border: "1px solid rgba(212,168,83,0.3)",
                background: "rgba(212,168,83,0.04)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(212,168,83,0.12)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(212,168,83,0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(212,168,83,0.04)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(212,168,83,0.3)";
              }}
            >
              Open Map
            </a>
          </div>
        </nav>

        {/* ─── Hero ────────────────────────────────────────────────────── */}
        <section
          className="relative min-h-[95vh] flex flex-col items-center justify-center px-8 md:px-16 py-24 overflow-hidden"
        >
          {/* Animated topo background */}
          <div
            className="absolute inset-0 topo-contour-enter"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          >
            <TopoBackground visible={mounted} />
          </div>

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 30%, rgba(10,14,39,0.85) 100%)",
            }}
          />

          {/* Content */}
          <div
            className="relative z-10 text-center"
            style={{ transform: `translateY(${-heroParallax * 0.3}px)` }}
          >
            {/* Altitude badge */}
            <div
              className="inline-flex items-center gap-3 mb-12"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(16px)",
                transition: "all 1s ease 0.1s",
              }}
            >
              <div
                className="flex items-center gap-3 px-5 py-2.5"
                style={{ border: "1px solid rgba(212,168,83,0.25)", background: "rgba(212,168,83,0.05)" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#d4a853", animation: "dotBlink 2s infinite" }}
                />
                <span
                  className="text-[10px] tracking-[0.35em] uppercase"
                  style={{ color: "rgba(212,168,83,0.7)", fontFamily: "'DM Sans', sans-serif" }}
                >
                  Topographic Road Intelligence
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "rgba(212,168,83,0.3)" }}
                />
              </div>
            </div>

            {/* Main headline */}
            <h1
              className="text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] leading-none mb-8 tracking-tight"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(24px)",
                transition: "all 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.25s",
              }}
            >
              <span style={{ color: "#e8d5a8" }}>THE MAP IS</span>
              <br />
              <span
                style={{
                  color: "#d4a853",
                  textShadow: "0 0 60px rgba(212,168,83,0.25), 0 0 120px rgba(212,168,83,0.1)",
                }}
              >
                THE TERRITORY
              </span>
            </h1>

            {/* Tagline */}
            <p
              className="text-base sm:text-lg max-w-xl mx-auto mb-16 leading-relaxed"
              style={{
                color: "rgba(220,210,195,0.5)",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(16px)",
                transition: "all 1s ease 0.5s",
                fontWeight: 300,
              }}
            >
              We quantify what every enthusiast already feels — curvature, elevation change, flow, and surface quality — collapsed into one honest number.
            </p>

            {/* Coordinate decoration */}
            <div
              className="flex items-center justify-center gap-6 text-[10px] tracking-[0.3em] uppercase"
              style={{
                color: "rgba(212,168,83,0.35)",
                opacity: mounted ? 1 : 0,
                transition: "opacity 1s ease 0.8s",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <span>45.4215° N</span>
              <div className="w-8 h-[1px]" style={{ background: "rgba(212,168,83,0.25)" }} />
              <span>75.6972° W</span>
              <div className="w-8 h-[1px]" style={{ background: "rgba(212,168,83,0.25)" }} />
              <span>Canada</span>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
            style={{ opacity: mounted ? 0.4 : 0, transition: "opacity 1s ease 1.5s" }}
          >
            <span className="text-[9px] tracking-[0.4em] uppercase" style={{ color: "rgba(212,168,83,0.6)" }}>
              Scroll
            </span>
            <div
              className="w-[1px] h-12"
              style={{
                background: "linear-gradient(to bottom, rgba(212,168,83,0.6), transparent)",
              }}
            />
          </div>
        </section>

        {/* ─── Elevation Profile ───────────────────────────────────────── */}
        <section
          ref={elevRef}
          className="relative py-28 md:py-36 px-8 md:px-0 overflow-hidden"
          style={{ borderTop: "1px solid rgba(212,168,83,0.08)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 100% 80% at 50% 100%, rgba(212,168,83,0.04) 0%, transparent 70%)",
            }}
          />

          <div className="max-w-6xl mx-auto px-8 md:px-16 mb-14">
            <div
              style={{
                opacity: elevInView ? 1 : 0,
                transform: elevInView ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.9s ease",
              }}
            >
              <span
                className="block text-[10px] tracking-[0.5em] uppercase mb-4"
                style={{ color: "rgba(212,168,83,0.5)" }}
              >
                Elevation Intelligence
              </span>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5"
                style={{ fontFamily: "'Syne', sans-serif", color: "#e8d5a8" }}
              >
                Every Metre of Climb, Mapped
              </h2>
              <p
                className="text-sm sm:text-base max-w-xl leading-relaxed"
                style={{ color: "rgba(220,210,195,0.45)", fontWeight: 300 }}
              >
                CurveSeek traces altitude profiles from OpenTopoData to score gradient steepness, summit density, and ridge complexity.
              </p>
            </div>
          </div>

          {/* Elevation SVG */}
          <div
            className="w-full max-w-6xl mx-auto"
            style={{
              opacity: elevInView ? 1 : 0,
              transition: "opacity 0.8s ease 0.3s",
            }}
          >
            <ElevationProfile />
          </div>

          {/* Route stats */}
          <div
            className="max-w-6xl mx-auto px-8 md:px-16 mt-12 grid grid-cols-3 sm:grid-cols-4 gap-6"
            style={{
              opacity: elevInView ? 1 : 0,
              transform: elevInView ? "translateY(0)" : "translateY(12px)",
              transition: "all 0.9s ease 0.6s",
            }}
          >
            {[
              { label: "Total Distance", value: "138 km" },
              { label: "Elevation Gain", value: "2,140 m" },
              { label: "Max Gradient", value: "11.4%" },
              { label: "Road Score", value: "88 / 100" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center sm:text-left">
                <div
                  className="text-xl sm:text-2xl font-bold mb-1"
                  style={{ fontFamily: "'Syne', sans-serif", color: "#d4a853" }}
                >
                  {value}
                </div>
                <div
                  className="text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: "rgba(212,168,83,0.4)" }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Score Dimensions ────────────────────────────────────────── */}
        <section
          ref={scoresRef}
          className="relative py-28 md:py-36 px-8 md:px-16"
          style={{ borderTop: "1px solid rgba(212,168,83,0.08)" }}
        >
          {/* Background mesh */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 70% 60% at 20% 50%, rgba(212,168,83,0.03) 0%, transparent 60%),
                radial-gradient(ellipse 50% 40% at 80% 30%, rgba(100,120,200,0.04) 0%, transparent 60%)
              `,
            }}
          />

          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <div
              className="text-center mb-20"
              style={{
                opacity: scoresInView ? 1 : 0,
                transform: scoresInView ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.9s ease",
              }}
            >
              <span
                className="block text-[10px] tracking-[0.5em] uppercase mb-4"
                style={{ color: "rgba(212,168,83,0.5)" }}
              >
                Scoring System
              </span>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-bold"
                style={{ fontFamily: "'Syne', sans-serif", color: "#e8d5a8" }}
              >
                Four Axes of Road Character
              </h2>
            </div>

            {/* Score rings */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
              {scoresInView && scores.map((score) => (
                <ScoreRing key={score.label} {...score} />
              ))}
            </div>

            {/* Methodology note */}
            <div
              className="mt-20 p-8 max-w-3xl mx-auto text-center"
              style={{
                border: "1px solid rgba(212,168,83,0.12)",
                background: "rgba(212,168,83,0.025)",
                opacity: scoresInView ? 1 : 0,
                transition: "opacity 0.9s ease 0.8s",
              }}
            >
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(220,210,195,0.45)", fontWeight: 300 }}
              >
                Scores derived from OpenStreetMap geometry, OpenTopoData elevation, and crowdsourced accelerometer IRI readings. Updated continuously as drivers contribute.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Feature Cards ───────────────────────────────────────────── */}
        <section
          ref={featuresRef}
          className="relative py-28 md:py-36 px-8 md:px-16"
          style={{ borderTop: "1px solid rgba(212,168,83,0.08)" }}
        >
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <div
              className="mb-16"
              style={{
                opacity: featuresInView ? 1 : 0,
                transform: featuresInView ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.9s ease",
              }}
            >
              <span
                className="block text-[10px] tracking-[0.5em] uppercase mb-4"
                style={{ color: "rgba(212,168,83,0.5)" }}
              >
                Capabilities
              </span>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-bold"
                style={{ fontFamily: "'Syne', sans-serif", color: "#e8d5a8" }}
              >
                Built for the Serious Driver
              </h2>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature, i) => (
                <FeatureCard
                  key={feature.title}
                  {...feature}
                  delay={i * 120}
                  inView={featuresInView}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Philosophy Quote ────────────────────────────────────────── */}
        <section
          ref={quoteRef}
          className="relative py-28 md:py-40 px-8 md:px-16 text-center overflow-hidden"
          style={{ borderTop: "1px solid rgba(212,168,83,0.08)" }}
        >
          {/* Background contour ring decoration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <svg viewBox="0 0 800 400" className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl" aria-hidden>
              {[80, 120, 160, 200, 240].map((r, i) => (
                <ellipse
                  key={r}
                  cx="400" cy="200" rx={r * 2.5} ry={r}
                  fill="none" stroke="#d4a853" strokeWidth="0.8"
                  opacity={0.08 + i * 0.04}
                  strokeDasharray="6 10"
                />
              ))}
            </svg>
          </div>

          <div
            className="relative z-10 max-w-3xl mx-auto"
            style={{
              opacity: quoteInView ? 1 : 0,
              transform: quoteInView ? "scale(1)" : "scale(0.97)",
              transition: "all 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              className="text-5xl mb-10"
              style={{ color: "rgba(212,168,83,0.2)", fontFamily: "'Syne', sans-serif" }}
            >
              "
            </div>
            <blockquote
              className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight mb-10"
              style={{ fontFamily: "'Syne', sans-serif", color: "#e8d5a8" }}
            >
              A great road isn't just fast. It's alive.
            </blockquote>
            <p
              className="text-sm leading-relaxed max-w-xl mx-auto"
              style={{ color: "rgba(220,210,195,0.42)", fontWeight: 300 }}
            >
              Every curve holds a question. Every crest hides an answer. CurveSeek exists so you spend less time searching and more time driving the roads that deserve your attention.
            </p>
            <div
              className="mt-12 w-12 h-[1px] mx-auto"
              style={{ background: "rgba(212,168,83,0.4)" }}
            />
          </div>
        </section>

        {/* ─── CTA ─────────────────────────────────────────────────────── */}
        <section
          ref={ctaRef}
          className="relative py-28 md:py-40 px-8 md:px-16 overflow-hidden"
          style={{ borderTop: "1px solid rgba(212,168,83,0.08)" }}
        >
          {/* Radial background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(212,168,83,0.06) 0%, transparent 70%)",
            }}
          />

          <div
            className="relative z-10 max-w-2xl mx-auto text-center"
            style={{
              opacity: ctaInView ? 1 : 0,
              transform: ctaInView ? "translateY(0)" : "translateY(24px)",
              transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <span
              className="block text-[10px] tracking-[0.5em] uppercase mb-6"
              style={{ color: "rgba(212,168,83,0.5)" }}
            >
              Start Exploring
            </span>
            <h2
              className="text-3xl sm:text-5xl md:text-6xl font-bold mb-8 leading-tight"
              style={{ fontFamily: "'Syne', sans-serif", color: "#e8d5a8" }}
            >
              Your Next Great Road is Already Scored
            </h2>
            <p
              className="text-sm sm:text-base leading-relaxed mb-14 max-w-lg mx-auto"
              style={{ color: "rgba(220,210,195,0.45)", fontWeight: 300 }}
            >
              Open the interactive map and search any region of Canada for roads above your threshold. Free, no account required.
            </p>

            {/* CTA button */}
            <a
              href="/"
              className="inline-flex items-center gap-4 px-10 py-5 text-sm font-semibold tracking-[0.2em] uppercase transition-all duration-400 group"
              style={{
                fontFamily: "'Syne', sans-serif",
                color: "#0a0e27",
                background: "linear-gradient(135deg, #d4a853, #f0c060)",
                boxShadow: "0 0 40px rgba(212,168,83,0.3), 0 0 80px rgba(212,168,83,0.1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 60px rgba(212,168,83,0.5), 0 0 120px rgba(212,168,83,0.2)";
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 40px rgba(212,168,83,0.3), 0 0 80px rgba(212,168,83,0.1)";
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
              }}
            >
              Explore the Map
              <svg viewBox="0 0 24 24" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

            {/* Subtext */}
            <p
              className="mt-8 text-[11px] tracking-[0.2em] uppercase"
              style={{ color: "rgba(212,168,83,0.3)" }}
            >
              Canada · Roads scored on a 0–100 scale
            </p>
          </div>
        </section>

        {/* ─── Footer ──────────────────────────────────────────────────── */}
        <footer
          className="relative py-8 px-12 md:px-20"
          style={{ borderTop: "1px solid rgba(212,168,83,0.1)" }}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="text-xs tracking-[0.3em] uppercase"
                style={{ fontFamily: "'Syne', sans-serif", color: "rgba(212,168,83,0.35)" }}
              >
                CurveSeek
              </span>
              <span className="text-[10px]" style={{ color: "rgba(212,168,83,0.2)" }}>·</span>
              <span
                className="text-[10px] tracking-widest"
                style={{ color: "rgba(212,168,83,0.25)" }}
              >
                Road Intelligence for Canadian Drivers
              </span>
            </div>
            <div
              className="text-[10px] tracking-[0.25em] uppercase"
              style={{ color: "rgba(212,168,83,0.2)" }}
            >
              MIT License
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
