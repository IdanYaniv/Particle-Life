// Genesis — randomized starting conditions
// Every load produces a unique composition

const SPECIES_COUNT = 5;

// Generate a random interaction matrix
// Values range from -1 (strong repulsion) to +1 (strong attraction)
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

// Distribution patterns
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
  const cx = W / 2;
  const cy = H / 2;
  const maxR = Math.min(W, H) * 0.4;
  for (let i = 0; i < N; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * maxR;
    x[i] = cx + Math.cos(angle) * r;
    y[i] = cy + Math.sin(angle) * r;
  }
}

function asymmetricDistribution(x, y, W, H, N) {
  // Two unequal clusters on opposite sides
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

const distributions = [
  uniformDistribution,
  clusteredDistribution,
  radialDistribution,
  asymmetricDistribution,
];

// Generate species assignments with optional bias
function assignSpecies(species, sizeTier, N) {
  // Randomize species bias — some loads are 3-species dominated, others balanced
  const biasType = Math.random();

  if (biasType < 0.3) {
    // Balanced across all 5
    for (let i = 0; i < N; i++) {
      species[i] = Math.floor(Math.random() * SPECIES_COUNT);
      sizeTier[i] = Math.floor(Math.random() * 5);
    }
  } else if (biasType < 0.6) {
    // 3-species dominated
    const dominant = [];
    while (dominant.length < 3) {
      const s = Math.floor(Math.random() * SPECIES_COUNT);
      if (!dominant.includes(s)) dominant.push(s);
    }
    for (let i = 0; i < N; i++) {
      if (Math.random() < 0.85) {
        species[i] = dominant[Math.floor(Math.random() * 3)];
      } else {
        species[i] = Math.floor(Math.random() * SPECIES_COUNT);
      }
      sizeTier[i] = Math.floor(Math.random() * 5);
    }
  } else {
    // 2-species dominated with others as minority
    const dominant = [];
    while (dominant.length < 2) {
      const s = Math.floor(Math.random() * SPECIES_COUNT);
      if (!dominant.includes(s)) dominant.push(s);
    }
    for (let i = 0; i < N; i++) {
      if (Math.random() < 0.75) {
        species[i] = dominant[Math.floor(Math.random() * 2)];
      } else {
        species[i] = Math.floor(Math.random() * SPECIES_COUNT);
      }
      sizeTier[i] = Math.floor(Math.random() * 5);
    }
  }
}

// Main genesis function — produces a complete starting state
export function genesis(physics, W, H) {
  const { x, y, vx, vy, species, sizeTier, particleCount: N } = physics;

  // Random distribution pattern
  const distFn = distributions[Math.floor(Math.random() * distributions.length)];
  distFn(x, y, W, H, N);

  // Small initial velocities
  for (let i = 0; i < N; i++) {
    vx[i] = (Math.random() - 0.5) * 0.4;
    vy[i] = (Math.random() - 0.5) * 0.4;
  }

  // Assign species and size tiers
  assignSpecies(species, sizeTier, N);
}

export function randomInteractionMatrix() {
  return randomMatrix();
}
