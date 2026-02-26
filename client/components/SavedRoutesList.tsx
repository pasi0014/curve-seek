import React, { useEffect, useState } from "react";
import type { SavedRouteSummary } from "../types";
import { inputClasses } from "../utils/tw";

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
    <div className="flex flex-col flex-1">
      <form className="p-4 px-6 border-b border-slate-700" onSubmit={handleSearch}>
        <input
          type="text"
          className={inputClasses}
          placeholder="Search routes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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

      {!loading && routes.length === 0 && (
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
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h2 className="text-[15px] font-semibold text-slate-400 mb-2">No saved routes</h2>
          <p className="text-[13px] text-slate-500 max-w-[260px]">
            Analyze a route and save it to build your collection.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 p-4 px-6">
        {routes.map((route) => (
          <button
            key={route.id}
            className="block w-full text-left p-4 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer transition-[border-color,background] duration-150 font-sans text-slate-100 hover:border-blue-500 hover:bg-[color-mix(in_srgb,#3b82f6_5%,#0f172a)]"
            onClick={() => onSelect(route.id)}
          >
            <div className="text-sm font-semibold mb-1">{route.name}</div>
            <div className="text-xs text-slate-400 mb-2">
              {route.originName.split(",")[0]} &rarr; {route.destName.split(",")[0]}
            </div>
            <div className="flex gap-3 text-[11px] text-slate-500">
              <span>{(route.distanceM / 1000).toFixed(0)} km</span>
              {route.stopCount > 0 && (
                <span>
                  {route.stopCount} stop{route.stopCount !== 1 ? "s" : ""}
                </span>
              )}
              <span>{new Date(route.createdAt).toLocaleDateString()}</span>
            </div>
            {route.description && (
              <div className="mt-2 text-xs text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
                {route.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
