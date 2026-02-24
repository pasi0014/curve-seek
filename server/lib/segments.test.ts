import { test, expect, describe } from "bun:test";
import { splitIntoSegments, haversineDistance, segmentMidpoint } from "./segments.ts";
import type { Coordinate } from "./types.ts";

describe("haversineDistance", () => {
  test("returns 0 for same point", () => {
    const p: Coordinate = { lat: 43.65, lng: -79.38 };
    expect(haversineDistance(p, p)).toBe(0);
  });

  test("calculates ~500km Toronto to Montreal", () => {
    const toronto: Coordinate = { lat: 43.6532, lng: -79.3832 };
    const montreal: Coordinate = { lat: 45.5017, lng: -73.5673 };
    const dist = haversineDistance(toronto, montreal);
    // Should be roughly 504 km
    expect(dist).toBeGreaterThan(490_000);
    expect(dist).toBeLessThan(520_000);
  });
});

describe("splitIntoSegments", () => {
  test("returns empty for fewer than 2 points", () => {
    expect(splitIntoSegments([])).toEqual([]);
    expect(splitIntoSegments([{ lat: 0, lng: 0 }])).toEqual([]);
  });

  test("splits a straight line into segments", () => {
    // Create a roughly 2km north-south line
    const coords: Coordinate[] = [
      { lat: 43.65, lng: -79.38 },
      { lat: 43.66, lng: -79.38 },
      { lat: 43.67, lng: -79.38 },
      { lat: 43.68, lng: -79.38 },
    ];
    const segments = splitIntoSegments(coords, 500);

    expect(segments.length).toBeGreaterThanOrEqual(2);

    // Each segment should have at least 2 coordinates
    for (const seg of segments) {
      expect(seg.coordinates.length).toBeGreaterThanOrEqual(2);
      expect(seg.index).toBeGreaterThanOrEqual(0);
    }

    // Indices should be sequential
    for (let i = 0; i < segments.length; i++) {
      expect(segments[i]!.index).toBe(i);
    }
  });

  test("handles short route (< target length)", () => {
    const coords: Coordinate[] = [
      { lat: 43.65, lng: -79.38 },
      { lat: 43.6502, lng: -79.38 }, // ~22m apart
    ];
    const segments = splitIntoSegments(coords, 500);
    expect(segments.length).toBe(1);
    expect(segments[0]!.lengthMeters).toBeLessThan(500);
  });
});

describe("segmentMidpoint", () => {
  test("returns middle coordinate", () => {
    const segment = {
      index: 0,
      start: { lat: 0, lng: 0 },
      end: { lat: 2, lng: 2 },
      coordinates: [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 },
        { lat: 2, lng: 2 },
      ],
      lengthMeters: 100,
    };
    const mid = segmentMidpoint(segment);
    expect(mid.lat).toBe(1);
    expect(mid.lng).toBe(1);
  });
});
