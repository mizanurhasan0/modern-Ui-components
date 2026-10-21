"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import styles from "./desk-scene.module.css";

export type DeskProjectId = "crm" | "marketplace";

export type DeskSceneProps = {
  /** Rendered screen for the left monitor (decorative preview). */
  crm: ReactNode;
  /** Rendered screen for the right monitor (decorative preview). */
  marketplace: ReactNode;
  /** Called on click / Enter / Space of a monitor button. */
  onOpen: (id: DeskProjectId, trigger: HTMLElement) => void;
  /** Caption blocks: under each monitor on desktop, inside each card on mobile. */
  captions: { crm: ReactNode; marketplace: ReactNode };
};

type MonitorProps = {
  id: DeskProjectId;
  label: string;
  screen: ReactNode;
  onOpen: DeskSceneProps["onOpen"];
};

/**
 * One monitor = one button: bezel + a 16:10 screen slot. The slot content is
 * purely decorative (aria-hidden, inert, no pointer events) so the button is
 * the only interactive thing and its accessible name comes from aria-label.
 */
function Monitor({ id, label, screen, onOpen }: MonitorProps) {
  return (
    <button
      type="button"
      className={styles.monitor}
      aria-haspopup="dialog"
      aria-label={label}
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
 */
function DeskArt() {
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

      {/* monitor necks and bases (screens are the HTML buttons) */}
      <ellipse cx="190" cy="307.5" rx="48" ry="1.8" fill="#101c33" opacity=".14" />
      <ellipse cx="490" cy="307.5" rx="48" ry="1.8" fill="#101c33" opacity=".14" />
      <rect x="181" y="224" width="18" height="76" fill="#26334d" />
      <rect x="150" y="298" width="80" height="8" rx="4" fill="#26334d" />
      <rect x="481" y="224" width="18" height="76" fill="#26334d" />
      <rect x="450" y="298" width="80" height="8" rx="4" fill="#26334d" />
      <rect x="181" y="298" width="18" height="1.6" fill="#101c33" opacity=".35" />
      <rect x="481" y="298" width="18" height="1.6" fill="#101c33" opacity=".35" />

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
}

export function DeskScene({ crm, marketplace, onOpen, captions }: DeskSceneProps) {
  return (
    <div className={styles.scene}>
      <DeskArt />

      <div className={`${styles.item} ${styles.left}`}>
        <Monitor id="crm" label="Open LeadPylot CRM" screen={crm} onOpen={onOpen} />
        <div className={styles.caption}>{captions.crm}</div>
      </div>

      <div className={`${styles.item} ${styles.right}`}>
        <Monitor id="marketplace" label="Open MyPick" screen={marketplace} onOpen={onOpen} />
        <div className={styles.caption}>{captions.marketplace}</div>
      </div>
    </div>
  );
}
