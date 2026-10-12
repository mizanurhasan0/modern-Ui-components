"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { ComponentStyles } from "./component-styles";

export interface LiquidCursorProject {
  id: string;
  title: string;
  discipline: string;
  description: string;
}

export interface LiquidCursorProps {
  brand?: string;
  headline?: readonly string[];
  projects?: readonly LiquidCursorProject[];
  onProjectSelect?: (project: LiquidCursorProject) => void;
  onContact?: () => void;
  className?: string;
}

const DEFAULT_PROJECTS: readonly LiquidCursorProject[] = [
  {
    id: "astral",
    title: "Astral Interface",
    discipline: "INTERFACE / EXPERIMENT 01",
    description:
      "An exploration of spatial interfaces, orbiting forms, and movement that responds to you.",
  },
  {
    id: "neural",
    title: "Neural Dynamics",
    discipline: "MOTION / EXPERIMENT 02",
    description:
      "Connected shapes become a living system. Each small interaction sends a ripple through the whole.",
  },
  {
    id: "kinetic",
    title: "Kinetic Typography",
    discipline: "TYPE / EXPERIMENT 03",
    description:
      "Letters become gestures. An expressive study of rhythm, scale, and typography in motion.",
  },
];
const DEFAULT_HEADLINE = ["Crafting fluid", "Digital motion", "Experiences"];
type StudioPanel = "about" | "updates" | "contact" | LiquidCursorProject | null;
type Point = { x: number; y: number };

