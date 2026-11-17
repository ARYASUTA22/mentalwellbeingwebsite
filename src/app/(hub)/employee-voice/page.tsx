import { Megaphone } from "lucide-react";
import { getVoiceOverview } from "@/actions/voice";
import { AnonComplaintForm } from "@/components/features/voice/AnonComplaintForm";
import { ComfortEvalSurvey } from "@/components/features/voice/ComfortEvalSurvey";
import { FeedbackWall } from "@/components/features/voice/FeedbackWall";
import { HudCard } from "@/components/hud/HudCard";

export const dynamic = "force-dynamic";

export default async function EmployeeVoicePage() {
  const overview = await getVoiceOverview();

  return (
    <div className="pointer-events-auto space-y-6">
      <HudCard
        tone="voice"
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-[3px] border-ink-charcoal bg-zone-voice text-ink-charcoal shadow-cartoon-sm">
            <Megaphone className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-lg font-bold text-ink-charcoal sm:text-xl">
              Zone 3 · Employee Voice Sanctuary
            </h1>
            <p className="text-xs font-semibold text-ink-muted">
              Safe whistleblowing, AI-redacted feedback wall, and workplace
              comfort evaluations
            </p>
          </div>
        </div>
      </HudCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-6">
          <AnonComplaintForm />
          <ComfortEvalSurvey
            averageComfortIndex={overview.averageComfortIndex}
            evaluationCount={overview.evaluations.length}
          />
        </div>

        <div className="lg:col-span-6">
          <FeedbackWall initialSubmissions={overview.submissions} />
        </div>
      </div>
    </div>
  );
}
