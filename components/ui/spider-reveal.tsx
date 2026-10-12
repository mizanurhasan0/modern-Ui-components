"use client";

/* eslint-disable @next/next/no-img-element -- Embedded reference photographs keep the copied component independent of image configuration. */
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { ComponentStyles } from "./component-styles";

export type SpiderSystem = "systems" | "database" | "diagnostics";
export interface SpiderSubject {
  firstName: string;
  lastName: string;
  alias: string;
}
export interface SpiderAnomaly {
  id: string;
  name: string;
  classification: string;
  description: string;
  image?: string;
  accent?: string;
}
export interface SpiderRevealProps {
  maskedImage?: string;
  revealedImage?: string;
  subject?: SpiderSubject;
  anomalies?: readonly SpiderAnomaly[];
  /** Spotlight radius in pixels at the reference width of 720px. */
  revealRadius?: number;
  initialOverride?: boolean;
  onOverrideChange?: (enabled: boolean) => void;
  onNavigate?: (target: SpiderSystem) => void;
  onAnomalySelect?: (anomaly: SpiderAnomaly) => void;
  className?: string;
}

const DEFAULT_SUBJECT: SpiderSubject = {
  firstName: "Peter",
  lastName: "Parker",
  alias: "ARACHNID",
};
type Panel = SpiderSystem | SpiderAnomaly | null;

/*
 * Tailwind class lists shared by the interactive dossier and its gallery
 * thumbnail. `@max-[520px]:` classes respond to the component's own width and
 * are only applied to the interactive dossier, never to the thumbnail.
 */
const SR_ONLY =
  "absolute h-px w-px overflow-hidden whitespace-nowrap [clip:rect(0,0,0,0)]";
const ROOT =
  "spider-reveal @container/spider-reveal relative isolate w-full min-w-0 overflow-hidden bg-[#f2f2f2] font-[Arial,Helvetica,sans-serif] text-[#161719] [--sr-radius:19.4cqw] [--sr-x:50%] [--sr-y:50%]";
const HERO =
  "sr-hero group/hero relative isolate h-full touch-pan-y snap-start overflow-hidden bg-[#f2f2f2] transition-[background] duration-180 ease-[ease] [--sr-ink:#074b9c] data-[override=true]:bg-[#4c4c4f] data-[override=true]:[--sr-ink:#f22a53]";
const PORTRAIT =
  "sr-portrait pointer-events-none absolute top-0 h-[98.88%] select-none [clip-path:polygon(0_0,72%_0,72%_16%,100%_16%,100%_100%,0_100%)]";
const MAIN_PORTRAIT = `${PORTRAIT} left-[56.11%] aspect-[406/352] w-auto max-w-[72%] -translate-x-1/2 object-cover object-[50%_0] @max-[520px]:left-[13%] @max-[520px]:h-(--sr-portrait-h) @max-[520px]:w-[87%] @max-[520px]:max-w-none @max-[520px]:translate-none @max-[520px]:object-fill`;
const THUMB_PORTRAIT = `${PORTRAIT} left-[27.916%] w-[56.389%] object-fill`;
const REVEAL_LAYER = "sr-reveal-layer pointer-events-none absolute inset-0";
const HEADER =
  "sr-header absolute right-[1.4%] bottom-auto left-[1.8%] z-3 flex items-center justify-between";
const BRAND =
  "sr-brand bg-[#ffffff30] font-semibold tracking-[-.04em] text-(--sr-ink) shadow-[0_3px_7px_#00000012]";
const NAV_TEXT =
  "py-[3px] font-[monospace] leading-[1.2] font-semibold tracking-[.07em] uppercase";
const TELEMETRY =
  "sr-telemetry absolute right-[1.35%] bottom-[5.4%] z-2 flex flex-col gap-1 rounded-[3px] bg-[#28282b] text-right font-[monospace] leading-[1.2] tracking-[.02em] text-[#a9a9b0]";
const TELEMETRY_DOT =
  "inline-block size-[3px] rounded-[50%] bg-[#1669e6] group-data-[override=true]/hero:bg-[#ed284e] group-data-[override=true]/hero:text-[#ed284e]";
const TELEMETRY_STATUS =
  "font-normal text-[#2770ce] group-data-[override=true]/hero:text-[#ed284e]";
const PARTICLE =
  "sr-particle pointer-events-none absolute size-0.5 bg-[#176dc9] opacity-60 group-data-[override=true]/hero:bg-[#e8224c]";
