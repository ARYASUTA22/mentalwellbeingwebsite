"use server";

import { revalidatePath } from "next/cache";
import { getSafeEnv } from "@/env";
import { prisma, withDbTimeout } from "@/lib/prisma";
import {
  ensureSanctuarySeeded,
  getRuntimeSanctuaryStore,
  type PsychologySubCategoryLiteral,
  type ReviewStatusLiteral,
  type SerializedEmployeeVoiceEntry,
  type SerializedPsychologyArticle,
  type SerializedWorkComfortPulse,
} from "@/lib/seed";

export async function getAdminDashboardData(): Promise<{
  articles: SerializedPsychologyArticle[];
  voiceEntries: SerializedEmployeeVoiceEntry[];
  comfortPulses: SerializedWorkComfortPulse[];
}> {
  await ensureSanctuarySeeded();
  const env = getSafeEnv();

  if (env.hasDatabase) {
    try {
      const [articles, voiceEntries, comfortPulses] = await withDbTimeout(
        Promise.all([
          prisma.psychologyArticle.findMany({
            orderBy: { createdAt: "desc" },
          }),
          prisma.employeeVoiceEntry.findMany({
            orderBy: { createdAt: "desc" },
          }),
          prisma.workComfortPulse.findMany({
            orderBy: { createdAt: "desc" },
          }),
        ])
      );

      if (
        articles.length > 0 ||
        voiceEntries.length > 0 ||
        comfortPulses.length > 0
      ) {
        return {
          articles: articles.map((a) => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            subCategory: a.subCategory,
            summary: a.summary,
            content: a.content,
            actionTips: a.actionTips,
            readMinutes: a.readMinutes,
            published: a.published,
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
          })),
          voiceEntries: voiceEntries.map((v) => ({
            id: v.id,
            receiptCode: v.receiptCode,
            type: v.type,
            categoryTag: v.categoryTag,
            message: v.message,
            isPublicOnWall: v.isPublicOnWall,
            status: v.status,
            adminResponse: v.adminResponse,
            upvotes: v.upvotes,
            createdAt: v.createdAt.toISOString(),
            reviewedAt: v.reviewedAt ? v.reviewedAt.toISOString() : null,
          })),
          comfortPulses: comfortPulses.map((p) => ({
            id: p.id,
            overallComfort: p.overallComfort,
            workloadBalance: p.workloadBalance,
            psychologicalSafety: p.psychologicalSafety,
            teamSupport: p.teamSupport,
            departmentTag: p.departmentTag,
            environmentNote: p.environmentNote,
            createdAt: p.createdAt.toISOString(),
          })),
        };
      }
    } catch {
      // Fallback to runtime store below
    }
  }

  const store = getRuntimeSanctuaryStore();
  return {
    articles: [...store.psychologyArticles],
    voiceEntries: [...store.voiceEntries],
    comfortPulses: [...store.comfortPulses],
  };
}

/**
 * Updates an EmployeeVoiceEntry status, adminResponse, and isPublicOnWall flag from /admin.
 */
export async function updateVoiceEntryAdminAction(input: {
  id: string;
  status: ReviewStatusLiteral;
  adminResponse: string;
  isPublicOnWall: boolean;
}): Promise<
  | { ok: true; entry: SerializedEmployeeVoiceEntry }
  | { ok: false; error: string }
> {
  const nowIso = new Date().toISOString();
  const store = getRuntimeSanctuaryStore();
  let updatedEntry: SerializedEmployeeVoiceEntry | null = null;

  store.voiceEntries = store.voiceEntries.map((item) => {
    if (item.id === input.id) {
      updatedEntry = {
        ...item,
        status: input.status,
        adminResponse: input.adminResponse.trim() || null,
        isPublicOnWall: input.isPublicOnWall,
        reviewedAt: nowIso,
      };
      return updatedEntry;
    }
    return item;
  });

  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      const dbUpdated = await withDbTimeout(
        prisma.employeeVoiceEntry.update({
          where: { id: input.id },
          data: {
            status: input.status,
            adminResponse: input.adminResponse.trim() || null,
            isPublicOnWall: input.isPublicOnWall,
            reviewedAt: new Date(),
          },
        })
      );
      updatedEntry = {
        id: dbUpdated.id,
        receiptCode: dbUpdated.receiptCode,
        type: dbUpdated.type,
        categoryTag: dbUpdated.categoryTag,
        message: dbUpdated.message,
        isPublicOnWall: dbUpdated.isPublicOnWall,
        status: dbUpdated.status,
        adminResponse: dbUpdated.adminResponse,
        upvotes: dbUpdated.upvotes,
        createdAt: dbUpdated.createdAt.toISOString(),
        reviewedAt: dbUpdated.reviewedAt
          ? dbUpdated.reviewedAt.toISOString()
          : null,
      };
    } catch {
      // Keep runtime store update
    }
  }

  if (!updatedEntry) {
    return { ok: false, error: "Data aspirasi tidak ditemukan." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, entry: updatedEntry };
}