/** Keep all cursor work local to the preview and outside React's render loop. */
function useLiquidPointer(
  rootRef: RefObject<HTMLDivElement | null>,
  artworkRef: RefObject<SVGSVGElement | null>,
) {
  useEffect(() => {
    const root = rootRef.current;
    const artwork = artworkRef.current;
    if (!root || !artwork) return;
    const droplets = [
      ...artwork.querySelectorAll<SVGCircleElement>(".lc-droplet"),
    ];
    const pill = artwork.querySelector<SVGRectElement>(".lc-pointer-pill");
    if (!pill) return;
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const points: Point[] = droplets.map(() => ({ x: 0, y: 0 }));
    const target: Point = { x: 0, y: 0 };
    const velocity: Point = { x: 0, y: 0 };
    const hover = { width: 0, height: 0 };
    const shape = { width: 0, height: 0 };
    let bounds = root.getBoundingClientRect();
    let frame = 0;
    let lastTime = 0;
    let inside = false;
    let visible = true;
    let hovered: HTMLElement | null = null;
    const enabled = () =>
      finePointer.matches &&
      !reducedMotion.matches &&
      visible &&
      !document.hidden;

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      artwork!.style.opacity = "0";
      root!.dataset.cursorActive = "false";
    }

    function paint(time: number) {
      frame = 0;
      if (!inside || !enabled()) {
        stop();
        return;
      }
      const step = lastTime
        ? Math.min(2, Math.max(0.5, (time - lastTime) / 16.67))
        : 1;
      lastTime = time;
      velocity.x =
        (velocity.x + (target.x - points[0].x) * 0.17 * step) *
        Math.pow(0.7, step);
      velocity.y =
        (velocity.y + (target.y - points[0].y) * 0.17 * step) *
        Math.pow(0.7, step);
      points[0].x += velocity.x * step;
      points[0].y += velocity.y * step;
      const ease = 1 - Math.pow(0.72, step);
      shape.width += (hover.width - shape.width) * ease;
      shape.height += (hover.height - shape.height) * ease;
      let unsettled =
        Math.abs(target.x - points[0].x) +
        Math.abs(target.y - points[0].y) +
        Math.abs(hover.width - shape.width) +
        Math.abs(hover.height - shape.height);
      const base = Math.max(15, Math.min(23, bounds.width * 0.03));
      for (let index = 0; index < points.length; index += 1) {
        if (index > 0) {
          points[index].x += (points[index - 1].x - points[index].x) * ease;
          points[index].y += (points[index - 1].y - points[index].y) * ease;
          unsettled +=
            Math.abs(points[index - 1].x - points[index].x) +
            Math.abs(points[index - 1].y - points[index].y);
        }
        droplets[index].setAttribute("cx", String(points[index].x));
        droplets[index].setAttribute("cy", String(points[index].y));
        const taper = 1 - index / points.length;
        const radius =
          base * taper * taper +
          Math.min(7, Math.hypot(velocity.x, velocity.y) * 0.12) * taper;
        droplets[index].setAttribute(
          "r",
          String(radius * (index === 0 && hover.width ? 0.45 : 1)),
        );
      }
      pill!.setAttribute("x", String(points[0].x - shape.width / 2));
      pill!.setAttribute("y", String(points[0].y - shape.height / 2));
      pill!.setAttribute("width", String(shape.width));
      pill!.setAttribute("height", String(shape.height));
      pill!.setAttribute("rx", String(shape.height / 2));
      artwork!.style.opacity = "1";
      root!.dataset.cursorActive = "true";
      if (unsettled > 0.2 || Math.hypot(velocity.x, velocity.y) > 0.05)
        frame = requestAnimationFrame(paint);
      else lastTime = 0;
    }

    function schedule() {
      if (inside && enabled() && !frame) frame = requestAnimationFrame(paint);
    }
    function move(event: PointerEvent) {
      if (event.pointerType === "touch" || !enabled()) return;
      bounds = root!.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      if (!inside) {
        points.forEach((point) => {
          point.x = x;
          point.y = y;
        });
        velocity.x = 0;
        velocity.y = 0;
      }
      inside = true;
      hovered =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>("[data-lc-liquid]")
          : null;
      if (hovered && !hovered.matches(":disabled")) {
        const rectangle = hovered.getBoundingClientRect();
        target.x = rectangle.left - bounds.left + rectangle.width / 2;
        target.y = rectangle.top - bounds.top + rectangle.height / 2;
        hover.width = rectangle.width + 12;
        hover.height = rectangle.height + 4;
      } else {
        target.x = x;
        target.y = y;
        hover.width = 0;
        hover.height = 0;
      }
      schedule();
    }
    function leave() {
      inside = false;
      hovered = null;
      hover.width = 0;
      hover.height = 0;
      shape.width = 0;
      shape.height = 0;
      stop();
    }
    function preferenceChange() {
      if (!enabled()) leave();
    }
    function resize() {
      bounds = root!.getBoundingClientRect();
      artwork!.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
      if (hovered) {
        const rectangle = hovered.getBoundingClientRect();
        target.x = rectangle.left - bounds.left + rectangle.width / 2;
        target.y = rectangle.top - bounds.top + rectangle.height / 2;
      }
      schedule();
    }
    function scrolling() {
      hovered = null;
      hover.width = 0;
      hover.height = 0;
      schedule();
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) leave();
    });
    intersectionObserver.observe(root);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    root.addEventListener("pointercancel", leave);
    root.addEventListener("scroll", scrolling, true);
    finePointer.addEventListener("change", preferenceChange);
    reducedMotion.addEventListener("change", preferenceChange);
    document.addEventListener("visibilitychange", preferenceChange);
    resize();
    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("pointercancel", leave);
      root.removeEventListener("scroll", scrolling, true);
      finePointer.removeEventListener("change", preferenceChange);
      reducedMotion.removeEventListener("change", preferenceChange);
      document.removeEventListener("visibilitychange", preferenceChange);
    };
  }, [rootRef, artworkRef]);
}

/*
 * Shared Tailwind class lists. Each is a complete static literal so Tailwind
 * can scan it; `@max-[540px]:` targets the component's own inline-size container.
 */
const NAV_TEXT =
  "rounded-[999px] border-none bg-transparent leading-[1.1] font-black tracking-[.005em] whitespace-nowrap uppercase";
const NAV_BUTTON = `${NAV_TEXT} px-[3px] py-[7px] text-[clamp(9px,1.5cqw,13px)]`;
const HEADER = "absolute inset-x-0 top-0 z-[3] [transition:color_.25s]";
const PAGE =
  "relative grid h-full min-h-full grid-cols-1 place-items-center snap-start snap-always";
const HERO_PAGE = "bg-white";
const WORK_PAGE =
  "bg-[#080808] bg-[linear-gradient(#ffffff02_1px,transparent_1px),linear-gradient(90deg,#ffffff02_1px,transparent_1px)] bg-size-[36px_36px] text-white";
const DISPLAY_TYPE =
  "m-0 font-[Arial_Black,Arial,Helvetica,sans-serif] font-[950] uppercase";
const HEADLINE = `${DISPLAY_TYPE} w-full min-w-0 text-center leading-[.84] @max-[540px]:leading-[.9]`;
const HEADLINE_LINE =
  "relative left-1/2 block w-max min-w-full -translate-x-1/2 whitespace-nowrap";
