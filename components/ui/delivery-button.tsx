"use client";

import { ComponentStyles } from "./component-styles";

import { useEffect, useId, useRef, useState } from "react";

export interface DeliveryButtonProps {
  /** Resolve when your order succeeds; reject to show a retryable error. */
  onOrder?: () => void | Promise<void>;
  label?: string;
  successLabel?: string;
  disabled?: boolean;
  className?: string;
}

type DeliveryState = "idle" | "loading" | "driving" | "waiting" | "success" | "error";

// Scene parts react to the button's `data-moving` flag (set while loading or driving).
const ROOT_CLASS = "delivery-button @container isolate flex min-w-0 flex-col [font-family:Arial,Helvetica,sans-serif]";
const STAGE_CLASS = "db-stage flex flex-[1_0_auto] flex-col items-center justify-center bg-white";
const BUTTON_CLASS = "db-button group relative shrink-0 cursor-pointer overflow-hidden rounded-[999px] border-none bg-[#090d17] font-normal text-white shadow-[inset_0_1px_1px_#ffffff18] [font-family:Arial,Helvetica,sans-serif] [-webkit-tap-highlight-color:transparent] [transition:box-shadow_.2s,transform_.2s]";
const LABEL_CLASS = "db-label absolute inset-0 z-4 flex items-center justify-center gap-2.5 whitespace-nowrap [transition:opacity_.2s] group-data-moving:opacity-0";
const CHECK_CLASS = "db-check text-[#24bf83] [stroke-dasharray:22] [stroke-dashoffset:0] animate-[db-check-in_.4s_ease_both]";

function DeliveryTruck() {
  return <span className="db-truck absolute top-1/2 left-1/2 z-3 -mt-[26px] -ml-[54px] block h-[52px] w-[108px] [transform:translateX(260px)] group-data-moving:animate-[db-truck-trip_7s_linear_both] @max-[420.02px]:[scale:.85]" aria-hidden="true"><svg className="block overflow-visible" viewBox="0 0 108 52" width="108" height="52" fill="none">
    <path className="db-headlight db-headlight-top opacity-0 blur-[3px] group-data-moving:animate-[db-lights_7s_linear_both]" d="m94 8 25-8v18Z" fill="#fff38a" />
    <path className="db-headlight db-headlight-bottom opacity-0 blur-[3px] group-data-moving:animate-[db-lights_7s_linear_both]" d="m94 44 25-8v18Z" fill="#fff38a" />
    <rect x="72" y="5" width="25" height="42" rx="6" fill="#e8233d" />
    <path d="M79 8h9c4 0 6 4 6 9v18c0 5-2 9-6 9h-9V8Z" fill="#fc3a4c" />
    <path d="M81 10h5c3 0 5 3 5 7v18c0 4-2 7-5 7h-5V10Z" fill="#141b24" />
    <path d="m83 12 6 5v6h-6V12Z" fill="#44505d" />
    <path d="M76 7v38" stroke="#ff7780" strokeWidth="2" />
    <rect x="94" y="9" width="3" height="7" rx="1" fill="#fff48d" />
    <rect x="94" y="36" width="3" height="7" rx="1" fill="#fff48d" />
    <rect x="69" y="2" width="6" height="6" rx="1.5" fill="#16191d" />
    <rect x="69" y="44" width="6" height="6" rx="1.5" fill="#16191d" />
    <rect x="12" y="3" width="60" height="46" rx="1.5" fill="#f9fbff" />
    <path d="M15 7h53v36H15" fill="#fff" />
    <path d="M12 42h60v7H12Z" fill="#e4e9f2" />
    <path d="M68 4v44M15 7h50M15 11h50" stroke="#edf0f6" strokeWidth="1" />
    <path className="db-door db-door-top origin-[12px_3px] group-data-moving:animate-[db-door-top_7s_linear_both]" d="M12 3v23" stroke="#dce3ed" strokeWidth="3" />
    <path className="db-door db-door-bottom origin-[12px_49px] group-data-moving:animate-[db-door-bottom_7s_linear_both]" d="M12 49V26" stroke="#dce3ed" strokeWidth="3" />
  </svg></span>;
}

