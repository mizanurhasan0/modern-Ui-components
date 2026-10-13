"use client";

import { ComponentStyles } from "./component-styles";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";

/** The developer typed into the editor and rendered on the card. */
export interface CodeProfile {
  /** Display name, e.g. "Hasan". */
  name: string;
  /** Job title shown under the name. */
  role: string;
  /** Short experience label, e.g. "3+ years". Omit to drop the badge and its code line. */
  experience?: string;
  /** Technologies shown as chips, in order. */
  stack: string[];
  /** One-line focus statement. Omit to drop it. */
  focus?: string;
  /** `true` shows "Available for work", `false` a muted "Not available" status; omit to drop it. */
  available?: boolean;
  /** Optional portrait URL; initials are shown otherwise. */
  photoSrc?: string;
  /** Alt text for the portrait. Defaults to "Portrait of {name}". */
  photoAlt?: string;
  /** Avatar letters (up to 3). Defaults to the initials of the name. */
  initials?: string;
}

/** A call-to-action rendered as a link when `href` is set, otherwise as a button. */
export interface CodeProfileAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface CodeProfileHeroProps {
  /** Profile data; the editor code is generated from it. */
  profile?: CodeProfile;
  /** Average typing speed in characters per second (default 38). */
  typingSpeed?: number;
  /** Replay automatically a few seconds after compiling (default false). */
  loop?: boolean;
  /** Main call to action under the card. Pass `null` to hide it. */
  primaryAction?: CodeProfileAction | null;
  /** Secondary call to action under the card. Pass `null` to hide it. */
  secondaryAction?: CodeProfileAction | null;
  /** Small label above the actions. Pass an empty string to hide it. */
  eyebrow?: string;
  /** Called each time the profile finishes compiling (also after Skip). */
  onCompiled?: () => void;
  className?: string;
}

type Phase = "typing" | "compiling" | "done";
type Part = "identity" | "role" | "experience" | "stack" | "focus" | "status";
type TokenKind = "keyword" | "variable" | "key" | "string" | "literal" | "function" | "component" | "brace" | "bracket" | "punctuation" | "plain";
interface Token { text: string; kind: TokenKind }
interface CodeLine {
  tokens: Token[];
  text: string;
  /** The card part revealed once this line is fully typed. */
  part?: Part;
  /** Line offsets where each string in the stack array ends (one chip each). */
  chipEnds?: number[];
}
interface Progress { typed: number; phase: Phase }
interface Timeline {
  /** Time (ms from start) at which each source character appears. */
  times: number[];
  compileAt: number;
  doneAt: number;
}

const DEFAULT_PROFILE: CodeProfile = {
  name: "Hasan",
  role: "Frontend Developer",
  experience: "3+ years",
  stack: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
  focus: "Fast, accessible interfaces",
  available: true,
  initials: "HS",
};
const DEFAULT_PRIMARY: CodeProfileAction = { label: "Hire me", href: "#contact" };
const DEFAULT_SECONDARY: CodeProfileAction = { label: "View work", href: "#collection" };

const DEFAULT_SPEED = 38;
/** Caret blinks on the empty editor before typing starts. */
const START_DELAY = 700;
/** Pause between the last keystroke and "Compiling…". */
const COMPILE_DELAY = 380;
const COMPILE_MS = 780;
/** How long the finished card holds before a looped replay. */
const LOOP_HOLD = 5200;
const COMPILE_TIME = "0.42s";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/* ---------------------------------------------------------------- code + timing */

const tok = (text: string, kind: TokenKind = "plain"): Token => ({ text, kind });

/** Turn the profile into syntax-highlighted lines of a `const developer = {…}` object. */
function buildLines(profile: CodeProfile): CodeLine[] {
  const property = (key: string, value: Token[]) => [tok("  "), tok(key, "key"), tok(": ", "punctuation"), ...value, tok(",", "punctuation")];
  const text = (value: string) => tok(JSON.stringify(value), "string");
  const stack: Token[] = [tok("[", "bracket")];
  profile.stack.forEach((item, index) => {
    if (index) stack.push(tok(", ", "punctuation"));
    stack.push(text(item));
  });
  stack.push(tok("]", "bracket"));

  const rows: Omit<CodeLine, "text">[] = [
    { tokens: [tok("const", "keyword"), tok(" "), tok("developer", "variable"), tok(" = ", "punctuation"), tok("{", "brace")] },
    { tokens: property("name", [text(profile.name)]), part: "identity" },
    { tokens: property("role", [text(profile.role)]), part: "role" },
  ];
  if (profile.experience) rows.push({ tokens: property("experience", [text(profile.experience)]), part: "experience" });
  rows.push({ tokens: property("stack", stack), part: "stack" });
  if (profile.focus) rows.push({ tokens: property("focus", [text(profile.focus)]), part: "focus" });
  if (profile.available !== undefined) rows.push({ tokens: property("available", [tok(String(profile.available), "literal")]), part: "status" });
  rows.push(
    { tokens: [tok("}", "brace"), tok(";", "punctuation")] },
    { tokens: [] },
    {
      tokens: [
        tok("render", "function"), tok("(", "punctuation"), tok("<", "punctuation"), tok("Profile", "component"), tok(" "),
        tok("{", "bracket"), tok("...", "keyword"), tok("developer", "variable"), tok("}", "bracket"), tok(" "),
        tok("/>", "punctuation"), tok(")", "punctuation"), tok(";", "punctuation"),
      ],
    },
  );

  return rows.map((row) => {
    const line: CodeLine = { ...row, text: row.tokens.map((token) => token.text).join("") };
    if (row.part === "stack") {
      let offset = 0;
      line.chipEnds = [];
      row.tokens.forEach((token, index) => {
        offset += token.text.length;
        // Skip the key: only array items count as chips.
        if (token.kind === "string" && index > 2) line.chipEnds?.push(offset);
      });
    }
    return line;
  });
}

