"use client";

import { useState } from "react";

const VIDEO_ID = "dQw4w9WgXcQ";

/**
 * Full-bleed Rickroll takeover for the homepage.
 * Autoplays muted (browser policy), click anywhere to unmute, with a hard
 * fallback link for anyone whose browser refuses the embed.
 */
export function RickrollHero() {
  const [muted, setMuted] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const src =
    `https://www.youtube-nocookie.com/embed/${VIDEO_ID}` +
    `?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${VIDEO_ID}` +
    `&controls=1&modestbranding=1&rel=0&playsinline=1`;

  return (
    <section
      aria-label="Rickroll"
      className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-black px-4 py-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,45,85,0.22),transparent_65%)]" />

      <div className="relative z-10 w-full max-w-5xl">
        <p className="mb-3 text-center font-mono text-[11px] tracking-[0.28em] text-[#ff2d55] uppercase">
          you have been rickrolled
        </p>

        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[0_0_80px_rgba(255,45,85,0.25)]">
          {!loaded && (
            <div className="absolute inset-0 grid place-items-center text-sm text-white/60">
              loading the only song that matters…
            </div>
          )}
          <iframe
            key={src}
            src={src}
            title="Rick Astley — Never Gonna Give You Up"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setLoaded(true)}
            className="absolute inset-0 h-full w-full"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/85 transition hover:border-[#ff2d55] hover:text-white"
          >
            {muted ? "🔊 Unmute" : "🔇 Mute"}
          </button>
          <a
            href={`https://www.youtube.com/watch?v=${VIDEO_ID}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#ff2d55] px-4 py-2 text-xs font-semibold text-black transition hover:bg-white"
          >
            Watch on YouTube ↗
          </a>
          <a
            href="#about"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/85 transition hover:border-[#ff2d55] hover:text-white"
          >
            ↓ The actual portfolio
          </a>
        </div>
      </div>
    </section>
  );
}
