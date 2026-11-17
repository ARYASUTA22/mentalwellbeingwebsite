"use client";

import React, { useMemo, useRef } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { Float, Outlines, RoundedBox, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useHud } from "@/components/hud/HudProvider";

interface SanctuaryIslandProps {
  onFloorClick?: (point: [number, number, number]) => void;
}

function CartoonPlant({
  position,
  potColor,
  leafColor,
  inkColor,
}: {
  position: [number, number, number];
  potColor: string;
  leafColor: string;
  inkColor: string;
}) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.22, 0.15, 0.4, 10]} />
        <meshToonMaterial color={potColor} />
        <Outlines thickness={0.025} color={inkColor} />
      </mesh>
      <mesh castShadow position={[0, 0.56, 0]}>
        <sphereGeometry args={[0.3, 12, 10]} />
        <meshToonMaterial color={leafColor} />
        <Outlines thickness={0.025} color={inkColor} />
      </mesh>
      <mesh castShadow position={[0.15, 0.7, 0.08]}>
        <sphereGeometry args={[0.17, 10, 8]} />
        <meshToonMaterial color={leafColor} />
        <Outlines thickness={0.022} color={inkColor} />
      </mesh>
    </group>
  );
}

function CartoonWatercooler({
  position,
  bodyColor,
  jugColor,
  inkColor,
  accentWarn,
}: {
  position: [number, number, number];
  bodyColor: string;
  jugColor: string;
  inkColor: string;
  accentWarn: string;
}) {
  return (
    <group position={position}>
      <RoundedBox
        args={[0.48, 0.72, 0.48]}
        radius={0.05}
        castShadow
        position={[0, 0.36, 0]}
      >
        <meshToonMaterial color={bodyColor} />
        <Outlines thickness={0.024} color={inkColor} />
      </RoundedBox>
      {/* Dispenser recess & cup taps */}
      <mesh position={[0, 0.52, -0.25]}>
        <boxGeometry args={[0.26, 0.18, 0.04]} />
        <meshToonMaterial color={inkColor} />
      </mesh>
      <mesh position={[-0.06, 0.55, -0.27]}>
        <boxGeometry args={[0.05, 0.05, 0.04]} />
        <meshToonMaterial color={jugColor} />
      </mesh>
      <mesh position={[0.06, 0.55, -0.27]}>
        <boxGeometry args={[0.05, 0.05, 0.04]} />
        <meshToonMaterial color={accentWarn} />
      </mesh>
      {/* Blue Water Jug */}
      <mesh castShadow position={[0, 0.94, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.44, 12]} />
        <meshToonMaterial color={jugColor} />
        <Outlines thickness={0.024} color={inkColor} />
      </mesh>
    </group>
  );
}

function CartoonOfficeWhiteboard({
  position,
  boardColor,
  frameColor,
  inkColor,
  noteA,
  noteB,
  noteC,
}: {
  position: [number, number, number];
  boardColor: string;
  frameColor: string;
  inkColor: string;
  noteA: string;
  noteB: string;
  noteC: string;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[1.55, 0.85, 0.08]} radius={0.03} castShadow>
        <meshToonMaterial color={frameColor} />
        <Outlines thickness={0.022} color={inkColor} />
      </RoundedBox>
      <mesh position={[0, 0, 0.045]}>
        <boxGeometry args={[1.38, 0.68, 0.02]} />
        <meshToonMaterial color={boardColor} />
      </mesh>
      {/* Sticky notes on whiteboard */}
      <mesh position={[-0.4, 0.12, 0.065]}>
        <boxGeometry args={[0.22, 0.2, 0.015]} />
        <meshToonMaterial color={noteA} />
      </mesh>
      <mesh position={[-0.1, 0.1, 0.065]}>
        <boxGeometry args={[0.22, 0.2, 0.015]} />
        <meshToonMaterial color={noteB} />
      </mesh>
      <mesh position={[0.22, -0.05, 0.065]}>
        <boxGeometry args={[0.28, 0.22, 0.015]} />
        <meshToonMaterial color={noteC} />
      </mesh>
    </group>
  );
}