function DeliveryScene() {
  return <span className="db-scene pointer-events-none absolute inset-0 opacity-0 group-data-moving:opacity-100" aria-hidden="true">
    <span className="db-road absolute top-[calc(50%-1px)] -left-full z-1 h-0.5 w-[300%] bg-[repeating-linear-gradient(90deg,#f7faff_0_6px,transparent_6px_20px)] opacity-0 group-data-moving:animate-[db-road-travel_7s_linear_both]" />
    <span className="db-package absolute top-[calc(50%-14px)] left-[calc(50%-115px)] z-2 size-7 rounded-[3px] bg-[#ffdc00] opacity-0 shadow-[inset_0_0_0_1px_#d8b900] [transform:translateX(-25px)] group-data-moving:animate-[db-load-package_7s_linear_both] @max-[420.02px]:[scale:.85]"><span className="absolute inset-x-0 top-3 h-[3px] bg-[#e5bf09]" /></span>
    <DeliveryTruck />
  </span>;
}

/** Complete a local demo, or wait for onOrder before displaying a successful order. */
export default function DeliveryButton({ onOrder, label = "Complete Order", successLabel = "Order Placed", disabled = false, className = "" }: DeliveryButtonProps) {
  const [state, setState] = useState<DeliveryState>("idle");
  const [feedback, setFeedback] = useState("");
  const mounted = useRef(false);
  const busy = useRef(false);
  const run = useRef(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const moving = state === "loading" || state === "driving";
  const pending = moving || state === "waiting";

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      run.current += 1;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  async function placeOrder() {
    if (disabled || busy.current || state === "success") return;
    busy.current = true;
    const currentRun = ++run.current;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFinished = reduced;
    let orderFinished = false;
    const active = () => mounted.current && currentRun === run.current;
    const finish = () => {
      if (!active() || !animationFinished || !orderFinished) return;
      busy.current = false;
      setState("success");
      setFeedback(onOrder ? "Your order was placed successfully." : "Demo complete. No order was placed.");
    };
    setState(reduced ? "waiting" : "loading");
    setFeedback("");
    if (!reduced) {
      timers.current.push(setTimeout(() => { if (active()) setState("driving"); }, 2900));
      timers.current.push(setTimeout(() => {
        if (!active()) return;
        animationFinished = true;
        if (orderFinished) finish();
        else { setState("waiting"); setFeedback("Confirming your order…"); }
      }, 7000));
    }
    try {
      await onOrder?.();
      orderFinished = true;
      finish();
    } catch {
      if (!active()) return;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      busy.current = false;
      setState("error");
      setFeedback("Your order couldn’t be completed. Please try again.");
    }
  }

  function resetDemo() {
    if (onOrder || busy.current) return;
    setState("idle");
    setFeedback("");
    // Keep keyboard users in the action after removing the replay control.
    button.current?.focus({ preventScroll: true });
  }

  return <section className={`${ROOT_CLASS} relative w-full ${className}`} aria-label="Animated order button">
    <ComponentStyles css={DELIVERY_STYLES} />
    <div className={`${STAGE_CLASS} min-h-[410px] px-6 pt-[65px] pb-10 @max-[420.02px]:min-h-[350px] @max-[420.02px]:px-5 @max-[420.02px]:pt-[50px] @max-[420.02px]:pb-[30px]`}>
      <button ref={button} type="button" className={`${BUTTON_CLASS} h-24 w-[min(360px,100%)] text-[17px] hover:not-aria-disabled:shadow-[inset_0_1px_1px_#ffffff18,0_8px_18px_#090d171b] hover:not-aria-disabled:[transform:translateY(-1px)] disabled:cursor-not-allowed disabled:opacity-45 @max-[420.02px]:h-20 @max-[420.02px]:text-[15px]`} data-state={state} data-moving={moving || undefined} onClick={() => void placeOrder()} disabled={disabled} aria-disabled={pending || state === "success" || disabled} aria-busy={pending} aria-describedby={feedback ? `${id}-feedback` : undefined} aria-label={pending ? "Processing order" : state === "success" ? onOrder ? successLabel : "Order animation complete — demo only" : state === "error" ? "Retry order" : label}>
        <span className={LABEL_CLASS}>{state === "error" ? "Try again" : state === "success" ? <>{successLabel}<svg className={CHECK_CLASS} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg></> : state === "waiting" ? "Processing…" : label}</span>
        <DeliveryScene />
      </button>
      <div className="db-status mt-[18px] h-[61px] max-w-[360px] text-center text-[11px] leading-[1.6] text-[#75808d]">
        <p id={`${id}-feedback`} className={state === "error" ? "m-0 text-[#b74242]" : "m-0"} role={state === "error" ? "alert" : "status"} aria-live="polite">{feedback}</p>
        {state === "success" && !onOrder && <button type="button" className="db-replay mt-2 cursor-pointer border-none bg-transparent px-2 py-[3px] [font:inherit] text-[#586675] underline underline-offset-3" onClick={resetDemo}>Replay demo</button>}
      </div>
    </div>
  </section>;
}

/** Still frames of the animation: idle, loading, driving, and success. */
export function DeliveryButtonThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const states = ["idle", "loading", "driving", "success"] as const;
  const state = states[Math.abs(Math.trunc(previewStep)) % states.length];
  return <div className={`${ROOT_CLASS} db-thumbnail pointer-events-none h-full ${className}`} aria-hidden="true" inert><ComponentStyles css={DELIVERY_STYLES} /><div className={`${STAGE_CLASS} h-full min-h-0 p-[30px]`}><div className={`${BUTTON_CLASS} h-[72px] w-[min(270px,100%)] text-[13px]`} data-state={state} data-moving={state === "loading" || state === "driving" || undefined}><span className={LABEL_CLASS}>{state === "success" ? <>Order Placed<svg className={CHECK_CLASS} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg></> : "Complete Order"}</span><DeliveryScene /></div></div></div>;
}

