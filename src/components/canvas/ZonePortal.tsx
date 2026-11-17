"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Outlines, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { NpcAccessory, StationId } from "@/components/hud/HudProvider";

export interface ZonePortalProps {
  stationId: StationId;
  label: string;
  npcName: string;
  npcRole: string;
  npcAccessory: NpcAccessory;
  npcOffset: [number, number, number];
  npcYaw?: number;
  position: [number, number, number];
  accentColor: string;
  baseColor: string;
  trimColor: string;
  inkColor: string;
  skinColor: string;
  highlightColor: string;
  isNearby?: boolean;
  showLabel?: boolean;
  onWalkToStation: (stationId: StationId) => void;
  onPressInteract: (stationId: StationId) => void;
}

function OfficeNpcCharacter({
  offset,
  yaw = 0,
  shirtColor,
  pantsColor,
  skinColor,
  inkColor,
  highlightColor,
  accessory,
  isNearby,
}: {
  offset: [number, number, number];
  yaw?: number;
  shirtColor: string;
  pantsColor: string;
  skinColor: string;
  inkColor: string;
  highlightColor: string;
  accessory: NpcAccessory;
  isNearby: boolean;
}) {
  const npcRef = useRef<THREE.Group>(null);
  const waveArmRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + offset[0] * 0.7;
    if (npcRef.current) {
      npcRef.current.position.y = Math.sin(t * 2.5) * 0.03;
      npcRef.current.scale.y = isNearby
        ? 1 + Math.abs(Math.sin(t * 5)) * 0.05
        : 1 + Math.sin(t * 2.5) * 0.015;
    }
    if (waveArmRef.current) {
      waveArmRef.current.rotation.z = isNearby
        ? -2.3 + Math.sin(clock.elapsedTime * 9) * 0.45
        : -0.1;
    }
  });

  return (
    <group position={offset} rotation={[0, yaw, 0]}>
      <group ref={npcRef}>
        {/* Floor Shadow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[0.26, 16]} />
          <meshStandardMaterial color={inkColor} transparent opacity={0.3} />
        </mesh>

        {/* Shoes */}
        <RoundedBox
          args={[0.13, 0.2, 0.18]}
          radius={0.04}
          castShadow
          position={[-0.09, 0.11, 0]}
        >
          <meshToonMaterial color={pantsColor} />
          <Outlines thickness={0.02} color={inkColor} />
        </RoundedBox>
        <RoundedBox
          args={[0.13, 0.2, 0.18]}
          radius={0.04}
          castShadow
          position={[0.09, 0.11, 0]}
        >
          <meshToonMaterial color={pantsColor} />
          <Outlines thickness={0.02} color={inkColor} />
        </RoundedBox>

        {/* Office Outfit Torso */}
        <RoundedBox
          args={[0.36, 0.34, 0.24]}
          radius={0.07}
          castShadow
          position={[0, 0.38, 0]}
        >
          <meshToonMaterial color={shirtColor} />
          <Outlines thickness={0.022} color={inkColor} />
        </RoundedBox>

        {/* Left Arm + Optional Mug/Clipboard */}
        <RoundedBox
          args={[0.11, 0.24, 0.12]}
          radius={0.04}
          castShadow
          position={[-0.24, 0.38, 0]}
        >
          <meshToonMaterial color={skinColor} />
          <Outlines thickness={0.02} color={inkColor} />
        </RoundedBox>

        {accessory === "mug" && (
          <mesh position={[-0.24, 0.32, 0.14]}>
            <cylinderGeometry args={[0.06, 0.055, 0.11, 8]} />
            <meshToonMaterial color={highlightColor} />
            <Outlines thickness={0.015} color={inkColor} />
          </mesh>
        )}

        {accessory === "clipboard" && (
          <RoundedBox
            args={[0.16, 0.22, 0.03]}
            radius={0.01}
            position={[-0.22, 0.36, 0.14]}
          >
            <meshToonMaterial color={highlightColor} />
            <Outlines thickness={0.015} color={inkColor} />
          </RoundedBox>
        )}

        {/* Right Waving Arm */}
        <RoundedBox
          ref={waveArmRef}
          args={[0.11, 0.24, 0.12]}
          radius={0.04}
          castShadow
          position={[0.24, 0.42, 0]}
        >
          <meshToonMaterial color={skinColor} />
          <Outlines thickness={0.02} color={inkColor} />
        </RoundedBox>

        {/* Chibi Head */}
        <RoundedBox
          args={[0.4, 0.36, 0.36]}
          radius={0.1}
          castShadow
          position={[0, 0.73, 0]}
        >
          <meshToonMaterial color={skinColor} />
          <Outlines thickness={0.024} color={inkColor} />
        </RoundedBox>

        {/* Eyes */}
        <mesh position={[-0.08, 0.74, 0.19]}>
          <boxGeometry args={[0.06, 0.09, 0.03]} />
          <meshToonMaterial color={inkColor} />
        </mesh>
        <mesh position={[0.08, 0.74, 0.19]}>
          <boxGeometry args={[0.06, 0.09, 0.03]} />
          <meshToonMaterial color={inkColor} />
        </mesh>

        {/* Accessory Details */}
        {accessory === "glasses" && (
          <group position={[0, 0.74, 0.2]}>
            <mesh position={[-0.08, 0, 0]}>
              <boxGeometry args={[0.11, 0.11, 0.02]} />
              <meshToonMaterial color={highlightColor} wireframe />
            </mesh>
            <mesh position={[0.08, 0, 0]}>
              <boxGeometry args={[0.11, 0.11, 0.02]} />
              <meshToonMaterial color={highlightColor} wireframe />
            </mesh>
          </group>
        )}

        {accessory === "headphones" && (
          <group position={[0, 0.75, 0]}>
            <RoundedBox
              args={[0.08, 0.18, 0.18]}
              radius={0.03}
              position={[-0.22, 0, 0]}
            >
              <meshToonMaterial color={shirtColor} />
              <Outlines thickness={0.018} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.08, 0.18, 0.18]}
              radius={0.03}
              position={[0.22, 0, 0]}
            >
              <meshToonMaterial color={shirtColor} />
              <Outlines thickness={0.018} color={inkColor} />
            </RoundedBox>
            <mesh position={[0, 0.18, 0]}>
              <boxGeometry args={[0.42, 0.05, 0.08]} />
              <meshToonMaterial color={shirtColor} />
            </mesh>
          </group>
        )}

        {accessory === "visor" && (
          <RoundedBox
            args={[0.34, 0.1, 0.06]}
            radius={0.02}
            position={[0, 0.75, 0.18]}
          >
            <meshToonMaterial color={shirtColor} />
            <Outlines thickness={0.016} color={inkColor} />
          </RoundedBox>
        )}

        {accessory === "beanie" && (
          <RoundedBox
            args={[0.38, 0.16, 0.36]}
            radius={0.06}
            position={[0, 0.91, 0]}
          >
            <meshToonMaterial color={highlightColor} />
            <Outlines thickness={0.02} color={inkColor} />
          </RoundedBox>
        )}
      </group>
    </group>
  );
}