const ANOMALIES =
  "sr-anomalies relative min-h-full snap-start bg-[#050506] px-[7.2%] pb-[3%] text-white";
const ANOMALY_INTRO =
  "sr-anomaly-intro mb-[5.4cqw] flex items-center justify-between gap-[30px]";
const ANOMALY_TITLE =
  "text-[4.4cqw] leading-none font-medium tracking-[-.04em]";
const OUTLINED_TITLE = "text-transparent [-webkit-text-stroke:.6px_#c3c3c5]";
const CARD_GRID = "sr-card-grid grid grid-cols-3 gap-[2.4cqw]";
const CARD =
  "sr-card group/card block min-w-0 rounded-[5px] border border-[#15151a] bg-[#0a0a0d] p-[1.4cqw] text-left text-white transition-[border-color,background,translate] duration-180 ease-[ease] hover:-translate-y-0.5 hover:border-[color:var(--sr-accent,#ed284e)] hover:bg-[#100a0e] focus-visible:-translate-y-0.5 focus-visible:border-[color:var(--sr-accent,#ed284e)] focus-visible:bg-[#100a0e]";
const CARD_ID =
  "sr-card-id mb-[1.4cqw] flex items-center justify-between font-[monospace] leading-none font-medium tracking-[.08em] text-[#a8a8ad]";
const CARD_DOT =
  "block size-1 rounded-[50%] bg-(--sr-accent) shadow-[0_0_9px_var(--sr-accent)]";
const CARD_IMAGE =
  "sr-card-image relative block aspect-[1.6] w-full overflow-hidden bg-[#020203]";
const CARD_PHOTO =
  "block size-full object-cover [filter:grayscale(.75)_brightness(.6)] transition-[filter,scale] duration-250 ease-[ease] group-hover/card:scale-103 group-hover/card:[filter:none] group-focus-visible/card:scale-103 group-focus-visible/card:[filter:none]";
const CLASSIFICATION =
  "sr-classification absolute bottom-[7px] left-1.5 border border-[color-mix(in_srgb,var(--sr-accent)_25%,transparent)] p-[3px] font-[monospace] leading-none font-medium text-(--sr-accent) uppercase";
const THREAT =
  "sr-threat flex gap-[3px] font-[monospace] text-[12px] leading-none text-[#838388]";
const CARD_TITLE =
  "mt-[1.2cqw] mb-[.65cqw] leading-[1.2] font-semibold tracking-[-.035em] uppercase";
const DIALOG_TEXT = "text-[13px] leading-[1.7] text-[#aeb8c9]";
const DIALOG_FACTS = "font-[monospace] text-[10px] leading-[1.5]";
const DIALOG_ROW = "my-3 flex justify-between gap-5";
const DIALOG_VALUE = "text-[#5e9cff]";

/** Biography sizing differs between the interactive dossier and the thumbnail. */
const BIOGRAPHY_VARIANTS = {
  main: {
    card: "top-[26.8%] px-[1.6cqw] pt-[1.7cqw] pb-[1.9cqw] @max-[520px]:top-auto @max-[520px]:bottom-[22px] @max-[520px]:left-[18px] @max-[520px]:w-[210px] @max-[520px]:p-4",
    status: "mb-[2.2cqw] @max-[520px]:mb-4 @max-[520px]:text-[6px]",
    name: "text-[3.43cqw] @max-[520px]:mb-[17px] @max-[520px]:text-[29px]",
    facts: "@max-[520px]:text-[6px]",
    override: "@max-[520px]:mt-3.5 @max-[520px]:text-[7px]",
    icon: "@max-[520px]:size-6",
  },
  thumbnail: {
    card: "top-[31%] px-[1.4cqw] py-[2cqw]",
    status: "mb-[2cqw]",
    name: "text-[3.6cqw]",
    facts: "",
    override: "",
    icon: "",
  },
} as const;
const OVERRIDE =
  "sr-override mt-[1.65cqw] flex items-center gap-2.5 text-left font-[monospace] text-[length:clamp(4px,.7cqw,8px)] leading-[1.5] font-semibold tracking-[.12em] text-[#d6dbea]";
const OVERRIDE_ICON =
  "grid size-[2.6cqw] flex-none place-items-center rounded-[50%] border border-[#596072] text-[9px] font-normal";
const FACT_LABEL = "text-[#8e94a5]";

