'use client';
import React from 'react';
import type { DeskStyle, ChairStyle, MonitorSetup, DeskDecoration } from '@/types';

// ── PixelDesk ────────────────────────────────────────────
export function PixelDesk({
  style = 'standard',
  color = '#8b6b4a',
  width = 80,
  height = 40,
}: {
  style?: DeskStyle;
  color?: string;
  width?: number;
  height?: number;
}) {
  const darkColor = shadeColor(color, -20);

  switch (style) {
    case 'standing':
      return (
        <svg width={width} height={height + 10} style={{ imageRendering: 'pixelated' }}>
          <rect x={4} y={0} width={width - 8} height={6} rx={1} fill={color} />
          <rect x={8} y={6} width={4} height={height + 4} fill={darkColor} />
          <rect x={width - 12} y={6} width={4} height={height + 4} fill={darkColor} />
          <rect x={4} y={2} width={width - 8} height={2} fill={shadeColor(color, 15)} />
        </svg>
      );
    case 'corner':
      return (
        <svg width={width} height={height} style={{ imageRendering: 'pixelated' }}>
          <rect x={0} y={8} width={width} height={8} rx={1} fill={color} />
          <rect x={0} y={8} width={width * 0.4} height={height - 8} rx={1} fill={color} />
          <rect x={2} y={10} width={width - 4} height={4} fill={shadeColor(color, 15)} />
          <rect x={4} y={16} width={4} height={height - 18} fill={darkColor} />
          <rect x={width - 8} y={16} width={4} height={height - 18} fill={darkColor} />
        </svg>
      );
    case 'minimal':
      return (
        <svg width={width} height={height} style={{ imageRendering: 'pixelated' }}>
          <rect x={6} y={10} width={width - 12} height={5} rx={1} fill={color} />
          <rect x={10} y={15} width={3} height={height - 17} fill={darkColor} />
          <rect x={width - 13} y={15} width={3} height={height - 17} fill={darkColor} />
        </svg>
      );
    default: // standard
      return (
        <svg width={width} height={height} style={{ imageRendering: 'pixelated' }}>
          <rect x={2} y={8} width={width - 4} height={8} rx={1} fill={color} />
          <rect x={2} y={10} width={width - 4} height={3} fill={shadeColor(color, 15)} />
          <rect x={6} y={16} width={4} height={height - 18} fill={darkColor} />
          <rect x={width - 10} y={16} width={4} height={height - 18} fill={darkColor} />
          {/* Drawer */}
          <rect x={width / 2 - 8} y={10} width={16} height={5} rx={1} fill={darkColor} />
          <rect x={width / 2 - 2} y={11} width={4} height={2} rx={0.5} fill={shadeColor(color, 30)} />
        </svg>
      );
  }
}

// ── PixelChair ───────────────────────────────────────────
export function PixelChair({
  style = 'ergonomic',
  color = '#4A90D9',
}: {
  style?: ChairStyle;
  color?: string;
}) {
  const dark = shadeColor(color, -25);

  switch (style) {
    case 'gaming':
      return (
        <svg width={32} height={40} style={{ imageRendering: 'pixelated' }}>
          <rect x={8} y={4} width={16} height={20} rx={2} fill={color} />
          <rect x={6} y={2} width={20} height={4} rx={2} fill={dark} />
          <rect x={10} y={24} width={12} height={4} rx={1} fill={dark} />
          <rect x={6} y={28} width={4} height={10} fill="#555" />
          <rect x={22} y={28} width={4} height={10} fill="#555" />
          <circle cx={8} cy={38} r={2} fill="#333" />
          <circle cx={24} cy={38} r={2} fill="#333" />
        </svg>
      );
    case 'stool':
      return (
        <svg width={24} height={36} style={{ imageRendering: 'pixelated' }}>
          <circle cx={12} cy={8} rx={10} ry={4} fill={color} />
          <rect x={10} y={10} width={4} height={18} fill="#555" />
          <line x1={4} y1={36} x2={12} y2={26} stroke="#555" strokeWidth={2} />
          <line x1={20} y1={36} x2={12} y2={26} stroke="#555" strokeWidth={2} />
        </svg>
      );
    case 'basic':
      return (
        <svg width={28} height={36} style={{ imageRendering: 'pixelated' }}>
          <rect x={4} y={6} width={20} height={14} rx={1} fill={color} />
          <rect x={6} y={20} width={16} height={4} rx={1} fill={dark} />
          <rect x={6} y={24} width={4} height={10} fill="#555" />
          <rect x={18} y={24} width={4} height={10} fill="#555" />
        </svg>
      );
    default: // ergonomic
      return (
        <svg width={28} height={40} style={{ imageRendering: 'pixelated' }}>
          <rect x={4} y={4} width={20} height={18} rx={3} fill={color} />
          <rect x={6} y={6} width={16} height={14} rx={2} fill={shadeColor(color, 10)} />
          <rect x={6} y={22} width={16} height={4} rx={1} fill={dark} />
          <rect x={10} y={26} width={8} height={4} fill="#555" />
          <rect x={4} y={30} width={4} height={8} fill="#555" />
          <rect x={20} y={30} width={4} height={8} fill="#555" />
          <circle cx={6} cy={38} r={2} fill="#333" />
          <circle cx={22} cy={38} r={2} fill="#333" />
        </svg>
      );
  }
}

