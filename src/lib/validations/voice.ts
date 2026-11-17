import { z } from "zod";

export const VOICE_SUBMISSION_TYPES = ["COMPLAINT", "FEEDBACK"] as const;
export const VOICE_CATEGORIES = [
  "Workload & Burnout",
  "Psychological Safety",
  "Team Dynamics",
  "Tooling & Environment",
  "Recognition & Growth",
] as const;

export const URGENCY_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;

export const voiceSubmissionInputSchema = z.object({
  submissionType: z.enum(VOICE_SUBMISSION_TYPES),
  category: z.enum(VOICE_CATEGORIES),
  rawContent: z
    .string()
    .trim()
    .min(12, "Please provide at least 12 characters of constructive detail.")
    .max(2000, "Submission must remain under 2,000 characters."),
  urgency: z.enum(URGENCY_LEVELS).default("MEDIUM"),
});

export const scrubVoiceOutputSchema = z.object({
  scrubbedText: z.string(),
  redactedEntities: z.array(z.string()),
  piiFound: z.boolean(),
  suggestedUrgency: z.enum(URGENCY_LEVELS),
  sentiment: z.enum(["CONSTRUCTIVE", "CONCERNED", "URGENT"]),
});

export type ScrubVoiceResult = z.infer<typeof scrubVoiceOutputSchema>;

export const comfortEvalSchema = z.object({
  psychologicalSafety: z.number().int().min(1).max(5),
  workloadBalance: z.number().int().min(1).max(5),
  leadershipTrust: z.number().int().min(1).max(5),
  environmentCalm: z.number().int().min(1).max(5),
  optionalNote: z.string().max(600).optional(),
});

export const upvoteSubmissionSchema = z.object({
  submissionId: z.string().min(1),
});

export interface SerializedVoiceSubmission {
  id: string;
  submissionType: string;
  category: string;
  originalRedacted: boolean;
  scrubbedContent: string;
  urgency: string;
  sentiment: string;
  redactedEntities: string[];
  upvotes: number;
  status: string;
  createdAt: string;
}

export interface SerializedComfortEval {
  id: string;
  psychologicalSafety: number;
  workloadBalance: number;
  leadershipTrust: number;
  environmentCalm: number;
  optionalNote: string | null;
  overallIndex: number;
  createdAt: string;
}
