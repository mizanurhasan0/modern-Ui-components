"use client";

import { ComponentStyles } from "./component-styles";

import { useEffect, useRef, useState } from "react";

export interface TruckPayButtonProps {
  className?: string;
  /** Text on the idle button. */
  label?: string;
  /** Text shown next to the drawn checkmark once the run completes. */
  successLabel?: string;
  /** Starts with the drive; the truck keeps driving until it settles. Reject to show a retry state. */
  onPay?: () => void | Promise<void>;
  /** Called after the success state appears. */
  onComplete?: () => void;
  /** Milliseconds after success before returning to idle; `null` keeps the success state. */
  resetAfter?: number | null;
}

type Phase = "idle" | "driving" | "leaving" | "restoring" | "processing" | "success" | "error";

/** Minimum time on the road, measured from the click to the truck pulling away. */
const DRIVE_MS = 3400;
/** Time for the truck to accelerate out of view. */
const LEAVE_MS = 450;
/** Time for the road line to grow back into the pill. */
const RESTORE_MS = 320;

const PENDING: Phase[] = ["driving", "leaving", "restoring", "processing"];

/** Side-view box truck facing right, with headlight beam. Neutral logo mark on the cargo box. */
function Truck() {
  return (
    <span className="tpb-truck" aria-hidden="true">
      <span className="tpb-truck-body">
        <svg className="tpb-truck-art" viewBox="0 0 124 60" fill="none">
          {/* Cargo box and rear door */}
          <rect x="18" y="0" width="66" height="50" rx="1.5" fill="#f2f4fc" />
          <path d="M18 44h66v6H18Z" fill="#e2e6f0" />
          <rect x="0" y=".5" width="19" height="49.5" rx="1.5" fill="#1b7db8" />
          <path d="M1.5 .5h11L1.5 18Z" fill="#2aa2de" fillOpacity=".55" />
          <path d="M19 30v20h-6Z" fill="#11598c" fillOpacity=".5" />
          {/* Cab */}
          <path d="M84 13h22l10 18h5a3 3 0 0 1 3 3v16H84Z" fill="#f4f6fb" />
          <path d="M84 13h4v37h-4Z" fill="#d9dde6" />
          <path d="M95 17h9.6l5.6 11H95Z" fill="#0b1220" />
          <rect x="121.3" y="39" width="2.7" height="5" rx="1" fill="#ffb52e" />
          {/* Logo mark: two layered tags */}
          <rect x="53" y="15.5" width="13" height="17" rx="3.2" transform="skewX(-12)" fill="#4d9fd2" />
          <rect x="48.5" y="11" width="13" height="17" rx="3.2" transform="skewX(-12)" fill="#222b5e" />
          {/* Chassis and wheels */}
          <rect x="-1" y="47.5" width="126" height="5" rx="2" fill="#0f5f92" />
          <circle cx="36" cy="50" r="8.5" fill="#0c5585" />
          <circle cx="36" cy="50" r="2.6" fill="#fff" />
          <circle cx="101" cy="50" r="8.5" fill="#0c5585" />
          <circle cx="101" cy="50" r="2.6" fill="#fff" />
        </svg>
        <span className="tpb-beam" />
      </span>
      <span className="tpb-items">
        <span className="tpb-item tpb-item-box" />
        <span className="tpb-item tpb-item-ring" />
        <span className="tpb-item tpb-item-spark" />
        <span className="tpb-item tpb-item-puff" />
      </span>
    </span>
  );
}

/** Pill, road line, truck scene and label shared by the button and its thumbnail. */
function Visual({ text, success }: { text: string; success: boolean }) {
  return (
    <>
      <span className="tpb-pill" aria-hidden="true" />
      <span className="tpb-line" aria-hidden="true" />
      <span className="tpb-scene" aria-hidden="true"><Truck /></span>
      <span className="tpb-label">
        {text}
        {success && (
          <svg className="tpb-check" viewBox="0 0 16 14" aria-hidden="true">
            <path d="M1.5 7.5 5 11l9.5-9.5" />
          </svg>
        )}
      </span>
    </>
  );
}

