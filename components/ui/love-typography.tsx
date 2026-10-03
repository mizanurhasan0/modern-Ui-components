"use client";

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

function Heart() {
  return <svg viewBox="0 0 40 38" fill="currentColor" aria-hidden="true"><path d="M20 35S1 23 1 11C1 0 15-3 20 7 25-3 39 0 39 11c0 12-19 24-19 24Z" /></svg>;
}

function Lettering({ frame }: { frame?: number }) {
  return (
    <div className="lt-lettering" data-frame={frame} aria-hidden="true">
      <span className="lt-rail lt-rail-left" /><span className="lt-rail lt-rail-right" />
      <span className="lt-phrase lt-full">I LOVE YOU</span>
      <span className="lt-phrase lt-heart-you">I <span className="lt-heart"><Heart /></span> YOU</span>
      <span className="lt-phrase lt-heart-u">I <span className="lt-heart"><Heart /></span> U</span>
      <span className="lt-phrase lt-heart-only"><span className="lt-heart"><Heart /></span></span>
      <span className="lt-sparks">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ "--lt-angle": `${i * 45}deg` } as CSSProperties} />)}</span>
    </div>
  );
}

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
    <section ref={root} className={`lt-root relative isolate grid w-full overflow-hidden ${className}`} aria-label="I love you typography animation" data-paused={paused || reducedMotion} data-visible="false" style={{ "--lt-duration": `${Number.isFinite(duration) ? Math.max(3000, duration) : 8000}ms` } as CSSProperties}>
      <style>{STYLES}</style>
      <div className="lt-stage"><Lettering key={replay} /></div>
      <span className="sr-only">I love you. The phrase transforms into a heart.</span>
      <div className="lt-controls">
        {reducedMotion ? <span>Reduced motion · still frame</span> : <>
          <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>{paused ? "Play" : "Pause"}</button>
          <span aria-hidden="true">/</span>
          <button type="button" onClick={() => { setReplay((value) => value + 1); setPaused(false); }}>Replay</button>
        </>}
      </div>
    </section>
  );
}

/** The gallery owns playback; each frame is inert and contains no timers. */
export function LoveTypographyThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const frame = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) % 4 : 0;
  return <div className={`lt-root lt-thumbnail ${className}`} aria-hidden="true" inert><style>{STYLES}</style><div className="lt-stage"><Lettering frame={frame} /></div></div>;
}

