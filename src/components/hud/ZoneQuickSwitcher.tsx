"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Brain,
  Globe,
  HeartPulse,
  Megaphone,
  Sparkles,
} from "lucide-react";
import {
  SANCTUARY_STATIONS,
  useHud,
  type SanctuaryZone,
} from "@/components/hud/HudProvider";
import { clsx } from "clsx";

interface ZoneRouteItem {
  id: SanctuaryZone;
  href: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}

const ZONE_ROUTES: ZoneRouteItem[] = [
  {
    id: "hub",
    href: "/",
    label: "World Hub",
    shortLabel: "Hub",
    icon: Globe,
    activeClass: "bg-paper-aged text-ink-charcoal shadow-cartoon-sm border-[3px] border-ink-charcoal",
  },
  {
    id: "psychology",
    href: "/psychology",
    label: "Psychology",
    shortLabel: "Psych",
    icon: Brain,
    activeClass:
      "bg-zone-psychology text-ink-charcoal shadow-cartoon-sm border-[3px] border-ink-charcoal",
  },
  {
    id: "self-care",
    href: "/self-care",
    label: "Self-Care",
    shortLabel: "Calm",
    icon: HeartPulse,
    activeClass:
      "bg-zone-selfcare text-ink-charcoal shadow-cartoon-sm border-[3px] border-ink-charcoal",
  },
  {
    id: "employee-voice",
    href: "/employee-voice",
    label: "Employee Voice",
    shortLabel: "Voice",
    icon: Megaphone,
    activeClass:
      "bg-zone-voice text-ink-charcoal shadow-cartoon-sm border-[3px] border-ink-charcoal",
  },
];

const ZONE_ACCENT_BADGE: Record<SanctuaryZone, string> = {
  hub: "bg-zone-psychology text-ink-charcoal",
  psychology: "bg-zone-psychology text-ink-charcoal",
  "self-care": "bg-zone-selfcare text-ink-charcoal",
  "employee-voice": "bg-zone-voice text-ink-charcoal",
};

export function ZoneQuickSwitcher() {
  const router = useRouter();
  const {
    activeZone,
    nearbyStationId,
    activeDialogueStationId,
    openStationDialogue,
    closeStationDialogue,
    triggerCameraReset,
    addXp,
  } = useHud();

  const nearbyStation = nearbyStationId
    ? SANCTUARY_STATIONS[nearbyStationId]
    : null;
  const station = activeDialogueStationId
    ? SANCTUARY_STATIONS[activeDialogueStationId]
    : null;

  const [typedText, setTypedText] = useState("");
  const [awardedMap, setAwardedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!station) {
      setTypedText("");
      return;
    }

    const fullText = station.dialogue;
    let index = 0;
    let current = "";
    setTypedText("");

    const intervalRef = setInterval(() => {
      if (index < fullText.length) {
        current += fullText[index];
        setTypedText(current);
        index += 1;
        return;
      }
      clearInterval(intervalRef);
    }, 12);

    return () => {
      clearInterval(intervalRef);
    };
  }, [station]);

  const handleOpenStationZone = useCallback(() => {
    if (!station) return;
    if (!awardedMap[station.id]) {
      addXp(10);
      setAwardedMap((prev) => ({ ...prev, [station.id]: true }));
    }
    closeStationDialogue();
    if (station.id === "exit") {
      triggerCameraReset();
      return;
    }
    router.push(station.href);
  }, [
    station,
    awardedMap,
    addXp,
    closeStationDialogue,
    triggerCameraReset,
    router,
  ]);

  useEffect(() => {
    if (activeZone !== "hub") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      if (event.key.toLowerCase() === "f") {
        if (station) {
          event.preventDefault();
          handleOpenStationZone();
          return;
        }
        if (nearbyStationId) {
          event.preventDefault();
          openStationDialogue(nearbyStationId);
          return;
        }
      }

      if (station && (event.key === "Enter" || event.key === "Escape")) {
        event.preventDefault();
        closeStationDialogue();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeZone,
    station,
    nearbyStationId,
    openStationDialogue,
    closeStationDialogue,
    handleOpenStationZone,
  ]);

  return (
    <nav
      aria-label="Sanctuary Zones"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 p-3 sm:p-4"
    >
      <AnimatePresence>
        {!station && nearbyStation && activeZone === "hub" && (
          <motion.button
            key={nearbyStation.id}
            type="button"
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 360, damping: 22 }}
            onClick={() => openStationDialogue(nearbyStation.id)}
            className="pointer-events-auto cartoon-panel cartoon-btn line-boil flex items-center gap-2.5 rounded-2xl px-4 py-2 text-xs font-bold text-ink-charcoal"
          >
            <kbd className="inline-flex h-6 w-6 items-center justify-center rounded-lg border-2 border-ink-charcoal bg-zone-psychology font-hand text-sm font-bold text-ink-charcoal">
              F
            </kbd>
            <span className="font-hand text-xl leading-none tracking-wide">
              Press [F] to talk to {nearbyStation.npcName} (
              {nearbyStation.npcRole})
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {station && (
        <motion.div
          id="textbox-container"
          role="dialog"
          aria-label={station.title}
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 340, damping: 24 }}
          className="pointer-events-auto w-full max-w-4xl"
        >
          <div
            id="textbox"
            className="cartoon-panel flex flex-col justify-between gap-3 rounded-2xl p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-xl font-bold tracking-wide text-ink-charcoal sm:text-2xl">
                  {station.npcName}
                </span>
                <span className="rounded-lg border-2 border-ink-charcoal bg-paper-aged px-2.5 py-0.5 text-[11px] font-bold text-ink-muted">
                  {station.npcRole} · {station.title}
                </span>
              </div>
              <span
                className={clsx(
                  "line-boil rounded-full border-2 border-ink-charcoal px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider shadow-cartoon-sm",
                  ZONE_ACCENT_BADGE[station.zone]
                )}
              >
                {station.zone === "hub" ? "Reception" : station.zone}
              </span>
            </div>

            <p
              id="dialogue"
              className="font-hand min-h-[3.5rem] select-none text-xl font-bold leading-snug tracking-wide text-ink-charcoal sm:text-2xl"
            >
              {typedText}
              <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-ink-charcoal align-middle" />
            </p>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleOpenStationZone}
                className={clsx(
                  "cartoon-btn inline-flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold",
                  ZONE_ACCENT_BADGE[station.zone]
                )}
              >
                <kbd className="rounded border-2 border-ink-charcoal bg-paper-cream px-1.5 py-0.5 font-hand text-xs font-bold">
                  F
                </kbd>
                {!awardedMap[station.id] && (
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>
                  {station.ctaLabel}
                  {!awardedMap[station.id] ? " (+10 XP)" : ""}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
              </button>

              <button
                id="close"
                type="button"
                onClick={closeStationDialogue}
                className="cartoon-btn font-hand rounded-xl bg-paper-aged px-4 py-1 text-lg font-bold text-ink-charcoal hover:bg-paper-cream"
              >
                [Enter / Esc] Close
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="pointer-events-auto cartoon-panel flex items-center gap-1.5 rounded-2xl p-1.5 sm:gap-2">
        {ZONE_ROUTES.map((item) => {
          const Icon = item.icon;
          const isActive = activeZone === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={clsx(
                "tactile-press flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors sm:px-4",
                isActive
                  ? item.activeClass
                  : "border-[3px] border-transparent text-ink-muted hover:border-ink-charcoal hover:bg-paper-aged hover:text-ink-charcoal"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
