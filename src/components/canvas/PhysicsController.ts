export type ZoneId = "psychology" | "self-care" | "employee-voice";
export type FacingDirection = "down" | "right" | "left" | "up";

export interface ZoneStation {
  id: ZoneId;
  title: string;
  shortLabel: string;
  npcName: string;
  npcRole: string;
  /** NPC placement coordinates on the 2400x1350 map */
  npcX: number;
  npcY: number;
  /** Center X/Y of solid building collider on the 2400x1350 map */
  x: number;
  y: number;
  /** Y-sort baseline for building roof overhang */
  footY: number;
  /** Floating [E] prompt coordinates */
  promptX: number;
  promptY: number;
  /** Solid AABB collision dimensions for the building core */
  width: number;
  height: number;
  /** Walk-up / fast-travel welcome mat coordinates */
  approachX: number;
  approachY: number;
  /** Proximity detection radius around the NPC & station */
  promptRadius: number;
}

export interface ObstacleCollider {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlayerPhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: FacingDirection;
  clickTarget: { x: number; y: number } | null;
}

export interface PhysicsInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  locked: boolean;
}

// Exact dimensions of /assets/map-background.png
export const WORLD_WIDTH = 2400;
export const WORLD_HEIGHT = 1350;
export const WORLD_PADDING = 48;

// Sprite sheet frame dimensions in /assets/characters.png
export const SPRITE_FRAME_W = 74;
export const SPRITE_FRAME_H = 104;

// Physics constants per brand_guidelines.md
export const PLAYER_ACCEL = 0.6;
export const PLAYER_FRICTION = 0.85;
export const PLAYER_RADIUS = 18;
export const NPC_RADIUS = 18;

/**
 * Zones & Cozy NPC placements on the 2400x1350 map:
 * - NPC 1: Near Cozy Library Nook (X: 620, Y: 350)
 * - NPC 2: Next to the Greenhouse Path (X: 1530, Y: 280)
 * - NPC 3: At Post Office (X: 1330, Y: 1040)
 */
export const ZONE_STATIONS: ZoneStation[] = [
  {
    id: "psychology",
    title: "Cozy Library Nook",
    shortLabel: "Library Nook",
    npcName: "Dr. Maya Lin",
    npcRole: "Workplace Psychologist",
    npcX: 620,
    npcY: 350,
    x: 455,
    y: 235,
    footY: 340,
    promptX: 620,
    promptY: 215,
    width: 320,
    height: 150,
    approachX: 665,
    approachY: 425,
    promptRadius: 240,
  },
  {
    id: "self-care",
    title: "Zen Greenhouse Patio",
    shortLabel: "Zen Greenhouse",
    npcName: "Sora Takahashi",
    npcRole: "Wellness Coach",
    npcX: 1530,
    npcY: 280,
    x: 2015,
    y: 335,
    footY: 450,
    promptX: 1530,
    promptY: 145,
    width: 390,
    height: 250,
    approachX: 1530,
    approachY: 365,
    promptRadius: 260,
  },
  {
    id: "employee-voice",
    title: "Treehouse Post Office",
    shortLabel: "Post Office",
    npcName: "Devon Park",
    npcRole: "Anonymous Ombuds",
    npcX: 1330,
    npcY: 1040,
    x: 1560,
    y: 1030,
    footY: 1120,
    promptX: 1330,
    promptY: 905,
    width: 280,
    height: 190,
    approachX: 1265,
    approachY: 1110,
    promptRadius: 250,
  },
];

export const MAP_OBSTACLES: ObstacleCollider[] = [
  { id: "central-fountain", x: 1215, y: 585, width: 165, height: 135 },
  { id: "park-bench", x: 1320, y: 430, width: 140, height: 65 },
];

export function createInitialPlayerState(): PlayerPhysicsState {
  return {
    x: 1035,
    y: 645,
    vx: 0,
    vy: 0,
    facing: "down",
    clickTarget: null,
  };
}

function overlapsBox(
  px: number,
  py: number,
  radius: number,
  cx: number,
  cy: number,
  width: number,
  height: number
): boolean {
  const halfW = width / 2 + radius;
  const halfH = height / 2 + radius;
  return Math.abs(px - cx) < halfW && Math.abs(py - cy) < halfH;
}

function hitsAnyCollider(px: number, py: number, radius: number): boolean {
  for (const station of ZONE_STATIONS) {
    if (
      overlapsBox(
        px,
        py,
        radius,
        station.x,
        station.y,
        station.width,
        station.height
      )
    ) {
      return true;
    }
    // Prevent walking directly through NPC body
    if (Math.hypot(px - station.npcX, py - station.npcY) < radius + NPC_RADIUS) {
      return true;
    }
  }
  for (const obs of MAP_OBSTACLES) {
    if (overlapsBox(px, py, radius, obs.x, obs.y, obs.width, obs.height)) {
      return true;
    }
  }
  return false;
}

