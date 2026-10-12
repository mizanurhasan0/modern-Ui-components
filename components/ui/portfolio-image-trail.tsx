"use client";

/* eslint-disable @next/next/no-img-element -- Plain images preserve portability outside Next.js. */

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { ComponentStyles } from "./component-styles";

export type PortfolioSection = "work" | "about" | "stack" | "contact";

export interface PortfolioProject {
  title: string;
  description: string;
  href?: string;
}

export interface PortfolioImageTrailProps {
  className?: string;
  name?: string;
  initials?: string;
  role?: string;
  headline?: string;
  accentText?: string;
  description?: string;
  portraitSrc?: string;
  portraitAlt?: string;
  trailSrc?: string;
  availability?: string;
  technologies?: readonly string[];
  localTime?: string;
  location?: string;
  signature?: string;
  navigation?: Partial<Record<PortfolioSection, string>>;
  workHref?: string;
  contactHref?: string;
  onNavigate?: (section: PortfolioSection) => void;
  onViewWork?: () => void;
  onContact?: () => void;
  projects?: readonly PortfolioProject[];
  aboutText?: string;
  contactEmail?: string;
}

const NAVIGATION: readonly PortfolioSection[] = [
  "work",
  "about",
  "stack",
  "contact",
];
const DEFAULT_TECHNOLOGIES = ["REACT", "NODE", "PYTHON", "DOCKER"];
const DEFAULT_PROJECTS: readonly PortfolioProject[] = [
  {
    title: "Interface explorations",
    description: "Expressive interactions, thoughtful details.",
  },
  {
    title: "Digital products",
    description: "Fast, considered experiences from idea to launch.",
  },
];
const PANEL_TITLES: Record<PortfolioSection, string> = {
  work: "Selected work",
  about: "A little about me",
  stack: "Tools of the trade",
  contact: "Get in touch",
};

type TrailPoint = { x: number; y: number; born: number; segment: number };
type TrailInput = (x: number, y: number, newSegment?: boolean) => void;

