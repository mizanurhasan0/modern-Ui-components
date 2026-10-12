"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

/** A copy-and-paste playground. All shaders, fonts and styles live in this file. */
export type LiquidGlassStyle =
  | "Lumen"
  | "Studio"
  | "Slate"
  | "Aqua"
  | "Neon"
  | "Entropy";
export type LiquidGlassMood = "tidal" | "aurora" | "ember";
export interface LiquidGlassPanel {
  id: string;
  title: string;
  description: string;
}
export interface LiquidGlassPosition {
  id: string;
  x: number;
  y: number;
}
export interface LiquidGlassSettings {
  mood: LiquidGlassMood;
  viscosity: number;
  stretch: number;
  flow: number;
  tint: string;
  opacity: number;
  frost: number;
  radius: number;
  elevation: number;
  blend: number;
  smoothness: number;
  refraction: number;
  dispersion: number;
  rim: number;
  rimColor: string;
  rimWidth: number;
  highlight: number;
  edgeLine: number;
  shimmer: number;
  glow: number;
  wash: number;
  grain: number;
  panelColors: boolean;
  pointerDrop: boolean;
  ambientDrops: boolean;
  grid: number;
  magnet: number;
}
export interface LiquidGlassPlaygroundProps {
  className?: string;
  initialPreset?: LiquidGlassStyle;
  initialPanelCount?: number;
  panels?: readonly LiquidGlassPanel[];
  /** Maximum canvas pixel ratio, clamped to 0.65–1.5. */
  quality?: number;
  onLayoutChange?: (positions: LiquidGlassPosition[]) => void;
  onSettingsChange?: (settings: LiquidGlassSettings) => void;
}

const PANEL_SEED: readonly LiquidGlassPanel[] = [
  { id: "inbox", title: "Inbox", description: "4 unread, 2 flagged." },
  { id: "tasks", title: "Tasks", description: "Ship the release notes." },
  { id: "player", title: "Player", description: "Side B, 12:41 remaining." },
  { id: "notes", title: "Notes", description: "Draft for Thursday’s demo." },
  { id: "files", title: "Files", description: "23 items, 1.2 GB." },
  { id: "metrics", title: "Metrics", description: "Up 12% this week." },
  { id: "chat", title: "Chat", description: "3 people online." },
  { id: "calendar", title: "Calendar", description: "Next: standup at 10." },
];
const PANEL_COLORS = [
  "#ff5fa2",
  "#5fd4ff",
  "#b58cff",
  "#ffb347",
  "#6cf2a8",
  "#ff7a5c",
  "#7c9bff",
  "#f4e36b",
];
const DEFAULT_SETTINGS: LiquidGlassSettings = {
  mood: "tidal",
  viscosity: 0.5,
  stretch: 1,
  flow: 0,
  tint: "#ffffff",
  opacity: 0,
  frost: 0,
  radius: 26,
  elevation: 0.35,
  blend: 40,
  smoothness: 1,
  refraction: 1,
  dispersion: 1,
  rim: 1,
  rimColor: "iridescent",
  rimWidth: 1,
  highlight: 1,
  edgeLine: 1,
  shimmer: 1,
  glow: 1,
  wash: 1,
  grain: 1,
  panelColors: false,
  pointerDrop: true,
  ambientDrops: false,
  grid: 24,
  magnet: 40,
};
const STYLE_PRESETS: Record<LiquidGlassStyle, Partial<LiquidGlassSettings>> = {
  Lumen: {},
  Studio: {
    tint: "#000000",
    opacity: 0.55,
    frost: 0.85,
    rim: 0.25,
    rimWidth: 0.7,
    highlight: 0.4,
    shimmer: 0.6,
    glow: 0.5,
    edgeLine: 0.8,
    viscosity: 0.7,
    stretch: 0.4,
    blend: 32,
    refraction: 0.6,
    dispersion: 0.4,
    elevation: 0.2,
  },
  Slate: {
    tint: "#1c2733",
    opacity: 1,
    frost: 0,
    rimColor: "#3d4c5c",
    rim: 0.5,
    rimWidth: 0.6,
    highlight: 0,
    shimmer: 0,
    glow: 0,
    wash: 0,
    grain: 0.4,
    edgeLine: 0.6,
    refraction: 0,
    dispersion: 0,
    stretch: 0,
    viscosity: 0.6,
    elevation: 0.12,
  },
  Aqua: {
    rim: 0,
    highlight: 0,
    shimmer: 0,
    glow: 0,
    wash: 0,
    grain: 0,
    edgeLine: 0.35,
    viscosity: 0.35,
    flow: 0.4,
    refraction: 1.5,
    dispersion: 1.6,
    elevation: 0,
  },
  Neon: {
    mood: "ember",
    tint: "#160b1e",
    opacity: 0.75,
    frost: 0.2,
    rimColor: "#ff2d95",
    rim: 1.6,
    rimWidth: 1.3,
    highlight: 0.6,
    shimmer: 1.4,
    glow: 1.4,
    edgeLine: 1.4,
    viscosity: 0.15,
    stretch: 1.2,
    dispersion: 2,
    elevation: 0.55,
  },
  Entropy: {
    mood: "aurora",
    frost: 0.25,
    viscosity: 0,
    stretch: 2.5,
    flow: 2,
    blend: 56,
    refraction: 1.4,
    dispersion: 2.2,
    rim: 1.3,
    rimWidth: 1.4,
    shimmer: 1.6,
    glow: 1.4,
    elevation: 0.5,
    ambientDrops: true,
  },
};
const MOTION_PRESETS = [
  { name: "Water", viscosity: 0.1, stretch: 1.3, flow: 0.6 },
  { name: "Gel", viscosity: 0.5, stretch: 1, flow: 0 },
  { name: "Honey", viscosity: 0.85, stretch: 1.8, flow: 0.3 },
  { name: "Solid", viscosity: 0.6, stretch: 0, flow: 0 },
];
const MOOD_COLORS: Record<LiquidGlassMood, [string, string, string]> = {
  tidal: ["#04111c", "#0f4c5c", "#6a5acd"],
  aurora: ["#050b12", "#0f5e46", "#b04bd6"],
  ember: ["#12060a", "#6b1a2a", "#e39a3b"],
};
const START_CELLS = [
  [1, 1],
  [10, 1],
  [19, 5],
  [4, 13],
  [13, 16],
  [19, 17],
  [1, 20],
  [19, 23],
];
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));
const presetSettings = (name: LiquidGlassStyle): LiquidGlassSettings => ({
  ...DEFAULT_SETTINGS,
  ...STYLE_PRESETS[name],
});

function rendererSettings(
  settings: LiquidGlassSettings,
  quality: number,
  reduced: boolean,
  scale: number,
): RendererSettings {
  return {
    ...settings,
    colors: MOOD_COLORS[settings.mood],
    blend: settings.blend * scale,
    theme: "dark",
    quality: clamp(Number.isFinite(quality) ? quality : 1.1, 0.65, 1.5),
    reducedMotion: reduced,
    pointerDrop: settings.pointerDrop && !reduced,
    pointerPull: !reduced,
    ambientDrops: settings.ambientDrops && !reduced,
    flow: reduced ? 0 : settings.flow,
    rimColor: settings.rimColor,
    shimmerSpeed: 1,
    backgroundBlur: 0,
    ground: "field",
    preserveDrawingBuffer: false,
    material: "plasma",
    lightDir: [-0.45, -0.55, 0.7],
    roughness: 0.28,
    anisotropy: 0,
    edge: 0,
    edgeScale: 0.01,
    edgeSharpness: 0,
    thickness: 18,
    tension: 0,
    formIn: false,
    formOut: false,
    formSpeed: 1,
    maxSurfaces: 12,
    background: null,
  };
}

