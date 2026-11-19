"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MessageCircle,
  RotateCcw,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import type {
  NpcDialogueChoice,
  ZoneStation,
} from "@/components/canvas/PhysicsController";
import type { SubStationCode } from "@/lib/seed";
import { clsx } from "clsx";

interface NpcDialogueModalProps {
  station: ZoneStation;
  onSelectStationCode: (code: SubStationCode) => void;
  onClose: () => void;
}

export function NpcDialogueModal({
  station,
  onSelectStationCode,
  onClose,
}: NpcDialogueModalProps) {
  const [selectedChoice, setSelectedChoice] =
    useState<NpcDialogueChoice | null>(null);

  const toneBg =
    station.id === "psychology"
      ? "bg-zone-psychology"
      : station.id === "self-care"
        ? "bg-zone-selfcare"
        : "bg-zone-voice";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Dialog bersama ${station.npcName}`}
      onClick={onClose}
      className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center bg-ink-charcoal/45 p-3 sm:items-center sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 340, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="cartoon-panel relative w-full max-w-2xl overflow-hidden p-0"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-ink-charcoal bg-wood-warm px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span
              className={clsx(
                "inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink-charcoal shadow-cartoon-sm",
                toneBg
              )}
            >
              <MessageCircle className="h-5 w-5 text-ink-charcoal" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-base font-bold text-ink-charcoal sm:text-lg">
                  {station.npcName}
                </h2>
                <span
                  className={clsx(
                    "rounded-full border-2 border-ink-charcoal px-2.5 py-0.5 font-hand text-xs font-bold text-ink-charcoal",
                    toneBg
                  )}
                >
                  {station.npcRole} · {station.title}
                </span>
              </div>
              <p className="font-hand text-xs font-bold text-ink-charcoal/80">
                Pilih topik percakapan di bawah untuk berdiskusi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog NPC"
            className="cartoon-btn rounded-xl bg-paper-cream p-2 text-ink-charcoal hover:bg-paper-aged"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Main Dialogue Body */}
        <div className="space-y-4 p-5 sm:p-6">
          {/* NPC Speech Bubble */}
          <div className="rounded-2xl border-[3px] border-ink-charcoal bg-paper-aged p-4 shadow-cartoon-sm">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wide text-ink-charcoal">
                <UserCheck className="h-3.5 w-3.5" />
                <span>{station.npcName} berkata:</span>
              </span>
              {selectedChoice && (
                <button
                  type="button"
                  onClick={() => setSelectedChoice(null)}
                  className="inline-flex items-center gap-1 font-hand text-xs font-bold text-ink-charcoal underline hover:opacity-80"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Lihat topik awal</span>
                </button>
              )}
            </div>

            {selectedChoice && (
              <div className="mb-2.5 rounded-xl border-2 border-ink-charcoal bg-paper-cream px-3 py-1.5 text-xs font-bold text-ink-muted">
                Pertanyaanmu: &ldquo;{selectedChoice.label}&rdquo;
              </div>
            )}

            <p className="text-sm font-semibold leading-relaxed text-ink-charcoal">
              &ldquo;
              {selectedChoice ? selectedChoice.reply : station.npcGreeting}
              &rdquo;
            </p>

            {/* Direct CTA button if the selected choice links to a sub-station in this NPC's zone */}
            {selectedChoice?.targetStationCode && (
              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t-2 border-ink-charcoal/15 pt-3">
                <span className="font-hand text-xs font-bold text-ink-muted">
                  Ingin langsung mencoba fasilitas di pos ini?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedChoice.targetStationCode) {
                      onSelectStationCode(selectedChoice.targetStationCode);
                    }
                  }}
                  className={clsx(
                    "cartoon-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 font-display text-xs font-bold text-ink-charcoal",
                    toneBg
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    {selectedChoice.actionLabel ??
                      `Buka Pos ${selectedChoice.targetStationCode}`}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Player Dialogue Options List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-ink-muted">
                Pilihan Respons / Pertanyaanmu:
              </span>
              <span className="font-hand text-xs font-bold text-ink-muted">
                Klik salah satu opsi ({station.npcChoices.length} pilihan)
              </span>
            </div>

            <div className="space-y-2">
              {station.npcChoices.map((choice, idx) => {
                const isActive = selectedChoice?.id === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => setSelectedChoice(choice)}
                    className={clsx(
                      "cartoon-btn flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left text-xs font-bold text-ink-charcoal transition-all sm:text-sm",
                      isActive
                        ? toneBg
                        : "bg-paper-cream hover:bg-paper-aged"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-ink-charcoal bg-paper-aged font-display text-xs font-bold text-ink-charcoal">
                        {idx + 1}
                      </span>
                      <span>{choice.label}</span>
                    </span>

                    {choice.targetStationCode && (
                      <span className="shrink-0 rounded-lg border-2 border-ink-charcoal bg-paper-cream px-2 py-0.5 font-display text-[10px] font-bold text-ink-charcoal">
                        Pos {choice.targetStationCode}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Dismiss Action */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-hand text-xs font-bold text-ink-muted">
              Tekan [ESC] kapan saja untuk kembali berjalan
            </span>
            <button
              type="button"
              onClick={onClose}
              className="cartoon-btn rounded-xl bg-paper-aged px-4 py-2 font-display text-xs font-bold text-ink-charcoal hover:bg-paper-cream"
            >
              Selesai Mengobrol
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
