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

  return (
    <div
      ref={root}
      className={`liquid-cursor relative w-full overflow-hidden ${className}`}
      data-dark={dark}
    >
      <ComponentStyles css={LIQUID_STYLES} />
      <header
        className="lc-header flex items-center justify-between"
        inert={Boolean(panel)}
      >
        <button
          className="lc-brand"
          type="button"
          onClick={() => goTo(0)}
          data-lc-liquid
        >
          {brand}
        </button>
        <nav
          className="lc-navigation flex items-center"
          aria-label="Studio navigation"
        >
          <button type="button" onClick={() => goTo(1)} data-lc-liquid>
            Works
          </button>
          <button
            type="button"
            onClick={(event) => open("about", event.currentTarget)}
            data-lc-liquid
          >
            About
          </button>
          <button
            type="button"
            onClick={(event) => open("updates", event.currentTarget)}
            data-lc-liquid
          >
            Updates
          </button>
          <button
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
        className="lc-scroll"
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
        <section
          className="lc-page lc-hero grid place-items-center"
          aria-label="Introduction"
        >
          <h2 className="lc-headline">
            {headline.map((line, index) => (
              <span key={index}>{line}</span>
            ))}
          </h2>
          <button
            type="button"
            className="lc-scroll-cue"
            onClick={() => goTo(1)}
            data-lc-liquid
          >
            Scroll or swipe
          </button>
        </section>
        <section
          className="lc-page lc-work grid place-items-center"
          aria-labelledby={`${id}-work`}
        >
          <div className="lc-project-layout">
            <h2 id={`${id}-work`} className="lc-work-title">
              Featured
              <br />
              projects
            </h2>
            <ol className="lc-projects">
              {projects.map((project, index) => (
                <li key={project.id}>
                  <button
                    type="button"
                    className="lc-project"
                    onClick={(event) => {
                      open(project, event.currentTarget);
                      onProjectSelect?.(project);
                    }}
                    data-lc-liquid
                  >
                    <span className="lc-project-number">
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
            className="lc-scroll-cue"
            onClick={() => goTo(0)}
            data-lc-liquid
          >
            Scroll up
          </button>
        </section>
      </div>
      {panel && (
        <div
          className="lc-dialog-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-panel-title`}
            className="lc-dialog"
            onKeyDown={trapFocus}
          >
            <button
              type="button"
              className="lc-close"
              aria-label="Close panel"
              onClick={close}
              data-lc-liquid
            >
              ×
            </button>
            {typeof panel === "object" ? (
              <>
                <p className="lc-eyebrow">{panel.discipline}</p>
                <h3 id={`${id}-panel-title`}>{panel.title}</h3>
                <div
                  className="lc-project-art"
                  data-project={panel.id}
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                  <span>{panel.id === "kinetic" ? "MOVE." : "PF"}</span>
                </div>
                <p className="lc-panel-description">{panel.description}</p>
              </>
            ) : panel === "about" ? (
              <>
                <p className="lc-eyebrow">01 / THE STUDIO</p>
                <h3 id={`${id}-panel-title`}>
                  Made for
                  <br />
                  movement.
                </h3>
                <p className="lc-panel-description">
                  We explore the space between design and technology. Thoughtful
                  interfaces. Expressive typography. Small interactions that
                  make a big impression.
                </p>
                <p className="lc-panel-note">
                  Independent thinking. Fluid execution.
                </p>
              </>
            ) : panel === "updates" ? (
              <>
                <p className="lc-eyebrow">02 / FIELD NOTES</p>
                <h3 id={`${id}-panel-title`}>
                  Always
                  <br />
                  in motion.
                </h3>
                <ul className="lc-updates">
                  <li>
                    <span>01</span>Exploring liquid interactions
                  </li>
                  <li>
                    <span>02</span>Type as a moving medium
                  </li>
                  <li>
                    <span>03</span>Interfaces with a little feeling
                  </li>
                </ul>
              </>
            ) : (
              <>
                <p className="lc-eyebrow">03 / YOUR NEXT IDEA</p>
                <h3 id={`${id}-panel-title`}>
                  Let&apos;s make
                  <br />
                  it move.
                </h3>
                <p className="lc-panel-description">
                  An expressive interface. A thoughtful interaction. Your next
                  big idea.
                </p>
                <button
                  type="button"
                  className="lc-panel-action"
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
        className="lc-pointer-art"
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
  return (
    <div
      className={`liquid-cursor lc-thumbnail ${className}`}
      data-dark={dark}
      aria-hidden="true"
      inert
    >
      <ComponentStyles css={LIQUID_STYLES} />
      <div className="lc-header">
        <span className="lc-brand">PIXELFLOW</span>
        <div className="lc-navigation">
          <span>WORKS</span>
          <span>ABOUT</span>
          <span>UPDATES</span>
          <span>START A PROJECT</span>
        </div>
      </div>
      <div className={`lc-page ${dark ? "lc-work" : "lc-hero"}`}>
        {dark ? (
          <div className="lc-project-layout">
            <span className="lc-work-title">
              FEATURED
              <br />
              PROJECTS
            </span>
            <div className="lc-projects">
              {DEFAULT_PROJECTS.map((project, index) => (
                <span className="lc-project" key={project.id}>
                  <span className="lc-project-number">0{index + 1}</span>
                  <span>{project.title}</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <span className="lc-headline">
            {DEFAULT_HEADLINE.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
        )}
        <span className="lc-scroll-cue">
          {dark ? "SCROLL UP" : "SCROLL OR SWIPE"}
        </span>
      </div>
      <svg className="lc-thumbnail-blob" viewBox="0 0 120 90">
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

const LIQUID_STYLES = `
.liquid-cursor{container-type:inline-size;isolation:isolate;font-family:Arial,Helvetica,sans-serif;background:#fff;color:#050505;min-width:0}
.liquid-cursor *{box-sizing:border-box}.liquid-cursor button{font-family:inherit;color:inherit;cursor:pointer}.liquid-cursor button:focus-visible{outline:2px solid currentColor;outline-offset:5px}.liquid-cursor .lc-header{position:absolute;inset:0 0 auto;z-index:3;padding:32px 25px;gap:20px;color:#050505;transition:color .25s}.liquid-cursor[data-dark=true] .lc-header{color:#fff}
.liquid-cursor .lc-brand,.liquid-cursor .lc-navigation button,.liquid-cursor .lc-navigation>span{font-size:clamp(9px,1.5cqw,13px);font-weight:900;letter-spacing:.005em;text-transform:uppercase;white-space:nowrap;border:0;background:none;border-radius:999px;padding:7px 3px;line-height:1.1}.liquid-cursor .lc-navigation{gap:clamp(14px,4.1cqw,36px)}
.liquid-cursor .lc-scroll{height:clamp(440px,80cqw,680px);overflow-y:auto;overflow-x:hidden;scroll-snap-type:y mandatory;overscroll-behavior-y:contain;scrollbar-width:none;outline-offset:-3px}.liquid-cursor .lc-scroll::-webkit-scrollbar{display:none}.liquid-cursor .lc-page{position:relative;grid-template-columns:minmax(0,1fr);height:100%;min-height:100%;scroll-snap-align:start;scroll-snap-stop:always;padding:100px 24px 70px}
.liquid-cursor .lc-hero{background:#fff}.liquid-cursor .lc-headline{min-width:0;width:100%;transform:scaleX(.9);margin:0;text-align:center;font-family:Arial Black,Arial,Helvetica,sans-serif;font-size:12.65cqw;line-height:.84;font-weight:950;letter-spacing:-.085em;text-transform:uppercase}.liquid-cursor .lc-headline>span{display:block;white-space:nowrap;width:max-content;min-width:100%;position:relative;left:50%;transform:translateX(-50%)}.liquid-cursor .lc-scroll-cue{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);border:0;background:none;border-radius:999px;padding:7px 8px;font-size:clamp(8px,1.4cqw,11px);font-weight:700;text-transform:uppercase;letter-spacing:.16em;color:#a1a1a1;white-space:nowrap}
.liquid-cursor .lc-work{color:#fff;background-color:#080808;background-image:linear-gradient(#ffffff02 1px,transparent 1px),linear-gradient(90deg,#ffffff02 1px,transparent 1px);background-size:36px 36px}.liquid-cursor .lc-project-layout{display:grid;grid-template-columns:.95fr 1.05fr;gap:38px;width:100%;align-items:center;padding:0 16px}.liquid-cursor .lc-work-title{margin:0;font-family:Arial Black,Arial,Helvetica,sans-serif;font-size:7.15cqw;line-height:.88;letter-spacing:-.065em;font-weight:950;text-transform:uppercase}.liquid-cursor .lc-projects{list-style:none;margin:0;padding:0;display:grid;gap:7px}.liquid-cursor .lc-project{display:flex;align-items:center;gap:23px;text-align:left;border:0;background:none;width:max-content;max-width:100%;padding:11px 7px;border-radius:999px;font-size:3.15cqw;line-height:1.05;font-weight:800;letter-spacing:-.04em;text-transform:uppercase}.liquid-cursor .lc-project-number{flex-shrink:0;font-family:monospace;font-size:9px;font-weight:500;color:#777;letter-spacing:0}.liquid-cursor .lc-work .lc-scroll-cue{color:#696969}
.liquid-cursor [data-lc-liquid]{transition:background .2s,color .2s}.liquid-cursor [data-lc-liquid]:hover{background:#050505;color:#fff}.liquid-cursor[data-dark=true] [data-lc-liquid]:hover{background:#fff;color:#050505}.liquid-cursor[data-cursor-active=true],.liquid-cursor[data-cursor-active=true] *{cursor:none!important}.liquid-cursor[data-cursor-active=true] [data-lc-liquid]:hover{background:transparent;color:inherit}.liquid-cursor .lc-pointer-art{position:absolute;inset:0;z-index:10;overflow:hidden;pointer-events:none;opacity:0;mix-blend-mode:difference}
.liquid-cursor .lc-dialog-backdrop{position:absolute;inset:0;z-index:5;display:grid;place-items:center;padding:24px;background:#0007;backdrop-filter:blur(8px)}.liquid-cursor .lc-dialog{position:relative;width:min(570px,100%);max-height:100%;overflow:auto;padding:38px;background:#fff;color:#080808;border-radius:2px;box-shadow:0 20px 70px #0002}.liquid-cursor .lc-close{position:absolute;top:13px;right:17px;width:32px;height:32px;border:0;border-radius:50%;background:none;font-size:28px;line-height:1}.liquid-cursor .lc-eyebrow{margin:0 0 28px;font-size:9px;font-weight:700;letter-spacing:.15em;color:#787878}.liquid-cursor .lc-dialog h3{font-family:Arial Black,Arial,sans-serif;font-weight:950;font-size:clamp(28px,6.5cqw,62px);line-height:.95;letter-spacing:-.065em;text-transform:uppercase;margin:0 0 24px}.liquid-cursor .lc-panel-description{font-size:14px;line-height:1.7;color:#666;max-width:410px;margin:0}.liquid-cursor .lc-panel-note{font-size:11px;font-weight:700;margin:28px 0 0}.liquid-cursor .lc-updates{padding:0;margin:0;list-style:none;display:grid;gap:0}.liquid-cursor .lc-updates li{display:flex;gap:18px;padding:18px 0;border-top:1px solid #e9e9e9;font-size:13px;font-weight:700}.liquid-cursor .lc-updates li>span{color:#999;font:9px monospace;padding-top:3px}.liquid-cursor .lc-panel-action{display:flex;gap:38px;margin-top:32px;padding:12px 18px;background:#050505;color:#fff;border:0;border-radius:999px;font-size:11px;font-weight:700}.liquid-cursor[data-dark=true] .lc-dialog [data-lc-liquid]:hover{background:#eee;color:#050505}
.liquid-cursor .lc-project-art{position:relative;overflow:hidden;height:170px;margin-bottom:20px;background:#111;color:#fff;display:grid;place-items:center}.liquid-cursor .lc-project-art i{position:absolute;width:165px;height:165px;top:36px;left:calc(50% - 82px);border:1px solid #ffffff70;border-radius:50%;transform:rotate(30deg) scaleX(.4)}.liquid-cursor .lc-project-art i:nth-child(2){transform:rotate(90deg) scaleX(.4)}.liquid-cursor .lc-project-art i:nth-child(3){transform:rotate(150deg) scaleX(.4)}.liquid-cursor .lc-project-art>span{position:relative;font-size:54px;font-weight:900;letter-spacing:-6px;mix-blend-mode:difference}.liquid-cursor .lc-project-art[data-project=neural]{background:radial-gradient(ellipse at 20% 90%,#496270,#0c1417 65%)}.liquid-cursor .lc-project-art[data-project=kinetic]{background:#e7ff55;color:#050505}.liquid-cursor .lc-project-art[data-project=kinetic] i{border-color:#05050540}
@container(max-width:540px){.liquid-cursor .lc-header{padding:21px 14px;gap:15px;align-items:flex-start}.liquid-cursor .lc-navigation{gap:14px;justify-content:flex-end;flex-wrap:wrap;max-width:245px}.liquid-cursor .lc-navigation button{font-size:8px}.liquid-cursor .lc-brand{font-size:9px}.liquid-cursor .lc-page{padding:95px 14px 65px}.liquid-cursor .lc-headline{font-size:12.65cqw;letter-spacing:-.077em;line-height:.9;transform:scaleX(.87)}.liquid-cursor .lc-project-layout{grid-template-columns:1fr;gap:32px;padding:0 11px}.liquid-cursor .lc-work-title{font-size:12cqw}.liquid-cursor .lc-projects{gap:8px}.liquid-cursor .lc-project{font-size:5.5cqw;gap:22px;padding:10px 4px}.liquid-cursor .lc-dialog{padding:34px 24px}.liquid-cursor .lc-eyebrow{margin-bottom:22px}.liquid-cursor .lc-panel-description{font-size:12px}.liquid-cursor .lc-project-art{height:130px}}
.liquid-cursor.lc-thumbnail{height:100%;min-height:0;pointer-events:none}.liquid-cursor.lc-thumbnail .lc-header{display:flex;align-items:center;padding:18px 12px;gap:12px}.liquid-cursor.lc-thumbnail .lc-brand{font-size:7px;padding:0}.liquid-cursor.lc-thumbnail .lc-navigation{display:flex;gap:11px;flex-wrap:nowrap;max-width:none}.liquid-cursor.lc-thumbnail .lc-navigation>span{font-size:5px;padding:0}.liquid-cursor.lc-thumbnail .lc-page{display:grid;place-items:center;padding:55px 13px 36px}.liquid-cursor.lc-thumbnail .lc-headline{font-size:12cqw;letter-spacing:-.08em;transform:scaleX(.92)}.liquid-cursor.lc-thumbnail .lc-scroll-cue{font-size:5px;bottom:12px;letter-spacing:.1em;padding:0}.liquid-cursor.lc-thumbnail .lc-project-layout{grid-template-columns:.95fr 1.05fr;gap:12px;padding:0}.liquid-cursor.lc-thumbnail .lc-work-title{font-size:7cqw}.liquid-cursor.lc-thumbnail .lc-project{font-size:3.2cqw;gap:8px;padding:7px 0}.liquid-cursor.lc-thumbnail .lc-project-number{font-size:4px}.liquid-cursor.lc-thumbnail .lc-projects{gap:0}.liquid-cursor .lc-thumbnail-blob{position:absolute;width:100px;height:75px;left:28%;top:43%;color:#fff;mix-blend-mode:difference}.liquid-cursor.lc-thumbnail[data-dark=true] .lc-thumbnail-blob{color:#fff;left:59%;top:58%}
@media(prefers-reduced-motion:reduce){.liquid-cursor *{transition:none!important;scroll-behavior:auto!important}.liquid-cursor .lc-pointer-art{display:none}.liquid-cursor .lc-scroll{scroll-snap-type:none}}
@media(pointer:coarse){.liquid-cursor .lc-pointer-art{display:none}}
`;