// ── PixelMonitor ─────────────────────────────────────────
export function PixelMonitor({ setup = 'single' }: { setup?: MonitorSetup }) {
  switch (setup) {
    case 'dual':
      return (
        <svg width={56} height={32} style={{ imageRendering: 'pixelated' }}>
          <rect x={0} y={2} width={24} height={18} rx={1} fill="#2a2a40" stroke="#3e3e5c" strokeWidth={1} />
          <rect x={2} y={4} width={20} height={14} fill="#1a1c2c" />
          <rect x={4} y={6} width={6} height={3} fill="#41a6f6" opacity={0.6} />
          <rect x={12} y={6} width={8} height={2} fill="#38b764" opacity={0.4} />
          <rect x={30} y={2} width={24} height={18} rx={1} fill="#2a2a40" stroke="#3e3e5c" strokeWidth={1} />
          <rect x={32} y={4} width={20} height={14} fill="#1a1c2c" />
          <rect x={34} y={6} width={10} height={2} fill="#f77622" opacity={0.4} />
          <rect x={34} y={10} width={6} height={2} fill="#73eff7" opacity={0.3} />
          <rect x={10} y={20} width={4} height={6} fill="#3e3e5c" />
          <rect x={40} y={20} width={4} height={6} fill="#3e3e5c" />
          <rect x={4} y={26} width={16} height={3} rx={1} fill="#3e3e5c" />
          <rect x={34} y={26} width={16} height={3} rx={1} fill="#3e3e5c" />
        </svg>
      );
    case 'ultrawide':
      return (
        <svg width={64} height={30} style={{ imageRendering: 'pixelated' }}>
          <rect x={0} y={2} width={64} height={20} rx={2} fill="#2a2a40" stroke="#3e3e5c" strokeWidth={1} />
          <rect x={2} y={4} width={60} height={16} fill="#1a1c2c" />
          <rect x={4} y={6} width={14} height={3} fill="#41a6f6" opacity={0.5} />
          <rect x={22} y={6} width={20} height={2} fill="#38b764" opacity={0.3} />
          <rect x={46} y={6} width={12} height={4} fill="#b13e53" opacity={0.3} />
          <rect x={4} y={12} width={30} height={2} fill="#73eff7" opacity={0.2} />
          <rect x={28} y={22} width={8} height={4} fill="#3e3e5c" />
          <rect x={20} y={26} width={24} height={3} rx={1} fill="#3e3e5c" />
        </svg>
      );
    case 'laptop':
      return (
        <svg width={40} height={30} style={{ imageRendering: 'pixelated' }}>
          <rect x={4} y={2} width={32} height={20} rx={1} fill="#2a2a40" stroke="#3e3e5c" strokeWidth={1} />
          <rect x={6} y={4} width={28} height={16} fill="#1a1c2c" />
          <rect x={8} y={6} width={10} height={3} fill="#41a6f6" opacity={0.5} />
          <rect x={20} y={6} width={12} height={2} fill="#38b764" opacity={0.3} />
          <rect x={0} y={22} width={40} height={4} rx={1} fill="#3e3e5c" />
          <rect x={12} y={24} width={16} height={2} rx={1} fill="#2a2a40" />
        </svg>
      );
    default: // single
      return (
        <svg width={32} height={30} style={{ imageRendering: 'pixelated' }}>
          <rect x={2} y={2} width={28} height={20} rx={1} fill="#2a2a40" stroke="#3e3e5c" strokeWidth={1} />
          <rect x={4} y={4} width={24} height={16} fill="#1a1c2c" />
          <rect x={6} y={6} width={8} height={3} fill="#41a6f6" opacity={0.6} />
          <rect x={16} y={6} width={10} height={2} fill="#38b764" opacity={0.4} />
          <rect x={6} y={12} width={16} height={2} fill="#73eff7" opacity={0.2} />
          <rect x={12} y={22} width={8} height={4} fill="#3e3e5c" />
          <rect x={6} y={26} width={20} height={3} rx={1} fill="#3e3e5c" />
        </svg>
      );
  }
}

