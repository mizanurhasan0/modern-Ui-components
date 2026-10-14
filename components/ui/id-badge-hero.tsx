"use client";

import { ComponentStyles } from "./component-styles";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

export interface IdBadgeHeroProfile {
  /** Shown as the hero heading and on the badge. */
  name: string;
  /** Job title, e.g. "Frontend Developer". */
  role: string;
  /** One line of experience under the role. */
  experience?: string;
  /** A short introduction sentence. */
  bio?: string;
  /** Badge photo. Without it the badge shows an initials avatar. */
  photoSrc?: string;
  /** Alternative text for the photo; defaults to "Portrait of {name}". */
  photoAlt?: string;
  /** Avatar initials; derived from `name` when omitted. */
  initials?: string;
  /** Location or timezone, shown on the back of the badge. */
  location?: string;
  /** Contact email, shown on the back. The default primary action becomes a mailto link. */
  email?: string;
  /** Shows an "Available for work" status on the badge. */
  available?: boolean;
  /** Listed on the back of the badge; the first few also appear as chips in the intro. */
  skills: string[];
}

export interface IdBadgeHeroAction {
  label: string;
  /** Renders a link when set, otherwise a button. */
  href?: string;
  onClick?: () => void;
}

export interface IdBadgeHeroProps {
  /** The person on the badge. Defaults to a sample profile. */
  profile?: IdBadgeHeroProfile;
  /** Filled call to action. Defaults to "Hire me" (mailto when `profile.email` is set, otherwise `#contact`). */
  primaryAction?: IdBadgeHeroAction;
  /** Outlined call to action. Defaults to "View work" linking to `#collection`. */
  secondaryAction?: IdBadgeHeroAction;
  /** Heading level for the name: use 1 when the hero is the page's main heading. */
  headingLevel?: 1 | 2;
  className?: string;
}

/** Imperative handle to the pendulum simulation, created by the physics effect. */
type Pendulum = {
  angle: () => number;
  drag: (target: number) => void;
  release: () => void;
  nudge: (velocity: number) => void;
};
type DragState = { pointerId: number; startX: number; startY: number; offset: number; active: boolean };

const DEFAULT_PROFILE: IdBadgeHeroProfile = {
  name: "Hasan",
  role: "Frontend Developer",
  experience: "3+ years building React & Next.js interfaces",
  bio: "I build thoughtful, fast, and accessible web interfaces — and sweat the small details.",
  initials: "HS",
  location: "Remote · Open to worldwide teams",
  available: true,
  skills: ["React", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "Performance"],
};

/* Pendulum tuning. Angles are radians (positive = clockwise), time is seconds. */
/** ω₀² of the lanyard: a period of roughly 1.3 s. */
const GRAVITY = 24;
const DAMPING = 1.1;
/** Strength of the gentle periodic push that keeps the idle badge alive (about ±2°). */
const IDLE_TORQUE = 0.8;
/** While grabbed, a stiff spring pulls the badge toward the pointer so it still feels weighty. */
const DRAG_STIFFNESS = 320;
const DRAG_DAMPING = 30;
/** The card hangs from its clip and lags a little behind the strap's swing. */
const TILT_STIFFNESS = 140;
const TILT_DAMPING = 9;
const TILT_COUPLING = 0.55;
const MAX_TILT = 0.3;
const MAX_ANGLE = 1.15;
const MAX_VELOCITY = 12;
/** Angular velocity on mount, so the badge swings into place. */
const ENTRY_VELOCITY = 0.8;
const FLIP_KICK = 0.6;
const KEY_NUDGE = 1.4;
/** Pointer travel (px) that turns a press into a drag instead of a flip. */
const DRAG_THRESHOLD = 6;
const FIXED_STEP = 1 / 240;
const MAX_FRAME = 1 / 20;
/** The intro lists this many skills as chips; the badge's back lists up to `BACK_SKILLS`. */
const INTRO_SKILLS = 4;
const BACK_SKILLS = 8;

const MONO = "font-[family-name:var(--font-geist-mono),ui-monospace,SFMono-Regular,Menlo,monospace]";

/*
 * The stage is the `@container/ibh` every layout query targets. The badge area is a second,
 * size container (`ibh-rig`) so the strap length can follow its height via `cqh`.
 */
const STAGE =
  "ibh-stage group/ibh @container/ibh relative isolate box-border flex w-full min-w-0 flex-col overflow-hidden bg-[#fafbfc] text-[#171b25] antialiased " +
  "font-[family-name:var(--font-geist-sans),system-ui,-apple-system,'Segoe_UI',Roboto,sans-serif] " +
  // A faint dot grid that fades out towards the edges.
  "before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:content-[''] " +
  "before:bg-[radial-gradient(#dde1ea_1px,transparent_1.2px)] before:bg-size-[22px_22px] " +
  "before:[mask-image:radial-gradient(ellipse_75%_70%_at_68%_45%,#000_15%,transparent_75%)]";
const GRID =
  "ibh-grid relative mx-auto grid w-full max-w-[1200px] flex-1 grid-cols-1 px-6 " +
  "@min-[720px]/ibh:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] @min-[720px]/ibh:px-10 @min-[1100px]/ibh:px-16";

