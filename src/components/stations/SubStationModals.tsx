"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowBigUp,
  BookOpen,
  CheckCircle2,
  Clock,
  Coffee,
  EyeOff,
  Flame,
  Gauge,
  HeartPulse,
  Highlighter,
  Lock,
  MessageSquarePlus,
  Pause,
  Play,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Stamp,
  Timer,
  X,
} from "lucide-react";
import { completeArticleReadingAction } from "@/actions/psychology";
import {
  lookupReceiptCodeAction,
  submitEmployeeVoiceEntryAction,
  submitWorkComfortPulseAction,
  upvoteEmployeeVoiceEntryAction,
} from "@/actions/voice";
import { BreathingVisualizer } from "@/components/features/self-care/BreathingVisualizer";
import { DailyQuestChecklist } from "@/components/features/self-care/DailyQuestChecklist";
import { EmotionRegulator } from "@/components/features/self-care/EmotionRegulator";
import { useHud } from "@/components/hud/HudProvider";
import type {
  ReviewStatusLiteral,
  SerializedEmployeeVoiceEntry,
  SerializedPsychologyArticle,
  SerializedWorkComfortPulse,
  SubStationCode,
} from "@/lib/seed";
import type { SerializedQuest } from "@/lib/validations/selfcare";
import type { ScrubVoiceResult } from "@/lib/validations/voice";
import { clsx } from "clsx";

interface SubStationModalHostProps {
  stationCode: SubStationCode;
  psychologyArticles: SerializedPsychologyArticle[];
  quests: SerializedQuest[];
  voiceEntries: SerializedEmployeeVoiceEntry[];
  comfortPulses: SerializedWorkComfortPulse[];
  onVoiceEntryCreated: (entry: SerializedEmployeeVoiceEntry) => void;
  onComfortPulseCreated: (pulse: SerializedWorkComfortPulse) => void;
  onClose: () => void;
}

const VOICE_CATEGORY_TAGS = [
  "Beban Kerja",
  "Komunikasi",
  "Fasilitas",
  "Budaya Kerja",
] as const;

const DEPARTMENT_TAGS = [
  "Umum",
  "Engineering",
  "Product & Design",
  "Operasional",
  "People & Culture",
] as const;

const STATUS_BADGE_LABELS: Record<ReviewStatusLiteral, string> = {
  PENDING: "MENUNGGU TINJAUAN",
  UNDER_REVIEW: "SEDANG DITINJAU",
  ACKNOWLEDGED: "DITERIMA & DICATAT",
  RESOLVED: "SELESAI DITINDAKLANJUTI",
};