/** Deterministic 0–1 noise so the typing rhythm is natural but identical on every run. */
function noise(seed: number) {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/** Keystroke schedule: jittered per character, quick spaces, instant auto-indent, pauses at line ends. */
function buildTimeline(source: string, speed: number): Timeline {
  const base = 1000 / speed;
  const times: number[] = [];
  let t = START_DELAY;
  let indenting = true;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === "\n") {
      const blank = source[index - 1] === "\n" || source[index + 1] === "\n";
      t += base * (blank ? 9 : 5.5);
      indenting = true;
    } else if (indenting && char === " ") {
      // The editor auto-indents, so leading spaces land with the newline.
    } else {
      indenting = false;
      const n = noise(index + 1);
      let delay = base * (0.55 + n * 0.9);
      if (char === " ") delay *= 0.45;
      else if (",;:".includes(char)) delay *= 1.3;
      if (n > 0.97) delay += base * 3; // an occasional hesitation
      t += delay;
    }
    times.push(t);
  }
  return { times, compileAt: t + COMPILE_DELAY, doneAt: t + COMPILE_DELAY + COMPILE_MS };
}

function progressAt({ times, compileAt, doneAt }: Timeline, ms: number): Progress {
  let low = 0;
  let high = times.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (times[mid] <= ms) low = mid + 1;
    else high = mid;
  }
  return { typed: low, phase: ms >= doneAt ? "done" : ms >= compileAt ? "compiling" : "typing" };
}

/** Which card parts and chips are ready, and where the caret sits, after `typed` characters. */
function reveal(lines: CodeLine[], typed: number) {
  const parts: Partial<Record<Part, boolean>> = {};
  let chips = 0;
  let caretLine = 0;
  let start = 0;
  const starts = lines.map((line, index) => {
    const lineStart = start;
    if (typed >= lineStart) caretLine = index;
    const shown = typed - lineStart;
    if (line.part) parts[line.part] = shown >= line.text.length;
    if (line.chipEnds) chips = line.chipEnds.filter((end) => shown >= end).length;
    start += line.text.length + 1;
    return lineStart;
  });
  return { parts, chips, caretLine, caretColumn: Math.max(0, typed - starts[caretLine]), starts };
}

function initialsOf(profile: CodeProfile) {
  if (profile.initials) return profile.initials.slice(0, 3).toUpperCase();
  const words = profile.name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "?";
}

/** One-sentence profile for screen readers while the card is still assembling. */
function summaryOf(profile: CodeProfile) {
  return [
    `${profile.name}, ${profile.role}.`,
    profile.experience && `${profile.experience} of experience.`,
    profile.stack.length > 0 && `Stack: ${profile.stack.join(", ")}.`,
    profile.focus && `Focus: ${profile.focus}.`,
    profile.available !== undefined && (profile.available ? "Available for work." : "Not available for new work."),
  ].filter(Boolean).join(" ");
}

/* ---------------------------------------------------------------- playback */

/**
 * Drives the typing clock with requestAnimationFrame. The clock only advances while the hero is
 * on screen and the tab is visible; reduced motion starts on the finished state.
 */
