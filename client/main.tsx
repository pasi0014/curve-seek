import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./app.css";
import { Home } from "./pages/Home";

const App = lazy(() => import("./App").then((m) => ({ default: m.App })));

const root = createRoot(document.getElementById("root")!);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/app/*" element={<Suspense fallback={null}><App /></Suspense>} />
    </Routes>
  </BrowserRouter>
);
