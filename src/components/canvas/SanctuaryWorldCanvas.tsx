"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  createInitialPlayerState,
  FEATURE_STATIONS,
  getFeatureSubStationByCode,
  getNearbyNpcStation,
  getStationById,
  getSurfaceTypeAt,
  hitTestNpc,
  hitTestSubStation,
  updatePlayerPhysics,
  WORLD_BUILDINGS,
  WORLD_FOREGROUND_PROPS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  ZONE_STATIONS,
  type PlayerPhysicsState,
  type ZoneId,
} from "@/components/canvas/PhysicsController";
import {
  chromaKeyWhiteSheetOnCanvas,
  drawCalibratedEnvironmentFX,
  drawClickTargetRing,
  drawCozyNpcSprite,
  drawFeatureSubStationSprite,
  drawFloorLayerDetails,
  drawMainCharacterSprite,
  drawWorldBuildingSprite,
  drawWorldForegroundProp,
  drawZonePromptOverlay,
  type CanvasPalette,
  type SpriteSheetSource,
} from "@/components/canvas/SpriteAnimator";
import { useHud } from "@/components/hud/HudProvider";
import { NpcDialogueModal } from "@/components/stations/NpcDialogueModal";
import { SubStationModalHost } from "@/components/stations/SubStationModals";
import { SignpostMinimap } from "@/components/ui/SignpostMinimap";
import { sanctuaryAudio } from "@/lib/audio/sanctuaryAudio";
import type {
  EmployeeVoiceEntryItem,
  PsychologyArticleItem,
  SubStationCode,
  WorkComfortPulseItem,
} from "@/lib/seed";
import type { SerializedQuest } from "@/lib/validations/selfcare";

interface SanctuaryWorldCanvasProps {
  psychologyArticles: PsychologyArticleItem[];
  quests: SerializedQuest[];
  voiceEntries: EmployeeVoiceEntryItem[];
  comfortPulses: WorkComfortPulseItem[];
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
    shadowCloud: read("--shadow-cloud"),
  };
}