// ── PixelDecoration ──────────────────────────────────────
export function PixelDecoration({
  type,
  size = 16,
}: {
  type: DeskDecoration;
  size?: number;
}) {
  const s = size;
  switch (type) {
    case 'plant':
      return (
        <svg width={s} height={s} style={{ imageRendering: 'pixelated' }}>
          <rect x={s * 0.3} y={s * 0.6} width={s * 0.4} height={s * 0.35} rx={1} fill="#8b6b4a" />
          <circle cx={s * 0.5} cy={s * 0.4} r={s * 0.25} fill="#38b764" />
          <circle cx={s * 0.35} cy={s * 0.5} r={s * 0.15} fill="#2a9d4e" />
        </svg>
      );
    case 'coffee':
      return (
        <svg width={s} height={s} style={{ imageRendering: 'pixelated' }}>
          <rect x={s * 0.25} y={s * 0.35} width={s * 0.45} height={s * 0.5} rx={1} fill="#f4f4f4" />
          <rect x={s * 0.65} y={s * 0.45} width={s * 0.15} height={s * 0.25} rx={2} fill="none" stroke="#f4f4f4" strokeWidth={1} />
          <rect x={s * 0.3} y={s * 0.4} width={s * 0.35} height={s * 0.15} fill="#8b6b4a" />
          <path d={`M${s * 0.35} ${s * 0.3} Q${s * 0.4} ${s * 0.15} ${s * 0.5} ${s * 0.3}`} fill="none" stroke="#aaa" strokeWidth={1} opacity={0.5} />
        </svg>
      );
    case 'figurine':
      return (
        <svg width={s} height={s} style={{ imageRendering: 'pixelated' }}>
          <rect x={s * 0.35} y={s * 0.15} width={s * 0.3} height={s * 0.25} rx={2} fill="#f77622" />
          <rect x={s * 0.3} y={s * 0.4} width={s * 0.4} height={s * 0.35} rx={1} fill="#f77622" />
          <rect x={s * 0.3} y={s * 0.75} width={s * 0.15} height={s * 0.2} fill="#f77622" />
          <rect x={s * 0.55} y={s * 0.75} width={s * 0.15} height={s * 0.2} fill="#f77622" />
        </svg>
      );
    case 'photo':
      return (
        <svg width={s} height={s} style={{ imageRendering: 'pixelated' }}>
          <rect x={s * 0.15} y={s * 0.2} width={s * 0.7} height={s * 0.55} rx={1} fill="#5c4f44" />
          <rect x={s * 0.2} y={s * 0.25} width={s * 0.6} height={s * 0.45} fill="#87CEEB" />
          <rect x={s * 0.2} y={s * 0.5} width={s * 0.6} height={s * 0.2} fill="#38b764" />
          <circle cx={s * 0.55} cy={s * 0.38} r={s * 0.08} fill="#f7df1e" />
        </svg>
      );
    case 'lamp':
      return (
        <svg width={s} height={s} style={{ imageRendering: 'pixelated' }}>
          <rect x={s * 0.4} y={s * 0.4} width={s * 0.2} height={s * 0.5} fill="#555" />
          <rect x={s * 0.3} y={s * 0.85} width={s * 0.4} height={s * 0.1} rx={1} fill="#555" />
          <path d={`M${s * 0.25} ${s * 0.4} L${s * 0.5} ${s * 0.15} L${s * 0.75} ${s * 0.4} Z`} fill="#f7df1e" />
          <circle cx={s * 0.5} cy={s * 0.35} r={s * 0.06} fill="#fff" opacity={0.8} />
        </svg>
      );
    case 'stickers':
      return (
        <svg width={s} height={s} style={{ imageRendering: 'pixelated' }}>
          <rect x={s * 0.1} y={s * 0.2} width={s * 0.3} height={s * 0.25} rx={2} fill="#4A90D9" transform={`rotate(-10 ${s * 0.25} ${s * 0.3})`} />
          <rect x={s * 0.35} y={s * 0.15} width={s * 0.3} height={s * 0.25} rx={2} fill="#38b764" transform={`rotate(5 ${s * 0.5} ${s * 0.25})`} />
          <rect x={s * 0.55} y={s * 0.3} width={s * 0.3} height={s * 0.25} rx={2} fill="#f77622" transform={`rotate(-5 ${s * 0.7} ${s * 0.4})`} />
          <rect x={s * 0.2} y={s * 0.5} width={s * 0.35} height={s * 0.25} rx={2} fill="#b13e53" transform={`rotate(8 ${s * 0.35} ${s * 0.6})`} />
        </svg>
      );
    default:
      return null;
  }
}

