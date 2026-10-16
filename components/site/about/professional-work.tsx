import Link from "next/link";
import { caseStudies } from "@/lib/case-studies";
import styles from "./professional-work.module.css";

const roles = [
  {
    period: "2024 – Present",
    title: "Frontend Engineer",
    company: "Digital Pylot",
    detail: "Lead frontend work on LeadPylot CRM, including admin UI, API integrations, authentication, and realtime features.",
  },
  {
    period: "2022 – 2024",
    title: "Frontend / MERN Engineer",
    company: "Core Devs Ltd.",
    detail: "Built production Web3 interfaces with React and Next.js, working across shared frontend architecture and state management.",
  },
  {
    period: "2020 – 2022",
    title: "Software Engineer",
    company: "Anoware Medical Services",
    detail: "Developed healthcare operations modules and internal tools with React, Node.js, and PostgreSQL.",
  },
] as const;

export function ProfessionalWork() {
  return (
    <>
      <section id="professional-work" className={styles.work} aria-labelledby="professional-work-heading">
        <div className={styles.sectionHeading}>
          <h2 id="professional-work-heading">02 <span aria-hidden="true">—</span> Product Work</h2>
          <p>Frontend depth · Full-stack delivery</p>
        </div>
        <p className={styles.intro}>
          My strongest work lives in operational products: dense interfaces, realtime data, and the
          services behind them. Each case study describes what I owned and how the system was built.
        </p>
        <div className={styles.projectGrid}>
          {caseStudies.map((project) => (
            <article id={project.slug} className={`${styles.project} ${project.slug === "mypick" ? styles.marketplace : styles.crm}`} key={project.slug}>
              <div className={styles.projectHeading}>
                <div>
                  <span className={styles.number}>{project.number} / Product case study</span>
                  <h3>{project.title}</h3>
                  <p className={styles.role}>{project.role}</p>
                </div>
                <span className={styles.period}>{project.period}</span>
              </div>
              <p className={styles.summary}>{project.summary}</p>
              <dl className={styles.details}>
                <div><dt>The problem</dt><dd>{project.challenge}</dd></div>
                <div><dt>My contribution</dt><dd>{project.ownership}</dd></div>
              </dl>
              <p className={styles.availability}>{project.availability}</p>
              <ul className={styles.tags} aria-label={`${project.title} technologies`}>
                {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
              <Link href={`/work/${project.slug}`} className={styles.link}>
                Read the case study <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.career} aria-labelledby="career-heading">
        <div className={styles.sectionHeading}>
          <h2 id="career-heading">03 <span aria-hidden="true">—</span> Experience</h2>
          <p>Product teams and domains</p>
        </div>
        <ol className={styles.timeline}>
          {roles.map((role) => (
            <li key={role.company}>
              <span className={styles.timelinePeriod}>{role.period}</span>
              <div>
                <h3>{role.title}</h3>
                <p className={styles.company}>{role.company}</p>
                <p className={styles.timelineDetail}>{role.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