/** Draw a local image through a soft, irregular ribbon mask. No pixel data is read. */
function useImageTrail(
  stage: RefObject<HTMLDivElement | null>,
  canvas: RefObject<HTMLCanvasElement | null>,
  source: string,
) {
  const input = useRef<TrailInput | null>(null);
  const leave = useRef<(() => void) | null>(null);

  useEffect(() => {
    const element = stage.current;
    const surface = canvas.current;
    const context = surface?.getContext("2d");
    if (!element || !surface || !context) return;
    const mask = document.createElement("canvas");
    const maskContext = mask.getContext("2d");
    if (!maskContext) return;
    const image = new Image();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let points: TrailPoint[] = [];
    let segment = 0;
    let frame: number | null = null;
    let width = 0;
    let height = 0;
    let ratio = 1;
    let visible = true;
    let disposed = false;
    const lifetime = 1650;

    function clear() {
      context!.clearRect(0, 0, width, height);
      maskContext!.clearRect(0, 0, width, height);
    }

    function paint(now: number, still = false) {
      clear();
      if (!image.complete || !image.naturalWidth || !points.length) return;
      const brush = Math.max(32, width * 0.078);
      // Overlapping broad strokes give the mask a continuous, gently scalloped edge.
      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        const life = still ? 1 : Math.max(0, 1 - (now - point.born) / lifetime);
        const radius = brush * (0.18 + 0.82 * Math.sqrt(life));
        maskContext!.globalAlpha = Math.min(1, life * 2.5);
        const previous = points[index - 1];
        if (previous && previous.segment === point.segment) {
          maskContext!.beginPath();
          maskContext!.lineWidth = radius * 1.82;
          maskContext!.lineCap = "round";
          maskContext!.strokeStyle = "#fff";
          maskContext!.moveTo(previous.x, previous.y);
          maskContext!.lineTo(point.x, point.y);
          maskContext!.stroke();
        }
        maskContext!.beginPath();
        for (let edge = 0; edge < 20; edge += 1) {
          const angle = (edge / 20) * Math.PI * 2;
          const ripple =
            1 +
            Math.sin(edge * 2.3 + point.born * 0.006) * 0.08 +
            Math.cos(edge * 4.1 + point.x * 0.05) * 0.04;
          const x = point.x + Math.cos(angle) * radius * ripple;
          const y = point.y + Math.sin(angle) * radius * ripple;
          if (edge === 0) maskContext!.moveTo(x, y);
          else maskContext!.lineTo(x, y);
        }
        maskContext!.closePath();
        maskContext!.fillStyle = "#fff";
        maskContext!.fill();
      }
      maskContext!.globalAlpha = 1;
      const scale = Math.max(
        width / image.naturalWidth,
        height / image.naturalHeight,
      );
      const imageWidth = image.naturalWidth * scale;
      const imageHeight = image.naturalHeight * scale;
      context!.drawImage(
        image,
        (width - imageWidth) / 2,
        (height - imageHeight) / 2,
        imageWidth,
        imageHeight,
      );
      context!.globalCompositeOperation = "destination-in";
      context!.drawImage(
        mask,
        0,
        0,
        mask.width,
        mask.height,
        0,
        0,
        width,
        height,
      );
      context!.globalCompositeOperation = "source-over";
    }

    function animate(now: number) {
      frame = null;
      if (disposed || !visible || document.hidden || motion.matches) return;
      points = points.filter((point) => now - point.born < lifetime);
      paint(now);
      if (points.length) frame = requestAnimationFrame(animate);
    }

    function schedule() {
      if (
        !disposed &&
        !motion.matches &&
        visible &&
        !document.hidden &&
        points.length &&
        frame === null
      )
        frame = requestAnimationFrame(animate);
    }

    function resize() {
      const bounds = element!.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      mask.width = Math.round(width * ratio);
      surface!.setAttribute("width", String(mask.width));
      mask.height = Math.round(height * ratio);
      surface!.setAttribute("height", String(mask.height));
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      maskContext!.setTransform(ratio, 0, 0, ratio, 0, 0);
      points = [];
      clear();
    }

    function synchronize() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      if (motion.matches || document.hidden || !visible) {
        points = [];
        clear();
      } else schedule();
    }

    input.current = (x, y, newSegment = false) => {
      if (disposed || !visible || document.hidden) return;
      const now = performance.now();
      if (newSegment) segment += 1;
      if (motion.matches) {
        points = [{ x, y, born: now, segment }];
        paint(now, true);
        return;
      }
      const last = points[points.length - 1];
      if (last && !newSegment && Math.hypot(x - last.x, y - last.y) < 4) return;
      points.push({ x, y, born: now, segment });
      if (points.length > 160) points.splice(0, points.length - 160);
      schedule();
    };
    leave.current = () => {
      segment += 1;
      if (motion.matches) {
        points = [];
        clear();
      }
    };
    image.onload = () => {
      if (motion.matches) paint(performance.now(), true);
      else schedule();
    };
    image.src = source;
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(element);
    const intersection =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            synchronize();
          });
    intersection?.observe(element);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", synchronize);
    motion.addEventListener("change", synchronize);
    resize();

    return () => {
      disposed = true;
      input.current = null;
      leave.current = null;
      if (frame !== null) cancelAnimationFrame(frame);
      observer?.disconnect();
      intersection?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", synchronize);
      motion.removeEventListener("change", synchronize);
      image.onload = null;
      clear();
    };
  }, [stage, canvas, source]);

  return { input, leave };
}

const STILL_PATHS = [
  "",
  "M.02 0H.27L.29 .04 .26 .12 .23 .17 .18 .18 .17 .22 .21 .25 .19 .30 .16 .34 .19 .39 .17 .43 .21 .48 .19 .58 .14 .65 .09 .59 .07 .48 .08 .40 .06 .32 .04 .26 .05 .17 .03 .10Z",
  "M.11 .14Q.31 -.08 .55 .04L.57 .03 .61 .06 .66 .05 .70 .09 .73 .08Q.91 .16 .91 .34L.94 .38 .92 .44 .88 .47 .84 .49 .82 .53 .79 .51 .74 .55 .68 .57 .57 .59 .48 .56 .38 .58 .33 .56 .26 .57Q.05 .56 .06 .36L.04 .32 .07 .29 .05 .25 .09 .22 .08 .18ZM.24 .24Q.36 .16 .53 .21Q.72 .25 .77 .35Q.76 .43 .59 .45Q.34 .44 .20 .39Q.17 .31 .24 .24Z",
  "M.08 .76Q.36 .66 .54 .37Q.73 .08 1 .12V.38Q.77 .34 .65 .53Q.46 .82 .10 .91L.05 .85Z",
] as const;