const INTRO = "ibh-intro relative z-2 flex min-w-0 flex-col items-start self-center pt-14 pb-2 @min-[720px]/ibh:py-16";
const EYEBROW =
  `ibh-eyebrow mb-4 inline-flex items-center gap-2.5 ${MONO} text-[12px] leading-none font-medium tracking-[.16em] text-[#4866e9] uppercase ` +
  "before:h-px before:w-6 before:bg-current before:content-['']";
const NAME =
  "ibh-name m-0 text-[clamp(44px,14cqw,60px)] leading-[.95] font-semibold tracking-[-.045em] text-[#171b25] wrap-anywhere " +
  "@min-[720px]/ibh:text-[clamp(54px,7.2cqw,96px)]";
const ROLE = "ibh-role mt-5 text-[19px] leading-snug font-medium tracking-[-.015em] text-[#171b25] @min-[1100px]/ibh:text-[23px]";
const EXPERIENCE = "ibh-experience mt-1.5 text-[15px] leading-snug text-[#737987] @min-[1100px]/ibh:text-[16px]";
const BIO = "ibh-bio mt-5 max-w-[44ch] text-[15.5px] leading-[1.65] text-[#5f6574] @min-[1100px]/ibh:text-[17px]";
const CHIPS = "ibh-chips mt-6 flex flex-wrap gap-2";
const CHIP =
  "ibh-chip rounded-full border border-[#e3e6ee] bg-white px-3 py-1 text-[12.5px] leading-[1.5] font-medium text-[#3c4250] " +
  "shadow-[0_1px_2px_rgba(23,27,37,.04)]";
const ACTIONS = "ibh-actions mt-8 flex flex-wrap items-center gap-3";
const ACTION =
  "ibh-action inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] leading-none font-semibold whitespace-nowrap no-underline select-none " +
  "transition-[background-color,border-color,box-shadow,translate] duration-200 ease-out motion-safe:active:translate-y-0";
const PRIMARY =
  `${ACTION} ibh-primary bg-[#4866e9] text-white shadow-[0_1px_0_rgba(255,255,255,.25)_inset,0_10px_24px_-10px_rgba(72,102,233,.7)] ` +
  "hover:bg-[#3a57dc] hover:shadow-[0_1px_0_rgba(255,255,255,.25)_inset,0_14px_28px_-10px_rgba(72,102,233,.8)] motion-safe:hover:-translate-y-px";
const SECONDARY =
  `${ACTION} ibh-secondary border border-[#dfe2ea] bg-white text-[#171b25] shadow-[0_1px_2px_rgba(23,27,37,.05)] ` +
  "hover:border-[#c8cedb] hover:bg-[#f5f7fa] motion-safe:hover:-translate-y-px";
/** Arrow nudges right when its action is hovered. */
const ACTION_ICON = "size-4 flex-none transition-transform duration-200 ease-out motion-safe:group-hover/act:translate-x-0.5";

/**
 * Badge area: card size tokens, and `--strap`, the strap length that roughly centres the card
 * vertically (never shorter than 72px). Narrow stages stack it under the intro.
 */
const RIG_AREA =
  "ibh-rig-area relative z-1 min-h-[560px] [container:ibh-rig/size] @min-[720px]/ibh:min-h-[580px] [--clip-h:72px] @min-[1100px]/ibh:[--clip-h:80px] " +
  "[--card-w:248px] [--card-h:364px] @min-[720px]/ibh:[--card-w:268px] @min-[720px]/ibh:[--card-h:380px] " +
  "@min-[1100px]/ibh:[--card-w:300px] @min-[1100px]/ibh:[--card-h:424px] " +
  "[--strap:max(96px,calc(50cqh_-_var(--card-h)/2_-_var(--clip-h)_+_8px))] " +
  "@min-[720px]/ibh:[--strap:max(72px,calc(50cqh_-_var(--card-h)/2_-_var(--clip-h)_+_8px))]";
const GLOW =
  "ibh-glow pointer-events-none absolute top-[calc(var(--strap)_+_var(--clip-h)_-_16px_+_var(--card-h)/2)] left-1/2 size-[min(520px,130%)] -translate-1/2 rounded-full " +
  "bg-[radial-gradient(circle,rgba(72,102,233,.13),rgba(72,102,233,.04)_45%,transparent_70%)]";
const PIVOT = "ibh-pivot pointer-events-none absolute top-0 left-1/2 size-0";
/** Everything below the pivot rotates together; JS sets `transform: rotate()` each frame. */
const RIG = "ibh-rig absolute top-0 left-1/2 flex w-(--card-w) -translate-x-1/2 origin-top flex-col items-center will-change-transform";
const STRAP =
  "ibh-strap relative h-(--strap) w-[32px] flex-none overflow-hidden @min-[1100px]/ibh:w-[38px] " +
  "[background:repeating-linear-gradient(0deg,rgba(255,255,255,.07)_0_1px,transparent_1px_3px),linear-gradient(90deg,#3653d6,#5272f0_50%,#3653d6)] " +
  "shadow-[3px_0_8px_-2px_rgba(23,27,37,.25)] " +
  // Stitched edges.
  "before:absolute before:inset-y-0 before:left-[3px] before:border-l before:border-dashed before:border-white/40 before:content-[''] " +
  "after:absolute after:inset-y-0 after:right-[3px] after:border-r after:border-dashed after:border-white/40 after:content-['']";