function Biography({
  subject,
  overridden,
  onOverride,
  thumbnail = false,
}: {
  subject: SpiderSubject;
  overridden: boolean;
  onOverride?: () => void;
  thumbnail?: boolean;
}) {
  const variant = BIOGRAPHY_VARIANTS[thumbnail ? "thumbnail" : "main"];
  return (
    <div
      className={`sr-biography absolute left-[1.8%] z-2 w-[25.83%] overflow-hidden rounded-[3px] border border-[#50576e] bg-[#393e50] text-white shadow-[0_13px_18px_#00000020] transition-[background,border-color] duration-200 ease-[ease] group-data-[override=true]/hero:border-[#561725] group-data-[override=true]/hero:bg-[#0b0b0d] ${variant.card}`}
    >
      <p
        className={`sr-biometric flex items-center gap-1.5 font-[monospace] text-[length:clamp(4px,.66cqw,8px)] leading-[1.3] font-semibold tracking-[.16em] whitespace-nowrap text-[#d8dbea] group-data-[override=true]/hero:text-[#ee234d] ${variant.status}`}
      >
        <span className="size-[3px] rounded-[50%] bg-[#1471fb] group-data-[override=true]/hero:bg-[#ee234d]" />
        {overridden ? "IDENTITY OVERRIDE" : "BIOMETRICS SECURE"}
      </p>
      <h2
        className={`mb-[2.3cqw] font-[Arial_Black,Arial,Helvetica,sans-serif] leading-[1.04] font-[950] tracking-[-.045em] uppercase group-data-[override=true]/hero:[text-shadow:-2px_0_#ed1648,2px_1px_#325dff] ${variant.name}`}
      >
        <span className="block origin-left scale-x-108 whitespace-nowrap">
          {subject.firstName}
        </span>
        <span className="block origin-left scale-x-108 font-medium tracking-[.035em] whitespace-nowrap text-transparent [-webkit-text-stroke:.55px_#b6bed0]">
          {subject.lastName}
        </span>
      </h2>
      <dl
        className={`font-[monospace] text-[length:clamp(4px,.66cqw,7px)] leading-[1.8] text-[#d8dce6] ${variant.facts}`}
      >
        <div className="flex gap-[5px]">
          <dt className={FACT_LABEL}>PROJECT ALIAS:</dt>
          <dd className="font-semibold">{subject.alias}</dd>
        </div>
        <div className="flex gap-[5px]">
          <dt className={FACT_LABEL}>ACCESS LEVEL:</dt>
          <dd className="font-semibold text-[#2479f0] group-data-[override=true]/hero:text-[#ed2350]">
            {overridden ? "OVERRIDE" : "SECURE"}
          </dd>
        </div>
      </dl>
      {onOverride ? (
        <button
          type="button"
          className={`${OVERRIDE} cursor-pointer ${variant.override}`}
          onClick={onOverride}
          aria-pressed={overridden}
        >
          <span
            aria-hidden="true"
            className={`${OVERRIDE_ICON} ${variant.icon}`}
          >
            {overridden ? "−" : "+"}
          </span>
          <span>
            {overridden ? "RESTORE" : "INITIALIZE"}
            <br />
            {overridden ? "SECURE PROTOCOL" : "OVERRIDE SEQUENCE"}
          </span>
        </button>
      ) : (
        <span className={`${OVERRIDE} ${variant.override}`}>
          <span
            aria-hidden="true"
            className={`${OVERRIDE_ICON} ${variant.icon}`}
          >
            +
          </span>
          <span>
            INITIALIZE
            <br />
            OVERRIDE SEQUENCE
          </span>
        </span>
      )}
    </div>
  );
}

