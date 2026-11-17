import {
  computeNpcFacing,
  SPRITE_FRAME_H,
  SPRITE_FRAME_W,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type FacingDirection,
  type PlayerPhysicsState,
  type ZoneStation,
} from "@/components/canvas/PhysicsController";

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
}

/**
 * Maps FacingDirection to sprite sheet Row index:
 * Row 0: Facing South/Down
 * Row 1: Facing East/Right
 * Row 2: Facing West/Left
 * Row 3: Facing North/Up
 */
const DIRECTION_TO_ROW: Record<FacingDirection, number> = {
  down: 0,
  right: 1,
  left: 2,
  up: 3,
};

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

/**
 * Drops a circular/oval rgba(44, 34, 30, 0.22) shadow base on the ground.
 */
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

/**
 * Draws the subtle click destination ring on top of /assets/map-background.png.
 */
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

/**
 * Draws the Main Character (MC) from the left 3-column group (cols 0..2) of /assets/characters.png:
 * - Frame 0 (Idle) with scaleY = 1 + Math.sin(frame * 0.1) * 0.01 when still
 * - Swaps between Frame 1 (Walk A) and Frame 2 (Walk B) every 10 frames when moving
 */
export function drawMainCharacterSprite(
  ctx: CanvasRenderingContext2D,
  spriteSheet: HTMLImageElement | null,
  player: PlayerPhysicsState,
  palette: CanvasPalette,
  frameCount: number
) {
  const speed = Math.hypot(player.vx, player.vy);
  const isMoving = speed > 0.25;

  const row = DIRECTION_TO_ROW[player.facing];
  const animCol = isMoving
    ? Math.floor(frameCount / 10) % 2 === 0
      ? 1
      : 2
    : 0;

  const scaleY = isMoving ? 1 : 1 + Math.sin(frameCount * 0.1) * 0.01;

  ctx.save();
  ctx.translate(player.x, player.y);

  // Circular/oval rgba(44, 34, 30, 0.22) ground shadow base
  drawGroundShadow(ctx, 0, -2, 22, 10, palette.shadowAmbient);

  ctx.scale(1, scaleY);

  if (spriteSheet) {
    const sx = animCol * SPRITE_FRAME_W;
    const sy = row * SPRITE_FRAME_H;
    // Flip horizontally when walking West/Left (Row 2) so the side profile faces West
    if (player.facing === "left" && isMoving) {
      ctx.scale(-1, 1);
    }
    ctx.drawImage(
      spriteSheet,
      sx,
      sy,
      SPRITE_FRAME_W,
      SPRITE_FRAME_H,
      -SPRITE_FRAME_W / 2,
      -SPRITE_FRAME_H + 6,
      SPRITE_FRAME_W,
      SPRITE_FRAME_H
    );
  } else {
    // Fallback while image finishes loading
    drawRoundedRect(
      ctx,
      -16,
      -68,
      32,
      64,
      10,
      palette.zonePsychology,
      palette.inkCharcoal,
      3
    );
  }

  ctx.restore();
}

/**
 * Draws a Cozy NPC from the right-side green-clad traveler group (cols 3..5) of /assets/characters.png:
 * - Faces the player's direction when they walk near
 * - Loops through a subtle 2-frame idle breath so they appear alive
 */
export function drawCozyNpcSprite(
  ctx: CanvasRenderingContext2D,
  spriteSheet: HTMLImageElement | null,
  station: ZoneStation,
  player: PlayerPhysicsState,
  palette: CanvasPalette,
  frameCount: number,
  npcIndex: number
) {
  const facing = computeNpcFacing(
    station.npcX,
    station.npcY,
    player.x,
    player.y
  );
  const row = DIRECTION_TO_ROW[facing];

  // Subtle 2-frame idle breath oscillation
  const breathStep = Math.floor((frameCount + npcIndex * 19) / 36) % 2;
  const npcCol = 3 + (breathStep === 0 ? 0 : 1);
  const scaleY = 1 + Math.sin((frameCount + npcIndex * 17) * 0.08) * 0.012;

  ctx.save();
  ctx.translate(station.npcX, station.npcY);

  // Circular/oval rgba(44, 34, 30, 0.22) ground shadow base
  drawGroundShadow(ctx, 0, -2, 22, 10, palette.shadowAmbient);

  ctx.scale(1, scaleY);

  if (spriteSheet) {
    const sx = npcCol * SPRITE_FRAME_W;
    const sy = row * SPRITE_FRAME_H;
    if (facing === "left") {
      ctx.scale(-1, 1);
    }
    ctx.drawImage(
      spriteSheet,
      sx,
      sy,
      SPRITE_FRAME_W,
      SPRITE_FRAME_H,
      -SPRITE_FRAME_W / 2,
      -SPRITE_FRAME_H + 6,
      SPRITE_FRAME_W,
      SPRITE_FRAME_H
    );
  } else {
    drawRoundedRect(
      ctx,
      -16,
      -68,
      32,
      64,
      10,
      palette.zoneSelfcare,
      palette.inkCharcoal,
      3
    );
  }

  ctx.restore();
}

/**
 * Renders the foreground overhang of the ancient oak tree canopy (around X:1200..1860, Y:500..880)
 * so the walkable player avatar renders behind overhanging branches when walking north of the trunk.
 */
export function drawOakTreeForegroundOverhang(
  ctx: CanvasRenderingContext2D,
  bgImage: HTMLImageElement | null
) {
  if (!bgImage) return;
  ctx.save();
  ctx.beginPath();
  // Encompasses the overhanging leafy canopy of the bottom-center ancient oak tree (X:1200..1860, Y:500..865)
  ctx.ellipse(1510, 695, 360, 175, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(bgImage, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.restore();
}

/**
 * Draws the zone nameplate and bouncing [E] keycap prompt over the NPC/station.
 */
export function drawZonePromptOverlay(
  ctx: CanvasRenderingContext2D,
  station: ZoneStation,
  palette: CanvasPalette,
  timeSec: number,
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
  const labelText = `${station.title} · ${station.npcName}`;
  const titleW = ctx.measureText(labelText).width;
  const plateW = Math.max(168, titleW + 28);

  // Hard offset shadow
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

  // Bouncing [E] keycap badge when player is within proximity
  if (isNearby) {
    const bounceY = Math.sin(timeSec * 7) * 6;
    const promptY = -46 + bounceY;

    drawRoundedRect(ctx, -70, promptY - 14, 144, 34, 10, palette.inkCharcoal);
    drawRoundedRect(
      ctx,
      -73,
      promptY - 17,
      144,
      34,
      10,
      palette.paperCream,
      palette.inkCharcoal,
      3
    );

    drawRoundedRect(
      ctx,
      -65,
      promptY - 12,
      24,
      24,
      6,
      badgeColor,
      palette.inkCharcoal,
      2.5
    );
    ctx.fillStyle = palette.inkCharcoal;
    ctx.font = "700 13px Fredoka, sans-serif";
    ctx.fillText("E", -53, promptY);
    ctx.font = "700 13px Nunito, sans-serif";
    ctx.fillText("Talk / Open", 12, promptY);
  }

  ctx.restore();
}
