"use client";

/* eslint-disable @next/next/no-img-element -- A plain portrait keeps the exported component independent of Next.js image configuration. */

import { ComponentStyles } from "./component-styles";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

/** One skill chip on an orbit ring. */
export interface OrbitSkill {
  /** Visible chip label. */
  name: string;
  /** Short detail shown in the chip's popover. */
  detail?: string;
  /** Any CSS colour for the chip's dot. Defaults to the accent colour. */
  color?: string;
}

/** A call to action rendered as a link when `href` is set, otherwise as a button. */
export interface SkillOrbitHeroAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface SkillOrbitHeroProps {
  /** Large name in the intro. */
  name?: string;
  /** Role line under the name. */
  role?: string;
  /** One or two sentences about you. */
  bio?: string;
  /** Portrait image; the initials avatar is used when omitted. */
  photoSrc?: string;
  /** Alternative text for the portrait. Defaults to "Portrait of {name}". */
  photoAlt?: string;
  /** Letters shown in the avatar when there is no photo. */
  initials?: string;
  /** Shows the "Available for work" status pill. */
  available?: boolean;
  /** Short highlights shown under the bio. Three fit best. */
  stats?: { value: string; label: string }[];
  /** Skills on the inner, faster ring. Three or four fit best. */
  innerSkills?: OrbitSkill[];
  /** Skills on the outer ring, which turns the other way. Four or five fit best. */
  outerSkills?: OrbitSkill[];
  primaryAction?: SkillOrbitHeroAction;
  secondaryAction?: SkillOrbitHeroAction;
  /** Use 1 when the hero is the page's main heading. */
  headingLevel?: 1 | 2;
  className?: string;
}

type Ring = "inner" | "outer";
type PlacedSkill = OrbitSkill & { key: string; ring: Ring; angle: number; delay: number };

const ACCENT = "#4866e9";

const DEFAULT_INNER_SKILLS: OrbitSkill[] = [
  { name: "React", detail: "3 years · hooks, context and server components", color: "#149eca" },
  { name: "Next.js", detail: "App Router, streaming and edge rendering", color: "#171b25" },
  { name: "TypeScript", detail: "Strict types and safe, confident refactors", color: "#3178c6" },
];

const DEFAULT_OUTER_SKILLS: OrbitSkill[] = [
  { name: "JavaScript", detail: "Modern ES features, async patterns and the DOM", color: "#e2b203" },
  { name: "Tailwind CSS", detail: "Utility-first design systems and theming", color: "#06b6d4" },
  { name: "Node.js", detail: "APIs, tooling and server-side rendering", color: "#5fa04e" },
  { name: "Git", detail: "Clean history, code review and CI workflows", color: "#f05033" },
  { name: "Performance", detail: "Core Web Vitals, lazy loading and lean bundles", color: "#8b5cf6" },
];

const DEFAULT_STATS = [
  { value: "3+", label: "Years" },
  { value: "44+", label: "Components" },
  { value: "100%", label: "Attention to detail" },
];

const DEFAULT_PRIMARY: SkillOrbitHeroAction = { label: "Hire me", href: "#contact" };
const DEFAULT_SECONDARY: SkillOrbitHeroAction = { label: "View work", href: "#collection" };

/** Even spacing around a ring, starting at 12 o'clock. */
function evenAngles(count: number): number[] {
  const step = 360 / Math.max(count, 1);
  return Array.from({ length: count }, (_, index) => -90 + step * index);
}

/**
 * Outer chips sit in the gaps between inner chips, spread evenly inside each gap. Both rings
 * turn together, so this arrangement holds at every angle and chips never pass each other.
 */
function interleavedAngles(inner: number[], count: number): number[] {
  if (inner.length === 0) return evenAngles(count);
  const gap = 360 / inner.length;
  return inner.flatMap((start, gapIndex) => {
    const inGap = Math.floor(count / inner.length) + (gapIndex < count % inner.length ? 1 : 0);
    return Array.from({ length: inGap }, (_, index) => start + (gap * (index + 1)) / (inGap + 1));
  });
}

