// Physics engine — ported from V1.3
// Interaction matrix, spatial hash grid, force calculation, soft boundary

const SPECIES_COUNT = 5;
const RCORE_FRAC = 0.25;
const MAX_FORCE = 200;
const JITTER = 0.01;

// Size tiers for mixed sizes (multipliers of base size)
const SIZE_TIERS = [0.6, 0.8, 1.0, 1.2, 1.4];

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

  // Particle arrays
  const x = new Float32Array(N);
  const y = new Float32Array(N);
  const vx = new Float32Array(N);
  const vy = new Float32Array(N);
  const species = new Uint8Array(N);
  const sizeTier = new Uint8Array(N);

  // Interaction matrix (S x S)
  const M = interactionMatrix;

  // Mutation layer reference (set externally)
  let mutation = null;

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
      let ax = 0;
      let ay = 0;
      const ai = species[i];
      const cx = Math.floor(x[i] / cellSize);
      const cy = Math.floor(y[i] / cellSize);

      // Check 3x3 neighborhood
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
            const r2 = dx * dx + dy * dy;
            if (r2 === 0 || r2 > RMAX * RMAX) continue;

            const r = Math.sqrt(r2);
            const s = M[ai][species[j]];
            const rcore = RMAX * RCORE_FRAC;

            let f = 0;
            if (r < rcore) {
              f = -1.0 * (rcore - r) / rcore;
            } else {
              const t = (r - rcore) / (RMAX - rcore);
              f = s * (1 - t * t);
            }

            const invr = 1.0 / (r + 1e-6);
            ax += dx * invr * f;
            ay += dy * invr * f;
          }
        }
      }

      // Apply mutation anomaly forces
      if (mutation) {
        const [mfx, mfy] = mutation.applyAnomalies(x[i], y[i]);
        ax += mfx;
        ay += mfy;
      }

      // Cap force magnitude
      const mag = Math.hypot(ax, ay);
      if (mag > MAX_FORCE) {
        ax *= MAX_FORCE / mag;
        ay *= MAX_FORCE / mag;
      }

      // Apply velocity with jitter and damping
      vx[i] = (vx[i] + ax * dtSpeed + (Math.random() - 0.5) * JITTER) * DAMP;
      vy[i] = (vy[i] + ay * dtSpeed + (Math.random() - 0.5) * JITTER) * DAMP;

      // Update position
      x[i] += vx[i] * dtSpeed;
      y[i] += vy[i] * dtSpeed;

      // Soft boundary — repulsion force near edges
      const margin = 40;
      const boundaryForce = 0.5;

      if (x[i] < margin) {
        vx[i] += (margin - x[i]) / margin * boundaryForce;
      } else if (x[i] > W - margin) {
        vx[i] -= (x[i] - (W - margin)) / margin * boundaryForce;
      }

      if (y[i] < margin) {
        vy[i] += (margin - y[i]) / margin * boundaryForce;
      } else if (y[i] > H - margin) {
        vy[i] -= (y[i] - (H - margin)) / margin * boundaryForce;
      }

      // Hard clamp as safety net
      if (x[i] < 0) { x[i] = 0; vx[i] = Math.abs(vx[i]) * 0.5; }
      if (x[i] > W) { x[i] = W; vx[i] = -Math.abs(vx[i]) * 0.5; }
      if (y[i] < 0) { y[i] = 0; vy[i] = Math.abs(vy[i]) * 0.5; }
      if (y[i] > H) { y[i] = H; vy[i] = -Math.abs(vy[i]) * 0.5; }
    }
  }

  function resize(newW, newH) {
    const scaleX = newW / W;
    const scaleY = newH / H;
    W = newW;
    H = newH;
    for (let i = 0; i < N; i++) {
      x[i] *= scaleX;
      y[i] *= scaleY;
    }
    gridInit();
  }

  function setMutation(m) { mutation = m; }
  function setSpeed(v) { SPEED = v; }
  function setDamping(v) { DAMP = v; }
  function setRmax(v) {
    RMAX = v;
    gridInit();
  }

  gridInit();

  return {
    x, y, vx, vy, species, sizeTier,
    M,
    step,
    resize,
    setMutation,
    setSpeed,
    setDamping,
    setRmax,
    get particleCount() { return N; },
    get width() { return W; },
    get height() { return H; },
    get rmax() { return RMAX; },
    SIZE_TIERS,
    SPECIES_COUNT,
  };
}
