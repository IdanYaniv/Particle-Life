// Physics engine — ported from V1.3
// Interaction matrix, spatial hash grid, force calculation, soft boundary

const SPECIES_COUNT = 5;
const RCORE_FRAC = 0.25;
const MAX_FORCE = 200;
const JITTER = 0.01;

// Size tiers: multipliers of base size (renderer baseSize = 12px)
const SIZE_TIERS = [0.5, 0.9, 1.4, 2.0, 3.0];

export function createPhysics(config) {
  const {
    width,
    height,
    particleCount,
    interactionMatrix,
    speed = 1.0,
    damping = 0.985,
    rmax = 80,
  } = config;

  let W = width;
  let H = height;
  let N = particleCount;
  let SPEED = speed;
  let DAMP = damping;
  let RMAX = rmax;

  const x = new Float32Array(N);
  const y = new Float32Array(N);
  const vx = new Float32Array(N);
  const vy = new Float32Array(N);
  const species = new Uint8Array(N);
  const sizeTier = new Uint8Array(N);

  const M = interactionMatrix;
  let mutation = null;

  // Cursor magnet
  let cursorX = -99999, cursorY = -99999, cursorIntensity = 0;

  // Stroke attractor points [{x, y, alpha}]
  let strokeForcePoints = [];

  // Spatial grid
  let cellSize, cols, rows, head, next;

  function gridInit() {
    cellSize = Math.max(8, RMAX | 0);
    cols = Math.ceil(W / cellSize);
    rows = Math.ceil(H / cellSize);
    head = new Int32Array(cols * rows).fill(-1);
    next = new Int32Array(N).fill(-1);
  }

  function gridBuild() {
    head.fill(-1);
    const inv = 1.0 / cellSize;
    const maxCol = cols - 1;
    const maxRow = rows - 1;
    for (let i = 0; i < N; i++) {
      let cx = (x[i] * inv) | 0;
      let cy = (y[i] * inv) | 0;
      cx = cx < 0 ? 0 : cx > maxCol ? maxCol : cx;
      cy = cy < 0 ? 0 : cy > maxRow ? maxRow : cy;
      const h = cy * cols + cx;
      next[i] = head[h];
      head[h] = i;
    }
  }

  function step(dt) {
    gridBuild();
    const dtSpeed = dt * SPEED;

    for (let i = 0; i < N; i++) {
      let ax = 0, ay = 0;
      const ai = species[i];
      const cx = Math.floor(x[i] / cellSize);
      const cy = Math.floor(y[i] / cellSize);

      // Particle-particle forces (spatial grid)
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const nx = cx + ox;
          const ny = cy + oy;
          if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
          const h = ny * cols + nx;
          for (let j = head[h]; j !== -1; j = next[j]) {
            if (j === i) continue;
            const dx = x[j] - x[i];
            const dy = y[j] - y[i];
            const r2 = dx*dx + dy*dy;
            if (r2 === 0 || r2 > RMAX*RMAX) continue;
            const r = Math.sqrt(r2);
            const s = M[ai][species[j]];
            const rcore = RMAX * RCORE_FRAC;
            let f = 0;
            if (r < rcore) {
              f = -1.0 * (rcore - r) / rcore;
            } else {
              const t = (r - rcore) / (RMAX - rcore);
              f = s * (1 - t*t);
            }
            const invr = 1.0 / (r + 1e-6);
            ax += dx * invr * f;
            ay += dy * invr * f;
          }
        }
      }

      // Mutation anomaly forces
      if (mutation) {
        const [mfx, mfy] = mutation.applyAnomalies(x[i], y[i]);
        ax += mfx; ay += mfy;
      }

      // Cursor magnet force
      if (cursorIntensity > 0) {
        const cdx = cursorX - x[i];
        const cdy = cursorY - y[i];
        const cd2 = cdx*cdx + cdy*cdy;
        const cursorR = 200;
        if (cd2 < cursorR*cursorR && cd2 > 0.01) {
          const cd = Math.sqrt(cd2);
          const t = 1 - cd / cursorR;
          const cf = t * t * cursorIntensity * 50;
          ax += (cdx/cd) * cf;
          ay += (cdy/cd) * cf;
        }
      }

      // Stroke attractor forces — each particle attracted to its nearest stroke point only
      const sR = 160;
      let bestSF = 0, bestSdx = 0, bestSdy = 0;
      for (let si = 0; si < strokeForcePoints.length; si++) {
        const sp = strokeForcePoints[si];
        const sdx = sp.x - x[i];
        const sdy = sp.y - y[i];
        const sd2 = sdx*sdx + sdy*sdy;
        if (sd2 < sR*sR && sd2 > 0.01) {
          const sd = Math.sqrt(sd2);
          const t = 1 - sd / sR;
          const sf = t * t * sp.alpha * 96;
          if (sf > bestSF) { bestSF = sf; bestSdx = sdx/sd; bestSdy = sdy/sd; }
        }
      }
      if (bestSF > 0) { ax += bestSdx * bestSF; ay += bestSdy * bestSF; }

      // Cap force magnitude
      const mag = Math.hypot(ax, ay);
      if (mag > MAX_FORCE) { ax *= MAX_FORCE/mag; ay *= MAX_FORCE/mag; }

      // Velocity update
      vx[i] = (vx[i] + ax*dtSpeed + (Math.random()-0.5)*JITTER) * DAMP;
      vy[i] = (vy[i] + ay*dtSpeed + (Math.random()-0.5)*JITTER) * DAMP;

      x[i] += vx[i] * dtSpeed;
      y[i] += vy[i] * dtSpeed;

      // Soft boundary — edge repulsion
      const margin = 40;
      const bf = 0.5;
      if (x[i] < margin)       vx[i] += (margin - x[i]) / margin * bf;
      else if (x[i] > W-margin) vx[i] -= (x[i] - (W-margin)) / margin * bf;
      if (y[i] < margin)       vy[i] += (margin - y[i]) / margin * bf;
      else if (y[i] > H-margin) vy[i] -= (y[i] - (H-margin)) / margin * bf;

      // Corner escape — extra diagonal push out of corners
      const cm = 80;
      const inL = x[i] < cm, inR = x[i] > W-cm;
      const inT = y[i] < cm, inB = y[i] > H-cm;
      if ((inL || inR) && (inT || inB)) {
        const dx2 = inL ? x[i] : W - x[i];
        const dy2 = inT ? y[i] : H - y[i];
        const nearness = 1 - Math.min(dx2, dy2) / cm;
        const cf2 = nearness * 1.2;
        if (inL) vx[i] += cf2;
        if (inR) vx[i] -= cf2;
        if (inT) vy[i] += cf2;
        if (inB) vy[i] -= cf2;
      }

      // Hard clamp safety net
      if (x[i] < 0)  { x[i] = 0;  vx[i] = Math.abs(vx[i])*0.5; }
      if (x[i] > W)  { x[i] = W;  vx[i] = -Math.abs(vx[i])*0.5; }
      if (y[i] < 0)  { y[i] = 0;  vy[i] = Math.abs(vy[i])*0.5; }
      if (y[i] > H)  { y[i] = H;  vy[i] = -Math.abs(vy[i])*0.5; }
    }
  }

  function resize(newW, newH) {
    const sx = newW/W, sy = newH/H;
    W = newW; H = newH;
    for (let i = 0; i < N; i++) { x[i] *= sx; y[i] *= sy; }
    gridInit();
  }

  function setMutation(m) { mutation = m; }
  function setSpeed(v) { SPEED = v; }
  function setDamping(v) { DAMP = v; }
  function setRmax(v) { RMAX = v; gridInit(); }
  function setCursor(cx, cy, intensity) { cursorX = cx; cursorY = cy; cursorIntensity = intensity; }
  function setStrokeForces(pts) { strokeForcePoints = pts; }

  gridInit();

  return {
    x, y, vx, vy, species, sizeTier,
    M,
    step, resize,
    setMutation, setSpeed, setDamping, setRmax,
    setCursor, setStrokeForces,
    get particleCount() { return N; },
    get width() { return W; },
    get height() { return H; },
    get rmax() { return RMAX; },
    SIZE_TIERS,
    SPECIES_COUNT,
  };
}
