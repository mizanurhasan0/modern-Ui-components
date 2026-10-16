"use client";

import type { PointerEvent } from "react";
import { ArrowUpRight } from "@/components/site/icons";
import { contactHref, portfolioProfile } from "@/lib/portfolio-profile";
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
      <a href="#selected-work" className={`${styles.button} ${styles.work}`} onPointerMove={followPointer} onPointerLeave={resetPointer} onPointerCancel={resetPointer}>
        <span className={styles.label}>View selected work</span>
        <span className={styles.arrow} aria-hidden="true">
          <ArrowUpRight className={styles.outgoing} />
          <ArrowUpRight className={styles.incoming} />
        </span>
      </a>
      <a href={contactHref} className={`${styles.button} ${styles.intro}`}>
        <span className={styles.play} aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none"><rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="m3.5 6 6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <span className={styles.label}>Email me</span>
      </a>
      <a href={portfolioProfile.resume} target="_blank" rel="noopener noreferrer" className={styles.tour}>
        View résumé ↗
      </a>
      <button type="button" aria-pressed={playing} onClick={onToggleIntro} className={styles.tour}>
        {playing ? "Stop tech stack tour" : "Play tech stack tour"}
      </button>
    </div>
  );
}
