// Mutation Layer — controlled instability
// Drift, not noise. Weather, not static.
//
// Three subsystems:
//   1. Interaction matrix drift — values lerp toward random targets
//   2. Drift speed modulation — simplex noise varies drift rate
//   3. Local force anomalies — temporary attractors/repulsors

// ---- Lightweight 2D simplex noise ----
// Adapted from Stefan Gustavson's implementation

const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

const grad2 = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

// Deterministic permutation table
const perm = new Uint8Array(512);
const p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,
  69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,
  219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,
  68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,
  133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,
  80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,
  109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,
  85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,
  152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,
  108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,
  210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,
  199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,
  114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

for (let i = 0; i < 256; i++) {
  perm[i] = p[i];
  perm[i + 256] = p[i];
}

function simplex2(x, y) {
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = x - X0;
  const y0 = y - Y0;

  let i1, j1;
  if (x0 > y0) { i1 = 1; j1 = 0; }
  else { i1 = 0; j1 = 1; }

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1.0 + 2.0 * G2;
  const y2 = y0 - 1.0 + 2.0 * G2;

  const ii = i & 255;
  const jj = j & 255;

  let n0 = 0, n1 = 0, n2 = 0;

  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 > 0) {
    t0 *= t0;
    const gi = perm[ii + perm[jj]] % 8;
    n0 = t0 * t0 * (grad2[gi][0] * x0 + grad2[gi][1] * y0);
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 > 0) {
    t1 *= t1;
    const gi = perm[ii + i1 + perm[jj + j1]] % 8;
    n1 = t1 * t1 * (grad2[gi][0] * x1 + grad2[gi][1] * y1);
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 > 0) {
    t2 *= t2;
    const gi = perm[ii + 1 + perm[jj + 1]] % 8;
    n2 = t2 * t2 * (grad2[gi][0] * x2 + grad2[gi][1] * y2);
  }

  return 70.0 * (n0 + n1 + n2); // Returns -1 to 1
}

// ---- Mutation system ----

export function createMutation(speciesCount) {
  const S = speciesCount;

  // Drift targets — what each M[i][j] is walking toward
  const targets = [];
  for (let a = 0; a < S; a++) {
    targets[a] = [];
    for (let b = 0; b < S; b++) {
      targets[a][b] = Math.random() * 2 - 1;
    }
  }

  // Force anomalies (temporary attractors/repulsors)
  let anomalies = [];
  let anomalyTimer = 0;

  // Time accumulator for simplex noise
  let time = 0;

  // Global intensity (0 = deterministic, 1 = chaos)
  let intensity = 0.3;
  let anomaliesEnabled = true;

  function step(M, dt, W, H) {
    time += dt;

    // Base drift rate, modulated by intensity
    const baseDriftRate = 0.001 * intensity;

    // Drift each matrix value toward its target
    for (let a = 0; a < S; a++) {
      for (let b = 0; b < S; b++) {
        // Simplex noise modulates drift speed per cell
        const noiseVal = simplex2(a * 1.7 + time * 0.1, b * 1.7 + time * 0.13);
        const driftSpeed = baseDriftRate * (1.0 + noiseVal * 0.8);

        // Lerp toward target
        M[a][b] += (targets[a][b] - M[a][b]) * driftSpeed;

        // When close to target, pick a new one
        if (Math.abs(M[a][b] - targets[a][b]) < 0.02) {
          targets[a][b] = Math.random() * 2 - 1;
        }
      }
    }

    // Force anomalies
    if (anomaliesEnabled && intensity > 0) {
      anomalyTimer += dt;

      // Spawn anomaly every few seconds, frequency scales with intensity
      const spawnInterval = 4.0 / (0.5 + intensity);
      if (anomalyTimer > spawnInterval) {
        anomalyTimer = 0;
        anomalies.push({
          x: Math.random() * W,
          y: Math.random() * H,
          strength: (Math.random() - 0.5) * 2 * intensity, // attractor or repulsor
          life: 2.0 + Math.random() * 1.5,
          maxLife: 2.0 + Math.random() * 1.5,
        });
      }

      // Decay and remove dead anomalies
      for (let i = anomalies.length - 1; i >= 0; i--) {
        anomalies[i].life -= dt;
        if (anomalies[i].life <= 0) {
          anomalies.splice(i, 1);
        }
      }
    }
  }

  // Apply anomaly forces to a particle — called from physics step
  function applyAnomalies(px, py) {
    let ax = 0;
    let ay = 0;

    for (let k = 0; k < anomalies.length; k++) {
      const a = anomalies[k];
      const dx = a.x - px;
      const dy = a.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 200 || dist < 1) continue;

      // Strength decays with lifetime (envelope: ramp up then down)
      const lifeRatio = a.life / a.maxLife;
      const envelope = lifeRatio < 0.2
        ? lifeRatio / 0.2
        : (1.0 - lifeRatio) / 0.8;

      const force = a.strength * envelope / (dist * 0.05);
      ax += (dx / dist) * force;
      ay += (dy / dist) * force;
    }

    return [ax, ay];
  }

  function setIntensity(v) { intensity = Math.max(0, Math.min(1, v)); }
  function getIntensity() { return intensity; }
  function setAnomaliesEnabled(v) { anomaliesEnabled = v; }
  function getAnomalies() { return anomalies; }

  return {
    step,
    applyAnomalies,
    setIntensity,
    getIntensity,
    setAnomaliesEnabled,
    getAnomalies,
  };
}