/**
 * Cartoon Cel-Shaded Two-Wing Cozy Office Floorplan inspired by 2d-portfolio-kaboom:
 * West Collaboration & Voice Office + Glass-Partitioned Corridor + East Psychology & Focus Studio.
 */
export function SanctuaryIsland({ onFloorClick }: SanctuaryIslandProps) {
  const { tokens } = useHud();
  const ringRef = useRef<THREE.Mesh>(null);

  const colors = useMemo(
    () => ({
      voidBase: tokens?.worldVoid ?? "currentColor",
      ink: tokens?.cartoonInk ?? "currentColor",
      wood: tokens?.roomWood ?? "currentColor",
      plank: tokens?.roomWoodPlank ?? "currentColor",
      wall: tokens?.roomWall ?? "currentColor",
      trim: tokens?.roomWallTrim ?? "currentColor",
      rugWest: tokens?.roomRugWest ?? "currentColor",
      rugEast: tokens?.roomRugEast ?? "currentColor",
      trimLight: tokens?.textPrimary ?? "currentColor",
      accentPsych: tokens?.accentPsych ?? "currentColor",
      accentSelfcare: tokens?.accentSelfcare ?? "currentColor",
      accentVoice: tokens?.accentVoice ?? "currentColor",
      accentWarn: tokens?.statusWarning ?? "currentColor",
    }),
    [tokens]
  );

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.06;
    }
  });

  const handleFloorPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!onFloorClick) return;
    e.stopPropagation();
    onFloorClick([e.point.x, 0, e.point.z]);
  };

  if (!tokens) return null;

  return (
    <group>
      {/* Floating Cartoon Office Foundation Slab */}
      <mesh position={[0, -1.05, 0.2]} receiveShadow>
        <cylinderGeometry args={[10.9, 7.6, 1.5, 12]} />
        <meshToonMaterial color={colors.trim} />
        <Outlines thickness={0.04} color={colors.ink} />
      </mesh>

      <mesh position={[0, -3.05, 0.2]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[7.4, 2.7, 12]} />
        <meshToonMaterial color={colors.voidBase} />
        <Outlines thickness={0.04} color={colors.ink} />
      </mesh>

      <mesh
        ref={ringRef}
        position={[0, -0.35, 0.2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[10.5, 0.045, 10, 72]} />
        <meshStandardMaterial
          color={colors.accentSelfcare}
          emissive={colors.accentSelfcare}
          emissiveIntensity={0.6}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* ================= WEST OFFICE WING (Breakroom & Voice Hub) ================= */}
      <RoundedBox
        args={[7.2, 0.2, 6.4]}
        radius={0.06}
        smoothness={2}
        receiveShadow
        position={[-5.3, -0.1, 0]}
        onPointerDown={handleFloorPointerDown}
      >
        <meshToonMaterial color={colors.wood} />
        <Outlines thickness={0.03} color={colors.ink} />
      </RoundedBox>

      {[-2.2, -0.9, 0.4, 1.7].map((zOffset) => (
        <mesh
          key={`w-plank-${zOffset}`}
          position={[-5.3, 0.005, zOffset]}
          onPointerDown={handleFloorPointerDown}
        >
          <boxGeometry args={[6.9, 0.015, 0.08]} />
          <meshToonMaterial color={colors.plank} />
        </mesh>
      ))}

      {/* West Office Collaboration Carpet */}
      <RoundedBox
        args={[4.2, 0.05, 3.3]}
        radius={0.02}
        receiveShadow
        position={[-5.5, 0.015, 0.25]}
        onPointerDown={handleFloorPointerDown}
      >
        <meshToonMaterial color={colors.trimLight} />
        <Outlines thickness={0.02} color={colors.ink} />
      </RoundedBox>
      <mesh
        receiveShadow
        position={[-5.5, 0.025, 0.25]}
        onPointerDown={handleFloorPointerDown}
      >
        <boxGeometry args={[3.85, 0.045, 2.95]} />
        <meshToonMaterial color={colors.rugWest} />
      </mesh>

      {/* West Office North Wall + Trim */}
      <RoundedBox
        args={[7.4, 1.4, 0.28]}
        radius={0.05}
        castShadow
        receiveShadow
        position={[-5.3, 0.68, -3.25]}
      >
        <meshToonMaterial color={colors.wall} />
        <Outlines thickness={0.03} color={colors.ink} />
      </RoundedBox>
      <mesh position={[-5.3, 1.4, -3.25]}>
        <boxGeometry args={[7.48, 0.14, 0.34]} />
        <meshToonMaterial color={colors.trim} />
        <Outlines thickness={0.025} color={colors.ink} />
      </mesh>

      {/* West Office Panoramic Windows */}
      {[-7.4, -3.8].map((wx) => (
        <group key={wx} position={[wx, 0.82, -3.1]}>
          <mesh>
            <boxGeometry args={[0.96, 0.72, 0.07]} />
            <meshToonMaterial color={colors.trim} />
            <Outlines thickness={0.02} color={colors.ink} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[0.76, 0.54, 0.05]} />
            <meshStandardMaterial
              color={colors.accentPsych}
              emissive={colors.accentPsych}
              emissiveIntensity={0.85}
            />
          </mesh>
        </group>
      ))}

      {/* West Office Walls */}
      <RoundedBox
        args={[7.4, 0.72, 0.26]}
        radius={0.04}
        castShadow
        receiveShadow
        position={[-5.3, 0.35, 3.25]}
      >
        <meshToonMaterial color={colors.wall} />
        <Outlines thickness={0.03} color={colors.ink} />
      </RoundedBox>
      <RoundedBox
        args={[0.26, 1.15, 2.85]}
        radius={0.04}
        castShadow
        position={[-8.9, 0.56, -1.85]}
      >
        <meshToonMaterial color={colors.wall} />
        <Outlines thickness={0.03} color={colors.ink} />
      </RoundedBox>
      <RoundedBox
        args={[0.26, 1.15, 2.05]}
        radius={0.04}
        castShadow
        position={[-8.9, 0.56, 2.25]}
      >
        <meshToonMaterial color={colors.wall} />
        <Outlines thickness={0.03} color={colors.ink} />
      </RoundedBox>

      {/* Office Reception Entry Pad */}
      <RoundedBox
        args={[1.25, 0.14, 1.7]}
        radius={0.04}
        receiveShadow
        position={[-9.5, -0.06, 0.4]}
        onPointerDown={handleFloorPointerDown}
      >
        <meshToonMaterial color={colors.plank} />
        <Outlines thickness={0.025} color={colors.ink} />
      </RoundedBox>

      {/* West-to-Corridor Glass-Trimmed Walls */}
      <RoundedBox
        args={[0.26, 1.15, 2.55]}
        radius={0.04}
        castShadow
        position={[-1.75, 0.56, -2.0]}
      >
        <meshToonMaterial color={colors.wall} />
        <Outlines thickness={0.03} color={colors.ink} />
      </RoundedBox>
      <RoundedBox
        args={[0.26, 1.15, 1.9]}
        radius={0.04}
        castShadow
        position={[-1.75, 0.56, 2.35]}
      >
        <meshToonMaterial color={colors.wall} />
        <Outlines thickness={0.03} color={colors.ink} />
      </RoundedBox>

      {/* ================= GLASS-PARTITIONED OFFICE CORRIDOR ================= */}
      <RoundedBox
        args={[3.9, 0.2, 2.2]}
        radius={0.05}
        receiveShadow
        position={[0, -0.1, 0.3]}
        onPointerDown={handleFloorPointerDown}
      >
        <meshToonMaterial color={colors.wood} />
        <Outlines thickness={0.03} color={colors.ink} />
      </RoundedBox>
      {/* North Glass Office Partition */}
      <RoundedBox
        args={[3.7, 0.36, 0.24]}
        radius={0.03}
        castShadow
        position={[0, 0.18, -0.85]}
      >
        <meshToonMaterial color={colors.trim} />
        <Outlines thickness={0.025} color={colors.ink} />
      </RoundedBox>
      <mesh position={[0, 0.72, -0.85]}>
        <boxGeometry args={[3.5, 0.72, 0.08]} />
        <meshStandardMaterial
          color={colors.accentPsych}
          transparent
          opacity={0.32}
        />
      </mesh>
      {/* South Glass Partition */}
      <RoundedBox
        args={[3.7, 0.36, 0.24]}
        radius={0.03}
        castShadow
        position={[0, 0.18, 1.45]}
      >
        <meshToonMaterial color={colors.trim} />
        <Outlines thickness={0.025} color={colors.ink} />
      </RoundedBox>
      <mesh position={[0, 0.54, 1.45]}>
        <boxGeometry args={[3.5, 0.38, 0.08]} />
        <meshStandardMaterial
          color={colors.accentSelfcare}
          transparent
          opacity={0.32}
        />
      </mesh>

      {/* ================= EAST OFFICE STUDIO (Psychology & Focus) ================= */}
      <RoundedBox
        args={[7.2, 0.2, 7.0]}
        radius={0.06}
        smoothness={2}
        receiveShadow
        position={[5.3, -0.1, 0.3]}
        onPointerDown={handleFloorPointerDown}
      >
        <meshToonMaterial color={colors.wood} />
        <Outlines thickness={0.03} color={colors.ink} />
      </RoundedBox>

      {[-2.0, -0.6, 0.8, 2.2].map((zOffset) => (
        <mesh
          key={`e-plank-${zOffset}`}
          position={[5.3, 0.005, zOffset]}
          onPointerDown={handleFloorPointerDown}
        >
          <boxGeometry args={[6.9, 0.015, 0.08]} />
          <meshToonMaterial color={colors.plank} />
        </mesh>
      ))}

      {/* East Studio Indigo Focus Rug */}
      <RoundedBox
        args={[3.5, 0.05, 4.1]}
        radius={0.02}
        receiveShadow
        position={[5.6, 0.015, 0.7]}
        onPointerDown={handleFloorPointerDown}
      >
        <meshToonMaterial color={colors.trimLight} />
        <Outlines thickness={0.02} color={colors.ink} />
      </RoundedBox>
      <mesh
        receiveShadow
        position={[5.6, 0.025, 0.7]}
        onPointerDown={handleFloorPointerDown}
      >
        <boxGeometry args={[3.15, 0.045, 3.75]} />
        <meshToonMaterial color={colors.rugEast} />
      </mesh>

      {/* East Studio North Wall + Trim */}
      <RoundedBox
        args={[7.4, 1.4, 0.28]}
        radius={0.05}
        castShadow
        receiveShadow
        position={[5.3, 0.68, -3.25]}
      >
        <meshToonMaterial color={colors.wall} />
        <Outlines thickness={0.03} color={colors.ink} />
      </RoundedBox>
      <mesh position={[5.3, 1.4, -3.25]}>
        <boxGeometry args={[7.48, 0.14, 0.34]} />
        <meshToonMaterial color={colors.trim} />
        <Outlines thickness={0.025} color={colors.ink} />
      </mesh>

      {/* East Office Sprint Whiteboard on North Wall */}
      <CartoonOfficeWhiteboard
        position={[4.2, 0.86, -3.05]}
        boardColor={colors.trimLight}
        frameColor={colors.trim}
        inkColor={colors.ink}
        noteA={colors.accentPsych}
        noteB={colors.accentSelfcare}
        noteC={colors.accentWarn}
      />

      {/* East Studio Window */}
      <group position={[7.4, 0.82, -3.1]}>
        <mesh>
          <boxGeometry args={[0.96, 0.72, 0.07]} />
          <meshToonMaterial color={colors.trim} />
          <Outlines thickness={0.02} color={colors.ink} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.76, 0.54, 0.05]} />
          <meshStandardMaterial
            color={colors.accentSelfcare}
            emissive={colors.accentSelfcare}
            emissiveIntensity={0.85}
          />
        </mesh>
      </group>

      {/* East Studio Remaining Walls */}
      <RoundedBox
        args={[7.4, 0.72, 0.26]}
        radius={0.04}
        castShadow
        position={[5.3, 0.35, 3.85]}
      >
        <meshToonMaterial color={colors.wall} />
        <Outlines thickness={0.03} color={colors.ink} />
      </RoundedBox>
      <RoundedBox
        args={[0.26, 1.15, 7.2]}
        radius={0.04}
        castShadow
        position={[8.9, 0.56, 0.3]}
      >
        <meshToonMaterial color={colors.wall} />
        <Outlines thickness={0.03} color={colors.ink} />
      </RoundedBox>
      <RoundedBox
        args={[0.26, 1.15, 2.55]}
        radius={0.04}
        castShadow
        position={[1.75, 0.56, -2.0]}
      >
        <meshToonMaterial color={colors.wall} />
        <Outlines thickness={0.03} color={colors.ink} />
      </RoundedBox>
      <RoundedBox
        args={[0.26, 1.15, 2.45]}
        radius={0.04}
        castShadow
        position={[1.75, 0.56, 2.65]}
      >
        <meshToonMaterial color={colors.wall} />
        <Outlines thickness={0.03} color={colors.ink} />
      </RoundedBox>

      {/* Office Breakroom Watercooler & Corner Monsteras */}
      <CartoonWatercooler
        position={[-2.45, 0, 2.5]}
        bodyColor={colors.trimLight}
        jugColor={colors.accentPsych}
        inkColor={colors.ink}
        accentWarn={colors.accentWarn}
      />

      <CartoonPlant
        position={[-8.2, 0, -2.5]}
        potColor={colors.trim}
        leafColor={colors.accentSelfcare}
        inkColor={colors.ink}
      />
      <CartoonPlant
        position={[8.2, 0, 3.1]}
        potColor={colors.trim}
        leafColor={colors.accentSelfcare}
        inkColor={colors.ink}
      />
      <CartoonPlant
        position={[2.45, 0, 3.1]}
        potColor={colors.trim}
        leafColor={colors.accentSelfcare}
        inkColor={colors.ink}
      />

      {/* Overhead Office Bar Light Fixtures */}
      {[-5.3, 5.3].map((lx) => (
        <RoundedBox
          key={`light-${lx}`}
          args={[2.4, 0.1, 0.24]}
          radius={0.03}
          position={[lx, 2.5, -2.95]}
        >
          <meshStandardMaterial
            color={colors.trimLight}
            emissive={colors.trimLight}
            emissiveIntensity={0.9}
          />
        </RoundedBox>
      ))}

      {/* Floating Comic Office Crystals */}
      <Float speed={1.5} rotationIntensity={0.45} floatIntensity={0.55}>
        <mesh position={[-9.6, 1.85, -3.6]}>
          <octahedronGeometry args={[0.34, 0]} />
          <meshToonMaterial color={colors.accentVoice} />
          <Outlines thickness={0.03} color={colors.ink} />
        </mesh>
      </Float>

      <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh position={[9.5, 1.95, -3.5]}>
          <octahedronGeometry args={[0.36, 0]} />
          <meshToonMaterial color={colors.accentPsych} />
          <Outlines thickness={0.03} color={colors.ink} />
        </mesh>
      </Float>

      <Sparkles
        count={40}
        scale={[19, 5, 10]}
        position={[0, 1.8, 0]}
        size={1.8}
        speed={0.22}
        opacity={0.45}
        color={colors.trimLight}
      />
    </group>
  );
}
