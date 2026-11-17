"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export type ZoneTone = "neutral" | "psych" | "selfcare" | "voice" | "warning";

const TONE_BORDER_ACCENT: Record<ZoneTone, string> = {
  neutral: "",
  psych: "border-t-[6px] border-t-zone-psychology",
  selfcare: "border-t-[6px] border-t-zone-selfcare",
  voice: "border-t-[6px] border-t-zone-voice",
  warning: "border-t-[6px] border-t-status-warning",
};

interface CartoonPaperCardProps {
  children: React.ReactNode;
  tone?: ZoneTone;
  aged?: boolean;
  interactive?: boolean;
  className?: string;
}

export function CartoonPaperCard({
  children,
  tone = "neutral",
  aged = false,
  interactive = false,
  className,
}: CartoonPaperCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={interactive ? { y: -2, scale: 1.01 } : undefined}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={clsx(
        "rounded-2xl p-5 text-ink-charcoal",
        aged ? "cartoon-panel-aged" : "cartoon-panel",
        TONE_BORDER_ACCENT[tone],
        interactive && "cartoon-btn cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
