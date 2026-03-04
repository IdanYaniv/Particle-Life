// Genesis — randomized starting conditions
// Every load produces a unique composition

const SPECIES_COUNT = 5;

function randomMatrix() {
  const M = [];
  for (let a = 0; a < SPECIES_COUNT; a++) {
    M[a] = [];
    for (let b = 0; b < SPECIES_COUNT; b++) {
      M[a][b] = +(Math.random() * 2 - 1).toFixed(2);
    }
  }
  return M;
}

// Size tiers [0.5, 0.9, 1.4, 2.0, 3.0] — 3.0 appears ~10%, rest share equally
function weightedTier() {
  const r = Math.random();
  if (r < 0.225) return 0; // 0.5×
  if (r < 0.450) return 1; // 0.9×
  if (r < 0.675) return 2; // 1.4×
  if (r < 0.900) return 3; // 2.0×
  return 4;                 // 3.0× (10%)
}

function uniformDistribution(x, y, W, H, N) {
  for (let i = 0; i < N; i++) {
    x[i] = Math.random() * W;
    y[i] = Math.random() * H;
  }
}

function clusteredDistribution(x, y, W, H, N) {
  const clusterCount = 3 + Math.floor(Math.random() * 5);
  const centers = [];
  for (let c = 0; c < clusterCount; c++) {
    centers.push({
      x: W * 0.15 + Math.random() * W * 0.7,
      y: H * 0.15 + Math.random() * H * 0.7,
      radius: 50 + Math.random() * 150,
    });
  }
  for (let i = 0; i < N; i++) {
    const c = centers[Math.floor(Math.random() * clusterCount)];
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * c.radius;
    x[i] = c.x + Math.cos(angle) * r;
    y[i] = c.y + Math.sin(angle) * r;
  }
}

function radialDistribution(x, y, W, H, N) {
  const cx = W / 2, cy = H / 2;
  const maxR = Math.min(W, H) * 0.4;
  for (let i = 0; i < N; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * maxR;
    x[i] = cx + Math.cos(angle) * r;
    y[i] = cy + Math.sin(angle) * r;
  }
}

function asymmetricDistribution(x, y, W, H, N) {
  const splitRatio = 0.3 + Math.random() * 0.4;
  const splitN = Math.floor(N * splitRatio);
  for (let i = 0; i < splitN; i++) {
    x[i] = Math.random() * W * 0.4 + W * 0.05;
    y[i] = Math.random() * H * 0.6 + H * 0.2;
  }
  for (let i = splitN; i < N; i++) {
    x[i] = Math.random() * W * 0.4 + W * 0.55;
    y[i] = Math.random() * H * 0.6 + H * 0.2;
  }
}

function ringDistribution(x, y, W, H, N) {
  const cx = W / 2, cy = H / 2;
  const rings = 1 + Math.floor(Math.random() * 3);
  const maxR = Math.min(W, H) * 0.38;
  for (let i = 0; i < N; i++) {
    const ring = Math.floor(Math.random() * rings);
    const r = maxR * (0.25 + (ring / rings) * 0.75) + (Math.random() - 0.5) * 28;
    const angle = Math.random() * Math.PI * 2;
    x[i] = cx + Math.cos(angle) * r;
    y[i] = cy + Math.sin(angle) * r;
  }
}

function spiralDistribution(x, y, W, H, N) {
  const cx = W / 2, cy = H / 2;
  const arms = 2 + Math.floor(Math.random() * 3);
  const maxR = Math.min(W, H) * 0.40;
  for (let i = 0; i < N; i++) {
    const arm = Math.floor(Math.random() * arms);
    const t = Math.random();
    const angle = (arm / arms) * Math.PI * 2 + t * Math.PI * 3;
    const r = t * maxR + (Math.random() - 0.5) * 35;
    x[i] = cx + Math.cos(angle) * r;
    y[i] = cy + Math.sin(angle) * r;
  }
}

function gridDistribution(x, y, W, H, N) {
  const cols = Math.round(Math.sqrt(N * (W / H)));
  const rows = Math.ceil(N / cols);
  const mX = W * 0.1, mY = H * 0.1;
  const stepX = (W - mX * 2) / Math.max(cols - 1, 1);
  const stepY = (H - mY * 2) / Math.max(rows - 1, 1);
  for (let i = 0; i < N; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    x[i] = mX + col * stepX + (Math.random() - 0.5) * stepX * 0.6;
    y[i] = mY + row * stepY + (Math.random() - 0.5) * stepY * 0.6;
  }
}

function stripeDistribution(x, y, W, H, N) {
  const horizontal = Math.random() < 0.5;
  const stripes = 3 + Math.floor(Math.random() * 5);
  for (let i = 0; i < N; i++) {
    const stripe = Math.floor(Math.random() * stripes);
    if (horizontal) {
      x[i] = Math.random() * W;
      const cy = H * ((stripe + 0.5) / stripes);
      y[i] = cy + (Math.random() - 0.5) * (H / stripes) * 0.6;
    } else {
      const cx = W * ((stripe + 0.5) / stripes);
      x[i] = cx + (Math.random() - 0.5) * (W / stripes) * 0.6;
      y[i] = Math.random() * H;
    }
  }
}

// Murmuration — elongated lens at random angle, like a bird flock mid-turn
function murmurating(x, y, W, H, N) {
  const cx = W / 2, cy = H / 2;
  const semiMajor = Math.min(W, H) * 0.38;
  const semiMinor = Math.min(W, H) * 0.07;
  const angle = Math.random() * Math.PI;
  const cs = Math.cos(angle), sn = Math.sin(angle);
  for (let i = 0; i < N; i++) {
    const r = Math.sqrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const ex = semiMajor * r * Math.cos(theta);
    const ey = semiMinor * r * Math.sin(theta);
    x[i] = Math.max(10, Math.min(W - 10, cx + ex * cs - ey * sn));
    y[i] = Math.max(10, Math.min(H - 10, cy + ex * sn + ey * cs));
  }
}

