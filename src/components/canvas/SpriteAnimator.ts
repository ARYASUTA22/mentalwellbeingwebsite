import type {
  PlayerPhysicsState,
  SceneryProp,
  ZoneStation,
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

export interface SpriteTransform {
  scaleX: number;
  scaleY: number;
  offsetY: number;
  stride: number;
  isMoving: boolean;
}

/**
 * Computes idle breathing sine-wave and walk squash-and-stretch (0.92..1.05).
 */
export function computeSpriteTransform(
  vx: number,
  vy: number,
  timeSec: number
): SpriteTransform {
  const speed = Math.hypot(vx, vy);
  const isMoving = speed > 0.35;

  if (isMoving) {
    const wave = Math.sin(timeSec * 13);
    const bounce = Math.abs(wave);
    const scaleY = 0.92 + bounce * 0.13; // 0.92..1.05
    const scaleX = 1.04 - bounce * 0.08;
    return {
      scaleX,
      scaleY,
      offsetY: -bounce * 6,
      stride: wave,
      isMoving: true,
    };
  }

  const idleBreath = Math.sin(timeSec * 2.5);
  return {
    scaleX: 1 - idleBreath * 0.015,
    scaleY: 1 + idleBreath * 0.025,
    offsetY: 0,
    stride: 0,
    isMoving: false,
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

function drawOvalShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawMiniChibiNpc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  shirtColor: string,
  palette: CanvasPalette,
  timeSec: number,
  isExcited: boolean,
  accessory: "glasses" | "cup" | "satchel"
) {
  const breath = Math.sin(timeSec * 2.8 + x * 0.02);
  const waveAngle = isExcited ? Math.sin(timeSec * 9) * 0.5 - 0.8 : 0.15;
  const scaleY = isExcited ? 1 + Math.abs(Math.sin(timeSec * 6)) * 0.06 : 1 + breath * 0.02;

  ctx.save();
  ctx.translate(x, y);
  drawOvalShadow(ctx, 0, 4, 18, 7, palette.shadowAmbient);

  ctx.scale(1, scaleY);

  // Shoes
  drawRoundedRect(ctx, -10, -4, 8, 8, 3, palette.inkCharcoal);
  drawRoundedRect(ctx, 2, -4, 8, 8, 3, palette.inkCharcoal);

  // Shirt torso
  drawRoundedRect(
    ctx,
    -13,
    -24,
    26,
    22,
    7,
    shirtColor,
    palette.inkCharcoal,
    3
  );

  // Waving right arm
  ctx.save();
  ctx.translate(14, -18);
  ctx.rotate(waveAngle);
  drawRoundedRect(
    ctx,
    -3,
    -2,
    8,
    14,
    4,
    palette.paperCream,
    palette.inkCharcoal,
    2.5
  );
  ctx.restore();

  // Left arm + accessory
  drawRoundedRect(
    ctx,
    -19,
    -19,
    8,
    14,
    4,
    palette.paperCream,
    palette.inkCharcoal,
    2.5
  );

  if (accessory === "cup") {
    drawRoundedRect(
      ctx,
      -22,
      -13,
      9,
      9,
      2,
      palette.paperAged,
      palette.inkCharcoal,
      2
    );
  } else if (accessory === "satchel") {
    drawRoundedRect(
      ctx,
      -8,
      -14,
      16,
      10,
      3,
      palette.woodWarm,
      palette.inkCharcoal,
      2
    );
  }

  // Head
  drawRoundedRect(
    ctx,
    -15,
    -47,
    30,
    25,
    10,
    palette.paperCream,
    palette.inkCharcoal,
    3
  );

  // Hair cap
  ctx.beginPath();
  ctx.arc(0, -41, 14, Math.PI, 0);
  ctx.fillStyle = palette.inkCharcoal;
  ctx.fill();

  // Eyes
  ctx.fillStyle = palette.inkCharcoal;
  ctx.beginPath();
  ctx.arc(-5, -34, 2.2, 0, Math.PI * 2);
  ctx.arc(5, -34, 2.2, 0, Math.PI * 2);
  ctx.fill();

  if (accessory === "glasses") {
    ctx.strokeStyle = palette.inkCharcoal;
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -38, 8, 7);
    ctx.strokeRect(2, -38, 8, 7);
    ctx.beginPath();
    ctx.moveTo(-2, -35);
    ctx.lineTo(2, -35);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws the meadow ground, cobblestone plaza paths, angled rugs, scattered leaves, and sleeping cat.
 */
export function drawWorldBackground(
  ctx: CanvasRenderingContext2D,
  palette: CanvasPalette,
  timeSec: number,
  worldWidth: number,
  worldHeight: number,
  clickTarget: { x: number; y: number } | null
) {
  ctx.fillStyle = palette.canvasMeadow;
  ctx.fillRect(0, 0, worldWidth, worldHeight);

  // Soft meadow grass tufts & subtle texture
  ctx.strokeStyle = palette.zoneSelfcare;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  for (let i = 0; i < 24; i++) {
    const gx = 120 + ((i * 257) % (worldWidth - 240));
    const gy = 120 + ((i * 193) % (worldHeight - 240));
    ctx.beginPath();
    ctx.moveTo(gx - 5, gy);
    ctx.lineTo(gx - 8, gy - 8);
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy - 10);
    ctx.moveTo(gx + 5, gy);
    ctx.lineTo(gx + 8, gy - 7);
    ctx.stroke();
  }

  // Cobblestone winding paths from central plaza (800, 565) to all 3 zones
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const drawPath = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.strokeStyle = palette.inkCharcoal;
    ctx.lineWidth = 66;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) / 2, y1, x2, y2);
    ctx.stroke();

    ctx.strokeStyle = palette.paperAged;
    ctx.lineWidth = 58;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) / 2, y1, x2, y2);
    ctx.stroke();
  };

  drawPath(800, 565, 420, 470);
  drawPath(800, 565, 1180, 480);
  drawPath(800, 565, 800, 730);

  // Central wooden deck / sanctuary plaza
  drawOvalShadow(ctx, 806, 575, 125, 76, palette.shadowAmbient);
  ctx.beginPath();
  ctx.ellipse(800, 565, 124, 74, 0, 0, Math.PI * 2);
  ctx.fillStyle = palette.woodWarm;
  ctx.fill();
  ctx.strokeStyle = palette.inkCharcoal;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Off-grid angled picnic rug beside central plaza
  ctx.save();
  ctx.translate(650, 610);
  ctx.rotate(-0.18);
  drawRoundedRect(
    ctx,
    -38,
    -24,
    76,
    48,
    6,
    palette.zonePsychology,
    palette.inkCharcoal,
    3
  );
  drawRoundedRect(ctx, -28, -16, 56, 32, 4, palette.paperCream);
  ctx.restore();

  // Sleeping office cat curled on a sage cushion near the plaza edge
  ctx.save();
  ctx.translate(910, 595);
  drawOvalShadow(ctx, 0, 4, 24, 12, palette.shadowAmbient);
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 14, 0.1, 0, Math.PI * 2);
  ctx.fillStyle = palette.zoneSelfcare;
  ctx.fill();
  ctx.strokeStyle = palette.inkCharcoal;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Cat body breathing slowly
  const catScale = 1 + Math.sin(timeSec * 2.2) * 0.04;
  ctx.scale(catScale, 2 - catScale);
  ctx.beginPath();
  ctx.ellipse(0, -3, 12, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = palette.zoneVoice;
  ctx.fill();
  ctx.stroke();
  // Cat ears
  ctx.beginPath();
  ctx.moveTo(-7, -10);
  ctx.lineTo(-4, -17);
  ctx.lineTo(0, -10);
  ctx.moveTo(2, -10);
  ctx.lineTo(6, -17);
  ctx.lineTo(9, -9);
  ctx.fillStyle = palette.zoneVoice;
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Scattered autumn/sanctuary leaves
  const leaves = [
    { x: 510, y: 540, rot: 0.4, c: palette.zoneVoice },
    { x: 545, y: 525, rot: -0.6, c: palette.zonePsychology },
    { x: 1055, y: 530, rot: 0.9, c: palette.zonePsychology },
    { x: 740, y: 690, rot: -0.3, c: palette.zoneVoice },
    { x: 865, y: 685, rot: 0.7, c: palette.zonePsychology },
  ];
  for (const leaf of leaves) {
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = leaf.c;
    ctx.fill();
    ctx.strokeStyle = palette.inkCharcoal;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // Click destination target ring
  if (clickTarget) {
    const pulse = 12 + Math.sin(timeSec * 8) * 3;
    ctx.beginPath();
    ctx.arc(clickTarget.x, clickTarget.y, pulse, 0, Math.PI * 2);
    ctx.strokeStyle = palette.inkCharcoal;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(clickTarget.x, clickTarget.y, pulse * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = palette.zonePsychology;
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws Y-sorted trees, bushes, and warm lanterns.
 */
export function drawSceneryProp(
  ctx: CanvasRenderingContext2D,
  prop: SceneryProp,
  palette: CanvasPalette,
  timeSec: number
) {
  ctx.save();
  ctx.translate(prop.x, prop.y);
  ctx.scale(prop.scale, prop.scale);

  if (prop.kind === "tree") {
    drawOvalShadow(ctx, 0, 22, 46, 18, palette.shadowAmbient);
    drawRoundedRect(
      ctx,
      -12,
      -28,
      24,
      50,
      6,
      palette.woodPlank,
      palette.inkCharcoal,
      3
    );
    const sway = Math.sin(timeSec * 1.6 + prop.x * 0.01) * 2;
    const drawCanopy = (cx: number, cy: number, r: number, color: string) => {
      ctx.beginPath();
      ctx.arc(cx + sway, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = palette.inkCharcoal;
      ctx.lineWidth = 3;
      ctx.stroke();
    };
    drawCanopy(-22, -45, 28, palette.zoneSelfcare);
    drawCanopy(22, -45, 28, palette.zoneSelfcare);
    drawCanopy(0, -68, 34, palette.zoneSelfcare);
  } else if (prop.kind === "bush") {
    drawOvalShadow(ctx, 0, 12, 32, 12, palette.shadowAmbient);
    ctx.beginPath();
    ctx.arc(-14, 0, 16, 0, Math.PI * 2);
    ctx.arc(14, 0, 16, 0, Math.PI * 2);
    ctx.arc(0, -10, 20, 0, Math.PI * 2);
    ctx.fillStyle = palette.zoneSelfcare;
    ctx.fill();
    ctx.strokeStyle = palette.inkCharcoal;
    ctx.lineWidth = 3;
    ctx.stroke();
    // Little flowers
    ctx.fillStyle = palette.zonePsychology;
    ctx.beginPath();
    ctx.arc(-8, -8, 3.5, 0, Math.PI * 2);
    ctx.arc(10, -2, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    drawOvalShadow(ctx, 0, 12, 12, 6, palette.shadowAmbient);
    drawRoundedRect(
      ctx,
      -4,
      -34,
      8,
      46,
      3,
      palette.woodPlank,
      palette.inkCharcoal,
      2.5
    );
    drawRoundedRect(
      ctx,
      -10,
      -46,
      20,
      16,
      4,
      palette.zonePsychology,
      palette.inkCharcoal,
      2.5
    );
  }

  ctx.restore();
}

/**
 * Draws one of the 3 signature interactive cozy cartoon zones + its NPC + bouncing [E] keycap prompt.
 */
export function drawStationAndNpc(
  ctx: CanvasRenderingContext2D,
  station: ZoneStation,
  palette: CanvasPalette,
  timeSec: number,
  isNearby: boolean,
  isHovered: boolean
) {
  ctx.save();
  ctx.translate(station.x, station.y);

  // Welcome mat / entrance pad
  const matColor =
    station.id === "psychology"
      ? palette.zonePsychology
      : station.id === "self-care"
        ? palette.zoneSelfcare
        : palette.zoneVoice;

  drawOvalShadow(
    ctx,
    4,
    station.height / 2 + 8,
    station.width / 2 + 12,
    24,
    palette.shadowAmbient
  );

  // Highlighted entrance mat when nearby or hovered
  drawRoundedRect(
    ctx,
    -38,
    station.height / 2 - 4,
    76,
    26,
    6,
    isNearby || isHovered ? matColor : palette.paperAged,
    palette.inkCharcoal,
    3
  );

  if (station.id === "psychology") {
    // Zone 1: Cozy Library Nook
    drawRoundedRect(
      ctx,
      -100,
      -45,
      200,
      105,
      12,
      palette.paperCream,
      palette.inkCharcoal,
      3
    );
    // Warm timber trim band
    drawRoundedRect(
      ctx,
      -100,
      36,
      200,
      24,
      6,
      palette.woodWarm,
      palette.inkCharcoal,
      3
    );
    // Angled mustard roof awning
    ctx.beginPath();
    ctx.moveTo(-114, -38);
    ctx.lineTo(0, -104);
    ctx.lineTo(114, -38);
    ctx.closePath();
    ctx.fillStyle = palette.zonePsychology;
    ctx.fill();
    ctx.strokeStyle = palette.inkCharcoal;
    ctx.lineWidth = 3.5;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Library door & arched reading windows
    drawRoundedRect(
      ctx,
      -22,
      6,
      44,
      54,
      10,
      palette.woodPlank,
      palette.inkCharcoal,
      3
    );
    drawRoundedRect(
      ctx,
      -80,
      -18,
      38,
      36,
      8,
      palette.zonePsychology,
      palette.inkCharcoal,
      3
    );
    drawRoundedRect(
      ctx,
      42,
      -18,
      38,
      36,
      8,
      palette.zonePsychology,
      palette.inkCharcoal,
      3
    );

    drawMiniChibiNpc(
      ctx,
      -54,
      78,
      palette.zonePsychology,
      palette,
      timeSec,
      isNearby,
      "glasses"
    );
  } else if (station.id === "self-care") {
    // Zone 2: Zen Greenhouse Patio
    drawRoundedRect(
      ctx,
      -112,
      22,
      224,
      46,
      10,
      palette.woodWarm,
      palette.inkCharcoal,
      3
    );
    // Glass dome frame
    ctx.beginPath();
    ctx.moveTo(-98, 24);
    ctx.lineTo(-98, -28);
    ctx.quadraticCurveTo(-98, -98, 0, -98);
    ctx.quadraticCurveTo(98, -98, 98, -28);
    ctx.lineTo(98, 24);
    ctx.closePath();
    ctx.fillStyle = palette.paperCream;
    ctx.fill();
    ctx.strokeStyle = palette.inkCharcoal;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Sage greenhouse arch mullions
    ctx.strokeStyle = palette.zoneSelfcare;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-42, 22);
    ctx.lineTo(-42, -74);
    ctx.moveTo(42, 22);
    ctx.lineTo(42, -74);
    ctx.stroke();

    // Pulsing 0.25Hz breathing lotus inside greenhouse window
    const breathRadius = 18 + ((Math.sin(timeSec * Math.PI * 0.5) + 1) * 0.5) * 8;
    ctx.beginPath();
    ctx.arc(0, -24, breathRadius, 0, Math.PI * 2);
    ctx.fillStyle = palette.zoneSelfcare;
    ctx.fill();
    ctx.strokeStyle = palette.inkCharcoal;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    drawRoundedRect(
      ctx,
      -20,
      -4,
      40,
      42,
      8,
      palette.woodPlank,
      palette.inkCharcoal,
      3
    );

    drawMiniChibiNpc(
      ctx,
      64,
      76,
      palette.zoneSelfcare,
      palette,
      timeSec,
      isNearby,
      "cup"
    );
  } else {
    // Zone 3: Treehouse Post Office
    drawRoundedRect(
      ctx,
      -104,
      -42,
      208,
      100,
      12,
      palette.woodWarm,
      palette.inkCharcoal,
      3
    );
    // Terracotta sloped post office roof
    ctx.beginPath();
    ctx.moveTo(-118, -34);
    ctx.lineTo(-70, -96);
    ctx.lineTo(70, -96);
    ctx.lineTo(118, -34);
    ctx.closePath();
    ctx.fillStyle = palette.zoneVoice;
    ctx.fill();
    ctx.strokeStyle = palette.inkCharcoal;
    ctx.lineWidth = 3.5;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Post office door & stamped parcel mailbox
    drawRoundedRect(
      ctx,
      -24,
      2,
      48,
      56,
      8,
      palette.paperCream,
      palette.inkCharcoal,
      3
    );
    drawRoundedRect(
      ctx,
      -82,
      -12,
      40,
      28,
      6,
      palette.paperCream,
      palette.inkCharcoal,
      3
    );
    // Mailbox post beside door
    drawRoundedRect(
      ctx,
      60,
      24,
      10,
      38,
      3,
      palette.woodPlank,
      palette.inkCharcoal,
      2.5
    );
    drawRoundedRect(
      ctx,
      48,
      8,
      34,
      22,
      6,
      palette.zoneVoice,
      palette.inkCharcoal,
      3
    );

    drawMiniChibiNpc(
      ctx,
      -62,
      74,
      palette.zoneVoice,
      palette,
      timeSec,
      isNearby,
      "satchel"
    );
  }

  // Painted wooden signboard above roof
  ctx.font = "700 14px Fredoka, Nunito, sans-serif";
  const textWidth = ctx.measureText(station.title).width;
  const signW = Math.max(138, textWidth + 28);
  drawRoundedRect(
    ctx,
    -signW / 2,
    -128,
    signW,
    28,
    9,
    palette.paperCream,
    palette.inkCharcoal,
    3
  );
  ctx.fillStyle = palette.inkCharcoal;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(station.title, 0, -114);

  // Bouncing [E] Keycap Prompt when player is within proximity
  if (isNearby) {
    const bounceY = Math.sin(timeSec * 7) * 5;
    const promptY = -164 + bounceY;

    // Hard offset shadow
    drawRoundedRect(ctx, -64, promptY - 14, 134, 34, 10, palette.inkCharcoal);
    drawRoundedRect(
      ctx,
      -67,
      promptY - 17,
      134,
      34,
      10,
      palette.paperCream,
      palette.inkCharcoal,
      3
    );
    // Keycap [E]
    drawRoundedRect(
      ctx,
      -59,
      promptY - 12,
      24,
      24,
      6,
      matColor,
      palette.inkCharcoal,
      2.5
    );
    ctx.fillStyle = palette.inkCharcoal;
    ctx.font = "700 13px Fredoka, sans-serif";
    ctx.fillText("E", -47, promptY);
    ctx.font = "700 13px Nunito, sans-serif";
    ctx.fillText("Open Zone", 12, promptY);
  }

  ctx.restore();
}

/**
 * Draws the controllable cartoon explorer avatar with squash-and-stretch and warm oval shadow.
 */
export function drawPlayerAvatar(
  ctx: CanvasRenderingContext2D,
  player: PlayerPhysicsState,
  palette: CanvasPalette,
  timeSec: number
) {
  const tx = computeSpriteTransform(player.vx, player.vy, timeSec);

  ctx.save();
  ctx.translate(player.x, player.y);

  drawOvalShadow(ctx, 0, 12, 20, 9, palette.shadowAmbient);

  ctx.translate(0, tx.offsetY);
  ctx.scale(tx.scaleX, tx.scaleY);

  // Animated walking feet
  const leftFootY = 2 + tx.stride * 4;
  const rightFootY = 2 - tx.stride * 4;
  drawRoundedRect(ctx, -11, leftFootY, 9, 9, 3, palette.inkCharcoal);
  drawRoundedRect(ctx, 2, rightFootY, 9, 9, 3, palette.inkCharcoal);

  // Backpack when facing up or side
  if (player.facing !== "down") {
    drawRoundedRect(
      ctx,
      -13,
      -22,
      26,
      18,
      6,
      palette.zonePsychology,
      palette.inkCharcoal,
      2.5
    );
  }

  // Cozy sage tunic / sweater
  drawRoundedRect(
    ctx,
    -15,
    -24,
    30,
    24,
    8,
    palette.zoneSelfcare,
    palette.inkCharcoal,
    3
  );

  // Scarf collar
  drawRoundedRect(
    ctx,
    -12,
    -26,
    24,
    7,
    4,
    palette.zoneVoice,
    palette.inkCharcoal,
    2.5
  );

  // Arms
  drawRoundedRect(
    ctx,
    -21,
    -20 + tx.stride * 2,
    8,
    14,
    4,
    palette.paperCream,
    palette.inkCharcoal,
    2.5
  );
  drawRoundedRect(
    ctx,
    13,
    -20 - tx.stride * 2,
    8,
    14,
    4,
    palette.paperCream,
    palette.inkCharcoal,
    2.5
  );

  // Big expressive head
  drawRoundedRect(
    ctx,
    -17,
    -50,
    34,
    27,
    12,
    palette.paperCream,
    palette.inkCharcoal,
    3
  );

  // Cozy beret / cap
  drawRoundedRect(
    ctx,
    -16,
    -55,
    32,
    11,
    6,
    palette.woodWarm,
    palette.inkCharcoal,
    3
  );

  // Directional eyes
  if (player.facing !== "up") {
    const eyeShiftX =
      player.facing === "left" ? -4 : player.facing === "right" ? 4 : 0;
    ctx.fillStyle = palette.inkCharcoal;
    ctx.beginPath();
    ctx.arc(-6 + eyeShiftX, -35, 2.5, 0, Math.PI * 2);
    ctx.arc(6 + eyeShiftX, -35, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Rosy cheeks
    ctx.fillStyle = palette.zoneVoice;
    ctx.beginPath();
    ctx.arc(-10 + eyeShiftX, -31, 2.5, 0, Math.PI * 2);
    ctx.arc(10 + eyeShiftX, -31, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
