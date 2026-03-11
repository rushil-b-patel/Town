import type { Employee, Position, Desk, TeamZone, OfficeObject } from '@/types';

// ── Constants ────────────────────────────────────────────
export const TILE_SIZE = 32;
export const OFFICE_WIDTH = 1280;
export const OFFICE_HEIGHT = 960;

export const PIXEL_COLORS = {
  floor: '#2a2a3e',
  floorAlt: '#262636',
  wall: '#3e3e5c',
  wallShadow: '#2a2a40',
};

// ── Office Objects (decorations placed around the office) ─
export const OFFICE_OBJECTS: OfficeObject[] = [
  // Plants along the walls
  { type: 'plant', position: { x: 32, y: 80 } },
  { type: 'plant', position: { x: 1200, y: 80 } },
  { type: 'plant', position: { x: 32, y: 480 } },
  { type: 'plant', position: { x: 1200, y: 480 } },
  { type: 'plant', position: { x: 600, y: 80 } },

  // Lounge area (bottom-left)
  { type: 'sofa', position: { x: 64, y: 780 } },
  { type: 'sofa', position: { x: 200, y: 780 } },
  { type: 'table', position: { x: 136, y: 820 } },
  { type: 'rug', position: { x: 80, y: 760 } },

  // Kitchen area (bottom-right)
  { type: 'coffee-machine', position: { x: 1050, y: 780 } },
  { type: 'water-cooler', position: { x: 1150, y: 780 } },

  // Meeting area (top-center)
  { type: 'whiteboard', position: { x: 500, y: 80 } },
  { type: 'table', position: { x: 480, y: 140 } },

  // Library corner
  { type: 'bookshelf', position: { x: 1100, y: 80 } },

  // Extra plants
  { type: 'plant', position: { x: 640, y: 480 } },
  { type: 'plant', position: { x: 800, y: 800 } },
];

// ── Zone Colors ──────────────────────────────────────────
const ZONE_COLORS = [
  '#4A90D9', // blue
  '#38b764', // green
  '#f77622', // orange
  '#b13e53', // red
  '#73eff7', // cyan
  '#5d275d', // purple
];

// ── Build Team Zones from Employee List ──────────────────
export function buildTeamZones(employees: Employee[]): TeamZone[] {
  if (employees.length === 0) return [];

  // Group employees by subTeam
  const groups = new Map<string, Employee[]>();
  for (const emp of employees) {
    const team = emp.subTeam || 'General';
    if (!groups.has(team)) groups.set(team, []);
    groups.get(team)!.push(emp);
  }

  const zoneNames = Array.from(groups.keys());
  const zones: TeamZone[] = [];

  // Layout zones in a grid
  const zonesPerRow = Math.min(zoneNames.length, 3);
  const zoneWidth = 360;
  const zoneHeight = 260;
  const startX = 80;
  const startY = 100;
  const gapX = 40;
  const gapY = 40;

  zoneNames.forEach((name, idx) => {
    const members = groups.get(name)!;
    const row = Math.floor(idx / zonesPerRow);
    const col = idx % zonesPerRow;

    const zoneX = startX + col * (zoneWidth + gapX);
    const zoneY = startY + row * (zoneHeight + gapY);

    // Arrange desks inside zone
    const desksPerRow = 3;
    const deskSpacingX = 120;
    const deskSpacingY = 110;
    const deskStartX = zoneX + 20;
    const deskStartY = zoneY + 36;

    const desks: Desk[] = members.map((emp, di) => {
      const drow = Math.floor(di / desksPerRow);
      const dcol = di % desksPerRow;
      return {
        employee: emp,
        position: {
          x: deskStartX + dcol * deskSpacingX,
          y: deskStartY + drow * deskSpacingY,
        },
        direction: drow % 2 === 0 ? 'down' : 'up',
      };
    });

    // Calculate actual zone bounds from desk positions
    const maxDeskRow = Math.ceil(members.length / desksPerRow);
    const actualWidth = Math.max(zoneWidth, desksPerRow * deskSpacingX + 40);
    const actualHeight = Math.max(zoneHeight, maxDeskRow * deskSpacingY + 60);

    zones.push({
      name,
      color: ZONE_COLORS[idx % ZONE_COLORS.length],
      bounds: { x: zoneX, y: zoneY, width: actualWidth, height: actualHeight },
      desks,
    });
  });

  return zones;
}