/** Stacked under the intro, the live strap fades in rather than starting mid-page. */
const STRAP_FADE = "@max-[719px]/ibh:[mask-image:linear-gradient(to_bottom,transparent,#000_72px)]";
const STRAP_TEXT =
  `ibh-strap-text absolute bottom-0 left-1/2 -translate-x-1/2 ${MONO} text-[8.5px] leading-none font-semibold tracking-[.32em] whitespace-nowrap text-white/85 uppercase ` +
  "[writing-mode:vertical-rl] rotate-180 @min-[1100px]/ibh:text-[9.5px]";
const CLIP = "ibh-clip relative z-2 -mb-4 block h-(--clip-h) w-[calc(var(--clip-h)*.6875)] flex-none drop-shadow-[0_3px_3px_rgba(23,27,37,.22)]";
/** Hangs from the clip; JS sets its own small lagging `rotate()`. */
const CARD = "ibh-card relative z-1 h-(--card-h) w-(--card-w) flex-none origin-[50%_0] [perspective:1400px] will-change-transform";
const FLIPPER =
  "ibh-flipper relative size-full [transform-style:preserve-3d] transition-transform duration-900 ease-[cubic-bezier(.3,1.3,.5,1)] " +
  "data-[flipped=true]:[transform:rotateY(180deg)] motion-reduce:transition-none";
const FACE =
  "ibh-face absolute inset-0 flex flex-col overflow-hidden rounded-[22px] bg-white [backface-visibility:hidden] " +
  "shadow-[0_0_0_1px_rgba(23,27,37,.06),0_1px_2px_rgba(23,27,37,.06),0_10px_20px_-6px_rgba(23,27,37,.12),0_34px_60px_-18px_rgba(23,27,37,.28)]";
/** The punched slot the clip passes through. */
const SLOT =
  "ibh-slot absolute top-2.5 left-1/2 z-2 h-[9px] w-12 -translate-x-1/2 rounded-full bg-[#eceef3] " +
  "shadow-[inset_0_1.5px_2px_rgba(23,27,37,.35),0_1px_0_rgba(255,255,255,.6)]";
const HANDLE =
  "ibh-handle absolute inset-0 z-3 rounded-[22px] bg-transparent p-0 touch-pan-y select-none [-webkit-tap-highlight-color:transparent]";
const HINT =
  `ibh-hint pointer-events-none absolute inset-x-0 top-[calc(var(--strap)_+_var(--clip-h)_-_16px_+_var(--card-h)_+_26px)] text-center ${MONO} text-[11px] leading-none tracking-[.08em] text-[#9aa0ad] uppercase`;

/* Front of the badge. */
const FRONT_HEADER =
  "ibh-front-header relative h-[30%] flex-none overflow-hidden bg-[linear-gradient(140deg,#5272f0,#3b58db_55%,#2f49c4)] " +
  // Fine diagonal guilloche lines.
  "before:absolute before:inset-0 before:bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.07)_0_1px,transparent_1px_9px)] before:content-['']";
/** A soft highlight that slides across the header as the badge swings (driven by `--ibh-swing`). */
const SHEEN =
  "ibh-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-[200%] bg-[linear-gradient(105deg,transparent_38%,rgba(255,255,255,.22)_50%,transparent_62%)] " +
  "[translate:calc(var(--ibh-swing,0)_*_-260%)_0]";
const HEADER_LABEL = `absolute top-[30px] ${MONO} text-[9.5px] leading-none font-semibold tracking-[.2em] text-white/85 uppercase @min-[1100px]/ibh:text-[10.5px]`;
const AVATAR =
  "ibh-avatar relative z-1 mx-auto -mt-[46px] grid size-[92px] flex-none place-items-center overflow-hidden rounded-[28px] bg-[linear-gradient(150deg,#f1f4ff,#dfe5fd)] " +
  "text-[32px] font-semibold tracking-[-.03em] text-[#4866e9] shadow-[0_0_0_4px_#fff,0_8px_18px_-6px_rgba(23,27,37,.25)] " +
  "@min-[1100px]/ibh:size-[104px] @min-[1100px]/ibh:text-[36px]";
const CARD_NAME =
  "ibh-card-name mt-4 truncate px-5 text-center text-[22px] leading-tight font-semibold tracking-[-.025em] text-[#171b25] @min-[1100px]/ibh:text-[25px]";
const CARD_ROLE = "ibh-card-role mt-1 truncate px-5 text-center text-[13.5px] leading-snug text-[#737987] @min-[1100px]/ibh:text-[14.5px]";
const CARD_SKILLS = `ibh-card-skills mt-3 truncate px-5 text-center ${MONO} text-[9.5px] leading-none tracking-[.14em] text-[#4866e9] uppercase @min-[1100px]/ibh:text-[10.5px]`;
const META = "ibh-meta mx-5 mt-auto grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-[#eceef3] text-left";
const META_CELL = "flex min-w-0 flex-col gap-1 bg-[#f8f9fb] px-3 py-2.5";
const META_LABEL = `${MONO} text-[8.5px] leading-none tracking-[.16em] text-[#9aa0ad] uppercase`;
const META_VALUE = "flex items-center gap-1.5 truncate text-[12.5px] leading-tight font-semibold text-[#171b25]";
const BARCODE = "ibh-barcode mx-5 mt-3.5 mb-4 flex flex-none items-end justify-between gap-3";