/**
 * Creates or updates a PsychologyArticle (1A: EDUKASI_MENTAL, 1B: STRESS_BURNOUT, 1C: MOTIVASI_PRODUKTIF) from /admin.
 */
export async function upsertPsychologyArticleAdminAction(input: {
  id?: string;
  title: string;
  slug?: string;
  subCategory: PsychologySubCategoryLiteral;
  summary: string;
  content: string;
  actionTips: string[];
  readMinutes: number;
  published: boolean;
}): Promise<
  | { ok: true; article: SerializedPsychologyArticle }
  | { ok: false; error: string }
> {
  const title = input.title.trim();
  const summary = input.summary.trim();
  const content = input.content.trim();
  if (!title || !summary || !content) {
    return {
      ok: false,
      error: "Judul, ringkasan, dan isi artikel wajib diisi.",
    };
  }

  const slug =
    (input.slug?.trim() || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `artikel-${Date.now()}`;

  const cleanTips = input.actionTips
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  const nowIso = new Date().toISOString();
  const store = getRuntimeSanctuaryStore();

  let savedArticle: SerializedPsychologyArticle = {
    id: input.id || `psy-${Date.now()}`,
    title,
    slug,
    subCategory: input.subCategory,
    summary,
    content,
    actionTips:
      cleanTips.length > 0
        ? cleanTips
        : ["Terapkan langkah reflektif ini dalam rutinitas kerja harian."],
    readMinutes: Math.max(1, Math.min(30, Number(input.readMinutes) || 4)),
    published: input.published,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  if (input.id) {
    store.psychologyArticles = store.psychologyArticles.map((item) => {
      if (item.id === input.id) {
        savedArticle = {
          ...savedArticle,
          id: item.id,
          createdAt: item.createdAt,
        };
        return savedArticle;
      }
      return item;
    });
  } else {
    store.psychologyArticles = [savedArticle, ...store.psychologyArticles];
  }

  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      if (input.id) {
        const updated = await withDbTimeout(
          prisma.psychologyArticle.update({
            where: { id: input.id },
            data: {
              title: savedArticle.title,
              slug: savedArticle.slug,
              subCategory: savedArticle.subCategory,
              summary: savedArticle.summary,
              content: savedArticle.content,
              actionTips: savedArticle.actionTips,
              readMinutes: savedArticle.readMinutes,
              published: savedArticle.published,
            },
          })
        );
        savedArticle.id = updated.id;
      } else {
        const created = await withDbTimeout(
          prisma.psychologyArticle.create({
            data: {
              title: savedArticle.title,
              slug: savedArticle.slug,
              subCategory: savedArticle.subCategory,
              summary: savedArticle.summary,
              content: savedArticle.content,
              actionTips: savedArticle.actionTips,
              readMinutes: savedArticle.readMinutes,
              published: savedArticle.published,
            },
          })
        );
        savedArticle.id = created.id;
      }
    } catch {
      // Keep in runtime store
    }
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, article: savedArticle };
}

/**
 * Deletes a PsychologyArticle from /admin.
 */
export async function deletePsychologyArticleAdminAction(input: {
  id: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const store = getRuntimeSanctuaryStore();
  store.psychologyArticles = store.psychologyArticles.filter(
    (item) => item.id !== input.id
  );

  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      await withDbTimeout(
        prisma.psychologyArticle.delete({
          where: { id: input.id },
        })
      );
    } catch {
      // Already removed from runtime store
    }
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}
