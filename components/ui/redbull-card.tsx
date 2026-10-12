"use client";

import { ComponentStyles } from "./component-styles";

import { useEffect, useId, useRef, useState, type Ref } from "react";

export interface RedBullCardProps {
  className?: string;
  title?: string;
  description?: string;
  /** Playback stops after a manual action and pauses while hovered, focused, or hidden. */
  autoPlay?: boolean;
  onShopNow?: () => void;
}

function RedBullMark({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`block h-auto w-[73%] drop-shadow-[0_4px_10px_#060a24a8] ${compact ? "rb-mark-compact" : ""}`}
      viewBox="0 0 144 78"
      fill="none"
    >
      <path
        d="M29 38c9-15 20-20 32-17 8 2 13 8 17 14 5-7 12-12 21-13 11-1 21 5 27 16-9-3-15-2-20 2 8 0 13 4 16 10-9-2-16-1-23 2-6 3-11 7-16 13l-9-7-8 7c-6-6-10-10-16-13-7-3-14-4-23-2 3-6 8-10 16-10-5-4-11-5-20-2Z"
        fill="#F8C838"
      />
      <path
        d="M39 37c8-8 16-9 24-6 5 2 9 5 14 11-5 0-10 1-15 4-6-6-13-9-23-9Zm67-1c-8-7-16-8-23-5-5 2-9 5-14 10 5 0 10 2 15 5 6-6 13-9 22-10Z"
        fill="#E6313D"
      />
      <path
        d="M19 39c4 11 14 17 27 15-9-5-14-10-17-19l-10 4Zm106-4c-3 10-9 16-22 19 9-6 14-11 17-21l5 2Z"
        fill="#E6313D"
      />
      <text
        x="72"
        y="72"
        textAnchor="middle"
        fill="#F04452"
        fontFamily="Arial, sans-serif"
        fontSize="22"
        fontWeight="800"
        letterSpacing="-.8"
      >
        Red Bull
      </text>
    </svg>
  );
}

/** Real product photography, embedded by the Code tab for standalone reuse. */
function EnergyCan() {
  return (
    // A native image keeps the copied component usable outside Next.js.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="block h-full max-w-full min-h-0 w-full min-w-0 overflow-visible object-contain drop-shadow-[0_10px_12px_#080d2580]"
      src="/redbull/energy-drink-can.webp"
      alt="Chilled 250 ml Red Bull Energy Drink can"
      width={686}
      height={1751}
      draggable={false}
      decoding="async"
    />
  );
}

const PARTICLES = [
  [9, 18, 2, 1.2],
  [18, 81, 3, 1.8],
  [28, 30, 2, 2.4],
  [38, 89, 2, 1.5],
  [49, 12, 3, 2.1],
  [61, 91, 2, 1.7],
  [72, 23, 2, 2.8],
  [83, 77, 3, 1.4],
  [92, 36, 2, 2.2],
  [14, 55, 2, 2.5],
  [77, 52, 2, 1.9],
  [54, 70, 3, 2.7],
] as const;

type CardPhase = "compact" | "card" | "expanded";
const DEFAULT_DESCRIPTION =
  "Red Bull gives you wings. A refreshing energy drink that revitalizes body and mind.";
const PLAYBACK_STEPS: ReadonlyArray<{ phase: CardPhase; delay: number }> = [
  { phase: "card", delay: 1800 },
  { phase: "expanded", delay: 450 },
  { phase: "card", delay: 3400 },
  { phase: "compact", delay: 450 },
];