function PortfolioVisual({
  data,
  thumbnail = false,
  previewStep = 0,
  canvasRef,
  onSelect,
}: {
  data: PortfolioImageTrailProps;
  thumbnail?: boolean;
  previewStep?: number;
  canvasRef?: RefObject<HTMLCanvasElement | null>;
  onSelect?: (
    section: PortfolioSection,
    trigger: HTMLElement,
    cta: boolean,
  ) => void;
}) {
  const id = useId().replace(/:/g, "");
  const name = data.name ?? "Your Name";
  const technologies = data.technologies ?? DEFAULT_TECHNOLOGIES;
  const stillPath =
    STILL_PATHS[Math.abs(Math.trunc(previewStep)) % STILL_PATHS.length];

  function action(
    section: PortfolioSection,
    label: string,
    className: string,
    cta = false,
  ) {
    const content = (
      <>
        {label}
        {cta && section === "work" && (
          <span className="pit-arrow" aria-hidden="true">
            ↗
          </span>
        )}
      </>
    );
    if (thumbnail)
      return (
        <span key={section} className={className}>
          {content}
        </span>
      );
    const href = cta
      ? section === "work"
        ? (data.workHref ?? data.navigation?.work)
        : (data.contactHref ?? data.navigation?.contact)
      : data.navigation?.[section];
    if (href)
      return (
        <a
          key={section}
          className={className}
          href={href}
          onClick={() => {
            if (cta && section === "work") data.onViewWork?.();
            else if (cta && section === "contact") data.onContact?.();
            else data.onNavigate?.(section);
          }}
        >
          {content}
        </a>
      );
    return (
      <button
        key={section}
        type="button"
        className={className}
        onClick={(event) => onSelect?.(section, event.currentTarget, cta)}
      >
        {content}
      </button>
    );
  }

  return (
    <>
      <div className="pit-floor" aria-hidden="true" />
      {thumbnail ? (
        <>
          {stillPath && (
            <>
              <svg width="0" height="0" aria-hidden="true">
                <defs>
                  <clipPath
                    id={`${id}-trail`}
                    clipPathUnits="objectBoundingBox"
                  >
                    <path d={stillPath} fillRule="evenodd" clipRule="evenodd" />
                  </clipPath>
                </defs>
              </svg>
              <img
                className="pit-still-trail"
                src={data.trailSrc ?? "/portfolio-trail/tech-texture.webp"}
                alt=""
                style={{ clipPath: `url(#${id}-trail)` }}
              />
            </>
          )}
        </>
      ) : (
        <canvas ref={canvasRef} className="pit-trail" aria-hidden="true" />
      )}
      {/* Plain images keep the copied component portable outside Next.js. */}

      <img
        className="pit-portrait"
        src={data.portraitSrc ?? "/portfolio-trail/portrait.webp"}
        alt={
          thumbnail
            ? ""
            : (data.portraitAlt ?? "A thoughtful developer with a laptop")
        }
        draggable={false}
      />
      <header className="pit-header flex items-center justify-between">
        <div className="pit-identity">
          <span className="pit-initials">{data.initials ?? "YN"}</span>
          <span>{name}</span>
        </div>
        {thumbnail ? (
          <div className="pit-navigation">
            {NAVIGATION.map((section) =>
              action(
                section,
                section[0].toUpperCase() + section.slice(1),
                "pit-nav-link",
              ),
            )}
          </div>
        ) : (
          <nav className="pit-navigation" aria-label="Portfolio navigation">
            {NAVIGATION.map((section) =>
              action(
                section,
                section[0].toUpperCase() + section.slice(1),
                "pit-nav-link",
              ),
            )}
          </nav>
        )}
        <span className="pit-availability">
          <span aria-hidden="true" />
          {data.availability ?? "Open for projects"}
        </span>
      </header>
      <div className="pit-introduction">
        <p className="pit-role">
          <span aria-hidden="true" />
          {data.role ?? "FULL-STACK ENGINEER"}
        </p>
        <h2>
          {data.headline ?? "Software, built"}
          <br />
          with <em>{data.accentText ?? "taste."}</em>
        </h2>
        <p className="pit-description">
          {data.description ??
            "I design and ship fast, considered web products,\nfrom the first sketch to production."}
        </p>
        <div className="pit-actions flex items-center">
          {action("work", "View selected work", "pit-work-action", true)}
          {action("contact", "Get in touch", "pit-contact-action", true)}
        </div>
      </div>
      <span className="pit-signature">
        {data.signature ?? "PORTFOLIO / 2026"}
      </span>
      <div className="pit-metadata">
        <div className="pit-technologies">
          {technologies.map((technology, index) => (
            <span key={`${technology}-${index}`}>{technology}</span>
          ))}
        </div>
        <div className="pit-location">
          <span>
            LOCAL <strong>{data.localTime ?? "05:42 PM"}</strong>
          </span>
          <span>{data.location ?? "REMOTE / WORLDWIDE"}</span>
        </div>
      </div>
    </>
  );
}

