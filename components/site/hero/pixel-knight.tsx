"use client";

import Image from "next/image";
import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import type { Category, CategoryIcon } from "./tech-stack-data";
import styles from "./pixel-knight.module.css";

const SHIELD_ICONS: Record<CategoryIcon, ReactNode> = {
  monitor: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
  server: <><rect x="4" y="4" width="16" height="6" rx="1.5" /><rect x="4" y="14" width="16" height="6" rx="1.5" /></>,
  database: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></>,
  cloud: <path d="M7 18a4 4 0 0 1-.6-8 5.5 5.5 0 0 1 10.7 1.5A3.3 3.3 0 0 1 17 18ZM12 16v-5m-2.2 2.2 2.2-2.2 2.2 2.2" />,
  tools: <path d="m14.5 6.5 3 3M4 20l7.5-7.5M13 4.5l6.5 6.5-2 2L11 6.5Z" />,
};

type Props = {
  category: Category | null;
  playgroundOpen: boolean;
  onTogglePlayground: () => void;
};

export function PixelKnight({ category, playgroundOpen, onTogglePlayground }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const engaged = Boolean(category || playgroundOpen);
  const accent = category?.color ?? "#4d80ff";

  function followPointer(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--look-x", `${(x * 9).toFixed(1)}deg`);
    event.currentTarget.style.setProperty("--look-y", `${(-y * 7).toFixed(1)}deg`);
  }

  function resetPointer() {
    buttonRef.current?.style.setProperty("--look-x", "0deg");
    buttonRef.current?.style.setProperty("--look-y", "0deg");
  }

  return (
    <div className={styles.shell} style={{ "--guardian-accent": accent } as CSSProperties}>
      <button
        ref={buttonRef}
        type="button"
        data-cursor-knight-hide
        aria-pressed={playgroundOpen}
        aria-label={`${playgroundOpen ? "Close playground" : "Explore skills: open code playground"}${category ? `. Pixel Knight is guarding ${category.label}` : ""}`}
        className={styles.button}
        data-engaged={engaged}
        data-playground={playgroundOpen}
        onClick={onTogglePlayground}
        onPointerMove={followPointer}
        onPointerLeave={resetPointer}
        onBlur={resetPointer}
      >
        <span className={styles.aura} aria-hidden="true" />
        <span className={styles.floorRing} aria-hidden="true" />
        <span className={styles.figureWrap} aria-hidden="true">
          <span className={styles.figure}>
            <Image src="/hero/pixel-knight-idle.png" alt="" width={1086} height={1448} sizes="(max-width: 767px) 100px, 154px" loading="eager" className={`${styles.pose} ${styles.idlePose}`} />
            <Image src="/hero/pixel-knight-guard.png" alt="" width={1086} height={1448} sizes="(max-width: 767px) 100px, 154px" loading="eager" className={`${styles.pose} ${styles.guardPose}`} />
            <span className={styles.shieldMark}>
              {category && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{SHIELD_ICONS[category.icon]}</svg>}
            </span>
          </span>
        </span>
        <span className={styles.speechBubble} aria-hidden="true">
          <span className={styles.speechText}>{playgroundOpen ? "Back to stack" : "Open playground"}</span>
          <span className={styles.speechDots}><i /><i /><i /></span>
        </span>
        <span className={styles.sparks} key={category?.id ?? (playgroundOpen ? "playground" : "idle")} aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className={styles.copy}>
          <strong>My Tech Stack</strong>
          <small>
            {playgroundOpen ? "Close playground" : "Explore skills"}
            <svg className={styles.copyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {playgroundOpen ? <path d="m7 7 10 10M17 7 7 17" /> : <path d="m7 8-4 4 4 4m10-8 4 4-4 4m-4-11-2 14" />}
            </svg>
          </small>
        </span>
      </button>
      <span aria-hidden="true" className={styles.connector} data-engaged={engaged} />
    </div>
  );
}
