import Image from "next/image";
import Link from "next/link";
import styles from "./blueprint-projects.module.css";

const projects = [
  {
    number: "01",
    title: "Clothing Color Customizer",
    category: "Commerce interface · Component demo",
    challenge: "Let someone compare garment colors without losing the folds, texture, and protected details in the product photograph.",
    approach: "A prepared mask limits which pixels change. Cached shading data is recolored in the browser, while the front and back photos share the selected color.",
    proof: "Try swatches, a validated HEX value, front and back views, zoom, and reset. The source includes a typed recoloring hook and configurable product images.",
    boundary: "A reusable product preview; checkout and inventory are outside this demo.",
    tags: ["Canvas", "Typed props", "Image masks"],
    href: "/components/clothing-color-customizer",
    image: "/clothing-customizer/tee.webp",
    imageAlt: "Real white T-shirt photograph from the Clothing Color Customizer",
    imageClass: styles.teeImage,
    artworkClass: styles.teeArtwork,
  },
  {
    number: "02",
    title: "Globe Travel Explorer",
    category: "Travel interface · Component demo",
    challenge: "Connect a visual destination discovery flow to a practical trip request without making the interface feel like separate screens.",
    approach: "The globe, destination selection, and detail view share one stateful component. The trip form validates dates and exposes an async booking callback.",
    proof: "Explore destinations, navigate by keyboard, and enter dates and travelers. Reduced-motion artwork and responsive controls support different devices.",
    boundary: "The form previews a trip request until an application supplies a booking service through its callback.",
    tags: ["Stateful UI", "Form validation", "Responsive"],
    href: "/components/globe-travel-explorer",
    image: "/reference-travel/travelo-globe-still.webp",
    imageAlt: "Earth artwork from the Globe Travel Explorer",
    imageClass: styles.globeImage,
    artworkClass: styles.globeArtwork,
  },
] as const;

export function BlueprintProjects() {
  return (
    <section className={styles.section} aria-labelledby="blueprint-projects-heading">
      <div className={styles.sectionHeading}>
        <h2 id="blueprint-projects-heading">04 <span aria-hidden="true">—</span> Component Lab</h2>
        <p>Self-initiated component studies</p>
      </div>

      <p className={styles.sectionIntro}>
        Alongside product work, I build self-initiated component demos to explore specific interaction
        and implementation problems. Each one has a live preview and source you can inspect.
      </p>

      <div className={styles.projectGrid}>
        {projects.map((project) => (
          <article className={styles.project} key={project.number}>
            <div className={`${styles.artwork} ${project.artworkClass}`}>
              <span className={styles.artworkCrossTop} aria-hidden="true" />
              <Image
                src={project.image}
                alt={project.imageAlt}
                fill
                sizes="(max-width: 580px) 90vw, (max-width: 1100px) 38vw, 42vw"
                className={project.imageClass}
              />
              <span className={styles.artworkCrossBottom} aria-hidden="true" />
            </div>

            <div className={styles.projectContent}>
              <span className={styles.number}>{project.number}</span>
              <p className={styles.category}>{project.category}</p>
              <h3>{project.title}</h3>
              <dl className={styles.evidence}>
                <div><dt>Design challenge</dt><dd>{project.challenge}</dd></div>
                <div><dt>Implementation</dt><dd>{project.approach}</dd></div>
                <div><dt>Explore it</dt><dd>{project.proof}</dd></div>
              </dl>
              <p className={styles.boundary}>{project.boundary}</p>
              <ul className={styles.tags} aria-label={`${project.title} technical details`}>
                {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
              <Link className={styles.projectLink} href={project.href}>
                Open live demo and source <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
