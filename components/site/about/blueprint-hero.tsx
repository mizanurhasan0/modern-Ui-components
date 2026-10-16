import Link from "next/link";
import styles from "./blueprint-hero.module.css";

export function BlueprintHero() {
  return (
    <section className={styles.hero} aria-labelledby="blueprint-heading">
      <p className={styles.eyebrow}>01 <span aria-hidden="true">—</span> About</p>

      <h1 id="blueprint-heading" className={styles.heading}>
        <span>Built with <em>curiosity.</em></span>
        <span>Refined with <em>care.</em></span>
      </h1>

      <p className={styles.intro}>
        Hi, I’m Mizanur Hasan — a frontend developer with 3+ years of
        experience, focused on React, Next.js, and the art of building
        thoughtful user interfaces. Component Lab is my space to explore,
        experiment, and share interactive components that make the web a little
        more delightful.
      </p>

      <div className={styles.actions}>
        <Link href="/#collection" className={styles.primaryAction}>
          <span>Explore Components</span>
          <span className={styles.actionIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="M4.5 12h14m-5.5-5.5L18.5 12 13 17.5" /></svg>
          </span>
        </Link>
        <Link href="#blueprint-experiments" className={styles.secondaryAction}>
          <span>View My Work</span>
          <span className={styles.actionIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="M5.5 18.5 18 6m-10.5 0H18v10.5" /></svg>
          </span>
        </Link>
      </div>

      <p className={styles.footnote}>
        Same curiosity. A brighter web. <span aria-hidden="true" />
      </p>
    </section>
  );
}
