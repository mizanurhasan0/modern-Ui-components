"use client";

import { ComponentStyles } from "./component-styles";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/*
 * Mascot is a port of page-mascot by Kamran Ahmed (MIT, notice at the end).
 * Each character is two 3×3 sprite sheets: nine head directions and nine
 * reactions. The pointer's angle picks a direction cell; a poke shows a
 * reaction cell for half a second.
 */

const DIRECTIONS = [
  "up-left",
  "up",
  "up-right",
  "left",
  "center",
  "right",
  "down-left",
  "down",
  "down-right",
] as const;

const REACTIONS = [
  "blink",
  "heart",
  "sparkle",
  "surprised",
  "wink",
  "bashful",
  "sleepy",
  "dizzy",
  "delighted",
] as const;

type Direction = (typeof DIRECTIONS)[number];
export type MascotReaction = (typeof REACTIONS)[number];

// Clockwise from the right, matching atan2 with y pointing down.
const CLOCKWISE: Direction[] = [
  "right",
  "down-right",
  "down",
  "down-left",
  "left",
  "up-left",
  "up",
  "up-right",
];
const SECTOR = (Math.PI * 2) / CLOCKWISE.length;
const HYSTERESIS = 0.12;
const DEAD_ZONE = 70;

const PAYOFFS: MascotReaction[] = ["heart", "sparkle", "delighted"];
const BOOP_PAYOFF = 120;
const BOOP_END = 560;
const SQUASH_MS = 420;
const DIZZY_AFTER = 4;
const DIZZY_WINDOW = 1600;
const DIZZY_END = 1100;

const SQUASH: Keyframe[] = [
  { transform: "scale(1, 1)", easing: "ease-in" },
  { transform: "scale(1.10, 0.86)", offset: 0.18, easing: "ease-out" },
  { transform: "scale(0.95, 1.08)", offset: 0.45, easing: "ease-in-out" },
  { transform: "scale(1.03, 0.97)", offset: 0.72, easing: "ease-in-out" },
  { transform: "scale(1, 1)" },
];

