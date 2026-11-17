"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import { useHud } from "@/components/hud/HudProvider";

/**
 * Cartoon cel-shaded 3D Breathing Orb oscillating on a 0.25Hz relaxation sine wave.
 */
export function BreathingOrb3D({
  position = [0, 1.35, -2.5],
}: {
  position?: [number, number, number];
}) {
  const { breathingActive, tokens } = useHud();
  const coreRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshToonMaterial>(null);

  useFrame(({ clock }) => {
    const wave = Math.sin(clock.elapsedTime * Math.PI * 0.5);
    const normalized = (wave + 1) * 0.5;

    const targetScale = breathingActive
      ? 0.85 + normalized * 0.55
      : 0.94 + normalized * 0.14;

    if (coreRef.current) {
      coreRef.current.scale.setScalar(targetScale);
      coreRef.current.rotation.y = clock.elapsedTime * 0.22;
    }

    if (shellRef.current) {
      shellRef.current.scale.setScalar(targetScale * 1.24);
      shellRef.current.rotation.x = clock.elapsedTime * 0.15;
      shellRef.current.rotation.z = -clock.elapsedTime * 0.12;
    }

    if (materialRef.current) {
      materialRef.current.emissiveIntensity = breathingActive
        ? 0.4 + normalized * 0.75
        : 0.15 + normalized * 0.2;
    }
  });

  if (!tokens) return null;

  return (
    <group position={position}>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.78, 1]} />
        <meshToonMaterial
          ref={materialRef}
          color={tokens.accentSelfcare}
          emissive={tokens.accentSelfcare}
          emissiveIntensity={0.25}
        />
        <Outlines thickness={0.03} color={tokens.cartoonInk} />
      </mesh>

      <mesh ref={shellRef}>
        <icosahedronGeometry args={[0.85, 1]} />
        <meshStandardMaterial
          color={tokens.accentPsych}
          emissive={tokens.accentSelfcare}
          emissiveIntensity={0.35}
          wireframe
          transparent
          opacity={breathingActive ? 0.55 : 0.25}
        />
      </mesh>

      <pointLight
        position={[0, 0.2, 0.4]}
        color={tokens.accentSelfcare}
        intensity={breathingActive ? 4.2 : 1.8}
        distance={7}
      />
    </group>
  );
}
