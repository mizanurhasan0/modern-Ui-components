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

/*
 * Styling lives in Tailwind classes. Most elements have two sizing modes:
 * - live: the interactive hero, scaled with container units. `@min-[541px]:`
 *   also follows the stage height (the portrait carries the recorded navbar),
 *   and `@max-[541px]:` (container width <= 540px) is the stacked phone layout.
 * - still: the fixed-scale gallery thumbnail.
 * `sized(thumbnail, shared, live, still)` picks the mode for one element; the
 * tuples below are `[shared, live, still]` class lists.
 */
function sized(thumbnail: boolean, shared: string, live: string, still = "") {
  return `${shared} ${thumbnail ? still : live}`;
}

const ROOT_CLASS =
  "portfolio-image-trail isolate min-w-0 text-white @container [font-family:var(--font-geist-sans),Arial,Helvetica,sans-serif]";
const STAGE_CLASS =
  "pit-stage relative isolate aspect-[1440/690] w-full overflow-hidden bg-[radial-gradient(ellipse_at_50%_42%,#f6f2ef_0%,#eae6e4_72%)]";
const MONO_FONT = "[font-family:Courier_New,monospace]";
const LINE_FADE =
  "transition-[background] duration-200 ease-[ease] motion-reduce:transition-none";

const PILL = [
  "inline-flex items-center rounded-[999px] bg-[#8d8b8bbb] leading-none whitespace-nowrap text-white backdrop-blur-[14px]",
  "h-[clamp(20px,2.85cqw,32px)] gap-[clamp(3px,.5cqw,7px)] px-[clamp(6px,.85cqw,12px)] py-[3px] text-[clamp(6.5px,.93cqw,11px)] @min-[541px]:h-[max(clamp(20px,2.85cqw,32px),5.95cqh)] @min-[541px]:gap-[max(clamp(3px,.5cqw,7px),1.04cqh)] @min-[541px]:px-[max(clamp(6px,.85cqw,12px),1.77cqh)] @min-[541px]:text-[max(clamp(6.5px,.93cqw,11px),1.94cqh)] @max-[541px]:h-[25px] @max-[541px]:text-[9px]",
  "h-[13px] gap-[3px] px-[4px] py-[2px] text-[4.5px]",
] as const;
const NAV_LINK = [
  "pit-nav-link flex h-full cursor-pointer items-center justify-center rounded-[99px] border-0 bg-transparent leading-none text-white",
  `no-underline ${LINE_FADE} px-[clamp(4px,.7cqw,10px)] py-0 text-[clamp(6.5px,.93cqw,11px)] hover:bg-[#ffffff21] @min-[541px]:px-[max(clamp(4px,.7cqw,10px),1.46cqh)] @min-[541px]:text-[max(clamp(6.5px,.93cqw,11px),1.94cqh)] @max-[541px]:flex-1 @max-[541px]:px-0 @max-[541px]:text-[max(9px,1.7cqh)]`,
  "flex-1 p-0 text-[3.2px]",
] as const;
const ACTION = [
  "inline-flex cursor-pointer items-center justify-center rounded-[999px] border-0 leading-none font-medium tracking-[-.035em]",
  `no-underline min-h-[clamp(23px,3.15cqw,38px)] gap-[clamp(4px,.75cqw,10px)] py-[3px] text-[clamp(7px,.97cqw,12px)] transition-[transform,background] duration-200 ease-[ease] motion-reduce:transition-none @max-[541px]:min-h-[29px] @max-[541px]:text-[8px]`,
  "min-h-[13px] gap-[3px] py-[2px] text-[3.8px]",
] as const;
const WORK_ACTION = [
  "pit-work-action bg-[#d8ff63] text-[#141910] shadow-[0_0_15px_#d8ff6330]",
  "px-[clamp(8px,1.2cqw,16px)] pr-[4px] hover:bg-[#e3ff8c] hover:[transform:translateY(-1px)] @max-[541px]:px-[10px] @max-[541px]:pr-[4px]",
  "px-[4px] pr-[2px]",
] as const;
const CONTACT_ACTION = [
  "pit-contact-action bg-[#ffffff13] text-white",
  "px-[clamp(7px,.9cqw,13px)] hover:bg-[#ffffff28] @max-[541px]:px-[10px]",
  "px-[4px]",
] as const;
const CHIP = [
  "inline-flex items-center justify-center rounded-[999px] bg-[#8e8c8fbb] text-[#fbfaf9] backdrop-blur-[12px]",
  "min-h-[clamp(16px,2.15cqw,24px)] px-[clamp(6px,.9cqw,12px)] py-[4px] @max-[541px]:min-h-[17px] @max-[541px]:px-[8px]",
  "min-h-[10px] gap-[3px] px-[4px] py-[3px]",
] as const;
const EM_CLASS =
  "font-normal tracking-[-.045em] text-[#d7ff59] [font-family:Georgia,Times_New_Roman,serif]";