function usePlayback(rootRef: RefObject<HTMLElement | null>, timeline: Timeline, loop: boolean, onCompiled?: () => void) {
  const [progress, setProgress] = useState<Progress>({ typed: 0, phase: "typing" });
  const [run, setRun] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const elapsed = useRef(0);
  const compiled = useRef(false);
  const quiet = useRef(false);
  const kick = useRef<() => void>(() => {});
  const callback = useRef(onCompiled);

  useEffect(() => {
    callback.current = onCompiled;
  }, [onCompiled]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Reduced motion: no autoplay typing. A user-initiated Replay still plays it.
    if (run === 0 && window.matchMedia(REDUCED_MOTION).matches && elapsed.current < timeline.doneAt) {
      elapsed.current = timeline.doneAt;
      quiet.current = true;
    }

    let frame = 0;
    let last = 0;
    let visible = typeof IntersectionObserver === "undefined";
    const active = () => visible && !document.hidden;
    const wantsFrames = () => loop || elapsed.current < timeline.doneAt;

    const publish = () => {
      const next = progressAt(timeline, elapsed.current);
      setProgress((current) => (current.typed === next.typed && current.phase === next.phase ? current : next));
      if (next.phase === "done" && !compiled.current) {
        compiled.current = true;
        if (!quiet.current) setAnnouncement("Profile compiled");
        quiet.current = false;
        callback.current?.();
      }
    };

    const tick = (now: number) => {
      frame = 0;
      if (active()) {
        if (last) elapsed.current += Math.min(64, now - last);
        last = now;
        if (loop && elapsed.current >= timeline.doneAt + LOOP_HOLD) {
          elapsed.current = 0;
          compiled.current = false;
          setAnnouncement("");
        } else if (!loop) {
          elapsed.current = Math.min(elapsed.current, timeline.doneAt);
        }
      } else {
        last = 0;
      }
      publish();
      if (active() && wantsFrames()) frame = requestAnimationFrame(tick);
    };

    const sync = () => {
      if (!active()) {
        cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
      } else if (!frame && wantsFrames()) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };

    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          sync();
        });
    observer?.observe(root);
    document.addEventListener("visibilitychange", sync);
    kick.current = () => {
      publish();
      sync();
    };
    // Always publish once, so a finished (reduced motion) state renders even before the observer reports.
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      kick.current = () => {};
    };
  }, [rootRef, timeline, loop, run]);

  const replay = useCallback(() => {
    elapsed.current = 0;
    compiled.current = false;
    quiet.current = false;
    setAnnouncement("");
    setRun((value) => value + 1);
  }, []);

  const skip = useCallback(() => {
    elapsed.current = Math.max(elapsed.current, timeline.doneAt);
    kick.current();
  }, [timeline]);

  return { progress, announcement, replay, skip };
}

/* ---------------------------------------------------------------- styles */

/** Light stage; also the container for every `@min-[…]` query. */
const STAGE =
  "cph-stage @container relative isolate box-border flex w-full min-w-0 flex-col justify-center overflow-hidden bg-[#fafbfc] " +
  "font-sans text-[#0f1420] antialiased";
const BACKDROP_DOTS =
  "pointer-events-none absolute inset-0 -z-1 bg-[radial-gradient(#dfe3ea_1px,transparent_1px)] bg-size-[22px_22px] " +
  "[mask-image:radial-gradient(ellipse_70%_65%_at_50%_45%,#000_30%,transparent_100%)]";
const LAYOUT =
  "cph-layout relative mx-auto grid w-full max-w-[1180px] gap-5 px-4 py-8 @min-[520px]:gap-6 @min-[520px]:px-6 @min-[520px]:py-10 " +
  "@min-[760px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] @min-[760px]:items-center @min-[760px]:gap-7 @min-[760px]:px-8 @min-[760px]:py-12 " +
  "@min-[1180px]:grid-cols-[minmax(0,1.22fr)_minmax(0,1fr)] @min-[1180px]:gap-14 @min-[1180px]:px-12";

const EDITOR =
  "cph-editor relative min-w-0 overflow-hidden rounded-2xl bg-[#0f1420] text-[#d4d4d4] ring-1 ring-[#0f1420]/10 " +
  "shadow-[0_40px_80px_-32px_rgba(15,20,32,.55),0_16px_32px_-20px_rgba(15,20,32,.4)]";
const TITLE_BAR = "flex h-10 items-center gap-4 border-b border-white/[.06] bg-[#0b0f19] pl-4 @min-[1180px]:h-11";
const TAB =
  "relative flex h-full items-center gap-2 border-x border-white/[.06] bg-[#0f1420] px-3.5 font-mono text-[12px] text-[#e6e9f0] " +
  "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-[#5474ee] before:content-['']";
const CODE =
  "cph-code py-3.5 font-mono text-[11.5px] leading-[1.75] @min-[520px]:text-[12.5px] @min-[520px]:py-4 @min-[1180px]:py-5 @min-[1180px]:text-[14px]";
const LINE = "flex pr-4 data-[current=true]:bg-white/[.035]";
/** Line numbers; property lines that compiled into the card get a green "changed" bar. */
const GUTTER =
  "relative w-[3.4em] shrink-0 select-none pr-[1.3em] text-right text-[#4b5468] tabular-nums " +
  "group-data-[current=true]/line:text-[#c6cbd7] group-data-[reached=false]/line:invisible " +
  "before:absolute before:top-[.3em] before:bottom-[.3em] before:left-[.55em] before:w-[2px] before:rounded-full before:bg-[#3fb950] " +
  "before:opacity-0 before:transition-opacity before:duration-300 before:content-[''] data-[mark=true]:before:opacity-100";
