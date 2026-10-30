"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import {
  STAGES,
  STAGE_LABELS,
  autoplayStep,
  createInitialState,
  findLead,
  formatAge,
  formatMoney,
  isFull,
  leadsIn,
  moveLead,
  receiveLead,
  stageCount,
  wonRevenue,
} from "./crm-state";
import type { CrmState, Lead, Stage } from "./crm-state";
import type { ScreenMode } from "./screen-mode";
import styles from "./crm-screen.module.css";

/** Preview loop: one beat every two seconds. */
const STEP_MS = 2000;
/** Interactive mode: first arrival soon after opening, then every eight seconds. */
const FIRST_ARRIVAL_MS = 2800;
const ARRIVAL_MS = 8000;
const TOAST_MS = 2600;
/** Pointer travel (px) before a press becomes a drag. */
const DRAG_THRESHOLD = 5;

type Toast = { key: number; person: string; open: boolean };

type Model = {
  crm: CrmState;
  /** Cursor into the preview loop. */
  tick: number;
  toast: Toast | null;
  /** Bumps every time revenue grows; restarts the chip animation. */
  bump: number;
  /** The lead that just arrived (plays the enter animation once). */
  fresh: string | null;
  /** Text for the visually hidden live region. */
  status: string;
  /** Counts arrivals and moves so the stage strip can flash the one that changed. */
  moves: number;
  landed: { stage: Stage; key: number } | null;
};

type Action =
  | { type: "autoplay" }
  | { type: "receive" }
  | { type: "move"; id: string; to: Stage }
  | { type: "status"; message: string }
  | { type: "closeToast"; key: number }
  | { type: "reset" };

function createModel(status = ""): Model {
  return {
    crm: createInitialState(),
    tick: 0,
    toast: null,
    bump: 0,
    fresh: null,
    status,
    moves: 0,
    landed: null,
  };
}

function arrive(model: Model, crm: CrmState): Model {
  const lead = crm.leads[0];
  return {
    ...model,
    crm,
    fresh: lead.id,
    toast: { key: crm.received, person: lead.person, open: true },
    status: `New lead assigned: ${lead.person}, ${lead.company}`,
    moves: model.moves + 1,
    landed: { stage: "new", key: model.moves + 1 },
  };
}

function relocate(model: Model, crm: CrmState, lead: Lead, to: Stage): Model {
  return {
    ...model,
    crm,
    fresh: null,
    bump: wonRevenue(crm) > wonRevenue(model.crm) ? model.bump + 1 : model.bump,
    status: `Moved ${lead.company} to ${STAGE_LABELS[to]}`,
    moves: model.moves + 1,
    landed: { stage: to, key: model.moves + 1 },
  };
}

function reduce(model: Model, action: Action): Model {
  switch (action.type) {
    case "autoplay": {
      const { state, event } = autoplayStep(model.crm, model.tick);
      const tick = model.tick + 1;
      if (event.kind === "receive") return { ...arrive(model, state), tick };
      if (event.kind === "move") {
        const lead = findLead(model.crm, event.id);
        return lead ? { ...relocate(model, state, lead, event.to), tick } : { ...model, tick };
      }
      return { ...model, tick };
    }
    case "receive": {
      const next = receiveLead(model.crm);
      return next === model.crm ? model : arrive(model, next);
    }
    case "move": {
      const lead = findLead(model.crm, action.id);
      if (!lead) return model;
      const next = moveLead(model.crm, action.id, action.to);
      if (next !== model.crm) return relocate(model, next, lead, action.to);
      return {
        ...model,
        status:
          lead.stage === action.to
            ? `${lead.company} stays in ${STAGE_LABELS[action.to]}`
            : `${STAGE_LABELS[action.to]} is full, ${lead.company} was not moved`,
      };
    }
    case "status":
      return { ...model, status: action.message };
    case "closeToast":
      return model.toast && model.toast.key === action.key && model.toast.open
        ? { ...model, toast: { ...model.toast, open: false } }
        : model;
    case "reset":
      return createModel("Board reset");
  }
}

/* ------------------------------------------------------------------ hooks */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/** True while the screen is on screen and the tab is in the foreground. */
function useScreenActive(ref: RefObject<HTMLElement | null>): boolean {
  const [inView, setInView] = useState(true);
  const pageHidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.hidden,
    () => false,
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return inView && !pageHidden;
}

/* --------------------------------------------------------------- component */

