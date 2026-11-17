"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  createInitialPlayerState,
  getStationById,
  hitTestStation,
  updatePlayerPhysics,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  ZONE_STATIONS,
  type PlayerPhysicsState,
  type ZoneId,
} from "@/components/canvas/PhysicsController";
import {
  drawClickTargetRing,
  drawCozyNpcSprite,
  drawMainCharacterSprite,
  drawOakTreeForegroundOverhang,
  drawZonePromptOverlay,
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

/**
 * Computes camera scale and clamped top-left camera origin so the (0,0)..(2400,1350)
 * map background never pans into empty space on any viewport size.
 */
function getClampedCameraViewport(
  camCenterX: number,
  camCenterY: number,
  viewW: number,
  viewH: number
) {
  const scale = Math.max(1, viewW / WORLD_WIDTH, viewH / WORLD_HEIGHT);
  const visibleWorldW = viewW / scale;
  const visibleWorldH = viewH / scale;

  const minCenterX = visibleWorldW / 2;
  const maxCenterX = Math.max(minCenterX, WORLD_WIDTH - visibleWorldW / 2);
  const minCenterY = visibleWorldH / 2;
  const maxCenterY = Math.max(minCenterY, WORLD_HEIGHT - visibleWorldH / 2);

  const clampedCenterX = Math.max(minCenterX, Math.min(maxCenterX, camCenterX));
  const clampedCenterY = Math.max(minCenterY, Math.min(maxCenterY, camCenterY));

  const camLeft = Math.max(
    0,
    Math.min(WORLD_WIDTH - visibleWorldW, clampedCenterX - visibleWorldW / 2)
  );
  const camTop = Math.max(
    0,
    Math.min(WORLD_HEIGHT - visibleWorldH, clampedCenterY - visibleWorldH / 2)
  );

  return {
    scale,
    camLeft,
    camTop,
    clampedCenterX,
    clampedCenterY,
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
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const charSheetRef = useRef<HTMLImageElement | null>(null);
  const paletteRef = useRef<CanvasPalette | null>(null);
  const playerRef = useRef<PlayerPhysicsState>(createInitialPlayerState());
  const cameraRef = useRef<{ x: number; y: number }>({ x: 1035, y: 645 });
  const keysRef = useRef<Record<string, boolean>>({});
  const hoveredZoneRef = useRef<ZoneId | null>(null);
  const nearbyZoneRef = useRef<ZoneId | null>(null);
  const activeModalRef = useRef<ZoneId | null>(null);

  const [nearbyZone, setNearbyZone] = useState<ZoneId | null>(null);
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);
  const [activeModalZone, setActiveModalZone] = useState<ZoneId | null>(null);
  const [minimapPos, setMinimapPos] = useState<{ x: number; y: number }>({
    x: 1035,
    y: 645,
  });

  useEffect(() => {
    activeModalRef.current = activeModalZone;
  }, [activeModalZone]);

  // Preload /assets/map-background.png (2400x1350) and /assets/characters.png (74x104 grid) on mount
  useEffect(() => {
    paletteRef.current = readCanvasPalette();

    const bgImg = new Image();
    bgImg.src = "/assets/map-background.png";
    bgImg.onload = () => {
      bgImageRef.current = bgImg;
    };

    const charImg = new Image();
    charImg.src = "/assets/characters.png";
    charImg.onload = () => {
      charSheetRef.current = charImg;
    };
  }, []);

  useEffect(() => {
    if (cameraResetNonce > 0) {
      playerRef.current = createInitialPlayerState();
      setActiveModalZone(null);
      setMinimapPos({ x: 1035, y: 645 });
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let lastTimestamp = performance.now();
    let frameCount = 0;
    let dpr = 1;

    const resizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const frame = (now: number) => {
      const elapsedMs = Math.min(now - lastTimestamp, 50);
      lastTimestamp = now;
      const dtRatio = elapsedMs / (1000 / 60);
      const timeSec = now * 0.001;
      frameCount += 1;

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

      if (frameCount % 8 === 0) {
        setMinimapPos({
          x: playerRef.current.x,
          y: playerRef.current.y,
        });
      }

      const viewW = window.innerWidth;
      const viewH = window.innerHeight;
      const lookAheadX = playerRef.current.vx * 14;
      const lookAheadY = playerRef.current.vy * 14;
      const desiredCamX = playerRef.current.x + lookAheadX;
      const desiredCamY = playerRef.current.y + lookAheadY;

      const lerpAlpha = 1 - Math.pow(1 - 0.08, dtRatio);
      const nextCamX =
        cameraRef.current.x + (desiredCamX - cameraRef.current.x) * lerpAlpha;
      const nextCamY =
        cameraRef.current.y + (desiredCamY - cameraRef.current.y) * lerpAlpha;

      const { scale, camLeft, camTop, clampedCenterX, clampedCenterY } =
        getClampedCameraViewport(nextCamX, nextCamY, viewW, viewH);

      cameraRef.current.x = clampedCenterX;
      cameraRef.current.y = clampedCenterY;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, viewW, viewH);
      ctx.fillStyle = palette.canvasMeadow;
      ctx.fillRect(0, 0, viewW, viewH);

      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(-camLeft, -camTop);

      // 1. Base 2D Map Background (/assets/map-background.png at 0,0 -> 2400x1350)
      if (bgImageRef.current) {
        ctx.drawImage(bgImageRef.current, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      }

      // 2. Click-to-move destination ring on the ground
      drawClickTargetRing(
        ctx,
        playerRef.current.clickTarget,
        palette,
        timeSec
      );

      // 3. Y-Sorted Render Queue: Main Character, 3 Cozy NPCs, and Ancient Oak Tree Foreground Overhang
      type RenderLayer = { footY: number; draw: () => void };
      const ySortedQueue: RenderLayer[] = [];

      ZONE_STATIONS.forEach((station, idx) => {
        ySortedQueue.push({
          footY: station.npcY,
          draw: () =>
            drawCozyNpcSprite(
              ctx,
              charSheetRef.current,
              station,
              playerRef.current,
              palette,
              frameCount,
              idx
            ),
        });
      });

      ySortedQueue.push({
        footY: playerRef.current.y,
        draw: () =>
          drawMainCharacterSprite(
            ctx,
            charSheetRef.current,
            playerRef.current,
            palette,
            frameCount
          ),
      });

      // Foreground overhang for the Ancient Oak Tree branches (bottom-center around X:1200..1860, Y:750, baseline Y:910)
      ySortedQueue.push({
        footY: 910,
        draw: () => drawOakTreeForegroundOverhang(ctx, bgImageRef.current),
      });

      ySortedQueue.sort((a, b) => a.footY - b.footY);
      for (const layer of ySortedQueue) {
        layer.draw();
      }

      // 4. Floating UI nameplates & bouncing [E] keycap prompts on top
      for (const station of ZONE_STATIONS) {
        drawZonePromptOverlay(
          ctx,
          station,
          palette,
          timeSec,
          nearbyZoneRef.current === station.id,
          hoveredZoneRef.current === station.id
        );
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
    const { scale, camLeft, camTop } = getClampedCameraViewport(
      cameraRef.current.x,
      cameraRef.current.y,
      viewW,
      viewH
    );
    return {
      x: clientX / scale + camLeft,
      y: clientY / scale + camTop,
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
      x: Math.max(48, Math.min(WORLD_WIDTH - 48, world.x)),
      y: Math.max(48, Math.min(WORLD_HEIGHT - 48, world.y)),
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

      {/* Bouncing HUD [E] Prompt when near a zone */}
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
                Press [E] to talk to {nearbyStation.npcName} ·{" "}
                {nearbyStation.title}
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
