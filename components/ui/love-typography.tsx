"use client";

import { ComponentStyles } from "./component-styles";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type LoveTypographyProps = {
  /** Play the repeating lettering sequence on mount. */
  autoPlay?: boolean;
  /** Length of one complete sequence, in milliseconds. */
  duration?: number;
  className?: string;
};

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(notify: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}
function readMotion() { return window.matchMedia(motionQuery).matches; }

/** Shared lettering pieces; the live animation and the thumbnail frames differ only in motion classes. */
const phraseClass = "absolute inset-0 flex items-center justify-center gap-[.08em] whitespace-nowrap";
const railClass = "absolute inset-y-0 left-1/2 w-1 bg-[#fff8d9] shadow-[0_0_8px_#fff8d970]";
const sparkClass = "absolute size-[7px] rounded-[50%] bg-[#e74757] opacity-0";
const letteringClass = "lt-lettering relative w-[70%] max-w-[calc(440px*var(--lt-scale))] font-extrabold tracking-[-.065em] [--lt-scale:1]";
/** Live motion: every piece runs one keyframe track over the shared --lt-duration. */
const liveRail = "animate-[lt-rail_var(--lt-duration)_infinite_cubic-bezier(.65,0,.35,1)] motion-reduce:[transform:translateX(calc(var(--lt-side)*min(30cqw,220px*var(--lt-scale))))]";
/** Thumbnail motion: static frames that fade between phrases while the rails glide to fixed offsets. */
const thumbPhrase = "[transition:opacity_.45s,transform_.7s]";
const thumbRailOffsets = [
  "[transform:translateX(calc(var(--lt-side)*29cqw))]",
  "[transform:translateX(calc(var(--lt-side)*23cqw))]",
  "[transform:translateX(calc(var(--lt-side)*16cqw))]",
  "[transform:translateX(calc(var(--lt-side)*29cqw))]",
];

function Heart() {
  return (
    <span className="mx-[.02em] inline-flex h-[1em] w-[1.05em] items-center text-[#e74757]">
      <svg className="block size-full overflow-visible" viewBox="0 0 40 38" fill="currentColor" aria-hidden="true"><path d="M20 35S1 23 1 11C1 0 15-3 20 7 25-3 39 0 39 11c0 12-19 24-19 24Z" /></svg>
    </span>
  );
}

function Lettering({ frame }: { frame?: number }) {
  const thumb = frame !== undefined;
  const rail = thumb ? `[transition:transform_.7s] ${thumbRailOffsets[frame]}` : liveRail;
  const phrase = (index: number) => (frame === index ? "opacity-100" : "opacity-0");
  return (
    <div
      className={`${letteringClass} ${thumb
        ? "h-[24cqw] text-[length:7.5cqw]"
        : "h-[calc(110px*var(--lt-scale))] text-[length:clamp(25px,7.5cqw,calc(60px*var(--lt-scale)))] @min-[1100px]:[--lt-scale:1.5]"}`}
      data-frame={frame}
      aria-hidden="true"
    >
      <span className={`${railClass} ${rail} [--lt-side:-1]`} /><span className={`${railClass} ${rail} [--lt-side:1]`} />
      <span className={`${phraseClass} ${thumb ? `${thumbPhrase} ${phrase(0)}` : "animate-[lt-full_var(--lt-duration)_cubic-bezier(.65,0,.35,1)_infinite]"}`}>I LOVE YOU</span>
      <span className={`${phraseClass} ${thumb ? `${thumbPhrase} ${phrase(1)}` : "opacity-0 animate-[lt-heart-you_var(--lt-duration)_cubic-bezier(.65,0,.35,1)_infinite]"}`}>I <Heart /> YOU</span>
      <span className={`${phraseClass} ${thumb ? `${thumbPhrase} ${phrase(2)}` : "opacity-0 animate-[lt-heart-u_var(--lt-duration)_cubic-bezier(.65,0,.35,1)_infinite]"}`}>I <Heart /> U</span>
      <span className={`${phraseClass} ${thumb ? `${thumbPhrase} ${phrase(3)} ${frame === 3 ? "[transform:scale(.4)]" : ""}` : "opacity-0 animate-[lt-heart-only_var(--lt-duration)_cubic-bezier(.65,0,.35,1)_infinite]"}`}><Heart /></span>
      <span className="pointer-events-none absolute inset-0 grid place-items-center">
        {Array.from({ length: 8 }, (_, i) => <i key={i} className={`${sparkClass} ${thumb ? "" : "animate-[lt-spark_var(--lt-duration)_ease-out_infinite]"}`} style={{ "--lt-angle": `${i * 45}deg` } as CSSProperties} />)}
      </span>
    </div>
  );
}

const controlClass = "cursor-pointer rounded-md border-0 bg-transparent px-3 py-[9px] [font:inherit] text-inherit hover:bg-[#ffffff35]";

