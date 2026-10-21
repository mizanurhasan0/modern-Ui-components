"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { caseStudies } from "@/lib/case-studies";
import { CrmScreen } from "./crm-screen";
import { DeskScene, type DeskProjectId } from "./desk-scene";
import { MarketplaceScreen } from "./marketplace-screen";
import { RaceScreen } from "./race-screen";
import styles from "./desk-showcase.module.css";

type Project = {
  id: DeskProjectId;
  slug: string;
  number: string;
  role: string;
  title: string;
  summary: string;
  /** One line of "what can I do here" help, shown in the full-screen sheet on phones. */
  hint: string;
};

function buildProject(id: DeskProjectId, slug: string, summary: string, hint: string): Project {
  const study = caseStudies.find((item) => item.slug === slug);
  if (!study) throw new Error(`Missing case study: ${slug}`);
  return { id, slug, number: study.number, role: study.role, title: study.title, summary, hint };
}

const PROJECTS: Record<DeskProjectId, Project> = {
  crm: buildProject(
    "crm",
    "leadpylot-crm",
    "Pipeline UI, realtime updates, and admin workflows for sales teams.",
    "Drag a lead card into another column to move it through the pipeline.",
  ),
  marketplace: buildProject(
    "marketplace",
    "mypick",
    "Commerce portals, a marketplace API, and the promoter journey.",
    "Choose a product, then follow the order from seller to promoter to shopper.",
  ),
};

const PROJECT_ORDER: readonly DeskProjectId[] = ["crm", "marketplace"];

function otherProject(id: DeskProjectId): DeskProjectId {
  return id === "crm" ? "marketplace" : "crm";
}

const OPEN_MS = 380;
const CLOSE_MS = 320;
const EASE_OUT = "cubic-bezier(0.2, 0.85, 0.25, 1)";
const EASE_IN = "cubic-bezier(0.5, 0, 0.75, 0.2)";
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function focusableWithin(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden",
  );
}

/** Transform that makes `target` look like `trigger` (a FLIP "first" frame), or null when it cannot be done. */
function originTransform(trigger: HTMLElement | null, target: HTMLElement): string | null {
  if (!trigger) return null;
  const from = trigger.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (from.width < 8 || from.height < 8 || to.width < 8) return null;
  const offscreen =
    from.bottom < 0 || from.top > window.innerHeight || from.right < 0 || from.left > window.innerWidth;
  if (offscreen) return null;
  const scale = from.width / to.width;
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  return `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${scale.toFixed(4)})`;
}

const FALLBACK_TRANSFORM = "translateY(16px) scale(0.97)";

/** Exact complement of the stylesheet's `max-width: 720px` phone layout (no gap at fractional widths). */
const DESKTOP_QUERY = "not all and (max-width: 720px)";

function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

/** The server (and the hydration pass) renders the phone layout; the real answer arrives right after. */
function getDesktopServerSnapshot() {
  return false;
}

