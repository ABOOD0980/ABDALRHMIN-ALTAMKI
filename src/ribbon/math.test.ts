import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  buildPathPoints,
  createPathSampler,
  sampleAt,
  computeCameraFov,
  computeGridDimensions,
  computeGridRect,
  computeTimelineState,
  hitTestGridCard,
  FOV,
} from './math';

test('buildPathPoints constructs 161 points spanning 5.4 to 24.0 depth', () => {
  const pts = buildPathPoints();
  assert.equal(pts.length, 161);

  let minDepth = Infinity;
  let maxDepth = -Infinity;
  for (const pt of pts) {
    const depth = -pt.z;
    if (depth < minDepth) minDepth = depth;
    if (depth > maxDepth) maxDepth = depth;
  }

  assert.ok(minDepth >= 5.39 && minDepth <= 5.5, `minDepth=${minDepth}`);
  assert.ok(maxDepth >= 23.8 && maxDepth <= 24.01, `maxDepth=${maxDepth}`);
});

test('createPathSampler and sampleAt interpolate and clamp smoothly', () => {
  const sampler = createPathSampler();
  assert.equal(sampler.points.length, 1201);
  assert.equal(sampler.tangents.length, 1201);
  assert.ok(sampler.length > 20);

  const p = new THREE.Vector3();
  const t = new THREE.Vector3();

  sampleAt(sampler, -5, p, t);
  assert.ok(Math.abs(t.length() - 1) < 1e-5);
  assert.ok(p.distanceTo(sampler.points[0]) < 1e-5);

  sampleAt(sampler, sampler.length + 10, p, t);
  assert.ok(Math.abs(t.length() - 1) < 1e-5);
  assert.ok(p.distanceTo(sampler.points[1200]) < 1e-5);
});

test('computeCameraFov keeps 35deg on >=16:9 and expands horizontally on narrow viewports', () => {
  assert.equal(computeCameraFov(16 / 9), FOV);
  assert.equal(computeCameraFov(2.0), FOV);

  const narrowFov = computeCameraFov(390 / 844);
  assert.ok(narrowFov > 90 && narrowFov < 110, `narrowFov=${narrowFov}`);
});

test('computeGridDimensions switches 3x2 vs 2x3 at aspect 0.9', () => {
  const desktop = computeGridDimensions(1440 / 900);
  assert.equal(desktop.cols, 3);
  assert.equal(desktop.rows, 2);

  const mobile = computeGridDimensions(390 / 844);
  assert.equal(mobile.cols, 2);
  assert.equal(mobile.rows, 3);
});

test('computeTimelineState matches exact key scroll milestones', () => {
  const s0 = computeTimelineState(0);
  assert.equal(s0.rise, 1);
  assert.equal(s0.run, -50);
  assert.equal(s0.introOpacity, 1);
  assert.equal(s0.capOpacity, 1);
  assert.equal(s0.ruleScale, 0);

  const s05 = computeTimelineState(0.05);
  assert.equal(s05.introOpacity, 0);

  const s12 = computeTimelineState(0.12);
  assert.equal(s12.rise, 0);

  const s24 = computeTimelineState(0.24);
  assert.ok(Math.abs(s24.run) < 3, `run at 0.24 should cross near 0, got ${s24.run}`);

  const s57 = computeTimelineState(0.57);
  assert.equal(s57.capOpacity, 0);

  const s86 = computeTimelineState(0.86);
  assert.equal(s86.ruleScale, 1);
});

test('hitTestGridCard resolves grid coordinates accurately', () => {
  const { cols, rows, tanH } = computeGridDimensions(1440 / 900);
  const rects = Array.from({ length: 6 }, (_, i) =>
    computeGridRect(i, 1440 / 900, tanH, cols, rows),
  );

  // Center of top-left card (index 0): x < 0, y > 0
  const g0 = rects[0];
  const px0 = (g0.x / g0.vw + 0.5) * 1440;
  const py0 = (0.5 - g0.y / g0.vh) * 900;
  assert.equal(hitTestGridCard(px0, py0, 1440, 900, rects), 0);

  // Far corner margin outside cards
  assert.equal(hitTestGridCard(10, 10, 1440, 900, rects), null);
});
