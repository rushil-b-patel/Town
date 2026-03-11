'use client';
import React from 'react';
import type { AvatarConfig } from '@/types';

interface Props {
  config: AvatarConfig;
  direction?: 'up' | 'down' | 'left' | 'right';
  isActive?: boolean;
  size?: number;
  className?: string;
}

export default function PixelAvatar({
  config,
  direction = 'down',
  isActive = false,
  size = 32,
  className = '',
}: Props) {
  const s = size;
  const half = s / 2;
  const headSize = s * 0.45;
  const bodyW = s * 0.4;
  const bodyH = s * 0.3;
  const legH = s * 0.2;

  // Directional offset for slight head turn
  const headOffsetX = direction === 'left' ? -2 : direction === 'right' ? 2 : 0;
  const faceVisible = direction !== 'up';

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={`${className} ${isActive ? 'animate-pulse-soft' : ''}`}
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Shadow */}
      <ellipse
        cx={half}
        cy={s - 2}
        rx={s * 0.25}
        ry={3}
        fill="rgba(0,0,0,0.3)"
      />

      {/* Legs */}
      <rect x={half - bodyW / 2 + 1} y={s * 0.7} width={bodyW * 0.35} height={legH} rx={1} fill={config.pantsColor} />
      <rect x={half + bodyW * 0.15 - 1} y={s * 0.7} width={bodyW * 0.35} height={legH} rx={1} fill={config.pantsColor} />

      {/* Body */}
      <rect
        x={half - bodyW / 2}
        y={s * 0.4}
        width={bodyW}
        height={bodyH}
        rx={2}
        fill={config.shirtColor}
      />
      {/* Shirt detail */}
      {faceVisible && (
        <line
          x1={half}
          y1={s * 0.4 + 2}
          x2={half}
          y2={s * 0.4 + bodyH - 2}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth={1}
        />
      )}

      {/* Head */}
      <rect
        x={half - headSize / 2 + headOffsetX}
        y={s * 0.08}
        width={headSize}
        height={headSize}
        rx={3}
        fill={config.skinColor}
      />

      {/* Hair */}
      {config.hairStyle !== 'none' && (
        <HairShape
          style={config.hairStyle}
          color={config.hairColor}
          x={half - headSize / 2 + headOffsetX}
          y={s * 0.08}
          w={headSize}
          h={headSize}
          direction={direction}
        />
      )}

      {/* Face (only when not facing up) */}
      {faceVisible && (
        <>
          {/* Eyes */}
          <rect x={half - headSize * 0.22 + headOffsetX} y={s * 0.08 + headSize * 0.4} width={2} height={2} fill="#1a1a2e" rx={0.5} />
          <rect x={half + headSize * 0.08 + headOffsetX} y={s * 0.08 + headSize * 0.4} width={2} height={2} fill="#1a1a2e" rx={0.5} />
          {/* Mouth */}
          <rect
            x={half - 1 + headOffsetX}
            y={s * 0.08 + headSize * 0.65}
            width={3}
            height={1}
            fill="rgba(0,0,0,0.2)"
            rx={0.5}
          />
        </>
      )}

      {/* Accessory */}
      <AccessoryShape
        type={config.accessory}
        x={half + headOffsetX}
        y={s * 0.08}
        headSize={headSize}
        direction={direction}
      />

      {/* Active indicator */}
      {isActive && (
        <circle cx={s - 4} cy={4} r={3} fill="#38b764" stroke="#1a1c2c" strokeWidth={1} />
      )}
    </svg>
  );
}

function HairShape({
  style, color, x, y, w, h, direction,
}: {
  style: string; color: string; x: number; y: number; w: number; h: number;
  direction: string;
}) {
  switch (style) {
    case 'short':
      return <rect x={x} y={y - 1} width={w} height={h * 0.35} rx={2} fill={color} />;
    case 'long':
      return (
        <>
          <rect x={x} y={y - 1} width={w} height={h * 0.35} rx={2} fill={color} />
          <rect x={x - 1} y={y + h * 0.3} width={3} height={h * 0.5} rx={1} fill={color} />
          <rect x={x + w - 2} y={y + h * 0.3} width={3} height={h * 0.5} rx={1} fill={color} />
        </>
      );
    case 'buzz':
      return <rect x={x + 1} y={y} width={w - 2} height={h * 0.25} rx={2} fill={color} />;
    case 'curly':
      return (
        <>
          <rect x={x - 1} y={y - 2} width={w + 2} height={h * 0.4} rx={4} fill={color} />
          <circle cx={x + 2} cy={y + h * 0.15} r={2} fill={color} />
          <circle cx={x + w - 2} cy={y + h * 0.15} r={2} fill={color} />
        </>
      );
    case 'mohawk':
      return (
        <>
          <rect x={x + w * 0.3} y={y - 4} width={w * 0.4} height={h * 0.5 + 4} rx={1} fill={color} />
        </>
      );
    default:
      return null;
  }
}

function AccessoryShape({
  type, x, y, headSize, direction,
}: {
  type: string; x: number; y: number; headSize: number; direction: string;
}) {
  if (type === 'none' || direction === 'up') return null;

  switch (type) {
    case 'glasses':
      return (
        <g>
          <rect x={x - headSize * 0.3} y={y + headSize * 0.35} width={headSize * 0.25} height={headSize * 0.15} rx={1} fill="none" stroke="#5c4f44" strokeWidth={1} />
          <rect x={x + headSize * 0.05} y={y + headSize * 0.35} width={headSize * 0.25} height={headSize * 0.15} rx={1} fill="none" stroke="#5c4f44" strokeWidth={1} />
          <line x1={x - headSize * 0.05} y1={y + headSize * 0.4} x2={x + headSize * 0.05} y2={y + headSize * 0.4} stroke="#5c4f44" strokeWidth={0.8} />
        </g>
      );
    case 'sunglasses':
      return (
        <g>
          <rect x={x - headSize * 0.3} y={y + headSize * 0.33} width={headSize * 0.28} height={headSize * 0.18} rx={1} fill="#1a1a2e" />
          <rect x={x + headSize * 0.05} y={y + headSize * 0.33} width={headSize * 0.28} height={headSize * 0.18} rx={1} fill="#1a1a2e" />
          <line x1={x - headSize * 0.02} y1={y + headSize * 0.39} x2={x + headSize * 0.05} y2={y + headSize * 0.39} stroke="#1a1a2e" strokeWidth={1} />
        </g>
      );
    case 'headphones':
      return (
        <g>
          <path d={`M${x - headSize * 0.35} ${y + headSize * 0.3} Q${x} ${y - headSize * 0.15} ${x + headSize * 0.35} ${y + headSize * 0.3}`} fill="none" stroke="#555" strokeWidth={2} />
          <rect x={x - headSize * 0.4} y={y + headSize * 0.25} width={headSize * 0.15} height={headSize * 0.2} rx={2} fill="#333" />
          <rect x={x + headSize * 0.25} y={y + headSize * 0.25} width={headSize * 0.15} height={headSize * 0.2} rx={2} fill="#333" />
        </g>
      );
    case 'hat':
      return (
        <g>
          <rect x={x - headSize * 0.4} y={y - 2} width={headSize * 0.8} height={3} rx={1} fill="#5c4f44" />
          <rect x={x - headSize * 0.25} y={y - 7} width={headSize * 0.5} height={6} rx={1} fill="#5c4f44" />
        </g>
      );
    case 'earring':
      return <circle cx={x + headSize * 0.4} cy={y + headSize * 0.55} r={1.5} fill="#f7df1e" />;
    default:
      return null;
  }
}
