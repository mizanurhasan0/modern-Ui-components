"use client";

import { useEffect, useState } from "react";
import styles from "./cursor-helicopter.module.css";

type Props = { title?: string; text: string; category?: string; talking: boolean };

/** Mounted once per explanation so moving inside the same card never restarts it. */
export function GuideSpeech({ title, text, category, talking }: Props) {
  const [count, setCount] = useState(0);
  const characters = Array.from(text);
  const complete = count >= characters.length;
  const thinking = count === 0;

  useEffect(() => {
    let timer = 0;
    let position = 0;
    const letters = Array.from(text);
    const advance = () => {
      position += 1;
      setCount(position);
      if (position >= letters.length) return;
      const letter = letters[position - 1];
      const pause = /[.!?]/.test(letter) ? 160 : /[,;:]/.test(letter) ? 65 : 22;
      timer = window.setTimeout(advance, pause);
    };
    timer = window.setTimeout(advance, 350);
    return () => window.clearTimeout(timer);
  }, [text]);

  return (
    <div className={styles.guide} data-typing={!complete} data-thinking={thinking}>
      <span className={styles.eyebrow}>
        <span className={styles.wave}><i /><i /><i /><i /></span>
        {category ?? "Your co-pilot"}
        <span className={styles.status}>{thinking ? "A little thought…" : !complete ? "Typing…" : talking ? "Explaining" : "Ready to explore"}</span>
      </span>
      {title && <strong className={styles.title}>{title}</strong>}
      <span className={`${styles.description} ${styles.typedText}`}>
        <span className={styles.measureText}>{text}</span>
        <span className={styles.typedOverlay}>
          {thinking ? <span className={styles.thinkingDots}><i /><i /><i /></span> : characters.slice(0, count).join("")}
          {!thinking && !complete && <i className={styles.typingCaret} />}
        </span>
      </span>
      {title && (
        <>
          <span className={styles.typingProgress}><i style={{ transform: `scaleX(${Math.min(count / Math.max(characters.length, 1), 1)})` }} /></span>
          <span className={styles.hint}>Click the card to explore <span>↗</span></span>
        </>
      )}
    </div>
  );
}
