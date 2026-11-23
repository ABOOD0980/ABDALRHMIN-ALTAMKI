import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  CARD_H,
  CARD_W,
  GZ,
  NX,
  NY,
  RIB_A,
  RIB_B,
  STEP,
  clamp,
  computeCameraFov,
  computeGridDimensions,
  computeGridRect,
  computeTimelineState,
  createPathSampler,
  hitTestGridCard,
  mix,
  out,
  sampleAt,
  span,
  type GridRect,
} from '../ribbon/math';
import { CARD_FRAGMENT_SHADER, CARD_VERTEX_SHADER } from '../ribbon/shaders';
import { R2_BASE, WORKS, type WorkItem } from '../ribbon/works';

export interface StageDomRefs {
  stage: React.RefObject<HTMLElement | null>;
  heroText: React.RefObject<HTMLDivElement | null>;
  l1: React.RefObject<HTMLSpanElement | null>;
  l2: React.RefObject<HTMLElement | null>;
  rightPane: React.RefObject<HTMLDivElement | null>;
  rule: React.RefObject<HTMLDivElement | null>;
  hint: React.RefObject<HTMLButtonElement | null>;
  name: React.RefObject<HTMLDivElement | null>;
}

interface VanteCanvasProps {
  domRefs: StageDomRefs;
  onSelectWork: (work: WorkItem) => void;
  onPhaseChange?: (phase: 'intro' | 'crossing' | 'ribbon' | 'grid') => void;
}

