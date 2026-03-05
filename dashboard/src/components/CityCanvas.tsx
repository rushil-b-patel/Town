'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import Building3D from './city/Building3D';
import type { Team } from '@/lib/api';

interface Props {
  teams: Team[];
  onBuildingClick: (team: Team) => void;
}

export default function CityCanvas({ teams, onBuildingClick }: Props) {
  const layout = useMemo(() => computeLayout(teams), [teams]);

  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas
        shadows
        camera={{ position: [24, 18, 24], fov: 50, near: 0.1, far: 200 }}
        onCreated={({ gl, scene }) => {
          scene.background = new THREE.Color('#060614');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <Suspense fallback={null}>
          <fog attach="fog" args={['#060614', 35, 90]} />

          {/* Lighting rig */}
          <ambientLight intensity={0.08} color="#8888cc" />
          <directionalLight
            position={[20, 30, 10]}
            intensity={0.2}
            color="#7777bb"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <hemisphereLight args={['#1a1a3e', '#0a2a0a', 0.08]} />

          {/* Night sky */}
          <Stars radius={80} depth={50} count={2000} factor={3} saturation={0} fade speed={0.3} />
          <Moon />

          {/* Camera */}
          <OrbitControls
            makeDefault
            maxPolarAngle={Math.PI / 2.2}
            minPolarAngle={Math.PI / 8}
            minDistance={6}
            maxDistance={55}
            enableDamping
            dampingFactor={0.05}
            target={[0, 2, 0]}
          />

          {/* World */}
          <Ground />
          <Road length={layout.roadLength} />

          {teams.map((team, i) => (
            <Building3D
              key={team.id}
              team={team}
              position={layout.positions[i]}
              onClick={() => onBuildingClick(team)}
            />
          ))}

          {layout.trees.map((pos, i) => (
            <Tree key={`t-${i}`} position={pos} seed={i} />
          ))}

          {layout.lamps.map((pos, i) => (
            <Lamppost key={`l-${i}`} position={pos} />
          ))}

          {/* City entrance sign */}
          <Html position={[0, 9, -layout.roadLength / 2 - 3]} center distanceFactor={20} style={{ pointerEvents: 'none' }}>
            <div className="font-pixel text-city-accent text-lg tracking-widest drop-shadow-[0_0_12px_rgba(74,224,138,0.6)]">
              CODETOWN
            </div>
          </Html>
        </Suspense>
      </Canvas>
    </div>
  );
}

/* ───────── Environment ───────── */

function Moon() {
  return (
    <group position={[40, 30, -30]}>
      <mesh>
        <sphereGeometry args={[3, 16, 16]} />
        <meshBasicMaterial color="#eeeedd" />
      </mesh>
      <pointLight color="#aaaacc" intensity={0.4} distance={120} decay={2} />
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[150, 150]} />
      <meshStandardMaterial color="#152515" roughness={1} />
    </mesh>
  );
}

function Road({ length }: { length: number }) {
  const halfLen = length / 2 + 5;
  return (
    <group>
      {/* Sidewalks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.8, 0.03, 0]}>
        <planeGeometry args={[1.2, halfLen * 2]} />
        <meshStandardMaterial color="#3a3a44" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.8, 0.03, 0]}>
        <planeGeometry args={[1.2, halfLen * 2]} />
        <meshStandardMaterial color="#3a3a44" roughness={0.9} />
      </mesh>

      {/* Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[4.4, halfLen * 2]} />
        <meshStandardMaterial color="#1e1e28" roughness={0.95} />
      </mesh>

      {/* Center dashes */}
      {Array.from({ length: Math.ceil(halfLen) }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, i * 2 - halfLen + 1]}>
          <planeGeometry args={[0.12, 0.9]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      ))}
    </group>
  );
}

function Tree({ position, seed }: { position: [number, number, number]; seed: number }) {
  const rng = mulberry32(seed * 31 + 7);
  const trunkH = 1.2 + rng() * 0.4;
  const canopyR = 0.6 + rng() * 0.3;
  const shade = rng() > 0.5;

  return (
    <group position={position}>
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, trunkH, 5]} />
        <meshStandardMaterial color="#3a2210" roughness={0.95} />
      </mesh>
      <mesh position={[0, trunkH + 0.5, 0]} castShadow>
        <coneGeometry args={[canopyR, 1.6, 6]} />
        <meshStandardMaterial color={shade ? '#1a5a2a' : '#226633'} roughness={0.85} />
      </mesh>
      <mesh position={[0, trunkH + 1.4, 0]}>
        <coneGeometry args={[canopyR * 0.7, 1.2, 6]} />
        <meshStandardMaterial color={shade ? '#226633' : '#2a7a3a'} roughness={0.85} />
      </mesh>
    </group>
  );
}

function Lamppost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 3.6, 6]} />
        <meshStandardMaterial color="#555566" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.3, 3.5, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 4]} />
        <meshStandardMaterial color="#555566" metalness={0.6} />
      </mesh>
      {/* Lamp */}
      <mesh position={[0.5, 3.6, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#ffeecc" emissive="#ffd866" emissiveIntensity={3} />
      </mesh>
      <pointLight position={[0.5, 3.4, 0]} color="#ffd866" intensity={4} distance={12} decay={2} />
    </group>
  );
}

/* ───────── Layout ───────── */

function computeLayout(teams: Team[]) {
  const spacing = 7;
  const positions: [number, number, number][] = [];
  const trees: [number, number, number][] = [];
  const lamps: [number, number, number][] = [];

  const rows = Math.ceil(teams.length / 2);
  const offsetZ = ((rows - 1) * spacing) / 2;

  teams.forEach((_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    positions.push([side * 6, 0, row * spacing - offsetZ]);
  });

  const roadLength = Math.max(20, rows * spacing + 10);

  // Trees — between building rows, on the outer edges
  for (let r = 0; r <= rows; r++) {
    const z = r * spacing - offsetZ - spacing / 2;
    trees.push([-10, 0, z]);
    trees.push([10, 0, z]);
    if (r % 2 === 0) {
      trees.push([-13, 0, z + 1]);
      trees.push([13, 0, z - 1]);
    }
  }

  // Lampposts — along both sidewalks
  for (let z = -roadLength / 2; z <= roadLength / 2; z += 10) {
    lamps.push([-3.5, 0, z]);
    lamps.push([3.5, 0, z]);
  }

  return { positions, trees, lamps, roadLength };
}

function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
