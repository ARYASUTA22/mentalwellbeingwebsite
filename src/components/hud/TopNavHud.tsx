"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Compass,
  HelpCircle,
  Keyboard,
  MapPin,
  MousePointerClick,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useHud } from "@/components/hud/HudProvider";
import { clsx } from "clsx";

export function TopNavHud() {
  const pathname = usePathname();
  const {
    activeZone,
    level,
    xp,
    isHintModalOpen,
    setIsHintModalOpen,
    completeOnboarding,
    isSignpostOpen,
    setIsSignpostOpen,
    isAudioMuted,
    toggleAudioMute,
  } = useHud();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* Minimal Corner HUD: Top-Left Compact Pill + Top-Right Controls */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 sm:p-4">
        {/* Top-Left Compact Pill: Only MINDSANCTUARY logo/title + small Calm Lv. badge */}
        <div className="pointer-events-auto cartoon-panel inline-flex items-center gap-2.5 rounded-2xl px-3.5 py-2">
          <Link
            href="/"
            className="tactile-press flex items-center gap-2 rounded-xl pr-1"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border-2 border-ink-charcoal bg-zone-psychology">
              <Compass className="h-4 w-4 text-ink-charcoal" />
            </span>
            <span className="font-display text-sm font-bold tracking-wide text-ink-charcoal sm:text-base">
              MINDSANCTUARY
            </span>
          </Link>

          <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink-charcoal bg-zone-selfcare px-2.5 py-0.5 font-hand text-xs font-bold text-ink-charcoal">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>Calm Lv.{level}</span>
            <span className="hidden opacity-80 sm:inline">({xp} XP)</span>
          </span>
        </div>

        {/* Top-Right Controls: Lofi Audio Toggle + ? Hint / Controls + Collapsible Signpost */}
        <div className="pointer-events-auto flex items-center gap-2">
          {activeZone !== "hub" && (
            <Link
              href="/"
              className="cartoon-btn inline-flex items-center gap-1.5 rounded-2xl bg-paper-cream px-3 py-2 text-xs font-bold text-ink-charcoal hover:bg-paper-aged"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Map</span>
            </Link>
          )}

          <button
            type="button"
            onClick={toggleAudioMute}
            aria-label={isAudioMuted ? "Unmute Lofi Audio" : "Mute Lofi Audio"}
            className={clsx(
              "cartoon-btn inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold text-ink-charcoal",
              isAudioMuted
                ? "bg-paper-aged opacity-85"
                : "bg-zone-selfcare hover:bg-zone-psychology"
            )}
          >
            {isAudioMuted ? (
              <VolumeX className="h-4 w-4 text-ink-charcoal" />
            ) : (
              <Volume2 className="h-4 w-4 text-ink-charcoal" />
            )}
            <span className="hidden sm:inline">
              {isAudioMuted ? "Lofi Muted" : "♫ Lofi On"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsHintModalOpen(true)}
            className="cartoon-btn inline-flex items-center gap-1.5 rounded-2xl bg-paper-cream px-3.5 py-2 text-xs font-bold text-ink-charcoal hover:bg-zone-psychology"
          >
            <HelpCircle className="h-4 w-4 text-ink-charcoal" />
            <span>? Hint</span>
          </button>

          {activeZone === "hub" && (
            <button
              type="button"
              onClick={() => setIsSignpostOpen((prev) => !prev)}
              className={clsx(
                "cartoon-btn inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold text-ink-charcoal",
                isSignpostOpen
                  ? "bg-wood-warm"
                  : "bg-paper-cream hover:bg-paper-aged"
              )}
            >
              <MapPin className="h-4 w-4 text-ink-charcoal" />
              <span>Signpost</span>
            </button>
          )}
        </div>
      </header>

      {/* First-Time Welcome Warning & Controls Field Note Modal */}
      <AnimatePresence>
        {isHintModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Welcome & Controls Field Note"
            onClick={completeOnboarding}
            className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-ink-charcoal/50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 330, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="cartoon-panel relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl p-0"
            >
              {/* Wooden Clipboard Top Header Bar */}
              <div className="flex items-center justify-between border-b-[3px] border-ink-charcoal bg-wood-warm px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border-2 border-ink-charcoal bg-paper-cream">
                    <Compass className="h-4 w-4 text-ink-charcoal" />
                  </span>
                  <div>
                    <h2 className="font-display text-base font-bold text-ink-charcoal sm:text-lg">
                      Welcome to MindSanctuary · Catatan Lapangan
                    </h2>
                    <p className="font-hand text-xs font-bold text-ink-charcoal/85">
                      Cozy Workplace Mental Wellbeing &amp; Safe Voice Retreat
                    </p>
                  </div>
                </div>
                <span className="rounded-full border-2 border-ink-charcoal bg-zone-psychology px-2.5 py-0.5 font-hand text-xs font-bold text-ink-charcoal">
                  Field Note #01
                </span>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                {/* Wellbeing & Privacy Disclaimer Box */}
                <div className="space-y-2 rounded-2xl border-[3px] border-ink-charcoal bg-zone-psychology/50 p-4 shadow-cartoon-sm">
                  <div className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-ink-charcoal">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>
                      Peringatan Kesejahteraan &amp; Privasi / Wellbeing &amp;
                      Privacy Notice
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-ink-charcoal">
                    <strong>ID:</strong> MindSanctuary adalah ruang reflektif
                    kesejahteraan mental kerja &amp; regulasi diri mandiri,{" "}
                    <span className="underline decoration-2">
                      bukan pengganti layanan darurat medis atau krisis
                      psikiatris klinis
                    </span>
                    . Seluruh aspirasi pada{" "}
                    <strong>Employee Voice bersifat 100% anonim</strong> (tanpa
                    pelacakan identitas/IP, serta disensor otomatis oleh AI).
                  </p>
                  <p className="text-xs font-semibold leading-relaxed text-ink-muted">
                    <strong>EN:</strong> MindSanctuary is a supportive workplace
                    wellbeing &amp; self-care sanctuary,{" "}
                    <span className="underline decoration-2">
                      not a substitute for clinical emergency or psychiatric
                      crisis care
                    </span>
                    . All <strong>Employee Voice submissions are 100% anonymous</strong>{" "}
                    with zero identity or IP tracking.
                  </p>
                </div>

                {/* Controls Visual Guide */}
                <div className="space-y-2.5 rounded-2xl border-[3px] border-ink-charcoal bg-paper-aged p-4 shadow-cartoon-sm">
                  <h3 className="font-display text-xs font-bold uppercase tracking-wider text-ink-charcoal">
                    Cara Bermain / How to Explore
                  </h3>

                  <div className="space-y-2 text-xs font-semibold text-ink-charcoal">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-ink-charcoal bg-paper-cream">
                        <MousePointerClick className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <span className="font-bold">
                          WASD / Arrow Keys or Click on Ground:
                        </span>{" "}
                        Walk freely along the sanctuary paths with cozy lofi
                        beats &amp; terrain footsteps.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <kbd className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-ink-charcoal bg-zone-psychology font-hand text-xs font-bold">
                        E
                      </kbd>
                      <div>
                        <span className="font-bold">
                          Press [E] or Click Building/Station:
                        </span>{" "}
                        Open the{" "}
                        <span className="underline decoration-zone-psychology decoration-2">
                          Psychology Scrapbook
                        </span>
                        ,{" "}
                        <span className="underline decoration-zone-selfcare decoration-2">
                          Self-Care Greenhouse
                        </span>
                        , or{" "}
                        <span className="underline decoration-zone-voice decoration-2">
                          Anonymous Postbox
                        </span>
                        .
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-ink-charcoal bg-zone-selfcare">
                        <Keyboard className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <span className="font-bold">
                          Signpost &amp; ♫ Lofi Toggle (Top-Right):
                        </span>{" "}
                        Instant fast-travel to any zone or mute/unmute the
                        ambient lofi soundscape anytime.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="inline-flex items-center gap-1.5 font-hand text-sm font-bold text-ink-muted">
                    <ShieldCheck className="h-4 w-4 text-ink-charcoal" />
                    Zero-Trace Privacy Protected
                  </span>

                  <button
                    type="button"
                    onClick={completeOnboarding}
                    className="cartoon-btn rounded-2xl bg-zone-selfcare px-5 py-2.5 font-display text-xs font-bold text-ink-charcoal sm:text-sm"
                  >
                    Mulai Jelajahi / Enter Sanctuary →
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