const SCROLL_CUE =
  "absolute left-1/2 -translate-x-1/2 rounded-[999px] border-none bg-transparent font-bold whitespace-nowrap uppercase";
const PROJECT_LAYOUT = "grid w-full grid-cols-[.95fr_1.05fr] items-center";
const WORK_TITLE = `${DISPLAY_TYPE} leading-[.88] tracking-[-.065em]`;
const PROJECT =
  "flex w-max max-w-full items-center rounded-[999px] border-none bg-transparent text-left leading-[1.05] font-extrabold tracking-[-.04em] uppercase";
const PROJECT_NUMBER =
  "shrink-0 font-[monospace] font-medium tracking-[0] text-[#777]";
const EYEBROW =
  "mx-0 mt-0 mb-7 text-[9px] font-bold tracking-[.15em] text-[#787878] @max-[540px]:mb-[22px]";
const PANEL_TITLE =
  "mx-0 mt-0 mb-6 font-[Arial_Black,Arial,sans-serif] text-[clamp(28px,6.5cqw,62px)] leading-[.95] font-[950] tracking-[-.065em] uppercase";
const PANEL_DESCRIPTION =
  "m-0 max-w-[410px] text-[14px] leading-[1.7] text-[#666] @max-[540px]:text-[12px]";
const UPDATE_ITEM =
  "flex gap-[18px] border-t border-t-[#e9e9e9] py-[18px] text-[13px] font-bold";
const UPDATE_NUMBER = "pt-[3px] [font:9px_monospace] text-[#999]";
const ART_RING =
  "absolute top-9 left-[calc(50%-82px)] size-[165px] scale-x-40 rounded-[50%] border";
const ART_NEURAL =
  "bg-[radial-gradient(ellipse_at_20%_90%,#496270,#0c1417_65%)] text-white";
const ART_KINETIC = "bg-[#e7ff55] text-[#050505]";
const ART_DEFAULT = "bg-[#111] text-white";

