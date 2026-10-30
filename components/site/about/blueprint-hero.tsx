import Link from "next/link";
import { contactHref } from "@/lib/portfolio-profile";
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
        Hi, I’m Mizanur Hasan — a full-stack developer with a frontend focus.
        I build SaaS admin and marketplace interfaces, from realtime CRM workflows
        to storefronts and the services behind them. Component Lab is where I share
        smaller interaction studies and reusable React and Next.js code.
      </p>

      <div className={styles.actions}>
        <a href={contactHref} className={styles.primaryAction}>
          <span>Email me</span>
          <span className={styles.actionIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="M4.5 12h14m-5.5-5.5L18.5 12 13 17.5" /></svg>
          </span>
        </a>
        <Link href="#professional-work" className={styles.secondaryAction}>
          <span>View Experience</span>
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
