import type { Metadata } from "next";
import { BlueprintDiagram } from "@/components/site/about/blueprint-diagram";
import { BlueprintHero } from "@/components/site/about/blueprint-hero";
import { BlueprintProjects } from "@/components/site/about/blueprint-projects";
import { CursorHelicopter } from "@/components/site/hero/cursor-helicopter";
import { components } from "@/lib/component-registry";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About Mizanur Hasan | Component Lab",
  description: "Meet Mizanur Hasan and explore the ideas, process, and interactive components behind Component Lab.",
  openGraph: {
    title: "About Mizanur Hasan | Component Lab",
    description: "The developer, process, and experiments behind Component Lab.",
    type: "website",
  },
};

const process = [
  {
    number: "01", title: "Discover", subtitle: "Look closer",
    copy: "I observe real-world problems, explore UI patterns, and find opportunities to build something better.",
    icon: "compass",
  },
  {
    number: "02", title: "Build", subtitle: "Bring ideas to life",
    copy: "I experiment with React, Next.js and modern tools to turn concepts into working, interactive components.",
    icon: "code",
  },
  {
    number: "03", title: "Refine", subtitle: "Sweat the details",
    copy: "I iterate, polish, and make components more flexible, accessible, and enjoyable to use.",
    icon: "sliders",
  },
] as const;

function ProcessIcon({ kind }: { kind: (typeof process)[number]["icon"] }) {
  if (kind === "compass") {
    return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="20" cy="20" r="13" /><path d="m26 14-4.5 9-8 4 4-9 8.5-4Z" /></svg>;
  }
  if (kind === "code") {
    return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="m15 12-9 8 9 8m10-16 9 8-9 8m-3-20-4 24" /></svg>;
  }
  return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M7 11h26M7 20h26M7 29h26" /><circle cx="17" cy="11" r="3" fill="white" /><circle cx="26" cy="20" r="3" fill="white" /><circle cx="14" cy="29" r="3" fill="white" /></svg>;
}

export default function AboutPage() {
  return (
    <main id="main-content" className={styles.page}>
      <div className={styles.heroBand}>
        <div className={styles.container}>
          <div className={styles.introduction}>
            <BlueprintHero />
            <BlueprintDiagram />
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <section className={styles.process} aria-labelledby="blueprint-process-heading">
          <div className={styles.sectionHeading}>
            <h2 id="blueprint-process-heading">02 <span aria-hidden="true">—</span> My Process</h2>
            <p>Ideas <span aria-hidden="true">→</span> Experiments <span aria-hidden="true">→</span> Better Interfaces</p>
          </div>
          <div className={styles.processGrid}>
            {process.map((step) => (
              <article className={styles.step} key={step.number}>
                <span className={styles.stepNumber} aria-hidden="true">{step.number}</span>
                <div className={styles.stepBody}>
                  <div className={styles.stepTitleRow}>
                    <div>
                      <h3>{step.title}</h3>
                      <p className={styles.stepSubtitle}>{step.subtitle}</p>
                    </div>
                    <span className={styles.stepIcon}><ProcessIcon kind={step.icon} /></span>
                  </div>
                  <p className={styles.stepCopy}>{step.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <div id="blueprint-experiments" className={styles.experiments}>
          <BlueprintProjects />
        </div>
      </div>
      <CursorHelicopter componentCount={components.length} />
    </main>
  );
}
