import { saveAccelerometerReadings, saveSegmentRoughness } from "../lib/db.ts";
import { processRecording } from "../lib/accelerometer.ts";
import type { WideEvent } from "../logger.ts";

interface AccelerometerInput {
  sessionId: string;
  readings: {
    timestamp: number;
    lat: number;
    lng: number;
    x: number;
    y: number;
    z: number;
    speed: number;
  }[];
}

export async function processAccelerometerData(input: AccelerometerInput, event: WideEvent) {
  const { sessionId, readings } = input;

  event.set("accel_session_id", sessionId);
  event.set("accel_readings_saved", readings.length);

  await saveAccelerometerReadings(sessionId, readings);

  const processed = processRecording(readings);
  for (const p of processed) {
    await saveSegmentRoughness(p.lat, p.lng, p.iri);
  }

  event.set("accel_cells_processed", processed.length);

  return { saved: readings.length, processed: processed.length };
}
