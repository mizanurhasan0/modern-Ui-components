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

/** Shared by the live scene and the thumbnail. */
const ROOT_CLASS =
  "text-rain-root @container relative isolate w-full overflow-hidden bg-[#171c1f] font-[Arial,Helvetica,sans-serif] text-[color:var(--text-rain-color,#fff)] **:box-border";
const LETTER_CLASS =
  "text-rain-letter absolute top-0 h-5 origin-bottom font-normal leading-5 uppercase select-none text-[color:var(--text-rain-color,#fff)] [text-shadow:0_0_5px_currentColor,0_0_15px_currentColor,0_0_25px_currentColor] animate-[text-rain-fall_var(--text-rain-duration,2s)_linear_infinite]";
/** Live letters play only while the root is running; reduced motion freezes them in place. */
const LIVE_LETTER_CLASS = `${LETTER_CLASS} [animation-play-state:paused] group-data-[running=true]/rain:[animation-play-state:running] group-data-[reduced-motion=true]/rain:animate-none group-data-[reduced-motion=true]/rain:[transform:translateY(var(--text-rain-still-y,80px))_scale(var(--text-rain-still-scale,1))] motion-reduce:animate-none motion-reduce:[transform:translateY(var(--text-rain-still-y,80px))_scale(var(--text-rain-still-scale,1))]`;
const FIELD_CLASS = "text-rain-field relative h-[424px] w-[300px]";
/* Start 40px inside the cloud body, so its silhouette hides new letters. */
const DROPS_CLASS = "text-rain-drops absolute top-[114px] left-0 h-[310px] w-[300px]";
const CONTROL_BUTTON_CLASS =
  "flex cursor-pointer items-center justify-center gap-[7px] rounded-[999px] border border-[rgba(255,255,255,.14)] bg-[rgba(255,255,255,.025)] px-3 py-[9px] font-[Arial,Helvetica,sans-serif] text-[11px]/[1.2] font-normal text-[rgba(255,255,255,.7)] hover:border-[rgba(255,255,255,.38)] hover:bg-[rgba(255,255,255,.06)] hover:text-white";

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
      className="text-rain-cloud absolute top-0 left-0 z-[2] h-[170px] w-[300px] text-[color:var(--text-rain-color,#fff)] [filter:drop-shadow(0_0_10px_currentColor)_drop-shadow(0_0_20px_currentColor)]"
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
      className={LIVE_LETTER_CLASS}
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
    <div
      className={`${FIELD_CLASS} @max-[360px]:origin-top-left @max-[360px]:[transform:scale(.82)] @max-[280px]:[transform:scale(.66)] @min-[1100px]:origin-top-left @min-[1100px]:[transform:scale(1.3)]`}
      aria-hidden="true"
    >
      <Cloud />
      <div className={DROPS_CLASS}>
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
      className={`${ROOT_CLASS} group/rain flex flex-col ${className}`}
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
      {/* The stage grows with the root, so full-screen hosts center the scene. */}
      <div className="text-rain-stage flex min-h-[560px] flex-[1_0_auto] flex-col items-center justify-center gap-6 px-6 py-12 @max-[520px]:min-h-[520px] @max-[520px]:px-[18px] @max-[520px]:py-10 @max-[360px]:min-h-[460px] @max-[360px]:px-3 @max-[360px]:py-7">
        <div
          className="text-rain-scene h-[424px] w-[300px] shrink-0 @max-[360px]:h-[348px] @max-[360px]:w-[246px] @max-[280px]:h-[280px] @max-[280px]:w-[198px] @min-[1100px]:h-[551px] @min-[1100px]:w-[390px]"
          role="img"           aria-label={`${ariaLabel}: ${count} falling characters`}
        >
          <RainField key={generation} alphabet={alphabet} density={count} duration={duration} />
        </div>
        {showControls && (
          <div className="text-rain-controls flex items-center gap-[9px]" role="group" aria-label="Text rain controls">
            <button
              type="button"
              className={CONTROL_BUTTON_CLASS}
              aria-pressed={isPaused}
              onClick={() => setPaused(!isPaused)}
            >
              {isPaused ? (
                <svg className="size-[13px]" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m5 3 8 5-8 5V3Z" fill="currentColor" />
                </svg>
              ) : (
                <svg className="size-[13px]" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
              {isPaused ? "Play rain" : "Pause rain"}
            </button>
            <button type="button" className={CONTROL_BUTTON_CLASS} onClick={replay}>
              <svg className="size-[13px]" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
    <div
      className={`${ROOT_CLASS} text-rain-thumbnail flex h-full min-h-[250px] items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <ComponentStyles css={TEXT_RAIN_CSS} />
      <div className={`${FIELD_CLASS} shrink-0 [transform:scale(.55)]`}>
        <Cloud />
        <div className={DROPS_CLASS}>
          {Array.from({ length: DEFAULT_DENSITY }, (_, id) => {
            const drop = rainDrop(alphabet, id);
            const progress = (drop.phase + phase * 0.173) % 1;
            const scale = progress < 0.7 ? 1 : (1 - progress) / 0.3;
            return (
              <span
                key={id}
                className={`${LETTER_CLASS} motion-reduce:animate-none`}
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

/**
 * Raw CSS keeps only the fall keyframes (referenced by name from Tailwind) and the
 * focus ring, which must outrank unlayered global :focus-visible styles.
 */
const TEXT_RAIN_CSS = `
.text-rain-controls button:focus-visible { outline: 2px solid var(--text-rain-color,#fff); outline-offset: 4px; }
@keyframes text-rain-fall {
  0% { transform: translateY(0) scale(1); }
  70% { transform: translateY(290px) scale(1); }
  100% { transform: translateY(290px) scale(0); }
}
`;
