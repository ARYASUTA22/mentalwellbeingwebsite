"use server";

import { revalidatePath } from "next/cache";
import { getSafeEnv } from "@/env";
import { prisma } from "@/lib/prisma";
import {
  articleFilterSchema,
  completeReadingQuestSchema,
  type ArticleCategory,
  type SerializedArticle,
} from "@/lib/validations/psychology";

const FALLBACK_ARTICLES: SerializedArticle[] = [
  {
    id: "art-burnout-signals",
    slug: "early-burnout-warning-signals",
    title: "Decoding Early Burnout Signals Before Cognitive Exhaustion",
    summary:
      "Recognize subtle emotional detachment, cynicism, and decision fatigue weeks before acute workplace burnout sets in.",
    content: [
      "Workplace burnout rarely arrives overnight. In organizational psychology, chronic unmanaged workplace stress progresses across three measurable dimensions: emotional exhaustion, depersonalization, and reduced personal efficacy.",
      "Early neural fatigue often disguises itself as procrastination on simple tasks, heightened irritability during routine standups, or difficulty disconnecting after logging off.",
      "Practical intervention begins with micro-recovery loops: protecting 90-minute focus blocks without notification switching, auditing recurring low-leverage meetings, and pairing deep cognitive work with intentional 5-minute nervous-system resets in the Self-Care Corner.",
    ].join("\n\n"),
    category: "BURNOUT",
    readingTimeMin: 5,
    coverPublicId: "sanctuary/psych-burnout-signals",
    tags: ["Burnout Prevention", "Cognitive Load", "Recovery"],
    isFeatured: true,
    createdAt: "2026-10-12T09:00:00.000Z",
  },
  {
    id: "art-attention-residue",
    slug: "eliminating-attention-residue",
    title: "Eliminating Attention Residue in Async Engineering Teams",
    summary:
      "Research-backed protocols to stop context-switching tax and preserve deep problem-solving stamina.",
    content: [
      "Every time you glance at an urgent chat thread while drafting architecture specs, a cognitive shadow known as attention residue remains stuck on the previous thread for up to 20 minutes.",
      "High-performing sanctuary teams mitigate this by batching synchronous communication into predictable windows and documenting crisp async handoffs.",
      "Try establishing a clear 'Shutdown Ritual' at day's end: write tomorrow's first concrete micro-step on paper so your working memory stops rehearsing unfinished tasks overnight.",
    ].join("\n\n"),
    category: "PRODUCTIVITY",
    readingTimeMin: 4,
    coverPublicId: "sanctuary/psych-attention-residue",
    tags: ["Deep Work", "Async Culture", "Focus"],
    isFeatured: false,
    createdAt: "2026-10-18T11:30:00.000Z",
  },
  {
    id: "art-psychological-boundaries",
    slug: "healthy-digital-boundaries",
    title: "Sustainable Digital Boundaries Without Guilt",
    summary:
      "Frame workload capacity transparently with managers and peers while reinforcing mutual team trust.",
    content: [
      "Saying yes to every ad-hoc request erodes quality across all commitments. Healthy workplace boundaries act as reliability contracts rather than refusal.",
      "Use trade-off framing when capacity is constrained: 'I can deliver Feature A by Thursday at full rigor, or prioritize Request B first—which brings higher team impact right now?'",
      "Pair clear calendar buffers with explicit offline status cues so colleagues never have to guess your focus windows.",
    ].join("\n\n"),
    category: "BOUNDARIES",
    readingTimeMin: 4,
    coverPublicId: "sanctuary/psych-boundaries",
    tags: ["Communication", "Workload", "Trust"],
    isFeatured: false,
    createdAt: "2026-10-24T14:15:00.000Z",
  },
  {
    id: "art-ultradian-focus",
    slug: "ultradian-rhythm-pacing",
    title: "Aligning Deep Focus With Your 90-Minute Ultradian Rhythm",
    summary:
      "Work with biological energy peaks and troughs rather than forcing continuous 8-hour linear output.",
    content: [
      "Human alertness oscillates naturally in roughly 90-minute ultradian cycles followed by a 20-minute physiological dip.",
      "Pushing through the dip with extra caffeine yields diminishing returns and higher error rates. Stepping into a 4-minute coherent breathing cycle restores autonomic balance far faster.",
      "Map your most analytical tasks to your morning peak and reserve administrative triage for afternoon recovery valleys.",
    ].join("\n\n"),
    category: "FOCUS",
    readingTimeMin: 3,
    coverPublicId: "sanctuary/psych-ultradian",
    tags: ["Energy Management", "Chronobiology", "Calm"],
    isFeatured: false,
    createdAt: "2026-11-02T08:45:00.000Z",
  },
];

export async function getPsychologyArticles(rawFilter?: {
  category?: ArticleCategory;
  search?: string;
}): Promise<SerializedArticle[]> {
  const parsed = articleFilterSchema.safeParse(rawFilter ?? {});
  const filter = parsed.success
    ? parsed.data
    : { category: "ALL" as const, search: undefined };

  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      const records = await prisma.article.findMany({
        where: {
          ...(filter.category !== "ALL" ? { category: filter.category } : {}),
          ...(filter.search
            ? {
                OR: [
                  { title: { contains: filter.search, mode: "insensitive" } },
                  { summary: { contains: filter.search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      });

      if (records.length > 0) {
        return records.map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          summary: row.summary,
          content: row.content,
          category: row.category,
          readingTimeMin: row.readingTimeMin,
          coverPublicId: row.coverPublicId,
          tags: row.tags,
          isFeatured: row.isFeatured,
          createdAt: row.createdAt.toISOString(),
        }));
      }
    } catch {
      // Fall through cleanly to curated fallback catalog
    }
  }

  return FALLBACK_ARTICLES.filter((article) => {
    const matchesCategory =
      filter.category === "ALL" || article.category === filter.category;
    const query = filter.search?.trim().toLowerCase();
    const matchesSearch =
      !query ||
      article.title.toLowerCase().includes(query) ||
      article.summary.toLowerCase().includes(query) ||
      article.tags.some((tag) => tag.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });
}

export async function completeArticleReadingAction(input: {
  articleSlug: string;
}): Promise<{ ok: true; xpAwarded: number } | { ok: false; error: string }> {
  const parsed = completeReadingQuestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid article identifier." };
  }

  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      await prisma.selfCareSession.create({
        data: {
          sessionType: "PSYCHOLOGY_READ",
          moodLabel: parsed.data.articleSlug,
          durationSec: 120,
          cyclesCount: 1,
          xpEarned: 20,
        },
      });
    } catch {
      // Keep UX responsive even if DB is offline
    }
  }

  revalidatePath("/psychology");
  revalidatePath("/");
  return { ok: true, xpAwarded: 20 };
}