/** A pay button whose pill flattens into a road for a delivery truck, then reports the redirect. */
export default function TruckPayButton({
  className = "",
  label = "Yeah, I want that",
  successLabel = "Redirected",
  onPay,
  onComplete,
  resetAfter = 2500,
}: TruckPayButtonProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const mounted = useRef(false);
  const busy = useRef(false);
  const run = useRef(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const pending = PENDING.includes(phase);
  const locked = pending || (phase === "success" && resetAfter !== null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      run.current += 1;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  async function pay() {
    if (busy.current || locked) return;
    busy.current = true;
    const currentRun = ++run.current;
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const active = () => mounted.current && currentRun === run.current;
    const later = (ms: number, task: () => void) => {
      timers.current.push(setTimeout(() => { if (active()) task(); }, ms));
    };
    let driveDone = reduced;
    let outcome: "paid" | "failed" | null = null;

    // Final state once the truck has left (or immediately with reduced motion).
    const finish = () => {
      busy.current = false;
      if (outcome === "failed") {
        setPhase("error");
        setMessage("Payment failed. Try again.");
        return;
      }
      setPhase("success");
      setMessage(successLabel);
      onComplete?.();
      if (resetAfter !== null) later(Math.max(0, resetAfter), () => { setPhase("idle"); setMessage(""); });
    };
    // Leave only when both the minimum drive and the payment are done.
    const settle = () => {
      if (!active() || !driveDone || !outcome) return;
      if (reduced) { finish(); return; }
      setPhase("leaving");
      later(LEAVE_MS, () => {
        setPhase("restoring");
        later(RESTORE_MS, finish);
      });
    };

    setPhase(reduced ? "processing" : "driving");
    setMessage("Processing payment…");
    if (!reduced) later(DRIVE_MS, () => { driveDone = true; settle(); });

    try {
      await onPay?.();
      outcome = "paid";
    } catch {
      outcome = "failed";
    }
    settle();
  }

  // While the truck drives the label is hidden, so it keeps its previous text as it folds away.
  const text = phase === "success" ? successLabel : phase === "error" ? "Try again" : phase === "processing" ? "Processing…" : label;

  return (
    <section className={`tpb-stage relative w-full overflow-hidden ${className}`} aria-label="Truck pay button">
      <ComponentStyles css={TRUCK_PAY_BUTTON_CSS} />
      <div className="tpb-canvas">
        <button
          type="button"
          className="tpb-button"
          data-state={phase}
          onClick={() => void pay()}
          aria-disabled={locked}
          aria-busy={pending}
          aria-label={pending ? "Processing payment" : undefined}
        >
          <Visual text={text} success={phase === "success"} />
        </button>
        <p className="tpb-sr-only" role="status" aria-live="polite">{message}</p>
      </div>
    </section>
  );
}

const THUMBNAIL_FRAMES = ["idle", "driving", "leaving", "success"] as const;

/** Inert gallery frames: idle pill → truck on the road → truck leaving → redirected. */
export function TruckPayButtonThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) % THUMBNAIL_FRAMES.length : 0;
  const frame = THUMBNAIL_FRAMES[step];

  return (
    <div className={`tpb-stage tpb-thumb relative h-full w-full overflow-hidden ${className}`} aria-hidden="true" inert>
      <ComponentStyles css={TRUCK_PAY_BUTTON_CSS} />
      <div className="tpb-canvas">
        <div className="tpb-button" data-state={frame}>
          <Visual text={frame === "success" ? "Redirected" : "Yeah, I want that"} success={frame === "success"} />
        </div>
      </div>
    </div>
  );
}