function placeSkills(inner: OrbitSkill[], outer: OrbitSkill[]): PlacedSkill[] {
  const innerAngles = evenAngles(inner.length);
  const outerAngles = interleavedAngles(innerAngles, outer.length);
  const place = (skills: OrbitSkill[], ring: Ring, angles: number[], offset: number) =>
    skills.map((skill, index) => ({
      ...skill,
      key: `${ring}-${index}`,
      ring,
      angle: angles[index],
      delay: 450 + (offset + index) * 70,
    }));
  return [...place(inner, "inner", innerAngles, 0), ...place(outer, "outer", outerAngles, inner.length)];
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/*
 * Class lists. The section is `@container/stage` (layout breakpoints); the square orbit is
 * `@container/orbit` and `group/orbit`, so ring radii scale with its width (cqw); hovering it or
 * `data-paused` (keyboard focus on a chip, a pinned popover, offscreen) pauses both rings.
 */
const STAGE =
  "so-stage @container/stage relative isolate box-border flex w-full min-w-0 flex-col justify-center overflow-hidden " +
  "bg-[#fafbfc] font-[family-name:var(--font-geist-sans),system-ui,-apple-system,'Segoe_UI',sans-serif] text-[#171b25] antialiased " +
  // Very light dotted grid that fades towards the edges.
  "before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:content-[''] " +
  "before:bg-[radial-gradient(#dfe3eb_1px,transparent_1.2px)] before:bg-size-[22px_22px] " +
  "before:[mask-image:radial-gradient(ellipse_75%_70%_at_60%_50%,#000_30%,transparent_100%)]";
const LAYOUT =
  "so-layout mx-auto grid w-full max-w-[1200px] items-center gap-x-[clamp(24px,4cqw,64px)] gap-y-10 " +
  "px-[clamp(16px,4.5cqw,56px)] py-[clamp(40px,6.5cqw,80px)] @min-[768px]/stage:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)]";
const INTRO = "so-intro flex min-w-0 flex-col items-start @max-[767px]/stage:items-center @max-[767px]/stage:text-center";
const PILL =
  "so-pill inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#e2e6ee] bg-white px-3 py-1 " +
  "text-[12px] leading-5 font-medium text-[#3d4453] shadow-[0_1px_2px_rgba(23,27,37,.05),0_4px_12px_-4px_rgba(23,27,37,.1)]";
const EYEBROW =
  "so-eyebrow flex items-center gap-2.5 font-[family-name:var(--font-geist-mono),ui-monospace,SFMono-Regular,monospace] text-[13px] leading-5 text-[#737987] " +
  "before:h-px before:w-6 before:bg-[#4866e9] before:content-['']";
const NAME =
  "so-name mt-3 max-w-full text-[clamp(44px,7.2cqw,88px)] leading-[.95] font-semibold tracking-[-.045em] wrap-break-word text-[#171b25]";
const ROLE = "so-role mt-4 text-[clamp(18px,2.1cqw,23px)] leading-snug font-medium tracking-[-.01em] text-[#2c3240]";
const BIO = "so-bio mt-3 max-w-[44ch] text-[15px] leading-relaxed text-[#737987] @min-[1100px]/stage:text-base";
const STATS =
  "so-stats mt-7 grid w-full max-w-[440px] grid-cols-3 divide-x divide-[#e6e9f0] border-y border-[#e6e9f0] py-4";
const STAT = "so-stat flex min-w-0 flex-col-reverse gap-1 px-3 first:pl-0 @max-[767px]/stage:items-center @max-[767px]/stage:first:pl-3";
const ACTIONS = "so-actions mt-7 flex flex-wrap items-center gap-3 @max-[767px]/stage:justify-center";
const ACTION =
  "so-action inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[14.5px] font-medium no-underline whitespace-nowrap " +
  "transition-[background-color,border-color,box-shadow,translate] duration-200 ease-out motion-safe:hover:-translate-y-px active:translate-y-0";
const PRIMARY =
  `${ACTION} bg-[#4866e9] text-white shadow-[0_1px_2px_rgba(72,102,233,.3),0_8px_20px_-8px_rgba(72,102,233,.7)] ` +
  "hover:bg-[#3d5ad8] hover:shadow-[0_1px_2px_rgba(72,102,233,.3),0_12px_24px_-8px_rgba(72,102,233,.75)]";
const SECONDARY =
  `${ACTION} border border-[#dfe3eb] bg-white text-[#171b25] shadow-[0_1px_2px_rgba(23,27,37,.05)] hover:border-[#c9cfdc] hover:bg-[#f5f6f9]`;

const ORBIT_WRAP = "so-orbit-wrap flex min-w-0 justify-center";
const ORBIT =
  "so-orbit group/orbit @container/orbit relative aspect-square shrink-0 " +
  "w-[min(calc(100%_+_16px),540px)] @min-[768px]/stage:w-[min(100%,640px)]";
/** Ring radii and portrait size, derived from the orbit's width (cqw) so chips stay inside it. Small orbits use compact chips. */
const ORBIT_FRAME =
  "so-orbit-frame absolute inset-0 [--so-outer:calc(50cqw_-_54px)] [--so-inner:calc(var(--so-outer)*.7)] " +
  "@max-[440px]/orbit:[--so-outer:calc(50cqw_-_48px)] @max-[440px]/orbit:[--so-inner:calc(var(--so-outer)*.72)] " +
  "[--so-portrait:clamp(72px,calc(var(--so-inner)*2_-_132px),172px)]";
const GLOW =
  "so-glow pointer-events-none absolute inset-[16%] rounded-full bg-[radial-gradient(circle,rgba(72,102,233,.16),rgba(72,102,233,0)_68%)] blur-2xl";
const RING_LAYER = "so-ring-layer pointer-events-none absolute inset-0";
const RING_LAYER_ENTER = "motion-safe:animate-[so-ring-in_1s_cubic-bezier(.2,.8,.2,1)_both]";
const RING_LAYER_ENTER_LATE = "motion-safe:animate-[so-ring-in_1s_cubic-bezier(.2,.8,.2,1)_120ms_both]";
const RING_LINE =
  "so-ring-line absolute top-1/2 left-1/2 size-[calc(var(--so-r)*2)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#d2d8e5]";
const ROTATOR = "so-rotator absolute inset-0 m-0 list-none p-0";
const PAUSE = "group-hover/orbit:[animation-play-state:paused] group-data-[paused=true]/orbit:[animation-play-state:paused]";
/**
 * Both rings turn together so the interleaved chips keep their spacing; each chip's holder turns
 * back at the same rate so labels stay upright.
 */
const SPIN = {
  inner: `motion-safe:animate-[so-spin_60s_linear_infinite] ${PAUSE}`,
  outer: `motion-safe:animate-[so-spin_60s_linear_infinite] ${PAUSE}`,
};
const COUNTER_SPIN = {
  inner: `motion-safe:animate-[so-spin_60s_linear_infinite_reverse] ${PAUSE}`,
  outer: `motion-safe:animate-[so-spin_60s_linear_infinite_reverse] ${PAUSE}`,
};
/** Thumbnail rings ease between fixed angles instead (`--so-spin` per frame). */
const STEP_MOTION = "transition-transform duration-[1500ms] ease-[cubic-bezier(.65,0,.35,1)]";
const STEP_SPIN = `[transform:rotate(var(--so-spin))] ${STEP_MOTION}`;
const STEP_COUNTER = `[transform:rotate(calc(-1*var(--so-spin)))] ${STEP_MOTION}`;
/** Puts a chip on its ring: turn to `--angle`, move out by `--so-r`, turn back. */
const POSITIONER =
  "so-slot absolute top-1/2 left-1/2 size-0 [transform:rotate(var(--angle))_translateX(var(--so-r))_rotate(calc(-1*var(--angle)))]";
const COUNTER = "so-counter absolute top-0 left-0 w-max -translate-x-1/2 -translate-y-1/2";
const CHIP =
  "so-chip relative flex h-9 items-center gap-2 rounded-full border border-[#e2e6ee] bg-white py-0 pr-3.5 pl-1.5 " +
  "text-[13.5px] leading-none font-medium whitespace-nowrap text-[#171b25] " +
  "shadow-[0_1px_2px_rgba(23,27,37,.06),0_8px_20px_-8px_rgba(23,27,37,.18)] " +
  "transition-[translate,border-color,box-shadow] duration-200 ease-out " +
  "data-[active=true]:border-[color-mix(in_srgb,var(--skill-color)_45%,#e2e6ee)] " +
  "data-[active=true]:shadow-[0_0_0_4px_color-mix(in_srgb,var(--skill-color)_14%,transparent),0_10px_24px_-8px_rgba(23,27,37,.24)] " +
  "@max-[440px]/orbit:h-8 @max-[440px]/orbit:gap-1.5 @max-[440px]/orbit:pr-3 @max-[440px]/orbit:pl-1 @max-[440px]/orbit:text-[12px]";
const CHIP_LIVE =
  `${CHIP} pointer-events-auto motion-safe:hover:-translate-y-0.5 aria-expanded:-translate-y-0.5 ` +
  "motion-safe:animate-[so-chip-in_.6s_cubic-bezier(.2,.9,.3,1.15)_var(--so-delay)_both]";
const CHIP_DOT_WRAP =
  "so-chip-dot grid size-6 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--skill-color)_15%,white)] @max-[440px]/orbit:size-5";
const CHIP_DOT = "size-2.5 rounded-full bg-(--skill-color) @max-[440px]/orbit:size-2";
const PORTRAIT_WRAP = "so-portrait-wrap absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
const PORTRAIT =
  "so-portrait relative size-(--so-portrait) rounded-full bg-white p-[clamp(4px,1.2cqw,7px)] " +
  "shadow-[0_0_0_1px_#e4e8f0,0_0_0_clamp(8px,2.6cqw,14px)_rgba(72,102,233,.06),0_28px_56px_-20px_rgba(23,27,37,.32)]";
const AVATAR =
  "grid size-full place-items-center overflow-hidden rounded-full bg-[linear-gradient(150deg,#7189f3,#4866e9_55%,#3550c9)] " +
  "text-[length:calc(var(--so-portrait)*.3)] font-semibold tracking-[-.03em] text-white select-none";
/** Under the portrait only where the inner ring leaves room; narrower stages show it above the intro. */
const ORBIT_PILL =
  `${PILL} absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 @max-[1023px]/stage:hidden`;
const STATUS_DOT = "relative grid size-2 place-items-center";
const TOOLTIP =
  "so-tooltip pointer-events-none absolute top-0 left-0 z-30 w-max max-w-[min(250px,calc(100%_-_24px))] rounded-xl border border-[#e2e6ee] bg-white " +
  "px-3.5 py-2.5 text-left shadow-[0_14px_34px_-10px_rgba(23,27,37,.26),0_2px_6px_rgba(23,27,37,.06)] " +
  "invisible opacity-0 transition-[opacity,translate,visibility] duration-200 ease-out data-[open=true]:visible data-[open=true]:opacity-100 " +
  "data-[open=false]:data-[side=top]:translate-y-1 data-[open=false]:data-[side=bottom]:-translate-y-1 motion-reduce:transition-none " +
  // Arrow pointing at the chip; `--so-arrow` is its x offset.
  "before:absolute before:left-(--so-arrow) before:size-2.5 before:-translate-x-1/2 before:rotate-45 before:border-[#e2e6ee] before:bg-white before:content-[''] " +
  "data-[side=top]:before:top-full data-[side=top]:before:-mt-[5px] data-[side=top]:before:border-r data-[side=top]:before:border-b " +
  "data-[side=bottom]:before:bottom-full data-[side=bottom]:before:-mb-[5px] data-[side=bottom]:before:border-t data-[side=bottom]:before:border-l";
const TIP_TITLE = "flex items-center gap-2 text-[13px] leading-5 font-semibold text-[#171b25]";
const TIP_DETAIL = "mt-0.5 text-[12.5px] leading-[1.45] text-[#737987]";

/** Staggered entrance for the intro, one static class per row. */
const RISE = [
  "motion-safe:animate-[so-rise_.7s_cubic-bezier(.2,.8,.2,1)_both]",
  "motion-safe:animate-[so-rise_.7s_cubic-bezier(.2,.8,.2,1)_60ms_both]",
  "motion-safe:animate-[so-rise_.7s_cubic-bezier(.2,.8,.2,1)_120ms_both]",
  "motion-safe:animate-[so-rise_.7s_cubic-bezier(.2,.8,.2,1)_180ms_both]",
  "motion-safe:animate-[so-rise_.7s_cubic-bezier(.2,.8,.2,1)_240ms_both]",
  "motion-safe:animate-[so-rise_.7s_cubic-bezier(.2,.8,.2,1)_300ms_both]",
];

function skillStyle(skill: PlacedSkill): CSSProperties {
  return {
    "--angle": `${skill.angle}deg`,
    "--skill-color": skill.color || ACCENT,
    "--so-delay": `${skill.delay}ms`,
  } as CSSProperties;
}

function StatusPill({ className = "", live = false }: { className?: string; live?: boolean }) {
  return (
    <span className={className}>
      <span className={STATUS_DOT} aria-hidden="true">
        {live && <span className="absolute inset-0 rounded-full bg-[#22c55e] opacity-60 motion-safe:animate-ping" />}
        <span className="relative size-2 rounded-full bg-[#22c55e] shadow-[0_0_0_3px_rgba(34,197,94,.18)]" />
      </span>
      Available for work
    </span>
  );
}

function Portrait({ photoSrc, photoAlt, initials }: { photoSrc?: string; photoAlt: string; initials: string }) {
  return (
    <div className={PORTRAIT}>
      {photoSrc ? (
        <img className="block size-full rounded-full object-cover" src={photoSrc} alt={photoAlt} draggable={false} />
      ) : (
        <span className={AVATAR} aria-hidden="true">
          {initials}
        </span>
      )}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActionControl({ action, primary }: { action: SkillOrbitHeroAction; primary?: boolean }) {
  const className = primary ? PRIMARY : SECONDARY;
  const content = (
    <>
      {action.label}
      {primary && <ArrowIcon />}
    </>
  );
  return action.href ? (
    <a className={className} href={action.href} onClick={action.onClick}>
      {content}
    </a>
  ) : (
    <button className={className} type="button" onClick={action.onClick}>
      {content}
    </button>
  );
}

/**
 * Portfolio hero: an intro beside your portrait, circled by two counter-rotating rings of skills.
 * Hovering the orbit or focusing a chip pauses it; each chip shows a detail popover that can be pinned.
 */
export default function SkillOrbitHero({
  name = "Hasan",
  role = "Frontend Developer",
  bio = "I build thoughtful, fast, and accessible web interfaces with React and Next.js.",
  photoSrc,
  photoAlt,
  initials = "HS",
  available = true,
  stats = DEFAULT_STATS,
  innerSkills = DEFAULT_INNER_SKILLS,
  outerSkills = DEFAULT_OUTER_SKILLS,
  primaryAction = DEFAULT_PRIMARY,
  secondaryAction = DEFAULT_SECONDARY,
  headingLevel = 2,
  className = "",
}: SkillOrbitHeroProps) {
  const id = useId();
  const stage = useRef<HTMLElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const chips = useRef(new Map<string, HTMLButtonElement>());
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [offscreen, setOffscreen] = useState(false);
  const shown = hovered ?? focused ?? pinned;
  // Keep the last skill's content while the popover fades out.
  const [lastShown, setLastShown] = useState<string | null>(null);
  if (shown !== null && shown !== lastShown) setLastShown(shown);

  const skills = placeSkills(innerSkills, outerSkills);
  const detailSkill = skills.find((skill) => skill.key === lastShown);
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const tooltipId = `${id}-detail`;

  /** Position the popover above (or below) its chip, clamped inside the stage. */
  const placeTooltip = useCallback(() => {
    const stageEl = stage.current;
    const tip = tooltip.current;
    const chip = lastShown ? chips.current.get(lastShown) : undefined;
    if (!stageEl || !tip || !chip) return;
    const area = stageEl.getBoundingClientRect();
    const box = chip.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = tip;
    const gap = 10;
    const edge = 12;
    const center = box.left + box.width / 2 - area.left;
    const left = clamp(center - width / 2, edge, area.width - width - edge);
    const above = box.top - area.top - gap - height >= edge;
    tip.style.left = `${left}px`;
    tip.style.top = `${above ? box.top - area.top - gap - height : box.bottom - area.top + gap}px`;
    tip.style.setProperty("--so-arrow", `${clamp(center - left, 16, width - 16)}px`);
    tip.dataset.side = above ? "top" : "bottom";
  }, [lastShown]);

  useLayoutEffect(() => {
    if (shown !== null) placeTooltip();
  }, [shown, placeTooltip]);

  // Follow layout changes (resize, full screen) while a popover is open.
  useEffect(() => {
    const stageEl = stage.current;
    if (shown === null || !stageEl || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => placeTooltip());
    observer.observe(stageEl);
    return () => observer.disconnect();
  }, [shown, placeTooltip]);

  // Escape dismisses the popover. Capture phase so a surrounding dialog does not close first.
  useEffect(() => {
    if (shown === null) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setHovered(null);
      setFocused(null);
      setPinned(null);
    }
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [shown]);

  // A pinned popover closes when the visitor presses anywhere outside the chips.
  useEffect(() => {
    if (pinned === null) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (target && [...chips.current.values()].some((chip) => chip.contains(target))) return;
      setPinned(null);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [pinned]);

  // Rings stop while the hero is scrolled out of view.
  useEffect(() => {
    const stageEl = stage.current;
    if (!stageEl || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
    observer.observe(stageEl);
    return () => observer.disconnect();
  }, []);

  const renderRing = (ring: Ring) => {
    const ringSkills = skills.filter((skill) => skill.ring === ring);
    if (ringSkills.length === 0) return null;
    return (
      <div
        className={`${RING_LAYER} ${ring === "inner" ? `[--so-r:var(--so-inner)] ${RING_LAYER_ENTER}` : `[--so-r:var(--so-outer)] ${RING_LAYER_ENTER_LATE}`}`}
      >
        <span className={RING_LINE} aria-hidden="true" />
        <ul className={`${ROTATOR} ${SPIN[ring]}`} aria-label={ring === "inner" ? "Core skills" : "More skills"}>
          {ringSkills.map((skill) => (
            <li className={POSITIONER} key={skill.key} style={skillStyle(skill)}>
              <div className={`${COUNTER} ${COUNTER_SPIN[ring]}`}>
                <button
                  ref={(element) => {
                    if (element) chips.current.set(skill.key, element);
                    else chips.current.delete(skill.key);
                  }}
                  className={CHIP_LIVE}
                  type="button"
                  data-active={shown === skill.key}
                  aria-expanded={pinned === skill.key}
                  aria-describedby={shown === skill.key ? tooltipId : undefined}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") setHovered(skill.key);
                  }}
                  onPointerLeave={() => setHovered((key) => (key === skill.key ? null : key))}
                  onFocus={(event) => {
                    if (event.currentTarget.matches(":focus-visible")) setFocused(skill.key);
                  }}
                  onBlur={() => setFocused((key) => (key === skill.key ? null : key))}
                  onClick={() => setPinned((key) => (key === skill.key ? null : skill.key))}
                >
                  <span className={CHIP_DOT_WRAP} aria-hidden="true">
                    <span className={CHIP_DOT} />
                  </span>
                  {skill.name}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <section ref={stage} className={`${STAGE} min-h-[560px] ${className}`} aria-labelledby={`${id}-name`}>
      <ComponentStyles css={SKILL_ORBIT_CSS} />
      <div className={LAYOUT}>
        <div className={INTRO}>
          {available && <StatusPill className={`${PILL} mb-5 @min-[1024px]/stage:hidden ${RISE[0]}`} live />}
          <p className={`${EYEBROW} ${RISE[0]}`}>Hello, I&rsquo;m</p>
          <Heading className={`${NAME} ${RISE[1]}`} id={`${id}-name`}>
            {name}
            <span className="text-[#4866e9]" aria-hidden="true">.</span>
          </Heading>
          <p className={`${ROLE} ${RISE[2]}`}>{role}</p>
          {bio && <p className={`${BIO} ${RISE[3]}`}>{bio}</p>}
          {stats.length > 0 && (
            <dl className={`${STATS} ${RISE[4]}`}>
              {stats.map((stat) => (
                <div className={STAT} key={`${stat.value}-${stat.label}`}>
                  <dt className="text-[12.5px] leading-snug text-[#737987]">{stat.label}</dt>
                  <dd className="m-0 text-[clamp(20px,2.4cqw,26px)] leading-none font-semibold tracking-[-.03em] tabular-nums">{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className={`${ACTIONS} ${RISE[5]}`}>
            <ActionControl action={primaryAction} primary />
            <ActionControl action={secondaryAction} />
          </div>
        </div>

        <div className={ORBIT_WRAP}>
          <div className={ORBIT} data-paused={focused !== null || pinned !== null || offscreen}>
            <div className={ORBIT_FRAME}>
              <span className={GLOW} aria-hidden="true" />
              <div className={`${PORTRAIT_WRAP} motion-safe:animate-[so-ring-in_.9s_cubic-bezier(.2,.8,.2,1)_both]`}>
                <Portrait photoSrc={photoSrc} photoAlt={photoAlt ?? `Portrait of ${name}`} initials={initials} />
                {available && <StatusPill className={ORBIT_PILL} live />}
              </div>
              {renderRing("inner")}
              {renderRing("outer")}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={tooltip}
        className={TOOLTIP}
        id={tooltipId}
        role="tooltip"
        data-open={shown !== null}
        style={{ "--skill-color": detailSkill?.color || ACCENT } as CSSProperties}
      >
        {detailSkill && (
          <>
            <span className={TIP_TITLE}>
              <span className="size-2 rounded-full bg-(--skill-color)" aria-hidden="true" />
              {detailSkill.name}
            </span>
            {detailSkill.detail && <span className={`${TIP_DETAIL} block`}>{detailSkill.detail}</span>}
          </>
        )}
      </div>
    </section>
  );
}

/** Inert gallery artwork: each frame turns the rings to a new angle and highlights another skill. */
export function SkillOrbitHeroThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) : 0;
  const skills = placeSkills(DEFAULT_INNER_SKILLS, DEFAULT_OUTER_SKILLS);
  const highlighted = skills[step % skills.length];
  const spin: Record<Ring, number> = { inner: step * 36, outer: step * 36 };

  const renderRing = (ring: Ring) => (
    <div
      className={`${RING_LAYER} ${ring === "inner" ? "[--so-r:var(--so-inner)]" : "[--so-r:var(--so-outer)]"} data-[front=true]:z-10`}
      data-front={highlighted.ring === ring}
      style={{ "--so-spin": `${spin[ring]}deg` } as CSSProperties}
    >
      <span className={RING_LINE} />
      <div className={`${ROTATOR} ${STEP_SPIN}`}>
        {skills
          .filter((skill) => skill.ring === ring)
          .map((skill) => {
            const active = skill === highlighted;
            // The bubble sits above its chip, leaning inwards when the chip comes to rest near either side.
            const x = Math.cos(((skill.angle + spin[ring]) * Math.PI) / 180);
            const align = x > 0.45 ? "end" : x < -0.45 ? "start" : "center";
            return (
              <div className={POSITIONER} key={skill.key} style={skillStyle(skill)}>
                <div className={`${COUNTER} ${STEP_COUNTER}`}>
                  <span className={CHIP} data-active={active}>
                    <span className={CHIP_DOT_WRAP}>
                      <span className={CHIP_DOT} />
                    </span>
                    {skill.name}
                  </span>
                  {active && (
                    <span
                      className={
                        "so-thumb-tip absolute z-10 w-max max-w-[220px] rounded-xl border border-[#e2e6ee] bg-white px-3 py-2 text-left " +
                        "bottom-full mb-2.5 shadow-[0_14px_34px_-10px_rgba(23,27,37,.26)] data-[align=center]:left-1/2 data-[align=center]:-translate-x-1/2 " +
                        "data-[align=end]:right-0 data-[align=start]:left-0"
                      }
                      data-align={align}
                    >
                      <span className={TIP_TITLE}>{skill.name}</span>
                      <span className={`${TIP_DETAIL} block`}>{skill.detail}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  return (
    <div className={`${STAGE} so-thumbnail h-full min-h-0 items-center ${className}`} aria-hidden="true" inert>
      {/* The desktop composition at a fixed size, scaled to fit the gallery card. */}
      <div className="so-thumb-scene grid w-[820px] flex-none origin-center scale-50 grid-cols-[330px_420px] items-center gap-[40px] px-3 @min-[440px]/stage:scale-[.56] @min-[500px]/stage:scale-[.62] @min-[600px]/stage:scale-[.7] @max-[370px]/stage:scale-[.42]">
        <div className="flex flex-col items-start">
          <span className={`${PILL} mb-5`}>
            <span className={STATUS_DOT}>
              <span className="relative size-2 rounded-full bg-[#22c55e] shadow-[0_0_0_3px_rgba(34,197,94,.18)]" />
            </span>
            Available for work
          </span>
          <span className={EYEBROW}>Hello, I&rsquo;m</span>
          <span className="so-name mt-3 text-[76px] leading-[.95] font-semibold tracking-[-.045em]">
            Hasan<span className="text-[#4866e9]">.</span>
          </span>
          <span className="mt-4 text-[22px] leading-snug font-medium tracking-[-.01em] text-[#2c3240]">Frontend Developer</span>
          <span className="mt-6 grid w-full grid-cols-[auto_auto_1fr] divide-x divide-[#e6e9f0] border-y border-[#e6e9f0] py-3.5">
            {DEFAULT_STATS.map((stat) => (
              <span className="flex flex-col gap-1 px-3 first:pl-0" key={stat.label}>
                <span className="text-[22px] leading-none font-semibold tracking-[-.03em]">{stat.value}</span>
                <span className="text-[11.5px] whitespace-nowrap text-[#737987]">{stat.label}</span>
              </span>
            ))}
          </span>
          <span className="mt-6 flex gap-3">
            <span className={PRIMARY}>
              Hire me
              <ArrowIcon />
            </span>
            <span className={SECONDARY}>View work</span>
          </span>
        </div>
        <div
          className="so-orbit relative size-[420px]"
          style={{ "--so-outer": "156px", "--so-inner": "110px", "--so-portrait": "112px" } as CSSProperties}
        >
          <span className={GLOW} />
          <div className={PORTRAIT_WRAP}>
            <Portrait photoAlt="" initials="HS" />
          </div>
          {renderRing("inner")}
          {renderRing("outer")}
        </div>
      </div>
    </div>
  );
}

/*
 * Only what Tailwind can't express: the keyframes, and focus outlines that must beat the site's
 * unlayered `:focus-visible` rule.
 */
const SKILL_ORBIT_CSS = `
.so-stage .so-chip:focus-visible { outline: 2px solid #4866e9; outline-offset: 3px; }
.so-stage .so-action:focus-visible { outline: 2px solid #4866e9; outline-offset: 3px; }

@keyframes so-spin { to { transform: rotate(360deg); } }
@keyframes so-ring-in { from { opacity: 0; scale: .86; } }
@keyframes so-chip-in { from { opacity: 0; scale: .5; } }
@keyframes so-rise { from { opacity: 0; translate: 0 14px; } }
`;
