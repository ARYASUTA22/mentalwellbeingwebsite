import {
  computeNpcFacing,
  SPRITE_FRAME_H,
  SPRITE_FRAME_W,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type FacingDirection,
  type FeatureSubStation,
  type PlayerPhysicsState,
  type WorldBuildingSprite,
  type WorldForegroundProp,
  type ZoneId,
  type ZoneStation,
} from "@/components/canvas/PhysicsController";
import type { SubStationCode } from "@/lib/seed";

export interface CanvasPalette {
  paperCream: string;
  paperAged: string;
  canvasMeadow: string;
  woodWarm: string;
  woodPlank: string;
  inkCharcoal: string;
  inkMuted: string;
  zonePsychology: string;
  zoneSelfcare: string;
  zoneVoice: string;
  shadowAmbient: string;
  shadowCloud: string;
}

export type SpriteSheetSource = HTMLImageElement | HTMLCanvasElement;

/**
 * Strict 4x4 Direction Row Mapping for mc-sprites.png & zone-npcs.png:
 * Row 0: Down / South
 * Row 1: Left / West
 * Row 2: Right / East
 * Row 3: Up / North
 */
const DIRECTION_TO_ROW: Record<FacingDirection, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};

const CLOUD_SHADOWS = [
  { baseX: 380, baseY: 280, rx: 340, ry: 130, speedX: 15, speedY: 4, phase: 0.0 },
  { baseX: 1180, baseY: 590, rx: 390, ry: 145, speedX: 18, speedY: 5, phase: 1.9 },
  { baseX: 1890, baseY: 960, rx: 320, ry: 125, speedX: 14, speedY: 4, phase: 3.8 },
  { baseX: 740, baseY: 1090, rx: 290, ry: 115, speedX: 16, speedY: 4, phase: 5.1 },
];

/**
 * Offscreen <canvas> border flood-fill white-background alpha keyer with 1px dark-ink feathering.
 */
