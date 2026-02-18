import { useState } from 'react';
import { PALETTES } from '../palettes.js';

function Slider({ label, value, min, max, step, onChange, format }) {
  const display = format ? format(value) : value;
  return (
    <label className="flex items-center justify-between gap-3 text-xs text-white/80">
      <span className="shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(+e.target.value)}
        className="flex-1 h-1.5 rounded-full appearance-none bg-white/20 accent-white cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <span className="w-10 text-right tabular-nums text-white/60">{display}</span>
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between text-xs text-white/80 cursor-pointer">
      <span>{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          checked ? 'bg-sky-400' : 'bg-white/20'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </button>
    </label>
  );
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-semibold text-white tracking-wide"
      >
        {title}
        <span className={`transition-transform text-white/40 ${open ? '' : '-rotate-90'}`}>▾</span>
      </button>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}

function PaletteSelector({ current, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(PALETTES).map(([name, colors]) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] transition-all
            ${current === name
              ? 'bg-white/20 shadow-sm shadow-white/10'
              : 'bg-white/5 hover:bg-white/10'
            }`}
        >
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
            style={{ background: `conic-gradient(${colors.join(', ')})` }}
          />
          <span className="text-white/70">{name}</span>
        </button>
      ))}
    </div>
  );
}

function PresetButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all
        ${active
          ? 'bg-white/15 text-white shadow-sm'
          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
        }`}
    >
      {label}
    </button>
  );
}

const PRESETS = {
  Watercolor: {
    palette: 'Lavender',
    mutationIntensity: 0.3,
    trailFade: 0.03,
    speed: 1.0,
    bgColor: '#f5f0eb',
  },
  Royalty: {
    palette: 'Royalty',
    mutationIntensity: 0.15,
    trailFade: 0.015,
    speed: 0.8,
    bgColor: '#f5f0eb',
  },
  Turbulence: {
    palette: 'Synthwave',
    mutationIntensity: 0.8,
    trailFade: 0.05,
    speed: 2.0,
    bgColor: '#0b0b0b',
  },
};

export default function Panel({ state, onUpdate }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activePreset, setActivePreset] = useState(null);

  function applyPreset(name) {
    const p = PRESETS[name];
    setActivePreset(name);
    onUpdate({
      palette: p.palette,
      mutationIntensity: p.mutationIntensity,
      trailFade: p.trailFade,
      speed: p.speed,
      bgColor: p.bgColor,
    });
  }

  function handleChange(key, value) {
    setActivePreset(null);
    onUpdate({ [key]: value });
  }

  return (
    <div
      className={`fixed top-3 left-3 z-50 w-[300px] rounded-2xl
        bg-black/55 backdrop-blur-2xl text-white font-mono text-sm
        shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300
        ${collapsed ? 'max-h-[56px] overflow-hidden' : 'max-h-[calc(100vh-24px)]'}
        flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
          <div>
            <div className="text-[13px] font-bold text-white">Particle Life</div>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20
            text-white/70 text-xs transition-transform ${collapsed ? 'rotate-180' : ''}`}
        >
          ▲
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {/* Presets */}
        <div className="flex gap-1.5">
          {Object.keys(PRESETS).map(name => (
            <PresetButton
              key={name}
              label={name}
              active={activePreset === name}
              onClick={() => applyPreset(name)}
            />
          ))}
        </div>

        <Section title="System">
          <Slider
            label="Speed"
            value={state.speed}
            min={0.1}
            max={4.0}
            step={0.05}
            onChange={v => handleChange('speed', v)}
            format={v => v.toFixed(1)}
          />
          <Slider
            label="Damping"
            value={state.damping}
            min={0.9}
            max={0.999}
            step={0.001}
            onChange={v => handleChange('damping', v)}
            format={v => v.toFixed(3)}
          />
          <Slider
            label="Range"
            value={state.rmax}
            min={20}
            max={200}
            step={2}
            onChange={v => handleChange('rmax', v)}
            format={v => v.toFixed(0)}
          />
        </Section>

        <Section title="Mutation">
          <Slider
            label="Intensity"
            value={state.mutationIntensity}
            min={0}
            max={1}
            step={0.01}
            onChange={v => handleChange('mutationIntensity', v)}
            format={v => v.toFixed(2)}
          />
          <Toggle
            label="Force Anomalies"
            checked={state.anomaliesEnabled}
            onChange={v => handleChange('anomaliesEnabled', v)}
          />
        </Section>

        <Section title="Appearance">
          <PaletteSelector
            current={state.paletteName}
            onSelect={name => handleChange('palette', name)}
          />
          <div className="flex items-center justify-between text-xs text-white/80">
            <span>Background</span>
            <input
              type="color"
              value={state.bgColor}
              onChange={e => handleChange('bgColor', e.target.value)}
              className="w-8 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
            />
          </div>
          <Slider
            label="Trail Length"
            value={state.trailFade}
            min={0.005}
            max={0.15}
            step={0.005}
            onChange={v => handleChange('trailFade', v)}
            format={v => v < 0.02 ? 'Long' : v > 0.1 ? 'Short' : 'Med'}
          />
        </Section>
      </div>

      {/* Shuffle button */}
      <div className="shrink-0 p-3 border-t border-white/10">
        <button
          onClick={() => handleChange('shuffle', true)}
          className="w-full py-2.5 rounded-xl bg-white/5 border border-white/15
            text-xs font-semibold text-white/80 hover:bg-white/10 hover:border-white/30
            transition-all"
        >
          Shuffle Behavior
        </button>
      </div>
    </div>
  );
}
