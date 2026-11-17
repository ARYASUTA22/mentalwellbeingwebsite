"use server";

import { revalidatePath } from "next/cache";
import { getSafeEnv } from "@/env";
import { scrubVoiceText } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import {
  comfortEvalSchema,
  upvoteSubmissionSchema,
  voiceSubmissionInputSchema,
  type SerializedComfortEval,
  type SerializedVoiceSubmission,
} from "@/lib/validations/voice";

const FALLBACK_SUBMISSIONS: SerializedVoiceSubmission[] = [
  {
    id: "voice-1",
    submissionType: "FEEDBACK",
    category: "Workload & Burnout",
    originalRedacted: true,
    scrubbedContent:
      "Moving sprint retrospectives to async summaries on alternate weeks gave [Engineering Team] back 3 uninterrupted deep-work hours.",
    urgency: "LOW",
    sentiment: "CONSTRUCTIVE",
    redactedEntities: ["team name"],
    upvotes: 14,
    status: "ACKNOWLEDGED",
    createdAt: "2026-11-12T10:20:00.000Z",
  },
  {
    id: "voice-2",
    submissionType: "COMPLAINT",
    category: "Psychological Safety",
    originalRedacted: true,
    scrubbedContent:
      "After-hours Slack pings from [Lead] regarding non-urgent tickets make it difficult for junior members to log off without anxiety.",
    urgency: "HIGH",
    sentiment: "CONCERNED",
    redactedEntities: ["person name", "role"],
    upvotes: 19,
    status: "IN_REVIEW",
    createdAt: "2026-11-14T16:40:00.000Z",
  },
  {
    id: "voice-3",
    submissionType: "FEEDBACK",
    category: "Tooling & Environment",
    originalRedacted: true,
    scrubbedContent:
      "Adding quiet focus booths near [Floor Area] significantly improved concentration during incident post-mortems.",
    urgency: "LOW",
    sentiment: "CONSTRUCTIVE",
    redactedEntities: ["location"],
    upvotes: 9,
    status: "SUBMITTED",
    createdAt: "2026-11-15T13:10:00.000Z",
  },
];

const FALLBACK_EVALUATIONS: SerializedComfortEval[] = [
  {
    id: "eval-1",
    psychologicalSafety: 4,
    workloadBalance: 3,
    leadershipTrust: 4,
    environmentCalm: 4,
    optionalNote: "Focus blocks helped stabilize cognitive fatigue this week.",
    overallIndex: 3.75,
    createdAt: "2026-11-15T09:00:00.000Z",
  },
];

export async function getVoiceOverview(): Promise<{
  submissions: SerializedVoiceSubmission[];
  evaluations: SerializedComfortEval[];
  averageComfortIndex: number;
}> {
  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      const [submissions, evaluations] = await Promise.all([
        prisma.voiceSubmission.findMany({
          orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
          take: 20,
        }),
        prisma.comfortEvaluation.findMany({
          orderBy: { createdAt: "desc" },
          take: 15,
        }),
      ]);

      if (submissions.length > 0 || evaluations.length > 0) {
        const serializedSubs: SerializedVoiceSubmission[] =
          submissions.length > 0
            ? submissions.map((s) => ({
                id: s.id,
                submissionType: s.submissionType,
                category: s.category,
                originalRedacted: s.originalRedacted,
                scrubbedContent: s.scrubbedContent,
                urgency: s.urgency,
                sentiment: s.sentiment,
                redactedEntities: s.redactedEntities,
                upvotes: s.upvotes,
                status: s.status,
                createdAt: s.createdAt.toISOString(),
              }))
            : FALLBACK_SUBMISSIONS;

        const serializedEvals: SerializedComfortEval[] =
          evaluations.length > 0
            ? evaluations.map((e) => ({
                id: e.id,
                psychologicalSafety: e.psychologicalSafety,
                workloadBalance: e.workloadBalance,
                leadershipTrust: e.leadershipTrust,
                environmentCalm: e.environmentCalm,
                optionalNote: e.optionalNote,
                overallIndex: e.overallIndex,
                createdAt: e.createdAt.toISOString(),
              }))
            : FALLBACK_EVALUATIONS;

        const avg =
          serializedEvals.reduce((sum, item) => sum + item.overallIndex, 0) /
          serializedEvals.length;

        return {
          submissions: serializedSubs,
          evaluations: serializedEvals,
          averageComfortIndex: Number(avg.toFixed(2)),
        };
      }
    } catch {
      // Fallback gracefully below
    }
  }

  return {
    submissions: FALLBACK_SUBMISSIONS,
    evaluations: FALLBACK_EVALUATIONS,
    averageComfortIndex: 3.75,
  };
}

