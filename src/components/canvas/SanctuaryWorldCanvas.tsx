"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  createInitialPlayerState,
  getStationById,
  hitTestStation,
  SCENERY_PROPS,
  updatePlayerPhysics,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  ZONE_STATIONS,
  type PlayerPhysicsState,
  type ZoneId,
} from "@/components/canvas/PhysicsController";
import {
  drawPlayerAvatar,
  drawSceneryProp,
  drawStationAndNpc,
  drawWorldBackground,
  type CanvasPalette,
} from "@/components/canvas/SpriteAnimator";
import { useHud } from "@/components/hud/HudProvider";
import { PostcardVoiceDesk } from "@/components/stations/PostcardVoiceDesk";
import { PsychologyScrapbook } from "@/components/stations/PsychologyScrapbook";
import { ZenGreenhouseModal } from "@/components/stations/ZenGreenhouseModal";
import { SignpostMinimap } from "@/components/ui/SignpostMinimap";
import type { SerializedArticle } from "@/lib/validations/psychology";
import type { SerializedQuest } from "@/lib/validations/selfcare";
import type { SerializedVoiceSubmission } from "@/lib/validations/voice";

interface SanctuaryWorldCanvasProps {
  articles: SerializedArticle[];
  quests: SerializedQuest[];
  submissions: SerializedVoiceSubmission[];
  averageComfortIndex: number;
  evaluationCount: number;
}

function readCanvasPalette(): CanvasPalette {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string) => styles.getPropertyValue(name).trim();
  return {
    paperCream: read("--bg-paper-cream"),
    paperAged: read("--bg-paper-aged"),
    canvasMeadow: read("--bg-canvas-meadow"),
    woodWarm: read("--bg-wood-warm"),
    woodPlank: read("--room-wood-plank"),
    inkCharcoal: read("--ink-charcoal"),
    inkMuted: read("--ink-muted"),
    zonePsychology: read("--zone-psychology"),
    zoneSelfcare: read("--zone-selfcare"),
    zoneVoice: read("--zone-voice"),
    shadowAmbient: read("--shadow-ambient"),
  };
}

