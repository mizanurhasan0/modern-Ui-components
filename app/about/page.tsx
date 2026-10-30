import type { Metadata } from "next";
import { BlueprintDiagram } from "@/components/site/about/blueprint-diagram";
import { BlueprintHero } from "@/components/site/about/blueprint-hero";
import { BlueprintProjects } from "@/components/site/about/blueprint-projects";
import { ProfessionalWork } from "@/components/site/about/professional-work";
import { CursorHelicopter } from "@/components/site/hero/cursor-helicopter";
import { JsonLd } from "@/components/site/json-ld";
import { components } from "@/lib/component-registry";
import { absoluteUrl, pageMetadata } from "@/lib/site";
import { breadcrumbList, graph, personId, websiteId } from "@/lib/structured-data";
import styles from "./about.module.css";

const aboutDescription =
  "Explore Mizanur Hasan’s SaaS and marketplace work, professional experience, and interactive React component studies.";

export const metadata: Metadata = pageMetadata({
  title: "About Mizanur Hasan",
  description: aboutDescription,
  path: "/about",
});

const aboutGraph = graph(
  {
    "@type": "ProfilePage",
    "@id": absoluteUrl("/about#profile"),
    url: absoluteUrl("/about"),
    name: "About Mizanur Hasan",
    description: aboutDescription,
    inLanguage: "en",
    isPartOf: { "@id": websiteId },
    mainEntity: { "@id": personId },
  },
  breadcrumbList([
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ]),
);

export default function AboutPage() {
  return (
    <main id="main-content" className={styles.page}>
      <JsonLd data={aboutGraph} />
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
