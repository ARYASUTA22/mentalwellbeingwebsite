"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Outlines, RoundedBox, Stars } from "@react-three/drei";
import * as THREE from "three";
import {
  SANCTUARY_STATIONS,
  useHud,
  type SanctuaryZone,
  type StationId,
} from "@/components/hud/HudProvider";
import { SanctuaryIsland } from "@/components/canvas/SanctuaryIsland";
import { ZonePortal } from "@/components/canvas/ZonePortal";
import { BreathingOrb3D } from "@/components/canvas/BreathingOrb3D";

interface StationCollider {
  id: StationId;
  label: string;
  zone: Exclude<SanctuaryZone, "hub"> | "hub";
  position: [number, number, number];
  approachPoint: [number, number, number];
  npcOffset: [number, number, number];
  npcYaw: number;
  halfExtents: [number, number];
  triggerPadding: number;
}

const STATION_COLLIDERS: StationCollider[] = [
  {
    id: "exit",
    label: "Reception",
    zone: "hub",
    position: [-8.45, 0, 0.4],
    approachPoint: [-7.3, 0, 0.4],
    npcOffset: [0.6, 0, -0.78],
    npcYaw: 0.7,
    halfExtents: [0.46, 0.7],
    triggerPadding: 0.65,
  },
  {
    id: "cs-degree",
    label: "Safety Wall",
    zone: "employee-voice",
    position: [-5.5, 0, -2.55],
    approachPoint: [-5.5, 0, -1.65],
    npcOffset: [0.82, 0, 0.25],
    npcYaw: -0.4,
    halfExtents: [0.6, 0.35],
    triggerPadding: 0.55,
  },
  {
    id: "pc",
    label: "Voice Terminal",
    zone: "employee-voice",
    position: [-2.8, 0, -2.25],
    approachPoint: [-2.8, 0, -1.2],
    npcOffset: [-0.8, 0, 0.2],
    npcYaw: 0.4,
    halfExtents: [0.65, 0.5],
    triggerPadding: 0.55,
  },
  {
    id: "sofa-table",
    label: "Breakroom",
    zone: "self-care",
    position: [-5.5, 0, -0.4],
    approachPoint: [-5.5, 0, 0.85],
    npcOffset: [1.15, 0, 0.2],
    npcYaw: -0.7,
    halfExtents: [0.95, 0.72],
    triggerPadding: 0.55,
  },
  {
    id: "tv",
    label: "Biofeedback Kiosk",
    zone: "self-care",
    position: [-5.5, 0, 1.95],
    approachPoint: [-5.5, 0, 1.15],
    npcOffset: [-0.82, 0, -0.15],
    npcYaw: 2.6,
    halfExtents: [0.65, 0.38],
    triggerPadding: 0.55,
  },
  {
    id: "resume",
    label: "Boundaries Desk",
    zone: "psychology",
    position: [3.0, 0, -2.35],
    approachPoint: [3.0, 0, -1.35],
    npcOffset: [-0.72, 0, 0.2],
    npcYaw: 0.35,
    halfExtents: [0.65, 0.45],
    triggerPadding: 0.55,
  },
  {
    id: "projects",
    label: "Focus Pod",
    zone: "psychology",
    position: [4.5, 0, -2.35],
    approachPoint: [4.5, 0, -1.35],
    npcOffset: [0, 0, 0.62],
    npcYaw: 0,
    halfExtents: [0.65, 0.45],
    triggerPadding: 0.55,
  },
  {
    id: "library",
    label: "Psych Archive",
    zone: "psychology",
    position: [6.1, 0, -2.4],
    approachPoint: [6.1, 0, -1.45],
    npcOffset: [0.74, 0, 0.25],
    npcYaw: -0.45,
    halfExtents: [0.62, 0.4],
    triggerPadding: 0.55,
  },
  {
    id: "bed",
    label: "Recovery Pod",
    zone: "self-care",
    position: [7.7, 0, -2.0],
    approachPoint: [6.4, 0, -1.05],
    npcOffset: [-0.85, 0, 0.55],
    npcYaw: -0.8,
    halfExtents: [0.85, 0.8],
    triggerPadding: 0.55,
  },
];

