"use client";

import { ComponentStyles } from "./component-styles";

import { useCallback, useEffect, useId, useState } from "react";

export interface DayNightToggleProps {
  /** true selects the sleepy night scene. */
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  showCaption?: boolean;
  showControls?: boolean;
  className?: string;
}

const STARS = [
  [17, 39, 2.1],
  [31, 64, 1.8],
  [48, 56, 1.7],
  [44, 28, 1.2],
  [57, 21, 1.5],
  [63, 35, 1.2],
  [70, 82, 1.9],
  [88, 54, 1.7],
  [97, 14, 1],
  [34, 93, 1.8],
  [26, 77, 1.2],
  [103, 90, 1.4],
  [55, 47, 1.1],
  [77, 32, 0.8],
  [114, 44, 1],
  [52, 94, 0.8],
] as const;

function Sky() {
  return (
    <span className="dnt-sky" aria-hidden="true">
      <svg className="dnt-clouds" viewBox="0 0 220 116" fill="none">
        <path
          d="M96 36c-5 0-8-3-8-7s3-7 7-7c1-7 7-10 12-7 3-2 9 0 10 6 7-1 12 3 12 8 0 4-3 7-8 7H96Z"
          fill="#fffff2"
        />
        <path
          d="M167 27c-4 0-7-3-7-6s2-6 6-6c1-6 6-9 11-7 4-1 8 1 9 5 7-1 11 2 11 7s-3 7-7 7h-23Z"
          fill="#e9faff"
        />
        <path
          d="M144 96c-8 0-12-5-12-10s4-10 9-11c-1-9 5-15 14-15 6 0 9 2 12 7 7-2 13 1 16 7 8 0 14 5 14 11 0 7-5 11-13 11h-40Z"
          fill="#fcffff"
        />
      </svg>
      <svg className="dnt-stars" viewBox="0 0 220 116" fill="#edf0ff">
        {STARS.map(([x, y, radius], index) => (
          <circle
            key={index}
            cx={x}
            cy={y}
            r={radius}
            style={{ animationDelay: `${index * 0.19}s` }}
          />
        ))}
      </svg>
    </span>
  );
}

