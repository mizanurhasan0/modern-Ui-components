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
          Explore Components <span aria-hidden="true">⟶</span>
        </Link>
        <Link href="#blueprint-experiments" className={styles.secondaryAction}>
          View My Work <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <p className={styles.footnote}>
        Same curiosity. A brighter web. <span aria-hidden="true" />
      </p>
    </section>
  );
}
