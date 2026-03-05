'use client';

import { useRef, useState, useMemo, Fragment } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Team } from '@/lib/api';

interface Props {
  team: Team;
  position: [number, number, number];
  onClick: () => void;
}

const BODY_W = 3.0;
const BODY_D = 2.6;
const FLOOR_H = 1.3;
const WIN_W = 0.42;
const WIN_H = 0.55;

export default function Building3D({ team, position, onClick }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const members = Number(team.member_count) || 1;
  const floors = Math.max(2, Math.min(8, Math.ceil(members / 2)));
  const bodyH = floors * FLOOR_H;

  const color = useMemo(() => new THREE.Color(team.color), [team.color]);
  const darkColor = useMemo(() => color.clone().multiplyScalar(0.45), [color]);
  const accentColor = useMemo(() => color.clone().lerp(new THREE.Color('#ffffff'), 0.15), [color]);

  const windowStates = useMemo(() => {
    const rng = mulberry(team.id);
    return Array.from({ length: floors * 6 }, (_, i) => {
      const floor = Math.floor(i / 6);
      const activeProb = members > floor * 3 + (i % 6) ? 0.75 : 0.08;
      return rng() < activeProb;
    });
  }, [team.id, floors, members]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = hovered ? 1.04 : 1;
    const s = groupRef.current.scale;
    s.x = THREE.MathUtils.lerp(s.x, target, delta * 8);
    s.y = THREE.MathUtils.lerp(s.y, target, delta * 8);
    s.z = THREE.MathUtils.lerp(s.z, target, delta * 8);
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };
  const onClk = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <group ref={groupRef} position={position} onPointerOver={onOver} onPointerOut={onOut} onClick={onClk}>
      {/* Foundation */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[BODY_W + 0.5, 0.24, BODY_D + 0.5]} />
        <meshStandardMaterial color="#1e1e2e" roughness={0.95} />
      </mesh>

      {/* Main body */}
      <mesh position={[0, bodyH / 2 + 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[BODY_W, bodyH, BODY_D]} />
        <meshStandardMaterial
          color={hovered ? accentColor : color}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>

      {/* Side shading — gives a 3D depth look */}
      <mesh position={[BODY_W / 2 - 0.01, bodyH / 2 + 0.24, 0]}>
        <planeGeometry args={[0.01, bodyH]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Roof slab */}
      <mesh position={[0, bodyH + 0.39, 0]} castShadow>
        <boxGeometry args={[BODY_W + 0.3, 0.3, BODY_D + 0.3]} />
        <meshStandardMaterial color={darkColor} roughness={0.5} metalness={0.15} />
      </mesh>

      {/* Roof edge trim */}
      <mesh position={[0, bodyH + 0.56, 0]}>
        <boxGeometry args={[BODY_W + 0.35, 0.04, BODY_D + 0.35]} />
        <meshStandardMaterial color={darkColor} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Rooftop details */}
      {floors > 4 && (
        <group>
          {/* Antenna */}
          <mesh position={[0.9, bodyH + 1.6, 0.7]}>
            <cylinderGeometry args={[0.025, 0.025, 2, 4]} />
            <meshStandardMaterial color="#666677" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0.9, bodyH + 2.6, 0.7]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color="#ff3333" emissive="#ff0000" emissiveIntensity={2} />
          </mesh>
        </group>
      )}

      {floors > 6 && (
        <mesh position={[-0.7, bodyH + 0.9, -0.6]}>
          <boxGeometry args={[0.8, 0.6, 0.8]} />
          <meshStandardMaterial color="#333344" roughness={0.8} />
        </mesh>
      )}

      {/* Windows — 6 per floor: 2 front, 2 back, 1 left, 1 right */}
      {Array.from({ length: floors }).map((_, f) => {
        const y = f * FLOOR_H + 0.24 + FLOOR_H * 0.5;
        const fz = BODY_D / 2 + 0.02;
        const fx = BODY_W / 2 + 0.02;
        const base = f * 6;
        return (
          <Fragment key={f}>
            <Window pos={[-0.65, y, fz]} rot={0} lit={windowStates[base]} hovered={hovered} />
            <Window pos={[0.65, y, fz]} rot={0} lit={windowStates[base + 1]} hovered={hovered} />
            <Window pos={[-0.65, y, -fz]} rot={0} lit={windowStates[base + 2]} hovered={hovered} />
            <Window pos={[0.65, y, -fz]} rot={0} lit={windowStates[base + 3]} hovered={hovered} />
            <Window pos={[fx, y, 0]} rot={Math.PI / 2} lit={windowStates[base + 4]} hovered={hovered} />
            <Window pos={[-fx, y, 0]} rot={Math.PI / 2} lit={windowStates[base + 5]} hovered={hovered} />
          </Fragment>
        );
      })}

      {/* Door */}
      <mesh position={[0, 0.85, BODY_D / 2 + 0.02]}>
        <planeGeometry args={[0.7, 1.15]} />
        <meshStandardMaterial color="#3a1e0a" roughness={0.9} />
      </mesh>
      {/* Door frame */}
      <mesh position={[0, 0.85, BODY_D / 2 + 0.03]}>
        <planeGeometry args={[0.8, 1.25]} />
        <meshStandardMaterial color="#2a1508" roughness={0.9} />
      </mesh>

      {/* Warm interior glow */}
      <pointLight
        position={[0, bodyH * 0.45, 0]}
        color="#ffcc66"
        intensity={hovered ? 4 : 1}
        distance={10}
        decay={2}
      />

      {/* Label */}
      <Html
        position={[0, bodyH + 1.8, 0]}
        center
        distanceFactor={18}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div className="text-center whitespace-nowrap">
          <div className="text-white text-[11px] font-pixel bg-black/70 px-2 py-1 rounded-sm border border-white/10 shadow-lg">
            {team.name}
          </div>
          <div className="text-[9px] font-pixel mt-1" style={{ color: team.color }}>
            {members} {members === 1 ? 'dev' : 'devs'}
          </div>
        </div>
      </Html>
    </group>
  );
}

/* ── Window sub-component ── */

function Window({ pos, rot, lit, hovered }: { pos: [number, number, number]; rot: number; lit: boolean; hovered: boolean }) {
  const intensity = lit ? (hovered ? 2.5 : 0.9) : 0.02;
  const col = lit ? '#FFD866' : '#151528';
  const emissive = lit ? '#FFD866' : '#0a0a18';

  return (
    <mesh position={pos} rotation={[0, rot, 0]}>
      <planeGeometry args={[WIN_W, WIN_H]} />
      <meshStandardMaterial
        color={col}
        emissive={emissive}
        emissiveIntensity={intensity}
        roughness={0.2}
        metalness={lit ? 0.1 : 0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ── Seeded RNG ── */

function mulberry(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