/** Long lines wrap with a hanging indent, like an editor's word wrap. */
const CODE_TEXT = "min-h-[1.75em] min-w-0 flex-1 pl-[4ch] -indent-[4ch] whitespace-pre-wrap break-words";
const CARET_BASE = "cph-caret -mr-[2px] inline-block h-[1.2em] w-[2px] translate-y-[.2em] rounded-[1px] bg-[#aeb7ff]";
const CARET_SOLID = CARET_BASE;
const CARET_BLINK = `${CARET_BASE} animate-[cph-blink_1.1s_steps(1,end)_infinite]`;
const TOKEN_CLASS: Record<TokenKind, string> = {
  keyword: "text-[#c586c0]",
  variable: "text-[#4fc1ff]",
  key: "text-[#9cdcfe]",
  string: "text-[#ce9178]",
  literal: "text-[#569cd6]",
  function: "text-[#dcdcaa]",
  component: "text-[#4ec9b0]",
  brace: "text-[#ffd700]",
  bracket: "text-[#da70d6]",
  punctuation: "text-[#7f8aa3]",
  plain: "text-[#d4d4d4]",
};
const STATUS_BAR =
  "flex min-h-10 items-center justify-between gap-3 border-t border-white/[.06] bg-[#0b0f19] py-1.5 pr-1.5 pl-4 font-mono text-[11px] text-[#8b93a7] " +
  "@min-[1180px]:min-h-11 @min-[1180px]:text-[12px]";
const CONTROL =
  "cph-control inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 font-sans text-[12px] font-medium text-[#c9d1e0] " +
  "transition-colors duration-150 hover:bg-white/10 hover:text-white motion-reduce:transition-none @min-[1180px]:h-8 @min-[1180px]:text-[13px]";
const CONTROL_STATIC = "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 font-sans text-[12px] font-medium text-[#c9d1e0]";

/** Gradient frame that lights up once the profile compiles. */
const CARD_FRAME =
  "cph-card group/card relative min-w-0 rounded-[24px] bg-[#e5e8ee] p-px transition-shadow duration-700 " +
  "shadow-[0_24px_48px_-28px_rgba(16,24,40,.28)] data-[compiled=true]:shadow-[0_34px_70px_-30px_rgba(84,116,238,.5)] " +
  "motion-safe:data-[compiled=true]:animate-[cph-settle_.8s_cubic-bezier(.2,.8,.2,1)]";
const CARD_GLOW =
  "pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(135deg,#5474ee,#22c3ee_55%,#34d399)] opacity-0 " +
  "transition-opacity duration-700 group-data-[compiled=true]/card:opacity-100 motion-reduce:transition-none";
const CARD =
  "relative overflow-hidden rounded-[23px] bg-white p-5 @min-[520px]:p-6 @min-[1180px]:p-7";
const CARD_LABEL = "mb-2.5 text-[11px] font-semibold tracking-[.12em] text-[#8a93a6] uppercase @min-[1180px]:text-[11.5px]";

/** A slot stacks a skeleton placeholder and its real content in one grid cell, so nothing shifts on reveal. */
const SLOT = "group/slot grid";
const SKELETON =
  "cph-skeleton [grid-area:1/1] rounded-full bg-[#edf0f4] bg-[linear-gradient(90deg,#edf0f4_0%,#f7f8fa_45%,#edf0f4_90%)] bg-size-[200%_100%] " +
  "transition-opacity duration-300 motion-safe:animate-[cph-shimmer_1.6s_linear_infinite] group-data-[ready=true]/slot:opacity-0 motion-reduce:transition-none";
const REVEAL =
  "[grid-area:1/1] min-w-0 opacity-0 blur-[3px] transition-[opacity,translate,filter] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-safe:translate-y-1.5 " +
  "group-data-[ready=true]/slot:translate-y-0 group-data-[ready=true]/slot:opacity-100 group-data-[ready=true]/slot:blur-none " +
  "motion-reduce:blur-none motion-reduce:transition-none";
const POP =
  "[grid-area:1/1] opacity-0 transition-[opacity,scale] duration-[450ms] ease-[cubic-bezier(.34,1.56,.64,1)] motion-safe:scale-75 " +
  "group-data-[ready=true]/slot:scale-100 group-data-[ready=true]/slot:opacity-100 motion-reduce:transition-none";
