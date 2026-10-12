"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ComponentStyles } from "./component-styles";

export interface TextRainProps {
  className?: string;
  /** Characters sampled deterministically for the falling text. */
  characters?: string;
  color?: string;
  /** Concurrent drops; clamped to 1–160. */
  density?: number;
  /** Seconds per fall; clamped to 0.6–12. */
  speed?: number;
  paused?: boolean;
  defaultPaused?: boolean;
  /** Optional playback controls; hidden for the reference presentation. */
  showControls?: boolean;
  onPausedChange?: (paused: boolean) => void;
  ariaLabel?: string;
}

type RainDrop = {
  id: number;
  character: string;
  x: number;
  phase: number;
  size: number;
};

const DEFAULT_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DEFAULT_DENSITY = 100;
const FALL_DISTANCE = 290;
const limited = (value: number, fallback: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Number.isFinite(value) ? value : fallback));

/** Reproducible particles keep the server and first client frame identical. */
function sample(id: number, salt: number, cycle = 0) {
  const value =
    Math.imul(id + 1, 1597334677) ^
    Math.imul(salt + 1, 3812015801) ^
    Math.imul(cycle, 2654435761);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function alphabetFrom(characters: string) {
  const alphabet = Array.from(characters.toUpperCase())
    .filter((character) => character.trim())
    .slice(0, 256);
  return alphabet.length ? alphabet : Array.from(DEFAULT_CHARACTERS);
}

function rainDrop(alphabet: string[], id: number, cycle = 0): RainDrop {
  return {
    id,
    character: alphabet[Math.floor(sample(id, 3, cycle) * alphabet.length)],
    x: 2 + sample(id, 7, cycle) * 94,
    phase: sample(id, 11),
    // The tiny letters become the sparkling points visible in the recording.
    size: 2 + sample(id, 17, cycle) * 20,
  };
}

function letterStyle(drop: RainDrop, duration: number): CSSProperties {
  return {
    left: `${drop.x}%`,
    fontSize: `${drop.size}px`,
    animationDelay: `${-drop.phase * duration}s`,
    "--text-rain-still-y": `${Math.min(drop.phase / 0.7, 1) * FALL_DISTANCE}px`,
    "--text-rain-still-scale": drop.phase < 0.7 ? 1 : (1 - drop.phase) / 0.3,
  } as CSSProperties;
}

function Cloud() {
  return (
    <svg
      className="text-rain-cloud"
      viewBox="0 0 300 170"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <rect y="74" width="300" height="96" rx="48" />
      <circle cx="95" cy="78" r="50" />
      <circle cx="184" cy="80" r="80" />
    </svg>
  );
}

function AnimatedLetter({
  alphabet,
  id,
  duration,
}: {
  alphabet: string[];
  id: number;
  duration: number;
}) {
  const [cycle, setCycle] = useState(0);
  const drop = rainDrop(alphabet, id, cycle);

  return (
    <span
      className="text-rain-letter"
      style={letterStyle(drop, duration)}
      onAnimationIteration={(event) => {
        if (
          event.animationName === "text-rain-fall" &&
          event.currentTarget.closest(".text-rain-root")?.getAttribute("data-running") === "true"
        ) {
          // Recycle only at scale(0), so a fresh letter starts behind the cloud.
          setCycle((previous) => previous + 1);
        }
      }}
    >
      {drop.character}
    </span>
  );
}

function RainField({
  alphabet,
  density,
  duration,
}: {
  alphabet: string[];
  density: number;
  duration: number;
}) {
  return (
    <div className="text-rain-field" aria-hidden="true">
      <Cloud />
      <div className="text-rain-drops">
        {Array.from({ length: density }, (_, id) => (
          <AnimatedLetter key={id} id={id} alphabet={alphabet} duration={duration} />
        ))}
      </div>
    </div>
  );
}

/** CSS drives each fall; completed drops are recycled without a timer or frame loop. */
export default function TextRain({
  className = "",
  characters = DEFAULT_CHARACTERS,
  color = "#ffffff",
  density = DEFAULT_DENSITY,
  speed = 2,
  paused,
  defaultPaused = false,
  showControls = false,
  onPausedChange,
  ariaLabel = "Glowing text rain",
}: TextRainProps) {
  const [internalPaused, setInternalPaused] = useState(defaultPaused);
  const [generation, setGeneration] = useState(0);
  const isPaused = paused ?? internalPaused;
  const count = Math.floor(limited(density, DEFAULT_DENSITY, 1, 160));
  const duration = limited(speed, 2, 0.6, 12);
  const alphabet = alphabetFrom(characters);
  const rootRef = useRef<HTMLDivElement>(null);
  const visibilityRef = useRef(true);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const motion =
      typeof matchMedia === "function"
        ? matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    const synchronize = () => {
      root.dataset.running = String(
        visibilityRef.current && !document.hidden && !motion?.matches && !isPaused,
      );
      root.dataset.reducedMotion = String(motion?.matches ?? false);
    };
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              visibilityRef.current = entry.isIntersecting;
              synchronize();
            },
            { threshold: 0.01 },
          );
    observer?.observe(root);
    motion?.addEventListener("change", synchronize);
    document.addEventListener("visibilitychange", synchronize);
    synchronize();
    return () => {
      observer?.disconnect();
      motion?.removeEventListener("change", synchronize);
      document.removeEventListener("visibilitychange", synchronize);
    };
  }, [isPaused]);

  function setPaused(next: boolean) {
    if (paused === undefined) setInternalPaused(next);
    onPausedChange?.(next);
  }

  function replay() {
    setGeneration((previous) => previous + 1);
    if (isPaused) setPaused(false);
  }

  return (
    <div
      ref={rootRef}
      className={`text-rain-root relative isolate w-full overflow-hidden ${className}`}
      data-running="false"
      data-reduced-motion="false"
      style={
        {
          "--text-rain-color": color,
          "--text-rain-duration": `${duration}s`,
        } as CSSProperties
      }
    >
      <ComponentStyles css={TEXT_RAIN_CSS} />
      <div className="text-rain-stage">
        <div className="text-rain-scene" role="img" aria-label={`${ariaLabel}: ${count} falling characters`}>
          <RainField key={generation} alphabet={alphabet} density={count} duration={duration} />
        </div>
        {showControls && (
          <div className="text-rain-controls" role="group" aria-label="Text rain controls">
            <button type="button" aria-pressed={isPaused} onClick={() => setPaused(!isPaused)}>
              {isPaused ? (
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m5 3 8 5-8 5V3Z" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
              {isPaused ? "Play rain" : "Pause rain"}
            </button>
            <button type="button" onClick={replay}>
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 5a5 5 0 1 1-.2 5M3 1v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Replay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Inert CSS playback uses the gallery's existing visibility and motion controls. */
export function TextRainThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  const step = Number.isFinite(previewStep) ? Math.floor(previewStep) : 0;
  const phase = ((step % 12) + 12) % 12;
  const alphabet = alphabetFrom(DEFAULT_CHARACTERS);

  return (
    <div className={`text-rain-root text-rain-thumbnail ${className}`} aria-hidden="true">
      <ComponentStyles css={TEXT_RAIN_CSS} />
      <div className="text-rain-field">
        <Cloud />
        <div className="text-rain-drops">
          {Array.from({ length: DEFAULT_DENSITY }, (_, id) => {
            const drop = rainDrop(alphabet, id);
            const progress = (drop.phase + phase * 0.173) % 1;
            const scale = progress < 0.7 ? 1 : (1 - progress) / 0.3;
            return (
              <span
                key={id}
                className="text-rain-letter"
                style={{
                  ...letterStyle(drop, 2),
                  transform: `translateY(${Math.min(progress / 0.7, 1) * FALL_DISTANCE}px) scale(${scale})`,
                }}
              >
                {drop.character}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const TEXT_RAIN_CSS = `
.text-rain-root {
  container-type: inline-size;
  position: relative;
  isolation: isolate;
  width: 100%;
  overflow: hidden;
  background: #171c1f;
  color: var(--text-rain-color, #fff);
  font-family: Arial, Helvetica, sans-serif;
  --text-rain-duration: 2s;
}
.text-rain-root * { box-sizing: border-box; }
.text-rain-stage {
  min-height: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 48px 24px;
}
.text-rain-scene { width: 300px; height: 424px; flex-shrink: 0; }
.text-rain-field { position: relative; width: 300px; height: 424px; }
.text-rain-cloud {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  width: 300px;
  height: 170px;
  color: var(--text-rain-color, #fff);
  filter: drop-shadow(0 0 10px currentColor) drop-shadow(0 0 20px currentColor);
}
/* Start 40px inside the cloud body, so its silhouette hides new letters. */
.text-rain-drops { position: absolute; top: 114px; left: 0; width: 300px; height: 310px; }
.text-rain-letter {
  position: absolute;
  top: 0;
  height: 20px;
  line-height: 20px;
  font-weight: 400;
  transform-origin: 50% 100%;
  text-transform: uppercase;
  user-select: none;
  color: var(--text-rain-color, #fff);
  text-shadow: 0 0 5px currentColor, 0 0 15px currentColor, 0 0 25px currentColor;
  animation: text-rain-fall var(--text-rain-duration, 2s) linear infinite;
  animation-play-state: paused;
}
.text-rain-root[data-running=true] .text-rain-letter { animation-play-state: running; }
@keyframes text-rain-fall {
  0% { transform: translateY(0) scale(1); }
  70% { transform: translateY(290px) scale(1); }
  100% { transform: translateY(290px) scale(0); }
}
.text-rain-controls { display: flex; align-items: center; gap: 9px; }
.text-rain-controls button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: rgba(255,255,255,.7);
  font: 400 11px/1.2 Arial, Helvetica, sans-serif;
  padding: 9px 12px;
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 999px;
  background: rgba(255,255,255,.025);
  cursor: pointer;
}
.text-rain-controls button:hover { color: #fff; border-color: rgba(255,255,255,.38); background: rgba(255,255,255,.06); }
.text-rain-controls button:focus-visible { outline: 2px solid var(--text-rain-color,#fff); outline-offset: 4px; }
.text-rain-controls svg { width: 13px; height: 13px; }
.text-rain-thumbnail { display: flex; align-items: center; justify-content: center; min-height: 250px; height: 100%; }
.text-rain-thumbnail .text-rain-field { transform: scale(.55); flex-shrink: 0; }
.text-rain-thumbnail .text-rain-letter { animation-play-state: running; }
.text-rain-root:not(.text-rain-thumbnail)[data-reduced-motion=true] .text-rain-letter {
  animation: none;
  transform: translateY(var(--text-rain-still-y,80px)) scale(var(--text-rain-still-scale,1));
}
@container (max-width: 520px) { .text-rain-stage { min-height: 520px; padding: 40px 18px; } }
@container (max-width: 360px) {
  .text-rain-stage { min-height: 460px; padding: 28px 12px; }
  .text-rain-scene { width: 246px; height: 348px; }
  .text-rain-scene .text-rain-field { transform: scale(.82); transform-origin: top left; }
}
@container (max-width: 280px) {
  .text-rain-scene { width: 198px; height: 280px; }
  .text-rain-scene .text-rain-field { transform: scale(.66); }
}
@media (prefers-reduced-motion: reduce) {
  .text-rain-root:not(.text-rain-thumbnail) .text-rain-letter {
    animation: none;
    transform: translateY(var(--text-rain-still-y,80px)) scale(var(--text-rain-still-scale,1));
  }
  .text-rain-thumbnail .text-rain-letter { animation: none; }
}
`;
