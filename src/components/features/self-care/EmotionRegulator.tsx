"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, BrainCircuit, Sparkles } from "lucide-react";
import { submitEmotionCheckinAction } from "@/actions/selfcare";
import { HudCard } from "@/components/hud/HudCard";
import { useHud } from "@/components/hud/HudProvider";
import {
  MOOD_OPTIONS,
  type AIWellnessRecommendation,
} from "@/lib/validations/selfcare";
import { clsx } from "clsx";

type MoodOption = (typeof MOOD_OPTIONS)[number];

const WHEEL_SEGMENTS: Array<{
  mood: MoodOption;
  fill: string;
  startAngle: number;
  endAngle: number;
  midAngle: number;
}> = MOOD_OPTIONS.map((mood, idx) => {
  const step = 360 / MOOD_OPTIONS.length;
  const startAngle = idx * step - 90;
  const endAngle = (idx + 1) * step - 90;
  const midAngle = startAngle + step / 2;
  const fills = [
    "var(--zone-voice)",
    "var(--zone-psychology)",
    "var(--bg-paper-aged)",
    "var(--zone-psychology)",
    "var(--zone-selfcare)",
    "var(--zone-selfcare)",
  ];
  return {
    mood,
    fill: fills[idx % fills.length],
    startAngle,
    endAngle,
    midAngle,
  };
});

function polarToCartesian(radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Number((radius * Math.cos(rad)).toFixed(2)),
    y: Number((radius * Math.sin(rad)).toFixed(2)),
  };
}

