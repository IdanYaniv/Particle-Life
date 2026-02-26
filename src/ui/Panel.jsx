import { useState, useRef } from 'react';
import { PALETTES } from '../palettes.js';

const THEMES = {
  dark: {
    panel: 'bg-black/55 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
    text: 'text-white',
    border: 'border-white/10',
    section: 'bg-white/5',
    sectionTitle: 'text-white/70',
    sectionArrow: 'text-white/30',
    btnBg: 'bg-white/5 hover:bg-white/10',
    btnActive: 'bg-white/20',
    btnText: 'text-white/60',
    toggleOff: 'bg-white/20',
    toggleOn: 'bg-sky-400',
    shuffleBg: 'bg-white/5 border-white/12 hover:bg-white/10',
    shuffleText: 'text-white/70',
    colorBorder: 'border-white/20',
    sliderBg: 'rgba(255,255,255,0.06)',
    sliderThumb: 'rgba(255,255,255,0.5)',
    sliderDot: 'rgba(255,255,255,0.18)',
    sliderLabel: 'rgba(255,255,255,0.6)',
    sliderValue: 'rgba(255,255,255,0.38)',
    themeClass: 'theme-dark',
  },
  light: {
    panel: 'bg-white/65 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
    text: 'text-black',
    border: 'border-black/8',
    section: 'bg-black/[0.03]',
    sectionTitle: 'text-black/60',
    sectionArrow: 'text-black/25',
    btnBg: 'bg-black/[0.04] hover:bg-black/[0.08]',
    btnActive: 'bg-black/10',
    btnText: 'text-black/50',
    toggleOff: 'bg-black/12',
    toggleOn: 'bg-sky-500',
    shuffleBg: 'bg-black/[0.04] border-black/8 hover:bg-black/[0.08]',
    shuffleText: 'text-black/60',
    colorBorder: 'border-black/15',
    sliderBg: 'rgba(0,0,0,0.05)',
    sliderThumb: 'rgba(0,0,0,0.3)',
    sliderDot: 'rgba(0,0,0,0.12)',
    sliderLabel: 'rgba(0,0,0,0.5)',
    sliderValue: 'rgba(0,0,0,0.3)',
    themeClass: 'theme-light',
  },
};

// Tick mark positions across the track
const TICK_POS = [0.2, 0.4, 0.6, 0.8];