// ── Office Furniture ─────────────────────────────────────

export function PixelPlant({ variant = 0 }: { variant?: number }) {
  const colors = [
    { pot: '#8b6b4a', leaf: '#38b764', leafDark: '#2a9d4e' },
    { pot: '#6b4226', leaf: '#4CAF50', leafDark: '#388E3C' },
    { pot: '#5c4f44', leaf: '#73eff7', leafDark: '#41a6f6' },
    { pot: '#8b6b4a', leaf: '#b13e53', leafDark: '#8b2a3e' },
  ];
  const c = colors[variant % colors.length];

  return (
    <svg width={24} height={36} style={{ imageRendering: 'pixelated' }}>
      <rect x={6} y={22} width={12} height={12} rx={1} fill={c.pot} />
      <rect x={4} y={20} width={16} height={4} rx={1} fill={shadeColor(c.pot, 15)} />
      <ellipse cx={12} cy={12} rx={8} ry={10} fill={c.leaf} />
      <ellipse cx={8} cy={14} rx={4} ry={6} fill={c.leafDark} />
      <ellipse cx={16} cy={10} rx={3} ry={5} fill={c.leafDark} />
      <rect x={11} y={10} width={2} height={14} fill={shadeColor(c.pot, -10)} />
    </svg>
  );
}

export function PixelSofa() {
  return (
    <svg width={64} height={36} style={{ imageRendering: 'pixelated' }}>
      <rect x={4} y={8} width={56} height={20} rx={3} fill="#5c4f80" />
      <rect x={0} y={4} width={12} height={24} rx={3} fill="#4a3f6e" />
      <rect x={52} y={4} width={12} height={24} rx={3} fill="#4a3f6e" />
      <rect x={8} y={10} width={48} height={14} rx={2} fill="#6b5f90" />
      <rect x={4} y={28} width={8} height={6} rx={1} fill="#3e3650" />
      <rect x={52} y={28} width={8} height={6} rx={1} fill="#3e3650" />
      {/* Cushion lines */}
      <line x1={24} y1={12} x2={24} y2={22} stroke="#5c4f80" strokeWidth={1} />
      <line x1={40} y1={12} x2={40} y2={22} stroke="#5c4f80" strokeWidth={1} />
    </svg>
  );
}

export function PixelCoffeeMachine() {
  return (
    <svg width={28} height={40} style={{ imageRendering: 'pixelated' }}>
      <rect x={4} y={8} width={20} height={28} rx={2} fill="#3e3e5c" />
      <rect x={6} y={4} width={16} height={6} rx={2} fill="#555" />
      <rect x={8} y={14} width={12} height={8} rx={1} fill="#1a1c2c" />
      <rect x={10} y={16} width={8} height={4} fill="#41a6f6" opacity={0.5} />
      <circle cx={14} cy={28} r={3} fill="#b13e53" />
      <rect x={10} y={32} width={8} height={2} fill="#8b6b4a" />
    </svg>
  );
}

