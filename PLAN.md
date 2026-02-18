# Particle Life — Execution Plan

**Overall Progress:** 5/5 steps = 100%

---

## TL;DR

Build a WebGL2 particle simulation where deterministic interaction rules produce organic, living structures — and a mutation layer introduces controlled instability that the user can influence but not fully control. Visual target: soft watercolor blobs on light canvas, matching the IG reference.

---

## Context Snapshot

- **Starting point:** V1.3 single HTML file (~1,400 lines), Canvas 2D, 5-species particle-life with interaction matrix and spatial grid. V1.3 is the reference implementation — its physics core (spatial grid, interaction matrix, force curves, mixed sizes) will be ported and refined, not rewritten from zero.
- **Visual target:** Soft pastel gaussian blobs with dark cores, thin trailing lines, light background. Living watercolor, not sci-fi.
- **Core thesis:** Deterministic rules + mutation layer = a system that organizes and sometimes fails to. User can influence but not guarantee stability.
- **Constraint:** Vite + React + Tailwind + shadcn/ui. Static build output. GitHub repo when approved.
- **Priority order:** (1) Visual quality + Performance (co-equal — tradeoffs surfaced as options), (2) Feature count.

---

## Decisions Locked In

- **WebGL2 with raw shaders, no abstraction library (no regl, no three.js).**
  Reason: Maximum control over rendering pipeline, zero dependency overhead, smallest bundle.
  Tradeoff: More boilerplate for shader setup, but this is a single-concern renderer — complexity is bounded.

- **React + Tailwind CSS + shadcn/ui for the control panel.**
  Reason: Polished, accessible UI components out of the box. React manages panel state cleanly.
  Tradeoff: Adds ~40KB (React) to bundle. Acceptable — the panel is a separate DOM layer from the WebGL canvas, so React never touches the hot rendering path.

- **Physics stays on CPU, positions uploaded to GPU per frame via buffer.**
  Reason: Particle-life interaction matrix + spatial grid are inherently sequential neighbor lookups. GPU compute (transform feedback / compute shaders) adds complexity without clear gain at 8–10k particles.
  Tradeoff: CPU-GPU data transfer each frame. At 10k particles × 8 bytes (x,y as float32) = 80KB/frame — trivial for the bus.

- **Mutation layer as a first-class system, not a parameter tweak.**
  Reason: This is the thesis of the project. Mutation is not "randomness slider" — it's a subsystem that drifts interaction matrix values, spawns local force anomalies, and decays over time.
  Tradeoff: Adds a dedicated module and tuning work. Worth it — this is what makes the project unique.

- **Light background default, dark mode supported.**
  Reason: Light canvas is the primary visual identity (watercolor aesthetic). Dark mode ships alongside as an alternative — different blend modes produce a neon/cosmic feel on dark backgrounds, which is its own valid aesthetic.
  Tradeoff: Two blend mode paths in the renderer. Bounded complexity — it's a uniform switch, not a separate pipeline.

- **Drawing as attractor: deferred to v1.1. Image upload: deferred.**
  Reason: Visual quality is the #1 priority. Drawing adds interaction complexity that can distract from perfecting the core simulation. Ship a visually outstanding observation tool first, add drawing later.

---

## Explicitly Out of Scope

- Sound/audio reactivity
- Image upload personalization (future)
- Multiple particle shapes (gaussian blobs only, but with mixed sizes for organic feel)
- 3D rendering
- Video export
- Mobile touch gesture system
- User accounts or cloud persistence

---

## Risks & Unknowns

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gaussian blob shader on light background may look washed out | Visual quality misses target | Test with multiple blend modes early (screen, multiply, custom). Fall back to pre-multiplied alpha if additive fails on light. |
| Mutation layer feels like random noise instead of organic drift | Thesis fails | Use slow-moving simplex noise to modulate matrix values, not per-frame random. Mutation events should feel like weather, not static. |
| CPU physics at 10k+ particles may bottleneck on low-end hardware | Frame drops | Spatial grid keeps neighbor lookups O(n). If needed, reduce default to 6k and scale up on fast hardware. |

---

## CTO Review

### Performance Assessment

**Verdict: Architecture is sound for the target.**

