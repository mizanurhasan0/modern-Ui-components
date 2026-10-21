import { DeskShowcase } from "./desk/desk-showcase";
import styles from "./featured-work.module.css";

/**
 * "Selected work" home-page section. Server component: it only owns the landmark
 * (id, label, spacing) so the site header can keep linking to /#selected-work.
 * All interactive pieces live in the client-side desk showcase.
 */
export function FeaturedWork() {
  return (
    <section
      id="selected-work"
      aria-labelledby="selected-work-heading"
      className={`${styles.section} site-container scroll-mt-28 pt-12 sm:pt-16`}
    >
      <DeskShowcase />
    </section>
  );
}
