"use client";

import React, { useEffect, useRef, useCallback } from "react";

/**
 * TerrainRoadCanvas
 * ─────────────────
 * Renders real OpenTopoMap tiles (Gatineau Park) with a glowing lime road
 * overlay tracing the Promenade de la Gatineau — actual OSM geometry — and
 * a car icon that drives smoothly along it. Pure 2D canvas, no Three.js.
 *
 * All coordinates are real data from OpenStreetMap (Overpass API export).
 */

/* ── Real OSM road geometry: Promenade de la Gatineau ──
 * Four connected way segments stitched south-to-north.
 * Source: Overpass API, way IDs 26143805, 26143786, 26143889, 26143900, 9973389
 */
const ROAD_COORDS: [number, number][] = [
  // Segment 1 (way 26143805) — short bridge at south end
  [45.445391, -75.7617031],
  [45.4457597, -75.7623875],
  // Segment 2 (way 26143786) — long winding section heading NW
  [45.4556737, -75.7869037],
  [45.4562261, -75.7872041],
  [45.4564992, -75.7873785],
  [45.4567975, -75.7876269],
  [45.4570567, -75.7879736],
  [45.4572462, -75.7883273],
  [45.4574179, -75.7887718],
  [45.457731, -75.7896559],
  [45.458044, -75.7902567],
  [45.4583152, -75.7905989],
  [45.4586709, -75.7908914],
  [45.459014, -75.7910666],
  [45.4594769, -75.7911923],
  [45.4600852, -75.7912839],
  [45.4606388, -75.7912781],
  [45.4611324, -75.7911579],
  [45.4622461, -75.7903854],
  [45.4628481, -75.7899992],
  [45.4633297, -75.7898018],
  [45.4639069, -75.7897181],
  [45.4644841, -75.7897203],
  [45.4649099, -75.7897804],
  [45.4653885, -75.7899477],
  [45.4659985, -75.7903173],
  [45.466721, -75.7908211],
  [45.4669716, -75.7910721],
  [45.4671602, -75.7913199],
  [45.4673802, -75.7916857],
  [45.4675064, -75.792033],
  [45.467593, -75.7924002],
  [45.4676509, -75.7928498],
  [45.4676535, -75.7932666],
  [45.4676086, -75.793645],
  [45.4675357, -75.793988],
  [45.4674007, -75.7944798],
  [45.4673178, -75.7948566],
  [45.4672597, -75.7952608],
  [45.4672374, -75.7955998],
  [45.4672191, -75.7959503],
  [45.4672963, -75.7975576],
  [45.4672649, -75.7979917],
  [45.467199, -75.7983521],
  [45.4671221, -75.7986424],
  [45.4669763, -75.7989666],
  [45.4668293, -75.7991982],
  [45.4658881, -75.8004448],
  [45.4657122, -75.800827],
  [45.4656013, -75.8012309],
  [45.465545, -75.8016293],
  [45.4655383, -75.8020585],
  [45.465583, -75.802459],
  [45.4656498, -75.8027825],
  [45.4656895, -75.8029511],
  [45.4658564, -75.8034452],
  [45.4662914, -75.8042385],
  [45.4665338, -75.8047834],
  [45.4666729, -75.8051784],
  [45.4667643, -75.8055684],
  [45.4668098, -75.8059571],
  [45.4668195, -75.8063708],
  [45.4668044, -75.8067308],
  [45.4667153, -75.8073673],
  [45.4666533, -75.8075335],
  [45.4664607, -75.8081095],
  [45.4663798, -75.8083571],
  [45.4661649, -75.8088692],
  [45.4660386, -75.8092682],
  [45.4658748, -75.8099602],
  [45.465826, -75.8104438],
  [45.4658301, -75.8112148],
  [45.4659388, -75.8119859],
  [45.4660572, -75.8125114],
  [45.4662698, -75.813051],
  [45.4665081, -75.8135168],
  [45.4673623, -75.8146829],
  // Bridge (way 26143889)
  [45.4691904, -75.8195703],
  [45.4691904, -75.8200681],
  // Segment 3 (way 26143900) — curves north through the park (reversed to go S→N)
  [45.4697138, -75.8266048],
  [45.4700896, -75.8271553],
  [45.4703182, -75.8274127],
  [45.4712152, -75.8283398],
  [45.4715917, -75.8285776],
  [45.4718463, -75.828648],
  [45.4721481, -75.8286831],
  [45.4733339, -75.8285387],
  [45.4735878, -75.8285306],
  [45.4738591, -75.8285661],
  [45.4741945, -75.8286831],
  [45.4762108, -75.8297989],
  [45.4769932, -75.8300135],
  [45.4772295, -75.83002],
  [45.4778959, -75.8300564],
  [45.4786482, -75.8299276],
  [45.4791598, -75.8297131],
  [45.4795632, -75.8295177],
  [45.48005, -75.829282],
  [45.4803935, -75.8291122],
  [45.4807386, -75.8290479],
  [45.4813189, -75.828987],
  [45.4816766, -75.8289867],
  [45.4841636, -75.8290076],
  [45.4848313, -75.8291672],
  [45.4853491, -75.8294457],
  [45.4859599, -75.8299276],
  [45.4883668, -75.8320734],
  [45.4888286, -75.8323988],
  [45.4893912, -75.8326603],
  [45.4898977, -75.832789],
  [45.4904728, -75.832803],
  [45.4908255, -75.8327459],
  [45.4911385, -75.8326579],
  [45.4915064, -75.8324864],
  [45.4918868, -75.832288],
  [45.4931855, -75.8313006],
  [45.4934295, -75.8311676],
  [45.4935776, -75.8311056],
  [45.4937439, -75.831071],
  [45.4938684, -75.8310622],
  [45.4940053, -75.8310608],
  [45.4941417, -75.8310684],
  [45.4942572, -75.831095],
  [45.4943692, -75.8311341],
  [45.494497, -75.8311932],
  [45.4945953, -75.8312432],
  [45.4947114, -75.8313088],
  [45.4948112, -75.8313849],
  [45.4949144, -75.8314771],
  [45.49541, -75.8319302],
  [45.4954959, -75.8320115],
  [45.4957392, -75.8322416],
  // Segment 4 (way 9973389) — final section to the north with lovely curves
  [45.509489, -75.8241078],
  [45.509616, -75.8240804],
  [45.5098157, -75.8240413],
  [45.5099907, -75.8239866],
  [45.5100884, -75.8239535],
  [45.5101805, -75.8239042],
  [45.51048, -75.8237535],
  [45.5114629, -75.8231252],
  [45.5117859, -75.8229243],
  [45.5122146, -75.8227707],
  [45.5126153, -75.8227187],
  [45.5129895, -75.8227202],
  [45.5135428, -75.8228575],
  [45.5140721, -75.8231493],
  [45.5144149, -75.8234326],
  [45.5147124, -75.8237315],
  [45.5149909, -75.8240844],
  [45.5152507, -75.8245038],
  [45.5155129, -75.8251116],
  [45.5157293, -75.8257111],
  [45.516105, -75.8266255],
  [45.5163771, -75.8270519],
  [45.516729, -75.8273858],
  [45.5176234, -75.8280522],
  [45.5183692, -75.8286693],
  [45.5196472, -75.8299128],
  [45.5208148, -75.8310863],
  [45.5215496, -75.8319303],
  [45.5220872, -75.8325266],
  [45.5235681, -75.8341614],
  [45.5243679, -75.8351141],
  [45.5248189, -75.8358609],
  [45.5251526, -75.8365532],
  [45.525373, -75.8373268],
  [45.5255045, -75.8383262],
  [45.5255502, -75.8392513],
  [45.5254792, -75.8401946],
  [45.5252604, -75.8411717],
  [45.5249449, -75.8420595],
  [45.5227686, -75.8464573],
  [45.5220955, -75.8477099],
  [45.5217532, -75.8482593],
  [45.5215698, -75.8486447],
  [45.521476, -75.8489953],
  [45.5214492, -75.8492364],
  [45.5214425, -75.8494632],
  [45.521472, -75.8497646],
  [45.5215078, -75.8500638],
  [45.5214736, -75.8502007],
  [45.5214022, -75.8503146],
  [45.5213616, -75.8503546],
  [45.5212907, -75.8504246],
];