- CPU-side physics with spatial hash grid is the right call at this particle count. Transform feedback would add shader complexity for marginal gain under 15k particles.
- WebGL2 instanced rendering for blob quads is the fastest path. One draw call for all particles via `drawArraysInstanced`. Upload positions + colors as instance attributes each frame.
- The 80KB/frame data transfer is well within budget. Real bottleneck will be fragment shader fill rate if blob radius is too large — recommend capping rendered radius at ~20px and using framebuffer blur for the soft halo effect instead of per-particle large quads.

### Complexity Assessment

**Verdict: Scope is tight. Two areas to watch.**

1. **Mutation layer** — risk of over-engineering. Recommendation: start with the simplest version (slow random walk on interaction matrix values) and only add force anomalies / spatial mutations if the simple version doesn't feel alive enough. Don't build the full subsystem before validating the core feel.
2. **Trail system + blob rendering are coupled.** Both use framebuffers. Recommendation: build them as one unified render pipeline (render blobs → fade previous frame → composite) rather than two separate systems that fight for framebuffer state.

### Sequencing Assessment

**Verdict: Good, with one adjustment.**

The plan should produce a visually verifiable result by end of Step 2 (not Step 4). If we can't see watercolor blobs moving organically after Step 2, something is fundamentally wrong and we should stop.

Recommendation: merge "Enhanced Physics" and "Trail System" concepts into the rendering step where they're visually testable, rather than as separate steps that produce invisible improvements.

### Scope Discipline

**Verdict: Clean. Two flags.**

1. "Preset scenes" in the UI step could expand into a rabbit hole. Cap at 3 presets maximum for v1.
2. "URL-based state encoding" is nice-to-have, not must-have. Move to stretch goals.

### Fallback Paths

| Step | If it fails... |
|------|---------------|
| WebGL blob rendering | Fall back to Canvas 2D with CSS `filter: blur()` on the canvas element. Ugly but functional. |
| Mutation layer | Ship without it. The deterministic simulation is still valuable. Add mutation as v1.1. |
| Performance below floor | Reduce default particle count. Add auto-scaling based on measured FPS. |

---

## Plan

### 1. 🟩 Project Scaffolding & Core Port

Set up the project structure and port the working physics engine.

- Initialize Vite + React project, set up `index.html`
- File structure:
  ```
  src/
    main.jsx          — React root, mounts panel + canvas
    simulation/
      physics.js      — interaction matrix, spatial grid, force calculation, boundary
      mutation.js     — mutation layer (interaction drift, force anomalies)
      genesis.js      — randomized starting conditions
    rendering/
      renderer.js     — WebGL2 setup, shaders, framebuffers, draw calls
    ui/
      Panel.jsx       — shadcn/ui control panel (React)
      components/     — shadcn/ui component overrides
    palettes.js       — color palette definitions
  ```
- Port physics core from V1.3: interaction matrix, spatial grid, species system, mixed sizes, soft boundary (not hard bounce — repulsion force near edges that decays smoothly)
- **Randomized genesis system:** Every load/refresh generates a unique starting condition — randomized interaction matrix, randomized species distribution, randomized initial positions (clustered vs. scattered vs. ring vs. spiral). Like looking through a microscope: every time you look, you discover a new organism. Parameters to randomize:
  - Interaction matrix values (attraction/repulsion strengths)
  - Species count bias (some loads are 3-species dominated, others are balanced across 5)
  - Initial particle distribution pattern (uniform, clustered, radial, asymmetric)
  - Palette (random each load — full surprise, user can change manually after)
- Verify: particles move correctly in a plain Canvas 2D fallback renderer before touching WebGL

**Exit:** `npm run dev` shows particles interacting with correct physics. Each refresh produces a visibly different starting composition. No visual polish yet.

### 2. 🟩 WebGL2 Renderer — Watercolor Blobs + Trails

Replace Canvas 2D with the production renderer. This is the visual identity step.

