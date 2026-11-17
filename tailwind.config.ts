import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "paper-cream": "var(--bg-paper-cream)",
        "paper-aged": "var(--bg-paper-aged)",
        "canvas-meadow": "var(--bg-canvas-meadow)",
        "wood-warm": "var(--bg-wood-warm)",
        "ink-charcoal": "var(--ink-charcoal)",
        "ink-muted": "var(--ink-muted)",
        "zone-psychology": "var(--zone-psychology)",
        "zone-selfcare": "var(--zone-selfcare)",
        "zone-voice": "var(--zone-voice)",
        "world-void": "var(--bg-world-void)",
        "hud-surface": "var(--bg-hud-surface)",
        "hud-elevated": "var(--bg-hud-elevated)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "accent-psych": "var(--accent-psych)",
        "accent-selfcare": "var(--accent-selfcare)",
        "accent-voice": "var(--accent-voice)",
        "status-warning": "var(--status-warning)",
        "status-danger": "var(--status-danger)",
        "border-hud": "var(--border-hud)",
        "cartoon-ink": "var(--cartoon-ink)",
      },
      boxShadow: {
        cartoon: "var(--shadow-cartoon)",
        "cartoon-sm": "var(--shadow-cartoon-sm)",
        "cartoon-lg": "var(--shadow-cartoon)",
        "glow-psych": "var(--shadow-cartoon-sm)",
        "glow-selfcare": "var(--shadow-cartoon-sm)",
        "glow-voice": "var(--shadow-cartoon-sm)",
      },
      fontFamily: {
        display: ["var(--font-fredoka)", "var(--font-nunito)", "sans-serif"],
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
        hand: ["var(--font-gaegu)", "cursive", "sans-serif"],
        mono: ["var(--font-gaegu)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
