"use client";

import { ComponentStyles } from "./component-styles";

import { useEffect, useRef, useState, type CSSProperties } from "react";

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

/** Phase durations handed to the CSS animations that must last exactly as long as the timers. */
const TIMING = {
  "--tpb-drive": `${DRIVE_MS}ms`,
  "--tpb-leave": `${LEAVE_MS}ms`,
  "--tpb-restore": `${RESTORE_MS}ms`,
} as CSSProperties;

/* The button is the `group/tpb`; its `data-state` drives every part of the scene below. */

/** Shared by the live stage and the thumbnail. */
const STAGE =
  "tpb-stage relative box-border flex w-full min-w-0 flex-col overflow-hidden isolate bg-black text-[#0b1426] @container " +
  "font-[family-name:system-ui,-apple-system,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]";

/** Size tokens: compact stages, default, desktop previews, and wide stages such as full screen. */
const SIZE_TOKENS =
  "[--tpb-w:252px] [--tpb-h:54px] [--tpb-truck:108px] [--tpb-font:15px] [--tpb-creep:20px] " +
  "[@container(max-width:340px)]:[--tpb-w:220px] [@container(max-width:340px)]:[--tpb-h:48px] [@container(max-width:340px)]:[--tpb-truck:94px] [@container(max-width:340px)]:[--tpb-font:14px] [@container(max-width:340px)]:[--tpb-creep:16px] " +
  "@min-[600px]:[--tpb-w:300px] @min-[600px]:[--tpb-h:62px] @min-[600px]:[--tpb-truck:128px] @min-[600px]:[--tpb-font:17px] @min-[600px]:[--tpb-creep:24px] " +
  "@min-[1000px]:[--tpb-w:380px] @min-[1000px]:[--tpb-h:76px] @min-[1000px]:[--tpb-truck:160px] @min-[1000px]:[--tpb-font:21px] @min-[1000px]:[--tpb-creep:30px]";

/** Button shell: the pill, the road line and the label are layered inside. */
const BUTTON =
  "tpb-button group/tpb relative h-(--tpb-h) w-[min(var(--tpb-w),100%)] shrink-0 cursor-pointer rounded-[999px] " +
  "text-(length:--tpb-font) font-bold tracking-[.01em] " +
  SIZE_TOKENS;

/** Idle/error pills lift on hover and press in; driving folds them into the road, restoring grows them back. */
const PILL =
  "tpb-pill absolute inset-0 z-1 rounded-[inherit] bg-[#0dc4f5] [transition:transform_.2s_ease,filter_.2s_ease] " +
  "group-hover/tpb:group-data-[state=idle]/tpb:[filter:brightness(1.07)] group-hover/tpb:group-data-[state=idle]/tpb:[transform:scale(1.02)] " +
  "group-hover/tpb:group-data-[state=error]/tpb:[filter:brightness(1.07)] group-hover/tpb:group-data-[state=error]/tpb:[transform:scale(1.02)] " +
  "group-active/tpb:group-data-[state=idle]/tpb:[transform:scale(.97)] group-active/tpb:group-data-[state=error]/tpb:[transform:scale(.97)] " +
  "group-data-[state=driving]/tpb:[transform:scaleY(0)] group-data-[state=leaving]/tpb:[transform:scaleY(0)] " +
  "group-data-[state=driving]/tpb:animate-[tpb-pill-fold_.2s_cubic-bezier(.55,0,.8,.3)_both] " +
  "group-data-[state=restoring]/tpb:animate-[tpb-pill-grow_var(--tpb-restore)_cubic-bezier(.2,.7,.3,1)_both]";

/** The road: hidden until the pill folds, then fades while the pill grows back. */
const LINE =
  "tpb-line absolute inset-x-0 top-1/2 z-1 -mt-0.5 h-1 rounded-[2px] bg-[#0dc4f5] [transform:scaleY(0)] " +
  "group-data-[state=driving]/tpb:[transform:scaleY(1)] group-data-[state=leaving]/tpb:[transform:scaleY(1)] " +
  "group-data-[state=driving]/tpb:animate-[tpb-line-in_.16s_.1s_ease-out_both] group-data-[state=restoring]/tpb:opacity-0";

