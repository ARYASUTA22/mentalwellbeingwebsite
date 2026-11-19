"use server";

import { revalidatePath } from "next/cache";
import { getSafeEnv } from "@/env";
import { scrubVoiceText } from "@/lib/ai";
import { prisma, withDbTimeout } from "@/lib/prisma";
import {
  ensureSanctuarySeeded,
  generateReceiptCode,
  getRuntimeSanctuaryStore,
  type SerializedEmployeeVoiceEntry,
  type SerializedWorkComfortPulse,
  type VoiceSubmissionTypeLiteral,
} from "@/lib/seed";
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

/**
 * Fetches EmployeeVoiceEntry (3A & 3B) and WorkComfortPulse (3C) records.
 */
export async function getEmployeeVoiceAndPulseData(): Promise<{
  entries: SerializedEmployeeVoiceEntry[];
  pulses: SerializedWorkComfortPulse[];
}> {
  await ensureSanctuarySeeded();
  const env = getSafeEnv();

  if (env.hasDatabase) {
    try {
      const [entries, pulses] = await withDbTimeout(
        Promise.all([
          prisma.employeeVoiceEntry.findMany({
            orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
            take: 40,
          }),
          prisma.workComfortPulse.findMany({
            orderBy: { createdAt: "desc" },
            take: 30,
          }),
        ])
      );

      if (entries.length > 0 || pulses.length > 0) {
        return {
          entries: entries.map((e) => ({
            id: e.id,
            receiptCode: e.receiptCode,
            type: e.type,
            categoryTag: e.categoryTag,
            message: e.message,
            isPublicOnWall: e.isPublicOnWall,
            status: e.status,
            adminResponse: e.adminResponse,
            upvotes: e.upvotes,
            createdAt: e.createdAt.toISOString(),
            reviewedAt: e.reviewedAt ? e.reviewedAt.toISOString() : null,
          })),
          pulses: pulses.map((p) => ({
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
    entries: [...store.voiceEntries],
    pulses: [...store.comfortPulses],
  };
}

/**
 * Station 3A & 3B: Submits an anonymous EmployeeVoiceEntry with AI PII scrubbing
 * and returns a unique receiptCode (e.g. "SV-4829") for anonymous status tracking.
 */
export async function submitEmployeeVoiceEntryAction(input: {
  type: VoiceSubmissionTypeLiteral;
  categoryTag: string;
  rawMessage: string;
  isPublicOnWall?: boolean;
}): Promise<
  | { ok: true; entry: SerializedEmployeeVoiceEntry }
  | { ok: false; error: string }
> {
  const trimmed = input.rawMessage.trim();
  if (trimmed.length < 10) {
    return {
      ok: false,
      error: "Mohon tulis pesan minimal 10 karakter sebelum mengirim.",
    };
  }

  const scrubbed = await scrubVoiceText(trimmed);
  const receiptCode = generateReceiptCode();
  const isPublic = input.isPublicOnWall ?? true;
  const nowIso = new Date().toISOString();

  const newEntry: SerializedEmployeeVoiceEntry = {
    id: `ev-${Date.now()}`,
    receiptCode,
    type: input.type,
    categoryTag: input.categoryTag || "Umum",
    message: scrubbed.scrubbedText,
    isPublicOnWall: isPublic,
    status: "PENDING",
    adminResponse: null,
    upvotes: 1,
    createdAt: nowIso,
    reviewedAt: null,
  };

  const store = getRuntimeSanctuaryStore();
  store.voiceEntries = [newEntry, ...store.voiceEntries];

  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      const created = await withDbTimeout(
        prisma.employeeVoiceEntry.create({
          data: {
            receiptCode,
            type: input.type,
            categoryTag: newEntry.categoryTag,
            message: scrubbed.scrubbedText,
            isPublicOnWall: isPublic,
            status: "PENDING",
            upvotes: 1,
          },
        })
      );
      newEntry.id = created.id;
    } catch {
      // Keep entry in runtime store if remote DB is offline
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, entry: newEntry };
}

/**
 * Station 3A: Looks up an anonymous submission's status & admin response by receiptCode (e.g. "SV-4829").
 */
export async function lookupReceiptCodeAction(receiptCode: string): Promise<
  | { ok: true; entry: SerializedEmployeeVoiceEntry }
  | { ok: false; error: string }
> {
  const code = receiptCode.trim().toUpperCase();
  if (!code) {
    return { ok: false, error: "Masukkan kode resi (contoh: SV-4829)." };
  }

  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      const found = await withDbTimeout(
        prisma.employeeVoiceEntry.findUnique({
          where: { receiptCode: code },
        })
      );
      if (found) {
        return {
          ok: true,
          entry: {
            id: found.id,
            receiptCode: found.receiptCode,
            type: found.type,
            categoryTag: found.categoryTag,
            message: found.message,
            isPublicOnWall: found.isPublicOnWall,
            status: found.status,
            adminResponse: found.adminResponse,
            upvotes: found.upvotes,
            createdAt: found.createdAt.toISOString(),
            reviewedAt: found.reviewedAt
              ? found.reviewedAt.toISOString()
              : null,
          },
        };
      }
    } catch {
      // Search runtime store below
    }
  }

  const store = getRuntimeSanctuaryStore();
  const match = store.voiceEntries.find(
    (item) => item.receiptCode.toUpperCase() === code
  );
  if (!match) {
    return {
      ok: false,
      error: `Kode resi "${code}" tidak ditemukan. Pastikan format seperti SV-4829.`,
    };
  }
  return { ok: true, entry: match };
}

/**
 * Station 3B: Upvotes an EmployeeVoiceEntry on the public aspiration wall.
 */
export async function upvoteEmployeeVoiceEntryAction(input: {
  entryId: string;
}): Promise<{ ok: true; upvotes: number } | { ok: false; error: string }> {
  const store = getRuntimeSanctuaryStore();
  let updatedVotes = 1;
  store.voiceEntries = store.voiceEntries.map((item) => {
    if (item.id === input.entryId) {
      updatedVotes = item.upvotes + 1;
      return { ...item, upvotes: updatedVotes };
    }
    return item;
  });

  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      const updated = await withDbTimeout(
        prisma.employeeVoiceEntry.update({
          where: { id: input.entryId },
          data: { upvotes: { increment: 1 } },
        })
      );
      updatedVotes = updated.upvotes;
    } catch {
      // Use runtime store count
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, upvotes: updatedVotes };
}

/**
 * Station 3C: Submits a WorkComfortPulse evaluation.
 */
export async function submitWorkComfortPulseAction(input: {
  overallComfort: number;
  workloadBalance: number;
  psychologicalSafety: number;
  teamSupport: number;
  departmentTag: string;
  environmentNote?: string;
}): Promise<
  | { ok: true; pulse: SerializedWorkComfortPulse }
  | { ok: false; error: string }
> {
  const clamp5 = (n: number) => Math.max(1, Math.min(5, Math.round(n)));
  const newPulse: SerializedWorkComfortPulse = {
    id: `wcp-${Date.now()}`,
    overallComfort: clamp5(input.overallComfort),
    workloadBalance: clamp5(input.workloadBalance),
    psychologicalSafety: clamp5(input.psychologicalSafety),
    teamSupport: clamp5(input.teamSupport),
    departmentTag: input.departmentTag.trim() || "Umum",
    environmentNote: input.environmentNote?.trim() || null,
    createdAt: new Date().toISOString(),
  };

  const store = getRuntimeSanctuaryStore();
  store.comfortPulses = [newPulse, ...store.comfortPulses];

  const env = getSafeEnv();
  if (env.hasDatabase) {
    try {
      const created = await withDbTimeout(
        prisma.workComfortPulse.create({
          data: {
            overallComfort: newPulse.overallComfort,
            workloadBalance: newPulse.workloadBalance,
            psychologicalSafety: newPulse.psychologicalSafety,
            teamSupport: newPulse.teamSupport,
            departmentTag: newPulse.departmentTag,
            environmentNote: newPulse.environmentNote,
          },
        })
      );
      newPulse.id = created.id;
    } catch {
      // Keep in runtime store
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, pulse: newPulse };
}

export async function getVoiceOverview(): Promise<{
  submissions: SerializedVoiceSubmission[];
  evaluations: SerializedComfortEval[];
  averageComfortIndex: number;
}> {
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
  return {
    ok: true,
    submission: {
      id: `voice-${Date.now()}`,
      submissionType: parsed.data.submissionType,
      category: parsed.data.category,
      originalRedacted: true,
      scrubbedContent: scrubbed.scrubbedText,
      urgency: parsed.data.urgency ?? scrubbed.suggestedUrgency,
      sentiment: scrubbed.sentiment,
      redactedEntities: scrubbed.redactedEntities,
      upvotes: 1,
      status: "SUBMITTED",
      createdAt: new Date().toISOString(),
    },
  };
}

export async function upvoteVoiceSubmissionAction(input: {
  submissionId: string;
}): Promise<{ ok: true; upvotes: number } | { ok: false; error: string }> {
  const parsed = upvoteSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid submission ID." };
  }
  return { ok: true, upvotes: 15 };
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
  return {
    ok: true,
    evaluation: {
      id: `eval-${Date.now()}`,
      ...parsed.data,
      optionalNote: parsed.data.optionalNote ?? null,
      overallIndex,
      createdAt: new Date().toISOString(),
    },
  };
}
