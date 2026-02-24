import { test, expect, describe } from "bun:test";
import {
  bearing,
  bearingDelta,
  analyzeCurvature,
  scoreCurvature,
  scoreElevation,
  scoreRoadCharacter,
  computeEnthusiastScore,
  analyzeEnthusiastSegments,
} from "./enthusiast.ts";
import type { Coordinate, RouteSegment } from "./types.ts";

describe("bearing", () => {
  test("north bearing is ~0", () => {
    const b = bearing({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(b).toBeCloseTo(0, 0);
  });

  test("east bearing is ~90", () => {
    const b = bearing({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    expect(b).toBeCloseTo(90, 0);
  });

  test("south bearing is ~180", () => {
    const b = bearing({ lat: 1, lng: 0 }, { lat: 0, lng: 0 });
    expect(b).toBeCloseTo(180, 0);
  });

  test("west bearing is ~270", () => {
    const b = bearing({ lat: 0, lng: 1 }, { lat: 0, lng: 0 });
    expect(b).toBeCloseTo(270, 0);
  });
});

describe("bearingDelta", () => {
  test("same bearing = 0", () => {
    expect(bearingDelta(90, 90)).toBe(0);
  });

  test("90 degree turn", () => {
    expect(bearingDelta(0, 90)).toBe(90);
  });

  test("wraps around 360", () => {
    expect(bearingDelta(350, 10)).toBe(20);
  });

  test("opposite directions = 180", () => {
    expect(bearingDelta(0, 180)).toBe(180);
  });
});

describe("analyzeCurvature", () => {
  test("straight road has low curvature", () => {
    const coords: Coordinate[] = [
      { lat: 0, lng: 0 },
      { lat: 0.001, lng: 0 },
      { lat: 0.002, lng: 0 },
      { lat: 0.003, lng: 0 },
      { lat: 0.004, lng: 0 },
    ];
    const result = analyzeCurvature(coords, 500);
    expect(result.curvaturePerKm).toBeLessThan(5);
    expect(result.cornerCount).toBe(0);
  });

  test("winding road has high curvature", () => {
    // Zig-zag pattern
    const coords: Coordinate[] = [
      { lat: 0, lng: 0 },
      { lat: 0.001, lng: 0.001 },
      { lat: 0.002, lng: 0 },
      { lat: 0.003, lng: 0.001 },
      { lat: 0.004, lng: 0 },
    ];
    const result = analyzeCurvature(coords, 500);
    expect(result.curvaturePerKm).toBeGreaterThan(50);
    expect(result.cornerCount).toBeGreaterThan(0);
  });

  test("too few points returns zero", () => {
    const coords: Coordinate[] = [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
    ];
    const result = analyzeCurvature(coords, 500);
    expect(result.curvaturePerKm).toBe(0);
  });
});

describe("scoreCurvature", () => {
  test("straight road scores low", () => {
    const score = scoreCurvature(5, 0.5);
    expect(score).toBeLessThan(30);
  });

  test("gentle curves score moderate", () => {
    const score = scoreCurvature(50, 0.5);
    expect(score).toBeGreaterThan(30);
    expect(score).toBeLessThan(70);
  });

  test("sweet spot scores high", () => {
    const score = scoreCurvature(200, 0.7);
    expect(score).toBeGreaterThan(70);
  });

  test("extreme hairpins get penalized", () => {
    const sweet = scoreCurvature(300, 0.5);
    const extreme = scoreCurvature(600, 0.5);
    expect(extreme).toBeLessThan(sweet);
  });

  test("high flow bonus increases score", () => {
    const low = scoreCurvature(200, 0.3);
    const high = scoreCurvature(200, 0.8);
    expect(high).toBeGreaterThan(low);
  });
});

describe("scoreElevation", () => {
  test("flat terrain scores low", () => {
    expect(scoreElevation(2, 1)).toBeLessThan(25);
  });

  test("rolling terrain scores moderate", () => {
    const score = scoreElevation(15, 5);
    expect(score).toBeGreaterThan(25);
    expect(score).toBeLessThan(60);
  });

  test("mountain terrain scores high", () => {
    const score = scoreElevation(45, 8);
    expect(score).toBeGreaterThan(60);
  });

  test("alpine terrain scores highest", () => {
    const score = scoreElevation(80, 10);
    expect(score).toBeGreaterThan(85);
  });

  test("gradient bonus applies for 3-12%", () => {
    const without = scoreElevation(20, 1);
    const with_ = scoreElevation(20, 6);
    expect(with_).toBeGreaterThan(without);
  });
});

describe("scoreRoadCharacter", () => {
  test("tertiary road with 2 lanes at 60km/h scores high", () => {
    const score = scoreRoadCharacter("tertiary", "60", "2");
    expect(score).toBeGreaterThan(80);
  });

  test("motorway scores very low", () => {
    const score = scoreRoadCharacter("motorway", "120", "4");
    expect(score).toBeLessThan(30);
  });

  test("null values use defaults", () => {
    const score = scoreRoadCharacter(null, null, null);
    expect(score).toBeGreaterThan(30);
    expect(score).toBeLessThan(70);
  });
});

describe("computeEnthusiastScore", () => {
  test("weights sum to correct composite", () => {
    // All 100 should be 100
    expect(computeEnthusiastScore(100, 100, 100, 100)).toBe(100);
    // All 0 should be 0
    expect(computeEnthusiastScore(0, 0, 0, 0)).toBe(0);
  });

  test("weights are 35/25/20/20", () => {
    // Only curvature at 100, rest 0
    expect(computeEnthusiastScore(100, 0, 0, 0)).toBe(35);
    // Only elevation at 100
    expect(computeEnthusiastScore(0, 100, 0, 0)).toBe(25);
    // Only surface at 100
    expect(computeEnthusiastScore(0, 0, 100, 0)).toBe(20);
    // Only character at 100
    expect(computeEnthusiastScore(0, 0, 0, 100)).toBe(20);
  });
});

describe("analyzeEnthusiastSegments", () => {
  test("short segment defaults to 50", () => {
    const segments: RouteSegment[] = [
      {
        index: 0,
        start: { lat: 0, lng: 0 },
        end: { lat: 0.0001, lng: 0 },
        coordinates: [
          { lat: 0, lng: 0 },
          { lat: 0.0001, lng: 0 },
        ],
        lengthMeters: 50,
      },
    ];
    const result = analyzeEnthusiastSegments(
      segments,
      new Map(),
      new Map(),
      new Map()
    );
    expect(result.get(0)?.enthusiastScore).toBe(50);
  });

  test("processes normal segments", () => {
    const segments: RouteSegment[] = [
      {
        index: 0,
        start: { lat: 0, lng: 0 },
        end: { lat: 0.005, lng: 0.005 },
        coordinates: [
          { lat: 0, lng: 0, elevation: 100 },
          { lat: 0.001, lng: 0.001, elevation: 120 },
          { lat: 0.002, lng: 0, elevation: 140 },
          { lat: 0.003, lng: 0.001, elevation: 130 },
          { lat: 0.004, lng: 0, elevation: 150 },
          { lat: 0.005, lng: 0.005, elevation: 160 },
        ],
        lengthMeters: 500,
      },
    ];
    const elevMap = new Map([[0, [100, 120, 140, 130, 150, 160]]]);
    const roadTags = new Map([[0, {
      highway: "tertiary",
      maxspeed: "60",
      lanes: "2",
      name: "Test Road",
      surface: "asphalt",
      smoothness: "good",
    }]]);
    const osmScores = new Map([[0, 90]]);

    const result = analyzeEnthusiastSegments(segments, elevMap, roadTags, osmScores);
    const data = result.get(0)!;

    expect(data.enthusiastScore).toBeGreaterThan(0);
    expect(data.enthusiastScore).toBeLessThanOrEqual(100);
    expect(data.highwayType).toBe("tertiary");
    expect(data.roadName).toBe("Test Road");
    expect(data.curvaturePerKm).toBeGreaterThan(0);
  });
});
