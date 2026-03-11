'use client';
import React from 'react';
import type { Desk } from '@/types';
import { useOfficeStore } from '@/store/officeStore';
import PixelAvatar from './PixelAvatar';
import { PixelDesk, PixelChair, PixelMonitor, PixelDecoration } from './PixelFurniture';

interface Props {
  desk: Desk;
}

export default function EmployeeDesk({ desk }: Props) {
  const { employee, direction } = desk;
  const { selectEmployee, hoveredDesk, setHoveredDesk, selectedEmployee } = useOfficeStore();
  const isHovered = hoveredDesk === employee.id;
  const isSelected = selectedEmployee?.id === employee.id;
  const dc = employee.deskConfig;

  return (
    <div
      className="absolute cursor-pointer group"
      style={{
        left: desk.position.x,
        top: desk.position.y,
        width: 120,
        height: 110,
        transition: 'transform 0.2s',
      }}
      onClick={() => selectEmployee(employee)}
      onMouseEnter={() => setHoveredDesk(employee.id)}
      onMouseLeave={() => setHoveredDesk(null)}
    >
      {/* Selection / hover highlight */}
      {(isSelected || isHovered) && (
        <div
          className="absolute -inset-2 rounded-lg"
          style={{
            backgroundColor: isSelected ? 'rgba(74,144,217,0.08)' : 'rgba(255,255,255,0.04)',
            border: isSelected ? '1px solid rgba(74,144,217,0.25)' : '1px solid rgba(255,255,255,0.08)',
          }}
        />
      )}

      {/* Chair */}
      <div className="absolute" style={{ left: 0, top: 40 }}>
        <PixelChair style={dc.chair} color={dc.colorTheme} />
      </div>

      {/* Desk surface */}
      <div className="absolute" style={{ left: 32, top: 36 }}>
        <PixelDesk style={dc.style} color="#8b6b4a" width={80} height={40} />
      </div>

      {/* Monitor on desk */}
      <div className="absolute" style={{ left: 48, top: 12 }}>
        <PixelMonitor setup={dc.monitor} />
      </div>

      {/* Decorations */}
      {dc.decorations.slice(0, 2).map((d, i) => (
        <div key={d} className="absolute" style={{ left: 90 + i * 22, top: 28 }}>
          <PixelDecoration type={d} size={16} />
        </div>
      ))}

      {/* Avatar */}
      <div className="absolute" style={{ left: 4, top: 0 }}>
        <PixelAvatar config={employee.avatarConfig} direction={direction} size={28} isActive={Math.random() > 0.3} />
      </div>

      {/* Trigram label */}
      <div
        className="absolute text-center"
        style={{
          left: 20,
          top: 92,
          width: 80,
          fontSize: '9px',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          color: isSelected ? '#4A90D9' : '#8b92a8',
        }}
      >
        {employee.trigram}
      </div>

      {/* Hover tooltip */}
      {isHovered && (
        <div
          className="absolute whitespace-nowrap z-10"
          style={{
            left: 20,
            top: -28,
            background: '#1a1d27',
            border: '1px solid #2e3347',
            borderRadius: 6,
            padding: '4px 12px',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontFamily: "'Inter', sans-serif",
              color: '#e4e7ef',
            }}
          >
            {employee.displayName}
          </span>
        </div>
      )}
    </div>
  );
}
