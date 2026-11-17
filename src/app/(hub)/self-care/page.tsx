import { HeartPulse } from "lucide-react";
import { getSelfCareOverview } from "@/actions/selfcare";
import { BreathingVisualizer } from "@/components/features/self-care/BreathingVisualizer";
import { DailyQuestChecklist } from "@/components/features/self-care/DailyQuestChecklist";
import { EmotionRegulator } from "@/components/features/self-care/EmotionRegulator";
import { HudCard } from "@/components/hud/HudCard";

export const dynamic = "force-dynamic";

export default async function SelfCarePage() {
  const overview = await getSelfCareOverview();

  return (
    <div className="pointer-events-auto space-y-6">
      <HudCard
        tone="selfcare"
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-[3px] border-ink-charcoal bg-zone-selfcare text-ink-charcoal shadow-cartoon-sm">
            <HeartPulse className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-lg font-bold text-ink-charcoal sm:text-xl">
              Zone 2 · Self-Care Corner
            </h1>
            <p className="text-xs font-semibold text-ink-muted">
              Regulate nervous-system fatigue with the 0.25Hz breathing orb,
              AI-matched grounding, and daily quests
            </p>
          </div>
        </div>
      </HudCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <BreathingVisualizer />
          <EmotionRegulator />
        </div>
        <div className="lg:col-span-5">
          <DailyQuestChecklist initialQuests={overview.quests} />
        </div>
      </div>
    </div>
  );
}