const LABEL =
  "tpb-label absolute inset-0 z-2 flex items-center justify-center gap-2 whitespace-nowrap [transition:opacity_.2s] " +
  "group-data-[state=driving]/tpb:opacity-0 group-data-[state=leaving]/tpb:opacity-0 group-data-[state=restoring]/tpb:opacity-0 " +
  "group-data-[state=driving]/tpb:animate-[tpb-label-fold_.18s_ease-in_both] " +
  "group-data-[state=success]/tpb:animate-[tpb-fade-in_.3s_ease-out_both] group-data-[state=error]/tpb:animate-[tpb-shake_.4s_ease-out_both]";

/** The scene overhangs the button so the truck can sit above the road and fade out past its end. */
const SCENE =
  "tpb-scene pointer-events-none invisible absolute -top-16 -right-8 -bottom-3.5 -left-10 z-0 overflow-hidden " +
  "[mask-image:linear-gradient(90deg,#000_calc(100%_-_50px),transparent_calc(100%_-_10px))] " +
  "group-data-[state=driving]/tpb:visible group-data-[state=leaving]/tpb:visible";

/** Creeps forward while driving, then accelerates past the end of the road (a fixed frame in the thumbnail). */
const TRUCK =
  "tpb-truck absolute bottom-[calc(14px_+_var(--tpb-h)/2_+_2px)] left-[calc(40px_+_var(--tpb-w)*.05)] aspect-[124/60] w-(--tpb-truck) " +
  "group-data-[state=driving]/tpb:[transform:translateX(var(--tpb-creep))] group-data-[state=driving]/tpb:animate-[tpb-creep_var(--tpb-drive)_ease-in-out_both]";
const TRUCK_LEAVING =
  "group-data-[state=leaving]/tpb:[transform:translateX(calc(var(--tpb-w)_+_24px))] group-data-[state=leaving]/tpb:animate-[tpb-leave_var(--tpb-leave)_cubic-bezier(.6,0,.9,.5)_both]";
const TRUCK_LEAVING_THUMB = "group-data-[state=leaving]/tpb:[transform:translateX(calc(var(--tpb-w)*.66))]";

const TRUCK_ART =
  "tpb-truck-art block size-full origin-bottom " +
  "group-data-[state=driving]/tpb:animate-[tpb-rock_.34s_ease-in-out_infinite_alternate] group-data-[state=leaving]/tpb:animate-[tpb-rock_.34s_ease-in-out_infinite_alternate]";

const BEAM =
  "tpb-beam absolute top-[61.5%] left-[99%] h-[23%] w-[38%] opacity-0 blur-[.5px] " +
  "[clip-path:polygon(0_38%,100%_0,100%_100%,0_62%)] " +
  "group-data-[state=driving]/tpb:opacity-100 group-data-[state=leaving]/tpb:opacity-100 group-data-[state=driving]/tpb:animate-[tpb-beam-on_.5s_.3s_both]";

/** Parcels tossed into the cargo box, staggered while driving; the thumbnail freezes the first one mid-air. */
const ITEM = "tpb-item absolute top-0 left-0 opacity-0";
const ITEM_BOX = "tpb-item-box size-[7px] rounded-[1.5px] bg-white group-data-[state=driving]/tpb:animate-[tpb-toss_1.6s_ease-in_.5s_infinite]";
const ITEM_BOX_THUMB = "group-data-[state=driving]/tpb:opacity-100 group-data-[state=driving]/tpb:[transform:translate(-12px,-12px)_rotate(-12deg)]";
const ITEM_RING = "tpb-item-ring size-[7px] rounded-[50%] border-[2.5px] border-white group-data-[state=driving]/tpb:animate-[tpb-toss_1.6s_ease-in_.9s_infinite]";
const ITEM_SPARK =
  "tpb-item-spark h-[9px] w-[5px] bg-white [clip-path:polygon(60%_0,0_55%,45%_55%,30%_100%,100%_40%,55%_40%)] " +
  "group-data-[state=driving]/tpb:animate-[tpb-toss_1.6s_ease-in_1.3s_infinite]";
const ITEM_PUFF = "tpb-item-puff size-2 rounded-[50%] bg-[#eaf6ff] group-data-[state=driving]/tpb:animate-[tpb-toss_1.6s_ease-in_1.7s_infinite]";

