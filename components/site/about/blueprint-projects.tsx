import Image from "next/image";
import Link from "next/link";
import styles from "./blueprint-projects.module.css";

const projects = [
  {
    number: "01",
    title: "Clothing Color Customizer",
    description:
      "A photographic color studio with instant recoloring, front and back views, and fabric details that stay intact.",
    tags: ["REACT", "COMMERCE", "INTERACTION"],
    href: "/components/clothing-color-customizer",
    image: "/clothing-customizer/tee.webp",
    imageAlt: "Real white T-shirt photograph from the Clothing Color Customizer",
    imageClass: styles.teeImage,
    artworkClass: styles.teeArtwork,
  },
  {
    number: "02",
    title: "Globe Travel Explorer",
    description:
      "An interactive journey from a rotating Earth to scenic destinations and a working trip form.",
    tags: ["NEXT.JS", "MOTION", "TRAVEL"],
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
        <h2 id="blueprint-projects-heading">03 <span aria-hidden="true">—</span> Featured Experiments</h2>
        <p>Small experiments. Bigger possibilities.</p>
      </div>

      <div className={styles.projectGrid}>
        {projects.map((project) => (
          <article className={styles.project} key={project.number}>
            <div className={`${styles.artwork} ${project.artworkClass}`}>
              <span className={styles.artworkCrossTop} aria-hidden="true" />
              <Image
                src={project.image}
                alt={project.imageAlt}
                fill
                sizes="(max-width: 700px) 80vw, (max-width: 1100px) 35vw, 20vw"
                className={project.imageClass}
              />
              <span className={styles.artworkCrossBottom} aria-hidden="true" />
            </div>

            <div className={styles.projectContent}>
              <span className={styles.number}>{project.number}</span>
              <h3>{project.title}</h3>
              <p className={styles.description}>{project.description}</p>
              <ul className={styles.tags} aria-label={`${project.title} features`}>
                {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
              <Link className={styles.projectLink} href={project.href}>
                View Experiment <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