/* ── Compute center from actual road bounds ── */
const lats = ROAD_COORDS.map((c) => c[0]);
const lngs = ROAD_COORDS.map((c) => c[1]);
const MAP_CENTER_LAT = (Math.min(...lats) + Math.max(...lats)) / 2;
const MAP_CENTER_LNG = (Math.min(...lngs) + Math.max(...lngs)) / 2;
const ZOOM = 13;

/* ── Tile math helpers ── */
function lngToTileX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom);
}

function latToTileY(lat: number, zoom: number): number {
  const latRad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

function lngToPixelX(
  lng: number,
  zoom: number,
  centerLng: number,
  canvasWidth: number,
): number {
  const centerTileX = lngToTileX(centerLng, zoom);
  const tileX = lngToTileX(lng, zoom);
  return canvasWidth / 2 + (tileX - centerTileX) * 256;
}

function latToPixelY(
  lat: number,
  zoom: number,
  centerLat: number,
  canvasHeight: number,
): number {
  const centerTileY = latToTileY(centerLat, zoom);
  const tileY = latToTileY(lat, zoom);
  return canvasHeight / 2 + (tileY - centerTileY) * 256;
}

/* ── Smooth the raw coords with Catmull-Rom spline ── */
function catmullRomPoint(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): [number, number] {
  const t2 = t * t;
  const t3 = t2 * t;
  const x =
    0.5 *
    (2 * p1[0] +
      (-p0[0] + p2[0]) * t +
      (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
      (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
  const y =
    0.5 *
    (2 * p1[1] +
      (-p0[1] + p2[1]) * t +
      (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
      (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
  return [x, y];
}

function getSplinePoints(
  coords: [number, number][],
  density: number = 8,
): [number, number][] {
  const pts: [number, number][] = [];
  const n = coords.length;
  // Open spline (not closed loop)
  for (let i = 0; i < n - 1; i++) {
    const p0 = coords[Math.max(i - 1, 0)];
    const p1 = coords[i];
    const p2 = coords[Math.min(i + 1, n - 1)];
    const p3 = coords[Math.min(i + 2, n - 1)];
    for (let j = 0; j < density; j++) {
      pts.push(catmullRomPoint(p0, p1, p2, p3, j / density));
    }
  }
  // Add the last point
  pts.push(coords[n - 1]);
  return pts;
}

/* ── Cumulative arc-length for uniform speed ── */
function computeArcLengths(pixelPoints: [number, number][]): number[] {
  const lengths = [0];
  for (let i = 1; i < pixelPoints.length; i++) {
    const dx = pixelPoints[i][0] - pixelPoints[i - 1][0];
    const dy = pixelPoints[i][1] - pixelPoints[i - 1][1];
    lengths.push(lengths[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  return lengths;
}

function getPointAtDistance(
  pixelPoints: [number, number][],
  arcLengths: number[],
  distance: number,
): { x: number; y: number; angle: number } {
  const totalLength = arcLengths[arcLengths.length - 1];
  // Ping-pong: drive forward then reverse
  const cycle = totalLength * 2;
  let d = distance % cycle;
  if (d > totalLength) d = cycle - d; // reverse direction
  // Clamp
  d = Math.max(0, Math.min(d, totalLength - 0.01));

  let idx = 0;
  for (let i = 1; i < arcLengths.length; i++) {
    if (arcLengths[i] >= d) {
      idx = i - 1;
      break;
    }
  }
  if (idx >= pixelPoints.length - 1) idx = pixelPoints.length - 2;
  if (idx < 0) idx = 0;

  const segLen = arcLengths[idx + 1] - arcLengths[idx];
  const t = segLen > 0 ? (d - arcLengths[idx]) / segLen : 0;
  const x =
    pixelPoints[idx][0] + (pixelPoints[idx + 1][0] - pixelPoints[idx][0]) * t;
  const y =
    pixelPoints[idx][1] + (pixelPoints[idx + 1][1] - pixelPoints[idx][1]) * t;

  // Direction (account for reverse)
  const isReversing = distance % cycle > totalLength;
  const dx = pixelPoints[idx + 1][0] - pixelPoints[idx][0];
  const dy = pixelPoints[idx + 1][1] - pixelPoints[idx][1];
  let angle = Math.atan2(dy, dx);
  if (isReversing) angle += Math.PI;

  return { x, y, angle };
}

/* ── Draw the car icon ── */
function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  scale: number = 1.0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const s = scale;

  // Glow behind
  ctx.shadowColor = "#a3e635";
  ctx.shadowBlur = 20 * s;

  // Car body
  const bodyLen = 20 * s;
  const bodyW = 9 * s;
  ctx.fillStyle = "#a3e635";
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-bodyLen / 2, -bodyW / 2, bodyLen, bodyW, 3 * s);
  } else {
    ctx.rect(-bodyLen / 2, -bodyW / 2, bodyLen, bodyW);
  }
  ctx.fill();

  // Cabin
  ctx.fillStyle = "#0a0a0a";
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-3 * s, -3 * s, 8 * s, 6 * s, 2 * s);
  } else {
    ctx.rect(-3 * s, -3 * s, 8 * s, 6 * s);
  }
  ctx.fill();

  // Headlights
  ctx.shadowBlur = 10 * s;
  ctx.shadowColor = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(bodyLen / 2 - 2 * s, -2.5 * s, 1.3 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bodyLen / 2 - 2 * s, 2.5 * s, 1.3 * s, 0, Math.PI * 2);
  ctx.fill();

  // Taillights
  ctx.shadowColor = "#ef4444";
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(-bodyLen / 2 + 2 * s, -2.5 * s, 1 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-bodyLen / 2 + 2 * s, 2.5 * s, 1 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();
}

/* ── Main component ── */
export function TerrainRoadCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const tileImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const startTimeRef = useRef<number>(0);
  const splinePixelsRef = useRef<[number, number][]>([]);
  const arcLengthsRef = useRef<number[]>([]);
  const lastSizeRef = useRef<string>("");

  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = (timestamp - startTimeRef.current) / 1000;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const sizeKey = `${w}x${h}`;

    if (
      canvas.width !== w * dpr ||
      canvas.height !== h * dpr ||
      lastSizeRef.current !== sizeKey
    ) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      lastSizeRef.current = sizeKey;
      // Recompute pixel coords from lat/lng via spline
      const splineGeo = getSplinePoints(ROAD_COORDS, 8);
      splinePixelsRef.current = splineGeo.map(([lat, lng]) => [
        lngToPixelX(lng, ZOOM, MAP_CENTER_LNG, w * dpr),
        latToPixelY(lat, ZOOM, MAP_CENTER_LAT, h * dpr),
      ]);
      arcLengthsRef.current = computeArcLengths(splinePixelsRef.current);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const cw = canvas.width;
    const ch = canvas.height;

    // ── Draw tiles ──
    const centerTileX = lngToTileX(MAP_CENTER_LNG, ZOOM);
    const centerTileY = latToTileY(MAP_CENTER_LAT, ZOOM);
    const tilesX = Math.ceil(cw / 256) + 2;
    const tilesY = Math.ceil(ch / 256) + 2;
    const startTileX = Math.floor(centerTileX - tilesX / 2);
    const startTileY = Math.floor(centerTileY - tilesY / 2);
    const offsetX = cw / 2 - (centerTileX - startTileX) * 256;
    const offsetY = ch / 2 - (centerTileY - startTileY) * 256;

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, cw, ch);

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const tileXCoord = startTileX + tx;
        const tileYCoord = startTileY + ty;
        const key = `${ZOOM}/${tileXCoord}/${tileYCoord}`;
        const tileMap = tileImagesRef.current;

        if (!tileMap.has(key)) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = `https://a.tile.opentopomap.org/${key}.png`;
          tileMap.set(key, img);
        }

        const img = tileMap.get(key)!;
        const dx = offsetX + tx * 256;
        const dy = offsetY + ty * 256;

        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, dx, dy, 256, 256);
        }
      }
    }

    // ── Dark/tinted overlay ──
    ctx.fillStyle = "rgba(10, 10, 10, 0.52)";
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = "rgba(163, 230, 53, 0.03)";
    ctx.fillRect(0, 0, cw, ch);

    // ── Draw the road ──
    const pixelPts = splinePixelsRef.current;
    if (pixelPts.length > 1) {
      // Wide glow
      ctx.save();
      ctx.strokeStyle = "rgba(163, 230, 53, 0.10)";
      ctx.lineWidth = 16;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "#a3e635";
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.moveTo(pixelPts[0][0], pixelPts[0][1]);
      for (let i = 1; i < pixelPts.length; i++) {
        ctx.lineTo(pixelPts[i][0], pixelPts[i][1]);
      }
      ctx.stroke();
      ctx.restore();

      // Solid road line
      ctx.save();
      ctx.strokeStyle = "rgba(163, 230, 53, 0.55)";
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "#a3e635";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(pixelPts[0][0], pixelPts[0][1]);
      for (let i = 1; i < pixelPts.length; i++) {
        ctx.lineTo(pixelPts[i][0], pixelPts[i][1]);
      }
      ctx.stroke();
      ctx.restore();

      // Dashed center line
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      ctx.setLineDash([10, 7]);
      ctx.lineDashOffset = -elapsed * 15;
      ctx.beginPath();
      ctx.moveTo(pixelPts[0][0], pixelPts[0][1]);
      for (let i = 1; i < pixelPts.length; i++) {
        ctx.lineTo(pixelPts[i][0], pixelPts[i][1]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // ── Animated car ──
      if (arcLengthsRef.current.length > 0) {
        // Speed: ~30 pixels/sec — slow cruising pace
        const speed = 30;
        const dist = elapsed * speed;
        const pos = getPointAtDistance(pixelPts, arcLengthsRef.current, dist);

        // Trail
        const trailCount = 20;
        for (let i = trailCount; i >= 1; i--) {
          const trailDist = dist - i * 8;
          if (trailDist < 0) continue;
          const tp = getPointAtDistance(
            pixelPts,
            arcLengthsRef.current,
            trailDist,
          );
          const alpha = (1 - i / trailCount) * 0.3;
          const size = (1 - i / trailCount) * 3 + 0.5;
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(163, 230, 53, ${alpha})`;
          ctx.fill();
        }

        drawCar(ctx, pos.x, pos.y, pos.angle, dpr * 0.9);

        // Headlight beam cone
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(pos.angle);
        const grad = ctx.createRadialGradient(
          14 * dpr,
          0,
          0,
          14 * dpr,
          0,
          40 * dpr,
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 0.10)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(14 * dpr, 0, 40 * dpr, -0.4, 0.4);
        ctx.lineTo(14 * dpr, 0);
        ctx.fill();
        ctx.restore();
      }
    }

    // ── Coordinate labels ──
    ctx.save();
    const fontSize = 10 * (cw > 800 ? 1 : 0.8);
    ctx.font = `${fontSize}px "Space Mono", monospace`;
    ctx.fillStyle = "rgba(163, 230, 53, 0.30)";
    ctx.textAlign = "left";
    ctx.fillText(`LAT: ${MAP_CENTER_LAT.toFixed(4)}`, 12, ch - 28);
    ctx.fillText(`LNG: ${MAP_CENTER_LNG.toFixed(4)}`, 12, ch - 12);
    ctx.textAlign = "right";
    ctx.fillText("PROMENADE DE LA GATINEAU", cw - 12, ch - 28);
    ctx.fillText(`ZOOM: ${ZOOM} // TOPO`, cw - 12, ch - 12);
    ctx.restore();

    // ── Grid overlay ──
    ctx.save();
    ctx.strokeStyle = "rgba(163, 230, 53, 0.025)";
    ctx.lineWidth = 1;
    const gridSize = 80;
    for (let gx = 0; gx < cw; gx += gridSize) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, ch);
      ctx.stroke();
    }
    for (let gy = 0; gy < ch; gy += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(cw, gy);
      ctx.stroke();
    }
    ctx.restore();

    animFrameRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-label="Topographic map of Gatineau Park showing animated car driving along Promenade de la Gatineau"
      role="img"
    />
  );
}