interface WalkableRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const WALKABLE_RECTS: WalkableRect[] = [
  { minX: -8.55, maxX: -2.05, minZ: -2.75, maxZ: 2.75 },
  { minX: -2.25, maxX: 2.25, minZ: -0.5, maxZ: 1.05 },
  { minX: 2.05, maxX: 8.55, minZ: -2.75, maxZ: 3.35 },
];

const ZONE_CAMERA_TARGETS: Record<
  Exclude<SanctuaryZone, "hub">,
  { x: number; z: number }
> = {
  psychology: { x: 4.8, z: -0.4 },
  "self-care": { x: 0, z: -0.8 },
  "employee-voice": { x: -5.2, z: -0.4 },
};

function isInsideWalkableArea(x: number, z: number): boolean {
  return WALKABLE_RECTS.some(
    (r) => x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ
  );
}

function overlapsBox(
  px: number,
  pz: number,
  playerRadius: number,
  station: StationCollider,
  extraPadding: number
): boolean {
  const halfW = station.halfExtents[0] + playerRadius + extraPadding;
  const halfD = station.halfExtents[1] + playerRadius + extraPadding;
  return (
    Math.abs(px - station.position[0]) < halfW &&
    Math.abs(pz - station.position[2]) < halfD
  );
}

interface PlayerAndCameraProps {
  clickTarget: [number, number, number] | null;
  clearClickTarget: () => void;
}