/** Lock page scroll without letting the layout jump when the scrollbar disappears. */
function useBodyScrollLock() {
  useLayoutEffect(() => {
    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    const currentPadding = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, []);
}

/** Escape closes (unless something inside already handled it); Tab/Shift+Tab cycle inside `rootRef`. */
function useModalKeys(rootRef: RefObject<HTMLElement | null>, onEscape: () => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (event.key === "Escape") {
        if (event.defaultPrevented) return;
        event.preventDefault();
        onEscape();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusableWithin(root);
      if (items.length === 0) {
        event.preventDefault();
        root.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!(active instanceof Node) || !root.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      } else if (event.shiftKey && (active === first || !items.includes(active as HTMLElement))) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [rootRef, onEscape]);
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 2.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * "Explore case study": an outlined pill with a case-file number, a label and a round arrow chip. On hover or
 * focus a fill spreads out from the chip, a ring draws itself around it and the arrow swings from diagonal to
 * straight. `tone="solid"` is the dark version used on the focus-mode sheet.
 */
function CaseStudyLink({ project, tone = "light", className = "" }: { project: Project; tone?: "light" | "solid"; className?: string }) {
  return (
    <Link
      href={`/work/${project.slug}`}
      className={`${styles.case} ${tone === "solid" ? styles.caseSolid : ""} ${className}`.trim()}
    >
      <span className={styles.caseFill} aria-hidden="true" />
      <span className={styles.caseIndex} aria-hidden="true">{project.number}</span>
      <span className={styles.caseLabel}>
        Explore case study<span className={styles.srOnly}> for {project.title}</span>
      </span>
      <span className={styles.caseChip} aria-hidden="true">
        <svg className={styles.caseRing} viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" pathLength="100" />
        </svg>
        <svg className={styles.caseArrow} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2.5 8h10.5M8.6 3.6 13 8l-4.4 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}

function Caption({ project }: { project: Project }) {
  return (
    <div className={styles.caption}>
      <p className={styles.captionMeta}>
        {project.number} / {project.role}
      </p>
      <h3 className={styles.captionTitle}>{project.title}</h3>
      <p className={styles.captionSummary}>{project.summary}</p>
      <CaseStudyLink project={project} />
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3.5 10.5l7-7M4.6 3.5h5.9v5.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** "Full work history": a dark pill with a travelling light ring, a text roll and an arrow that slides through its chip. */
function HistoryButton() {
  return (
    <Link href="/about#professional-work" className={styles.historyButton}>
      <span className={styles.historyFace}>
        <span className={styles.historyLabel}>
          <span className={styles.historyText}>Full work history</span>
          <span className={`${styles.historyText} ${styles.historyTextClone}`} aria-hidden="true">
            Full work history
          </span>
        </span>
        <span className={styles.historyChip} aria-hidden="true">
          <span className={styles.historyArrow}><ArrowIcon /></span>
          <span className={`${styles.historyArrow} ${styles.historyArrowClone}`}><ArrowIcon /></span>
        </span>
      </span>
    </Link>
  );
}

type FocusDialogProps = {
  initialId: DeskProjectId;
  getTrigger: (id: DeskProjectId) => HTMLElement | null;
  onClosed: (id: DeskProjectId) => void;
};

function FocusDialog({ initialId, getTrigger, onClosed }: FocusDialogProps) {
  const [shown, setShown] = useState<DeskProjectId>(initialId);
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bezelRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const shownRef = useRef<DeskProjectId>(initialId);
  const closingRef = useRef(false);
  const fadeOutRef = useRef<Animation | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const project = PROJECTS[shown];
  const next = PROJECTS[otherProject(shown)];

  useBodyScrollLock();

  // Open: FLIP zoom from the monitor on the desk (plain fade when motion is reduced).
  useLayoutEffect(() => {
    const root = rootRef.current;
    const backdrop = backdropRef.current;
    const bezel = bezelRef.current;
    const top = topRef.current;
    const bottom = bottomRef.current;
    if (!root || !backdrop || !bezel || !top || !bottom) return;
    const animations: Animation[] = [];
    if (prefersReducedMotion()) {
      animations.push(root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" }));
    } else {
      const from = originTransform(getTrigger(initialId), bezel) ?? FALLBACK_TRANSFORM;
      animations.push(
        backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" }),
        bezel.animate(
          [
            { transform: from, opacity: 0.55 },
            { transform: "none", opacity: 1 },
          ],
          { duration: OPEN_MS, easing: EASE_OUT },
        ),
      );
      for (const element of [top, bottom]) {
        animations.push(
          element.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 220,
            delay: 160,
            easing: "ease-out",
            fill: "backwards",
          }),
        );
      }
    }
    return () => {
      for (const animation of animations) animation.cancel();
    };
  }, [getTrigger, initialId]);

  // Move focus into the dialog. The heading (not a button) keeps a held-down Enter from
  // activating "Close" the moment the dialog opens, and Tab still lands on Close first.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    },
    [],
  );

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const id = shownRef.current;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onClosed(id);
    };
    const root = rootRef.current;
    const backdrop = backdropRef.current;
    const bezel = bezelRef.current;
    const top = topRef.current;
    const bottom = bottomRef.current;
    if (!root || !backdrop || !bezel || !top || !bottom) {
      finish();
      return;
    }
    closeTimerRef.current = window.setTimeout(finish, CLOSE_MS + 400);
    if (prefersReducedMotion()) {
      const fade = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-in", fill: "forwards" });
      fade.onfinish = finish;
      return;
    }
    for (const element of [backdrop, bezel, top, bottom]) {
      for (const animation of element.getAnimations()) animation.cancel();
    }
    const to = originTransform(getTrigger(id), bezel) ?? FALLBACK_TRANSFORM;
    const zoom = bezel.animate(
      [
        { transform: "none", opacity: 1 },
        { transform: to, opacity: 0.4 },
      ],
      { duration: CLOSE_MS, easing: EASE_IN, fill: "forwards" },
    );
    zoom.onfinish = finish;
    backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLOSE_MS, easing: "ease-in", fill: "forwards" });
    for (const element of [top, bottom]) {
      element.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-in", fill: "forwards" });
    }
  }, [getTrigger, onClosed]);

  useModalKeys(rootRef, requestClose);

  // Short cross-fade when switching projects in place.
  const handleNext = () => {
    if (closingRef.current || fadeOutRef.current) return;
    const target = otherProject(shown);
    const panel = panelRef.current;
    if (!panel || prefersReducedMotion()) {
      setShown(target);
      return;
    }
    const fadeOut = panel.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 140,
      easing: "ease-in",
      fill: "forwards",
    });
    fadeOutRef.current = fadeOut;
    fadeOut.onfinish = () => setShown(target);
  };

  useEffect(() => {
    const fadeOut = fadeOutRef.current;
    if (!fadeOut) return;
    fadeOutRef.current = null;
    fadeOut.cancel();
    panelRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
  }, [shown]);

  // Announce which project is showing (set after mount so screen readers pick the change up).
  useEffect(() => {
    const live = liveRef.current;
    if (!live) return;
    const timer = window.setTimeout(() => {
      live.textContent = `Opened ${PROJECTS[shown].title}`;
    }, 160);
    return () => window.clearTimeout(timer);
  }, [shown]);

  return (
    <div
      ref={rootRef}
      className={styles.dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-cursor-knight-hide
      tabIndex={-1}
    >
      <div ref={backdropRef} className={styles.backdrop} onClick={requestClose} aria-hidden="true" />
      <div ref={panelRef} className={styles.panel}>
        <div ref={topRef} className={styles.top}>
          <h2 ref={headingRef} id={titleId} className={styles.dialogTitle} tabIndex={-1}>
            {project.title}
          </h2>
          <span className={styles.escChip}>Esc to close</span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={requestClose}
            aria-label={`Close ${project.title}`}
          >
            <CloseIcon />
          </button>
        </div>
        <div ref={bezelRef} className={styles.bezel}>
          <div className={`${styles.screenFrame} ${shown === "crm" ? styles.crmFrame : styles.marketFrame}`}>
            <div className={styles.screenInner}>
              {shown === "crm" ? <CrmScreen mode="interactive" /> : <MarketplaceScreen mode="interactive" />}
            </div>
          </div>
        </div>
        <div ref={bottomRef} className={styles.foot}>
          <p className={styles.hint}>{project.hint}</p>
          <div className={styles.bottom}>
            <button type="button" className={`${styles.pill} ${styles.ghost}`} onClick={requestClose}>
              Back to the desk
            </button>
            <button type="button" className={`${styles.pill} ${styles.ghost}`} onClick={handleNext}>
              Next: {next.title}
            </button>
            <CaseStudyLink project={project} tone="solid" className={styles.casePrimary} />
          </div>
        </div>
      </div>
      <div ref={liveRef} className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true" />
    </div>
  );
}

