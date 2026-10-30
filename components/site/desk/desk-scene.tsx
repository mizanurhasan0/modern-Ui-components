"use client";

import { memo, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { RaceCover } from "./race-cover";
import styles from "./desk-scene.module.css";

export type DeskProjectId = "crm" | "marketplace";

/** Scene-internal game phase: off -> merging -> on -> splitting -> off. */
export type DeskGamePhase = "off" | "merging" | "on" | "splitting";

export type DeskSceneProps = {
  /** Rendered screen for the left monitor (decorative preview). */
  crm: ReactNode;
  /** Rendered screen for the right monitor (decorative preview). */
  marketplace: ReactNode;
  /** Called on click / Enter / Space of a monitor button. */
  onOpen: (id: DeskProjectId, trigger: HTMLElement) => void;
  /** Caption blocks: under each monitor on desktop, inside each card on mobile. */
  captions: { crm: ReactNode; marketplace: ReactNode };
  /** Controlled by the shell: true merges the two monitors into one wide screen that hosts `game`. Default false. */
  gameActive?: boolean;
  /** The game console on the desk (one button) was pressed. When omitted no game trigger is rendered. */
  onGameToggle?: (trigger: HTMLElement) => void;
  /** The game element. Rendered only while the merged monitor is fully merged (phase "on"). */
  game?: ReactNode;
  /** Fired on every phase change (not on mount). */
  onGamePhase?: (phase: DeskGamePhase) => void;
};

/** Must match the transition durations in desk-scene.module.css. */
const MERGE_MS = 750;
const SPLIT_MS = 600;
const REDUCED_MS = 150;
/** The START rings pulse 4 x 2 s in CSS after the console first scrolls into view; this clears the class afterwards. */
const PULSE_MS = 8200;
const BEST_KEY = "desk-racer-best";

/** Best score saved by the game, formatted ("1,240"), or null when there is none / storage is unavailable. */
function readBest(): string | null {
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    if (raw === null) return null;
    const value = Math.floor(Number(raw));
    return Number.isFinite(value) && value > 0 ? value.toLocaleString("en-US") : null;
  } catch {
    return null;
  }
}