export function chromaKeyWhiteSheetOnCanvas(
  img: HTMLImageElement,
  cols: number,
  rows: number
): HTMLCanvasElement {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || width === 0 || height === 0) {
    return canvas;
  }

  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const cleared = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);

  const isNearWhiteOrTransparent = (idx: number): boolean => {
    const p = idx * 4;
    if (data[p + 3] < 16) return true;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const minC = Math.min(r, g, b);
    const maxC = Math.max(r, g, b);
    return minC > 224 && maxC - minC <= 26;
  };

  for (let row = 0; row < rows; row++) {
    const yStart = Math.floor((row * height) / rows);
    const yEnd = Math.floor(((row + 1) * height) / rows) - 1;

    for (let col = 0; col < cols; col++) {
      const xStart = Math.floor((col * width) / cols);
      const xEnd = Math.floor(((col + 1) * width) / cols) - 1;

      let head = 0;
      let tail = 0;

      const trySeed = (x: number, y: number) => {
        const idx = y * width + x;
        if (cleared[idx] === 0 && isNearWhiteOrTransparent(idx)) {
          cleared[idx] = 1;
          queue[tail++] = idx;
        }
      };

      for (let x = xStart; x <= xEnd; x++) {
        trySeed(x, yStart);
        trySeed(x, yEnd);
      }
      for (let y = yStart + 1; y < yEnd; y++) {
        trySeed(xStart, y);
        trySeed(xEnd, y);
      }

      for (let y = yStart + 1; y < yEnd; y++) {
        for (let x = xStart + 1; x < xEnd; x++) {
          const idx = y * width + x;
          if (cleared[idx] === 0 && data[idx * 4 + 3] < 16) {
            cleared[idx] = 1;
            queue[tail++] = idx;
          }
        }
      }

      while (head < tail) {
        const curr = queue[head++];
        const cx = curr % width;
        const cy = (curr - cx) / width;

        if (cx > xStart) {
          const left = curr - 1;
          if (cleared[left] === 0 && isNearWhiteOrTransparent(left)) {
            cleared[left] = 1;
            queue[tail++] = left;
          }
        }
        if (cx < xEnd) {
          const right = curr + 1;
          if (cleared[right] === 0 && isNearWhiteOrTransparent(right)) {
            cleared[right] = 1;
            queue[tail++] = right;
          }
        }
        if (cy > yStart) {
          const up = curr - width;
          if (cleared[up] === 0 && isNearWhiteOrTransparent(up)) {
            cleared[up] = 1;
            queue[tail++] = up;
          }
        }
        if (cy < yEnd) {
          const down = curr + width;
          if (cleared[down] === 0 && isNearWhiteOrTransparent(down)) {
            cleared[down] = 1;
            queue[tail++] = down;
          }
        }
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const p = idx * 4;
      if (cleared[idx] === 1) {
        data[p + 3] = 0;
        continue;
      }

      const hasClearedNeighbor =
        (x > 0 && cleared[idx - 1] === 1) ||
        (x + 1 < width && cleared[idx + 1] === 1) ||
        (y > 0 && cleared[idx - width] === 1) ||
        (y + 1 < height && cleared[idx + width] === 1);

      if (hasClearedNeighbor) {
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const minC = Math.min(r, g, b);
        const maxC = Math.max(r, g, b);
        if (minC > 185 && maxC - minC <= 36) {
          data[p + 3] = 0;
        } else if (minC > 110) {
          const blend = Math.min(1, (minC - 110) / 115);
          data[p] = Math.round(r * (1 - blend) + 44 * blend);
          data[p + 1] = Math.round(g * (1 - blend) + 34 * blend);
          data[p + 2] = Math.round(b * (1 - blend) + 30 * blend);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function getStrict4x4CellSize(sheet: SpriteSheetSource | null) {
  if (!sheet) {
    return { frameW: 256, frameH: 256 };
  }
  const totalW =
    sheet instanceof HTMLImageElement
      ? sheet.naturalWidth || sheet.width
      : sheet.width;
  const totalH =
    sheet instanceof HTMLImageElement
      ? sheet.naturalHeight || sheet.height
      : sheet.height;

  return {
    frameW: totalW > 0 ? totalW / 4 : 256,
    frameH: totalH > 0 ? totalH / 4 : 256,
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke?: string,
  lineWidth = 3
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
}

export function drawGroundShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  shadowColor: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadowColor;
  ctx.fill();
  ctx.restore();
}

function drawFloatingKeycapBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  badgeColor: string,
  palette: CanvasPalette,
  timeSec: number,
  isHighlighted: boolean
) {
  const bounceY = isHighlighted ? Math.sin(timeSec * 7) * 5 : 0;
  const py = y + bounceY;

  ctx.save();
  ctx.translate(x, py);
  ctx.font = "700 12px Nunito, sans-serif";
  const textW = ctx.measureText(label).width;
  const boxW = Math.max(122, textW + 44);

  drawRoundedRect(
    ctx,
    -boxW / 2 + 3,
    -15,
    boxW,
    28,
    10,
    palette.inkCharcoal
  );
  drawRoundedRect(
    ctx,
    -boxW / 2,
    -18,
    boxW,
    28,
    10,
    isHighlighted ? badgeColor : palette.paperCream,
    palette.inkCharcoal,
    2.5
  );

  drawRoundedRect(
    ctx,
    -boxW / 2 + 6,
    -14,
    20,
    20,
    6,
    isHighlighted ? palette.paperCream : badgeColor,
    palette.inkCharcoal,
    2
  );
  ctx.fillStyle = palette.inkCharcoal;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 11px Fredoka, sans-serif";
  ctx.fillText("E", -boxW / 2 + 16, -4);

  ctx.font = "700 11px Nunito, sans-serif";
  ctx.fillText(label, 11, -4);
  ctx.restore();
}

/**
 * LAYER 0 FLOOR DETAILS:
 * - Animated concentric water ripples over the inset stone koi pond on map-floor.png (2155, 675).
 * - Soft diagonal drifting overhead cloud shadows (rgba(35, 45, 30, 0.1)) across the floor.
 */
export function drawFloorLayerDetails(
  ctx: CanvasRenderingContext2D,
  _stations: ZoneStation[],
  _nearbyZone: ZoneId | null,
  palette: CanvasPalette,
  timeSec: number
) {
  ctx.save();

  // 1. Inset Stone Koi Pond Concentric Water Ripples (top-right of map-floor.png)
  for (let r = 0; r < 3; r++) {
    const t = (timeSec * 0.48 + r * 0.33) % 1;
    ctx.beginPath();
    ctx.ellipse(2155, 675, 12 + t * 68, 6 + t * 26, 0, 0, Math.PI * 2);
    ctx.strokeStyle = palette.paperCream;
    ctx.globalAlpha = (1 - t) * 0.58;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 2. Soft diagonal drifting overhead cloud shadows (rgba(35, 45, 30, 0.1)) across the floor
  ctx.save();
  ctx.fillStyle = palette.shadowCloud || palette.shadowAmbient;
  ctx.globalAlpha = 1;
  for (const cloud of CLOUD_SHADOWS) {
    const cx =
      ((cloud.baseX + timeSec * cloud.speedX) % (WORLD_WIDTH + cloud.rx * 2)) -
      cloud.rx;
    const cy =
      ((cloud.baseY + timeSec * cloud.speedY) % (WORLD_HEIGHT + cloud.ry * 2)) -
      cloud.ry;
    ctx.beginPath();
    ctx.ellipse(cx, cy, cloud.rx, cloud.ry, -0.32, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

export const drawStationWelcomeMats = drawFloorLayerDetails;

/**
 * LAYER 1 — 9 SUB-FEATURE STATION RENDERER (/assets/feature-stations.png, 3x3 grid):
 * Renders each of the 9 stations (1A..3C) with a soft oval shadow, proximity bounce,
 * and floating [E] badge.
 */
export function drawFeatureSubStationSprite(
  ctx: CanvasRenderingContext2D,
  featureSheet: SpriteSheetSource | null,
  subStation: FeatureSubStation,
  nearbyCode: SubStationCode | null,
  hoveredCode: SubStationCode | null,
  palette: CanvasPalette,
  timeSec: number
) {
  if (!featureSheet) return;

  const totalW =
    featureSheet instanceof HTMLImageElement
      ? featureSheet.naturalWidth || featureSheet.width
      : featureSheet.width;
  const totalH =
    featureSheet instanceof HTMLImageElement
      ? featureSheet.naturalHeight || featureSheet.height
      : featureSheet.height;

  const cellW = totalW / 3;
  const cellH = totalH / 3;
  const sx = subStation.sheetCol * cellW;
  const sy = subStation.sheetRow * cellH;

  const isNearby = nearbyCode === subStation.code;
  const isHovered = hoveredCode === subStation.code;
  const isHighlighted = isNearby || isHovered;

  const badgeColor =
    subStation.zoneId === "psychology"
      ? palette.zonePsychology
      : subStation.zoneId === "self-care"
        ? palette.zoneSelfcare
        : palette.zoneVoice;

  ctx.save();
  ctx.translate(Math.round(subStation.x), Math.round(subStation.y));

  // Soft warm oval shadow underneath the station base
  drawGroundShadow(
    ctx,
    0,
    -8,
    subStation.drawWidth * 0.38,
    subStation.drawHeight * 0.13,
    palette.shadowAmbient
  );

  // Subtle glow & spring-physics bounce when player is within interaction range
  if (isHighlighted) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glowR = subStation.drawWidth * 0.48;
    const grad = ctx.createRadialGradient(
      0,
      -subStation.drawHeight * 0.45,
      4,
      0,
      -subStation.drawHeight * 0.45,
      glowR
    );
    grad.addColorStop(0, badgeColor);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.42;
    ctx.beginPath();
    ctx.arc(0, -subStation.drawHeight * 0.45, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  const scale = isHighlighted
    ? 1.06 + Math.sin(timeSec * 6.5) * 0.018
    : 1 + Math.sin(timeSec * 2.2 + subStation.sheetCol) * 0.006;
  ctx.scale(scale, scale);

  ctx.drawImage(
    featureSheet,
    sx,
    sy,
    cellW,
    cellH,
    -subStation.drawWidth / 2,
    -subStation.drawHeight + 8,
    subStation.drawWidth,
    subStation.drawHeight
  );
  ctx.restore();

  // Always show a compact station label pill, expanding with bouncing [E] when nearby/hovered
  drawFloatingKeycapBadge(
    ctx,
    0,
    -subStation.drawHeight - 4,
    subStation.shortLabel,
    badgeColor,
    palette,
    timeSec,
    isHighlighted
  );

  ctx.restore();
}

/**
 * LAYER 1 — MODULAR Y-SORTED BUILDING RENDERER (buildings-sprites.png):
 */
export function drawWorldBuildingSprite(
  ctx: CanvasRenderingContext2D,
  buildingsSheet: SpriteSheetSource | null,
  building: WorldBuildingSprite,
  palette: CanvasPalette,
  timeSec: number
) {
  if (!buildingsSheet) return;

  const totalW =
    buildingsSheet instanceof HTMLImageElement
      ? buildingsSheet.naturalWidth || buildingsSheet.width
      : buildingsSheet.width;
  const totalH =
    buildingsSheet instanceof HTMLImageElement
      ? buildingsSheet.naturalHeight || buildingsSheet.height
      : buildingsSheet.height;

  const cellW = totalW / 3;
  const cellH = totalH;
  const sx = building.sheetCol * cellW;
  const sy = 0;

  ctx.save();
  ctx.translate(Math.round(building.x), Math.round(building.y));

  drawGroundShadow(
    ctx,
    0,
    -building.shadowRy * 0.45,
    building.shadowRx,
    building.shadowRy,
    palette.shadowAmbient
  );

  ctx.save();
  if (building.id === "employee-voice") {
    const canopySway = Math.sin(timeSec * 1.45 + 1.2) * 0.008;
    ctx.rotate(canopySway);
  }

  ctx.drawImage(
    buildingsSheet,
    sx,
    sy,
    cellW,
    cellH,
    -building.drawWidth / 2,
    -building.drawHeight + 12,
    building.drawWidth,
    building.drawHeight
  );
  ctx.restore();

  if (building.id === "psychology") {
    const chimneyX = -building.drawWidth * 0.21;
    const chimneyY = -building.drawHeight * 0.78;
    for (let i = 0; i < 4; i++) {
      const t = (timeSec * 0.34 + i * 0.25) % 1;
      const smokeX = chimneyX + Math.sin(t * Math.PI * 2 + i) * 12 - t * 18;
      const smokeY = chimneyY - t * 72;
      const radius = 9 + t * 16;
      ctx.beginPath();
      ctx.arc(smokeX, smokeY, radius, 0, Math.PI * 2);
      ctx.fillStyle = palette.paperCream;
      ctx.globalAlpha = (1 - t) * 0.55;
      ctx.fill();
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const windowOffsets = [
      { dx: -105, dy: -365, r: 58 },
      { dx: 75, dy: -395, r: 54 },
      { dx: -105, dy: -215, r: 58 },
      { dx: 25, dy: -200, r: 52 },
      { dx: 185, dy: -265, r: 58 },
    ];
    windowOffsets.forEach((win, idx) => {
      const pulse = 0.85 + Math.sin(timeSec * 2.8 + idx * 0.9) * 0.15;
      const radius = win.r * pulse;
      const grad = ctx.createRadialGradient(
        win.dx,
        win.dy,
        3,
        win.dx,
        win.dy,
        radius
      );
      grad.addColorStop(0, palette.zonePsychology);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.34;
      ctx.beginPath();
      ctx.arc(win.dx, win.dy, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  } else if (building.id === "self-care") {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const shimmerShift = Math.sin(timeSec * 1.2) * 28;
    const domeCenterY = -building.drawHeight * 0.54;

    ctx.beginPath();
    ctx.arc(0, domeCenterY, building.drawWidth * 0.42, 0, Math.PI * 2);
    ctx.clip();

    ctx.translate(shimmerShift, domeCenterY);
    ctx.rotate(-0.45);
    const beamGrad = ctx.createLinearGradient(-95, 0, 95, 0);
    beamGrad.addColorStop(0, "transparent");
    beamGrad.addColorStop(0.5, palette.paperCream);
    beamGrad.addColorStop(1, "transparent");
    ctx.fillStyle = beamGrad;
    ctx.globalAlpha = 0.24 + Math.sin(timeSec * 2.2) * 0.08;
    ctx.fillRect(-95, -240, 190, 480);
    ctx.restore();
  } else if (building.id === "employee-voice") {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const fairySpots = [
      { dx: -175, dy: -410, r: 38 },
      { dx: -120, dy: -395, r: 36 },
      { dx: -30, dy: -365, r: 42 },
      { dx: 35, dy: -345, r: 42 },
      { dx: 115, dy: -360, r: 38 },
      { dx: 185, dy: -340, r: 38 },
      { dx: 45, dy: -255, r: 36 },
    ];
    fairySpots.forEach((bulb, idx) => {
      const pulse = 0.78 + Math.sin(timeSec * 3.8 + idx * 1.1) * 0.22;
      const radius = bulb.r * pulse;
      const grad = ctx.createRadialGradient(
        bulb.dx,
        bulb.dy,
        2,
        bulb.dx,
        bulb.dy,
        radius
      );
      grad.addColorStop(0, palette.zonePsychology);
      grad.addColorStop(0.6, palette.zoneVoice);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.42;
      ctx.beginPath();
      ctx.arc(bulb.dx, bulb.dy, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  ctx.restore();
}

/**
 * LAYER 1 — GARDEN STRUCTURES & NATURE DETAILS (garden-structures.png / nature-details.png):
 */
export function drawWorldForegroundProp(
  ctx: CanvasRenderingContext2D,
  propsSheet: SpriteSheetSource | null,
  prop: WorldForegroundProp,
  _player: PlayerPhysicsState,
  _nearbyZone: ZoneId | null,
  palette: CanvasPalette,
  timeSec: number
) {
  if (!propsSheet) return;

  const totalW =
    propsSheet instanceof HTMLImageElement
      ? propsSheet.naturalWidth || propsSheet.width
      : propsSheet.width;
  const totalH =
    propsSheet instanceof HTMLImageElement
      ? propsSheet.naturalHeight || propsSheet.height
      : propsSheet.height;

  const cellW = totalW / 4;
  const cellH = totalH / 2;
  const sx = prop.sheetCol * cellW;
  const sy = prop.sheetRow * cellH;

  ctx.save();
  ctx.translate(Math.round(prop.x), Math.round(prop.y));

  drawGroundShadow(
    ctx,
    0,
    -8,
    prop.drawWidth * 0.36,
    prop.drawHeight * 0.12,
    palette.shadowAmbient
  );

  ctx.save();
  if (prop.animKind === "tree") {
    const swayAngle = Math.sin(timeSec * 1.65 + prop.phase) * 0.024;
    ctx.rotate(swayAngle);
  }

  ctx.drawImage(
    propsSheet,
    sx,
    sy,
    cellW,
    cellH,
    -prop.drawWidth / 2,
    -prop.drawHeight + 8,
    prop.drawWidth,
    prop.drawHeight
  );
  ctx.restore();

  if (prop.animKind === "lantern") {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const lampY = -prop.drawHeight * 0.72;
    const pulse = 0.84 + Math.sin(timeSec * 3.4 + prop.phase) * 0.16;
    const haloRadius = 72 * pulse;
    const grad = ctx.createRadialGradient(0, lampY, 3, 0, lampY, haloRadius);
    grad.addColorStop(0, palette.zonePsychology);
    grad.addColorStop(0.55, palette.zoneVoice);
    grad.addColorStop(1, "transparent");

    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(0, lampY, haloRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (prop.animKind === "fountain") {
    ctx.save();
    const basinY = -prop.drawHeight * 0.25;
    for (let r = 0; r < 2; r++) {
      const t = (timeSec * 0.58 + r * 0.5) % 1;
      ctx.beginPath();
      ctx.ellipse(
        0,
        basinY,
        12 + t * 46,
        6 + t * 22,
        0,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = palette.paperCream;
      ctx.globalAlpha = (1 - t) * 0.68;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

export function drawCalibratedEnvironmentFX(
  _ctx: CanvasRenderingContext2D,
  _palette: CanvasPalette,
  _timeSec: number,
  _camCenterX = WORLD_WIDTH / 2,
  _camCenterY = WORLD_HEIGHT / 2
) {
  // No procedural shapes drawn for world objects
}

export function drawClickTargetRing(
  ctx: CanvasRenderingContext2D,
  clickTarget: { x: number; y: number } | null,
  palette: CanvasPalette,
  timeSec: number
) {
  if (!clickTarget) return;
  ctx.save();
  const pulse = 13 + Math.sin(timeSec * 8) * 3;
  ctx.beginPath();
  ctx.arc(clickTarget.x, clickTarget.y, pulse, 0, Math.PI * 2);
  ctx.strokeStyle = palette.inkCharcoal;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(clickTarget.x, clickTarget.y, pulse * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = palette.zonePsychology;
  ctx.fill();
  ctx.restore();
}

export function drawMainCharacterSprite(
  ctx: CanvasRenderingContext2D,
  mcSheet: SpriteSheetSource | null,
  player: PlayerPhysicsState,
  palette: CanvasPalette,
  nowMs: number
) {
  if (!mcSheet) return;
  const speed = Math.hypot(player.vx, player.vy);
  const isMoving = speed >= 0.1;
  const row = DIRECTION_TO_ROW[player.facing];
  const col = isMoving ? Math.floor(nowMs / 130) % 4 : 0;

  const scaleY = isMoving ? 1 : 1 + Math.sin(nowMs * 0.005) * 0.018;
  const { frameW, frameH } = getStrict4x4CellSize(mcSheet);

  ctx.save();
  ctx.translate(Math.round(player.x), Math.round(player.y));

  drawGroundShadow(ctx, 0, -2, 24, 11, palette.shadowAmbient);

  ctx.scale(1, scaleY);

  const sx = col * frameW;
  const sy = row * frameH;
  const dw = SPRITE_FRAME_W;
  const dh = SPRITE_FRAME_H;
  const dx = -dw / 2;
  const dy = -dh + 4;

  ctx.drawImage(mcSheet, sx, sy, frameW, frameH, dx, dy, dw, dh);
  ctx.restore();
}

export function drawCozyNpcSprite(
  ctx: CanvasRenderingContext2D,
  npcSheet: SpriteSheetSource | null,
  station: ZoneStation,
  player: PlayerPhysicsState,
  palette: CanvasPalette,
  nowMs: number,
  npcIndex: number
) {
  if (!npcSheet) return;
  const facing = computeNpcFacing(station, player.x, player.y);
  const row = DIRECTION_TO_ROW[facing];
  const col = 0;

  const scaleY = 1 + Math.sin((nowMs + npcIndex * 450) * 0.005) * 0.018;
  const { frameW, frameH } = getStrict4x4CellSize(npcSheet);

  ctx.save();
  ctx.translate(Math.round(station.npcX), Math.round(station.npcY));

  drawGroundShadow(ctx, 0, -2, 24, 11, palette.shadowAmbient);

  ctx.save();
  ctx.scale(1, scaleY);

  const sx = col * frameW;
  const sy = row * frameH;
  const dw = SPRITE_FRAME_W;
  const dh = SPRITE_FRAME_H;
  const dx = -dw / 2;
  const dy = -dh + 4;

  ctx.drawImage(npcSheet, sx, sy, frameW, frameH, dx, dy, dw, dh);
  ctx.restore();

  const distToPlayer = Math.hypot(
    player.x - station.npcX,
    player.y - station.npcY
  );
  const isPlayerClose = distToPlayer <= 215;

  if (isPlayerClose) {
    const floatY = -SPRITE_FRAME_H - 20 + Math.sin(nowMs * 0.005) * 3;
    ctx.font = "700 12px Nunito, sans-serif";
    const speechW = Math.min(
      310,
      Math.max(195, ctx.measureText(station.npcSpeech).width + 26)
    );

    drawRoundedRect(
      ctx,
      -speechW / 2 + 3,
      floatY - 22,
      speechW,
      40,
      12,
      palette.inkCharcoal
    );
    drawRoundedRect(
      ctx,
      -speechW / 2,
      floatY - 25,
      speechW,
      40,
      12,
      palette.paperCream,
      palette.inkCharcoal,
      2.5
    );

    ctx.beginPath();
    ctx.moveTo(-7, floatY + 15);
    ctx.lineTo(0, floatY + 24);
    ctx.lineTo(7, floatY + 15);
    ctx.closePath();
    ctx.fillStyle = palette.paperCream;
    ctx.fill();
    ctx.strokeStyle = palette.inkCharcoal;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = palette.inkCharcoal;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 11px Fredoka, sans-serif";
    ctx.fillText(`${station.npcName} (${station.npcRole})`, 0, floatY - 12);
    ctx.font = "700 11px Nunito, sans-serif";
    ctx.fillText(station.npcSpeech, 0, floatY + 4);
  } else {
    ctx.font = "700 11px Fredoka, sans-serif";
    const pillW = Math.max(96, ctx.measureText(station.npcName).width + 20);
    drawRoundedRect(
      ctx,
      -pillW / 2,
      -SPRITE_FRAME_H - 10,
      pillW,
      22,
      8,
      palette.paperCream,
      palette.inkCharcoal,
      2
    );
    ctx.fillStyle = palette.inkCharcoal;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(station.npcName, 0, -SPRITE_FRAME_H + 1);
  }

  ctx.restore();
}

export function drawZonePromptOverlay(
  ctx: CanvasRenderingContext2D,
  station: ZoneStation,
  palette: CanvasPalette,
  _timeSec: number,
  isNearby: boolean,
  isHovered: boolean
) {
  const badgeColor =
    station.id === "psychology"
      ? palette.zonePsychology
      : station.id === "self-care"
        ? palette.zoneSelfcare
        : palette.zoneVoice;

  ctx.save();
  ctx.translate(station.promptX, station.promptY);

  ctx.font = "700 14px Fredoka, Nunito, sans-serif";
  const labelText = station.title;
  const titleW = ctx.measureText(labelText).width;
  const plateW = Math.max(158, titleW + 28);

  drawRoundedRect(
    ctx,
    -plateW / 2 + 4,
    -12,
    plateW,
    30,
    10,
    palette.inkCharcoal
  );
  drawRoundedRect(
    ctx,
    -plateW / 2,
    -16,
    plateW,
    30,
    10,
    isNearby || isHovered ? badgeColor : palette.paperCream,
    palette.inkCharcoal,
    3
  );

  ctx.fillStyle = palette.inkCharcoal;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(labelText, 0, -1);

  ctx.restore();
}
