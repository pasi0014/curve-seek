import { useState, useCallback } from "react";
import type { SavedRouteSummary, SavedRouteDetail, StopType } from "../types";

interface ListResponse {
  routes: SavedRouteSummary[];
  total: number;
}

export function useSavedRoutes() {
  const [routes, setRoutes] = useState<SavedRouteSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("q", search);
      const res = await fetch(`/api/saved-routes?${params}`);
      if (!res.ok) throw new Error("Failed to load routes");
      const data: ListResponse = await res.json();
      setRoutes(data.routes);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRoute = useCallback(async (id: string): Promise<SavedRouteDetail | null> => {
    const res = await fetch(`/api/saved-routes/${id}`);
    if (!res.ok) return null;
    return res.json();
  }, []);

  const createRoute = useCallback(async (payload: {
    name: string;
    description?: string;
    originName: string;
    destName: string;
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    geometry: [number, number][];
    distanceM: number;
    durationS: number;
  }): Promise<string> => {
    const res = await fetch("/api/saved-routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to save route");
    const data = await res.json();
    return data.id;
  }, []);

  const deleteRoute = useCallback(async (id: string) => {
    const res = await fetch(`/api/saved-routes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete route");
  }, []);

  const addStop = useCallback(async (routeId: string, stop: {
    stopType: StopType;
    name: string;
    note?: string;
    lat: number;
    lng: number;
    position?: number;
  }): Promise<{ id: string; position: number }> => {
    const res = await fetch(`/api/saved-routes/${routeId}/stops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stop),
    });
    if (!res.ok) throw new Error("Failed to add stop");
    return res.json();
  }, []);

  const removeStop = useCallback(async (routeId: string, stopId: string) => {
    const res = await fetch(`/api/saved-routes/${routeId}/stops/${stopId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to remove stop");
  }, []);

  return {
    routes,
    total,
    loading,
    error,
    fetchRoutes,
    getRoute,
    createRoute,
    deleteRoute,
    addStop,
    removeStop,
  };
}
