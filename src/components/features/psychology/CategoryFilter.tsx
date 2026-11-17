"use client";

import React from "react";
import { Search } from "lucide-react";
import {
  ARTICLE_CATEGORIES,
  type ArticleCategory,
} from "@/lib/validations/psychology";
import { clsx } from "clsx";

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  ALL: "All Clippings",
  BURNOUT: "Burnout",
  PRODUCTIVITY: "Productivity",
  BOUNDARIES: "Boundaries",
  FOCUS: "Deep Focus",
};

const STICKY_ROTATIONS: Record<ArticleCategory, string> = {
  ALL: "-rotate-1",
  BURNOUT: "rotate-1",
  PRODUCTIVITY: "-rotate-2",
  BOUNDARIES: "rotate-1",
  FOCUS: "-rotate-1",
};

interface CategoryFilterProps {
  selected: ArticleCategory;
  onSelect: (category: ArticleCategory) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function CategoryFilter({
  selected,
  onSelect,
  searchQuery,
  onSearchChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      {/* Sticky-Note Bookmark Tabs */}
      <div className="flex flex-wrap items-end gap-2 pt-1">
        {ARTICLE_CATEGORIES.map((category) => {
          const isActive = selected === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelect(category)}
              className={clsx(
                "cartoon-btn relative rounded-t-xl rounded-b-md px-3.5 py-2 font-hand text-base font-bold tracking-wide transition-transform",
                STICKY_ROTATIONS[category],
                isActive
                  ? "-translate-y-1 bg-zone-psychology text-ink-charcoal"
                  : "bg-paper-aged text-ink-muted hover:-translate-y-0.5 hover:bg-paper-cream hover:text-ink-charcoal"
              )}
            >
              {/* Sticky-note top tape strip */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-1.5 left-1/2 h-2.5 w-8 -translate-x-1/2 border border-ink-charcoal/40 bg-paper-cream/85"
              />
              {CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>

      <div className="relative w-full md:w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search scrapbook notes..."
          aria-label="Search psychology guides"
          className="w-full rounded-xl border-[3px] border-ink-charcoal bg-paper-cream py-2 pl-9 pr-3 font-hand text-base font-bold text-ink-charcoal placeholder:text-ink-muted focus:outline-none"
        />
      </div>
    </div>
  );
}