/** A pointer spotlight reveals the identity behind the mask within a technical dossier. */
export default function SpiderReveal({
  maskedImage = SPIDER_IMAGES.masked,
  revealedImage = SPIDER_IMAGES.revealed,
  subject = DEFAULT_SUBJECT,
  anomalies = SPIDER_ANOMALIES,
  revealRadius = 140,
  initialOverride = false,
  onOverrideChange,
  onNavigate,
  onAnomalySelect,
  className = "",
}: SpiderRevealProps) {
  const [overridden, setOverridden] = useState(initialOverride);
  const [revealing, setRevealing] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [coordinate, setCoordinate] = useState({ x: 50, y: 50 });
  const heroRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const touchRef = useRef<{
    x: number;
    y: number;
    moved: boolean;
    id: number;
  } | null>(null);
  const pointRef = useRef({ x: 50, y: 50 });
  const titleId = useId();
  const instructionsId = useId();
  const panelId = useId();
  const radius = Number.isFinite(revealRadius)
    ? Math.max(30, Math.min(350, revealRadius))
    : 140;

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const refresh = () =>
      hero.style.setProperty(
        "--sr-radius",
        `${(radius * hero.clientWidth) / 720}px`,
      );
    refresh();
    const observer =
      typeof ResizeObserver === "function" ? new ResizeObserver(refresh) : null;
    observer?.observe(hero);
    if (!observer) window.addEventListener("resize", refresh);
    return () => {
      observer?.disconnect();
      if (!observer) window.removeEventListener("resize", refresh);
    };
  }, [radius]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!panel || !dialog || dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }, [panel]);

  function move(x: number, y: number) {
    const next = {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
    pointRef.current = next;
    heroRef.current?.style.setProperty("--sr-x", `${next.x}%`);
    heroRef.current?.style.setProperty("--sr-y", `${next.y}%`);
    setCoordinate(next);
  }
  function point(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    move(
      ((event.clientX - rect.left) / rect.width) * 100,
      ((event.clientY - rect.top) / rect.height) * 100,
    );
  }
  function pointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") {
      const start = touchRef.current;
      if (!start) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8)
        start.moved = true;
      if (start.moved) {
        setRevealing(false);
        return;
      }
    }
    point(event);
    setRevealing(true);
  }
  function pointerDown(event: PointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button,a")) return;
    if (event.pointerType === "touch")
      touchRef.current = {
        x: event.clientX,
        y: event.clientY,
        moved: false,
        id: event.pointerId,
      };
    point(event);
    setRevealing(true);
  }
  function pointerUp(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "touch") return;
    const touch = touchRef.current;
    if (touch?.id !== event.pointerId) return;
    setRevealing(!touch.moved);
    touchRef.current = null;
  }
  function toggleOverride() {
    const next = !overridden;
    setOverridden(next);
    onOverrideChange?.(next);
  }
  function revealKey(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-5, 0],
      ArrowRight: [5, 0],
      ArrowUp: [0, -5],
      ArrowDown: [0, 5],
    };
    const delta = arrows[event.key];
    if (delta) {
      event.preventDefault();
      move(pointRef.current.x + delta[0], pointRef.current.y + delta[1]);
      setRevealing(true);
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      setRevealing((value) => !value);
    } else if (event.key === "Escape") setRevealing(false);
  }
  function openPanel(next: Exclude<Panel, null>, trigger: HTMLElement) {
    triggerRef.current = trigger;
    setPanel(next);
  }
  function closePanel() {
    const dialog = dialogRef.current;
    if (dialog && typeof dialog.close === "function" && dialog.open)
      dialog.close();
    else {
      dialog?.removeAttribute("open");
      setPanel(null);
      triggerRef.current?.focus({ preventScroll: true });
    }
  }
  function closed() {
    setPanel(null);
    if (triggerRef.current?.isConnected)
      triggerRef.current.focus({ preventScroll: true });
  }
  function navigate(target: SpiderSystem, trigger: HTMLElement) {
    if (onNavigate) {
      onNavigate(target);
      return;
    }
    if (target === "database") {
      const viewport = viewportRef.current;
      if (viewport) {
        const reduced = window.matchMedia?.(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        if (typeof viewport.scrollTo === "function")
          viewport.scrollTo({
            top: viewport.clientHeight,
            behavior: reduced ? "instant" : "smooth",
          });
        else viewport.scrollTop = viewport.clientHeight;
      }
    } else openPanel(target, trigger);
  }

  const protocol = overridden ? "OVERRIDE" : "CONNECTED";

  return (
    <section
      className={`${ROOT} flex flex-col ${className}`}
      aria-label="E.D.I.T.H identity dossier"
    >
      <ComponentStyles css={SPIDER_STYLES} />
      <div
        ref={viewportRef}
        className="sr-viewport h-[min(49.44cqw,620px)] min-h-[300px] flex-[1_0_auto] snap-y snap-proximity overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-color:#47556b_#0c0d0f] [scrollbar-width:thin] @max-[520px]:h-[520px] @max-[520px]:min-h-0"
      >
        <section
          ref={heroRef}
          className={`${HERO} min-h-full @max-[520px]:[--sr-portrait-h:min(65%,max(338px,104cqw))]`}
          data-override={overridden}
          data-revealing={revealing || overridden}
          tabIndex={0}
          aria-labelledby={titleId}
          aria-describedby={instructionsId}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerLeave={(event) => {
            if (event.pointerType !== "touch" && !touchRef.current)
              setRevealing(false);
          }}
          onPointerCancel={() => {
            touchRef.current = null;
            setRevealing(false);
          }}
          onKeyDown={revealKey}
        >
          <h1 id={titleId} className={SR_ONLY}>
            {subject.firstName} {subject.lastName}: identity reveal
          </h1>
          <p id={instructionsId} className={SR_ONLY}>
            Move your pointer or tap the portrait to reveal its identity. Focus
            this scene and press Enter or Space to toggle the reveal, then use
            arrow keys to move it. Escape hides the spotlight. The override
            button reveals the entire portrait. Scroll to known anomalies.
          </p>
          <img
            className={MAIN_PORTRAIT}
            src={maskedImage}
            alt="Masked subject portrait"
            draggable={false}
          />
          <div className={REVEAL_LAYER} aria-hidden="true">
            <img
              className={MAIN_PORTRAIT}
              src={revealedImage}
              alt=""
              draggable={false}
            />
          </div>
          <header
            className={`${HEADER} top-[5.4%] @max-[520px]:top-4 @max-[520px]:right-3 @max-[520px]:left-3`}
          >
            <button
              type="button"
              className={`${BRAND} cursor-pointer px-2 py-1.5 text-[length:clamp(9px,1.55cqw,16px)] @max-[520px]:text-[11px]`}
              onClick={(event) => openPanel("systems", event.currentTarget)}
            >
              E.D.I.T.H
            </button>
            <nav
              aria-label="Dossier navigation"
              className="flex gap-4 bg-[#ffffff22] px-2.5 py-[5px] shadow-[0_3px_7px_#00000010] @max-[520px]:gap-2.5 @max-[520px]:px-[7px]"
            >
              {(["systems", "database", "diagnostics"] as const).map(
                (target) => (
                  <button
                    key={target}
                    type="button"
                    className={`${NAV_TEXT} cursor-pointer text-[length:clamp(5px,.82cqw,9px)] @max-[520px]:text-[7px]`}
                    onClick={(event) => navigate(target, event.currentTarget)}
                  >
                    {target}
                  </button>
                ),
              )}
            </nav>
          </header>
          <Biography
            subject={subject}
            overridden={overridden}
            onOverride={toggleOverride}
          />
          <div
            className="sr-signal absolute bottom-[9.5%] left-[48%] z-2 bg-[#231017] px-0.5 py-[3px] font-[monospace] text-[.55cqw] leading-[1.3] font-medium tracking-[.12em] text-[#eee] @max-[520px]:bottom-[calc(100%_-_var(--sr-portrait-h)_+_15.6px)] @max-[520px]:text-[4px]"
            aria-hidden="true"
          >
            SIGNAL DATA
            <span className="mx-auto mt-[5px] -mb-6 block h-5 w-px bg-[#ffffff33]" />
          </div>
          <div
            className={`${TELEMETRY} p-2.5 text-[length:clamp(3px,.58cqw,6px)] @max-[520px]:right-3 @max-[520px]:bottom-[calc(100%_-_var(--sr-portrait-h)_+_26px)] @max-[520px]:p-2 @max-[520px]:text-[5px]`}
            aria-hidden="true"
          >
            <span>
              SYS.GRID <i className={TELEMETRY_DOT} />
            </span>
            <span>
              LAT: {coordinate.y.toFixed(4)} / LONG: {coordinate.x.toFixed(4)}
            </span>
            <span>
              PROTOCOL: <b className={TELEMETRY_STATUS}>{protocol}</b>
            </span>
          </div>
          <span
            className={`${PARTICLE} top-[18%] left-[22%]`}
            aria-hidden="true"
          />
          <span
            className={`${PARTICLE} top-[52%] left-[78%]`}
            aria-hidden="true"
          />
          <span
            className={`${PARTICLE} top-[72%] left-[30%]`}
            aria-hidden="true"
          />
        </section>
        <section
          className={`${ANOMALIES} pt-[5.5%] @max-[520px]:px-[18px] @max-[520px]:pt-[30px] @max-[520px]:pb-6`}
          aria-labelledby={`${titleId}-anomalies`}
        >
          <div
            className={`${ANOMALY_INTRO} @max-[520px]:mb-6 @max-[520px]:gap-3.5`}
          >
            <h2
              id={`${titleId}-anomalies`}
              className={`${ANOMALY_TITLE} @max-[520px]:text-[30px]`}
            >
              KNOWN
              <br />
              <span className={OUTLINED_TITLE}>ANOMALIES</span>
            </h2>
            <p className="max-w-[32%] text-right font-[monospace] text-[length:clamp(4px,.75cqw,9px)] leading-[1.7] text-[#73737d] @max-[520px]:max-w-[45%] @max-[520px]:text-[6px]">
              Accessing classified multiversal nodes. Real-time threat detection
              active. Proceed with caution when engaging subjects.
              <br />
              Hover to analyze.
            </p>
          </div>
          <div
            className={`${CARD_GRID} @max-[520px]:grid-cols-[1fr] @max-[520px]:gap-4`}
          >
            {anomalies.map((anomaly) => (
              <button
                key={anomaly.id}
                type="button"
                className={`${CARD} cursor-pointer @max-[520px]:grid @max-[520px]:grid-cols-[110px_1fr] @max-[520px]:gap-x-[15px] @max-[520px]:gap-y-0 @max-[520px]:p-3`}
                style={
                  {
                    "--sr-accent": anomaly.accent ?? "#ed284e",
                  } as CSSProperties
                }
                onClick={(event) => {
                  onAnomalySelect?.(anomaly);
                  openPanel(anomaly, event.currentTarget);
                }}
              >
                <span
                  className={`${CARD_ID} text-[.8cqw] @max-[520px]:col-span-full @max-[520px]:mb-2.5 @max-[520px]:text-[8px]`}
                >
                  ID-{anomaly.id}
                  <i className={CARD_DOT} />
                </span>
                <span
                  className={`${CARD_IMAGE} @max-[520px]:row-[2/4] @max-[520px]:aspect-[1.2]`}
                >
                  {anomaly.image ? (
                    <img
                      className={CARD_PHOTO}
                      src={anomaly.image}
                      alt=""
                      draggable={false}
                    />
                  ) : (
                    <span className={THREAT} aria-hidden="true">
                      ◒<span>Threat</span>
                    </span>
                  )}
                  <span
                    className={`${CLASSIFICATION} text-[.7cqw] @max-[520px]:text-[6px]`}
                  >
                    {anomaly.classification}
                  </span>
                </span>
                <h3
                  className={`${CARD_TITLE} text-[1.5cqw] @max-[520px]:mt-0 @max-[520px]:mb-[7px] @max-[520px]:self-end @max-[520px]:text-[14px]`}
                >
                  {anomaly.name}
                </h3>
                <p className="font-[monospace] text-[.76cqw] leading-[1.7] text-[#94949d] @max-[520px]:text-[8px]">
                  {anomaly.description}
                </p>
              </button>
            ))}
          </div>
          {!anomalies.length && (
            <p className="sr-no-anomalies font-[monospace] text-[12px] leading-[1.5] text-[#a4a4ab]">
              No anomalies detected.
            </p>
          )}
          <button
            className={`sr-return mt-[18px] cursor-pointer py-[5px] font-[monospace] text-[10px] leading-[1.3] text-[#8a8a98]`}
            type="button"
            onClick={() => {
              const viewport = viewportRef.current;
              if (viewport?.scrollTo)
                viewport.scrollTo({
                  top: 0,
                  behavior: window.matchMedia?.(
                    "(prefers-reduced-motion: reduce)",
                  ).matches
                    ? "instant"
                    : "smooth",
                });
              else if (viewport) viewport.scrollTop = 0;
            }}
          >
            ↑ Return to subject
          </button>
        </section>
      </div>
      <p className={SR_ONLY} role="status" aria-live="polite">
        {overridden
          ? "Identity override active. Full portrait revealed."
          : revealing
            ? "Identity spotlight active."
            : "Identity secured. Portrait masked."}
      </p>
      <dialog
        ref={dialogRef}
        className="sr-dialog max-h-[85dvh] w-[440px] max-w-[calc(100vw_-_32px)] rounded-lg border border-[#39465a] bg-[#11141b] p-0 font-[Arial,Helvetica,sans-serif] text-[#e1e6ef] shadow-[0_20px_80px_#0006] backdrop:bg-[#0009] backdrop:backdrop-blur-[4px]"
        aria-labelledby={panelId}
        onCancel={(event) => {
          event.preventDefault();
          closePanel();
        }}
        onClose={closed}
        onClick={(event) => {
          if (event.target === event.currentTarget) closePanel();
        }}
      >
        <div className="sr-dialog-content relative p-[30px]">
          <button
            type="button"
            className={`sr-dialog-close absolute top-3.5 right-4 size-7 cursor-pointer rounded-[50%] border border-[#4c5669] text-[22px] leading-none text-white`}
            aria-label="Close dossier panel"
            onClick={closePanel}
          >
            ×
          </button>
          <p className="sr-dialog-eyebrow mb-3.5 font-[monospace] text-[10px] leading-[1.4] tracking-[.1em] text-[#538ded]">
            E.D.I.T.H / CLASSIFIED
          </p>
          <h2
            id={panelId}
            className="mr-[25px] mb-[18px] text-[26px] leading-[1.15]"
          >
            {typeof panel === "object" && panel
              ? panel.name
              : panel === "diagnostics"
                ? "System diagnostics"
                : "Identity systems"}
          </h2>
          {typeof panel === "object" && panel ? (
            <>
              {panel.image && (
                <img
                  className="sr-dialog-image block max-h-[230px] w-full rounded-sm object-cover"
                  src={panel.image}
                  alt={panel.name}
                />
              )}
              <p className={DIALOG_TEXT}>{panel.description}</p>
              <dl className={DIALOG_FACTS}>
                <div className={DIALOG_ROW}>
                  <dt>NODE</dt>
                  <dd className={DIALOG_VALUE}>ID-{panel.id}</dd>
                </div>
                <div className={DIALOG_ROW}>
                  <dt>CLASSIFICATION</dt>
                  <dd className={DIALOG_VALUE}>{panel.classification}</dd>
                </div>
              </dl>
            </>
          ) : panel === "diagnostics" ? (
            <>
              <p className={DIALOG_TEXT}>
                Local biometric link established. Move your pointer to inspect
                the subject or use the keyboard reveal controls.
              </p>
              <dl className={DIALOG_FACTS}>
                <div className={DIALOG_ROW}>
                  <dt>SIGNAL</dt>
                  <dd className={DIALOG_VALUE}>CONNECTED</dd>
                </div>
                <div className={DIALOG_ROW}>
                  <dt>IDENTITY</dt>
                  <dd className={DIALOG_VALUE}>
                    {overridden ? "OVERRIDE ACTIVE" : "SECURE"}
                  </dd>
                </div>
                <div className={DIALOG_ROW}>
                  <dt>ANOMALIES</dt>
                  <dd className={DIALOG_VALUE}>{anomalies.length} TRACKED</dd>
                </div>
              </dl>
            </>
          ) : (
            <>
              <p className={DIALOG_TEXT}>
                Identity protection is {overridden ? "overridden" : "active"}{" "}
                for {subject.firstName} {subject.lastName}. Initialize the
                override sequence to inspect the unmasked portrait.
              </p>
              <button
                className={`sr-dialog-action cursor-pointer rounded-[4px] border border-[#375d9e] bg-[#192846] px-3.5 py-[11px] font-[monospace] text-[11px] leading-[1.3] text-[#e8edff]`}
                type="button"
                onClick={toggleOverride}
              >
                {overridden
                  ? "Restore secure protocol"
                  : "Initialize override sequence"}
              </button>
            </>
          )}
        </div>
      </dialog>
    </section>
  );
}

