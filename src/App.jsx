import { useEffect, useRef, useState, useCallback } from 'react';
import { createPhysics } from './simulation/physics.js';
import { genesis, randomInteractionMatrix } from './simulation/genesis.js';
import { createMutation } from './simulation/mutation.js';
import { createWebGLRenderer } from './rendering/renderer.js';
import { getRandomPalette, getPalette } from './palettes.js';
import Panel from './ui/Panel.jsx';

const DEFAULT_PARTICLE_COUNT = 4000;

export default function App() {
  const canvasRef = useRef(null);
  const simRef = useRef(null);

  const [panelState, setPanelState] = useState({
    speed: 1.0,
    damping: 0.985,
    rmax: 80,
    mutationIntensity: 0.3,
    anomaliesEnabled: true,
    paletteName: '',
    bgColor: '#f5f0eb',
    trailFade: 0.03,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    // Randomized genesis
    const { name: paletteName, colors } = getRandomPalette();
    const interactionMatrix = randomInteractionMatrix();

    const physics = createPhysics({
      width: W,
      height: H,
      particleCount: DEFAULT_PARTICLE_COUNT,
      interactionMatrix,
    });

    genesis(physics, W, H);

    const mutation = createMutation(physics.SPECIES_COUNT);
    physics.setMutation(mutation);

    const renderer = createWebGLRenderer(canvas);
    renderer.resize(W, H);

    // Store refs for panel interaction
    const sim = {
      physics,
      mutation,
      renderer,
      colors: [...colors],
      paletteName,
    };
    simRef.current = sim;

    setPanelState(prev => ({ ...prev, paletteName }));

    // Animation loop
    let last = performance.now();
    let animId;
    let paused = false;

    function loop(now) {
      const dt = Math.min(0.0167, (now - last) / 1000);
      last = now;

      if (!paused) {
        mutation.step(physics.M, dt, physics.width, physics.height);
        physics.step(dt);
      }
      renderer.render(physics, sim.colors);

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    function onResize() {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      renderer.resize(newW, newH);
      physics.resize(newW, newH);
    }

    // Keyboard shortcuts
    function onKeyDown(e) {
      if (e.target.tagName === 'INPUT') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          paused = !paused;
          break;
        case 'KeyR':
          // Shuffle interaction matrix
          for (let a = 0; a < 5; a++)
            for (let b = 0; b < 5; b++)
              physics.M[a][b] = +(Math.random() * 2 - 1).toFixed(2);
          break;
        case 'KeyF':
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
        case 'KeyS':
          // Screenshot
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
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleUpdate = useCallback((updates) => {
    const sim = simRef.current;
    if (!sim) return;

    const { physics, mutation, renderer } = sim;

    if ('speed' in updates) physics.setSpeed(updates.speed);
    if ('damping' in updates) physics.setDamping(updates.damping);
    if ('rmax' in updates) physics.setRmax(updates.rmax);
    if ('mutationIntensity' in updates) mutation.setIntensity(updates.mutationIntensity);
    if ('anomaliesEnabled' in updates) mutation.setAnomaliesEnabled(updates.anomaliesEnabled);
    if ('trailFade' in updates) renderer.setTrailFade(updates.trailFade);
    if ('bgColor' in updates) renderer.setBgColor(updates.bgColor);

    if ('palette' in updates) {
      const colors = getPalette(updates.palette);
      sim.colors = [...colors];
      sim.paletteName = updates.palette;
      updates.paletteName = updates.palette;
    }

    if ('shuffle' in updates) {
      const M = physics.M;
      for (let a = 0; a < 5; a++) {
        for (let b = 0; b < 5; b++) {
          M[a][b] = +(Math.random() * 2 - 1).toFixed(2);
        }
      }
    }

    setPanelState(prev => {
      const next = { ...prev };
      for (const key in updates) {
        if (key !== 'shuffle' && key !== 'palette') {
          next[key] = updates[key];
        }
        if (key === 'paletteName') {
          next.paletteName = updates.paletteName;
        }
      }
      return next;
    });
  }, []);

  return (
    <>
      <canvas ref={canvasRef} />
      <Panel state={panelState} onUpdate={handleUpdate} />
    </>
  );
}
