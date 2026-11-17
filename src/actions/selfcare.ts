"use server";

import { revalidatePath } from "next/cache";
import { getSafeEnv } from "@/env";
import { generateWellnessRecommendation } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { getPsychologyArticles } from "@/actions/psychology";
import {
  breathingSessionSchema,
  emotionCheckinSchema,
  toggleQuestSchema,
  type AIWellnessRecommendation,
  type SerializedQuest,
  type SerializedSelfCareSession,
} from "@/lib/validations/selfcare";

const FALLBACK_QUESTS: SerializedQuest[] = [
  {
    id: "quest-coherent-breath",
    title: "2-Minute Coherent Breath Reset",
    description:
      "Complete 6 synchronized 0.25Hz breathing cycles in the Self-Care Orb.",
    xpReward: 30,
    zone: "SELF_CARE",
    isCompleted: false,
    completedAt: null,
  },
  {
    id: "quest-emotion-checkin",
    title: "Midday Emotional Pulse Check",
    description:
      "Log your current stress level and receive a tailored grounding action.",
    xpReward: 25,
    zone: "SELF_CARE",
    isCompleted: false,
    completedAt: null,
  },
  {
    id: "quest-burnout-guide",
    title: "Read One Psychology Field Guide",
    description:
      "Explore an article in Psychology Corner to strengthen burnout resilience.",
    xpReward: 20,
    zone: "PSYCHOLOGY",
    isCompleted: true,
    completedAt: "2026-11-16T09:15:00.000Z",
  },
  {
    id: "quest-voice-pulse",
    title: "Contribute to Workplace Comfort Pulse",
    description:
      "Submit your weekly comfort index rating in the Employee Voice sanctuary.",
    xpReward: 35,
    zone: "VOICE",
    isCompleted: false,
    completedAt: null,
  },
];

export async function getSelfCareOverview(): Promise<{
  quests: SerializedQuest[];
  recentSessions: SerializedSelfCareSession[];
  totalXp: number;
}> {
  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      const [quests, sessions] = await Promise.all([
        prisma.dailyQuest.findMany({ orderBy: { createdAt: "asc" } }),
        prisma.selfCareSession.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
      ]);

      if (quests.length > 0 || sessions.length > 0) {
        const serializedQuests: SerializedQuest[] =
          quests.length > 0
            ? quests.map((q) => ({
                id: q.id,
                title: q.title,
                description: q.description,
                xpReward: q.xpReward,
                zone: q.zone,
                isCompleted: q.isCompleted,
                completedAt: q.completedAt ? q.completedAt.toISOString() : null,
              }))
            : FALLBACK_QUESTS;

        const serializedSessions: SerializedSelfCareSession[] = sessions.map(
          (s) => ({
            id: s.id,
            sessionType: s.sessionType,
            moodLabel: s.moodLabel,
            stressLevel: s.stressLevel,
            durationSec: s.durationSec,
            cyclesCount: s.cyclesCount,
            aiTip: s.aiTip,
            xpEarned: s.xpEarned,
            createdAt: s.createdAt.toISOString(),
          })
        );

        const questXp = serializedQuests
          .filter((q) => q.isCompleted)
          .reduce((acc, q) => acc + q.xpReward, 0);
        const sessionXp = serializedSessions.reduce(
          (acc, s) => acc + s.xpEarned,
          0
        );

        return {
          quests: serializedQuests,
          recentSessions: serializedSessions,
          totalXp: 120 + questXp + sessionXp,
        };
      }
    } catch {
      // Fallback safely below
    }
  }

  return {
    quests: FALLBACK_QUESTS,
    recentSessions: [
      {
        id: "sess-demo-1",
        sessionType: "BREATHING",
        moodLabel: "Steady",
        stressLevel: 4,
        durationSec: 64,
        cyclesCount: 8,
        aiTip: "0.25Hz coherent breathing completed.",
        xpEarned: 30,
        createdAt: "2026-11-16T08:30:00.000Z",
      },
    ],
    totalXp: 170,
  };
}

export async function logBreathingSessionAction(input: {
  durationSec: number;
  cyclesCount: number;
}): Promise<{ ok: true; xpEarned: number } | { ok: false; error: string }> {
  const parsed = breathingSessionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid session data.",
    };
  }

  const xpEarned = Math.min(60, Math.max(15, parsed.data.cyclesCount * 5));
  const env = getSafeEnv();

  if (env.hasDatabase) {
    try {
      await prisma.selfCareSession.create({
        data: {
          sessionType: "BREATHING",
          durationSec: parsed.data.durationSec,
          cyclesCount: parsed.data.cyclesCount,
          xpEarned,
        },
      });
    } catch {
      // Allow UI completion smoothly when offline
    }
  }

  revalidatePath("/self-care");
  revalidatePath("/");
  return { ok: true, xpEarned };
}

export async function submitEmotionCheckinAction(input: {
  moodLabel: string;
  stressLevel: number;
  contextNote?: string;
}): Promise<
  | { ok: true; recommendation: AIWellnessRecommendation; xpEarned: number }
  | { ok: false; error: string }
> {
  const parsed = emotionCheckinSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid check-in input.",
    };
  }

  const articles = await getPsychologyArticles();
  const recommendation = await generateWellnessRecommendation({
    moodLabel: parsed.data.moodLabel,
    stressLevel: parsed.data.stressLevel,
    contextNote: parsed.data.contextNote,
    availableArticles: articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
    })),
  });

  const xpEarned = 25;
  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      await prisma.selfCareSession.create({
        data: {
          sessionType: "EMOTION_CHECKIN",
          moodLabel: parsed.data.moodLabel,
          stressLevel: parsed.data.stressLevel,
          aiTip: recommendation.groundingAction,
          xpEarned,
        },
      });
    } catch {
      // Allow graceful local preview
    }
  }

  revalidatePath("/self-care");
  revalidatePath("/");
  return { ok: true, recommendation, xpEarned };
}

export async function toggleDailyQuestAction(input: {
  questId: string;
  isCompleted: boolean;
}): Promise<{ ok: true; isCompleted: boolean } | { ok: false; error: string }> {
  const parsed = toggleQuestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid quest update." };
  }

  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      await prisma.dailyQuest.update({
        where: { id: parsed.data.questId },
        data: {
          isCompleted: parsed.data.isCompleted,
          completedAt: parsed.data.isCompleted ? new Date() : null,
        },
      });
    } catch {
      // Fallback quests are handled client-side if not stored in DB
    }
  }

  revalidatePath("/self-care");
  revalidatePath("/");
  return { ok: true, isCompleted: parsed.data.isCompleted };
}