function CelestialFace({ id }: { id: string }) {
  return (
    <span className="dnt-thumb" aria-hidden="true">
      <svg className="dnt-sun" viewBox="0 0 100 100" fill="none">
        <defs>
          <radialGradient id={`${id}-sun`} cx=".37" cy=".27" r=".8">
            <stop stopColor="#fff495" />
            <stop offset=".55" stopColor="#ffdc38" />
            <stop offset="1" stopColor="#ffb818" />
          </radialGradient>
          <radialGradient id={`${id}-blush`}>
            <stop stopColor="#f59d37" stopOpacity=".9" />
            <stop offset="1" stopColor="#f59d37" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill={`url(#${id}-sun)`} />
        <ellipse cx="28" cy="64" rx="11" ry="7" fill={`url(#${id}-blush)`} />
        <ellipse cx="74" cy="64" rx="11" ry="7" fill={`url(#${id}-blush)`} />
        <g className="dnt-sun-eyes">
          <ellipse cx="33" cy="40" rx="10" ry="15.5" fill="#654408" />
          <ellipse cx="72" cy="40" rx="10" ry="15.5" fill="#654408" />
          <ellipse cx="36" cy="32" rx="4" ry="4.5" fill="#fffdec" />
          <ellipse cx="75" cy="32" rx="4" ry="4.5" fill="#fffdec" />
          <circle cx="29" cy="48" r="1.7" fill="#af831e" />
          <circle cx="68" cy="48" r="1.7" fill="#af831e" />
        </g>
        <path
          d="M41 69q9 11 18 0"
          stroke="#714913"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <ellipse cx="51" cy="54" rx="2" ry="1.5" fill="#ffd968" />
      </svg>
      <svg className="dnt-moon" viewBox="0 0 100 100" fill="none">
        <defs>
          <radialGradient id={`${id}-moon`} cx=".35" cy=".24" r=".85">
            <stop stopColor="#fffffc" />
            <stop offset=".6" stopColor="#eef0ff" />
            <stop offset="1" stopColor="#b9bbeb" />
          </radialGradient>
          <radialGradient id={`${id}-crater`}>
            <stop stopColor="#aaaed2" stopOpacity=".6" />
            <stop offset="1" stopColor="#b8bddb" stopOpacity=".45" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill={`url(#${id}-moon)`} />
        <circle cx="77" cy="24" r="9" fill={`url(#${id}-crater)`} />
        <circle cx="81" cy="73" r="6.5" fill={`url(#${id}-crater)`} />
        <circle cx="21" cy="76" r="5" fill={`url(#${id}-crater)`} />
        <circle cx="16" cy="47" r="3.5" fill={`url(#${id}-crater)`} />
        <ellipse cx="24" cy="66" rx="7" ry="4.5" fill="#c9c7ed" opacity=".6" />
        <ellipse cx="75" cy="66" rx="7" ry="4.5" fill="#c9c7ed" opacity=".5" />
        <g className="dnt-moon-awake" fill="#767792">
          <ellipse cx="34" cy="45" rx="4.5" ry="6" />
          <ellipse cx="70" cy="45" rx="4.5" ry="6" />
          <path
            d="M45 69q5 5 10 0"
            fill="none"
            stroke="#767792"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <g className="dnt-moon-yawn">
          <path
            d="M26 43h14m23 0h14"
            stroke="#767792"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <ellipse cx="52" cy="69" rx="6.5" ry="8" fill="#77748e" />
          <ellipse cx="52" cy="73" rx="4" ry="3" fill="#e6a7b9" />
        </g>
        <g
          className="dnt-moon-sleep"
          stroke="#71758c"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M27 44q7 7 14 0m22 0q7 7 14 0M47 73q4 4 8 0" />
        </g>
      </svg>
      <svg className="dnt-nightcap" viewBox="0 0 80 52" fill="none">
        <path d="M10 36C15 9 32 2 46 6c8 2 16 11 20 20L10 36Z" fill="#8c8aff" />
        <path d="M13 33C22 13 37 6 50 10c-7-8-29-11-38 20Z" fill="#a7a1ff" />
        <path
          d="M11 36 61 25"
          stroke="#fcfdff"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="66" cy="22" r="5.5" fill="#fff" />
        <circle cx="27" cy="25" r="1.5" fill="#e1deff" />
        <circle cx="44" cy="17" r="1.5" fill="#e1deff" />
      </svg>
      <span className="dnt-zz">
        <span>z</span>
        <span>z</span>
        <span>Z</span>
      </span>
    </span>
  );
}

function ToggleIllustration({ id }: { id: string }) {
  return (
    <>
      <Sky />
      <CelestialFace id={id} />
    </>
  );
}

