import React, { useState, useMemo, useEffect } from "react";
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
    <div className="app-layout">
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

      <aside className="panel">
        <div className="panel-header">
          <h1>CurveSeek</h1>
          <p>Plan, save, and share Canadian road routes</p>
        </div>

        <div className="panel-tabs">
          <button
            className={`panel-tab${panelTab === "plan" ? " active" : ""}`}
            onClick={() => setPanelTab("plan")}
          >
            Plan
          </button>
          <button
            className={`panel-tab${panelTab === "routes" ? " active" : ""}`}
            onClick={() => { setPanelTab("routes"); savedRoutes.fetchRoutes(); }}
          >
            Routes
          </button>
          <button
            className={`panel-tab${panelTab === "discover" ? " active" : ""}`}
            onClick={() => setPanelTab("discover")}
          >
            Discover
          </button>
        </div>

        {panelTab === "plan" && (
          <>
            <form
              className="route-form"
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
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!canAnalyze}
                >
                  {loading ? "Analyzing..." : "Analyze Route"}
                </button>
                <button
                  type="button"
                  className="btn btn-drive"
                  data-active={isDriving ? "true" : undefined}
                  onClick={() => (isDriving ? stopDrive() : startDrive())}
                >
                  {isDriving ? "Stop Drive" : "Drive Mode"}
                </button>
              </div>
            </form>

            {report && route && (
              <div className="view-toggle">
                <button
                  className={`toggle-btn${viewMode === "condition" ? " active" : ""}`}
                  onClick={() => setViewMode("condition")}
                >
                  Condition
                </button>
                <button
                  className={`toggle-btn${viewMode === "enthusiast" ? " active" : ""}`}
                  onClick={() => setViewMode("enthusiast")}
                >
                  Driving Fun
                </button>
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
              <div className="loading-bar">
                <div className="loading-bar-fill" />
              </div>
            )}

            {error && <div className="error-banner" role="alert">{error}</div>}

            {report && route ? (
              <>
                <div className="save-route-bar">
                  <button
                    className="btn btn-secondary"
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
                <div className="empty-state">
                  <svg
                    className="empty-state-icon"
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
                  <h2>Plan a route</h2>
                  <p>
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
