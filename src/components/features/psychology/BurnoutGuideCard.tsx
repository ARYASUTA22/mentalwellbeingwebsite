"use client";

import React from "react";
import { CldImage } from "next-cloudinary";
import { BookOpen, Clock, Sparkles } from "lucide-react";
import type { SerializedArticle } from "@/lib/validations/psychology";
import { clsx } from "clsx";

interface BurnoutGuideCardProps {
  article: SerializedArticle;
  isSelected?: boolean;
  isCompleted?: boolean;
  onSelect: (article: SerializedArticle) => void;
}

const hasCloudinaryCloud = Boolean(
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
);

export function BurnoutGuideCard({
  article,
  isSelected = false,
  isCompleted = false,
  onSelect,
}: BurnoutGuideCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(article)}
      className="block w-full text-left focus:outline-none"
    >
      <div
        className={clsx(
          "cartoon-btn relative flex h-full flex-col justify-between gap-3 rounded-2xl p-4",
          isSelected
            ? "bg-zone-psychology/35 ring-2 ring-ink-charcoal"
            : "bg-paper-cream hover:bg-paper-aged"
        )}
      >
        {/* Masking tape corner accent */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 left-6 h-4 w-14 -rotate-3 border-2 border-ink-charcoal bg-zone-psychology/80"
        />

        <div className="space-y-2.5 pt-1">
          <div className="relative h-24 w-full overflow-hidden rounded-xl border-2 border-ink-charcoal bg-paper-aged">
            {hasCloudinaryCloud && article.coverPublicId ? (
              <CldImage
                src={article.coverPublicId}
                alt={article.title}
                width={640}
                height={320}
                crop="fill"
                format="auto"
                quality="auto"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col justify-between bg-zone-psychology/40 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="rounded-md border-2 border-ink-charcoal bg-paper-cream px-2 py-0.5 font-hand text-xs font-bold uppercase tracking-wider text-ink-charcoal">
                    {article.category}
                  </span>
                  {article.isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink-charcoal bg-zone-psychology px-2 py-0.5 text-[10px] font-bold text-ink-charcoal">
                      <Sparkles className="h-3 w-3" />
                      Key Note
                    </span>
                  )}
                </div>
                <BookOpen className="h-5 w-5 text-ink-charcoal" />
              </div>
            )}
          </div>

          <div>
            <h3 className="font-display text-sm font-bold leading-snug text-ink-charcoal">
              {article.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">
              <mark className="rounded bg-zone-psychology/65 px-1 text-ink-charcoal">
                {article.summary}
              </mark>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t-2 border-dashed border-ink-charcoal/25 pt-2.5 text-[11px] font-bold text-ink-muted">
          <span className="inline-flex items-center gap-1 font-hand text-sm text-ink-charcoal">
            <Clock className="h-3.5 w-3.5" />
            {article.readingTimeMin} min read
          </span>

          <span
            className={clsx(
              "rounded-full border-2 border-ink-charcoal px-2 py-0.5 font-hand text-xs font-bold text-ink-charcoal",
              isCompleted ? "bg-zone-selfcare" : "bg-paper-aged"
            )}
          >
            {isCompleted ? "Stamped (+20 XP)" : "Read Page →"}
          </span>
        </div>
      </div>
    </button>
  );
}