type RaceSheetProps = {
  getTrigger: () => HTMLElement | null;
  onClosed: () => void;
};

/**
 * Phone version of the game: a full-bleed portal sheet (same modal behaviour and FLIP feel as the project dialog)
 * with the portrait road filling everything below the title bar.
 */
function RaceSheet({ getTrigger, onClosed }: RaceSheetProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);

  useBodyScrollLock();

  // Open: the game frame grows out of the Play button (plain fade when motion is reduced).
  useLayoutEffect(() => {
    const root = rootRef.current;
    const top = topRef.current;
    const frame = frameRef.current;
    if (!root || !top || !frame) return;
    const animations: Animation[] = [];
    if (prefersReducedMotion()) {
      animations.push(root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" }));
    } else {
      const from = originTransform(getTrigger(), frame) ?? FALLBACK_TRANSFORM;
      animations.push(
        root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: "ease-out" }),
        frame.animate(
          [
            { transform: from, opacity: 0.55 },
            { transform: "none", opacity: 1 },
          ],
          { duration: OPEN_MS, easing: EASE_OUT },
        ),
        top.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 220,
          delay: 160,
          easing: "ease-out",
          fill: "backwards",
        }),
      );
    }
    return () => {
      for (const animation of animations) animation.cancel();
    };
  }, [getTrigger]);

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    },
    [],
  );

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onClosed();
    };
    const root = rootRef.current;
    const top = topRef.current;
    const frame = frameRef.current;
    if (!root || !top || !frame) {
      finish();
      return;
    }
    closeTimerRef.current = window.setTimeout(finish, CLOSE_MS + 400);
    for (const element of [root, top, frame]) {
      for (const animation of element.getAnimations()) animation.cancel();
    }
    if (prefersReducedMotion()) {
      const fade = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-in", fill: "forwards" });
      fade.onfinish = finish;
      return;
    }
    const to = originTransform(getTrigger(), frame) ?? FALLBACK_TRANSFORM;
    const zoom = frame.animate(
      [
        { transform: "none", opacity: 1 },
        { transform: to, opacity: 0.4 },
      ],
      { duration: CLOSE_MS, easing: EASE_IN, fill: "forwards" },
    );
    zoom.onfinish = finish;
    root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLOSE_MS, easing: "ease-in", fill: "forwards" });
    top.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-in", fill: "forwards" });
  }, [getTrigger, onClosed]);

  useModalKeys(rootRef, requestClose);

  // Focus goes straight to the game (autoFocus); the root only has to be a valid fallback target.
  return (
    <div
      ref={rootRef}
      className={styles.raceSheet}
      role="dialog"
      aria-modal="true"
      aria-label="Desk Racer"
      data-cursor-knight-hide
      tabIndex={-1}
    >
      <div ref={topRef} className={styles.raceTop}>
        <p className={styles.raceTitle} aria-hidden="true">
          Desk Racer
        </p>
        <span className={styles.escChip}>Esc to exit</span>
        <button type="button" className={styles.closeButton} onClick={requestClose} aria-label="Close Desk Racer">
          <CloseIcon />
        </button>
      </div>
      <div ref={frameRef} className={styles.raceFrame}>
        <div className={styles.raceScreen}>
          <RaceScreen autoFocus onExit={requestClose} />
        </div>
      </div>
    </div>
  );
}