const CHIP =
  "flex items-center gap-2 rounded-full bg-[#f4f6f9] px-3 py-1.5 text-[13px] leading-none font-medium whitespace-nowrap text-[#1f2633] ring-1 ring-[#e3e7ee] " +
  "transition-[background-color,box-shadow,translate] duration-300 data-[highlight=true]:-translate-y-0.5 data-[highlight=true]:bg-[#eef2ff] " +
  "data-[highlight=true]:ring-2 data-[highlight=true]:ring-[#5474ee] data-[highlight=true]:shadow-[0_8px_18px_-8px_rgba(84,116,238,.6)] @min-[1180px]:text-[14px]";
/** Static literals so Tailwind can see every chip dot colour. */
const CHIP_DOTS = ["bg-[#22b8e6]", "bg-[#111827]", "bg-[#3178c6]", "bg-[#14b8a6]", "bg-[#f59e0b]", "bg-[#8b5cf6]", "bg-[#ef4444]"];

const ACTION_BASE =
  "cph-action group/action inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold " +
  "transition-[background-color,box-shadow,color] duration-200 motion-reduce:transition-none @min-[1180px]:h-12 @min-[1180px]:px-6 @min-[1180px]:text-[15px]";
const ACTION_PRIMARY = `${ACTION_BASE} bg-[#0f1420] text-white shadow-[0_10px_24px_-12px_rgba(15,20,32,.7)] hover:bg-[#222a3d]`;
const ACTION_SECONDARY = `${ACTION_BASE} bg-white text-[#0f1420] ring-1 ring-[#dde1e8] hover:bg-[#f3f5f8] hover:ring-[#cfd5df]`;

/* ---------------------------------------------------------------- pieces */