const PANEL_TEXT = "m-0 text-[12px] leading-[1.6] text-[#edeceb]";
const PANEL_ACCENT = "text-[13px] font-[550] text-[#e2ff94]";

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
  const pick = (shared: string, live: string, still = "") =>
    sized(thumbnail, shared, live, still);
  const pill = pick(...PILL);
  const navLink = pick(...NAV_LINK);
  const actionClass = pick(...ACTION);
  const chip = pick(...CHIP);

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
          <span
            className={pick(
              "pit-arrow grid shrink-0 place-items-center rounded-[50%] bg-[#161b14] text-[#d8ff63] [font-family:Arial,sans-serif]",
              "size-[clamp(16px,2.25cqw,27px)] text-[clamp(10px,1.4cqw,17px)] @max-[541px]:size-[20px] @max-[541px]:text-[13px]",
              "size-[9px] text-[7px]",
            )}
            aria-hidden="true"
          >
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

  const navigationClass = pick(
    "pit-navigation absolute left-1/2 flex -translate-x-1/2 items-center rounded-[999px] bg-[#8d8b8bcc] whitespace-nowrap backdrop-blur-[16px]",
    "h-[clamp(21px,3cqw,34px)] gap-[clamp(3px,.45cqw,7px)] px-[clamp(5px,.9cqw,12px)] py-[3px] @min-[541px]:left-[calc(50%+min(0px,2.78cqw-5.8cqh))] @min-[541px]:h-[max(clamp(21px,3cqw,34px),6.26cqh)] @min-[541px]:gap-[max(clamp(3px,.45cqw,7px),.94cqh)] @min-[541px]:px-[max(clamp(5px,.9cqw,12px),1.88cqh)] @max-[541px]:top-[max(74px,calc(17.6cqh-16px))] @max-[541px]:left-[calc(55%-max(25px,4.9cqh))] @max-[541px]:h-[max(29px,5.49cqh)] @max-[541px]:w-[max(180px,34.9cqh)] @max-[541px]:gap-0 @max-[541px]:px-[6px]",
    "h-[3.05cqw] w-[19.45cqw] gap-0 px-[2px] py-[1px]",
  );
  const navigationLinks = NAVIGATION.map((section) =>
    action(section, section[0].toUpperCase() + section.slice(1), navLink),
  );

  return (
    <>
      <div
        className="pit-floor absolute inset-x-0 bottom-0 z-0 h-[7%] bg-[linear-gradient(#ece7e3,#fbf5ed)] shadow-[0_-4px_15px_#b8aba519] before:absolute before:bottom-0 before:left-[22.5%] before:h-[75%] before:w-[55%] before:rounded-[50%] before:bg-[#70686238] before:blur-[12px] before:content-['']"
        aria-hidden="true"
      />
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
                className="pit-still-trail pointer-events-none absolute inset-0 z-[1] size-full object-cover"
                src={data.trailSrc ?? "/portfolio-trail/tech-texture.webp"}
                alt=""
                style={{ clipPath: `url(#${id}-trail)` }}
              />
            </>
          )}
        </>
      ) : (
        <canvas
          ref={canvasRef}
          className="pit-trail pointer-events-none absolute inset-0 z-[1] size-full"
          aria-hidden="true"
        />
      )}
      {/* Plain images keep the copied component portable outside Next.js. */}

      <img
        className={pick(
          "pit-portrait pointer-events-none absolute bottom-0 left-[52.78%] z-[2] h-full w-auto max-w-none -translate-x-1/2 object-contain select-none",
          "[clip-path:inset(0_0_0_1%)] @max-[541px]:left-[55%] @max-[541px]:h-[86%]",
        )}
        src={data.portraitSrc ?? "/portfolio-trail/portrait.webp"}
        alt={
          thumbnail
            ? ""
            : (data.portraitAlt ?? "A thoughtful developer with a laptop")
        }
        draggable={false}
      />
      <header
        className={pick(
          "pit-header absolute top-[4.35%] right-[2%] left-[2%] z-[4] flex items-center justify-between gap-[10px]",
          "@max-[541px]:top-[16px] @max-[541px]:right-[14px] @max-[541px]:left-[14px]",
        )}
      >
        <div
          className={`pit-identity ${pill} ${thumbnail ? "pl-[2px]" : "pl-[3px] @min-[541px]:pl-[3px]"}`}
        >
          <span
            className={pick(
              "pit-initials grid place-items-center rounded-[50%] bg-[#daff74] font-[650] text-[#30352a]",
              "size-[clamp(15px,2.1cqw,25px)] text-[clamp(6px,.85cqw,10px)] @min-[541px]:size-[max(clamp(15px,2.1cqw,25px),4.38cqh)] @min-[541px]:text-[max(clamp(6px,.85cqw,10px),1.77cqh)] @max-[541px]:size-[19px] @max-[541px]:text-[8px]",
              "size-[9px] text-[4px]",
            )}
          >
            {data.initials ?? "YN"}
          </span>
          <span>{name}</span>
        </div>
        {thumbnail ? (
          <div className={navigationClass}>{navigationLinks}</div>
        ) : (
          <nav className={navigationClass} aria-label="Portfolio navigation">
            {navigationLinks}
          </nav>
        )}
        <span className={`pit-availability ${pill}`}>
          <span
            className={`block rounded-[50%] bg-[#d8ff7a] shadow-[0_0_6px_#d8ff7a44] ${thumbnail ? "size-[2px]" : "size-[4px]"}`}
            aria-hidden="true"
          />
          {data.availability ?? "Open for projects"}
        </span>
      </header>
      <div
        className={pick(
          "pit-introduction absolute bottom-[4.4%] left-[2%] z-[5] w-[28.5%] border border-[#ffffff18] bg-[#737273b5] shadow-[0_8px_18px_#55504f0d] backdrop-blur-[20px]",
          "rounded-[clamp(12px,1.75cqw,22px)] p-[clamp(12px,1.7cqw,23px)] @max-[541px]:bottom-[62px] @max-[541px]:left-[14px] @max-[541px]:w-[234px] @max-[541px]:rounded-[16px] @max-[541px]:p-[15px]",
          "rounded-[7px] p-[6px]",
        )}
      >
        <p
          className={pick(
            `pit-role m-0 flex items-center leading-[1.4] font-normal whitespace-nowrap ${MONO_FONT}`,
            "mb-[clamp(7px,1cqw,14px)] gap-[6px] text-[clamp(5px,.68cqw,9px)] tracking-[.12em] @max-[541px]:mb-[9px] @max-[541px]:text-[6px]",
            "mb-[4px] gap-[3px] text-[3px] tracking-[.05em]",
          )}
        >
          <span
            className={`h-px bg-[#d7ff7955] ${thumbnail ? "w-[5px]" : "w-[10px]"}`}
            aria-hidden="true"
          />
          {data.role ?? "FULL-STACK ENGINEER"}
        </p>
        <h2
          className={pick(
            "m-0 font-medium tracking-[-.065em]",
            "text-[clamp(18px,3.35cqw,42px)] leading-[1.05] @max-[541px]:text-[27px]",
            "text-[clamp(10px,3.35cqw,16px)] leading-[1.06]",
          )}
        >
          {data.headline ?? "Software, built"}
          <br />
          with <em className={EM_CLASS}>{data.accentText ?? "taste."}</em>
        </h2>
        <p
          className={pick(
            "pit-description mx-0 leading-[1.45] tracking-[-.025em] whitespace-pre-line text-[#f5f4f4]",
            "mt-[clamp(8px,1.25cqw,16px)] mb-[clamp(10px,1.4cqw,19px)] text-[clamp(7px,.98cqw,12px)] @max-[541px]:mt-[10px] @max-[541px]:mb-[12px] @max-[541px]:text-[8px]",
            "my-[6px] text-[3.5px]",
          )}
        >
          {data.description ??
            "I design and ship fast, considered web products,\nfrom the first sketch to production."}
        </p>
        <div
          className={pick(
            "pit-actions flex items-center whitespace-nowrap",
            "gap-[clamp(4px,.7cqw,10px)] @max-[541px]:gap-[7px]",
            "gap-[3px]",
          )}
        >
          {action(
            "work",
            "View selected work",
            `${actionClass} ${pick(...WORK_ACTION)}`,
            true,
          )}
          {action(
            "contact",
            "Get in touch",
            `${actionClass} ${pick(...CONTACT_ACTION)}`,
            true,
          )}
        </div>
      </div>
      <span
        className={pick(
          `pit-signature absolute top-[42%] z-[4] leading-none font-semibold tracking-[.15em] text-[#858182] [writing-mode:vertical-rl] ${MONO_FONT}`,
          "right-[1.9%] text-[clamp(5px,.72cqw,9px)] @max-[541px]:top-[32%] @max-[541px]:right-[13px] @max-[541px]:text-[6px]",
          "right-[3%] text-[3px]",
        )}
      >
        {data.signature ?? "PORTFOLIO / 2026"}
      </span>
      <div
        className={pick(
          `pit-metadata absolute right-[2%] bottom-[4.4%] z-[4] flex flex-col items-end leading-[1.1] font-[650] whitespace-nowrap ${MONO_FONT}`,
          "gap-[5px] text-[clamp(5px,.64cqw,8px)] tracking-[.11em] @max-[541px]:right-[14px] @max-[541px]:bottom-[15px] @max-[541px]:text-[6px]",
          "gap-[3px] text-[3px] tracking-[.05em]",
        )}
      >
        <div
          className={`pit-technologies flex ${thumbnail ? "gap-[3px]" : "gap-[5px]"}`}
        >
          {technologies.map((technology, index) => (
            <span key={`${technology}-${index}`} className={chip}>
              {technology}
            </span>
          ))}
        </div>
        <div
          className={`pit-location flex ${thumbnail ? "gap-[3px]" : "gap-[5px]"}`}
        >
          <span className={`${chip} ${thumbnail ? "" : "gap-[5px]"}`}>
            LOCAL{" "}
            <strong className="text-[#daef85] [font-weight:inherit]">
              {data.localTime ?? "05:42 PM"}
            </strong>
          </span>
          <span className={`${chip} ${thumbnail ? "" : "gap-[5px]"}`}>
            {data.location ?? "REMOTE / WORLDWIDE"}
          </span>
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
      className={`${ROOT_CLASS} relative flex w-full flex-col ${props.className ?? ""}`}
      aria-label={`${props.name ?? "Your Name"} portfolio`}
    >
      <ComponentStyles css={PORTFOLIO_STYLES} />
      <div
        ref={stage}
        className={`${STAGE_CLASS} min-h-[320px] flex-[1_0_auto] [container-type:size] @max-[541px]:aspect-auto @max-[541px]:min-h-[510px]`}
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
            className="pit-details absolute top-[17%] right-[3%] z-[7] w-[min(330px,44%)] rounded-[18px] border border-[#ffffff3d] bg-[#656463ee] p-[20px] text-white shadow-[0_16px_45px_#49424130] backdrop-blur-[22px] @max-[541px]:top-[97px] @max-[541px]:right-[14px] @max-[541px]:left-[14px] @max-[541px]:w-auto @max-[541px]:p-[18px]"
            aria-labelledby={panelTitle}
          >
            <div className="pit-details-heading mb-[12px] flex items-center justify-between gap-[12px]">
              <h3
                id={panelTitle}
                className="m-0 text-[18px] font-[550] tracking-[-.04em]"
              >
                {PANEL_TITLES[activeSection]}
              </h3>
              <button
                type="button"
                className="pit-close grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-[50%] border border-[#ffffff20] bg-[#ffffff12] p-0 text-[22px] leading-none text-white"
                aria-label="Close portfolio details"
                onClick={close}
              >
                ×
              </button>
            </div>
            {activeSection === "work" && (
              <ul className="pit-projects m-0 list-none p-0">
                {(props.projects ?? DEFAULT_PROJECTS).map((project, index) => (
                  <li
                    key={`${project.title}-${index}`}
                    className="not-first:mt-[15px] not-first:border-t not-first:border-t-[#ffffff20] not-first:pt-[15px]"
                  >
                    {project.href ? (
                      <a
                        className={`${PANEL_ACCENT} no-underline`}
                        href={project.href}
                      >
                        {project.title}
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    ) : (
                      <strong className={PANEL_ACCENT}>{project.title}</strong>
                    )}
                    <p className="m-0 mt-[3px] text-[11px] leading-[1.6] text-[#edeceb]">
                      {project.description}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {activeSection === "about" && (
              <p className={PANEL_TEXT}>
                {props.aboutText ??
                  "I build thoughtful digital experiences, bringing design and engineering together from the first sketch to production."}
              </p>
            )}
            {activeSection === "stack" && (
              <div className="pit-detail-chips flex flex-wrap gap-[6px]">
                {(props.technologies ?? DEFAULT_TECHNOLOGIES).map(
                  (technology, index) => (
                    <span
                      key={`${technology}-${index}`}
                      className="rounded-[99px] border border-[#d8ff6340] px-[10px] py-[7px] text-[10px] text-[#e2ff94]"
                    >
                      {technology}
                    </span>
                  ),
                )}
              </div>
            )}
            {activeSection === "contact" && (
              <>
                <p className={PANEL_TEXT}>
                  Have a project in mind? Let’s make something thoughtful.
                </p>
                <a
                  className={`pit-email mt-[12px] block text-[13px] wrap-anywhere text-[#e2ff94] no-underline`}
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
      className={`${ROOT_CLASS} pit-thumbnail pointer-events-none flex h-full items-center bg-[#ece8e5] ${className}`}
      aria-hidden="true"
      inert
    >
      <ComponentStyles css={PORTFOLIO_STYLES} />
      <div className={`${STAGE_CLASS} h-auto min-h-0 shrink-0`}>
        <PortfolioVisual data={{}} thumbnail previewStep={previewStep} />
      </div>
    </div>
  );
}

/*
 * Raw CSS keeps only interaction resets: a vendor-only tap highlight, and focus
 * rules that must beat the host app's global unlayered :focus-visible ring
 * (Tailwind utilities live in a cascade layer and would lose to it).
 */
const PORTFOLIO_STYLES = `
.portfolio-image-trail :is(a,button){-webkit-tap-highlight-color:transparent}
.portfolio-image-trail :is(a,button):focus-visible{outline:2px solid #e2ff8f;outline-offset:4px}
.portfolio-image-trail .pit-details:focus{outline:none}
`;