/** An interactive portfolio hero with an image ribbon that follows the pointer. */
export default function PortfolioImageTrail(props: PortfolioImageTrailProps) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const panel = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [activeSection, setActiveSection] = useState<PortfolioSection | null>(
    null,
  );
  const panelTitle = useId();
  const { input, leave } = useImageTrail(
    stage,
    canvas,
    props.trailSrc ?? "/portfolio-trail/tech-texture.webp",
  );

  useEffect(() => {
    if (activeSection) panel.current?.focus({ preventScroll: true });
  }, [activeSection]);

  function select(
    section: PortfolioSection,
    source: HTMLElement,
    cta: boolean,
  ) {
    const callback = cta
      ? section === "work"
        ? props.onViewWork
        : props.onContact
      : undefined;
    if (callback) callback();
    else if (props.onNavigate) props.onNavigate(section);
    else {
      trigger.current = source;
      setActiveSection(section);
    }
  }

  function close() {
    setActiveSection(null);
    trigger.current?.focus({ preventScroll: true });
  }

  function reveal(clientX: number, clientY: number, newSegment = false) {
    const bounds = stage.current?.getBoundingClientRect();
    if (bounds)
      input.current?.(clientX - bounds.left, clientY - bounds.top, newSegment);
  }

  return (
    <section
      className={`portfolio-image-trail relative w-full ${props.className ?? ""}`}
      aria-label={`${props.name ?? "Your Name"} portfolio`}
    >
      <ComponentStyles css={PORTFOLIO_STYLES} />
      <div
        ref={stage}
        className="pit-stage relative overflow-hidden"
        onPointerEnter={(event) => reveal(event.clientX, event.clientY, true)}
        onPointerMove={(event) => reveal(event.clientX, event.clientY)}
        onPointerDown={(event) => reveal(event.clientX, event.clientY, true)}
        onPointerLeave={() => leave.current?.()}
        onFocusCapture={(event) => {
          const bounds = event.target.getBoundingClientRect();
          reveal(
            bounds.left + bounds.width / 2,
            bounds.top + bounds.height / 2,
            true,
          );
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && activeSection) {
            event.preventDefault();
            close();
          }
        }}
      >
        <PortfolioVisual data={props} canvasRef={canvas} onSelect={select} />
        {activeSection && (
          <aside
            ref={panel}
            tabIndex={-1}
            className="pit-details"
            aria-labelledby={panelTitle}
          >
            <div className="pit-details-heading">
              <h3 id={panelTitle}>{PANEL_TITLES[activeSection]}</h3>
              <button
                type="button"
                className="pit-close"
                aria-label="Close portfolio details"
                onClick={close}
              >
                ×
              </button>
            </div>
            {activeSection === "work" && (
              <ul className="pit-projects">
                {(props.projects ?? DEFAULT_PROJECTS).map((project, index) => (
                  <li key={`${project.title}-${index}`}>
                    {project.href ? (
                      <a href={project.href}>
                        {project.title}
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    ) : (
                      <strong>{project.title}</strong>
                    )}
                    <p>{project.description}</p>
                  </li>
                ))}
              </ul>
            )}
            {activeSection === "about" && (
              <p>
                {props.aboutText ??
                  "I build thoughtful digital experiences, bringing design and engineering together from the first sketch to production."}
              </p>
            )}
            {activeSection === "stack" && (
              <div className="pit-detail-chips">
                {(props.technologies ?? DEFAULT_TECHNOLOGIES).map(
                  (technology, index) => (
                    <span key={`${technology}-${index}`}>{technology}</span>
                  ),
                )}
              </div>
            )}
            {activeSection === "contact" && (
              <>
                <p>Have a project in mind? Let’s make something thoughtful.</p>
                <a
                  className="pit-email"
                  href={`mailto:${props.contactEmail ?? "hello@yourname.dev"}`}
                >
                  {props.contactEmail ?? "hello@yourname.dev"}{" "}
                  <span aria-hidden="true">↗</span>
                </a>
              </>
            )}
          </aside>
        )}
      </div>
    </section>
  );
}