const FACE_LABELS: Record<number, string> = {
  1: "Tertekan",
  2: "Kurang Nyaman",
  3: "Cukup",
  4: "Nyaman",
  5: "Sangat Nyaman",
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
      className="h-8 w-8 overflow-visible"
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

/**
 * Shared Scrapbook Reader for Isolated Modals 1A, 1B, and 1C (Zero cross-zone links).
 */
function IsolatedPsychologyScrapbook({
  stationCode,
  articles,
}: {
  stationCode: "1A" | "1B" | "1C";
  articles: SerializedPsychologyArticle[];
}) {
  const { addXp } = useHud();
  const [activeArticleId, setActiveArticleId] = useState<string>(
    articles[0]?.id ?? ""
  );
  const [checkedTips, setCheckedTips] = useState<Record<string, boolean>>({});
  const [stampedIds, setStampedIds] = useState<Record<string, boolean>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Station 1B interactive burnout self-check state
  const [burnoutChecks, setBurnoutChecks] = useState<Record<number, boolean>>(
    {}
  );

  // Station 1C interactive Ultradian Focus Timer state
  const [focusSecLeft, setFocusSecLeft] = useState<number>(25 * 60);
  const [focusRunning, setFocusRunning] = useState<boolean>(false);
  const [microStepText, setMicroStepText] = useState<string>("");

  useEffect(() => {
    if (articles.length > 0 && !articles.some((a) => a.id === activeArticleId)) {
      setActiveArticleId(articles[0].id);
    }
  }, [articles, activeArticleId]);

  useEffect(() => {
    if (!focusRunning) return;
    const timer = window.setInterval(() => {
      setFocusSecLeft((prev) => {
        if (prev <= 1) {
          setFocusRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [focusRunning]);

  const activeArticle =
    articles.find((a) => a.id === activeArticleId) ?? articles[0] ?? null;

  const handleStampRead = (article: SerializedPsychologyArticle) => {
    if (stampedIds[article.id]) return;
    startTransition(async () => {
      const res = await completeArticleReadingAction({
        articleSlug: article.slug,
      });
      if (res.ok) {
        setStampedIds((prev) => ({ ...prev, [article.id]: true }));
        addXp(res.xpAwarded);
        setStatusMessage(
          `Catatan "${article.title}" distempel selesai! +${res.xpAwarded} Wellness XP.`
        );
      }
    });
  };

  const burnoutScore = Object.values(burnoutChecks).filter(Boolean).length;
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-5">
      {/* Two-Page Open Hardcover Scrapbook Spread */}
      <div className="rounded-3xl border-[4px] border-ink-charcoal bg-wood-warm p-2.5 shadow-cartoon sm:p-4">
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border-[3px] border-ink-charcoal bg-paper-cream lg:grid-cols-12">
          {/* LEFT PAGE: Station Article Clippings & Station-Specific Interactive Tool */}
          <div className="flex flex-col justify-between border-b-[3px] border-ink-charcoal bg-paper-aged/65 p-4 sm:p-6 lg:col-span-5 lg:border-b-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-dashed border-ink-charcoal/30 pb-2.5">
                <span className="font-hand text-lg font-bold text-ink-charcoal">
                  Daftar Kliping Pos {stationCode} ({articles.length})
                </span>
                <span className="font-hand text-sm font-bold text-ink-muted">
                  Dr. Maya Lin
                </span>
              </div>

              <div className="space-y-3">
                {articles.map((article) => {
                  const isSelected = activeArticle?.id === article.id;
                  const isStamped = Boolean(stampedIds[article.id]);
                  return (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => {
                        setActiveArticleId(article.id);
                        setStatusMessage(null);
                      }}
                      className={clsx(
                        "cartoon-btn w-full rounded-2xl p-3.5 text-left transition-transform",
                        isSelected
                          ? "bg-zone-psychology text-ink-charcoal"
                          : "bg-paper-cream text-ink-charcoal hover:bg-paper-aged"
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="rounded-md border-2 border-ink-charcoal bg-paper-cream px-2 py-0.5 font-hand text-xs font-bold text-ink-charcoal">
                          {article.readMinutes} menit baca
                        </span>
                        {isStamped && (
                          <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink-charcoal bg-zone-selfcare px-2 py-0.5 font-hand text-xs font-bold text-ink-charcoal">
                            <CheckCircle2 className="h-3 w-3" />
                            Selesai
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-sm font-bold leading-snug text-ink-charcoal">
                        {article.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold text-ink-muted">
                        {article.summary}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Station 1B Exclusive Tool: Quick Burnout & Conflict Self-Check */}
              {stationCode === "1B" && (
                <div className="space-y-2.5 rounded-2xl border-[3px] border-ink-charcoal bg-paper-cream p-3.5 shadow-cartoon-sm">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 font-display text-xs font-bold text-ink-charcoal">
                      <Flame className="h-4 w-4 text-ink-charcoal" />
                      Refleksi Dini Beban &amp; Burnout
                    </span>
                    <span className="rounded-full border-2 border-ink-charcoal bg-zone-psychology px-2 py-0.5 font-hand text-xs font-bold text-ink-charcoal">
                      {burnoutScore}/4 Sinyal
                    </span>
                  </div>
                  {[
                    "Merasa lelah bahkan setelah tidur malam penuh",
                    "Sulit fokus akibat ping/interupsi mendadak",
                    "Gesekan prioritas atau ekspektasi antar-tim",
                    "Sulit melepas pikiran kerja setelah jam pulang",
                  ].map((item, idx) => (
                    <label
                      key={idx}
                      className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink-charcoal"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(burnoutChecks[idx])}
                        onChange={() =>
                          setBurnoutChecks((prev) => ({
                            ...prev,
                            [idx]: !prev[idx],
                          }))
                        }
                        className="h-4 w-4 accent-ink-charcoal"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                  <p className="rounded-xl border-2 border-ink-charcoal bg-paper-aged p-2 font-hand text-sm font-bold text-ink-charcoal">
                    {burnoutScore >= 3
                      ? "Rekomendasi: Terapkan skrip negosiasi trade-off kapasitas & jadwalkan blok pemulihan hari ini."
                      : burnoutScore >= 1
                        ? "Rekomendasi: Jaga batas notifikasi sore dan lakukan jeda mikro antar-rapat."
                        : "Ritme kerja Anda tampak terjaga. Pertahankan komunikasi asertif bersama tim!"}
                  </p>
                </div>
              )}

              {/* Station 1C Exclusive Tool: Ultradian Focus Timer & Micro-Step Breaker */}
              {stationCode === "1C" && (
                <div className="space-y-3 rounded-2xl border-[3px] border-ink-charcoal bg-paper-cream p-3.5 shadow-cartoon-sm">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 font-display text-xs font-bold text-ink-charcoal">
                      <Timer className="h-4 w-4 text-ink-charcoal" />
                      Timer Fokus Ultradian
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFocusRunning(false);
                          setFocusSecLeft(25 * 60);
                        }}
                        className="rounded-lg border-2 border-ink-charcoal bg-paper-aged px-2 py-0.5 font-hand text-xs font-bold"
                      >
                        25m
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFocusRunning(false);
                          setFocusSecLeft(90 * 60);
                        }}
                        className="rounded-lg border-2 border-ink-charcoal bg-zone-psychology px-2 py-0.5 font-hand text-xs font-bold"
                      >
                        90m
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border-2 border-ink-charcoal bg-paper-aged px-3 py-2">
                    <span className="font-display text-xl font-bold text-ink-charcoal">
                      {formatTime(focusSecLeft)}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFocusRunning((r) => !r)}
                        className="cartoon-btn inline-flex items-center gap-1 rounded-lg bg-zone-selfcare px-2.5 py-1 text-xs font-bold text-ink-charcoal"
                      >
                        {focusRunning ? (
                          <>
                            <Pause className="h-3.5 w-3.5" />
                            <span>Jeda</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5" />
                            <span>Mulai</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFocusRunning(false);
                          setFocusSecLeft(25 * 60);
                        }}
                        className="cartoon-btn rounded-lg bg-paper-cream p-1 text-ink-charcoal"
                        aria-label="Reset Timer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block font-hand text-xs font-bold text-ink-muted">
                      Target Langkah Mikro 15 Menit Pertama:
                    </label>
                    <input
                      type="text"
                      value={microStepText}
                      onChange={(e) => setMicroStepText(e.target.value)}
                      placeholder="Contoh: Menulis kerangka 3 poin utama..."
                      className="w-full rounded-xl border-2 border-ink-charcoal bg-paper-aged px-2.5 py-1.5 text-xs font-semibold text-ink-charcoal focus:bg-paper-cream focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t-2 border-dashed border-ink-charcoal/25 pt-3 font-hand text-sm font-bold text-ink-muted">
              <span>Jurnal Psikologi Kerja MindSanctuary</span>
              <span>Halaman Kiri</span>
            </div>
          </div>

          {/* RIGHT PAGE: Full Article Spread + Highlighter Callout + Action Tips Checklist */}
          <div className="relative flex flex-col justify-between bg-paper-cream p-4 sm:p-6 lg:col-span-7 lg:border-l-[3px] lg:border-ink-charcoal">
            {activeArticle ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-ink-charcoal/30 pb-3">
                  <span className="-rotate-1 rounded-lg border-2 border-ink-charcoal bg-zone-psychology px-3 py-0.5 font-hand text-base font-bold text-ink-charcoal shadow-cartoon-sm">
                    POS {stationCode} · {activeArticle.subCategory}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-hand text-base font-bold text-ink-muted">
                    <Clock className="h-4 w-4 text-ink-charcoal" />
                    {activeArticle.readMinutes} menit baca
                  </span>
                </div>

                <h2 className="font-display text-xl font-bold leading-snug text-ink-charcoal">
                  {activeArticle.title}
                </h2>

                {/* Warm Yellow Highlighter Callout */}
                <div className="rounded-2xl border-2 border-ink-charcoal bg-zone-psychology/65 p-3.5 shadow-cartoon-sm">
                  <div className="mb-1 flex items-center gap-1.5 font-hand text-sm font-bold uppercase tracking-wider text-ink-charcoal">
                    <Highlighter className="h-3.5 w-3.5" />
                    <span>Intisari Penting (Highlighter Note)</span>
                  </div>
                  <p className="font-hand text-lg font-bold leading-snug text-ink-charcoal">
                    <mark className="rounded bg-zone-psychology px-1 text-ink-charcoal">
                      {activeArticle.summary}
                    </mark>
                  </p>
                </div>

                {/* Full Article Paragraphs */}
                <div className="space-y-3 text-sm font-semibold leading-relaxed text-ink-charcoal">
                  {activeArticle.content.split("\n\n").map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>

                {/* Action Tips Checklist */}
                <div className="space-y-2 rounded-2xl border-[3px] border-ink-charcoal bg-paper-aged p-4 shadow-cartoon-sm">
                  <h4 className="font-display text-xs font-bold uppercase tracking-wider text-ink-charcoal">
                    Langkah Praktis yang Bisa Diterapkan Hari Ini:
                  </h4>
                  <div className="space-y-2">
                    {activeArticle.actionTips.map((tip, idx) => {
                      const tipKey = `${activeArticle.id}-tip-${idx}`;
                      return (
                        <label
                          key={tipKey}
                          className="flex cursor-pointer items-start gap-2.5 text-xs font-bold text-ink-charcoal"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(checkedTips[tipKey])}
                            onChange={() =>
                              setCheckedTips((prev) => ({
                                ...prev,
                                [tipKey]: !prev[tipKey],
                              }))
                            }
                            className="mt-0.5 h-4 w-4 accent-ink-charcoal"
                          />
                          <span
                            className={clsx(
                              checkedTips[tipKey] &&
                                "line-through opacity-70"
                            )}
                          >
                            {tip}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {statusMessage && (
                  <div className="rounded-xl border-2 border-ink-charcoal bg-zone-selfcare/60 px-3 py-2 font-hand text-base font-bold text-ink-charcoal">
                    {statusMessage}
                  </div>
                )}

                <div className="flex items-center justify-end border-t-2 border-dashed border-ink-charcoal/30 pt-4">
                  <button
                    type="button"
                    disabled={
                      isPending || Boolean(stampedIds[activeArticle.id])
                    }
                    onClick={() => handleStampRead(activeArticle)}
                    className="cartoon-btn inline-flex items-center gap-2 rounded-xl bg-zone-psychology px-4 py-2 text-xs font-bold text-ink-charcoal disabled:opacity-65"
                  >
                    {stampedIds[activeArticle.id] ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Telah Distempel di Jurnal</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>
                          {isPending
                            ? "Menstempel..."
                            : "Stempel Selesai Baca (+20 XP)"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between border-t-2 border-dashed border-ink-charcoal/25 pt-3 font-hand text-sm font-bold text-ink-muted">
              <span>Catatan Lapangan Terisolasi · Pos {stationCode}</span>
              <span>Halaman Kanan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Station 3A Isolated Modal: Anonymous Complaint Form + Receipt Code (SV-XXXX) Tracker.
 */
function IsolatedComplaintPostbox3A({
  onVoiceEntryCreated,
}: {
  onVoiceEntryCreated: (entry: SerializedEmployeeVoiceEntry) => void;
}) {
  const { addXp } = useHud();
  const [categoryTag, setCategoryTag] = useState<string>("Beban Kerja");
  const [rawMessage, setRawMessage] = useState<string>("");
  const [isPublicOnWall, setIsPublicOnWall] = useState<boolean>(true);
  const [preview, setPreview] = useState<ScrubVoiceResult | null>(null);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [planeFlying, setPlaneFlying] = useState<boolean>(false);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Receipt code lookup state
  const [lookupInput, setLookupInput] = useState<string>("SV-4829");
  const [trackedEntry, setTrackedEntry] =
    useState<SerializedEmployeeVoiceEntry | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, startLookupTransition] = useTransition();

  const handlePreviewRedaction = async () => {
    if (rawMessage.trim().length < 10) {
      setFormMsg("Tulis minimal 10 karakter sebelum pratinjau sensor AI.");
      return;
    }
    setIsScrubbing(true);
    setFormMsg(null);
    try {
      const response = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "scrub-pii",
          rawText: rawMessage,
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as ScrubVoiceResult;
        setPreview(data);
      }
    } catch {
      setFormMsg("Pratinjau AI tidak tersedia saat ini.");
    } finally {
      setIsScrubbing(false);
    }
  };

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    startTransition(async () => {
      const res = await submitEmployeeVoiceEntryAction({
        type: "COMPLAINT",
        categoryTag,
        rawMessage,
        isPublicOnWall,
      });

      if (res.ok) {
        onVoiceEntryCreated(res.entry);
        setRawMessage("");
        setPreview(null);
        setLastReceipt(res.entry.receiptCode);
        setLookupInput(res.entry.receiptCode);
        setTrackedEntry(res.entry);
        addXp(30);
        setPlaneFlying(true);
        window.setTimeout(() => setPlaneFlying(false), 1800);
        setFormMsg(
          `Keluhan anonim terkirim! Simpan Kode Resi Anda: ${res.entry.receiptCode} (+30 XP).`
        );
      } else {
        setFormMsg(res.error);
      }
    });
  };

  const handleLookupReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    startLookupTransition(async () => {
      const res = await lookupReceiptCodeAction(lookupInput);
      if (res.ok) {
        setTrackedEntry(res.entry);
      } else {
        setTrackedEntry(null);
        setLookupError(res.error);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT COLUMN: Anonymous Complaint Postcard Form */}
      <div className="cartoon-panel relative overflow-hidden p-0 lg:col-span-7">
        <div
          aria-hidden="true"
          className="h-3.5 w-full border-b-[3px] border-ink-charcoal"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, var(--zone-voice) 0 14px, var(--bg-paper-cream) 14px 26px, var(--zone-psychology) 26px 40px, var(--bg-paper-cream) 40px 52px)",
          }}
        />

        <AnimatePresence>
          {planeFlying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-paper-cream/85"
            >
              <span className="rounded-2xl border-[3px] border-ink-charcoal bg-zone-selfcare px-4 py-2 font-hand text-xl font-bold text-ink-charcoal shadow-cartoon-sm">
                Pesawat Kertas Terkirim! Resi: {lastReceipt}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmitComplaint} className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-ink-charcoal/30 pb-3">
            <div>
              <span className="font-hand text-sm font-bold uppercase tracking-wider text-ink-muted">
                Pos 3A · Kotak Pos Terkunci
              </span>
              <h3 className="font-display text-base font-bold text-ink-charcoal">
                Formulir Penyampaian Keluhan Secara Anonim
              </h3>
              <p className="text-xs font-semibold text-ink-muted">
                Tanpa pelacakan IP/identitas. Nama &amp; email disensor otomatis
                oleh AI.
              </p>
            </div>
            <span className="rotate-2 rounded-lg border-2 border-dashed border-ink-charcoal bg-zone-voice/45 px-2.5 py-1 font-hand text-xs font-bold text-ink-charcoal">
              <EyeOff className="mr-1 inline h-3 w-3" />
              100% ANONIM
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-ink-muted">
                Kategori Keluhan Kerja
              </label>
              <select
                value={categoryTag}
                onChange={(e) => setCategoryTag(e.target.value)}
                className="w-full rounded-xl border-2 border-ink-charcoal bg-paper-aged px-3 py-2 text-xs font-bold text-ink-charcoal focus:outline-none"
              >
                {VOICE_CATEGORY_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-ink-charcoal bg-paper-aged px-3 py-2 text-xs font-bold text-ink-charcoal">
                <input
                  type="checkbox"
                  checked={isPublicOnWall}
                  onChange={(e) => setIsPublicOnWall(e.target.checked)}
                  className="h-4 w-4 accent-ink-charcoal"
                />
                <span>Tampilkan versi tersensor di Dinding Publik</span>
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-hand text-base font-bold text-ink-charcoal">
              Uraian Keluhan Kerja (Nama/Email akan disensor otomatis):
            </label>
            <textarea
              rows={4}
              required
              minLength={10}
              value={rawMessage}
              onChange={(e) => setRawMessage(e.target.value)}
              placeholder="Tuliskan keluhan Anda secara jujur. Contoh: Pengiriman tugas mendadak larut malam di divisi..."
              className="w-full rounded-xl border-[3px] border-ink-charcoal bg-paper-aged p-3 text-xs font-semibold leading-relaxed text-ink-charcoal focus:bg-paper-cream focus:outline-none"
            />
          </div>

          {preview && (
            <div className="space-y-1.5 rounded-xl border-2 border-ink-charcoal bg-zone-psychology/45 p-3">
              <span className="font-hand text-sm font-bold text-ink-charcoal">
                Hasil Sensor AI (Aman Dikirim):
              </span>
              <p className="text-xs font-semibold text-ink-charcoal">
                {preview.scrubbedText}
              </p>
            </div>
          )}

          {formMsg && (
            <div className="rounded-xl border-2 border-ink-charcoal bg-zone-selfcare/60 px-3 py-2 text-xs font-bold text-ink-charcoal">
              {formMsg}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              disabled={isScrubbing}
              onClick={handlePreviewRedaction}
              className="cartoon-btn inline-flex items-center gap-1.5 rounded-xl bg-zone-psychology px-3.5 py-2 text-xs font-bold text-ink-charcoal"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {isScrubbing ? "Menyensor..." : "Pratinjau Sensor AI"}
              </span>
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="cartoon-btn inline-flex items-center gap-2 rounded-xl bg-zone-voice px-4 py-2 text-xs font-bold text-ink-charcoal"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {isPending
                  ? "Mengirim Keluhan..."
                  : "Kirim Keluhan Anonim (+30 XP)"}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: Anonymous Receipt Code (SV-XXXX) Status Tracker */}
      <div className="cartoon-panel-aged flex flex-col justify-between space-y-4 p-5 lg:col-span-5">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-dashed border-ink-charcoal/30 pb-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border-2 border-ink-charcoal bg-paper-cream">
              <Stamp className="h-4 w-4 text-ink-charcoal" />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-ink-charcoal">
                Lacak Kode Resi Anonim (SV-XXXX)
              </h3>
              <p className="text-[11px] font-semibold text-ink-muted">
                Cek tindak lanjut Ombudsman tanpa login
              </p>
            </div>
          </div>

          <form onSubmit={handleLookupReceipt} className="flex gap-2">
            <input
              type="text"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder="Contoh: SV-4829"
              className="flex-1 rounded-xl border-[3px] border-ink-charcoal bg-paper-cream px-3 py-2 font-mono text-xs font-bold uppercase text-ink-charcoal focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLookingUp}
              className="cartoon-btn inline-flex items-center gap-1.5 rounded-xl bg-zone-psychology px-3.5 py-2 text-xs font-bold text-ink-charcoal"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Cek Resi</span>
            </button>
          </form>

          {lookupError && (
            <div className="rounded-xl border-2 border-ink-charcoal bg-zone-voice/45 p-3 text-xs font-bold text-ink-charcoal">
              {lookupError}
            </div>
          )}

          {trackedEntry && (
            <div className="space-y-2.5 rounded-2xl border-[3px] border-ink-charcoal bg-paper-cream p-4 shadow-cartoon-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-lg border-2 border-ink-charcoal bg-zone-psychology px-2.5 py-0.5 font-mono text-xs font-bold text-ink-charcoal">
                  Resi: {trackedEntry.receiptCode}
                </span>
                <span className="rounded-full border-2 border-ink-charcoal bg-zone-selfcare px-2.5 py-0.5 font-hand text-xs font-bold text-ink-charcoal">
                  {STATUS_BADGE_LABELS[trackedEntry.status]}
                </span>
              </div>

              <p className="text-xs font-semibold leading-relaxed text-ink-charcoal">
                {trackedEntry.message}
              </p>

              <div className="rounded-xl border-2 border-ink-charcoal bg-paper-aged p-3">
                <span className="block font-hand text-xs font-bold uppercase text-ink-muted">
                  Tanggapan Resmi Ombudsman / HR:
                </span>
                <p className="mt-1 text-xs font-bold text-ink-charcoal">
                  {trackedEntry.adminResponse ??
                    "Laporan Anda telah masuk antrean peninjauan Ombudsman. Cek kembali kode resi ini secara berkala."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border-2 border-dashed border-ink-charcoal/40 bg-paper-cream p-3 text-[11px] font-semibold text-ink-muted">
          Contoh kode resi aktif yang bisa dicoba:{" "}
          <button
            type="button"
            onClick={() => setLookupInput("SV-4829")}
            className="font-mono font-bold text-ink-charcoal underline"
          >
            SV-4829
          </button>
          ,{" "}
          <button
            type="button"
            onClick={() => setLookupInput("SV-3194")}
            className="font-mono font-bold text-ink-charcoal underline"
          >
            SV-3194
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Station 3B Isolated Modal: Critique & Suggestion Form + Public Aspiration Corkboard Wall.
 */
function IsolatedCritiqueBoard3B({
  entries,
  onVoiceEntryCreated,
}: {
  entries: SerializedEmployeeVoiceEntry[];
  onVoiceEntryCreated: (entry: SerializedEmployeeVoiceEntry) => void;
}) {
  const { addXp } = useHud();
  const [categoryTag, setCategoryTag] = useState<string>("Budaya Kerja");
  const [rawMessage, setRawMessage] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});
  const [localEntries, setLocalEntries] =
    useState<SerializedEmployeeVoiceEntry[]>(entries);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  const publicWallEntries = useMemo(
    () => localEntries.filter((e) => e.isPublicOnWall),
    [localEntries]
  );

  const handleSubmitSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    startTransition(async () => {
      const res = await submitEmployeeVoiceEntryAction({
        type: "CRITIQUE_SUGGESTION",
        categoryTag,
        rawMessage,
        isPublicOnWall: true,
      });
      if (res.ok) {
        onVoiceEntryCreated(res.entry);
        setLocalEntries((prev) => [res.entry, ...prev]);
        setRawMessage("");
        addXp(25);
        setStatusMsg(
          `Kritik & Saran berhasil ditempel di papan aspirasi! Kode Resi: ${res.entry.receiptCode} (+25 XP).`
        );
      } else {
        setStatusMsg(res.error);
      }
    });
  };

  const handleUpvote = (entryId: string) => {
    if (votedIds[entryId]) return;
    setVotedIds((prev) => ({ ...prev, [entryId]: true }));
    setLocalEntries((prev) =>
      prev.map((item) =>
        item.id === entryId ? { ...item, upvotes: item.upvotes + 1 } : item
      )
    );
    startTransition(async () => {
      await upvoteEmployeeVoiceEntryAction({ entryId });
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT: Critique & Suggestion Form */}
      <div className="cartoon-panel space-y-4 p-5 lg:col-span-5">
        <div className="border-b-2 border-dashed border-ink-charcoal/30 pb-3">
          <span className="font-hand text-sm font-bold uppercase text-ink-muted">
            Pos 3B · Papan Aspirasi Konstruktif
          </span>
          <h3 className="font-display text-base font-bold text-ink-charcoal">
            Tempat Memberikan Kritik &amp; Saran
          </h3>
          <p className="text-xs font-semibold text-ink-muted">
            Bagikan ide perbaikan budaya kerja, fasilitas, atau kolaborasi tim.
          </p>
        </div>

        <form onSubmit={handleSubmitSuggestion} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-bold text-ink-muted">
              Topik Aspirasi
            </label>
            <select
              value={categoryTag}
              onChange={(e) => setCategoryTag(e.target.value)}
              className="w-full rounded-xl border-2 border-ink-charcoal bg-paper-aged px-3 py-2 text-xs font-bold text-ink-charcoal"
            >
              {VOICE_CATEGORY_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-hand text-base font-bold text-ink-charcoal">
              Tuliskan Kritik Konstruktif atau Saran Anda:
            </label>
            <textarea
              rows={5}
              required
              minLength={10}
              value={rawMessage}
              onChange={(e) => setRawMessage(e.target.value)}
              placeholder="Contoh: Mengusulkan blok fokus tanpa rapat setiap Rabu pagi agar tim dapat menyelesaikan pekerjaan mendalam..."
              className="w-full rounded-xl border-[3px] border-ink-charcoal bg-paper-aged p-3 text-xs font-semibold leading-relaxed text-ink-charcoal focus:bg-paper-cream focus:outline-none"
            />
          </div>

          {statusMsg && (
            <div className="rounded-xl border-2 border-ink-charcoal bg-zone-selfcare/60 px-3 py-2 text-xs font-bold text-ink-charcoal">
              {statusMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="cartoon-btn flex w-full items-center justify-center gap-2 rounded-xl bg-zone-psychology px-4 py-2.5 text-xs font-bold text-ink-charcoal"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>
              {isPending
                ? "Menempelkan Kartu..."
                : "Tempel Kritik & Saran (+25 XP)"}
            </span>
          </button>
        </form>
      </div>

      {/* RIGHT: Public Corkboard Wall */}
      <div className="cartoon-panel-aged space-y-4 p-5 lg:col-span-7">
        <div className="flex items-center justify-between border-b-2 border-dashed border-ink-charcoal/30 pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-ink-charcoal">
              Dinding Aspirasi &amp; Tanggapan Manajemen
            </h3>
            <p className="text-xs font-semibold text-ink-muted">
              Berikan dukungan (Echo) pada aspirasi rekan kerja yang relevan
            </p>
          </div>
          <span className="rounded-full border-2 border-ink-charcoal bg-paper-cream px-3 py-0.5 font-hand text-sm font-bold text-ink-charcoal">
            {publicWallEntries.length} Kartu Pos
          </span>
        </div>

        <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
          {publicWallEntries.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border-[3px] border-ink-charcoal bg-paper-cream p-4 shadow-cartoon-sm"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      "rounded-md border-2 border-ink-charcoal px-2 py-0.5 font-hand text-xs font-bold text-ink-charcoal",
                      item.type === "COMPLAINT"
                        ? "bg-zone-voice"
                        : "bg-zone-psychology"
                    )}
                  >
                    {item.type === "COMPLAINT" ? "KELUHAN" : "KRITIK & SARAN"}
                  </span>
                  <span className="text-xs font-bold text-ink-muted">
                    {item.categoryTag}
                  </span>
                </div>

                <span className="rounded-full border-2 border-ink-charcoal bg-zone-selfcare/65 px-2.5 py-0.5 font-hand text-xs font-bold text-ink-charcoal">
                  {STATUS_BADGE_LABELS[item.status]}
                </span>
              </div>

              <p className="text-xs font-semibold leading-relaxed text-ink-charcoal">
                {item.message}
              </p>

              {item.adminResponse && (
                <div className="mt-2.5 rounded-xl border-2 border-ink-charcoal bg-paper-aged p-2.5">
                  <span className="font-hand text-xs font-bold text-ink-muted">
                    Tindak Lanjut Manajemen:
                  </span>
                  <p className="text-xs font-bold text-ink-charcoal">
                    {item.adminResponse}
                  </p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-ink-charcoal/20 pt-2.5 text-[11px]">
                <span className="inline-flex items-center gap-1 font-mono font-bold text-ink-muted">
                  <ShieldCheck className="h-3.5 w-3.5 text-ink-charcoal" />
                  Resi: {item.receiptCode}
                </span>

                <button
                  type="button"
                  disabled={Boolean(votedIds[item.id])}
                  onClick={() => handleUpvote(item.id)}
                  className={clsx(
                    "cartoon-btn inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-hand text-xs font-bold",
                    votedIds[item.id]
                      ? "bg-zone-psychology text-ink-charcoal"
                      : "bg-paper-aged text-ink-charcoal"
                  )}
                >
                  <ArrowBigUp className="h-3.5 w-3.5" />
                  <span>Dukung ({item.upvotes})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Station 3C Isolated Modal: WorkComfortPulse Evaluation Survey & Live Department Comfort Meters.
 */
function IsolatedComfortMeter3C({
  pulses,
  onComfortPulseCreated,
}: {
  pulses: SerializedWorkComfortPulse[];
  onComfortPulseCreated: (pulse: SerializedWorkComfortPulse) => void;
}) {
  const { addXp } = useHud();
  const [scores, setScores] = useState({
    overallComfort: 4,
    workloadBalance: 4,
    psychologicalSafety: 4,
    teamSupport: 5,
  });
  const [departmentTag, setDepartmentTag] = useState<string>("Engineering");
  const [environmentNote, setEnvironmentNote] = useState<string>("");
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);
  const [localPulses, setLocalPulses] =
    useState<SerializedWorkComfortPulse[]>(pulses);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalPulses(pulses);
  }, [pulses]);

  const averages = useMemo(() => {
    if (localPulses.length === 0) {
      return {
        overall: 4.0,
        workload: 3.8,
        safety: 4.2,
        support: 4.4,
      };
    }
    const count = localPulses.length;
    const sum = localPulses.reduce(
      (acc, p) => ({
        overall: acc.overall + p.overallComfort,
        workload: acc.workload + p.workloadBalance,
        safety: acc.safety + p.psychologicalSafety,
        support: acc.support + p.teamSupport,
      }),
      { overall: 0, workload: 0, safety: 0, support: 0 }
    );
    return {
      overall: Number((sum.overall / count).toFixed(2)),
      workload: Number((sum.workload / count).toFixed(2)),
      safety: Number((sum.safety / count).toFixed(2)),
      support: Number((sum.support / count).toFixed(2)),
    };
  }, [localPulses]);

  const handleSubmitPulse = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedMsg(null);
    startTransition(async () => {
      const res = await submitWorkComfortPulseAction({
        ...scores,
        departmentTag,
        environmentNote: environmentNote.trim() || undefined,
      });
      if (res.ok) {
        onComfortPulseCreated(res.pulse);
        setLocalPulses((prev) => [res.pulse, ...prev]);
        setEnvironmentNote("");
        addXp(35);
        setSubmittedMsg(
          "Evaluasi tingkat kenyamanan kerja berhasil dicatat! (+35 Wellness XP)."
        );
      } else {
        setSubmittedMsg(res.error);
      }
    });
  };

  const metricFields: Array<{
    key: keyof typeof scores;
    label: string;
  }> = [
    { key: "overallComfort", label: "Kenyamanan Lingkungan Kerja Umum" },
    { key: "workloadBalance", label: "Keseimbangan Beban Kerja" },
    { key: "psychologicalSafety", label: "Keamanan Psikologis Tim" },
    { key: "teamSupport", label: "Dukungan Rekan & Kolaborasi" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT: 5-Cartoon-Face Comfort Evaluation Form */}
      <form
        onSubmit={handleSubmitPulse}
        className="cartoon-panel space-y-4 p-5 lg:col-span-7"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-ink-charcoal/30 pb-3">
          <div>
            <span className="font-hand text-sm font-bold uppercase text-ink-muted">
              Pos 3C · Barometer Kenyamanan Kerja
            </span>
            <h3 className="font-display text-base font-bold text-ink-charcoal">
              Evaluasi Tingkat Kenyamanan Lingkungan Kerja
            </h3>
          </div>
          <select
            value={departmentTag}
            onChange={(e) => setDepartmentTag(e.target.value)}
            aria-label="Pilih Divisi"
            className="rounded-xl border-2 border-ink-charcoal bg-paper-aged px-3 py-1.5 text-xs font-bold text-ink-charcoal"
          >
            {DEPARTMENT_TAGS.map((dept) => (
              <option key={dept} value={dept}>
                Divisi: {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {metricFields.map((field) => (
            <div
              key={field.key}
              className="rounded-2xl border-[3px] border-ink-charcoal bg-paper-aged p-3 shadow-cartoon-sm"
            >
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-bold text-ink-charcoal">
                  {field.label}
                </span>
                <span className="font-hand text-sm font-bold text-ink-muted">
                  {FACE_LABELS[scores[field.key]]} ({scores[field.key]}/5)
                </span>
              </div>

              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((rating) => {
                  const isSelected = scores[field.key] === rating;
                  return (
                    <button
                      key={rating}
                      type="button"
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
          <label className="mb-1 block text-xs font-bold text-ink-muted">
            Catatan Tambahan Kenyamanan Lingkungan Kerja (Opsional)
          </label>
          <input
            type="text"
            maxLength={500}
            value={environmentNote}
            onChange={(e) => setEnvironmentNote(e.target.value)}
            placeholder="Satu hal yang membuat lingkungan kerja minggu ini lebih nyaman..."
            className="w-full rounded-xl border-[3px] border-ink-charcoal bg-paper-aged px-3 py-2 text-xs font-semibold text-ink-charcoal focus:bg-paper-cream focus:outline-none"
          />
        </div>

        {submittedMsg && (
          <div className="rounded-xl border-2 border-ink-charcoal bg-zone-selfcare/60 px-3 py-2 text-xs font-bold text-ink-charcoal">
            {submittedMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="cartoon-btn inline-flex items-center gap-2 rounded-xl bg-zone-voice px-5 py-2.5 text-xs font-bold text-ink-charcoal"
        >
          <Gauge className="h-4 w-4" />
          <span>
            {isPending
              ? "Menyimpan Evaluasi..."
              : "Kirim Evaluasi Kenyamanan (+35 XP)"}
          </span>
        </button>
      </form>

      {/* RIGHT: Aggregated Organization Comfort Semipanel */}
      <div className="cartoon-panel-aged flex flex-col justify-between space-y-4 p-5 lg:col-span-5">
        <div className="space-y-4">
          <div className="border-b-2 border-dashed border-ink-charcoal/30 pb-3">
            <h3 className="font-display text-base font-bold text-ink-charcoal">
              Indeks Kenyamanan Organisasi ({localPulses.length} Respon)
            </h3>
            <p className="text-xs font-semibold text-ink-muted">
              Rata-rata agregat seluruh divisi secara real-time
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Kenyamanan Umum", val: averages.overall },
              { label: "Beban Kerja", val: averages.workload },
              { label: "Keamanan Psikologis", val: averages.safety },
              { label: "Dukungan Tim", val: averages.support },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border-[3px] border-ink-charcoal bg-paper-cream p-3 text-center shadow-cartoon-sm"
              >
                <span className="block font-display text-2xl font-bold text-ink-charcoal">
                  {stat.val}
                  <span className="text-xs font-semibold text-ink-muted">
                    /5.0
                  </span>
                </span>
                <span className="font-hand text-sm font-bold text-ink-muted">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="font-hand text-sm font-bold uppercase text-ink-muted">
              Catatan Lingkungan Terbaru:
            </h4>
            {localPulses.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="rounded-xl border-2 border-ink-charcoal bg-paper-cream p-2.5 text-xs"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="rounded border border-ink-charcoal bg-zone-psychology px-1.5 py-0.5 font-hand text-xs font-bold">
                    {p.departmentTag}
                  </span>
                  <span className="font-hand text-xs font-bold text-ink-muted">
                    Skor: {p.overallComfort}/5
                  </span>
                </div>
                <p className="font-semibold text-ink-charcoal">
                  {p.environmentNote || "Lingkungan kerja kondusif & stabil."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the dedicated, strictly isolated modal for any of the 9 sub-stations (1A..3C).
 */
export function SubStationModalHost({
  stationCode,
  psychologyArticles,
  quests,
  voiceEntries,
  comfortPulses,
  onVoiceEntryCreated,
  onComfortPulseCreated,
  onClose,
}: SubStationModalHostProps) {
  const headerConfig: Record<
    SubStationCode,
    {
      title: string;
      subtitle: string;
      bgClass: string;
      icon: React.ReactNode;
    }
  > = {
    "1A": {
      title: "Pos 1A · Edukasi Kesehatan Mental di Lingkungan Kerja",
      subtitle:
        "Cozy Library Nook — Buku Panduan Literasi & Keamanan Psikologis",
      bgClass: "bg-zone-psychology",
      icon: <BookOpen className="h-5 w-5 text-ink-charcoal" />,
    },
    "1B": {
      title: "Pos 1B · Artikel Stres, Burnout & Resolusi Konflik Kerja",
      subtitle:
        "Cozy Library Nook — Panduan Mengurai Kelelahan Kronis & Gesekan Tim",
      bgClass: "bg-zone-psychology",
      icon: <Flame className="h-5 w-5 text-ink-charcoal" />,
    },
    "1C": {
      title: "Pos 1C · Tips Meningkatkan Motivasi & Produktivitas Sehat",
      subtitle:
        "Cozy Library Nook — Papan Strategi Ritme Ultradian & Micro-Stepping",
      bgClass: "bg-zone-psychology",
      icon: <Timer className="h-5 w-5 text-ink-charcoal" />,
    },
    "2A": {
      title: "Pos 2A · Panduan Pernapasan Lotus 4-7-8 & Relaksasi",
      subtitle:
        "Zen Greenhouse Patio — Regulasi Sistem Saraf Parasimpatik Terpandu",
      bgClass: "bg-zone-selfcare",
      icon: <HeartPulse className="h-5 w-5 text-ink-charcoal" />,
    },
    "2B": {
      title: "Pos 2B · Roda Regulasi Emosi & Asesmen Beban Stres",
      subtitle:
        "Zen Greenhouse Patio — Pemetaan Emosi Kerja & Langkah Grounding AI",
      bgClass: "bg-zone-selfcare",
      icon: <Sparkles className="h-5 w-5 text-ink-charcoal" />,
    },
    "2C": {
      title: "Pos 2C · Ritual Teh, Bonsai & Kebiasaan Self-Care Harian",
      subtitle:
        "Zen Greenhouse Patio — Daftar Kebiasaan Mikro Pemulihan Energi Kerja",
      bgClass: "bg-zone-selfcare",
      icon: <Coffee className="h-5 w-5 text-ink-charcoal" />,
    },
    "3A": {
      title: "Pos 3A · Formulir Penyampaian Keluhan Secara Anonim",
      subtitle:
        "Treehouse Post Office — Redaksi PII Otomatis & Pelacakan Kode Resi (SV-XXXX)",
      bgClass: "bg-zone-voice",
      icon: <Lock className="h-5 w-5 text-ink-charcoal" />,
    },
    "3B": {
      title: "Pos 3B · Papan Kritik, Saran & Dinding Aspirasi Publik",
      subtitle:
        "Treehouse Post Office — Ruang Masukan Konstruktif & Tindak Lanjut Manajemen",
      bgClass: "bg-zone-voice",
      icon: <MessageSquarePlus className="h-5 w-5 text-ink-charcoal" />,
    },
    "3C": {
      title: "Pos 3C · Evaluasi Tingkat Kenyamanan Lingkungan Kerja",
      subtitle:
        "Treehouse Post Office — Barometer 5 Ekspresi Kenyamanan Kerja & Indeks Divisi",
      bgClass: "bg-zone-voice",
      icon: <Gauge className="h-5 w-5 text-ink-charcoal" />,
    },
  };

  const cfg = headerConfig[stationCode];

  const articles1A = useMemo(
    () =>
      psychologyArticles.filter((a) => a.subCategory === "EDUKASI_MENTAL"),
    [psychologyArticles]
  );
  const articles1B = useMemo(
    () =>
      psychologyArticles.filter((a) => a.subCategory === "STRESS_BURNOUT"),
    [psychologyArticles]
  );
  const articles1C = useMemo(
    () =>
      psychologyArticles.filter((a) => a.subCategory === "MOTIVASI_PRODUKTIF"),
    [psychologyArticles]
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={cfg.title}
      onClick={onClose}
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-ink-charcoal/45 p-3 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="cartoon-panel flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden"
      >
        <div
          className={clsx(
            "flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-ink-charcoal px-5 py-3.5",
            cfg.bgClass
          )}
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink-charcoal bg-paper-cream">
              {cfg.icon}
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-ink-charcoal sm:text-lg">
                {cfg.title}
              </h2>
              <p className="text-xs font-bold text-ink-charcoal/80">
                {cfg.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cartoon-btn inline-flex items-center gap-1.5 rounded-xl bg-paper-cream px-3 py-1.5 text-xs font-bold text-ink-charcoal"
          >
            <X className="h-4 w-4" />
            <span>Tutup [Esc]</span>
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6">
          {stationCode === "1A" && (
            <IsolatedPsychologyScrapbook
              stationCode="1A"
              articles={articles1A}
            />
          )}
          {stationCode === "1B" && (
            <IsolatedPsychologyScrapbook
              stationCode="1B"
              articles={articles1B}
            />
          )}
          {stationCode === "1C" && (
            <IsolatedPsychologyScrapbook
              stationCode="1C"
              articles={articles1C}
            />
          )}

          {stationCode === "2A" && (
            <div className="mx-auto max-w-2xl">
              <BreathingVisualizer recommendedPattern="CALMING_4_7_8" />
            </div>
          )}

          {stationCode === "2B" && (
            <div className="mx-auto max-w-2xl">
              <EmotionRegulator />
            </div>
          )}

          {stationCode === "2C" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="cartoon-panel-aged space-y-3 p-5 lg:col-span-5">
                <span className="rounded-lg border-2 border-ink-charcoal bg-zone-selfcare px-2.5 py-0.5 font-hand text-sm font-bold text-ink-charcoal">
                  Panduan Ritual Baki Teh &amp; Bonsai
                </span>
                <h3 className="font-display text-base font-bold text-ink-charcoal">
                  3 Ritual Mikro Pemulihan Energi di Meja Kerja
                </h3>
                <ul className="space-y-2.5 text-xs font-semibold leading-relaxed text-ink-charcoal">
                  <li className="rounded-xl border-2 border-ink-charcoal bg-paper-cream p-3">
                    <strong>1. Ritual Seduh Hangat (2 Menit):</strong> Jauhkan
                    pandangan dari layar saat menyeduh teh/air hangat, rasakan
                    suhu cangkir untuk mengembalikan kesadaran sensorik.
                  </li>
                  <li className="rounded-xl border-2 border-ink-charcoal bg-paper-cream p-3">
                    <strong>2. Atensi Hijau Bonsai (60 Detik):</strong> Amati
                    detail dedaunan tanaman di meja kerja selama 60 detik untuk
                    merilekskan otot mata siliaris.
                  </li>
                  <li className="rounded-xl border-2 border-ink-charcoal bg-paper-cream p-3">
                    <strong>3. Peregangan Bahu &amp; Leher:</strong> Turunkan
                    bahu dari telinga dan lepaskan ketegangan rahang setiap
                    menyelesaikan satu quest di samping.
                  </li>
                </ul>
              </div>
              <div className="lg:col-span-7">
                <DailyQuestChecklist initialQuests={quests} />
              </div>
            </div>
          )}

          {stationCode === "3A" && (
            <IsolatedComplaintPostbox3A
              onVoiceEntryCreated={onVoiceEntryCreated}
            />
          )}

          {stationCode === "3B" && (
            <IsolatedCritiqueBoard3B
              entries={voiceEntries}
              onVoiceEntryCreated={onVoiceEntryCreated}
            />
          )}

          {stationCode === "3C" && (
            <IsolatedComfortMeter3C
              pulses={comfortPulses}
              onComfortPulseCreated={onComfortPulseCreated}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
