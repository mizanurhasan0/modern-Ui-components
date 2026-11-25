"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { caseStudies } from "@/lib/case-studies";
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
};

/** Which three screenshots (front, back-right, back-left) represent each case study. */
const SCREEN_PICKS: Readonly<Record<string, readonly number[]>> = {
  "sales-crm": [1, 5, 4],
  "multi-vendor-marketplace": [0, 2, 3],
  cartpos: [5, 3, 1],
  workgrid: [1, 6, 2],
};

const startYear = (project: Project) => Number(project.year ?? 0);

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
    };
  })
  .sort((a, b) => startYear(b) - startYear(a))
  .map((project, index) => ({ ...project, number: String(index + 1).padStart(2, "0") }));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
 * "Latest projects": a numbered project index and the selected project's facts on the left, and its real screens on
 * the right as a stack of browser windows. On a mouse the stack follows the pointer with eased, depth-based parallax,
 * a slight 3D tilt and a glare, and the "Open" bubble trails the cursor. Touch and reduced-motion users get the
 * still composition.
 */
export function ProjectsShowcase() {
  const [active, setActive] = useState(0);
  // Images mount when a project is first selected (or its tab is hovered/focused) so unused screens are never fetched.
  const [loaded, setLoaded] = useState<readonly number[]>([0]);
  // Per project: which screen sits in each slot (slot 0 is the front window). Clicking a back screen swaps it with the front one.
  const [orders, setOrders] = useState<Readonly<Record<string, readonly number[]>>>({});
  const stageRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const orderOf = (item: Project) => orders[item.slug] ?? item.screens.map((_, index) => index);

  function bringToFront(item: Project, screenIndex: number) {
    const current = orderOf(item);
    const slot = current.indexOf(screenIndex);
    if (slot <= 0) return;
    const next = [...current];
    [next[0], next[slot]] = [next[slot], next[0]];
    setOrders((all) => ({ ...all, [item.slug]: next }));
  }

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

  // Pointer parallax: the pointer sets a target, a rAF loop eases the current values toward it and writes CSS variables.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (reduced.matches || !finePointer.matches) return;

    const target = { x: 0, y: 0, bx: 0, by: 0, glare: 0 };
    const current = { x: 0, y: 0, bx: 0, by: 0, glare: 0 };
    let frame = 0;
    let hovering = false;

    function render() {
      frame = 0;
      for (const key of ["x", "y", "bx", "by", "glare"] as const) {
        current[key] += (target[key] - current[key]) * 0.085;
      }
      stage!.style.setProperty("--mx", current.x.toFixed(4));
      stage!.style.setProperty("--my", current.y.toFixed(4));
      stage!.style.setProperty("--bx", `${current.bx.toFixed(2)}px`);
      stage!.style.setProperty("--by", `${current.by.toFixed(2)}px`);
      stage!.style.setProperty("--glare", current.glare.toFixed(3));
      const settled = (["x", "y", "bx", "by", "glare"] as const).every((key) => Math.abs(target[key] - current[key]) < 0.002);
      if (hovering || !settled) frame = requestAnimationFrame(render);
    }

    function start() {
      if (!frame) frame = requestAnimationFrame(render);
    }

    function onMove(event: PointerEvent) {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      const rect = stage!.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      hovering = true;
      target.x = clamp((px / rect.width) * 2 - 1, -1, 1);
      target.y = clamp((py / rect.height) * 2 - 1, -1, 1);
      target.glare = 1;
      // The "Open" bubble trails the cursor from its resting corner (offsets are relative to that corner).
      const restX = rect.width - 48 - 46;
      const restY = rect.height - 84 - 46;
      target.bx = clamp(px + 56, 56, rect.width - 56) - restX;
      target.by = clamp(py + 56, 56, rect.height - 56) - restY;
      stage!.style.setProperty("--gx", `${((px / rect.width) * 100).toFixed(1)}%`);
      stage!.style.setProperty("--gy", `${((py / rect.height) * 100).toFixed(1)}%`);
      stage!.dataset.hover = "true";
      start();
    }

    function onLeave() {
      hovering = false;
      target.x = 0;
      target.y = 0;
      target.bx = 0;
      target.by = 0;
      target.glare = 0;
      delete stage!.dataset.hover;
      start();
    }

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const project = PROJECTS[active];

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

        <section key={project.slug} className={styles.now} aria-live="polite" aria-label="Selected project">
          <h3 className={styles.nowTitle}>{project.title}</h3>
          <p className={styles.nowSummary}>{project.summary}</p>
          <dl className={styles.meta}>
            <dt>ROLE</dt>
            <dd>{project.role}</dd>
            {project.period ? (
              <>
                <dt>PERIOD</dt>
                <dd>{project.period}</dd>
              </>
            ) : null}
          </dl>
          <ul className={styles.chips} aria-label="Stack">
            {project.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
          <Link href={`/work/${project.slug}`} className={styles.cta}>
            Read case study
            <span className={styles.srOnly}> for {project.title}</span>
            <span className={styles.ctaArrow} aria-hidden="true">
              <ArrowIcon />
            </span>
          </Link>
        </section>
      </div>

      <div ref={stageRef} className={styles.stage} data-cursor-knight-hide>
        <div className={styles.counter}>
          <span aria-hidden="true">
            {String(active + 1).padStart(2, "0")} / {String(PROJECTS.length).padStart(2, "0")}
          </span>
          <button type="button" className={styles.step} onClick={() => step(-1)} aria-label="Previous project">
            <StepIcon direction="prev" />
          </button>
          <button type="button" className={styles.step} onClick={() => step(1)} aria-label="Next project">
            <StepIcon direction="next" />
          </button>
        </div>

        <div className={styles.tilt}>
          {PROJECTS.map((item, index) =>
            loaded.includes(index) ? (
              <div key={item.slug} className={styles.set} data-active={index === active} aria-hidden={index !== active}>
                {item.screens.map((screen, screenIndex) => {
                  const slot = orderOf(item).indexOf(screenIndex);
                  return (
                  <div key={screen.src} className={styles.layer} data-slot={slot}>
                    <figure className={styles.win} style={{ transitionDelay: index === active ? `${screenIndex * 70}ms` : "0ms" }}>
                      <div className={styles.bar} aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <span>{screen.caption.toLowerCase()}</span>
                      </div>
                      <Image
                        src={screen.src}
                        alt={screen.alt}
                        width={1448}
                        height={1086}
                        sizes="(min-width: 1024px) 52vw, 92vw"
                        className={styles.shot}
                        draggable={false}
                      />
                      {slot > 0 && index === active ? (
                        <button
                          type="button"
                          className={styles.hit}
                          onClick={() => bringToFront(item, screenIndex)}
                          aria-label={`Bring ${screen.caption} to the front`}
                        />
                      ) : null}
                    </figure>
                  </div>
                  );
                })}
              </div>
            ) : null,
          )}
        </div>

        <ol className={styles.caps} key={`caps-${project.slug}`} aria-label="Screens">
          {orderOf(project).map((screenIndex, slot) => (
            <li key={project.screens[screenIndex].src}>
              <b>{slot === 0 ? `${project.number}.1` : ""}</b>
              {project.screens[screenIndex].caption}
            </li>
          ))}
        </ol>

        <Link href={`/work/${project.slug}`} className={styles.bubble} tabIndex={-1} aria-hidden="true">
          <span className={styles.bubbleFace}>Open ↗</span>
        </Link>
      </div>
    </div>
  );
}
