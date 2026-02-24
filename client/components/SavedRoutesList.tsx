import React, { useEffect, useState } from "react";
import type { SavedRouteSummary } from "../types";

interface Props {
  routes: SavedRouteSummary[];
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onRefresh: (search?: string) => void;
}

export function SavedRoutesList({ routes, loading, error, onSelect, onRefresh }: Props) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    onRefresh();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    onRefresh(search.trim() || undefined);
  }

  return (
    <div className="saved-routes-list">
      <form className="saved-routes-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search routes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      {loading && (
        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {!loading && routes.length === 0 && (
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
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h2>No saved routes</h2>
          <p>Analyze a route and save it to build your collection.</p>
        </div>
      )}

      <div className="saved-routes-cards">
        {routes.map((route) => (
          <button
            key={route.id}
            className="saved-route-card"
            onClick={() => onSelect(route.id)}
          >
            <div className="saved-route-card-name">{route.name}</div>
            <div className="saved-route-card-path">
              {route.originName.split(",")[0]} &rarr; {route.destName.split(",")[0]}
            </div>
            <div className="saved-route-card-meta">
              <span>{(route.distanceM / 1000).toFixed(0)} km</span>
              {route.stopCount > 0 && (
                <span>
                  {route.stopCount} stop{route.stopCount !== 1 ? "s" : ""}
                </span>
              )}
              <span>{new Date(route.createdAt).toLocaleDateString()}</span>
            </div>
            {route.description && (
              <div className="saved-route-card-desc">{route.description}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
