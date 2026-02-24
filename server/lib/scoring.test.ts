import { test, expect, describe } from "bun:test";
import {
  scoreOSM,
  scoreWinter,
  scoreWeather,
  computeCompositeScore,
  scoreToQuality,
  buildReport,
} from "./scoring.ts";

describe("scoreOSM", () => {
  test("returns default for null", () => {
    expect(scoreOSM(null)).toBe(70);
  });

  test("scores asphalt highly", () => {
    expect(scoreOSM({ surface: "asphalt", smoothness: null })).toBe(95);
  });

  test("scores gravel lower", () => {
    expect(scoreOSM({ surface: "gravel", smoothness: null })).toBe(40);
  });

  test("averages surface and smoothness when both present", () => {
    const score = scoreOSM({ surface: "asphalt", smoothness: "bad" });
    // (95 + 40) / 2 = 67.5
    expect(score).toBeCloseTo(67.5, 1);
  });
});

describe("scoreWinter", () => {
  test("returns 70 for null", () => {
    expect(scoreWinter(null)).toBe(70);
  });

  test("bare roads score high", () => {
    expect(scoreWinter({ status: "bare", source: "test", updatedAt: "" })).toBe(95);
  });

  test("ice scores very low", () => {
    expect(scoreWinter({ status: "ice", source: "test", updatedAt: "" })).toBe(10);
  });
});

describe("scoreWeather", () => {
  test("returns 70 for null", () => {
    expect(scoreWeather(null)).toBe(70);
  });

  test("warm dry weather scores well", () => {
    const score = scoreWeather({
      temperature: 20,
      precipitation: null,
      windSpeed: 10,
      iceRisk: false,
    });
    expect(score).toBe(90);
  });

  test("ice risk reduces score", () => {
    const score = scoreWeather({
      temperature: -2,
      precipitation: "snow",
      windSpeed: 30,
      iceRisk: true,
    });
    expect(score).toBeLessThan(50);
  });
});

describe("scoreToQuality", () => {
  test("maps scores to quality correctly", () => {
    expect(scoreToQuality(80)).toBe("good");
    expect(scoreToQuality(60)).toBe("fair");
    expect(scoreToQuality(40)).toBe("poor");
    expect(scoreToQuality(20)).toBe("bad");
  });
});

describe("computeCompositeScore", () => {
  test("all-100 gives 100", () => {
    expect(computeCompositeScore(100, 100, 100, 100)).toBe(100);
  });

  test("all-0 gives 0", () => {
    expect(computeCompositeScore(0, 0, 0, 0)).toBe(0);
  });

  test("weights applied correctly", () => {
    // osm=30%, winter=25%, weather=20%, crowd=25%
    const score = computeCompositeScore(100, 0, 0, 0);
    expect(score).toBe(30);
  });
});

describe("buildReport", () => {
  test("produces valid report with problem sections", () => {
    const segments = [
      {
        segment: {
          index: 0,
          start: { lat: 0, lng: 0 },
          end: { lat: 1, lng: 1 },
          coordinates: [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }],
          lengthMeters: 500,
        },
        osmScore: 90,
        winterScore: 80,
        weatherScore: 85,
        crowdScore: 70,
        compositeScore: 82,
        osmData: null,
        winterCondition: null,
        weatherData: null,
      },
      {
        segment: {
          index: 1,
          start: { lat: 1, lng: 1 },
          end: { lat: 2, lng: 2 },
          coordinates: [{ lat: 1, lng: 1 }, { lat: 2, lng: 2 }],
          lengthMeters: 500,
        },
        osmScore: 20,
        winterScore: 10,
        weatherScore: 30,
        crowdScore: 25,
        compositeScore: 21,
        osmData: null,
        winterCondition: null,
        weatherData: null,
      },
    ];

    const report = buildReport("Toronto", "Ottawa", 100, segments);

    expect(report.origin).toBe("Toronto");
    expect(report.destination).toBe("Ottawa");
    expect(report.overallScore).toBe(52); // (82+21)/2 = 51.5 → 52
    expect(report.overallQuality).toBe("poor"); // 52 is in poor range (35-54)
    expect(report.problemSections.length).toBe(1);
    expect(report.problemSections[0]!.compositeScore).toBe(21);
  });
});
