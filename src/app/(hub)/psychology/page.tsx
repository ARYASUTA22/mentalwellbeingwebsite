import { Brain } from "lucide-react";
import { getPsychologyArticles } from "@/actions/psychology";
import { ArticleReader } from "@/components/features/psychology/ArticleReader";
import { HudCard } from "@/components/hud/HudCard";

export const dynamic = "force-dynamic";

export default async function PsychologyPage({
  searchParams,
}: {
  searchParams: Promise<{ article?: string }>;
}) {
  const params = await searchParams;
  const articles = await getPsychologyArticles();

  return (
    <div className="pointer-events-auto space-y-6">
      <HudCard
        tone="psych"
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-[3px] border-ink-charcoal bg-zone-psychology text-ink-charcoal shadow-cartoon-sm">
            <Brain className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-lg font-bold text-ink-charcoal sm:text-xl">
              Zone 1 · Psychology Corner
            </h1>
            <p className="text-xs font-semibold text-ink-muted">
              Cognitive ergonomics, burnout early-warning guides, and
              sustainable focus protocols
            </p>
          </div>
        </div>
      </HudCard>

      <ArticleReader
        initialArticles={articles}
        initialSlug={params.article}
      />
    </div>
  );
}
