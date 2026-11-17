import { z } from "zod";

export const MOOD_OPTIONS = [
  "Overwhelmed",
  "Anxious",
  "Fatigued",
  "Scattered",
  "Steady",
  "Energized",
] as const;

export const breathingSessionSchema = z.object({
  durationSec: z.number().int().min(10).max(3600),
  cyclesCount: z.number().int().min(1).max(300),
});

export const emotionCheckinSchema = z.object({
  moodLabel: z.enum(MOOD_OPTIONS),
  stressLevel: z.number().int().min(1).max(10),
  contextNote: z.string().max(400).optional(),
});

export const toggleQuestSchema = z.object({
  questId: z.string().min(1),
  isCompleted: z.boolean(),
});

export const aiRecommendationOutputSchema = z.object({
  breathingPattern: z.enum(["COHERENT_4_4", "CALMING_4_7_8", "RESET_2_4"]),
  cadenceLabel: z.string(),
  groundingAction: z.string(),
  recommendedSlugs: z.array(z.string()).max(2),
  rationale: z.string(),
});

export type AIWellnessRecommendation = z.infer<
  typeof aiRecommendationOutputSchema
>;

export interface SerializedQuest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  zone: string;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface SerializedSelfCareSession {
  id: string;
  sessionType: string;
  moodLabel: string | null;
  stressLevel: number | null;
  durationSec: number;
  cyclesCount: number;
  aiTip: string | null;
  xpEarned: number;
  createdAt: string;
}
