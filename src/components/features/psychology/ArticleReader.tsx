"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock,
  Highlighter,
  Sparkles,
  Tag,
} from "lucide-react";
import { completeArticleReadingAction } from "@/actions/psychology";
import { CategoryFilter } from "@/components/features/psychology/CategoryFilter";
import { BurnoutGuideCard } from "@/components/features/psychology/BurnoutGuideCard";
import { useHud } from "@/components/hud/HudProvider";
import type {
  ArticleCategory,
  SerializedArticle,
} from "@/lib/validations/psychology";

interface ArticleReaderProps {
  initialArticles: SerializedArticle[];
  initialSlug?: string;
}

export function ArticleReader({
  initialArticles,
  initialSlug,
}: ArticleReaderProps) {
  const { addXp } = useHud();
  const [selectedCategory, setSelectedCategory] =
    useState<ArticleCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [completedSlugs, setCompletedSlugs] = useState<Record<string, boolean>>(
    {}
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return initialArticles.filter((article) => {
      const catMatch =
        selectedCategory === "ALL" || article.category === selectedCategory;
      const queryMatch =
        !query ||
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.tags.some((t) => t.toLowerCase().includes(query));
      return catMatch && queryMatch;
    });
  }, [initialArticles, selectedCategory, searchQuery]);

  const initialActive =
    initialArticles.find((a) => a.slug === initialSlug) ??
    initialArticles[0] ??
    null;

  const [activeArticle, setActiveArticle] = useState<SerializedArticle | null>(
    initialActive
  );

  const handleMarkCompleted = (article: SerializedArticle) => {
    if (completedSlugs[article.slug]) return;
    startTransition(async () => {
      const res = await completeArticleReadingAction({
        articleSlug: article.slug,
      });
      if (res.ok) {
        setCompletedSlugs((prev) => ({ ...prev, [article.slug]: true }));
        addXp(res.xpAwarded);
        setStatusMessage(
          `Field guide stamped in your scrapbook! +${res.xpAwarded} Wellness XP added.`
        );
      } else {
        setStatusMessage(res.error);
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* Protruding Sticky-Note Category Tabs */}
      <div className="px-2">
        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Two-Page Open Hardcover Scrapbook Spread */}
      <div className="rounded-3xl border-[4px] border-ink-charcoal bg-wood-warm p-2.5 shadow-cartoon sm:p-4">
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border-[3px] border-ink-charcoal bg-paper-cream lg:grid-cols-12">
          {/* LEFT PAGE: Scrapbook Index & Taped Clippings */}
          <div className="flex flex-col justify-between border-b-[3px] border-ink-charcoal bg-paper-aged/65 p-4 sm:p-6 lg:col-span-6 lg:border-b-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-dashed border-ink-charcoal/30 pb-2.5">
                <span className="inline-flex items-center gap-1.5 font-hand text-lg font-bold text-ink-charcoal">
                  <Bookmark className="h-4 w-4" />
                  Page I · Field Clippings ({filteredArticles.length})
                </span>
                <span className="font-hand text-sm font-bold text-ink-muted">
                  Dr. Maya Lin&apos;s Archive
                </span>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-ink-charcoal/40 bg-paper-cream p-6 text-center">
                  <p className="font-hand text-lg font-bold text-ink-muted">
                    No clippings matched your filter. Try clicking &ldquo;All
                    Clippings&rdquo; above!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {filteredArticles.map((article) => (
                    <BurnoutGuideCard
                      key={article.id}
                      article={article}
                      isSelected={activeArticle?.slug === article.slug}
                      isCompleted={Boolean(completedSlugs[article.slug])}
                      onSelect={setActiveArticle}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t-2 border-dashed border-ink-charcoal/25 pt-3 font-hand text-sm font-bold text-ink-muted">
              <span>MindSanctuary Field Journal</span>
              <span>Left Folio</span>
            </div>
          </div>

          {/* CENTER BINDER RINGS + RIGHT PAGE: Annotated Scrapbook Article */}
          <div className="relative flex flex-col justify-between bg-paper-cream p-4 sm:p-6 lg:col-span-6 lg:border-l-[3px] lg:border-ink-charcoal">
            {/* Decorative Center Spiral Binder Rings on Desktop */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-3.5 top-0 hidden h-full flex-col justify-evenly py-6 lg:flex"
            >
              {[0, 1, 2, 3, 4, 5].map((ring) => (
                <span
                  key={ring}
                  className="h-4 w-7 rounded-full border-[3px] border-ink-charcoal bg-paper-aged shadow-cartoon-sm"
                />
              ))}
            </div>

            {activeArticle ? (
              <div className="space-y-5 lg:pl-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-ink-charcoal/30 pb-3">
                  <span className="-rotate-1 rounded-lg border-2 border-ink-charcoal bg-zone-psychology px-3 py-0.5 font-hand text-base font-bold text-ink-charcoal shadow-cartoon-sm">
                    {activeArticle.category} NOTE
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-hand text-base font-bold text-ink-muted">
                    <Clock className="h-4 w-4 text-ink-charcoal" />
                    {activeArticle.readingTimeMin} min read
                  </span>
                </div>

                <div className="space-y-3">
                  <h2 className="font-display text-xl font-bold leading-snug text-ink-charcoal">
                    {activeArticle.title}
                  </h2>

                  {/* Warm Yellow Highlighter Callout Box */}
                  <div className="relative rounded-2xl border-2 border-ink-charcoal bg-zone-psychology/65 p-3.5 shadow-cartoon-sm">
                    <div className="mb-1 flex items-center gap-1.5 font-hand text-sm font-bold uppercase tracking-wider text-ink-charcoal">
                      <Highlighter className="h-3.5 w-3.5" />
                      <span>Highlighted Key Takeaway</span>
                    </div>
                    <p className="font-hand text-lg font-bold leading-snug text-ink-charcoal">
                      <mark className="rounded bg-zone-psychology px-1 text-ink-charcoal">
                        {activeArticle.summary}
                      </mark>
                    </p>
                  </div>
                </div>

                {/* Scrapbook Ruled Body Copy with Highlighter Spans */}
                <div className="space-y-3.5 text-sm leading-relaxed text-ink-charcoal">
                  {activeArticle.content.split("\n\n").map((paragraph, idx) => {
                    if (idx === 0) {
                      const dotIdx = paragraph.indexOf(".");
                      if (dotIdx > 0) {
                        const firstSentence = paragraph.slice(0, dotIdx + 1);
                        const rest = paragraph.slice(dotIdx + 1);
                        return (
                          <p key={idx}>
                            <mark className="rounded bg-zone-psychology/70 px-1 py-0.5 font-semibold text-ink-charcoal">
                              {firstSentence}
                            </mark>
                            {rest}
                          </p>
                        );
                      }
                    }
                    return <p key={idx}>{paragraph}</p>;
                  })}
                </div>

                {/* Taped Margin Tags */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeArticle.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-lg border-2 border-ink-charcoal bg-paper-aged px-2.5 py-0.5 font-hand text-sm font-bold text-ink-charcoal"
                    >
                      <Tag className="h-3 w-3 text-ink-charcoal" />
                      {tag}
                    </span>
                  ))}
                </div>

                {statusMessage && (
                  <div className="rounded-xl border-2 border-ink-charcoal bg-zone-selfcare/60 px-3 py-2 font-hand text-base font-bold text-ink-charcoal">
                    {statusMessage}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-ink-charcoal/30 pt-4">
                  <button
                    type="button"
                    disabled={
                      isPending || Boolean(completedSlugs[activeArticle.slug])
                    }
                    onClick={() => handleMarkCompleted(activeArticle)}
                    className="cartoon-btn inline-flex items-center gap-2 rounded-xl bg-zone-psychology px-4 py-2 text-xs font-bold text-ink-charcoal disabled:cursor-default disabled:opacity-65"
                  >
                    {completedSlugs[activeArticle.slug] ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-ink-charcoal" />
                        <span>Stamped in Scrapbook</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>
                          {isPending
                            ? "Stamping..."
                            : "Stamp as Read (+20 XP)"}
                        </span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/self-care"
                    className="tactile-press inline-flex items-center gap-1.5 font-hand text-base font-bold text-ink-charcoal underline decoration-2 underline-offset-4 hover:text-ink-muted"
                  >
                    <span>Practice in Zen Greenhouse</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between border-t-2 border-dashed border-ink-charcoal/25 pt-3 font-hand text-sm font-bold text-ink-muted lg:pl-2">
              <span>Highlighted Field Notes</span>
              <span>Right Folio</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
