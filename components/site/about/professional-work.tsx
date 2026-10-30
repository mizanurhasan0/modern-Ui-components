import styles from "./professional-work.module.css";

const roles = [
  {
    period: "2024 – Present",
    title: "Frontend Engineer",
    company: "Product team",
    detail: "Lead frontend work on a sales CRM workspace, including admin UI, API integrations, authentication, and realtime features.",
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
      <section id="professional-work" className={styles.career} aria-labelledby="career-heading">
        <div className={styles.sectionHeading}>
          <h2 id="career-heading">02 <span aria-hidden="true">—</span> Experience</h2>
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
