"use client";

import React from "react";
import {
  CartoonPaperCard,
  type ZoneTone,
} from "@/components/ui/CartoonPaperCard";

interface HudCardProps {
  children: React.ReactNode;
  tone?: ZoneTone;
  elevated?: boolean;
  interactive?: boolean;
  className?: string;
}

export function HudCard({
  children,
  tone = "neutral",
  elevated = false,
  interactive = false,
  className,
}: HudCardProps) {
  return (
    <CartoonPaperCard
      tone={tone}
      aged={elevated}
      interactive={interactive}
      className={className}
    >
      {children}
    </CartoonPaperCard>
  );
}
