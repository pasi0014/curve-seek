import React, { useState } from "react";
import type { RouteGeometry, RouteReport } from "../types";
import { inputClasses, labelClasses, btnPrimary, btnSecondary } from "../utils/tw";

interface Props {
  route: RouteGeometry;
  report: RouteReport;
  onSave: (id: string) => void;
  onClose: () => void;
}

export function SaveRouteModal({ route, report, onSave, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const geometry: [number, number][] = route.coordinates.map((c) => [c.lng, c.lat]);
      const res = await fetch("/api/saved-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          originName: report.origin,
          destName: report.destination,
          originLat: route.coordinates[0]!.lat,
          originLng: route.coordinates[0]!.lng,
          destLat: route.coordinates[route.coordinates.length - 1]!.lat,
          destLng: route.coordinates[route.coordinates.length - 1]!.lng,
          geometry,
          distanceM: route.distanceMeters,
          durationS: route.durationSeconds,
        }),
      });

      if (!res.ok) throw new Error("Failed to save route");
      const data = await res.json();
      onSave(data.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/60 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-[400px] shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold mb-1">Save Route</h2>
        <p className="text-xs text-slate-500 mb-5">
          {report.origin} to {report.destination} &middot;{" "}
          {report.totalDistanceKm.toFixed(1)} km
        </p>

        <div className="mb-3">
          <label className={labelClasses}>Route Name</label>
          <input
            type="text"
            className={inputClasses}
            placeholder="e.g. Weekend Twisties"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="mb-3">
          <label className={labelClasses}>Description (optional)</label>
          <textarea
            className={`${inputClasses} resize-y`}
            placeholder="Notes about this route..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {error && (
          <div className="mb-3 px-3 py-2 bg-red-500/15 rounded-md text-red-500 text-[13px]">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button className={`${btnSecondary} flex-1`} onClick={onClose}>
            Cancel
          </button>
          <button
            className={`${btnPrimary} flex-1`}
            disabled={!name.trim() || saving}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save Route"}
          </button>
        </div>
      </div>
    </div>
  );
}
