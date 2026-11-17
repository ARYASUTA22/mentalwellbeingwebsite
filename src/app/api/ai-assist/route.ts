import { NextResponse } from "next/server";
import { z } from "zod";
import { getPsychologyArticles } from "@/actions/psychology";
import {
  generateWellnessRecommendation,
  scrubVoiceText,
  streamMindfulnessTip,
} from "@/lib/ai";
import { MOOD_OPTIONS } from "@/lib/validations/selfcare";

const aiAssistRequestSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("scrub-pii"),
    rawText: z.string().min(8).max(2000),
  }),
  z.object({
    mode: z.literal("recommend"),
    moodLabel: z.enum(MOOD_OPTIONS),
    stressLevel: z.number().int().min(1).max(10),
    contextNote: z.string().max(400).optional(),
  }),
  z.object({
    mode: z.literal("stream-tip"),
    moodLabel: z.enum(MOOD_OPTIONS),
    stressLevel: z.number().int().min(1).max(10),
  }),
]);

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = aiAssistRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid AI utility payload.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    if (parsed.data.mode === "scrub-pii") {
      const result = await scrubVoiceText(parsed.data.rawText);
      return NextResponse.json(result);
    }

    if (parsed.data.mode === "recommend") {
      const articles = await getPsychologyArticles();
      const result = await generateWellnessRecommendation({
        moodLabel: parsed.data.moodLabel,
        stressLevel: parsed.data.stressLevel,
        contextNote: parsed.data.contextNote,
        availableArticles: articles.map((a) => ({
          slug: a.slug,
          title: a.title,
          category: a.category,
        })),
      });
      return NextResponse.json(result);
    }

    const stream = streamMindfulnessTip({
      moodLabel: parsed.data.moodLabel,
      stressLevel: parsed.data.stressLevel,
    });
    return stream.toTextStreamResponse();
  } catch {
    return NextResponse.json(
      { error: "Unable to process headless AI request." },
      { status: 500 }
    );
  }
}