type GameMode = "inline" | "sheet";
type GamePhase = "off" | "merging" | "on" | "splitting";

/** The scene's Play / Exit toggle: the only button in the stage that is both pressable and named after the game. */
const PLAY_BUTTON_SELECTOR = 'button[aria-pressed][aria-label*="Desk Racer"]';

export function DeskShowcase() {
  const [active, setActive] = useState<DeskProjectId | null>(null);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktopSnapshot, getDesktopServerSnapshot);
  const stageRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<{ id: DeskProjectId; element: HTMLElement } | null>(null);
  const gameTriggerRef = useRef<HTMLElement | null>(null);
  const gamePhaseRef = useRef<GamePhase>("off");
  const previousGameModeRef = useRef<GameMode | null>(null);

  // Crossing the phone/desktop breakpoint while playing: drop the game in the layout it no longer fits.
  if (gameMode !== null && (gameMode === "inline") !== isDesktop) setGameMode(null);

  const getTrigger = useCallback((id: DeskProjectId) => {
    // Monitors only: the Play button is a toggle (aria-pressed), never a project trigger.
    const buttons = Array.from(
      stageRef.current?.querySelectorAll<HTMLElement>('button[aria-haspopup="dialog"]:not([aria-pressed])') ?? [],
    ).filter((button) => button.getClientRects().length > 0);
    const title = PROJECTS[id].title.toLowerCase();
    const byLabel = buttons.find((button) => (button.getAttribute("aria-label") ?? "").toLowerCase().includes(title));
    if (byLabel) return byLabel;
    const opener = openerRef.current;
    if (opener && opener.id === id && opener.element.isConnected) return opener.element;
    return buttons[PROJECT_ORDER.indexOf(id)] ?? null;
  }, []);

  const getPlayButton = useCallback(() => {
    const stored = gameTriggerRef.current;
    if (stored?.isConnected && stored.getClientRects().length > 0) return stored;
    return stageRef.current?.querySelector<HTMLElement>(PLAY_BUTTON_SELECTOR) ?? null;
  }, []);

  const gameBusy = gameMode !== null;

  const handleOpen = useCallback(
    (id: DeskProjectId, trigger: HTMLElement) => {
      if (gameBusy) return;
      openerRef.current = { id, element: trigger };
      setActive(id);
    },
    [gameBusy],
  );

  const handleClosed = useCallback(
    (id: DeskProjectId) => {
      setActive(null);
      const target = getTrigger(id) ?? openerRef.current?.element ?? null;
      target?.focus({ preventScroll: true });
    },
    [getTrigger],
  );

  // Play / Exit. Desktop merges the monitors in place; phones open the sheet (which closes itself).
  const handleGameToggle = useCallback(
    (trigger: HTMLElement) => {
      if (active) return;
      gameTriggerRef.current = trigger;
      setGameMode((current) => {
        if (current === "sheet") return current;
        if (current === "inline") return null;
        return isDesktop ? "inline" : "sheet";
      });
    },
    [active, isDesktop],
  );

  const closeGame = useCallback(() => setGameMode(null), []);

  const handleGamePhase = useCallback((phase: GamePhase) => {
    gamePhaseRef.current = phase;
  }, []);

  // The desk shows an "Esc" keycap while merged, so Escape leaves the game even when focus is elsewhere
  // (focus inside the game is handled by the game itself, which calls preventDefault first).
  useEffect(() => {
    if (gameMode !== "inline") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (gamePhaseRef.current === "merging" || gamePhaseRef.current === "splitting") return;
      setGameMode(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [gameMode]);

  // Whenever a game ends, hand focus back to the Play button.
  useEffect(() => {
    const previous = previousGameModeRef.current;
    previousGameModeRef.current = gameMode;
    if (previous !== null && gameMode === null) getPlayButton()?.focus({ preventScroll: true });
  }, [gameMode, getPlayButton]);

  const inlineGame = useMemo(() => <RaceScreen autoFocus onExit={closeGame} />, [closeGame]);

  return (
    <div className={styles.showcase} data-cursor-knight-hide>
      <header className={styles.heading}>
        <h2 id="selected-work-heading" className={styles.title}>
          Latest two projects
        </h2>
        <p className={styles.subtitle}>Open a monitor to try each project.</p>
      </header>
      <div ref={stageRef} className={styles.stage}>
        <DeskScene
          crm={<CrmScreen mode="preview" />}
          marketplace={<MarketplaceScreen mode="preview" />}
          captions={{
            crm: <Caption project={PROJECTS.crm} />,
            marketplace: <Caption project={PROJECTS.marketplace} />,
          }}
          onOpen={handleOpen}
          gameActive={gameMode === "inline"}
          onGameToggle={handleGameToggle}
          game={gameMode === "inline" ? inlineGame : null}
          onGamePhase={handleGamePhase}
        />
      </div>
      <div className={styles.footer}>
        <HistoryButton />
      </div>
      {active
        ? createPortal(
            <FocusDialog initialId={active} getTrigger={getTrigger} onClosed={handleClosed} />,
            document.body,
          )
        : null}
      {gameMode === "sheet"
        ? createPortal(<RaceSheet getTrigger={getPlayButton} onClosed={closeGame} />, document.body)
        : null}
    </div>
  );
}
