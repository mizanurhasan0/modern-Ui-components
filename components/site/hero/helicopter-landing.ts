import type { RefObject } from "react";
import type { HelicopterMotion } from "./helicopter-scene";

export type HelicopterFlightPhase = "flying" | "landing" | "landed" | "taking-off";
type PadKind = "search" | "tabs" | "stage";
type Position = { x: number; y: number; scale: number };
type Options = {
  motion: RefObject<HelicopterMotion>;
  safeTop: () => number;
  position: () => Position;
  show: () => void;
  wake: () => void;
  phaseChanged: (phase: HelicopterFlightPhase) => void;
};
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));
const visible = (element: HTMLElement) => element.getClientRects().length > 0;
/** Where along a pad's top edge the helicopter sets down (px from the pad's left edge). */
function perchX(kind: PadKind, bounds: DOMRect) {
  if (kind === "search") return Math.max(45, bounds.width - 66);
  // A large container: perch near its right-hand end so the section heading on the left stays clear.
  if (kind === "stage") return Math.max(bounds.width * .5, bounds.width - 150);
  return bounds.width / 2;
}

/** Owns docking targets; pointer following remains in the cursor controller. */
export function createHelicopterLanding(options: Options) {
  const tabs = document.querySelector<HTMLElement>("[data-helicopter-tabs]");
  let pad: HTMLElement | null = null;
  let kind: PadKind | null = null;
  let rect: DOMRect | null = null;
  let phase: HelicopterFlightPhase = "flying";
  let descent = false;
  let takeoffAt = 0;
  let disposed = false;

  function changePhase(next: HelicopterFlightPhase) {
    if (phase === next) return;
    phase = next;
    if (pad) pad.dataset.helicopterPerch = next;
    options.phaseChanged(next);
  }
  function activeTab() {
    return [...(tabs?.querySelectorAll<HTMLElement>("[data-helicopter-tab][aria-pressed='true'], [data-helicopter-tab][data-helicopter-active='true']") ?? [])].find(visible) ?? null;
  }
  function unmark() {
    if (!pad) return;
    delete pad.dataset.helicopterPerch;
    pad.style.removeProperty("--helipad-x");
    resize.unobserve(pad);
  }
  function takeOff() {
    if (!pad) return;
    unmark();
    pad = null; kind = null; rect = null;
    takeoffAt = performance.now();
    changePhase("taking-off");
    options.wake();
  }
  function request(nextPad: HTMLElement, nextKind: PadKind) {
    if (disposed || !visible(nextPad)) return false;
    const bounds = nextPad.getBoundingClientRect();
    if (bounds.top < options.safeTop() + 18 || bounds.top > innerHeight - 8) return false;
    if (pad === nextPad && kind === nextKind) { rect = bounds; return true; }
    unmark();
    pad = nextPad; kind = nextKind; rect = bounds; descent = false;
    pad.dataset.helicopterPerch = "landing";
    pad.style.setProperty("--helipad-x", nextKind === "tabs" ? "50%" : `${perchX(nextKind, bounds)}px`);
    resize.observe(pad);
    const position = options.position();
    const center = bounds.left + perchX(nextKind, bounds);
    options.motion.current.facing = center < position.x + 80 ? -1 : 1;
    options.motion.current.velocityX = 0;
    options.motion.current.velocityY = 0;
    changePhase("landing");
    options.show();
    options.wake();
    return true;
  }
  function refresh() {
    if (disposed || !pad || !kind) return false;
    const next = kind === "tabs" ? activeTab() : pad;
    if (!next || !visible(next)) { takeOff(); return false; }
    if (next !== pad) return request(next, kind);
    const bounds = pad.getBoundingClientRect();
    if (bounds.top < options.safeTop() + 18 || bounds.top > innerHeight - 8) { takeOff(); return false; }
    rect = bounds;
    pad.style.setProperty("--helipad-x", kind === "tabs" ? "50%" : `${perchX(kind, bounds)}px`);
    options.wake();
    return true;
  }
  const resize = new ResizeObserver(refresh);
  const mutation = new MutationObserver(() => { if (kind === "tabs") refresh(); });
  if (tabs) mutation.observe(tabs, { subtree: true, attributes: true, attributeFilter: ["aria-pressed", "data-helicopter-active", "open"], childList: true });

  function target(): Position | null {
    if (!pad || !rect || !kind) return null;
    const footprint = options.motion.current.footprint ?? { x: 80, y: 107, top: 15 };
    const heading = kind === "tabs" ? document.querySelector("[data-helicopter-clearance]")?.getBoundingClientRect() : null;
    const ceiling = Math.max(options.safeTop(), heading ? heading.bottom + 8 : 0);
    const space = Math.max(12, rect.top - ceiling - 5);
    const scale = clamp(space / Math.max(footprint.y - footprint.top, 1), .2, kind === "tabs" ? .72 : 1);
    const center = rect.left + perchX(kind, rect);
    return {
      x: clamp(center - footprint.x * scale, 6, innerWidth - 160 * scale - 6),
      y: rect.top - 1 - footprint.y * scale - (phase === "landing" && !descent ? 12 * scale : 0),
      scale,
    };
  }
  return {
    get docked() { return pad !== null; },
    get phase() { return phase; },
    target,
    refresh,
    pointer(x: number, y: number, element: Element | null) {
      // Search focus owns the landing pad until blur, even when the pointer
      // leaves the field or passes over another category.
      const focusedSearch = document.activeElement?.closest<HTMLElement>("[data-helicopter-pad='search']");
      if (focusedSearch) return request(focusedSearch, "search");
      if (element?.closest("[data-helicopter-tabs]")) {
        const selected = activeTab();
        if (selected && request(selected, "tabs")) return true;
      }
      // Any large container marked as a "stage" gives the helicopter somewhere to perch instead of hovering over it.
      const stage = element?.closest<HTMLElement>("[data-helicopter-pad='stage']");
      if (stage && request(stage, "stage")) return true;
      if (!pad || !rect) return false;
      const bounds = kind === "tabs" ? tabs?.getBoundingClientRect() : rect;
      const margin = kind === "search" ? 48 : 24;
      if (bounds && x >= bounds.left - margin && x <= bounds.right + margin && y >= bounds.top - margin && y <= bounds.bottom + margin) return true;
      takeOff();
      return false;
    },
    focus(element: Element | null) {
      const search = element?.closest<HTMLElement>("[data-helicopter-pad='search']");
      if (search) return request(search, "search");
      if (element?.closest("[data-helicopter-tabs]")) {
        const selected = activeTab();
        if (selected) return request(selected, "tabs");
      }
      if (kind === "search") takeOff();
      return false;
    },
    blur(next: Element | null) {
      if (kind === "search" && !next?.closest("[data-helicopter-pad='search']")) takeOff();
      if (kind === "tabs" && !next?.closest("[data-helicopter-tabs]")) takeOff();
    },
    settle(position: Position, flightTarget: Position) {
      const goal = target();
      if (goal && Math.hypot(position.x - goal.x, position.y - goal.y) < .65 && Math.abs(position.scale - goal.scale) < .004) {
        if (phase === "landing" && !descent) { descent = true; options.wake(); }
        else if (phase === "landing") changePhase("landed");
      }
      if (phase === "taking-off" && performance.now() - takeoffAt > 420 && Math.abs(position.scale - 1) < .01 && Math.hypot(position.x - flightTarget.x, position.y - flightTarget.y) < 1) changePhase("flying");
    },
    reset() {
      unmark(); pad = null; kind = null; rect = null;
      changePhase("flying");
    },
    dispose() {
      disposed = true; unmark(); pad = null;
      resize.disconnect(); mutation.disconnect();
    },
  };
}
