import { getPsychologyArticles } from "@/actions/psychology";
import { getSelfCareOverview } from "@/actions/selfcare";
import { getVoiceOverview } from "@/actions/voice";
import { SanctuaryWorldCanvas } from "@/components/canvas/SanctuaryWorldCanvas";

export const dynamic = "force-dynamic";

export default async function HubHomePage() {
  const [articles, selfCare, voice] = await Promise.all([
    getPsychologyArticles(),
    getSelfCareOverview(),
    getVoiceOverview(),
  ]);

  return (
    <SanctuaryWorldCanvas
      articles={articles}
      quests={selfCare.quests}
      submissions={voice.submissions}
      averageComfortIndex={voice.averageComfortIndex}
      evaluationCount={voice.evaluations.length}
    />
  );
}
