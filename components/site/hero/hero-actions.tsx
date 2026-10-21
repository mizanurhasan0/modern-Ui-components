"use client";

import type { CSSProperties, PointerEvent } from "react";
import { ArrowUpRight } from "@/components/site/icons";
import { portfolioProfile } from "@/lib/portfolio-profile";
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

export function HeroActions() {
  return (
    <div className={styles.actions}>
      <a href="#selected-work" className={`${styles.button} ${styles.work}`} onPointerMove={followPointer} onPointerLeave={resetPointer} onPointerCancel={resetPointer}>
        <span className={styles.label}>View selected work</span>
        <span className={styles.arrow} aria-hidden="true">
          <ArrowUpRight className={styles.outgoing} />
          <ArrowUpRight className={styles.incoming} />
        </span>
      </a>
      <a href={portfolioProfile.resume} target="_blank" rel="noopener noreferrer" className={`${styles.button} ${styles.resume}`}>
        <span className={styles.doc} aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5.5 2.5h6L15 6v10a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 4 16V4a1.5 1.5 0 0 1 1.5-1.5Z" />
            <path d="M11.5 2.5V6H15" />
            <path className={styles.docLine} style={{ "--i": 0 } as CSSProperties} pathLength={1} d="M7 9.5h2.5" />
            <path className={styles.docLine} style={{ "--i": 1 } as CSSProperties} pathLength={1} d="M7 12h6" />
            <path className={styles.docLine} style={{ "--i": 2 } as CSSProperties} pathLength={1} d="M7 14.5h6" />
          </svg>
        </span>
        <span className={styles.label}>
          View Resume<span className={styles.srOnly}> (PDF, opens in a new tab)</span>
        </span>
        <span className={styles.tag} aria-hidden="true">
          PDF
          <ArrowUpRight className={styles.tagArrow} />
        </span>
      </a>
    </div>
  );
}
