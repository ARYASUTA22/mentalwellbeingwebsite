export type ZoneId = "psychology" | "self-care" | "employee-voice";

export interface ZoneStation {
  id: ZoneId;
  title: string;
  shortLabel: string;
  npcName: string;
  npcRole: string;
  x: number;
  y: number;
  footY: number;
  width: number;
  height: number;
  visualHeight: number;
  approachX: number;
  approachY: number;
  promptRadius: number;
}

export interface SceneryProp {
  id: string;
  kind: "tree" | "bush" | "lamp";
  x: number;
  y: number;
  footY: number;
  scale: number;
}

export interface PlayerPhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: "down" | "up" | "left" | "right";
  clickTarget: { x: number; y: number } | null;
}

export interface PhysicsInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  locked: boolean;
}

export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 1100;
export const WORLD_PADDING = 75;

// Matches brand_guidelines.md: acceleration 0.6px/frame^2, friction 0.85
export const PLAYER_ACCEL = 0.6;
export const PLAYER_FRICTION = 0.85;
export const PLAYER_RADIUS = 20;

export const ZONE_STATIONS: ZoneStation[] = [
  {
    id: "psychology",
    title: "Cozy Library Nook",
    shortLabel: "Library Nook",
    npcName: "Dr. Maya Lin",
    npcRole: "Workplace Psychologist",
    x: 420,
    y: 355,
    footY: 425,
    width: 220,
    height: 135,
    visualHeight: 165,
    approachX: 420,
    approachY: 475,
    promptRadius: 145,
  },
  {
    id: "self-care",
    title: "Zen Greenhouse Patio",
    shortLabel: "Zen Greenhouse",
    npcName: "Sora Takahashi",
    npcRole: "Wellness Coach",
    x: 1180,
    y: 365,
    footY: 435,
    width: 230,
    height: 135,
    visualHeight: 170,
    approachX: 1180,
    approachY: 485,
    promptRadius: 150,
  },
  {
    id: "employee-voice",
    title: "Treehouse Post Office",
    shortLabel: "Post Office",
    npcName: "Devon Park",
    npcRole: "Anonymous Ombuds",
    x: 800,
    y: 835,
    footY: 905,
    width: 225,
    height: 130,
    visualHeight: 175,
    approachX: 800,
    approachY: 715,
    promptRadius: 145,
  },
];

export const SCENERY_PROPS: SceneryProp[] = [
  { id: "tree-nw", kind: "tree", x: 185, y: 245, footY: 265, scale: 1.05 },
  { id: "tree-ne", kind: "tree", x: 1415, y: 255, footY: 275, scale: 1.1 },
  { id: "tree-sw", kind: "tree", x: 220, y: 860, footY: 880, scale: 1.0 },
  { id: "tree-se", kind: "tree", x: 1390, y: 865, footY: 885, scale: 1.05 },
  { id: "bush-1", kind: "bush", x: 640, y: 275, footY: 290, scale: 0.95 },
  { id: "bush-2", kind: "bush", x: 960, y: 280, footY: 295, scale: 1.0 },
  { id: "bush-3", kind: "bush", x: 540, y: 810, footY: 825, scale: 0.9 },
  { id: "bush-4", kind: "bush", x: 1060, y: 815, footY: 830, scale: 0.95 },
  { id: "lamp-1", kind: "lamp", x: 575, y: 470, footY: 482, scale: 1 },
  { id: "lamp-2", kind: "lamp", x: 1025, y: 470, footY: 482, scale: 1 },
  { id: "lamp-3", kind: "lamp", x: 655, y: 740, footY: 752, scale: 1 },
];

export function createInitialPlayerState(): PlayerPhysicsState {
  return {
    x: 800,
    y: 565,
    vx: 0,
    vy: 0,
    facing: "down",
    clickTarget: null,
  };
}

function overlapsStationAABB(
  px: number,
  py: number,
  radius: number,
  station: ZoneStation
): boolean {
  const halfW = station.width / 2 + radius;
  const halfH = station.height / 2 + radius;
  return (
    Math.abs(px - station.x) < halfW && Math.abs(py - station.y) < halfH
  );
}

export function getStationById(zoneId: ZoneId): ZoneStation {
  return (
    ZONE_STATIONS.find((s) => s.id === zoneId) ?? ZONE_STATIONS[0]
  );
}

/**
 * Hit-tests a world coordinate against each station's visual + footprint bounding box.
 */
export function hitTestStation(
  worldX: number,
  worldY: number
): ZoneStation | null {
  for (const station of ZONE_STATIONS) {
    const left = station.x - station.width / 2 - 18;
    const right = station.x + station.width / 2 + 18;
    const top = station.y - station.visualHeight / 2 - 20;
    const bottom = station.footY + 28;
    if (
      worldX >= left &&
      worldX <= right &&
      worldY >= top &&
      worldY <= bottom
    ) {
      return station;
    }
  }
  return null;
}

/**
 * Steps player acceleration, friction damping (0.85), AABB collision, and proximity detection.
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
  const hitsX = ZONE_STATIONS.some((s) =>
    overlapsStationAABB(nextX, state.y, PLAYER_RADIUS, s)
  );
  if (!hitsX) {
    state.x = nextX;
  } else {
    state.vx = 0;
  }

  const nextY = Math.max(
    WORLD_PADDING,
    Math.min(WORLD_HEIGHT - WORLD_PADDING, state.y + state.vy * dtRatio)
  );
  const hitsY = ZONE_STATIONS.some((s) =>
    overlapsStationAABB(state.x, nextY, PLAYER_RADIUS, s)
  );
  if (!hitsY) {
    state.y = nextY;
  } else {
    state.vy = 0;
  }

  // Proximity detection to each station's front welcome mat
  let closestZone: ZoneId | null = null;
  let closestDist = Infinity;

  for (const station of ZONE_STATIONS) {
    const d = Math.hypot(
      state.x - station.approachX,
      state.y - station.approachY
    );
    const dCenter = Math.hypot(state.x - station.x, state.y - station.y);
    const effectiveDist = Math.min(d, dCenter - 25);
    if (effectiveDist <= station.promptRadius && effectiveDist < closestDist) {
      closestDist = effectiveDist;
      closestZone = station.id;
    }
  }

  return closestZone;
}