const STYLES = `
.lt-root{container-type:inline-size;background:#f7c66b;color:#6b2a82;font-family:Arial,Helvetica,sans-serif;min-height:380px;--lt-duration:8000ms}
.lt-root *{box-sizing:border-box}
.lt-stage{display:grid;place-items:center;min-height:380px;width:100%;padding:12% 4%}
.lt-lettering{position:relative;width:70%;max-width:440px;height:110px;font-weight:800;letter-spacing:-.065em;font-size:clamp(25px,7.5cqw,60px)}
.lt-phrase{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:.08em;white-space:nowrap;animation-duration:var(--lt-duration);animation-iteration-count:infinite;animation-timing-function:cubic-bezier(.65,0,.35,1)}
.lt-heart{display:inline-flex;align-items:center;width:1.05em;height:1em;color:#e74757;margin:0 .02em}
.lt-heart svg{display:block;width:100%;height:100%;overflow:visible}
.lt-full{animation-name:lt-full;opacity:1}
.lt-heart-you{animation-name:lt-heart-you;opacity:0}
.lt-heart-u{animation-name:lt-heart-u;opacity:0}
.lt-heart-only{animation-name:lt-heart-only;opacity:0}
.lt-rail{position:absolute;top:0;bottom:0;width:4px;background:#fff8d9;box-shadow:0 0 8px #fff8d970;animation:lt-rail var(--lt-duration) infinite cubic-bezier(.65,0,.35,1)}
.lt-rail-left{left:50%;--lt-side:-1}
.lt-rail-right{left:50%;--lt-side:1}
.lt-sparks{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none}
.lt-sparks i{position:absolute;width:7px;height:7px;border-radius:50%;background:#e74757;animation:lt-spark var(--lt-duration) ease-out infinite;opacity:0}
.lt-controls{position:absolute;bottom:22px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:13px;font-size:12px;letter-spacing:.06em;color:#693267}
.lt-controls button{font:inherit;border:0;background:transparent;color:inherit;cursor:pointer;padding:9px 12px;border-radius:6px}
.lt-controls button:hover{background:#ffffff35}
.lt-controls button:focus-visible{outline:2px solid #6b2a82;outline-offset:3px}
.lt-root[data-paused=true] .lt-lettering *,.lt-root[data-visible=false] .lt-lettering *{animation-play-state:paused}
.lt-thumbnail{min-height:0;height:100%;display:grid;align-items:center}
.lt-thumbnail .lt-stage{min-height:0;height:100%;padding:8% 4%}
.lt-thumbnail .lt-lettering{height:24cqw;font-size:7.5cqw}
.lt-thumbnail .lt-lettering *{animation:none}
.lt-thumbnail .lt-phrase{opacity:0;transition:opacity .45s,transform .7s}
.lt-thumbnail .lt-rail{transform:translateX(calc(var(--lt-side)*29cqw));transition:transform .7s}
.lt-thumbnail [data-frame="0"] .lt-full,.lt-thumbnail [data-frame="1"] .lt-heart-you,.lt-thumbnail [data-frame="2"] .lt-heart-u,.lt-thumbnail [data-frame="3"] .lt-heart-only{opacity:1}
.lt-thumbnail [data-frame="1"] .lt-rail{transform:translateX(calc(var(--lt-side)*23cqw))}
.lt-thumbnail [data-frame="2"] .lt-rail{transform:translateX(calc(var(--lt-side)*16cqw))}
.lt-thumbnail [data-frame="3"] .lt-heart-only{transform:scale(.4)}
@keyframes lt-full{0%,18%,97%,100%{opacity:1;transform:scale(1)}22%,93%{opacity:0;transform:scale(.8)}}
@keyframes lt-heart-you{0%,18%,48%,100%{opacity:0;transform:scale(.9)}24%,43%{opacity:1;transform:scale(1)}}
@keyframes lt-heart-u{0%,43%,70%,100%{opacity:0;transform:scale(.8)}49%,63%{opacity:1;transform:scale(1)}}
@keyframes lt-heart-only{0%,63%,94%,100%{opacity:0;transform:scale(.2)}69%{opacity:1;transform:scale(.8)}74%{opacity:1;transform:scale(.28)}79%{opacity:1;transform:scale(.4)}88%{opacity:1;transform:scale(.28)}}
@keyframes lt-rail{0%,18%,90%,100%{transform:translateX(calc(var(--lt-side)*min(30cqw,220px)))}25%,43%{transform:translateX(calc(var(--lt-side)*min(23cqw,170px)))}49%,63%{transform:translateX(calc(var(--lt-side)*min(16cqw,120px)))}70%,85%{transform:translateX(calc(var(--lt-side)*min(25cqw,190px)))}}
@keyframes lt-spark{0%,71%,86%,100%{opacity:0;transform:rotate(var(--lt-angle)) translateX(0) scale(0)}74%{opacity:1;transform:rotate(var(--lt-angle)) translateX(25px) scale(1)}84%{opacity:0;transform:rotate(var(--lt-angle)) translateX(75px) scale(.2)}}
@media(prefers-reduced-motion:reduce){.lt-root .lt-lettering *{animation:none!important;transition:none!important}.lt-root:not(.lt-thumbnail) .lt-full{opacity:1}.lt-root:not(.lt-thumbnail) .lt-rail{transform:translateX(calc(var(--lt-side)*min(30cqw,220px)))}}
`;
