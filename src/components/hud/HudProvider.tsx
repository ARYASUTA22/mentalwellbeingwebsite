"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { sanctuaryAudio } from "@/lib/audio/sanctuaryAudio";

export type SanctuaryZone =
  | "hub"
  | "psychology"
  | "self-care"
  | "employee-voice";

export type StationId =
  | "pc"
  | "cs-degree"
  | "sofa-table"
  | "tv"
  | "bed"
  | "resume"
  | "projects"
  | "library"
  | "exit";

export type NpcAccessory =
  | "glasses"
  | "headphones"
  | "visor"
  | "beanie"
  | "clipboard"
  | "mug";

export interface SanctuaryStation {
  id: StationId;
  title: string;
  npcName: string;
  npcRole: string;
  npcAccessory: NpcAccessory;
  zone: SanctuaryZone;
  href: string;
  ctaLabel: string;
  dialogue: string;
}

export const SANCTUARY_STATIONS: Record<StationId, SanctuaryStation> = {
  pc: {
    id: "pc",
    title: "Encrypted Ombuds Workstation",
    npcName: "Devon Park",
    npcRole: "Anonymous Ombuds Lead",
    npcAccessory: "headphones",
    zone: "employee-voice",
    href: "/employee-voice",
    ctaLabel: "Open Safe Voice Channel",
    dialogue:
      "Hey, I'm Devon at the Ombuds Terminal! Whatever you type here gets scrubbed by Gemini 2.5 Flash—stripping names, handles, and dates—before hitting the public Feedback Wall.",
  },
  "cs-degree": {
    id: "cs-degree",
    title: "Kanban Safety & Culture Wall",
    npcName: "Elena Vance",
    npcRole: "Culture & Safety Lead",
    npcAccessory: "glasses",
    zone: "employee-voice",
    href: "/employee-voice",
    ctaLabel: "Submit Comfort Pulse",
    dialogue:
      "Welcome! I'm Elena, steward of our Kanban Safety Wall. Drop a 1-to-5 Comfort Pulse anytime so leadership sees real workload sustainability and psychological safety trends.",
  },
  "sofa-table": {
    id: "sofa-table",
    title: "Breakroom Lounge & Espresso Table",
    npcName: "Sora Takahashi",
    npcRole: "Wellness Coach",
    npcAccessory: "mug",
    zone: "self-care",
    href: "/self-care",
    ctaLabel: "Check Emotional Pulse",
    dialogue:
      "Grab a coffee and catch your breath—I'm Sora! Tell me how your energy feels right now and I'll calibrate a headless AI grounding step plus your next calming quest.",
  },
  tv: {
    id: "tv",
    title: "0.25Hz Biofeedback Office Kiosk",
    npcName: "Leo Morales",
    npcRole: "Biofeedback Specialist",
    npcAccessory: "visor",
    zone: "self-care",
    href: "/self-care",
    ctaLabel: "Sync Breathing Orb",
    dialogue:
      "I'm Leo, tuning the 0.25Hz Biofeedback Kiosk! Follow the floating sanctuary orb's 4-second inhale and 4-second exhale wave with me to drop acute meeting stress fast.",
  },
  bed: {
    id: "bed",
    title: "Quiet Nap & Recovery Pod",
    npcName: "Clara Chen",
    npcRole: "Recovery Coordinator",
    npcAccessory: "beanie",
    zone: "self-care",
    href: "/self-care",
    ctaLabel: "View Daily Quests",
    dialogue:
      "Shh—welcome to the Quiet Recovery Pod, I'm Clara! Step away from Slack pings here, clear open mental loops, and check off restorative micro-quests for Wellness XP.",
  },
  resume: {
    id: "resume",
    title: "Boundaries Planning Desk",
    npcName: "Nina Patel",
    npcRole: "Workload Strategist",
    npcAccessory: "clipboard",
    zone: "psychology",
    href: "/psychology?article=healthy-digital-boundaries",
    ctaLabel: "Read Boundaries Guide",
    dialogue:
      "Hi! I'm Nina, your Workload Strategist. On my desk is our Sustainable Digital Boundaries playbook—packed with polite trade-off scripts to protect your calendar.",
  },
  projects: {
    id: "projects",
    title: "Dual-Monitor Engineering Pod",
    npcName: "Marcus Sterling",
    npcRole: "Deep Focus Architect",
    npcAccessory: "headphones",
    zone: "psychology",
    href: "/psychology?article=eliminating-attention-residue",
    ctaLabel: "Read Deep Work Protocol",
    dialogue:
      "What's up, I'm Marcus! Every unscheduled ping leaves 20 minutes of cognitive attention residue. Hop into my Deep Work Protocol to reclaim uninterrupted flow blocks.",
  },
  library: {
    id: "library",
    title: "Psychology Archive Bookshelf",
    npcName: "Dr. Maya Lin",
    npcRole: "Workplace Psychologist",
    npcAccessory: "glasses",
    zone: "psychology",
    href: "/psychology",
    ctaLabel: "Browse Psychology Corner",
    dialogue:
      "Hello, I'm Dr. Maya Lin! Browse our research-backed field guides on burnout early-warning signs, ultradian energy pacing, and cognitive stamina anytime.",
  },
  exit: {
    id: "exit",
    title: "West Office Reception Desk",
    npcName: "Samir Roy",
    npcRole: "Office Concierge",
    npcAccessory: "clipboard",
    zone: "hub",
    href: "/",
    ctaLabel: "Recenter Office View",
    dialogue:
      "Welcome to MindSanctuary! Walk through the retreat paths or use the top-right Signpost to jump directly to any station.",
  },
};

