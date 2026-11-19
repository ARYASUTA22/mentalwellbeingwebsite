"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Eye,
  EyeOff,
  FilePlus2,
  Inbox,
  MessageSquareQuote,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  deletePsychologyArticleAdminAction,
  updateVoiceEntryAdminAction,
  upsertPsychologyArticleAdminAction,
} from "@/actions/admin";
import type {
  EmployeeVoiceEntryItem,
  PsychologyArticleItem,
  PsychologySubCategoryLiteral,
  ReviewStatusLiteral,
  WorkComfortPulseItem,
} from "@/lib/seed";
import { clsx } from "clsx";

interface AdminDashboardClientProps {
  initialArticles: PsychologyArticleItem[];
  initialVoiceEntries: EmployeeVoiceEntryItem[];
  initialComfortPulses: WorkComfortPulseItem[];
}

type AdminTab = "voice-moderation" | "comfort-analytics" | "articles-cms";

const SUB_CATEGORY_LABELS: Record<PsychologySubCategoryLiteral, string> = {
  EDUKASI_MENTAL: "1A · Edukasi Kesehatan Mental",
  STRESS_BURNOUT: "1B · Stres, Burnout & Konflik Kerja",
  MOTIVASI_PRODUKTIF: "1C · Tips Motivasi & Produktivitas",
};

const REVIEW_STATUS_LABELS: Record<ReviewStatusLiteral, string> = {
  PENDING: "PENDING (Menunggu Tinjauan)",
  UNDER_REVIEW: "UNDER_REVIEW (Sedang Ditinjau)",
  ACKNOWLEDGED: "ACKNOWLEDGED (Telah Direspons)",
  RESOLVED: "RESOLVED (Telah Ditindaklanjuti)",
};