export function SanctuaryWorldCanvas({
  articles,
  quests,
  submissions,
  averageComfortIndex,
  evaluationCount,
}: SanctuaryWorldCanvasProps) {
  const { cameraResetNonce } = useHud();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paletteRef = useRef<CanvasPalette | null>(null);
  const playerRef = useRef<PlayerPhysicsState>(createInitialPlayerState());
  const cameraRef = useRef<{ x: number; y: number }>({ x: 800, y: 565 });
  const keysRef = useRef<Record<string, boolean>>({});
  const hoveredZoneRef = useRef<ZoneId | null>(null);
  const nearbyZoneRef = useRef<ZoneId | null>(null);
  const activeModalRef = useRef<ZoneId | null>(null);

  const [nearbyZone, setNearbyZone] = useState<ZoneId | null>(null);
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);
  const [activeModalZone, setActiveModalZone] = useState<ZoneId | null>(null);
  const [minimapPos, setMinimapPos] = useState<{ x: number; y: number }>({
    x: 800,
    y: 565,
  });

  useEffect(() => {
    activeModalRef.current = activeModalZone;
  }, [activeModalZone]);

  useEffect(() => {
    paletteRef.current = readCanvasPalette();
  }, []);

  // Recenter camera & player when TopNavHud Recenter button is clicked
  useEffect(() => {
    if (cameraResetNonce > 0) {
      playerRef.current = createInitialPlayerState();
      setActiveModalZone(null);
      setMinimapPos({ x: 800, y: 565 });
    }
  }, [cameraResetNonce]);

  const handleOpenZone = useCallback((zoneId: ZoneId) => {
    playerRef.current.clickTarget = null;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    setActiveModalZone(zoneId);
  }, []);

  const handleFastTravel = useCallback(
    (zoneId: ZoneId) => {
      const station = getStationById(zoneId);
      playerRef.current.x = station.approachX;
      playerRef.current.y = station.approachY;
      playerRef.current.vx = 0;
      playerRef.current.vy = 0;
      playerRef.current.clickTarget = null;
      playerRef.current.facing = "up";
      nearbyZoneRef.current = zoneId;
      setNearbyZone(zoneId);
      setMinimapPos({ x: station.approachX, y: station.approachY });
      handleOpenZone(zoneId);
    },
    [handleOpenZone]
  );

  // Keyboard movement + [E] interaction + [Esc] modal dismissal
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      const lower = event.key.toLowerCase();
      keysRef.current[lower] = true;

      if (lower === "e") {
        if (!activeModalRef.current && nearbyZoneRef.current) {
          event.preventDefault();
          handleOpenZone(nearbyZoneRef.current);
        }
        return;
      }

      if (event.key === "Escape" && activeModalRef.current) {
        event.preventDefault();
        setActiveModalZone(null);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [handleOpenZone]);

  // Main HTML5 <canvas> requestAnimationFrame game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let lastTimestamp = performance.now();
    let minimapTick = 0;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const frame = (now: number) => {
      const elapsedMs = Math.min(now - lastTimestamp, 50);
      lastTimestamp = now;
      const dtRatio = elapsedMs / (1000 / 60);
      const timeSec = now * 0.001;

      const palette = paletteRef.current ?? readCanvasPalette();
      paletteRef.current = palette;

      const k = keysRef.current;
      const detectedZone = updatePlayerPhysics(
        playerRef.current,
        {
          up: Boolean(k["w"] || k["arrowup"]),
          down: Boolean(k["s"] || k["arrowdown"]),
          left: Boolean(k["a"] || k["arrowleft"]),
          right: Boolean(k["d"] || k["arrowright"]),
          locked: activeModalRef.current !== null,
        },
        dtRatio
      );

      if (detectedZone !== nearbyZoneRef.current) {
        nearbyZoneRef.current = detectedZone;
        setNearbyZone(detectedZone);
      }

      minimapTick += 1;
      if (minimapTick % 8 === 0) {
        setMinimapPos({
          x: playerRef.current.x,
          y: playerRef.current.y,
        });
      }

      // Smooth camera lerp (0.08) with velocity look-ahead offset per brand_guidelines.md
      const viewW = window.innerWidth;
      const viewH = window.innerHeight;
      const lookAheadX = playerRef.current.vx * 14;
      const lookAheadY = playerRef.current.vy * 14;
      const desiredCamX = playerRef.current.x + lookAheadX;
      const desiredCamY = playerRef.current.y + lookAheadY;

      const lerpAlpha = 1 - Math.pow(1 - 0.08, dtRatio);
      cameraRef.current.x += (desiredCamX - cameraRef.current.x) * lerpAlpha;
      cameraRef.current.y += (desiredCamY - cameraRef.current.y) * lerpAlpha;

      const halfW = viewW / 2;
      const halfH = viewH / 2;
      const camLeft =
        viewW >= WORLD_WIDTH
          ? -(viewW - WORLD_WIDTH) / 2
          : Math.max(0, Math.min(WORLD_WIDTH - viewW, cameraRef.current.x - halfW));
      const camTop =
        viewH >= WORLD_HEIGHT
          ? -(viewH - WORLD_HEIGHT) / 2
          : Math.max(0, Math.min(WORLD_HEIGHT - viewH, cameraRef.current.y - halfH));

      ctx.clearRect(0, 0, viewW, viewH);
      ctx.fillStyle = palette.canvasMeadow;
      ctx.fillRect(0, 0, viewW, viewH);

      ctx.save();
      ctx.translate(-camLeft, -camTop);

      drawWorldBackground(
        ctx,
        palette,
        timeSec,
        WORLD_WIDTH,
        WORLD_HEIGHT,
        playerRef.current.clickTarget
      );

      // Y-Sorted Render Queue (Stations, Scenery Props, and Player Avatar)
      type RenderItem = { footY: number; draw: () => void };
      const renderQueue: RenderItem[] = [];

      for (const station of ZONE_STATIONS) {
        renderQueue.push({
          footY: station.footY,
          draw: () =>
            drawStationAndNpc(
              ctx,
              station,
              palette,
              timeSec,
              nearbyZoneRef.current === station.id,
              hoveredZoneRef.current === station.id
            ),
        });
      }

      for (const prop of SCENERY_PROPS) {
        renderQueue.push({
          footY: prop.footY,
          draw: () => drawSceneryProp(ctx, prop, palette, timeSec),
        });
      }

      renderQueue.push({
        footY: playerRef.current.y + 8,
        draw: () => drawPlayerAvatar(ctx, playerRef.current, palette, timeSec),
      });

      renderQueue.sort((a, b) => a.footY - b.footY);
      for (const item of renderQueue) {
        item.draw();
      }

      ctx.restore();
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const toWorldCoords = (clientX: number, clientY: number) => {
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const camLeft =
      viewW >= WORLD_WIDTH
        ? -(viewW - WORLD_WIDTH) / 2
        : Math.max(
            0,
            Math.min(WORLD_WIDTH - viewW, cameraRef.current.x - viewW / 2)
          );
    const camTop =
      viewH >= WORLD_HEIGHT
        ? -(viewH - WORLD_HEIGHT) / 2
        : Math.max(
            0,
            Math.min(WORLD_HEIGHT - viewH, cameraRef.current.y - viewH / 2)
          );
    return {
      x: clientX + camLeft,
      y: clientY + camTop,
    };
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeModalZone) return;
    const world = toWorldCoords(e.clientX, e.clientY);
    const hit = hitTestStation(world.x, world.y);
    const nextHover = hit?.id ?? null;
    if (nextHover !== hoveredZoneRef.current) {
      hoveredZoneRef.current = nextHover;
      setHoveredZone(nextHover);
    }
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeModalZone) return;
    const world = toWorldCoords(e.clientX, e.clientY);
    const hit = hitTestStation(world.x, world.y);
    if (hit) {
      handleOpenZone(hit.id);
      return;
    }
    playerRef.current.clickTarget = {
      x: Math.max(75, Math.min(WORLD_WIDTH - 75, world.x)),
      y: Math.max(75, Math.min(WORLD_HEIGHT - 75, world.y)),
    };
  };

  const nearbyStation = nearbyZone ? getStationById(nearbyZone) : null;

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerMove={handleCanvasPointerMove}
        onPointerDown={handleCanvasPointerDown}
        style={{ cursor: hoveredZone ? "pointer" : "crosshair" }}
        className="fixed inset-0 z-0 block h-full w-full touch-none"
      />

      {/* Top-Right Wooden Signpost Fast-Travel Minimap */}
      <div className="pointer-events-none fixed right-4 top-24 z-20 hidden sm:block">
        <SignpostMinimap
          playerPos={minimapPos}
          nearbyZone={nearbyZone}
          activeModalZone={activeModalZone}
          onFastTravel={handleFastTravel}
        />
      </div>

      {/* Bouncing HUD [E] Prompt when near a station */}
      <AnimatePresence>
        {!activeModalZone && nearbyStation && (
          <motion.div
            key={nearbyStation.id}
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 360, damping: 22 }}
            className="pointer-events-none fixed inset-x-0 bottom-20 z-20 flex justify-center px-4"
          >
            <button
              type="button"
              onClick={() => handleOpenZone(nearbyStation.id)}
              className="pointer-events-auto cartoon-panel cartoon-btn line-boil flex items-center gap-2.5 rounded-2xl px-4 py-2 text-xs font-bold text-ink-charcoal"
            >
              <kbd className="inline-flex h-6 w-6 items-center justify-center rounded-lg border-2 border-ink-charcoal bg-zone-psychology font-hand text-sm font-bold text-ink-charcoal">
                E
              </kbd>
              <span className="font-hand text-xl leading-none">
                Press [E] to enter {nearbyStation.title} (
                {nearbyStation.npcName})
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Station Feature Modals */}
      <AnimatePresence>
        {activeModalZone === "psychology" && (
          <PsychologyScrapbook
            articles={articles}
            onClose={() => setActiveModalZone(null)}
          />
        )}

        {activeModalZone === "self-care" && (
          <ZenGreenhouseModal
            quests={quests}
            onClose={() => setActiveModalZone(null)}
          />
        )}

        {activeModalZone === "employee-voice" && (
          <PostcardVoiceDesk
            submissions={submissions}
            averageComfortIndex={averageComfortIndex}
            evaluationCount={evaluationCount}
            onClose={() => setActiveModalZone(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
