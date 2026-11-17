"use client";

import React from "react";
import Link from "next/link";
import {
  Compass,
  MousePointerClick,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useHud, type SanctuaryZone } from "@/components/hud/HudProvider";
import { clsx } from "clsx";

const ZONE_META: Record<
  SanctuaryZone,
  { label: string; badgeClass: string }
> = {
  hub: {
    label: "Sanctuary Hub · Cozy Office",
    badgeClass: "bg-paper-aged text-ink-charcoal",
  },
  psychology: {
    label: "Zone 1 · Psychology Corner",
    badgeClass: "bg-zone-psychology text-ink-charcoal",
  },
  "self-care": {
    label: "Zone 2 · Self-Care Corner",
    badgeClass: "bg-zone-selfcare text-ink-charcoal",
  },
  "employee-voice": {
    label: "Zone 3 · Employee Voice",
    badgeClass: "bg-zone-voice text-ink-charcoal",
  },
};

export function TopNavHud() {
  const { activeZone, level, xp, xpProgressPercent, triggerCameraReset } =
    useHud();
  const meta = ZONE_META[activeZone];

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex flex-col items-center gap-2 p-3 sm:p-4">
      <div className="pointer-events-auto cartoon-panel flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="tactile-press flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-paper-aged"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border-2 border-ink-charcoal bg-zone-psychology">
              <Compass className="h-4 w-4 text-ink-charcoal" />
            </span>
            <span className="font-display text-sm font-bold tracking-wide text-ink-charcoal sm:text-base">
              MINDSANCTUARY
            </span>
          </Link>

          <span
            className={clsx(
              "line-boil hidden rounded-full border-[3px] border-ink-charcoal px-3 py-0.5 text-xs font-bold shadow-cartoon-sm sm:inline-flex",
              meta.badgeClass
            )}
          >
            {meta.label}
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 rounded-xl border-[3px] border-ink-charcoal bg-paper-aged px-3 py-1.5 shadow-cartoon-sm">
            <Sparkles className="h-3.5 w-3.5 text-ink-charcoal" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-[11px] font-bold leading-none text-ink-charcoal">
                <span>Calm Lv.{level}</span>
                <span className="font-hand text-sm text-ink-muted">{xp} XP</span>
              </div>
              <div className="mt-1 h-2 w-24 overflow-hidden rounded-full border-2 border-ink-charcoal bg-paper-cream">
                <div
                  className="h-full rounded-full bg-zone-selfcare transition-all duration-500"
                  style={{ width: `${xpProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={triggerCameraReset}
            title="Recenter Camera"
            className="cartoon-btn flex items-center gap-1.5 rounded-xl bg-paper-cream px-3 py-1.5 text-xs font-bold text-ink-charcoal hover:bg-paper-aged"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Recenter</span>
          </button>

          <Link
            href="/employee-voice"
            className="cartoon-btn hidden items-center gap-1.5 rounded-xl bg-zone-voice px-3 py-1.5 text-xs font-bold text-ink-charcoal sm:inline-flex"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Safe Voice</span>
          </Link>
        </div>
      </div>

      {activeZone === "hub" && (
        <div className="flex w-full max-w-6xl justify-start">
          <div className="cartoon-panel line-boil inline-flex flex-wrap items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-ink-charcoal">
            <MousePointerClick className="h-3.5 w-3.5 text-ink-charcoal" />
            <span className="font-hand text-base leading-none tracking-wide">
              Walk: WASD / Arrows or Click Meadow • Press
            </span>
            <kbd className="rounded-md border-2 border-ink-charcoal bg-zone-psychology px-1.5 py-0.5 font-hand text-xs font-bold text-ink-charcoal">
              E
            </kbd>
            <span className="font-hand text-base leading-none tracking-wide">
              near any zone or click a station
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
