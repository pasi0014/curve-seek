import { useState, useRef, useCallback } from "react";
import type { AccelerometerReading } from "../types";

export function useDriveMode() {
  const [isDriving, setIsDriving] = useState(false);
  const sessionIdRef = useRef<string>("");
  const bufferRef = useRef<AccelerometerReading[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const motionHandlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(
    null
  );
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number; speed: number }>({
    lat: 0,
    lng: 0,
    speed: 0,
  });

  const flush = useCallback(async () => {
    if (bufferRef.current.length === 0) return;
    const readings = bufferRef.current.splice(0);
    try {
      await fetch("/api/accelerometer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          readings,
        }),
      });
    } catch {
      bufferRef.current.unshift(...readings);
    }
  }, []);

  const start = useCallback(async () => {
    if (
      typeof (DeviceMotionEvent as any).requestPermission === "function"
    ) {
      const permission = await (
        DeviceMotionEvent as any
      ).requestPermission();
      if (permission !== "granted") return;
    }

    sessionIdRef.current = crypto.randomUUID();
    bufferRef.current = [];

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        lastPositionRef.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed ?? 0,
        };
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    const handler = (e: DeviceMotionEvent) => {
      const accel = e.accelerationIncludingGravity;
      if (!accel) return;
      const pos = lastPositionRef.current;
      if (pos.lat === 0 && pos.lng === 0) return;
      bufferRef.current.push({
        timestamp: Date.now(),
        lat: pos.lat,
        lng: pos.lng,
        x: accel.x ?? 0,
        y: accel.y ?? 0,
        z: accel.z ?? 0,
        speed: pos.speed,
      });
    };
    motionHandlerRef.current = handler;
    window.addEventListener("devicemotion", handler);

    flushIntervalRef.current = setInterval(flush, 10_000);

    setIsDriving(true);
  }, [flush]);

  const stop = useCallback(async () => {
    if (motionHandlerRef.current) {
      window.removeEventListener("devicemotion", motionHandlerRef.current);
      motionHandlerRef.current = null;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
      flushIntervalRef.current = null;
    }
    await flush();
    setIsDriving(false);
  }, [flush]);

  return { isDriving, start, stop };
}
