import React, { useState } from "react";
import type { RouteGeometry, RouteReport } from "../types";

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Save Route</h2>
        <p className="modal-subtitle">
          {report.origin} to {report.destination} &middot;{" "}
          {report.totalDistanceKm.toFixed(1)} km
        </p>

        <div className="modal-field">
          <label>Route Name</label>
          <input
            type="text"
            placeholder="e.g. Weekend Twisties"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="modal-field">
          <label>Description (optional)</label>
          <textarea
            placeholder="Notes about this route..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
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
