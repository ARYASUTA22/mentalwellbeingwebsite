"use client";

import React from "react";
import { Compass, MapPin, MessageCircle, Navigation, RotateCcw, X } from "lucide-react";
import {
  FEATURE_STATIONS,
  getStationById,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type ZoneId,
} from "@/components/canvas/PhysicsController";
import type { SubStationCode } from "@/lib/seed";
import { clsx } from "clsx";

interface SignpostMinimapProps {
  playerPos: { x: number; y: number };
  nearbyCode: SubStationCode | null;
  activeModalCode: SubStationCode | null;
  onFastTravel: (code: SubStationCode) => void;
  onTalkToNpc?: (zoneId: ZoneId) => void;
  onRecenter?: () => void;
  onClose?: () => void;
}

const ZONE_PLANK_BG: Record<ZoneId, string> = {
  psychology: "bg-zone-psychology",
  "self-care": "bg-zone-selfcare",
  "employee-voice": "bg-zone-voice",
};

const ZONE_GROUP_TITLES: Record<ZoneId, string> = {
  psychology: "1 · Cozy Library Nook",
  "self-care": "2 · Zen Greenhouse",
  "employee-voice": "3 · Treehouse Post Office",
};

export function SignpostMinimap({
  playerPos,
  nearbyCode,
  activeModalCode,
  onFastTravel,
  onTalkToNpc,
  onRecenter,
  onClose,
}: SignpostMinimapProps) {
  const playerLeftPct = Math.max(
    6,
    Math.min(94, (playerPos.x / WORLD_WIDTH) * 100)
  );
  const playerTopPct = Math.max(
    8,
    Math.min(92, (playerPos.y / WORLD_HEIGHT) * 100)
  );

  const zones: ZoneId[] = ["psychology", "self-care", "employee-voice"];

  return (
    <aside
      aria-label="Wooden Sanctuary Signpost"
      className="pointer-events-auto w-72 rounded-2xl border-[3px] border-ink-charcoal bg-wood-warm p-3 shadow-cartoon"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2 rounded-xl border-2 border-ink-charcoal bg-paper-cream px-2.5 py-1.5">
        <div className="flex items-center gap-1.5">
          <Compass className="h-4 w-4 text-ink-charcoal" />
          <span className="font-display text-xs font-bold text-ink-charcoal">
            Papan Penunjuk (9 Pos)
          </span>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Signpost"
            className="rounded-md p-0.5 text-ink-charcoal hover:bg-paper-aged"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="font-hand text-xs font-bold text-ink-muted">
            Fast Travel
          </span>
        )}
      </div>

      {/* Compact live meadow radar with all 9 sub-station pins */}
      <div
        style={{ backgroundImage: "url('/assets/map-floor.png')" }}
        className="relative mb-2.5 h-24 w-full overflow-hidden rounded-xl border-2 border-ink-charcoal bg-canvas-meadow bg-cover bg-center"
      >
        {FEATURE_STATIONS.map((station) => (
          <button
            key={station.code}
            type="button"
            title={`${station.shortLabel}`}
            onClick={() => onFastTravel(station.code)}
            style={{
              left: `${(station.x / WORLD_WIDTH) * 100}%`,
              top: `${(station.y / WORLD_HEIGHT) * 100}%`,
            }}
            className={clsx(
              "absolute flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink-charcoal font-display text-[8px] font-bold text-ink-charcoal transition-transform hover:scale-125",
              ZONE_PLANK_BG[station.zoneId]
            )}
          >
            {station.code}
          </button>
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

      {/* Grouped 9 Sub-Feature Station Planks */}
      <div className="max-h-72 space-y-2 overflow-y-auto pr-0.5">
        {zones.map((zoneId) => {
          const zoneStations = FEATURE_STATIONS.filter(
            (s) => s.zoneId === zoneId
          );
          const npcStation = getStationById(zoneId);
          return (
            <div
              key={zoneId}
              className="rounded-xl border-2 border-ink-charcoal bg-paper-aged/90 p-2"
            >
              <div className="mb-1.5 flex items-center justify-between gap-1 font-display text-[11px] font-bold text-ink-charcoal">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{ZONE_GROUP_TITLES[zoneId]}</span>
                </span>
                {onTalkToNpc && (
                  <button
                    type="button"
                    onClick={() => onTalkToNpc(zoneId)}
                    title={`Ngobrol dengan ${npcStation.npcName}`}
                    className={clsx(
                      "inline-flex shrink-0 items-center gap-1 rounded-md border border-ink-charcoal px-1.5 py-0.5 font-hand text-[10px] font-bold text-ink-charcoal transition-transform hover:scale-105",
                      ZONE_PLANK_BG[zoneId]
                    )}
                  >
                    <MessageCircle className="h-2.5 w-2.5" />
                    <span>{npcStation.npcName}</span>
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {zoneStations.map((station) => {
                  const isHighlighted =
                    activeModalCode === station.code ||
                    nearbyCode === station.code;
                  return (
                    <button
                      key={station.code}
                      type="button"
                      onClick={() => onFastTravel(station.code)}
                      className={clsx(
                        "cartoon-btn flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-[11px] font-bold text-ink-charcoal",
                        isHighlighted
                          ? ZONE_PLANK_BG[station.zoneId]
                          : "bg-paper-cream hover:bg-paper-aged"
                      )}
                    >
                      <span className="truncate">{station.shortLabel}</span>
                      <Navigation className="h-3 w-3 shrink-0 text-ink-charcoal" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {onRecenter && (
          <button
            type="button"
            onClick={onRecenter}
            className="cartoon-btn mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-paper-cream px-2.5 py-1.5 text-xs font-bold text-ink-charcoal hover:bg-paper-aged"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Kembali ke Alun-Alun Tengah</span>
          </button>
        )}
      </div>
    </aside>
  );
}
