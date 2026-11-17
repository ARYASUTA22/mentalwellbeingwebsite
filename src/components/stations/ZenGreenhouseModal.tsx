"use client";

import React, { useState } from "react";
import { HeartPulse, X } from "lucide-react";
import { motion } from "framer-motion";
import {
  BreathingVisualizer,
  type CadenceKey,
} from "@/components/features/self-care/BreathingVisualizer";
import { DailyQuestChecklist } from "@/components/features/self-care/DailyQuestChecklist";
import { EmotionRegulator } from "@/components/features/self-care/EmotionRegulator";
import type { SerializedQuest } from "@/lib/validations/selfcare";

interface ZenGreenhouseModalProps {
  quests: SerializedQuest[];
  onClose: () => void;
}

export function ZenGreenhouseModal({
  quests,
  onClose,
}: ZenGreenhouseModalProps) {
  const [recommendedPattern, setRecommendedPattern] =
    useState<CadenceKey>("CALMING_4_7_8");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Zen Greenhouse Patio — Self-Care Corner"
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-ink-charcoal/45 p-3 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="cartoon-panel flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-ink-charcoal bg-zone-selfcare px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink-charcoal bg-paper-cream">
              <HeartPulse className="h-5 w-5 text-ink-charcoal" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-ink-charcoal">
                Zen Greenhouse Patio · Self-Care Corner
              </h2>
              <p className="text-xs font-bold text-ink-charcoal/80">
                Hosted by Sora Takahashi — 4-7-8 Breathing Lotus, Emotion Wheel
                &amp; Daily Quests
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cartoon-btn inline-flex items-center gap-1.5 rounded-xl bg-paper-cream px-3 py-1.5 text-xs font-bold text-ink-charcoal"
          >
            <X className="h-4 w-4" />
            <span>Close [Esc]</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 overflow-y-auto p-4 sm:p-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <BreathingVisualizer recommendedPattern={recommendedPattern} />
            <EmotionRegulator onRecommendedPattern={setRecommendedPattern} />
          </div>
          <div className="lg:col-span-5">
            <DailyQuestChecklist initialQuests={quests} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