export function getStationById(zoneId: ZoneId): ZoneStation {
  return ZONE_STATIONS.find((s) => s.id === zoneId) ?? ZONE_STATIONS[0];
}

/**
 * Hit-tests a world click coordinate against each zone's building or NPC sprite.
 */
export function hitTestStation(
  worldX: number,
  worldY: number
): ZoneStation | null {
  for (const station of ZONE_STATIONS) {
    const nearNpc =
      Math.abs(worldX - station.npcX) <= 55 &&
      worldY >= station.npcY - 105 &&
      worldY <= station.npcY + 25;

    const left = Math.min(station.x - station.width / 2 - 40, station.npcX - 65);
    const right = Math.max(station.x + station.width / 2 + 40, station.npcX + 65);
    const top = Math.min(station.y - station.height / 2 - 60, station.npcY - 110);
    const bottom = Math.max(station.y + station.height / 2 + 60, station.npcY + 35);

    if (
      nearNpc ||
      (worldX >= left && worldX <= right && worldY >= top && worldY <= bottom)
    ) {
      return station;
    }
  }
  return null;
}

/**
 * Computes which direction an NPC should face so they turn toward the player when nearby.
 */
export function computeNpcFacing(
  npcX: number,
  npcY: number,
  playerX: number,
  playerY: number,
  turnRadius = 280
): FacingDirection {
  const dx = playerX - npcX;
  const dy = playerY - npcY;
  const dist = Math.hypot(dx, dy);
  if (dist > turnRadius) {
    return "down";
  }
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }
  return dy > 0 ? "down" : "up";
}

/**
 * Steps player acceleration (0.6), friction damping (0.85), AABB collision, and proximity detection.
 */
export function updatePlayerPhysics(
  state: PlayerPhysicsState,
  input: PhysicsInput,
  dtRatio = 1
): ZoneId | null {
  let ax = 0;
  let ay = 0;

  if (!input.locked) {
    if (input.left) ax -= 1;
    if (input.right) ax += 1;
    if (input.up) ay -= 1;
    if (input.down) ay += 1;

    if (ax !== 0 || ay !== 0) {
      state.clickTarget = null;
      const len = Math.hypot(ax, ay);
      ax /= len;
      ay /= len;
    } else if (state.clickTarget) {
      const dx = state.clickTarget.x - state.x;
      const dy = state.clickTarget.y - state.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 14) {
        ax = dx / dist;
        ay = dy / dist;
      } else {
        state.clickTarget = null;
      }
    }
  } else {
    state.clickTarget = null;
  }

  state.vx += ax * PLAYER_ACCEL * dtRatio;
  state.vy += ay * PLAYER_ACCEL * dtRatio;

  const damping = Math.pow(PLAYER_FRICTION, dtRatio);
  state.vx *= damping;
  state.vy *= damping;

  if (Math.abs(state.vx) < 0.02) state.vx = 0;
  if (Math.abs(state.vy) < 0.02) state.vy = 0;

  if (Math.abs(state.vx) > Math.abs(state.vy) && Math.abs(state.vx) > 0.15) {
    state.facing = state.vx > 0 ? "right" : "left";
  } else if (Math.abs(state.vy) > 0.15) {
    state.facing = state.vy > 0 ? "down" : "up";
  }

  const nextX = Math.max(
    WORLD_PADDING,
    Math.min(WORLD_WIDTH - WORLD_PADDING, state.x + state.vx * dtRatio)
  );
  if (!hitsAnyCollider(nextX, state.y, PLAYER_RADIUS)) {
    state.x = nextX;
  } else {
    state.vx = 0;
  }

  const nextY = Math.max(
    WORLD_PADDING,
    Math.min(WORLD_HEIGHT - WORLD_PADDING, state.y + state.vy * dtRatio)
  );
  if (!hitsAnyCollider(state.x, nextY, PLAYER_RADIUS)) {
    state.y = nextY;
  } else {
    state.vy = 0;
  }

  // Proximity detection to each zone's NPC or welcome mat
  let closestZone: ZoneId | null = null;
  let closestDist = Infinity;

  for (const station of ZONE_STATIONS) {
    const distNpc = Math.hypot(state.x - station.npcX, state.y - station.npcY);
    const distApproach = Math.hypot(
      state.x - station.approachX,
      state.y - station.approachY
    );
    const effectiveDist = Math.min(distNpc, distApproach);

    if (effectiveDist <= station.promptRadius && effectiveDist < closestDist) {
      closestDist = effectiveDist;
      closestZone = station.id;
    }
  }

  return closestZone;
}