// background-size 300% makes each cell a clean 0/50/100% step on both axes.
function cell(index: number): CSSProperties {
  return {
    backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`,
  };
}

function wrap(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

const sheetUrl = (path: string) => `url(${JSON.stringify(path)})`;

const SHEET_LAYER =
  "pointer-events-none absolute inset-0 bg-no-repeat [background-size:300%_300%]";

export interface MascotProps {
  /** The 3×3 sheet of head directions. A served path, or an imported image URL. */
  directions: string;
  /** The 3×3 sheet of expressions. */
  reactions: string;
  /** Square size: pixels, or any CSS length. */
  size?: number | string;
  className?: string;
  /** What a screen reader calls it. */
  label?: string;
  /** Called on every poke, for example to select this character. */
  onBoop?: () => void;
  /** Marks the character as the selected one in a group. */
  pressed?: boolean;
}

/** A character that turns its head toward the pointer and reacts when poked. */
export function Mascot({
  directions,
  reactions,
  size = 140,
  className = "",
  label = "mascot",
  onBoop,
  pressed,
}: MascotProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const squashRef = useRef<HTMLSpanElement>(null);
  const timersRef = useRef<number[]>([]);
  const boopsRef = useRef({ count: 0, at: 0 });
  const [direction, setDirection] = useState<Direction>("center");
  const [reaction, setReaction] = useState<MascotReaction | null>(null);

  useEffect(() => {
    // Tracking needs a hovering, precise pointer; touch keeps the centre pose.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    let sector = -1;
    let pointer: { x: number; y: number } | null = null;

    const aim = () => {
      const button = buttonRef.current;
      if (!button || !pointer) return;

      const box = button.getBoundingClientRect();
      const dx = pointer.x - (box.left + box.width / 2);
      const dy = pointer.y - (box.top + box.height / 2);

      if (Math.hypot(dx, dy) < DEAD_ZONE) {
        sector = -1;
        setDirection("center");
        return;
      }

      // Hold the current sector until the pointer is well past its edge.
      const angle = Math.atan2(dy, dx);
      if (
        sector !== -1 &&
        Math.abs(wrap(angle - sector * SECTOR)) < SECTOR / 2 + HYSTERESIS
      ) {
        return;
      }

      sector = (Math.round(angle / SECTOR) + CLOCKWISE.length) % CLOCKWISE.length;
      setDirection(CLOCKWISE[sector]);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      aim();
    };

    // Capture so scrolling inside any container re-aims, not only the window.
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", aim, { passive: true, capture: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", aim, { capture: true });
    };
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  function boop() {
    onBoop?.();
    const timers = timersRef.current;
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.length = 0;

    const later = (ms: number, next: MascotReaction | null) => {
      timers.push(window.setTimeout(() => setReaction(next), ms));
    };

    const now = Date.now();
    const boops = boopsRef.current;
    boops.count = now - boops.at < DIZZY_WINDOW ? boops.count + 1 : 1;
    boops.at = now;

    if (boops.count >= DIZZY_AFTER) {
      boops.count = 0;
      setReaction("dizzy");
      later(DIZZY_END, null);
    } else {
      setReaction("blink");
      later(BOOP_PAYOFF, PAYOFFS[(boops.count - 1) % PAYOFFS.length]);
      later(BOOP_END, null);
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Per-keyframe easing with the effect itself linear: an easing on the effect
    // would reinterpret every offset and front-load the whole bounce.
    squashRef.current?.animate(SQUASH, { duration: SQUASH_MS, easing: "linear" });
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={boop}
      aria-label={`Boop the ${label}`}
      aria-pressed={pressed}
      className={`pm-mascot relative block shrink-0 cursor-pointer appearance-none border-0 bg-transparent p-0 select-none [-webkit-tap-highlight-color:transparent] ${className}`}
      style={{ width: size, height: size }}
    >
      <span ref={squashRef} className="relative block size-full origin-[50%_78%]">
        <span
          className={SHEET_LAYER}
          style={{
            backgroundImage: sheetUrl(directions),
            ...cell(DIRECTIONS.indexOf(direction)),
            opacity: reaction ? 0 : 1,
          }}
        />
        {/* Always mounted so the sheet is fetched up front, never on the first poke. */}
        <span
          className={SHEET_LAYER}
          style={{
            backgroundImage: sheetUrl(reactions),
            ...cell(REACTIONS.indexOf(reaction ?? "blink")),
            opacity: reaction ? 1 : 0,
          }}
        />
      </span>
    </button>
  );
}

/* ---------------------------------------------------------------------------
 * The demo page: the hero mascot and the style row. Picking a style shows it
 * at the top.
 * ------------------------------------------------------------------------- */

export type MascotSheets = { directions: string; reactions: string };

export type MascotStyle = MascotSheets & {
  id: string;
  name: string;
  note: string;
};

const sheets = (stem: string): MascotSheets => ({
  directions: `/mascots/${stem}-directions.webp`,
  reactions: `/mascots/${stem}-reactions.webp`,
});

const DEFAULT_STYLES: MascotStyle[] = [
  { id: "fox", name: "colour", note: "the default", ...sheets("fox") },
  { id: "fox-ink", name: "ink", note: "black line", ...sheets("fox-ink") },
  { id: "fox-sketch", name: "sketch", note: "pencil", ...sheets("fox-sketch") },
  { id: "fox-riso", name: "riso", note: "two-tone print", ...sheets("fox-riso") },
  { id: "fox-paper", name: "paper", note: "cut paper", ...sheets("fox-paper") },
  { id: "fox-pixel", name: "pixel", note: "32 across", ...sheets("fox-pixel") },
  { id: "mizanur", name: "mizanur", note: "from a photo", ...sheets("mizanur") },
];

const DEFAULT_TITLE = "Page Mascot";
const DEFAULT_DESCRIPTION =
  "A small character for the top of your page. It turns its head to follow the reader's cursor and reacts when they poke it.";
const HINTS = [
  "Move your pointer to turn its head",
  "Poke it for a reaction",
  "Poke four times fast to make it dizzy",
];

/** What a screen reader calls a style's character. */
const characterLabel = (style: MascotStyle) =>
  style.id.startsWith("fox") ? `${style.name} fox` : style.name;

const ROOT =
  "page-mascot-demo @container relative isolate w-full overflow-hidden bg-[#f7f6f3] text-[#151412] [font-family:var(--font-geist-sans),ui-sans-serif,system-ui,sans-serif] **:box-border";
const TITLE = "leading-[1.05] font-semibold tracking-[-0.045em] text-[#151412]";
const MUTED = "text-[#6d6a64]";
const FAINT = "text-[#a6a29a]";

export interface PageMascotProps {
  /** Characters in the style row. Picking one shows it at the top. */
  styles?: MascotStyle[];
  /** Id of the style shown at the top first. Defaults to the first style. */
  defaultStyle?: string;
  title?: string;
  description?: string;
  className?: string;
}

/** The page-mascot demo page, ready to drop in. Sheets are served from /mascots. */
export default function PageMascot({
  styles = DEFAULT_STYLES,
  defaultStyle,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  className = "",
}: PageMascotProps) {
  const [selectedId, setSelectedId] = useState(defaultStyle ?? styles[0]?.id);
  const selected = styles.find((style) => style.id === selectedId) ?? styles[0];

  return (
    <section className={`${ROOT} ${className}`} aria-label="Page mascot">
      <ComponentStyles css={PAGE_MASCOT_STYLES} />

      <div className="mx-auto w-full max-w-[808px] px-6 pt-14 pb-20 [--pm-hero:140px] [--pm-tile:76px] sm:px-10 [@container(max-width:480px)]:pt-10 [@container(max-width:480px)]:pb-14 [@container(max-width:480px)]:[--pm-hero:112px] [@container(max-width:480px)]:[--pm-tile:66px]">
        {/* Not keyed: the new character keeps looking where the old one was looking. */}
        {selected && (
          <Mascot
            directions={selected.directions}
            reactions={selected.reactions}
            size="var(--pm-hero)"
            label={characterLabel(selected)}
          />
        )}
        <p className="sr-only" aria-live="polite">
          {selected ? `Showing the ${characterLabel(selected)} at the top.` : ""}
        </p>

        <h2 className={`mt-4 text-[clamp(30px,7cqi,42px)] ${TITLE}`}>{title}</h2>
        <p className={`mt-3 max-w-[460px] text-[15px] leading-[1.55] ${MUTED}`}>
          {description}
        </p>
        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-[#8f8b83]">
          {HINTS.map((hint) => (
            <li key={hint} className="flex items-center gap-2">
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[#d8b96d]" />
              {hint}
            </li>
          ))}
        </ul>

        <h3 className="mt-20 text-[24px] leading-tight font-semibold tracking-[-0.035em] text-[#151412] [@container(max-width:480px)]:mt-14">
          Different styles
        </h3>
        <p className={`mt-2 max-w-[440px] text-[15px] leading-[1.55] ${MUTED}`}>
          You can pick from one of the six styles. Or send a photo and get
          yourself turned into a character.
        </p>

        <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-y-6 [@container(max-width:480px)]:grid-cols-3">
          {styles.map((style) => {
            const isSelected = style.id === selected?.id;
            return (
              // Character, name and note share one centre line.
              <li key={style.id} className="flex min-w-0 flex-col items-center text-center">
                <div
                  data-selected={isSelected}
                  className="grid size-[calc(var(--pm-tile)_+_16px)] place-items-center rounded-[16px] transition-colors duration-150 hover:bg-[#efeee9] data-[selected=true]:bg-[#e8e6e0]"
                >
                  <Mascot
                    directions={style.directions}
                    reactions={style.reactions}
                    size="var(--pm-tile)"
                    label={characterLabel(style)}
                    pressed={isSelected}
                    onBoop={() => setSelectedId(style.id)}
                  />
                </div>
                <p className={`mt-2 font-mono text-[13px] text-[#151412] ${isSelected ? "font-semibold" : ""}`}>
                  {style.name}
                </p>
                <p className={`text-[12px] ${FAINT}`}>{style.note}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

const THUMBNAIL_LOOKS = [4, 5, 2, 3, 7]; // center, right, up-right, left, down

/** Inert gallery still: the hero fox glancing around above the page title. */
export function PageMascotThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  const look = THUMBNAIL_LOOKS[Math.abs(Math.trunc(previewStep)) % THUMBNAIL_LOOKS.length];
  const fox = sheets("fox");
  return (
    <div
      className={`${ROOT} pm-thumbnail pointer-events-none h-full ${className}`}
      aria-hidden="true"
      inert
    >
      <div className="flex h-full flex-col justify-center px-[10cqi]">
        <span
          className="block aspect-square w-[20cqi] bg-no-repeat [background-size:300%_300%]"
          style={{ backgroundImage: sheetUrl(fox.directions), ...cell(look) }}
        />
        <p className={`mt-[2cqi] text-[7.4cqi] ${TITLE}`}>{DEFAULT_TITLE}</p>
        <p className={`mt-[2cqi] max-w-[62cqi] text-[2.5cqi] leading-[1.5] ${MUTED}`}>
          {DEFAULT_DESCRIPTION}
        </p>
        <div className="mt-[3cqi] flex flex-wrap gap-x-[3cqi] gap-y-[1cqi] text-[2.1cqi] text-[#8f8b83]">
          {HINTS.slice(0, 2).map((hint) => (
            <span key={hint} className="flex items-center gap-[1cqi] whitespace-nowrap">
              <span className="size-[1cqi] rounded-full bg-[#d8b96d]" />
              {hint}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/*
 * Raw CSS keeps what Tailwind can't: a focus ring that must outrank the site's
 * unlayered global :focus-visible rule, and the reduced-motion kill switch.
 * The poke squash checks reduced motion itself.
 */
const PAGE_MASCOT_STYLES = `
.page-mascot-demo .pm-mascot:focus-visible{outline:2px solid #151412;outline-offset:3px;border-radius:12px}
@media(prefers-reduced-motion:reduce){.page-mascot-demo *{animation:none!important;transition:none!important}}
`;

export { PageMascot };

/*
 * Mascot behaviour, and the fox and fox style sheets in /mascots, come from
 * page-mascot: https://github.com/nilbuild/page-mascot. The mizanur sheets were
 * drawn from the site owner's photo with page-mascot's prompts.
 *
 * MIT License
 *
 * Copyright (c) 2026 Kamran Ahmed <https://kamran.fyi>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
