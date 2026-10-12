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

/*
 * Styling is Tailwind-first. The root carries `group/dnt` and `data-dark`, so
 * descendants react to night mode with `group-data-[dark=true]/dnt:` utilities.
 * `still` renders the inert gallery frames without the moon's yawn sequence.
 */
const DARK_FADE_IN = "group-data-[dark=true]/dnt:opacity-100";

function Sky() {
  return (
    <span
      className="dnt-sky pointer-events-none absolute inset-0 block overflow-hidden rounded-[inherit]"
      aria-hidden="true"
    >
      <svg
        className="dnt-clouds absolute inset-0 size-full [transition:opacity_.55s_ease,transform_.9s_ease] group-data-[dark=true]/dnt:opacity-0 group-data-[dark=true]/dnt:[transform:translateY(18px)]"
        viewBox="0 0 220 116"
        fill="none"
      >
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
      <svg
        className={`dnt-stars absolute inset-0 size-full opacity-0 transition-opacity duration-800 ease-[ease] *:animate-[dnt-twinkle_3.2s_ease-in-out_infinite] ${DARK_FADE_IN}`}
        viewBox="0 0 220 116"
        fill="#edf0ff"
      >
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

const SNORE = "absolute text-[11px] font-bold text-[#e9eaff] opacity-0";

function CelestialFace({ id, still }: { id: string; still: boolean }) {
  return (
    <span
      className="dnt-thumb pointer-events-none absolute top-[10px] left-[10px] block size-[86px] [transition:transform_.95s_cubic-bezier(.45,0,.2,1)] group-data-[dark=true]/dnt:[transform:translateX(104px)]"
      aria-hidden="true"
    >
      <svg
        className="dnt-sun absolute inset-0 size-full overflow-visible drop-shadow-[0_0_8px_#ffe547aa] [transition:opacity_.55s_ease,transform_.95s_ease] group-data-[dark=true]/dnt:opacity-0 group-data-[dark=true]/dnt:[transform:rotate(40deg)]"
        viewBox="0 0 100 100"
        fill="none"
      >
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
        <g className="dnt-sun-eyes origin-[50px_40px] animate-[dnt-blink_4.8s_infinite]">
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
      <svg
        className={`dnt-moon absolute inset-0 size-full overflow-visible opacity-0 drop-shadow-[0_0_7px_#c6c3ff88] [transform:rotate(-20deg)] [transition:opacity_.65s_ease,transform_.95s_ease] group-data-[dark=true]/dnt:[transform:rotate(0)] ${DARK_FADE_IN}`}
        viewBox="0 0 100 100"
        fill="none"
      >
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
        {/* Night mode plays awake -> yawn -> asleep; still frames and reduced motion jump to asleep. */}
        <g
          className={`dnt-moon-awake ${
            still
              ? "opacity-0"
              : "group-data-[dark=true]/dnt:animate-[dnt-awake_2.1s_both] group-data-[dark=true]/dnt:motion-reduce:opacity-0"
          }`}
          fill="#767792"
        >
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
        <g
          className={`dnt-moon-yawn opacity-0 ${
            still ? "" : "group-data-[dark=true]/dnt:animate-[dnt-yawn_2.1s_both]"
          }`}
        >
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
          className={`dnt-moon-sleep opacity-0 ${
            still
              ? DARK_FADE_IN
              : "group-data-[dark=true]/dnt:animate-[dnt-sleep_2.1s_both] group-data-[dark=true]/dnt:motion-reduce:opacity-100"
          }`}
          stroke="#71758c"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M27 44q7 7 14 0m22 0q7 7 14 0M47 73q4 4 8 0" />
        </g>
      </svg>
      <svg
        className={`dnt-nightcap absolute top-[-22px] left-[9px] h-[45px] w-[68px] overflow-visible opacity-0 [transform:translateY(-14px)_rotate(-12deg)] [transition:opacity_.35s_ease,transform_.5s_cubic-bezier(.25,1.7,.6,1)] group-data-[dark=true]/dnt:[transform:translateY(0)] ${DARK_FADE_IN} ${
          still ? "" : "group-data-[dark=true]/dnt:delay-[1.6s]"
        }`}
        viewBox="0 0 80 52"
        fill="none"
      >
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
      <span
        className={`dnt-zz absolute top-[-29px] left-[77px] h-[25px] w-[30px] opacity-0 transition-opacity duration-400 ease-[ease] motion-reduce:hidden ${DARK_FADE_IN} ${
          still ? "" : "group-data-[dark=true]/dnt:delay-[2.1s]"
        }`}
      >
        <span className={`${SNORE} animate-[dnt-snore_3s_ease-out_2.1s_infinite]`}>z</span>
        <span className={`${SNORE} animate-[dnt-snore_3s_ease-out_3.1s_infinite]`}>z</span>
        <span className={`${SNORE} animate-[dnt-snore_3s_ease-out_4.1s_infinite] text-[12px]`}>Z</span>
      </span>
    </span>
  );
}

function ToggleIllustration({ id, still = false }: { id: string; still?: boolean }) {
  return (
    <>
      <Sky />
      <CelestialFace id={id} still={still} />
    </>
  );
}

/* Shared by the live preview and the gallery stills. */
const ROOT =
  "day-night-toggle group/dnt @container isolate flex flex-col text-[#173747] [font-family:var(--font-geist-sans),'Trebuchet_MS',Arial,sans-serif] **:box-border";
const STAGE =
  "dnt-stage relative flex w-full flex-[1_0_auto] items-center justify-center bg-[#d3ecff] transition-[background] duration-1000 ease-[ease] group-data-[dark=true]/dnt:bg-[#090e29] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_50%_42%,#ffffff55,transparent_80%)] before:content-[''] group-data-[dark=true]/dnt:before:bg-[radial-gradient(ellipse_at_50%_42%,#24296b99,transparent_78%)]";
const CONTENT = "dnt-content relative z-[1] flex flex-col items-center";
const SWITCH =
  "dnt-switch relative block h-[116px] w-[220px] shrink-0 cursor-pointer overflow-visible rounded-[100px] border-5 border-[#e5f3ed] bg-[linear-gradient(120deg,#b3d6d9_0%,#64c4f3_54%,#9fd7f4_100%)] p-0 shadow-[0_12px_22px_#53647d32,0_0_22px_#eac84520,inset_0_1px_3px_#ffffff33] [-webkit-tap-highlight-color:transparent] [transition:border-color_.85s_ease,box-shadow_.85s_ease] group-data-[dark=true]/dnt:border-[#3b4078] group-data-[dark=true]/dnt:shadow-[0_12px_25px_#6559ff42,0_0_42px_#6259ff20,inset_0_1px_3px_#ffffff33] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(120deg,#060b24,#1b2257)] before:opacity-0 before:transition-opacity before:duration-900 before:ease-[ease] before:content-[''] group-data-[dark=true]/dnt:before:opacity-100";
const GREETING =
  "dnt-greeting m-0 text-[22px] leading-[1.25] font-[750] tracking-[-.7px] text-[#173747] transition-[color] duration-800 ease-[ease] group-data-[dark=true]/dnt:text-[#d0d2fc]";
const SUBTITLE =
  "dnt-subtitle m-0 mt-[10px] text-[13px] leading-[1.4] tracking-[-.2px] text-[#6d8594] transition-[color] duration-800 ease-[ease] group-data-[dark=true]/dnt:text-[#888caf]";

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
      className={`${ROOT} relative w-full overflow-hidden ${className}`}
      data-dark={dark}
      aria-label="Day and night toggle"
    >
      <ComponentStyles css={DAY_NIGHT_STYLES} />
      <div
        className={`${STAGE} min-h-[570px] flex-col px-[20px] py-[80px] [@container(max-width:420px)]:min-h-[450px] [@container(max-width:420px)]:py-[65px]`}
      >
        <div
          className={`${CONTENT} w-full [transform:translateY(-1px)] @min-[1100px]:scale-130`}
        >
          <button
            type="button"
            role="switch"
            aria-checked={dark}
            aria-label="Night mode"
            disabled={disabled}
            className={`${SWITCH} disabled:cursor-not-allowed disabled:opacity-50 [@container(max-width:420px)]:scale-85`}
            onClick={() => {
              setLooping(false);
              changeChecked(!dark);
            }}
          >
            <ToggleIllustration id={id} />
          </button>
          {showCaption && (
            <div className="dnt-caption mt-[39px] text-center [@container(max-width:420px)]:mt-[25px]">
              <p
                className={`${GREETING} [@container(max-width:420px)]:text-[20px]`}
                aria-live="polite"
              >
                {dark ? "Shhh... sleeping" : "Good morning"}
              </p>
              <p className={SUBTITLE}>Micro-Interactions Daily · Day 1</p>
            </div>
          )}
          {showControls && (
            <button
              type="button"
              className="dnt-loop mt-[43px] cursor-pointer rounded-[100px] border border-[#8296a266] bg-transparent px-[15px] py-[6px] text-[12px] leading-[1.2] text-[#6d8594] [font-family:inherit] [transition:color_.8s_ease,border-color_.8s_ease,background_.2s_ease] group-data-[dark=true]/dnt:border-[#7d83b466] group-data-[dark=true]/dnt:text-[#888caf] hover:bg-[#ffffff18] aria-pressed:border-[#6d8594] aria-pressed:bg-[#ffffff25] group-data-[dark=true]/dnt:aria-pressed:border-[#888caf] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:hidden [@container(max-width:420px)]:mt-[35px]"
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
      className={`${ROOT} dnt-thumbnail pointer-events-none h-full ${className}`}
      data-dark={dark}
      aria-hidden="true"
      inert
    >
      <ComponentStyles css={DAY_NIGHT_STYLES} />
      <div className={`${STAGE} h-full min-h-0 px-[10px] py-[20px]`}>
        <div className={`${CONTENT} w-[161%] shrink-0 [transform:scale(.62)]`}>
          <div className={`${SWITCH} scale-100`}>
            <ToggleIllustration id={id} still />
          </div>
          <div className="dnt-caption mt-[34px] text-center">
            <p className={GREETING}>
              {dark ? "Shhh... sleeping" : "Good morning"}
            </p>
            <p className={SUBTITLE}>Micro-Interactions Daily · Day 1</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * Only what Tailwind can't express cleanly stays raw: keyframes, the focus ring
 * (it must outrank the site's unlayered global :focus-visible rule), and the
 * reduced-motion kill switch for every transition/animation, pseudo-elements included.
 */
const DAY_NIGHT_STYLES = `
.day-night-toggle .dnt-switch:focus-visible,.day-night-toggle .dnt-loop:focus-visible{outline:3px solid #807cf1;outline-offset:7px}
@keyframes dnt-blink{0%,39%,43%,100%{transform:scaleY(1)}41%{transform:scaleY(.08)}}@keyframes dnt-twinkle{0%,100%{opacity:1}50%{opacity:.35}}@keyframes dnt-awake{0%,46%{opacity:1}48%,100%{opacity:0}}@keyframes dnt-yawn{0%,46%{opacity:0}48%,78%{opacity:1}80%,100%{opacity:0}}@keyframes dnt-sleep{0%,78%{opacity:0}80%,100%{opacity:1}}@keyframes dnt-snore{0%{opacity:0;transform:translate(0,6px) scale(.7)}22%{opacity:.9}80%{opacity:.5}100%{opacity:0;transform:translate(13px,-25px) scale(1.15)}}
@media(prefers-reduced-motion:reduce){.day-night-toggle *,.day-night-toggle *::before,.day-night-toggle *::after{animation:none!important;transition:none!important}}
`;