export function PixelWaterCooler() {
  return (
    <svg width={24} height={44} style={{ imageRendering: 'pixelated' }}>
      <rect x={4} y={20} width={16} height={20} rx={2} fill="#e0e0e0" />
      <rect x={6} y={4} width={12} height={18} rx={6} fill="#87CEEB" opacity={0.7} />
      <rect x={8} y={6} width={8} height={14} rx={4} fill="#b3e0f2" opacity={0.5} />
      <rect x={8} y={36} width={4} height={4} fill="#4A90D9" />
      <rect x={14} y={36} width={4} height={4} fill="#b13e53" />
      <rect x={2} y={40} width={20} height={3} rx={1} fill="#ccc" />
    </svg>
  );
}

export function PixelWhiteboard() {
  return (
    <svg width={64} height={48} style={{ imageRendering: 'pixelated' }}>
      <rect x={2} y={4} width={60} height={36} rx={1} fill="#f4f4f4" stroke="#ccc" strokeWidth={2} />
      <rect x={6} y={8} width={20} height={2} fill="#4A90D9" />
      <rect x={6} y={14} width={30} height={2} fill="#333" opacity={0.3} />
      <rect x={6} y={20} width={24} height={2} fill="#333" opacity={0.3} />
      <rect x={6} y={26} width={18} height={2} fill="#38b764" />
      <rect x={40} y={10} width={16} height={20} rx={1} fill="#f77622" opacity={0.2} />
      <rect x={6} y={32} width={12} height={2} fill="#b13e53" opacity={0.4} />
      {/* Tray */}
      <rect x={16} y={40} width={32} height={4} rx={1} fill="#ccc" />
      <rect x={20} y={41} width={4} height={2} rx={0.5} fill="#b13e53" />
      <rect x={26} y={41} width={4} height={2} rx={0.5} fill="#4A90D9" />
      <rect x={32} y={41} width={4} height={2} rx={0.5} fill="#38b764" />
    </svg>
  );
}

export function PixelBookshelf() {
  return (
    <svg width={48} height={56} style={{ imageRendering: 'pixelated' }}>
      {/* Frame */}
      <rect x={2} y={2} width={44} height={52} rx={1} fill="#5c4f44" />
      <rect x={4} y={4} width={40} height={48} fill="#8b6b4a" />
      {/* Shelves */}
      {[0, 1, 2].map(row => (
        <g key={row}>
          <rect x={4} y={4 + row * 16} width={40} height={14} fill="#6b5540" />
          {/* Books */}
          {Array.from({ length: 5 + row }, (_, i) => (
            <rect
              key={i}
              x={6 + i * 7}
              y={5 + row * 16}
              width={5}
              height={12}
              rx={0.5}
              fill={['#4A90D9', '#b13e53', '#38b764', '#f77622', '#5d275d', '#73eff7', '#333', '#f7df1e'][i % 8]}
            />
          ))}
          <rect x={4} y={18 + row * 16} width={40} height={2} fill="#5c4f44" />
        </g>
      ))}
    </svg>
  );
}

export function PixelTable() {
  return (
    <svg width={48} height={28} style={{ imageRendering: 'pixelated' }}>
      <rect x={2} y={4} width={44} height={8} rx={2} fill="#8b6b4a" />
      <rect x={2} y={6} width={44} height={3} fill="#9b7b5a" />
      <rect x={6} y={12} width={4} height={14} fill="#6b5540" />
      <rect x={38} y={12} width={4} height={14} fill="#6b5540" />
    </svg>
  );
}

export function PixelRug() {
  return (
    <svg width={96} height={64} style={{ imageRendering: 'pixelated' }}>
      <rect x={2} y={2} width={92} height={60} rx={4} fill="#5d275d" opacity={0.4} />
      <rect x={6} y={6} width={84} height={52} rx={3} fill="#5d275d" opacity={0.3} />
      <rect x={12} y={12} width={72} height={40} rx={2} fill="#73eff7" opacity={0.08} />
      {/* Pattern */}
      <rect x={20} y={20} width={56} height={24} rx={2} fill="none" stroke="#73eff7" strokeWidth={1} opacity={0.15} />
      <line x1={48} y1={12} x2={48} y2={52} stroke="#73eff7" strokeWidth={0.5} opacity={0.1} />
      <line x1={12} y1={32} x2={84} y2={32} stroke="#73eff7" strokeWidth={0.5} opacity={0.1} />
    </svg>
  );
}

// ── Helper ───────────────────────────────────────────────
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
