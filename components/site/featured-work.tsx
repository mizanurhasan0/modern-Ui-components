import styles from "./featured-work.module.css";
import { ProjectsShowcase } from "./projects-showcase";

/**
 * "Selected work" home-page section. Server component: it only owns the landmark
 * (id, label, spacing) so the site header can keep linking to /#selected-work.
 * All interactive pieces live in the client-side projects showcase, which lists every case study.
 */
export function FeaturedWork() {
  return (
    <section
      id="selected-work"
      aria-labelledby="selected-work-heading"
      className={`${styles.section} site-container scroll-mt-28 pt-12 sm:pt-16`}
    >
      <ProjectsShowcase />
    </section>
  );
}