/* Back of the badge. */
const BACK_LABEL = `${MONO} text-[9.5px] leading-none font-semibold tracking-[.2em] text-[#9aa0ad] uppercase`;
const STATUS =
  "ibh-status mt-3 inline-flex items-center gap-2 self-start rounded-full px-2.5 py-1 text-[12px] leading-[1.4] font-semibold " +
  "data-[available=true]:bg-[#e8f7ef] data-[available=true]:text-[#17794a] data-[available=false]:bg-[#f1f2f5] data-[available=false]:text-[#5f6574]";
const STATUS_DOT =
  "ibh-status-dot relative size-2 flex-none rounded-full bg-current " +
  "group-data-[available=true]/status:after:absolute group-data-[available=true]/status:after:inset-0 group-data-[available=true]/status:after:rounded-full " +
  "group-data-[available=true]/status:after:bg-current group-data-[available=true]/status:after:content-[''] " +
  "motion-safe:group-data-[available=true]/status:after:animate-[ibh-ping_2s_cubic-bezier(0,0,.2,1)_infinite]";
const SKILL_GRID = "ibh-skills mt-4 grid grid-cols-2 gap-1.5";
const SKILL =
  "ibh-skill flex min-w-0 items-center gap-2 rounded-[10px] bg-[#f5f7fb] px-2.5 py-2 text-[12.5px] leading-tight font-medium text-[#2b303c] " +
  "before:size-1.5 before:flex-none before:rounded-[2px] before:bg-[#4866e9] before:content-['']";
const CONTACT = "ibh-contact mt-auto flex items-end gap-3 border-t border-dashed border-[#e3e6ee] pt-3.5";
const CONTACT_LINE = "flex min-w-0 items-center gap-1.5 text-[11.5px] leading-snug text-[#5f6574]";

/** djb2 string hash: a stable seed for the badge number, barcode and code pattern. */
function hashString(value: string) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) hash = (Math.imul(hash, 33) ^ value.charCodeAt(index)) >>> 0;
  return hash;
}

/** Small deterministic generator, so server and client render identical decorations. */
function seededRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function deriveInitials(name: string) {
  const letters = name.trim().split(/\s+/).filter(Boolean).map((word) => word[0]);
  return (letters.length > 1 ? letters[0] + letters[letters.length - 1] : name.trim().slice(0, 2)).toUpperCase();
}

function badgeNumber(name: string) {
  return `CL-${String((hashString(name) % 9000) + 1000)}`;
}

/** Decorative barcode: bar positions as one SVG path on a 120 × 28 grid. */
function barcodePath(seed: number) {
  const random = seededRandom(seed);
  const widths: number[] = [];
  for (let index = 0; index < 34; index += 1) widths.push(1 + Math.floor(random() * 3), 1 + Math.floor(random() * 2));
  const total = widths.reduce((sum, width) => sum + width, 0);
  const unit = 120 / total;
  let x = 0;
  let path = "";
  widths.forEach((width, index) => {
    if (index % 2 === 0) path += `M${(x * unit).toFixed(2)} 0h${(width * unit).toFixed(2)}v28h-${(width * unit).toFixed(2)}z`;
    x += width;
  });
  return path;
}

/** Decorative 2D code: three finder squares plus seeded cells on a 21 × 21 grid. */
function codePath(seed: number) {
  const random = seededRandom(seed ^ 0x9e3779b9);
  const finder = (x: number, y: number) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
  let path = finder(0, 0) + finder(14, 0) + finder(0, 14);
  for (let y = 0; y < 21; y += 1) {
    for (let x = 0; x < 21; x += 1) {
      const inFinder = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
      if (!inFinder && random() > 0.52) path += `M${x} ${y}h1v1h-1z`;
    }
  }
  return path;
}

