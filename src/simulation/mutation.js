// Mutation Layer — auto-running instability
// Always active at high intensity. One species is always "rogue" —
// it repels where others attract, rotating every 5-9 seconds.
//
// Two subsystems:
//   1. Interaction matrix drift with rogue species override
//   2. Local force anomalies (always spawning)

const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
const grad2 = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
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
for (let i = 0; i < 256; i++) { perm[i] = p[i]; perm[i+256] = p[i]; }

function simplex2(x, y) {
  const s = (x+y)*F2, i = Math.floor(x+s), j = Math.floor(y+s);
  const t = (i+j)*G2, X0 = i-t, Y0 = j-t;
  const x0 = x-X0, y0 = y-Y0;
  const [i1,j1] = x0>y0 ? [1,0] : [0,1];
  const x1=x0-i1+G2, y1=y0-j1+G2, x2=x0-1+2*G2, y2=y0-1+2*G2;
  const ii=i&255, jj=j&255;
  let n0=0,n1=0,n2=0;
  let t0=0.5-x0*x0-y0*y0; if(t0>0){t0*=t0;const gi=perm[ii+perm[jj]]%8;n0=t0*t0*(grad2[gi][0]*x0+grad2[gi][1]*y0);}
  let t1=0.5-x1*x1-y1*y1; if(t1>0){t1*=t1;const gi=perm[ii+i1+perm[jj+j1]]%8;n1=t1*t1*(grad2[gi][0]*x1+grad2[gi][1]*y1);}
  let t2=0.5-x2*x2-y2*y2; if(t2>0){t2*=t2;const gi=perm[ii+1+perm[jj+1]]%8;n2=t2*t2*(grad2[gi][0]*x2+grad2[gi][1]*y2);}
  return 70*(n0+n1+n2);
}

export function createMutation(speciesCount) {
  const S = speciesCount;

  // Drift targets for each M[a][b]
  const targets = Array.from({ length: S }, () =>
    Array.from({ length: S }, () => Math.random() * 2 - 1)
  );

  // Rogue species state
  let rogueSpecies = Math.floor(Math.random() * S);
  let rogueTimer = 0;
  let nextRogueInterval = 5 + Math.random() * 4;

  // Set initial rogue targets strongly negative
  for (let b = 0; b < S; b++) {
    targets[rogueSpecies][b] = -0.8 - Math.random() * 0.2;
  }

  // Force anomalies
  let anomalies = [];
  let anomalyTimer = 0;
  let time = 0;

  const BASE_DRIFT = 0.003;

  function step(M, dt, W, H) {
    time += dt;
    rogueTimer += dt;

    // Rotate rogue species
    if (rogueTimer >= nextRogueInterval) {
      rogueTimer = 0;
      nextRogueInterval = 5 + Math.random() * 4;

      // Restore old rogue to normal targets
      for (let b = 0; b < S; b++) {
        targets[rogueSpecies][b] = Math.random() * 2 - 1;
      }
      // Pick new rogue (different species)
      let nr;
      do { nr = Math.floor(Math.random() * S); } while (nr === rogueSpecies && S > 1);
      rogueSpecies = nr;
      // Assign strongly negative targets for new rogue
      for (let b = 0; b < S; b++) {
        targets[rogueSpecies][b] = -0.8 - Math.random() * 0.2;
      }
    }

    // Matrix drift
    for (let a = 0; a < S; a++) {
      for (let b = 0; b < S; b++) {
        const noise = simplex2(a * 1.7 + time * 0.1, b * 1.7 + time * 0.13);
        const isRogue = a === rogueSpecies;
        const speed = BASE_DRIFT * (isRogue ? 4.0 : 1.0) * (1 + noise * 0.5);
        M[a][b] += (targets[a][b] - M[a][b]) * speed;

        if (Math.abs(M[a][b] - targets[a][b]) < 0.02) {
          targets[a][b] = isRogue
            ? -0.8 - Math.random() * 0.2  // rogue stays strongly negative
            : Math.random() * 2 - 1;
        }
      }
    }

    // Force anomalies — always spawning
    anomalyTimer += dt;
    if (anomalyTimer > 3.5) {
      anomalyTimer = 0;
      const life = 2 + Math.random() * 2;
      anomalies.push({
        x: Math.random() * W,
        y: Math.random() * H,
        strength: (Math.random() - 0.4) * 1.5,
        life,
        maxLife: life,
      });
    }
    for (let i = anomalies.length - 1; i >= 0; i--) {
      anomalies[i].life -= dt;
      if (anomalies[i].life <= 0) anomalies.splice(i, 1);
    }
  }

  function applyAnomalies(px, py) {
    let ax = 0, ay = 0;
    for (const a of anomalies) {
      const dx = a.x - px, dy = a.y - py;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > 200 || dist < 1) continue;
      const lr = a.life / a.maxLife;
      const env = lr < 0.2 ? lr/0.2 : (1-lr)/0.8;
      const f = a.strength * env / (dist * 0.05);
      ax += (dx/dist)*f; ay += (dy/dist)*f;
    }
    return [ax, ay];
  }

  // Backwards-compat stubs (no-op — mutation is now uncontrollable)
  function setIntensity() {}
  function getIntensity() { return 0.7; }
  function setAnomaliesEnabled() {}
  function getAnomalies() { return anomalies; }

  return { step, applyAnomalies, setIntensity, getIntensity, setAnomaliesEnabled, getAnomalies };
}
