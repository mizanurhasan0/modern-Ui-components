"use client";

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

function DeliveryTruck() {
  return <span className="db-truck" aria-hidden="true"><svg viewBox="0 0 108 52" width="108" height="52" fill="none">
    <path className="db-headlight db-headlight-top" d="m94 8 25-8v18Z" fill="#fff38a" />
    <path className="db-headlight db-headlight-bottom" d="m94 44 25-8v18Z" fill="#fff38a" />
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
    <path className="db-door db-door-top" d="M12 3v23" stroke="#dce3ed" strokeWidth="3" />
    <path className="db-door db-door-bottom" d="M12 49V26" stroke="#dce3ed" strokeWidth="3" />
  </svg></span>;
}

function DeliveryScene() {
  return <span className="db-scene" aria-hidden="true"><span className="db-road" /><span className="db-package"><span /></span><DeliveryTruck /></span>;
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
  const pending = state === "loading" || state === "driving" || state === "waiting";

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

  return <section className={`delivery-button relative w-full ${className}`} aria-label="Animated order button">
    <style>{DELIVERY_STYLES}</style>
    <div className="db-stage">
      <button ref={button} type="button" className="db-button" data-state={state} onClick={() => void placeOrder()} disabled={disabled} aria-disabled={pending || state === "success" || disabled} aria-busy={pending} aria-describedby={feedback ? `${id}-feedback` : undefined} aria-label={pending ? "Processing order" : state === "success" ? onOrder ? successLabel : "Order animation complete — demo only" : state === "error" ? "Retry order" : label}>
        <span className="db-label">{state === "error" ? "Try again" : state === "success" ? <>{successLabel}<svg className="db-check" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg></> : state === "waiting" ? "Processing…" : label}</span>
        <DeliveryScene />
      </button>
      <div className="db-status"><p id={`${id}-feedback`} role={state === "error" ? "alert" : "status"} aria-live="polite">{feedback}</p>{state === "success" && !onOrder && <button type="button" className="db-replay" onClick={resetDemo}>Replay demo</button>}</div>
    </div>
  </section>;
}

/** Still frames of the animation: idle, loading, driving, and success. */
export function DeliveryButtonThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const states = ["idle", "loading", "driving", "success"] as const;
  const state = states[Math.abs(Math.trunc(previewStep)) % states.length];
  return <div className={`delivery-button db-thumbnail ${className}`} aria-hidden="true" inert><style>{DELIVERY_STYLES}</style><div className="db-stage"><div className="db-button" data-state={state}><span className="db-label">{state === "success" ? <>Order Placed<svg className="db-check" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg></> : "Complete Order"}</span><DeliveryScene /></div></div></div>;
}