/** A self-contained day/night switch. Copy this file and import it in any React project. */
export default function DayNightToggle({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  showCaption = true,
  showControls = true,
  className = "",
}: DayNightToggleProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const [looping, setLooping] = useState(false);
  const dark = checked ?? internalChecked;
  const id = useId().replace(/:/g, "");

  const changeChecked = useCallback(
    (next: boolean) => {
      if (disabled) return;
      if (checked === undefined) setInternalChecked(next);
      onCheckedChange?.(next);
    },
    [checked, disabled, onCheckedChange],
  );

  useEffect(() => {
    if (
      !looping ||
      disabled ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = window.setTimeout(() => changeChecked(!dark), 4500);
    return () => window.clearTimeout(timer);
  }, [looping, disabled, dark, changeChecked]);

  function toggleLoop() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setLooping((value) => !value);
  }

  return (
    <section
      className={`day-night-toggle relative w-full overflow-hidden ${className}`}
      data-dark={dark}
      aria-label="Day and night toggle"
    >
      <ComponentStyles css={DAY_NIGHT_STYLES} />
      <div className="dnt-stage flex flex-col items-center justify-center">
        <div className="dnt-content flex flex-col items-center">
          <button
            type="button"
            role="switch"
            aria-checked={dark}
            aria-label="Night mode"
            disabled={disabled}
            className="dnt-switch"
            onClick={() => {
              setLooping(false);
              changeChecked(!dark);
            }}
          >
            <ToggleIllustration id={id} />
          </button>
          {showCaption && (
            <div className="dnt-caption text-center">
              <p className="dnt-greeting" aria-live="polite">
                {dark ? "Shhh... sleeping" : "Good morning"}
              </p>
              <p className="dnt-subtitle">Micro-Interactions Daily · Day 1</p>
            </div>
          )}
          {showControls && (
            <button
              type="button"
              className="dnt-loop"
              aria-pressed={looping}
              disabled={disabled}
              onClick={toggleLoop}
            >
              {looping ? "Stop auto-loop" : "Auto-loop for recording"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** Inert gallery stills: daylight, transition, nighttime, and sleepy moon. */
export function DayNightToggleThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  const id = useId().replace(/:/g, "");
  const step = Math.abs(Math.trunc(previewStep)) % 4;
  const dark = step === 1 || step === 2;
  return (
    <div
      className={`day-night-toggle dnt-thumbnail ${className}`}
      data-dark={dark}
      aria-hidden="true"
      inert
    >
      <ComponentStyles css={DAY_NIGHT_STYLES} />
      <div className="dnt-stage">
        <div className="dnt-content">
          <div className="dnt-switch">
            <ToggleIllustration id={id} />
          </div>
          <div className="dnt-caption">
            <p className="dnt-greeting">
              {dark ? "Shhh... sleeping" : "Good morning"}
            </p>
            <p className="dnt-subtitle">Micro-Interactions Daily · Day 1</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const DAY_NIGHT_STYLES = `
.day-night-toggle{isolation:isolate;container-type:inline-size;font-family:var(--font-geist-sans),"Trebuchet MS",Arial,sans-serif;color:#173747;--dnt-stage:#d3ecff;--dnt-text:#173747;--dnt-muted:#6d8594;--dnt-track-border:#e5f3ed;--dnt-track-shadow:0 12px 22px #53647d32,0 0 22px #eac84520;--dnt-track:linear-gradient(120deg,#b3d6d9 0%,#64c4f3 54%,#9fd7f4 100%)}
.day-night-toggle *{box-sizing:border-box}.day-night-toggle[data-dark=true]{--dnt-stage:#090e29;--dnt-text:#d0d2fc;--dnt-muted:#888caf;--dnt-track-border:#3b4078;--dnt-track-shadow:0 12px 25px #6559ff42,0 0 42px #6259ff20;--dnt-track:linear-gradient(120deg,#060b24,#1b2257)}
.day-night-toggle .dnt-stage{display:flex;align-items:center;justify-content:center;min-height:570px;width:100%;padding:80px 20px;background:var(--dnt-stage);position:relative;transition:background 1s ease}.day-night-toggle .dnt-stage::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 42%,#ffffff55,transparent 80%);opacity:1;transition:opacity 1s ease}.day-night-toggle[data-dark=true] .dnt-stage::before{background:radial-gradient(ellipse at 50% 42%,#24296b99,transparent 78%)}
.day-night-toggle .dnt-content{display:flex;align-items:center;flex-direction:column;position:relative;z-index:1;width:100%;transform:translateY(-1px)}
.day-night-toggle .dnt-switch{position:relative;display:block;flex-shrink:0;width:220px;height:116px;padding:0;border:5px solid var(--dnt-track-border);border-radius:100px;background:linear-gradient(120deg,#b3d6d9 0%,#64c4f3 54%,#9fd7f4 100%);box-shadow:var(--dnt-track-shadow),inset 0 1px 3px #ffffff33;cursor:pointer;transition:border-color .85s ease,box-shadow .85s ease;overflow:visible;-webkit-tap-highlight-color:transparent}.day-night-toggle .dnt-switch::before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(120deg,#060b24,#1b2257);opacity:0;transition:opacity .9s ease}.day-night-toggle[data-dark=true] .dnt-switch::before{opacity:1}.day-night-toggle .dnt-switch:focus-visible,.day-night-toggle .dnt-loop:focus-visible{outline:3px solid #807cf1;outline-offset:7px}.day-night-toggle .dnt-switch:disabled,.day-night-toggle .dnt-loop:disabled{opacity:.5;cursor:not-allowed}
.day-night-toggle .dnt-sky{position:absolute;inset:0;display:block;overflow:hidden;border-radius:inherit;pointer-events:none}.day-night-toggle .dnt-sky>svg{width:100%;height:100%;position:absolute;inset:0}.day-night-toggle .dnt-clouds{opacity:1;transform:translateY(0);transition:opacity .55s ease,transform .9s ease}.day-night-toggle .dnt-stars{opacity:0;transition:opacity .8s ease}.day-night-toggle[data-dark=true] .dnt-clouds{opacity:0;transform:translateY(18px)}.day-night-toggle[data-dark=true] .dnt-stars{opacity:1}.day-night-toggle .dnt-stars circle{animation:dnt-twinkle 3.2s ease-in-out infinite}
.day-night-toggle .dnt-thumb{position:absolute;top:10px;left:10px;display:block;width:86px;height:86px;transform:translateX(0);transition:transform .95s cubic-bezier(.45,0,.2,1);pointer-events:none}.day-night-toggle[data-dark=true] .dnt-thumb{transform:translateX(104px)}.day-night-toggle .dnt-thumb>svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.day-night-toggle .dnt-sun{opacity:1;filter:drop-shadow(0 0 8px #ffe547aa);transform:rotate(0);transition:opacity .55s ease,transform .95s ease}.day-night-toggle .dnt-moon{opacity:0;filter:drop-shadow(0 0 7px #c6c3ff88);transform:rotate(-20deg);transition:opacity .65s ease,transform .95s ease}.day-night-toggle[data-dark=true] .dnt-sun{opacity:0;transform:rotate(40deg)}.day-night-toggle[data-dark=true] .dnt-moon{opacity:1;transform:rotate(0)}.day-night-toggle .dnt-sun-eyes{transform-origin:50px 40px;animation:dnt-blink 4.8s infinite}.day-night-toggle .dnt-moon-yawn,.day-night-toggle .dnt-moon-sleep{opacity:0}.day-night-toggle[data-dark=true] .dnt-moon-awake{animation:dnt-awake 2.1s both}.day-night-toggle[data-dark=true] .dnt-moon-yawn{animation:dnt-yawn 2.1s both}.day-night-toggle[data-dark=true] .dnt-moon-sleep{animation:dnt-sleep 2.1s both}
.day-night-toggle .dnt-thumb>.dnt-nightcap{width:68px;height:45px;top:-22px;left:9px;opacity:0;transform:translateY(-14px) rotate(-12deg);transition:opacity .35s ease,transform .5s cubic-bezier(.25,1.7,.6,1)}.day-night-toggle[data-dark=true] .dnt-thumb>.dnt-nightcap{opacity:1;transform:translateY(0);transition-delay:1.6s}.day-night-toggle .dnt-zz{position:absolute;left:77px;top:-29px;width:30px;height:25px;opacity:0;transition:opacity .4s ease}.day-night-toggle[data-dark=true] .dnt-zz{opacity:1;transition-delay:2.1s}.day-night-toggle .dnt-zz>span{position:absolute;font-size:11px;font-weight:700;color:#e9eaff;opacity:0;animation:dnt-snore 3s ease-out infinite;animation-delay:2.1s}.day-night-toggle .dnt-zz>span:nth-child(2){animation-delay:3.1s}.day-night-toggle .dnt-zz>span:nth-child(3){animation-delay:4.1s;font-size:12px}
.day-night-toggle .dnt-caption{margin-top:39px;text-align:center}.day-night-toggle .dnt-greeting{margin:0;color:var(--dnt-text);font-size:22px;line-height:1.25;font-weight:750;letter-spacing:-.7px;transition:color .8s ease}.day-night-toggle .dnt-subtitle{margin:10px 0 0;color:var(--dnt-muted);font-size:13px;line-height:1.4;letter-spacing:-.2px;transition:color .8s ease}.day-night-toggle .dnt-loop{margin-top:43px;padding:6px 15px;border:1px solid #8296a266;border-radius:100px;background:transparent;color:var(--dnt-muted);font-family:inherit;font-size:12px;line-height:1.2;cursor:pointer;transition:color .8s ease,border-color .8s ease,background .2s ease}.day-night-toggle[data-dark=true] .dnt-loop{border-color:#7d83b466}.day-night-toggle .dnt-loop:hover{background:#ffffff18}.day-night-toggle .dnt-loop[aria-pressed=true]{background:#ffffff25;border-color:var(--dnt-muted)}
@keyframes dnt-blink{0%,39%,43%,100%{transform:scaleY(1)}41%{transform:scaleY(.08)}}@keyframes dnt-twinkle{0%,100%{opacity:1}50%{opacity:.35}}@keyframes dnt-awake{0%,46%{opacity:1}48%,100%{opacity:0}}@keyframes dnt-yawn{0%,46%{opacity:0}48%,78%{opacity:1}80%,100%{opacity:0}}@keyframes dnt-sleep{0%,78%{opacity:0}80%,100%{opacity:1}}@keyframes dnt-snore{0%{opacity:0;transform:translate(0,6px) scale(.7)}22%{opacity:.9}80%{opacity:.5}100%{opacity:0;transform:translate(13px,-25px) scale(1.15)}}
@container(max-width:420px){.day-night-toggle .dnt-stage{min-height:450px;padding:65px 20px}.day-night-toggle .dnt-switch{scale:.85}.day-night-toggle .dnt-caption{margin-top:25px}.day-night-toggle .dnt-greeting{font-size:20px}.day-night-toggle .dnt-loop{margin-top:35px}}
.day-night-toggle.dnt-thumbnail{height:100%;pointer-events:none}.day-night-toggle.dnt-thumbnail .dnt-stage{min-height:0;height:100%;padding:20px 10px}.day-night-toggle.dnt-thumbnail .dnt-content{transform:scale(.62);width:161%;flex-shrink:0}.day-night-toggle.dnt-thumbnail .dnt-switch{scale:1}.day-night-toggle.dnt-thumbnail .dnt-caption{margin-top:34px}.day-night-toggle.dnt-thumbnail .dnt-greeting{font-size:22px}.day-night-toggle.dnt-thumbnail .dnt-moon-awake,.day-night-toggle.dnt-thumbnail .dnt-moon-yawn{opacity:0;animation:none}.day-night-toggle.dnt-thumbnail[data-dark=true] .dnt-moon-sleep{opacity:1;animation:none}.day-night-toggle.dnt-thumbnail .dnt-thumb>.dnt-nightcap,.day-night-toggle.dnt-thumbnail .dnt-zz{transition-delay:0s}
@media(prefers-reduced-motion:reduce){.day-night-toggle *,.day-night-toggle *::before,.day-night-toggle *::after{animation:none!important;transition:none!important}.day-night-toggle[data-dark=true] .dnt-moon-awake,.day-night-toggle[data-dark=true] .dnt-moon-yawn{opacity:0}.day-night-toggle[data-dark=true] .dnt-moon-sleep{opacity:1}.day-night-toggle .dnt-zz{display:none}.day-night-toggle .dnt-loop{display:none}}
`;
