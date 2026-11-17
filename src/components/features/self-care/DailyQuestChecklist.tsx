"use client";

import React, { useState, useTransition } from "react";
import { CheckCircle2, Circle, Trophy } from "lucide-react";
import { toggleDailyQuestAction } from "@/actions/selfcare";
import { HudCard } from "@/components/hud/HudCard";
import { useHud } from "@/components/hud/HudProvider";
import type { SerializedQuest } from "@/lib/validations/selfcare";
import { clsx } from "clsx";

export function DailyQuestChecklist({
  initialQuests,
}: {
  initialQuests: SerializedQuest[];
}) {
  const { addXp } = useHud();
  const [quests, setQuests] = useState<SerializedQuest[]>(initialQuests);
  const [isPending, startTransition] = useTransition();

  const completedCount = quests.filter((q) => q.isCompleted).length;

  const handleToggle = (quest: SerializedQuest) => {
    const nextCompleted = !quest.isCompleted;

    setQuests((prev) =>
      prev.map((item) =>
        item.id === quest.id
          ? {
              ...item,
              isCompleted: nextCompleted,
              completedAt: nextCompleted ? new Date().toISOString() : null,
            }
          : item
      )
    );
    addXp(nextCompleted ? quest.xpReward : -quest.xpReward);

    startTransition(async () => {
      await toggleDailyQuestAction({
        questId: quest.id,
        isCompleted: nextCompleted,
      });
    });
  };

  return (
    <HudCard tone="selfcare" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink-charcoal bg-zone-psychology">
            <Trophy className="h-4 w-4 text-ink-charcoal" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-ink-charcoal">
              Daily Sanctuary Quests
            </h2>
            <p className="text-xs font-semibold text-ink-muted">
              Small restorative habits earn calm XP
            </p>
          </div>
        </div>
        <span className="rounded-full border-2 border-ink-charcoal bg-paper-aged px-2.5 py-0.5 font-hand text-sm font-bold text-ink-charcoal">
          {completedCount}/{quests.length}
        </span>
      </div>

      <div className="space-y-2.5">
        {quests.map((quest) => (
          <button
            key={quest.id}
            type="button"
            disabled={isPending}
            onClick={() => handleToggle(quest)}
            className={clsx(
              "cartoon-btn flex w-full items-start gap-3 rounded-xl p-3 text-left",
              quest.isCompleted
                ? "bg-zone-selfcare/55"
                : "bg-paper-aged hover:bg-paper-cream"
            )}
          >
            {quest.isCompleted ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-charcoal" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
            )}

            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={clsx(
                    "text-xs font-bold",
                    quest.isCompleted
                      ? "text-ink-muted line-through"
                      : "text-ink-charcoal"
                  )}
                >
                  {quest.title}
                </span>
                <span className="shrink-0 rounded-md border-2 border-ink-charcoal bg-paper-cream px-1.5 py-0.5 font-hand text-xs font-bold text-ink-charcoal">
                  +{quest.xpReward} XP
                </span>
              </div>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-ink-muted">
                {quest.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </HudCard>
  );
}
