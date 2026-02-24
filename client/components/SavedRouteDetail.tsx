import React, { useState } from "react";
import type { SavedRouteDetail as SavedRouteDetailType, SavedStop, StopType } from "../types";

const STOP_TYPE_LABELS: Record<StopType, string> = {
  waypoint: "Waypoint",
  sightseeing: "Sightseeing",
  gas: "Gas Station",
  grocery: "Grocery",
  cafe: "Cafe",
  rest: "Rest Stop",
  other: "Other",
};

const STOP_TYPE_COLORS: Record<StopType, string> = {
  waypoint: "#3b82f6",
  sightseeing: "#8b5cf6",
  gas: "#f59e0b",
  grocery: "#22c55e",
  cafe: "#f97316",
  rest: "#06b6d4",
  other: "#6b7280",
};

interface AddStopForm {
  name: string;
  stopType: StopType;
  note: string;
  lat: string;
  lng: string;
}

interface Props {
  route: SavedRouteDetailType;
  onAnalyze: () => void;
  onAddStop: (stop: { stopType: StopType; name: string; note?: string; lat: number; lng: number }) => void;
  onRemoveStop: (stopId: string) => void;
  onDelete: () => void;
  onBack: () => void;
}

export function SavedRouteDetail({ route, onAnalyze, onAddStop, onRemoveStop, onDelete, onBack }: Props) {
  const [showAddStop, setShowAddStop] = useState(false);
  const [form, setForm] = useState<AddStopForm>({
    name: "",
    stopType: "sightseeing",
    note: "",
    lat: "",
    lng: "",
  });

  function handleAddStop(e: React.FormEvent) {
    e.preventDefault();
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (!form.name.trim() || isNaN(lat) || isNaN(lng)) return;

    onAddStop({
      stopType: form.stopType,
      name: form.name.trim(),
      note: form.note.trim() || undefined,
      lat,
      lng,
    });
    setForm({ name: "", stopType: "sightseeing", note: "", lat: "", lng: "" });
    setShowAddStop(false);
  }

  return (
    <div className="saved-route-detail">
      <div className="saved-route-detail-header">
        <button className="btn-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Routes
        </button>
        <h2>{route.name}</h2>
        <div className="saved-route-detail-path">
          {route.originName.split(",")[0]} &rarr; {route.destName.split(",")[0]}
        </div>
        <div className="saved-route-detail-stats">
          <span>{(route.distanceM / 1000).toFixed(1)} km</span>
          <span>{Math.round(route.durationS / 60)} min</span>
        </div>
        {route.description && (
          <p className="saved-route-detail-desc">{route.description}</p>
        )}
      </div>

      <div className="saved-route-detail-actions">
        <button className="btn btn-primary" onClick={onAnalyze}>
          Analyze Route
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowAddStop(!showAddStop)}
        >
          {showAddStop ? "Cancel" : "Add Stop"}
        </button>
        <button className="btn btn-danger" onClick={onDelete}>
          Delete
        </button>
      </div>

      {showAddStop && (
        <form className="add-stop-form" onSubmit={handleAddStop}>
          <div className="modal-field">
            <label>Stop Type</label>
            <select
              value={form.stopType}
              onChange={(e) => setForm({ ...form, stopType: e.target.value as StopType })}
            >
              {Object.entries(STOP_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="modal-field">
            <label>Name</label>
            <input
              type="text"
              placeholder="e.g. Tim Hortons on Hwy 7"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="add-stop-coords">
            <div className="modal-field">
              <label>Latitude</label>
              <input
                type="text"
                placeholder="43.65"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
              />
            </div>
            <div className="modal-field">
              <label>Longitude</label>
              <input
                type="text"
                placeholder="-79.38"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-field">
            <label>Note (optional)</label>
            <input
              type="text"
              placeholder="Best coffee in town"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={!form.name.trim() || !form.lat || !form.lng}>
            Add Stop
          </button>
        </form>
      )}

      {route.stops.length > 0 && (
        <div className="stops-section">
          <h3 className="stops-section-title">
            Stops ({route.stops.length})
          </h3>
          <div className="stops-list">
            {route.stops.map((stop) => (
              <div key={stop.id} className="stop-card">
                <div
                  className="stop-card-indicator"
                  style={{ background: STOP_TYPE_COLORS[stop.stopType] }}
                />
                <div className="stop-card-info">
                  <div className="stop-card-name">{stop.name}</div>
                  <div className="stop-card-type">
                    {STOP_TYPE_LABELS[stop.stopType]}
                  </div>
                  {stop.note && (
                    <div className="stop-card-note">{stop.note}</div>
                  )}
                </div>
                <button
                  className="stop-card-remove"
                  onClick={() => onRemoveStop(stop.id)}
                  title="Remove stop"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { STOP_TYPE_COLORS, STOP_TYPE_LABELS };