type Held = {
  id: string;
  source: Stage;
  /** The column the lead would land in, or null while the pointer is outside. */
  target: Stage | null;
  /** "keys": keyboard or tap pick-up. "drag": a pointer drag in progress. */
  via: "keys" | "drag";
};

type DragSession = {
  pointerId: number;
  id: string;
  source: Stage;
  startX: number;
  startY: number;
  grabX: number;
  grabY: number;
  active: boolean;
};

type Ghost = { id: string; width: number; height: number };

/** Card position relative to the screen, in units of the screen width. */
type CardPoint = { nx: number; ny: number; ghost?: boolean };

function LeadFace({ lead }: { lead: Lead }) {
  return (
    <>
      <span className={styles.avatar} data-tone={lead.tone} aria-hidden="true">
        {lead.person.charAt(0)}
      </span>
      <span className={styles.person}>{lead.person}</span>
      <span className={styles.company}>{lead.company}</span>
      <span className={styles.value} data-stage={lead.stage}>
        {formatMoney(lead.value)}
      </span>
      <span className={styles.age}>{formatAge(lead.age)}</span>
    </>
  );
}

export function CrmScreen({ mode }: { mode: ScreenMode }) {
  const interactive = mode === "interactive";
  const uid = useId();
  const instructionsId = `${uid}-help`;

  const rootRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Record<Stage, HTMLElement | null>>({
    new: null,
    calling: null,
    won: null,
  });

  const segmentRefs = useRef<Record<Stage, HTMLElement | null>>({
    new: null,
    calling: null,
    won: null,
  });

  const [model, dispatch] = useReducer(reduce, undefined, createModel);
  /** Which stage the narrow layout lists; the wide layout shows all three. */
  const [view, setView] = useState<Stage>("new");
  const [held, setHeld] = useState<Held | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);

  // Mutable mirrors read by event handlers that must not see stale state.
  const heldRef = useRef<Held | null>(null);
  const dragRef = useRef<DragSession | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const ghostPointRef = useRef<{ x: number; y: number } | null>(null);
  const justDraggedRef = useRef(false);
  const focusAfterRef = useRef<string | null>(null);
  const cardPointsRef = useRef<Map<string, CardPoint>>(new Map());

  const reducedMotion = useReducedMotion();
  const active = useScreenActive(rootRef);

  function commitHeld(next: Held | null) {
    heldRef.current = next;
    setHeld(next);
  }

  /* ------------------------------------------------------------ the clocks */

  useEffect(() => {
    if (!active) return;

    if (!interactive) {
      if (reducedMotion) return;
      const timer = window.setInterval(() => dispatch({ type: "autoplay" }), STEP_MS);
      return () => window.clearInterval(timer);
    }

    let repeat: number | undefined;
    const arrive = () => {
      // Never rearrange the board underneath a lead the visitor is holding.
      if (!heldRef.current && !dragRef.current) dispatch({ type: "receive" });
    };
    const first = window.setTimeout(() => {
      arrive();
      repeat = window.setInterval(arrive, ARRIVAL_MS);
    }, FIRST_ARRIVAL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(repeat);
    };
  }, [active, interactive, reducedMotion]);

  const openToastKey = model.toast?.open ? model.toast.key : null;
  useEffect(() => {
    if (openToastKey === null) return;
    const timer = window.setTimeout(
      () => dispatch({ type: "closeToast", key: openToastKey }),
      TOAST_MS,
    );
    return () => window.clearTimeout(timer);
  }, [openToastKey]);

  /* ------------------------------------- FLIP motion and focus restoration */

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const width = root.offsetWidth;
    const rootRect = root.getBoundingClientRect();
    if (!width || !rootRect.width) return;

    const cards = root.querySelectorAll<HTMLElement>("[data-lead-id]");
    cards.forEach((card) => {
      for (const animation of card.getAnimations()) {
        if (animation.id === "flip") animation.cancel();
      }
    });

    const unit = width / 100;
    const next = new Map<string, CardPoint>();
    cards.forEach((card) => {
      const id = card.dataset.leadId;
      if (!id) return;
      const rect = card.getBoundingClientRect();
      // Cards in a hidden stage (narrow layout) have no box to animate from.
      if (!rect.width) return;
      const point = {
        nx: (rect.left - rootRect.left) / rootRect.width,
        ny: (rect.top - rootRect.top) / rootRect.width,
      };
      next.set(id, point);

      const previous = cardPointsRef.current.get(id);
      if (!previous || reducedMotion || typeof card.animate !== "function") return;
      const dx = (previous.nx - point.nx) * width;
      const dy = (previous.ny - point.ny) * width;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

      const lifted = previous.ghost || Math.abs(dx) > width * 0.06;
      const tilt = previous.ghost ? 3 : dx > 0 ? -4 : 4;
      const shadow = `drop-shadow(0 ${unit * 1.1}px ${unit * 1.6}px rgb(26 39 66 / 0.28))`;
      const animation = card.animate(
        lifted
          ? [
              {
                transform: `translate(${dx}px, ${dy}px) rotate(${tilt}deg) scale(1.04)`,
                filter: shadow,
              },
              { transform: "translate(0, 0) rotate(0deg) scale(1)", filter: "drop-shadow(0 0 0 rgb(26 39 66 / 0))" },
            ]
          : [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
        {
          duration: lifted ? 720 : 380,
          easing: "cubic-bezier(0.22, 0.8, 0.24, 1)",
        },
      );
      animation.id = "flip";
      card.style.zIndex = lifted ? "20" : "10";
      const release = () => {
        card.style.zIndex = "";
      };
      animation.onfinish = release;
      animation.oncancel = release;
    });
    cardPointsRef.current = next;

    const focusId = focusAfterRef.current;
    if (focusId) {
      focusAfterRef.current = null;
      const target = root.querySelector<HTMLElement>(`[data-lead-id="${focusId}"] button`);
      if (target && target.getClientRects().length > 0) {
        target.focus({ preventScroll: true });
      } else {
        // The card moved to a stage the narrow layout is not listing: land on its tab.
        const stage = target?.closest<HTMLElement>("section")?.dataset.stage;
        if (stage) {
          root.querySelector<HTMLElement>(`[data-segment="${stage}"]`)?.focus({ preventScroll: true });
        }
      }
    }
  }, [model, reducedMotion]);

  /* --------------------------------------------------------- ghost placement */

  const placeGhost = useCallback(() => {
    const root = rootRef.current;
    const element = ghostRef.current;
    const drag = dragRef.current;
    if (!root || !element || !drag) return;
    const rect = root.getBoundingClientRect();
    const scale = rect.width / root.offsetWidth || 1;
    const x = (pointerRef.current.x - rect.left) / scale - drag.grabX;
    const y = (pointerRef.current.y - rect.top) / scale - drag.grabY;
    element.style.transform = `translate(${x}px, ${y}px) rotate(3deg) scale(1.03)`;
    ghostPointRef.current = { x, y };
  }, []);

  useLayoutEffect(() => {
    if (ghost) placeGhost();
  }, [ghost, placeGhost]);

  /* --------------------------------------------------------- hold lifecycle */

  function stageAt(clientX: number, clientY: number): Stage | null {
    for (const stage of STAGES) {
      // The narrow layout drops onto the stage strip; hidden elements have no box.
      for (const element of [segmentRefs.current[stage], columnRefs.current[stage]]) {
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const slack = rect.width * 0.03;
        if (
          clientX >= rect.left - slack &&
          clientX <= rect.right + slack &&
          clientY >= rect.top - slack &&
          clientY <= rect.bottom + slack
        ) {
          return stage;
        }
      }
    }
    return null;
  }

  /** Lets the dropped (or returned) card fly in from where the ghost was. */
  function seedFlightFromGhost(id: string) {
    const root = rootRef.current;
    const point = ghostPointRef.current;
    if (!root || !point || !root.offsetWidth) return;
    cardPointsRef.current.set(id, {
      nx: point.x / root.offsetWidth,
      ny: point.y / root.offsetWidth,
      ghost: true,
    });
  }

  function endDrag(id: string) {
    seedFlightFromGhost(id);
    ghostPointRef.current = null;
    justDraggedRef.current = true;
    window.setTimeout(() => {
      justDraggedRef.current = false;
    }, 120);
    dragRef.current = null;
    setGhost(null);
  }

  function describeTarget(state: CrmState, stage: Stage) {
    const count = stageCount(state, stage);
    const noun = count === 1 ? "lead" : "leads";
    return `${STAGE_LABELS[stage]} column, ${count} ${noun}${isFull(state, stage) ? ", full" : ""}`;
  }

  function cancelHold(restoreFocus = true) {
    const current = heldRef.current;
    if (!current) return;
    if (current.via === "drag") endDrag(current.id);
    else if (restoreFocus) focusAfterRef.current = current.id;
    commitHeld(null);
    dispatch({ type: "status", message: "Move cancelled" });
  }

  function pickUp(lead: Lead) {
    commitHeld({ id: lead.id, source: lead.stage, target: lead.stage, via: "keys" });
    dispatch({
      type: "status",
      message: `Picked up ${lead.company} from ${STAGE_LABELS[lead.stage]}. Choose a column with the arrow keys or by selecting it, then press space to drop. Escape cancels.`,
    });
  }

  function dropHeld(stage?: Stage) {
    const current = heldRef.current;
    if (!current || current.via !== "keys") return;
    const target = stage ?? current.target ?? current.source;
    commitHeld(null);
    focusAfterRef.current = current.id;
    dispatch({ type: "move", id: current.id, to: target });
  }

  function shiftTarget(delta: number) {
    const current = heldRef.current;
    if (!current || current.via !== "keys") return;
    const from = STAGES.indexOf(current.target ?? current.source);
    const target = STAGES[Math.min(STAGES.length - 1, Math.max(0, from + delta))];
    if (target === current.target) return;
    commitHeld({ ...current, target });
    const blocked = target !== current.source && isFull(model.crm, target);
    dispatch({
      type: "status",
      message: `${describeTarget(model.crm, target)}${target === current.source ? ", where it started" : ""}. ${
        blocked ? "It cannot take another lead, choose a different column." : "Space to drop."
      }`,
    });
  }

  // A press outside the board while a lead is held ends the hold.
  const holdingViaKeys = held?.via === "keys";
  useEffect(() => {
    if (!holdingViaKeys) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root || !(event.target instanceof Node) || root.contains(event.target)) return;
      if (!heldRef.current) return;
      heldRef.current = null;
      setHeld(null);
      dispatch({ type: "status", message: "Move cancelled" });
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [holdingViaKeys]);

  /* ------------------------------------------------------------ card events */

  function onCardPointerDown(event: ReactPointerEvent<HTMLButtonElement>, lead: Lead) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (heldRef.current?.via === "keys") commitHeld(null);
    const root = rootRef.current;
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = root && root.offsetWidth ? root.getBoundingClientRect().width / root.offsetWidth : 1;
    dragRef.current = {
      pointerId: event.pointerId,
      id: lead.id,
      source: lead.stage,
      startX: event.clientX,
      startY: event.clientY,
      grabX: (event.clientX - rect.left) / scale,
      grabY: (event.clientY - rect.top) / scale,
      active: false,
    };
    pointerRef.current = { x: event.clientX, y: event.clientY };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture is a nicety; the drag still works from document-level moves.
    }
  }

  function onCardPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    pointerRef.current = { x: event.clientX, y: event.clientY };

    if (!drag.active) {
      const travelled = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      if (travelled < DRAG_THRESHOLD) return;
      drag.active = true;
      const rect = event.currentTarget.getBoundingClientRect();
      const root = rootRef.current;
      const scale = root && root.offsetWidth ? root.getBoundingClientRect().width / root.offsetWidth : 1;
      commitHeld({ id: drag.id, source: drag.source, target: drag.source, via: "drag" });
      setGhost({ id: drag.id, width: rect.width / scale, height: rect.height / scale });
      return;
    }

    placeGhost();
    const current = heldRef.current;
    const target = stageAt(event.clientX, event.clientY);
    if (current && current.target !== target) commitHeld({ ...current, target });
  }

  function onCardPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!drag.active) {
      dragRef.current = null;
      return;
    }
    const current = heldRef.current;
    const target = stageAt(event.clientX, event.clientY);
    endDrag(drag.id);
    commitHeld(null);
    if (current && target && target !== current.source) {
      dispatch({ type: "move", id: current.id, to: target });
    } else {
      dispatch({
        type: "status",
        message: target ? "Lead stays where it was" : "Move cancelled",
      });
    }
  }

  function onCardPointerCancel(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.active) cancelHold();
    else dragRef.current = null;
  }

  function onCardClick(event: ReactMouseEvent<HTMLButtonElement>, lead: Lead) {
    // The click that trails a drag must not pick the card straight back up.
    event.stopPropagation();
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    const current = heldRef.current;
    if (current?.via === "keys") {
      if (current.id === lead.id) dropHeld();
      else dropHeld(lead.stage);
      return;
    }
    pickUp(lead);
  }

  function onRootKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const current = heldRef.current;
    if (!current) return;
    if (event.key === "Escape") {
      // Escape only closes the surrounding dialog when nothing is held.
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
      cancelHold();
    } else if (current.via === "keys") {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        shiftTarget(event.key === "ArrowLeft" ? -1 : 1);
      } else if (event.key === "Tab") {
        cancelHold(false);
      }
    }
  }

  function onColumnClick(stage: Stage) {
    if (heldRef.current?.via === "keys") dropHeld(stage);
  }

  /** Narrow layout: a stage tab lists that stage, or drops the lead being held. */
  function onSegmentClick(stage: Stage) {
    if (heldRef.current?.via === "keys") {
      dropHeld(stage);
      return;
    }
    setView(stage);
    dispatch({
      type: "status",
      message: `${describeTarget(model.crm, stage)}`,
    });
  }

  function onReset() {
    setView("new");
    heldRef.current = null;
    dragRef.current = null;
    ghostPointRef.current = null;
    cardPointsRef.current = new Map();
    setHeld(null);
    setGhost(null);
    dispatch({ type: "reset" });
  }

  /* ----------------------------------------------------------------- render */

  const crm = model.crm;
  const revenue = formatMoney(wonRevenue(crm));
  const ghostLead = ghost ? findLead(crm, ghost.id) : undefined;
  const List = interactive ? "ul" : "div";
  const Item = interactive ? "li" : "div";

  const heldLead = held ? findLead(crm, held.id) : undefined;

  function dropState(stage: Stage): string | undefined {
    if (!held) return undefined;
    if (held.target === stage) {
      if (stage === held.source) return "home";
      return isFull(crm, stage) ? "full" : "target";
    }
    return held.via === "keys" ? "option" : undefined;
  }

  const rootProps = interactive
    ? ({
        role: "group",
        "aria-label": "Sales CRM lead pipeline",
        onKeyDown: onRootKeyDown,
      } as const)
    : ({ "aria-hidden": true, inert: true } as const);

  return (
    <div
      ref={rootRef}
      className={`${styles.screen} ${interactive ? styles.interactive : styles.preview}`}
      data-mode={mode}
      data-dragging={held?.via === "drag" ? "true" : undefined}
      data-holding={held ? "true" : undefined}
      {...rootProps}
    >
      <div className={styles.frame}>
        <header className={styles.bar}>
          <span className={styles.dots} aria-hidden="true">
            <i className={styles.dot} />
            <i className={styles.dot} />
            <i className={styles.dot} />
          </span>
          <span className={styles.barTitle}>lead workspace</span>
          <span className={styles.grow} />
          <span className={styles.revenue}>
            <span className={styles.revenueLabel}>Won</span>
            <span
              key={model.bump}
              className={`${styles.revenueValue} ${model.bump > 0 ? styles.revenueBump : ""}`}
            >
              {revenue}
            </span>
          </span>
          <span className={styles.tag} aria-hidden="true">
            CRM
          </span>
          {interactive ? (
            <button type="button" className={styles.reset} onClick={onReset}>
              Reset
            </button>
          ) : null}
        </header>

        {interactive ? (
          <div className={styles.strip}>
            {STAGES.map((stage) => {
              const count = stageCount(crm, stage);
              const noun = count === 1 ? "lead" : "leads";
              return (
                <button
                  key={stage}
                  type="button"
                  ref={(element) => {
                    segmentRefs.current[stage] = element;
                  }}
                  className={styles.segment}
                  data-segment={stage}
                  data-active={view === stage ? "true" : undefined}
                  data-drop={dropState(stage)}
                  aria-pressed={held ? undefined : view === stage}
                  aria-label={
                    heldLead
                      ? `Move ${heldLead.company} to ${STAGE_LABELS[stage]}, ${count} ${noun}`
                      : `${STAGE_LABELS[stage]}, ${count} ${noun}`
                  }
                  onClick={() => onSegmentClick(stage)}
                >
                  <span aria-hidden="true">{STAGE_LABELS[stage]}</span>
                  <span
                    key={model.landed?.stage === stage ? model.landed.key : 0}
                    className={`${styles.count} ${
                      model.landed?.stage === stage ? styles.countPop : ""
                    }`}
                    aria-hidden="true"
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className={styles.body}>
          <nav className={styles.side} aria-hidden="true">
            <span className={`${styles.nav} ${styles.navActive}`}>Leads</span>
            <span className={styles.nav}>Deals</span>
            <span className={styles.nav}>Tasks</span>
            <span className={styles.nav}>Team</span>
          </nav>

          {STAGES.map((stage) => {
            const cards = leadsIn(crm, stage);
            const drop = dropState(stage);
            const headingId = `${uid}-${stage}`;
            return (
              <section
                key={stage}
                ref={(element) => {
                  columnRefs.current[stage] = element;
                }}
                className={styles.column}
                data-stage={stage}
                data-view={view === stage ? "true" : undefined}
                data-drop={drop}
                aria-labelledby={interactive ? headingId : undefined}
                onClick={interactive ? () => onColumnClick(stage) : undefined}
              >
                <h3 className={styles.columnHead} id={headingId}>
                  <span className={styles.columnTitle}>{STAGE_LABELS[stage]}</span>
                  <span className={styles.count}>{stageCount(crm, stage)}</span>
                </h3>
                <List className={styles.cards}>
                  {cards.map((lead) => {
                    const holding = held?.id === lead.id;
                    const state = holding
                      ? held?.via === "drag"
                        ? "dragging"
                        : "lifted"
                      : undefined;
                    return (
                      <Item
                        key={lead.id}
                        className={styles.item}
                        data-lead-id={lead.id}
                      >
                        {interactive ? (
                          <button
                            type="button"
                            className={`${styles.card} ${styles.cardButton} ${
                              model.fresh === lead.id ? styles.fresh : ""
                            }`}
                            data-state={state}
                            aria-pressed={holding && held?.via === "keys"}
                            aria-describedby={instructionsId}
                            onPointerDown={(event) => onCardPointerDown(event, lead)}
                            onPointerMove={onCardPointerMove}
                            onPointerUp={onCardPointerUp}
                            onPointerCancel={onCardPointerCancel}
                            onClick={(event) => onCardClick(event, lead)}
                          >
                            <LeadFace lead={lead} />
                          </button>
                        ) : (
                          <div
                            className={`${styles.card} ${
                              model.fresh === lead.id ? styles.fresh : ""
                            }`}
                          >
                            <LeadFace lead={lead} />
                          </div>
                        )}
                      </Item>
                    );
                  })}
                </List>
                {interactive && cards.length === 0 ? (
                  <p className={styles.empty} aria-hidden="true">
                    No leads
                  </p>
                ) : null}
                {interactive ? (
                  <span className={styles.dropHint} aria-hidden="true">
                    {drop === "full"
                      ? `${STAGE_LABELS[stage]} is full`
                      : stage === "won"
                        ? "Drop to mark as won"
                        : `Move to ${STAGE_LABELS[stage]}`}
                  </span>
                ) : null}
              </section>
            );
          })}
        </div>

        {interactive ? (
          <div className={styles.ticker}>
            <p className={styles.hint} aria-hidden="true">
              {heldLead
                ? held?.via === "drag"
                  ? `Drop ${heldLead.company} on a stage above`
                  : `Moving ${heldLead.company}. Tap a stage above.`
                : "Tap a lead, then tap a stage to move it."}
            </p>
            {held?.via === "keys" ? (
              <button type="button" className={styles.cancel} onClick={() => cancelHold()}>
                Cancel
              </button>
            ) : null}
          </div>
        ) : null}

        <div
          className={styles.toast}
          data-open={model.toast?.open ? "true" : "false"}
          aria-hidden="true"
        >
          <span className={styles.toastDot} />
          <span className={styles.toastText}>
            <span className={styles.toastTitle}>New lead assigned</span>
            <span className={styles.toastSub}>
              {interactive && model.toast ? `${model.toast.person} · just now` : "just now"}
            </span>
          </span>
        </div>

        {ghost && ghostLead ? (
          <div
            ref={ghostRef}
            className={`${styles.card} ${styles.ghost}`}
            style={{ width: ghost.width, height: ghost.height }}
            aria-hidden="true"
          >
            <LeadFace lead={ghostLead} />
          </div>
        ) : null}
      </div>

      {interactive ? (
        <>
          <p className={styles.sr} id={instructionsId}>
            Press space or enter to pick up a lead. Use the left and right arrow keys to choose a
            column, space or enter to drop it, and escape to cancel. You can also drag a lead with
            a pointer.
          </p>
          <p className={styles.sr} role="status" aria-live="polite" aria-atomic="true">
            {model.status}
          </p>
        </>
      ) : null}
    </div>
  );
}