function subscribeBest(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function serverBest(): string | null {
  return null;
}

type MonitorProps = {
  id: DeskProjectId;
  label: string;
  screen: ReactNode;
  onOpen: DeskSceneProps["onOpen"];
  inert: boolean;
};

/**
 * One monitor = one button: bezel + a 16:10 screen slot. The slot content is
 * purely decorative (aria-hidden, inert, no pointer events) so the button is
 * the only interactive thing and its accessible name comes from aria-label.
 */
function Monitor({ id, label, screen, onOpen, inert }: MonitorProps) {
  return (
    <button
      type="button"
      className={styles.monitor}
      aria-haspopup="dialog"
      aria-label={label}
      inert={inert}
      onClick={(event) => onOpen(id, event.currentTarget)}
    >
      <div className={styles.slot}>
        <div className={styles.slotInner} aria-hidden="true" inert>
          {screen}
        </div>
      </div>
      <span className={styles.tip} aria-hidden="true">
        Click to open
      </span>
      <span className={styles.tap} aria-hidden="true">
        Tap to try
      </span>
    </button>
  );
}

/**
 * Desk illustration (desk top/front/legs, floor, monitor necks, keyboard, mouse,
 * mug, plant, lamp). Monitors are NOT drawn here: the real buttons sit on top of
 * the empty bezel area, positioned in the same 680-unit coordinate space.
 * The viewBox starts at y=10 to leave headroom for the "Click to open" tooltip.
 *
 * Memoised (no props): the game phase only flips a data attribute on the scene
 * root, and the stylesheet cross-fades the two stands into the single centred one.
 */
const DeskArt = memo(function DeskArt() {
  const uid = useId();
  const floorId = `${uid}-floor`;
  const beamId = `${uid}-beam`;
  const poolId = `${uid}-pool`;
  const glowId = `${uid}-glow`;

  return (
    <svg
      className={styles.art}
      viewBox="0 10 680 382"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={floorId}>
          <stop offset="0" stopColor="#e3e9f1" stopOpacity="1" />
          <stop offset=".6" stopColor="#e3e9f1" stopOpacity=".7" />
          <stop offset="1" stopColor="#e3e9f1" stopOpacity="0" />
        </radialGradient>
        {/* Only the light changes colour: --lamp-h is cycled by the stylesheet and frozen while the desk is hovered. The lamp shade stays blue. */}
        <linearGradient id={beamId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "hsl(var(--lamp-h) 100% 84%)" }} stopOpacity=".85" />
          <stop offset="1" style={{ stopColor: "hsl(var(--lamp-h) 100% 88%)" }} stopOpacity=".06" />
        </linearGradient>
        <radialGradient id={poolId}>
          <stop offset="0" style={{ stopColor: "hsl(var(--lamp-h) 100% 86%)" }} stopOpacity=".9" />
          <stop offset="1" style={{ stopColor: "hsl(var(--lamp-h) 100% 90%)" }} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={glowId}>
          <stop offset="0" style={{ stopColor: "hsl(var(--lamp-h) 100% 70%)" }} stopOpacity=".55" />
          <stop offset="1" style={{ stopColor: "hsl(var(--lamp-h) 100% 78%)" }} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* floor: fades out so the desk flows into the captions below */}
      <ellipse cx="340" cy="372" rx="352" ry="20" fill={`url(#${floorId})`} />
      <ellipse cx="340" cy="377" rx="298" ry="5" fill="#cbd4e1" opacity=".85" />

      {/* lamp light */}
      <path d="M29 238 51 230 112 306H22z" fill={`url(#${beamId})`} />

      {/* legs */}
      <rect x="44" y="336" width="12" height="38" fill="#8ea2c8" />
      <rect x="624" y="336" width="12" height="38" fill="#8ea2c8" />
      <rect x="42" y="372" width="16" height="3" rx="1.5" fill="#5f6f86" />
      <rect x="622" y="372" width="16" height="3" rx="1.5" fill="#5f6f86" />

      {/* desk top + front */}
      <rect x="20" y="320" width="640" height="16" fill="#b4c4e4" />
      <rect x="20" y="320" width="640" height="3" fill="#5f6f86" opacity=".28" />
      <rect x="20" y="306" width="640" height="14" rx="3" fill="#cfdaf0" />
      <rect x="23" y="306" width="634" height="1.2" rx=".6" fill="#e4ecff" opacity=".85" />
      <ellipse cx="72" cy="313" rx="48" ry="4" fill={`url(#${poolId})`} />

      {/* monitor necks and bases (screens are the HTML buttons); each stand slides with its monitor and fades while the game merges them */}
      <g className={`${styles.stand} ${styles.standLeft}`}>
        <ellipse cx="190" cy="307.5" rx="48" ry="1.8" fill="#101c33" opacity=".14" />
        <rect x="181" y="224" width="18" height="76" fill="#26334d" />
        <rect x="150" y="298" width="80" height="8" rx="4" fill="#26334d" />
        <rect x="181" y="298" width="18" height="1.6" fill="#101c33" opacity=".35" />
      </g>
      <g className={`${styles.stand} ${styles.standRight}`}>
        <ellipse cx="490" cy="307.5" rx="48" ry="1.8" fill="#101c33" opacity=".14" />
        <rect x="481" y="224" width="18" height="76" fill="#26334d" />
        <rect x="450" y="298" width="80" height="8" rx="4" fill="#26334d" />
        <rect x="481" y="298" width="18" height="1.6" fill="#101c33" opacity=".35" />
      </g>
      {/* the single centred stand of the merged ultrawide monitor */}
      <g className={styles.standMerged}>
        <ellipse cx="340" cy="307.5" rx="52" ry="1.8" fill="#101c33" opacity=".14" />
        <rect x="329" y="236" width="22" height="64" fill="#26334d" />
        <rect x="296" y="298" width="88" height="8" rx="4" fill="#26334d" />
        <rect x="329" y="298" width="22" height="1.6" fill="#101c33" opacity=".35" />
      </g>

      {/* keyboard (shortened to leave room for the game console at x 396..446), cable, mouse */}
      <path d="M232 314c-14 1-24-4-32-8" fill="none" stroke="#26334d" strokeWidth="1.2" strokeLinecap="round" opacity=".7" />
      <rect x="236" y="310" width="118" height="8" rx="3" fill="#e4e8ee" stroke="#8798b8" strokeWidth=".6" />
      <path d="M241 314h108" fill="none" stroke="#8798b8" strokeWidth=".6" strokeDasharray="3 2" strokeLinecap="round" />
      <ellipse cx="376" cy="314" rx="9" ry="4.5" fill="#e4e8ee" stroke="#8798b8" strokeWidth=".6" />
      <path d="M376 309.8v3.4" stroke="#8798b8" strokeWidth=".6" strokeLinecap="round" />

      {/* mug + steam */}
      <ellipse cx="570" cy="307" rx="12" ry="1.8" fill="#101c33" opacity=".14" />
      <rect x="560" y="288" width="20" height="18" rx="4" fill="#fff" stroke="#8798b8" strokeWidth=".8" />
      <path d="M580 292c6 0 6 8 0 8" fill="none" stroke="#8798b8" strokeWidth="1.5" />
      <rect x="560.4" y="296" width="19.2" height="3" fill="#2459ed" opacity=".22" />
      <path className={styles.steam} d="M566 282c-3-4 3-6 0-10" fill="none" stroke="#8798b8" strokeLinecap="round" />
      <path className={`${styles.steam} ${styles.steamLate}`} d="M574 282c-3-4 3-6 0-10" fill="none" stroke="#8798b8" strokeLinecap="round" />

      {/* plant */}
      <ellipse cx="647" cy="307" rx="14" ry="1.8" fill="#101c33" opacity=".14" />
      <ellipse cx="640" cy="272" rx="5" ry="13" fill="#4d73e0" transform="rotate(-24 640 280)" />
      <ellipse cx="652" cy="270" rx="5" ry="13" fill="#6f8fe8" transform="rotate(22 652 280)" />
      <ellipse cx="647" cy="266" rx="4.5" ry="14" fill="#8fa9f0" />
      <rect x="636" y="284" width="22" height="22" rx="3" fill="#5f6f86" />
      <rect x="634" y="284" width="26" height="5" rx="2" fill="#3a4a6b" />

      {/* desk lamp (kept left of the left monitor so it never hides the bezel) */}
      <ellipse cx="30" cy="307" rx="14" ry="3.6" fill="#101c33" opacity=".14" />
      <ellipse cx="30" cy="305.5" rx="14" ry="3.6" fill="#26334d" />
      <path d="M30 304V247l9-16" fill="none" stroke="#26334d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="30" cy="247" r="2.6" fill="#3a4a6b" />
      <circle cx="40" cy="232" r="30" fill={`url(#${glowId})`} />
      <path d="M24 224 46 216l5 14-22 8z" fill="#2459ed" />
      <path d="M29 238 51 230" stroke="#b9c9f7" strokeWidth="2" strokeLinecap="round" opacity=".9" />
      <circle cx="39" cy="231" r="2.4" fill="#3a4a6b" />
    </svg>
  );
});