/** Self-contained typography animation; the visible controls work without a backend. */
export default function LoveTypography({ autoPlay = true, duration = 8000, className = "" }: LoveTypographyProps) {
  const root = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(!autoPlay);
  const [replay, setReplay] = useState(0);
  const reducedMotion = useSyncExternalStore(subscribeMotion, readMotion, () => true);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let inView = false;
    const update = () => { element.dataset.visible = String(inView && !document.hidden); };
    if (typeof IntersectionObserver === "undefined") {
      inView = true;
      update();
      document.addEventListener("visibilitychange", update);
      return () => document.removeEventListener("visibilitychange", update);
    }
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);

  return (
    <section ref={root} className={`lt-root @container relative isolate grid min-h-[380px] w-full overflow-hidden bg-[#f7c66b] font-[Arial,Helvetica,sans-serif] text-[#6b2a82] ${className}`} aria-label="I love you typography animation" data-paused={paused || reducedMotion} data-visible="false" style={{ "--lt-duration": `${Number.isFinite(duration) ? Math.max(3000, duration) : 8000}ms` } as CSSProperties}>
      <ComponentStyles css={STYLES} />
      <div className="grid min-h-[380px] w-full place-items-center p-[12%_4%]"><Lettering key={replay} /></div>
      <span className="sr-only">I love you. The phrase transforms into a heart.</span>
      <div className="lt-controls absolute inset-x-0 bottom-[22px] flex items-center justify-center gap-[13px] text-[12px] tracking-[.06em] text-[#693267]">
        {reducedMotion ? <span>Reduced motion · still frame</span> : <>
          <button type="button" className={controlClass} onClick={() => setPaused((value) => !value)} aria-pressed={paused}>{paused ? "Play" : "Pause"}</button>
          <span aria-hidden="true">/</span>
          <button type="button" className={controlClass} onClick={() => { setReplay((value) => value + 1); setPaused(false); }}>Replay</button>
        </>}
      </div>
    </section>
  );
}

/** The gallery owns playback; each frame is inert and contains no timers. */
export function LoveTypographyThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const frame = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) % 4 : 0;
  return (
    <div className={`lt-root lt-thumbnail @container grid h-full min-h-0 items-center bg-[#f7c66b] font-[Arial,Helvetica,sans-serif] text-[#6b2a82] ${className}`} aria-hidden="true" inert>
      <ComponentStyles css={STYLES} />
      <div className="grid h-full min-h-0 w-full place-items-center p-[8%_4%]"><Lettering frame={frame} /></div>
    </div>
  );
}

/**
 * Raw CSS keeps only what utilities cannot express cleanly: the keyframe tracks, the
 * ancestor-state switches that reach every animated descendant, and the focus ring
 * (the app's unlayered global :focus-visible rule would override a utility).
 */
const STYLES = `
.lt-controls button:focus-visible{outline:2px solid #6b2a82;outline-offset:3px}
.lt-root[data-paused=true] .lt-lettering *,.lt-root[data-visible=false] .lt-lettering *{animation-play-state:paused}
@media(prefers-reduced-motion:reduce){.lt-lettering *{animation:none!important;transition:none!important}}
@keyframes lt-full{0%,18%,97%,100%{opacity:1;transform:scale(1)}22%,93%{opacity:0;transform:scale(.8)}}
@keyframes lt-heart-you{0%,18%,48%,100%{opacity:0;transform:scale(.9)}24%,43%{opacity:1;transform:scale(1)}}
@keyframes lt-heart-u{0%,43%,70%,100%{opacity:0;transform:scale(.8)}49%,63%{opacity:1;transform:scale(1)}}
@keyframes lt-heart-only{0%,63%,94%,100%{opacity:0;transform:scale(.2)}69%{opacity:1;transform:scale(.8)}74%{opacity:1;transform:scale(.28)}79%{opacity:1;transform:scale(.4)}88%{opacity:1;transform:scale(.28)}}
@keyframes lt-rail{0%,18%,90%,100%{transform:translateX(calc(var(--lt-side)*min(30cqw,220px*var(--lt-scale))))}25%,43%{transform:translateX(calc(var(--lt-side)*min(23cqw,170px*var(--lt-scale))))}49%,63%{transform:translateX(calc(var(--lt-side)*min(16cqw,120px*var(--lt-scale))))}70%,85%{transform:translateX(calc(var(--lt-side)*min(25cqw,190px*var(--lt-scale))))}}
@keyframes lt-spark{0%,71%,86%,100%{opacity:0;transform:rotate(var(--lt-angle)) translateX(0) scale(0)}74%{opacity:1;transform:rotate(var(--lt-angle)) translateX(calc(25px*var(--lt-scale))) scale(1)}84%{opacity:0;transform:rotate(var(--lt-angle)) translateX(calc(75px*var(--lt-scale))) scale(.2)}}
`;
