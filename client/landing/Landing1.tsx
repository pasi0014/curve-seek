import React, { useEffect, useState, useRef } from "react";

/**
 * Landing 1 — "Midnight Rally"
 * Dark, cinematic, motorsport-inspired. Night rally stage with headlights
 * cutting through fog. Aggressive typography, tachometer-style scoring display,
 * grain overlay, deep blacks with hot amber/orange accents.
 */

function TachometerRing({ score, label, delay }: { score: number; label: string; delay: number }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setTimeout(() => setAnimated(true), delay); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * (animated ? score : 0)) / 100;
  const gradientId = `tachGrad-${label}`;

  return (
    <div ref={ref} className="flex flex-col items-center gap-4">
      <div className="relative w-36 h-36 md:w-40 md:h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#1a1a1a" strokeWidth="7" />
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 2s cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl md:text-4xl font-black tabular-nums text-white" style={{ fontFamily: "'Oswald', sans-serif" }}>
            {animated ? score : 0}
          </span>
        </div>
      </div>
      <span className="text-[11px] tracking-[0.3em] uppercase text-amber-400/70" style={{ fontFamily: "'Oswald', sans-serif" }}>
        {label}
      </span>
    </div>
  );
}

export function Landing1() {
  const [visible, setVisible] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [featuresVisible, setFeaturesVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setFeaturesVisible(true); },
      { threshold: 0.15 }
    );
    if (featuresRef.current) observer.observe(featuresRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=Barlow+Condensed:wght@300;400;500;600&display=swap');
        @keyframes roadScroll { from { transform: translateY(-40px); } to { transform: translateY(0); } }
        @keyframes grainShift { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-2%, -2%); } 30% { transform: translate(3%, 1%); } 50% { transform: translate(-1%, 3%); } 70% { transform: translate(2%, -1%); } 90% { transform: translate(-3%, 2%); } }
        @keyframes headlightPulse { 0%, 100% { opacity: 0.06; } 50% { opacity: 0.14; } }
        @keyframes sweepIn { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      `}</style>
      <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
        {/* Grain */}
        <div
          className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            animation: "grainShift 0.5s steps(6) infinite",
          }}
        />

        {/* ───────── HERO ───────── */}
        <section className="relative min-h-screen flex flex-col justify-center items-center px-8 md:px-16 overflow-hidden">
          {/* Headlight glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[1000px] pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.10) 0%, transparent 65%)",
              animation: "headlightPulse 4s ease-in-out infinite",
            }}
          />

          {/* Road center-line */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-72 opacity-15">
            <div
              className="w-full h-full"
              style={{
                background: "repeating-linear-gradient(to bottom, #f59e0b 0px, #f59e0b 20px, transparent 20px, transparent 40px)",
                animation: "roadScroll 1.5s linear infinite",
              }}
            />
          </div>

          {/* Badge */}
          <div
            className={`mb-10 border border-amber-500/25 rounded-full px-6 py-2 text-amber-400 text-xs tracking-[0.4em] uppercase transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 400, transitionDelay: "200ms" }}
          >
            For drivers who seek the curve
          </div>

          {/* Title */}
          <h1
            className={`text-6xl sm:text-8xl md:text-[9rem] lg:text-[11rem] font-bold tracking-tight leading-[0.85] text-center transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ fontFamily: "'Oswald', sans-serif", transitionDelay: "400ms" }}
          >
            <span className="text-white">CURVE</span>
            <span className="text-amber-500">SEEK</span>
          </h1>

          {/* Sweep line */}
          <div
            className={`w-56 h-[2px] bg-gradient-to-r from-amber-500 to-red-500 mt-8 mb-10 origin-left transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
            style={{ animation: visible ? "sweepIn 0.7s ease-out 0.7s both" : "none" }}
          />

          {/* Tagline */}
          <p
            className={`text-lg md:text-2xl text-neutral-400 font-light tracking-wide text-center max-w-xl leading-relaxed transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "800ms" }}
          >
            Rate every curve. Score every road. <br className="hidden md:block" />
            Find the drive that makes you <span className="text-amber-400 font-semibold">feel alive</span>.
          </p>

          {/* CTA buttons */}
          <div
            className={`mt-14 flex flex-col sm:flex-row gap-4 sm:gap-5 transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "1000ms" }}
          >
            <a
              href="/"
              className="relative px-12 py-4 bg-amber-500 text-black font-bold text-sm tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors text-center"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              <span className="relative z-10">Launch App</span>
              {/* Angled accent corners */}
              <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-black/20" />
              <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-black/20" />
            </a>
            <a
              href="#features"
              className="px-12 py-4 border border-neutral-700 text-neutral-300 font-semibold text-sm tracking-[0.2em] uppercase hover:border-amber-500/50 hover:text-amber-400 transition-all text-center"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Learn More
            </a>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
            <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-600" style={{ fontFamily: "'Oswald', sans-serif" }}>Scroll</span>
            <div className="w-[1px] h-6 bg-gradient-to-b from-amber-500/50 to-transparent" />
          </div>
        </section>

        {/* ───────── SCORES ───────── */}
        <section className="relative py-28 md:py-36 px-8 md:px-16 bg-neutral-950" id="features">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-5" style={{ fontFamily: "'Oswald', sans-serif" }}>
              EVERY ROAD, <span className="text-amber-500">RATED</span>
            </h2>
            <p className="text-neutral-500 text-base md:text-lg mb-20 max-w-2xl mx-auto leading-relaxed">
              CurveSeek analyzes curvature, elevation changes, surface quality, and flow to score every route on a 100-point scale.
            </p>

            <div className="flex flex-wrap justify-center gap-12 md:gap-20">
              <TachometerRing score={92} label="Curvature" delay={100} />
              <TachometerRing score={87} label="Elevation" delay={200} />
              <TachometerRing score={78} label="Flow" delay={300} />
              <TachometerRing score={95} label="Surface" delay={400} />
            </div>
          </div>
        </section>

        {/* ───────── FEATURES ───────── */}
        <section ref={featuresRef} className="relative py-28 md:py-36 px-8 md:px-16 bg-black">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-[1px] bg-neutral-800/50">
              {[
                { title: "Route Analysis", desc: "Compare multiple route options with detailed scoring breakdowns across curvature, elevation, and road surface data.", icon: "⟁" },
                { title: "Drive Mode", desc: "Record accelerometer data while you drive to crowdsource road conditions and build a community database.", icon: "◉" },
                { title: "Road Discovery", desc: "Explore roads by region. Find hidden gems ranked by enthusiast score — the curves others rave about.", icon: "⬡" },
              ].map((f, i) => (
                <div
                  key={f.title}
                  className={`group bg-neutral-950 p-10 md:p-12 hover:bg-neutral-900/50 transition-all duration-700 ${featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  <span className="text-3xl text-amber-500/50 block mb-8">{f.icon}</span>
                  <h3 className="text-xl font-bold tracking-wide mb-4 text-white" style={{ fontFamily: "'Oswald', sans-serif" }}>
                    {f.title}
                  </h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{f.desc}</p>
                  <div className="mt-8 w-8 h-[2px] bg-amber-500/0 group-hover:bg-amber-500/60 group-hover:w-16 transition-all duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── QUOTE ───────── */}
        <section className="relative py-36 md:py-44 px-8 md:px-16 bg-neutral-950 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 100px, #f59e0b 100px, #f59e0b 101px)",
          }} />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <span className="text-5xl text-amber-500/15 block mb-6" style={{ fontFamily: "'Oswald', sans-serif" }}>&ldquo;</span>
            <p className="text-2xl md:text-4xl lg:text-5xl font-light leading-snug text-neutral-300" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              The shortest distance between two points is a <span className="text-amber-400 font-semibold italic">boring road</span>.
            </p>
            <div className="mt-10 w-12 h-[2px] bg-amber-500 mx-auto" />
            <p className="mt-6 text-sm tracking-[0.3em] uppercase text-neutral-600" style={{ fontFamily: "'Oswald', sans-serif" }}>
              CurveSeek Philosophy
            </p>
          </div>
        </section>

        {/* ───────── FINAL CTA ───────── */}
        <section className="relative py-28 md:py-36 px-8 md:px-16 bg-black text-center">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-8" style={{ fontFamily: "'Oswald', sans-serif" }}>
            STOP DRIVING <span className="text-amber-500">STRAIGHT</span>
          </h2>
          <p className="text-neutral-500 text-base md:text-lg mb-12 max-w-lg mx-auto leading-relaxed">
            Plan routes that reward the driver. Discover roads that demand respect.
          </p>
          <a
            href="/"
            className="inline-block px-14 py-5 bg-amber-500 text-black font-bold text-sm tracking-[0.25em] uppercase hover:bg-amber-400 transition-colors"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Start Seeking
          </a>
        </section>

        {/* ───────── FOOTER ───────── */}
        <footer className="py-10 px-8 md:px-16 border-t border-neutral-900 text-center">
          <span className="text-xs text-neutral-700 tracking-[0.25em] uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
            CurveSeek — Canadian Roads, Scored
          </span>
        </footer>
      </div>
    </>
  );
}