const TRUCK_PAY_BUTTON_CSS = `
.tpb-stage {
  --tpb-blue: #0dc4f5;
  --tpb-ink: #0b1426;
  --tpb-w: 252px;
  --tpb-h: 54px;
  --tpb-truck: 108px;
  --tpb-font: 15px;
  --tpb-creep: 20px;
  box-sizing: border-box;
  container-type: inline-size;
  min-width: 0;
  background: #000;
  color: var(--tpb-ink);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  isolation: isolate;
}
.tpb-stage *, .tpb-stage *::before, .tpb-stage *::after { box-sizing: border-box; }
.tpb-stage .tpb-canvas { display: flex; align-items: center; justify-content: center; min-height: 320px; padding: 72px 16px 40px; }

/* Button shell: the pill, the road line and the label are layered inside. */
.tpb-stage .tpb-button { position: relative; flex-shrink: 0; width: min(var(--tpb-w), 100%); height: var(--tpb-h); margin: 0; padding: 0; border: 0; border-radius: 999px; background: none; color: inherit; font: inherit; font-size: var(--tpb-font); font-weight: 700; letter-spacing: .01em; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.tpb-stage .tpb-button[aria-disabled="true"] { cursor: default; }
.tpb-stage .tpb-button:focus-visible { outline: 3px solid #8be4ff; outline-offset: 5px; }
.tpb-stage .tpb-pill { position: absolute; z-index: 1; inset: 0; border-radius: inherit; background: var(--tpb-blue); transition: transform .2s ease, filter .2s ease; }
.tpb-stage .tpb-button:is([data-state="idle"], [data-state="error"]):hover .tpb-pill { filter: brightness(1.07); transform: scale(1.02); }
.tpb-stage .tpb-button:is([data-state="idle"], [data-state="error"]):active .tpb-pill { transform: scale(.97); }
.tpb-stage .tpb-line { position: absolute; z-index: 1; left: 0; right: 0; top: 50%; height: 4px; margin-top: -2px; border-radius: 2px; background: var(--tpb-blue); transform: scaleY(0); }
.tpb-stage .tpb-label { position: absolute; z-index: 2; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; transition: opacity .2s; }
.tpb-stage .tpb-check { width: 16px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 20px; stroke-dashoffset: 0; }

/* The scene overhangs the button so the truck can sit above the road and fade out past its end. */
.tpb-stage .tpb-scene { position: absolute; z-index: 0; left: -40px; right: -32px; top: -64px; bottom: -14px; overflow: hidden; pointer-events: none; visibility: hidden; -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 50px), transparent calc(100% - 10px)); mask-image: linear-gradient(90deg, #000 calc(100% - 50px), transparent calc(100% - 10px)); }
.tpb-stage .tpb-truck { position: absolute; left: calc(40px + var(--tpb-w) * .05); bottom: calc(14px + var(--tpb-h) / 2 + 2px); width: var(--tpb-truck); aspect-ratio: 124 / 60; }
.tpb-stage .tpb-truck-body, .tpb-stage .tpb-truck-art { display: block; width: 100%; height: 100%; }
.tpb-stage .tpb-truck-body { position: relative; }
.tpb-stage .tpb-truck-art { transform-origin: 50% 100%; }
.tpb-stage .tpb-beam { position: absolute; left: 99%; top: 61.5%; width: 38%; height: 23%; opacity: 0; background: linear-gradient(90deg, #ffc23a, rgb(240 160 32 / .7) 55%, transparent); clip-path: polygon(0 38%, 100% 0, 100% 100%, 0 62%); filter: blur(.5px); }
.tpb-stage .tpb-items { position: absolute; left: 0; top: 28%; width: 0; height: 0; }
.tpb-stage .tpb-item { position: absolute; left: 0; top: 0; width: 7px; height: 7px; opacity: 0; background: #fff; }
.tpb-stage .tpb-item-box { border-radius: 1.5px; }
.tpb-stage .tpb-item-ring { border-radius: 50%; background: none; border: 2.5px solid #fff; }
.tpb-stage .tpb-item-spark { width: 5px; height: 9px; clip-path: polygon(60% 0, 0 55%, 45% 55%, 30% 100%, 100% 40%, 55% 40%); }
.tpb-stage .tpb-item-puff { width: 8px; height: 8px; border-radius: 50%; background: #eaf6ff; }

/* Driving: the pill folds into the road, the truck appears, rocks and creeps forward. */
.tpb-stage .tpb-button:is([data-state="driving"], [data-state="leaving"]) .tpb-pill { transform: scaleY(0); }
.tpb-stage .tpb-button:is([data-state="driving"], [data-state="leaving"]) .tpb-line { transform: scaleY(1); }
.tpb-stage .tpb-button:is([data-state="driving"], [data-state="leaving"], [data-state="restoring"]) .tpb-label { opacity: 0; }
.tpb-stage .tpb-button:is([data-state="driving"], [data-state="leaving"]) .tpb-scene { visibility: visible; }
.tpb-stage .tpb-button[data-state="driving"] .tpb-truck { transform: translateX(var(--tpb-creep)); animation: tpb-creep ${DRIVE_MS}ms ease-in-out both; }
.tpb-stage .tpb-button:is([data-state="driving"], [data-state="leaving"]) .tpb-beam { opacity: 1; }
.tpb-stage .tpb-button[data-state="driving"] .tpb-pill { animation: tpb-pill-fold .2s cubic-bezier(.55, 0, .8, .3) both; }
.tpb-stage .tpb-button[data-state="driving"] .tpb-label { animation: tpb-label-fold .18s ease-in both; }
.tpb-stage .tpb-button[data-state="driving"] .tpb-line { animation: tpb-line-in .16s .1s ease-out both; }
.tpb-stage .tpb-button[data-state="driving"] .tpb-truck-body { animation: tpb-truck-in .3s ease-out both; }
.tpb-stage .tpb-button:is([data-state="driving"], [data-state="leaving"]) .tpb-truck-art { animation: tpb-rock .34s ease-in-out infinite alternate; }
.tpb-stage .tpb-button[data-state="driving"] .tpb-beam { animation: tpb-beam-on .5s .3s both; }
.tpb-stage .tpb-button[data-state="driving"] .tpb-item { animation: tpb-toss 1.6s ease-in infinite; }
.tpb-stage .tpb-button[data-state="driving"] .tpb-item-box { animation-delay: .5s; }
.tpb-stage .tpb-button[data-state="driving"] .tpb-item-ring { animation-delay: .9s; }
.tpb-stage .tpb-button[data-state="driving"] .tpb-item-spark { animation-delay: 1.3s; }
.tpb-stage .tpb-button[data-state="driving"] .tpb-item-puff { animation-delay: 1.7s; }

/* Leaving: the truck accelerates past the end of the road. */
.tpb-stage .tpb-button[data-state="leaving"] .tpb-truck { transform: translateX(calc(var(--tpb-w) + 24px)); animation: tpb-leave ${LEAVE_MS}ms cubic-bezier(.6, 0, .9, .5) both; }

/* Restoring and result: the road grows back into the pill and the label returns. */
.tpb-stage .tpb-button[data-state="restoring"] .tpb-pill { animation: tpb-pill-grow ${RESTORE_MS}ms cubic-bezier(.2, .7, .3, 1) both; }
.tpb-stage .tpb-button[data-state="restoring"] .tpb-line { opacity: 0; }
.tpb-stage .tpb-button[data-state="success"] .tpb-label { animation: tpb-fade-in .3s ease-out both; }
.tpb-stage .tpb-button[data-state="success"] .tpb-check { animation: tpb-draw .35s .15s ease-out both; }
.tpb-stage .tpb-button[data-state="error"] .tpb-label { animation: tpb-shake .4s ease-out both; }

@keyframes tpb-pill-fold { from { transform: scaleY(1); } to { transform: scaleY(.07); } }
@keyframes tpb-pill-grow { from { transform: scaleY(.07); } to { transform: scaleY(1); } }
@keyframes tpb-line-in { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes tpb-label-fold { from { opacity: 1; transform: scaleY(1); } to { opacity: 0; transform: scaleY(.1); } }
@keyframes tpb-truck-in { 0% { opacity: 0; transform: translateY(12px); } 40% { opacity: 1; } 100% { opacity: 1; transform: none; } }
@keyframes tpb-creep { from { transform: translateX(0); } to { transform: translateX(var(--tpb-creep)); } }
@keyframes tpb-leave { from { transform: translateX(var(--tpb-creep)); } to { transform: translateX(calc(var(--tpb-w) + 24px)); } }
@keyframes tpb-rock { from { transform: translateY(0) rotate(0); } to { transform: translateY(-1px) rotate(-.6deg); } }
@keyframes tpb-beam-on { 0% { opacity: 0; } 30% { opacity: .85; } 45% { opacity: .25; } 100% { opacity: 1; } }
@keyframes tpb-toss {
  0% { opacity: 0; transform: translate(-26px, -26px) rotate(-40deg) scale(.9); }
  15% { opacity: 1; }
  65% { opacity: 1; transform: translate(2px, 0) rotate(25deg) scale(.85); }
  80%, 100% { opacity: 0; transform: translate(8px, 2px) rotate(40deg) scale(.4); }
}
@keyframes tpb-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes tpb-draw { from { stroke-dashoffset: 20px; } to { stroke-dashoffset: 0; } }
@keyframes tpb-shake { 0%, 100% { transform: none; } 20%, 60% { transform: translateX(-4px); } 40%, 80% { transform: translateX(4px); } }

.tpb-stage .tpb-sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

/* Desktop previews get a larger button and truck. */
@container (min-width: 600px) {
  .tpb-stage .tpb-canvas { min-height: 400px; padding: 88px 24px 48px; }
  .tpb-stage .tpb-button { --tpb-w: 300px; --tpb-h: 62px; --tpb-truck: 128px; --tpb-font: 17px; --tpb-creep: 24px; }
}
@container (max-width: 340px) {
  .tpb-stage .tpb-button { --tpb-w: 220px; --tpb-h: 48px; --tpb-truck: 94px; --tpb-font: 14px; --tpb-creep: 16px; }
}

/* Thumbnail: static frames, no motion. */
.tpb-stage.tpb-thumb { display: flex; }
.tpb-stage.tpb-thumb .tpb-canvas { flex: 1; min-height: 0; padding: 48px 16px 24px; }
.tpb-stage.tpb-thumb *, .tpb-stage.tpb-thumb *::before, .tpb-stage.tpb-thumb *::after { animation: none !important; transition: none !important; }
.tpb-stage.tpb-thumb .tpb-button[data-state="driving"] .tpb-item-box { opacity: 1; transform: translate(-12px, -12px) rotate(-12deg); }
.tpb-stage.tpb-thumb .tpb-button[data-state="leaving"] .tpb-truck { transform: translateX(calc(var(--tpb-w) * .66)); }

/* Reduced motion: no drive; the pill reads "Processing…" and then shows the result. */
@media (prefers-reduced-motion: reduce) {
  .tpb-stage *, .tpb-stage *::before, .tpb-stage *::after { animation: none !important; transition: none !important; }
}
`;