export interface ThemeTokens {
  worldVoid: string;
  hudSurface: string;
  hudElevated: string;
  textPrimary: string;
  textSecondary: string;
  accentPsych: string;
  accentSelfcare: string;
  accentVoice: string;
  statusWarning: string;
  statusDanger: string;
  cartoonInk: string;
  roomWood: string;
  roomWoodPlank: string;
  roomWall: string;
  roomWallTrim: string;
  roomRugWest: string;
  roomRugEast: string;
}

const ONBOARDING_STORAGE_KEY = "mindsanctuary_onboarded";
const AUDIO_MUTED_STORAGE_KEY = "mindsanctuary_audio_muted";

interface HudContextValue {
  activeZone: SanctuaryZone;
  xp: number;
  level: number;
  xpProgressPercent: number;
  addXp: (amount: number) => void;
  breathingActive: boolean;
  setBreathingActive: (active: boolean) => void;
  cameraResetNonce: number;
  triggerCameraReset: () => void;
  tokens: ThemeTokens | null;
  nearbyStationId: StationId | null;
  setNearbyStationId: (stationId: StationId | null) => void;
  activeDialogueStationId: StationId | null;
  isInDialogue: boolean;
  openStationDialogue: (stationId: StationId) => void;
  closeStationDialogue: () => void;
  lastInteractedStation: StationId | null;
  isHintModalOpen: boolean;
  setIsHintModalOpen: (open: boolean) => void;
  completeOnboarding: () => void;
  isSignpostOpen: boolean;
  setIsSignpostOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAudioMuted: boolean;
  toggleAudioMute: () => void;
}

const HudContext = createContext<HudContextValue | null>(null);

function resolveZoneFromPath(pathname: string): SanctuaryZone {
  if (pathname.startsWith("/psychology")) return "psychology";
  if (pathname.startsWith("/self-care")) return "self-care";
  if (pathname.startsWith("/employee-voice")) return "employee-voice";
  return "hub";
}

function readCssVariable(styles: CSSStyleDeclaration, name: string): string {
  return styles.getPropertyValue(name).trim();
}

