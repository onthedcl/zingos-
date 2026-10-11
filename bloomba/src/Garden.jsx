import React from 'react';
import { ROUND_LENGTH } from './game.js';

// The garden is a drawn scene: sky, sun, clouds, grass and a soil bed where
// one flower is planted per right answer. Each round's flowers share a colour
// and style, so the bed shows the rounds played. Positions come from a fixed
// pseudo-random sequence, so the garden looks the same every time it's opened.

const W = 400;
const H = 240;
const SLOTS = 40; // flowers on show at once; older ones make room for new ones
const ROWS = [160, 178, 196, 214]; // soil-bed rows, back to front
const PER_ROW = SLOTS / ROWS.length;
// Planting order: a whole row at a time, columns spread out (not left to
// right), so even a few flowers cover the bed.
const ROW_ORDER = [1, 2, 0, 3];
const COL_ORDER = [0, 5, 2, 7, 4, 9, 1, 6, 3, 8];

// One petal colour (and a lighter shade) per round, cycling.
const PETALS = [
  ['#FF6B9D', '#FFB3CF'],
  ['#C67BFF', '#E4C6FF'],
  ['#FF8C42', '#FFC9A1'],
  ['#4D96FF', '#B5D2FF'],
  ['#FF5A5A', '#FFB0B0'],
  ['#F4C430', '#FFE89A'],
  ['#FF7AD9', '#FFC4EF'],
];

// Small deterministic hash -> [0, 1)
function rand(i, k = 0) {
  let t = Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(k + 1, 0x85ebca77);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const SPOTS = ROWS.flatMap((y, row) => {
  const step = (W - 70) / PER_ROW;
  return Array.from({ length: PER_ROW }, (_, col) => {
    const j = row * PER_ROW + col;
    return {
      x: 35 + col * step + step / 2 + (row % 2 ? step / 4 : -step / 4) + (rand(j, 1) - 0.5) * step * 0.4,
      y: y + (rand(j, 2) - 0.5) * 6,
      scale: 1.3 + row * 0.12,
    };
  });
});
const FILL_ORDER = ROW_ORDER.flatMap((row) => COL_ORDER.map((col) => row * PER_ROW + col));

function FlowerHead({ style, colors: [petal, light] }) {
  if (style === 1) {
    // Daisy: long thin petals
    return (
      <g>
        {Array.from({ length: 8 }).map((_, k) => (
          <ellipse key={k} cx="0" cy="-7" rx="2.6" ry="7" fill={petal} transform={`rotate(${k * 45})`} />
        ))}
        <circle r="4" fill="#FFD93D" />
      </g>
    );
  }
  if (style === 2) {
    // Tulip
    return (
      <g>
        <path d="M-7 -2 C-8 -12 -3 -14 0 -9 C3 -14 8 -12 7 -2 C6 5 -6 5 -7 -2z" fill={petal} />
        <path d="M-2 -3 C-2 -9 2 -9 2 -3z" fill={light} opacity="0.7" />
      </g>
    );
  }
  // Round petals
  return (
    <g>
      {Array.from({ length: 5 }).map((_, k) => (
        <circle key={k} cx="0" cy="-6.5" r="5.5" fill={petal} transform={`rotate(${k * 72})`} />
      ))}
      <circle r="4.5" fill="#FFD93D" />
      <circle r="2" cx="-1.2" cy="-1.2" fill="#FFF3B0" />
    </g>
  );
}

function Flower({ index, isNew, popDelay }) {
  const spot = SPOTS[FILL_ORDER[index % SLOTS]];
  const roundNo = Math.floor(index / ROUND_LENGTH);
  const colors = PETALS[roundNo % PETALS.length];
  const style = roundNo % 3;
  const height = 24 + rand(index, 4) * 10;
  const lean = (rand(index, 5) - 0.5) * 6;
  return (
    <g transform={`translate(${spot.x.toFixed(1)} ${spot.y.toFixed(1)}) scale(${spot.scale})`}>
      <g className={isNew ? 'garden-pop' : undefined} style={isNew ? { animationDelay: `${popDelay}s` } : undefined}>
        <g className="garden-sway" style={{ animationDelay: `${-rand(index, 6) * 3}s` }}>
          <path d={`M0 0 Q${lean} ${-height / 2} ${lean / 2} ${-height}`} stroke="#3E9B4F" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <ellipse cx={lean / 3 + 5} cy={-height * 0.4} rx="5" ry="2.4" fill="#55B868" transform={`rotate(-30 ${lean / 3 + 5} ${-height * 0.4})`} />
          <g transform={`translate(${lean / 2} ${-height})`}>
            <FlowerHead style={style} colors={colors} />
          </g>
        </g>
      </g>
    </g>
  );
}

// `newFrom`: flowers with index >= newFrom pop in one after another.
// `compact`: the short strip shown during play (just the flower bed).
export default function Garden({ flowers, newFrom = Infinity, compact = false }) {
  const first = Math.max(0, flowers - SLOTS);
  const shown = Array.from({ length: flowers - first }, (_, k) => first + k)
    // draw back rows first so front flowers overlap them
    .sort((a, b) => SPOTS[FILL_ORDER[a % SLOTS]].y - SPOTS[FILL_ORDER[b % SLOTS]].y);

  return (
    <svg
      className={`garden-scene${compact ? ' compact' : ''}`}
      viewBox={compact ? `0 92 ${W} ${H - 92}` : `0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label={`A garden with ${flowers} flower${flowers === 1 ? '' : 's'}`}
    >
      <defs>
        <linearGradient id="garden-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FD3FF" />
          <stop offset="1" stopColor="#D9F2FF" />
        </linearGradient>
        <linearGradient id="garden-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8EDB7A" />
          <stop offset="1" stopColor="#5DBB5A" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#garden-sky)" />
      <g className="garden-sun">
        <circle cx="350" cy="42" r="20" fill="#FFD93D" />
        {Array.from({ length: 8 }).map((_, k) => (
          <rect key={k} x="348" y="10" width="4" height="10" rx="2" fill="#FFD93D" transform={`rotate(${k * 45} 350 42)`} />
        ))}
      </g>
      <g className="garden-cloud" fill="#fff">
        <ellipse cx="80" cy="45" rx="26" ry="11" />
        <ellipse cx="98" cy="38" rx="17" ry="12" />
        <ellipse cx="64" cy="40" rx="13" ry="9" />
      </g>
      <g className="garden-cloud slow" fill="#fff" opacity="0.85">
        <ellipse cx="210" cy="70" rx="20" ry="8" />
        <ellipse cx="224" cy="64" rx="13" ry="9" />
      </g>
      <path d={`M0 128 Q100 108 200 124 T${W} 118 V${H} H0z`} fill="url(#garden-grass)" />
      <path d={`M14 ${H} Q14 150 60 146 H${W - 60} Q${W - 14} 150 ${W - 14} ${H}z`} fill="#8B5A3C" />
      <path d={`M22 ${H} Q24 156 62 153 H${W - 62} Q${W - 24} 156 ${W - 22} ${H}z`} fill="#A06B48" />
      {shown.map((i) => (
        <Flower key={i} index={i} isNew={i >= newFrom} popDelay={compact ? 0 : (i - newFrom) * 0.35} />
      ))}
    </svg>
  );
}
