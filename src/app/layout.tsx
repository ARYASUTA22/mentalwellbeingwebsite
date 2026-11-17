import type { Metadata } from "next";
import { Fredoka, Gaegu, Nunito } from "next/font/google";
import "./globals.css";
import { HudProvider } from "@/components/hud/HudProvider";
import { TopNavHud } from "@/components/hud/TopNavHud";
import { ZoneQuickSwitcher } from "@/components/hud/ZoneQuickSwitcher";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
});

const gaegu = Gaegu({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-gaegu",
});

export const metadata: Metadata = {
  title: "MindSanctuary | Cozy Cartoon Workplace Mental Health & Employee Voice",
  description:
    "Cozy hand-drawn indie cartoon workplace mental health sanctuary combining burnout psychology, 0.25Hz self-care regulation, and AI-redacted anonymous employee voice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} ${gaegu.variable}`}
    >
      <body className="bg-canvas-meadow font-sans text-ink-charcoal antialiased">
        {/* Subtle SVG hand-drawn turbulence filter for line-boil accents */}
        <svg
          aria-hidden="true"
          className="pointer-events-none fixed h-0 w-0 overflow-hidden"
        >
          <defs>
            <filter id="hand-drawn-boil">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.025"
                numOctaves="2"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="1.6"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        <HudProvider>
          <TopNavHud />
          <main className="pointer-events-none relative z-10 min-h-screen px-4 pb-24 pt-20 sm:px-6">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
          <ZoneQuickSwitcher />
        </HudProvider>
      </body>
    </html>
  );
}
