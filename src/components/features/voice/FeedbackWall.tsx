"use client";

import React, { useEffect, useState, useTransition } from "react";
import { ArrowBigUp, MessageSquareQuote, ShieldCheck } from "lucide-react";
import { upvoteVoiceSubmissionAction } from "@/actions/voice";
import { HudCard } from "@/components/hud/HudCard";
import type { SerializedVoiceSubmission } from "@/lib/validations/voice";
import { clsx } from "clsx";

type WallFilter = "ALL" | "FEEDBACK" | "COMPLAINT";

export function FeedbackWall({
  initialSubmissions,
}: {
  initialSubmissions: SerializedVoiceSubmission[];
}) {
  const [submissions, setSubmissions] =
    useState<SerializedVoiceSubmission[]>(initialSubmissions);
  const [filter, setFilter] = useState<WallFilter>("ALL");
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);

  const visibleSubmissions = submissions.filter(
    (s) => filter === "ALL" || s.submissionType === filter
  );

  const handleUpvote = (submissionId: string) => {
    if (votedIds[submissionId]) return;

    setVotedIds((prev) => ({ ...prev, [submissionId]: true }));
    setSubmissions((prev) =>
      prev.map((item) =>
        item.id === submissionId
          ? { ...item, upvotes: item.upvotes + 1 }
          : item
      )
    );

    startTransition(async () => {
      await upvoteVoiceSubmissionAction({ submissionId });
    });
  };

  return (
    <HudCard tone="voice" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink-charcoal bg-zone-voice">
            <MessageSquareQuote className="h-4 w-4 text-ink-charcoal" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-ink-charcoal">
              Sanctuary Voice Wall
            </h2>
            <p className="text-xs font-semibold text-ink-muted">
              Verified PII-free workplace signals ranked by peer resonance
            </p>
          </div>
        </div>

        <div className="flex gap-1.5">
          {(["ALL", "FEEDBACK", "COMPLAINT"] as WallFilter[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={clsx(
                "cartoon-btn rounded-lg px-2.5 py-1 text-[11px] font-bold",
                filter === tab
                  ? "bg-zone-voice text-ink-charcoal"
                  : "bg-paper-aged text-ink-muted hover:text-ink-charcoal"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {visibleSubmissions.map((item) => {
          const isHigh = item.urgency === "HIGH";
          const isMedium = item.urgency === "MEDIUM";

          return (
            <div
              key={item.id}
              className="rounded-xl border-[3px] border-ink-charcoal bg-paper-aged p-4 shadow-cartoon-sm"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border-2 border-ink-charcoal bg-zone-voice px-2 py-0.5 font-hand text-xs font-bold text-ink-charcoal">
                    {item.submissionType}
                  </span>
                  <span className="text-xs font-bold text-ink-muted">
                    {item.category}
                  </span>
                </div>

                <span
                  className={clsx(
                    "rounded-full border-2 border-ink-charcoal px-2.5 py-0.5 font-hand text-xs font-bold text-ink-charcoal",
                    isHigh
                      ? "bg-zone-voice"
                      : isMedium
                        ? "bg-zone-psychology"
                        : "bg-zone-selfcare"
                  )}
                >
                  {item.urgency} PRIORITY
                </span>
              </div>

              <p className="text-xs font-semibold leading-relaxed text-ink-charcoal">
                {item.scrubbedContent}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t-2 border-ink-charcoal/20 pt-2.5 text-[11px]">
                <span className="inline-flex items-center gap-1 font-bold text-ink-muted">
                  <ShieldCheck className="h-3.5 w-3.5 text-ink-charcoal" />
                  Status: {item.status}
                </span>

                <button
                  type="button"
                  disabled={isPending || Boolean(votedIds[item.id])}
                  onClick={() => handleUpvote(item.id)}
                  className={clsx(
                    "cartoon-btn inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-hand text-xs font-bold",
                    votedIds[item.id]
                      ? "bg-zone-voice text-ink-charcoal"
                      : "bg-paper-cream text-ink-charcoal"
                  )}
                >
                  <ArrowBigUp className="h-3.5 w-3.5" />
                  <span>Echo ({item.upvotes})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </HudCard>
  );
}