/* Kept raw: keyframes, the thumbnail's state-driven still frames, reduced motion, and the focus/cursor
   rules that must beat the site's unlayered global :focus-visible and button cursor styles. */
const DELIVERY_STYLES = `
.delivery-button .db-button:focus-visible,.delivery-button .db-replay:focus-visible{outline:3px solid #607dae;outline-offset:5px}.delivery-button .db-button[aria-disabled=true]{cursor:default}
@keyframes db-truck-trip{0%{transform:translateX(260px)}12%,42%{transform:translateX(0)}58%{transform:translateX(72px)}85%{transform:translateX(-125px)}94%,100%{transform:translateX(-260px)}}@keyframes db-load-package{0%,9%{opacity:0;transform:translateX(-25px)}13%,23%{opacity:1;transform:translateX(0)}34%{opacity:1;transform:translateX(91px)}36%,100%{opacity:0;transform:translateX(91px)}}@keyframes db-door-top{0%,12%{transform:rotate(0)}17%,31%{transform:rotate(120deg)}38%,100%{transform:rotate(0)}}@keyframes db-door-bottom{0%,14%{transform:rotate(0)}19%,33%{transform:rotate(-120deg)}40%,100%{transform:rotate(0)}}@keyframes db-lights{0%,39%{opacity:0}45%,87%{opacity:.55}95%,100%{opacity:0}}@keyframes db-road-travel{0%,40%{opacity:0;transform:translateX(0)}45%{opacity:1}87%{opacity:1}95%,100%{opacity:0;transform:translateX(-200px)}}@keyframes db-check-in{from{stroke-dashoffset:22}to{stroke-dashoffset:0}}
.delivery-button.db-thumbnail *{animation:none!important}.delivery-button.db-thumbnail .db-truck{transform:translateX(0);scale:.8;transition:transform .7s ease}.delivery-button.db-thumbnail .db-package{transition:transform .7s ease,opacity .35s}.delivery-button.db-thumbnail :is(.db-scene,.db-label,.db-road,.db-headlight){transition:opacity .35s}.delivery-button.db-thumbnail .db-button[data-state=loading] .db-package{opacity:1;transform:translateX(15px);scale:.8}.delivery-button.db-thumbnail .db-button[data-state=loading] .db-door-top{transform:rotate(120deg)}.delivery-button.db-thumbnail .db-button[data-state=loading] .db-door-bottom{transform:rotate(-120deg)}.delivery-button.db-thumbnail .db-button[data-state=driving] .db-truck{transform:translateX(35px);scale:.8}.delivery-button.db-thumbnail .db-button[data-state=driving] .db-road{opacity:1}.delivery-button.db-thumbnail .db-button[data-state=driving] .db-headlight{opacity:.55}
@media(prefers-reduced-motion:reduce){.delivery-button *,.delivery-button *::before,.delivery-button *::after{animation:none!important;transition:none!important}.delivery-button:not(.db-thumbnail) .db-scene{display:none}.delivery-button:not(.db-thumbnail) .db-button[data-moving] .db-label{opacity:1;font-size:0}.delivery-button:not(.db-thumbnail) .db-button[data-moving] .db-label::after{content:'Processing…';font-size:16px}}
`;