- WebGL2 context, instanced quad rendering (one draw call for all particles)
- Vertex shader: positions quads per particle, applies velocity-dependent stretch (elongation along movement vector)
- Fragment shader: radial gradient with gaussian falloff, dark core → colored halo → transparent edge. Mixed sizes per species (port V1.3's 5-tier size system: 0.6x, 0.8x, 1.0x, 1.2x, 1.4x) — size variation is key to the organic feel
- Blend mode: test screen blending on light background first, fall back to pre-multiplied alpha
- Two-framebuffer ping-pong for trails: render current frame to FBO A, composite with faded FBO B, swap
- Trail fade rate as a uniform (adjustable from UI later)
- Default palette: soft pastels — lavender `#c4b5fd`, sky `#93c5fd`, rose `#fda4af`, mint `#86efac`, cream `#fde68a`, plus Royalty palette preserved
- Light background default: `#f5f0eb`. Dark mode: `#0b0b0b` with adjusted blend modes (additive for neon glow)
- User color controls: background color picker + palette selector (port from V1.3 approach — user can freely adjust the visual environment)

**Exit:** Soft watercolor blobs moving on light canvas with trailing persistence. Visually comparable to the IG reference. Smooth performance at default particle count.

### 3. 🟩 Mutation Layer

The thesis feature. Controlled instability that makes the system feel alive.

- **Interaction matrix drift:** Each matrix value `M[i][j]` slowly walks toward a random target using interpolation (`lerp` at ~0.001/frame). When it reaches the target, a new target is chosen. This creates gradual behavioral shifts — species that were attracted begin to repel, and vice versa.
- **Drift speed modulation:** Use simplex noise (lightweight implementation, ~50 lines) to vary drift speed spatially and temporally. Some periods are calm, others turbulent.
- **Local force anomalies:** Occasional (every few seconds) spawn a temporary attractor/repulsor at a random position that decays over 2–3 seconds. Creates "events" that disrupt local clusters.
- **Mutation intensity slider:** User can modulate the overall mutation rate from 0 (fully deterministic, no drift) to 1 (rapid drift, frequent anomalies). Default at ~0.3.
- **No full reset:** Mutations don't snap values — they drift. The system always retains some memory of its previous state.

**Exit:** With mutation at default, the simulation visibly evolves over 30–60 seconds. Clusters form, shift, sometimes dissolve. It feels like watching weather or a petri dish. User can dial mutation to 0 for stable mode or to 1 for chaos.

### 4. 🟩 UI — Clean Control Panel

Minimal, functional controls. Not a dashboard — a tool.

- Built with Tailwind CSS + shadcn/ui components (sliders, toggles, select, collapsible sections)
- Glassmorphism panel overlay with backdrop blur
- Collapsible sections: **System** (particle count, speed, damping, mixed sizes toggle), **Mutation** (intensity slider, anomaly toggle), **Appearance** (palette selector, background color picker, light/dark mode toggle, trail strength)
- 3 curated preset scenes:
  - *Watercolor* — soft pastels, medium mutation, light trails
  - *Royalty* — the Royalty palette, low mutation, strong trails
  - *Turbulence* — high mutation, fast speed, vivid colors
- Fullscreen toggle
- Panel collapse (chevron, same pattern as V1.3)
- "Shuffle" button randomizes interaction matrix (instant, not mutation-based)

**Exit:** All parameters controllable. Presets produce distinct, visually compelling results. Panel doesn't obstruct the canvas.

### 5. 🟩 Performance Tuning & Polish

Ensure the system holds up under stress.

- Profile and optimize: target 60fps, acceptable floor 45fps at default particle count
- Spatial grid cell size auto-tuning based on RMAX
- Adaptive quality: if FPS drops below 50 for 2+ seconds, reduce trail quality (lower FBO resolution) automatically
- Screenshot button (canvas `toDataURL` → download)
- Keyboard shortcuts: Space (pause), R (randomize matrix), F (fullscreen)
**Exit:** Stable performance. Screenshot works. Keyboard shortcuts functional.

---

## Stretch Goals (post-v1, not planned)

- Freehand drawing as particle attractor (strokes → force field, fade over time)
- GitHub repo + GitHub Pages deployment (when approved)
- Image upload as attractor field
- Sound/audio reactivity
- URL-based state sharing
- Video/GIF export
- Mobile touch drawing

---

## Kill Criteria

- WebGL blob rendering can't achieve watercolor look after 2 focused attempts → fall back to Canvas 2D + CSS blur
- Mutation layer feels like random noise after tuning → ship without it, add as v1.1
- Performance below 45fps at default particle count after optimization pass → simplify shaders, reduce count

---

## Exit Criteria

- All 5 steps are 🟩
- Every refresh produces a unique, discovery-like starting composition
- Default scene produces visuals matching the IG reference aesthetic
- Mutation creates visible, organic behavioral evolution over 30–60 seconds
- Users can switch between light/dark modes and adjust colors freely
- Smooth performance (60fps target, 45fps floor) at default particle count
