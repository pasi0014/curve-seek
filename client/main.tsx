import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingWrapper } from "./landing/LandingWrapper";

// Lazy-load the App so its styles.css import doesn't affect landing pages
const AppWrapper = lazy(() => import("./AppWrapper"));

const root = createRoot(document.getElementById("root")!);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/1" element={<LandingWrapper page={1} />} />
      <Route path="/2" element={<LandingWrapper page={2} />} />
      <Route path="/3" element={<LandingWrapper page={3} />} />
      <Route path="/4" element={<LandingWrapper page={4} />} />
      <Route path="/5" element={<LandingWrapper page={5} />} />
      <Route path="*" element={<Suspense fallback={null}><AppWrapper /></Suspense>} />
    </Routes>
  </BrowserRouter>
);