export function AdminDashboardClient({
  initialArticles,
  initialVoiceEntries,
  initialComfortPulses,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("voice-moderation");
  const [articles, setArticles] =
    useState<PsychologyArticleItem[]>(initialArticles);
  const [voiceEntries, setVoiceEntries] =
    useState<EmployeeVoiceEntryItem[]>(initialVoiceEntries);
  const [comfortPulses] = useState<WorkComfortPulseItem[]>(initialComfortPulses);

  // Voice moderation state
  const [filterType, setFilterType] = useState<
    "ALL" | "COMPLAINT" | "CRITIQUE_SUGGESTION"
  >("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | ReviewStatusLiteral>(
    "ALL"
  );
  const [editingEntryId, setEditingEntryId] = useState<string | null>(
    initialVoiceEntries[0]?.id ?? null
  );
  const [draftStatus, setDraftStatus] = useState<ReviewStatusLiteral>(
    initialVoiceEntries[0]?.status ?? "PENDING"
  );
  const [draftResponse, setDraftResponse] = useState<string>(
    initialVoiceEntries[0]?.adminResponse ?? ""
  );
  const [draftPublic, setDraftPublic] = useState<boolean>(
    initialVoiceEntries[0]?.isPublicOnWall ?? true
  );
  const [moderationNotice, setModerationNotice] = useState<string | null>(null);

  // Article CMS state
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleTitle, setArticleTitle] = useState<string>("");
  const [articleSubCategory, setArticleSubCategory] =
    useState<PsychologySubCategoryLiteral>("EDUKASI_MENTAL");
  const [articleReadMinutes, setArticleReadMinutes] = useState<number>(4);
  const [articleSummary, setArticleSummary] = useState<string>("");
  const [articleContent, setArticleContent] = useState<string>("");
  const [articleTipsRaw, setArticleTipsRaw] = useState<string>("");
  const [articlePublished, setArticlePublished] = useState<boolean>(true);
  const [articleNotice, setArticleNotice] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const filteredVoiceEntries = useMemo(() => {
    return voiceEntries.filter((entry) => {
      if (filterType !== "ALL" && entry.type !== filterType) return false;
      if (filterStatus !== "ALL" && entry.status !== filterStatus) return false;
      return true;
    });
  }, [voiceEntries, filterType, filterStatus]);

  const selectedVoiceEntry = useMemo(
    () => voiceEntries.find((item) => item.id === editingEntryId) ?? null,
    [voiceEntries, editingEntryId]
  );

  const handleSelectVoiceEntry = (entry: EmployeeVoiceEntryItem) => {
    setEditingEntryId(entry.id);
    setDraftStatus(entry.status);
    setDraftResponse(entry.adminResponse ?? "");
    setDraftPublic(entry.isPublicOnWall);
    setModerationNotice(null);
  };

  const handleSaveModeration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoiceEntry) return;
    setModerationNotice(null);

    startTransition(async () => {
      const res = await updateVoiceEntryAdminAction({
        id: selectedVoiceEntry.id,
        status: draftStatus,
        adminResponse: draftResponse,
        isPublicOnWall: draftPublic,
      });

      if (res.ok) {
        setVoiceEntries((prev) =>
          prev.map((item) => (item.id === res.entry.id ? res.entry : item))
        );
        setModerationNotice(
          `Status & tanggapan resmi untuk resi ${res.entry.receiptCode} berhasil diperbarui.`
        );
      } else {
        setModerationNotice(res.error);
      }
    });
  };

  const handleStartNewArticle = () => {
    setEditingArticleId(null);
    setArticleTitle("");
    setArticleSubCategory("EDUKASI_MENTAL");
    setArticleReadMinutes(4);
    setArticleSummary("");
    setArticleContent("");
    setArticleTipsRaw("");
    setArticlePublished(true);
    setArticleNotice(null);
  };

  const handleSelectArticleForEdit = (article: PsychologyArticleItem) => {
    setEditingArticleId(article.id);
    setArticleTitle(article.title);
    setArticleSubCategory(article.subCategory);
    setArticleReadMinutes(article.readMinutes);
    setArticleSummary(article.summary);
    setArticleContent(article.content);
    setArticleTipsRaw(article.actionTips.join("\n"));
    setArticlePublished(article.published);
    setArticleNotice(null);
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    setArticleNotice(null);

    const tips = articleTipsRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    startTransition(async () => {
      const res = await upsertPsychologyArticleAdminAction({
        id: editingArticleId ?? undefined,
        title: articleTitle,
        subCategory: articleSubCategory,
        summary: articleSummary,
        content: articleContent,
        actionTips: tips,
        readMinutes: articleReadMinutes,
        published: articlePublished,
      });

      if (res.ok) {
        setArticles((prev) => {
          const exists = prev.some((a) => a.id === res.article.id);
          if (exists) {
            return prev.map((a) => (a.id === res.article.id ? res.article : a));
          }
          return [res.article, ...prev];
        });
        setEditingArticleId(res.article.id);
        setArticleNotice(
          `Artikel "${res.article.title}" (${SUB_CATEGORY_LABELS[res.article.subCategory]}) berhasil disimpan.`
        );
      } else {
        setArticleNotice(res.error);
      }
    });
  };

  const handleDeleteArticle = (id: string, title: string) => {
    setArticleNotice(null);
    startTransition(async () => {
      const res = await deletePsychologyArticleAdminAction({ id });
      if (res.ok) {
        setArticles((prev) => prev.filter((item) => item.id !== id));
        if (editingArticleId === id) {
          handleStartNewArticle();
        }
        setArticleNotice(`Artikel "${title}" telah dihapus.`);
      }
    });
  };

  // Comfort pulse aggregate analytics
  const pulseMetrics = useMemo(() => {
    const total = comfortPulses.length;
    if (total === 0) {
      return {
        total: 0,
        overall: 0,
        workload: 0,
        safety: 0,
        support: 0,
        composite: 0,
        byDept: [] as Array<{ dept: string; count: number; avg: number }>,
      };
    }

    const sumOverall = comfortPulses.reduce((acc, p) => acc + p.overallComfort, 0);
    const sumWorkload = comfortPulses.reduce((acc, p) => acc + p.workloadBalance, 0);
    const sumSafety = comfortPulses.reduce(
      (acc, p) => acc + p.psychologicalSafety,
      0
    );
    const sumSupport = comfortPulses.reduce((acc, p) => acc + p.teamSupport, 0);

    const overall = Number((sumOverall / total).toFixed(2));
    const workload = Number((sumWorkload / total).toFixed(2));
    const safety = Number((sumSafety / total).toFixed(2));
    const support = Number((sumSupport / total).toFixed(2));
    const composite = Number(
      ((overall + workload + safety + support) / 4).toFixed(2)
    );

    const deptMap = new Map<string, { sum: number; count: number }>();
    for (const p of comfortPulses) {
      const avgRow =
        (p.overallComfort +
          p.workloadBalance +
          p.psychologicalSafety +
          p.teamSupport) /
        4;
      const cur = deptMap.get(p.departmentTag) ?? { sum: 0, count: 0 };
      deptMap.set(p.departmentTag, {
        sum: cur.sum + avgRow,
        count: cur.count + 1,
      });
    }

    const byDept = Array.from(deptMap.entries()).map(([dept, val]) => ({
      dept,
      count: val.count,
      avg: Number((val.sum / val.count).toFixed(2)),
    }));

    return {
      total,
      overall,
      workload,
      safety,
      support,
      composite,
      byDept,
    };
  }, [comfortPulses]);

  const pendingVoiceCount = voiceEntries.filter(
    (e) => e.status === "PENDING" || e.status === "UNDER_REVIEW"
  ).length;

  return (
    <div className="pointer-events-auto space-y-6 pb-16">
      {/* Standalone Admin Top Clipboard Banner */}
      <header className="cartoon-panel overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-[3px] border-ink-charcoal bg-wood-warm px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-ink-charcoal bg-paper-cream shadow-cartoon-sm">
              <ShieldCheck className="h-6 w-6 text-ink-charcoal" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg border-2 border-ink-charcoal bg-zone-psychology px-2.5 py-0.5 font-display text-xs font-bold text-ink-charcoal">
                  STANDALONE PORTAL · /admin
                </span>
                <span className="font-hand text-sm font-bold text-ink-charcoal">
                  People &amp; Culture Sanctuary Steward
                </span>
              </div>
              <h1 className="font-display text-xl font-bold text-ink-charcoal sm:text-2xl">
                Panel Moderasi &amp; Analitik Kesejahteraan Kerja MindSanctuary
              </h1>
            </div>
          </div>

          <Link
            href="/"
            className="cartoon-btn inline-flex items-center gap-2 rounded-2xl bg-paper-cream px-4 py-2 text-xs font-bold text-ink-charcoal hover:bg-paper-aged"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Buka Peta 2D Karyawan</span>
          </Link>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-1 gap-3 bg-paper-aged/75 p-4 sm:grid-cols-3 sm:px-6">
          <div className="rounded-2xl border-2 border-ink-charcoal bg-paper-cream p-3.5 shadow-cartoon-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-muted">
                Kotak Aspirasi &amp; Keluhan (3A &amp; 3B)
              </span>
              <Inbox className="h-4 w-4 text-ink-charcoal" />
            </div>
            <p className="mt-1 font-display text-2xl font-bold text-ink-charcoal">
              {voiceEntries.length} Laporan{" "}
              <span className="font-hand text-sm text-ink-muted">
                ({pendingVoiceCount} perlu tindak lanjut)
              </span>
            </p>
          </div>

          <div className="rounded-2xl border-2 border-ink-charcoal bg-paper-cream p-3.5 shadow-cartoon-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-muted">
                Indeks Kenyamanan Kerja (3C Pulse)
              </span>
              <Activity className="h-4 w-4 text-ink-charcoal" />
            </div>
            <p className="mt-1 font-display text-2xl font-bold text-ink-charcoal">
              {pulseMetrics.composite} / 5.0{" "}
              <span className="font-hand text-sm text-ink-muted">
                ({pulseMetrics.total} evaluasi)
              </span>
            </p>
          </div>

          <div className="rounded-2xl border-2 border-ink-charcoal bg-paper-cream p-3.5 shadow-cartoon-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-muted">
                Pustaka Artikel Psikologi (1A, 1B, 1C)
              </span>
              <BookOpen className="h-4 w-4 text-ink-charcoal" />
            </div>
            <p className="mt-1 font-display text-2xl font-bold text-ink-charcoal">
              {articles.length} Artikel{" "}
              <span className="font-hand text-sm text-ink-muted">
                (3 Sub-Kategori)
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* Admin Section Switcher */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setActiveTab("voice-moderation")}
          className={clsx(
            "cartoon-btn inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 font-display text-xs font-bold text-ink-charcoal sm:text-sm",
            activeTab === "voice-moderation"
              ? "bg-zone-voice"
              : "bg-paper-cream hover:bg-paper-aged"
          )}
        >
          <MessageSquareQuote className="h-4 w-4" />
          <span>1. Moderasi Aspirasi (3A Keluhan &amp; 3B Kritik/Saran)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("comfort-analytics")}
          className={clsx(
            "cartoon-btn inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 font-display text-xs font-bold text-ink-charcoal sm:text-sm",
            activeTab === "comfort-analytics"
              ? "bg-zone-selfcare"
              : "bg-paper-cream hover:bg-paper-aged"
          )}
        >
          <Activity className="h-4 w-4" />
          <span>2. Analitik Kenyamanan Kerja (3C Pulse)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("articles-cms")}
          className={clsx(
            "cartoon-btn inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 font-display text-xs font-bold text-ink-charcoal sm:text-sm",
            activeTab === "articles-cms"
              ? "bg-zone-psychology"
              : "bg-paper-cream hover:bg-paper-aged"
          )}
        >
          <BookOpen className="h-4 w-4" />
          <span>3. Manajemen Artikel Psikologi (1A, 1B, 1C)</span>
        </button>
      </div>

      {/* TAB 1: VOICE MODERATION (3A & 3B) */}
      {activeTab === "voice-moderation" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left List */}
          <div className="cartoon-panel space-y-4 p-5 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-ink-charcoal">
                Daftar Masukan Anonim ({filteredVoiceEntries.length})
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter Tipe Masukan"
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(e.target.value as typeof filterType)
                  }
                  className="rounded-xl border-2 border-ink-charcoal bg-paper-aged px-2.5 py-1.5 text-xs font-bold text-ink-charcoal"
                >
                  <option value="ALL">Semua Kanal (3A &amp; 3B)</option>
                  <option value="COMPLAINT">3A · Keluhan Anonim</option>
                  <option value="CRITIQUE_SUGGESTION">
                    3B · Kritik &amp; Saran
                  </option>
                </select>

                <select
                  aria-label="Filter Status Tinjauan"
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as typeof filterStatus)
                  }
                  className="rounded-xl border-2 border-ink-charcoal bg-paper-aged px-2.5 py-1.5 text-xs font-bold text-ink-charcoal"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PENDING">PENDING</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
            </div>

            <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1">
              {filteredVoiceEntries.map((entry) => {
                const isSelected = entry.id === editingEntryId;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => handleSelectVoiceEntry(entry)}
                    className={clsx(
                      "w-full rounded-2xl border-[3px] border-ink-charcoal p-4 text-left transition-all",
                      isSelected
                        ? "bg-zone-psychology/45 shadow-cartoon-sm"
                        : "bg-paper-cream hover:bg-paper-aged"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-lg border-2 border-ink-charcoal bg-paper-aged px-2 py-0.5 font-display text-xs font-bold text-ink-charcoal">
                          {entry.receiptCode}
                        </span>
                        <span
                          className={clsx(
                            "rounded-lg border-2 border-ink-charcoal px-2 py-0.5 text-[11px] font-bold text-ink-charcoal",
                            entry.type === "COMPLAINT"
                              ? "bg-zone-voice"
                              : "bg-zone-psychology"
                          )}
                        >
                          {entry.type === "COMPLAINT"
                            ? "3A · Keluhan"
                            : "3B · Kritik & Saran"}
                        </span>
                        <span className="rounded-lg border-2 border-ink-charcoal bg-paper-cream px-2 py-0.5 text-[11px] font-bold text-ink-charcoal">
                          {entry.categoryTag}
                        </span>
                      </div>

                      <span
                        className={clsx(
                          "rounded-lg border-2 border-ink-charcoal px-2 py-0.5 font-hand text-xs font-bold text-ink-charcoal",
                          entry.status === "RESOLVED" ||
                            entry.status === "ACKNOWLEDGED"
                            ? "bg-zone-selfcare"
                            : "bg-zone-psychology"
                        )}
                      >
                        {entry.status}
                      </span>
                    </div>

                    <p className="mt-2.5 line-clamp-2 text-xs font-semibold leading-relaxed text-ink-charcoal">
                      &ldquo;{entry.message}&rdquo;
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-ink-muted">
                      <span>
                        {entry.isPublicOnWall
                          ? "Tampil di Papan Publik 3B"
                          : "Privat (Hanya lacak via Resi 3A)"}
                      </span>
                      <span>Dukungan: {entry.upvotes}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Moderation Editor */}
          <div className="cartoon-panel p-5 lg:col-span-5">
            {selectedVoiceEntry ? (
              <form onSubmit={handleSaveModeration} className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-ink-charcoal/20 pb-3">
                  <div>
                    <span className="font-hand text-xs font-bold text-ink-muted">
                      Tindak Lanjut Resi Anonim
                    </span>
                    <h3 className="font-display text-lg font-bold text-ink-charcoal">
                      Kode Resi: {selectedVoiceEntry.receiptCode}
                    </h3>
                  </div>
                  <span className="rounded-xl border-2 border-ink-charcoal bg-paper-aged px-3 py-1 text-xs font-bold text-ink-charcoal">
                    {selectedVoiceEntry.categoryTag}
                  </span>
                </div>

                <div className="rounded-2xl border-2 border-ink-charcoal bg-paper-aged p-3.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    Pesan Karyawan (Telah Disensor PII):
                  </span>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-ink-charcoal">
                    &ldquo;{selectedVoiceEntry.message}&rdquo;
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink-charcoal">
                    Status Tinjauan HR / People &amp; Culture
                  </label>
                  <select
                    value={draftStatus}
                    onChange={(e) =>
                      setDraftStatus(e.target.value as ReviewStatusLiteral)
                    }
                    className="w-full rounded-xl border-[3px] border-ink-charcoal bg-paper-cream px-3 py-2 text-xs font-bold text-ink-charcoal"
                  >
                    {(
                      Object.keys(REVIEW_STATUS_LABELS) as ReviewStatusLiteral[]
                    ).map((st) => (
                      <option key={st} value={st}>
                        {REVIEW_STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink-charcoal">
                    Tanggapan Resmi Manajemen / Tindakan Konkret
                  </label>
                  <textarea
                    rows={4}
                    value={draftResponse}
                    onChange={(e) => setDraftResponse(e.target.value)}
                    placeholder="Tuliskan langkah tindak lanjut nyata agar karyawan dapat melacak progres melalui kode resi..."
                    className="w-full rounded-2xl border-[3px] border-ink-charcoal bg-paper-cream p-3 text-xs font-semibold text-ink-charcoal placeholder:text-ink-muted focus:outline-none"
                  />
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-ink-charcoal bg-paper-aged px-3.5 py-2.5 text-xs font-bold text-ink-charcoal">
                  <span className="flex items-center gap-2">
                    {draftPublic ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                    <span>Tampilkan pada Papan Aspirasi Publik (Pos 3B)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={draftPublic}
                    onChange={(e) => setDraftPublic(e.target.checked)}
                    className="h-4 w-4 accent-ink-charcoal"
                  />
                </label>

                {moderationNotice && (
                  <div className="flex items-center gap-2 rounded-xl border-2 border-ink-charcoal bg-zone-selfcare px-3 py-2 text-xs font-bold text-ink-charcoal">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{moderationNotice}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="cartoon-btn flex w-full items-center justify-center gap-2 rounded-2xl bg-zone-selfcare px-4 py-2.5 font-display text-xs font-bold text-ink-charcoal sm:text-sm"
                >
                  <Save className="h-4 w-4" />
                  <span>
                    {isPending
                      ? "Menyimpan..."
                      : "Simpan Status & Tanggapan Resmi"}
                  </span>
                </button>
              </form>
            ) : (
              <p className="py-12 text-center text-xs font-bold text-ink-muted">
                Pilih salah satu kartu masukan di sebelah kiri untuk meninjau.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WORK COMFORT ANALYTICS (3C) */}
      {activeTab === "comfort-analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="cartoon-panel p-4">
              <span className="text-xs font-bold text-ink-muted">
                1. Kenyamanan Umum
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-ink-charcoal">
                {pulseMetrics.overall} / 5.0
              </p>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full border-2 border-ink-charcoal bg-paper-aged">
                <div
                  style={{ width: `${(pulseMetrics.overall / 5) * 100}%` }}
                  className="h-full bg-zone-selfcare"
                />
              </div>
            </div>

            <div className="cartoon-panel p-4">
              <span className="text-xs font-bold text-ink-muted">
                2. Keseimbangan Beban Kerja
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-ink-charcoal">
                {pulseMetrics.workload} / 5.0
              </p>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full border-2 border-ink-charcoal bg-paper-aged">
                <div
                  style={{ width: `${(pulseMetrics.workload / 5) * 100}%` }}
                  className="h-full bg-zone-psychology"
                />
              </div>
            </div>

            <div className="cartoon-panel p-4">
              <span className="text-xs font-bold text-ink-muted">
                3. Keamanan Psikologis Tim
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-ink-charcoal">
                {pulseMetrics.safety} / 5.0
              </p>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full border-2 border-ink-charcoal bg-paper-aged">
                <div
                  style={{ width: `${(pulseMetrics.safety / 5) * 100}%` }}
                  className="h-full bg-zone-selfcare"
                />
              </div>
            </div>

            <div className="cartoon-panel p-4">
              <span className="text-xs font-bold text-ink-muted">
                4. Dukungan Rekan &amp; Manajer
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-ink-charcoal">
                {pulseMetrics.support} / 5.0
              </p>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full border-2 border-ink-charcoal bg-paper-aged">
                <div
                  style={{ width: `${(pulseMetrics.support / 5) * 100}%` }}
                  className="h-full bg-zone-voice"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Department Breakdown */}
            <div className="cartoon-panel space-y-3 p-5 lg:col-span-5">
              <h2 className="font-display text-base font-bold text-ink-charcoal">
                Rata-Rata Indeks per Departemen
              </h2>
              <div className="space-y-2.5">
                {pulseMetrics.byDept.map((row) => (
                  <div
                    key={row.dept}
                    className="rounded-xl border-2 border-ink-charcoal bg-paper-aged p-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-ink-charcoal">
                      <span>{row.dept}</span>
                      <span>
                        {row.avg} / 5.0 ({row.count} respons)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full border border-ink-charcoal bg-paper-cream">
                      <div
                        style={{ width: `${(row.avg / 5) * 100}%` }}
                        className="h-full bg-zone-selfcare"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Environment Notes */}
            <div className="cartoon-panel space-y-3 p-5 lg:col-span-7">
              <h2 className="font-display text-base font-bold text-ink-charcoal">
                Log Evaluasi &amp; Catatan Lingkungan Kerja Terbaru (Pos 3C)
              </h2>
              <div className="max-h-96 space-y-2.5 overflow-y-auto pr-1">
                {comfortPulses.map((pulse) => (
                  <div
                    key={pulse.id}
                    className="rounded-2xl border-2 border-ink-charcoal bg-paper-cream p-3.5 shadow-cartoon-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-lg border-2 border-ink-charcoal bg-zone-selfcare px-2.5 py-0.5 font-display text-xs font-bold text-ink-charcoal">
                        Divisi: {pulse.departmentTag}
                      </span>
                      <div className="flex flex-wrap gap-1.5 font-hand text-xs font-bold text-ink-charcoal">
                        <span>Nyaman: {pulse.overallComfort}/5</span>
                        <span>·</span>
                        <span>Beban: {pulse.workloadBalance}/5</span>
                        <span>·</span>
                        <span>Aman: {pulse.psychologicalSafety}/5</span>
                        <span>·</span>
                        <span>Tim: {pulse.teamSupport}/5</span>
                      </div>
                    </div>
                    {pulse.environmentNote && (
                      <p className="mt-2 text-xs font-semibold leading-relaxed text-ink-charcoal">
                        &ldquo;{pulse.environmentNote}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PSYCHOLOGY ARTICLES CMS (1A, 1B, 1C) */}
      {activeTab === "articles-cms" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Article List */}
          <div className="cartoon-panel space-y-4 p-5 lg:col-span-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-ink-charcoal">
                Daftar Artikel Psikologi ({articles.length})
              </h2>
              <button
                type="button"
                onClick={handleStartNewArticle}
                className="cartoon-btn inline-flex items-center gap-1.5 rounded-xl bg-zone-psychology px-3 py-1.5 text-xs font-bold text-ink-charcoal"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tulis Artikel Baru</span>
              </button>
            </div>

            <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1">
              {articles.map((article) => {
                const isSelected = editingArticleId === article.id;
                return (
                  <div
                    key={article.id}
                    className={clsx(
                      "rounded-2xl border-[3px] border-ink-charcoal p-4 transition-all",
                      isSelected ? "bg-zone-psychology/45" : "bg-paper-cream"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block rounded-lg border-2 border-ink-charcoal bg-paper-aged px-2 py-0.5 font-hand text-xs font-bold text-ink-charcoal">
                          {SUB_CATEGORY_LABELS[article.subCategory]}
                        </span>
                        <h3 className="mt-1.5 font-display text-sm font-bold text-ink-charcoal">
                          {article.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSelectArticleForEdit(article)}
                          className="cartoon-btn rounded-lg bg-paper-aged p-1.5 text-ink-charcoal hover:bg-zone-selfcare"
                          title="Edit Artikel"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteArticle(article.id, article.title)
                          }
                          className="cartoon-btn rounded-lg bg-zone-voice/60 p-1.5 text-ink-charcoal hover:bg-zone-voice"
                          title="Hapus Artikel"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs font-semibold text-ink-muted">
                      {article.summary}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Article Create/Edit Form */}
          <div className="cartoon-panel p-5 lg:col-span-6">
            <form onSubmit={handleSaveArticle} className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-ink-charcoal/20 pb-3">
                <div className="flex items-center gap-2">
                  <FilePlus2 className="h-5 w-5 text-ink-charcoal" />
                  <h3 className="font-display text-base font-bold text-ink-charcoal">
                    {editingArticleId
                      ? "Edit Artikel Psikologi"
                      : "Tambah Artikel Baru (1A / 1B / 1C)"}
                  </h3>
                </div>
                {editingArticleId && (
                  <button
                    type="button"
                    onClick={handleStartNewArticle}
                    className="text-xs font-bold underline text-ink-muted hover:text-ink-charcoal"
                  >
                    Reset Form
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-ink-charcoal">
                    Sub-Kategori Stasiun (1A, 1B, 1C)
                  </label>
                  <select
                    value={articleSubCategory}
                    onChange={(e) =>
                      setArticleSubCategory(
                        e.target.value as PsychologySubCategoryLiteral
                      )
                    }
                    className="w-full rounded-xl border-[3px] border-ink-charcoal bg-paper-cream px-3 py-2 text-xs font-bold text-ink-charcoal"
                  >
                    <option value="EDUKASI_MENTAL">
                      1A · Edukasi Kesehatan Mental
                    </option>
                    <option value="STRESS_BURNOUT">
                      1B · Stres, Burnout &amp; Konflik Kerja
                    </option>
                    <option value="MOTIVASI_PRODUKTIF">
                      1C · Motivasi &amp; Produktivitas
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-ink-charcoal">
                    Durasi Baca (Menit)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={articleReadMinutes}
                    onChange={(e) =>
                      setArticleReadMinutes(Number(e.target.value))
                    }
                    className="w-full rounded-xl border-[3px] border-ink-charcoal bg-paper-cream px-3 py-2 text-xs font-bold text-ink-charcoal"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-ink-charcoal">
                  Judul Artikel
                </label>
                <input
                  type="text"
                  required
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  placeholder="Contoh: Mengenali Sinyal Burnout Sebelum Terlambat..."
                  className="w-full rounded-xl border-[3px] border-ink-charcoal bg-paper-cream px-3 py-2 text-xs font-semibold text-ink-charcoal"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-ink-charcoal">
                  Ringkasan Singkat (Summary)
                </label>
                <input
                  type="text"
                  required
                  value={articleSummary}
                  onChange={(e) => setArticleSummary(e.target.value)}
                  placeholder="Satu kalimat inti untuk kartu daftar artikel..."
                  className="w-full rounded-xl border-[3px] border-ink-charcoal bg-paper-cream px-3 py-2 text-xs font-semibold text-ink-charcoal"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-ink-charcoal">
                  Isi Materi Lengkap (Pisahkan paragraf dengan baris kosong)
                </label>
                <textarea
                  rows={5}
                  required
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  placeholder="Tulis panduan psikologi kerja secara mendalam..."
                  className="w-full rounded-2xl border-[3px] border-ink-charcoal bg-paper-cream p-3 text-xs font-semibold text-ink-charcoal"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-ink-charcoal">
                  Langkah Praktis / Action Tips (Satu poin per baris)
                </label>
                <textarea
                  rows={3}
                  value={articleTipsRaw}
                  onChange={(e) => setArticleTipsRaw(e.target.value)}
                  placeholder={
                    "Matikan notifikasi di luar jam kerja\nLakukan jeda mikro 5 menit setiap 90 menit"
                  }
                  className="w-full rounded-2xl border-[3px] border-ink-charcoal bg-paper-cream p-3 text-xs font-semibold text-ink-charcoal"
                />
              </div>

              {articleNotice && (
                <div className="flex items-center gap-2 rounded-xl border-2 border-ink-charcoal bg-zone-selfcare px-3 py-2 text-xs font-bold text-ink-charcoal">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>{articleNotice}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="cartoon-btn flex w-full items-center justify-center gap-2 rounded-2xl bg-zone-psychology px-4 py-2.5 font-display text-xs font-bold text-ink-charcoal sm:text-sm"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span>
                  {isPending
                    ? "Menyimpan Artikel..."
                    : editingArticleId
                      ? "Simpan Perubahan Artikel"
                      : "Publikasikan Artikel Baru"}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
