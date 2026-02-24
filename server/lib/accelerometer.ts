/**
 * Client-side accelerometer capture & IRI (International Roughness Index) calculation.
 * This module runs in the browser using DeviceMotion API.
 */

export interface AccelSample {
  timestamp: number;
  lat: number;
  lng: number;
  x: number;
  y: number;
  z: number;
  speed: number;
}

/**
 * Calculate IRI (International Roughness Index) from accelerometer samples.
 * Uses simplified quarter-car model adapted for smartphone sensors.
 *
 * IRI values: < 2 = good, 2-4 = fair, 4-6 = poor, > 6 = bad
 */
export function calculateIRI(samples: AccelSample[]): number {
  if (samples.length < 10) return 0;

  // Filter to moving samples (speed > 5 km/h to avoid stationary noise)
  const moving = samples.filter((s) => s.speed > 1.4); // ~5 km/h in m/s
  if (moving.length < 10) return 0;

  // Compute vertical acceleration variance (z-axis dominates road roughness)
  const zValues = moving.map((s) => s.z);
  const zMean = zValues.reduce((a, b) => a + b, 0) / zValues.length;
  const zVariance =
    zValues.reduce((sum, z) => sum + (z - zMean) ** 2, 0) / zValues.length;

  // Root Mean Square of vertical acceleration deviations
  const rmsZ = Math.sqrt(zVariance);

  // Average speed in m/s
  const avgSpeed =
    moving.reduce((sum, s) => sum + s.speed, 0) / moving.length;

  // Convert to approximate IRI using empirical calibration
  // Based on: IRI ≈ k * RMS_z / speed
  // k is a calibration constant (~6-8 for dashboard-mounted phones)
  const k = 7.0;
  const iri = (k * rmsZ) / Math.max(avgSpeed, 2.0);

  return Math.round(iri * 100) / 100;
}

/**
 * Group samples by road segment (grid cells of ~50m)
 */
export function groupSamplesByGrid(
  samples: AccelSample[],
  gridSizeDeg = 0.0005
): Map<string, AccelSample[]> {
  const grid = new Map<string, AccelSample[]>();

  for (const sample of samples) {
    const gridLat = Math.round(sample.lat / gridSizeDeg) * gridSizeDeg;
    const gridLng = Math.round(sample.lng / gridSizeDeg) * gridSizeDeg;
    const key = `${gridLat.toFixed(4)},${gridLng.toFixed(4)}`;

    const existing = grid.get(key);
    if (existing) {
      existing.push(sample);
    } else {
      grid.set(key, [sample]);
    }
  }

  return grid;
}

/**
 * Process a recording session: group by grid, compute IRI per cell.
 */
export function processRecording(
  samples: AccelSample[]
): { lat: number; lng: number; iri: number }[] {
  const grid = groupSamplesByGrid(samples);
  const results: { lat: number; lng: number; iri: number }[] = [];

  for (const [key, cellSamples] of grid) {
    const [lat, lng] = key.split(",").map(Number);
    const iri = calculateIRI(cellSamples);
    if (iri > 0) {
      results.push({ lat: lat!, lng: lng!, iri });
    }
  }

  return results;
}