/**
 * Computes camera scale and clamped top-left camera origin so the (0,0)..(2400,1350)
 * floor terrain never pans into empty space on any viewport size.
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
  psychologyArticles,
  quests,
  voiceEntries,
  comfortPulses,
}: SanctuaryWorldCanvasProps) {
  const {
    cameraResetNonce,
    triggerCameraReset,
    isHintModalOpen,
    isSignpostOpen,
    setIsSignpostOpen,
  } = useHud();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapFloorRef = useRef<HTMLImageElement | null>(null);
  const buildingsSheetRef = useRef<SpriteSheetSource | null>(null);
  const featureStationsRef = useRef<SpriteSheetSource | null>(null);
  const gardenStructuresRef = useRef<SpriteSheetSource | null>(null);
  const natureDetailsRef = useRef<SpriteSheetSource | null>(null);
  const mcSheetRef = useRef<SpriteSheetSource | null>(null);
  const npcSheetRef = useRef<SpriteSheetSource | null>(null);
  const paletteRef = useRef<CanvasPalette | null>(null);
  const playerRef = useRef<PlayerPhysicsState>(createInitialPlayerState());
  const cameraRef = useRef<{ x: number; y: number }>({ x: 1200, y: 690 });
  const keysRef = useRef<Record<string, boolean>>({});
  const hoveredCodeRef = useRef<SubStationCode | null>(null);
  const hoveredNpcZoneRef = useRef<ZoneId | null>(null);
  const nearbyCodeRef = useRef<SubStationCode | null>(null);
  const nearbyNpcZoneRef = useRef<ZoneId | null>(null);
  const activeModalRef = useRef<SubStationCode | null>(null);
  const activeNpcZoneRef = useRef<ZoneId | null>(null);
  const isHintOpenRef = useRef<boolean>(false);
  const lastStepBucketRef = useRef<number>(-1);

  const [nearbyCode, setNearbyCode] = useState<SubStationCode | null>(null);
  const [nearbyNpcZone, setNearbyNpcZone] = useState<ZoneId | null>(null);
  const [hoveredCode, setHoveredCode] = useState<SubStationCode | null>(null);
  const [hoveredNpcZone, setHoveredNpcZone] = useState<ZoneId | null>(null);
  const [activeModalCode, setActiveModalCode] = useState<SubStationCode | null>(
    null
  );
  const [activeNpcDialogueZone, setActiveNpcDialogueZone] =
    useState<ZoneId | null>(null);
  const [liveVoiceEntries, setLiveVoiceEntries] =
    useState<EmployeeVoiceEntryItem[]>(voiceEntries);
  const [liveComfortPulses, setLiveComfortPulses] =
    useState<WorkComfortPulseItem[]>(comfortPulses);
  const [minimapPos, setMinimapPos] = useState<{ x: number; y: number }>({
    x: 1200,
    y: 690,
  });

  useEffect(() => {
    activeModalRef.current = activeModalCode;
  }, [activeModalCode]);

  useEffect(() => {
    activeNpcZoneRef.current = activeNpcDialogueZone;
  }, [activeNpcDialogueZone]);

  useEffect(() => {
    isHintOpenRef.current = isHintModalOpen;
  }, [isHintModalOpen]);

  // Preload /assets/map-floor.png and chroma-key all sprite sheets
  useEffect(() => {
    paletteRef.current = readCanvasPalette();

    const floorImg = new Image();
    floorImg.src = "/assets/map-floor.png";
    floorImg.onload = () => {
      mapFloorRef.current = floorImg;
    };

    const buildingsImg = new Image();
    buildingsImg.src = "/assets/buildings-sprites.png";
    buildingsImg.onload = () => {
      buildingsSheetRef.current = chromaKeyWhiteSheetOnCanvas(
        buildingsImg,
        3,
        1
      );
    };

    const featureStationsImg = new Image();
    featureStationsImg.src = "/assets/feature-stations.png";
    featureStationsImg.onload = () => {
      featureStationsRef.current = chromaKeyWhiteSheetOnCanvas(
        featureStationsImg,
        3,
        3
      );
    };

    const gardenImg = new Image();
    gardenImg.src = "/assets/garden-structures.png";
    gardenImg.onload = () => {
      gardenStructuresRef.current = chromaKeyWhiteSheetOnCanvas(
        gardenImg,
        4,
        2
      );
    };

    const natureImg = new Image();
    natureImg.src = "/assets/nature-details.png";
    natureImg.onload = () => {
      natureDetailsRef.current = chromaKeyWhiteSheetOnCanvas(natureImg, 4, 2);
    };

    const mcImg = new Image();
    mcImg.src = "/assets/mc-sprites.png";
    mcImg.onload = () => {
      mcSheetRef.current = chromaKeyWhiteSheetOnCanvas(mcImg, 4, 4);
    };

    const npcImg = new Image();
    npcImg.src = "/assets/zone-npcs.png";
    npcImg.onload = () => {
      npcSheetRef.current = chromaKeyWhiteSheetOnCanvas(npcImg, 4, 4);
    };
  }, []);

  useEffect(() => {
    if (cameraResetNonce > 0) {
      playerRef.current = createInitialPlayerState();
      setActiveModalCode(null);
      setActiveNpcDialogueZone(null);
      setIsSignpostOpen(false);
      setMinimapPos({ x: 1200, y: 690 });
    }
  }, [cameraResetNonce, setIsSignpostOpen]);

  const handleOpenSubStation = useCallback(
    (code: SubStationCode) => {
      sanctuaryAudio.unlockAndStart();
      sanctuaryAudio.playZoneChime();
      playerRef.current.clickTarget = null;
      playerRef.current.vx = 0;
      playerRef.current.vy = 0;
      setIsSignpostOpen(false);
      setActiveNpcDialogueZone(null);
      setActiveModalCode(code);
    },
    [setIsSignpostOpen]
  );

  const handleOpenNpcDialogue = useCallback(
    (zoneId: ZoneId) => {
      sanctuaryAudio.unlockAndStart();
      sanctuaryAudio.playZoneChime();
      playerRef.current.clickTarget = null;
      playerRef.current.vx = 0;
      playerRef.current.vy = 0;
      setIsSignpostOpen(false);
      setActiveModalCode(null);
      setActiveNpcDialogueZone(zoneId);
    },
    [setIsSignpostOpen]
  );

  const handleFastTravelToNpc = useCallback(
    (zoneId: ZoneId) => {
      const station = getStationById(zoneId);
      playerRef.current.x = station.npcX;
      playerRef.current.y = Math.min(WORLD_HEIGHT - 48, station.npcY + 62);
      playerRef.current.vx = 0;
      playerRef.current.vy = 0;
      playerRef.current.clickTarget = null;
      playerRef.current.facing = "up";
      nearbyNpcZoneRef.current = zoneId;
      setNearbyNpcZone(zoneId);
      setMinimapPos({ x: playerRef.current.x, y: playerRef.current.y });
      handleOpenNpcDialogue(zoneId);
    },
    [handleOpenNpcDialogue]
  );

  const handleFastTravel = useCallback(
    (code: SubStationCode) => {
      const station = getFeatureSubStationByCode(code);
      playerRef.current.x = station.approachX;
      playerRef.current.y = station.approachY;
      playerRef.current.vx = 0;
      playerRef.current.vy = 0;
      playerRef.current.clickTarget = null;
      playerRef.current.facing = "up";
      nearbyCodeRef.current = code;
      setNearbyCode(code);
      setMinimapPos({ x: station.approachX, y: station.approachY });
      handleOpenSubStation(code);
    },
    [handleOpenSubStation]
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

      sanctuaryAudio.unlockAndStart();

      const lower = event.key.toLowerCase();
      keysRef.current[lower] = true;

      if (lower === "e") {
        if (
          !activeModalRef.current &&
          !activeNpcZoneRef.current &&
          !isHintOpenRef.current
        ) {
          if (nearbyNpcZoneRef.current) {
            event.preventDefault();
            handleOpenNpcDialogue(nearbyNpcZoneRef.current);
            return;
          }
          if (nearbyCodeRef.current) {
            event.preventDefault();
            handleOpenSubStation(nearbyCodeRef.current);
          }
        }
        return;
      }

      if (event.key === "Escape") {
        if (activeNpcZoneRef.current) {
          event.preventDefault();
          setActiveNpcDialogueZone(null);
          return;
        }
        if (activeModalRef.current) {
          event.preventDefault();
          setActiveModalCode(null);
        }
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
  }, [handleOpenNpcDialogue, handleOpenSubStation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let lastTimestamp = performance.now();
    let frameTick = 0;
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
      frameTick += 1;

      const palette = paletteRef.current ?? readCanvasPalette();
      paletteRef.current = palette;

      const k = keysRef.current;
      const detectedCode = updatePlayerPhysics(
        playerRef.current,
        {
          up: Boolean(k["w"] || k["arrowup"]),
          down: Boolean(k["s"] || k["arrowdown"]),
          left: Boolean(k["a"] || k["arrowleft"]),
          right: Boolean(k["d"] || k["arrowright"]),
          locked:
            activeModalRef.current !== null ||
            activeNpcZoneRef.current !== null ||
            isHintOpenRef.current,
        },
        dtRatio
      );
      const detectedNpc = getNearbyNpcStation(
        playerRef.current.x,
        playerRef.current.y
      );
      const nextNpcZone = detectedNpc?.id ?? null;

      // Synchronized terrain-aware footsteps
      const speed = Math.hypot(playerRef.current.vx, playerRef.current.vy);
      if (speed >= 0.1) {
        const currentStepBucket = Math.floor(now / 130);
        if (currentStepBucket !== lastStepBucketRef.current) {
          lastStepBucketRef.current = currentStepBucket;
          if (currentStepBucket % 2 === 1) {
            const surface = getSurfaceTypeAt(
              playerRef.current.x,
              playerRef.current.y
            );
            sanctuaryAudio.playFootstep(surface);
          }
        }
      } else {
        lastStepBucketRef.current = -1;
      }

      if (frameTick % 6 === 0) {
        sanctuaryAudio.updateWaterProximity(
          playerRef.current.x,
          playerRef.current.y
        );
      }

      if (detectedCode !== nearbyCodeRef.current) {
        nearbyCodeRef.current = detectedCode;
        setNearbyCode(detectedCode);
      }

      if (nextNpcZone !== nearbyNpcZoneRef.current) {
        nearbyNpcZoneRef.current = nextNpcZone;
        setNearbyNpcZone(nextNpcZone);
      }

      if (frameTick % 8 === 0) {
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

      // LAYER 0 — Clean Floor Terrain (/assets/map-floor.png at 0,0 -> 2400x1350)
      if (mapFloorRef.current) {
        ctx.drawImage(
          mapFloorRef.current,
          0,
          0,
          mapFloorRef.current.naturalWidth || WORLD_WIDTH,
          mapFloorRef.current.naturalHeight || WORLD_HEIGHT,
          0,
          0,
          WORLD_WIDTH,
          WORLD_HEIGHT
        );
      }

      // Layer 0 Details: Koi Pond Ripples & Diagonal Cloud Shadows
      const nearbyStationZone = nearbyCodeRef.current
        ? getFeatureSubStationByCode(nearbyCodeRef.current).zoneId
        : null;
      drawFloorLayerDetails(
        ctx,
        ZONE_STATIONS,
        nearbyStationZone,
        palette,
        timeSec
      );
      drawClickTargetRing(
        ctx,
        playerRef.current.clickTarget,
        palette,
        timeSec
      );

      // LAYER 1 — Unified Y-Sorted Render Queue (Buildings + 9 Sub-Stations + Props + NPCs + MC)
      type RenderEntity = { footY: number; draw: () => void };
      const ySortedQueue: RenderEntity[] = [];

      // 1. 3 Modular Buildings (Library Cabin, Zen Greenhouse Dome, Treehouse Post Office)
      for (const building of WORLD_BUILDINGS) {
        ySortedQueue.push({
          footY: building.footY,
          draw: () =>
            drawWorldBuildingSprite(
              ctx,
              buildingsSheetRef.current,
              building,
              palette,
              timeSec
            ),
        });
      }

      // 2. 9 Interactive Sub-Feature Stations (1A..3C from feature-stations.png)
      for (const subStation of FEATURE_STATIONS) {
        ySortedQueue.push({
          footY: subStation.footY,
          draw: () =>
            drawFeatureSubStationSprite(
              ctx,
              featureStationsRef.current,
              subStation,
              nearbyCodeRef.current,
              hoveredCodeRef.current,
              palette,
              timeSec
            ),
        });
      }

      // 3. Garden Structures & Nature Detail Props (Fountain, Bench, Signpost, Lanterns, Oak Trees)
      for (const prop of WORLD_FOREGROUND_PROPS) {
        const sheetSource =
          prop.animKind === "tree"
            ? natureDetailsRef.current ?? gardenStructuresRef.current
            : gardenStructuresRef.current;
        ySortedQueue.push({
          footY: prop.footY,
          draw: () =>
            drawWorldForegroundProp(
              ctx,
              sheetSource,
              prop,
              playerRef.current,
              nearbyStationZone,
              palette,
              timeSec
            ),
        });
      }

      // 4. 3 Cozy Zone NPCs
      ZONE_STATIONS.forEach((station, idx) => {
        ySortedQueue.push({
          footY: station.npcY,
          draw: () =>
            drawCozyNpcSprite(
              ctx,
              npcSheetRef.current,
              station,
              playerRef.current,
              palette,
              now,
              idx
            ),
        });
      });

      // 5. Main Character (MC)
      ySortedQueue.push({
        footY: playerRef.current.y,
        draw: () =>
          drawMainCharacterSprite(
            ctx,
            mcSheetRef.current,
            playerRef.current,
            palette,
            now
          ),
      });

      // Sort all entities by footY ascending (a.footY - b.footY)
      ySortedQueue.sort((a, b) => a.footY - b.footY);
      for (const entity of ySortedQueue) {
        entity.draw();
      }

      drawCalibratedEnvironmentFX(
        ctx,
        palette,
        timeSec,
        cameraRef.current.x,
        cameraRef.current.y
      );

      // Architectural Zone Nameplates above each building clearing
      for (const station of ZONE_STATIONS) {
        const hoveredStationZone = hoveredCodeRef.current
          ? getFeatureSubStationByCode(hoveredCodeRef.current).zoneId
          : null;
        drawZonePromptOverlay(
          ctx,
          station,
          palette,
          timeSec,
          nearbyStationZone === station.id,
          hoveredStationZone === station.id
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
    if (activeModalCode || activeNpcDialogueZone || isHintModalOpen) return;
    const world = toWorldCoords(e.clientX, e.clientY);
    const npcHit = hitTestNpc(world.x, world.y);
    const nextNpcHover = npcHit?.id ?? null;
    if (nextNpcHover !== hoveredNpcZoneRef.current) {
      hoveredNpcZoneRef.current = nextNpcHover;
      setHoveredNpcZone(nextNpcHover);
    }

    const hit = npcHit ? null : hitTestSubStation(world.x, world.y);
    const nextHover = hit?.code ?? null;
    if (nextHover !== hoveredCodeRef.current) {
      hoveredCodeRef.current = nextHover;
      setHoveredCode(nextHover);
    }
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeModalCode || activeNpcDialogueZone || isHintModalOpen) return;
    sanctuaryAudio.unlockAndStart();
    const world = toWorldCoords(e.clientX, e.clientY);
    const npcHit = hitTestNpc(world.x, world.y);
    if (npcHit) {
      handleOpenNpcDialogue(npcHit.id);
      return;
    }
    const hit = hitTestSubStation(world.x, world.y);
    if (hit) {
      handleOpenSubStation(hit.code);
      return;
    }
    playerRef.current.clickTarget = {
      x: Math.max(48, Math.min(WORLD_WIDTH - 48, world.x)),
      y: Math.max(48, Math.min(WORLD_HEIGHT - 48, world.y)),
    };
  };

  const nearbySubStation = nearbyCode
    ? getFeatureSubStationByCode(nearbyCode)
    : null;
  const nearbyNpcStation = nearbyNpcZone ? getStationById(nearbyNpcZone) : null;
  const activeNpcStation = activeNpcDialogueZone
    ? getStationById(activeNpcDialogueZone)
    : null;

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerMove={handleCanvasPointerMove}
        onPointerDown={handleCanvasPointerDown}
        style={{
          cursor: hoveredCode || hoveredNpcZone ? "pointer" : "crosshair",
        }}
        className="fixed inset-0 z-0 block h-full w-full touch-none"
      />

      {/* Collapsible Top-Right Wooden Signpost Popover */}
      <AnimatePresence>
        {isSignpostOpen && !activeModalCode && !activeNpcDialogueZone && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 360, damping: 24 }}
            className="pointer-events-none fixed right-3 top-16 z-30 sm:right-4 sm:top-16"
          >
            <SignpostMinimap
              playerPos={minimapPos}
              nearbyCode={nearbyCode}
              activeModalCode={activeModalCode}
              onFastTravel={handleFastTravel}
              onTalkToNpc={handleFastTravelToNpc}
              onRecenter={triggerCameraReset}
              onClose={() => setIsSignpostOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouncing HUD [E] Prompt when near a Zone Guide NPC or any of the 9 sub-feature stations */}
      <AnimatePresence>
        {!activeModalCode &&
          !activeNpcDialogueZone &&
          !isHintModalOpen &&
          (nearbyNpcStation || nearbySubStation) && (
            <motion.div
              key={
                nearbyNpcStation
                  ? `npc-${nearbyNpcStation.id}`
                  : nearbySubStation?.code
              }
              initial={{ opacity: 0, y: 12, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 360, damping: 22 }}
              className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex flex-wrap justify-center gap-2.5 px-4"
            >
              {nearbyNpcStation && (
                <button
                  type="button"
                  onClick={() => handleOpenNpcDialogue(nearbyNpcStation.id)}
                  className="pointer-events-auto cartoon-panel cartoon-btn line-boil flex items-center gap-2.5 rounded-2xl px-4 py-2 text-xs font-bold text-ink-charcoal"
                >
                  <kbd className="inline-flex h-6 w-6 items-center justify-center rounded-lg border-2 border-ink-charcoal bg-zone-selfcare font-hand text-sm font-bold text-ink-charcoal">
                    E
                  </kbd>
                  <span className="font-hand text-xl leading-none">
                    Tekan [E] · Ngobrol dengan {nearbyNpcStation.npcName} (
                    {nearbyNpcStation.npcRole})
                  </span>
                </button>
              )}

              {nearbySubStation && (
                <button
                  type="button"
                  onClick={() => handleOpenSubStation(nearbySubStation.code)}
                  className="pointer-events-auto cartoon-panel cartoon-btn line-boil flex items-center gap-2.5 rounded-2xl px-4 py-2 text-xs font-bold text-ink-charcoal"
                >
                  <kbd className="inline-flex h-6 w-6 items-center justify-center rounded-lg border-2 border-ink-charcoal bg-zone-psychology font-hand text-sm font-bold text-ink-charcoal">
                    {nearbyNpcStation ? "Klik" : "E"}
                  </kbd>
                  <span className="font-hand text-xl leading-none">
                    {nearbyNpcStation ? "Buka Pos" : "Tekan [E]"} ·{" "}
                    {nearbySubStation.shortLabel}
                  </span>
                </button>
              )}
            </motion.div>
          )}
      </AnimatePresence>

      {/* Interactive Branching NPC Dialogue Modal */}
      <AnimatePresence>
        {activeNpcStation && (
          <NpcDialogueModal
            station={activeNpcStation}
            onSelectStationCode={(code) => handleOpenSubStation(code)}
            onClose={() => setActiveNpcDialogueZone(null)}
          />
        )}
      </AnimatePresence>

      {/* Strictly Isolated 9 Sub-Feature Station Modals (1A..3C) */}
      <AnimatePresence>
        {activeModalCode && (
          <SubStationModalHost
            stationCode={activeModalCode}
            psychologyArticles={psychologyArticles}
            quests={quests}
            voiceEntries={liveVoiceEntries}
            comfortPulses={liveComfortPulses}
            onVoiceEntryCreated={(entry) =>
              setLiveVoiceEntries((prev) => [entry, ...prev])
            }
            onComfortPulseCreated={(pulse) =>
              setLiveComfortPulses((prev) => [pulse, ...prev])
            }
            onClose={() => setActiveModalCode(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
