"use client";

import React from "react";
import { Compass, MapPin, Navigation } from "lucide-react";
import {
  WORLD_HEIGHT,
  WORLD_WIDTH,
  ZONE_STATIONS,
  type ZoneId,
} from "@/components/canvas/PhysicsController";
import { clsx } from "clsx";

interface SignpostMinimapProps {
  playerPos: { x: number; y: number };
  nearbyZone: ZoneId | null;
  activeModalZone: ZoneId | null;
  onFastTravel: (zoneId: ZoneId) => void;
}

const ZONE_PLANK_BG: Record<ZoneId, string> = {
  psychology: "bg-zone-psychology",
  "self-care": "bg-zone-selfcare",
  "employee-voice": "bg-zone-voice",
};

export function SignpostMinimap({
  playerPos,
  nearbyZone,
  activeModalZone,
  onFastTravel,
}: SignpostMinimapProps) {
  const playerLeftPct = Math.max(
    6,
    Math.min(94, (playerPos.x / WORLD_WIDTH) * 100)
  );
  const playerTopPct = Math.max(
    8,
    Math.min(92, (playerPos.y / WORLD_HEIGHT) * 100)
  );

  return (
    <aside
      aria-label="Wooden Sanctuary Signpost"
      className="pointer-events-auto w-64 rounded-2xl border-[3px] border-ink-charcoal bg-wood-warm p-3 shadow-cartoon"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2 rounded-xl border-2 border-ink-charcoal bg-paper-cream px-2.5 py-1.5">
        <div className="flex items-center gap-1.5">
          <Compass className="h-4 w-4 text-ink-charcoal" />
          <span className="font-display text-xs font-bold text-ink-charcoal">
            Wooden Signpost
          </span>
        </div>
        <span className="font-hand text-xs font-bold text-ink-muted">
          Fast Travel
        </span>
      </div>

      {/* Compact live meadow radar */}
      <div
        style={{ backgroundImage: "url('/assets/map-background.png')" }}
        className="relative mb-2.5 h-20 w-full overflow-hidden rounded-xl border-2 border-ink-charcoal bg-canvas-meadow bg-cover bg-center"
      >
        {ZONE_STATIONS.map((station) => (
          <button
            key={station.id}
            type="button"
            title={`Fast-travel to ${station.title}`}
            onClick={() => onFastTravel(station.id)}
            style={{
              left: `${(station.npcX / WORLD_WIDTH) * 100}%`,
              top: `${(station.npcY / WORLD_HEIGHT) * 100}%`,
            }}
            className={clsx(
              "absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink-charcoal transition-transform hover:scale-125",
              ZONE_PLANK_BG[station.id]
            )}
          />
        ))}

        {/* Live explorer dot */}
        <span
          style={{
            left: `${playerLeftPct}%`,
            top: `${playerTopPct}%`,
          }}
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper-cream bg-ink-charcoal"
        />
      </div>

      {/* Wooden direction planks */}
      <div className="space-y-1.5">
        {ZONE_STATIONS.map((station) => {
          const isHighlighted =
            activeModalZone === station.id || nearbyZone === station.id;
          return (
            <button
              key={station.id}
              type="button"
              onClick={() => onFastTravel(station.id)}
              className={clsx(
                "cartoon-btn flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-bold text-ink-charcoal",
                isHighlighted
                  ? ZONE_PLANK_BG[station.id]
                  : "bg-paper-cream hover:bg-paper-aged"
              )}
            >
              <span className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-charcoal" />
                <span className="truncate">{station.title}</span>
              </span>
              <Navigation className="h-3 w-3 shrink-0 text-ink-charcoal" />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