export async function submitVoiceAction(input: {
  submissionType: "COMPLAINT" | "FEEDBACK";
  category: string;
  rawContent: string;
  urgency?: "LOW" | "MEDIUM" | "HIGH";
}): Promise<
  | { ok: true; submission: SerializedVoiceSubmission }
  | { ok: false; error: string }
> {
  const parsed = voiceSubmissionInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid voice submission.",
    };
  }

  const scrubbed = await scrubVoiceText(parsed.data.rawContent);
  const effectiveUrgency =
    parsed.data.urgency === "HIGH" ? "HIGH" : scrubbed.suggestedUrgency;

  const fallbackRecord: SerializedVoiceSubmission = {
    id: `voice-${Date.now()}`,
    submissionType: parsed.data.submissionType,
    category: parsed.data.category,
    originalRedacted: true,
    scrubbedContent: scrubbed.scrubbedText,
    urgency: effectiveUrgency,
    sentiment: scrubbed.sentiment,
    redactedEntities: scrubbed.redactedEntities,
    upvotes: 1,
    status: "SUBMITTED",
    createdAt: new Date().toISOString(),
  };

  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      const created = await prisma.voiceSubmission.create({
        data: {
          submissionType: parsed.data.submissionType,
          category: parsed.data.category,
          originalRedacted: true,
          scrubbedContent: scrubbed.scrubbedText,
          urgency: effectiveUrgency,
          sentiment: scrubbed.sentiment,
          redactedEntities: scrubbed.redactedEntities,
          upvotes: 1,
          status: "SUBMITTED",
        },
      });

      revalidatePath("/employee-voice");
      return {
        ok: true,
        submission: {
          id: created.id,
          submissionType: created.submissionType,
          category: created.category,
          originalRedacted: created.originalRedacted,
          scrubbedContent: created.scrubbedContent,
          urgency: created.urgency,
          sentiment: created.sentiment,
          redactedEntities: created.redactedEntities,
          upvotes: created.upvotes,
          status: created.status,
          createdAt: created.createdAt.toISOString(),
        },
      };
    } catch {
      // Return scrubbed ephemeral record if DB is not connected
    }
  }

  revalidatePath("/employee-voice");
  return { ok: true, submission: fallbackRecord };
}

export async function upvoteVoiceSubmissionAction(input: {
  submissionId: string;
}): Promise<{ ok: true; upvotes: number } | { ok: false; error: string }> {
  const parsed = upvoteSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid submission ID." };
  }

  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      const updated = await prisma.voiceSubmission.update({
        where: { id: parsed.data.submissionId },
        data: { upvotes: { increment: 1 } },
      });
      revalidatePath("/employee-voice");
      return { ok: true, upvotes: updated.upvotes };
    } catch {
      // Fallback gracefully
    }
  }

  const match = FALLBACK_SUBMISSIONS.find(
    (s) => s.id === parsed.data.submissionId
  );
  return { ok: true, upvotes: (match?.upvotes ?? 0) + 1 };
}

export async function submitComfortEvalAction(input: {
  psychologicalSafety: number;
  workloadBalance: number;
  leadershipTrust: number;
  environmentCalm: number;
  optionalNote?: string;
}): Promise<
  { ok: true; evaluation: SerializedComfortEval } | { ok: false; error: string }
> {
  const parsed = comfortEvalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid survey ratings.",
    };
  }

  const overallIndex = Number(
    (
      (parsed.data.psychologicalSafety +
        parsed.data.workloadBalance +
        parsed.data.leadershipTrust +
        parsed.data.environmentCalm) /
      4
    ).toFixed(2)
  );

  const fallbackEval: SerializedComfortEval = {
    id: `eval-${Date.now()}`,
    ...parsed.data,
    optionalNote: parsed.data.optionalNote ?? null,
    overallIndex,
    createdAt: new Date().toISOString(),
  };

  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      const created = await prisma.comfortEvaluation.create({
        data: {
          psychologicalSafety: parsed.data.psychologicalSafety,
          workloadBalance: parsed.data.workloadBalance,
          leadershipTrust: parsed.data.leadershipTrust,
          environmentCalm: parsed.data.environmentCalm,
          optionalNote: parsed.data.optionalNote || null,
          overallIndex,
        },
      });
      revalidatePath("/employee-voice");
      revalidatePath("/");
      return {
        ok: true,
        evaluation: {
          id: created.id,
          psychologicalSafety: created.psychologicalSafety,
          workloadBalance: created.workloadBalance,
          leadershipTrust: created.leadershipTrust,
          environmentCalm: created.environmentCalm,
          optionalNote: created.optionalNote,
          overallIndex: created.overallIndex,
          createdAt: created.createdAt.toISOString(),
        },
      };
    } catch {
      // Fall through cleanly
    }
  }

  revalidatePath("/employee-voice");
  revalidatePath("/");
  return { ok: true, evaluation: fallbackEval };
}