/** Still frames use the same artwork and SVG clipping, without effects or controls. */
export function PortfolioImageTrailThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  return (
    <div
      className={`portfolio-image-trail pit-thumbnail ${className}`}
      aria-hidden="true"
      inert
    >
      <ComponentStyles css={PORTFOLIO_STYLES} />
      <div className="pit-stage">
        <PortfolioVisual data={{}} thumbnail previewStep={previewStep} />
      </div>
    </div>
  );
}

const PORTFOLIO_STYLES = `
.portfolio-image-trail{isolation:isolate;container-type:inline-size;min-width:0;font-family:var(--font-geist-sans),Arial,Helvetica,sans-serif;color:#fff}.portfolio-image-trail *{box-sizing:border-box}.portfolio-image-trail button,.portfolio-image-trail a{font:inherit;-webkit-tap-highlight-color:transparent}.portfolio-image-trail a{text-decoration:none}.portfolio-image-trail button:focus-visible,.portfolio-image-trail a:focus-visible{outline:2px solid #e2ff8f;outline-offset:4px}.portfolio-image-trail .pit-stage{position:relative;width:100%;aspect-ratio:1440/690;min-height:320px;overflow:hidden;background:radial-gradient(ellipse at 50% 42%,#f6f2ef 0%,#eae6e4 72%);isolation:isolate}.portfolio-image-trail .pit-floor{position:absolute;z-index:0;left:0;right:0;bottom:0;height:7%;background:linear-gradient(#ece7e3,#fbf5ed);box-shadow:0 -4px 15px #b8aba519}.portfolio-image-trail .pit-floor::before{content:"";position:absolute;width:55%;height:75%;left:22.5%;bottom:0;border-radius:50%;background:#70686238;filter:blur(12px)}.portfolio-image-trail .pit-trail,.portfolio-image-trail .pit-still-trail{position:absolute;z-index:1;inset:0;width:100%;height:100%;pointer-events:none}.portfolio-image-trail .pit-still-trail{object-fit:cover}.portfolio-image-trail .pit-portrait{position:absolute;z-index:2;height:100%;width:auto;max-width:none;left:52.78%;bottom:0;transform:translateX(-50%);pointer-events:none;user-select:none;object-fit:contain}.portfolio-image-trail .pit-header{position:absolute;z-index:4;left:2%;right:2%;top:4.35%;display:flex;align-items:center;justify-content:space-between;gap:10px}.portfolio-image-trail .pit-identity,.portfolio-image-trail .pit-availability{display:inline-flex;align-items:center;gap:clamp(3px,.5cqw,7px);height:clamp(20px,2.85cqw,32px);padding:3px clamp(6px,.85cqw,12px);border-radius:999px;background:#8d8b8bbb;backdrop-filter:blur(14px);color:#fff;white-space:nowrap;font-size:clamp(6.5px,.93cqw,11px);line-height:1}.portfolio-image-trail .pit-identity{padding-left:3px}.portfolio-image-trail .pit-initials{width:clamp(15px,2.1cqw,25px);height:clamp(15px,2.1cqw,25px);display:grid;place-items:center;border-radius:50%;background:#daff74;color:#30352a;font-size:clamp(6px,.85cqw,10px);font-weight:650}.portfolio-image-trail .pit-availability>span{display:block;width:4px;height:4px;border-radius:50%;background:#d8ff7a;box-shadow:0 0 6px #d8ff7a44}.portfolio-image-trail .pit-navigation{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:clamp(3px,.45cqw,7px);padding:3px clamp(5px,.9cqw,12px);height:clamp(21px,3cqw,34px);border-radius:999px;background:#8d8b8bcc;backdrop-filter:blur(16px);white-space:nowrap}.portfolio-image-trail .pit-nav-link{display:flex;align-items:center;justify-content:center;height:100%;padding:0 clamp(4px,.7cqw,10px);border:0;border-radius:99px;color:#fff;background:transparent;font-size:clamp(6.5px,.93cqw,11px);line-height:1;cursor:pointer;transition:background .2s}.portfolio-image-trail .pit-nav-link:hover{background:#ffffff21}.portfolio-image-trail .pit-introduction{position:absolute;z-index:5;left:2%;bottom:4.4%;width:28.5%;padding:clamp(12px,1.7cqw,23px);border:1px solid #ffffff18;border-radius:clamp(12px,1.75cqw,22px);background:#737273b5;backdrop-filter:blur(20px);box-shadow:0 8px 18px #55504f0d}.portfolio-image-trail .pit-role{display:flex;align-items:center;gap:6px;margin:0 0 clamp(7px,1cqw,14px);font-family:"Courier New",monospace;font-size:clamp(5px,.68cqw,9px);font-weight:400;letter-spacing:.12em;line-height:1.4;white-space:nowrap}.portfolio-image-trail .pit-role>span{width:10px;height:1px;background:#d7ff7955}.portfolio-image-trail .pit-introduction h2{margin:0;font-size:clamp(18px,3.35cqw,42px);line-height:1.05;font-weight:500;letter-spacing:-.065em}.portfolio-image-trail .pit-introduction em{font-family:Georgia,"Times New Roman",serif;font-weight:400;color:#d7ff59;letter-spacing:-.045em}.portfolio-image-trail .pit-description{margin:clamp(8px,1.25cqw,16px) 0 clamp(10px,1.4cqw,19px);font-size:clamp(7px,.98cqw,12px);line-height:1.45;letter-spacing:-.025em;color:#f5f4f4;white-space:pre-line}.portfolio-image-trail .pit-actions{display:flex;align-items:center;gap:clamp(4px,.7cqw,10px);white-space:nowrap}.portfolio-image-trail .pit-work-action,.portfolio-image-trail .pit-contact-action{display:inline-flex;align-items:center;justify-content:center;gap:clamp(4px,.75cqw,10px);min-height:clamp(23px,3.15cqw,38px);padding:3px clamp(8px,1.2cqw,16px);border:0;border-radius:999px;font-size:clamp(7px,.97cqw,12px);font-weight:500;letter-spacing:-.035em;line-height:1;cursor:pointer;transition:transform .2s,background .2s}.portfolio-image-trail .pit-work-action{padding-right:4px;background:#d8ff63;color:#141910;box-shadow:0 0 15px #d8ff6330}.portfolio-image-trail .pit-work-action:hover{background:#e3ff8c;transform:translateY(-1px)}.portfolio-image-trail .pit-contact-action{background:#ffffff13;color:#fff;padding-left:clamp(7px,.9cqw,13px);padding-right:clamp(7px,.9cqw,13px)}.portfolio-image-trail .pit-contact-action:hover{background:#ffffff28}.portfolio-image-trail .pit-arrow{display:grid;place-items:center;flex-shrink:0;width:clamp(16px,2.25cqw,27px);height:clamp(16px,2.25cqw,27px);border-radius:50%;background:#161b14;color:#d8ff63;font-family:Arial,sans-serif;font-size:clamp(10px,1.4cqw,17px)}.portfolio-image-trail .pit-signature{position:absolute;z-index:4;right:1.9%;top:42%;writing-mode:vertical-rl;font-family:"Courier New",monospace;color:#858182;font-size:clamp(5px,.72cqw,9px);font-weight:600;letter-spacing:.15em;line-height:1}.portfolio-image-trail .pit-metadata{position:absolute;z-index:4;right:2%;bottom:4.4%;display:flex;align-items:flex-end;flex-direction:column;gap:5px;font-family:"Courier New",monospace;font-size:clamp(5px,.64cqw,8px);letter-spacing:.11em;line-height:1.1;font-weight:650;white-space:nowrap}.portfolio-image-trail .pit-technologies,.portfolio-image-trail .pit-location{display:flex;gap:5px}.portfolio-image-trail .pit-technologies>span,.portfolio-image-trail .pit-location>span{display:inline-flex;align-items:center;justify-content:center;min-height:clamp(16px,2.15cqw,24px);padding:4px clamp(6px,.9cqw,12px);border-radius:999px;background:#8e8c8fbb;backdrop-filter:blur(12px);color:#fbfaf9}.portfolio-image-trail .pit-location>span{gap:5px}.portfolio-image-trail .pit-location strong{color:#daef85;font-weight:inherit}.portfolio-image-trail .pit-details{position:absolute;z-index:7;right:3%;top:17%;width:min(330px,44%);padding:20px;border:1px solid #ffffff3d;border-radius:18px;background:#656463ee;backdrop-filter:blur(22px);box-shadow:0 16px 45px #49424130;color:#fff}.portfolio-image-trail .pit-details:focus{outline:none}.portfolio-image-trail .pit-details-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.portfolio-image-trail .pit-details h3{margin:0;font-size:18px;font-weight:550;letter-spacing:-.04em}.portfolio-image-trail .pit-close{display:grid;place-items:center;flex-shrink:0;width:30px;height:30px;padding:0;border:1px solid #ffffff20;border-radius:50%;background:#ffffff12;color:white;font-size:22px;line-height:1;cursor:pointer}.portfolio-image-trail .pit-details p{margin:0;color:#edeceb;font-size:12px;line-height:1.6}.portfolio-image-trail .pit-projects{list-style:none;padding:0;margin:0}.portfolio-image-trail .pit-projects li+li{margin-top:15px;padding-top:15px;border-top:1px solid #ffffff20}.portfolio-image-trail .pit-projects strong,.portfolio-image-trail .pit-projects a{font-size:13px;font-weight:550;color:#e2ff94}.portfolio-image-trail .pit-projects p{margin-top:3px;font-size:11px}.portfolio-image-trail .pit-detail-chips{display:flex;flex-wrap:wrap;gap:6px}.portfolio-image-trail .pit-detail-chips>span{padding:7px 10px;border:1px solid #d8ff6340;border-radius:99px;font-size:10px;color:#e2ff94}.portfolio-image-trail .pit-email{display:block;margin-top:12px;font-size:13px;color:#e2ff94;overflow-wrap:anywhere}
@container(max-width:540px){.portfolio-image-trail:not(.pit-thumbnail) .pit-stage{aspect-ratio:auto;min-height:510px}.portfolio-image-trail:not(.pit-thumbnail) .pit-header{top:16px;left:14px;right:14px}.portfolio-image-trail:not(.pit-thumbnail) .pit-identity,.portfolio-image-trail:not(.pit-thumbnail) .pit-availability{height:25px;font-size:9px}.portfolio-image-trail:not(.pit-thumbnail) .pit-initials{width:19px;height:19px;font-size:8px}.portfolio-image-trail:not(.pit-thumbnail) .pit-navigation{top:74px;left:calc(55% - 25px);width:180px;height:29px;gap:0;padding:3px 6px}.portfolio-image-trail:not(.pit-thumbnail) .pit-nav-link{flex:1;font-size:9px;padding:0}.portfolio-image-trail:not(.pit-thumbnail) .pit-portrait{height:86%;left:55%}.portfolio-image-trail:not(.pit-thumbnail) .pit-introduction{left:14px;bottom:62px;width:234px;padding:15px;border-radius:16px}.portfolio-image-trail:not(.pit-thumbnail) .pit-role{font-size:6px;margin-bottom:9px}.portfolio-image-trail:not(.pit-thumbnail) .pit-introduction h2{font-size:27px}.portfolio-image-trail:not(.pit-thumbnail) .pit-description{font-size:8px;margin:10px 0 12px}.portfolio-image-trail:not(.pit-thumbnail) .pit-actions{gap:7px}.portfolio-image-trail:not(.pit-thumbnail) .pit-work-action,.portfolio-image-trail:not(.pit-thumbnail) .pit-contact-action{font-size:8px;min-height:29px;padding:3px 10px}.portfolio-image-trail:not(.pit-thumbnail) .pit-work-action{padding-right:4px}.portfolio-image-trail:not(.pit-thumbnail) .pit-arrow{width:20px;height:20px;font-size:13px}.portfolio-image-trail:not(.pit-thumbnail) .pit-metadata{right:14px;bottom:15px;font-size:6px;gap:5px}.portfolio-image-trail:not(.pit-thumbnail) .pit-technologies>span,.portfolio-image-trail:not(.pit-thumbnail) .pit-location>span{min-height:17px;padding:4px 8px}.portfolio-image-trail:not(.pit-thumbnail) .pit-signature{right:13px;top:32%;font-size:6px}.portfolio-image-trail:not(.pit-thumbnail) .pit-details{top:97px;left:14px;right:14px;width:auto;padding:18px}}
.portfolio-image-trail.pit-thumbnail{height:100%;display:flex;align-items:center;background:#ece8e5;pointer-events:none}.portfolio-image-trail.pit-thumbnail .pit-stage{height:auto;min-height:0;aspect-ratio:1440/690;flex-shrink:0}.portfolio-image-trail.pit-thumbnail .pit-header{top:4.35%;left:2%;right:2%}.portfolio-image-trail.pit-thumbnail .pit-identity,.portfolio-image-trail.pit-thumbnail .pit-availability{height:13px;padding:2px 4px;font-size:4.5px;gap:3px}.portfolio-image-trail.pit-thumbnail .pit-initials{width:9px;height:9px;font-size:4px}.portfolio-image-trail.pit-thumbnail .pit-identity{padding-left:2px}.portfolio-image-trail.pit-thumbnail .pit-navigation{width:19.45cqw;height:3.05cqw;padding:1px 2px;gap:0}.portfolio-image-trail.pit-thumbnail .pit-nav-link{flex:1;font-size:3.2px;padding:0}.portfolio-image-trail.pit-thumbnail .pit-availability>span{width:2px;height:2px}.portfolio-image-trail.pit-thumbnail .pit-introduction{width:28.5%;left:2%;bottom:4.4%;padding:6px;border-radius:7px}.portfolio-image-trail.pit-thumbnail .pit-role{font-size:3px;letter-spacing:.05em;gap:3px;margin-bottom:4px}.portfolio-image-trail.pit-thumbnail .pit-role>span{width:5px}.portfolio-image-trail.pit-thumbnail .pit-introduction h2{font-size:clamp(10px,3.35cqw,16px);line-height:1.06}.portfolio-image-trail.pit-thumbnail .pit-description{font-size:3.5px;line-height:1.45;margin:6px 0}.portfolio-image-trail.pit-thumbnail .pit-actions{gap:3px}.portfolio-image-trail.pit-thumbnail .pit-work-action,.portfolio-image-trail.pit-thumbnail .pit-contact-action{min-height:13px;font-size:3.8px;padding:2px 4px;gap:3px}.portfolio-image-trail.pit-thumbnail .pit-work-action{padding-right:2px}.portfolio-image-trail.pit-thumbnail .pit-arrow{width:9px;height:9px;font-size:7px}.portfolio-image-trail.pit-thumbnail .pit-metadata{font-size:3px;gap:3px;right:2%;bottom:4.4%;letter-spacing:.05em}.portfolio-image-trail.pit-thumbnail .pit-technologies,.portfolio-image-trail.pit-thumbnail .pit-location{gap:3px}.portfolio-image-trail.pit-thumbnail .pit-technologies>span,.portfolio-image-trail.pit-thumbnail .pit-location>span{min-height:10px;padding:3px 4px;gap:3px}.portfolio-image-trail.pit-thumbnail .pit-signature{font-size:3px;right:3%}.portfolio-image-trail.pit-thumbnail *,.portfolio-image-trail.pit-thumbnail *::before,.portfolio-image-trail.pit-thumbnail *::after{animation:none!important;transition:none!important}
@media(prefers-reduced-motion:reduce){.portfolio-image-trail *,.portfolio-image-trail *::before,.portfolio-image-trail *::after{animation:none!important;transition:none!important}}
`;
