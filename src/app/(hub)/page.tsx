import { getPsychologySubCategoryArticles } from "@/actions/psychology";
import { getSelfCareOverview } from "@/actions/selfcare";
import { getEmployeeVoiceAndPulseData } from "@/actions/voice";
import { SanctuaryWorldCanvas } from "@/components/canvas/SanctuaryWorldCanvas";

export const dynamic = "force-dynamic";

export default async function HubHomePage() {
  const [psychologyArticles, selfCare, voiceAndPulse] = await Promise.all([
    getPsychologySubCategoryArticles(),
    getSelfCareOverview(),
    getEmployeeVoiceAndPulseData(),
  ]);

  return (
    <SanctuaryWorldCanvas
      psychologyArticles={psychologyArticles}
      quests={selfCare.quests}
      voiceEntries={voiceAndPulse.entries}
      comfortPulses={voiceAndPulse.pulses}
    />
  );
}