function Slider({ label, value, min, max, step = 0.01, onChange, format, theme }) {
  const pillRef = useRef(null);
  const trackRef = useRef(null);
  const dragging = useRef(false);

  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const display = format ? format(value) : String(value);

  function getVal(e) {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const raw = min + p * (max - min);
    const snapped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, snapped));
  }

  function onPD(e) {
    dragging.current = true;
    pillRef.current?.setPointerCapture(e.pointerId);
    onChange(getVal(e));
  }
  function onPM(e) { if (dragging.current) onChange(getVal(e)); }
  function onPU() { dragging.current = false; }

  return (
    <div
      ref={pillRef}
      onPointerDown={onPD}
      onPointerMove={onPM}
      onPointerUp={onPU}
      className="flex items-center gap-2 px-3 rounded-xl cursor-pointer select-none"
      style={{ background: theme.sliderBg, height: 36 }}
    >
      <span className="text-xs shrink-0" style={{ color: theme.sliderLabel }}>{label}</span>

      <div ref={trackRef} className="flex-1 relative h-full">
        {/* Thumb — vertical bar */}
        <div
          className="absolute inset-y-[9px] w-[3px] rounded-full"
          style={{ left: `${pct * 100}%`, background: theme.sliderThumb, transform: 'translateX(-1px)' }}
        />
        {/* Tick dots — only those to the right of thumb */}
        {TICK_POS.filter(p => p > pct + 0.04).map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p * 100}%`, top: '50%',
              width: 3, height: 3,
              background: theme.sliderDot,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>

      <span
        className="text-[10px] tabular-nums shrink-0"
        style={{ color: theme.sliderValue, minWidth: 28, textAlign: 'right' }}
      >
        {display}
      </span>
    </div>
  );
}


function Section({ title, children, defaultOpen = true, theme }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-xl ${theme.section} p-3`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between text-[10px] font-semibold ${theme.sectionTitle} tracking-widest uppercase`}
      >
        {title}
        <span className={`transition-transform duration-200 ${theme.sectionArrow} ${open ? '' : '-rotate-90'}`}>▾</span>
      </button>
      {open && <div className="mt-2 space-y-1.5">{children}</div>}
    </div>
  );
}

function PaletteSelector({ current, onSelect, theme }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {Object.entries(PALETTES).map(([name, colors]) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          className={`w-full flex items-center gap-1 pl-1 pr-1.5 py-1 rounded-full text-[11px] transition-all
            ${current === name ? theme.btnActive : theme.btnBg}`}
        >
          <span
            className={`w-3.5 h-3.5 rounded-full border ${theme.colorBorder} shrink-0`}
            style={{ background: `conic-gradient(${colors.join(', ')})` }}
          />
          <span className={`${theme.btnText} truncate`}>{name}</span>
        </button>
      ))}
    </div>
  );
}

export default function Panel({ state, onUpdate, onRefresh }) {
  const [collapsed, setCollapsed] = useState(false);

  const isDark = isDarkBg(state.bgColor);
  const theme = THEMES[isDark ? 'dark' : 'light'];

  function handleChange(key, value) { onUpdate({ [key]: value }); }

  function toggleDayNight() {
    onUpdate({ bgColor: isDark ? '#f5f0eb' : '#0b0b0b' });
  }

  return (
    <div
      className={`${theme.themeClass} fixed top-3 left-3 z-50 w-[300px] rounded-2xl
        ${theme.panel} ${theme.text} font-mono text-sm
        transition-all duration-300 flex flex-col
        ${collapsed ? 'max-h-[60px] overflow-hidden' : 'max-h-[calc(100vh-24px)]'}`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-4 shrink-0 ${!collapsed ? `border-b ${theme.border}` : ''}`}>
        <span className="text-[15px] font-medium" style={{ fontFamily: "'Geist Mono', monospace" }}>
          Particle Life
        </span>
        <div className="flex items-center gap-1.5">
          {/* Day/Night toggle */}
          <button
            onClick={toggleDayNight}
            className={`w-7 h-7 flex items-center justify-center rounded-lg ${theme.btnBg} transition-colors`}
            title={isDark ? 'Switch to Day' : 'Switch to Night'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', opacity: 0.65 }}>
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          {/* Refresh */}
          <button
            onClick={onRefresh}
            className={`w-7 h-7 flex items-center justify-center rounded-lg ${theme.btnBg} transition-colors`}
            title="Restart simulation"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', opacity: 0.65 }}>
              refresh
            </span>
          </button>
          {/* Collapse */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg ${theme.btnBg} transition-transform ${collapsed ? 'rotate-180' : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', opacity: 0.5 }}>
              expand_less
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <Section title="System" theme={theme}>
          <Slider label="Speed" value={state.speed} min={0.1} max={4.0} step={0.05}
            onChange={v => handleChange('speed', v)} format={v => v.toFixed(1)} theme={theme} />
          <Slider label="Damping" value={state.damping} min={0.9} max={0.999} step={0.001}
            onChange={v => handleChange('damping', v)} format={v => v.toFixed(3)} theme={theme} />
          <Slider label="Range" value={state.rmax} min={20} max={200} step={2}
            onChange={v => handleChange('rmax', v)} format={v => Math.round(v)} theme={theme} />
          <Slider label="Cursor" value={state.cursorIntensity} min={0} max={1} step={0.01}
            onChange={v => handleChange('cursorIntensity', v)} format={v => v.toFixed(2)} theme={theme} />
        </Section>

        <Section title="Appearance" theme={theme}>
          <PaletteSelector current={state.paletteName} onSelect={name => handleChange('palette', name)} theme={theme} />
          <div className={`flex items-center justify-between text-xs opacity-60`} style={{ color: theme.sliderLabel }}>
            <span>Background</span>
            <input
              type="color"
              value={state.bgColor}
              onChange={e => handleChange('bgColor', e.target.value)}
              className={`w-[34px] h-[28px] rounded border ${theme.colorBorder} bg-transparent cursor-pointer`}
              style={{ padding: '4px' }}
            />
          </div>
          <Slider label="Trail" value={state.trailFade} min={0.005} max={0.15} step={0.005}
            onChange={v => handleChange('trailFade', v)}
            format={v => v < 0.02 ? 'L' : v > 0.1 ? 'S' : 'M'}
            theme={theme} />
        </Section>
      </div>

      {/* Shuffle button */}
      <div className={`shrink-0 p-3 border-t ${theme.border}`}>
        <button
          onClick={() => handleChange('shuffle', true)}
          className={`w-full py-2.5 rounded-xl border text-xs font-semibold transition-all ${theme.shuffleBg} ${theme.shuffleText}`}
        >
          Shuffle Behavior
        </button>
      </div>
    </div>
  );
}

function isDarkBg(hex) {
  if (!hex || hex.length < 7) return false;
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return (0.299*r + 0.587*g + 0.114*b) / 255 < 0.5;
}