export function HudProvider({
  children,
  initialXp = 170,
}: {
  children: React.ReactNode;
  initialXp?: number;
}) {
  const pathname = usePathname();
  const activeZone = useMemo(() => resolveZoneFromPath(pathname), [pathname]);

  const [xp, setXp] = useState<number>(initialXp);
  const [breathingActive, setBreathingActive] = useState<boolean>(false);
  const [cameraResetNonce, setCameraResetNonce] = useState<number>(0);
  const [tokens, setTokens] = useState<ThemeTokens | null>(null);
  const [nearbyStationId, setNearbyStationId] = useState<StationId | null>(
    null
  );
  const [activeDialogueStationId, setActiveDialogueStationId] =
    useState<StationId | null>(null);
  const [lastInteractedStation, setLastInteractedStation] =
    useState<StationId | null>(null);
  const [isHintModalOpen, setIsHintModalOpen] = useState<boolean>(false);
  const [isSignpostOpen, setIsSignpostOpen] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    setTokens({
      worldVoid: readCssVariable(styles, "--bg-world-void"),
      hudSurface: readCssVariable(styles, "--bg-hud-surface"),
      hudElevated: readCssVariable(styles, "--bg-hud-elevated"),
      textPrimary: readCssVariable(styles, "--text-primary"),
      textSecondary: readCssVariable(styles, "--text-secondary"),
      accentPsych: readCssVariable(styles, "--accent-psych"),
      accentSelfcare: readCssVariable(styles, "--accent-selfcare"),
      accentVoice: readCssVariable(styles, "--accent-voice"),
      statusWarning: readCssVariable(styles, "--status-warning"),
      statusDanger: readCssVariable(styles, "--status-danger"),
      cartoonInk: readCssVariable(styles, "--cartoon-ink"),
      roomWood: readCssVariable(styles, "--room-wood"),
      roomWoodPlank: readCssVariable(styles, "--room-wood-plank"),
      roomWall: readCssVariable(styles, "--room-wall"),
      roomWallTrim: readCssVariable(styles, "--room-wall-trim"),
      roomRugWest: readCssVariable(styles, "--room-rug-west"),
      roomRugEast: readCssVariable(styles, "--room-rug-east"),
    });

    try {
      const onboarded = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!onboarded && !window.location.pathname.startsWith("/admin")) {
        setIsHintModalOpen(true);
      }
      const savedMute = window.localStorage.getItem(AUDIO_MUTED_STORAGE_KEY);
      if (savedMute === "true") {
        setIsAudioMuted(true);
        sanctuaryAudio.setMuted(true);
      }
    } catch {
      // Ignore storage access errors in restricted frames
    }
  }, []);

  useEffect(() => {
    if (activeZone !== "hub") {
      setActiveDialogueStationId(null);
      setNearbyStationId(null);
      setIsSignpostOpen(false);
    }
  }, [activeZone]);

  const addXp = useCallback((amount: number) => {
    setXp((prev) => Math.max(0, prev + amount));
  }, []);

  const triggerCameraReset = useCallback(() => {
    setCameraResetNonce((n) => n + 1);
  }, []);

  const openStationDialogue = useCallback((stationId: StationId) => {
    setActiveDialogueStationId(stationId);
    setLastInteractedStation(stationId);
  }, []);

  const closeStationDialogue = useCallback(() => {
    setActiveDialogueStationId(null);
  }, []);

  const completeOnboarding = useCallback(() => {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors
    }
    sanctuaryAudio.unlockAndStart();
    sanctuaryAudio.playZoneChime();
    setIsHintModalOpen(false);
  }, []);

  const toggleAudioMute = useCallback(() => {
    setIsAudioMuted((prev) => {
      const next = !prev;
      sanctuaryAudio.setMuted(next);
      if (!next) {
        sanctuaryAudio.unlockAndStart();
        sanctuaryAudio.playZoneChime();
      }
      try {
        window.localStorage.setItem(AUDIO_MUTED_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const level = Math.floor(xp / 100) + 1;
  const xpProgressPercent = xp % 100;
  const isInDialogue = activeDialogueStationId !== null;

  const value = useMemo<HudContextValue>(
    () => ({
      activeZone,
      xp,
      level,
      xpProgressPercent,
      addXp,
      breathingActive,
      setBreathingActive,
      cameraResetNonce,
      triggerCameraReset,
      tokens,
      nearbyStationId,
      setNearbyStationId,
      activeDialogueStationId,
      isInDialogue,
      openStationDialogue,
      closeStationDialogue,
      lastInteractedStation,
      isHintModalOpen,
      setIsHintModalOpen,
      completeOnboarding,
      isSignpostOpen,
      setIsSignpostOpen,
      isAudioMuted,
      toggleAudioMute,
    }),
    [
      activeZone,
      xp,
      level,
      xpProgressPercent,
      addXp,
      breathingActive,
      cameraResetNonce,
      triggerCameraReset,
      tokens,
      nearbyStationId,
      activeDialogueStationId,
      isInDialogue,
      openStationDialogue,
      closeStationDialogue,
      lastInteractedStation,
      isHintModalOpen,
      completeOnboarding,
      isSignpostOpen,
      isAudioMuted,
      toggleAudioMute,
    ]
  );

  return <HudContext.Provider value={value}>{children}</HudContext.Provider>;
}

export function useHud(): HudContextValue {
  const ctx = useContext(HudContext);
  if (!ctx) {
    throw new Error("useHud must be used within a HudProvider.");
  }
  return ctx;
}
