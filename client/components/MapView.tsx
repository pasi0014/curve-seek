import React, { useEffect, useRef } from "react";
import type { RouteGeometry, RouteReport, RouteCandidate, SavedStop, DiscoveredRoad } from "../types";
import { scoreColor, enthusiastColor } from "../utils/helpers";
import { STOP_TYPE_COLORS, STOP_TYPE_LABELS } from "./SavedRouteDetail";

const STOP_TYPE_ICONS: Record<string, string> = {
  waypoint: "W",
  sightseeing: "S",
  gas: "G",
  grocery: "Gr",
  cafe: "C",
  rest: "R",
  other: "O",
};

declare const L: typeof import("leaflet");

export function MapView({
  route,
  report,
  candidates,
  selectedId,
  onSelectCandidate,
  isDriving,
  viewMode,
  stops,
  savedRouteGeometry,
  discoveredRoads,
  selectedDiscoveredRoad,
  onSelectDiscoveredRoad,
}: {
  route: RouteGeometry | null;
  report: RouteReport | null;
  candidates: RouteCandidate[];
  selectedId: string | null;
  onSelectCandidate: (id: string) => void;
  isDriving: boolean;
  viewMode: "condition" | "enthusiast";
  stops?: SavedStop[];
  savedRouteGeometry?: [number, number][] | null;
  discoveredRoads?: DiscoveredRoad[];
  selectedDiscoveredRoad?: DiscoveredRoad | null;
  onSelectDiscoveredRoad?: (road: DiscoveredRoad) => void;
}) {
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const stopsLayerRef = useRef<L.LayerGroup | null>(null);
  const discoverLayerRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([45.4, -75.7], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    stopsLayerRef.current = L.layerGroup().addTo(map);
    discoverLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw route segments
  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (!route || !report) return;

    // Draw unselected candidate routes first (behind)
    for (const c of candidates) {
      if (c.id === selectedId) continue;
      const coords: L.LatLngExpression[] = c.route.coordinates.map(
        (pt) => [pt.lat, pt.lng] as [number, number]
      );
      const polyline = L.polyline(coords, {
        color: "#475569",
        weight: 3,
        opacity: 0.35,
        dashArray: "8 6",
        interactive: true,
      });
      polyline.on("click", () => onSelectCandidate(c.id));
      polyline.bindTooltip(c.label, { sticky: true, className: "route-tooltip" });
      polyline.addTo(group);
    }

    // Draw selected route segments with scoring colors on top
    for (const seg of report.segments) {
      const coords: L.LatLngExpression[] = seg.segment.coordinates.map(
        (c) => [c.lat, c.lng] as [number, number]
      );
      const color = viewMode === "enthusiast"
        ? enthusiastColor(seg.enthusiastScore)
        : scoreColor(seg.compositeScore);
      L.polyline(coords, {
        color,
        weight: 6,
        opacity: 0.85,
      }).addTo(group);
    }

    // Fit bounds to encompass ALL candidate routes
    let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
    const allCandidates = candidates.length > 0 ? candidates : [{ route }];
    for (const c of allCandidates) {
      const r = "route" in c ? c.route : c.route;
      if (r.bbox) {
        const [bMinLng, bMinLat, bMaxLng, bMaxLat] = r.bbox;
        minLng = Math.min(minLng, bMinLng);
        minLat = Math.min(minLat, bMinLat);
        maxLng = Math.max(maxLng, bMaxLng);
        maxLat = Math.max(maxLat, bMaxLat);
      }
    }

    if (minLat !== Infinity) {
      map.fitBounds(
        [[minLat, minLng], [maxLat, maxLng]],
        { padding: [40, 40] }
      );
    }
  }, [route, report, candidates, selectedId, viewMode]);

  // Draw saved route geometry and stop markers
  useEffect(() => {
    const map = mapRef.current;
    const group = stopsLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // Draw saved route line if no analyzed route is shown
    if (savedRouteGeometry && savedRouteGeometry.length > 0 && !route) {
      const coords: L.LatLngExpression[] = savedRouteGeometry.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );
      L.polyline(coords, {
        color: "#3b82f6",
        weight: 5,
        opacity: 0.7,
      }).addTo(group);

      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    // Draw stop markers
    if (stops && stops.length > 0) {
      for (const stop of stops) {
        const color = STOP_TYPE_COLORS[stop.stopType] ?? "#6b7280";
        const abbr = STOP_TYPE_ICONS[stop.stopType] ?? "?";
        const icon = L.divIcon({
          className: "stop-marker",
          html: `<div style="background:${color};color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.4)">${abbr}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker([stop.lat, stop.lng], { icon })
          .bindTooltip(`${stop.name} (${STOP_TYPE_LABELS[stop.stopType]})`, {
            className: "route-tooltip",
          })
          .addTo(group);
      }
    }
  }, [stops, savedRouteGeometry, route]);

  // Draw discovered roads
  useEffect(() => {
    const map = mapRef.current;
    const group = discoverLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (!discoveredRoads || discoveredRoads.length === 0) return;

    let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;

    for (const road of discoveredRoads) {
      const isSelected = selectedDiscoveredRoad?.id === road.id;
      const coords: L.LatLngExpression[] = road.geometry.map(
        (c) => [c.lat, c.lng] as [number, number]
      );
      const color = enthusiastColor(road.enthusiastScore);
      const polyline = L.polyline(coords, {
        color,
        weight: isSelected ? 7 : 4,
        opacity: isSelected ? 0.95 : 0.65,
        interactive: true,
      });
      polyline.bindTooltip(
        `${road.name} (${road.enthusiastScore})`,
        { sticky: true, className: "route-tooltip" }
      );
      if (onSelectDiscoveredRoad) {
        polyline.on("click", () => onSelectDiscoveredRoad(road));
      }
      polyline.addTo(group);

      // Expand bounds
      for (const c of road.geometry) {
        minLat = Math.min(minLat, c.lat);
        maxLat = Math.max(maxLat, c.lat);
        minLng = Math.min(minLng, c.lng);
        maxLng = Math.max(maxLng, c.lng);
      }
    }

    // If a road is selected, fit to its bbox
    if (selectedDiscoveredRoad) {
      const [bMinLng, bMinLat, bMaxLng, bMaxLat] = selectedDiscoveredRoad.bbox;
      map.fitBounds(
        [[bMinLat, bMinLng], [bMaxLat, bMaxLng]],
        { padding: [60, 60], maxZoom: 14 }
      );
    } else if (minLat !== Infinity) {
      map.fitBounds(
        [[minLat, minLng], [maxLat, maxLng]],
        { padding: [40, 40] }
      );
    }
  }, [discoveredRoads, selectedDiscoveredRoad]);

  return (
    <div className="relative min-h-0">
      {isDriving && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-[13px] font-semibold tracking-wide rounded-lg animate-[pulse-bg_2s_ease-in-out_infinite]"
          aria-live="polite"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-[blink_1s_steps(2)_infinite]" />
          Recording drive
        </div>
      )}
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