function ArrowIcon() {
  return (
    <svg className={ACTION_ICON} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3 8h9.5M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Action({ action, className, interactive }: { action: IdBadgeHeroAction; className: string; interactive: boolean }) {
  const content = (
    <>
      {action.label}
      <ArrowIcon />
    </>
  );
  const classes = `${className} group/act`;
  if (!interactive) return <span className={classes}>{content}</span>;
  if (action.href) {
    return (
      <a className={classes} href={action.href} onClick={action.onClick}>
        {content}
      </a>
    );
  }
  return (
    <button className={classes} type="button" onClick={action.onClick}>
      {content}
    </button>
  );
}

/** Left column: greeting, name, role, bio, skill chips and actions. */
function Intro({
  profile,
  primary,
  secondary,
  headingId,
  headingLevel = 2,
  interactive,
}: {
  profile: IdBadgeHeroProfile;
  primary: IdBadgeHeroAction;
  secondary: IdBadgeHeroAction;
  headingId?: string;
  headingLevel?: 1 | 2;
  interactive: boolean;
}) {
  const HeadingTag = !interactive ? "span" : headingLevel === 1 ? "h1" : "h2";
  return (
    <div className={INTRO}>
      <p className={EYEBROW}>Hello, I&rsquo;m</p>
      <HeadingTag className={NAME} id={headingId}>
        {profile.name}
        <span className="text-[#4866e9]">.</span>
      </HeadingTag>
      <p className={ROLE}>{profile.role}</p>
      {profile.experience && <p className={EXPERIENCE}>{profile.experience}</p>}
      {profile.bio && <p className={BIO}>{profile.bio}</p>}
      {profile.skills.length > 0 && (
        <ul className={CHIPS} aria-label="Top skills">
          {profile.skills.slice(0, INTRO_SKILLS).map((skill) => (
            <li className={CHIP} key={skill}>{skill}</li>
          ))}
        </ul>
      )}
      <div className={ACTIONS}>
        <Action action={primary} className={PRIMARY} interactive={interactive} />
        <Action action={secondary} className={SECONDARY} interactive={interactive} />
      </div>
    </div>
  );
}

/** Woven strap with a repeated label, ending in a crimp, a split ring and a bulldog clip. */
function Lanyard({ fade = false }: { fade?: boolean }) {
  return (
    <>
      <span className={fade ? `${STRAP} ${STRAP_FADE}` : STRAP} aria-hidden="true">
        <span className={STRAP_TEXT}>{"Component Lab ✦ ".repeat(10)}</span>
      </span>
      <svg className={CLIP} viewBox="0 0 44 64" fill="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="ibh-metal" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#8d94a3" />
            <stop offset=".35" stopColor="#f4f6fa" />
            <stop offset=".6" stopColor="#c3c8d2" />
            <stop offset="1" stopColor="#7c8392" />
          </linearGradient>
          <linearGradient id="ibh-metal-dark" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#6b7280" />
            <stop offset=".45" stopColor="#d9dde5" />
            <stop offset="1" stopColor="#5d6472" />
          </linearGradient>
        </defs>
        {/* Crimp that closes the strap loop. */}
        <rect x="12" y="0" width="20" height="11" rx="2.5" fill="url(#ibh-metal)" />
        <path d="M14 3.5h16M14 7.5h16" stroke="#7c8392" strokeOpacity=".55" strokeWidth=".8" />
        {/* Split ring. */}
        <ellipse cx="22" cy="18.5" rx="5.5" ry="6" stroke="url(#ibh-metal-dark)" strokeWidth="2.6" />
        {/* Clip body with its hinge. */}
        <rect x="13" y="24" width="18" height="22" rx="4" fill="url(#ibh-metal)" />
        <rect x="13" y="24" width="18" height="22" rx="4" stroke="#5d6472" strokeOpacity=".35" />
        <path d="M17 30h10" stroke="#7c8392" strokeOpacity=".7" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="22" cy="38" r="2.4" fill="url(#ibh-metal-dark)" stroke="#5d6472" strokeOpacity=".4" strokeWidth=".6" />
        {/* Jaw reaching into the badge's slot. */}
        <path d="M16.5 45h11l-1.4 16.2a2 2 0 0 1-2 1.8h-4.2a2 2 0 0 1-2-1.8z" fill="url(#ibh-metal-dark)" />
        <path d="M18.5 49.5h7" stroke="#5d6472" strokeOpacity=".45" strokeWidth=".9" />
      </svg>
    </>
  );
}

function Avatar({ profile }: { profile: IdBadgeHeroProfile }) {
  return (
    <span className={AVATAR}>
      {profile.photoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- A plain image keeps the copied component free of image configuration.
        <img className="size-full object-cover" src={profile.photoSrc} alt={profile.photoAlt ?? `Portrait of ${profile.name}`} draggable={false} />
      ) : (
        <span aria-hidden="true">{profile.initials?.trim() || deriveInitials(profile.name)}</span>
      )}
    </span>
  );
}

function BadgeFront({ profile }: { profile: IdBadgeHeroProfile }) {
  const seed = hashString(profile.name);
  const available = profile.available ?? false;
  return (
    <>
      <span className={SLOT} />
      <div className={FRONT_HEADER}>
        <span className={SHEEN} />
        <span className={`${HEADER_LABEL} left-5`}>Component Lab</span>
        <span className={`${HEADER_LABEL} right-5 text-white/60`}>Portfolio</span>
      </div>
      <Avatar profile={profile} />
      <p className={CARD_NAME}>{profile.name}</p>
      <p className={CARD_ROLE}>{profile.role}</p>
      {profile.skills.length > 0 && <p className={CARD_SKILLS}>{profile.skills.slice(0, 3).join(" · ")}</p>}
      <dl className={META}>
        <div className={META_CELL}>
          <dt className={META_LABEL}>Badge</dt>
          <dd className={`${META_VALUE} ${MONO}`}>{badgeNumber(profile.name)}</dd>
        </div>
        <div className={META_CELL}>
          <dt className={META_LABEL}>Status</dt>
          <dd className={META_VALUE}>
            <span className={`size-1.5 flex-none rounded-full ${available ? "bg-[#22a565]" : "bg-[#a2a8b4]"}`} aria-hidden="true" />
            {available ? "Available" : "Busy"}
          </dd>
        </div>
      </dl>
      <div className={BARCODE} aria-hidden="true">
        <svg className="h-7 w-[58%] flex-none" viewBox="0 0 120 28" preserveAspectRatio="none" focusable="false">
          <path d={barcodePath(seed)} fill="#171b25" />
        </svg>
        <span className={`${MONO} pb-px text-right text-[9px] leading-[1.35] tracking-[.12em] text-[#9aa0ad] uppercase`}>
          All access
          <br />
          Pass 2026
        </span>
      </div>
    </>
  );
}

function PinIcon() {
  return (
    <svg className="size-3.5 flex-none text-[#9aa0ad]" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 9.8 8 14 8 14Z" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="6.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="size-3.5 flex-none text-[#9aa0ad]" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <rect x="2" y="3.5" width="12" height="9" rx="1.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="m2.8 4.6 5.2 4 5.2-4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function BadgeBack({ profile }: { profile: IdBadgeHeroProfile }) {
  const available = profile.available ?? false;
  const skills = profile.skills.slice(0, BACK_SKILLS);
  const hidden = profile.skills.length - skills.length;
  return (
    <>
      <span className={SLOT} />
      <div className="flex min-h-0 flex-1 flex-col px-5 pt-10 pb-4 @min-[1100px]/ibh:px-6 @min-[1100px]/ibh:pt-11">
        <div className="flex items-center justify-between">
          <p className={BACK_LABEL}>Skills &amp; tools</p>
          <p className={`${BACK_LABEL} text-[#c3c7d0]`} aria-hidden="true">{String(profile.skills.length).padStart(2, "0")}</p>
        </div>
        <p className={`${STATUS} group/status`} data-available={available}>
          <span className={STATUS_DOT} aria-hidden="true" />
          {available ? "Available for work" : "Not taking new work"}
        </p>
        <ul className={SKILL_GRID}>
          {skills.map((skill) => (
            <li className={SKILL} key={skill}>
              <span className="truncate">{skill}</span>
            </li>
          ))}
          {hidden > 0 && <li className={`${SKILL} text-[#737987] before:bg-[#c3c7d0]`}>+{hidden} more</li>}
        </ul>
        {profile.experience && (
          <div className="ibh-back-experience mt-4">
            <p className={BACK_LABEL}>Experience</p>
            <p className="mt-2 text-[12.5px] leading-[1.5] text-[#3c4250]">{profile.experience}</p>
          </div>
        )}
        <div className={CONTACT}>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {profile.location && (
              <p className={CONTACT_LINE}>
                <PinIcon />
                <span className="min-w-0">{profile.location}</span>
              </p>
            )}
            {profile.email && (
              <p className={CONTACT_LINE}>
                <MailIcon />
                <span className="min-w-0 truncate">{profile.email}</span>
              </p>
            )}
            {!profile.location && !profile.email && <p className={CONTACT_LINE}>{profile.role}</p>}
          </div>
          <svg className="size-[52px] flex-none rounded-[6px] bg-white p-1 ring-1 ring-[#e3e6ee]" viewBox="0 0 21 21" aria-hidden="true" focusable="false">
            <path d={codePath(hashString(profile.name))} fill="#171b25" fillRule="evenodd" />
          </svg>
        </div>
      </div>
    </>
  );
}

function resolveActions(profile: IdBadgeHeroProfile, primaryAction?: IdBadgeHeroAction, secondaryAction?: IdBadgeHeroAction) {
  return {
    primary: primaryAction ?? { label: "Hire me", href: profile.email ? `mailto:${profile.email}` : "#contact" },
    secondary: secondaryAction ?? { label: "View work", href: "#collection" },
  };
}

/**
 * Portfolio hero with a conference badge hanging on a lanyard. The badge sways on a damped
 * spring pendulum, can be dragged and released to swing, and flips (click, tap, Enter or Space)
 * to show skills and availability. Arrow keys give it a push.
 */
export default function IdBadgeHero({ profile = DEFAULT_PROFILE, primaryAction, secondaryAction, headingLevel = 2, className = "" }: IdBadgeHeroProps) {
  const [flipped, setFlipped] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const pivotRef = useRef<HTMLSpanElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pendulum = useRef<Pendulum | null>(null);
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const id = useId();
  const { primary, secondary } = resolveActions(profile, primaryAction, secondaryAction);

  // Pendulum simulation: runs on requestAnimationFrame while the hero is visible and motion is allowed.
  useEffect(() => {
    const root = rootRef.current;
    const rig = rigRef.current;
    const card = cardRef.current;
    if (!root || !rig || !card) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motionQuery.matches;
    const state = { angle: 0, velocity: reduced ? 0 : ENTRY_VELOCITY, tilt: 0, tiltVelocity: 0, clock: 0, target: null as number | null };
    let visible = true;
    let frame = 0;
    let last = 0;
    let carry = 0;
    let angleLimit = MAX_ANGLE;
    let tiltLimit = MAX_TILT;

    function measureSwingSpace() {
      if (!root || !rig || !card) return;
      const area = rig.parentElement;
      if (!area || !root.clientWidth) return;
      const bounds = root.getBoundingClientRect();
      const areaBounds = area.getBoundingClientRect();
      const center = areaBounds.left + areaBounds.width / 2;
      const room = Math.max(0, Math.min(center - bounds.left, bounds.right - center) - card.clientWidth / 2 - 12);
      // Reserve room for both the strap rotation and the card's lag below it.
      angleLimit = Math.min(MAX_ANGLE, Math.atan(room / Math.max(1, rig.scrollHeight + card.clientHeight / 2)));
      tiltLimit = Math.min(MAX_TILT, angleLimit / 2);
      state.angle = Math.max(-angleLimit, Math.min(angleLimit, state.angle));
      state.tilt = Math.max(-tiltLimit, Math.min(tiltLimit, state.tilt));
      if (state.target !== null) state.target = Math.max(-angleLimit, Math.min(angleLimit, state.target));
    }
    measureSwingSpace();
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measureSwingSpace);
    resizeObserver?.observe(root);
    window.addEventListener("resize", measureSwingSpace);

    const render = () => {
      rig.style.transform = `rotate(${state.angle.toFixed(5)}rad)`;
      card.style.transform = `rotate(${state.tilt.toFixed(5)}rad)`;
      root.style.setProperty("--ibh-swing", state.angle.toFixed(4));
    };

    function step(dt: number) {
      state.clock += dt;
      const t = state.clock;
      const acceleration =
        state.target === null
          ? -GRAVITY * Math.sin(state.angle) - DAMPING * state.velocity + IDLE_TORQUE * (Math.sin(t * 1.6) + 0.35 * Math.sin(t * 2.7 + 1.3))
          : DRAG_STIFFNESS * (state.target - state.angle) - DRAG_DAMPING * state.velocity;
      state.velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, state.velocity + acceleration * dt));
      state.angle += state.velocity * dt;
      if (Math.abs(state.angle) > angleLimit) {
        state.angle = Math.max(-angleLimit, Math.min(angleLimit, state.angle));
        state.velocity *= -0.2;
      }
      // The card is pushed the opposite way by the strap's acceleration, then springs back under its clip.
      const tiltAcceleration = -TILT_STIFFNESS * state.tilt - TILT_DAMPING * state.tiltVelocity - TILT_COUPLING * acceleration;
      state.tiltVelocity += tiltAcceleration * dt;
      state.tilt = Math.max(-tiltLimit, Math.min(tiltLimit, state.tilt + state.tiltVelocity * dt));
    }

    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      carry += last ? Math.min((now - last) / 1000, MAX_FRAME) : 0;
      last = now;
      while (carry >= FIXED_STEP) {
        step(FIXED_STEP);
        carry -= FIXED_STEP;
      }
      render();
    }

    function synchronize() {
      const running = visible && !document.hidden && !reduced;
      if (running && !frame) {
        last = 0;
        frame = requestAnimationFrame(tick);
      } else if (!running && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }

    function settle() {
      state.angle = state.velocity = state.tilt = state.tiltVelocity = 0;
      render();
    }

    function handleMotionChange() {
      reduced = motionQuery.matches;
      if (reduced) settle();
      synchronize();
    }

    pendulum.current = {
      angle: () => state.angle,
      drag(target) {
        state.target = Math.max(-angleLimit, Math.min(angleLimit, target));
        // Reduced motion: follow the pointer directly, no inertia.
        if (reduced) {
          state.angle = state.target;
          render();
        }
      },
      release() {
        state.target = null;
        if (reduced) settle();
      },
      nudge(velocity) {
        if (!reduced) state.velocity += velocity;
      },
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      synchronize();
    });
    observer.observe(root);
    document.addEventListener("visibilitychange", synchronize);
    motionQuery.addEventListener("change", handleMotionChange);
    synchronize();

    return () => {
      cancelAnimationFrame(frame);
      frame = 0;
      observer.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureSwingSpace);
      document.removeEventListener("visibilitychange", synchronize);
      motionQuery.removeEventListener("change", handleMotionChange);
      pendulum.current = null;
    };
  }, []);

  /** Angle of the pointer around the strap's pivot, in the rig's rotation convention. */
  function pointerAngle(x: number, y: number) {
    const pivot = pivotRef.current?.getBoundingClientRect();
    if (!pivot) return 0;
    return Math.atan2(pivot.left - x, Math.max(y - pivot.top, 1));
  }

  function setDragging(active: boolean) {
    if (!rootRef.current) return;
    if (active) rootRef.current.dataset.dragging = "true";
    else delete rootRef.current.dataset.dragging;
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    suppressClick.current = false;
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, offset: 0, active: false };
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!current.active) {
      if (Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < DRAG_THRESHOLD) return;
      // Keep the grab point under the pointer instead of snapping the badge to it.
      current.active = true;
      current.offset = (pendulum.current?.angle() ?? 0) - pointerAngle(current.startX, current.startY);
      setDragging(true);
    }
    pendulum.current?.drag(pointerAngle(event.clientX, event.clientY) + current.offset);
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>, cancelled: boolean) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    if (!current.active) return;
    // A real drag swings the badge; the click that follows pointerup must not flip it.
    suppressClick.current = !cancelled;
    setDragging(false);
    pendulum.current?.release();
  }

  function handleClick() {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    pendulum.current?.nudge(flipped ? -FLIP_KICK : FLIP_KICK);
    setFlipped((value) => !value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    // Positive angles rotate clockwise, which swings the card to the left.
    pendulum.current?.nudge(event.key === "ArrowLeft" ? KEY_NUDGE : -KEY_NUDGE);
  }

  return (
    <section ref={rootRef} className={`${STAGE} min-h-[560px] ${className}`} aria-labelledby={`${id}-name`}>
      <ComponentStyles css={ID_BADGE_HERO_CSS} />
      <div className={GRID}>
        <Intro profile={profile} primary={primary} secondary={secondary} headingId={`${id}-name`} headingLevel={headingLevel} interactive />

        <div className={RIG_AREA}>
          <div className={GLOW} aria-hidden="true" />
          <span className={PIVOT} ref={pivotRef} aria-hidden="true" />
          <div className={RIG} ref={rigRef}>
            <Lanyard fade />
            <div className={CARD} ref={cardRef}>
              <div className={FLIPPER} data-flipped={flipped}>
                <div className={FACE} aria-hidden={flipped}>
                  <BadgeFront profile={profile} />
                </div>
                <div className={`${FACE} [transform:rotateY(180deg)]`} aria-hidden={!flipped}>
                  <BadgeBack profile={profile} />
                </div>
              </div>
              <button
                className={HANDLE}
                type="button"
                aria-label="Flip badge"
                aria-pressed={flipped}
                aria-describedby={`${id}-hint`}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={(event) => endDrag(event, false)}
                onPointerCancel={(event) => endDrag(event, true)}
                onLostPointerCapture={(event) => endDrag(event, true)}
              />
            </div>
          </div>
          <p className={HINT} id={`${id}-hint`}>
            <span aria-hidden="true">Drag to swing · Tap to flip</span>
            <span className="sr-only">Flips between the profile and skills sides. Arrow keys swing the badge.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Thumbnail frames: rig angle and card tilt (degrees) and which side faces out. */
const THUMBNAIL_FRAMES = [
  { angle: 9, tilt: -2.5, flipped: false },
  { angle: -8, tilt: 2.5, flipped: false },
  { angle: 1.5, tilt: -0.5, flipped: true },
  { angle: -2, tilt: 0.5, flipped: false },
];

/** Inert gallery artwork: the badge swings left, then right, flips to its skills side and back. */
export function IdBadgeHeroThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) % THUMBNAIL_FRAMES.length : 0;
  const frame = THUMBNAIL_FRAMES[step];
  const { primary, secondary } = resolveActions(DEFAULT_PROFILE);

  return (
    <div className={`${STAGE} ibh-thumbnail h-full min-h-0 ${className}`} aria-hidden="true" inert>
      <ComponentStyles css={ID_BADGE_HERO_CSS} />
      {/* A fixed desktop scene, scaled from the top edge so the strap always meets it. */}
      <div
        className={
          "ibh-thumb-scene @container/ibh absolute top-0 left-1/2 grid h-[660px] w-[920px] -translate-x-1/2 origin-top scale-[.52] grid-cols-[1.1fr_.9fr] px-12 " +
          "@min-[540px]/ibh:scale-[.58] @min-[600px]/ibh:scale-[.64] @max-[479px]/ibh:w-[520px] @max-[479px]/ibh:scale-[.54] @max-[479px]/ibh:grid-cols-1"
        }
        style={{ "--card-w": "268px", "--card-h": "380px", "--strap": "104px", "--clip-h": "72px", "--ibh-swing": String((frame.angle * Math.PI) / 180) } as CSSProperties}
      >
        <div className="self-center @max-[479px]/ibh:hidden">
          <Intro profile={DEFAULT_PROFILE} primary={primary} secondary={secondary} interactive={false} />
        </div>
        <div className="relative">
          <div className={GLOW} />
          <div
            className={`${RIG} transition-transform duration-1400 ease-[cubic-bezier(.3,1.45,.55,1)]`}
            style={{ transform: `rotate(${frame.angle}deg)` }}
          >
            <Lanyard />
            <div
              className={`${CARD} transition-transform duration-1400 ease-[cubic-bezier(.3,1.45,.55,1)]`}
              style={{ transform: `rotate(${frame.tilt}deg)` }}
            >
              <div className={FLIPPER} data-flipped={frame.flipped}>
                <div className={FACE}>
                  <BadgeFront profile={DEFAULT_PROFILE} />
                </div>
                <div className={`${FACE} [transform:rotateY(180deg)]`}>
                  <BadgeBack profile={DEFAULT_PROFILE} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * Only what Tailwind can't express cleanly stays here:
 * - the badge cursor and focus ring: the site's unlayered `button:not(:disabled)` cursor and
 *   `:focus-visible` outline rules would beat layered utilities;
 * - the prefixed backface rule Safari still needs;
 * - the keyframes for the availability dot.
 */
const ID_BADGE_HERO_CSS = `
.ibh-stage .ibh-handle { cursor: grab; }
.ibh-stage[data-dragging] .ibh-handle, .ibh-stage[data-dragging] { cursor: grabbing; }
.ibh-stage .ibh-handle:focus { outline: none; }
.ibh-stage .ibh-handle:focus-visible { outline: 2px solid #4866e9; outline-offset: 5px; }
.ibh-stage .ibh-action:focus-visible { outline: 2px solid #4866e9; outline-offset: 3px; }
.ibh-stage .ibh-face { -webkit-backface-visibility: hidden; }

@keyframes ibh-ping { 0% { transform: scale(1); opacity: .55; } 80%, 100% { transform: scale(2.6); opacity: 0; } }
`;
