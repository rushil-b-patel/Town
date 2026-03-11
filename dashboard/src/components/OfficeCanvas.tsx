'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { buildTeamZones, OFFICE_OBJECTS, OFFICE_WIDTH, OFFICE_HEIGHT, TILE_SIZE, PIXEL_COLORS } from '@/lib/officeLayout';
import EmployeeDesk from './EmployeeDesk';
import PixelAvatar from './PixelAvatar';
import {
  PixelPlant, PixelSofa, PixelCoffeeMachine,
  PixelWaterCooler, PixelWhiteboard, PixelBookshelf,
  PixelTable, PixelRug
} from './PixelFurniture';

export default function OfficeCanvas() {
  const employees = useOfficeStore(s => s.employees);
  const playerPosition = useOfficeStore(s => s.playerPosition);
  const playerDirection = useOfficeStore(s => s.playerDirection);
  const movePlayer = useOfficeStore(s => s.movePlayer);
  const zoom = useOfficeStore(s => s.zoom);
  const setZoom = useOfficeStore(s => s.setZoom);
  const user = useOfficeStore(s => s.user);

  const containerRef = useRef<HTMLDivElement>(null);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const teamZones = buildTeamZones(employees);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const keyMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
      W: 'up', S: 'down', A: 'left', D: 'right',
    };
    const direction = keyMap[e.key];
    if (direction) {
      e.preventDefault();
      movePlayer(direction);
    }
  }, [movePlayer]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(zoom + delta);
  }, [zoom, setZoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 0 && e.shiftKey) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setViewOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Center view on player
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setViewOffset({
        x: rect.width / 2 - playerPosition.x * zoom,
        y: rect.height / 2 - playerPosition.y * zoom,
      });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-[#1a1c2c] relative select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      {/* Office world container */}
      <div
        className="absolute"
        style={{
          transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: OFFICE_WIDTH,
          height: OFFICE_HEIGHT,
        }}
      >
        {/* Floor */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              repeating-conic-gradient(${PIXEL_COLORS.floor} 0% 25%, ${PIXEL_COLORS.floorAlt} 0% 50%)
              0 0 / ${TILE_SIZE}px ${TILE_SIZE}px`,
          }}
        />

        {/* Wall (top) */}
        <div className="absolute top-0 left-0 right-0 h-[64px]" style={{ background: PIXEL_COLORS.wall }}>
          <div className="absolute bottom-0 left-0 right-0 h-[8px]" style={{ background: PIXEL_COLORS.wallShadow }} />
          {/* Wall detail - windows */}
          {[2, 8, 14, 24, 30, 36].map(x => (
            <div
              key={`window-${x}`}
              className="absolute"
              style={{
                left: x * TILE_SIZE,
                top: 8,
                width: TILE_SIZE * 2,
                height: 40,
                background: 'linear-gradient(180deg, #87CEEB 0%, #b3e0f2 100%)',
                border: '3px solid #5c4f44',
              }}
            >
              {/* Window cross */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-full h-[2px] bg-[#5c4f44]" />
                <div className="absolute w-[2px] h-full bg-[#5c4f44]" />
              </div>
            </div>
          ))}
          {/* Company sign */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2">
            <div className="bg-[#1a1c2c] px-6 py-2 pixel-border">
              <span className="text-[10px] font-pixel text-[#73eff7]">🏢 TOWN HQ</span>
            </div>
          </div>
        </div>

        {/* Team zones */}
        {teamZones.map((zone, zi) => (
          <div key={zone.name}>
            {/* Zone background */}
            <div
              className="absolute"
              style={{
                left: zone.bounds.x,
                top: zone.bounds.y,
                width: zone.bounds.width,
                height: zone.bounds.height,
                backgroundColor: zone.color,
                opacity: 0.08,
                borderRadius: 4,
              }}
            />
            {/* Zone border */}
            <div
              className="absolute"
              style={{
                left: zone.bounds.x,
                top: zone.bounds.y,
                width: zone.bounds.width,
                height: zone.bounds.height,
                border: `2px dashed ${zone.color}`,
                borderRadius: 4,
                opacity: 0.3,
              }}
            />
            {/* Zone label */}
            <div
              className="absolute font-pixel text-[8px] px-2 py-1"
              style={{
                left: zone.bounds.x + 8,
                top: zone.bounds.y + 4,
                color: zone.color,
                backgroundColor: '#1a1c2c',
                opacity: 0.9,
              }}
            >
              {zone.name}
            </div>

            {/* Desks */}
            {zone.desks.map((desk, di) => (
              <EmployeeDesk key={`desk-${zi}-${di}`} desk={desk} />
            ))}
          </div>
        ))}

        {/* Office objects */}
        {OFFICE_OBJECTS.map((obj, i) => (
          <div
            key={`obj-${i}`}
            className="absolute"
            style={{ left: obj.position.x, top: obj.position.y }}
          >
            {obj.type === 'plant' && <PixelPlant variant={i} />}
            {obj.type === 'sofa' && <PixelSofa />}
            {obj.type === 'coffee-machine' && <PixelCoffeeMachine />}
            {obj.type === 'water-cooler' && <PixelWaterCooler />}
            {obj.type === 'whiteboard' && <PixelWhiteboard />}
            {obj.type === 'bookshelf' && <PixelBookshelf />}
            {obj.type === 'table' && <PixelTable />}
            {obj.type === 'rug' && <PixelRug />}
          </div>
        ))}

        {/* Player avatar (your character) */}
        <div
          className="absolute z-20 transition-all duration-150"
          style={{
            left: playerPosition.x - 14,
            top: playerPosition.y - 24,
          }}
        >
          <PixelAvatar
            config={{
              skinColor: '#ffd5b3',
              hairColor: '#4a3728',
              hairStyle: 'short',
              shirtColor: '#f77622',
              pantsColor: '#3a3a5c',
              accessory: 'none',
            }}
            direction={playerDirection}
            isActive={true}
            size={28}
          />
          {/* Player label */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-[7px] font-pixel text-[#f77622] bg-[#1a1c2c]/80 px-1">
              {user?.trigram || 'YOU'}
            </span>
          </div>
        </div>

        {/* Grid overlay (subtle) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
            `,
            backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
          }}
        />
      </div>

      {/* Mini-map */}
      <div className="absolute bottom-4 left-4 w-[160px] h-[120px] bg-[#1a1c2c]/90 border border-[#3a3a5c] p-1 z-30">
        <div className="relative w-full h-full">
          {/* Mini zones */}
          {teamZones.map((zone, i) => (
            <div
              key={`mini-${i}`}
              className="absolute"
              style={{
                left: `${(zone.bounds.x / OFFICE_WIDTH) * 100}%`,
                top: `${(zone.bounds.y / OFFICE_HEIGHT) * 100}%`,
                width: `${(zone.bounds.width / OFFICE_WIDTH) * 100}%`,
                height: `${(zone.bounds.height / OFFICE_HEIGHT) * 100}%`,
                backgroundColor: zone.color,
                opacity: 0.4,
              }}
            />
          ))}
          {/* Mini player dot */}
          <div
            className="absolute w-2 h-2 bg-[#f77622] z-10"
            style={{
              left: `${(playerPosition.x / OFFICE_WIDTH) * 100}%`,
              top: `${(playerPosition.y / OFFICE_HEIGHT) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
          {/* Mini employee dots */}
          {teamZones.flatMap(zone =>
            zone.desks.map((desk, di) => (
              <div
                key={`mini-dot-${di}`}
                className="absolute w-1 h-1 bg-white/60"
                style={{
                  left: `${((desk.position.x + 48) / OFFICE_WIDTH) * 100}%`,
                  top: `${((desk.position.y + 40) / OFFICE_HEIGHT) * 100}%`,
                }}
              />
            ))
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <span className="text-[5px] font-pixel text-[#f4f4f4]/30">MINIMAP</span>
        </div>
      </div>
    </div>
  );
}
