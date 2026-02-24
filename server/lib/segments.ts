import type { Coordinate, RouteSegment } from "./types.ts";

const EARTH_RADIUS_M = 6_371_000;

export function haversineDistance(a: Coordinate, b: Coordinate): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function interpolate(a: Coordinate, b: Coordinate, t: number): Coordinate {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

/**
 * Splits a polyline into fixed-length segments (~targetLengthM meters each).
 */
export function splitIntoSegments(
  coordinates: Coordinate[],
  targetLengthM = 500
): RouteSegment[] {
  if (coordinates.length < 2) return [];

  const segments: RouteSegment[] = [];
  let segCoords: Coordinate[] = [coordinates[0]!];
  let segLength = 0;
  let segIndex = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1]!;
    const curr = coordinates[i]!;
    const dist = haversineDistance(prev, curr);

    if (segLength + dist >= targetLengthM) {
      // Split this edge
      const remaining = targetLengthM - segLength;
      const t = remaining / dist;
      const splitPoint = interpolate(prev, curr, t);
      segCoords.push(splitPoint);

      segments.push({
        index: segIndex++,
        start: segCoords[0]!,
        end: splitPoint,
        coordinates: segCoords,
        lengthMeters: targetLengthM,
      });

      // Start new segment from split point
      segCoords = [splitPoint];
      segLength = dist - remaining;

      // Handle case where remaining distance is longer than target
      while (segLength >= targetLengthM) {
        const innerT = targetLengthM / segLength;
        const innerSplit = interpolate(segCoords[0]!, curr, innerT);
        segCoords.push(innerSplit);
        segments.push({
          index: segIndex++,
          start: segCoords[0]!,
          end: innerSplit,
          coordinates: segCoords,
          lengthMeters: targetLengthM,
        });
        segCoords = [innerSplit];
        segLength -= targetLengthM;
      }

      if (segLength > 0) {
        segCoords.push(curr);
      }
    } else {
      segLength += dist;
      segCoords.push(curr);
    }
  }

  // Final partial segment
  if (segCoords.length >= 2) {
    segments.push({
      index: segIndex,
      start: segCoords[0]!,
      end: segCoords[segCoords.length - 1]!,
      coordinates: segCoords,
      lengthMeters: segLength,
    });
  }

  return segments;
}

export function segmentMidpoint(segment: RouteSegment): Coordinate {
  const mid = Math.floor(segment.coordinates.length / 2);
  return segment.coordinates[mid]!;
}