function Slot({ ready, skeleton, className = "", children }: { ready: boolean; skeleton: string; className?: string; children: ReactNode }) {
  return (
    <div className={`${SLOT} ${className}`} data-ready={ready}>
      <span className={`${SKELETON} ${skeleton}`} aria-hidden="true" />
      <div className={REVEAL}>{children}</div>
    </div>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg className="size-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M2.75 8a5.25 5.25 0 1 0 1.6-3.77" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3.9 1.9v2.6h2.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg className="size-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3 3.5v9l6-4.5-6-4.5Z" fill="currentColor" />
      <path d="M12 3.5v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="size-4 transition-transform duration-200 group-hover/action:translate-x-0.5 motion-reduce:transition-none"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 8h9.5M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The highlighted source, typed up to `typed` characters. Untyped text stays in place (invisible) so height never jumps. */
function CodeView({ lines, typed, phase }: { lines: CodeLine[]; typed: number; phase: Phase }) {
  const { caretLine, starts } = reveal(lines, typed);
  const total = starts[starts.length - 1] + lines[lines.length - 1].text.length;
  const typing = phase === "typing" && typed > 0 && typed < total;

  return (
    <div className={CODE} aria-hidden="true">
      {lines.map((line, index) => {
        const shown = Math.min(line.text.length, Math.max(0, typed - starts[index]));
        const reached = typed >= starts[index];
        const current = index === caretLine;
        const caret = <span className={typing ? CARET_SOLID : CARET_BLINK} />;
        let offset = 0;
        return (
          <div key={index} className={`group/line ${LINE}`} data-current={current} data-reached={reached}>
            <span className={GUTTER} data-mark={Boolean(line.part) && shown === line.text.length}>{index + 1}</span>
            <span className={CODE_TEXT}>
              {line.tokens.map((token, tokenIndex) => {
                const start = offset;
                offset += token.text.length;
                const count = Math.min(token.text.length, Math.max(0, shown - start));
                // Short strings never break across wrapped lines, typed or not, so wrapping is stable.
                const nowrap = token.kind === "string" && token.text.length <= 28;
                return (
                  <span key={tokenIndex} className={`${TOKEN_CLASS[token.kind]} ${nowrap ? "whitespace-nowrap" : ""}`}>
                    {token.text.slice(0, count)}
                    {current && shown >= start && shown < offset && caret}
                    {count < token.text.length && <span className="invisible">{token.text.slice(count)}</span>}
                  </span>
                );
              })}
              {current && shown === line.text.length && caret}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Editor chrome: traffic lights and the active `profile.tsx` tab (dirty dot until compiled). */
function TitleBar({ phase }: { phase: Phase }) {
  return (
    <div className={TITLE_BAR} aria-hidden="true">
      <span className="flex gap-2">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
      </span>
      <span className={TAB}>
        <svg className="size-3.5 text-[#61dafb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <ellipse cx="12" cy="12" rx="10" ry="4" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
        </svg>
        profile.tsx
        <span className={phase === "done" ? "size-2 rounded-full bg-transparent" : "size-2 rounded-full bg-[#c9d1e0]"} />
      </span>
      <span className="ml-auto hidden pr-4 font-mono text-[11px] text-[#5d6679] @min-[520px]:block">~/portfolio</span>
    </div>
  );
}

/** Left side of the status bar: cursor position while typing, then the compile result. */
function BuildStatus({ phase, line, column }: { phase: Phase; line: number; column: number }) {
  if (phase === "done") {
    return (
      <span className="flex min-w-0 items-center gap-1.5 text-[#7ee2a8]">
        <CheckIcon className="size-3.5 shrink-0" />
        <span className="truncate">Compiled <span className="text-[#8b93a7]">in {COMPILE_TIME}</span></span>
      </span>
    );
  }
  if (phase === "compiling") {
    return (
      <span className="flex min-w-0 items-center gap-2 text-[#c9d1e0]">
        <span className="size-3 shrink-0 animate-spin rounded-full border-[1.5px] border-[#5d6679] border-t-[#aeb7ff]" />
        <span className="truncate">Compiling…</span>
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="size-1.5 shrink-0 rounded-full bg-[#febc2e]" />
      <span className="truncate">Ln {line + 1}, Col {column + 1}</span>
      <span className="hidden text-[#5d6679] @min-[520px]:inline">TypeScript JSX</span>
    </span>
  );
}

function Avatar({ profile }: { profile: CodeProfile }) {
  if (profile.photoSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a plain image keeps the component free of image configuration.
      <img
        className="size-full rounded-full object-cover ring-2 ring-white"
        src={profile.photoSrc}
        alt={profile.photoAlt ?? `Portrait of ${profile.name}`}
        draggable={false}
      />
    );
  }
  return (
    <span
      className="grid size-full place-items-center rounded-full bg-[linear-gradient(135deg,#5474ee,#22c3ee)] text-[18px] font-semibold tracking-wide text-white shadow-[inset_0_-6px_12px_rgba(15,20,32,.18)] @min-[1180px]:text-[21px]"
      aria-hidden="true"
    >
      {initialsOf(profile)}
    </span>
  );
}

interface ProfileCardProps {
  profile: CodeProfile;
  parts: Partial<Record<Part, boolean>>;
  chips: number;
  compiled: boolean;
  headingId?: string;
  highlightChip?: number;
  hidden?: boolean;
}

/** The rendered `<Profile />`: every field starts as a skeleton and fills in as its code line completes. */
function ProfileCard({ profile, parts, chips, compiled, headingId, highlightChip = -1, hidden = false }: ProfileCardProps) {
  return (
    <div className={CARD_FRAME} data-compiled={compiled}>
      <span className={CARD_GLOW} aria-hidden="true" />
      <article className={CARD} aria-labelledby={headingId} aria-hidden={hidden || undefined}>
        <div className="flex items-start gap-4">
          <Slot ready={Boolean(parts.identity)} skeleton="rounded-full" className="size-14 shrink-0 @min-[1180px]:size-16">
            <Avatar profile={profile} />
          </Slot>
          <div className="min-w-0 flex-1 pt-0.5">
            <Slot ready={Boolean(parts.identity)} skeleton="my-[.3em] w-[62%] justify-self-start" className="text-[21px] leading-tight font-semibold tracking-[-.01em] @min-[1180px]:text-[25px]">
              <h2 id={headingId} className="wrap-anywhere">{profile.name}</h2>
            </Slot>
            <Slot ready={Boolean(parts.role)} skeleton="my-[.35em] w-[82%] justify-self-start" className="mt-1 text-[14.5px] leading-snug text-[#5b6476] @min-[1180px]:text-[16px]">
              <p className="wrap-anywhere">{profile.role}</p>
            </Slot>
            {profile.experience && (
              <Slot ready={Boolean(parts.experience)} skeleton="" className="mt-2.5 w-fit max-w-full">
                <p className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#f4f6f9] px-2.5 py-1 text-[12.5px] font-medium text-[#3b4352] ring-1 ring-[#e3e7ee] @min-[1180px]:text-[13.5px]">
                  <svg className="size-3.5 shrink-0 text-[#5474ee]" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 4.8V8l2.2 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="truncate"><span className="font-semibold text-[#0f1420]">{profile.experience}</span> experience</span>
                </p>
              </Slot>
            )}
          </div>
        </div>

        <div className="my-5 h-px bg-[#eef0f4] @min-[1180px]:my-6" />

        {profile.stack.length > 0 && (
          <div>
            <p className={CARD_LABEL}>Stack</p>
            <ul className="flex flex-wrap gap-2" aria-label="Tech stack">
              {profile.stack.map((item, index) => (
                <li key={`${item}-${index}`} className={`${SLOT} relative`} data-ready={index < chips}>
                  <span className={SKELETON} aria-hidden="true" />
                  <span className={POP}>
                    <span className={CHIP} data-highlight={index === highlightChip}>
                      <span className={`size-2 rounded-full ${CHIP_DOTS[index % CHIP_DOTS.length]}`} aria-hidden="true" />
                      {item}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {profile.focus && (
          <div className="mt-5 @min-[1180px]:mt-6">
            <p className={CARD_LABEL}>Focus</p>
            <Slot ready={Boolean(parts.focus)} skeleton="my-[.3em] w-[88%] justify-self-start" className="text-[15px] leading-snug text-[#2a3140] @min-[1180px]:text-[16.5px]">
              <p className="wrap-anywhere">{profile.focus}</p>
            </Slot>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f4] pt-4 @min-[1180px]:mt-6 @min-[1180px]:pt-5">
          {profile.available !== undefined ? (
            <Slot ready={Boolean(parts.status)} skeleton="">
              {profile.available ? (
                <p className="inline-flex items-center gap-2 rounded-full bg-[#ecfdf3] px-3 py-1.5 text-[13px] font-semibold text-[#067647] ring-1 ring-[#abefc6]">
                  <span className="relative flex size-2" aria-hidden="true">
                    <span className="absolute inset-0 rounded-full bg-[#17b26a] opacity-60 motion-safe:animate-ping" />
                    <span className="relative size-2 rounded-full bg-[#17b26a]" />
                  </span>
                  Available for work
                </p>
              ) : (
                <p className="inline-flex items-center gap-2 rounded-full bg-[#f4f6f9] px-3 py-1.5 text-[13px] font-semibold text-[#5b6476] ring-1 ring-[#e3e7ee]">
                  <span className="size-2 rounded-full bg-[#98a2b3]" aria-hidden="true" />
                  Not available right now
                </p>
              )}
            </Slot>
          ) : <span />}
          <span className="hidden font-mono text-[11.5px] text-[#9aa3b5] @min-[420px]:inline" aria-hidden="true">
            {compiled ? "<Profile /> rendered" : "rendering…"}
          </span>
        </div>
      </article>
    </div>
  );
}

function Action({ action, primary }: { action: CodeProfileAction; primary: boolean }) {
  const className = primary ? ACTION_PRIMARY : ACTION_SECONDARY;
  const content = (
    <>
      {action.label}
      {primary && <ArrowIcon />}
    </>
  );
  return action.href ? (
    <a className={className} href={action.href} onClick={action.onClick}>{content}</a>
  ) : (
    <button className={className} type="button" onClick={action.onClick}>{content}</button>
  );
}

/* ---------------------------------------------------------------- component */

/**
 * Portfolio hero: an editor types a `developer` object built from `profile`, and a profile card
 * assembles beside it line by line, then "compiles" with a soft glow. Replay and Skip controls,
 * an always-available text summary, and reduced-motion support are built in.
 */
export default function CodeProfileHero({
  profile = DEFAULT_PROFILE,
  typingSpeed = DEFAULT_SPEED,
  loop = false,
  primaryAction = DEFAULT_PRIMARY,
  secondaryAction = DEFAULT_SECONDARY,
  eyebrow = "Have a project in mind?",
  onCompiled,
  className = "",
}: CodeProfileHeroProps) {
  const root = useRef<HTMLElement>(null);
  const replayButton = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const speed = Number.isFinite(typingSpeed) && typingSpeed > 0 ? Math.min(400, Math.max(4, typingSpeed)) : DEFAULT_SPEED;
  const lines = useMemo(() => buildLines(profile), [profile]);
  const source = lines.map((line) => line.text).join("\n");
  const timeline = useMemo(() => buildTimeline(source, speed), [source, speed]);
  const { progress, announcement, replay, skip } = usePlayback(root, timeline, loop, onCompiled);
  const { typed, phase } = progress;
  const { parts, chips, caretLine, caretColumn } = reveal(lines, typed);
  const compiled = phase === "done";

  function handleSkip() {
    skip();
    // Skip disappears once finished, so keep keyboard focus in the controls.
    replayButton.current?.focus();
  }

  return (
    <section ref={root} className={`${STAGE} min-h-[560px] ${className}`} aria-label={`${profile.name}, ${profile.role}`}>
      <ComponentStyles css={CODE_PROFILE_HERO_CSS} />
      <div className={BACKDROP_DOTS} aria-hidden="true" />
      <div className="pointer-events-none absolute top-[6%] left-[4%] -z-1 size-[min(420px,70cqw)] rounded-full bg-[#5474ee]/10 blur-[80px]" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[4%] bottom-[4%] -z-1 size-[min(380px,60cqw)] rounded-full bg-[#22c3ee]/10 blur-[80px]" aria-hidden="true" />

      <div className={LAYOUT}>
        <div className={EDITOR}>
          <TitleBar phase={phase} />
          <CodeView lines={lines} typed={typed} phase={phase} />
          <div className={STATUS_BAR}>
            <span aria-hidden="true" className="min-w-0"><BuildStatus phase={phase} line={caretLine} column={caretColumn} /></span>
            <span className="flex shrink-0 items-center gap-0.5">
              {!compiled && (
                <button className={CONTROL} type="button" onClick={handleSkip} aria-label="Skip to the compiled profile">
                  <SkipIcon />
                  Skip
                </button>
              )}
              <button ref={replayButton} className={CONTROL} type="button" onClick={replay} aria-label="Replay the profile animation">
                <ReplayIcon />
                Replay
              </button>
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5 @min-[1180px]:gap-6">
          <ProfileCard profile={profile} parts={parts} chips={chips} compiled={compiled} headingId={headingId} hidden={!compiled} />
          {/* Screen readers always get the full profile, even mid-animation. */}
          {!compiled && <p className="sr-only">{summaryOf(profile)}</p>}
          {(eyebrow || primaryAction || secondaryAction) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-3 px-1">
              {eyebrow && <p className="w-full text-[12px] font-semibold tracking-[.12em] text-[#7a8396] uppercase">{eyebrow}</p>}
              {primaryAction && <Action action={primaryAction} primary />}
              {secondaryAction && <Action action={secondaryAction} primary={false} />}
            </div>
          )}
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
    </section>
  );
}

/* ---------------------------------------------------------------- thumbnail */

const THUMB_LINES = buildLines(DEFAULT_PROFILE);
const THUMB_STARTS = reveal(THUMB_LINES, 0).starts;
const THUMB_TOTAL = THUMB_LINES.map((line) => line.text).join("\n").length;
const THUMB_ROLE = THUMB_LINES.findIndex((line) => line.part === "role");
const THUMB_STACK = THUMB_LINES.findIndex((line) => line.part === "stack");
/** Gallery frames: half typed → chips popping in → compiled → compiled with a highlighted skill. */
const THUMB_FRAMES: { typed: number; phase: Phase; highlight: number }[] = [
  { typed: THUMB_STARTS[THUMB_ROLE] + 13, phase: "typing", highlight: -1 },
  { typed: THUMB_STARTS[THUMB_STACK] + (THUMB_LINES[THUMB_STACK].chipEnds?.[1] ?? 0) + 3, phase: "typing", highlight: -1 },
  { typed: THUMB_TOTAL, phase: "done", highlight: -1 },
  { typed: THUMB_TOTAL, phase: "done", highlight: 2 },
];

/** Inert gallery artwork: the desktop scene at fixed size, scaled into the card. */
export function CodeProfileHeroThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) % THUMB_FRAMES.length : 0;
  const { typed, phase, highlight } = THUMB_FRAMES[step];
  const { parts, chips, caretLine, caretColumn } = reveal(THUMB_LINES, typed);

  return (
    <div className={`${STAGE} cph-thumb h-full min-h-0 items-center ${className}`} aria-hidden="true" inert>
      <ComponentStyles css={CODE_PROFILE_HERO_CSS} />
      <div className={BACKDROP_DOTS} />
      <div className="pointer-events-none absolute top-[2%] left-[6%] -z-1 size-[60%] rounded-full bg-[#5474ee]/12 blur-[50px]" />
      <div className="grid w-[840px] flex-none scale-[.36] grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center gap-7 @min-[360px]:scale-[.4] @min-[420px]:scale-[.45] @min-[520px]:scale-[.55]">
        <div className={EDITOR}>
          <TitleBar phase={phase} />
          <CodeView lines={THUMB_LINES} typed={typed} phase={phase} />
          <div className={STATUS_BAR}>
            <BuildStatus phase={phase} line={caretLine} column={caretColumn} />
            <span className={CONTROL_STATIC}>{phase === "done" ? <><ReplayIcon />Replay</> : <><SkipIcon />Skip</>}</span>
          </div>
        </div>
        <ProfileCard profile={DEFAULT_PROFILE} parts={parts} chips={chips} compiled={phase === "done"} highlightChip={highlight} />
      </div>
    </div>
  );
}

/*
 * Raw CSS keeps only what utilities cannot express: keyframes, and focus outlines that must beat
 * the site's unlayered `:focus-visible` rule.
 */
const CODE_PROFILE_HERO_CSS = `
.cph-stage .cph-control:focus-visible { outline: 2px solid #8ea8ff; outline-offset: 1px; }
.cph-stage .cph-action:focus-visible { outline: 2px solid #5474ee; outline-offset: 3px; }

@keyframes cph-blink { 0% { opacity: 1; } 50% { opacity: 0; } }
@keyframes cph-shimmer { from { background-position: 150% 0; } to { background-position: -50% 0; } }
@keyframes cph-settle { 0% { transform: scale(.985); } 45% { transform: scale(1.012); } 100% { transform: scale(1); } }

@media (prefers-reduced-motion: reduce) {
  .cph-stage .cph-caret { animation: none; }
}
`;
