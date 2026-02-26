import React, { useState, useMemo, useEffect } from "react";
import clsx from "clsx";
import type { GeocodedPlace, RouteCandidate, SavedRouteDetail as SavedRouteDetailType, SavedStop, StopType } from "./types";
import { LocationInput } from "./components/LocationInput";
import { MapView } from "./components/MapView";
import { ReportView } from "./components/ReportView";
import { RoutePicker } from "./components/RoutePicker";
import { SaveRouteModal } from "./components/SaveRouteModal";
import { SavedRoutesList } from "./components/SavedRoutesList";
import { SavedRouteDetail } from "./components/SavedRouteDetail";
import { useDriveMode } from "./hooks/useDriveMode";
import { useSavedRoutes } from "./hooks/useSavedRoutes";
import { useDiscoverRoads } from "./hooks/useDiscoverRoads";
import { DiscoverPanel } from "./components/DiscoverPanel";
import { btnBase, btnPrimary, btnSecondary } from "./utils/tw";

export function App() {
  const [panelTab, setPanelTab] = useState<"plan" | "routes" | "discover">("plan");

  // Route planning state
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [fromPlace, setFromPlace] = useState<GeocodedPlace | null>(null);
  const [toPlace, setToPlace] = useState<GeocodedPlace | null>(null);
  const [candidates, setCandidates] = useState<RouteCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"condition" | "enthusiast">("condition");

  // Save modal state
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Saved routes state
  const savedRoutes = useSavedRoutes();
  const [activeRoute, setActiveRoute] = useState<SavedRouteDetailType | null>(null);

  const { isDriving, start: startDrive, stop: stopDrive } = useDriveMode();
  const discoverRoads = useDiscoverRoads();

  const canAnalyze = fromPlace !== null && toPlace !== null && !loading;

  const selected = useMemo(
    () => candidates.find((c) => c.id === selectedId) ?? null,
    [candidates, selectedId]
  );

  // Auto-select recommended when switching to enthusiast mode
  useEffect(() => {
    if (viewMode === "enthusiast" && recommended && candidates.length > 1) {
      setSelectedId(recommended);
    }
  }, [viewMode]);

  async function handleAnalyze(waypoints?: { lat: number; lng: number }[]) {
    if (!fromPlace || !toPlace) return;

    setLoading(true);
    setError(null);
    setCandidates([]);
    setSelectedId(null);
    setRecommended(null);

    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startLat: fromPlace.coordinate.lat,
          startLng: fromPlace.coordinate.lng,
          endLat: toPlace.coordinate.lat,
          endLng: toPlace.coordinate.lng,
          origin: fromPlace.name,
          destination: toPlace.name,
          waypoints,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();

      if (data.candidates && data.candidates.length > 0) {
        setCandidates(data.candidates);
        setSelectedId(data.candidates[0].id);
        setRecommended(data.recommended ?? null);
      } else {
        setCandidates([{
          id: "fastest-route",
          label: "Fastest Route",
          route: data.route,
          report: data.report,
        }]);
        setSelectedId("fastest-route");
      }
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadSavedRoute(id: string) {
    const detail = await savedRoutes.getRoute(id);
    if (!detail) return;
    setActiveRoute(detail);
    // Clear any analyzed route — the map will show the saved geometry
    setCandidates([]);
    setSelectedId(null);
    setRecommended(null);
    setError(null);
  }

  function handleAnalyzeSavedRoute() {
    if (!activeRoute) return;
    // Set up the form with saved route coords and trigger analysis
    const origin: GeocodedPlace = {
      name: activeRoute.originName,
      coordinate: { lat: activeRoute.originLat, lng: activeRoute.originLng },
    };
    const dest: GeocodedPlace = {
      name: activeRoute.destName,
      coordinate: { lat: activeRoute.destLat, lng: activeRoute.destLng },
    };
    setFromText(activeRoute.originName.split(",")[0]!);
    setToText(activeRoute.destName.split(",")[0]!);
    setFromPlace(origin);
    setToPlace(dest);
    setPanelTab("plan");

    // Build waypoints from stops with type "waypoint"
    const waypoints = activeRoute.stops
      .filter((s) => s.stopType === "waypoint")
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ lat: s.lat, lng: s.lng }));

    // Delay so state updates propagate, then analyze
    setTimeout(() => {
      handleAnalyzeWithCoords(origin, dest, waypoints.length > 0 ? waypoints : undefined);
    }, 0);
  }

  async function handleAnalyzeWithCoords(
    from: GeocodedPlace,
    to: GeocodedPlace,
    waypoints?: { lat: number; lng: number }[]
  ) {
    setLoading(true);
    setError(null);
    setCandidates([]);
    setSelectedId(null);
    setRecommended(null);

    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startLat: from.coordinate.lat,
          startLng: from.coordinate.lng,
          endLat: to.coordinate.lat,
          endLng: to.coordinate.lng,
          origin: from.name,
          destination: to.name,
          waypoints,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();

      if (data.candidates && data.candidates.length > 0) {
        setCandidates(data.candidates);
        setSelectedId(data.candidates[0].id);
        setRecommended(data.recommended ?? null);
      } else {
        setCandidates([{
          id: "fastest-route",
          label: "Fastest Route",
          route: data.route,
          report: data.report,
        }]);
        setSelectedId("fastest-route");
      }
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStop(stop: { stopType: StopType; name: string; note?: string; lat: number; lng: number }) {
    if (!activeRoute) return;
    await savedRoutes.addStop(activeRoute.id, stop);
    // Reload the route to get updated stops
    const updated = await savedRoutes.getRoute(activeRoute.id);
    if (updated) setActiveRoute(updated);
  }

  async function handleRemoveStop(stopId: string) {
    if (!activeRoute) return;
    await savedRoutes.removeStop(activeRoute.id, stopId);
    const updated = await savedRoutes.getRoute(activeRoute.id);
    if (updated) setActiveRoute(updated);
  }

  async function handleDeleteRoute() {
    if (!activeRoute) return;
    await savedRoutes.deleteRoute(activeRoute.id);
    setActiveRoute(null);
    savedRoutes.fetchRoutes();
  }

  function handleSaveComplete(id: string) {
    setShowSaveModal(false);
    savedRoutes.fetchRoutes();
  }

  const route = selected?.route ?? null;
  const report = selected?.report ?? null;

  return (
    <div className="grid grid-cols-[1fr_400px] h-full overflow-hidden max-panel:grid-cols-[1fr] max-panel:grid-rows-[1fr_auto]">
      <MapView
        route={route}
        report={report}
        candidates={candidates}
        selectedId={selectedId}
        onSelectCandidate={setSelectedId}
        isDriving={isDriving}
        viewMode={viewMode}
        stops={activeRoute?.stops}
        savedRouteGeometry={activeRoute?.geometry}
        discoveredRoads={discoverRoads.result?.roads}
        selectedDiscoveredRoad={discoverRoads.selectedRoad}
        onSelectDiscoveredRoad={discoverRoads.selectRoad}
      />

      <aside className="flex flex-col bg-slate-800 border-l border-slate-700 overflow-y-auto overflow-x-hidden scrollbar-thin max-panel:border-l-0 max-panel:border-t max-panel:border-slate-700 max-panel:max-h-[50vh]">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-lg font-bold tracking-tight text-slate-100 mb-1">CurveSeek</h1>
          <p className="text-[13px] text-slate-400">Plan, save, and share Canadian road routes</p>
        </div>

        <div className="flex border-b border-slate-700">
          {(["plan", "routes", "discover"] as const).map((tab) => (
            <button
              key={tab}
              className={clsx(
                "flex-1 px-4 py-3 bg-transparent border-none border-b-2 font-sans text-[13px] font-semibold cursor-pointer transition-colors duration-150",
                panelTab === tab
                  ? "text-blue-500 border-b-blue-500"
                  : "text-slate-500 border-b-transparent hover:text-slate-400"
              )}
              onClick={() => {
                setPanelTab(tab);
                if (tab === "routes") savedRoutes.fetchRoutes();
              }}
            >
              {tab === "plan" ? "Plan" : tab === "routes" ? "Routes" : "Discover"}
            </button>
          ))}
        </div>

        {panelTab === "plan" && (
          <>
            <form
              className="p-6 flex flex-col gap-3 border-b border-slate-700"
              onSubmit={(e) => {
                e.preventDefault();
                handleAnalyze();
              }}
            >
              <LocationInput
                label="From"
                placeholder="e.g. Toronto, ON"
                value={fromText}
                onValueChange={(t) => {
                  setFromText(t);
                  setFromPlace(null);
                }}
                onSelect={setFromPlace}
              />
              <LocationInput
                label="To"
                placeholder="e.g. Ottawa, ON"
                value={toText}
                onValueChange={(t) => {
                  setToText(t);
                  setToPlace(null);
                }}
                onSelect={setToPlace}
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className={`${btnPrimary} flex-1`}
                  disabled={!canAnalyze}
                >
                  {loading ? "Analyzing..." : "Analyze Route"}
                </button>
                <button
                  type="button"
                  className={clsx(
                    btnBase,
                    "flex-1",
                    isDriving
                      ? "bg-red-500 text-white"
                      : "bg-slate-700 text-slate-100 hover:bg-slate-600"
                  )}
                  onClick={() => (isDriving ? stopDrive() : startDrive())}
                >
                  {isDriving ? "Stop Drive" : "Drive Mode"}
                </button>
              </div>
            </form>

            {report && route && (
              <div className="flex px-6 py-3 border-b border-slate-700">
                {(["condition", "enthusiast"] as const).map((mode, i) => (
                  <button
                    key={mode}
                    className={clsx(
                      "flex-1 px-4 py-2 bg-slate-900 border border-slate-700 font-sans text-xs font-semibold tracking-wide cursor-pointer transition-colors duration-150",
                      i === 0 ? "rounded-l-md border-r-0" : "rounded-r-md",
                      viewMode === mode
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "text-slate-500 hover:bg-slate-700 hover:text-slate-400"
                    )}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode === "condition" ? "Condition" : "Driving Fun"}
                  </button>
                ))}
              </div>
            )}

            {candidates.length > 1 && selectedId && recommended && (
              <RoutePicker
                candidates={candidates}
                selectedId={selectedId}
                recommended={recommended}
                viewMode={viewMode}
                onSelect={setSelectedId}
              />
            )}

            {loading && (
              <div className="h-0.5 bg-slate-700 overflow-hidden">
                <div className="h-full w-[30%] bg-blue-500 animate-[loading-slide_1.2s_ease-in-out_infinite]" />
              </div>
            )}

            {error && (
              <div className="mx-6 my-4 px-4 py-3 bg-red-500/15 border border-red-500/30 rounded-md text-red-500 text-[13px]" role="alert">
                {error}
              </div>
            )}

            {report && route ? (
              <>
                <div className="px-6 py-3 border-b border-slate-700">
                  <button
                    className={`${btnSecondary} w-full`}
                    onClick={() => setShowSaveModal(true)}
                  >
                    Save Route
                  </button>
                </div>
                <ReportView report={report} route={route} viewMode={viewMode} />
              </>
            ) : (
              !loading &&
              !error && (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center flex-1">
                  <svg
                    className="w-12 h-12 mb-4 text-slate-500 opacity-50"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  <h2 className="text-[15px] font-semibold text-slate-400 mb-2">Plan a route</h2>
                  <p className="text-[13px] text-slate-500 max-w-[260px]">
                    Enter a starting point and destination to see road condition
                    data along the way.
                  </p>
                </div>
              )
            )}
          </>
        )}

        {panelTab === "routes" && !activeRoute && (
          <SavedRoutesList
            routes={savedRoutes.routes}
            loading={savedRoutes.loading}
            error={savedRoutes.error}
            onSelect={handleLoadSavedRoute}
            onRefresh={savedRoutes.fetchRoutes}
          />
        )}

        {panelTab === "routes" && activeRoute && (
          <SavedRouteDetail
            route={activeRoute}
            onAnalyze={handleAnalyzeSavedRoute}
            onAddStop={handleAddStop}
            onRemoveStop={handleRemoveStop}
            onDelete={handleDeleteRoute}
            onBack={() => { setActiveRoute(null); savedRoutes.fetchRoutes(); }}
          />
        )}

        {panelTab === "discover" && (
          <DiscoverPanel
            result={discoverRoads.result}
            selectedRoad={discoverRoads.selectedRoad}
            loading={discoverRoads.loading}
            error={discoverRoads.error}
            onDiscover={discoverRoads.discover}
            onSelectRoad={discoverRoads.selectRoad}
          />
        )}
      </aside>

      {showSaveModal && route && report && (
        <SaveRouteModal
          route={route}
          report={report}
          onSave={handleSaveComplete}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
