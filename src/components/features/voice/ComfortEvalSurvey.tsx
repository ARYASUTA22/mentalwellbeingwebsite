"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Gauge } from "lucide-react";
import { submitComfortEvalAction } from "@/actions/voice";
import { HudCard } from "@/components/hud/HudCard";
import { useHud } from "@/components/hud/HudProvider";
import { clsx } from "clsx";

interface MetricField {
  key:
    | "psychologicalSafety"
    | "workloadBalance"
    | "leadershipTrust"
    | "environmentCalm";
  label: string;
}

const METRIC_FIELDS: MetricField[] = [
  { key: "psychologicalSafety", label: "Psychological Safety" },
  { key: "workloadBalance", label: "Workload Sustainability" },
  { key: "leadershipTrust", label: "Leadership Transparency" },
  { key: "environmentCalm", label: "Workspace Calm & Focus" },
];

const FACE_LABELS: Record<number, string> = {
  1: "Strained",
  2: "Uneasy",
  3: "Okay",
  4: "Good",
  5: "Thriving",
};

function CartoonExpressionFace({
  rating,
  selected,
}: {
  rating: number;
  selected: boolean;
}) {
  const fill = selected
    ? rating >= 4
      ? "var(--zone-selfcare)"
      : rating === 3
        ? "var(--zone-psychology)"
        : "var(--zone-voice)"
    : "var(--bg-paper-cream)";

  return (
    <svg
      viewBox="0 0 40 40"
      className="h-7 w-7 overflow-visible"
      aria-hidden="true"
    >
      <circle
        cx="20"
        cy="20"
        r="16"
        fill={fill}
        stroke="var(--ink-charcoal)"
        strokeWidth="3"
      />
      {/* Eyes */}
      {rating === 5 ? (
        <>
          <path
            d="M 11 16 Q 14 12 17 16"
            fill="none"
            stroke="var(--ink-charcoal)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M 23 16 Q 26 12 29 16"
            fill="none"
            stroke="var(--ink-charcoal)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="14" cy="16" r="2.3" fill="var(--ink-charcoal)" />
          <circle cx="26" cy="16" r="2.3" fill="var(--ink-charcoal)" />
        </>
      )}

      {/* Brows for 1 & 2 */}
      {rating === 1 && (
        <>
          <line
            x1="10"
            y1="11"
            x2="16"
            y2="13"
            stroke="var(--ink-charcoal)"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <line
            x1="30"
            y1="11"
            x2="24"
            y2="13"
            stroke="var(--ink-charcoal)"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </>
      )}

      {/* Mouth per 1..5 */}
      {rating === 1 && (
        <path
          d="M 12 28 Q 20 20 28 28"
          fill="none"
          stroke="var(--ink-charcoal)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      )}
      {rating === 2 && (
        <path
          d="M 13 27 Q 20 23 27 27"
          fill="none"
          stroke="var(--ink-charcoal)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      )}
      {rating === 3 && (
        <line
          x1="13"
          y1="26"
          x2="27"
          y2="26"
          stroke="var(--ink-charcoal)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      )}
      {rating === 4 && (
        <path
          d="M 13 24 Q 20 30 27 24"
          fill="none"
          stroke="var(--ink-charcoal)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      )}
      {rating === 5 && (
        <path
          d="M 12 23 Q 20 33 28 23 Z"
          fill="var(--bg-paper-cream)"
          stroke="var(--ink-charcoal)"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function ComfortEvalSurvey({
  averageComfortIndex,
  evaluationCount,
}: {
  averageComfortIndex: number;
  evaluationCount: number;
}) {
  const router = useRouter();
  const { addXp } = useHud();
  const [scores, setScores] = useState({
    psychologicalSafety: 4,
    workloadBalance: 3,
    leadershipTrust: 4,
    environmentCalm: 4,
  });
  const [optionalNote, setOptionalNote] = useState("");
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const liveIndex = (
    (scores.psychologicalSafety +
      scores.workloadBalance +
      scores.leadershipTrust +
      scores.environmentCalm) /
    4
  ).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedMsg(null);

    startTransition(async () => {
      const res = await submitComfortEvalAction({
        ...scores,
        optionalNote: optionalNote.trim() || undefined,
      });

      if (res.ok) {
        addXp(35);
        setOptionalNote("");
        setSubmittedMsg(
          `Pulse recorded (Index ${res.evaluation.overallIndex}/5.0). +35 Wellness XP earned!`
        );
        router.refresh();
      } else {
        setSubmittedMsg(res.error);
      }
    });
  };

  return (
    <HudCard tone="voice" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink-charcoal bg-zone-voice">
            <Gauge className="h-4 w-4 text-ink-charcoal" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-ink-charcoal">
              Workplace Comfort Pulse
            </h2>
            <p className="text-xs font-semibold text-ink-muted">
              Org index: {averageComfortIndex} / 5.0 ({evaluationCount} recent
              pulses)
            </p>
          </div>
        </div>

        <span
          className={clsx(
            "rounded-full border-2 border-ink-charcoal px-3 py-0.5 font-hand text-sm font-bold text-ink-charcoal",
            Number(liveIndex) >= 3.5 ? "bg-zone-selfcare" : "bg-zone-psychology"
          )}
        >
          Your Score: {liveIndex}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {METRIC_FIELDS.map((field) => (
            <div
              key={field.key}
              className="rounded-xl border-[3px] border-ink-charcoal bg-paper-aged p-3 shadow-cartoon-sm"
            >
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-bold text-ink-charcoal">
                  {field.label}
                </span>
                <span className="font-hand text-sm font-bold text-ink-muted">
                  {FACE_LABELS[scores[field.key]]} ({scores[field.key]}/5)
                </span>
              </div>

              {/* 5 Cartoon Expression Faces */}
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((rating) => {
                  const isSelected = scores[field.key] === rating;
                  return (
                    <button
                      key={rating}
                      type="button"
                      title={`${rating} — ${FACE_LABELS[rating]}`}
                      aria-label={`${field.label}: ${rating} (${FACE_LABELS[rating]})`}
                      onClick={() =>
                        setScores((prev) => ({ ...prev, [field.key]: rating }))
                      }
                      className={clsx(
                        "tactile-press flex flex-1 flex-col items-center justify-center rounded-xl border-2 p-1 transition-transform",
                        isSelected
                          ? "-translate-y-0.5 border-ink-charcoal bg-paper-cream shadow-cartoon-sm"
                          : "border-transparent opacity-75 hover:opacity-100"
                      )}
                    >
                      <CartoonExpressionFace
                        rating={rating}
                        selected={isSelected}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div>
          <label
            htmlFor="comfort-note"
            className="mb-1.5 block text-xs font-bold text-ink-muted"
          >
            Optional Environmental Observation
          </label>
          <input
            id="comfort-note"
            type="text"
            maxLength={600}
            value={optionalNote}
            onChange={(e) => setOptionalNote(e.target.value)}
            placeholder="One thing that would improve weekly comfort..."
            className="w-full rounded-xl border-[3px] border-ink-charcoal bg-paper-aged px-3 py-2 text-xs font-semibold text-ink-charcoal placeholder:text-ink-muted focus:bg-paper-cream focus:outline-none"
          />
        </div>

        {submittedMsg && (
          <div className="flex items-center gap-2 rounded-xl border-2 border-ink-charcoal bg-zone-selfcare/55 px-3 py-2 text-xs font-bold text-ink-charcoal">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{submittedMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="cartoon-btn inline-flex items-center gap-2 rounded-xl bg-zone-voice px-4 py-2 text-xs font-bold text-ink-charcoal disabled:opacity-50"
        >
          {isPending ? "Recording Pulse..." : "Submit Comfort Pulse (+35 XP)"}
        </button>
      </form>
    </HudCard>
  );
}