interface CardRuntime {
  i: number;
  work: WorkItem;
  v: HTMLVideoElement;
  tex: THREE.VideoTexture;
  geo: THREE.PlaneGeometry;
  mat: THREE.ShaderMaterial;
  mesh: THREE.Mesh;
  rect: GridRect | null;
}

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export function VanteCanvas({
  domRefs,
  onSelectWork,
  onPhaseChange,
}: VanteCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onSelectRef = useRef(onSelectWork);
  const onPhaseRef = useRef(onPhaseChange);
  onSelectRef.current = onSelectWork;
  onPhaseRef.current = onPhaseChange;

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    mountEl.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    const sampler = createPathSampler();

    const cards: CardRuntime[] = WORKS.map((work, i) => {
      const v = document.createElement('video');
      v.crossOrigin = 'anonymous';
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.src = R2_BASE + work.src;
      v.setAttribute('playsinline', '');

      const tex = new THREE.VideoTexture(v);
      tex.colorSpace = THREE.NoColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;

      const geo = new THREE.PlaneGeometry(1, 1, NX, NY);
      const mat = new THREE.ShaderMaterial({
        vertexShader: CARD_VERTEX_SHADER,
        fragmentShader: CARD_FRAGMENT_SHADER,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          map: { value: tex },
          cover: { value: new THREE.Vector2(1, 1) },
          aspect: { value: CARD_W / CARD_H },
          ready: { value: 0 },
          radius: { value: 0.018 },
        },
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      mesh.visible = false;
      scene.add(mesh);

      const markReady = () => {
        if (v.videoWidth > 0 && v.videoHeight > 0) {
          const va = v.videoWidth / v.videoHeight;
          const ca = CARD_W / CARD_H;
          mat.uniforms.cover.value.set(
            va > ca ? ca / va : 1,
            va > ca ? 1 : va / ca,
          );
          mat.uniforms.ready.value = 1;
        }
      };
      v.addEventListener('loadeddata', markReady);
      v.addEventListener('canplay', markReady);

      return { i, work, v, tex, geo, mat, mesh, rect: null };
    });

    let W = 1;
    let H = 1;
    let asp = 1;
    let cols = 3;
    let rows = 2;
    let tanH = 0.3153;

    const resize = () => {
      W = mountEl.clientWidth || window.innerWidth || 1;
      H = mountEl.clientHeight || window.innerHeight || 1;
      asp = W / H;
      renderer.setPixelRatio(
        isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
      );
      renderer.setSize(W, H, false);
      camera.aspect = asp;
      camera.fov = computeCameraFov(asp);
      camera.updateProjectionMatrix();
      const dims = computeGridDimensions(asp);
      cols = dims.cols;
      rows = dims.rows;
      tanH = dims.tanH;
      if (domRefs.name.current) {
        domRefs.name.current.style.opacity = '0';
      }
    };
    window.addEventListener('resize', resize);
    const ro = new ResizeObserver(resize);
    ro.observe(mountEl);
    resize();

    let target = 0;
    let p = 0;
    let lastPhase: 'intro' | 'crossing' | 'ribbon' | 'grid' = 'intro';

    const readScroll = () => {
      const track = document.getElementById('track');
      if (!track) return;
      const denom = Math.max(1, track.offsetHeight - window.innerHeight);
      target = clamp(window.scrollY / denom);
    };
    window.addEventListener('scroll', readScroll, { passive: true });
    readScroll();

    const op = new THREE.Vector3();
    const ot = new THREE.Vector3();
    const up = new THREE.Vector3();
    const Y = new THREE.Vector3(0, 1, 0);
    const vp = new THREE.Vector3();

    function poseRibbon(c: CardRuntime, head: number) {
      const pos = c.geo.attributes.position as THREE.BufferAttribute;
      const centre = head - c.i * STEP;
      for (let iy = 0; iy <= NY; iy++) {
        for (let ix = 0; ix <= NX; ix++) {
          const k = iy * (NX + 1) + ix;
          const lu = ix / NX - 0.5;
          const lv = 0.5 - iy / NY;
          sampleAt(sampler, centre + lu * CARD_W, op, ot);
          up.copy(Y).addScaledVector(ot, -Y.dot(ot)).normalize();
          vp.copy(op).addScaledVector(up, lv * CARD_H);
          pos.setXYZ(k, vp.x, vp.y, vp.z);
        }
      }
      pos.needsUpdate = true;
    }

    function poseGrid(c: CardRuntime, q: number) {
      const g = computeGridRect(c.i, asp, tanH, cols, rows);
      const pos = c.geo.attributes.position as THREE.BufferAttribute;
      const dx = (g.c - (cols - 1) / 2) * 1.2;
      const dy = g.r < rows / 2 ? 1 : -1;
      const ox = dx * g.vw * 0.62 * (1 - q);
      const oy = dy * g.vh * (g.c === 1 ? 0.95 : 0.34) * (1 - q);
      const tilt = (1 - q) * 0.22 * (g.c - 1 || 0.5) * dy;
      const cs = Math.cos(tilt);
      const sn = Math.sin(tilt);

      for (let iy = 0; iy <= NY; iy++) {
        for (let ix = 0; ix <= NX; ix++) {
          const k = iy * (NX + 1) + ix;
          const x = (ix / NX - 0.5) * g.w;
          const y = (0.5 - iy / NY) * g.h;
          pos.setXYZ(
            k,
            g.x + ox + x * cs - y * sn,
            g.y + oy + x * sn + y * cs,
            -GZ - (1 - q) * 0.6 * Math.sin((ix / NX) * Math.PI),
          );
        }
      }
      pos.needsUpdate = true;
      c.rect = g;
    }

    function renderFrame(pp: number) {
      const tl = computeTimelineState(pp);
      const glide = span(pp, 0.04, 0.32);
      const heroFade = 1 - span(pp, 0.16, 0.30);
      const paneFade = 1 - span(pp, 0.08, 0.24);
      const hintFade = 1 - span(pp, 0, 0.14);

      if (domRefs.l1.current) {
        domRefs.l1.current.style.transform = `translate3d(${glide * 14}vw, 0, 0)`;
      }
      if (domRefs.l2.current) {
        domRefs.l2.current.style.transform = `translate3d(${-glide * 14}vw, 0, 0)`;
      }
      if (domRefs.heroText.current) {
        domRefs.heroText.current.style.opacity = String(heroFade);
      }
      if (domRefs.rightPane.current) {
        domRefs.rightPane.current.style.opacity = String(paneFade);
      }
      if (domRefs.hint.current) {
        domRefs.hint.current.style.opacity = String(hintFade);
        domRefs.hint.current.style.pointerEvents =
          hintFade > 0.05 ? 'auto' : 'none';
      }
      if (domRefs.rule.current) {
        domRefs.rule.current.style.transform = `scaleX(${tl.ruleScale})`;
        domRefs.rule.current.style.top = '50%';
      }

      const nextPhase: 'intro' | 'crossing' | 'ribbon' | 'grid' =
        pp < 0.08
          ? 'intro'
          : pp < 0.34
            ? 'crossing'
            : pp < 0.86
              ? 'ribbon'
              : 'grid';
      if (domRefs.stage.current) {
        domRefs.stage.current.dataset.progress = pp.toFixed(3);
        domRefs.stage.current.dataset.phase = nextPhase;
      }
      if (nextPhase !== lastPhase) {
        lastPhase = nextPhase;
        onPhaseRef.current?.(nextPhase);
      }

      const head = mix(
        0,
        sampler.length + cards.length * STEP,
        tl.ribbonProgress,
      );
      for (const c of cards) {
        const s = head - c.i * STEP;
        const end = sampler.length - CARD_W;
        if (s < end) {
          c.mesh.visible = s > CARD_W;
          c.rect = null;
          if (c.mesh.visible) poseRibbon(c, head);
        } else if (c.i < cols * rows) {
          const st = mix(
            RIB_A,
            RIB_B,
            (end + c.i * STEP) / (sampler.length + cards.length * STEP),
          );
          const q = out(span(pp, st, st + 0.13));
          c.mesh.visible = q > 0.001;
          if (c.mesh.visible) poseGrid(c, q);
          else c.rect = null;
        } else {
          c.mesh.visible = false;
          c.rect = null;
        }
      }

      renderer.render(scene, camera);
    }

    const stageEl = domRefs.stage.current;
    const handlePointerMove = (e: PointerEvent) => {
      const nameEl = domRefs.name.current;
      if (!nameEl || !stageEl) return;
      const rect = stageEl.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      let hitCard: CardRuntime | null = null;
      if (p > 0.86) {
        const hitIdx = hitTestGridCard(
          localX,
          localY,
          W,
          H,
          cards.map((c) => c.rect),
        );
        if (hitIdx !== null) hitCard = cards[hitIdx];
      }
      nameEl.style.opacity = hitCard ? '1' : '0';
      stageEl.style.cursor = hitCard ? 'pointer' : '';
      if (hitCard) {
        nameEl.textContent = hitCard.work.title;
        nameEl.style.transform = `translate(${localX + 14}px,${localY + 16}px)`;
      }
    };

    const handleStageClick = (e: MouseEvent) => {
      if (p <= 0.86 || !stageEl) return;
      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest('button, a, header, footer')) return;
      const rect = stageEl.getBoundingClientRect();
      const hitIdx = hitTestGridCard(
        e.clientX - rect.left,
        e.clientY - rect.top,
        W,
        H,
        cards.map((c) => c.rect),
      );
      if (hitIdx !== null) {
        onSelectRef.current(cards[hitIdx].work);
      }
    };

    stageEl?.addEventListener('pointermove', handlePointerMove);
    stageEl?.addEventListener('click', handleStageClick);

    let disposed = false;
    let rafId = 0;
    let timerId = 0;
    let lastTickTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            timerId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            timerId = window.setTimeout(cb, 80);
          }
        };
        timerId = window.setTimeout(poll, 5);
      } else {
        timerId = window.setTimeout(cb, 80);
      }
    }

    function loop() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.max(16, now - lastTickTime);
      lastTickTime = now;

      if (isSoftwareGl) {
        const factor = 1 - Math.pow(1 - 0.09, Math.min(6, dt / 16.667));
        p += (target - p) * factor;
      } else {
        p += (target - p) * 0.09;
      }
      if (Math.abs(target - p) < 0.00005) p = target;

      for (const c of cards) {
        if (c.mesh.visible && c.v.paused) {
          c.v.play().catch(() => {});
        } else if (!c.mesh.visible && !c.v.paused) {
          c.v.pause();
        }
      }

      renderFrame(p);

      if (isSoftwareGl) {
        afterDraw(loop);
      } else {
        rafId = window.requestAnimationFrame(loop);
      }
    }

    loop();

    return () => {
      disposed = true;
      ro.disconnect();
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', readScroll);
      stageEl?.removeEventListener('pointermove', handlePointerMove);
      stageEl?.removeEventListener('click', handleStageClick);
      for (const c of cards) {
        c.v.pause();
        c.v.src = '';
        c.tex.dispose();
        c.geo.dispose();
        c.mat.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === mountEl) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, [domRefs]);

  return <div id="gl" ref={mountRef} data-testid="vante-webgl" />;
}
