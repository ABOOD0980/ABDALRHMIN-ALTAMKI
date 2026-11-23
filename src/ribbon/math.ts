import * as THREE from 'three';

export const FOV = 35;
export const GZ = 8;
export const CARD_W = 2.1;
export const CARD_H = 1.32;
export const GAP = 0.03;
export const STEP = CARD_W + GAP;
export const NX = 28;
export const NY = 3;
export const RIB_A = 0.14;
export const RIB_B = 0.63;
export const PH0 = -1.5;
export const PH1 = Math.PI * 2 + 1.35;
export const SAMPLES = 1200;

export const clamp = (x: number, a = 0, b = 1): number =>
  Math.min(b, Math.max(a, x));

export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

export const ease = (t: number): number => t * t * (3 - 2 * t);

export const out = (t: number): number => 1 - (1 - t) ** 3;

export const span = (p: number, a: number, b: number): number =>
  clamp((p - a) / (b - a));

export interface PathSampler {
  length: number;
  points: THREE.Vector3[];
  tangents: THREE.Vector3[];
}

export function buildPathPoints(): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 160; i++) {
    const t = i / 160;
    const ph = mix(PH0, PH1, t);
    const cs = Math.cos(ph);
    const u = 2 * t - 1;
    // Shallow arc near camera (5.4..7.6), sweeping long behind (up to 24.0)
    const depth = cs > 0 ? 7.6 + 16.4 * cs ** 0.9 : 7.6 + 2.2 * cs;
    const edge = 0.84 + 0.5 * span(0.14 - t, 0, 0.14) + 0.8 * span(t, 0.84, 1);
    pts.push(
      new THREE.Vector3(
        edge * Math.sin(ph) * depth * 0.561,
        0.5 * Math.sign(u) * Math.abs(u) ** 1.4 * depth * 0.63,
        -depth,
      ),
    );
  }
  return pts;
}

export function createPathSampler(): PathSampler {
  const pts = buildPathPoints();
  const path = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  path.arcLengthDivisions = 1500;
  const length = path.getLength();
  const points: THREE.Vector3[] = [];
  const tangents: THREE.Vector3[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const u = i / SAMPLES;
    points.push(path.getPointAt(u));
    tangents.push(path.getTangentAt(u));
  }
  return { length, points, tangents };
}

export function sampleAt(
  sampler: PathSampler,
  s: number,
  op: THREE.Vector3,
  ot: THREE.Vector3,
): void {
  const f = clamp(s / sampler.length) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(f));
  const k = f - i;
  op.lerpVectors(sampler.points[i], sampler.points[i + 1], k);
  ot.lerpVectors(sampler.tangents[i], sampler.tangents[i + 1], k).normalize();
}

export function computeCameraFov(aspect: number): number {
  return aspect < 16 / 9
    ? (Math.atan(0.561 / aspect) * 360) / Math.PI
    : FOV;
}

export function computeGridDimensions(aspect: number): {
  cols: number;
  rows: number;
  tanH: number;
} {
  const fov = computeCameraFov(aspect);
  const tanH = Math.tan((fov * Math.PI) / 360);
  const cols = aspect < 0.9 ? 2 : 3;
  const rows = aspect < 0.9 ? 3 : 2;
  return { cols, rows, tanH };
}

export interface GridRect {
  x: number;
  y: number;
  w: number;
  h: number;
  vw: number;
  vh: number;
  c: number;
  r: number;
}

export function computeGridRect(
  i: number,
  aspect: number,
  tanH: number,
  cols: number,
  rows: number,
): GridRect {
  const vh = 2 * GZ * tanH;
  const vw = vh * aspect;
  const gw = vw * (cols === 3 ? 0.74 : 0.88);
  const gap = gw * 0.017;
  const cw = (gw - gap * (cols - 1)) / cols;
  const ch = cw / (CARD_W / CARD_H);
  const gh = ch * rows + gap * 1.6 * (rows - 1);
  const c = i % cols;
  const r = Math.floor(i / cols);
  return {
    x: -gw / 2 + cw / 2 + c * (cw + gap),
    y: gh / 2 - ch / 2 - r * (ch + gap * 1.6),
    w: cw,
    h: ch,
    vw,
    vh,
    c,
    r,
  };
}

export interface TimelineState {
  rise: number;
  run: number;
  capOpacity: number;
  introOpacity: number;
  ruleScale: number;
  ribbonProgress: number;
}

export function computeTimelineState(pp: number): TimelineState {
  const rise = 1 - out(span(pp, 0, 0.12));
  const run = mix(-50, 76, span(pp, 0, 0.58));
  const capOpacity = 1 - span(pp, 0.52, 0.57);
  const introOpacity = 1 - span(pp, 0, 0.05);
  const ruleScale = ease(span(pp, 0.72, 0.86));
  const ribbonProgress = span(pp, RIB_A, RIB_B);
  return {
    rise,
    run,
    capOpacity,
    introOpacity,
    ruleScale,
    ribbonProgress,
  };
}

export function hitTestGridCard(
  clientX: number,
  clientY: number,
  width: number,
  height: number,
  rects: Array<GridRect | null>,
): number | null {
  if (width <= 0 || height <= 0) return null;
  const nx = clientX / width - 0.5;
  const ny = 0.5 - clientY / height;
  let hit: number | null = null;
  for (let idx = 0; idx < rects.length; idx++) {
    const g = rects[idx];
    if (!g) continue;
    const x = nx * g.vw;
    const y = ny * g.vh;
    if (Math.abs(x - g.x) < g.w / 2 && Math.abs(y - g.y) < g.h / 2) {
      hit = idx;
    }
  }
  return hit;
}