// Cell division — two overlapping discs, like a cell mid-mitosis
function cellDivision(x, y, W, H, N) {
  const cx = W / 2, cy = H / 2;
  const r = Math.min(W, H) * 0.17;
  const offset = r * 0.65;
  const c1 = { x: cx - offset, y: cy };
  const c2 = { x: cx + offset, y: cy };
  for (let i = 0; i < N; i++) {
    const cell = Math.random() < 0.5 ? c1 : c2;
    const angle = Math.random() * Math.PI * 2;
    const rad = r * Math.sqrt(Math.random());
    x[i] = Math.max(10, Math.min(W - 10, cell.x + Math.cos(angle) * rad));
    y[i] = Math.max(10, Math.min(H - 10, cell.y + Math.sin(angle) * rad));
  }
}

// Neural net — dense soma with long radiating axons
function neuralNet(x, y, W, H, N) {
  const cx = W / 2, cy = H / 2;
  const somaR = Math.min(W, H) * 0.055;
  const axonCount = 4 + Math.floor(Math.random() * 5);
  const axonLen = Math.min(W, H) * 0.38;
  const somaN = Math.floor(N * 0.25);
  const axonAngles = Array.from({ length: axonCount }, () => Math.random() * Math.PI * 2);
  for (let i = 0; i < somaN; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rad = somaR * Math.sqrt(Math.random());
    x[i] = Math.max(10, Math.min(W - 10, cx + Math.cos(angle) * rad));
    y[i] = Math.max(10, Math.min(H - 10, cy + Math.sin(angle) * rad));
  }
  for (let i = somaN; i < N; i++) {
    const axon = Math.floor(Math.random() * axonCount);
    const t = Math.pow(Math.random(), 0.6);
    const len = t * axonLen + (Math.random() - 0.5) * 18;
    const spread = (Math.random() - 0.5) * 0.18;
    const a = axonAngles[axon] + spread;
    x[i] = Math.max(10, Math.min(W - 10, cx + Math.cos(a) * len));
    y[i] = Math.max(10, Math.min(H - 10, cy + Math.sin(a) * len));
  }
}

// Mycelium — branching filaments from scattered seed points
function mycelium(x, y, W, H, N) {
  const seeds = 3 + Math.floor(Math.random() * 4);
  const seedPts = Array.from({ length: seeds }, () => ({
    x: W * 0.15 + Math.random() * W * 0.7,
    y: H * 0.15 + Math.random() * H * 0.7,
  }));
  for (let i = 0; i < N; i++) {
    const seed = seedPts[Math.floor(Math.random() * seeds)];
    const baseAngle = Math.random() * Math.PI * 2;
    const steps = 2 + Math.floor(Math.random() * 7);
    let px = seed.x, py = seed.y;
    let angle = baseAngle;
    for (let s = 0; s < steps; s++) {
      angle += (Math.random() - 0.5) * 1.1;
      const stepLen = 15 + Math.random() * 35;
      px += Math.cos(angle) * stepLen;
      py += Math.sin(angle) * stepLen;
    }
    x[i] = Math.max(10, Math.min(W - 10, px));
    y[i] = Math.max(10, Math.min(H - 10, py));
  }
}

const distributions = [
  uniformDistribution,
  clusteredDistribution,
  radialDistribution,
  asymmetricDistribution,
  ringDistribution,
  spiralDistribution,
  gridDistribution,
  stripeDistribution,
  murmurating,
  cellDivision,
  neuralNet,
  mycelium,
];

function assignSpecies(species, sizeTier, N) {
  const biasType = Math.random();

  if (biasType < 0.3) {
    for (let i = 0; i < N; i++) {
      species[i] = Math.floor(Math.random() * SPECIES_COUNT);
      sizeTier[i] = weightedTier();
    }
  } else if (biasType < 0.6) {
    const dominant = [];
    while (dominant.length < 3) {
      const s = Math.floor(Math.random() * SPECIES_COUNT);
      if (!dominant.includes(s)) dominant.push(s);
    }
    for (let i = 0; i < N; i++) {
      species[i] = Math.random() < 0.85
        ? dominant[Math.floor(Math.random() * 3)]
        : Math.floor(Math.random() * SPECIES_COUNT);
      sizeTier[i] = weightedTier();
    }
  } else {
    const dominant = [];
    while (dominant.length < 2) {
      const s = Math.floor(Math.random() * SPECIES_COUNT);
      if (!dominant.includes(s)) dominant.push(s);
    }
    for (let i = 0; i < N; i++) {
      species[i] = Math.random() < 0.75
        ? dominant[Math.floor(Math.random() * 2)]
        : Math.floor(Math.random() * SPECIES_COUNT);
      sizeTier[i] = weightedTier();
    }
  }
}

export function genesis(physics, W, H) {
  const { x, y, vx, vy, species, sizeTier, particleCount: N } = physics;
  const distFn = distributions[Math.floor(Math.random() * distributions.length)];
  distFn(x, y, W, H, N);
  for (let i = 0; i < N; i++) {
    vx[i] = (Math.random() - 0.5) * 0.4;
    vy[i] = (Math.random() - 0.5) * 0.4;
  }
  assignSpecies(species, sizeTier, N);
}

export function randomInteractionMatrix() {
  return randomMatrix();
}
