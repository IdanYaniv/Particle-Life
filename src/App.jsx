import { useEffect, useRef, useState, useCallback } from 'react';
import { createPhysics } from './simulation/physics.js';
import { genesis, randomInteractionMatrix } from './simulation/genesis.js';
import { createMutation } from './simulation/mutation.js';
import { createWebGLRenderer } from './rendering/renderer.js';
import { getRandomPalette, getPalette } from './palettes.js';
import Panel from './ui/Panel.jsx';

const DEFAULT_PARTICLE_COUNT = 4000;

function isColorDark(hex) {
  if (!hex || hex.length < 7) return false;
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return (0.299*r + 0.587*g + 0.114*b) / 255 < 0.5;
}

export default function App() {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const simRef = useRef(null);

  // Cursor magnet
  const cursorRef = useRef({ x: -99999, y: -99999, active: false });
  const cursorIntensityRef = useRef(0.3);

  // Drawing strokes
  const strokesRef = useRef([]);   // [{pts:[{x,y}], endTime:null}]
  const drawingRef = useRef(false);

  // Track bgColor for overlay rendering
  const bgColorRef = useRef('#f5f0eb');

  const [panelState, setPanelState] = useState({
    speed: 1.0,
    damping: 0.985,
    rmax: 80,
    cursorIntensity: 0.3,
    paletteName: '',
    bgColor: '#f5f0eb',
    trailFade: 0.03,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    overlay.width = W;
    overlay.height = H;

    const { name: paletteName, colors } = getRandomPalette();
    const interactionMatrix = randomInteractionMatrix();

    // Randomize simulation params each load
    const initSpeed     = parseFloat((0.6 + Math.random() * 1.2).toFixed(2));
    const initDamping   = parseFloat((0.975 + Math.random() * 0.018).toFixed(3));
    const initRmax      = 2 * Math.round((35 + Math.random() * 95) / 2);
    const initTrailFade = parseFloat((0.01 + Math.random() * 0.07).toFixed(3));

    const physics = createPhysics({ width: W, height: H, particleCount: DEFAULT_PARTICLE_COUNT, interactionMatrix, speed: initSpeed, damping: initDamping, rmax: initRmax });
    genesis(physics, W, H);

    // Mutation is kept ready but disabled — re-enable by uncommenting these two lines
    const mutation = createMutation(physics.SPECIES_COUNT);
    // physics.setMutation(mutation);

    const renderer = createWebGLRenderer(canvas);
    renderer.resize(W, H);
    renderer.setTrailFade(initTrailFade);

    const sim = { physics, mutation, renderer, colors: [...colors], paletteName };
    simRef.current = sim;
    setPanelState(prev => ({ ...prev, paletteName, speed: initSpeed, damping: initDamping, rmax: initRmax, trailFade: initTrailFade }));

    // --- Animation loop ---
    let last = performance.now();
    let animId;
    let paused = false;

    function loop(now) {
      const dt = Math.min(0.0167, (now - last) / 1000);
      last = now;

      if (!paused) {
        // Pass cursor to physics
        const { x, y, active } = cursorRef.current;
        physics.setCursor(active ? x : -99999, active ? y : -99999, cursorIntensityRef.current);

        // Build stroke force points — physics lasts 8s (5s visual + 3s extra)
        const physPts = [];
        for (const stroke of strokesRef.current) {
          const age = stroke.endTime ? (now - stroke.endTime) : 0;
          const alpha = stroke.endTime ? Math.max(0, 1 - age / 8000) : 1;
          if (alpha <= 0) continue;
          // Include every point — nearest-point logic in physics handles multi-stroke correctly
          for (let i = 0; i < stroke.pts.length; i++) {
            physPts.push({ x: stroke.pts[i].x, y: stroke.pts[i].y, alpha });
          }
        }
        physics.setStrokeForces(physPts);

        // Mutation disabled — uncomment to re-enable:
        // mutation.step(physics.M, dt, physics.width, physics.height);
        physics.step(dt);
      }

      renderer.render(physics, sim.colors);

      // Render stroke overlay
      const ctx = overlay.getContext('2d');
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      const dark = isColorDark(bgColorRef.current);
      overlay.style.mixBlendMode = dark ? 'screen' : 'multiply';

      for (const stroke of strokesRef.current) {
        const pts = stroke.pts;
        if (pts.length < 2) continue;
        const age = stroke.endTime ? (now - stroke.endTime) : 0;
        const alpha = stroke.endTime ? Math.max(0, 1 - age / 5000) : 1;
        if (alpha <= 0) continue;

        const fillColor = dark
          ? `rgba(255,210,160,${alpha * 0.88})`
          : `rgba(60,20,100,${alpha * 0.65})`;

        // Per-point speeds (distance from previous point)
        const speeds = [0];
        for (let i = 1; i < pts.length; i++) {
          const dx = pts[i].x - pts[i-1].x, dy = pts[i].y - pts[i-1].y;
          speeds.push(Math.sqrt(dx*dx + dy*dy));
        }
        // Smooth speeds with 3-point average
        const sm = speeds.map((s, i) =>
          (speeds[Math.max(0,i-1)] + s + speeds[Math.min(speeds.length-1,i+1)]) / 3
        );

        // Per-point half-widths: taper at ends + thinner when drawn fast
        const maxHalf = 14 * alpha;
        const hw = pts.map((_, i) => {
          const t = i / (pts.length - 1);
          const taper = Math.sin(t * Math.PI);
          const speedF = Math.max(0.12, 1 - sm[i] * 0.045);
          return Math.max(0.5, maxHalf * taper * speedF);
        });

        // Per-point normals (perpendicular to path direction)
        const normals = pts.map((_, i) => {
          const prev = pts[Math.max(0, i-1)], next = pts[Math.min(pts.length-1, i+1)];
          const dx = next.x - prev.x, dy = next.y - prev.y;
          const len = Math.sqrt(dx*dx + dy*dy) || 1;
          return { x: -dy/len, y: dx/len };
        });

        // Build left/right outline of the variable-width stroke
        const L = pts.map((p, i) => ({ x: p.x + normals[i].x * hw[i], y: p.y + normals[i].y * hw[i] }));
        const R = pts.map((p, i) => ({ x: p.x - normals[i].x * hw[i], y: p.y - normals[i].y * hw[i] }));

        ctx.save();
        ctx.fillStyle = fillColor;
        ctx.shadowBlur = dark ? 10 : 4;
        ctx.shadowColor = fillColor;

        ctx.beginPath();
        ctx.moveTo(L[0].x, L[0].y);
        for (let i = 1; i < L.length; i++) {
          const mx = (L[i-1].x + L[i].x) / 2, my = (L[i-1].y + L[i].y) / 2;
          ctx.quadraticCurveTo(L[i-1].x, L[i-1].y, mx, my);
        }
        ctx.lineTo(L[L.length-1].x, L[L.length-1].y);
        for (let i = R.length - 1; i >= 0; i--) {
          if (i < R.length - 1) {
            const mx = (R[i+1].x + R[i].x) / 2, my = (R[i+1].y + R[i].y) / 2;
            ctx.quadraticCurveTo(R[i+1].x, R[i+1].y, mx, my);
          } else {
            ctx.lineTo(R[i].x, R[i].y);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Expire strokes after 8s (physics active 8s, visual 5s)
      strokesRef.current = strokesRef.current.filter(s =>
        !s.endTime || (now - s.endTime) < 8000
      );

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    // --- Window resize ---
    function onResize() {
      const nW = window.innerWidth, nH = window.innerHeight;
      overlay.width = nW;
      overlay.height = nH;
      renderer.resize(nW, nH);
      physics.resize(nW, nH);
    }

    // --- Cursor tracking (window level, always) ---
    function onWindowMouseMove(e) {
      cursorRef.current.x = e.clientX;
      cursorRef.current.y = e.clientY;
    }

    // --- Drawing events (canvas only) ---
    function onCanvasMouseDown(e) {
      drawingRef.current = true;
      strokesRef.current.push({ pts: [{ x: e.clientX, y: e.clientY }], endTime: null });
    }

    function onCanvasMouseMove(e) {
      if (!drawingRef.current) return;
      const stroke = strokesRef.current[strokesRef.current.length - 1];
      if (!stroke || stroke.endTime) return;
      const last = stroke.pts[stroke.pts.length - 1];
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      if (dx*dx + dy*dy > 64 && stroke.pts.length < 80) { // min 8px spacing, max 80 pts
        stroke.pts.push({ x: e.clientX, y: e.clientY });
      }
    }

    function onWindowMouseUp() {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      const stroke = strokesRef.current[strokesRef.current.length - 1];
      if (stroke && !stroke.endTime) stroke.endTime = performance.now();
    }

    // Cursor active tracking
    function onCanvasEnter() { cursorRef.current.active = true; }
    function onCanvasLeave() { cursorRef.current.active = false; }

    // --- Keyboard shortcuts ---
    function onKeyDown(e) {
      if (e.target.tagName === 'INPUT') return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          paused = !paused;
          break;
        case 'KeyF':
          if (!document.fullscreenElement) document.documentElement.requestFullscreen();
          else document.exitFullscreen();
          break;
        case 'KeyS':
          if (e.shiftKey) {
            e.preventDefault();
            const link = document.createElement('a');
            link.download = `particle-life-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          }
          break;
      }
    }

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('mouseenter', onCanvasEnter);
    canvas.addEventListener('mouseleave', onCanvasLeave);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
      canvas.removeEventListener('mousedown', onCanvasMouseDown);
      canvas.removeEventListener('mousemove', onCanvasMouseMove);
      canvas.removeEventListener('mouseenter', onCanvasEnter);
      canvas.removeEventListener('mouseleave', onCanvasLeave);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleUpdate = useCallback((updates) => {
    const sim = simRef.current;
    if (!sim) return;
    const { physics, renderer } = sim;

    if ('speed' in updates) physics.setSpeed(updates.speed);
    if ('damping' in updates) physics.setDamping(updates.damping);
    if ('rmax' in updates) physics.setRmax(updates.rmax);
    if ('cursorIntensity' in updates) cursorIntensityRef.current = updates.cursorIntensity;
    if ('trailFade' in updates) renderer.setTrailFade(updates.trailFade);
    if ('bgColor' in updates) {
      renderer.setBgColor(updates.bgColor);
      bgColorRef.current = updates.bgColor;
    }
    if ('palette' in updates) {
      const colors = getPalette(updates.palette);
      sim.colors = [...colors];
      sim.paletteName = updates.palette;
      updates.paletteName = updates.palette;
    }
    if ('shuffle' in updates) {
      const M = physics.M;
      for (let a = 0; a < 5; a++)
        for (let b = 0; b < 5; b++)
          M[a][b] = +(Math.random() * 2 - 1).toFixed(2);
    }

    setPanelState(prev => {
      const next = { ...prev };
      for (const key in updates) {
        if (key !== 'shuffle' && key !== 'palette') next[key] = updates[key];
        if (key === 'paletteName') next.paletteName = updates.paletteName;
      }
      return next;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    const sim = simRef.current;
    if (!sim) return;
    const { physics, renderer } = sim;
    const { name: paletteName, colors } = getRandomPalette();
    const newMatrix = randomInteractionMatrix();
    for (let a = 0; a < 5; a++)
      for (let b = 0; b < 5; b++)
        physics.M[a][b] = newMatrix[a][b];
    genesis(physics, physics.width, physics.height);
    sim.colors = [...colors];
    sim.paletteName = paletteName;
    // Randomize simulation params
    const newSpeed     = parseFloat((0.6 + Math.random() * 1.2).toFixed(2));
    const newDamping   = parseFloat((0.975 + Math.random() * 0.018).toFixed(3));
    const newRmax      = 2 * Math.round((35 + Math.random() * 95) / 2);
    const newTrailFade = parseFloat((0.01 + Math.random() * 0.07).toFixed(3));
    physics.setSpeed(newSpeed);
    physics.setDamping(newDamping);
    physics.setRmax(newRmax);
    renderer.setTrailFade(newTrailFade);
    // Clear FBOs by re-applying current bgColor
    renderer.setBgColor(bgColorRef.current);
    // Clear strokes
    strokesRef.current = [];
    setPanelState(prev => ({ ...prev, paletteName, speed: newSpeed, damping: newDamping, rmax: newRmax, trailFade: newTrailFade }));
  }, []);

  return (
    <>
      <canvas ref={canvasRef} />
      <canvas
        ref={overlayRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <Panel state={panelState} onUpdate={handleUpdate} onRefresh={handleRefresh} />
    </>
  );
}
