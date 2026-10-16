import Image from "next/image";
import Link from "next/link";
import hasanDesk from "@/components/site/assets/hasan-desk.webp";
import styles from "./blueprint-diagram.module.css";

export function BlueprintDiagram() {
  return (
    <div className={styles.diagram} aria-label="A three-stage blueprint showing an idea become a finished component">
      <span className={`${styles.registration} ${styles.registrationTopLeft}`} aria-hidden="true" />
      <span className={`${styles.registration} ${styles.registrationTopRight}`} aria-hidden="true" />
      <span className={`${styles.registration} ${styles.registrationBottomLeft}`} aria-hidden="true" />
      <span className={`${styles.registration} ${styles.registrationBottomRight}`} aria-hidden="true" />

      <ol className={styles.stages}>
        <li className={styles.stage}>
          <div className={styles.stageHeader}>
            <strong>Idea</strong>
            <span>A simple concept</span>
          </div>
          <span className={styles.measure} aria-hidden="true">16 px</span>
          <div className={`${styles.panel} ${styles.ideaPanel}`} aria-hidden="true">
            <span className={styles.ideaCircle} />
            <span className={`${styles.ideaLine} ${styles.ideaLineLong}`} />
            <span className={styles.ideaLine} />
            <span className={styles.ideaLine} />
            <span className={styles.ideaButton} />
          </div>
          <div className={styles.stageFooter}>
            <strong>1. Sketch</strong>
            <span>Turn ideas into structure.</span>
          </div>
        </li>

        <li className={styles.stage}>
          <div className={styles.stageHeader}>
            <strong>Wireframe</strong>
            <span>Structure &amp; layout</span>
          </div>
          <span className={styles.measure} aria-hidden="true">16 px</span>
          <div className={`${styles.panel} ${styles.wirePanel}`} aria-hidden="true">
            <div className={styles.browserBar}><i /><i /><i /></div>
            <div className={styles.wirePhoto}>
              <span className={styles.wireSun} />
              <span className={styles.wireMountains} />
            </div>
            <span className={`${styles.wireLine} ${styles.wireLineA}`} />
            <span className={`${styles.wireLine} ${styles.wireLineB}`} />
            <span className={`${styles.wireLine} ${styles.wireLineC}`} />
            <span className={styles.wireButton} />
          </div>
          <div className={styles.stageFooter}>
            <strong>2. Iterate</strong>
            <span>Add structure and behavior.</span>
          </div>
        </li>

        <li className={styles.stage}>
          <div className={styles.stageHeader}>
            <strong>Component</strong>
            <span>Interactive &amp; polished</span>
          </div>
          <span className={styles.measure} aria-hidden="true">16 px</span>
          <div className={`${styles.panel} ${styles.finishPanel}`}>
            <div className={styles.portraitWrap}>
              <Image
                src={hasanDesk}
                alt="Mizanur Hasan working at his desk"
                fill
                sizes="(max-width: 760px) 75vw, 18vw"
                className={styles.portrait}
                placeholder="blur"
              />
              <span className={styles.version} aria-hidden="true">v1.0</span>
            </div>
            <strong className={styles.finishTitle}>Meet the builder</strong>
            <p>A personal portfolio, built with care and curiosity.</p>
            <div className={styles.finishActions}>
              <Link href="/#collection" className={styles.finishLink} aria-label="Explore the component collection">
                Explore <span aria-hidden="true">→</span>
              </Link>
              <span className={styles.favorite} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M20.2 8.5c0 4.1-8.2 9.5-8.2 9.5s-8.2-5.4-8.2-9.5a4.4 4.4 0 0 1 8.2-2.1 4.4 4.4 0 0 1 8.2 2.1Z" /></svg>
              </span>
            </div>
          </div>
          <div className={styles.stageFooter}>
            <strong>3. Refine</strong>
            <span>Polish the details.</span>
          </div>
        </li>
      </ol>

      <div className={styles.annotations} aria-hidden="true">
        <span>Thoughtful<br />details</span>
        <span>Interactive<br />states</span>
        <span>Flexible &amp;<br />reusable</span>
        <span>Better components.<br />Brighter experiences.</span>
      </div>
    </div>
  );
}
