"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { EyeOff, Send, ShieldAlert, Sparkles, Stamp } from "lucide-react";
import { submitVoiceAction } from "@/actions/voice";
import { useHud } from "@/components/hud/HudProvider";
import {
  URGENCY_LEVELS,
  VOICE_CATEGORIES,
  VOICE_SUBMISSION_TYPES,
  type ScrubVoiceResult,
  type SerializedVoiceSubmission,
} from "@/lib/validations/voice";
import { clsx } from "clsx";

export function AnonComplaintForm({
  onSubmissionCreated,
}: {
  onSubmissionCreated?: (submission: SerializedVoiceSubmission) => void;
} = {}) {
  const router = useRouter();
  const { addXp } = useHud();
  const [submissionType, setSubmissionType] =
    useState<(typeof VOICE_SUBMISSION_TYPES)[number]>("COMPLAINT");
  const [category, setCategory] =
    useState<(typeof VOICE_CATEGORIES)[number]>("Workload & Burnout");
  const [urgency, setUrgency] =
    useState<(typeof URGENCY_LEVELS)[number]>("MEDIUM");
  const [rawContent, setRawContent] = useState("");
  const [preview, setPreview] = useState<ScrubVoiceResult | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [planeFlying, setPlaneFlying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePreviewScrub = async () => {
    if (rawContent.trim().length < 12) {
      setStatusMessage({
        type: "error",
        text: "Write at least 12 characters on the postcard before previewing PII redaction.",
      });
      return;
    }

    setIsScrubbing(true);
    setStatusMessage(null);
    try {
      const response = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "scrub-pii",
          rawText: rawContent,
        }),
      });
      if (!response.ok) {
        throw new Error("Preview unavailable.");
      }
      const data = (await response.json()) as ScrubVoiceResult;
      setPreview(data);
    } catch {
      setStatusMessage({
        type: "error",
        text: "Could not generate redaction preview right now.",
      });
    } finally {
      setIsScrubbing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    startTransition(async () => {
      const res = await submitVoiceAction({
        submissionType,
        category,
        rawContent,
        urgency,
      });

      if (res.ok) {
        onSubmissionCreated?.(res.submission);
        setRawContent("");
        setPreview(null);
        addXp(30);
        setPlaneFlying(true);
        setTimeout(() => setPlaneFlying(false), 2200);
        setStatusMessage({
          type: "success",
          text: "Postcard folded into a paper plane & dispatched! PII scrubbed (+30 XP).",
        });
        router.refresh();
      } else {
        setStatusMessage({ type: "error", text: res.error });
      }
    });
  };

  return (
    <div className="cartoon-panel relative overflow-hidden rounded-2xl p-0">
      {/* Vintage Airmail Diagonal Striped Top Trim */}
      <div
        aria-hidden="true"
        className="h-3.5 w-full border-b-[3px] border-ink-charcoal"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, var(--zone-voice) 0 14px, var(--bg-paper-cream) 14px 26px, var(--zone-psychology) 26px 40px, var(--bg-paper-cream) 40px 52px)",
        }}
      />

      {/* Paper-Airplane Flight Animation Overlay on Submit */}
      <AnimatePresence>
        {planeFlying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-paper-cream/80"
          >
            <motion.div
              initial={{ x: -130, y: 70, rotate: -10, scale: 0.75 }}
              animate={{
                x: [-130, 10, 190],
                y: [70, -15, -110],
                rotate: [-10, -18, -32],
                scale: [0.75, 1.15, 0.85],
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2"
            >
              <svg
                viewBox="0 0 120 90"
                className="h-24 w-28 overflow-visible"
                aria-hidden="true"
              >
                <polygon
                  points="8,46 112,10 68,78 50,54"
                  fill="var(--bg-paper-cream)"
                  stroke="var(--ink-charcoal)"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                <polygon
                  points="50,54 112,10 60,64"
                  fill="var(--zone-voice)"
                  stroke="var(--ink-charcoal)"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <line
                  x1="-35"
                  y1="66"
                  x2="2"
                  y2="52"
                  stroke="var(--ink-charcoal)"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                />
              </svg>
              <span className="rounded-full border-2 border-ink-charcoal bg-zone-selfcare px-3 py-1 font-hand text-base font-bold text-ink-charcoal shadow-cartoon-sm">
                Paper Plane Dispatched! +30 XP
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 sm:p-5">
        {/* Postcard Top Header & Cancelled Postage Stamp */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b-2 border-dashed border-ink-charcoal/30 pb-3.5">
          <div>
            <span className="font-hand text-sm font-bold uppercase tracking-widest text-ink-muted">
              MindSanctuary Treehouse Post · Form 03
            </span>
            <h2 className="font-display text-lg font-bold text-ink-charcoal">
              Vintage Anonymous Voice Postcard
            </h2>
            <p className="text-xs font-semibold text-ink-muted">
              Gemini 2.5 Flash scrubs names, emails &amp; dates before delivery
            </p>
          </div>

          {/* Perforated Postage Stamp + Cancellation Waves */}
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 48 24"
              className="hidden h-6 w-12 text-ink-muted sm:block"
              aria-hidden="true"
            >
              <path
                d="M 2 6 Q 8 2, 14 6 T 26 6 T 38 6 T 46 6 M 2 12 Q 8 8, 14 12 T 26 12 T 38 12 T 46 12 M 2 18 Q 8 14, 14 18 T 26 18 T 38 18 T 46 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <div className="rotate-2 rounded-lg border-2 border-dashed border-ink-charcoal bg-zone-voice/45 px-2.5 py-1.5 text-center shadow-cartoon-sm">
              <div className="flex items-center gap-1 font-hand text-xs font-bold text-ink-charcoal">
                <Stamp className="h-3.5 w-3.5" />
                <span>ZERO-TRACE</span>
              </div>
              <span className="block font-hand text-[10px] font-bold text-ink-charcoal">
                <EyeOff className="mr-0.5 inline h-2.5 w-2.5" />
                AI REDACTED
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Two-Column Vintage Postcard Interior */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            {/* LEFT SIDE: Message Writing Area */}
            <div className="space-y-3 md:col-span-7">
              <label
                htmlFor="voice-content"
                className="block font-hand text-base font-bold text-ink-charcoal"
              >
                Write Your Message Here (PII will be automatically redacted):
              </label>
              <textarea
                id="voice-content"
                rows={5}
                required
                minLength={12}
                maxLength={2000}
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder="Dear Sanctuary Ombuds: During sprint handoffs, @alex.chen@company.com sent late-night requests that raised team stress..."
                className="w-full rounded-xl border-[3px] border-ink-charcoal bg-paper-aged p-3 text-xs font-semibold leading-relaxed text-ink-charcoal placeholder:text-ink-muted focus:bg-paper-cream focus:outline-none"
              />

              <button
                type="button"
                disabled={isScrubbing}
                onClick={handlePreviewScrub}
                className="cartoon-btn inline-flex items-center gap-1.5 rounded-xl bg-zone-psychology px-3.5 py-1.5 text-xs font-bold text-ink-charcoal disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-ink-charcoal" />
                <span>
                  {isScrubbing ? "Scrubbing PII..." : "Preview AI Redaction"}
                </span>
              </button>
            </div>

            {/* RIGHT SIDE: Postcard Address & Stamp Routing */}
            <div className="space-y-3 md:col-span-5 md:border-l-[3px] md:border-ink-charcoal md:pl-4">
              <div className="space-y-1 border-b-2 border-ink-charcoal/25 pb-2">
                <p className="font-hand text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Deliver To:
                </p>
                <p className="font-hand text-base font-bold text-ink-charcoal">
                  Treehouse Ombuds Sanctuary Desk
                </p>
              </div>

              <div>
                <p className="mb-1 text-[11px] font-bold text-ink-muted">
                  Postcard Stamp Type
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {VOICE_SUBMISSION_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSubmissionType(type)}
                      className={clsx(
                        "cartoon-btn rounded-lg px-2 py-1.5 text-[11px] font-bold",
                        submissionType === type
                          ? "bg-zone-voice text-ink-charcoal"
                          : "bg-paper-aged text-ink-muted hover:text-ink-charcoal"
                      )}
                    >
                      {type === "COMPLAINT" ? "Complaint" : "Feedback"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="voice-category"
                  className="mb-1 block text-[11px] font-bold text-ink-muted"
                >
                  Topic Domain
                </label>
                <select
                  id="voice-category"
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value as (typeof VOICE_CATEGORIES)[number]
                    )
                  }
                  className="w-full rounded-xl border-2 border-ink-charcoal bg-paper-aged px-2.5 py-1.5 text-xs font-bold text-ink-charcoal focus:outline-none"
                >
                  {VOICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="voice-urgency"
                  className="mb-1 block text-[11px] font-bold text-ink-muted"
                >
                  Urgency Stamp
                </label>
                <select
                  id="voice-urgency"
                  value={urgency}
                  onChange={(e) =>
                    setUrgency(
                      e.target.value as (typeof URGENCY_LEVELS)[number]
                    )
                  }
                  className="w-full rounded-xl border-2 border-ink-charcoal bg-paper-aged px-2.5 py-1.5 text-xs font-bold text-ink-charcoal focus:outline-none"
                >
                  {URGENCY_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="cartoon-btn flex w-full items-center justify-center gap-2 rounded-xl bg-zone-voice px-4 py-2.5 text-xs font-bold text-ink-charcoal disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>
                  {isPending
                    ? "Folding Paper Plane..."
                    : "Fold & Send Postcard (+30 XP)"}
                </span>
              </button>
            </div>
          </div>

          {preview && (
            <div className="space-y-2 rounded-xl border-[3px] border-ink-charcoal bg-paper-aged p-3.5 shadow-cartoon-sm">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-ink-charcoal">
                  Scrubbed Postcard Preview (Safe to Mail)
                </span>
                <span className="rounded border-2 border-ink-charcoal bg-zone-psychology px-1.5 py-0.5 font-hand text-xs font-bold text-ink-charcoal">
                  Urgency: {preview.suggestedUrgency}
                </span>
              </div>
              <p className="text-xs font-semibold leading-relaxed text-ink-charcoal">
                {preview.scrubbedText}
              </p>
              {preview.redactedEntities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {preview.redactedEntities.map((entity, index) => (
                    <span
                      key={`${entity}-${index}`}
                      className="rounded-md border-2 border-ink-charcoal bg-zone-psychology px-2 py-0.5 text-[10px] font-bold text-ink-charcoal"
                    >
                      Redacted: {entity}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {statusMessage && (
            <div
              className={clsx(
                "flex items-center gap-2 rounded-xl border-2 border-ink-charcoal px-3 py-2 text-xs font-bold text-ink-charcoal",
                statusMessage.type === "success"
                  ? "bg-zone-selfcare/60"
                  : "bg-zone-voice/60"
              )}
            >
              {statusMessage.type === "error" && (
                <ShieldAlert className="h-4 w-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