/** Panel shape per phase; the size/shape transitions live on the panel itself. */
const PANEL_PHASE_CLASSES: Record<CardPhase, string> = {
  compact:
    "h-[22cqw] w-[22cqw] max-w-[90%] rounded-[50%] bg-[radial-gradient(circle_at_50%_48%,#111319_0_49%,#080a10_70%)] shadow-[0_0_12px_#506eff72,0_0_34px_#3159da35,inset_0_0_0_1px_#9daaff21]",
  card: "h-[22cqw] w-[22cqw] max-w-[90%] rounded-[17px] bg-[linear-gradient(145deg,#2e3e7c,#202e65_55%,#172552)] shadow-[0_0_21px_#546ff34a,0_0_60px_#3159da32,inset_0_1px_#ffffff18]",
  expanded:
    "max-h-[90%] rounded-[12px] bg-[linear-gradient(125deg,#293a78_0%,#263875_58%,#1e2c66_100%)] shadow-[0_0_24px_#586fff65,0_0_80px_#3159da3d,inset_0_1px_#ffffff1c]",
};

const SR_ONLY = "absolute h-px w-px overflow-hidden whitespace-nowrap [clip:rect(0,0,0,0)]";

function ProductScene({
  phase,
  title = "REDBULL",
  description = DEFAULT_DESCRIPTION,
  interactive = false,
  thumbnail = false,
  contentId,
  toggleRef,
  onToggle,
  onShopNow,
}: {
  phase: CardPhase;
  title?: string;
  description?: string;
  interactive?: boolean;
  /** Gallery frames use fixed, smaller type and skip the narrow-container layout. */
  thumbnail?: boolean;
  contentId?: string;
  toggleRef?: Ref<HTMLButtonElement>;
  onToggle?: () => void;
  onShopNow?: () => void;
}) {
  const expanded = phase === "expanded";
  const shopButtonClass = `inline-flex items-center justify-center rounded-[4px] border-none bg-[#e8502f] py-0 font-bold text-white shadow-[0_4px_12px_#0c153c60] cursor-pointer [transition:transform_.2s_ease,background_.2s_ease,box-shadow_.2s_ease] hover:[transform:translateY(-2px)] hover:bg-[#ff7041] hover:shadow-[0_7px_16px_#0c153c70] ${
    thumbnail
      ? "mt-[5px] min-h-[16px] px-[6px] text-[6px]"
      : "mt-[9px] min-h-[clamp(22px,5cqw,30px)] px-[clamp(8px,2.5cqw,13px)] text-[clamp(8px,1.65cqw,10px)] @max-[500px]:mt-[7px] @max-[500px]:min-h-[32px] @max-[500px]:text-[10px]"
  }`;
  return (
    <div
      className={`relative isolate grid w-full min-h-0 flex-auto place-items-center overflow-hidden bg-[#030406] @container ${
        thumbnail ? "h-full aspect-auto" : "aspect-video"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_53%,#10172d80,transparent_43%)] before:absolute before:inset-[-20%] before:rounded-[50%] before:bg-[radial-gradient(ellipse_at_35%_55%,#254cae52_0,transparent_37%)] before:opacity-38 before:blur-[30px] before:content-[''] after:absolute after:inset-[-20%] after:rounded-[50%] after:bg-[radial-gradient(ellipse_at_70%_48%,#6b3aaf30_0,transparent_38%)] after:opacity-38 after:blur-[30px] after:content-['']"
        aria-hidden="true"
      >
        {PARTICLES.map(([x, y, size, delay], index) => (
          <span
            className={`absolute block rounded-[50%] bg-[#c6d0f2] opacity-34 shadow-[0_0_8px_2px_#658fff43] motion-reduce:opacity-35 ${
              thumbnail ? "" : "animate-[rb-twinkle_3.8s_ease-in-out_infinite_alternate]"
            }`}
            key={index}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>
      <article
        className={`relative z-1 overflow-hidden border border-[#ffffff0c] [transition:width_.65s_cubic-bezier(.2,.8,.2,1),height_.65s_cubic-bezier(.2,.8,.2,1),border-radius_.55s_ease,box-shadow_.55s_ease,background_.5s_ease] ${PANEL_PHASE_CLASSES[phase]} ${
          !expanded
            ? ""
            : thumbnail
              ? "h-[40cqw] w-[68cqw] max-w-[94%]"
              : "h-[32cqw] w-[56cqw] max-w-[88%] @max-[500px]:h-[48cqw] @max-[500px]:w-[82cqw] @max-[500px]:max-w-[94%]"
        }`}
        data-phase={phase}
        aria-label="Red Bull energy drink"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_5%,#ffffff0b_38%,transparent_73%)] opacity-75"
          aria-hidden="true"
        />
        <div
          className={`absolute inset-0 grid place-items-center [transition:opacity_.3s_ease,transform_.55s_cubic-bezier(.2,.8,.2,1)] ${
            expanded
              ? "pointer-events-none opacity-0 [transform:scale(.55)]"
              : "opacity-100 [transform:scale(1)]"
          }`}
          aria-hidden="true"
        >
          <RedBullMark />
        </div>
        <div
          id={contentId}
          className={`absolute top-[50%] z-2 max-w-[230px] ${
            thumbnail
              ? "left-[7%] w-[50%]"
              : "left-[8%] w-[49%] @max-[500px]:left-[7%] @max-[500px]:w-[51%]"
          } ${
            expanded
              ? "pointer-events-auto opacity-100 [transform:translate(0,-48%)]"
              : "pointer-events-none opacity-0 [transform:translate(-12px,-48%)]"
          } ${
            expanded && !thumbnail
              ? "[transition:opacity_.38s_ease_.19s,transform_.65s_cubic-bezier(.2,.8,.2,1)_.19s]"
              : "[transition:opacity_.38s_ease,transform_.65s_cubic-bezier(.2,.8,.2,1)]"
          }`}
          aria-hidden={!expanded}
          inert={!expanded}
        >
          <h3
            className={`font-extrabold leading-[1.05] tracking-[.015em] text-white ${
              thumbnail ? "mb-[4px] text-[12px]" : "mb-[8px] text-[clamp(12px,4.2cqw,20px)]"
            }`}
          >
            {title}
          </h3>
          <p
            className={`max-w-[220px] text-[#d0d9f4] ${
              thumbnail
                ? "text-[7px] leading-[1.3]"
                : "text-[clamp(7px,1.95cqw,10px)] leading-[1.45] @max-[500px]:text-[clamp(9px,2.7cqw,11px)]"
            }`}
          >
            {description}
          </p>
          {interactive ? (
            <button
              className={shopButtonClass}
              type="button"
              onClick={onShopNow}
              tabIndex={expanded ? 0 : -1}
            >
              Shop Now
            </button>
          ) : (
            <span className={shopButtonClass}>Shop Now</span>
          )}
        </div>
        <div
          className={`absolute top-[50%] z-1 grid h-[94%] origin-center place-items-center ${
            thumbnail
              ? "right-[4%] w-[38%]"
              : "right-[8%] w-[35%] @max-[500px]:right-[5%] @max-[500px]:w-[37%]"
          } ${
            expanded
              ? "opacity-100 [transform:translate(0,-48%)_rotate(13deg)_scale(1)]"
              : "opacity-0 [transform:translate(20px,-45%)_rotate(13deg)_scale(.77)]"
          } ${
            expanded && !thumbnail
              ? "[transition:opacity_.4s_ease_.18s,transform_.8s_cubic-bezier(.18,.8,.22,1)_.18s]"
              : "[transition:opacity_.4s_ease,transform_.8s_cubic-bezier(.18,.8,.22,1)]"
          }`}
          aria-hidden="true"
        >
          <EnergyCan />
        </div>
        {interactive && (
          <button
            ref={toggleRef}
            className={`group/toggle absolute z-4 grid place-items-center border-none bg-transparent p-0 text-white cursor-pointer [transition:inset_.35s,width_.35s,height_.35s,background_.2s] ${
              expanded
                ? "top-[2px] right-[2px] bottom-auto left-auto h-[44px] w-[44px] rounded-[50%]"
                : "inset-0 h-full w-full rounded-[inherit]"
            }`}
            type="button"
            aria-expanded={expanded}
            aria-controls={contentId}
            aria-label={
              expanded ? "Collapse product card" : "Expand product card"
            }
            onClick={onToggle}
          >
            <span className={SR_ONLY}>{expanded ? "Close" : "Open"}</span>
            <span
              className={`grid h-[30px] w-[30px] place-items-center rounded-[50%] border border-[#ffffff36] bg-[#101a3b80] text-[20px] leading-none text-white [transition:opacity_.2s,transform_.2s] ${
                expanded
                  ? "opacity-100 [transform:scale(1.08)]"
                  : "opacity-0 group-hover/toggle:opacity-100 group-hover/toggle:[transform:scale(1.08)] group-focus-visible/toggle:opacity-100 group-focus-visible/toggle:[transform:scale(1.08)]"
              }`}
              aria-hidden="true"
            >
              {expanded ? "×" : "+"}
            </span>
          </button>
        )}
      </article>
    </div>
  );
}

/** A glowing logo that opens into a small, animated energy drink product card. */
export default function RedBullCard({
  className = "",
  title = "REDBULL",
  description = DEFAULT_DESCRIPTION,
  autoPlay = true,
  onShopNow,
}: RedBullCardProps) {
  const [phase, setPhase] = useState<CardPhase>("compact");
  const [shopMessage, setShopMessage] = useState("");
  const manualRef = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pointerWithin = useRef(false);
  const focusWithin = useRef(false);
  const playbackRef = useRef<(() => void) | null>(null);
  const contentId = useId();
  const expanded = phase === "expanded";

  useEffect(() => {
    if (!autoPlay || manualRef.current) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = typeof IntersectionObserver === "undefined";
    let disposed = false;
    let step = 0;
    let remaining = PLAYBACK_STEPS[0].delay;
    let deadline = 0;

    function synchronize() {
      if (disposed) return;
      const running =
        visible &&
        !document.hidden &&
        !motion.matches &&
        !manualRef.current &&
        !pointerWithin.current &&
        !focusWithin.current;
      if (!running) {
        if (timer !== undefined) {
          remaining = Math.max(0, deadline - performance.now());
          clearTimeout(timer);
          timer = undefined;
        }
        return;
      }
      if (timer !== undefined) return;
      deadline = performance.now() + remaining;
      timer = setTimeout(() => {
        timer = undefined;
        if (disposed || manualRef.current) return;
        setPhase(PLAYBACK_STEPS[step].phase);
        step = (step + 1) % PLAYBACK_STEPS.length;
        remaining = PLAYBACK_STEPS[step].delay;
        synchronize();
      }, remaining);
    }

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              visible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
              synchronize();
            },
            { threshold: [0, 0.15] },
          );
    if (stageRef.current) observer?.observe(stageRef.current);
    playbackRef.current = synchronize;
    document.addEventListener("visibilitychange", synchronize);
    motion.addEventListener("change", synchronize);
    synchronize();
    return () => {
      disposed = true;
      if (timer !== undefined) clearTimeout(timer);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
      motion.removeEventListener("change", synchronize);
      if (playbackRef.current === synchronize) playbackRef.current = null;
    };
  }, [autoPlay]);

  function stopPlayback() {
    manualRef.current = true;
    playbackRef.current?.();
  }

  function toggleExpanded() {
    stopPlayback();
    setShopMessage("");
    setPhase((value) => (value === "expanded" ? "compact" : "expanded"));
  }

  return (
    <section
      className={`redbull-card @container isolate flex w-full min-w-0 min-h-0 flex-col text-[#f7f8ff] [font-family:Arial,Helvetica,sans-serif] ${className}`}
      aria-label="Red Bull card animation demo"
    >
      <ComponentStyles css={REDBULL_STYLES} />
      <div
        ref={stageRef}
        className="flex w-full min-h-0 flex-auto flex-col bg-[#22212e] p-[clamp(20px,5cqw,48px)] @max-[500px]:p-[22px_16px]"
        onPointerEnter={() => {
          pointerWithin.current = true;
          playbackRef.current?.();
        }}
        onPointerLeave={() => {
          pointerWithin.current = false;
          playbackRef.current?.();
        }}
        onFocusCapture={() => {
          focusWithin.current = true;
          playbackRef.current?.();
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            focusWithin.current = false;
            playbackRef.current?.();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && expanded) {
            event.preventDefault();
            stopPlayback();
            setPhase("compact");
            setShopMessage("");
            toggleRef.current?.focus();
          }
        }}
      >
        <header className="mb-[clamp(16px,3cqw,24px)] @max-[500px]:mb-[14px]">
          <h2 className="mb-[8px] text-[clamp(27px,5.6cqw,42px)] font-bold leading-[1.1] tracking-[-.035em] text-[#5894ff]">
            RedBull Card Animation
          </h2>
          <p className="text-[clamp(24px,4.8cqw,36px)] font-bold leading-[1.15] tracking-[-.025em] text-[#f7f7fb]">
            Using HTML CSS
          </p>
        </header>
        <div className="flex min-h-0 flex-auto flex-col border border-[#d7d6df] p-[clamp(12px,3cqw,22px)] @max-[500px]:p-[10px]">
          <div className="flex min-h-0 flex-auto border border-[#dad9e1] p-px">
            <ProductScene
              phase={phase}
              title={title}
              description={description}
              interactive
              contentId={contentId}
              toggleRef={toggleRef}
              onToggle={toggleExpanded}
              onShopNow={() => {
                stopPlayback();
                if (onShopNow) onShopNow();
                else
                  setShopMessage(
                    "This is a preview card; no shop destination is linked yet.",
                  );
              }}
            />
          </div>
        </div>
        <p className={SR_ONLY} role="status" aria-live="polite">
          {shopMessage}
        </p>
      </div>
    </section>
  );
}

/** Gallery frames share the illustration without timers, handlers, or nested buttons. */
export function RedBullCardThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  const phases: readonly CardPhase[] = ["compact", "card", "expanded", "card"];
  const phase = phases[Math.abs(Math.trunc(previewStep)) % phases.length];
  return (
    <div
      className={`redbull-card rb-thumbnail @container isolate flex w-full min-w-0 min-h-0 flex-col text-[#f7f8ff] [font-family:Arial,Helvetica,sans-serif] pointer-events-none h-full ${className}`}
      aria-hidden="true"
      inert
    >
      <ComponentStyles css={REDBULL_STYLES} />
      <div className="flex h-full w-full min-h-0 flex-auto flex-col bg-[#22212e] p-[14px]">
        <div className="mb-[10px]">
          <h2 className="mb-[4px] text-[16px] font-bold leading-[1.1] tracking-[-.03em] text-[#5894ff]">
            RedBull Card Animation
          </h2>
          <p className="text-[13px] font-bold leading-[1.15] tracking-[-.025em] text-[#f7f7fb]">
            Using HTML CSS
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col border border-[#d7d6df] p-[6px]">
          <div className="flex h-full w-full min-h-0 flex-auto border border-[#dad9e1] p-px">
            <ProductScene phase={phase} thumbnail />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Only what utilities cannot express: the twinkle keyframes, a blanket reduced-motion
 * reset, and a focus ring that must out-rank an app's unlayered global :focus-visible rule.
 */
const REDBULL_STYLES = `.redbull-card button:focus-visible{outline:3px solid #a9c6ff;outline-offset:4px}
@keyframes rb-twinkle{0%{opacity:.18;transform:scale(.75)}100%{opacity:.72;transform:scale(1.2)}}
@media(prefers-reduced-motion:reduce){.redbull-card *,.redbull-card *::before,.redbull-card *::after{animation:none!important;scroll-behavior:auto!important;transition:none!important}}
`;