function RangeControl({
  name,
  value,
  min = 0,
  max = 1,
  step = 0.05,
  unit = "",
  onChange,
}: {
  name: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="lgp-field">
      <label htmlFor={id}>
        {name}
        <span>
          {Number(value.toFixed(2))}
          {unit}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
function ToggleControl({
  name,
  checked,
  onChange,
}: {
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="lgp-toggle">
      <span>{name}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="lgp-switch" aria-hidden="true" />
    </label>
  );
}

/** Scoped WebGL material, bounded pointer dragging and an accessible settings panel. */
export default function LiquidGlassPlayground({
  className = "",
  initialPreset = "Lumen",
  initialPanelCount = 5,
  panels = PANEL_SEED,
  quality = 1.1,
  onLayoutChange,
  onSettingsChange,
}: LiquidGlassPlaygroundProps) {
  const safePanels = panels.length ? panels.slice(0, 10) : PANEL_SEED;
  const [settings, setSettings] = useState(() => presetSettings(initialPreset));
  const [preset, setPreset] = useState<LiquidGlassStyle | null>(initialPreset);
  const [count, setCount] = useState(() =>
    clamp(
      Number.isFinite(initialPanelCount) ? Math.round(initialPanelCount) : 5,
      1,
      safePanels.length,
    ),
  );
  const [positions, setPositions] = useState<LiquidGlassPosition[]>(() =>
    safePanels.map((panel, i) => ({
      id: panel.id,
      x: START_CELLS[i % 8][0] * 18,
      y: START_CELLS[i % 8][1] * 18,
    })),
  );
  const [dimensions, setDimensions] = useState({ width: 520, height: 430 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const controlsRef = useRef<HTMLElement>(null);
  const rendererRef = useRef<PlasmaRenderer | null>(null);
  const handleMap = useRef(new Map<HTMLElement, ShapeHandle>());
  const positionsRef = useRef(positions);
  const settingsRef = useRef(settings);
  const initialized = useRef(false);
  const dragRef = useRef<{
    id: string;
    pointer: number;
    startX: number;
    startY: number;
    origin: LiquidGlassPosition;
    element: HTMLElement;
  } | null>(null);
  const callbacks = useRef({ onLayoutChange, onSettingsChange });
  const scale = Math.min(1, Math.max(0.35, (dimensions.width - 16) / 696));
  const panelWidth = 216 * scale,
    panelHeight = 144 * scale;
  const visiblePanels = safePanels.slice(0, Math.min(count, safePanels.length));
  const effectiveCount = visiblePanels.length;
  const tintId = useId();

  useEffect(() => {
    callbacks.current = { onLayoutChange, onSettingsChange };
  }, [onLayoutChange, onSettingsChange]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  function commitPositions(next: LiquidGlassPosition[]) {
    positionsRef.current = next;
    setPositions(next);
    callbacks.current.onLayoutChange?.(next.slice(0, effectiveCount));
    rendererRef.current?.invalidate();
  }
  function changeSettings(
    patch: Partial<LiquidGlassSettings>,
    selected: LiquidGlassStyle | null = null,
  ) {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    setPreset(selected);
    callbacks.current.onSettingsChange?.(next);
  }

  // The canvas belongs to this component. No document theme or viewport canvas is changed.
  useEffect(() => {
    const root = rootRef.current,
      canvas = canvasRef.current;
    if (!root || !canvas) return;
    const query =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    const reduced = query?.matches ?? false;
    const runtime = PlasmaRenderer.create(
      canvas,
      rendererSettings(settingsRef.current, quality, reduced, 0.72),
      (supported) => setRendering(supported),
    );
    rendererRef.current = runtime;
    const ownedHandles = handleMap.current;
    let visible = true;
    const sync = () => runtime?.setActive(visible && !document.hidden);
    const motionChange = () => {
      const next = query?.matches ?? false;
      setReducedMotion(next);
      if (runtime)
        runtime.configure({
          ...runtime.settings,
          reducedMotion: next,
          pointerDrop: !next && settingsRef.current.pointerDrop,
          pointerPull: !next,
          ambientDrops: !next && settingsRef.current.ambientDrops,
        });
      sync();
    };
    const onVisibility = () => sync();
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              visible = entry.isIntersecting;
              sync();
            },
            { threshold: 0.01 },
          )
        : null;
    observer?.observe(root);
    query?.addEventListener("change", motionChange);
    document.addEventListener("visibilitychange", onVisibility);
    // State describes capability; the fallback is also the initial server-rendered view.
    const ready = requestAnimationFrame(() => {
      setRendering(Boolean(runtime));
      setReducedMotion(reduced);
      sync();
    });
    return () => {
      cancelAnimationFrame(ready);
      observer?.disconnect();
      query?.removeEventListener("change", motionChange);
      document.removeEventListener("visibilitychange", onVisibility);
      ownedHandles.forEach((handle) => handle.remove());
      ownedHandles.clear();
      runtime?.destroy();
      if (rendererRef.current === runtime) rendererRef.current = null;
    };
  }, [quality]);

  // Container size, rather than viewport width, drives both desktop and mobile previews.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const width = stage.clientWidth || 520,
        height = stage.clientHeight || 430;
      setDimensions((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
      const unit = Math.min(1, Math.max(0.35, (width - 16) / 696));
      const pw = 216 * unit,
        ph = 144 * unit;
      const next = safePanels.map((panel, i) => {
        const existing = positionsRef.current.find(
          (position) => position.id === panel.id,
        );
        const cell = START_CELLS[i % START_CELLS.length];
        return {
          id: panel.id,
          x: clamp(
            initialized.current && existing ? existing.x : cell[0] * 24 * unit,
            0,
            width - pw,
          ),
          y: clamp(
            initialized.current && existing ? existing.y : cell[1] * 24 * unit,
            0,
            height - ph,
          ),
        };
      });
      initialized.current = true;
      positionsRef.current = next;
      setPositions(next);
      rendererRef.current?.invalidate();
    };
    measure();
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    observer?.observe(stage);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
    // The data is intentionally compared by its semantic identity, allowing inline panel arrays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panels.map((panel) => panel.id).join("|")]);

  useEffect(() => {
    const runtime = rendererRef.current;
    if (!runtime) return;
    runtime.configure(
      rendererSettings(settings, quality, reducedMotion, scale),
    );
    const elements = Array.from(
      stageRef.current?.querySelectorAll<HTMLElement>(".lgp-panel") ?? [],
    );
    if (navRef.current) elements.push(navRef.current);
    if (controlsRef.current) elements.push(controlsRef.current);
    const live = new Set(elements);
    handleMap.current.forEach((handle, element) => {
      if (!live.has(element)) {
        handle.remove();
        handleMap.current.delete(element);
      }
    });
    elements.forEach((element, index) => {
      const panel = element.classList.contains("lgp-panel");
      const options: ShapeOptions = {
        radius: panel ? settings.radius * scale : 26,
        lean: 0,
        fuse: panel,
        formIn: false,
        tint:
          panel && settings.panelColors
            ? PANEL_COLORS[index % 8]
            : settings.tint,
        opacity:
          panel && settings.panelColors
            ? Math.max(settings.opacity, 0.35)
            : settings.opacity,
      };
      const existing = handleMap.current.get(element);
      const handle = existing ?? runtime.register(element, options);
      if (existing) handle.update(options);
      else handleMap.current.set(element, handle);
      handle.setDragging(panel && element.dataset.panelId === dragging);
    });
    runtime.invalidate();
  }, [
    settings,
    quality,
    reducedMotion,
    scale,
    effectiveCount,
    dragging,
    rendering,
    positions,
  ]);

  const visibleIds = visiblePanels.map((panel) => panel.id).join("|");
  useEffect(() => {
    const drag = dragRef.current;
    if (!drag || visibleIds.split("|").includes(drag.id)) return;
    dragRef.current = null;
    const element = drag.element;
    if (element?.hasPointerCapture?.(drag.pointer))
      element.releasePointerCapture(drag.pointer);
    const frame = requestAnimationFrame(() => setDragging(null));
    return () => cancelAnimationFrame(frame);
  }, [visibleIds]);

  const boxes = positions.slice(0, effectiveCount).map((position) => ({
    l: position.x,
    t: position.y,
    w: panelWidth,
    h: panelHeight,
  }));
  const joined = boxes.map((box, i) =>
    boxes.some(
      (other, j) =>
        j !== i &&
        boxGap(box, other) < Math.max(1.5, settings.blend * scale * 0.5),
    ),
  );
  const joinedCount = joined.filter(Boolean).length;

  function movePanel(id: string, x: number, y: number, snap: boolean) {
    const previous = positionsRef.current;
    const otherBoxes = previous
      .slice(0, effectiveCount)
      .filter((position) => position.id !== id)
      .map((position) => ({
        l: position.x,
        t: position.y,
        w: panelWidth,
        h: panelHeight,
      }));
    const bounds = { l: 0, t: 0, w: dimensions.width, h: dimensions.height };
    const target = snap
      ? snapBox({ l: x, t: y, w: panelWidth, h: panelHeight }, otherBoxes, {
          grid: settings.grid * scale,
          magnet: settings.magnet * scale,
          bounds,
        })
      : {
          l: clamp(x, 0, bounds.w - panelWidth),
          t: clamp(y, 0, bounds.h - panelHeight),
        };
    commitPositions(
      previous.map((position) =>
        position.id === id
          ? { ...position, x: target.l, y: target.t }
          : position,
      ),
    );
  }
  function startDrag(event: ReactPointerEvent<HTMLElement>, id: string) {
    if (event.button !== 0 || dragRef.current) return;
    const origin = positionsRef.current.find((position) => position.id === id);
    if (!origin) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      id,
      pointer: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: { ...origin },
      element: event.currentTarget,
    };
    setDragging(id);
  }
  function continueDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (drag && drag.pointer === event.pointerId)
      movePanel(
        drag.id,
        drag.origin.x + event.clientX - drag.startX,
        drag.origin.y + event.clientY - drag.startY,
        false,
      );
  }
  function endDrag(event: ReactPointerEvent<HTMLElement>, cancel = false) {
    const drag = dragRef.current;
    if (!drag || drag.pointer !== event.pointerId) return;
    dragRef.current = null;
    setDragging(null);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    const current =
      positionsRef.current.find((position) => position.id === drag.id) ??
      drag.origin;
    movePanel(
      drag.id,
      cancel ? drag.origin.x : current.x,
      cancel ? drag.origin.y : current.y,
      !cancel,
    );
  }
  function keyboardMove(event: KeyboardEvent<HTMLElement>, id: string) {
    if (event.key === "Escape" && dragRef.current?.id === id) {
      event.preventDefault();
      const origin = dragRef.current.origin;
      const drag = dragRef.current;
      dragRef.current = null;
      setDragging(null);
      if (drag.element.hasPointerCapture?.(drag.pointer))
        drag.element.releasePointerCapture(drag.pointer);
      movePanel(id, origin.x, origin.y, false);
      return;
    }
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const position = positionsRef.current.find((item) => item.id === id);
    if (position) {
      const step =
        Math.max(4, settings.grid * scale) * (event.shiftKey ? 4 : 1);
      movePanel(
        id,
        position.x + direction[0] * step,
        position.y + direction[1] * step,
        false,
      );
    }
  }
  function changeCount(delta: number) {
    const next = clamp(effectiveCount + delta, 1, safePanels.length);
    setCount(next);
    callbacks.current.onLayoutChange?.(
      safePanels
        .slice(0, next)
        .map(
          (panel) =>
            positionsRef.current.find(
              (position) => position.id === panel.id,
            ) ?? { id: panel.id, x: 0, y: 0 },
        ),
    );
    rendererRef.current?.invalidate();
  }
  function arrange() {
    const grid = settings.grid * scale;
    const columns = Math.max(
      1,
      Math.floor((dimensions.width - grid) / panelWidth),
    );
    commitPositions(
      safePanels.map((panel, i) => ({
        id: panel.id,
        x: clamp(
          grid + (i % columns) * panelWidth,
          0,
          dimensions.width - panelWidth,
        ),
        y: clamp(
          grid + Math.floor(i / columns) * panelHeight,
          0,
          dimensions.height - panelHeight,
        ),
      })),
    );
  }
  function scatter() {
    const grid = Math.max(1, settings.grid * scale);
    commitPositions(
      safePanels.map((panel) => ({
        id: panel.id,
        x:
          Math.floor(
            Math.random() *
              Math.max(1, Math.floor((dimensions.width - panelWidth) / grid)),
          ) * grid,
        y:
          Math.floor(
            Math.random() *
              Math.max(1, Math.floor((dimensions.height - panelHeight) / grid)),
          ) * grid,
      })),
    );
  }

  return (
    <div
      ref={rootRef}
      className={`lgp-root relative isolate w-full overflow-hidden ${className}`}
      data-webgl={rendering ? "true" : "false"}
      data-mood={settings.mood}
      data-reduced-motion={reducedMotion}
      style={
        {
          "--lgp-rim": settings.rim,
          "--lgp-frost": `${settings.frost * 20}px`,
          "--lgp-elevation": `${settings.elevation * 22}px`,
        } as CSSProperties
      }
    >
      <style>{LIQUID_GLASS_CSS}</style>
      <canvas ref={canvasRef} className="lgp-canvas" aria-hidden="true" />
      <div className="lgp-content">
        <nav ref={navRef} className="lgp-nav" aria-label="Glass styles">
          <span className="lgp-brand">Plasma UI</span>
          <span className="lgp-nav-label">Playground</span>
          <div
            className="lgp-style-tabs"
            role="group"
            aria-label="Style presets"
          >
            {(Object.keys(STYLE_PRESETS) as LiquidGlassStyle[]).map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={preset === name}
                onClick={() => changeSettings(presetSettings(name), name)}
              >
                {name}
              </button>
            ))}
          </div>
          <a
            className="lgp-repo"
            href="https://github.com/cruxgarden/plasma-ui"
            target="_blank"
            rel="noreferrer"
            aria-label="Original Plasma UI repository"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              width="19"
              height="19"
              aria-hidden="true"
            >
              <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.08 2.91.83.09-.65.35-1.08.64-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.83c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.58 4.93.36.31.68.92.68 1.85v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
            </svg>
          </a>
        </nav>
        <header className="lgp-heading">
          <h2>Playground</h2>
          <p>
            Drag panels; they fuse on contact and snap to the grid on release.
            Throw one to stretch the plasma. Click empty space to send a pulse.
            The controls change the whole scene.
          </p>
        </header>
        <div className="lgp-workspace">
          <div className="lgp-stage-wrap">
            <div
              ref={stageRef}
              className="lgp-stage"
              aria-label="Liquid glass workspace"
              onPointerDown={(event) => {
                if (event.target === event.currentTarget)
                  rendererRef.current?.pulse(event.clientX, event.clientY);
              }}
            >
              {visiblePanels.map((panel, index) => {
                const position = positions.find(
                  (item) => item.id === panel.id,
                ) ?? { x: 0, y: 0 };
                const tint = settings.panelColors
                  ? PANEL_COLORS[index % 8]
                  : settings.tint;
                return (
                  <article
                    key={panel.id}
                    tabIndex={0}
                    className="lgp-panel"
                    data-panel-id={panel.id}
                    data-dragging={dragging === panel.id}
                    aria-label={`${panel.title} panel. Use arrow keys to move; Shift moves farther.`}
                    aria-roledescription="draggable panel"
                    style={
                      {
                        left: position.x,
                        top: position.y,
                        width: panelWidth,
                        height: panelHeight,
                        "--lgp-radius": `${settings.radius * scale}px`,
                        "--lgp-panel-scale": scale,
                        "--lgp-tint": tint,
                        "--lgp-opacity": settings.panelColors
                          ? Math.max(settings.opacity, 0.35)
                          : settings.opacity,
                      } as CSSProperties
                    }
                    onPointerDown={(event) => startDrag(event, panel.id)}
                    onPointerMove={continueDrag}
                    onPointerUp={(event) => endDrag(event)}
                    onPointerCancel={(event) => endDrag(event, true)}
                    onLostPointerCapture={(event) => {
                      if (dragRef.current?.pointer === event.pointerId)
                        endDrag(event, true);
                    }}
                    onKeyDown={(event) => keyboardMove(event, panel.id)}
                  >
                    <div className="lgp-plate">
                      <h3>{panel.title}</h3>
                      <p>{panel.description}</p>
                      <span>{joined[index] ? "Joined" : "Standalone"}</span>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="lgp-stage-bar">
              <span aria-live="polite" aria-atomic="true">
                {effectiveCount} panels, {joinedCount} joined
              </span>
              <span>{settings.grid}px grid</span>
            </div>
          </div>
          <aside
            ref={controlsRef}
            className="lgp-controls"
            aria-label="Playground controls"
          >
            <div className="lgp-controls-plate">
              <h3>Layout</h3>
              <div className="lgp-layout">
                <button type="button" onClick={arrange}>
                  Arrange
                </button>
                <button type="button" onClick={scatter}>
                  Scatter
                </button>
                <button
                  type="button"
                  disabled={effectiveCount >= safePanels.length}
                  onClick={() => changeCount(1)}
                >
                  Add panel
                </button>
                <button
                  type="button"
                  disabled={effectiveCount <= 1}
                  onClick={() => changeCount(-1)}
                >
                  Remove panel
                </button>
              </div>
              <h3>Motion</h3>
              <RangeControl
                name="Viscosity"
                value={settings.viscosity}
                onChange={(value) => changeSettings({ viscosity: value })}
              />
              <RangeControl
                name="Stretch"
                max={2.5}
                step={0.1}
                value={settings.stretch}
                onChange={(value) => changeSettings({ stretch: value })}
              />
              <RangeControl
                name="Flow"
                max={2}
                step={0.1}
                value={settings.flow}
                onChange={(value) => changeSettings({ flow: value })}
              />
              <div
                className="lgp-presets"
                role="group"
                aria-label="Motion presets"
              >
                {MOTION_PRESETS.map(({ name, ...values }) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={
                      settings.viscosity === values.viscosity &&
                      settings.stretch === values.stretch &&
                      settings.flow === values.flow
                    }
                    onClick={() => changeSettings(values)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <h3>Material</h3>
              <div className="lgp-inline">
                <span>Mood</span>
                <div
                  className="lgp-presets"
                  role="group"
                  aria-label="Material mood"
                >
                  {(Object.keys(MOOD_COLORS) as LiquidGlassMood[]).map(
                    (name) => (
                      <button
                        key={name}
                        type="button"
                        aria-pressed={settings.mood === name}
                        onClick={() => changeSettings({ mood: name })}
                      >
                        {name[0].toUpperCase() + name.slice(1)}
                      </button>
                    ),
                  )}
                </div>
              </div>
              <div className="lgp-inline">
                <label htmlFor={tintId}>Tint</label>
                <div className="lgp-color">
                  <input
                    id={tintId}
                    type="color"
                    value={settings.tint}
                    onChange={(event) =>
                      changeSettings({ tint: event.target.value })
                    }
                  />
                  <code>{settings.tint}</code>
                </div>
              </div>
              <RangeControl
                name="Opacity"
                value={settings.opacity}
                onChange={(value) => changeSettings({ opacity: value })}
              />
              <RangeControl
                name="Frost"
                value={settings.frost}
                onChange={(value) => changeSettings({ frost: value })}
              />
              <RangeControl
                name="Radius"
                max={48}
                step={2}
                unit="px"
                value={settings.radius}
                onChange={(value) => changeSettings({ radius: value })}
              />
              <RangeControl
                name="Elevation"
                value={settings.elevation}
                onChange={(value) => changeSettings({ elevation: value })}
              />
              <ToggleControl
                name="Color each panel"
                checked={settings.panelColors}
                onChange={(value) => changeSettings({ panelColors: value })}
              />
              <RangeControl
                name="Blend distance"
                max={90}
                step={2}
                unit="px"
                value={settings.blend}
                onChange={(value) => changeSettings({ blend: value })}
              />
              <RangeControl
                name="Smoothness"
                max={2}
                step={0.1}
                value={settings.smoothness}
                onChange={(value) => changeSettings({ smoothness: value })}
              />
              <h3>Optics</h3>
              <RangeControl
                name="Refraction"
                max={2.5}
                step={0.1}
                value={settings.refraction}
                onChange={(value) => changeSettings({ refraction: value })}
              />
              <RangeControl
                name="Dispersion"
                max={3}
                step={0.1}
                value={settings.dispersion}
                onChange={(value) => changeSettings({ dispersion: value })}
              />
              <RangeControl
                name="Rim"
                max={3}
                step={0.1}
                value={settings.rim}
                onChange={(value) => changeSettings({ rim: value })}
              />
              <RangeControl
                name="Rim width"
                max={2.5}
                step={0.1}
                value={settings.rimWidth}
                onChange={(value) => changeSettings({ rimWidth: value })}
              />
              <RangeControl
                name="Highlight"
                max={2}
                step={0.1}
                value={settings.highlight}
                onChange={(value) => changeSettings({ highlight: value })}
              />
              <RangeControl
                name="Edge line"
                max={2}
                step={0.1}
                value={settings.edgeLine}
                onChange={(value) => changeSettings({ edgeLine: value })}
              />
              <RangeControl
                name="Shimmer"
                max={2}
                step={0.1}
                value={settings.shimmer}
                onChange={(value) => changeSettings({ shimmer: value })}
              />
              <RangeControl
                name="Glow"
                max={2}
                step={0.1}
                value={settings.glow}
                onChange={(value) => changeSettings({ glow: value })}
              />
              <RangeControl
                name="Color wash"
                max={2}
                step={0.1}
                value={settings.wash}
                onChange={(value) => changeSettings({ wash: value })}
              />
              <RangeControl
                name="Grain"
                max={2}
                step={0.1}
                value={settings.grain}
                onChange={(value) => changeSettings({ grain: value })}
              />
              <h3>Interaction</h3>
              <ToggleControl
                name="Pointer drop"
                checked={settings.pointerDrop}
                onChange={(value) => changeSettings({ pointerDrop: value })}
              />
              <ToggleControl
                name="Ambient drops"
                checked={settings.ambientDrops}
                onChange={(value) => changeSettings({ ambientDrops: value })}
              />
              <RangeControl
                name="Grid"
                min={4}
                max={48}
                step={4}
                unit="px"
                value={settings.grid}
                onChange={(value) => changeSettings({ grid: value })}
              />
              <RangeControl
                name="Magnet"
                max={80}
                step={4}
                unit="px"
                value={settings.magnet}
                onChange={(value) => changeSettings({ magnet: value })}
              />
              <button
                className="lgp-reset"
                type="button"
                onClick={() => changeSettings(presetSettings("Lumen"), "Lumen")}
              >
                Reset settings
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Inert, step-driven gallery preview. No WebGL, handlers or animation loop is mounted. */
export function LiquidGlassPlaygroundThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  const safeStep = Number.isFinite(previewStep) ? Math.floor(previewStep) : 0;
  const frame = ((safeStep % 6) + 6) % 6;
  const offset = [0, 48, 118, 52, -22, 0][frame];
  return (
    <div className={`lgp-thumbnail ${className}`} aria-hidden="true">
      <style>{LIQUID_GLASS_THUMBNAIL_CSS}</style>
      <div
        className="lgp-thumb-flow"
        style={{
          transform: `translate(${[0, 10, -12, 8, -6, 0][frame]}%, ${frame % 2 ? -6 : 3}%)`,
        }}
      />
      <div className="lgp-thumb-scene">
        <div className="lgp-thumb-nav">
          <b>Plasma UI</b>
          <span>Playground</span>
          <div>
            <i>Lumen</i>
            <span>Studio</span>
            <span>Slate</span>
            <span>Aqua</span>
          </div>
        </div>
        <h3>Playground</h3>
        <p>Drag panels. Fuse on contact. Feel the flow.</p>
        <div className="lgp-thumb-body">
          <div className="lgp-thumb-stage">
            <div className="lgp-thumb-fused">
              <div>
                <b>Inbox</b>
                <small>4 unread, 2 flagged.</small>
                <span>Joined</span>
              </div>
              <div>
                <b>Tasks</b>
                <small>Ship the release notes.</small>
                <span>Joined</span>
              </div>
            </div>
            <div
              className="lgp-thumb-player"
              style={{
                transform: `translate(${offset}px, ${frame % 2 ? 8 : 0}px)`,
              }}
            >
              <b>Player</b>
              <small>Side B, 12:41 remaining.</small>
              <span>{frame < 2 ? "Joined" : "Standalone"}</span>
            </div>
            <div className="lgp-thumb-bottom">
              <div>
                <b>Notes</b>
                <small>Draft for Thursday’s demo.</small>
                <span>Joined</span>
              </div>
              <div>
                <b>Files</b>
                <small>23 items, 1.2 GB.</small>
                <span>Joined</span>
              </div>
            </div>
          </div>
          <div className="lgp-thumb-controls">
            <b>Layout</b>
            <div>
              Arrange <span>Scatter</span>
            </div>
            <div>
              Add panel <span>Remove panel</span>
            </div>
            <b>Motion</b>
            {["Viscosity", "Stretch", "Flow"].map((name, index) => (
              <div key={name} className="lgp-thumb-range">
                {name}
                <i>
                  <em
                    style={{
                      left: `${[40, 32, 14][index] + (frame % 3) * 9}%`,
                    }}
                  />
                </i>
              </div>
            ))}
            <div className="lgp-thumb-pills">
              Water <i>Gel</i> Honey
            </div>
            <b>Material</b>
            <div>
              Mood <span>Tidal · Aurora</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const LIQUID_GLASS_CSS = `
/* Fonts are embedded below; styles are scoped to this component. */
@font-face{font-family:"LGP Onest";font-style:normal;font-weight:400 500;font-display:swap;src:url(data:font/woff2;base64,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) format("woff2")}
@font-face{font-family:"LGP Cormorant";font-style:normal;font-weight:500 600;font-display:swap;src:url(data:font/woff2;base64,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) format("woff2")}
.lgp-root{container-type:inline-size;box-sizing:border-box;isolation:isolate;position:relative;min-width:0;width:100%;overflow:hidden;background:#04111c;color:#eef4f6;color-scheme:dark;font:400 13px/1.55 "LGP Onest",system-ui,sans-serif;--lgp-faint:rgba(238,244,246,.14);--lgp-muted:rgba(238,244,246,.66)}
.lgp-root *{box-sizing:border-box}.lgp-root button,.lgp-root input{font:inherit}.lgp-root button{cursor:pointer}.lgp-root button:disabled{opacity:.35;cursor:default}.lgp-root button:focus-visible,.lgp-root article:focus-visible,.lgp-root input:focus-visible,.lgp-root a:focus-visible{outline:2px solid #9ff3e4;outline-offset:3px}.lgp-root h2,.lgp-root h3{font-family:"LGP Cormorant",Georgia,serif;letter-spacing:.01em;font-weight:600;margin:0}.lgp-root p{margin:0}.lgp-canvas{position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none;z-index:0}.lgp-content{position:relative;z-index:1;padding:22px 28px 32px;max-width:1180px;margin:auto}.lgp-nav{display:flex;gap:12px;align-items:center;min-height:48px;padding:8px 16px;border-radius:28px;margin-bottom:28px;position:relative}.lgp-brand{font:600 21px "LGP Cormorant",Georgia,serif;white-space:nowrap}.lgp-nav-label{font-size:11px;color:var(--lgp-muted)}.lgp-style-tabs{display:flex;gap:2px;margin-left:auto;padding:3px;border-radius:50px;background:rgba(0,0,0,.2);overflow-x:auto;scrollbar-width:none;min-width:0}.lgp-style-tabs button{flex:0 0 auto;border:0;background:transparent;color:inherit;border-radius:50px;padding:5px 9px;font-size:10px;line-height:1.3}.lgp-style-tabs button[aria-pressed=true],.lgp-presets button[aria-pressed=true]{background:#eef4f6;color:#06121a}.lgp-repo{display:inline-flex;flex:none;color:var(--lgp-muted)}.lgp-heading{margin:0 4px 24px}.lgp-heading h2{font-size:42px;line-height:1.08;font-weight:500}.lgp-heading p{max-width:66ch;color:var(--lgp-muted);font-size:12px;margin-top:12px}.lgp-workspace{display:grid;grid-template-columns:minmax(0,1fr) 224px;gap:28px;align-items:start}.lgp-stage-wrap{min-width:0}.lgp-stage{height:430px;position:relative;border:1px dashed var(--lgp-faint);border-radius:26px;overflow:hidden}.lgp-stage-bar{display:flex;justify-content:space-between;gap:8px;color:var(--lgp-muted);padding:9px 5px;font-size:11px}.lgp-panel{position:absolute;display:flex;border-radius:var(--lgp-radius);padding:calc(20px * var(--lgp-panel-scale));touch-action:none;user-select:none;cursor:grab;transition:left .25s cubic-bezier(.2,.7,.3,1),top .25s cubic-bezier(.2,.7,.3,1);outline-offset:-2px!important}.lgp-panel[data-dragging=true]{cursor:grabbing;transition:none;z-index:2}.lgp-plate{display:flex;flex-direction:column;min-width:0;width:100%;height:100%;padding:calc(12px * var(--lgp-panel-scale)) calc(14px * var(--lgp-panel-scale));border:1px solid var(--lgp-faint);border-radius:calc(16px * var(--lgp-panel-scale));background:rgba(6,16,22,.52);overflow:hidden}.lgp-plate h3{font-size:calc(17px * var(--lgp-panel-scale));line-height:1.2}.lgp-plate p{font-size:calc(13px * var(--lgp-panel-scale));color:var(--lgp-muted);line-height:1.4;margin-top:calc(4px * var(--lgp-panel-scale))}.lgp-plate>span{margin-top:auto;font:600 calc(17px * var(--lgp-panel-scale))/1.2 "LGP Cormorant",Georgia,serif;color:var(--lgp-muted)}.lgp-controls{border-radius:26px;padding:12px;max-height:466px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(238,244,246,.25) transparent;overscroll-behavior:contain;position:relative}.lgp-controls-plate{background:rgba(6,16,22,.52);border:1px solid var(--lgp-faint);border-radius:16px;padding:13px 14px}.lgp-controls h3{font-size:15px;line-height:1.2;margin:18px 0 10px}.lgp-controls h3:first-child{margin-top:0}.lgp-layout{display:grid;grid-template-columns:1fr 1fr;gap:6px}.lgp-layout button,.lgp-presets button,.lgp-reset{color:inherit;border:1px solid var(--lgp-faint);background:transparent;border-radius:99px;padding:5px 7px;font-size:10px;white-space:nowrap}.lgp-layout button:hover:not(:disabled),.lgp-presets button:hover,.lgp-reset:hover{border-color:rgba(238,244,246,.6)}.lgp-field{margin-top:9px}.lgp-field label{display:flex;justify-content:space-between;gap:8px;font-size:10px;color:var(--lgp-muted)}.lgp-field label span{color:#eef4f6;font-variant-numeric:tabular-nums}.lgp-field input{width:100%;height:14px;accent-color:#eef4f6;margin:3px 0 0;cursor:pointer}.lgp-presets{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}.lgp-presets button{font-size:9px;padding:3px 6px}.lgp-inline{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:10px;font-size:10px;color:var(--lgp-muted)}.lgp-inline .lgp-presets{margin:0}.lgp-color{display:flex;align-items:center;gap:6px}.lgp-color code{font:9px ui-monospace,monospace}.lgp-color input{padding:0;width:26px;height:22px;border:1px solid var(--lgp-faint);background:transparent;border-radius:6px;cursor:pointer}.lgp-toggle{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:10px;color:var(--lgp-muted);margin-top:12px;position:relative;cursor:pointer}.lgp-toggle input{position:absolute;width:32px;height:18px;right:0;margin:0;opacity:0;cursor:pointer;z-index:1}.lgp-switch{flex:none;width:32px;height:18px;border-radius:99px;border:1px solid var(--lgp-faint);background:rgba(0,0,0,.22);position:relative}.lgp-switch:before{content:"";position:absolute;left:2px;top:2px;width:12px;height:12px;border-radius:50%;background:var(--lgp-muted);transition:transform .2s}.lgp-toggle input:checked+.lgp-switch:before{transform:translateX(14px);background:#eef4f6}.lgp-toggle input:focus-visible+.lgp-switch{outline:2px solid #9ff3e4;outline-offset:3px}.lgp-reset{margin-top:20px;width:100%}
.lgp-root[data-webgl=false]{background:radial-gradient(ellipse at 70% 85%,rgba(106,90,205,.54),transparent 40%),radial-gradient(ellipse at 70% 35%,rgba(15,76,92,.8),transparent 60%),#04111c}.lgp-root[data-webgl=false][data-mood=aurora]{background:radial-gradient(ellipse at 70% 85%,rgba(176,75,214,.5),transparent 45%),radial-gradient(ellipse at 80% 30%,#0f5e46,transparent 70%),#050b12}.lgp-root[data-webgl=false][data-mood=ember]{background:radial-gradient(ellipse at 70% 85%,rgba(227,154,59,.5),transparent 45%),radial-gradient(ellipse at 80% 30%,#6b1a2a,transparent 70%),#12060a}.lgp-root[data-webgl=false] .lgp-panel,.lgp-root[data-webgl=false] .lgp-controls,.lgp-root[data-webgl=false] .lgp-nav{background:linear-gradient(135deg,rgba(159,243,228,.14),rgba(130,130,190,.07));border:1px solid rgba(159,243,228,.4);box-shadow:inset 0 1px 1px rgba(255,255,255,.3),0 0 15px rgba(82,199,219,.14);backdrop-filter:blur(var(--lgp-frost,10px))}.lgp-root[data-webgl=false] .lgp-panel{background:color-mix(in srgb,var(--lgp-tint,#fff) calc(var(--lgp-opacity,0) * 100%),rgba(159,243,228,.06));box-shadow:inset 0 1px 1px rgba(255,255,255,.3),0 var(--lgp-elevation,8px) 20px rgba(0,0,0,.3)}
@container (min-width:1050px){.lgp-content{padding:24px 42px 40px}.lgp-workspace{grid-template-columns:minmax(0,1fr) 280px;gap:48px}.lgp-stage{height:570px}.lgp-controls{max-height:606px}.lgp-heading h2{font-size:49px}.lgp-heading p{font-size:14px}.lgp-style-tabs button{font-size:12px}.lgp-controls-plate{padding:16px 18px}.lgp-field label,.lgp-inline,.lgp-toggle{font-size:12px}.lgp-controls h3{font-size:17px}.lgp-layout button{font-size:12px}}
@container (max-width:650px){.lgp-content{padding:18px 16px 24px}.lgp-nav{padding:8px 12px;gap:8px;margin-bottom:22px}.lgp-brand{font-size:20px}.lgp-nav-label{display:none}.lgp-style-tabs button{padding:5px 7px}.lgp-workspace{grid-template-columns:minmax(0,1fr);gap:18px}.lgp-heading h2{font-size:36px}.lgp-stage{height:380px}.lgp-controls{max-height:340px}.lgp-controls-plate{padding:16px 20px}.lgp-field label,.lgp-inline,.lgp-toggle{font-size:12px}.lgp-layout button{font-size:12px}.lgp-presets button{font-size:11px}.lgp-controls h3{font-size:17px}}
@container (max-width:380px){.lgp-content{padding-inline:12px}.lgp-nav{padding-inline:10px}.lgp-repo{display:none}.lgp-brand{font-size:18px}.lgp-stage{height:350px}.lgp-heading p{font-size:11px}}
.lgp-root[data-reduced-motion=true] .lgp-panel{transition:none}.lgp-root[data-reduced-motion=true] .lgp-switch:before{transition:none}@media(prefers-reduced-motion:reduce){.lgp-root .lgp-panel,.lgp-root .lgp-switch:before{transition:none}}
`;

const LIQUID_GLASS_THUMBNAIL_CSS = `
.lgp-thumbnail{position:relative;overflow:hidden;background:#04111c;color:#eef4f6;font:10px/1.4 system-ui,sans-serif;isolation:isolate;min-height:250px;container-type:inline-size}.lgp-thumb-flow{position:absolute;inset:-35%;background:radial-gradient(ellipse at 55% 75%,rgba(106,90,205,.7),transparent 23%),radial-gradient(ellipse at 70% 35%,rgba(15,76,92,.9),transparent 40%),repeating-radial-gradient(ellipse at 55% 50%,rgba(35,127,145,.12) 0 2px,transparent 3px 17px),#04111c;transition:transform 2.4s ease}.lgp-thumb-scene{position:absolute;width:600px;height:400px;left:50%;top:50%;transform:translate(-50%,-50%) scale(.68);transform-origin:center;padding:18px 20px}.lgp-thumb-nav{display:flex;align-items:center;gap:12px;border:1px solid rgba(159,243,228,.2);background:rgba(6,16,22,.45);border-radius:28px;padding:10px 18px}.lgp-thumb-nav>b{font:600 19px Georgia,serif}.lgp-thumb-nav>span{font-size:9px;color:#9fbdca}.lgp-thumb-nav>div{display:flex;align-items:center;gap:12px;margin-left:auto;font-size:9px}.lgp-thumb-nav i{font-style:normal;background:#eef4f6;color:#06121a;border-radius:14px;padding:4px 8px}.lgp-thumb-scene>h3{font:500 31px Georgia,serif;margin:24px 0 7px}.lgp-thumb-scene>p{font-size:10px;color:#aac0cb;margin:0 0 20px}.lgp-thumb-body{display:grid;grid-template-columns:1fr 168px;gap:24px}.lgp-thumb-stage{position:relative;min-height:240px}.lgp-thumb-stage b{font:600 12px Georgia,serif}.lgp-thumb-stage small{display:block;font-size:8px;color:#afc4ce;max-width:95px;margin-top:5px}.lgp-thumb-stage span{display:block;font:11px Georgia,serif;color:#b7c9d0;margin-top:12px}.lgp-thumb-fused,.lgp-thumb-player,.lgp-thumb-bottom{position:absolute;border:1px solid #87c6d3;background:linear-gradient(145deg,rgba(159,243,228,.22),rgba(106,90,205,.1));box-shadow:inset 0 1px 2px rgba(228,244,213,.8),0 0 10px rgba(80,209,224,.23);border-radius:18px;padding:9px;display:flex}.lgp-thumb-fused{left:0;top:0;width:245px;gap:9px}.lgp-thumb-fused>div,.lgp-thumb-bottom>div{background:rgba(6,16,22,.52);border:1px solid rgba(238,244,246,.14);padding:9px;border-radius:11px;flex:1}.lgp-thumb-player{left:216px;top:58px;width:124px;display:block;padding:17px;transition:transform 1.2s cubic-bezier(.22,1,.36,1)}.lgp-thumb-bottom{top:153px;left:44px;width:236px;gap:9px}.lgp-thumb-bottom>div:last-child{transform:translateY(30px);background:#0c2834}.lgp-thumb-controls{border:1px solid #87c6d3;border-radius:18px;padding:15px;background:rgba(6,16,22,.56);box-shadow:inset 0 1px 1px rgba(228,244,213,.8),0 0 8px rgba(80,209,224,.15)}.lgp-thumb-controls>b{display:block;font:600 12px Georgia,serif;margin-bottom:9px}.lgp-thumb-controls>b:not(:first-child){margin-top:16px}.lgp-thumb-controls>div{font-size:9px;display:flex;justify-content:space-between;margin-top:8px}.lgp-thumb-range{display:block!important;font-size:8px!important;color:#afc4ce}.lgp-thumb-range>i{display:block;position:relative;height:3px;background:#557886;border-radius:4px;margin-top:6px}.lgp-thumb-range em{position:absolute;top:-2px;width:7px;height:7px;background:#eef4f6;border-radius:50%;transition:left 1.5s ease}.lgp-thumb-pills{justify-content:start!important;gap:10px;align-items:center}.lgp-thumb-pills>i{font-style:normal;background:#eef4f6;border-radius:10px;color:#06121a;padding:3px 6px}@container(max-width:360px){.lgp-thumb-scene{transform:translate(-50%,-50%) scale(.55)}}@media(prefers-reduced-motion:reduce){.lgp-thumbnail *{transition:none!important}}
`;

/*
Material engine adapted from Plasma UI — https://github.com/cruxgarden/plasma-ui
Local-canvas adaptation: coordinates, scheduling, host observers and lifecycle.

MIT License

Copyright (c) 2026 Crux Garden

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Embedded unmodified typefaces: Onest and Cormorant Garamond.
Copyright 2021 The Onest Project Authors (https://github.com/googlefonts/onest)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
https://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded, 
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.

Copyright 2015 the Cormorant Project Authors (github.com/CatharsisFonts/Cormorant)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
https://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded, 
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.

*/

// Geometry and grid snapping.
interface Box {
  l: number;
  t: number;
  w: number;
  h: number;
}

interface SnapOptions {
  /** Grid cell size in px. 0 disables the grid. */
  grid: number;
  /** Distance (px) at which an edge latches onto a neighbor's edge. */
  magnet: number;
  /** Area the box must stay inside; also the grid origin. */
  bounds: Box;
  /** Inset from the bounds edges. */
  inset?: number;
}

/**
 * Snap a proposed box position. Edges first latch onto nearby panels
 * (aligned or butted), otherwise fall to the grid. Overlaps are pushed out
 * so the result sits flush against its neighbor.
 */
function snapBox(
  b: Box,
  others: Box[],
  o: SnapOptions,
): { l: number; t: number } {
  const { grid, magnet, bounds } = o;
  const inset = o.inset ?? 0;

  const pick = (cur: number, cands: number[]) => {
    let best: number | null = null,
      bd = magnet;
    for (const v of cands) {
      const d = Math.abs(v - cur);
      if (d < bd) {
        bd = d;
        best = v;
      }
    }
    return best;
  };
  const nearX = (n: Box) =>
    b.t < n.t + n.h + magnet && b.t + b.h > n.t - magnet;
  const nearY = (n: Box) =>
    b.l < n.l + n.w + magnet && b.l + b.w > n.l - magnet;

  let l = pick(
    b.l,
    others.flatMap((n) =>
      nearX(n) ? [n.l, n.l + n.w - b.w, n.l + n.w, n.l - b.w] : [],
    ),
  );
  let t = pick(
    b.t,
    others.flatMap((n) =>
      nearY(n) ? [n.t, n.t + n.h - b.h, n.t + n.h, n.t - b.h] : [],
    ),
  );
  if (l === null)
    l = grid > 0 ? bounds.l + Math.round((b.l - bounds.l) / grid) * grid : b.l;
  if (t === null)
    t = grid > 0 ? bounds.t + Math.round((b.t - bounds.t) / grid) * grid : b.t;

  for (const n of others) {
    const ox = Math.min(l + b.w, n.l + n.w) - Math.max(l, n.l);
    const oy = Math.min(t + b.h, n.t + n.h) - Math.max(t, n.t);
    if (ox > 2 && oy > 2) {
      if (ox < oy) l = l + b.w / 2 < n.l + n.w / 2 ? n.l - b.w : n.l + n.w;
      else t = t + b.h / 2 < n.t + n.h / 2 ? n.t - b.h : n.t + n.h;
    }
  }

  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(Math.max(v, lo), Math.max(lo, hi));
  return {
    l: clamp(l, bounds.l + inset, bounds.l + bounds.w - b.w - inset),
    t: clamp(t, bounds.t + inset, bounds.t + bounds.h - b.h - inset),
  };
}

/** Gap between two boxes (negative when overlapping). */
function boxGap(a: Box, b: Box): number {
  const gx = Math.max(a.l - (b.l + b.w), b.l - (a.l + a.w));
  const gy = Math.max(a.t - (b.t + b.h), b.t - (a.t + a.h));
  return Math.max(gx, gy);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

// Local material renderer and GPU lifecycle.

interface RendererSettings {
  colors: [string, string, string];
  blend: number;
  refraction: number;
  dispersion: number;
  rim: number;
  smoothness: number;
  pointerDrop: boolean;
  /** The surface swells toward the pointer as it nears an edge. */
  pointerPull: boolean;
  ambientDrops: boolean;
  theme: "auto" | "light" | "dark";
  quality: number;
  reducedMotion: boolean;
  /** Rim color: "iridescent", "tint" (each surface's tint), or a hex color. */
  rimColor: string;
  /** Rim width multiplier. */
  rimWidth: number;
  /** Pointer-facing highlight strength. */
  highlight: number;
  /** Thin edge line strength. */
  edgeLine: number;
  /** Slow iridescent sheen across the body of each surface. 0 = none. */
  shimmer: number;
  /** How fast that sheen drifts. 1 is the slow default; 30 cycles the colours visibly — a button lighting up under the pointer. */
  shimmerSpeed: number;
  /** Colored bloom the plasma casts onto the background around it. 0 = none. */
  glow: number;
  /** How much the material tints what is seen through it. 0 = clear as water. */
  wash: number;
  /** Film grain over the background. 0 = none. */
  grain: number;
  /** Blur applied to the background only, in CSS px (0-40). Costs 8 extra blur passes when above 0. */
  backgroundBlur: number;
  /**
   * What the canvas shows where there is no surface. "field" paints the
   * background everywhere. "clear" leaves it transparent, so the canvas can
   * sit above other content: only the surfaces, their shadows and rims are
   * drawn, and what a surface refracts is the `background` source - usually a
   * live canvas of the field beneath, sampled without swirl so it lines up.
   */
  ground: "field" | "clear";
  /**
   * Keep each frame in the drawing buffer after it is shown, so another
   * provider can pass this canvas as its `background` and sample it. Off,
   * the browser may clear the buffer after compositing and the sample reads
   * blank. Fixed at creation.
   */
  preserveDrawingBuffer: boolean;
  /** What the surfaces are made of. */
  material: MaterialName;
  /** Direction the one light comes from. Every opaque material reads it, so they agree. */
  lightDir: [number, number, number];
  /** Surface finish: 0 mirror, 1 chalk. Used by metal; the others carry their own. */
  roughness: number;
  /** How far the highlight stretches along the grain. 0 is isotropic. */
  anisotropy: number;
  /** How far the outline is displaced from the rounded box, in CSS px. 0 leaves it clean. */
  edge: number;
  /** Size of the displacement, in cycles per px. Small is billows, large is chips. */
  edgeScale: number;
  /** 0 rolls the displaced edge, 1 breaks it into flats and points. */
  edgeSharpness: number;
  /** How thick a panel is as a solid, in CSS px. Only the marched materials use it. */
  thickness: number;
  /** Surface tension: how hard the material pulls its own shape toward a bead. */
  tension: number;
  /** 0 = watery and bouncy, 1 = thick and slow. */
  viscosity: number;
  /** How far the surface trails behind moving panels. 0 = no trailing. */
  stretch: number;
  /** Slow ripple along the outline. 0 = still edges. */
  flow: number;
  /** Default plasma tint (hex). */
  tint: string;
  /** Default tint strength, 0 (clear) to 1 (solid color). */
  opacity: number;
  /** Default translucency, 0 (clear) to 1 (frosted). */
  frost: number;
  /** Default elevation, 0 (flat, no shadow) to 1 (floating high). */
  elevation: number;
  /** Whether a new surface forms in (grows from nothing) or simply appears. */
  formIn: boolean;
  /** How fast the form-in and form-out run: 1 settles in about a quarter second, 2 in an eighth, 0.5 in a half. */
  formSpeed: number;
  /** Whether a removed surface forms out (shrinks to nothing) or simply vanishes. */
  formOut: boolean;
  /** Maximum visible surfaces, compiled into the shaders (fixed at creation). */
  maxSurfaces: number;
  /** Background: CSS color, image URL, or a live img/canvas/video source (null for the procedural mood field). */
  background: BackgroundSource | null;
}

/**
 * The materials a surface can be made of. `plasma` is the original and the
 * default; the rest share its geometry, its springs and its fusing, and differ
 * only in the composite pass — which is the whole reason they are cheap.
 */
const MATERIALS = [
  "plasma",
  "crystal",
  "metal",
  "mercury",
  "wood",
  "stone",
  "cloud",
] as const;
type MaterialName = (typeof MATERIALS)[number];

/** Anything the background can be: a CSS color string, an image URL, or an element to sample (canvas and video update live). */
type BackgroundSource =
  | string
  | HTMLImageElement
  | HTMLCanvasElement
  | HTMLVideoElement
  | ImageBitmap;

/**
 * Set on a surface's element from `register` until its form-in has finished
 * (about half a second; never under reduced motion). Style the element's
 * children off it to have the contents arrive after the material:
 * `[data-plasma-forming] > * { opacity: 0 }` with a transition on opacity.
 */
const FORMING_ATTR = "data-plasma-forming";
/**
 * Events a surface's element dispatches (bubbling, so a page can listen at
 * the document): `plasmaforming` when the form-in starts, `plasmaformed`
 * when it has settled — at once under reduced motion. `detail.id` is the
 * surface id. `<Plasma onForming onFormed>` wraps them.
 */
const FORMING_EVENT = "plasmaforming";
const FORMED_EVENT = "plasmaformed";
function dispatch(el: HTMLElement, name: string, id: number) {
  if (
    typeof CustomEvent === "undefined" ||
    typeof el.dispatchEvent !== "function"
  )
    return;
  el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { id } }));
}

interface ShapeOptions {
  radius: number;
  lean: number;
  /** Per-shape tint override (hex). */
  tint?: string | null;
  /** Per-shape tint strength override. */
  opacity?: number | null;
  /** Per-shape frost override. */
  frost?: number | null;
  /** Per-shape elevation override. */
  elevation?: number | null;
  /** When false, this surface never blends, bridges, or joins with others. Default true. */
  fuse?: boolean;
  /** Snap only against surfaces carrying the same group. null groups with the other ungrouped surfaces. */
  group?: string | null;
  /** Per-surface: form in, or appear at once. null follows the provider. */
  formIn?: boolean | null;
  /** Per-surface: form out when removed, or vanish at once. null follows the provider. */
  formOut?: boolean | null;
}

/** Handle returned by `register`, used by <Plasma>. */
interface JoinedSides {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

interface ShapeHandle {
  id: number;
  update(o: Partial<ShapeOptions>): void;
  setLayoutBox(fn: (() => Box) | null): void;
  setDragging(on: boolean): void;
  leanOffset(): { x: number; y: number };
  isJoined(): boolean;
  remove(): void;
}

interface Rec extends ShapeOptions {
  id: number;
  el: HTMLElement;
  form: number;
  formV: number;
  removing: boolean;
  /** The box a removing surface shrinks from — its element is gone by then. */
  removeBox: Box | null;
  /** True while `data-plasma-forming` is on the element (the form-in is still running). */
  forming: boolean;
  lx: number;
  ly: number;
  /**
   * Last translate and scale written, so an unchanged frame writes nothing.
   * These are written before the rect is read on purpose: the spring's target
   * has to include this frame's lean, or the plasma trails the DOM by a frame
   * and shimmers wherever the pointer keeps lean alive.
   */
  leanCss: string;
  scaleCss: string;
  joined: boolean;
  dragging: boolean;
  layoutBox: (() => Box) | null;
  pulseAt: number;
  pulseS: number;
  box: Box | null;
  onJoin?: (j: boolean) => void;
  onSides?: (sides: JoinedSides) => void;
  sidesKey: string;
  /** Surface spring (page coordinates): edges l, t, r, b and their velocities. */
  sp: { e: number[]; v: number[]; live: boolean };
  drawn: Box | null;
  elevNow: number;
}

type Prog = {
  pr: WebGLProgram;
  u: Record<string, WebGLUniformLocation | null>;
};
type Target = { tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number };

const UNIFORMS = [
  "uRes",
  "uView",
  "uScale",
  "uTime",
  "uGoo",
  "uEnergy",
  "uLight",
  "uMouseAmt",
  "uDropR",
  "uPull",
  "uAmbient",
  "uScroll",
  "uMouse",
  "uP",
  "uR",
  "uF",
  "uT",
  "uFr",
  "uEl",
  "uSolo",
  "uTint",
  "uImg",
  "uImgRes",
  "uHasImg",
  "uBgColor",
  "uBgSolid",
  "uBg",
  "uBgM",
  "uBgH",
  "uFrost",
  "uOut",
  "uCount",
  "uRip",
  "uA",
  "uB",
  "uC",
  "uH",
  "uS",
  "uTex",
  "uDir",
  "uVisc",
  "uFlow",
  "uRefract",
  "uDisp",
  "uRim",
  "uRimMode",
  "uRimColor",
  "uRimWidth",
  "uSpec",
  "uHair",
  "uShim",
  "uShimSp",
  "uGlow",
  "uWash",
  "uGrain",
  "uClear",
  "uMat",
  "uLightDir",
  "uRough",
  "uAniso",
  "uEdge",
  "uEdgeScale",
  "uEdgeSharp",
  "uThick",
  "uTension",
];
const MASK_SCALE = 0.5;
// Cap local-canvas work independently of monitor and phone pixel density.
const MAX_PIXELS = 1_500_000;

/** Visible box of an element with the centered pulse scale removed. */
function elementBox(el: HTMLElement): Box {
  const r = el.getBoundingClientRect();
  const w = el.offsetWidth,
    h = el.offsetHeight;
  return { l: r.left + (r.width - w) / 2, t: r.top + (r.height - h) / 2, w, h };
}

const near = (d: number) =>
  d <= 0 ? 1 : d >= 6 ? 0 : 1 - (d / 6) * (d / 6) * (3 - (2 * d) / 6);

/**
 * Square off corners that sit against a neighbor so flush panels form one clean
 * outline. Returns radii as [top-right, bottom-right, top-left, bottom-left].
 * A corner stays round only where it sticks out past the neighbor.
 */
function cornerRadii(
  a: Box,
  radius: number,
  all: Box[],
  self: number,
): number[] {
  const aR = a.l + a.w,
    aB = a.t + a.h;
  const corners: [number, number][] = [
    [1, -1],
    [1, 1],
    [-1, -1],
    [-1, 1],
  ];
  return corners.map(([sx, sy]) => {
    let f = 0;
    for (let j = 0; j < all.length && f < 1; j++) {
      if (j === self) continue;
      const b = all[j],
        bR = b.l + b.w,
        bB = b.t + b.h;
      // neighbor beside this corner, spanning its height
      const beyondX =
        (sx > 0 ? bR > aR + 1 : b.l < a.l - 1) &&
        (sy < 0 ? bB > a.t + 1 : b.t < aB - 1);
      if (beyondX) {
        const touch = near(sx > 0 ? b.l - aR : a.l - bR);
        const cover = near(sy < 0 ? b.t - a.t : aB - bB);
        f = Math.max(f, touch * cover);
      }
      // neighbor above or below this corner, spanning its x position
      const beyondY =
        (sy < 0 ? b.t < a.t - 1 : bB > aB + 1) &&
        (sx > 0 ? b.l < aR - 1 : bR > a.l + 1);
      if (beyondY) {
        const touch = near(sy < 0 ? a.t - bB : b.t - aB);
        const cover = near(sx > 0 ? aR - bR : b.l - a.l);
        f = Math.max(f, touch * cover);
      }
    }
    return radius * (1 - f);
  });
}

let cssColorContext: CanvasRenderingContext2D | null = null;

/** Parse any CSS color via the canvas fillStyle round-trip; null when src isn't a color. */
function parseCssColor(src: string): [number, number, number] | null {
  if (typeof document === "undefined") return null;
  const ctx = (cssColorContext ??= document
    .createElement("canvas")
    .getContext("2d"));
  if (!ctx) return null;
  ctx.fillStyle = "#010203";
  ctx.fillStyle = src;
  const a = ctx.fillStyle;
  ctx.fillStyle = "#040506";
  ctx.fillStyle = src;
  const b = ctx.fillStyle;
  if (a !== b) return null; // invalid: fillStyle kept the sentinel
  const m = /^#([0-9a-f]{6})$/i.exec(a);
  if (m)
    return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255) as [
      number,
      number,
      number,
    ];
  const r = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(a);
  if (r) return [+r[1] / 255, +r[2] / 255, +r[3] / 255];
  return null;
}

class PlasmaRenderer {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private progs!: { bg: Prog; mask: Prog; tint: Prog; blur: Prog; comp: Prog };
  private rtA!: Target;
  private rtB!: Target;
  private rtC!: Target;
  private rtT!: Target;
  private rtFr!: Target;
  private rtBg!: Target;
  private rtBgM!: Target;
  private rtBgH!: Target;
  private mrtFb!: WebGLFramebuffer;
  private imgTex: WebGLTexture | null = null;
  private imgRes: [number, number] = [1, 1];
  private imgSrc: BackgroundSource | null = null;
  private bgColor: [number, number, number] | null = null;
  private srcEl: HTMLCanvasElement | HTMLVideoElement | null = null; // re-uploaded each frame
  private floatOK = false;
  /** True between webglcontextlost and webglcontextrestored: draw nothing. */
  private lost = false;
  private warnedOverflow = false;
  /**
   * Set by destroy(). The canvas and its context outlive this renderer, so an
   * async callback that lands afterwards would happily allocate on a context
   * nothing can free it from.
   */
  private destroyed = false;
  private resizeSettle: ReturnType<typeof setTimeout> | undefined;
  /** Everything initGL() created, so destroy() can free it by hand. */
  private owned: {
    tex: WebGLTexture[];
    fb: WebGLFramebuffer[];
    prog: WebGLProgram[];
    buf: WebGLBuffer[];
  } = { tex: [], fb: [], prog: [], buf: [] };
  private recs = new Map<number, Rec>();
  private nextId = 1;
  private raf = 0;
  private last = 0;
  private time = 0;
  private dpr = 1;
  private region = { ox: 0, oy: 0, w: 0, h: 0 };
  private active = false;
  private resizeObserver: ResizeObserver | null = null;
  private host: HTMLElement;
  private onAvailabilityChange?: (supported: boolean) => void;
  private energy = 0;
  private mouse = { x: 0, y: 0, tx: 0, ty: 0, amt: 0, target: 0 };
  private pulses: number[][] = Array.from({ length: MAX_PULSES }, () => [
    0, 0, -99, 0,
  ]);
  private pulseIdx = 0;
  private colors: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  private colorTarget: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  private blend = 40;
  private lightQuery =
    typeof matchMedia !== "undefined"
      ? matchMedia("(prefers-color-scheme: light)")
      : null;
  private max: number;
  private P!: Float32Array;
  private R!: Float32Array;
  private F!: Float32Array;
  private T!: Float32Array;
  private FR!: Float32Array;
  private EL!: Float32Array;
  private SOLO!: Float32Array;
  private tintCache = new Map<string, [number, number, number]>();
  private RP = new Float32Array(MAX_PULSES * 4);
  settings: RendererSettings;

  /** Returns null without WebGL2; layout and controls retain their CSS fallback. */
  static create(
    canvas: HTMLCanvasElement,
    settings: RendererSettings,
    onAvailabilityChange?: (supported: boolean) => void,
  ): PlasmaRenderer | null {
    try {
      const gl = canvas.getContext("webgl2", {
        antialias: false,
        premultipliedAlpha: false,
      });
      return gl
        ? new PlasmaRenderer(canvas, gl, settings, onAvailabilityChange)
        : null;
    } catch {
      return null;
    }
  }

  private constructor(
    canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
    settings: RendererSettings,
    onAvailabilityChange?: (supported: boolean) => void,
  ) {
    this.canvas = canvas;
    this.gl = gl;
    this.settings = settings;
    this.host = canvas.parentElement ?? canvas;
    this.onAvailabilityChange = onAvailabilityChange;
    this.max = Math.max(
      1,
      Math.round(settings.maxSurfaces || DEFAULT_MAX_SHAPES),
    );
    this.allocUniformArrays();
    try {
      this.initGL();
    } catch (error) {
      this.releaseGL();
      throw error;
    }
    const bounds = canvas.getBoundingClientRect();
    this.mouse.x = this.mouse.tx = bounds.left + bounds.width / 2;
    this.mouse.y = this.mouse.ty = bounds.top + bounds.height / 2;
    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    this.host.addEventListener("pointermove", this.onPointer, {
      passive: true,
    });
    this.host.addEventListener("pointerleave", this.onLeave);
    addEventListener("resize", this.resize);
    this.resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(this.resize);
    this.resizeObserver?.observe(this.host);
    this.applyResize();
  }

  /** Stop entirely when the component is hidden or outside the viewport. */
  setActive(active: boolean) {
    this.active = active;
    if (!active) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.last = 0;
    } else this.invalidate();
  }

  /** Reduced motion schedules one repaint only after a user/layout/settings change. */
  invalidate() {
    if (
      this.active &&
      !document.hidden &&
      !this.destroyed &&
      !this.lost &&
      !this.raf
    ) {
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  private loadBackground(src: BackgroundSource | null) {
    if (src === this.imgSrc) return;
    this.imgSrc = src;
    const gl = this.gl;
    const clearTex = () => {
      if (this.imgTex) {
        gl.deleteTexture(this.imgTex);
        this.imgTex = null;
      }
    };
    this.bgColor = null;
    this.srcEl = null;
    if (!src) {
      clearTex();
      return;
    }

    // element sources: sample directly; canvas and video re-upload every frame
    if (typeof src !== "string") {
      clearTex();
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.imgTex = tex;
      const up = (source: TexImageSource, w: number, h: number) => {
        if (this.destroyed || !w || !h) return;
        gl.bindTexture(gl.TEXTURE_2D, this.imgTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA8,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          source,
        );
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        this.imgRes = [w, h];
      };
      if (
        src instanceof HTMLCanvasElement ||
        (typeof HTMLVideoElement !== "undefined" &&
          src instanceof HTMLVideoElement)
      ) {
        this.srcEl = src; // uploaded per frame in draw()
      } else if (
        typeof ImageBitmap !== "undefined" &&
        src instanceof ImageBitmap
      ) {
        up(src, src.width, src.height);
      } else {
        const img = src as HTMLImageElement;
        if (img.complete && img.naturalWidth)
          up(img, img.naturalWidth, img.naturalHeight);
        else
          img.addEventListener(
            "load",
            () => {
              if (!this.destroyed && this.imgSrc === src)
                up(img, img.naturalWidth, img.naturalHeight);
            },
            { once: true },
          );
      }
      return;
    }

    // string: any CSS color, else an image URL
    const rgb = parseCssColor(src);
    if (rgb) {
      this.bgColor = rgb;
      clearTex();
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // A load can land after destroy(): the context is still alive (it
      // belongs to the canvas, not to us), so this would allocate a texture
      // with nothing left to free it.
      if (this.destroyed || this.imgSrc !== src) return;
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (this.imgTex) gl.deleteTexture(this.imgTex);
      this.imgTex = tex;
      this.imgRes = [img.naturalWidth, img.naturalHeight];
    };
    img.src = src;
  }

  configure(s: RendererSettings, immediate = false) {
    const qualityChanged = s.quality !== this.settings.quality;
    const max = Math.max(1, Math.round(s.maxSurfaces || DEFAULT_MAX_SHAPES));
    this.settings = s;
    // The surface budget is compiled into the shaders, so changing it means
    // rebuilding every program. initGL() is the same path a context restore
    // takes, so it is safe to re-enter - but the context is alive here, so
    // what it is about to replace has to be freed first, or it all leaks.
    if (max !== this.max) {
      this.setMax(max);
      return;
    }
    this.loadBackground(s.background ?? null);
    this.colorTarget = s.colors.map(hexToRgb);
    if (immediate || s.reducedMotion) {
      this.colors = this.colorTarget.map((c) => [...c]);
      this.blend = s.blend;
    }
    if (qualityChanged) this.resize();
    this.invalidate();
  }

  register(
    el: HTMLElement,
    o: ShapeOptions,
    onJoin?: (j: boolean) => void,
    onSides?: (sides: JoinedSides) => void,
  ): ShapeHandle {
    const id = this.nextId++;
    const rec: Rec = {
      id,
      el,
      ...o,
      form:
        this.settings.reducedMotion || !(o.formIn ?? this.settings.formIn)
          ? 1
          : 0,
      formV: 0,
      removing: false,
      removeBox: null,
      forming: false,
      lx: 0,
      ly: 0,
      leanCss: "",
      scaleCss: "",
      joined: false,
      dragging: false,
      layoutBox: null,
      pulseAt: -1,
      pulseS: 0,
      box: null,
      onJoin,
      onSides,
      sidesKey: "",
      sp: { e: [0, 0, 0, 0], v: [0, 0, 0, 0], live: false },
      drawn: null,
      elevNow: -1,
    };
    // While the surface forms in, the element says so, so its contents can
    // wait for the material (see FORMING_ATTR). Not under reduced motion,
    // where there is no form-in to wait for.
    if (
      !this.settings.reducedMotion &&
      (o.formIn ?? this.settings.formIn) &&
      typeof el.setAttribute === "function"
    ) {
      rec.forming = true;
      el.setAttribute(FORMING_ATTR, "");
      dispatch(el, FORMING_EVENT, id);
    } else dispatch(el, FORMED_EVENT, id);
    this.recs.set(id, rec);
    this.invalidate();
    return {
      id,
      update: (p) => {
        Object.assign(rec, p);
        this.invalidate();
      },
      setLayoutBox: (fn) => {
        rec.layoutBox = fn;
      },
      setDragging: (on) => {
        rec.dragging = on;
        this.invalidate();
      },
      leanOffset: () => ({ x: rec.lx, y: rec.ly }),
      isJoined: () => rec.joined,
      remove: () => {
        el.style.translate = "";
        el.style.scale = "";
        if (rec.forming) {
          rec.forming = false;
          el.removeAttribute(FORMING_ATTR);
        }
        // Form out: keep drawing from the last box while the spring takes the
        // surface to nothing; the element itself is usually gone already.
        const box = rec.box ?? (el.isConnected ? elementBox(el) : null);
        if (
          (rec.formOut ?? this.settings.formOut) &&
          !this.settings.reducedMotion &&
          !this.destroyed &&
          box &&
          rec.form > 0.05
        ) {
          rec.removing = true;
          rec.removeBox = box;
          rec.fuse = false;
          rec.dragging = false;
          rec.layoutBox = null;
          return;
        }
        this.recs.delete(id);
      },
    };
  }

  /**
   * Layout boxes of all shapes (lean removed; animating draggables report
   * their destination). Pass `group` to see only the surfaces in that group;
   * omit it - as any caller written before groups existed does - to see them all.
   */
  layoutBoxes(
    excludeId?: number,
    fusingOnly = false,
    group?: string | null,
  ): Box[] {
    const out: Box[] = [];
    this.recs.forEach((r) => {
      if (r.removing) return;
      if (r.id === excludeId) return;
      if (fusingOnly && r.fuse === false) return;
      if (group !== undefined && (r.group ?? null) !== group) return;
      out.push(this.layoutBoxOf(r));
    });
    return out;
  }

  private layoutBoxOf(r: Rec): Box {
    if (r.layoutBox) return r.layoutBox();
    // The frame already read this element's rect a moment ago, with no style
    // write in between, so that box is exact - reading it again cost a second
    // getBoundingClientRect per panel per frame for the same numbers.
    const b = r.box ?? elementBox(r.el);
    return { l: b.l - r.lx, t: b.t - r.ly, w: b.w, h: b.h };
  }

  /** Send a pulse through the material from a viewport point. */
  pulse(x: number, y: number, strength = 1) {
    if (this.settings.reducedMotion) {
      this.invalidate();
      return;
    }
    this.pulses[this.pulseIdx] = [x, y, this.time, strength];
    this.pulseIdx = (this.pulseIdx + 1) % MAX_PULSES;
    this.recs.forEach((r) => {
      const b = elementBox(r.el);
      const dist = Math.hypot(b.l + b.w / 2 - x, b.t + b.h / 2 - y);
      r.pulseAt = this.time + dist / 520;
      r.pulseS = strength;
    });
    if (!this.settings.reducedMotion) this.bump(0.9 * strength);
    this.invalidate();
  }

  /** Raise the material's energy (brightens contours and color); it decays on its own. */
  bump(e: number) {
    this.energy = Math.max(this.energy, Math.min(e, 1));
  }

  /** Rebuild the shaders and uniform arrays for a new surface budget. */
  private setMax(max: number) {
    this.max = max;
    this.allocUniformArrays();
    this.releaseGL();
    this.initGL();
    this.applyResize(); // initGL zeroes the canvas size, so this always reallocates
    this.warnedOverflow = false;
  }

  private allocUniformArrays() {
    this.P = new Float32Array(this.max * 4);
    this.R = new Float32Array(this.max * 4);
    this.F = new Float32Array(this.max);
    this.T = new Float32Array(this.max * 4);
    this.FR = new Float32Array(this.max);
    this.EL = new Float32Array(this.max);
    this.SOLO = new Float32Array(this.max);
  }

  /** Delete every GL object this renderer created, leaving the canvas usable. */
  private releaseGL() {
    const gl = this.gl;
    if (!gl.isContextLost()) {
      this.owned.tex.forEach((t) => gl.deleteTexture(t));
      this.owned.fb.forEach((f) => gl.deleteFramebuffer(f));
      this.owned.prog.forEach((pr) => gl.deleteProgram(pr));
      this.owned.buf.forEach((b) => gl.deleteBuffer(b));
      // Not in `owned`: loadBackground creates it, so nothing else would.
      if (this.imgTex) gl.deleteTexture(this.imgTex);
    }
    this.imgTex = null;
    this.imgSrc = null;
    this.srcEl = null;
    this.owned = { tex: [], fb: [], prog: [], buf: [] };
  }

  /**
   * Every GL object this renderer owns. A lost context invalidates all of
   * them, so creation lives here rather than in the constructor: the restore
   * handler runs exactly the same path.
   */
  private initGL() {
    const gl = this.gl;
    this.owned = { tex: [], fb: [], prog: [], buf: [] };
    // The background texture is created outside this method (loadBackground,
    // often asynchronously), so it is not in `owned` and does not come back
    // with everything else. On a restore its handle belongs to the dead
    // context: drop the reference — deleting it is neither possible nor
    // needed — and clear the source, or the configure() below early-returns
    // on an unchanged src and the background is gone for good while uHasImg
    // still says 1.
    this.imgTex = null;
    this.imgSrc = null;
    this.srcEl = null;
    this.floatOK = !!gl.getExtension("EXT_color_buffer_float");
    const sh = makeShaders(this.max);
    this.progs = {
      bg: this.program(sh.bgFrag),
      mask: this.program(sh.maskFrag),
      tint: this.program(sh.tintFrag),
      blur: this.program(sh.blurFrag),
      comp: this.program(sh.compFrag),
    };
    const buf = gl.createBuffer();
    if (buf) this.owned.buf.push(buf);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.rtA = this.target();
    this.rtB = this.target();
    this.rtC = this.target();
    this.rtT = this.target();
    this.rtFr = this.target();
    this.rtBg = this.target();
    this.rtBgM = this.target();
    this.rtBgH = this.target();
    this.mrtFb = gl.createFramebuffer()!;
    this.owned.fb.push(this.mrtFb);
    this.configure(this.settings, true);
    // These objects have no storage or attachments yet, and allocate() skips
    // its work when the pixel size is unchanged — which it is whenever this
    // renderer replaced another on the same canvas (every StrictMode remount
    // in development, and every context restore). Zero the size so the next
    // applyResize() always reallocates; otherwise mrtFb is drawn into with no
    // attachment: "Framebuffer is incomplete: No attachments".
    this.canvas.width = this.canvas.height = 0;
  }

  private onContextLost = (event: Event) => {
    event.preventDefault();
    this.lost = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.onAvailabilityChange?.(false);
  };

  private onContextRestored = () => {
    if (this.destroyed) return;
    try {
      this.initGL();
      this.lost = false;
      this.last = 0;
      this.applyResize();
      this.onAvailabilityChange?.(true);
      this.invalidate();
    } catch {
      this.releaseGL();
      this.lost = true;
      this.onAvailabilityChange?.(false);
    }
  };

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.resizeSettle);
    this.resizeObserver?.disconnect();
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener(
      "webglcontextrestored",
      this.onContextRestored,
    );
    removeEventListener("resize", this.resize);
    this.host.removeEventListener("pointermove", this.onPointer);
    this.host.removeEventListener("pointerleave", this.onLeave);
    this.recs.forEach((record) => {
      record.el.style.translate = "";
      record.el.style.scale = "";
    });
    this.recs.clear();
    this.releaseGL();
  }

  private onPointer = (event: PointerEvent) => {
    if (this.settings.reducedMotion) return;
    this.mouse.tx = event.clientX;
    this.mouse.ty = event.clientY;
    this.mouse.target = 1;
  };
  private onLeave = () => {
    this.mouse.target = 0;
  };

  private resize = () => {
    clearTimeout(this.resizeSettle);
    this.resizeSettle = setTimeout(this.applyResize, 120);
  };

  private applyResize = () => {
    if (this.destroyed || this.lost) return;
    const bounds = this.canvas.getBoundingClientRect();
    this.region = {
      ox: -bounds.left,
      oy: -bounds.top,
      w: Math.max(1, bounds.width),
      h: Math.max(1, bounds.height),
    };
    this.allocate();
    this.invalidate();
  };

  /** Size the canvas and every target for the current region. */
  private allocate = () => {
    const gl = this.gl;
    const { w: rw, h: rh } = this.region;
    let dpr = Math.min(devicePixelRatio || 1, this.settings.quality);
    const pixels = rw * rh * dpr * dpr;
    if (pixels > MAX_PIXELS) dpr *= Math.sqrt(MAX_PIXELS / pixels);
    this.dpr = dpr;
    const cw = Math.max(1, Math.round(rw * this.dpr));
    const ch = Math.max(1, Math.round(rh * this.dpr));
    // Nothing to do when the pixel size is unchanged, which is most of the
    // resize events a mobile browser sends.
    if (cw === this.canvas.width && ch === this.canvas.height) return;
    this.canvas.width = cw;
    this.canvas.height = ch;
    const w = Math.max(1, Math.round(this.canvas.width * MASK_SCALE));
    const h = Math.max(1, Math.round(this.canvas.height * MASK_SCALE));
    const size = (t: Target, tw: number, th: number, color = false) => {
      t.w = tw;
      t.h = th;
      gl.bindTexture(gl.TEXTURE_2D, t.tex);
      // Field and height targets carry signed distances and blur weights and
      // want the half-float precision. A colour target is only ever shown, and
      // the screen is 8-bit: at full resolution that halves the largest
      // allocation here.
      if (this.floatOK && !color)
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA16F,
          tw,
          th,
          0,
          gl.RGBA,
          gl.HALF_FLOAT,
          null,
        );
      else
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA8,
          tw,
          th,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          null,
        );
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        t.tex,
        0,
      );
    };
    [
      this.rtA,
      this.rtB,
      this.rtC,
      this.rtT,
      this.rtFr,
      this.rtBgM,
      this.rtBgH,
    ].forEach((t) => size(t, w, h));
    size(this.rtBg, this.canvas.width, this.canvas.height, true);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.mrtFb);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.rtT.tex,
      0,
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT1,
      gl.TEXTURE_2D,
      this.rtFr.tex,
      0,
    );
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  private isLight() {
    const t = this.settings.theme;
    if (t !== "auto") return t === "light";
    const attr = document.documentElement.dataset.theme;
    if (attr === "light" || attr === "dark") return attr === "light";
    return !!this.lightQuery?.matches;
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (this.lost || this.destroyed || !this.active || document.hidden) return;
    if (!this.settings.reducedMotion)
      this.raf = requestAnimationFrame(this.frame);
    const canvasBounds = this.canvas.getBoundingClientRect();
    this.region.ox = -canvasBounds.left;
    this.region.oy = -canvasBounds.top;
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 0.016;
    this.last = now;
    const s = this.settings;
    if (!s.reducedMotion) this.time += dt;

    // ease shared state
    const m = this.mouse;
    m.x += (m.tx - m.x) * 0.18;
    m.y += (m.ty - m.y) * 0.18;
    m.amt += (m.target - m.amt) * Math.min(1, dt * 4);
    const ce = 1 - Math.exp(-dt * 2);
    this.colors.forEach((c, i) =>
      c.forEach((v, j) => {
        c[j] = v + (this.colorTarget[i][j] - v) * ce;
      }),
    );
    this.blend += (s.blend - this.blend) * ce;
    this.energy *= Math.exp(-dt * 1.2);

    // per-shape: form spring, visibility, join state, lean, pulse
    // Cull in client coordinates against the component’s local canvas bounds.
    const rg = this.region;
    const top = -rg.oy - 80,
      bottom = rg.h - rg.oy + 80,
      left = -rg.ox - 80,
      right = rg.w - rg.ox + 80;
    const list: Rec[] = [];
    const sp = Math.max(0.1, Math.min(10, s.formSpeed || 1));
    const k = 680 * sp * sp,
      c = 52 * sp; // the same critical damping at every speed
    // One step per frame diverges once dt passes ~32ms at speed 1 (~20ms for
    // the stiffer form-out): below ~31fps form grew ~3x a frame with the sign
    // flipping, so surfaces flashed page-sized, then overflowed to NaN and were
    // gone for good. Substep so each step stays well inside the stable range.
    const fSteps = Math.max(1, Math.ceil((dt * sp) / 0.016)),
      fh = dt / fSteps;
    this.recs.forEach((r) => {
      if (r.removing) {
        // Forming out: the spring runs to zero from the box it last had, at
        // 1.6× the form-in's pace — leaving reads right quicker than arriving.
        for (let i = 0; i < fSteps; i++) {
          r.formV += (k * 2.56 * (0 - r.form) - c * 1.6 * r.formV) * fh;
          r.form += r.formV * fh;
        }
        if (r.form < 0.02) {
          this.recs.delete(r.id);
          return;
        }
        r.box = r.removeBox;
        list.push(r);
        return;
      }
      if (!r.el.isConnected) return;
      if (!s.reducedMotion) {
        // Critically damped: surfaces form in without overshooting. At the
        // old damping of 12 they went 17.6% past full size and rang back,
        // which read as a bounce on first paint. Stiffness 680 / damping 52
        // (the same ratio) settles in about a quarter second; the 170 / 26 it
        // shipped with took half a second, which read as slow once a whole
        // workspace of panes arrived at once.
        for (let i = 0; i < fSteps; i++) {
          r.formV += (k * (1 - r.form) - c * r.formV) * fh;
          r.form += r.formV * fh;
        }
      } else r.form = 1;
      if (r.forming && r.form > 0.985) {
        r.forming = false;
        r.el.removeAttribute(FORMING_ATTR);
        dispatch(r.el, FORMED_EVENT, r.id);
      }
      const b = elementBox(r.el);
      r.box = b;
      if (
        b.w === 0 ||
        b.l > right ||
        b.t > bottom ||
        b.l + b.w < left ||
        b.t + b.h < top
      ) {
        r.sp.live = false;
        return;
      }
      list.push(r);
    });

    const boxes = list.map((r) => this.layoutBoxOf(r));
    // surfaces visibly fuse once the gap is inside roughly half the blend distance
    const joinGap = Math.max(1.5, this.blend * 0.5);
    list.forEach((r, i) => {
      const a = boxes[i];
      const sides = { top: false, right: false, bottom: false, left: false };
      const iSolo = list[i].fuse === false;
      boxes.forEach((b, j) => {
        if (j === i || iSolo || list[j].fuse === false) return;
        const overX = b.l < a.l + a.w - 1 && b.l + b.w > a.l + 1;
        const overY = b.t < a.t + a.h - 1 && b.t + b.h > a.t + 1;
        if (overX) {
          if (a.t - (b.t + b.h) < joinGap && b.t < a.t) sides.top = true;
          if (b.t - (a.t + a.h) < joinGap && b.t + b.h > a.t + a.h)
            sides.bottom = true;
        }
        if (overY) {
          if (a.l - (b.l + b.w) < joinGap && b.l < a.l) sides.left = true;
          if (b.l - (a.l + a.w) < joinGap && b.l + b.w > a.l + a.w)
            sides.right = true;
        }
      });
      const joined = sides.top || sides.right || sides.bottom || sides.left;
      if (joined !== r.joined) {
        r.joined = joined;
        r.onJoin?.(joined);
      }
      const key = `${+sides.top}${+sides.right}${+sides.bottom}${+sides.left}`;
      if (key !== r.sidesKey) {
        r.sidesKey = key;
        r.onSides?.(sides);
      }

      let tx = 0,
        ty = 0;
      if (r.lean > 0 && !joined && !r.dragging && !s.reducedMotion) {
        const dx = m.tx - (a.l + a.w / 2),
          dy = m.ty - (a.t + a.h / 2);
        const pull = Math.exp(-(dx * dx + dy * dy) / 120000) * r.lean * m.amt;
        const len = Math.hypot(dx, dy) || 1;
        tx = (dx / len) * pull;
        ty = (dy / len) * pull;
      }
      const le = 1 - Math.exp(-dt * 3);
      r.lx += (tx - r.lx) * le;
      r.ly += (ty - r.ly) * le;
      // Lean eases asymptotically, so it never quite stops changing. Writing
      // it every frame dirtied layout for every panel every frame, and the
      // getBoundingClientRect below then forced a reflow to resolve it.
      // Below a twentieth of a pixel there is nothing to see, so settle.
      if (Math.abs(tx - r.lx) < 0.05 && Math.abs(ty - r.ly) < 0.05) {
        r.lx = tx;
        r.ly = ty;
      }
      const lean =
        tx === 0 && ty === 0 && r.lx === 0 && r.ly === 0
          ? ""
          : `${r.lx.toFixed(2)}px ${r.ly.toFixed(2)}px`;
      if (lean !== r.leanCss) {
        r.leanCss = lean;
        r.el.style.translate = lean;
      }

      const u = (this.time - r.pulseAt) / 0.36;
      const scale =
        r.pulseAt >= 0 && u >= 0 && u <= 1 && !s.reducedMotion
          ? String(1 + 0.04 * r.pulseS * Math.sin(Math.PI * u))
          : "";
      if (scale !== r.scaleCss) {
        r.scaleCss = scale;
        r.el.style.scale = scale;
      }
    });

    // Viscous surface: each plasma box is a spring that chases its element (in page
    // coordinates, so scrolling doesn't count as motion). The drawn shape is the union
    // of the element and the spring, so content never leaves the plasma: moving panels
    // leave a trailing stretch, and stopping panels overshoot forward before settling.
    const v = Math.min(Math.max(s.viscosity, 0), 1);
    const st = Math.max(s.stretch, 0);
    const stiff = (900 - 810 * v) / Math.max(st * st, 1e-4);
    const zeta = 0.28 + 0.87 * v;
    const damp = 2 * zeta * Math.sqrt(stiff);
    const sx = scrollX,
      sy = scrollY;
    // The substep has to satisfy the spring, not just the frame rate. stiff
    // grows as 1/stretch^2, so a small stretch with low viscosity pushes
    // stiff past two million: at a fixed 1/120s step, explicit Euler diverges
    // and the surface visibly oscillates instead of settling. Keeping
    // h well inside 1/omega holds it stable at every slider position.
    const hMax = 0.2 / Math.sqrt(Math.max(stiff, 1e-6));
    const steps = Math.min(
      240,
      Math.max(Math.ceil(dt * 120), Math.ceil(dt / hMax), 1),
    );
    const h = dt / steps;
    list.forEach((r) => {
      const rr = r.el.getBoundingClientRect(); // includes pulse scale and lean
      const tgt = [rr.left + sx, rr.top + sy, rr.right + sx, rr.bottom + sy];
      const sp = r.sp;
      if (!sp.live || st < 0.01 || s.reducedMotion) {
        sp.e = tgt.slice();
        sp.v = [0, 0, 0, 0];
        sp.live = true;
      } else {
        for (let k = 0; k < steps; k++)
          for (let j = 0; j < 4; j++) {
            sp.v[j] += (stiff * (tgt[j] - sp.e[j]) - damp * sp.v[j]) * h;
            sp.e[j] += sp.v[j] * h;
          }
        for (let j = 0; j < 4; j++)
          if (Math.abs(tgt[j] - sp.e[j]) < 0.02 && Math.abs(sp.v[j]) < 0.05) {
            sp.e[j] = tgt[j];
            sp.v[j] = 0;
          }
      }
      const l = Math.min(tgt[0], sp.e[0]) - sx,
        t = Math.min(tgt[1], sp.e[1]) - sy;
      const rgt = Math.max(tgt[2], sp.e[2]) - sx,
        btm = Math.max(tgt[3], sp.e[3]) - sy;
      r.drawn = { l, t, w: rgt - l, h: btm - t };
    });

    if (list.length > this.max && !this.warnedOverflow) {
      this.warnedOverflow = true;
      console.warn(
        `[plasma-ui] ${list.length} plasma surfaces are on screen but maxSurfaces is ${this.max}; the rest are not drawn. Raise maxSurfaces on <PlasmaProvider>.`,
      );
    }
    this.lastList = list.slice(0, this.max);
    this.draw(this.lastList);
  };
  private lastList: Rec[] = [];

  private draw(list: Rec[]) {
    const gl = this.gl,
      s = this.settings,
      rg = this.region;
    const drawn = list.map((r) => r.drawn ?? elementBox(r.el));
    list.forEach((r, i) => {
      const b = drawn[i];
      this.P.set(
        [b.l + b.w / 2 + rg.ox, b.t + b.h / 2 + rg.oy, b.w / 2, b.h / 2],
        i * 4,
      );
      // fuse={false} surfaces neither square others' corners nor get squared
      const squareAgainst =
        r.fuse === false
          ? []
          : drawn.filter((_, j) => j !== i && list[j].fuse !== false);
      this.R.set(cornerRadii(b, r.radius, squareAgainst, -1), i * 4);
      this.F[i] = Math.max(0, r.form);
      const [tr, tg, tb] = this.rgb(r.tint ?? s.tint);
      this.T.set(
        [tr, tg, tb, Math.min(Math.max(r.opacity ?? s.opacity, 0), 1)],
        i * 4,
      );
      this.FR[i] = Math.min(Math.max(r.frost ?? s.frost, 0), 1);
      // ease toward base elevation, raised while dragging
      const base = Math.min(Math.max(r.elevation ?? s.elevation, 0), 1);
      const target = r.dragging ? Math.min(base + 0.35, 1) : base;
      r.elevNow =
        r.elevNow < 0 ? target : r.elevNow + (target - r.elevNow) * 0.12;
      this.EL[i] = r.elevNow;
      this.SOLO[i] = r.fuse === false ? 1 : 0;
    });
    this.pulses.forEach((p, i) =>
      this.RP.set([p[0] + rg.ox, p[1] + rg.oy, p[2], p[3]], i * 4),
    );
    const light = this.isLight() ? 1 : 0;
    const setCommon = (u: Prog["u"], scale: number) => {
      gl.uniform2f(u.uRes, rg.w, rg.h);
      gl.uniform4f(u.uView, 0, 0, rg.w, rg.h);
      gl.uniform1f(u.uScale, scale);
      gl.uniform1f(u.uTime, this.time);
      gl.uniform1f(u.uGoo, this.blend);
      gl.uniform1f(u.uEnergy, this.energy);
      gl.uniform1f(u.uLight, light);
      gl.uniform1f(u.uMouseAmt, this.mouse.amt);
      gl.uniform1f(u.uDropR, s.pointerDrop ? 15 : 0);
      gl.uniform1f(u.uPull, s.pointerPull && !s.reducedMotion ? 1 : 0);
      gl.uniform1f(u.uAmbient, s.ambientDrops ? 1 : 0);
      // The procedural field stays attached to the component during page scrolling.
      gl.uniform1f(u.uScroll, 0);
      gl.uniform1f(u.uVisc, Math.min(Math.max(s.viscosity, 0), 1));
      gl.uniform1f(u.uFlow, Math.max(s.flow, 0));
      gl.uniform2f(u.uMouse, this.mouse.x + rg.ox, this.mouse.y + rg.oy);
      gl.uniform4fv(u.uP, this.P);
      gl.uniform4fv(u.uR, this.R);
      gl.uniform1fv(u.uF, this.F);
      gl.uniform4fv(u.uT, this.T);
      gl.uniform1fv(u.uFr, this.FR);
      gl.uniform1fv(u.uEl, this.EL);
      gl.uniform1fv(u.uSolo, this.SOLO);
      gl.uniform1i(u.uCount, list.length);
      gl.uniform4fv(u.uRip, this.RP);
      gl.uniform3fv(u.uA, this.colors[0]);
      gl.uniform3fv(u.uB, this.colors[1]);
      gl.uniform3fv(u.uC, this.colors[2]);
      // Shared with the mask and tint passes: the silhouette has to be the
      // same shape the composite marches, or it clips it.
      gl.uniform1f(u.uTension, s.tension);
      gl.uniform1f(u.uThick, s.thickness);
    };

    const bl = this.progs.blur;
    const pass = (src: Target, dst: Target, dx: number, dy: number) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform2f(bl.u.uDir, dx, dy);
      gl.uniform2f(bl.u.uOut, dst.w, dst.h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const k = this.dpr / 1.25;

    // 0. background, plus two blurred copies for frosted plasma
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.rtBg.fb);
    gl.viewport(0, 0, this.rtBg.w, this.rtBg.h);
    gl.useProgram(this.progs.bg.pr);
    setCommon(this.progs.bg.u, this.dpr);
    gl.activeTexture(gl.TEXTURE7);
    if (this.srcEl && this.imgTex) {
      const el = this.srcEl;
      const ready =
        el instanceof HTMLCanvasElement ? el.width > 0 : el.readyState >= 2;
      if (ready) {
        const w = el instanceof HTMLCanvasElement ? el.width : el.videoWidth;
        const h = el instanceof HTMLCanvasElement ? el.height : el.videoHeight;
        gl.bindTexture(gl.TEXTURE_2D, this.imgTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA8,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          el,
        );
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        this.imgRes = [w, h];
      }
    }
    gl.bindTexture(gl.TEXTURE_2D, this.imgTex);
    gl.uniform1i(this.progs.bg.u.uImg, 7);
    gl.uniform2f(this.progs.bg.u.uImgRes, this.imgRes[0], this.imgRes[1]);
    gl.uniform1f(this.progs.bg.u.uHasImg, this.imgTex ? 1 : 0);
    const bc = this.bgColor;
    gl.uniform3f(
      this.progs.bg.u.uBgColor,
      bc?.[0] ?? 0,
      bc?.[1] ?? 0,
      bc?.[2] ?? 0,
    );
    gl.uniform1f(this.progs.bg.u.uBgSolid, bc ? 1 : 0);
    gl.uniform1f(this.progs.bg.u.uClear, s.ground === "clear" ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);
    gl.viewport(0, 0, this.rtA.w, this.rtA.h);
    gl.useProgram(bl.pr);
    gl.uniform1i(bl.u.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);
    // Blur the background itself, before any surface is drawn: unlike frost,
    // which blurs only what a frosted surface sees, this softens the whole
    // field. It runs through the half-resolution scratch targets and lands
    // back in rtBg, so every later pass - shadows, refraction, frost - reads
    // the softened background with no extra work of its own.
    const bgBlur = Math.min(40, Math.max(0, s.backgroundBlur || 0));
    if (bgBlur > 0) {
      const step = (bgBlur * this.dpr * MASK_SCALE) / 4;
      pass(this.rtBg, this.rtBgM, 0, 0); // full res -> half res (the viewport is already half res)
      for (let i = 0; i < 3; i++) {
        pass(this.rtBgM, this.rtB, step, 0);
        pass(this.rtB, this.rtBgM, 0, step);
      }
      gl.viewport(0, 0, this.rtBg.w, this.rtBg.h);
      pass(this.rtBgM, this.rtBg, 0, 0); // and back up
      gl.viewport(0, 0, this.rtA.w, this.rtA.h);
    }

    // Which chains have anything to blur. Frost and elevation share a target
    // (frost in .r, elevation in .g), so that chain runs if either is set.
    const n = list.length;
    let hasFrost = false,
      hasTint = false,
      hasElev = false;
    for (let i = 0; i < n; i++) {
      if (this.FR[i] > 0.002) hasFrost = true;
      if (this.T[i * 4 + 3] > 0.002) hasTint = true;
      if (this.EL[i] > 0.002) hasElev = true;
    }
    // A reflective material reads the same blurred copies frost does — that is
    // the whole trick behind roughness costing nothing — so the chain has to
    // run for it too. Without this, metal at frost 0 sampled whatever those
    // targets happened to hold, which drew ghosts of the previous pass inside
    // every panel.
    const reflective = s.material === "metal" || s.material === "crystal";
    if (hasFrost || reflective) {
      // Ping-pong arranged so the sixth pass lands in rtBgM; this used to end
      // in the scratch target and spend a seventh pass copying it across.
      pass(this.rtBg, this.rtB, 1.5 * k, 0);
      pass(this.rtB, this.rtBgM, 0, 2.5 * k);
      pass(this.rtBgM, this.rtB, 2.5 * k, 0);
      pass(this.rtB, this.rtBgM, 0, 2.5 * k);
      pass(this.rtBgM, this.rtB, 2.5 * k, 0);
      pass(this.rtB, this.rtBgM, 0, 2.5 * k);
      pass(this.rtBgM, this.rtB, 5 * k, 0);
      pass(this.rtB, this.rtBgH, 0, 5 * k);
      pass(this.rtBgH, this.rtB, 5 * k, 0);
      pass(this.rtB, this.rtBgH, 0, 5 * k);
      pass(this.rtBgH, this.rtB, 5 * k, 0);
      pass(this.rtB, this.rtBgH, 0, 5 * k);
    }

    // 1. silhouette
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.rtA.fb);
    gl.viewport(0, 0, this.rtA.w, this.rtA.h);
    gl.useProgram(this.progs.mask.pr);
    setCommon(this.progs.mask.u, this.dpr * MASK_SCALE);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 1b. tint and frost layers
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.mrtFb);
    gl.useProgram(this.progs.tint.pr);
    setCommon(this.progs.tint.u, this.dpr * MASK_SCALE);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 2. outline field (rtA), tint and frost (same blur), and height field (rtC).
    // A chain whose input is all zero is skipped: blurring zeros gives zeros,
    // and the composite reads the tint through its alpha, so an unblurred
    // colour under a zero alpha is invisible.
    gl.useProgram(bl.pr);
    gl.uniform1i(bl.u.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);
    const so = 1.4 * k * s.smoothness;
    for (let i = 0; i < 3; i++) {
      pass(this.rtA, this.rtB, so, 0);
      pass(this.rtB, this.rtA, 0, so);
    }
    if (hasTint)
      for (let i = 0; i < 3; i++) {
        pass(this.rtT, this.rtB, so, 0);
        pass(this.rtB, this.rtT, 0, so);
      }
    if (hasFrost || hasElev)
      for (let i = 0; i < 3; i++) {
        pass(this.rtFr, this.rtB, so, 0);
        pass(this.rtB, this.rtFr, 0, so);
      }
    pass(this.rtA, this.rtB, 2 * k, 0);
    pass(this.rtB, this.rtC, 0, 2 * k);
    for (let i = 0; i < 3; i++) {
      pass(this.rtC, this.rtB, 2 * k, 0);
      pass(this.rtB, this.rtC, 0, 2 * k);
    }

    // 3. composite
    const c = this.progs.comp;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(c.pr);
    setCommon(c.u, this.dpr);
    gl.uniform1f(c.u.uRefract, s.refraction);
    gl.uniform1f(c.u.uDisp, s.dispersion);
    gl.uniform1f(c.u.uRim, s.rim);
    const mode =
      s.rimColor === "iridescent" ? 0 : s.rimColor === "tint" ? 2 : 1;
    gl.uniform1f(c.u.uRimMode, mode);
    gl.uniform3fv(c.u.uRimColor, mode === 1 ? this.rgb(s.rimColor) : [1, 1, 1]);
    gl.uniform1f(c.u.uRimWidth, s.rimWidth);
    gl.uniform1f(c.u.uSpec, s.highlight);
    gl.uniform1f(c.u.uHair, s.edgeLine);
    gl.uniform1f(c.u.uShim, s.shimmer);
    gl.uniform1f(c.u.uShimSp, s.shimmerSpeed);
    gl.uniform1f(c.u.uGlow, s.glow);
    gl.uniform1f(c.u.uWash, s.wash);
    gl.uniform1f(c.u.uGrain, s.grain);
    gl.uniform1f(c.u.uClear, s.ground === "clear" ? 1 : 0);
    gl.uniform1f(c.u.uMat, Math.max(0, MATERIALS.indexOf(s.material)));
    gl.uniform3f(c.u.uLightDir, s.lightDir[0], s.lightDir[1], s.lightDir[2]);
    gl.uniform1f(c.u.uRough, s.roughness);
    gl.uniform1f(c.u.uAniso, s.anisotropy);
    gl.uniform1f(c.u.uEdge, s.edge);
    gl.uniform1f(c.u.uEdgeScale, s.edgeScale);
    gl.uniform1f(c.u.uEdgeSharp, s.edgeSharpness);
    gl.uniform1f(c.u.uThick, s.thickness);
    gl.uniform1f(c.u.uTension, s.tension);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.rtC.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.rtA.tex);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.rtT.tex);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.rtBg.tex);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, this.rtBgM.tex);
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, this.rtBgH.tex);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, this.rtFr.tex);
    gl.uniform1i(c.u.uBg, 3);
    gl.uniform1i(c.u.uBgM, 4);
    gl.uniform1i(c.u.uBgH, 5);
    gl.uniform1i(c.u.uFrost, 6);
    gl.uniform1i(c.u.uH, 0);
    gl.uniform1i(c.u.uS, 1);
    gl.uniform1i(c.u.uTint, 2);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);
  }

  private rgbCache = new Map<string, [number, number, number]>();
  private rgb(hex: string): [number, number, number] {
    let v = this.rgbCache.get(hex);
    if (!v) {
      v = this.rgbParse(hex);
      this.rgbCache.set(hex, v);
    }
    return v;
  }
  private rgbParse(hex: string): [number, number, number] {
    let c = this.tintCache.get(hex);
    if (!c) {
      c = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex) ? hexToRgb(hex) : [1, 1, 1];
      this.tintCache.set(hex, c);
    }
    return c;
  }

  private program(fsrc: string): Prog {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(sh);
        gl.deleteShader(sh);
        throw new Error(log || "shader compile failed");
      }
      return sh;
    };
    const pr = gl.createProgram()!;
    // Shader objects outlive the call that compiled them: a program holds a
    // reference, and deleteProgram() alone does not free one that was never
    // flagged. Ten of them stranded per initGL() — once per StrictMode
    // remount and once per context restore. Detach and delete here and the
    // program is the only thing left to free.
    const attached: WebGLShader[] = [];
    let linked = false;
    try {
      const vs = compile(gl.VERTEX_SHADER, vert);
      let fs: WebGLShader;
      try {
        fs = compile(gl.FRAGMENT_SHADER, fsrc);
      } catch (e) {
        gl.deleteShader(vs);
        throw e;
      }
      gl.attachShader(pr, vs);
      attached.push(vs);
      gl.attachShader(pr, fs);
      attached.push(fs);
      gl.bindAttribLocation(pr, 0, "p");
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(pr) || "program link failed");
      linked = true;
    } finally {
      attached.forEach((sh) => {
        gl.detachShader(pr, sh);
        gl.deleteShader(sh);
      });
      if (!linked) gl.deleteProgram(pr);
    }
    const u: Prog["u"] = {};
    UNIFORMS.forEach((n) => {
      u[n] = gl.getUniformLocation(pr, n);
    });
    this.owned.prog.push(pr);
    return { pr, u };
  }

  private target(): Target {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer()!;
    this.owned.tex.push(tex);
    this.owned.fb.push(fb);
    return { tex, fb, w: 0, h: 0 };
  }
}