/** The gallery supplies autoplay frames; this thumbnail has no controls or timers. */
export function SpiderRevealThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  const step = Number.isFinite(previewStep)
    ? Math.abs(Math.floor(previewStep)) % 8
    : 0;
  const anomalyView = step >= 6;
  const override = step === 5;
  const style = {
    "--sr-x": `${[50, 36, 50, 64, 50, 50][step] ?? 50}%`,
    "--sr-y": "43%",
    "--sr-radius": "19cqw",
  } as CSSProperties;
  return (
    <div
      className={`${ROOT} sr-thumbnail h-full ${className}`}
      aria-hidden="true"
      inert
      style={style}
    >
      <ComponentStyles css={SPIDER_STYLES} />
      {anomalyView ? (
        <div className={`${ANOMALIES} h-full pt-[10%]`}>
          <div className={ANOMALY_INTRO}>
            <h2 className={ANOMALY_TITLE}>
              KNOWN
              <br />
              <span className={OUTLINED_TITLE}>ANOMALIES</span>
            </h2>
          </div>
          <div className={CARD_GRID}>
            {SPIDER_ANOMALIES.map((anomaly) => (
              <div
                key={anomaly.id}
                className={CARD}
                style={{ "--sr-accent": anomaly.accent } as CSSProperties}
              >
                <span className={`${CARD_ID} text-[1.1cqw]`}>
                  ID-{anomaly.id}
                  <i className={CARD_DOT} />
                </span>
                <span className={CARD_IMAGE}>
                  {anomaly.image ? (
                    <img className={CARD_PHOTO} src={anomaly.image} alt="" />
                  ) : (
                    <span className={THREAT}>Threat</span>
                  )}
                  <span className={`${CLASSIFICATION} text-[.8cqw]`}>
                    {anomaly.classification}
                  </span>
                </span>
                <h3 className={`${CARD_TITLE} text-[1.65cqw]`}>
                  {anomaly.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className={`${HERO} min-h-0`}
          data-revealing={step > 0}
          data-override={override}
        >
          <img className={THUMB_PORTRAIT} src={SPIDER_IMAGES.masked} alt="" />
          <div className={REVEAL_LAYER}>
            <img
              className={THUMB_PORTRAIT}
              src={SPIDER_IMAGES.revealed}
              alt=""
            />
          </div>
          <div className={`${HEADER} top-[9%]`}>
            <span className={`${BRAND} px-[5px] py-[3px] text-[2cqw]`}>
              E.D.I.T.H
            </span>
            <span className={`sr-thumb-nav ${NAV_TEXT} text-[1cqw]`}>
              SYSTEMS　 DATABASE　 DIAGNOSTICS
            </span>
          </div>
          <Biography
            subject={DEFAULT_SUBJECT}
            overridden={override}
            thumbnail
          />
          <span className={`${TELEMETRY} p-1.5 text-[.85cqw]`}>
            SYS.GRID / CONNECTED
          </span>
        </div>
      )}
    </div>
  );
}

const SPIDER_STYLES = `
/* Kept as CSS: must out-rank the host page's unlayered global :focus-visible ring, which beats layered utilities. */
.spider-reveal button:focus-visible,.spider-reveal .sr-hero:focus-visible{outline:2px solid #176de8;outline-offset:-4px}
/* Kept as CSS: the spotlight is a circle computed from three runtime custom properties with three exclusive states. */
.spider-reveal .sr-reveal-layer{background:#f2f2f2;clip-path:circle(0px at var(--sr-x) var(--sr-y));transition:clip-path .12s ease}
.spider-reveal .sr-hero[data-revealing=true] .sr-reveal-layer{clip-path:circle(var(--sr-radius) at var(--sr-x) var(--sr-y))}
.spider-reveal .sr-hero[data-override=true] .sr-reveal-layer{background:#4c4c4f;clip-path:circle(150% at 50% 50%)}
@media(prefers-reduced-motion:reduce){.spider-reveal *{transition:none!important;animation:none!important;scroll-behavior:auto!important}}
`;

/** Center portrait and anomaly crops from the supplied reference recording. */
const SPIDER_IMAGES = {
  masked:
    "data:image/webp;base64,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",
  revealed:
    "data:image/webp;base64,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",
  glider:
    "data:image/webp;base64,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",
  prowler:
    "data:image/webp;base64,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",
} as const;
export const SPIDER_ANOMALIES: readonly SpiderAnomaly[] = [
  {
    id: "1048",
    name: "Symbiote Alpha",
    classification: "Lethal",
    description:
      "Aggressive organic matter. High adaptability. Vulnerable to high-frequency sonics and intense thermal energy.",
    accent: "#ee2949",
  },
  {
    id: "928",
    name: "Oscorp Glider",
    classification: "Tech/Armor",
    description:
      "Weaponized aerial variants. Experimental performance enhancers detected in pilot bloodstream. High evasion.",
    image: SPIDER_IMAGES.glider,
    accent: "#d1ad24",
  },
  {
    id: "42",
    name: "Prowler Tech",
    classification: "Stealth",
    description:
      "Advanced kinetic absorption armor. Active stealth cloaking capabilities. Gauntlets emit concussive blasts.",
    image: SPIDER_IMAGES.prowler,
    accent: "#4270ff",
  },
];