/** Side-view box truck facing right, with headlight beam. Neutral logo mark on the cargo box. */
function Truck({ thumb }: { thumb: boolean }) {
  return (
    <span className={`${TRUCK} ${thumb ? TRUCK_LEAVING_THUMB : TRUCK_LEAVING}`} aria-hidden="true">
      <span className="tpb-truck-body relative block size-full group-data-[state=driving]/tpb:animate-[tpb-truck-in_.3s_ease-out_both]">
        <svg className={TRUCK_ART} viewBox="0 0 124 60" fill="none">
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
        <span className={BEAM} />
      </span>
      <span className="tpb-items absolute top-[28%] left-0 size-0">
        <span className={`${ITEM} ${ITEM_BOX} ${thumb ? ITEM_BOX_THUMB : ""}`} />
        <span className={`${ITEM} ${ITEM_RING}`} />
        <span className={`${ITEM} ${ITEM_SPARK}`} />
        <span className={`${ITEM} ${ITEM_PUFF}`} />
      </span>
    </span>
  );
}

/** Pill, road line, truck scene and label shared by the button and its thumbnail. */
function Visual({ text, success, thumb = false }: { text: string; success: boolean; thumb?: boolean }) {
  return (
    <>
      <span className={PILL} aria-hidden="true" />
      <span className={LINE} aria-hidden="true" />
      <span className={SCENE} aria-hidden="true"><Truck thumb={thumb} /></span>
      <span className={LABEL}>
        {text}
        {success && (
          <svg
            className="tpb-check h-3.5 w-4 fill-none stroke-current stroke-2 [stroke-dasharray:20px] [stroke-dashoffset:0] [stroke-linecap:round] [stroke-linejoin:round] group-data-[state=success]/tpb:animate-[tpb-draw_.35s_.15s_ease-out_both]"
            viewBox="0 0 16 14"
            aria-hidden="true"
          >
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
    <section className={`${STAGE} ${className}`} aria-label="Truck pay button">
      <ComponentStyles css={TRUCK_PAY_BUTTON_CSS} />
      <div className="tpb-canvas flex min-h-80 flex-[1_0_auto] items-center justify-center px-4 pt-18 pb-10 @min-[600px]:min-h-100 @min-[600px]:px-6 @min-[600px]:pt-22 @min-[600px]:pb-12">
        <button
          type="button"
          className={BUTTON}
          style={TIMING}
          data-state={phase}
          onClick={() => void pay()}
          aria-disabled={locked}
          aria-busy={pending}
          aria-label={pending ? "Processing payment" : undefined}
        >
          <Visual text={text} success={phase === "success"} />
        </button>
        <p className="sr-only" role="status" aria-live="polite">{message}</p>
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
    <div className={`${STAGE} tpb-thumb h-full ${className}`} aria-hidden="true" inert>
      <ComponentStyles css={TRUCK_PAY_BUTTON_CSS} />
      <div className="tpb-canvas flex min-h-0 flex-1 items-center justify-center px-4 pt-12 pb-6">
        <div className={BUTTON} data-state={frame}>
          <Visual text={frame === "success" ? "Redirected" : "Yeah, I want that"} success={frame === "success"} thumb />
        </div>
      </div>
    </div>
  );
}

/* Raw CSS keeps only what utilities cannot: keyframes, two button rules that must beat unlayered
   globals (button cursor, :focus-visible), the beam gradient (Tailwind's minifier would round its
   .7 alpha to #f0a020b3), and the blanket motion switches for thumbnails and reduced motion. */
const TRUCK_PAY_BUTTON_CSS = `
.tpb-stage .tpb-button[aria-disabled="true"] { cursor: default; }
.tpb-stage .tpb-button:focus-visible { outline: 3px solid #8be4ff; outline-offset: 5px; }
.tpb-stage .tpb-beam { background-image: linear-gradient(90deg, #ffc23a, rgb(240 160 32 / .7) 55%, transparent); }

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

/* Thumbnail: static frames, no motion. */
.tpb-stage.tpb-thumb *, .tpb-stage.tpb-thumb *::before, .tpb-stage.tpb-thumb *::after { animation: none !important; transition: none !important; }

/* Reduced motion: no drive; the pill reads "Processing…" and then shows the result. */
@media (prefers-reduced-motion: reduce) {
  .tpb-stage *, .tpb-stage *::before, .tpb-stage *::after { animation: none !important; transition: none !important; }
}
`;
