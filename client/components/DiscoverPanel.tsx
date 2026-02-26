import React, { useState } from "react";
import clsx from "clsx";
import type { DiscoverRoadsResult, DiscoveredRoad, GeocodedPlace } from "../types";
import { LocationInput } from "./LocationInput";
import { enthusiastColor, enthusiastRating, formatDistance } from "../utils/helpers";
import { btnPrimary, labelClasses, enthusiastBadgeColors } from "../utils/tw";

interface DiscoverPanelProps {
  result: DiscoverRoadsResult | null;
  selectedRoad: DiscoveredRoad | null;
  loading: boolean;
  error: string | null;
  onDiscover: (lat: number, lng: number, radiusKm: number) => void;
  onSelectRoad: (road: DiscoveredRoad | null) => void;
}

const HW_LABELS: Record<string, string> = {
  tertiary: "Tertiary",
  tertiary_link: "Tertiary Link",
  secondary: "Secondary",
  secondary_link: "Secondary Link",
  primary: "Primary",
  primary_link: "Primary Link",
  unclassified: "Unclassified",
};

const badgeBase = "inline-block px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide";

export function DiscoverPanel({
  result,
  selectedRoad,
  loading,
  error,
  onDiscover,
  onSelectRoad,
}: DiscoverPanelProps) {
  const [locationText, setLocationText] = useState("");
  const [place, setPlace] = useState<GeocodedPlace | null>(null);
  const [radiusKm, setRadiusKm] = useState(50);
  const [gpsLoading, setGpsLoading] = useState(false);

  function handleGPS() {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coord = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPlace({ name: `${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`, coordinate: coord });
        setLocationText(`${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`);
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!place) return;
    onDiscover(place.coordinate.lat, place.coordinate.lng, radiusKm);
  }

  const rating = (score: number) => enthusiastRating(score);

  return (
    <>
      <form className="p-6 flex flex-col gap-3 border-b border-slate-700" onSubmit={handleSubmit}>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <LocationInput
              label="Location"
              placeholder="e.g. Ottawa, ON"
              value={locationText}
              onValueChange={(t) => {
                setLocationText(t);
                setPlace(null);
              }}
              onSelect={setPlace}
            />
          </div>
          <button
            type="button"
            className="bg-slate-700 text-slate-100 px-3 py-3 text-xs font-bold tracking-wide border border-slate-700 rounded-md cursor-pointer transition-colors duration-150 whitespace-nowrap h-10 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGPS}
            disabled={gpsLoading}
            title="Use current location"
          >
            {gpsLoading ? "..." : "GPS"}
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClasses}>
            Radius: <strong>{radiusKm} km</strong>
          </label>
          <input
            type="range"
            className="w-full accent-blue-500"
            min={10}
            max={100}
            step={5}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          />
        </div>

        <button
          type="submit"
          className={btnPrimary}
          disabled={!place || loading}
        >
          {loading ? "Searching..." : "Find Fun Roads"}
        </button>
      </form>

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

      {result && !loading && (
        <div className="flex flex-col flex-1">
          <div className="px-6 py-3 text-xs text-slate-500 border-b border-slate-700">
            {result.roads.length === 0
              ? `Scanned ${result.totalWaysScanned} ways — no curvy roads found in this area. Try a larger radius or a more rural/hilly location.`
              : `Found ${result.roads.length} curvy road${result.roads.length !== 1 ? "s" : ""} from ${result.totalWaysScanned} ways scanned`}
          </div>

          <div className="flex flex-col gap-2 p-4 px-6">
            {result.roads.map((road, i) => {
              const isSelected = selectedRoad?.id === road.id;
              const r = rating(road.enthusiastScore);
              return (
                <button
                  key={road.id}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 bg-slate-900 border rounded-lg cursor-pointer transition-[border-color,background] duration-150 text-left font-sans text-slate-100 w-full",
                    isSelected
                      ? "border-blue-500 bg-[color-mix(in_srgb,#3b82f6_10%,#0f172a)]"
                      : "border-slate-700 hover:border-blue-500 hover:bg-[color-mix(in_srgb,#3b82f6_5%,#0f172a)]"
                  )}
                  onClick={() => onSelectRoad(isSelected ? null : road)}
                >
                  <div className="text-[11px] font-bold text-slate-500 min-w-[24px] text-center">#{i + 1}</div>
                  <div className="relative shrink-0" style={{ width: 40, height: 40 }}>
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle className="score-ring-bg" cx="18" cy="18" r="15" />
                      <circle
                        className="score-ring-fill"
                        cx="18" cy="18" r="15"
                        style={{
                          stroke: enthusiastColor(road.enthusiastScore),
                          strokeDasharray: `${(road.enthusiastScore / 100) * 94.25} 94.25`,
                        }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold tabular-nums">
                      {road.enthusiastScore}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{road.name}</div>
                    <div className="flex gap-3 text-[11px] text-slate-500 mt-0.5">
                      <span>{HW_LABELS[road.highwayType] ?? road.highwayType}</span>
                      <span>{formatDistance(road.lengthMeters / 1000)}</span>
                      <span>{road.curvaturePerKm} deg/km</span>
                    </div>
                    <div className="flex gap-2 mt-1 items-center">
                      <span className={`${badgeBase} ${enthusiastBadgeColors[r] ?? ""}`}>
                        {r}
                      </span>
                      {road.surface && (
                        <span className="text-[10px] px-2 py-px bg-slate-700 rounded-[3px] text-slate-400">
                          {road.surface}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!result && !loading && !error && (
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
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <h2 className="text-[15px] font-semibold text-slate-400 mb-2">Discover fun roads</h2>
          <p className="text-[13px] text-slate-500 max-w-[260px]">
            Enter a location or use GPS to find the best driving roads nearby,
            scored for curvature, surface, and road character.
          </p>
        </div>
      )}
    </>
  );
}