/** A complete two-section studio concept with a contained liquid cursor. */
export default function LiquidCursor({
  brand = "PIXELFLOW",
  headline = DEFAULT_HEADLINE,
  projects = DEFAULT_PROJECTS,
  onProjectSelect,
  onContact,
  className = "",
}: LiquidCursorProps) {
  const root = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const artwork = useRef<SVGSVGElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [dark, setDark] = useState(false);
  const [panel, setPanel] = useState<StudioPanel>(null);
  const id = useId().replace(/:/g, "");
  useLiquidPointer(root, artwork);

  useEffect(() => {
    if (panel)
      dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    else trigger.current?.focus();
  }, [panel]);

  function goTo(section: number) {
    const viewport = scroll.current;
    if (!viewport) return;
    viewport.scrollTo({
      top: viewport.clientHeight * section,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  function open(next: Exclude<StudioPanel, null>, source: HTMLElement) {
    trigger.current = source;
    setPanel(next);
  }
  function close() {
    setPanel(null);
  }
  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
    if (event.key !== "Tab") return;
    const controls = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        "button, a[href], input, [tabindex='0']",
      ),
    ];
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  const navButton = `${NAV_BUTTON} @max-[540px]:text-[8px]`;
  const projectButton = `${PROJECT} gap-[23px] px-[7px] py-[11px] text-[3.15cqw] @max-[540px]:gap-[22px] @max-[540px]:px-1 @max-[540px]:py-[10px] @max-[540px]:text-[5.5cqw]`;
  const page = `${PAGE} px-6 pt-[100px] pb-[70px] @max-[540px]:px-[14px] @max-[540px]:pt-[95px] @max-[540px]:pb-[65px]`;
  const scrollCue = `${SCROLL_CUE} bottom-[22px] px-2 py-[7px] text-[clamp(8px,1.4cqw,11px)] tracking-[.16em]`;

  return (
    <div
      ref={root}
      className={`liquid-cursor @container relative isolate flex w-full min-w-0 flex-col overflow-hidden bg-white font-[Arial,Helvetica,sans-serif] text-[#050505] ${className}`}
      data-dark={dark}
    >
      <ComponentStyles css={LIQUID_STYLES} />
      <header
        className={`${HEADER} flex items-center justify-between gap-5 px-[25px] py-8 @max-[540px]:items-start @max-[540px]:gap-[15px] @max-[540px]:px-[14px] @max-[540px]:py-[21px] ${dark ? "text-white" : "text-[#050505]"}`}
        inert={Boolean(panel)}
      >
        <button
          className={`${NAV_BUTTON} @max-[540px]:text-[9px]`}
          type="button"
          onClick={() => goTo(0)}
          data-lc-liquid
        >
          {brand}
        </button>
        <nav
          className="flex items-center gap-[clamp(14px,4.1cqw,36px)] @max-[540px]:max-w-[245px] @max-[540px]:flex-wrap @max-[540px]:justify-end @max-[540px]:gap-[14px]"
          aria-label="Studio navigation"
        >
          <button
            className={navButton}
            type="button"
            onClick={() => goTo(1)}
            data-lc-liquid
          >
            Works
          </button>
          <button
            className={navButton}
            type="button"
            onClick={(event) => open("about", event.currentTarget)}
            data-lc-liquid
          >
            About
          </button>
          <button
            className={navButton}
            type="button"
            onClick={(event) => open("updates", event.currentTarget)}
            data-lc-liquid
          >
            Updates
          </button>
          <button
            className={navButton}
            type="button"
            onClick={(event) =>
              onContact ? onContact() : open("contact", event.currentTarget)
            }
            data-lc-liquid
          >
            Start a project
          </button>
        </nav>
      </header>
      <div
        ref={scroll}
        className="lc-scroll h-[clamp(440px,80cqw,680px)] flex-[1_0_auto] snap-y snap-mandatory overflow-x-hidden overflow-y-auto overscroll-y-contain [scrollbar-width:none] motion-reduce:snap-none"
        tabIndex={0}
        role="region"
        aria-label="Studio pages. Scroll or swipe to explore."
        inert={Boolean(panel)}
        onScroll={(event) =>
          setDark(
            event.currentTarget.scrollTop >
              event.currentTarget.clientHeight * 0.5,
          )
        }
      >
        <section className={`${page} ${HERO_PAGE}`} aria-label="Introduction">
          <h2
            className={`${HEADLINE} scale-x-90 text-[12.65cqw] tracking-[-.085em] @max-[540px]:scale-x-87 @max-[540px]:tracking-[-.077em]`}
          >
            {headline.map((line, index) => (
              <span key={index} className={HEADLINE_LINE}>
                {line}
              </span>
            ))}
          </h2>
          <button
            type="button"
            className={`${scrollCue} text-[#a1a1a1]`}
            onClick={() => goTo(1)}
            data-lc-liquid
          >
            Scroll or swipe
          </button>
        </section>
        <section
          className={`${page} ${WORK_PAGE}`}
          aria-labelledby={`${id}-work`}
        >
          <div
            className={`${PROJECT_LAYOUT} gap-[38px] px-4 @max-[540px]:grid-cols-[1fr] @max-[540px]:gap-8 @max-[540px]:px-[11px]`}
          >
            <h2
              id={`${id}-work`}
              className={`${WORK_TITLE} text-[7.15cqw] @max-[540px]:text-[12cqw]`}
            >
              Featured
              <br />
              projects
            </h2>
            <ol className="m-0 grid list-none gap-[7px] p-0 @max-[540px]:gap-2">
              {projects.map((project, index) => (
                <li key={project.id}>
                  <button
                    type="button"
                    className={projectButton}
                    onClick={(event) => {
                      open(project, event.currentTarget);
                      onProjectSelect?.(project);
                    }}
                    data-lc-liquid
                  >
                    <span className={`${PROJECT_NUMBER} text-[9px]`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{project.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <button
            type="button"
            className={`${scrollCue} text-[#696969]`}
            onClick={() => goTo(0)}
            data-lc-liquid
          >
            Scroll up
          </button>
        </section>
      </div>
      {panel && (
        <div
          className="absolute inset-0 z-[5] grid place-items-center bg-[#0007] p-6 backdrop-blur-[8px]"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-panel-title`}
            className="lc-dialog relative max-h-full w-[min(570px,100%)] overflow-auto rounded-[2px] bg-white p-[38px] text-[#080808] shadow-[0_20px_70px_#0002] @max-[540px]:px-6 @max-[540px]:py-[34px]"
            onKeyDown={trapFocus}
          >
            <button
              type="button"
              className="absolute top-[13px] right-[17px] size-8 rounded-[50%] border-none bg-transparent text-[28px] leading-none"
              aria-label="Close panel"
              onClick={close}
              data-lc-liquid
            >
              ×
            </button>
            {typeof panel === "object" ? (
              <>
                <p className={EYEBROW}>{panel.discipline}</p>
                <h3 id={`${id}-panel-title`} className={PANEL_TITLE}>
                  {panel.title}
                </h3>
                <div
                  className={`relative mb-5 grid h-[170px] place-items-center overflow-hidden @max-[540px]:h-[130px] ${panel.id === "neural" ? ART_NEURAL : panel.id === "kinetic" ? ART_KINETIC : ART_DEFAULT}`}
                  data-project={panel.id}
                  aria-hidden="true"
                >
                  {["rotate-30", "rotate-90", "rotate-150"].map((rotation) => (
                    <i
                      key={rotation}
                      className={`${ART_RING} ${rotation} ${panel.id === "kinetic" ? "border-[#05050540]" : "border-[#ffffff70]"}`}
                    />
                  ))}
                  <span className="relative text-[54px] font-black tracking-[-6px] mix-blend-difference">
                    {panel.id === "kinetic" ? "MOVE." : "PF"}
                  </span>
                </div>
                <p className={PANEL_DESCRIPTION}>{panel.description}</p>
              </>
            ) : panel === "about" ? (
              <>
                <p className={EYEBROW}>01 / THE STUDIO</p>
                <h3 id={`${id}-panel-title`} className={PANEL_TITLE}>
                  Made for
                  <br />
                  movement.
                </h3>
                <p className={PANEL_DESCRIPTION}>
                  We explore the space between design and technology. Thoughtful
                  interfaces. Expressive typography. Small interactions that
                  make a big impression.
                </p>
                <p className="mx-0 mt-7 mb-0 text-[11px] font-bold">
                  Independent thinking. Fluid execution.
                </p>
              </>
            ) : panel === "updates" ? (
              <>
                <p className={EYEBROW}>02 / FIELD NOTES</p>
                <h3 id={`${id}-panel-title`} className={PANEL_TITLE}>
                  Always
                  <br />
                  in motion.
                </h3>
                <ul className="m-0 grid list-none gap-0 p-0">
                  <li className={UPDATE_ITEM}>
                    <span className={UPDATE_NUMBER}>01</span>Exploring liquid
                    interactions
                  </li>
                  <li className={UPDATE_ITEM}>
                    <span className={UPDATE_NUMBER}>02</span>Type as a moving
                    medium
                  </li>
                  <li className={UPDATE_ITEM}>
                    <span className={UPDATE_NUMBER}>03</span>Interfaces with a
                    little feeling
                  </li>
                </ul>
              </>
            ) : (
              <>
                <p className={EYEBROW}>03 / YOUR NEXT IDEA</p>
                <h3 id={`${id}-panel-title`} className={PANEL_TITLE}>
                  Let&apos;s make
                  <br />
                  it move.
                </h3>
                <p className={PANEL_DESCRIPTION}>
                  An expressive interface. A thoughtful interaction. Your next
                  big idea.
                </p>
                <button
                  type="button"
                  className="mt-8 flex gap-[38px] rounded-[999px] border-none bg-[#050505] px-[18px] py-3 text-[11px] font-bold text-white"
                  onClick={() => {
                    close();
                    goTo(1);
                  }}
                  data-lc-liquid
                >
                  Explore our work <span aria-hidden="true">↗</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <svg
        ref={artwork}
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-0 mix-blend-difference motion-reduce:hidden pointer-coarse:hidden"
        aria-hidden="true"
        width="100%"
        height="100%"
      >
        <defs>
          <filter
            id={`${id}-goo`}
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            />
          </filter>
        </defs>
        <g fill="white" filter={`url(#${id}-goo)`}>
          <rect className="lc-pointer-pill" width="0" height="0" />
          {Array.from({ length: 9 }, (_, index) => (
            <circle key={index} className="lc-droplet" r="0" />
          ))}
        </g>
      </svg>
    </div>
  );
}

/** Static artwork only: no listeners, timers, observers, or animation loop. */
export function LiquidCursorThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  const step = Math.abs(Math.trunc(previewStep)) % 4;
  const dark = step > 1;
  const navText = `${NAV_TEXT} text-[5px]`;
  return (
    <div
      className={`liquid-cursor @container pointer-events-none isolate h-full min-h-0 min-w-0 bg-white font-[Arial,Helvetica,sans-serif] text-[#050505] ${className}`}
      data-dark={dark}
      aria-hidden="true"
      inert
    >
      <ComponentStyles css={LIQUID_STYLES} />
      <div
        className={`${HEADER} flex items-center gap-3 px-3 py-[18px] ${dark ? "text-white" : "text-[#050505]"}`}
      >
        <span className={`${NAV_TEXT} text-[7px]`}>PIXELFLOW</span>
        <div className="flex gap-[11px] @max-[540px]:justify-end">
          <span className={navText}>WORKS</span>
          <span className={navText}>ABOUT</span>
          <span className={navText}>UPDATES</span>
          <span className={navText}>START A PROJECT</span>
        </div>
      </div>
      <div
        className={`${PAGE} px-[13px] pt-[55px] pb-[36px] ${dark ? WORK_PAGE : HERO_PAGE}`}
      >
        {dark ? (
          <div className={`${PROJECT_LAYOUT} gap-3`}>
            <span className={`${WORK_TITLE} text-[7cqw]`}>
              FEATURED
              <br />
              PROJECTS
            </span>
            <div className="m-0 grid list-none gap-0 p-0">
              {DEFAULT_PROJECTS.map((project, index) => (
                <span
                  className={`${PROJECT} gap-2 px-0 py-[7px] text-[3.2cqw]`}
                  key={project.id}
                >
                  <span className={`${PROJECT_NUMBER} text-[4px]`}>
                    0{index + 1}
                  </span>
                  <span>{project.title}</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <span
            className={`${HEADLINE} scale-x-92 text-[12cqw] tracking-[-.08em]`}
          >
            {DEFAULT_HEADLINE.map((line) => (
              <span key={line} className={HEADLINE_LINE}>
                {line}
              </span>
            ))}
          </span>
        )}
        <span
          className={`${SCROLL_CUE} bottom-3 p-0 text-[5px] tracking-[.1em] ${dark ? "text-[#696969]" : "text-[#a1a1a1]"}`}
        >
          {dark ? "SCROLL UP" : "SCROLL OR SWIPE"}
        </span>
      </div>
      <svg
        className={`absolute h-[75px] w-[100px] text-white mix-blend-difference ${dark ? "top-[58%] left-[59%]" : "top-[43%] left-[28%]"}`}
        viewBox="0 0 120 90"
      >
        <path
          d={
            step % 2
              ? "M17 59C5 43 22 24 40 32S68 42 81 25 111 23 111 40 94 67 74 60 52 60 44 69 25 73 17 59Z"
              : "M32 45C32 28 43 18 56 21S75 31 73 47 64 65 51 63 31 58 32 45Z"
          }
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

/*
 * Raw CSS kept only for what utilities cannot express cleanly:
 * - button cursor / focus ring and the scroll region's outline offset must beat
 *   the site's unlayered global :focus-visible rule;
 * - the WebKit scrollbar pseudo-element;
 * - the liquid hover states, keyed on root data-dark / data-cursor-active state
 *   (set from the pointer loop) and dialog ancestry with deliberate precedence;
 * - reduced-motion overrides that must beat every descendant transition.
 */
const LIQUID_STYLES = `
.liquid-cursor button{cursor:pointer}
.liquid-cursor button:focus-visible{outline:2px solid currentColor;outline-offset:5px}
.liquid-cursor .lc-scroll{outline-offset:-3px}
.liquid-cursor .lc-scroll::-webkit-scrollbar{display:none}
.liquid-cursor [data-lc-liquid]{transition:background .2s,color .2s}
.liquid-cursor [data-lc-liquid]:hover{background:#050505;color:#fff}
.liquid-cursor[data-dark=true] [data-lc-liquid]:hover{background:#fff;color:#050505}
.liquid-cursor[data-cursor-active=true],.liquid-cursor[data-cursor-active=true] *{cursor:none!important}
.liquid-cursor[data-cursor-active=true] [data-lc-liquid]:hover{background:transparent;color:inherit}
.liquid-cursor[data-dark=true] .lc-dialog [data-lc-liquid]:hover{background:#eee;color:#050505}
@media(prefers-reduced-motion:reduce){.liquid-cursor *{transition:none!important;scroll-behavior:auto!important}}
`;
