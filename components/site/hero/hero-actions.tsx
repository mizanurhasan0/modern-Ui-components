"use client";

import type { PointerEvent } from "react";
import { ArrowUpRight } from "@/components/site/icons";
import styles from "./hero-actions.module.css";

function followPointer(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse" || !matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) return;
  const button = event.currentTarget;
  const bounds = button.getBoundingClientRect();
  button.style.setProperty("--magnet-x", `${(event.clientX - bounds.left - bounds.width / 2) * .045}px`);
  button.style.setProperty("--magnet-y", `${(event.clientY - bounds.top - bounds.height / 2) * .08}px`);
}

function resetPointer(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.removeProperty("--magnet-x");
  event.currentTarget.style.removeProperty("--magnet-y");
}

export function HeroActions({ playing, onToggleIntro }: { playing: boolean; onToggleIntro: () => void }) {
  return (
    <div className={styles.actions}>
      <a href="#collection" className={`${styles.button} ${styles.work}`} onPointerMove={followPointer} onPointerLeave={resetPointer} onPointerCancel={resetPointer}>
        <span className={styles.label}>View My Work</span>
        <span className={styles.arrow} aria-hidden="true">
          <ArrowUpRight className={styles.outgoing} />
          <ArrowUpRight className={styles.incoming} />
        </span>
      </a>
      <button type="button" aria-pressed={playing} onClick={onToggleIntro} className={`${styles.button} ${styles.intro}`}>
        <span className={styles.play} aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="currentColor">
            {playing ? <rect x="6" y="6" width="8" height="8" rx="1.5" /> : <path d="M7 4.8a.8.8 0 0 1 1.2-.7l8 5.2a.8.8 0 0 1 0 1.4l-8 5.2a.8.8 0 0 1-1.2-.7Z" />}
          </svg>
        </span>
        <span className={styles.label}>{playing ? "Stop Intro" : "Watch Intro"}</span>
      </button>
    </div>
  );
}
