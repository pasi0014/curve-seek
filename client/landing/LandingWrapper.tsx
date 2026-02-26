import React, { lazy, Suspense } from "react";
import "../app.css";

const Landing1 = lazy(() => import("./Landing1").then(m => ({ default: m.Landing1 })));
const Landing2 = lazy(() => import("./Landing2").then(m => ({ default: m.Landing2 })));
const Landing3 = lazy(() => import("./Landing3").then(m => ({ default: m.Landing3 })));
const Landing4 = lazy(() => import("./Landing4").then(m => ({ default: m.Landing4 })));
const Landing5 = lazy(() => import("./Landing5").then(m => ({ default: m.Landing5 })));

const pages: Record<number, React.LazyExoticComponent<React.FC>> = {
  1: Landing1,
  2: Landing2,
  3: Landing3,
  4: Landing4,
  5: Landing5,
};

export function LandingWrapper({ page }: { page: number }) {
  const Page = pages[page];
  if (!Page) return null;

  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <Page />
    </Suspense>
  );
}