const DELIVERY_STYLES = `
.delivery-button{container-type:inline-size;min-width:0;font-family:Arial,Helvetica,sans-serif;isolation:isolate}.delivery-button *{box-sizing:border-box}.delivery-button .db-stage{min-height:410px;display:flex;align-items:center;justify-content:center;flex-direction:column;background:#fff;padding:65px 24px 40px}.delivery-button .db-button{position:relative;width:min(360px,100%);height:96px;flex-shrink:0;overflow:hidden;border:0;border-radius:999px;background:#090d17;box-shadow:inset 0 1px 1px #ffffff18;color:white;cursor:pointer;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:400;-webkit-tap-highlight-color:transparent;transition:box-shadow .2s,transform .2s}.delivery-button .db-button:hover:not([aria-disabled=true]){box-shadow:inset 0 1px 1px #ffffff18,0 8px 18px #090d171b;transform:translateY(-1px)}.delivery-button .db-button:focus-visible,.delivery-button .db-replay:focus-visible{outline:3px solid #607dae;outline-offset:5px}.delivery-button .db-button:disabled{opacity:.45;cursor:not-allowed}.delivery-button .db-button[aria-disabled=true]{cursor:default}.delivery-button .db-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:10px;transition:opacity .2s;z-index:4;white-space:nowrap}.delivery-button .db-check{color:#24bf83;stroke-dasharray:22;stroke-dashoffset:0;animation:db-check-in .4s ease both}.delivery-button .db-scene{position:absolute;inset:0;pointer-events:none;opacity:0}.delivery-button .db-button[data-state=loading] .db-scene,.delivery-button .db-button[data-state=driving] .db-scene{opacity:1}.delivery-button .db-button[data-state=loading] .db-label,.delivery-button .db-button[data-state=driving] .db-label{opacity:0}.delivery-button .db-truck{position:absolute;z-index:3;left:50%;top:50%;margin-left:-54px;margin-top:-26px;display:block;width:108px;height:52px;transform:translateX(260px)}.delivery-button .db-truck svg{display:block;overflow:visible}.delivery-button .db-headlight{opacity:0;filter:blur(3px)}.delivery-button .db-door-top{transform-origin:12px 3px}.delivery-button .db-door-bottom{transform-origin:12px 49px}.delivery-button .db-package{position:absolute;z-index:2;left:calc(50% - 115px);top:calc(50% - 14px);width:28px;height:28px;background:#ffdc00;border-radius:3px;box-shadow:inset 0 0 0 1px #d8b900;opacity:0;transform:translateX(-25px)}.delivery-button .db-package>span{position:absolute;left:0;right:0;top:12px;height:3px;background:#e5bf09}.delivery-button .db-road{position:absolute;left:-100%;top:calc(50% - 1px);width:300%;height:2px;background:repeating-linear-gradient(90deg,#f7faff 0 6px,transparent 6px 20px);opacity:0;z-index:1}
.delivery-button .db-button:is([data-state=loading],[data-state=driving]) .db-truck{animation:db-truck-trip 7s linear both}.delivery-button .db-button:is([data-state=loading],[data-state=driving]) .db-package{animation:db-load-package 7s linear both}.delivery-button .db-button:is([data-state=loading],[data-state=driving]) .db-door-top{animation:db-door-top 7s linear both}.delivery-button .db-button:is([data-state=loading],[data-state=driving]) .db-door-bottom{animation:db-door-bottom 7s linear both}.delivery-button .db-button:is([data-state=loading],[data-state=driving]) .db-headlight{animation:db-lights 7s linear both}.delivery-button .db-button:is([data-state=loading],[data-state=driving]) .db-road{animation:db-road-travel 7s linear both}.delivery-button .db-status{height:61px;margin-top:18px;text-align:center;max-width:360px;font-size:11px;line-height:1.6;color:#75808d}.delivery-button .db-status p{margin:0}.delivery-button .db-status p[role=alert]{color:#b74242}.delivery-button .db-replay{margin-top:8px;border:0;padding:3px 8px;background:none;color:#586675;text-decoration:underline;text-underline-offset:3px;font:inherit;cursor:pointer}
@keyframes db-truck-trip{0%{transform:translateX(260px)}12%,42%{transform:translateX(0)}58%{transform:translateX(72px)}85%{transform:translateX(-125px)}94%,100%{transform:translateX(-260px)}}@keyframes db-load-package{0%,9%{opacity:0;transform:translateX(-25px)}13%,23%{opacity:1;transform:translateX(0)}34%{opacity:1;transform:translateX(91px)}36%,100%{opacity:0;transform:translateX(91px)}}@keyframes db-door-top{0%,12%{transform:rotate(0)}17%,31%{transform:rotate(120deg)}38%,100%{transform:rotate(0)}}@keyframes db-door-bottom{0%,14%{transform:rotate(0)}19%,33%{transform:rotate(-120deg)}40%,100%{transform:rotate(0)}}@keyframes db-lights{0%,39%{opacity:0}45%,87%{opacity:.55}95%,100%{opacity:0}}@keyframes db-road-travel{0%,40%{opacity:0;transform:translateX(0)}45%{opacity:1}87%{opacity:1}95%,100%{opacity:0;transform:translateX(-200px)}}@keyframes db-check-in{from{stroke-dashoffset:22}to{stroke-dashoffset:0}}
@container(max-width:420px){.delivery-button .db-stage{min-height:350px;padding:50px 20px 30px}.delivery-button .db-button{height:80px;font-size:15px}.delivery-button .db-truck{scale:.85}.delivery-button .db-package{scale:.85}}
.delivery-button.db-thumbnail{height:100%;pointer-events:none}.delivery-button.db-thumbnail .db-stage{min-height:0;height:100%;padding:30px}.delivery-button.db-thumbnail .db-button{width:min(270px,100%);height:72px;font-size:13px}.delivery-button.db-thumbnail *{animation:none!important}.delivery-button.db-thumbnail .db-truck{transition:transform .7s ease}.delivery-button.db-thumbnail .db-package{transition:transform .7s ease,opacity .35s}.delivery-button.db-thumbnail .db-scene,.delivery-button.db-thumbnail .db-label,.delivery-button.db-thumbnail .db-road,.delivery-button.db-thumbnail .db-headlight{transition:opacity .35s}.delivery-button.db-thumbnail .db-truck{transform:translateX(0);scale:.8}.delivery-button.db-thumbnail .db-button[data-state=loading] .db-package{opacity:1;transform:translateX(15px);scale:.8}.delivery-button.db-thumbnail .db-button[data-state=loading] .db-door-top{transform:rotate(120deg)}.delivery-button.db-thumbnail .db-button[data-state=loading] .db-door-bottom{transform:rotate(-120deg)}.delivery-button.db-thumbnail .db-button[data-state=driving] .db-truck{transform:translateX(35px);scale:.8}.delivery-button.db-thumbnail .db-button[data-state=driving] .db-road{opacity:1}.delivery-button.db-thumbnail .db-button[data-state=driving] .db-headlight{opacity:.55}
@media(prefers-reduced-motion:reduce){.delivery-button *,.delivery-button *::before,.delivery-button *::after{animation:none!important;transition:none!important}.delivery-button:not(.db-thumbnail) .db-scene{display:none}.delivery-button:not(.db-thumbnail) .db-button[data-state=loading] .db-label,.delivery-button:not(.db-thumbnail) .db-button[data-state=driving] .db-label{opacity:1;font-size:0}.delivery-button:not(.db-thumbnail) .db-button[data-state=loading] .db-label::after,.delivery-button:not(.db-thumbnail) .db-button[data-state=driving] .db-label::after{content:'Processing…';font-size:16px}}
`;
