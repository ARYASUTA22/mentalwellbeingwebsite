"use client";

import React, { useEffect, useState, useTransition } from "react";
import { Pause, Play, RotateCcw, Sparkles, Wind } from "lucide-react";
import { logBreathingSessionAction } from "@/actions/selfcare";
import { HudCard } from "@/components/hud/HudCard";
import { useHud } from "@/components/hud/HudProvider";
import { clsx } from "clsx";

export type CadenceKey = "CALMING_4_7_8" | "COHERENT_4_4" | "RESET_2_4";

const CADENCES: Record<
  CadenceKey,
  { label: string; inhaleSec: number; holdSec: number; exhaleSec: number }
> = {
  CALMING_4_7_8: {
    label: "4-7-8 Lotus Breath",
    inhaleSec: 4,
    holdSec: 7,
    exhaleSec: 8,
  },
  COHERENT_4_4: {
    label: "0.25Hz Coherent (4s / 4s)",
    inhaleSec: 4,
    holdSec: 0,
    exhaleSec: 4,
  },
  RESET_2_4: {
    label: "Quick Sigh (2s / 4s)",
    inhaleSec: 2,
    holdSec: 0,
    exhaleSec: 4,
  },
};

const OUTER_PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const INNER_PETAL_ANGLES = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

export function BreathingVisualizer({
  recommendedPattern,
}: {
  recommendedPattern?: CadenceKey;
}) {
  const { breathingActive, setBreathingActive, addXp } = useHud();
  const [cadenceKey, setCadenceKey] = useState<CadenceKey>(
    recommendedPattern ?? "CALMING_4_7_8"
  );
  const [elapsedMs, setElapsedMs] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (recommendedPattern) {
      setCadenceKey(recommendedPattern);
    }
  }, [recommendedPattern]);

  useEffect(() => {
    return () => {
      setBreathingActive(false);
    };
  }, [setBreathingActive]);

  useEffect(() => {
    if (!breathingActive) return;
    let last = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const delta = now - last;
      last = now;
      setElapsedMs((prev) => prev + delta);
    }, 50);
    return () => clearInterval(interval);
  }, [breathingActive]);

  const elapsedSec = Math.floor(elapsedMs / 1000);
  const cadence = CADENCES[cadenceKey];
  const cycleDurationSec =
    cadence.inhaleSec + cadence.holdSec + cadence.exhaleSec;
  const cyclesCompleted = Math.floor(elapsedSec / cycleDurationSec);
  const posInCycleSec = (elapsedMs / 1000) % cycleDurationSec;

  let phaseLabel = "Tap Lotus to Begin";
  let phaseCountdown = cadence.inhaleSec;
  let bloomFactor = 0.35; // 0 = folded, 1 = full bloom

  if (breathingActive || elapsedMs > 0) {
    if (posInCycleSec < cadence.inhaleSec) {
      phaseLabel = "Inhale Slowly (4s)";
      const t = posInCycleSec / cadence.inhaleSec;
      bloomFactor = 0.25 + 0.75 * Math.sin((t * Math.PI) / 2);
      phaseCountdown = Math.ceil(cadence.inhaleSec - posInCycleSec);
    } else if (posInCycleSec < cadence.inhaleSec + cadence.holdSec) {
      phaseLabel = `Hold Full Bloom (${cadence.holdSec}s)`;
      const holdPos = posInCycleSec - cadence.inhaleSec;
      bloomFactor = 1.0 + Math.sin(holdPos * 4) * 0.03;
      phaseCountdown = Math.ceil(cadence.holdSec - holdPos);
    } else {
      const exhalePos =
        posInCycleSec - (cadence.inhaleSec + cadence.holdSec);
      phaseLabel = `Exhale Release (${cadence.exhaleSec}s)`;
      const t = exhalePos / cadence.exhaleSec;
      bloomFactor = 1.0 - 0.75 * Math.sin((t * Math.PI) / 2);
      phaseCountdown = Math.ceil(cadence.exhaleSec - exhalePos);
    }
  }

  const lotusScale = 0.74 + bloomFactor * 0.42;
  const petalSpread = 12 + bloomFactor * 22;

  const handleToggle = () => {
    setFeedback(null);
    setBreathingActive(!breathingActive);
  };

  const handleReset = () => {
    setBreathingActive(false);
    setElapsedMs(0);
    setFeedback(null);
  };

  const handleLogSession = () => {
    const cycles = Math.max(1, cyclesCompleted);
    const duration = Math.max(10, elapsedSec);
    setBreathingActive(false);

    startTransition(async () => {
      const res = await logBreathingSessionAction({
        durationSec: duration,
        cyclesCount: cycles,
      });
      if (res.ok) {
        addXp(res.xpEarned);
        setFeedback(
          `Logged ${cycles} lotus breath cycle(s) (${duration}s). +${res.xpEarned} XP awarded!`
        );
        setElapsedMs(0);
      } else {
        setFeedback(res.error);
      }
    });
  };

  return (
    <HudCard tone="selfcare" elevated className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink-charcoal bg-zone-selfcare">
            <Wind className="h-4 w-4 text-ink-charcoal" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-ink-charcoal">
              4-7-8 Animated Breathing Lotus
            </h2>
            <p className="text-xs font-semibold text-ink-muted">
              Inhale 4s to bloom • Hold 7s to steady • Exhale 8s to release
            </p>
          </div>
        </div>
        <span className="line-boil rounded-full border-2 border-ink-charcoal bg-zone-selfcare px-3 py-0.5 font-hand text-base font-bold text-ink-charcoal">
          {phaseLabel}
        </span>
      </div>

      {/* Cadence Switcher */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CADENCES) as CadenceKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setCadenceKey(key);
              setElapsedMs(0);
            }}
            className={clsx(
              "cartoon-btn rounded-xl px-3 py-1.5 text-xs font-bold",
              cadenceKey === key
                ? "bg-zone-selfcare text-ink-charcoal"
                : "bg-paper-cream text-ink-muted hover:text-ink-charcoal"
            )}
          >
            {CADENCES[key].label}
          </button>
        ))}
      </div>

      {/* Interactive 4-7-8 Animated Lotus SVG */}
      <div className="flex flex-col items-center justify-center rounded-2xl border-[3px] border-ink-charcoal bg-paper-cream p-4 shadow-cartoon-sm">
        <button
          type="button"
          onClick={handleToggle}
          aria-label="Toggle 4-7-8 Lotus Breathing"
          className="group relative flex h-56 w-56 items-center justify-center focus:outline-none"
        >
          <svg
            viewBox="-120 -120 240 240"
            className="h-full w-full overflow-visible"
          >
            {/* Ripple Pond Rings */}
            <circle
              cx="0"
              cy="0"
              r={72 + bloomFactor * 26}
              fill="var(--bg-canvas-meadow)"
              stroke="var(--ink-charcoal)"
              strokeWidth="2.5"
              strokeDasharray="6 6"
            />
            <circle
              cx="0"
              cy="0"
              r={54 + bloomFactor * 18}
              fill="var(--bg-paper-aged)"
              stroke="var(--ink-charcoal)"
              strokeWidth="2"
            />

            <g
              style={{
                transform: `scale(${lotusScale})`,
                transition: "transform 80ms linear",
              }}
            >
              {/* Outer 8 Sage Leaf Petals */}
              {OUTER_PETAL_ANGLES.map((angle) => (
                <g
                  key={`outer-${angle}`}
                  transform={`rotate(${angle}) translate(0, ${-petalSpread})`}
                >
                  <path
                    d="M 0 -46 C 22 -30, 24 6, 0 22 C -24 6, -22 -30, 0 -46 Z"
                    fill="var(--zone-selfcare)"
                    stroke="var(--ink-charcoal)"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                </g>
              ))}

              {/* Inner 8 Warm Mustard Petals */}
              {INNER_PETAL_ANGLES.map((angle) => (
                <g
                  key={`inner-${angle}`}
                  transform={`rotate(${angle}) translate(0, ${-(petalSpread * 0.68)})`}
                >
                  <path
                    d="M 0 -34 C 16 -22, 16 4, 0 16 C -16 4, -16 -22, 0 -34 Z"
                    fill="var(--zone-psychology)"
                    stroke="var(--ink-charcoal)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                </g>
              ))}

              {/* Central Lotus Seed Pod */}
              <circle
                cx="0"
                cy="0"
                r="26"
                fill="var(--bg-paper-cream)"
                stroke="var(--ink-charcoal)"
                strokeWidth="3"
              />
            </g>

            {/* Phase Countdown Inside Lotus Core */}
            <text
              x="0"
              y="2"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--ink-charcoal)"
              className="font-display text-lg font-bold"
            >
              {breathingActive ? `${phaseCountdown}s` : "4-7-8"}
            </text>
          </svg>
        </button>

        <div className="mt-2 grid w-full grid-cols-3 gap-2 border-t-2 border-dashed border-ink-charcoal/25 pt-3 text-center">
          <div>
            <p className="text-[11px] font-bold text-ink-muted">Breath Phase</p>
            <p className="font-display text-xs font-bold text-ink-charcoal sm:text-sm">
              {phaseLabel}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-muted">Lotus Cycles</p>
            <p className="font-hand text-lg font-bold leading-none text-ink-charcoal">
              {cyclesCompleted}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-muted">Duration</p>
            <p className="font-hand text-lg font-bold leading-none text-ink-charcoal">
              {elapsedSec}s
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border-2 border-ink-charcoal bg-zone-selfcare/55 px-3 py-2 font-hand text-base font-bold text-ink-charcoal">
          {feedback}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          className="cartoon-btn inline-flex items-center gap-2 rounded-xl bg-zone-selfcare px-4 py-2 text-xs font-bold text-ink-charcoal"
        >
          {breathingActive ? (
            <>
              <Pause className="h-4 w-4" />
              <span>Pause Lotus</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span>Start 4-7-8 Lotus</span>
            </>
          )}
        </button>

        <button
          type="button"
          disabled={isPending || elapsedSec < 10}
          onClick={handleLogSession}
          className="cartoon-btn inline-flex items-center gap-1.5 rounded-xl bg-zone-psychology px-4 py-2 text-xs font-bold text-ink-charcoal disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5 text-ink-charcoal" />
          <span>{isPending ? "Saving..." : "Log Session (+XP)"}</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="cartoon-btn inline-flex items-center gap-1.5 rounded-xl bg-paper-cream px-3 py-2 text-xs font-bold text-ink-muted hover:text-ink-charcoal"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </HudCard>
  );
}
