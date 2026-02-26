import React, { useState } from "react";
import type { SavedRouteDetail as SavedRouteDetailType, SavedStop, StopType } from "../types";
import { inputClasses, labelClasses, btnPrimary, btnSecondary, btnDanger } from "../utils/tw";

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
    <div className="flex flex-col gap-4 px-6 py-4">
      <div className="flex flex-col gap-1">
        <button
          className="inline-flex items-center gap-1 bg-transparent border-none text-blue-500 font-sans text-xs font-semibold cursor-pointer p-0 mb-2 hover:text-blue-600"
          onClick={onBack}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Routes
        </button>
        <h2 className="text-base font-bold">{route.name}</h2>
        <div className="text-[13px] text-slate-400">
          {route.originName.split(",")[0]} &rarr; {route.destName.split(",")[0]}
        </div>
        <div className="flex gap-3 text-xs text-slate-500">
          <span>{(route.distanceM / 1000).toFixed(1)} km</span>
          <span>{Math.round(route.durationS / 60)} min</span>
        </div>
        {route.description && (
          <p className="text-[13px] text-slate-500 mt-2">{route.description}</p>
        )}
      </div>

      <div className="flex gap-2">
        <button className={`${btnPrimary} flex-1 text-xs px-3 py-2`} onClick={onAnalyze}>
          Analyze Route
        </button>
        <button
          className={`${btnSecondary} flex-1 text-xs px-3 py-2`}
          onClick={() => setShowAddStop(!showAddStop)}
        >
          {showAddStop ? "Cancel" : "Add Stop"}
        </button>
        <button className={`${btnDanger} flex-1 text-xs px-3 py-2`} onClick={onDelete}>
          Delete
        </button>
      </div>

      {showAddStop && (
        <form className="p-4 bg-slate-900 border border-slate-700 rounded-lg" onSubmit={handleAddStop}>
          <div className="mb-3">
            <label className={labelClasses}>Stop Type</label>
            <select
              className={inputClasses}
              value={form.stopType}
              onChange={(e) => setForm({ ...form, stopType: e.target.value as StopType })}
            >
              {Object.entries(STOP_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className={labelClasses}>Name</label>
            <input
              type="text"
              className={inputClasses}
              placeholder="e.g. Tim Hortons on Hwy 7"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="mb-3">
              <label className={labelClasses}>Latitude</label>
              <input
                type="text"
                className={inputClasses}
                placeholder="43.65"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className={labelClasses}>Longitude</label>
              <input
                type="text"
                className={inputClasses}
                placeholder="-79.38"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className={labelClasses}>Note (optional)</label>
            <input
              type="text"
              className={inputClasses}
              placeholder="Best coffee in town"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <button className={btnPrimary} type="submit" disabled={!form.name.trim() || !form.lat || !form.lng}>
            Add Stop
          </button>
        </form>
      )}

      {route.stops.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Stops ({route.stops.length})
          </h3>
          <div className="flex flex-col gap-2">
            {route.stops.map((stop) => (
              <div key={stop.id} className="flex items-center gap-3 px-4 py-3 bg-slate-900 rounded-md">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: STOP_TYPE_COLORS[stop.stopType] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium">{stop.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {STOP_TYPE_LABELS[stop.stopType]}
                  </div>
                  {stop.note && (
                    <div className="text-[11px] text-slate-500 italic">{stop.note}</div>
                  )}
                </div>
                <button
                  className="bg-transparent border-none text-slate-500 cursor-pointer p-1 rounded-md transition-colors duration-150 shrink-0 hover:text-red-500 hover:bg-red-500/10"
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
