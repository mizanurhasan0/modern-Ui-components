import type { Metadata } from "next";
import { BlueprintDiagram } from "@/components/site/about/blueprint-diagram";
import { BlueprintHero } from "@/components/site/about/blueprint-hero";
import { BlueprintProjects } from "@/components/site/about/blueprint-projects";
import { ProfessionalWork } from "@/components/site/about/professional-work";
import { CursorHelicopter } from "@/components/site/hero/cursor-helicopter";
import { components } from "@/lib/component-registry";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About Mizanur Hasan",
  description: "Explore Mizanur Hasan’s SaaS and marketplace work, professional experience, and interactive React component studies.",
  openGraph: {
    title: "About Mizanur Hasan — Component Lab",
    description: "SaaS and marketplace product work, professional experience, and interactive component studies.",
    type: "website",
  },
};

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
        <ProfessionalWork />
        <div id="blueprint-experiments" className={styles.experiments}>
          <BlueprintProjects />
        </div>
      </div>
      <CursorHelicopter componentCount={components.length} />
    </main>
  );
}