export function DeskScene({
  crm,
  marketplace,
  onOpen,
  captions,
  gameActive = false,
  onGameToggle,
  game,
  onGamePhase,
}: DeskSceneProps) {
  const [phase, setPhase] = useState<DeskGamePhase>(gameActive ? "on" : "off");
  const [seen, setSeen] = useState(false);
  const [pulseOver, setPulseOver] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const mergedRef = useRef<HTMLDivElement>(null);
  const phaseCallback = useRef(onGamePhase);
  const reportedPhase = useRef(phase);

  // The controlled `gameActive` only starts a transition from a resting phase;
  // a flip during a transition is picked up as soon as the transition settles.
  if (phase === "off" && gameActive) setPhase("merging");
  else if (phase === "on" && !gameActive) setPhase("splitting");

  const merged = phase === "merging" || phase === "on";
  const busy = phase !== "off";
  const hasTrigger = Boolean(onGameToggle);
  const best = useSyncExternalStore(subscribeBest, readBest, serverBest);

  // Settle merging -> on and splitting -> off.
  useEffect(() => {
    if (phase !== "merging" && phase !== "splitting") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wait = reduced ? REDUCED_MS : phase === "merging" ? MERGE_MS : SPLIT_MS;
    const timer = window.setTimeout(() => setPhase(phase === "merging" ? "on" : "off"), wait);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // Report committed phase changes (never the initial phase).
  useEffect(() => {
    phaseCallback.current = onGamePhase;
  });
  useEffect(() => {
    if (reportedPhase.current === phase) return;
    reportedPhase.current = phase;
    phaseCallback.current?.(phase);
  }, [phase]);

  // After the split starts the game has unmounted: hand focus back to the console trigger.
  useEffect(() => {
    if (phase !== "splitting") return;
    const active = document.activeElement;
    if (!active || active === document.body || mergedRef.current?.contains(active)) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [phase]);

  // The START rings pulse (finite, ~8 s) once the console first scrolls into view.
  useEffect(() => {
    const button = triggerRef.current;
    if (!button || seen || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(button);
    return () => observer.disconnect();
  }, [seen, hasTrigger]);

  useEffect(() => {
    if (!seen) return;
    const timer = window.setTimeout(() => setPulseOver(true), PULSE_MS);
    return () => window.clearTimeout(timer);
  }, [seen]);

  function handleTrigger(trigger: HTMLElement) {
    setPulseOver(true);
    // Repeated presses while the monitors are moving are ignored.
    if (phase === "off" || phase === "on") onGameToggle?.(trigger);
  }

  const pulsing = seen && !pulseOver && !busy;

  return (
    <div className={styles.scene} data-game={phase} data-merged={merged ? "true" : "false"}>
      {onGameToggle ? (
        <button
          ref={triggerRef}
          type="button"
          className={`${styles.trigger} ${pulsing ? styles.pulse : ""}`.trim()}
          aria-pressed={gameActive}
          aria-label={gameActive ? "Exit game, Desk Racer" : "Play a game, Desk Racer"}
          onClick={(event) => handleTrigger(event.currentTarget)}
        >
          {/* Everything inside is decorative: the aria-label is the name. Desktop: a cover card standing on the desk, plus the console below; phones: one horizontal card. */}
          <span className={styles.card} aria-hidden="true">
            <RaceCover className={styles.cover} />
            <span className={styles.copy}>
              <span className={styles.title}>Desk Racer</span>
              <span className={styles.sub}>
                <span className={styles.deskOnly}>Press start to play</span>
                <span className={styles.phoneOnly}>Tap to play</span>
              </span>
              {best ? (
                <span className={styles.meta}>Best {best}</span>
              ) : (
                <span className={styles.meta}>
                  <span className={styles.deskOnly}>↑ ↓ to steer</span>
                  <span className={styles.phoneOnly}>Drag to steer</span>
                </span>
              )}
            </span>
          </span>

          <span className={styles.exitTag} aria-hidden="true">
            <span className={styles.exitTitle}>Exit game</span>
            <span className={styles.exitSub}>Esc to leave</span>
          </span>

          <svg className={styles.console} viewBox="390 270 62 40" aria-hidden="true" focusable="false">
            <ellipse cx="421" cy="307.5" rx="30" ry="1.8" fill="#101c33" opacity=".16" />
            {/* body: dark slate slab with a d-pad notch and two tiny buttons */}
            <rect x="396" y="295" width="50" height="12" rx="3.5" fill="#3a4a6b" />
            <rect x="398" y="295.8" width="46" height="1.2" rx=".6" fill="#8798b8" opacity=".55" />
            <rect x="396" y="304.2" width="50" height="2.8" rx="1.4" fill="#26334d" />
            <path
              d="M401.1 297.9h2.2v2.3h2.3v2.2h-2.3v2.3h-2.2v-2.3h-2.3v-2.2h2.3z"
              fill="#1a2742"
            />
            <circle cx="437.5" cy="300.4" r="1.9" fill="#8fa9f0" />
            <circle cx="442.2" cy="302.6" r="1.9" fill="#b9c9f7" />
            {/* START: soft glow, hover ring, two pulsing rings, collar, blue button with a white triangle (a white stop square on deep blue while the game runs) */}
            <circle className={styles.glow} cx="421" cy="289" r="19" fill="#4866e9" />
            <circle className={`${styles.ring} ${styles.ringA}`} cx="421" cy="289" r="11" fill="none" stroke="#4866e9" strokeWidth="1.6" />
            <circle className={`${styles.ring} ${styles.ringB}`} cx="421" cy="289" r="11" fill="none" stroke="#8fa9f0" strokeWidth="1.6" />
            <g className={styles.start}>
              <circle cx="421" cy="289" r="13" fill="#26334d" />
              <circle className={styles.startFace} cx="421" cy="289" r="11" />
              <path d="M413.2 285.2a9.6 9.6 0 0 1 11-3.6" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".55" />
              {gameActive ? (
                <rect className={styles.glyph} x="416.6" y="284.6" width="8.8" height="8.8" rx="1.8" fill="currentColor" />
              ) : (
                <path
                  className={styles.glyph}
                  d="M417.8 284.2 426.2 289l-8.4 4.8z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              )}
            </g>
            <circle className={styles.hoverRing} cx="421" cy="289" r="15.6" fill="none" stroke="#8fa9f0" strokeWidth="1.6" />
            <circle className={styles.focusRing} cx="421" cy="289" r="17.4" fill="none" strokeWidth="2.2" />
          </svg>

          {/* phones: the round START chip at the right end of the card */}
          <span className={styles.chip} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" focusable="false">
              {gameActive ? (
                <rect className={styles.glyph} x="4.5" y="4.5" width="9" height="9" rx="2" fill="currentColor" />
              ) : (
                <path className={styles.glyph} d="M5.6 3.4 14.4 9l-8.8 5.6z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              )}
            </svg>
          </span>
        </button>
      ) : null}

      <DeskArt />

      <div className={`${styles.item} ${styles.left}`}>
        <Monitor id="crm" label="Open Sales CRM" screen={crm} onOpen={onOpen} inert={busy} />
        <div className={styles.caption} inert={busy}>
          {captions.crm}
        </div>
      </div>

      <div className={`${styles.item} ${styles.right}`}>
        <Monitor id="marketplace" label="Open Multi-Vendor Marketplace" screen={marketplace} onOpen={onOpen} inert={busy} />
        <div className={styles.caption} inert={busy}>
          {captions.marketplace}
        </div>
      </div>

      {/* The merged ultrawide monitor: not a button, just a bezel that hosts the game. */}
      <div
        ref={mergedRef}
        className={styles.merged}
        role="group"
        aria-label="Desk Racer"
        aria-hidden={merged ? undefined : true}
        inert={!merged}
      >
        <div className={styles.mergedSlot}>
          {phase === "on" ? <div className={styles.gameHost}>{game}</div> : null}
        </div>
      </div>
    </div>
  );
}
