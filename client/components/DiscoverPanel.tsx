import React, { useState } from "react";
import type { DiscoverRoadsResult, DiscoveredRoad, GeocodedPlace } from "../types";
import { LocationInput } from "./LocationInput";
import { enthusiastColor, enthusiastRating, formatDistance } from "../utils/helpers";

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
      <form className="discover-form" onSubmit={handleSubmit}>
        <div className="discover-location-row">
          <div className="discover-location-input">
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
            className="btn btn-gps"
            onClick={handleGPS}
            disabled={gpsLoading}
            title="Use current location"
          >
            {gpsLoading ? "..." : "GPS"}
          </button>
        </div>

        <div className="discover-radius">
          <label>
            Radius: <strong>{radiusKm} km</strong>
          </label>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!place || loading}
        >
          {loading ? "Searching..." : "Find Fun Roads"}
        </button>
      </form>

      {loading && (
        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>
      )}

      {error && <div className="error-banner" role="alert">{error}</div>}

      {result && !loading && (
        <div className="discover-results">
          <div className="discover-summary">
            {result.roads.length === 0
              ? `Scanned ${result.totalWaysScanned} ways — no fun roads found. Try a larger radius.`
              : `Found ${result.roads.length} fun road${result.roads.length !== 1 ? "s" : ""} from ${result.totalWaysScanned} ways scanned`}
          </div>

          <div className="discover-road-list">
            {result.roads.map((road, i) => {
              const isSelected = selectedRoad?.id === road.id;
              const r = rating(road.enthusiastScore);
              return (
                <button
                  key={road.id}
                  className={`discover-road-card${isSelected ? " selected" : ""}`}
                  onClick={() => onSelectRoad(isSelected ? null : road)}
                >
                  <div className="discover-road-rank">#{i + 1}</div>
                  <div className="discover-road-score-ring">
                    <svg viewBox="0 0 36 36">
                      <circle
                        className="score-ring-bg"
                        cx="18" cy="18" r="15"
                      />
                      <circle
                        className="score-ring-fill"
                        cx="18" cy="18" r="15"
                        style={{
                          stroke: enthusiastColor(road.enthusiastScore),
                          strokeDasharray: `${(road.enthusiastScore / 100) * 94.25} 94.25`,
                        }}
                      />
                    </svg>
                    <span className="discover-road-score-value">
                      {road.enthusiastScore}
                    </span>
                  </div>
                  <div className="discover-road-info">
                    <div className="discover-road-name">{road.name}</div>
                    <div className="discover-road-meta">
                      <span>{HW_LABELS[road.highwayType] ?? road.highwayType}</span>
                      <span>{formatDistance(road.lengthMeters / 1000)}</span>
                      <span>{road.curvaturePerKm} deg/km</span>
                    </div>
                    <div className="discover-road-tags">
                      <span
                        className="enthusiast-badge quality-badge"
                        data-enthusiast={r}
                      >
                        {r}
                      </span>
                      {road.surface && (
                        <span className="discover-road-tag">{road.surface}</span>
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
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <h2>Discover fun roads</h2>
          <p>
            Enter a location or use GPS to find the best driving roads nearby,
            scored for curvature, surface, and road character.
          </p>
        </div>
      )}
    </>
  );
}