/**
 * Cartoon Office Station + Animated Chibi Colleague NPC.
 * Walking near raises the [F] talk prompt; pressing F opens the NPC's dialogue.
 */
export function ZonePortal({
  stationId,
  label,
  npcName,
  npcRole,
  npcAccessory,
  npcOffset,
  npcYaw = 0,
  position,
  accentColor,
  baseColor,
  trimColor,
  inkColor,
  skinColor,
  highlightColor,
  isNearby = false,
  showLabel = true,
  onWalkToStation,
  onPressInteract,
}: ZonePortalProps) {
  const groupRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const active = hovered || isNearby;

  useFrame(({ clock }, delta) => {
    if (beaconRef.current) {
      const bounceSpeed = isNearby ? 4.5 : 2.2;
      beaconRef.current.position.y =
        1.48 + Math.sin(clock.elapsedTime * bounceSpeed + position[0]) * 0.08;
      beaconRef.current.rotation.y += delta * (active ? 2.2 : 0.8);
    }
    if (groupRef.current) {
      const targetScale = isNearby ? 1.05 : hovered ? 1.03 : 1.0;
      const next = THREE.MathUtils.damp(
        groupRef.current.scale.x,
        targetScale,
        12,
        delta
      );
      groupRef.current.scale.setScalar(next);
    }
  });

  const renderOfficeStation = () => {
    switch (stationId) {
      case "pc":
        return (
          <group>
            {/* Ombuds Workstation Desk + Office Swivel Chair */}
            <RoundedBox
              args={[1.18, 0.14, 0.74]}
              radius={0.04}
              castShadow
              position={[0, 0.36, 0]}
            >
              <meshToonMaterial color={baseColor} />
              <Outlines thickness={0.024} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.14, 0.36, 0.56]}
              radius={0.03}
              castShadow
              position={[-0.44, 0.18, 0]}
            >
              <meshToonMaterial color={baseColor} />
              <Outlines thickness={0.02} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.14, 0.36, 0.56]}
              radius={0.03}
              castShadow
              position={[0.44, 0.18, 0]}
            >
              <meshToonMaterial color={baseColor} />
              <Outlines thickness={0.02} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.74, 0.48, 0.1]}
              radius={0.04}
              castShadow
              position={[0, 0.67, -0.14]}
            >
              <meshToonMaterial color={accentColor} />
              <Outlines thickness={0.024} color={inkColor} />
            </RoundedBox>
          </group>
        );

      case "cs-degree":
        return (
          <group>
            {/* Kanban Safety & Culture Board */}
            <RoundedBox
              args={[1.1, 0.74, 0.12]}
              radius={0.04}
              castShadow
              position={[0, 0.82, -0.22]}
            >
              <meshToonMaterial color={trimColor} />
              <Outlines thickness={0.024} color={inkColor} />
            </RoundedBox>
            <mesh position={[-0.24, 0.88, -0.14]}>
              <boxGeometry args={[0.24, 0.22, 0.04]} />
              <meshToonMaterial color={accentColor} />
            </mesh>
            <mesh position={[0.18, 0.76, -0.14]}>
              <boxGeometry args={[0.28, 0.22, 0.04]} />
              <meshToonMaterial color={highlightColor} />
            </mesh>
          </group>
        );

      case "sofa-table":
        return (
          <group>
            {/* Breakroom Sofa + Espresso Coffee Table */}
            <RoundedBox
              args={[1.76, 0.38, 0.72]}
              radius={0.08}
              castShadow
              position={[0, 0.24, -0.22]}
            >
              <meshToonMaterial color={accentColor} />
              <Outlines thickness={0.026} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[1.76, 0.44, 0.24]}
              radius={0.08}
              castShadow
              position={[0, 0.54, -0.46]}
            >
              <meshToonMaterial color={accentColor} />
              <Outlines thickness={0.026} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[1.18, 0.24, 0.54]}
              radius={0.05}
              castShadow
              position={[0, 0.2, 0.48]}
            >
              <meshToonMaterial color={baseColor} />
              <Outlines thickness={0.024} color={inkColor} />
            </RoundedBox>
            {/* Coffee Mugs on Table */}
            <mesh position={[-0.22, 0.36, 0.48]}>
              <cylinderGeometry args={[0.07, 0.06, 0.12, 8]} />
              <meshToonMaterial color={trimColor} />
              <Outlines thickness={0.015} color={inkColor} />
            </mesh>
          </group>
        );

      case "tv":
        return (
          <group>
            {/* 0.25Hz Biofeedback Office Kiosk */}
            <RoundedBox
              args={[1.08, 0.44, 0.5]}
              radius={0.05}
              castShadow
              position={[0, 0.22, 0]}
            >
              <meshToonMaterial color={baseColor} />
              <Outlines thickness={0.025} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.92, 0.5, 0.14]}
              radius={0.05}
              castShadow
              position={[0, 0.68, 0]}
            >
              <meshToonMaterial color={accentColor} />
              <Outlines thickness={0.026} color={inkColor} />
            </RoundedBox>
          </group>
        );

      case "bed":
        return (
          <group>
            {/* Quiet Nap & Acoustic Recovery Pod */}
            <RoundedBox
              args={[1.08, 0.34, 1.4]}
              radius={0.06}
              castShadow
              position={[0.12, 0.2, 0]}
            >
              <meshToonMaterial color={baseColor} />
              <Outlines thickness={0.025} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.96, 0.16, 0.94]}
              radius={0.06}
              castShadow
              position={[0.12, 0.39, 0.16]}
            >
              <meshToonMaterial color={accentColor} />
              <Outlines thickness={0.022} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.74, 0.16, 0.34]}
              radius={0.06}
              castShadow
              position={[0.12, 0.43, -0.45]}
            >
              <meshToonMaterial color={trimColor} />
              <Outlines thickness={0.02} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.44, 0.48, 0.44]}
              radius={0.05}
              castShadow
              position={[-0.66, 0.24, -0.35]}
            >
              <meshToonMaterial color={baseColor} />
              <Outlines thickness={0.024} color={inkColor} />
            </RoundedBox>
          </group>
        );

      case "resume":
        return (
          <group>
            {/* Boundaries Planning Desk */}
            <RoundedBox
              args={[1.18, 0.14, 0.68]}
              radius={0.04}
              castShadow
              position={[0, 0.36, 0]}
            >
              <meshToonMaterial color={baseColor} />
              <Outlines thickness={0.024} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.14, 0.36, 0.52]}
              radius={0.03}
              castShadow
              position={[-0.46, 0.18, 0]}
            >
              <meshToonMaterial color={baseColor} />
              <Outlines thickness={0.02} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.14, 0.36, 0.52]}
              radius={0.03}
              castShadow
              position={[0.46, 0.18, 0]}
            >
              <meshToonMaterial color={baseColor} />
              <Outlines thickness={0.02} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.42, 0.08, 0.44]}
              radius={0.02}
              position={[-0.18, 0.46, 0.04]}
            >
              <meshToonMaterial color={trimColor} />
              <Outlines thickness={0.018} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.26, 0.16, 0.22]}
              radius={0.02}
              position={[0.3, 0.5, -0.05]}
            >
              <meshToonMaterial color={accentColor} />
              <Outlines thickness={0.018} color={inkColor} />
            </RoundedBox>
          </group>
        );

      case "projects":
        return (
          <group>
            {/* Dual-Monitor Deep Focus Engineering Pod */}
            <RoundedBox
              args={[1.22, 0.14, 0.68]}
              radius={0.04}
              castShadow
              position={[0, 0.36, 0]}
            >
              <meshToonMaterial color={baseColor} />
              <Outlines thickness={0.024} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.14, 0.36, 0.52]}
              radius={0.03}
              castShadow
              position={[-0.46, 0.18, 0]}
            >
              <meshToonMaterial color={baseColor} />
              <Outlines thickness={0.02} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.14, 0.36, 0.52]}
              radius={0.03}
              castShadow
              position={[0.46, 0.18, 0]}
            >
              <meshToonMaterial color={baseColor} />
              <Outlines thickness={0.02} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.46, 0.34, 0.08]}
              radius={0.03}
              position={[-0.26, 0.6, -0.14]}
              rotation={[0, 0.2, 0]}
            >
              <meshToonMaterial color={accentColor} />
              <Outlines thickness={0.02} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.46, 0.34, 0.08]}
              radius={0.03}
              position={[0.26, 0.6, -0.14]}
              rotation={[0, -0.2, 0]}
            >
              <meshToonMaterial color={accentColor} />
              <Outlines thickness={0.02} color={inkColor} />
            </RoundedBox>
          </group>
        );

      case "library":
        return (
          <group>
            {/* Psychology Archive Bookshelf */}
            <RoundedBox
              args={[1.08, 1.18, 0.48]}
              radius={0.05}
              castShadow
              position={[0, 0.59, 0]}
            >
              <meshToonMaterial color={baseColor} />
              <Outlines thickness={0.026} color={inkColor} />
            </RoundedBox>
            {[0.32, 0.62, 0.9].map((yPos, idx) => (
              <RoundedBox
                key={idx}
                args={[0.86, 0.16, 0.16]}
                radius={0.02}
                position={[0, yPos, 0.19]}
              >
                <meshToonMaterial
                  color={idx === 1 ? highlightColor : accentColor}
                />
                <Outlines thickness={0.018} color={inkColor} />
              </RoundedBox>
            ))}
          </group>
        );

      case "exit":
      default:
        return (
          <group>
            {/* West Office Reception Counter */}
            <RoundedBox
              args={[0.68, 0.56, 1.25]}
              radius={0.05}
              castShadow
              position={[0, 0.28, 0]}
            >
              <meshToonMaterial color={baseColor} />
              <Outlines thickness={0.024} color={inkColor} />
            </RoundedBox>
            <RoundedBox
              args={[0.14, 0.34, 0.48]}
              radius={0.03}
              position={[0.05, 0.72, 0.18]}
            >
              <meshToonMaterial color={accentColor} />
              <Outlines thickness={0.02} color={inkColor} />
            </RoundedBox>
          </group>
        );
    }
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (isNearby) {
          onPressInteract(stationId);
        } else {
          onWalkToStation(stationId);
        }
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {renderOfficeStation()}

      {/* Dedicated Feature Office Colleague NPC */}
      <OfficeNpcCharacter
        offset={npcOffset}
        yaw={npcYaw}
        shirtColor={accentColor}
        pantsColor={baseColor}
        skinColor={skinColor}
        inkColor={inkColor}
        highlightColor={highlightColor}
        accessory={npcAccessory}
        isNearby={isNearby}
      />

      {/* Bouncy Cartoon Diamond Indicator above Colleague */}
      <mesh
        ref={beaconRef}
        position={[npcOffset[0], 1.48, npcOffset[2]]}
      >
        <octahedronGeometry args={[0.15, 0]} />
        <meshToonMaterial color={accentColor} />
        <Outlines thickness={0.022} color={inkColor} />
      </mesh>

      <pointLight
        position={[0, 1.1, 0]}
        color={accentColor}
        intensity={active ? 2.4 : 0.8}
        distance={3.6}
      />

      {showLabel && (
        <Html
          position={[npcOffset[0], 1.9, npcOffset[2]]}
          center
          distanceFactor={13}
        >
          {isNearby ? (
            <button
              type="button"
              onClick={() => onPressInteract(stationId)}
              className="tactile-press flex items-center gap-1.5 whitespace-nowrap rounded-xl border-2 border-cartoon-ink bg-hud-elevated px-2.5 py-1 text-xs font-bold text-text-primary shadow-cartoon"
            >
              <kbd className="inline-flex h-5 w-5 items-center justify-center rounded-md border-2 border-cartoon-ink bg-status-warning font-mono text-[10px] font-extrabold text-cartoon-ink">
                F
              </kbd>
              <span>Talk to {npcName}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onWalkToStation(stationId)}
              className="hud-panel tactile-press flex flex-col items-center whitespace-nowrap rounded-lg px-2 py-0.5 text-center hover:border-accent-psych"
            >
              <span className="text-[10px] font-bold leading-tight text-text-primary">
                {npcName}
              </span>
              <span className="text-[9px] leading-tight text-text-secondary">
                {label} · {npcRole}
              </span>
            </button>
          )}
        </Html>
      )}
    </group>
  );
}