function buildWedgePath(
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number
) {
  const p1 = polarToCartesian(outerR, startDeg);
  const p2 = polarToCartesian(outerR, endDeg);
  const p3 = polarToCartesian(innerR, endDeg);
  const p4 = polarToCartesian(innerR, startDeg);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 0 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 0 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

export function EmotionRegulator({
  onRecommendedPattern,
}: {
  onRecommendedPattern?: (
    pattern: AIWellnessRecommendation["breathingPattern"]
  ) => void;
}) {
  const { addXp } = useHud();
  const [moodLabel, setMoodLabel] = useState<MoodOption>("Scattered");
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [contextNote, setContextNote] = useState<string>("");
  const [recommendation, setRecommendation] =
    useState<AIWellnessRecommendation | null>(null);
  const [streamedTip, setStreamedTip] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await submitEmotionCheckinAction({
        moodLabel,
        stressLevel,
        contextNote: contextNote.trim() || undefined,
      });

      if (res.ok) {
        setRecommendation(res.recommendation);
        onRecommendedPattern?.(res.recommendation.breathingPattern);
        addXp(res.xpEarned);
      } else {
        setErrorMsg(res.error);
      }
    });
  };

  const handleStreamMicroTip = async () => {
    setIsStreaming(true);
    setStreamedTip("");
    try {
      const response = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "stream-tip",
          moodLabel,
          stressLevel,
        }),
      });

      if (!response.ok || !response.body) {
        setStreamedTip(
          "Take three slow nasal breaths and soften your visual gaze toward the horizon for 20 seconds."
        );
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setStreamedTip((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch {
      setStreamedTip(
        "Unclench your jaw, drop your shoulders away from your ears, and focus on one micro-step."
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <HudCard tone="selfcare" className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink-charcoal bg-zone-selfcare">
            <Activity className="h-4 w-4 text-ink-charcoal" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-ink-charcoal">
              Greenhouse Emotion Wheel
            </h2>
            <p className="text-xs font-semibold text-ink-muted">
              Spin or tap a petal on the emotion wheel for a tailored reset
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-4">
        {/* Interactive Radial Cartoon Emotion Wheel */}
        <div className="flex flex-col items-center gap-3 rounded-2xl border-[3px] border-ink-charcoal bg-paper-cream p-4 shadow-cartoon-sm sm:flex-row sm:justify-around">
          <svg
            viewBox="-130 -130 260 260"
            className="h-52 w-52 shrink-0 select-none overflow-visible"
            aria-label="Interactive Cartoon Emotion Wheel"
          >
            {WHEEL_SEGMENTS.map((seg) => {
              const isSelected = moodLabel === seg.mood;
              const labelPos = polarToCartesian(76, seg.midAngle);
              return (
                <g
                  key={seg.mood}
                  onClick={() => setMoodLabel(seg.mood)}
                  className="cursor-pointer transition-transform"
                  style={{
                    transform: isSelected ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  <path
                    d={buildWedgePath(36, 112, seg.startAngle, seg.endAngle)}
                    fill={seg.fill}
                    stroke="var(--ink-charcoal)"
                    strokeWidth={isSelected ? "4" : "2.5"}
                    strokeLinejoin="round"
                  />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--ink-charcoal)"
                    className="font-hand text-[12px] font-bold"
                  >
                    {seg.mood}
                  </text>
                </g>
              );
            })}

            {/* Central Cartoon Expression Hub */}
            <circle
              cx="0"
              cy="0"
              r="34"
              fill="var(--bg-paper-cream)"
              stroke="var(--ink-charcoal)"
              strokeWidth="3.5"
            />
            <circle cx="-10" cy="-6" r="3" fill="var(--ink-charcoal)" />
            <circle cx="10" cy="-6" r="3" fill="var(--ink-charcoal)" />
            {moodLabel === "Steady" || moodLabel === "Energized" ? (
              <path
                d="M -11 7 Q 0 18 11 7"
                fill="none"
                stroke="var(--ink-charcoal)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ) : moodLabel === "Overwhelmed" || moodLabel === "Anxious" ? (
              <path
                d="M -11 13 Q 0 3 11 13"
                fill="none"
                stroke="var(--ink-charcoal)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ) : (
              <line
                x1="-10"
                y1="9"
                x2="10"
                y2="9"
                stroke="var(--ink-charcoal)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
          </svg>

          <div className="flex flex-col gap-2 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Selected Wheel State
            </span>
            <span className="inline-block rounded-xl border-2 border-ink-charcoal bg-zone-selfcare px-3 py-1 font-display text-base font-bold text-ink-charcoal shadow-cartoon-sm">
              {moodLabel}
            </span>
            <div className="flex flex-wrap justify-center gap-1.5 pt-1 sm:justify-start">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setMoodLabel(mood)}
                  className={clsx(
                    "rounded-lg border-2 border-ink-charcoal px-2 py-0.5 font-hand text-xs font-bold",
                    moodLabel === mood
                      ? "bg-zone-psychology text-ink-charcoal"
                      : "bg-paper-aged text-ink-muted hover:text-ink-charcoal"
                  )}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <label
              htmlFor="stress-slider"
              className="font-bold text-ink-muted"
            >
              Cognitive Load / Stress Intensity
            </label>
            <span
              className={clsx(
                "rounded-md border-2 border-ink-charcoal px-2 py-0.5 font-hand text-sm font-bold text-ink-charcoal",
                stressLevel >= 8
                  ? "bg-zone-voice"
                  : stressLevel >= 5
                    ? "bg-zone-psychology"
                    : "bg-zone-selfcare"
              )}
            >
              {stressLevel} / 10
            </span>
          </div>
          <input
            id="stress-slider"
            type="range"
            min={1}
            max={10}
            value={stressLevel}
            onChange={(e) => setStressLevel(Number(e.target.value))}
            className="w-full accent-ink-charcoal"
          />
        </div>

        <div>
          <label
            htmlFor="context-note"
            className="mb-1.5 block text-xs font-bold text-ink-muted"
          >
            Optional Context (e.g., back-to-back sprint reviews)
          </label>
          <input
            id="context-note"
            type="text"
            maxLength={400}
            value={contextNote}
            onChange={(e) => setContextNote(e.target.value)}
            placeholder="Brief trigger context..."
            className="w-full rounded-xl border-[3px] border-ink-charcoal bg-paper-aged px-3 py-2 text-xs font-semibold text-ink-charcoal placeholder:text-ink-muted focus:bg-paper-cream focus:outline-none"
          />
        </div>

        {errorMsg && (
          <p className="rounded-lg border-2 border-ink-charcoal bg-zone-voice/40 px-3 py-1.5 text-xs font-bold text-ink-charcoal">
            {errorMsg}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="cartoon-btn inline-flex items-center gap-2 rounded-xl bg-zone-selfcare px-4 py-2 text-xs font-bold text-ink-charcoal disabled:opacity-50"
          >
            <BrainCircuit className="h-4 w-4" />
            <span>
              {isPending
                ? "Calibrating..."
                : "Get Tailored Reset Plan (+25 XP)"}
            </span>
          </button>

          <button
            type="button"
            disabled={isStreaming}
            onClick={handleStreamMicroTip}
            className="cartoon-btn inline-flex items-center gap-1.5 rounded-xl bg-zone-psychology px-3.5 py-2 text-xs font-bold text-ink-charcoal disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-ink-charcoal" />
            <span>{isStreaming ? "Streaming..." : "Quick Grounding Tip"}</span>
          </button>
        </div>
      </form>

      {streamedTip && (
        <div className="rounded-xl border-[3px] border-ink-charcoal bg-zone-psychology/40 p-3 text-xs font-semibold leading-relaxed text-ink-charcoal shadow-cartoon-sm">
          {streamedTip}
        </div>
      )}

      {recommendation && (
        <div className="space-y-3 rounded-2xl border-[3px] border-ink-charcoal bg-paper-aged p-4 shadow-cartoon-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-lg border-2 border-ink-charcoal bg-zone-selfcare px-2.5 py-0.5 text-xs font-bold text-ink-charcoal">
              Recommended Cadence: {recommendation.cadenceLabel}
            </span>
          </div>
          <p className="text-xs font-semibold leading-relaxed text-ink-charcoal">
            {recommendation.groundingAction}
          </p>
          <p className="text-[11px] font-semibold text-ink-muted">
            {recommendation.rationale}
          </p>

          {recommendation.recommendedSlugs.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {recommendation.recommendedSlugs.map((slug) => (
                <Link
                  key={slug}
                  href={`/psychology?article=${slug}`}
                  className="cartoon-btn inline-flex items-center gap-1 rounded-lg bg-zone-psychology px-2.5 py-1 text-[11px] font-bold text-ink-charcoal"
                >
                  <span>Read: {slug}</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </HudCard>
  );
}
