import { useState } from "react";
import type { DiscoverRoadsResult, DiscoveredRoad } from "../types";

export function useDiscoverRoads() {
  const [result, setResult] = useState<DiscoverRoadsResult | null>(null);
  const [selectedRoad, setSelectedRoad] = useState<DiscoveredRoad | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function discover(lat: number, lng: number, radiusKm: number) {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedRoad(null);

    try {
      const res = await fetch(
        `/api/discover?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }

      const data: DiscoverRoadsResult = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function selectRoad(road: DiscoveredRoad | null) {
    setSelectedRoad(road);
  }

  function clear() {
    setResult(null);
    setSelectedRoad(null);
    setError(null);
  }

  return { result, selectedRoad, loading, error, discover, selectRoad, clear };
}