// Original Plasma UI signed-distance, procedural field and optics shaders.
/** Default maximum plasma shapes drawn at once (offscreen shapes are culled first). */
const DEFAULT_MAX_SHAPES = 16;
/** Maximum concurrent pulses. */
const MAX_PULSES = 4;

const vert = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

interface ShaderSet {
  maskFrag: string;
  tintFrag: string;
  blurFrag: string;
  bgFrag: string;
  compFrag: string;
}

/** Build the shader set for a given surface budget (compiled into the programs). */
function makeShaders(MAX_SHAPES: number): ShaderSet {
  const common = `
precision highp float;
uniform vec2 uRes; uniform vec4 uView; uniform float uScale, uTime, uGoo, uEnergy, uLight, uMouseAmt, uDropR, uPull, uAmbient, uScroll, uVisc, uFlow, uTension, uThick;
uniform vec2 uMouse;
uniform vec4 uP[${MAX_SHAPES}]; uniform vec4 uR[${MAX_SHAPES}]; uniform float uF[${MAX_SHAPES}]; uniform vec4 uT[${MAX_SHAPES}]; uniform float uFr[${MAX_SHAPES}]; uniform float uEl[${MAX_SHAPES}]; uniform float uSolo[${MAX_SHAPES}];
uniform int uCount;
uniform vec4 uRip[${MAX_PULSES}];
uniform vec3 uA, uB, uC;

float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y);
}
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return v; }
float smin(float a, float b, float k){ if(k <= .0001) return min(a,b); float h=max(k-abs(a-b),0.)/k; return min(a,b)-h*h*k*.25; }

// Rounded box distance plus its outward direction.
// r holds per-corner radii (top-right, bottom-right, top-left, bottom-left), y pointing down.
// The last component is 1 near a squared-off corner (one that sits against a neighbor),
// where blending would otherwise raise a bump at the seam.
vec4 sdBoxG(vec2 p, vec2 b, vec4 rc, float rmax){
  float r = p.x > 0. ? (p.y > 0. ? rc.y : rc.x) : (p.y > 0. ? rc.w : rc.z);
  vec2 q = abs(p) - b + r;
  vec2 mq = max(q, 0.);
  float lo = length(mq);
  vec2 g = lo > 0. ? mq / lo : (q.x > q.y ? vec2(1., 0.) : vec2(0., 1.));
  float sharp = (mq.x > 0. && mq.y > 0.) ? 1. - smoothstep(0., rmax * .35 + .01, r) : 0.;
  return vec4(lo + min(max(q.x, q.y), 0.) - r, g * sign(p + 1e-5), sharp);
}

float scene(vec2 p){
  float d = 1e4;      // fusing surfaces, blended
  float ds = 1e4;     // solo surfaces (fuse={false}), hard union only
  vec2 g = vec2(0.);
  float sh = 0.;
  for(int i=0;i<uCount;i++){
    float f = uF[i];
    if(f < .005) continue;
    vec2 c = uP[i].xy; vec2 h = uP[i].zw * f;
    float rmax = max(max(uR[i].x, uR[i].y), max(uR[i].z, uR[i].w));
    vec4 bx = sdBoxG(p-c, h, min(uR[i], vec4(min(h.x, h.y))), rmax);
    if(uSolo[i] > .5){ ds = min(ds, bx.x); continue; }
    if(d > 1e3){ d = bx.x; g = bx.yz; sh = bx.w; continue; }
    // Blend only where surfaces face different ways (corners, gaps, steps);
    // edges that face the same way stay perfectly straight.
    float k = uGoo * clamp((1. - dot(g, bx.yz)) / .8, 0., 1.) * (1. - sh) * (1. - bx.w);
    float nd = k < .5 ? min(d, bx.x) : smin(d, bx.x, k);
    if(bx.x < d){ g = bx.yz; sh = bx.w; }
    d = nd;
  }
  d = min(d, ds);
  if(uAmbient > .5){
    float t = uTime*.4;
    vec2 home = uView.xy + vec2(uView.z*.88, uView.w*.74);
    d = smin(d, length(p - home - vec2(cos(t),sin(t*1.3))*70.) - 38., uGoo);
    d = smin(d, length(p - home - vec2(cos(t*1.7+2.),sin(t*.9+1.))*90.) - 26., uGoo);
    d = smin(d, length(p - home - vec2(sin(t*.7),cos(t*1.1))*40.) - 20., uGoo);
  }
  // The pointer, two ways: the bead that follows it (uDropR), and the pull —
  // the surface swelling toward it as it nears an edge (uPull). Each its own.
  if(uDropR > 0.) d = smin(d, length(p-uMouse) - uDropR*uMouseAmt, 18.);
  if(uPull > 0.){
    float md = length(p-uMouse);
    d -= 3. * uPull * uMouseAmt * exp(-md*md/4000.);
  }
  for(int i=0;i<${MAX_PULSES};i++){
    float age = uTime - uRip[i].z;
    if(age < 0. || age > 3.) continue;
    float ring = length(p-uRip[i].xy) - age*mix(680., 330., uVisc);
    d -= uRip[i].w * mix(5., 2., uVisc) * exp(-ring*ring/900.) * exp(-age*mix(.8, 2.6, uVisc));
  }
  // slow ripple along the outline
  if(uFlow > 0.) d += uFlow * 5. * (noise(p/70. + vec2(uTime*.23, -uTime*.17)) - .5) * mix(1.4, .6, uVisc);
  return d;
}
vec2 fragPos(){ return vec2(gl_FragCoord.x, uRes.y*uScale - gl_FragCoord.y) / uScale; }
`;

  /** Pass 1: the combined silhouette. */
  const maskFrag = `#version 300 es
${common}
out vec4 o;
void main(){ o = vec4(smoothstep(1.5, -1.5, scene(fragPos()))); }`;

  /**
   * Pass 1b: tint layer. Each pixel inside the material takes a distance-weighted mix
   * of nearby shapes' tints, stored premultiplied by the silhouette so it can be blurred
   * and then un-premultiplied. Joined panels with different tints flow into each other.
   */
  const tintFrag = `#version 300 es
${common}
layout(location = 0) out vec4 o;
layout(location = 1) out vec4 o2;
void main(){
  vec2 p = fragPos();
  float m = smoothstep(1.5, -1.5, scene(p));
  vec4 acc = vec4(0.); float fr = 0.; float el = 0.; float wsum = 0.;
  for(int i=0;i<uCount;i++){
    if(uF[i] < .005) continue;
    vec2 h = uP[i].zw * uF[i];
    float rmax = max(max(uR[i].x, uR[i].y), max(uR[i].z, uR[i].w));
    float d = sdBoxG(p - uP[i].xy, h, min(uR[i], vec4(min(h.x, h.y))), rmax).x;
    float w = exp(-max(d, 0.) / 18.) * (1. + smoothstep(0., -24., d) * 4.);
    acc += uT[i] * w; fr += uFr[i] * w; el += uEl[i] * w; wsum += w;
  }
  vec4 t = wsum > 0. ? acc / wsum : vec4(0.);
  o = vec4(t.rgb * m, t.a * m);
  o2 = vec4((wsum > 0. ? fr / wsum : 0.) * m, (wsum > 0. ? el / wsum : 0.) * m, 0., 1.);
}`;

  /** Pass 2: separable Gaussian blur (13 taps via linear sampling). */
  const blurFrag = `#version 300 es
precision highp float;
uniform sampler2D uTex; uniform vec2 uDir, uOut;
out vec4 o;
void main(){
  vec2 ts = vec2(textureSize(uTex, 0));
  vec2 uv = gl_FragCoord.xy / uOut;
  vec2 st = uDir / ts;
  vec4 s = texture(uTex, uv) * .1964825501511404;
  s += (texture(uTex, uv + st*1.411764705882353) + texture(uTex, uv - st*1.411764705882353)) * .2969069646728344;
  s += (texture(uTex, uv + st*3.2941176470588234) + texture(uTex, uv - st*3.2941176470588234)) * .09447039785044732;
  s += (texture(uTex, uv + st*5.176470588235294) + texture(uTex, uv - st*5.176470588235294)) * .010381362401148057;
  o = s;
}`;

  /** Pass 0: the procedural background (with pulse distortion), drawn once per frame. */
  const bgFrag = `#version 300 es
${common}
uniform sampler2D uImg;
uniform vec2 uImgRes;
uniform float uHasImg;
uniform vec3 uBgColor;
uniform float uBgSolid;
uniform float uClear;
out vec4 o;
vec3 bg(vec2 p){
  p.y += uScroll;
  vec2 q = p/520.;
  float t = uTime*.035;
  vec2 w = vec2(fbm(q+t), fbm(q+vec2(5.2,1.3)-t));
  float n = fbm(q*1.4 + w*1.8 + t*.6);
  vec3 col = mix(uA, uB, smoothstep(.25,.75,n));
  col = mix(col, uC, smoothstep(.55,.9, w.x*n*1.6));
  float lines = abs(fract(n*14.)-.5);
  col += (1.-smoothstep(0.,.06,lines)) * .07 * (0.6+uEnergy);
  vec2 v = (p - vec2(0., uScroll) - uView.xy)/uView.zw - .5;
  col *= .55 + .45*smoothstep(1.2,.2,length(v));
  return mix(col, mix(vec3(.90,.93,.95), col, .42), uLight);
}
void main(){
  vec2 p = fragPos();
  vec2 bp = p;
  for(int i=0;i<${MAX_PULSES};i++){
    float age = uTime - uRip[i].z;
    if(age < 0. || age > 3.) continue;
    vec2 dir = normalize(p-uRip[i].xy+.001);
    float ring = length(p-uRip[i].xy) - age*mix(680., 330., uVisc);
    bp -= dir * uRip[i].w * mix(18., 9., uVisc) * exp(-ring*ring/2500.) * exp(-age*mix(.7, 2.2, uVisc));
  }
  if (uBgSolid > .5) {
    // solid color background: subtle luminance drift so refraction stays visible
    float shade = (fbm(p*.0012 + vec2(uTime*.02, -uTime*.015)) - .5) * .10
                + (fbm(p*.004 + 7.3) - .5) * .04
                + length(bp - p) * .004;
    o = vec4(uBgColor * (1. + shade), 1.);
    return;
  }
  if (uHasImg > .5 && uClear > .5) {
    // a clear ground samples what is beneath it exactly - no swirl, no warp -
    // so a refraction of it lines up with the page it sits on
    float sc = max(uView.z / uImgRes.x, uView.w / uImgRes.y);
    vec2 uv = (p - uView.xy - .5*uView.zw) / (uImgRes * sc) + .5;
    o = vec4(texture(uImg, clamp(uv, 0., 1.)).rgb, 1.);
    return;
  }
  if (uClear > .5) { o = vec4(0., 0., 0., 1.); return; }
  if (uHasImg > .5) {
    // image background: slow swirl plus the pulse warp above
    vec2 q = bp;
    q += (vec2(sin(q.y*.006 + uTime*.22), cos(q.x*.005 + uTime*.17)) * 7.
        + vec2(fbm(q*.004 + uTime*.05) - .5, fbm(q*.004 + 31.7 - uTime*.04) - .5) * 22.)
        * (.5 + uFlow*.5);
    // cover-fit the image to the canvas
    float sc = max(uView.z / uImgRes.x, uView.w / uImgRes.y);
    vec2 uv = (q - uView.xy - .5*uView.zw) / (uImgRes * sc) + .5;
    o = vec4(texture(uImg, clamp(uv, 0., 1.)).rgb, 1.);
    return;
  }
  o = vec4(bg(bp), 1.);
}`;

  /** Pass 3: smoothed outline and plasma shading over the background textures. */
  const compFrag = `#version 300 es
${common}
uniform sampler2D uH, uS, uTint, uBg, uBgM, uBgH, uFrost;
uniform float uRefract, uDisp, uRim, uRimMode, uRimWidth, uSpec, uHair, uShim, uShimSp, uGlow, uWash, uGrain;
// Which material the surfaces are made of, and the one light every opaque one
// reads. Glass fakes its lighting off the pointer because you see through it;
// the moment anything is opaque, two materials disagreeing about where the sun
// is looks broken in a way no single shader can fix. So there is one light.
uniform float uMat;
// 1 when the ground is clear: alpha is the surface's coverage (and its
// shadow's darkness), so the canvas can sit above other content.
uniform float uClear;
uniform vec3 uLightDir;
// Surface finish, shared by every material that has one: 0 is a mirror, 1 is
// chalk. Anisotropy stretches the highlight along the grain — brushed metal
// and varnished wood both need it, and neither reads right without it.
uniform float uRough, uAniso;
// How thick a panel is, in CSS px, and how much the material rounds itself
// against that. Mercury has enormous surface tension, so a bead pulls toward
// a sphere; tension drives both the corner radius and how eagerly two beads
// merge into one body.
// The edge treatment. A rounded rectangle is right for a liquid, and wrong for
// almost everything else: stone chips, cloud billows, metal is cut. These
// displace the silhouette itself — amplitude in CSS px, scale in cycles —
// before anything decides what is inside, so the outline, the rim, the shadow
// and the material all agree about where the panel ends.
uniform float uEdge, uEdgeScale, uEdgeSharp;
uniform vec3 uRimColor;
out vec4 o;

vec3 pal(float t){ return .5 + .5*cos(6.2831*(t + vec3(0., .33, .67))); }
float H(vec2 uv){ return texture(uH, uv).r; }
// Clamped, because a reflection offset is far larger than a refraction one:
// metal sweeps up to 150px and walks straight off the texture, where
// CLAMP_TO_EDGE smears the last row of pixels into arcs across the panel.
vec2 uvAt(vec2 q){ return clamp(vec2(q.x, uRes.y - q.y) / uRes, vec2(.001), vec2(.999)); }
// background seen through plasma with frost f: sharp, then medium, then heavy blur
vec3 seen(vec2 q, float f){
  vec2 u = uvAt(q);
  vec3 sharp = texture(uBg, u).rgb;
  if(f < .002) return sharp;
  vec3 soft = mix(texture(uBgM, u).rgb, texture(uBgH, u).rgb, smoothstep(.45, 1., f));
  return mix(sharp, soft, smoothstep(0., .45, f));
}
// ── Shading kit ───────────────────────────────────────────────────────────
// A real microfacet BRDF, not pow(ndl, n). GGX + height-correlated Smith +
// Schlick is what every modern renderer uses, and it is the single biggest
// difference between a material that reads as itself and one that reads as
// coloured plastic.
float D_GGX(float ndh, float a){ float a2 = a*a; float d = ndh*ndh*(a2-1.)+1.; return a2/(3.14159265*d*d + 1e-7); }
// Anisotropic GGX: the highlight stretches along a direction. This is the tell
// for wood and for brushed metal — an isotropic highlight on wood looks wrong
// even when nothing else does.
float D_GGXaniso(float ndh, float tdh, float bdh, float ax, float ay){
  float d = tdh*tdh/(ax*ax) + bdh*bdh/(ay*ay) + ndh*ndh;
  return 1./(3.14159265*ax*ay*d*d + 1e-7);
}
float V_SmithGGX(float ndv, float ndl, float a){
  float a2 = a*a;
  float gv = ndl*sqrt(ndv*ndv*(1.-a2)+a2);
  float gl = ndv*sqrt(ndl*ndl*(1.-a2)+a2);
  return .5/max(gv+gl, 1e-5);
}
vec3 F_Schlick(vec3 f0, float u){ return f0 + (1.-f0)*pow(clamp(1.-u,0.,1.), 5.); }

// Lighting has to happen in linear light. Doing it in gamma space is the
// oldest way to make a render look cheap: highlights clip early and midtones
// go chalky. sqrt/square is the standard cheap sRGB pair.
vec3 toLinear(vec3 c){ return c*c; }
vec3 toSrgb(vec3 c){ return sqrt(max(c, 0.)); }
// ACES filmic, fitted. Keeps a bright specular from flattening into white.
vec3 tonemap(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14), 0., 1.); }

// Plain fbm reads as fractal mush. Warping the domain by another fbm is what
// makes grain and rock look grown rather than generated — the background
// shader already leans on this.
vec2 warp(vec2 q, float k){
  return q + k*vec2(fbm(q + vec2(1.7, 9.2)), fbm(q + vec2(5.3, 2.8)));
}

// Metal only reads as metal when it reflects something with structure, and a
// page background is nearly uniform — reflect it alone and you get grey paint
// with a shiny rim. So reflective materials also see a small studio: a sky
// gradient, a horizon, and a sun in the same direction as the light. Roughness
// widens the sun and flattens the band, which is what a prefiltered
// environment map does for real.
vec3 envmap(vec3 R, float rough){
  float h = clamp(R.y * .5 + .5, 0., 1.);
  vec3 sky = mix(vec3(.62, .70, .84), vec3(.10, .13, .19), pow(1. - h, 1.5));
  vec3 ground = vec3(.055, .05, .048);
  vec3 c = mix(ground, sky, smoothstep(.40, .60, h));
  vec3 L = normalize(uLightDir);
  float sun = pow(max(dot(R, L), 0.), mix(260., 5., rough));
  c += vec3(1., .96, .88) * sun * (1. - rough * .7) * 2.2;
  // the horizon band is what gives a curved metal edge its sweep
  c += vec3(.75, .82, .95) * (1. - smoothstep(.0, .22, abs(h - .54))) * .45 * (1. - rough * .55);
  return c;
}

// ── The scene as a solid ──────────────────────────────────────────────────
// Everything above shades a flat card: a 2D silhouette, a perturbed normal,
// a texture lookup. That is skinning, and it is why wood came out looking
// like a wood-effect laminate. A material reads as a material when there is a
// body to light — so the same shapes are extruded into a slab and the view ray
// is marched through it, the way a game would.
//
// The 2D mask is a free conservative bound: outside it there is nothing to
// hit, so the march never starts.
float map3(vec3 q, float tension, float thick){
  float d = 1e5;
  for (int i = 0; i < uCount; i++) {
    float f = uF[i];
    if (f < .005) continue;
    vec2 c = uP[i].xy;
    vec2 h = uP[i].zw * f;
    float rmax = max(max(uR[i].x, uR[i].y), max(uR[i].z, uR[i].w));
    // The footprint is the element's, exactly as plasma's is. Mercury is not
    // a blob that swallows the layout — it is a panel, poured. Tension belongs
    // to the edge and to the merge, not to the shape: pulling the whole
    // footprint toward a disc threw the panel away and left content floating
    // over nothing.
    float d2 = sdBoxG(q.xy - c, h, min(uR[i], vec4(min(h.x, h.y))), rmax).x;
    // Extrude, with the rim rolled over so the slab has a shoulder rather than
    // a cut edge. Tension fattens that roll — where a bead of mercury reads as
    // poured is its edge, not its outline.
    float roll = thick * (.22 + .50 * tension);
    vec2 w = vec2(d2 + roll, abs(q.z) - (thick - roll));
    float de = min(max(w.x, w.y), 0.) + length(max(w, 0.)) - roll;
    d = (i == 0) ? de : smin(d, de, uGoo * (.6 + 1.8 * tension));
  }
  // Two slow swells across the whole body, displacing the surface itself
  // rather than tilting a normal — the march finds a moving surface, so the
  // reflection travels over real waves. This is what separates water from a
  // picture of water.
  // Displacing a distance field costs it the property the march depends on:
  // d is no longer a safe distance, so a full step overshoots the surface and
  // the ray lands inside, which is the mottled crust this produced at first.
  // The amplitude is kept small and the march below steps at a fraction, which
  // is the standard price of displacement.
  if (tension > .01) {
    float wv = (fbm(q.xy * .0075 + vec2(uTime * .11, uTime * .06)) - .5) * 1.6
             + (fbm(q.xy * .019 - vec2(uTime * .08, uTime * .13)) - .5) * .6;
    d -= wv * thick * .07 * tension;
  }
  return d;
}

/**
 * A crystalline crown: the panel's face is a regular triangular lattice, and
 * every triangle is a flat facet with its own plane.
 *
 * Regular, not random — a Delaunay scatter reads as shattered safety glass,
 * and a lattice reads as something cut. The heights at the lattice corners are
 * hashed, so the facets tilt differently while the pattern stays symmetric.
 *
 * The normal comes out exact rather than differenced, which is what makes the
 * faces crisp: a facet is a plane, so its normal is constant across it, and
 * there is nothing for a march to stipple.
 */
vec3 facetPlane(vec2 uv, float amp, out float height){
  vec2 c = floor(uv), f = fract(uv);
  float h00 = hash(c) * amp;
  float h10 = hash(c + vec2(1., 0.)) * amp;
  float h01 = hash(c + vec2(0., 1.)) * amp;
  float h11 = hash(c + vec2(1., 1.)) * amp;
  float dx, dy;
  // Which way the cell's diagonal runs is decided per cell. One diagonal
  // everywhere reads as corduroy; alternating reads as cut.
  bool flip = hash(c + 91.7) > .5;
  bool lower = flip ? (f.x + f.y < 1.) : (f.x > f.y);
  if (lower) {
    height = h00 + (h10 - h00) * f.x + (h01 - h00) * f.y;
    dx = h10 - h00; dy = h01 - h00;
  } else {
    height = h11 + (h01 - h11) * (1. - f.x) + (h10 - h11) * (1. - f.y);
    dx = h11 - h01; dy = h11 - h10;
  }
  return normalize(vec3(-dx, -dy, 1.));
}

/**
 * The crystal's top surface, as a height in page px, plus the exact plane
 * normal of whichever facet the point lies on. This is a real surface: the
 * march below has to find where the ray crosses it, so the facets occlude one
 * another, break the silhouette, and shadow each other. A normal returned
 * without an intersection would be a normal map, which is what the version
 * before this was.
 */
float crownZ(vec2 xy, float gcut, float amp, float thick, out vec3 nrm){
  float h;
  nrm = facetPlane(xy / gcut, amp / gcut, h);
  return thick + h * gcut;
}

// ── The gem ───────────────────────────────────────────────────────────────
// Facet directions, spread over a hemisphere and mirrored, standing in for a
// cut stone's crown and pavilion. Generated rather than tabulated so the count
// is a constant to change, not a table to rewrite.
vec3 facetN(int i){
  float fi = float(i);
  float a = fi * 2.3999632;                       // golden angle, so they do not band
  float z = mix(.22, .92, fract(fi * .6180339));
  float r = sqrt(max(0., 1. - z * z));
  return normalize(vec3(cos(a) * r, sin(a) * r, z));
}

/**
 * The panel as a piece of gem. The slab is the element's own footprint,
 * extruded; the facets are half-spaces cut through it.
 *
 * The cuts are anchored in PAGE space, not the panel's, which is the whole
 * trick: a facet plane runs on across the gap and slices the next panel too,
 * so the panels read as pieces carved out of one stone rather than as
 * separate gems that happen to match.
 */
float mapGem(vec3 q, float thick, float cut){
  float d = 1e5;
  for (int i = 0; i < uCount; i++) {
    float f = uF[i];
    if (f < .005) continue;
    vec2 c = uP[i].xy;
    vec2 h = uP[i].zw * f;
    float rmax = max(max(uR[i].x, uR[i].y), max(uR[i].z, uR[i].w));
    float d2 = sdBoxG(q.xy - c, h, min(uR[i], vec4(min(h.x, h.y))), rmax).x;
    vec2 w = vec2(d2, abs(q.z) - thick);
    float de = min(max(w.x, w.y), 0.) + length(max(w, 0.)) - 1.5;
    d = (i == 0) ? de : min(d, de);
  }
  // Cut the stone. Each plane repeats on a lattice so the whole page is one
  // crystal the panels are taken out of. Six directions, and the lattice is
  // wide — a few facets across a panel, not hundreds. Cut it finely and a gem
  // stops being a gem and becomes gravel, which is exactly what nine planes at
  // 34px produced on the first try.
  for (int i = 0; i < 6; i++) {
    vec3 nn = facetN(i);
    if (fract(float(i) * .5) > .25) nn.z = -nn.z;   // mirror half of them below
    // The plane sits near the far end of its lattice cell, so a cut trims a
    // corner instead of slicing the body in half. Six planes at 70% of the
    // cell removed most of the volume and left the panels as floating shards.
    // A gem is faceted, not shattered.
    float hgt = dot(q, nn);
    float plane = floor(hgt / cut) * cut + cut * .965;
    d = max(d, hgt - plane);
  }
  return d;
}

vec3 gemNormal(vec3 q, float thick, float cut){
  vec2 e = vec2(.4, 0.);
  return normalize(vec3(
    mapGem(q + e.xyy, thick, cut) - mapGem(q - e.xyy, thick, cut),
    mapGem(q + e.yxy, thick, cut) - mapGem(q - e.yxy, thick, cut),
    mapGem(q + e.yyx, thick, cut) - mapGem(q - e.yyx, thick, cut)
  ));
}

vec3 normal3(vec3 q, float tension, float thick){
  vec2 e = vec2(.75, 0.);
  return normalize(vec3(
    map3(q + e.xyy, tension, thick) - map3(q - e.xyy, tension, thick),
    map3(q + e.yxy, tension, thick) - map3(q - e.yxy, tension, thick),
    map3(q + e.yyx, tension, thick) - map3(q - e.yyx, tension, thick)
  ));
}

// Worley/Voronoi: nearest cell, second nearest, and the cell's id. The gap
// between the two is the distance to a cell wall, which is what draws the
// seams of a crystal without any geometry.
vec4 voronoi(vec2 q){
  vec2 ip = floor(q), fp = fract(q);
  float d1 = 8., d2 = 8.;
  vec2 id = vec2(0.);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 cell = ip + g;
      vec2 o = vec2(hash(cell), hash(cell + 31.7));
      vec2 r = g + o - fp;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; id = cell; }
      else if (d < d2) { d2 = d; }
    }
  }
  return vec4(sqrt(d1), sqrt(d2), id);
}

// B-spline bicubic from four bilinear taps keeps curved outlines round.
float S(vec2 uv){
  vec2 ts = vec2(textureSize(uS, 0));
  vec2 st = uv*ts - .5;
  vec2 i = floor(st), f = st - i;
  vec2 f2 = f*f, f3 = f2*f;
  vec2 w0 = (1. - 3.*f + 3.*f2 - f3)/6.;
  vec2 w1 = (4. - 6.*f2 + 3.*f3)/6.;
  vec2 w2 = (1. + 3.*f + 3.*f2 - 3.*f3)/6.;
  vec2 w3 = f3/6.;
  vec2 g0 = w0 + w1, g1 = w2 + w3;
  vec2 h0 = (w1/g0 - 1. + i + .5)/ts;
  vec2 h1 = (w3/g1 + 1. + i + .5)/ts;
  return g0.y*(g0.x*texture(uS, vec2(h0.x,h0.y)).r + g1.x*texture(uS, vec2(h1.x,h0.y)).r)
       + g1.y*(g0.x*texture(uS, vec2(h0.x,h1.y)).r + g1.x*texture(uS, vec2(h1.x,h1.y)).r);
}

void main(){
  vec2 p = fragPos();
  vec2 uv = gl_FragCoord.xy / (uRes*uScale);
  vec2 tx = 1. / vec2(textureSize(uS, 0));
  float cssPerTexel = uRes.x / float(textureSize(uS, 0).x);

  float s = S(uv);
  vec2 gs = vec2(S(uv+vec2(tx.x,0.)) - S(uv-vec2(tx.x,0.)), S(uv+vec2(0.,tx.y)) - S(uv-vec2(0.,tx.y))) / (2.*cssPerTexel);
  float sd = clamp((s - .5) / max(length(gs), 1e-3), -60., 60.);
  if (uEdge > .01) {
    // Two octaves: the first gives the large shape (billows, chips), the
    // second the fine break-up. Warping keeps it from reading as a sine wave
    // stamped around the outline.
    vec2 ep = warp(p * uEdgeScale, .7);
    float e1 = fbm(ep) - .5;
    float e2 = fbm(ep * 3.3 + 17.) - .5;
    float disp = e1 * 1.5 + e2 * .55;
    // uEdgeSharp 0 leaves it rolling; 1 pushes it toward flats and points,
    // which is what reads as chipped rather than melted.
    disp = mix(disp, sign(disp) * pow(abs(disp) * 2., .55) * .5, clamp(uEdgeSharp, 0., 1.));
    sd += disp * uEdge;
  }

  vec3 back = texture(uBg, uv).rgb;
  float grain = 1.;
  float cover = 0.;

  // shadow: offset and strength follow the surface's elevation
  float msk = max(texture(uS, uv).r, 1e-3);
  float elHere = clamp(texture(uFrost, uv).g / msk, 0., 1.);
  float elCast = clamp(texture(uFrost, uv - vec2(0., 20. / uRes.y)).g / max(texture(uS, uv - vec2(0., 20. / uRes.y)).r, 1e-3), 0., 1.);
  float el = max(elHere, elCast);
  float hs = H(uv + vec2(0., (4. + el * 28.) / uRes.y));
  float shStr = .5 * smoothstep(0., .12, el) * clamp(el + .35, 0., 1.);
  vec3 col = back * (1. - shStr*smoothstep(.02, .55, hs)*(1.-uLight*.6));
  float hHere = H(uv);
  // Palette phases run on viewport position, like the grain: a frame drawn for
  // a taller region must colour its viewport band exactly as the live frame does.
  vec2 vp = p - uView.xy;
  col += pal(uTime*.03 + vp.x/1400.) * .06 * smoothstep(.0, .45, hHere) * (1.+uEnergy) * uGlow;

  if(sd > -2.){
    vec2 th = 2. / vec2(textureSize(uH, 0));
    vec2 g = vec2(H(uv+vec2(th.x,0.)) - H(uv-vec2(th.x,0.)), H(uv+vec2(0.,th.y)) - H(uv-vec2(0.,th.y)));
    g.y = -g.y;
    float slope = clamp(length(g) / .16, 0., 1.);
    vec2 n = -g / (length(g) + 1e-4);
    float bevel = 1. - smoothstep(.42, .97, hHere);
    float depth = 1. - bevel;
    float lift = sqrt(1. - bevel*bevel);

    vec2 off = -n * pow(bevel, 2.2) * 50. * slope * uRefract;
    float disp = (.16 + uEnergy*.1) * uDisp;
    float fr = clamp(texture(uFrost, uv).r / msk, 0., 1.);
    vec3 refr = vec3(
      seen(p + off*(1.+disp), fr).r,
      seen(p + off, fr).g,
      seen(p + off*(1.-disp), fr).b
    );
    // uWash 0 hands the background through untouched - glass with no cast of
    // its own. 1 is the original desaturate-and-lift that gives the material
    // its body.
    vec3 clearRefr = refr;
    refr = mix(refr, vec3(dot(refr, vec3(.333))), .18) * mix(1.08, .9, uLight) + .03*(1.-uLight);
    refr = mix(clearRefr, refr, uWash);
    // frosted: milkier and a little brighter
    refr = mix(refr, mix(refr, vec3(dot(refr, vec3(.333))), .25) * mix(1.12, .97, uLight) + mix(.05, .03, uLight), fr);
    float hl = 1. - .55*uLight;

    // tint: un-premultiply by the equally blurred silhouette
    vec4 tn = texture(uTint, uv);
    vec3 tcol = clamp(tn.rgb / msk, 0., 1.);
    float talpha = clamp(tn.a / msk, 0., 1.);
    // a little of the background shows through partial tints; full opacity is a flat color
    refr = mix(refr, tcol * mix(1., .92, uLight) + refr * .08 * (1. - talpha), talpha);

    vec2 L = normalize(uMouse - p + vec2(0., -200.));
    float spec = pow(max(dot(n, L), 0.), 26.) * pow(bevel, 2.) * slope;
    float fres = pow(bevel, 5. / max(uRimWidth, .05)) * slope;
    // rim color: 0 iridescent, 1 solid color, 2 each surface's tint
    vec3 rimCol = pal(dot(n, L)*.35*slope + depth*.8 + uTime*.04 + uEnergy*.3);
    float facing = .75 + .5 * max(dot(n, L), 0.) * slope;
    if (uRimMode > .5 && uRimMode < 1.5) rimCol = uRimColor * facing * 1.4;
    else if (uRimMode > 1.5) rimCol = tcol * facing * 1.4;

    // A 3D normal from the 2D height gradient: flat in the middle, turning
    // outward and down across the bevel. Every material shades from this, and
    // the opaque ones perturb it further with their own detail.
    vec3 Nb = normalize(vec3(n * (.30 + .70 * bevel), max(.20, 1. - bevel)));
    vec3 Ldir = normalize(uLightDir);
    vec3 V = vec3(0., 0., 1.);            // orthographic view, straight on
    vec3 plasma = refr;
    float a = smoothstep(-.8, .8, sd);

    if (uMat < .5) {
      // ── plasma ────────────────────────────────────────────────────────
      plasma += rimCol * fres * .45 * hl * uRim;
      plasma += vec3(1.) * spec * .75 * hl * uSpec;
      // faint shimmer across the body; fades out as the tint becomes opaque
      plasma += pal(uTime*.04*uShimSp + vp.y/900. + uEnergy*.3) * .05 * lift * (1.+uEnergy*2.) * hl * (1. - talpha) * uShim;
      vec3 hairCol = uRimMode > .5 ? mix(vec3(1.), rimCol / 1.4, .6) : vec3(.9,.95,1.);
      plasma += hairCol * (1.-smoothstep(0., 1.6, abs(sd - .7))) * .4 * hl * uHair;
    } else if (uMat < 1.5) {
      // ── crystal ───────────────────────────────────────────────────────
      // Actual 3D. The panel is a solid whose top is a cut crown — a lattice
      // of flat facets, anchored in PAGE space so a facet runs on across the
      // gap into the next panel. The view ray is marched until it crosses that
      // surface, so the facets genuinely occlude each other, break the
      // silhouette where they rise and fall, and shadow one another.
      //
      // A height field is marched by stepping and testing which side of the
      // surface you are on, then bisecting — not by sphere tracing, which a
      // piecewise-planar field is hostile to.
      float gcut = max(uThick * 2.4, 52.);
      float amp = gcut * .45;
      float gthick = max(uThick, 10.);

      vec3 gro = vec3(p, gthick + amp * 1.6 + 4.);
      vec3 grd = normalize(vec3((p - uMouse) * .00055, -1.));

      float tPrev = 0., tHit = -1.;
      vec3 nHit = vec3(0., 0., 1.);
      float stepLen = max(amp * .16, 1.2);
      for (int i = 0; i < 64; i++) {
        float t = float(i) * stepLen;
        vec3 q = gro + grd * t;
        // Outside the panel's footprint there is no stone to hit.
        if (scene(q.xy) > 0.) { tPrev = t; continue; }
        vec3 nn;
        float sz = crownZ(q.xy, gcut, amp, gthick, nn);
        if (q.z <= sz) {
          // Crossed it. Bisect for the exact facet plane.
          float lo = tPrev, hi = t;
          for (int k = 0; k < 6; k++) {
            float mid = (lo + hi) * .5;
            vec3 qm = gro + grd * mid;
            vec3 nm;
            float szm = crownZ(qm.xy, gcut, amp, gthick, nm);
            if (qm.z <= szm) { hi = mid; nHit = nm; } else { lo = mid; }
          }
          tHit = hi;
          break;
        }
        tPrev = t;
      }

      if (tHit < 0.) {
        a = 0.;                       // the ray passed over the stone
      } else {
        vec3 q0 = gro + grd * tHit;
        vec3 Nf = nHit;
        float ndv = max(dot(Nf, -grd), 1e-3);
        float ndl = max(dot(Nf, Ldir), 0.);
        vec3 H = normalize(Ldir - grd);

        // Shadow: march back toward the light across the crown. This is the
        // thing a normal map can never do — one facet standing in another's
        // light.
        float shade = 1.;
        for (int i = 1; i <= 10; i++) {
          vec3 qs = q0 + Ldir * (float(i) * amp * .30);
          vec3 nn;
          float sz = crownZ(qs.xy, gcut, amp, gthick, nn);
          if (qs.z < sz - .5 && scene(qs.xy) < 0.) { shade = .25; break; }
        }

        // Through the stone: refract in, cross the body, refract out at the
        // underside.
        float ior = 1.85;
        vec3 rin = refract(grd, Nf, 1. / ior);
        vec3 nn2;
        float h2;
        vec3 Nb2 = facetPlane((q0.xy + rin.xy * gthick * 2.) / gcut + 23.7, amp / gcut, h2);
        vec3 rout = refract(rin, -Nb2, ior);
        if (dot(rout, rout) < 1e-6) rout = reflect(rin, -Nb2);

        float disp = .06 * max(uDisp, .001) * 6.;
        vec2 off2 = rout.xy * gthick * 4.;
        vec3 thru = toLinear(vec3(
          seen(p + off2 * (1. + disp), fr).r,
          seen(p + off2, fr).g,
          seen(p + off2 * (1. - disp), fr).b
        ));

        vec3 body = toLinear(mix(vec3(.62, .48, .92), tcol, talpha));
        vec3 lit = body * (.10 + 1.15 * ndl * shade);
        lit += thru * body * 1.2 * (.25 + .75 * ndv);

        vec3 F0 = vec3(.13);
        float fres = pow(1. - ndv, 4.);
        lit = mix(lit, envmap(reflect(grd, Nf), .02), F0.x + (1. - F0.x) * fres * .9);

        float aa = .018 * .018;
        lit += F_Schlick(F0, max(dot(H, -grd), 0.))
             * D_GGX(max(dot(Nf, H), 0.), aa) * V_SmithGGX(ndv, ndl, aa) * ndl * 26. * uSpec * shade;
        plasma = toSrgb(tonemap(lit));
        a = 1.;
      }
    } else if (uMat < 3.5) {
      bool merc = uMat > 2.5;
      if (merc) {
        // ── mercury ─────────────────────────────────────────────────────
        // Marched, not painted. The ray enters the slab, and every normal
        // below comes from the solid's own gradient — which is what makes a
        // bead read as a bead instead of a rectangle with a chrome gradient
        // on it. Surface tension does the rest: the footprint rounds toward a
        // disc, and two panels within reach pull into one body with a neck.
        float thick = max(uThick, 8.);
        float tension = clamp(uTension, 0., 1.);
        vec3 ro = vec3(p, thick * 3.5);
        vec3 rd = normalize(vec3((p - uMouse) * .00035, -1.));   // a hair of perspective
        float t = 0., hit = -1.;
        for (int i = 0; i < 96; i++) {
          vec3 q = ro + rd * t;
          float dd = map3(q, tension, thick);
          if (dd < .35) { hit = t; break; }
          t += max(dd * .30, .25);
          if (t > thick * 8.) break;
        }
        if (hit < 0.) {
          a = 0.;                       // the march missed: leave the ground
        } else {
          vec3 q = ro + rd * hit;
          vec3 Nm = normal3(q, tension, thick);
          float ndv = max(dot(Nm, -rd), 1e-3);
          float ndl = max(dot(Nm, Ldir), 0.);
          vec3 H = normalize(Ldir - rd);
          vec3 R = reflect(rd, Nm);

          float rough = .04;
          // A real reflection off a real normal, of the studio and of what is
          // actually behind the bead.
          vec2 roff = R.xy * 210.;
          vec3 env = mix(envmap(R, rough), toLinear(seen(p - roff, rough)), .30);
          vec3 F0 = mix(vec3(.86, .87, .90), toLinear(tcol), talpha);
          vec3 Fr = F_Schlick(F0, ndv);
          float aa = max(rough * rough, 1e-4);
          vec3 sun = F_Schlick(F0, max(dot(H, -rd), 0.))
                   * D_GGX(max(dot(Nm, H), 0.), aa)
                   * V_SmithGGX(ndv, ndl, aa) * ndl;
          vec3 me = env * Fr + sun * 16. * uSpec;
          me += F0 * .03;
          // Shimmer comes from the modelled swell moving under a sharp
          // highlight, not from a noise field tinting the surface. The only
          // colour added is thin-film interference, which is a function of the
          // angle the geometry presents — no texture in it.
          me += toLinear(pal(pow(1. - ndv, 1.6) * 1.4)) * .12 * uShim * pow(1. - ndv, .9);
          plasma = toSrgb(tonemap(me));
          // The silhouette is the march's, so a bead that has pulled away from
          // the rectangle actually looks pulled away.
          a = 1.;
        }
      } else {
        // ── metal ───────────────────────────────────────────────────────
        // Milled, not poured: flat stock with a cut edge. Still the screen
        // space path, which is honest for a flat sheet.
        float rough = clamp(uRough, .04, .95);
        vec3 Nm = Nb;
        float aniso = uAniso;
        if (aniso > .01) {
          float brush = fbm(vec2(p.x * .9, p.y * 22.)) - .5;
          Nm = normalize(Nm + vec3(0., brush * aniso * .55, 0.));
        }
        float mr = fbm(p * .035) - .5;
        Nm = normalize(Nm + vec3(mr * .16, (fbm(p * .035 + 11.) - .5) * .16, 0.));
        float ndv = max(dot(Nm, V), 1e-3);
        float ndl = max(dot(Nm, Ldir), 0.);
        vec3 H = normalize(Ldir + V);
        vec3 R = reflect(-V, Nm);
        vec2 roff = R.xy * pow(bevel, .9) * 150. * (1. - rough * .5);
        vec3 env = mix(envmap(R, rough), toLinear(seen(p - roff, rough)), .22);
        vec3 F0 = mix(vec3(.95, .93, .88), toLinear(tcol), talpha);
        vec3 Fr = F_Schlick(F0, ndv);
        float aa = max(rough * rough, 1e-3);
        float D = aniso > .01
          ? D_GGXaniso(max(dot(Nm, H), 0.), dot(vec3(1.,0.,0.), H), dot(vec3(0.,1.,0.), H), aa * (1. + aniso * 3.), aa)
          : D_GGX(max(dot(Nm, H), 0.), aa);
        vec3 sun = F_Schlick(F0, max(dot(H, V), 0.)) * D * V_SmithGGX(ndv, ndl, aa) * ndl;
        vec3 me = env * Fr + sun * 14. * uSpec;
        me += F0 * .035;
        plasma = toSrgb(tonemap(me));
      }
    } else if (uMat < 4.5) {
      // ── wood ──────────────────────────────────────────────────────────
      // Grain lives in page coordinates, so a panel that resizes keeps its
      // grain instead of stretching it — the first thing an opaque natural
      // material asks for that glass never did.
      vec2 wp = p * .0021;
      // Rings are warped, then squeezed across one axis: straight fbm reads as
      // camouflage, warped fbm reads as a board cut from a trunk.
      vec2 wq = warp(vec2(wp.x * .40, wp.y * 4.2), .55);
      float ring = fract(fbm(wq) * 2.05);
      float band = abs(ring - .5) * 2.;
      float pore = fbm(vec2(p.x * .18, p.y * .022));
      float h0 = band * .7 + pore * .3;
      // Detail normal by finite difference of that height, so the grain
      // actually catches the light instead of being painted on.
      vec2 e = vec2(1.4, 0.);
      float hx = fract(fbm(warp(vec2((wp.x + e.x*.0021) * .40, wp.y * 4.2), .55)) * 2.05);
      float hy = fract(fbm(warp(vec2(wp.x * .40, (wp.y + e.x*.0021) * 4.2), .55)) * 2.05);
      hx = abs(hx - .5) * 2.; hy = abs(hy - .5) * 2.;
      vec3 Nw = normalize(Nb + vec3((hx - band) * .85, (hy - band) * .85, 0.));

      // Real boards are lower contrast than the first instinct: a wide dark-to
      // -light sweep reads as charring, not as timber.
      vec3 lightWood = toLinear(vec3(.62, .45, .28));
      vec3 darkWood  = toLinear(vec3(.40, .26, .145));
      // A board is mostly one tone with the grain reading as a whisper over it.
      vec3 alb = mix(darkWood, lightWood, smoothstep(.30, .70, band) * .55 + .22);
      alb *= .95 + .09 * pore;
      alb = mix(alb, toLinear(tcol), talpha * .6);

      float ndv = max(dot(Nw, V), 1e-3);
      float ndl = max(dot(Nw, Ldir), 0.);
      vec3 H = normalize(Ldir + V);
      // Anisotropic along the grain: a varnished board's highlight is a streak.
      float aa = .34 * .34;
      float D = D_GGXaniso(max(dot(Nw, H), 0.), dot(vec3(1.,0.,0.), H), dot(vec3(0.,1.,0.), H), aa * 4., aa);
      vec3 F = F_Schlick(vec3(.045), max(dot(H, V), 0.));
      vec3 wo = alb * (.16 + .95 * ndl);
      wo += F * D * V_SmithGGX(ndv, ndl, aa) * ndl * 5.5 * uSpec;
      wo += alb * pow(1. - ndv, 3.5) * .35;
      plasma = toSrgb(tonemap(wo));
    } else if (uMat < 5.5) {
      // ── stone ─────────────────────────────────────────────────────────
      vec2 sq = warp(p * .022, .9);
      float body = fbm(sq) * .62 + fbm(sq * 3.7) * .26 + fbm(sq * 11.) * .12;
      float fleck = hash(floor(p * 2.2));
      float vein = smoothstep(.52, .58, fbm(sq * .55 + 7.1));
      float h0 = body + (fleck - .5) * .35;
      float hx = fbm(warp((p + vec2(1.6, 0.)) * .022, .9)) + (hash(floor((p + vec2(1.6,0.)) * 2.2)) - .5) * .35;
      float hy = fbm(warp((p + vec2(0., 1.6)) * .022, .9)) + (hash(floor((p + vec2(0.,1.6)) * 2.2)) - .5) * .35;
      vec3 Ns = normalize(Nb + vec3((hx - h0) * 3.4, (hy - h0) * 3.4, 0.));

      vec3 alb = mix(toLinear(vec3(.24, .235, .25)), toLinear(vec3(.55, .545, .55)), body);
      alb = mix(alb, toLinear(vec3(.70, .69, .67)), vein * .5);
      alb *= .92 + (fleck - .5) * .18;
      alb = mix(alb, toLinear(tcol), talpha * .6);

      float ndv = max(dot(Ns, V), 1e-3);
      float ndl = max(dot(Ns, Ldir), 0.);
      vec3 H = normalize(Ldir + V);
      float aa = .72 * .72;                             // stone is rough
      vec3 F = F_Schlick(vec3(.035), max(dot(H, V), 0.));
      vec3 st = alb * (.20 + .95 * ndl);
      st += F * D_GGX(max(dot(Ns, H), 0.), aa) * V_SmithGGX(ndv, ndl, aa) * ndl * 3.2 * uSpec;
      st += alb * pow(1. - ndv, 4.) * .25;              // dusty edge
      plasma = toSrgb(tonemap(st));
    } else {
      // ── cloud ─────────────────────────────────────────────────────────
      // The one volume. The SDF is the boundary, density is noise inside it,
      // and the light is marched rather than dotted: transmittance by
      // Beer-Lambert, scattering by Henyey-Greenstein. A lambert cloud looks
      // painted; a marched one looks lit from a direction.
      // Bounded tight to the silhouette, which the edge displacement has
      // already made billowy — the panel's outline is the cloud's outline. The
      // interior is dense, so it reads as a thing made of cloud rather than as
      // haze lying over a rectangle.
      float inside = smoothstep(-1., 9., sd);
      vec2 dq = warp(p * .0058 + vec2(uTime * .010, uTime * .004), 1.15);
      float base = fbm(dq) * .58 + fbm(dq * 2.7) * .28 + fbm(dq * 6.9) * .14;
      float dens = clamp(inside * (.55 + base * 1.15) - .12, 0., 1.);

      // March toward the light and accumulate what it has to pass through.
      float shadow = 0.;
      vec2 step2 = normalize(Ldir.xy + vec2(1e-4)) * 16.;
      for (int i = 1; i <= 5; i++) {
        vec2 sp3 = p + step2 * float(i);
        float ins = smoothstep(-1., 9., sd + float(i) * 5.);
        vec2 q3 = warp(sp3 * .0058 + vec2(uTime * .010, uTime * .004), 1.15);
        shadow += clamp(ins * (.55 + fbm(q3) * 1.15) - .12, 0., 1.);
      }
      float transmit = exp(-shadow * .55);
      float cosT = dot(normalize(vec3(n, .6)), Ldir);
      float g = .45;
      float hg = (1. - g*g) / pow(1. + g*g - 2.*g*cosT, 1.5) * .0796;
      vec3 sunCol = toLinear(vec3(1., .96, .89));
      vec3 skyCol = toLinear(vec3(.42, .50, .64));
      vec3 cl = skyCol * (.35 + .65 * dens) + sunCol * transmit * (.55 + 5.5 * hg);
      cl = mix(cl, toLinear(tcol), talpha * .45);
      plasma = toSrgb(tonemap(cl));
      a = smoothstep(.04, .42, dens);   // density is the coverage, not the outline
    }

    col = mix(col, plasma, a);
    grain = 1. - a;   // grain is background-only; panels stay clean
    cover = a;
  }
  if (uClear > .5) {
    // Outside a surface only its shadow lands on the page: black at the
    // shadow's darkness. Inside, the surface itself. The edge blends the two
    // by coverage, un-premultiplied for a non-premultiplied canvas.
    float shade = clamp(shStr * smoothstep(.02, .55, hs) * (1. - uLight*.6), 0., 1.);
    float alpha = max(cover, shade);
    o = vec4(col * (cover / max(alpha, 1e-4)), alpha);
    return;
  }
  // Keyed on viewport position, so a frame drawn for a taller region has the
  // same grain in its viewport band as the live frame that replaces it.
  col += (hash(p - uView.xy + uTime) - .5) * .025 * grain * uGrain;
  o = vec4(col, 1.);
}`;

  return { maskFrag, tintFrag, blurFrag, bgFrag, compFrag };
}
