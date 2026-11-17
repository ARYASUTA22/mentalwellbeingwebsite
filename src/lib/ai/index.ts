import { google } from "@ai-sdk/google";
import { generateObject, streamText } from "ai";
import { getSafeEnv } from "@/env";
import {
  aiRecommendationOutputSchema,
  type AIWellnessRecommendation,
} from "@/lib/validations/selfcare";
import {
  scrubVoiceOutputSchema,
  type ScrubVoiceResult,
} from "@/lib/validations/voice";

const MODEL_ID = "gemini-2.5-flash";

/**
 * Deterministic fallback PII scrubber used when GOOGLE_GENERATIVE_AI_API_KEY
 * is not provisioned yet or during offline testing.
 */
function localPiiScrubFallback(rawText: string): ScrubVoiceResult {
  const redactedEntities: string[] = [];
  let text = rawText;

  const patterns: Array<{ regex: RegExp; tag: string; label: string }> = [
    {
      regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      tag: "[REDACTED_EMAIL]",
      label: "email address",
    },
    {
      regex: /@[a-zA-Z0-9_.-]{2,30}/g,
      tag: "[REDACTED_HANDLE]",
      label: "user handle",
    },
    {
      regex: /\b(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
      tag: "[REDACTED_PHONE]",
      label: "phone number",
    },
    {
      regex: /\b\d{4}-\d{2}-\d{2}\b/g,
      tag: "[REDACTED_DATE]",
      label: "specific date",
    },
  ];

  for (const { regex, tag, label } of patterns) {
    if (regex.test(text)) {
      redactedEntities.push(label);
      text = text.replace(regex, tag);
    }
  }

  const lower = text.toLowerCase();
  const urgentKeywords = ["harassment", "unsafe", "retaliation", "burnout", "urgent"];
  const isUrgent = urgentKeywords.some((kw) => lower.includes(kw));

  return {
    scrubbedText: text,
    redactedEntities,
    piiFound: redactedEntities.length > 0,
    suggestedUrgency: isUrgent ? "HIGH" : "MEDIUM",
    sentiment: isUrgent ? "URGENT" : "CONSTRUCTIVE",
  };
}

/**
 * Headless Gemini 2.5 Flash utility that strips identifying employee details
 * from anonymous voice submissions while retaining actionable meaning.
 */
export async function scrubVoiceText(
  rawText: string
): Promise<ScrubVoiceResult> {
  const env = getSafeEnv();
  if (!env.hasGoogleAI) {
    return localPiiScrubFallback(rawText);
  }

  try {
    const { object } = await generateObject({
      model: google(MODEL_ID),
      schema: scrubVoiceOutputSchema,
      system: [
        "You are a strict workplace privacy redaction engine.",
        "Remove any personally identifiable information (person names, emails, handles, phone numbers, exact desk/room numbers, specific calendar dates, or hyper-specific project codenames that uniquely identify the author).",
        "Replace removed spans with bracketed placeholders like [Colleague], [Manager], [Date], [Handle].",
        "Preserve the exact core issue, emotional urgency, and constructive facts without inventing details.",
      ].join(" "),
      prompt: `Redact PII from this anonymous workplace submission:\n\n${rawText}`,
    });

    return object;
  } catch {
    return localPiiScrubFallback(rawText);
  }
}

/**
 * Headless Gemini 2.5 Flash utility matching an employee's stress/mood state
 * to a breathing cadence and existing Psychology Corner articles.
 */
export async function generateWellnessRecommendation(input: {
  moodLabel: string;
  stressLevel: number;
  contextNote?: string;
  availableArticles: Array<{ slug: string; title: string; category: string }>;
}): Promise<AIWellnessRecommendation> {
  const fallbackSlugs = input.availableArticles
    .slice(0, 2)
    .map((article) => article.slug);

  const fallback: AIWellnessRecommendation =
    input.stressLevel >= 7
      ? {
          breathingPattern: "CALMING_4_7_8",
          cadenceLabel: "4-7-8 Down-Regulation",
          groundingAction:
            "Step away from active chat channels for 3 minutes, drop your shoulders, and lengthen each exhale past your inhale.",
          recommendedSlugs: fallbackSlugs,
          rationale:
            "Elevated stress benefits from extended exhalations to stimulate vagal tone and calm cognitive overload.",
        }
      : input.stressLevel >= 4
        ? {
            breathingPattern: "COHERENT_4_4",
            cadenceLabel: "Coherent 0.25Hz Balance (4s In / 4s Out)",
            groundingAction:
              "Select a single priority task for the next 25 minutes and close all unrelated browser tabs.",
            recommendedSlugs: fallbackSlugs,
            rationale:
              "Steady rhythmic breathing stabilizes heart-rate variability and restores executive clarity.",
          }
        : {
            breathingPattern: "RESET_2_4",
            cadenceLabel: "Quick Physiological Sigh (2s / 4s)",
            groundingAction:
              "Capture one quick win from today in your quest checklist before transitioning to deep work.",
            recommendedSlugs: fallbackSlugs,
            rationale:
              "Low-friction breath resets maintain momentum without breaking your current flow state.",
          };

  const env = getSafeEnv();
  if (!env.hasGoogleAI) {
    return fallback;
  }

  try {
    const catalogSummary = input.availableArticles
      .map((a) => `- ${a.slug} [${a.category}]: ${a.title}`)
      .join("\n");

    const { object } = await generateObject({
      model: google(MODEL_ID),
      schema: aiRecommendationOutputSchema,
      system: [
        "You are a headless workplace psychology recommendation engine.",
        "Return structured JSON only. Never act as a conversational chatbot.",
        "Pick recommendedSlugs strictly from the provided catalog slugs.",
      ].join(" "),
      prompt: [
        `Mood: ${input.moodLabel}`,
        `Stress Level (1-10): ${input.stressLevel}`,
        input.contextNote ? `Context: ${input.contextNote}` : "",
        `Available Articles:\n${catalogSummary}`,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    return object;
  } catch {
    return fallback;
  }
}

/**
 * Headless streaming mindfulness micro-tip using Vercel AI SDK streamText.
 */
export function streamMindfulnessTip(input: {
  moodLabel: string;
  stressLevel: number;
}) {
  return streamText({
    model: google(MODEL_ID),
    system:
      "Provide a single concise, evidence-based 2-sentence workplace grounding micro-practice. No greetings or conversational chat framing.",
    prompt: `Employee state: mood=${input.moodLabel}, stress=${input.stressLevel}/10.`,
  });
}
