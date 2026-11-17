"use client";

import React from "react";
import { BookOpen, X } from "lucide-react";
import { motion } from "framer-motion";
import { ArticleReader } from "@/components/features/psychology/ArticleReader";
import type { SerializedArticle } from "@/lib/validations/psychology";

interface PsychologyScrapbookProps {
  articles: SerializedArticle[];
  onClose: () => void;
}

export function PsychologyScrapbook({
  articles,
  onClose,
}: PsychologyScrapbookProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cozy Library Nook — Psychology Scrapbook"
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-ink-charcoal bg-zone-psychology px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink-charcoal bg-paper-cream">
              <BookOpen className="h-5 w-5 text-ink-charcoal" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-ink-charcoal">
                Cozy Library Nook · Psychology Scrapbook
              </h2>
              <p className="text-xs font-bold text-ink-charcoal/80">
                Two-page open field journal with sticky-note tabs &amp;
                highlighter callouts
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

        <div className="overflow-y-auto p-4 sm:p-6">
          <ArticleReader initialArticles={articles} />
        </div>
      </motion.div>
    </div>
  );
}
