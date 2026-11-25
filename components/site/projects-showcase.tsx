"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { caseStudies } from "@/lib/case-studies";
import { siteUrl } from "@/lib/site";
import styles from "./projects-showcase.module.css";

type Screen = { src: string; alt: string; caption: string };

type Project = {
  slug: string;
  number: string;
  title: string;
  role: string;
  period: string | null;
  year: string | null;
  summary: string;
  tags: readonly string[];
  screens: readonly Screen[];
  /** The project's own case-study page captured at 375px wide (public/work/<slug>/mobile-page.jpg). */
  mobile: string;
};

/** Which screenshots (first is the one shown large) represent each case study. */
const SCREEN_PICKS: Readonly<Record<string, readonly number[]>> = {
  "sales-crm": [1, 5, 4],
  "multi-vendor-marketplace": [0, 2, 3],
  cartpos: [5, 3, 1],
  workgrid: [1, 6, 2],
};

const startYear = (project: Project) => Number(project.year ?? 0);
const siteHost = new URL(siteUrl).host;

/** Newest first by start year (ties keep case-study order), numbered by position so the index always reads 01, 02, 03... */
const PROJECTS: readonly Project[] = caseStudies
  .map((study) => {
    const shots: readonly Screen[] = study.screenshots;
    const picks = SCREEN_PICKS[study.slug] ?? [0, 1, 2];
    const period = "period" in study ? study.period : null;
    return {
      slug: study.slug,
      number: "",
      title: study.title,
      role: study.role,
      period,
      year: period?.match(/\d{4}/)?.[0] ?? null,
      summary: study.summary,
      tags: study.tags,
      screens: picks.map((index) => shots[index]).filter(Boolean),
      mobile: `/work/${study.slug}/mobile-page.jpg`,
    };
  })
  .sort((a, b) => startYear(b) - startYear(a))
  .map((project, index) => ({ ...project, number: String(index + 1).padStart(2, "0") }));

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3.5 10.5l7-7M4.6 3.5h5.9v5.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StepIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d={direction === "next" ? "M2.5 7h9M7.5 3l4 4-4 4" : "M11.5 7h-9M6.5 3l-4 4 4 4"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * "Latest projects": a numbered project index and the selected project's facts on the left, and on the right one
 * browser window that holds the project: its projects as tabs, its real screens (pick one from the strip), and
 * its own page at phone width floating in the corner. Nothing moves with the pointer.
 */
export function ProjectsShowcase() {
  const [active, setActive] = useState(0);
  // Images mount when a project is first selected (or its tab is hovered/focused) so unused screens are never fetched.
  const [loaded, setLoaded] = useState<readonly number[]>([0]);
  // Per project: which screen is shown large.
  const [shown, setShown] = useState<Readonly<Record<string, number>>>({});
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const warm = useCallback((index: number) => {
    setLoaded((current) => (current.includes(index) ? current : [...current, index]));
  }, []);

  const select = useCallback(
    (index: number) => {
      warm(index);
      setActive(index);
    },
    [warm],
  );

  const step = (delta: number) => select((active + delta + PROJECTS.length) % PROJECTS.length);

  function onTabKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const delta = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = (active + delta + PROJECTS.length) % PROJECTS.length;
    select(next);
    tabRefs.current[next]?.focus();
  }

  const project = PROJECTS[active];
  const shownIndex = shown[project.slug] ?? 0;

  return (
    <div className={styles.root} data-helicopter-pad="stage">
      <div className={styles.left}>
        <header className={styles.head}>
          <p className={styles.eyebrow} aria-hidden="true">
            ls ./projects
          </p>
          <h2 id="selected-work-heading" className={styles.title}>
            Latest projects
          </h2>
        </header>

        <ul className={styles.index} aria-label="Projects" onKeyDown={onTabKeyDown}>
          {PROJECTS.map((item, index) => (
            <li key={item.slug}>
              <button
                type="button"
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                className={styles.tab}
                aria-pressed={index === active}
                onClick={() => select(index)}
                onPointerEnter={() => warm(index)}
                onFocus={() => warm(index)}
              >
                <span className={styles.tabNum}>{item.number}</span>
                <span>{item.title}</span>
                {item.year ? <span className={styles.tabYear}>{item.year}</span> : null}
              </button>
            </li>
          ))}
        </ul>

        {/* Every project's details sit in the same grid cell and only the active one shows, so the cell is as tall as the
            tallest project and the section never changes height when the project does. */}
        <div className={styles.nowStack} aria-live="polite">
          {PROJECTS.map((item, index) => (
            <section
              key={item.slug}
              className={styles.now}
              data-active={index === active}
              aria-hidden={index !== active}
              inert={index !== active}
              aria-label={`${item.title} details`}
            >
              <h3 className={styles.nowTitle}>{item.title}</h3>
              <p className={styles.nowSummary}>{item.summary}</p>
              <dl className={styles.meta}>
                <dt>ROLE</dt>
                <dd>{item.role}</dd>
                {item.period ? (
                  <>
                    <dt>PERIOD</dt>
                    <dd>{item.period}</dd>
                  </>
                ) : null}
              </dl>
              <ul className={styles.chips} aria-label="Stack">
                {item.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              <Link href={`/work/${item.slug}`} className={styles.cta}>
                Read case study
                <span className={styles.srOnly}> for {item.title}</span>
                <span className={styles.ctaArrow} aria-hidden="true">
                  <ArrowIcon />
                </span>
              </Link>
            </section>
          ))}
        </div>
      </div>

      <div className={styles.stage} data-cursor-knight-hide>
        <div className={styles.browser}>
          <div className={styles.chrome}>
            <div className={styles.dots} aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <div className={styles.tabs}>
              {PROJECTS.map((item, index) => (
                <button
                  key={item.slug}
                  type="button"
                  className={styles.chromeTab}
                  aria-pressed={index === active}
                  onClick={() => select(index)}
                  onPointerEnter={() => warm(index)}
                  onFocus={() => warm(index)}
                >
                  <i aria-hidden="true" />
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.urlbar}>
            <span className={styles.navIcons} aria-hidden="true">
              ‹ › ↻
            </span>
            <span className={styles.address}>
              {siteHost}/work/<b>{project.slug}</b>
            </span>
            <span className={styles.counter}>
              <span aria-hidden="true">
                {String(active + 1).padStart(2, "0")} / {String(PROJECTS.length).padStart(2, "0")}
              </span>
              <button type="button" className={styles.step} onClick={() => step(-1)} aria-label="Previous project">
                <StepIcon direction="prev" />
              </button>
              <button type="button" className={styles.step} onClick={() => step(1)} aria-label="Next project">
                <StepIcon direction="next" />
              </button>
            </span>
          </div>

          <div className={styles.page}>
            {PROJECTS.map((item, index) =>
              loaded.includes(index) ? (
                <div key={item.slug} className={styles.set} data-active={index === active} aria-hidden={index !== active}>
                  <div className={styles.view}>
                    {item.screens.map((screen, screenIndex) => (
                      <Image
                        key={screen.src}
                        src={screen.src}
                        alt={screen.alt}
                        fill
                        sizes="(min-width: 1024px) 52vw, 92vw"
                        className={styles.shot}
                        data-selected={screenIndex === (shown[item.slug] ?? 0)}
                        draggable={false}
                      />
                    ))}
                  </div>
                  <figure className={styles.pip}>
                    <figcaption className={styles.pipLabel}>Mobile · 375px</figcaption>
                    <div className={styles.phone}>
                      <div className={styles.phoneScreen}>
                        <Image src={item.mobile} alt={`The ${item.title} case study page at phone width`} width={750} height={1624} sizes="200px" />
                      </div>
                    </div>
                  </figure>
                </div>
              ) : null,
            )}

            <ol key={`thumbs-${project.slug}`} className={styles.thumbs} aria-label="Screens">
              {project.screens.map((screen, screenIndex) => (
                <li key={screen.src}>
                  <button
                    type="button"
                    className={styles.thumb}
                    aria-pressed={screenIndex === shownIndex}
                    onClick={() => setShown((all) => ({ ...all, [project.slug]: screenIndex }))}
                  >
                    <span className={styles.thumbImage}>
                      <Image src={screen.src} alt="" fill sizes="160px" />
                    </span>
                    <span className={styles.thumbCaption}>
                      {project.number}.{screenIndex + 1} {screen.caption}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>

      </div>
    </div>
  );
}
