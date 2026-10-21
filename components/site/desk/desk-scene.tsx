"use client";

import { memo, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
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
  /** Play / Exit button pressed. When omitted no game button is rendered. */
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
/** The hint bubble fades by itself after this long; the pulse ring lasts 4 x 2 s in CSS. */
const HINT_MS = 6000;
const PULSE_MS = 8200;
const HINT_TEXT = "Psst… there's a game on this desk";

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

/** Hand-drawn gamepad glyph; the d-pad and the two buttons are cut out so the chip colour shows through. */
function GamepadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M7 5.8h10a4.6 4.6 0 0 1 4.5 3.7l.9 4.9a3.1 3.1 0 0 1-5.4 2.5l-1.2-1.4a1.9 1.9 0 0 0-1.4-.6H9.6a1.9 1.9 0 0 0-1.4.6L7 16.9a3.1 3.1 0 0 1-5.4-2.5l.9-4.9A4.6 4.6 0 0 1 7 5.8zM6.4 8.7v1.5H4.9v1.4h1.5v1.5h1.4v-1.5h1.5v-1.4H7.8V8.7zM16.2 9.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM18.7 11.7a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z"
      />
    </svg>
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
        {/* Only the light changes colour: --lamp-h is cycled by the stylesheet and frozen while the desk is hovered. The lamp itself stays yellow. */}
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
      <rect x="44" y="336" width="12" height="38" fill="#8a6a4a" />
      <rect x="624" y="336" width="12" height="38" fill="#8a6a4a" />
      <rect x="42" y="372" width="16" height="3" rx="1.5" fill="#765a3e" />
      <rect x="622" y="372" width="16" height="3" rx="1.5" fill="#765a3e" />

      {/* desk top + front */}
      <rect x="20" y="320" width="640" height="16" fill="#b48a60" />
      <rect x="20" y="320" width="640" height="3" fill="#8a6a4a" opacity=".28" />
      <rect x="20" y="306" width="640" height="14" rx="3" fill="#c8a47c" />
      <rect x="23" y="306" width="634" height="1.2" rx=".6" fill="#e0c29f" opacity=".85" />
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
        <ellipse cx="340" cy="307.5" rx="66" ry="1.8" fill="#101c33" opacity=".14" />
        <rect x="329" y="236" width="22" height="64" fill="#26334d" />
        <rect x="288" y="298" width="104" height="8" rx="4" fill="#26334d" />
        <rect x="329" y="298" width="22" height="1.6" fill="#101c33" opacity=".35" />
      </g>

      {/* keyboard, cable, mouse */}
      <path d="M232 314c-14 1-24-4-32-8" fill="none" stroke="#26334d" strokeWidth="1.2" strokeLinecap="round" opacity=".7" />
      <rect x="236" y="310" width="206" height="8" rx="3" fill="#dfe6ee" stroke="#9aa9bd" strokeWidth=".6" />
      <path d="M241 314h196" fill="none" stroke="#9aa9bd" strokeWidth=".6" strokeDasharray="3 2" strokeLinecap="round" />
      <ellipse cx="470" cy="314" rx="9" ry="4.5" fill="#dfe6ee" stroke="#9aa9bd" strokeWidth=".6" />
      <path d="M470 309.8v3.4" stroke="#9aa9bd" strokeWidth=".6" strokeLinecap="round" />

      {/* mug + steam */}
      <ellipse cx="570" cy="307" rx="12" ry="1.8" fill="#101c33" opacity=".14" />
      <rect x="560" y="288" width="20" height="18" rx="4" fill="#fff" stroke="#9aa9bd" strokeWidth=".8" />
      <path d="M580 292c6 0 6 8 0 8" fill="none" stroke="#9aa9bd" strokeWidth="1.5" />
      <rect x="560.4" y="296" width="19.2" height="3" fill="#3a86ff" opacity=".22" />
      <path className={styles.steam} d="M566 282c-3-4 3-6 0-10" fill="none" stroke="#9aa9bd" strokeLinecap="round" />
      <path className={`${styles.steam} ${styles.steamLate}`} d="M574 282c-3-4 3-6 0-10" fill="none" stroke="#9aa9bd" strokeLinecap="round" />

      {/* plant */}
      <ellipse cx="647" cy="307" rx="14" ry="1.8" fill="#101c33" opacity=".14" />
      <ellipse cx="640" cy="272" rx="5" ry="13" fill="#4f9d77" transform="rotate(-24 640 280)" />
      <ellipse cx="652" cy="270" rx="5" ry="13" fill="#3f8b66" transform="rotate(22 652 280)" />
      <ellipse cx="647" cy="266" rx="4.5" ry="14" fill="#5db088" />
      <rect x="636" y="284" width="22" height="22" rx="3" fill="#c97b5a" />
      <rect x="634" y="284" width="26" height="5" rx="2" fill="#b8694a" />

      {/* desk lamp (kept left of the left monitor so it never hides the bezel) */}
      <ellipse cx="30" cy="307" rx="14" ry="3.6" fill="#101c33" opacity=".14" />
      <ellipse cx="30" cy="305.5" rx="14" ry="3.6" fill="#26334d" />
      <path d="M30 304V247l9-16" fill="none" stroke="#26334d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="30" cy="247" r="2.6" fill="#3d4d6b" />
      <circle cx="40" cy="232" r="30" fill={`url(#${glowId})`} />
      <path d="M24 224 46 216l5 14-22 8z" fill="#f2b93c" />
      <path d="M29 238 51 230" stroke="#fff4cf" strokeWidth="2" strokeLinecap="round" opacity=".9" />
      <circle cx="39" cy="231" r="2.4" fill="#3d4d6b" />
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
  const [hintGone, setHintGone] = useState(false);
  const [pulseOver, setPulseOver] = useState(false);
  const playRef = useRef<HTMLButtonElement>(null);
  const mergedRef = useRef<HTMLDivElement>(null);
  const phaseCallback = useRef(onGamePhase);
  const reportedPhase = useRef(phase);

  // The controlled `gameActive` only starts a transition from a resting phase;
  // a flip during a transition is picked up as soon as the transition settles.
  if (phase === "off" && gameActive) setPhase("merging");
  else if (phase === "on" && !gameActive) setPhase("splitting");

  const merged = phase === "merging" || phase === "on";
  const busy = phase !== "off";
  const hasPlay = Boolean(onGameToggle);

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

  // After the split starts the game has unmounted: hand focus back to the Play button.
  useEffect(() => {
    if (phase !== "splitting") return;
    const active = document.activeElement;
    if (!active || active === document.body || mergedRef.current?.contains(active)) {
      playRef.current?.focus({ preventScroll: true });
    }
  }, [phase]);

  // The pulse ring and the hint bubble start once the Play button first scrolls into view.
  useEffect(() => {
    const button = playRef.current;
    if (!button || seen || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.9 },
    );
    observer.observe(button);
    return () => observer.disconnect();
  }, [seen, hasPlay]);

  useEffect(() => {
    if (!seen) return;
    const hintTimer = window.setTimeout(() => setHintGone(true), HINT_MS);
    const pulseTimer = window.setTimeout(() => setPulseOver(true), PULSE_MS);
    return () => {
      window.clearTimeout(hintTimer);
      window.clearTimeout(pulseTimer);
    };
  }, [seen]);

  function handlePlay(trigger: HTMLElement) {
    setHintGone(true);
    setPulseOver(true);
    // Repeated presses while the monitors are moving are ignored.
    if (phase === "off" || phase === "on") onGameToggle?.(trigger);
  }

  const pulsing = seen && !pulseOver && !busy;
  const hintHidden = hintGone || busy;

  return (
    <div className={styles.scene} data-game={phase} data-merged={merged ? "true" : "false"}>
      {onGameToggle ? (
        <div className={styles.playRow}>
          <div className={`${styles.playWrap} ${pulsing ? styles.playWrapPulse : ""}`}>
            {seen ? (
              <span className={styles.hint} data-gone={hintHidden ? "true" : "false"} aria-hidden="true">
                {HINT_TEXT}
              </span>
            ) : null}
            <button
              ref={playRef}
              type="button"
              className={styles.play}
              aria-pressed={gameActive}
              aria-label={gameActive ? "Exit game, Desk Racer" : "Play a game, Desk Racer"}
              onClick={(event) => handlePlay(event.currentTarget)}
              onPointerEnter={() => setHintGone(true)}
              onFocus={() => setHintGone(true)}
            >
              <span className={styles.playChip} aria-hidden="true">
                <GamepadIcon />
              </span>
              <span className={styles.playLabel} aria-hidden="true">
                {gameActive ? "Exit game" : "Play a game"}
              </span>
              {gameActive ? (
                <kbd className={styles.keycap} aria-hidden="true">
                  Esc
                </kbd>
              ) : null}
              <span className={styles.live} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      <DeskArt />

      <div className={`${styles.item} ${styles.left}`}>
        <Monitor id="crm" label="Open LeadPylot CRM" screen={crm} onOpen={onOpen} inert={busy} />
        <div className={styles.caption} inert={busy}>
          {captions.crm}
        </div>
      </div>

      <div className={`${styles.item} ${styles.right}`}>
        <Monitor id="marketplace" label="Open MyPick" screen={marketplace} onOpen={onOpen} inert={busy} />
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