function PlayerAndCameraRig({
  clickTarget,
  clearClickTarget,
}: PlayerAndCameraProps) {
  const {
    activeZone,
    isInDialogue,
    setNearbyStationId,
    cameraResetNonce,
    tokens,
  } = useHud();

  const { camera, size } = useThree();

  const playerGroupRef = useRef<THREE.Group>(null);
  const avatarVisualRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const targetMarkerRef = useRef<THREE.Mesh>(null);

  const playerPos = useRef(new THREE.Vector3(-6.8, 0, 0.55));
  const facingYaw = useRef(0);
  const keysPressed = useRef<Record<string, boolean>>({});
  const nearbyStationRef = useRef<StationId | null>(null);

  const camCurrentPos = useRef(new THREE.Vector3(-6.8, 7.6, 8.2));
  const camCurrentLook = useRef(new THREE.Vector3(-6.8, 0.3, 0.55));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      keysPressed.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (cameraResetNonce > 0) {
      playerPos.current.set(-6.8, 0, 0.55);
      clearClickTarget();
      nearbyStationRef.current = null;
      setNearbyStationId(null);
    }
  }, [cameraResetNonce, clearClickTarget, setNearbyStationId]);

  const damping = 0.15;
  const lambda = 1 / damping;
  const playerSpeed = 4.0;
  const playerRadius = 0.28;

  useFrame(({ clock }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    let moveX = 0;
    let moveZ = 0;

    if (!isInDialogue && activeZone === "hub") {
      const k = keysPressed.current;
      const right = k["arrowright"] || k["d"];
      const left = k["arrowleft"] || k["a"];
      const up = k["arrowup"] || k["w"];
      const down = k["arrowdown"] || k["s"];

      if (right) moveX += 1;
      if (left) moveX -= 1;
      if (down) moveZ += 1;
      if (up) moveZ -= 1;

      if (moveX !== 0 || moveZ !== 0) {
        if (clickTarget) clearClickTarget();
        const len = Math.hypot(moveX, moveZ);
        moveX /= len;
        moveZ /= len;
      } else if (clickTarget) {
        const dx = clickTarget[0] - playerPos.current.x;
        const dz = clickTarget[2] - playerPos.current.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.12) {
          moveX = dx / dist;
          moveZ = dz / dist;
        } else {
          clearClickTarget();
        }
      }
    }

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (isMoving) {
      const nextX = playerPos.current.x + moveX * playerSpeed * delta;
      const nextZ = playerPos.current.z + moveZ * playerSpeed * delta;

      const hitsSolid = (tx: number, tz: number) =>
        STATION_COLLIDERS.some((s) =>
          overlapsBox(tx, tz, playerRadius, s, 0)
        );

      if (
        isInsideWalkableArea(nextX, playerPos.current.z) &&
        !hitsSolid(nextX, playerPos.current.z)
      ) {
        playerPos.current.x = nextX;
      }
      if (
        isInsideWalkableArea(playerPos.current.x, nextZ) &&
        !hitsSolid(playerPos.current.x, nextZ)
      ) {
        playerPos.current.z = nextZ;
      }

      facingYaw.current = Math.atan2(moveX, moveZ);
    }

    // Proximity detection for [F] key interaction with office colleagues
    if (activeZone === "hub") {
      let activeNearby: StationId | null = null;
      for (const station of STATION_COLLIDERS) {
        if (
          overlapsBox(
            playerPos.current.x,
            playerPos.current.z,
            playerRadius,
            station,
            station.triggerPadding
          )
        ) {
          activeNearby = station.id;
          break;
        }
      }

      if (activeNearby !== nearbyStationRef.current) {
        nearbyStationRef.current = activeNearby;
        setNearbyStationId(activeNearby);
      }
    }

    if (playerGroupRef.current) {
      playerGroupRef.current.position.copy(playerPos.current);
      playerGroupRef.current.rotation.y = THREE.MathUtils.damp(
        playerGroupRef.current.rotation.y,
        facingYaw.current,
        14,
        delta
      );
    }

    if (avatarVisualRef.current) {
      const hopWave = isMoving ? Math.abs(Math.sin(clock.elapsedTime * 11)) : 0;
      const targetY = hopWave * 0.12;
      const targetScaleY = isMoving ? 0.94 + hopWave * 0.14 : 1;
      const targetScaleXZ = isMoving ? 1.04 - hopWave * 0.08 : 1;
      avatarVisualRef.current.position.y = THREE.MathUtils.damp(
        avatarVisualRef.current.position.y,
        targetY,
        16,
        delta
      );
      avatarVisualRef.current.scale.set(
        targetScaleXZ,
        targetScaleY,
        targetScaleXZ
      );
    }

    const swing = isMoving ? Math.sin(clock.elapsedTime * 11) * 0.65 : 0;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.75;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.75;

    if (targetMarkerRef.current && clickTarget) {
      targetMarkerRef.current.position.set(
        clickTarget[0],
        0.05,
        clickTarget[2]
      );
      targetMarkerRef.current.rotation.z += delta * 2.6;
    }

    const resizeFactor = size.width / Math.max(1, size.height);
    const isPortrait = resizeFactor < 1;

    const focusPoint =
      activeZone === "hub"
        ? { x: playerPos.current.x, z: playerPos.current.z }
        : ZONE_CAMERA_TARGETS[activeZone];

    const camHeight = isPortrait ? 9.6 : 7.3;
    const camBackZ = isPortrait ? 8.8 : 6.9;

    camCurrentPos.current.x = THREE.MathUtils.damp(
      camCurrentPos.current.x,
      focusPoint.x,
      lambda,
      delta
    );
    camCurrentPos.current.y = THREE.MathUtils.damp(
      camCurrentPos.current.y,
      camHeight,
      lambda,
      delta
    );
    camCurrentPos.current.z = THREE.MathUtils.damp(
      camCurrentPos.current.z,
      focusPoint.z + camBackZ,
      lambda,
      delta
    );

    camCurrentLook.current.x = THREE.MathUtils.damp(
      camCurrentLook.current.x,
      focusPoint.x,
      lambda,
      delta
    );
    camCurrentLook.current.y = THREE.MathUtils.damp(
      camCurrentLook.current.y,
      0.38,
      lambda,
      delta
    );
    camCurrentLook.current.z = THREE.MathUtils.damp(
      camCurrentLook.current.z,
      focusPoint.z - 0.55,
      lambda,
      delta
    );

    camera.position.copy(camCurrentPos.current);
    camera.lookAt(camCurrentLook.current);
  });

  if (!tokens) return null;

  return (
    <>
      {/* Chibi Office Visitor Avatar */}
      <group ref={playerGroupRef} position={[-6.8, 0, 0.55]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <circleGeometry args={[0.34, 24]} />
          <meshStandardMaterial
            color={tokens.cartoonInk}
            transparent
            opacity={0.35}
          />
        </mesh>

        <group ref={avatarVisualRef}>
          <RoundedBox
            ref={leftLegRef}
            args={[0.16, 0.24, 0.22]}
            radius={0.05}
            castShadow
            position={[-0.11, 0.14, 0.02]}
          >
            <meshToonMaterial color={tokens.roomWallTrim} />
            <Outlines thickness={0.022} color={tokens.cartoonInk} />
          </RoundedBox>
          <RoundedBox
            ref={rightLegRef}
            args={[0.16, 0.24, 0.22]}
            radius={0.05}
            castShadow
            position={[0.11, 0.14, 0.02]}
          >
            <meshToonMaterial color={tokens.roomWallTrim} />
            <Outlines thickness={0.022} color={tokens.cartoonInk} />
          </RoundedBox>

          <RoundedBox
            args={[0.42, 0.36, 0.28]}
            radius={0.08}
            castShadow
            position={[0, 0.42, 0]}
          >
            <meshToonMaterial color={tokens.accentSelfcare} />
            <Outlines thickness={0.025} color={tokens.cartoonInk} />
          </RoundedBox>

          <RoundedBox
            args={[0.3, 0.28, 0.16]}
            radius={0.06}
            castShadow
            position={[0, 0.44, -0.18]}
          >
            <meshToonMaterial color={tokens.statusWarning} />
            <Outlines thickness={0.022} color={tokens.cartoonInk} />
          </RoundedBox>

          <RoundedBox
            ref={leftArmRef}
            args={[0.13, 0.26, 0.14]}
            radius={0.05}
            castShadow
            position={[-0.28, 0.42, 0]}
          >
            <meshToonMaterial color={tokens.roomWall} />
            <Outlines thickness={0.022} color={tokens.cartoonInk} />
          </RoundedBox>
          <RoundedBox
            ref={rightArmRef}
            args={[0.13, 0.26, 0.14]}
            radius={0.05}
            castShadow
            position={[0.28, 0.42, 0]}
          >
            <meshToonMaterial color={tokens.roomWall} />
            <Outlines thickness={0.022} color={tokens.cartoonInk} />
          </RoundedBox>

          <RoundedBox
            args={[0.48, 0.42, 0.42]}
            radius={0.12}
            castShadow
            position={[0, 0.8, 0]}
          >
            <meshToonMaterial color={tokens.roomWall} />
            <Outlines thickness={0.028} color={tokens.cartoonInk} />
          </RoundedBox>

          <mesh position={[-0.1, 0.81, 0.22]}>
            <boxGeometry args={[0.08, 0.11, 0.04]} />
            <meshToonMaterial color={tokens.cartoonInk} />
          </mesh>
          <mesh position={[0.1, 0.81, 0.22]}>
            <boxGeometry args={[0.08, 0.11, 0.04]} />
            <meshToonMaterial color={tokens.cartoonInk} />
          </mesh>

          <RoundedBox
            args={[0.1, 0.22, 0.22]}
            radius={0.04}
            position={[-0.27, 0.82, 0]}
          >
            <meshToonMaterial color={tokens.accentVoice} />
            <Outlines thickness={0.02} color={tokens.cartoonInk} />
          </RoundedBox>
          <RoundedBox
            args={[0.1, 0.22, 0.22]}
            radius={0.04}
            position={[0.27, 0.82, 0]}
          >
            <meshToonMaterial color={tokens.accentVoice} />
            <Outlines thickness={0.02} color={tokens.cartoonInk} />
          </RoundedBox>
          <mesh position={[0, 1.03, 0]}>
            <boxGeometry args={[0.52, 0.07, 0.1]} />
            <meshToonMaterial color={tokens.accentVoice} />
            <Outlines thickness={0.02} color={tokens.cartoonInk} />
          </mesh>
        </group>
      </group>

      {clickTarget && activeZone === "hub" && (
        <mesh
          ref={targetMarkerRef}
          position={[clickTarget[0], 0.05, clickTarget[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.18, 0.3, 24]} />
          <meshStandardMaterial
            color={tokens.statusWarning}
            emissive={tokens.statusWarning}
            emissiveIntensity={1.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </>
  );
}

function SanctuarySceneContent() {
  const {
    activeZone,
    tokens,
    isInDialogue,
    nearbyStationId,
    openStationDialogue,
  } = useHud();
  const [clickTarget, setClickTarget] = useState<
    [number, number, number] | null
  >(null);

  const colors = useMemo(() => {
    if (!tokens) return null;
    return tokens;
  }, [tokens]);

  if (!colors) return null;

  const resolveAccentForZone = (zone: StationCollider["zone"]) => {
    if (zone === "psychology") return colors.accentPsych;
    if (zone === "self-care") return colors.accentSelfcare;
    if (zone === "employee-voice") return colors.accentVoice;
    return colors.statusWarning;
  };

  return (
    <>
      <color attach="background" args={[colors.worldVoid]} />
      <fog attach="fog" args={[colors.worldVoid, 20, 44]} />

      <ambientLight intensity={0.8} color={colors.textPrimary} />
      <directionalLight
        castShadow
        position={[8, 14, 7]}
        intensity={1.35}
        color={colors.textPrimary}
      />
      <pointLight
        position={[-5.5, 4.5, 0]}
        intensity={1.4}
        color={colors.accentVoice}
      />
      <pointLight
        position={[5.5, 4.5, 0]}
        intensity={1.4}
        color={colors.accentPsych}
      />

      <Stars
        radius={48}
        depth={25}
        count={900}
        factor={2.4}
        saturation={0.25}
        fade
        speed={0.3}
      />

      <SanctuaryIsland
        onFloorClick={(point) => {
          if (activeZone === "hub" && !isInDialogue) {
            setClickTarget(point);
          }
        }}
      />

      <PlayerAndCameraRig
        clickTarget={clickTarget}
        clearClickTarget={() => setClickTarget(null)}
      />

      {STATION_COLLIDERS.map((station) => {
        const meta = SANCTUARY_STATIONS[station.id];
        return (
          <ZonePortal
            key={station.id}
            stationId={station.id}
            label={station.label}
            npcName={meta.npcName}
            npcRole={meta.npcRole}
            npcAccessory={meta.npcAccessory}
            npcOffset={station.npcOffset}
            npcYaw={station.npcYaw}
            position={station.position}
            accentColor={resolveAccentForZone(station.zone)}
            baseColor={colors.roomWallTrim}
            trimColor={colors.roomWall}
            inkColor={colors.cartoonInk}
            skinColor={colors.roomWall}
            highlightColor={colors.statusWarning}
            isNearby={nearbyStationId === station.id}
            showLabel={activeZone === "hub" && !isInDialogue}
            onWalkToStation={() => {
              if (activeZone === "hub" && !isInDialogue) {
                setClickTarget(station.approachPoint);
              }
            }}
            onPressInteract={(id) => {
              setClickTarget(null);
              openStationDialogue(id);
            }}
          />
        );
      })}

      <BreathingOrb3D position={[0, 1.9, -2.1]} />
    </>
  );
}

export function WorldCanvas() {
  const { tokens } = useHud();

  if (!tokens) {
    return (
      <div aria-hidden="true" className="fixed inset-0 z-0 bg-world-void" />
    );
  }

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [-6.8, 7.3, 7.3], fov: 44, near: 0.1, far: 100 }}
      >
        <SanctuarySceneContent />
      </Canvas>
    </div>
  );
}
