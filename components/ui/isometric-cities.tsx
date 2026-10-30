"use client";

import { ComponentStyles } from "./component-styles";

import {
  createContext,
  memo,
  useContext,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

export type IsometricCitiesSceneId =
  | "tower"
  | "apartments"
  | "lighthouse"
  | "harbor"
  | "metro"
  | "grid"
  | "intersection"
  | "airport"
  | "observatory"
  | "diner";
export type IsometricCitiesAccent = "sodium" | "tungsten" | "neon" | "signal" | "dusk" | "moon";
export type IsometricCitiesTheme = "dark" | "light";

export interface IsometricCitiesProps {
  /** Figure shown first. A matching URL hash wins while `syncHash` is on. */
  initialScene?: IsometricCitiesSceneId;
  initialAccent?: IsometricCitiesAccent;
  initialTheme?: IsometricCitiesTheme;
  /** Mirror the open figure in the URL hash (`#airport`) and follow hash changes. */
  syncHash?: boolean;
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Isometric toolkit                                                   */
/* x runs down-right, y down-left, z up; one world unit is one SVG unit */
/* ------------------------------------------------------------------ */

const COS = 0.8660254;
const SIN = 0.5;
/** A horizontal circle of radius r projects to an ellipse r·RX by r·RY. */
const RX = Math.SQRT2 * COS;
const RY = Math.SQRT2 * SIN;

type Vec = readonly [number, number, number];
type Flat = readonly [number, number];

const r2 = (n: number) => Math.round(n * 100) / 100;
const sx = (x: number, y: number) => (x - y) * COS;
const sy = (x: number, y: number, z = 0) => (x + y) * SIN - z;
const pt = (x: number, y: number, z = 0) => `${r2(sx(x, y))},${r2(sy(x, y, z))}`;
const poly = (points: readonly Vec[]) => points.map(([x, y, z]) => pt(x, y, z)).join(" ");
const flatPoly = (points: readonly Flat[], z = 0) => points.map(([x, y]) => pt(x, y, z)).join(" ");
const topQuad = (x0: number, y0: number, x1: number, y1: number, z: number) =>
  poly([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]);
/** Quad on a plane x = const, the right-hand face of a box. */
const xQuad = (x: number, y0: number, z0: number, y1: number, z1: number) =>
  poly([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]]);
/** Quad on a plane y = const, the left-hand face of a box. */
const yQuad = (y: number, x0: number, z0: number, x1: number, z1: number) =>
  poly([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]);
/** One path for many separate world-space segments. */
const segs = (pairs: readonly (readonly [Vec, Vec])[]) =>
  pairs.map(([a, b]) => `M${pt(a[0], a[1], a[2])}L${pt(b[0], b[1], b[2])}`).join("");
/** Translate the world point (x, y, z) to the SVG origin. */
const centerOn = (x: number, y: number, z = 0) => `translate(${r2(-sx(x, y))} ${r2(-sy(x, y, z))})`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Deterministic noise so patterns match on the server and the client. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

type Plane = "x" | "y" | "top" | "top-y";
const PLANE_MATRIX: Record<Plane, string> = {
  x: `${COS} ${-SIN} 0 1`,
  y: `${COS} ${SIN} 0 1`,
  top: `${COS} ${SIN} ${-COS} ${SIN}`,
  "top-y": `${COS} ${-SIN} ${COS} ${SIN}`,
};

/** Text lying on a face: `x` reads along −y, `y` along +x, `top` flat along +x, `top-y` flat along −y. */
function Label({
  at,
  plane = "y",
  size = 5,
  spacing = 0.8,
  anchor = "start",
  className = "",
  children,
}: {
  at: Vec;
  plane?: Plane;
  size?: number;
  spacing?: number;
  anchor?: "start" | "middle" | "end";
  className?: string;
  children: ReactNode;
}) {
  const [x, y, z] = at;
  return (
    <text
      className={`ic-label ${className}`}
      transform={`matrix(${PLANE_MATRIX[plane]} ${r2(sx(x, y))} ${r2(sy(x, y, z))})`}
      fontSize={size}
      letterSpacing={spacing}
      textAnchor={anchor}
    >
      {children}
    </text>
  );
}

type BoxProps = {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  className?: string;
  /** Extra classes for each face. */
  top?: string;
  left?: string;
  right?: string;
  children?: ReactNode;
};

/** An axis-aligned block: right face (x = x + w), left face (y = y + d), then the top. */
function Box({ x, y, z = 0, w, d, h, className, top = "", left = "", right = "", children }: BoxProps) {
  return (
    <g className={className}>
      <polygon className={`ic-face ${right}`} points={xQuad(x + w, y, z, y + d, z + h)} />
      <polygon className={`ic-face ${left}`} points={yQuad(y + d, x, z, x + w, z + h)} />
      <polygon className={`ic-face ic-top ${top}`} points={topQuad(x, y, x + w, y + d, z + h)} />
      {children}
    </g>
  );
}

function arc(cx: number, cy: number, r: number, from: number, to: number, steps = 6): Flat[] {
  const out: Flat[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

function roundedLoop(x0: number, y0: number, x1: number, y1: number, r: number): Flat[] {
  return [
    ...arc(x1 - r, y0 + r, r, -90, 0),
    ...arc(x1 - r, y1 - r, r, 0, 90),
    ...arc(x0 + r, y1 - r, r, 90, 180),
    ...arc(x0 + r, y0 + r, r, 180, 270),
  ];
}

/** The rounded base slab every figure stands on, with an inset groove and corner bolts. */
function Plate({
  x0,
  y0,
  x1,
  y1,
  z = 0,
  h = 9,
  r = 16,
  inset = 7,
  bolts = true,
  className = "",
  children,
}: {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  z?: number;
  h?: number;
  r?: number;
  inset?: number;
  bolts?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const near = [
    ...arc(x1 - r, y0 + r, r, -45, 0),
    ...arc(x1 - r, y1 - r, r, 0, 90),
    ...arc(x0 + r, y1 - r, r, 90, 135),
  ];
  const side: Vec[] = [
    ...near.map(([x, y]) => [x, y, z] as const),
    ...[...near].reverse().map(([x, y]) => [x, y, z - h] as const),
  ];
  const groove = roundedLoop(x0 + inset, y0 + inset, x1 - inset, y1 - inset, Math.max(2, r - inset * 0.6));
  const b = inset + 5;
  const boltPoints: Flat[] = [[x0 + b, y0 + b], [x1 - b, y0 + b], [x1 - b, y1 - b], [x0 + b, y1 - b]];
  return (
    <g className={className}>
      <polygon className="ic-face" points={poly(side)} />
      <polygon className="ic-face ic-top" points={flatPoly(roundedLoop(x0, y0, x1, y1, r), z)} />
      {inset > 0 && <polygon className="ic-dt" points={flatPoly(groove, z)} />}
      {bolts &&
        boltPoints.map(([x, y]) => (
          <ellipse key={`${x}-${y}`} className="ic-dt" cx={r2(sx(x, y))} cy={r2(sy(x, y, z))} rx={1.6 * RX} ry={1.6 * RY} />
        ))}
      {children}
    </g>
  );
}

/** A flat polygon lying at height z. */
function Flat({ points, z = 0, className = "ic-face ic-top" }: { points: readonly Flat[]; z?: number; className?: string }) {
  return <polygon className={className} points={flatPoly(points, z)} />;
}

const rect = (x0: number, y0: number, x1: number, y1: number): Flat[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/** A horizontal disc (ellipse on screen). */
function Disc({ x, y, z = 0, r, className = "ic-face ic-top" }: { x: number; y: number; z?: number; r: number; className?: string }) {
  return <ellipse className={className} cx={r2(sx(x, y))} cy={r2(sy(x, y, z))} rx={r2(r * RX)} ry={r2(r * RY)} />;
}

/** An upright cylinder. */
function Cyl({
  x,
  y,
  z = 0,
  h,
  r,
  className,
  side = "",
  top = "",
}: {
  x: number;
  y: number;
  z?: number;
  h: number;
  r: number;
  className?: string;
  side?: string;
  top?: string;
}) {
  const cx = r2(sx(x, y));
  const yb = r2(sy(x, y, z));
  const yt = r2(sy(x, y, z + h));
  const rx = r2(r * RX);
  const ry = r2(r * RY);
  return (
    <g className={className}>
      <path className={`ic-face ${side}`} d={`M${cx - rx},${yt}L${cx - rx},${yb}A${rx},${ry} 0 0 0 ${cx + rx},${yb}L${cx + rx},${yt}Z`} />
      <ellipse className={`ic-face ic-top ${top}`} cx={cx} cy={yt} rx={rx} ry={ry} />
    </g>
  );
}

/** Small square light on the ground or a face. */
function Lamp({ at, size = 1.4, on, className = "" }: { at: Vec; size?: number; on?: boolean; className?: string }) {
  const [x, y, z] = at;
  return (
    <polygon
      className={`ic-lamp ${on ? "is-on" : ""} ${className}`}
      points={topQuad(x - size, y - size, x + size, y + size, z)}
    />
  );
}

/** A clickable group that also answers Enter and Space. */
function Hit({
  label,
  onPress,
  className = "",
  children,
}: {
  label: string;
  onPress: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      className={`ic-hit ${className}`}
      onClick={onPress}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        onPress();
      }}
    >
      {children}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Scene plumbing                                                      */
/* ------------------------------------------------------------------ */

type SceneProps = {
  /** Run the animation loop. */
  live: boolean;
  /** Listen for this figure's keyboard shortcuts. */
  keys: boolean;
  reduced: boolean;
  /** Thumbnail mode: a still frame without controls. */
  still?: boolean;
};

type FrameMeta = { n: number; title: string; hint: string; still: boolean };
const FrameContext = createContext<FrameMeta>({ n: 1, title: "", hint: "", still: false });

const VIEWBOX = "-395 -296 790 592";

/** Caption, artwork and status rows of a figure. Thumbnails get the artwork alone. */
function Figure({ status, label, children }: { status: string; label: string; children: ReactNode }) {
  const meta = useContext(FrameContext);
  const art = (
    <svg className="ic-svg" viewBox={VIEWBOX} role="img" aria-label={label}>
      {children}
    </svg>
  );
  if (meta.still) return art;
  return (
    <>
      <div className="ic-cap">
        <span className="hi">Fig {meta.n}</span>
        <span>{meta.title}</span>
      </div>
      <div className="ic-art">
        <div className="ic-ambient" aria-hidden="true" />
        {art}
      </div>
      <div className="ic-cap ic-foot">
        <span>{meta.hint}</span>
        <span className="hi">{status}</span>
      </div>
    </>
  );
}

/** Calls `step(dt, t)` on every animation frame while `live`; dt is in seconds and capped. */
function useFrame(live: boolean, step: (dt: number, t: number) => void) {
  const onFrame = useEffectEvent(step);
  useEffect(() => {
    if (!live) return;
    let id = 0;
    let last = performance.now();
    const loop = (now: number) => {
      onFrame(Math.min((now - last) / 1000, 0.05), now / 1000);
      last = now;
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [live]);
}

const EDITABLE = "input, textarea, select, [contenteditable]:not([contenteditable='false'])";
const CONTROL = "button, a[href], [role='button'], [role='radio']";

/** Window shortcuts for the open figure. `handle` gets a lowercase key and returns true when it used it. */
function useSceneKeys(enabled: boolean, handle: (key: string) => boolean) {
  const onKey = useEffectEvent(handle);
  useEffect(() => {
    if (!enabled) return;
    const listener = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(EDITABLE)) return;
      if ((event.key === " " || event.key === "Enter") && target?.closest(CONTROL)) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (onKey(key)) event.preventDefault();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [enabled]);
}

const subscribeMotion = (callback: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const readMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const HASH_EVENT = "isometric-cities-hash";
const subscribeHash = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  window.addEventListener(HASH_EVENT, callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener(HASH_EVENT, callback);
  };
};
const readHash = () => window.location.hash;

/** A round street tree: base, trunk and a canopy ball. */
function Tree({ x, y, z = 0, r = 6, trunk = 9 }: { x: number; y: number; z?: number; r?: number; trunk?: number }) {
  const cx = r2(sx(x, y));
  return (
    <g>
      <Disc x={x} y={y} z={z} r={r * 0.55} className="ic-dt" />
      <path className="ic-ln" d={`M${cx},${r2(sy(x, y, z))}V${r2(sy(x, y, z + trunk))}`} />
      <circle className="ic-face ic-top" cx={cx} cy={r2(sy(x, y, z + trunk + r * 0.9))} r={r2(r * 1.05)} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Fig 1 · Office tower                                                */
/* ------------------------------------------------------------------ */

const FLOORS = 24;
const FLOOR_H = 9;
const LOBBY_H = 16;
const T0 = 60;
const T1 = 180;
const PANELS = 12;
/** Panel look per floor, face and bay: 0 lit, 1 bright, 2 dim, 3 dark desk. */
const TOWER_PATTERN = (() => {
  const random = seeded(240);
  return Array.from({ length: FLOORS }, () =>
    Array.from({ length: 2 }, () =>
      Array.from({ length: PANELS }, () => {
        const roll = random();
        return roll < 0.18 ? 1 : roll < 0.44 ? 2 : roll < 0.58 ? 3 : 0;
      }),
    ),
  );
})();
const PANEL_CLASS = ["", "hi", "dim", "off"] as const;
const TOWER_START = Array.from({ length: FLOORS }, (_, i) => i < 17 && i !== 8 && i !== 12);

const TowerFloor = memo(function TowerFloor({
  index,
  lit,
  cursor,
  delay,
  onPick,
}: {
  index: number;
  lit: boolean;
  cursor: boolean;
  delay: number;
  onPick: (index: number) => void;
}) {
  const z0 = LOBBY_H + index * FLOOR_H;
  const z1 = z0 + FLOOR_H;
  const zw = z0 + 2.4;
  const bay = (T1 - T0 - 3) / PANELS;
  const panels = Array.from({ length: PANELS }, (_, k) => {
    const a = T0 + 1.5 + k * bay + 0.5;
    return [a, a + bay - 1] as const;
  });
  const look = TOWER_PATTERN[index];
  return (
    <g
      className={`ic-floor ${lit ? "is-lit" : ""}`}
      style={{ "--d": `${delay}s` } as CSSProperties}
      onClick={() => onPick(index)}
    >
      <polygon className="ic-fhalo" points={xQuad(T1, T0, z0, T1, z1)} />
      <polygon className="ic-fhalo" points={yQuad(T1, T0, z0, T1, z1)} />
      <polygon className="ic-face ic-band" points={xQuad(T1, T0, z0, T1, zw)} />
      <polygon className="ic-face ic-band" points={yQuad(T1, T0, z0, T1, zw)} />
      <g className="ic-win">
        {panels.map(([a, b], k) => (
          <polygon key={`r${k}`} className={`ic-pn ${PANEL_CLASS[look[0][PANELS - 1 - k]]}`} points={xQuad(T1, a, zw + 0.4, b, z1 - 0.5)} />
        ))}
        {panels.map(([a, b], k) => (
          <polygon key={`l${k}`} className={`ic-pn ${PANEL_CLASS[look[1][k]]}`} points={yQuad(T1, a, zw + 0.4, b, z1 - 0.5)} />
        ))}
      </g>
      {cursor && (
        <path
          className="ic-cursor"
          d={`M${pt(T0, T1, z0)}L${pt(T1, T1, z0)}L${pt(T1, T0, z0)}M${pt(T0, T1, z1)}L${pt(T1, T1, z1)}L${pt(T1, T0, z1)}`}
        />
      )}
    </g>
  );
});

const TowerSite = memo(function TowerSite() {
  const paving: [Vec, Vec][] = [];
  for (let k = 20; k <= 220; k += 20) {
    paving.push([[k, 10, 0], [k, 230, 0]], [[10, k, 0], [230, k, 0]]);
  }
  const trees: Flat[] = [[26, 70], [26, 130], [26, 190], [70, 214], [130, 214], [190, 214], [214, 190], [214, 130], [214, 70]];
  const columns: [Vec, Vec][] = [];
  for (let k = 0; k <= 8; k += 1) {
    const a = 66 + k * 13.5;
    columns.push([[176, a, 0], [176, a, LOBBY_H]], [[a, 176, 0], [a, 176, LOBBY_H]]);
  }
  return (
    <g>
      <Plate x0={0} y0={0} x1={240} y1={240} />
      <path className="ic-dt ic-faint" d={segs(paving)} />
      <Flat className="ic-face ic-apron" points={rect(48, 48, 192, 192)} />
      <Label at={[30, 234, 0]} plane="top" size={5} spacing={1.2}>
        240 MERIDIAN · BLOCK 24
      </Label>
      {trees.slice(0, 3).map(([x, y]) => (
        <Tree key={`${x}-${y}`} x={x} y={y} />
      ))}
      {/* Lobby */}
      <polygon className="ic-halo is-on ic-halo-lobby" points={topQuad(60, 60, 196, 196, 0)} />
      <Box x={64} y={64} w={112} d={112} h={LOBBY_H} left="ic-glass is-on ic-fsoft" right="ic-glass is-on ic-fsoft" />
      <path className="ic-mull" d={segs(columns)} />
      <polygon className="ic-face ic-rc" points={yQuad(176, 108, 0, 132, 11)} />
      <Box x={T0} y={T0} z={LOBBY_H - 1} w={T1 - T0} d={T1 - T0} h={1} />
    </g>
  );
});

const TowerTop = memo(function TowerTop() {
  const mech: [Vec, Vec][] = [];
  for (let k = 1; k < 10; k += 1) {
    const a = 70 + k * 10;
    mech.push([[172, a, 232], [172, a, 250]], [[a, 172, 232], [a, 172, 250]]);
  }
  mech.push([[172, 68, 241], [172, 172, 241]], [[68, 172, 241], [172, 172, 241]]);
  const top = LOBBY_H + FLOORS * FLOOR_H;
  return (
    <g>
      <Box x={T0} y={T0} z={top} w={T1 - T0} d={T1 - T0} h={2} />
      <Box x={68} y={68} z={top + 2} w={104} d={104} h={18}>
        <path className="ic-dt" d={segs(mech)} />
        <Label at={[150, 172, 243.5]} size={5} spacing={1.6} anchor="middle">
          MERIDIAN
        </Label>
      </Box>
      <Box x={92} y={92} z={top + 20} w={56} d={56} h={8} />
      <Box x={100} y={136} z={top + 28} w={14} d={8} h={6} />
      <Box x={130} y={100} z={top + 28} w={10} d={10} h={4} />
      <path
        className="ic-ln"
        d={segs([
          [[120, 120, top + 28], [120, 120, top + 92]],
          [[114, 120, top + 60], [126, 120, top + 60]],
          [[120, 114, top + 72], [120, 126, top + 72]],
        ])}
      />
      <circle className="ic-beacon-halo" cx={0} cy={r2(sy(120, 120, top + 93))} r={7} />
      <circle className="ic-beacon ic-blink" cx={0} cy={r2(sy(120, 120, top + 93))} r={1.8} />
    </g>
  );
});

const TowerTrees = memo(function TowerTrees() {
  const trees: Flat[] = [[70, 214], [130, 214], [190, 214], [214, 190], [214, 130], [214, 70]];
  return (
    <g>
      {trees.map(([x, y]) => (
        <Tree key={`${x}-${y}`} x={x} y={y} />
      ))}
    </g>
  );
});

function TowerScene({ keys }: SceneProps) {
  const [floors, setFloors] = useState<boolean[]>(TOWER_START);
  const [cursor, setCursor] = useState(18);
  const [delays, setDelays] = useState<number[]>(() => Array.from({ length: FLOORS }, () => 0));

  const toggle = (index: number) => {
    setCursor(index);
    setDelays(Array.from({ length: FLOORS }, () => 0));
    setFloors((current) => current.map((lit, i) => (i === index ? !lit : lit)));
  };
  const nightShift = () => {
    const random = seeded(Math.floor(performance.now()));
    const next = Array.from({ length: FLOORS }, () => random() < 0.42);
    setDelays(Array.from({ length: FLOORS }, () => r2(random() * 0.9)));
    setFloors(next);
  };
  const allOff = () => {
    setDelays(Array.from({ length: FLOORS }, (_, i) => r2((FLOORS - i) * 0.035)));
    setFloors(Array.from({ length: FLOORS }, () => false));
  };

  useSceneKeys(keys, (key) => {
    if (key === "ArrowUp") setCursor((c) => Math.min(FLOORS - 1, c + 1));
    else if (key === "ArrowDown") setCursor((c) => Math.max(0, c - 1));
    else if (key === " " || key === "Enter") toggle(cursor);
    else if (key === "n") nightShift();
    else if (key === "o") allOff();
    else return false;
    return true;
  });

  const lit = floors.filter(Boolean).length;
  return (
    <Figure
      status={`${lit}/${FLOORS} floors lit · cursor ${cursor + 1}F`}
      label="Modernist office tower with 24 floors on a city block."
    >
      <g transform={`scale(1.2) ${centerOn(120, 120, 100)}`}>
        <TowerSite />
        <Box x={T0} y={T0} z={LOBBY_H} w={T1 - T0} d={T1 - T0} h={FLOORS * FLOOR_H} />
        {floors.map((on, index) => (
          <TowerFloor key={index} index={index} lit={on} cursor={index === cursor} delay={delays[index]} onPick={toggle} />
        ))}
        <TowerTop />
        <TowerTrees />
      </g>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Fig 2 · Apartment block                                             */
/* ------------------------------------------------------------------ */

const STOREYS = 7;
const STOREY_H = 23;
const A0 = 28;
const A1 = 206;
const AY0 = 40;
const AY1 = 124;
const ROOF = STOREYS * STOREY_H + 8;
const SHAFT = { x0: 206, x1: 232, y0: 96, y1: 122 } as const;
const CALL_X = (n: number) => 215 + (n - 1) * 5;
const APT_BAYS = Array.from({ length: 11 }, (_, k) => A0 + 7 + k * 16);
const APT_SIDE_BAYS = [AY0 + 6, AY0 + 20, AY0 + 34];
const BALCONY_X = [44, 140];

/** One street-level car: body, cabin glass and lights. */
function Car({
  x,
  y,
  along = "x",
  facing = 1,
  lit = true,
  taxi = false,
  size = 1,
  className = "",
}: {
  x: number;
  y: number;
  along?: "x" | "y";
  /** 1 drives toward +x/+y, −1 the other way. */
  facing?: 1 | -1;
  lit?: boolean;
  taxi?: boolean;
  /** Uniform scale around the car's back corner. */
  size?: number;
  className?: string;
}) {
  if (size !== 1) {
    const ax = r2(sx(x, y));
    const ay = r2(sy(x, y));
    return (
      <g transform={`translate(${ax} ${ay}) scale(${size}) translate(${-ax} ${-ay})`}>
        <Car x={x} y={y} along={along} facing={facing} lit={lit} taxi={taxi} className={className} />
      </g>
    );
  }
  const [w, d] = along === "x" ? [24, 11] : [11, 24];
  const [cx0, cy0, cw, cd] = along === "x" ? [x + 6, y + 1, 11, 9] : [x + 1, y + 6, 9, 11];
  const nose = facing === 1 ? (along === "x" ? x + w : y + d) : along === "x" ? x : y;
  const front: Vec[] = along === "x" ? [[nose, y + 2.5, 3], [nose, y + d - 2.5, 3]] : [[x + 2.5, nose, 3], [x + w - 2.5, nose, 3]];
  return (
    <g className={`ic-car ${className}`}>
      <polygon className="ic-shadow" points={topQuad(x - 1, y - 1, x + w + 1, y + d + 1, 0)} />
      <Box x={x} y={y} z={1.2} w={w} d={d} h={4.2} />
      <Box x={cx0} y={cy0} z={5.4} w={cw} d={cd} h={3.6} left="ic-glass" right="ic-glass" />
      {taxi && <Box x={cx0 + cw / 2 - 2} y={cy0 + cd / 2 - 1.5} z={9} w={4} d={3} h={1.6} left="ic-lit" right="ic-lit" top="ic-lit" className="ic-fsoft" />}
      {front.map(([fx, fy, fz]) => (
        <circle key={`${fx}-${fy}`} className={lit ? "ic-headlight" : "ic-lamp"} cx={r2(sx(fx, fy))} cy={r2(sy(fx, fy, fz))} r={1.1} />
      ))}
    </g>
  );
}

/** Street lamp: post, arm and a glowing head. */
function StreetLamp({ x, y, h = 26, on = true }: { x: number; y: number; h?: number; on?: boolean }) {
  return (
    <g>
      <path className="ic-ln" d={segs([[[x, y, 0], [x, y, h]], [[x, y, h], [x + 5, y, h]]])} />
      <circle className={`ic-streetlamp ${on ? "is-on" : ""}`} cx={r2(sx(x + 5, y))} cy={r2(sy(x + 5, y, h - 1))} r={1.8} />
    </g>
  );
}

const ApartmentStreet = memo(function ApartmentStreet() {
  const dashes: [Vec, Vec][] = [];
  for (let x = 16; x < 276; x += 16) dashes.push([[x, 216, 0], [x + 8, 216, 0]]);
  const paving: [Vec, Vec][] = [];
  for (let x = 20; x < 282; x += 13) paving.push([[x, 150, 0], [x, 192, 0]]);
  return (
    <g>
      <Plate x0={0} y0={0} x1={290} y1={250} />
      <Flat className="ic-face ic-asph" points={rect(8, 194, 282, 238)} />
      <path className="ic-mark-line ic-thin" d={segs(dashes)} />
      <path className="ic-dt" d={segs([[[8, 192, 0], [282, 192, 0]], [[8, 150, 0], [282, 150, 0]]])} />
      <path className="ic-dt ic-faint" d={segs(paving)} />
      <Label at={[18, 246, 0]} plane="top" size={5} spacing={1.2}>
        NO. 27 · ELM ROW
      </Label>
    </g>
  );
});

const APT_HOME_START = [true, true, false, false, false, false, false];

const ApartmentBlock = memo(function ApartmentBlock({ homes }: { homes: readonly boolean[] }) {
  return (
    <g>
      <Box x={A0} y={AY0} w={A1 - A0} d={AY1 - AY0} h={ROOF} />
      <path
        className="ic-dt"
        d={segs(
          Array.from({ length: STOREYS - 1 }, (_, i) => {
            const z = (i + 1) * STOREY_H;
            return [[A0, AY1, z], [A1, AY1, z]] as [Vec, Vec];
          }),
        )}
      />
      {homes.map((lit, floor) => {
        const z0 = floor * STOREY_H;
        const shop = floor === 0;
        return (
          <g key={floor} className={`ic-home ${lit ? "is-lit" : ""}`}>
            <polygon className="ic-fhalo" points={yQuad(AY1, A0, z0, A1, z0 + STOREY_H)} />
            {(shop ? [34, 58, 82, 150, 174] : APT_BAYS).map((x) => (
              <polygon
                key={x}
                className="ic-awin"
                points={yQuad(AY1, x, z0 + (shop ? 3 : 7), x + (shop ? 20 : 9), z0 + (shop ? 17 : 18))}
              />
            ))}
            {APT_SIDE_BAYS.map((y) => (
              <polygon key={`r${y}`} className="ic-awin" points={xQuad(A1, y, z0 + 7, y + 8, z0 + 18)} />
            ))}
          </g>
        );
      })}
      {/* Entrance */}
      <polygon className="ic-face ic-rc" points={yQuad(AY1, 108, 0, 130, 16)} />
      <Box x={104} y={AY1} z={16} w={30} d={10} h={2} />
      <Label at={[110, AY1 + 10, 19.5]} size={4.4} spacing={0.8} className="ic-label-lit">
        NO.27
      </Label>
      {/* Balconies */}
      {[1, 2, 3, 4, 5, 6].flatMap((floor) =>
        BALCONY_X.map((x) => {
          const z = floor * STOREY_H + 1;
          return (
            <g key={`${floor}-${x}`}>
              <Box x={x} y={AY1} z={z} w={26} d={10} h={1.6} />
              <path
                className="ic-ln"
                d={segs([
                  [[x, AY1 + 10, z + 1.6], [x, AY1 + 10, z + 8]],
                  [[x + 26, AY1 + 10, z + 1.6], [x + 26, AY1 + 10, z + 8]],
                  [[x + 26, AY1, z + 8], [x + 26, AY1 + 10, z + 8]],
                  [[x, AY1 + 10, z + 8], [x + 26, AY1 + 10, z + 8]],
                ])}
              />
              <path
                className="ic-dt"
                d={segs([5, 10, 15, 20].map((k) => [[x + k, AY1 + 10, z + 1.6], [x + k, AY1 + 10, z + 8]] as [Vec, Vec]))}
              />
            </g>
          );
        }),
      )}
      {/* Roof */}
      <polygon className="ic-face ic-rc" points={topQuad(108, 70, 138, 92, ROOF)} />
      <Box x={166} y={50} z={ROOF} w={22} d={16} h={7} />
      <path
        className="ic-ln"
        d={segs([
          [[52, 52, ROOF], [52, 52, ROOF + 13]],
          [[72, 52, ROOF], [72, 52, ROOF + 13]],
          [[52, 72, ROOF], [52, 72, ROOF + 13]],
          [[72, 72, ROOF], [72, 72, ROOF + 13]],
        ])}
      />
      <Cyl x={62} y={62} z={ROOF + 13} h={17} r={12} />
      <path className="ic-ln" d={`M${pt(62 - 12 * 0.7071, 62 + 12 * 0.7071, ROOF + 30)}L${pt(62, 62, ROOF + 37)}L${pt(62 + 12 * 0.7071, 62 - 12 * 0.7071, ROOF + 30)}`} />
    </g>
  );
});

function LiftShaft({ car, dir }: { car: number; dir: number }) {
  const { x0, x1, y0, y1 } = SHAFT;
  const top = ROOF + 18;
  const z = 1 + (car - 1) * STOREY_H;
  const slabs: [Vec, Vec][] = [];
  for (let k = 1; k <= STOREYS; k += 1) {
    const zz = k * STOREY_H;
    slabs.push([[x0, y1, zz], [x1, y1, zz]], [[x1, y0, zz], [x1, y1, zz]]);
  }
  const label = `${Math.round(car)}F ${dir > 0 ? "↑" : dir < 0 ? "↓" : ""}`.trim();
  return (
    <g>
      {/* Back walls of the glass shaft */}
      <polygon className="ic-shaft-back" points={xQuad(x0, y0, 0, y1, top)} />
      <polygon className="ic-shaft-back" points={yQuad(y0, x0, 0, x1, top)} />
      <path className="ic-cable" d={segs([[[(x0 + x1) / 2, (y0 + y1) / 2, z + 16], [(x0 + x1) / 2, (y0 + y1) / 2, top]]])} />
      <polygon className="ic-halo is-on" points={yQuad(y1, x0 - 6, z - 6, x1 + 6, z + 22)} />
      <Box x={x0 + 2} y={y0 + 2} z={z} w={x1 - x0 - 4} d={y1 - y0 - 4} h={15} className="ic-liftcar" />
      {/* Front glass */}
      <polygon className="ic-shaft-glass" points={xQuad(x1, y0, 0, y1, top)} />
      <polygon className="ic-shaft-glass" points={yQuad(y1, x0, 0, x1, top)} />
      <path className="ic-dt" d={segs(slabs)} />
      <Box x={x0 - 1} y={y0 - 1} z={top} w={x1 - x0 + 2} d={y1 - y0 + 2} h={3} />
      <Label at={[x0 + 4, y1, 17]} size={4} spacing={0.6} className="ic-label-lit">
        {label}
      </Label>
    </g>
  );
}

function CallPanel({ queue, car, onCall }: { queue: readonly number[]; car: number; onCall: (floor: number) => void }) {
  return (
    <g>
      <Box x={211} y={136} w={38} d={13} h={7} />
      <Label at={[213, 149, 2]} size={3.6} spacing={0.6}>
        CALL · LIFT
      </Label>
      {Array.from({ length: STOREYS }, (_, i) => {
        const floor = i + 1;
        const on = queue.includes(floor) || Math.round(car) === floor;
        const x = CALL_X(floor);
        return (
          <Hit key={floor} label={`Call the lift to floor ${floor}`} onPress={() => onCall(floor)} className={`ic-press ${on ? "is-lit" : ""}`}>
            <Box x={x} y={139} z={7} w={3.6} d={7} h={1.4} />
            <Label at={[x + 1.8, 144.5, 8.4]} plane="top" size={3} spacing={0} anchor="middle" className="ic-press-num">
              {floor}
            </Label>
          </Hit>
        );
      })}
    </g>
  );
}

type LiftSim = { car: number; queue: number[]; dwell: number; dir: number; homes: boolean[] };
const LIFT_START: LiftSim = { car: 1.6, queue: [5], dwell: 0, dir: 1, homes: APT_HOME_START };

function stepLift(sim: LiftSim, dt: number): LiftSim {
  if (sim.dwell > 0) return { ...sim, dwell: Math.max(0, sim.dwell - dt) };
  const target = sim.queue[0];
  if (target === undefined) return sim.dir === 0 ? sim : { ...sim, dir: 0 };
  const delta = target - sim.car;
  const move = dt * 1.15;
  if (Math.abs(delta) <= move) {
    return {
      car: target,
      queue: sim.queue.slice(1),
      dwell: 1.3,
      dir: 0,
      homes: sim.homes.map((lit, i) => (i === target - 1 ? !lit : lit)),
    };
  }
  return { ...sim, car: sim.car + Math.sign(delta) * move, dir: Math.sign(delta) };
}

function ApartmentScene({ live, keys, still }: SceneProps) {
  const [sim, setSim] = useState<LiftSim>(LIFT_START);
  useFrame(live && !still, (dt) => setSim((current) => stepLift(current, dt)));
  const call = (floor: number) =>
    setSim((current) =>
      current.queue.includes(floor) || (current.queue.length === 0 && Math.abs(current.car - floor) < 0.01)
        ? current
        : { ...current, queue: [...current.queue, floor] },
    );
  useSceneKeys(keys, (key) => {
    const floor = Number(key);
    if (!Number.isInteger(floor) || floor < 1 || floor > STOREYS) return false;
    call(floor);
    return true;
  });
  const homes = sim.homes.filter(Boolean).length;
  const arrow = sim.dir > 0 ? " ↑" : sim.dir < 0 ? " ↓" : "";
  const status = `car ${Math.round(sim.car)}F${arrow} · ${sim.queue.length ? `queue ${sim.queue.join(" ")}` : "idle"} · ${homes} ${homes === 1 ? "home" : "homes"} lit`;
  return (
    <Figure
      status={status}
      label="Seven-storey apartment block with a glass elevator on its side and a street call panel with buttons 1 to 7."
    >
      <g transform={`scale(1.3) ${centerOn(150, 125, 66)}`}>
        <ApartmentStreet />
        <StreetLamp x={18} y={170} />
        <ApartmentBlock homes={sim.homes} />
        <LiftShaft car={sim.car} dir={sim.dir} />
        <CallPanel queue={sim.queue} car={sim.car} onCall={call} />
        <StreetLamp x={262} y={170} />
        <Car x={226} y={199} taxi />
      </g>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Fig 3 · Lighthouse                                                  */
/* ------------------------------------------------------------------ */

/** Square with cut corners, listed clockwise from the back edge. */
function chamfer(cx: number, cy: number, r: number, c = r * 0.3): Flat[] {
  return [
    [cx - r + c, cy - r], [cx + r - c, cy - r], [cx + r, cy - r + c], [cx + r, cy + r - c],
    [cx + r - c, cy + r], [cx - r + c, cy + r], [cx - r, cy + r - c], [cx - r, cy - r + c],
  ];
}

/** Upright prism over a clockwise outline; only faces turned toward the viewer are drawn. */
function Prism({
  points,
  z = 0,
  h,
  className,
  side = "",
  top = "",
  children,
}: {
  points: readonly Flat[];
  z?: number;
  h: number;
  className?: string;
  side?: string;
  top?: string;
  children?: ReactNode;
}) {
  const faces: string[] = [];
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    if (b[1] - a[1] - (b[0] - a[0]) <= 0) return;
    faces.push(poly([[a[0], a[1], z], [b[0], b[1], z], [b[0], b[1], z + h], [a[0], a[1], z + h]]));
  });
  return (
    <g className={className}>
      {faces.map((face) => (
        <polygon key={face} className={`ic-face ${side}`} points={face} />
      ))}
      <polygon className={`ic-face ic-top ${top}`} points={flatPoly(points, z + h)} />
      {children}
    </g>
  );
}

const LH = { x: 150, y: 150 } as const;
const GALLERY_Z = 154;
const LANTERN_Z = 168;

const LighthouseSea = memo(function LighthouseSea() {
  const random = seeded(41);
  const waves: [Vec, Vec][] = [];
  for (let y = 16; y < 290; y += 11) {
    for (let x = 14 + ((y / 11) % 2) * 9; x < 286; x += 18) {
      const jitter = random() * 6;
      waves.push([[x + jitter, y, 0], [x + jitter + 8, y, 0]]);
    }
  }
  return (
    <g>
      <Plate x0={0} y0={0} x1={300} y1={300} />
      <path className="ic-wave" d={segs(waves)} />
      <Label at={[26, 292, 0]} plane="top" size={5} spacing={1.2}>
        NORTH POINT LT · 41°N
      </Label>
      {[
        [60, 70, 11],
        [250, 96, 9],
        [236, 238, 13],
        [92, 226, 8],
      ].map(([x, y, r]) => (
        <Prism key={`${x}-${y}`} points={chamfer(x, y, r, r * 0.45)} h={5} />
      ))}
      <Prism points={chamfer(LH.x, LH.y, 62, 22)} h={6} />
      <Prism points={chamfer(LH.x + 4, LH.y + 4, 50, 16)} z={6} h={6} />
    </g>
  );
});

const LighthouseTower = memo(function LighthouseTower({ beam }: { beam: boolean }) {
  const { x, y } = LH;
  const sections: { r: number; z: number; h: number; band?: boolean; windows?: boolean }[] = [
    { r: 30, z: 12, h: 9 },
    { r: 23, z: 21, h: 38, windows: true },
    { r: 24.5, z: 59, h: 18, band: true },
    { r: 21, z: 77, h: 36, windows: true },
    { r: 22.5, z: 113, h: 13, band: true },
    { r: 19, z: 126, h: 28, windows: true },
  ];
  const top = GALLERY_Z + 3;
  const lanternMull: [Vec, Vec][] = [];
  for (let k = 0; k <= 4; k += 1) {
    const t = -13 + k * 6.5;
    lanternMull.push([[x + 14, y + t, top], [x + 14, y + t, top + 22]], [[x + t, y + 14, top], [x + t, y + 14, top + 22]]);
  }
  return (
    <g>
      {sections.map(({ r, z, h, band, windows }) => (
        <Prism key={z} points={chamfer(x, y, r, r * 0.28)} z={z} h={h}>
          {band && (
            <path
              className="ic-dt"
              d={segs(
                Array.from({ length: Math.floor(h / 2.4) }, (_, k) => {
                  const zz = z + 1.6 + k * 2.4;
                  return [[x - r * 0.72, y + r, zz], [x + r, y + r, zz]] as [Vec, Vec];
                }).concat(
                  Array.from({ length: Math.floor(h / 2.4) }, (_, k) => {
                    const zz = z + 1.6 + k * 2.4;
                    return [[x + r, y - r * 0.72, zz], [x + r, y + r, zz]] as [Vec, Vec];
                  }),
                ),
              )}
            />
          )}
          {windows && (
            <>
              <polygon className="ic-face ic-rc" points={yQuad(y + r, x - 4, z + h * 0.35, x + 0.5, z + h * 0.75)} />
              <polygon className="ic-face ic-rc" points={xQuad(x + r, y + 2, z + h * 0.2, y + 6.5, z + h * 0.6)} />
            </>
          )}
        </Prism>
      ))}
      {/* Gallery and railing */}
      <Prism points={chamfer(x, y, 25, 7)} z={GALLERY_Z} h={3} />
      <path
        className="ic-ln"
        d={segs(
          chamfer(x, y, 24, 7).map((p, i, list) => {
            const q = list[(i + 1) % list.length];
            return [[p[0], p[1], top + 6], [q[0], q[1], top + 6]] as [Vec, Vec];
          }),
        )}
      />
      <polygon className={`ic-halo ${beam ? "is-on" : ""}`} points={flatPoly(chamfer(x, y, 34, 11), LANTERN_Z)} />
      <Prism points={chamfer(x, y, 14, 3.5)} z={top} h={22} side={`ic-glass ${beam ? "is-on ic-lantern" : ""}`} />
      <path className={beam ? "ic-mull" : "ic-dt"} d={segs(lanternMull)} />
      <Prism points={chamfer(x, y, 16, 4.5)} z={top + 22} h={4} />
      <Prism points={chamfer(x, y, 9, 2.8)} z={top + 26} h={6} />
      <path className="ic-ln" d={segs([[[x, y, top + 32], [x, y, top + 42]]])} />
      <path
        className="ic-ln"
        d={segs(chamfer(x, y, 24, 7).map((p) => [[p[0], p[1], top], [p[0], p[1], top + 6]] as [Vec, Vec]))}
      />
    </g>
  );
});

const KeeperCottage = memo(function KeeperCottage({ lit }: { lit: boolean }) {
  return (
    <g className={lit ? "is-on" : ""}>
      <Box x={170} y={176} w={52} d={22} h={4} />
      <Box x={176} y={180} z={4} w={40} d={34} h={18}>
        <polygon className="ic-face ic-rc" points={yQuad(214, 184, 4, 193, 17)} />
        <Label at={[182, 214, 19.6]} size={3.6} spacing={0.6}>
          KEEPER
        </Label>
        {[
          [197, 207],
          [184, 192],
        ].map(([a, b], index) =>
          index === 0 ? (
            <g key={a} className="ic-cottage-win">
              <polygon className="ic-awin" points={yQuad(214, a, 8, b, 16)} />
              <path className="ic-winbar" d={segs([[[(a + b) / 2, 214, 8], [(a + b) / 2, 214, 16]], [[a, 214, 12], [b, 214, 12]]])} />
            </g>
          ) : (
            <g key={a} className="ic-cottage-win">
              <polygon className="ic-awin" points={xQuad(216, a, 8, b, 16)} />
              <path className="ic-winbar" d={segs([[[216, (a + b) / 2, 8], [216, (a + b) / 2, 16]], [[216, a, 12], [216, b, 12]]])} />
            </g>
          ),
        )}
      </Box>
      <Box x={174} y={178} z={22} w={44} d={38} h={2} />
      <Box x={200} y={186} z={24} w={8} d={8} h={10} />
      <Box x={164} y={190} w={12} d={16} h={8} />
    </g>
  );
});

type Ripple = { id: number; born: number };
type LighthouseSim = { time: number; angle: number; rpm: number; beam: boolean; ripples: Ripple[] };

function LighthouseScene({ live, keys, reduced, still }: SceneProps) {
  const gradient = `${useId().replace(/[^a-zA-Z0-9]/g, "")}-beam`;
  const [sim, setSim] = useState<LighthouseSim>({ time: 0, angle: 200, rpm: 8, beam: true, ripples: [] });
  useFrame(live && !still, (dt) =>
    setSim((current) => ({
      ...current,
      time: current.time + dt,
      angle: current.beam && !reduced ? (current.angle + current.rpm * 6 * dt) % 360 : current.angle,
      ripples: current.ripples.filter((ripple) => current.time - ripple.born < 3),
    })),
  );
  const toggle = () => setSim((current) => ({ ...current, beam: !current.beam }));
  const horn = () =>
    setSim((current) => ({ ...current, ripples: [...current.ripples, { id: current.time, born: current.time }].slice(-4) }));
  useSceneKeys(keys, (key) => {
    if (key === "ArrowLeft") setSim((current) => ({ ...current, rpm: Math.max(2, current.rpm - 2) }));
    else if (key === "ArrowRight") setSim((current) => ({ ...current, rpm: Math.min(24, current.rpm + 2) }));
    else if (key === "h") horn();
    else if (key === " " || key === "Enter") toggle();
    else return false;
    return true;
  });

  const theta = (sim.angle * Math.PI) / 180;
  const reach = 520;
  const spread = 0.1;
  const origin: Vec = [LH.x, LH.y, LANTERN_Z];
  const tip = (offset: number): Vec => [LH.x + Math.cos(theta + offset) * reach, LH.y + Math.sin(theta + offset) * reach, LANTERN_Z];
  const near = (offset: number): Vec => [LH.x + Math.cos(theta + offset) * 10, LH.y + Math.sin(theta + offset) * 10, LANTERN_Z];
  const far = tip(0);
  const towardViewer = Math.cos(theta) + Math.sin(theta) > 0;
  const beamShape = sim.beam ? (
    <polygon
      className="ic-beam"
      fill={`url(#${gradient})`}
      points={poly([near(-0.6), tip(-spread), tip(spread), near(0.6)])}
    />
  ) : null;
  const hornOn = sim.ripples.some((ripple) => sim.time - ripple.born < 1.2);
  const bearing = Math.round((sim.angle + 11) % 360);
  const status = `beam ${sim.beam ? "on" : "off"} · ${sim.rpm} rpm · bearing ${bearing}°${hornOn ? " · horn" : ""}`;

  return (
    <Figure status={status} label="Coastal lighthouse on a rocky outcrop with a keeper's cottage, surrounded by water.">
      <defs>
        <linearGradient
          id={gradient}
          gradientUnits="userSpaceOnUse"
          x1={r2(sx(origin[0], origin[1]))}
          y1={r2(sy(...origin))}
          x2={r2(sx(far[0], far[1]))}
          y2={r2(sy(...far))}
        >
          <stop offset="0" stopColor="var(--accent-hi)" stopOpacity="0.85" />
          <stop offset="0.35" stopColor="var(--accent)" stopOpacity="0.38" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform={`scale(1.16) ${centerOn(150, 150, 66)}`}>
        <LighthouseSea />
        {sim.ripples.map((ripple) => {
          const k = clamp01((sim.time - ripple.born) / 3);
          return (
            <ellipse
              key={ripple.id}
              className="ic-ripple"
              cx={r2(sx(LH.x, LH.y))}
              cy={r2(sy(LH.x, LH.y, 0))}
              rx={r2((40 + k * 120) * RX)}
              ry={r2((40 + k * 120) * RY)}
              opacity={1 - k}
            />
          );
        })}
        {!towardViewer && beamShape}
        <Hit label={sim.beam ? "Lantern: switch the beam off" : "Lantern: switch the beam on"} onPress={toggle}>
          <LighthouseTower beam={sim.beam} />
        </Hit>
        <g transform="translate(0 -12)">
          <KeeperCottage lit />
        </g>
        {towardViewer && beamShape}
      </g>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Fig 4 · Harbor                                                      */
/* ------------------------------------------------------------------ */

const QUAY_Z = 12;
const BOX_X = 102;
const BOX_L = 26;
const BOX_W = 11;
const BOX_H = 11;
const STACK_ROWS = [31, 44, 57, 70];
const SHIP_ROWS = [122, 135, 148, 161];
const HULL_Z = 14;
const CLEAR_Z = 64;
const TROLLEY_REST = 100;
const BOOM_Z = 110;
const CONTAINER_IDS = Array.from({ length: 8 }, (_, i) => `P7·${String(107 + i * 7).padStart(4, "0")}`);
/** Stack slots in pick order (top tier, front row first) and ship slots in load order. */
const STACK_ORDER = [7, 6, 5, 4, 3, 2, 1, 0];
const slotPos = (rows: readonly number[], base: number, slot: number): Vec => [BOX_X, rows[slot % 4], base + Math.floor(slot / 4) * BOX_H];

function Container({ at, label, hot = false }: { at: Vec; label: string; hot?: boolean }) {
  const [x, y, z] = at;
  const ribs: [Vec, Vec][] = [];
  for (let k = 3; k < BOX_L; k += 3) ribs.push([[x + k, y + BOX_W, z + 1], [x + k, y + BOX_W, z + BOX_H - 1]]);
  return (
    <g className={`ic-container ${hot ? "is-hot" : ""}`}>
      <Box x={x} y={y} z={z} w={BOX_L} d={BOX_W} h={BOX_H} />
      <path className="ic-dt ic-rib" d={segs(ribs)} />
      <Label at={[x + BOX_L - 1, y + 1.5, z + 6.2]} plane="x" size={2.6} spacing={0.2} className="ic-box-id">
        {label}
      </Label>
    </g>
  );
}

const HarborQuay = memo(function HarborQuay() {
  const random = seeded(7);
  const water: [Vec, Vec][] = [];
  for (let y = 102; y < 222; y += 7) {
    for (let x = 12 + ((y / 7) % 2) * 5; x < 390; x += 10) {
      if (random() < 0.12) continue;
      water.push([[x, y, 0], [x + 3, y, 0]]);
    }
  }
  const hatch: [Vec, Vec][] = [];
  for (let k = 0; k < 12; k += 1) hatch.push([[300 + k * 7, 34, QUAY_Z], [314 + k * 7, 82, QUAY_Z]]);
  return (
    <g>
      <Plate x0={0} y0={0} x1={400} y1={230} />
      <path className="ic-wave" d={segs(water)} />
      <Box x={8} y={8} w={384} d={88} h={QUAY_Z}>
        <polygon className="ic-face ic-rc" points={yQuad(96, 8, 2, 392, 4)} />
        <path className="ic-dt" d={segs([[[12, 28, QUAY_Z], [388, 28, QUAY_Z]], [[12, 84, QUAY_Z], [388, 84, QUAY_Z]]])} />
        <path className="ic-dt ic-faint" d={segs(hatch)} />
        <path className="ic-dt" d={segs([[[296, 32, QUAY_Z], [392, 32, QUAY_Z]], [[296, 84, QUAY_Z], [392, 84, QUAY_Z]], [[296, 32, QUAY_Z], [296, 84, QUAY_Z]]])} />
        <Label at={[150, 46, QUAY_Z]} plane="top" size={5} spacing={1.2}>
          BAY 7A
        </Label>
        <Label at={[318, 66, QUAY_Z]} plane="top" size={5} spacing={1.2}>
          KEEP CLEAR
        </Label>
        <Label at={[392, 80, 4.2]} plane="x" size={5} spacing={1.4}>
          PIER 7
        </Label>
      </Box>
      {[40, 90, 160, 220, 270, 340].map((x) => (
        <Cyl key={x} x={x} y={92} z={QUAY_Z} h={3} r={1.8} />
      ))}
      <Label at={[18, 226, 0]} plane="top" size={5} spacing={1.2}>
        PIER 7
      </Label>
    </g>
  );
});

function CraneLegs({ side }: { side: "back" | "front" }) {
  const y = side === "back" ? 26 : 82;
  const brace: [Vec, Vec][] = [
    [[96, y + 2, QUAY_Z + 4], [134, y + 2, 60]],
    [[134, y + 2, QUAY_Z + 4], [96, y + 2, 60]],
    [[96, y + 2, 60], [134, y + 2, BOOM_Z - 4]],
    [[134, y + 2, 60], [96, y + 2, BOOM_Z - 4]],
  ];
  return (
    <g>
      <path className="ic-dt" d={segs(brace)} />
      <Box x={92} y={y} z={QUAY_Z} w={4} d={4} h={BOOM_Z - QUAY_Z} />
      <Box x={134} y={y} z={QUAY_Z} w={4} d={4} h={BOOM_Z - QUAY_Z} />
      <Box x={92} y={y} z={56} w={46} d={4} h={4} />
      <Box x={92} y={y} z={BOOM_Z - 6} w={46} d={4} h={6} />
      <Box x={88} y={y - 2} z={QUAY_Z} w={12} d={8} h={3} />
      <Box x={130} y={y - 2} z={QUAY_Z} w={12} d={8} h={3} />
    </g>
  );
}

function CraneBoom({ trolley, hook, carrying, onPress }: { trolley: number; hook: number; carrying: string | null; onPress: () => void }) {
  const truss = (x: number): [Vec, Vec][] => {
    const out: [Vec, Vec][] = [];
    for (let y = -12; y < 202; y += 8) out.push([[x, y, BOOM_Z + 0.6], [x, y + 8, BOOM_Z + 6.4]], [[x, y + 8, BOOM_Z + 6.4], [x, y + 8, BOOM_Z + 0.6]]);
    return out;
  };
  const cableTop = BOOM_Z;
  const cables: [Vec, Vec][] = [
    [[BOX_X + 3, trolley - 4, cableTop], [BOX_X + 3, trolley - 4, hook + 2]],
    [[BOX_X + BOX_L - 3, trolley - 4, cableTop], [BOX_X + BOX_L - 3, trolley - 4, hook + 2]],
    [[BOX_X + 3, trolley + 4, cableTop], [BOX_X + 3, trolley + 4, hook + 2]],
    [[BOX_X + BOX_L - 3, trolley + 4, cableTop], [BOX_X + BOX_L - 3, trolley + 4, hook + 2]],
  ];
  return (
    <Hit label="Gantry crane QC 3: load the next container" onPress={onPress}>
      <Box x={92} y={-14} z={BOOM_Z} w={4} d={216} h={7} />
      <path className="ic-dt" d={segs(truss(96))} />
      <Box x={90} y={-22} z={BOOM_Z + 7} w={50} d={30} h={15}>
        <Label at={[140, 4, BOOM_Z + 16]} plane="x" size={4.6} spacing={1}>
          QC 3
        </Label>
      </Box>
      <circle className="ic-beacon ic-blink" cx={r2(sx(115, -7))} cy={r2(sy(115, -7, BOOM_Z + 24))} r={1.8} />
      <polygon className="ic-halo is-on" points={yQuad(trolley + 12, BOX_X - 6, hook - BOX_H - 6, BOX_X + BOX_L + 6, BOOM_Z)} />
      <path className="ic-cable" d={segs(cables)} />
      <Box x={96} y={trolley - 8} z={BOOM_Z} w={38} d={16} h={4} className="ic-trolley" />
      <Box x={BOX_X - 1} y={trolley - 6} z={hook} w={BOX_L + 2} d={12} h={2} className="ic-spreader" />
      {carrying && <Container at={[BOX_X, trolley - BOX_W / 2, hook - BOX_H]} label={carrying} hot />}
      <Box x={134} y={-14} z={BOOM_Z} w={4} d={216} h={7} />
      <path className="ic-dt" d={segs(truss(138))} />
    </Hit>
  );
}

function Ship({ loaded, offset, opacity }: { loaded: number; offset: number; opacity: number }) {
  const hull: Flat[] = [[72, 116], [330, 116], [334, 124], [334, 164], [330, 172], [72, 172], [52, 144]];
  const hatches: [Vec, Vec][] = [];
  for (let x = 80; x < 280; x += 27) hatches.push([[x, 118, HULL_Z], [x, 170, HULL_Z]]);
  hatches.push([[76, 144, HULL_Z], [280, 144, HULL_Z]]);
  const windows: Vec[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 5; col += 1) windows.push([290 + col * 6, 166, 20 + row * 6]);
  }
  const random = seeded(42);
  const lit = windows.map(() => random() < 0.72);
  return (
    <g transform={`translate(${r2(offset * COS)} ${r2(offset * SIN)})`} opacity={opacity}>
      <Prism points={hull} h={HULL_Z}>
        <Label at={[86, 172, 6]} size={5} spacing={1.2}>
          MV ORLA
        </Label>
        <Label at={[334, 158, 6]} plane="x" size={4.4} spacing={1}>
          ORLA
        </Label>
      </Prism>
      <path className="ic-dt" d={segs(hatches)} />
      {Array.from({ length: loaded }, (_, slot) => (
        <Container key={slot} at={slotPos(SHIP_ROWS, HULL_Z, slot)} label={CONTAINER_IDS[STACK_ORDER[slot]]} />
      ))}
      <Box x={286} y={122} z={HULL_Z} w={38} d={44} h={24}>
        {windows.map(([x, y, z], index) => (
          <polygon key={index} className={`ic-awin ${lit[index] ? "is-lit" : ""}`} points={yQuad(y, x, z, x + 4, z + 4)} />
        ))}
        {[0, 1, 2, 3].map((col) => (
          <polygon key={col} className={`ic-awin ${col !== 2 ? "is-lit" : ""}`} points={xQuad(324, 128 + col * 9, 26, 134 + col * 9, 31)} />
        ))}
      </Box>
      <Box x={290} y={126} z={HULL_Z + 24} w={30} d={36} h={9}>
        <polygon className="ic-glass is-on ic-fsoft" points={yQuad(162, 292, HULL_Z + 27, 318, HULL_Z + 32)} />
        <polygon className="ic-glass is-on ic-fsoft" points={xQuad(320, 128, HULL_Z + 27, 160, HULL_Z + 32)} />
      </Box>
      <Box x={300} y={136} z={HULL_Z + 33} w={12} d={12} h={11} />
      <path className="ic-ln" d={segs([[[296, 152, HULL_Z + 33], [296, 152, HULL_Z + 52]]])} />
      <circle className="ic-beacon ic-blink" cx={r2(sx(296, 152))} cy={r2(sy(296, 152, HULL_Z + 53))} r={1.5} />
    </g>
  );
}

type CraneJob = { start: number; from: number; to: number };
type HarborSim = {
  time: number;
  stack: number;
  loaded: number;
  queued: number;
  job: CraneJob | null;
  trolley: number;
  sail: number | null;
};

const HARBOR_START: HarborSim = { time: 0, stack: 7, loaded: 0, queued: 1, job: { start: -0.4, from: 0, to: 0 }, trolley: TROLLEY_REST, sail: null };

/** Trolley position, hook height and whether the box hangs from it, `t` seconds into a job. */
function craneAt(job: CraneJob, from: number, t: number) {
  const src = slotPos(STACK_ROWS, QUAY_Z, STACK_ORDER[job.from]);
  const dst = slotPos(SHIP_ROWS, HULL_Z, job.to);
  const pick = src[2] + BOX_H;
  const drop = dst[2] + BOX_H;
  const srcY = src[1] + BOX_W / 2;
  const dstY = dst[1] + BOX_W / 2;
  const legs = [
    { dur: Math.max(0.5, Math.abs(srcY - from) / 70), y: [from, srcY], z: [CLEAR_Z, CLEAR_Z], hold: false },
    { dur: 0.9, y: [srcY, srcY], z: [CLEAR_Z, pick], hold: false },
    { dur: 0.9, y: [srcY, srcY], z: [pick, CLEAR_Z + 8], hold: true },
    { dur: Math.abs(dstY - srcY) / 60, y: [srcY, dstY], z: [CLEAR_Z + 8, CLEAR_Z + 8], hold: true },
    { dur: 1, y: [dstY, dstY], z: [CLEAR_Z + 8, drop], hold: true },
    { dur: 0.8, y: [dstY, dstY], z: [drop, CLEAR_Z], hold: false },
  ];
  let left = t;
  for (let index = 0; index < legs.length; index += 1) {
    const leg = legs[index];
    if (left <= leg.dur) {
      const k = easeInOut(clamp01(left / leg.dur));
      return { y: lerp(leg.y[0], leg.y[1], k), z: lerp(leg.z[0], leg.z[1], k), hold: leg.hold, leg: index, done: false };
    }
    left -= leg.dur;
  }
  return { y: dstY, z: CLEAR_Z, hold: false, leg: legs.length, done: true };
}

function stepHarbor(sim: HarborSim, dt: number): HarborSim {
  const time = sim.time + dt;
  let { stack, loaded, queued, job, trolley, sail } = sim;
  if (sail !== null && time - sail > 9) {
    sail = null;
    stack = 8;
    loaded = 0;
  }
  if (job) {
    const pose = craneAt(job, trolley, time - job.start);
    if (pose.done) {
      trolley = pose.y;
      loaded += 1;
      job = null;
    }
  }
  if (!job && sail === null && queued > 0) {
    if (stack > 0 && loaded < 8) job = { start: time, from: 8 - stack, to: loaded };
    if (job) stack -= 1;
    queued -= 1;
  }
  return { time, stack, loaded, queued, job, trolley, sail };
}

function HarborScene({ live, keys, still }: SceneProps) {
  const [sim, setSim] = useState<HarborSim>(HARBOR_START);
  useFrame(live && !still, (dt) => setSim((current) => stepHarbor(current, dt)));
  const load = () =>
    setSim((current) =>
      current.sail !== null || current.loaded + (current.job ? 1 : 0) + current.queued >= 8
        ? current
        : { ...current, queued: current.queued + 1 },
    );
  const sailAway = () =>
    setSim((current) => (current.job || current.sail !== null ? current : { ...current, sail: current.time, queued: 0 }));
  useSceneKeys(keys, (key) => {
    if (key === " " || key === "Enter") load();
    else if (key === "s") sailAway();
    else return false;
    return true;
  });

  const pose = sim.job ? craneAt(sim.job, sim.trolley, Math.max(0, sim.time - sim.job.start) + (still ? 2.4 : 0)) : null;
  const carrying = pose?.hold && sim.job ? CONTAINER_IDS[STACK_ORDER[sim.job.from]] : null;
  const stackSlots = STACK_ORDER.filter((_, order) => order >= 8 - sim.stack || (sim.job?.from === order && (pose?.leg ?? 0) <= 1))
    .sort((a, b) => (a % 4) - (b % 4) || a - b);
  const sailT = sim.sail === null ? -1 : sim.time - sim.sail;
  const shipOffset = sailT < 0 ? 0 : sailT < 4.5 ? easeInOut(sailT / 4.5) * 460 : lerp(-420, 0, easeOut(clamp01((sailT - 4.5) / 4.5)));
  const shipOpacity = sailT < 0 ? 1 : sailT < 4.5 ? 1 - clamp01((sailT - 2.5) / 2) : clamp01((sailT - 4.5) / 2);
  const shipLoaded = sailT >= 4.5 ? 0 : sim.loaded + (pose && pose.leg === 5 ? 1 : 0);

  let status: string;
  if (sailT >= 0) status = sailT < 4.5 ? "MV ORLA sailing · crane idle" : "next ship berthing · crane idle";
  else if (sim.loaded >= 8) status = "loaded 8/8 · crane idle · s to sail";
  else status = `loading ${sim.loaded}/8 · crane ${sim.job ? "busy" : "idle"}${sim.queued ? ` · ${sim.queued} queued` : ""}`;

  return (
    <Figure status={status} label="Container port corner: a quay with a stack of containers, a gantry crane and a moored container ship.">
      <g transform={`scale(1.28) ${centerOn(200, 115, 44)}`}>
        <HarborQuay />
        <CraneLegs side="back" />
        {stackSlots.map((slot) => (
          <Container key={slot} at={slotPos(STACK_ROWS, QUAY_Z, slot)} label={CONTAINER_IDS[slot]} />
        ))}
        <CraneLegs side="front" />
        <Ship loaded={shipLoaded} offset={shipOffset} opacity={shipOpacity} />
        <CraneBoom trolley={pose ? pose.y : sim.trolley} hook={pose ? pose.z : CLEAR_Z} carrying={carrying} onPress={load} />
      </g>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Fig 5 · Metro station                                               */
/* ------------------------------------------------------------------ */

const DECK_Z = 70;
const TRACK_Y = [81, 111] as const;
const CAR_L = 50;
const CAR_W = 18;
const TRAIN_L = CAR_L * 3 + 6;
const STOP_X = 104;
const PILLARS_X = [40, 130, 220, 310];
const SHOPS = [
  { x: 52, name: "DINER 24" },
  { x: 142, name: "NOODLE" },
  { x: 232, name: "KIOSK" },
  { x: 322, name: "FLORA" },
];

/** Screen silhouette of a box, for clip paths. */
const boxHull = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) =>
  poly([[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y1, z1]]);

const MetroStreet = memo(function MetroStreet() {
  const dashes: [Vec, Vec][] = [];
  for (let x = 16; x < 372; x += 16) dashes.push([[x, 222, 0], [x + 8, 222, 0]]);
  return (
    <g>
      <Plate x0={0} y0={0} x1={380} y1={262} />
      <Flat className="ic-face ic-asph" points={rect(8, 200, 372, 244)} />
      <path className="ic-mark-line ic-thin" d={segs(dashes)} />
      <path className="ic-dt" d={segs([[[8, 198, 0], [372, 198, 0]]])} />
      {PILLARS_X.map((x) => (
        <Box key={`b${x}`} x={x} y={52} w={10} d={10} h={DECK_Z - 8} />
      ))}
      {SHOPS.map(({ x, name }) => (
        <Box key={name} x={x} y={66} w={66} d={60} h={26}>
          <polygon className="ic-glass is-on ic-fsoft" points={yQuad(126, x + 4, 2, x + 62, 15)} />
          <path className="ic-mull" d={segs([[[x + 24, 126, 2], [x + 24, 126, 15]], [[x + 44, 126, 2], [x + 44, 126, 15]]])} />
          <polygon className="ic-sign" points={yQuad(126, x + 8, 17.5, x + 58, 23.5)} />
          <Label at={[x + 33, 126, 19]} size={4.2} spacing={1} anchor="middle" className="ic-label-lit">
            {name}
          </Label>
        </Box>
      ))}
      {PILLARS_X.map((x) => (
        <Box key={`f${x}`} x={x} y={130} w={10} d={10} h={DECK_Z - 8} />
      ))}
    </g>
  );
});

const MetroDeck = memo(function MetroDeck() {
  const sleepers = (yc: number): [Vec, Vec][] => {
    const out: [Vec, Vec][] = [];
    for (let x = 12; x < 368; x += 5) out.push([[x, yc - 9, DECK_Z], [x, yc + 9, DECK_Z]]);
    return out;
  };
  const rails = TRACK_Y.flatMap((yc) => [
    [[10, yc - 6, DECK_Z + 0.6], [370, yc - 6, DECK_Z + 0.6]] as [Vec, Vec],
    [[10, yc + 6, DECK_Z + 0.6], [370, yc + 6, DECK_Z + 0.6]] as [Vec, Vec],
  ]);
  const posts: [Vec, Vec][] = [];
  for (let x = 50; x <= 330; x += 56) posts.push([[x, 50, DECK_Z + 4], [x, 50, DECK_Z + 28]]);
  return (
    <g>
      <Box x={6} y={40} z={DECK_Z - 8} w={368} d={110} h={8}>
        <path className="ic-dt ic-faint" d={segs([...sleepers(TRACK_Y[0]), ...sleepers(TRACK_Y[1])])} />
        <path className="ic-ln" d={segs(rails)} />
      </Box>
      <Box x={20} y={42} z={DECK_Z} w={340} d={24} h={4}>
        <path className="ic-edge-lit" d={segs([[[20, 66, DECK_Z + 4], [360, 66, DECK_Z + 4]]])} />
      </Box>
      <path className="ic-ln" d={segs(posts)} />
      <Box x={18} y={38} z={DECK_Z + 28} w={344} d={32} h={4}>
        <path className="ic-edge-lit" d={segs([[[18, 70, DECK_Z + 28], [362, 70, DECK_Z + 28]]])} />
        <Label at={[340, 70, DECK_Z + 29]} size={3.6} spacing={0.8}>
          LINE 3
        </Label>
      </Box>
    </g>
  );
});

function DepartureBoard({ states }: { states: readonly [string, string] }) {
  return (
    <g>
      <path className="ic-ln" d={segs([[[206, 68, DECK_Z + 28], [206, 68, DECK_Z + 22]], [[244, 68, DECK_Z + 28], [244, 68, DECK_Z + 22]]])} />
      <polygon className="ic-halo is-on" points={yQuad(70, 196, DECK_Z + 8, 254, DECK_Z + 26)} />
      <Box x={200} y={64} z={DECK_Z + 12} w={50} d={4} h={10} left="ic-board" />
      <Label at={[203, 68, DECK_Z + 18.6]} size={3.2} spacing={0.5} className="ic-label-lit">
        LINE 3 · NEXT
      </Label>
      <Label at={[203, 68, DECK_Z + 13.8]} size={3} spacing={0.4} className="ic-label-lit">
        {`1 · ${states[0]}  2 · ${states[1]}`}
      </Label>
    </g>
  );
}

function Train({ track, x0, numbers, moving }: { track: 0 | 1; x0: number; numbers: readonly string[]; moving: boolean }) {
  const yc = TRACK_Y[track];
  const y = yc - CAR_W / 2;
  const z = DECK_Z + 1.5;
  return (
    <g className={`ic-train ${moving ? "is-moving" : ""}`}>
      {numbers.map((label, car) => {
        const cx = x0 + car * (CAR_L + 3);
        const windows = [6, 14, 22, 30, 38];
        return (
          <g key={label}>
            <Box x={cx} y={y} z={z} w={CAR_L} d={CAR_W} h={19}>
              {windows.map((k) => (
                <polygon key={k} className="ic-carwin" points={yQuad(y + CAR_W, cx + k, z + 8, cx + k + 5.5, z + 15.5)} />
              ))}
              <path className="ic-dt" d={segs([[[cx + 3, y + CAR_W, z + 2], [cx + 3, y + CAR_W, z + 17]], [[cx + 46, y + CAR_W, z + 2], [cx + 46, y + CAR_W, z + 17]]])} />
              <Label at={[cx + 4.5, y + CAR_W, z + 3]} size={2.8} spacing={0.4}>
                {label}
              </Label>
              {car === 2 && <polygon className="ic-carwin" points={xQuad(cx + CAR_L, y + 3, z + 8, y + 15, z + 15.5)} />}
            </Box>
            <Box x={cx + 4} y={y + 3} z={z + 19} w={CAR_L - 8} d={CAR_W - 6} h={2} />
          </g>
        );
      })}
    </g>
  );
}

const MetroFront = memo(function MetroFront() {
  const steps = 14;
  const rail: [Vec, Vec][] = [];
  for (let x = 70; x <= 330; x += 20) rail.push([[x, 145, DECK_Z + 4], [x, 145, DECK_Z + 11]]);
  rail.push([[70, 145, DECK_Z + 11], [330, 145, DECK_Z + 11]]);
  return (
    <g>
      <Box x={60} y={124} z={DECK_Z} w={280} d={22} h={4}>
        <path className="ic-edge-lit" d={segs([[[60, 124, DECK_Z + 4], [340, 124, DECK_Z + 4]]])} />
        <Label at={[70, 146, DECK_Z + 0.8]} size={3.4} spacing={0.8}>
          M · LINE 3
        </Label>
      </Box>
      <path className="ic-dt" d={segs(rail)} />
      {Array.from({ length: steps }, (_, i) => {
        const h = DECK_Z - (i * DECK_Z) / steps;
        return <Box key={i} x={280} y={150 + i * 3.4} w={18} d={3.4} h={h} />;
      })}
      <path className="ic-ln" d={segs([[[298, 150, DECK_Z + 7], [298, 197.6, 7]], [[280, 150, DECK_Z + 7], [280, 197.6, 7]]])} />
      <path className="ic-ln" d={segs([[[312, 192, 0], [312, 192, 24]]])} />
      <Box x={308} y={190} z={24} w={8} d={2} h={8} left="ic-board" />
      <Label at={[309, 192, 26]} size={4.6} spacing={0} className="ic-label-lit">
        M
      </Label>
    </g>
  );
});

type TrainPhase = "boarding" | "departing" | "away" | "arriving";
type MetroTrain = { phase: TrainPhase; since: number };
type MetroSim = { time: number; trains: [MetroTrain, MetroTrain]; riders: number; tick: number };

const DEPART = 4.2;
const AWAY = 3.5;
const ARRIVE = 4.5;

function trainX(track: 0 | 1, train: MetroTrain, time: number) {
  const t = time - train.since;
  const outward = track === 0 ? 420 : -TRAIN_L - 60;
  const inward = track === 0 ? -TRAIN_L - 60 : 420;
  if (train.phase === "boarding") return STOP_X;
  if (train.phase === "departing") return lerp(STOP_X, outward, clamp01(t / DEPART) ** 2);
  if (train.phase === "away") return outward;
  return lerp(inward, STOP_X, easeOut(clamp01(t / ARRIVE)));
}

function stepMetro(sim: MetroSim, dt: number): MetroSim {
  const time = sim.time + dt;
  const trains = sim.trains.map((train) => {
    const t = time - train.since;
    if (train.phase === "departing" && t >= DEPART) return { phase: "away" as const, since: time };
    if (train.phase === "away" && t >= AWAY) return { phase: "arriving" as const, since: time };
    if (train.phase === "arriving" && t >= ARRIVE) return { phase: "boarding" as const, since: time };
    return train;
  }) as [MetroTrain, MetroTrain];
  let { riders, tick } = sim;
  tick += dt;
  if (tick > 0.7) {
    tick = 0;
    riders += trains.filter((train) => train.phase === "boarding").length;
  }
  return { time, trains, riders, tick };
}

function MetroScene({ live, keys, still }: SceneProps) {
  const clip = `${useId().replace(/[^a-zA-Z0-9]/g, "")}-rails`;
  const [sim, setSim] = useState<MetroSim>({
    time: 0,
    trains: [
      { phase: "boarding", since: 0 },
      { phase: "arriving", since: -1.2 },
    ],
    riders: 41,
    tick: 0,
  });
  useFrame(live && !still, (dt) => setSim((current) => stepMetro(current, dt)));
  const dispatch = (track: 0 | 1) =>
    setSim((current) => {
      const train = current.trains[track];
      let next: MetroTrain = train;
      if (train.phase === "boarding") next = { phase: "departing", since: current.time };
      else if (train.phase === "away") next = { phase: "arriving", since: current.time };
      const trains = [...current.trains] as [MetroTrain, MetroTrain];
      trains[track] = next;
      return { ...current, trains };
    });
  useSceneKeys(keys, (key) => {
    if (key === "1") dispatch(0);
    else if (key === "2") dispatch(1);
    else return false;
    return true;
  });
  const short: Record<TrainPhase, string> = { boarding: "BRD", departing: "DEP", away: "DUE", arriving: "ARR" };
  const words: Record<TrainPhase, string> = { boarding: "boarding", departing: "departing", away: "due", arriving: "arriving" };
  const [t1, t2] = sim.trains;
  const status = `line 3 · train 1 ${words[t1.phase]} · train 2 ${words[t2.phase]} · ${sim.riders} riders`;
  return (
    <Figure
      status={status}
      label="Elevated metro station on a viaduct over a street: two tracks, a platform with a canopy, a side platform, a departure board for line 3, stairs down to the street and shops under the viaduct."
    >
      <defs>
        <clipPath id={clip}>
          <polygon points={boxHull(8, 66, DECK_Z, 372, 124, DECK_Z + 40)} />
        </clipPath>
      </defs>
      <g transform={`scale(1.22) ${centerOn(190, 131, 34)}`}>
        <MetroStreet />
        <MetroDeck />
        <DepartureBoard states={[short[t1.phase], short[t2.phase]]} />
        {[0, 1].map((track) => {
          const on = sim.trains[track].phase === "boarding";
          const x = 26 + track * 10;
          return (
            <Hit key={track} label={`Platform button ${track + 1}: dispatch or call train ${track + 1}`} onPress={() => dispatch(track as 0 | 1)} className={`ic-press ${on ? "is-lit" : ""}`}>
              <Box x={x} y={50} z={DECK_Z + 4} w={7} d={7} h={9} />
              <Label at={[x + 3.5, 57, DECK_Z + 6]} size={4} spacing={0} anchor="middle" className="ic-press-num">
                {track + 1}
              </Label>
            </Hit>
          );
        })}
        <g clipPath={`url(#${clip})`}>
          <Train track={0} x0={trainX(0, t1, sim.time)} numbers={["3·10", "3·11", "3·12"]} moving={t1.phase !== "boarding"} />
          <Train track={1} x0={trainX(1, t2, sim.time)} numbers={["3·20", "3·21", "3·22"]} moving={t2.phase !== "boarding"} />
        </g>
        <MetroFront />
      </g>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Fig 6 · Power grid                                                  */
/* ------------------------------------------------------------------ */

/**
 * A grid of windows on one face. `plane` "x" sits on x = at and runs along y;
 * "y" sits on y = at and runs along x. Some cells are bright, some stay dark.
 */
function Grid({
  plane,
  at,
  u0,
  u1,
  z0,
  z1,
  cols,
  rows,
  seed,
  dark = 0.22,
}: {
  plane: "x" | "y";
  at: number;
  u0: number;
  u1: number;
  z0: number;
  z1: number;
  cols: number;
  rows: number;
  seed: number;
  dark?: number;
}) {
  const random = seeded(seed);
  const cw = (u1 - u0) / cols;
  const rh = (z1 - z0) / rows;
  const cells: ReactNode[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const roll = random();
      const a = u0 + col * cw + cw * 0.18;
      const b = a + cw * 0.64;
      const za = z0 + row * rh + rh * 0.2;
      const zb = za + rh * 0.6;
      cells.push(
        <polygon
          key={`${row}-${col}`}
          className={`ic-awin ${roll < dark ? "off" : roll > 0.86 ? "hi" : ""}`}
          points={plane === "x" ? xQuad(at, a, za, b, zb) : yQuad(at, a, za, b, zb)}
        />,
      );
    }
  }
  return <>{cells}</>;
}

type DistrictId = "A" | "B" | "C" | "D";
const DISTRICTS: { id: DistrictId; name: string; load: number }[] = [
  { id: "A", name: "DOWNTOWN", load: 180 },
  { id: "B", name: "HOUSES", load: 58 },
  { id: "C", name: "FACTORY", load: 132 },
  { id: "D", name: "STADIUM", load: 100 },
];
const GRID_START: Record<DistrictId, boolean> = { A: true, B: false, C: true, D: true };
const WIRES: Record<DistrictId, Vec[]> = {
  A: [[236, 44, 30], [246, 132, 42], [262, 122, 34]],
  B: [[182, 60, 30], [172, 144, 42], [146, 178, 42], [96, 206, 22]],
  C: [[194, 100, 30], [174, 176, 42], [206, 196, 24]],
  D: [[226, 100, 30], [242, 174, 42], [272, 216, 34]],
};
const PYLONS: Flat[] = [[246, 132], [172, 144], [146, 178], [174, 176], [242, 174]];

function wirePath(points: readonly Vec[]) {
  let d = `M${pt(...points[0])}`;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const mid: Vec = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 - 7];
    d += `Q${pt(...mid)} ${pt(...b)}`;
  }
  return d;
}

function CoolingTower({ x, y, r0, r1, rw, h }: { x: number; y: number; r0: number; r1: number; rw: number; h: number }) {
  const cx = sx(x, y);
  const yb = sy(x, y, 0);
  const yt = sy(x, y, h);
  const yw = sy(x, y, h * 0.68);
  const k = (r: number) => r2(r * RX);
  const pinch = 2 * rw - (r0 + r1) / 2;
  const d = `M${r2(cx - k(r0))},${r2(yb)}Q${r2(cx - k(pinch))},${r2(yw)} ${r2(cx - k(r1))},${r2(yt)}L${r2(cx + k(r1))},${r2(yt)}Q${r2(cx + k(pinch))},${r2(yw)} ${r2(cx + k(r0))},${r2(yb)}A${k(r0)},${r2(r0 * RY)} 0 0 1 ${r2(cx - k(r0))},${r2(yb)}Z`;
  return (
    <g>
      <path className="ic-face" d={d} />
      <ellipse className="ic-face ic-rc" cx={r2(cx)} cy={r2(yt)} rx={k(r1)} ry={r2(r1 * RY)} />
      <ellipse className="ic-rim" cx={r2(cx)} cy={r2(yt)} rx={k(r1)} ry={r2(r1 * RY)} />
    </g>
  );
}

function House({ x, y, w = 26, d = 20, h = 10 }: { x: number; y: number; w?: number; d?: number; h?: number }) {
  const ridge = h + 9;
  const ym = y + d / 2;
  return (
    <g>
      <Box x={x} y={y} w={w} d={d} h={h}>
        <polygon className="ic-awin" points={yQuad(y + d, x + 5, 3, x + 10, 7.5)} />
        <polygon className="ic-awin" points={yQuad(y + d, x + 15, 3, x + 20, 7.5)} />
        <polygon className="ic-awin" points={xQuad(x + w, y + 7, 3, y + 12, 7.5)} />
      </Box>
      <polygon className="ic-face" points={poly([[x + w, y, h], [x + w, y + d, h], [x + w, ym, ridge]])} />
      <polygon className="ic-face ic-top" points={poly([[x - 1, ym, ridge], [x + w + 1, ym, ridge], [x + w + 1, y + d + 1.5, h - 1], [x - 1, y + d + 1.5, h - 1]])} />
    </g>
  );
}

function Pylon({ x, y, h = 42 }: { x: number; y: number; h?: number }) {
  return (
    <path
      className="ic-ln"
      d={segs([
        [[x - 3, y - 3, 0], [x - 0.8, y - 0.8, h]],
        [[x + 3, y - 3, 0], [x + 0.8, y - 0.8, h]],
        [[x - 3, y + 3, 0], [x - 0.8, y + 0.8, h]],
        [[x + 3, y + 3, 0], [x + 0.8, y + 0.8, h]],
        [[x - 7, y + 7, h - 3], [x + 7, y - 7, h - 3]],
        [[x - 5, y + 5, h - 10], [x + 5, y - 5, h - 10]],
        [[x - 2.5, y - 2.5, 12], [x + 2, y + 2, 24]],
        [[x + 2.5, y - 2.5, 12], [x - 2, y + 2, 24]],
      ])}
    />
  );
}

const GridGround = memo(function GridGround() {
  const dashes: [Vec, Vec][] = [];
  for (let k = 14; k < 308; k += 14) {
    if (k > 146 && k < 174) continue;
    dashes.push([[k, 160, 0], [k + 7, 160, 0]], [[160, k, 0], [160, k + 7, 0]]);
  }
  return (
    <g>
      <Plate x0={0} y0={0} x1={320} y1={320} />
      <Flat className="ic-face ic-asph" points={rect(8, 152, 312, 168)} />
      <Flat className="ic-face ic-asph" points={rect(152, 8, 168, 312)} />
      <path className="ic-mark-line ic-thin" d={segs(dashes)} />
      <Label at={[14, 176, 0]} plane="top" size={4.6} spacing={1}>
        B · HOUSES
      </Label>
      <Label at={[176, 302, 0]} plane="top-y" size={4.6} spacing={1}>
        C · FACTORY
      </Label>
      <Label at={[246, 316, 0]} plane="top" size={4.6} spacing={1}>
        D · STADIUM
      </Label>
      <Label at={[250, 150, 0]} plane="top" size={4.6} spacing={1}>
        A · DOWNTOWN
      </Label>
      <Label at={[16, 146, 0]} plane="top" size={4.6} spacing={1}>
        PLANT 1
      </Label>
    </g>
  );
});

const PowerPlant = memo(function PowerPlant() {
  return (
    <g>
      <Cyl x={122} y={14} h={120} r={5.5} />
      <path className="ic-dt" d={segs(Array.from({ length: 8 }, (_, k) => [[122 - 5.5 * 0.7071, 14 + 5.5 * 0.7071, 16 + k * 14], [122 + 5.5 * 0.7071, 14 - 5.5 * 0.7071, 16 + k * 14]] as [Vec, Vec]))} />
      <circle className="ic-beacon ic-blink" cx={r2(sx(122, 14))} cy={r2(sy(122, 14, 123))} r={1.8} />
      <CoolingTower x={34} y={34} r0={20} r1={13} rw={11} h={58} />
      <CoolingTower x={34} y={86} r0={20} r1={13} rw={11} h={58} />
      <Box x={66} y={28} w={76} d={84} h={28} className="ic-district is-lit">
        <Grid plane="y" at={112} u0={70} u1={138} z0={4} z1={24} cols={10} rows={3} seed={11} dark={0.08} />
        <Grid plane="x" at={142} u0={34} u1={108} z0={4} z1={24} cols={10} rows={3} seed={12} dark={0.1} />
        <Box x={84} y={46} z={28} w={40} d={40} h={6} />
        <Label at={[72, 112, 25.4]} size={3.6} spacing={0.8} className="ic-label-lit">
          PLANT 1 · 470 MW
        </Label>
      </Box>
    </g>
  );
});

function Substation({ on, load, onToggle }: { on: Record<DistrictId, boolean>; load: number; onToggle: (id: DistrictId) => void }) {
  const fence: [Vec, Vec][] = [
    [[176, 14, 6], [240, 14, 6]],
    [[240, 14, 6], [240, 102, 6]],
    [[176, 102, 6], [240, 102, 6]],
    [[176, 14, 6], [176, 102, 6]],
  ];
  const tag = load === 0 ? "OFFLINE" : load >= 460 ? "MAX LOAD" : load >= 400 ? "AT CAPACITY" : "NOMINAL";
  return (
    <g>
      <Flat className="ic-face ic-apron" points={rect(176, 14, 240, 102)} />
      <path className="ic-dt" d={segs(fence)} />
      {[184, 204, 224].map((x, index) => (
        <Box key={x} x={x - 6} y={22} w={14} d={16} h={14} top={load > 0 ? "ic-lit" : ""} className={load > 0 ? "ic-fsoft" : ""}>
          <Cyl x={x + 1} y={30} z={14} h={5} r={2} />
          {index === 0 && (
            <Label at={[180, 38, 3]} size={3} spacing={0.5}>
              132 kV
            </Label>
          )}
        </Box>
      ))}
      <Box x={182} y={54} w={46} d={8} h={24} left="ic-board">
        <Label at={[186, 62, 13]} size={9} spacing={0.5} className="ic-label-lit ic-meter">
          {String(load)}
        </Label>
        <Label at={[212, 62, 13]} size={4} spacing={0.6} className="ic-label-lit">
          MW
        </Label>
        <Label at={[186, 62, 5]} size={3.4} spacing={0.8} className="ic-label-lit">
          {tag}
        </Label>
      </Box>
      {DISTRICTS.map((district, index) => {
        const x = 186 + index * 12;
        return (
          <Hit key={district.id} label={`Breaker ${district.id}: switch ${district.name.toLowerCase()} ${on[district.id] ? "off" : "on"}`} onPress={() => onToggle(district.id)} className={`ic-press ${on[district.id] ? "is-lit" : ""}`}>
            <Box x={x} y={76} w={8} d={8} h={6} />
            <Label at={[x + 4, 81.5, 6]} plane="top" size={4} spacing={0} anchor="middle" className="ic-press-num">
              {district.id}
            </Label>
          </Hit>
        );
      })}
      <Label at={[178, 102, 1]} size={3.6} spacing={0.8}>
        SUBSTATION 7
      </Label>
    </g>
  );
}

const Downtown = memo(function Downtown({ lit }: { lit: boolean }) {
  const towers = [
    { x: 250, y: 18, w: 22, d: 22, h: 84 },
    { x: 280, y: 20, w: 26, d: 26, h: 116 },
    { x: 252, y: 54, w: 20, d: 26, h: 62 },
    { x: 282, y: 62, w: 24, d: 26, h: 98 },
    { x: 254, y: 98, w: 26, d: 24, h: 72 },
    { x: 286, y: 104, w: 22, d: 36, h: 52 },
  ];
  return (
    <g className={`ic-district ${lit ? "is-lit" : ""}`}>
      {towers.map((t, index) => (
        <Box key={index} x={t.x} y={t.y} w={t.w} d={t.d} h={t.h}>
          <polygon className="ic-fhalo" points={yQuad(t.y + t.d, t.x, 0, t.x + t.w, t.h)} />
          <Grid plane="y" at={t.y + t.d} u0={t.x + 1} u1={t.x + t.w - 1} z0={4} z1={t.h - 3} cols={4} rows={Math.round(t.h / 8)} seed={index * 7 + 3} />
          <Grid plane="x" at={t.x + t.w} u0={t.y + 1} u1={t.y + t.d - 1} z0={4} z1={t.h - 3} cols={4} rows={Math.round(t.h / 8)} seed={index * 7 + 4} />
        </Box>
      ))}
    </g>
  );
});

const HouseRows = memo(function HouseRows({ lit }: { lit: boolean }) {
  const houses: Flat[] = [];
  for (const y of [182, 228, 274]) for (const x of [16, 62, 108]) houses.push([x, y]);
  return (
    <g className={`ic-district ${lit ? "is-lit" : ""}`}>
      {houses.map(([x, y]) => (
        <House key={`${x}-${y}`} x={x} y={y} />
      ))}
    </g>
  );
});

const Factory = memo(function Factory({ lit }: { lit: boolean }) {
  const x0 = 178;
  const x1 = 238;
  const h = 14;
  const teeth = [178, 190, 202, 214, 226];
  return (
    <g className={`ic-district ${lit ? "is-lit" : ""}`}>
      <Box x={x0} y={178} w={x1 - x0} d={60} h={h}>
        <Grid plane="y" at={238} u0={x0 + 2} u1={x1 - 2} z0={3} z1={11} cols={8} rows={1} seed={31} dark={0.1} />
      </Box>
      {teeth.map((y) => (
        <g key={y}>
          <polygon className="ic-face ic-top" points={poly([[x0, y, h], [x1, y, h], [x1, y + 12, h + 6], [x0, y + 12, h + 6]])} />
          <polygon className="ic-face" points={poly([[x1, y, h], [x1, y + 12, h], [x1, y + 12, h + 6]])} />
          <polygon className="ic-saw" points={yQuad(y + 12, x0 + 1, h + 0.6, x1 - 1, h + 5.4)} />
        </g>
      ))}
      <Box x={196} y={244} w={34} d={16} h={10}>
        <Grid plane="y" at={260} u0={198} u1={228} z0={2} z1={9} cols={5} rows={1} seed={32} />
      </Box>
    </g>
  );
});

const StadiumClinic = memo(function StadiumClinic({ lit }: { lit: boolean }) {
  const field = rect(254, 216, 304, 298);
  const lines: [Vec, Vec][] = [
    [[254, 257, 0.5], [304, 257, 0.5]],
    [[268, 216, 0.5], [268, 226, 0.5]],
    [[290, 216, 0.5], [290, 226, 0.5]],
    [[268, 226, 0.5], [290, 226, 0.5]],
    [[268, 288, 0.5], [290, 288, 0.5]],
    [[268, 288, 0.5], [268, 298, 0.5]],
    [[290, 288, 0.5], [290, 298, 0.5]],
  ];
  const masts: Flat[] = [[250, 210], [308, 210], [250, 304], [308, 304]];
  return (
    <g className={`ic-district ${lit ? "is-lit" : ""}`}>
      <Box x={176} y={262} w={52} d={42} h={24}>
        <Grid plane="y" at={304} u0={178} u1={226} z0={3} z1={21} cols={6} rows={3} seed={41} />
        <Grid plane="x" at={228} u0={264} u1={302} z0={3} z1={21} cols={5} rows={3} seed={42} />
        <path className="ic-cross" d={segs([[[200, 304, 26], [200, 304, 36]], [[195, 304, 31], [205, 304, 31]]])} />
      </Box>
      <Box x={248} y={204} w={62} d={10} h={9} />
      <Box x={306} y={214} w={6} d={88} h={7} />
      <Flat className="ic-face ic-field" points={field} />
      <path className="ic-field-line" d={segs([...lines, [[254, 216, 0.5], [304, 216, 0.5]], [[304, 216, 0.5], [304, 298, 0.5]], [[304, 298, 0.5], [254, 298, 0.5]], [[254, 298, 0.5], [254, 216, 0.5]]])} />
      <ellipse className="ic-field-line" cx={r2(sx(279, 257))} cy={r2(sy(279, 257, 0.5))} rx={r2(8 * RX)} ry={r2(8 * RY)} />
      {masts.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <path className="ic-ln" d={segs([[[x, y, 0], [x, y, 40]]])} />
          <circle className="ic-flood" cx={r2(sx(x, y))} cy={r2(sy(x, y, 41))} r={2.6} />
        </g>
      ))}
    </g>
  );
});

function GridScene({ keys }: SceneProps) {
  const [on, setOn] = useState<Record<DistrictId, boolean>>(GRID_START);
  const toggle = (id: DistrictId) => setOn((current) => ({ ...current, [id]: !current[id] }));
  const blackout = () =>
    setOn((current) => {
      const any = Object.values(current).some(Boolean);
      return { A: !any, B: !any, C: !any, D: !any };
    });
  useSceneKeys(keys, (key) => {
    const id = key.toUpperCase();
    if (id === "A" || id === "B" || id === "C" || id === "D") toggle(id);
    else if (key === "x") blackout();
    else return false;
    return true;
  });
  const count = DISTRICTS.filter((d) => on[d.id]).length;
  const load = DISTRICTS.reduce((sum, d) => sum + (on[d.id] ? d.load : 0), 0);
  const status = count === 0 ? "blackout · 0 MW" : `${count}/4 districts · ${load} MW`;
  return (
    <Figure
      status={status}
      label="Miniature city on a plate: a power plant with cooling towers and a stack, a substation with a load meter and four breaker switches A to D, and transmission lines on pylons to four districts."
    >
      <g transform={`scale(1.3) ${centerOn(160, 160, 27)}`}>
        <GridGround />
        <PowerPlant />
        <Substation on={on} load={load} onToggle={toggle} />
        <Downtown lit={on.A} />
        <HouseRows lit={on.B} />
        <Factory lit={on.C} />
        <StadiumClinic lit={on.D} />
        {[
          [20, 140, "B"],
          [140, 140, "B"],
          [172, 300, "C"],
          [310, 172, "A"],
          [236, 300, "D"],
          [178, 196, "C"],
        ].map(([x, y, id]) => (
          <StreetLamp key={`${x}-${y}`} x={x as number} y={y as number} h={18} on={on[id as DistrictId]} />
        ))}
        {PYLONS.map(([x, y]) => (
          <Pylon key={`${x}-${y}`} x={x} y={y} />
        ))}
        {DISTRICTS.map((district) => (
          <g key={district.id}>
            <path className="ic-wire" d={wirePath(WIRES[district.id])} />
            {on[district.id] && <path className="ic-wire is-on" d={wirePath(WIRES[district.id])} />}
          </g>
        ))}
      </g>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Fig 7 · Intersection                                                */
/* ------------------------------------------------------------------ */

type Axis = "NS" | "EW";
type Lane = { axis: Axis; dir: 1 | -1; offset: number };
/** EW lanes run along x, NS lanes along y; `offset` is the lane's fixed coordinate. */
const LANES: Lane[] = [
  { axis: "EW", dir: 1, offset: 164 },
  { axis: "EW", dir: -1, offset: 145 },
  { axis: "NS", dir: 1, offset: 145 },
  { axis: "NS", dir: -1, offset: 164 },
];
const CAR_LEN = 24;
const CROSS_CENTER = 155;
/** Where a car's nose stops on red, per direction of travel. */
const STOP_LINE = { 1: 124, [-1]: 186 } as const;
const SPEED = 44;
const ACCEL = 90;

/** `p` is the world coordinate of the car's nose along its lane. */
type TrafficCar = { lane: number; p: number; v: number };
type TrafficSim = { time: number; green: Axis; amber: number; auto: boolean; lastSwitch: number; cars: TrafficCar[]; through: number };

const TRAFFIC_START: TrafficSim = {
  time: 0,
  green: "NS",
  amber: 0,
  auto: false,
  lastSwitch: 0,
  through: 2,
  cars: [
    { lane: 0, p: 124, v: 0 },
    { lane: 0, p: 94, v: 0 },
    { lane: 1, p: 186, v: 0 },
    { lane: 2, p: 70, v: SPEED },
    { lane: 2, p: 236, v: SPEED },
    { lane: 3, p: 262, v: SPEED },
    { lane: 3, p: 96, v: SPEED },
  ],
};

function stepTraffic(sim: TrafficSim, dt: number): TrafficSim {
  const time = sim.time + dt;
  let { green, amber, lastSwitch } = sim;
  if (amber > 0) {
    amber = Math.max(0, amber - dt);
    if (amber === 0) {
      green = green === "NS" ? "EW" : "NS";
      lastSwitch = time;
    }
  } else if (sim.auto && time - lastSwitch > 6) {
    amber = 1.4;
  }
  let through = sim.through;
  const cars = sim.cars.map((car) => {
    const { dir, axis } = LANES[car.lane];
    const gaps = sim.cars
      .filter((other) => other !== car && other.lane === car.lane && (other.p - car.p) * dir > 0)
      .map((other) => Math.abs(other.p - car.p) - CAR_LEN);
    let room = Math.min(Infinity, ...gaps) - 6;
    const red = axis !== sim.green || sim.amber > 0;
    const toLine = (STOP_LINE[dir] - car.p) * dir;
    if (red && toLine >= -0.5) room = Math.min(room, toLine);
    const braking = (car.v * car.v) / (2 * ACCEL) + 2;
    const target = room <= braking ? 0 : SPEED;
    const v = car.v + Math.sign(target - car.v) * Math.min(Math.abs(target - car.v), ACCEL * dt);
    let p = car.p + dir * Math.min(Math.max(0, v) * dt, Math.max(0, room));
    const before = (car.p - dir * CAR_LEN * 0.5 - CROSS_CENTER) * dir;
    const after = (p - dir * CAR_LEN * 0.5 - CROSS_CENTER) * dir;
    if (before < 0 && after >= 0) through += 1;
    if (dir === 1 && p > 340) p = -24;
    if (dir === -1 && p < -24) p = 340;
    return { ...car, p, v };
  });
  return { ...sim, time, green, amber, lastSwitch, cars, through };
}

const CrossingGround = memo(function CrossingGround() {
  const dashes: [Vec, Vec][] = [];
  for (let k = 12; k < 310; k += 14) {
    if (k > 120 && k < 196) continue;
    dashes.push([[k, 155, 0], [k + 7, 155, 0]], [[155, k, 0], [155, k + 7, 0]]);
  }
  const zebra: ReactNode[] = [];
  for (let k = 0; k < 7; k += 1) {
    const a = 140 + k * 5.6;
    zebra.push(
      <Flat key={`n${k}`} className="ic-mark" points={rect(a, 126, a + 2.8, 136)} />,
      <Flat key={`s${k}`} className="ic-mark" points={rect(a, 174, a + 2.8, 184)} />,
      <Flat key={`w${k}`} className="ic-mark" points={rect(126, a, 136, a + 2.8)} />,
      <Flat key={`e${k}`} className="ic-mark" points={rect(174, a, 184, a + 2.8)} />,
    );
  }
  return (
    <g>
      <Plate x0={0} y0={0} x1={320} y1={320} />
      <Flat className="ic-face ic-asph" points={rect(8, 136, 312, 174)} />
      <Flat className="ic-face ic-asph" points={rect(136, 8, 174, 312)} />
      <path className="ic-mark-line ic-thin" d={segs(dashes)} />
      {zebra}
      {[
        [126, 126],
        [184, 126],
        [126, 184],
        [184, 184],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} className="ic-pool" cx={r2(sx(x, y))} cy={r2(sy(x, y))} rx={r2(26 * RX)} ry={r2(26 * RY)} />
      ))}
    </g>
  );
});

const CornerTower = memo(function CornerTower() {
  const h = 118;
  return (
    <g className="ic-district is-lit">
      <polygon className="ic-halo is-on" points={topQuad(24, 24, 128, 128, 0)} />
      <Box x={30} y={30} w={92} d={92} h={h}>
        <Grid plane="y" at={122} u0={33} u1={119} z0={10} z1={h - 4} cols={11} rows={14} seed={77} dark={0.6} />
        <Grid plane="x" at={122} u0={33} u1={119} z0={10} z1={h - 4} cols={11} rows={14} seed={78} dark={0.6} />
        <polygon className="ic-glass is-on ic-fsoft" points={yQuad(122, 36, 1, 116, 7)} />
        <polygon className="ic-glass is-on ic-fsoft" points={xQuad(122, 36, 1, 116, 7)} />
      </Box>
      <path className="ic-edge-lit" d={`M${pt(30, 122, h)}L${pt(122, 122, h)}L${pt(122, 30, h)}`} />
      <Box x={50} y={50} z={h} w={30} d={24} h={8} />
      <Box x={88} y={84} z={h} w={14} d={14} h={5} />
      <path className="ic-ln" d={segs([[[70, 96, h], [70, 96, h + 26]]])} />
      <circle className="ic-beacon ic-blink" cx={r2(sx(70, 96))} cy={r2(sy(70, 96, h + 27))} r={1.5} />
    </g>
  );
});

const ParkingGarage = memo(function ParkingGarage() {
  const levels = [0, 10, 20, 30];
  return (
    <g>
      {levels.map((z, index) => (
        <g key={z}>
          <Box x={22} y={196} z={z} w={104} d={104} h={index === 0 ? 2 : 2.4} />
          <path className="ic-edge-lit ic-edge-soft" d={`M${pt(22, 300, z + 2)}L${pt(126, 300, z + 2)}L${pt(126, 196, z + 2)}`} />
          {index < 3 &&
            [30, 56, 82, 108].map((x) => (
              <path key={x} className="ic-ln" d={segs([[[x, 300, z + 2.4], [x, 300, z + 10]], [[126, x + 170, z + 2.4], [126, x + 170, z + 10]]])} />
            ))}
        </g>
      ))}
      <Box x={22} y={196} z={40} w={104} d={104} h={2.4}>
        <Car x={40} y={230} lit={false} />
        <Car x={80} y={260} along="y" lit={false} />
      </Box>
      <Box x={126} y={206} z={16} w={2} d={12} h={14} left="ic-board" right="ic-board" />
      <Label at={[128, 216, 19]} plane="x" size={10} spacing={0} className="ic-label-lit">
        P
      </Label>
      <Label at={[128, 236, 4]} plane="x" size={4} spacing={0.8}>
        1–4
      </Label>
    </g>
  );
});

const Bodega = memo(function Bodega() {
  return (
    <g className="ic-district is-lit">
      <Box x={196} y={26} w={100} d={96} h={48}>
        <Grid plane="y" at={122} u0={200} u1={292} z0={16} z1={44} cols={8} rows={3} seed={91} dark={0.55} />
        <Grid plane="x" at={296} u0={30} u1={118} z0={16} z1={44} cols={8} rows={3} seed={92} dark={0.55} />
        <polygon className="ic-sign" points={yQuad(122, 204, 6, 262, 12)} />
        <Label at={[208, 122, 7.6]} size={3.8} spacing={0.8} className="ic-label-lit">
          BODEGA · 7TH ST
        </Label>
        <Box x={268} y={122} z={4} w={16} d={1.5} h={6} left="ic-board" />
        <Label at={[270, 123.5, 5.6]} size={3.6} spacing={0.4} className="ic-label-lit">
          OPEN
        </Label>
      </Box>
      <path className="ic-ln" d={segs([[[262, 44, 48], [262, 44, 56]], [[278, 44, 48], [278, 44, 56]], [[262, 60, 48], [262, 60, 56]], [[278, 60, 48], [278, 60, 56]]])} />
      <Cyl x={270} y={52} z={56} h={11} r={9} />
      <Box x={212} y={44} z={48} w={20} d={14} h={6} />
    </g>
  );
});

const Cafe = memo(function Cafe() {
  return (
    <g className="ic-district is-lit">
      <Box x={196} y={196} w={100} d={100} h={22}>
        {[202, 232, 262].map((x) => (
          <polygon key={x} className="ic-glass is-on ic-fsoft" points={yQuad(296, x, 4, x + 24, 15)} />
        ))}
        {[204, 236, 266].map((y) => (
          <polygon key={y} className="ic-glass is-on ic-fsoft" points={xQuad(296, y, 4, y + 22, 15)} />
        ))}
        <polygon className="ic-sign" points={yQuad(296, 212, 17, 262, 21)} />
        <Label at={[237, 296, 17.8]} size={3.4} spacing={1} anchor="middle" className="ic-label-lit">
          COFFEE · PIE
        </Label>
      </Box>
      <Box x={224} y={236} z={22} w={44} d={4} h={12} left="ic-board" />
      <Label at={[246, 240, 25]} size={6.4} spacing={1.2} anchor="middle" className="ic-label-lit">
        CAFE 24
      </Label>
      <Box x={250} y={210} z={22} w={16} d={12} h={5} />
    </g>
  );
});

function Signal({ x, y, axis, green, amber, onPress }: { x: number; y: number; axis: Axis; green: Axis; amber: boolean; onPress: () => void }) {
  const go = green === axis && !amber;
  const caution = green === axis && amber;
  const head = axis === "NS" ? { u: 0, v: 1 } : { u: 1, v: 0 };
  const hx = x + head.u * 2;
  const hy = y + head.v * 2;
  return (
    <Hit label={`Signal ${axis}: switch the lights`} onPress={onPress}>
      <path className="ic-ln" d={segs([[[x, y, 0], [x, y, 30]]])} />
      <Box x={hx - 2} y={hy - 2} z={22} w={4} d={4} h={11} />
      {[
        [31, !go && !caution, "stop"],
        [27.5, caution, "amber"],
        [24, go, "go"],
      ].map(([z, on, key]) => (
        <circle
          key={key as string}
          className={`ic-signal ${on ? `is-on is-${key as string}` : ""}`}
          cx={r2(sx(hx + head.u * 2, hy + head.v * 2))}
          cy={r2(sy(hx + head.u * 2, hy + head.v * 2, z as number))}
          r={1.3}
        />
      ))}
    </Hit>
  );
}

function IntersectionScene({ live, keys, still }: SceneProps) {
  const [sim, setSim] = useState<TrafficSim>(TRAFFIC_START);
  useFrame(live && !still, (dt) => setSim((current) => stepTraffic(current, dt)));
  const flip = () => setSim((current) => (current.amber > 0 ? current : { ...current, amber: 1.4 }));
  useSceneKeys(keys, (key) => {
    if (key === " " || key === "Enter") flip();
    else if (key === "a") setSim((current) => ({ ...current, auto: !current.auto, lastSwitch: current.time }));
    else return false;
    return true;
  });
  const placed = sim.cars.map((car, index) => {
    const lane = LANES[car.lane];
    const along = lane.axis === "EW" ? "x" : "y";
    const rear = lane.dir === 1 ? car.p - CAR_LEN : car.p;
    const x = along === "x" ? rear : lane.offset - 5.5;
    const y = along === "y" ? rear : lane.offset - 5.5;
    return { index, lane, along, x, y } as const;
  });
  const visible = placed.filter(({ x, y }) => x > -6 && y > -6 && x < 302 && y < 302);
  const ordered = [...visible].sort((a, b) => a.x + a.y - (b.x + b.y));
  const red = sim.green === "NS" ? "EW" : "NS";
  const status = `${sim.green} ${sim.amber > 0 ? "amber" : "green"} · ${red} red · ${sim.through} cars through${sim.auto ? " · auto" : ""}`;
  const signals: { x: number; y: number; axis: Axis }[] = [
    { x: 132, y: 132, axis: "NS" },
    { x: 178, y: 132, axis: "EW" },
    { x: 132, y: 178, axis: "EW" },
    { x: 178, y: 178, axis: "NS" },
  ];
  return (
    <Figure status={status} label="Downtown crossroads with four corner buildings and traffic lights on each corner.">
      <g transform={`scale(1.26) ${centerOn(160, 160, 40)}`}>
        <CrossingGround />
        <CornerTower />
        <ParkingGarage />
        <Bodega />
        {ordered.map(({ index, lane, along, x, y }) => {
          const ahead = lane.dir;
          const nose = along === "x" ? (ahead === 1 ? x + 24 : x) : ahead === 1 ? y + 24 : y;
          const beam =
            along === "x"
              ? poly([[nose, y + 2, 1], [nose + ahead * 30, y - 4, 0], [nose + ahead * 30, y + 15, 0], [nose, y + 9, 1]])
              : poly([[x + 2, nose, 1], [x - 4, nose + ahead * 30, 0], [x + 15, nose + ahead * 30, 0], [x + 9, nose, 1]]);
          return (
            <g key={index}>
              <polygon className="ic-headbeam" points={beam} />
              <Car x={x} y={y} along={along} facing={lane.dir} />
            </g>
          );
        })}
        {signals.map((signal) => (
          <Signal key={`${signal.x}-${signal.y}`} {...signal} green={sim.green} amber={sim.amber > 0} onPress={flip} />
        ))}
        <Cafe />
      </g>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Fig 9 · Observatory                                                 */
/* ------------------------------------------------------------------ */

/** Draw flat 2D artwork onto a face: local x follows the face, local y points down. */
function OnFace({ plane, at, children }: { plane: "x" | "y"; at: Vec; children: ReactNode }) {
  const [x, y, z] = at;
  return <g transform={`matrix(${PLANE_MATRIX[plane]} ${r2(sx(x, y))} ${r2(sy(x, y, z))})`}>{children}</g>;
}

const DOME = { x: 116, y: 110, z: 60, r: 37 } as const;
const CR = { x0: 152, y0: 152, x1: 212, y1: 210 } as const;
const TERRACES = [0, 26, 52, 78];
const TERRACE_H = 14;
const TOP_Z = TERRACE_H * 3;
const STARS = (() => {
  const random = seeded(1010);
  return Array.from({ length: 26 }, () => ({ u: 3 + random() * 36, v: 3 + random() * 15, r: 0.25 + random() * 0.55, d: random() * 3 }));
})();

/** Point on the dome at azimuth a and elevation e (radians). */
const domePoint = (a: number, e: number): Vec => [
  DOME.x + DOME.r * Math.cos(e) * Math.cos(a),
  DOME.y + DOME.r * Math.cos(e) * Math.sin(a),
  DOME.z + DOME.r * Math.sin(e),
];

const ObservatoryHill = memo(function ObservatoryHill() {
  const road: Vec[] = [
    [28, 287, 0], [287, 287, 0], [287, 60, 0],
    [261, 34, TERRACE_H], [261, 261, TERRACE_H], [56, 261, TERRACE_H],
    [30, 235, TERRACE_H * 2], [235, 235, TERRACE_H * 2], [235, 100, TERRACE_H * 2],
    [209, 82, TOP_Z],
  ];
  const d = road.map((p, i) => `${i ? "L" : "M"}${pt(...p)}`).join("");
  const random = seeded(9);
  const strata: [Vec, Vec][] = [];
  TERRACES.forEach((inset, level) => {
    const z0 = level === 0 ? -9 : (level - 1) * TERRACE_H;
    const z1 = level === 0 ? 0 : level * TERRACE_H;
    for (let k = 0; k < 7; k += 1) {
      const z = lerp(z0, z1, 0.25 + random() * 0.5);
      const a = inset + 20 + random() * (220 - inset * 2);
      strata.push([[a, 300 - inset, z], [a + 12 + random() * 16, 300 - inset, z]]);
      strata.push([[300 - inset, a, z], [300 - inset, a + 12 + random() * 16, z]]);
    }
  });
  return (
    <g>
      <Plate x0={0} y0={0} x1={300} y1={300} />
      {TERRACES.slice(1).map((inset, index) => (
        <Plate key={inset} x0={inset} y0={inset} x1={300 - inset} y1={300 - inset} z={(index + 1) * TERRACE_H} h={TERRACE_H} r={18} inset={0} bolts={false} />
      ))}
      <path className="ic-dt ic-faint" d={segs(strata)} />
      <path className="ic-road-edge" d={d} />
      <path className="ic-road" d={d} />
      <path className="ic-road-dash" d={d} />
      {[
        [40, 40, 0],
        [244, 120, TERRACE_H],
        [110, 214, TERRACE_H * 2],
        [64, 140, TERRACE_H],
      ].map(([x, y, z]) => (
        <Prism key={`${x}-${y}`} points={chamfer(x, y, 6, 2.5)} z={z} h={4} />
      ))}
    </g>
  );
});

function DomeHouse({ az, open, onPress }: { az: number; open: boolean; onPress: () => void }) {
  const { x, y, z, r } = DOME;
  const cx = r2(sx(x, y));
  const cy = r2(sy(x, y, z));
  const R = r2(r * Math.sqrt(1.5));
  const a = (az * Math.PI) / 180;
  const facing = Math.cos(a) + Math.sin(a);
  const half = 5.5;
  const side = (sign: number, e: number): Vec => {
    const [px, py, pz] = domePoint(a, e);
    return [px - sign * half * Math.sin(a), py + sign * half * Math.cos(a), pz];
  };
  const slitPts: Vec[] = [];
  for (let k = 0; k <= 8; k += 1) slitPts.push(side(-1, (k / 8) * 1.42));
  for (let k = 8; k >= 0; k -= 1) slitPts.push(side(1, (k / 8) * 1.42));
  const ribs: string[] = [];
  for (const e of [0.42, 0.85]) {
    const pts: string[] = [];
    for (let k = -8; k <= 8; k += 1) pts.push(pt(...domePoint(Math.PI / 4 + (k / 8) * (Math.PI / 2), e)));
    ribs.push(`M${pts.join("L")}`);
  }
  for (const m of [-0.9, -0.3, 0.3, 0.9]) {
    const pts: string[] = [];
    for (let k = 0; k <= 8; k += 1) pts.push(pt(...domePoint(Math.PI / 4 + m, (k / 8) * (Math.PI / 2))));
    ribs.push(`M${pts.join("L")}`);
  }
  return (
    <Hit label={open ? "Dome: close the slit" : "Dome: open the slit"} onPress={onPress}>
      <Cyl x={x} y={y} z={TOP_Z} h={z - TOP_Z} r={r + 1} />
      <polygon className="ic-face ic-rc" points={xQuad(x + r * 0.72, y + r * 0.62, TOP_Z, y + r * 0.62 + 8, TOP_Z + 13)} />
      <path className="ic-face" d={`M${cx - R},${cy}A${R},${R} 0 0 1 ${cx + R},${cy}A${R},${r2(r * RY)} 0 0 1 ${cx - R},${cy}Z`} />
      <path className="ic-dt" d={ribs.join("")} />
      {facing > -0.15 && (
        <>
          {open && <polygon className="ic-halo is-on" points={poly(slitPts)} />}
          <polygon className={`ic-slit ${open ? "is-open" : ""}`} points={poly(slitPts)} opacity={clamp01((facing + 0.15) * 3)} />
        </>
      )}
    </Hit>
  );
}

function ControlRoom({ az, frames, flash }: { az: number; frames: number; flash: boolean }) {
  const { x0, y0, x1, y1 } = CR;
  return (
    <g>
      <Box x={x0} y={y0} z={TOP_Z} w={x1 - x0} d={y1 - y0} h={28}>
        <polygon className="ic-halo is-on" points={yQuad(y1, x0, TOP_Z + 2, x0 + 52, TOP_Z + 28)} />
        <polygon className={`ic-monitor ${flash ? "is-flash" : ""}`} points={yQuad(y1, x0 + 5, TOP_Z + 4, x0 + 49, TOP_Z + 25)} />
        <OnFace plane="y" at={[x0 + 5, y1, TOP_Z + 25]}>
          {STARS.map((star, index) => (
            <circle key={index} className="ic-star" cx={r2(star.u + 1)} cy={r2(star.v + 1.5)} r={star.r} style={{ animationDelay: `${r2(star.d)}s` }} />
          ))}
          <circle className="ic-reticle" cx={24} cy={11} r={5.5} />
          <path className="ic-reticle" d="M24 3.5v4M24 14.5v4M16.5 11h4M27.5 11h4" />
          <text className="ic-label ic-label-lit" x={2} y={4} fontSize={2.6} letterSpacing={0.3}>
            TARGET CL-10 · 7.6°
          </text>
          <text className="ic-label ic-label-lit" x={42} y={19.5} fontSize={2.4} letterSpacing={0.3} textAnchor="end">
            {`AZ ${Math.round(az)}° · FR ${String(frames).padStart(3, "0")}`}
          </text>
        </OnFace>
        <Label at={[x0 + 6, y1, TOP_Z + 1]} size={3} spacing={0.8}>
          OBS CTRL · 2
        </Label>
        <polygon className="ic-awin is-lit ic-fsoft" points={xQuad(x1, y0 + 30, TOP_Z + 13, y0 + 38, TOP_Z + 21)} />
        <polygon className="ic-face ic-rc" points={xQuad(x1, y0 + 44, TOP_Z, y0 + 54, TOP_Z + 18)} />
        {[y0 + 8, y0 + 18].map((yy) => (
          <polygon key={yy} className="ic-awin" points={xQuad(x1, yy, TOP_Z + 13, yy + 6, TOP_Z + 21)} />
        ))}
      </Box>
      <Box x={x0 + 12} y={y0 + 12} z={TOP_Z + 28} w={20} d={16} h={6} />
      <path className="ic-ln" d={segs([[[x1 - 12, y1 - 12, TOP_Z + 28], [x1 - 12, y1 - 12, TOP_Z + 52]], [[x1 - 16, y1 - 12, TOP_Z + 44], [x1 - 8, y1 - 12, TOP_Z + 44]]])} />
      <circle className="ic-beacon ic-blink" cx={r2(sx(x1 - 12, y1 - 12))} cy={r2(sy(x1 - 12, y1 - 12, TOP_Z + 53))} r={1.6} />
    </g>
  );
}

function RadioDish() {
  const x = 96;
  const y = 178;
  const z = TOP_Z;
  const cx = r2(sx(x, y));
  const top = r2(sy(x, y, z + 22));
  return (
    <g>
      <Box x={x - 4} y={y - 4} z={z} w={8} d={8} h={10} />
      <path className="ic-ln" d={segs([[[x, y, z + 10], [x, y, z + 18]]])} />
      <ellipse className="ic-face ic-top" cx={cx} cy={top} rx={11} ry={13} transform={`rotate(-28 ${cx} ${top})`} />
      <ellipse className="ic-dt" cx={cx} cy={top} rx={6} ry={7.2} transform={`rotate(-28 ${cx} ${top})`} />
      <path className="ic-ln" d={`M${cx},${top}L${r2(cx + 9)},${r2(top - 5)}`} />
      <circle className="ic-beacon ic-blink" cx={r2(cx + 9)} cy={r2(top - 5)} r={1.4} />
    </g>
  );
}

type ObservatorySim = { az: number; target: number; open: boolean; frames: number; flash: number };

function ObservatoryScene({ live, keys, still }: SceneProps) {
  const [sim, setSim] = useState<ObservatorySim>({ az: 132, target: 132, open: true, frames: 1, flash: 0 });
  const active = live && !still && (sim.az !== sim.target || sim.flash > 0);
  useFrame(active, (dt) =>
    setSim((current) => {
      const delta = current.target - current.az;
      const step = Math.sign(delta) * Math.min(Math.abs(delta), 40 * dt);
      return { ...current, az: current.az + step, flash: Math.max(0, current.flash - dt) };
    }),
  );
  const toggle = () => setSim((current) => ({ ...current, open: !current.open }));
  useSceneKeys(keys, (key) => {
    if (key === "o") toggle();
    else if (key === "ArrowLeft") setSim((current) => ({ ...current, target: current.target - 15 }));
    else if (key === "ArrowRight") setSim((current) => ({ ...current, target: current.target + 15 }));
    else if (key === " " || key === "Enter")
      setSim((current) => (current.open ? { ...current, frames: current.frames + 1, flash: 0.45 } : current));
    else return false;
    return true;
  });
  const az = ((Math.round(sim.az) % 360) + 360) % 360;
  /** Azimuth 132° puts the slit straight toward the viewer. */
  const slitAngle = sim.az - 87;
  const status = `slit ${sim.open ? "open" : "closed"} · az ${az}° · ${sim.frames} ${sim.frames === 1 ? "frame" : "frames"}`;
  return (
    <Figure
      status={status}
      label="Mountaintop observatory on terraced rock with a winding access road, a domed telescope building, a control building with a live star-field monitor, and a small radio dish."
    >
      <g transform={`scale(1.38) ${centerOn(150, 150, -4)}`}>
        <ObservatoryHill />
        <DomeHouse az={slitAngle} open={sim.open} onPress={toggle} />
        <RadioDish />
        <ControlRoom az={az} frames={sim.frames} flash={sim.flash > 0} />
      </g>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Fig 10 · Night diner                                                */
/* ------------------------------------------------------------------ */

const PRICE = 1.75;
const FLOW = 0.22;
const DINER = { x0: 22, y0: 26, x1: 196, y1: 90, h: 34 } as const;
const PUMP_Y = 172;
const DINER_R = (DINER.y1 - DINER.y0) / 2;
const PUMPS = [
  { x: 238, label: "PUMP 1" },
  { x: 276, label: "PUMP 2" },
] as const;

/** Stadium outline: straight sides along x with round ends. */
function stadium(x0: number, y0: number, x1: number, y1: number, steps = 8): Flat[] {
  const r = (y1 - y0) / 2;
  return [...arc(x1 - r, y0 + r, r, -90, 90, steps), ...arc(x0 + r, y0 + r, r, 90, 270, steps)];
}

const DinerLot = memo(function DinerLot() {
  const dashes: [Vec, Vec][] = [];
  for (let x = 16; x < 330; x += 16) dashes.push([[x, 226, 0], [x + 8, 226, 0]]);
  const stalls: [Vec, Vec][] = [];
  for (let x = 34; x <= 184; x += 22) stalls.push([[x, 120, 0], [x, 156, 0]]);
  stalls.push([[34, 156, 0], [184, 156, 0]]);
  return (
    <g>
      <Plate x0={0} y0={0} x1={340} y1={250} />
      <Flat className="ic-face ic-asph" points={rect(8, 206, 332, 244)} />
      <path className="ic-mark-line ic-thin" d={segs(dashes)} />
      <path className="ic-dt" d={segs([[[8, 204, 0], [332, 204, 0]]])} />
      <path className="ic-dt" d={segs(stalls)} />
    </g>
  );
});

const DinerBuilding = memo(function DinerBuilding({ open }: { open: boolean }) {
  const { x0, y0, x1, y1, h } = DINER;
  const outline = stadium(x0, y0, x1, y1);
  const zb = 11;
  const zt = 24;
  const panes: Flat[][] = [];
  for (let x = x0 + DINER_R + 2; x < x1 - DINER_R - 14; x += 12) panes.push([[x, y1], [x + 10.5, y1]]);
  const endArc = arc(x1 - DINER_R, y0 + DINER_R, DINER_R, -40, 88, 8);
  for (let i = 0; i < endArc.length - 1; i += 1) panes.push([endArc[i], endArc[i + 1]]);
  return (
    <g className={`ic-district ${open ? "is-lit" : ""}`}>
      <Prism points={outline} h={h} />
      <path className="ic-chrome" d={segs(panes.map(([a, b]) => [[a[0], a[1], 7], [b[0], b[1], 7]] as [Vec, Vec]))} />
      {panes.map(([a, b], index) => (
        <g key={index}>
          <polygon className="ic-awin ic-diner-win" points={poly([[a[0], a[1], zb], [b[0], b[1], zb], [b[0], b[1], zt], [a[0], a[1], zt]])} />
          <circle className="ic-stool" cx={r2(sx((a[0] + b[0]) / 2, (a[1] + b[1]) / 2))} cy={r2(sy((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, zb + 1.6))} r={1.7} />
        </g>
      ))}
      <path className="ic-counter" d={segs([[[x0 + DINER_R + 2, y1, zb + 4], [x1 - DINER_R - 14, y1, zb + 4]]])} />
      <polygon className="ic-awin ic-door" points={yQuad(y1, x1 - DINER_R - 12, 0.5, x1 - DINER_R - 4, 21)} />
      <Box x={x1 - DINER_R - 2} y={y1} z={26} w={14} d={1.4} h={4.4} left="ic-board" />
      <Label at={[x1 - DINER_R - 0.4, y1 + 1.4, 27]} size={3.2} spacing={0.4} className="ic-label-lit">
        OPEN
      </Label>
      <Box x={60} y={40} z={h} w={30} d={22} h={7}>
        <Disc x={75} y={51} z={h + 7} r={6} className="ic-dt" />
      </Box>
      <Box x={112} y={50} z={h} w={18} d={14} h={5}>
        <path className="ic-dt" d={segs([0, 3, 6, 9, 12].map((k) => [[113, 51 + k, h + 5], [129, 51 + k, h + 5]] as [Vec, Vec]))} />
      </Box>
      <Cyl x={150} y={70} z={h} h={8} r={3} />
      <Cyl x={160} y={74} z={h} h={6} r={3} />
    </g>
  );
});

const NEON = ["D", "I", "N", "E", "R"];

function PoleSign({ open, onPress }: { open: boolean; onPress: () => void }) {
  const x0 = 204;
  const x1 = 256;
  const y = 72;
  const z0 = 74;
  const z1 = 126;
  return (
    <Hit label={open ? "DINER 24 sign: switch off" : "DINER 24 sign: switch on"} onPress={onPress} className={`ic-neon ${open ? "is-on" : ""}`}>
      <Box x={227} y={64} w={6} d={6} h={z0} />
      <polygon className="ic-halo is-on ic-neon-halo" points={yQuad(y + 4, x0 - 10, z0 - 10, x1 + 10, z1 + 10)} />
      <Box x={x0} y={y - 5} z={z0} w={x1 - x0} d={5} h={z1 - z0} />
      <polygon className="ic-neon-tube" points={yQuad(y, x0 + 3.5, z0 + 3.5, x1 - 3.5, z1 - 3.5)} />
      <OnFace plane="y" at={[x0, y, z1]}>
        {NEON.map((letter, index) => (
          <text
            key={letter}
            className="ic-neon-letter"
            x={7 + index * 8.8}
            y={19}
            fontSize={12.5}
            style={{ animationDelay: `${index * 0.09}s` }}
          >
            {letter}
          </text>
        ))}
        <text className="ic-neon-letter ic-neon-24" x={26} y={39} fontSize={15} textAnchor="middle" style={{ animationDelay: "0.5s" }}>
          24
        </text>
        <path className="ic-neon-arrow" d="M5 33h8M10 30l3 3-3 3M47 33h-8M42 30l-3 3 3 3" />
      </OnFace>
    </Hit>
  );
}

function Pump({ x, label, liters, running, onPress }: { x: number; label: string; liters: number; running: boolean; onPress: () => void }) {
  const y = PUMP_Y;
  return (
    <Hit label={`${label}: ${running ? "stop" : "start"} fuelling`} onPress={onPress} className={running ? "is-running" : ""}>
      <Box x={x} y={y} z={2} w={12} d={7} h={22} />
      <polygon className="ic-pump-screen" points={yQuad(y + 7, x + 1.5, 9, x + 10.5, 21)} />
      <OnFace plane="y" at={[x + 1.5, y + 7, 21]}>
        <text className="ic-label ic-label-lit" x={4.5} y={2.6} fontSize={2.2} letterSpacing={0.2} textAnchor="middle">
          {label}
        </text>
        <text className="ic-label ic-label-lit ic-meter" x={4.5} y={6.8} fontSize={3} letterSpacing={0} textAnchor="middle">
          {`$${(liters * PRICE).toFixed(2)}`}
        </text>
        <text className="ic-label ic-label-lit" x={4.5} y={10.6} fontSize={2.4} letterSpacing={0} textAnchor="middle">
          {`${liters.toFixed(1)} L`}
        </text>
      </OnFace>
      <Box x={x + 3} y={y + 1} z={24} w={6} d={5} h={3} top={running ? "ic-lit" : ""} />
    </Hit>
  );
}

const CANOPY = { x0: 214, y0: 112, x1: 308, y1: 192, z: 48 } as const;

function FuelCanopy({ part }: { part: "back" | "roof" | "front" }) {
  const { x0, y0, x1, y1, z } = CANOPY;
  const posts = part === "back" ? [[x0 + 6, y0 + 6], [x1 - 10, y0 + 6]] : part === "front" ? [[x0 + 6, y1 - 10], [x1 - 10, y1 - 10]] : [];
  if (part !== "roof") {
    return (
      <g>
        {posts.map(([x, y]) => (
          <Box key={`${x}-${y}`} x={x} y={y} w={4} d={4} h={z} />
        ))}
      </g>
    );
  }
  return (
    <Box x={x0} y={y0} z={z} w={x1 - x0} d={y1 - y0} h={7}>
      <path className="ic-edge-lit" d={`M${pt(x0, y1, z)}L${pt(x1, y1, z)}L${pt(x1, y0, z)}`} />
      <Label at={[x0 + 26, y0 + 54, z + 7]} plane="top" size={13} spacing={4} className="ic-fuel">
        FUEL
      </Label>
    </Box>
  );
}

type DinerSim = { open: boolean; liters: [number, number]; running: [boolean, boolean]; last: 0 | 1 };

function DinerScene({ live, keys, still }: SceneProps) {
  const [sim, setSim] = useState<DinerSim>({ open: true, liters: [0.7, 0], running: [true, false], last: 0 });
  useFrame(live && !still && (sim.running[0] || sim.running[1]), (dt) =>
    setSim((current) => ({
      ...current,
      liters: current.liters.map((l, i) => (current.running[i] ? Math.min(60, l + FLOW * dt) : l)) as [number, number],
    })),
  );
  const pump = (index: 0 | 1) =>
    setSim((current) => {
      const running = [...current.running] as [boolean, boolean];
      const liters = [...current.liters] as [number, number];
      if (!running[index] && (liters[index] > 0 || current.last !== index)) liters[index] = 0;
      running[index] = !running[index];
      return { ...current, running, liters, last: index };
    });
  const flipSign = () => setSim((current) => ({ ...current, open: !current.open }));
  useSceneKeys(keys, (key) => {
    if (key === "n") flipSign();
    else if (key === "1") pump(0);
    else if (key === "2") pump(1);
    else if (key === "s") setSim((current) => ({ ...current, running: [false, false] }));
    else return false;
    return true;
  });
  const shown = sim.last;
  const pumpText =
    !sim.running[shown] && sim.liters[shown] === 0
      ? "pumps idle"
      : `pump ${shown + 1}${sim.running[shown] ? "" : " stopped"} · ${sim.liters[shown].toFixed(1)} L · $${(sim.liters[shown] * PRICE).toFixed(2)}`;
  const status = `${sim.open ? "open" : "closed"} · ${pumpText}`;
  const ring = (sim.liters[0] % 1) * Math.PI * 2;
  const carCenter: Vec = [218, 199, 14];
  const rcx = r2(sx(carCenter[0], carCenter[1]));
  const rcy = r2(sy(...carCenter));
  return (
    <Figure
      status={status}
      label="Roadside diner and gas station at night: a streamlined diner with a counter and stools behind its windows, a tall DINER 24 neon pole sign, and a canopy over two fuel pumps with a car parked at pump 1."
    >
      <g transform={`scale(1.42) ${centerOn(170, 125, -2)}`}>
        <DinerLot />
        <polygon className={`ic-halo ${sim.open ? "is-on" : ""}`} points={topQuad(CANOPY.x0, CANOPY.y0, CANOPY.x1, CANOPY.y1, 0)} />
        <DinerBuilding open={sim.open} />
        <PoleSign open={sim.open} onPress={flipSign} />
        <FuelCanopy part="back" />
        <Box x={232} y={PUMP_Y - 2} w={64} d={11} h={2} />
        {PUMPS.map((item, index) => (
          <Pump key={item.label} x={item.x} label={item.label} liters={sim.liters[index]} running={sim.running[index]} onPress={() => pump(index as 0 | 1)} />
        ))}
        <FuelCanopy part="front" />
        <path className={`ic-hose ${sim.running[0] ? "is-on" : ""}`} d={`M${pt(242, PUMP_Y + 7, 12)}Q${pt(238, 192, 2)} ${pt(226, 194, 6)}`} />
        <Car x={204} y={194} size={1.55} />
        {sim.running[0] && (
          <path
            className="ic-ring"
            d={`M${rcx - 12},${rcy}A12,12 0 ${ring > Math.PI ? 1 : 0} 1 ${r2(rcx - 12 * Math.cos(ring))},${r2(rcy - 12 * Math.sin(ring))}`}
          />
        )}
        <FuelCanopy part="roof" />
      </g>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Fig 8 · Airport                                                     */
/* ------------------------------------------------------------------ */

type Seg2 =
  | { kind: "line"; a: Flat; b: Flat; dur: number; ease?: (t: number) => number; z?: readonly [number, number] }
  | { kind: "quad"; a: Flat; c: Flat; b: Flat; dur: number };

const RUNWAY_Y = 213;
const TAXI_Y = 159;
const GATE_X = [196, 251, 306] as const;
const GATE_STOP_Y = 120;
const APPROACH = 6;
const ROLLOUT = 3.4;
const EXIT = 1.6;
const ON_RUNWAY = APPROACH + ROLLOUT + EXIT;

function airportRoute(gate: number): Seg2[] {
  const gx = GATE_X[gate];
  return [
    { kind: "line", a: [-160, RUNWAY_Y], b: [96, RUNWAY_Y], dur: APPROACH, z: [74, 0] },
    { kind: "line", a: [96, RUNWAY_Y], b: [356, RUNWAY_Y], dur: ROLLOUT, ease: easeOut },
    { kind: "quad", a: [356, RUNWAY_Y], c: [392, RUNWAY_Y], b: [392, 176], dur: EXIT },
    { kind: "quad", a: [392, 176], c: [392, TAXI_Y], b: [376, TAXI_Y], dur: 0.8 },
    { kind: "line", a: [376, TAXI_Y], b: [gx + 16, TAXI_Y], dur: (376 - gx - 16) / 46 },
    { kind: "quad", a: [gx + 16, TAXI_Y], c: [gx, TAXI_Y], b: [gx, TAXI_Y - 16], dur: 1.1 },
    { kind: "line", a: [gx, TAXI_Y - 16], b: [gx, GATE_STOP_Y], dur: 1.6, ease: easeOut },
  ];
}
const AIRPORT_ROUTES = GATE_X.map((_, gate) => airportRoute(gate));
const routeLength = (route: Seg2[]) => route.reduce((sum, seg) => sum + seg.dur, 0);

type Pose = { x: number; y: number; z: number; heading: number; leg: number };

function poseAt(route: Seg2[], t: number): Pose {
  let left = t;
  for (let leg = 0; leg < route.length; leg += 1) {
    const seg = route[leg];
    if (left <= seg.dur || leg === route.length - 1) {
      const raw = clamp01(left / seg.dur);
      if (seg.kind === "line") {
        const p = seg.ease ? seg.ease(raw) : raw;
        const glide = seg.z ? lerp(seg.z[0], seg.z[1], easeInOut(Math.min(1, raw * 1.04))) : 0;
        return {
          x: lerp(seg.a[0], seg.b[0], p),
          y: lerp(seg.a[1], seg.b[1], p),
          z: Math.max(0, glide),
          heading: Math.atan2(seg.b[1] - seg.a[1], seg.b[0] - seg.a[0]),
          leg,
        };
      }
      const u = raw;
      const x = (1 - u) ** 2 * seg.a[0] + 2 * (1 - u) * u * seg.c[0] + u * u * seg.b[0];
      const y = (1 - u) ** 2 * seg.a[1] + 2 * (1 - u) * u * seg.c[1] + u * u * seg.b[1];
      const dx = 2 * (1 - u) * (seg.c[0] - seg.a[0]) + 2 * u * (seg.b[0] - seg.c[0]);
      const dy = 2 * (1 - u) * (seg.c[1] - seg.a[1]) + 2 * u * (seg.b[1] - seg.c[1]);
      return { x, y, z: 0, heading: Math.atan2(dy, dx), leg };
    }
    left -= seg.dur;
  }
  return { x: 0, y: 0, z: 0, heading: 0, leg: 0 };
}

const PLANE_BODY: Flat[] = [[15, 0], [13, -1.5], [10, -2], [-11, -2], [-15, -0.7], [-15, 0.7], [-11, 2], [10, 2], [13, 1.5]];
const PLANE_WING: Flat[] = [[4, 2], [-3, 14.5], [-6.5, 14.5], [-4, 2], [-4, -2], [-6.5, -14.5], [-3, -14.5], [4, -2]];
const PLANE_TAIL: Flat[] = [[-10, 1.6], [-13.5, 6.5], [-15.5, 6.5], [-14, 1.2], [-14, -1.2], [-15.5, -6.5], [-13.5, -6.5], [-10, -1.6]];
const PLANE_WINDOWS = [-8, -5.5, -3, -0.5, 2, 4.5, 7, 9.5];

const PLANE_SCALE = 1.45;

function placePoint(pose: Pose, u: number, v: number, z: number): Vec {
  const c = Math.cos(pose.heading) * PLANE_SCALE;
  const s = Math.sin(pose.heading) * PLANE_SCALE;
  return [pose.x + u * c - v * s, pose.y + u * s + v * c, z];
}

function placeShape(shape: readonly Flat[], pose: Pose, z: number) {
  return shape.map(([u, v]) => pt(...placePoint(pose, u, v, z))).join(" ");
}

function Aircraft({ pose, opacity = 1, beacon }: { pose: Pose; opacity?: number; beacon: boolean }) {
  const z = pose.z + 3;
  const lights = [placePoint(pose, -5.5, 14, z), placePoint(pose, -5.5, -14, z)];
  return (
    <g className="ic-plane" opacity={opacity}>
      <polygon className="ic-shadow" points={placeShape(PLANE_WING, pose, 0)} />
      <polygon className="ic-shadow" points={placeShape(PLANE_BODY, pose, 0)} />
      <polygon className="ic-face" points={placeShape(PLANE_WING, pose, z)} />
      <polygon className="ic-face" points={placeShape(PLANE_TAIL, pose, z + 0.5)} />
      <polygon className="ic-face ic-top" points={placeShape(PLANE_BODY, pose, z + 1)} />
      {PLANE_WINDOWS.map((u) => {
        const [x, y, wz] = placePoint(pose, u, 0, z + 1.2);
        return <circle key={u} className="ic-cabin" cx={r2(sx(x, y))} cy={r2(sy(x, y, wz))} r={0.75} />;
      })}
      {lights.map(([x, y, lz], index) => (
        <circle key={index} className="ic-navlight" cx={r2(sx(x, y))} cy={r2(sy(x, y, lz))} r={1.1} />
      ))}
      {beacon && (() => {
        const [x, y, bz] = placePoint(pose, -2, 0, z + 2.4);
        return <circle className="ic-beacon ic-blink" cx={r2(sx(x, y))} cy={r2(sy(x, y, bz))} r={1.2} />;
      })()}
    </g>
  );
}

const ALS_BARS = [18, 25, 32, 39, 46, 53, 60];

const AirportGround = memo(function AirportGround({ lights }: { lights: boolean }) {
  const runwayEdges: Vec[] = [];
  for (let x = 76; x <= 466; x += 13) {
    runwayEdges.push([x, 194.5, 0], [x, 231.5, 0]);
  }
  const taxiEdges: Vec[] = [];
  for (let x = 86; x <= 452; x += 9) taxiEdges.push([x, 151, 0], [x, 167, 0]);
  const centerline: [Vec, Vec][] = [];
  for (let x = 116; x < 432; x += 18) centerline.push([[x, RUNWAY_Y, 0], [x + 10, RUNWAY_Y, 0]]);
  const fieldLights: Vec[] = [];
  for (let x = 106; x <= 440; x += 9) fieldLights.push([x, RUNWAY_Y, 0]);
  for (const x0 of [100, 390]) {
    for (let x = x0; x < x0 + 50; x += 6) fieldLights.push([x, 204, 0], [x, 222, 0]);
  }
  const piano = (x0: number) =>
    [198, 203, 208, 218, 223, 228].map((y) => (
      <Flat key={`${x0}-${y}`} className="ic-mark" points={rect(x0, y - 1.6, x0 + 12, y + 1.6)} />
    ));
  return (
    <g>
      <Plate x0={0} y0={0} x1={500} y1={290} h={9} r={16} />
      {/* Apron in front of the terminal */}
      <Flat className="ic-face ic-apron" points={rect(150, 82, 352, 150)} />
      {GATE_X.map((gx) => (
        <path
          key={gx}
          className="ic-dt"
          d={segs([
            [[gx, 150, 0], [gx, 112, 0]],
            [[gx - 10, 118, 0], [gx + 10, 118, 0]],
          ])}
        />
      ))}
      {/* Taxiway with its connectors */}
      <Flat className="ic-face ic-asph" points={rect(80, 150, 460, 168)} />
      <Flat className="ic-face ic-asph" points={rect(98, 168, 116, 193)} />
      <Flat className="ic-face ic-asph" points={[[372, 168], [400, 168], [404, 193], [362, 193]]} />
      <Flat className="ic-face ic-asph" points={rect(440, 168, 458, 193)} />
      <path className="ic-dt ic-dash" d={segs([[[84, TAXI_Y, 0], [456, TAXI_Y, 0]]])} />
      {taxiEdges.map(([x, y], index) => (
        <Lamp key={`te-${index}`} at={[x, y, 0]} size={0.75} className="ic-edl" />
      ))}
      {/* Runway 27/09 */}
      <g className={lights ? "is-on" : ""}>
        <Flat className="ic-face ic-asph" points={rect(70, 193, 472, 233)} />
        <Flat className={`ic-rwy ${lights ? "is-on" : ""}`} points={rect(71, 194, 471, 232)} />
        <Flat className={`ic-halo ic-halo-strong ${lights ? "is-on" : ""}`} points={rect(64, 190, 478, 236)} />
        <path className="ic-mark-line" d={segs(centerline)} />
        {lights &&
          fieldLights.map(([x, y], index) => (
            <circle key={`fl-${index}`} className="ic-field" cx={r2(sx(x, y))} cy={r2(sy(x, y))} r={0.8} />
          ))}
        {piano(76)}
        {piano(454)}
        {[124, 136, 392, 404].map((x) => (
          <g key={x}>
            <Flat className="ic-mark" points={rect(x, 201, x + 8, 205)} />
            <Flat className="ic-mark" points={rect(x, 221, x + 8, 225)} />
          </g>
        ))}
        <Label at={[100, 219, 0]} plane="top-y" size={10} spacing={1} className="ic-rwy-num">
          27
        </Label>
        <Label at={[446, 206, 0]} plane="top-y" size={10} spacing={1} anchor="start" className="ic-rwy-num">
          09
        </Label>
        {runwayEdges.map(([x, y], index) => (
          <Lamp key={`re-${index}`} at={[x, y, 0]} size={1} on={lights} />
        ))}
        {ALS_BARS.map((x, index) => (
          <g key={x}>
            <Box
              x={x}
              y={RUNWAY_Y - 8}
              z={0}
              w={3}
              d={16}
              h={2.2}
              className="ic-als"
              left={lights ? "ic-lit" : ""}
              right={lights ? "ic-lit" : ""}
              top={lights ? "ic-lit" : ""}
            />
            <circle
              className={`ic-strobe ${lights ? "is-on" : ""}`}
              cx={r2(sx(x + 1.5, RUNWAY_Y))}
              cy={r2(sy(x + 1.5, RUNWAY_Y, 3))}
              r={1.5}
              style={{ animationDelay: `${index * 0.09}s` }}
            />
          </g>
        ))}
      </g>
      <Label at={[18, 236, 0]} plane="top" size={5} spacing={1}>
        ALS
      </Label>
      <Label at={[214, 250, 0]} plane="top" size={6} spacing={1.2}>
        RWY 27 / 09 · 1150 m
      </Label>
      {GATE_X.map((gx, index) => (
        <Label key={gx} at={[gx + 6, 140, 0]} plane="top" size={5} spacing={1}>
          {`A${index + 1}`}
        </Label>
      ))}
    </g>
  );
});

const AirportBuildings = memo(function AirportBuildings() {
  const ribs: [Vec, Vec][] = [];
  for (let x = 24; x < 98; x += 6) ribs.push([[x, 20, 26], [x, 84, 26]]);
  return (
    <g>
      {/* Hangar 2 */}
      <Box x={18} y={20} w={80} d={64} h={26}>
        <path className="ic-dt" d={segs(ribs)} />
        <polygon className="ic-face ic-rc" points={yQuad(84, 28, 0, 88, 19)} />
        <path
          className="ic-dt"
          d={segs([28, 40, 52, 64, 76].map((x) => [[x + 6, 84, 0], [x + 6, 84, 19]] as [Vec, Vec]))}
        />
        <Label at={[30, 84, 21.2]} size={4.5} spacing={0.8}>
          HANGAR 2
        </Label>
        <polygon className="ic-glass is-on" points={xQuad(98, 30, 12, 40, 18)} />
      </Box>
      {/* Terminal A */}
      <Box x={160} y={26} w={180} d={54} h={24}>
        {[0, 1, 2, 3, 4, 5].map((panel) => {
          const x0 = 166 + panel * 28.5;
          return <polygon key={panel} className="ic-glass is-on ic-fsoft" points={yQuad(80, x0, 6, x0 + 25, 17)} />;
        })}
        <path
          className="ic-mull"
          d={segs(
            Array.from({ length: 24 }, (_, i) => [[170 + i * 7, 80, 6], [170 + i * 7, 80, 17]] as [Vec, Vec]),
          )}
        />
        <polygon className="ic-glass is-on" points={xQuad(340, 34, 6, 74, 17)} />
        <Label at={[166, 80, 19.5]} size={4.6} spacing={1.4}>
          TERMINAL A · ARRIVALS
        </Label>
        {[186, 246, 300].map((x) => (
          <Box key={x} x={x} y={40} z={24} w={18} d={14} h={5}>
            <Disc x={x + 9} y={47} z={29} r={4} className="ic-dt" />
          </Box>
        ))}
      </Box>
      {/* Jet bridges A1–A3 */}
      {GATE_X.map((gx) => (
        <g key={gx}>
          <path className="ic-ln" d={segs([[[gx - 9, 101, 0], [gx - 9, 101, 8]]])} />
          <Box x={gx - 12} y={80} z={8} w={6} d={24} h={6} />
          <Box x={gx - 13.5} y={102} z={7} w={9} d={6} h={8} left="ic-rc" />
        </g>
      ))}
    </g>
  );
});

function ControlTower({ onPress }: { onPress: () => void }) {
  const mullions: [Vec, Vec][] = [];
  for (let i = 0; i <= 6; i += 1) {
    mullions.push([[418 + i * (28 / 6), 86, 114], [418 + i * (28 / 6), 86, 126]]);
    mullions.push([[446, 58 + i * (28 / 6), 114], [446, 58 + i * (28 / 6), 126]]);
  }
  return (
    <Hit label="Control tower: clear the next landing" onPress={onPress}>
      <Box x={418} y={58} w={28} d={28} h={6} />
      <Box x={426} y={66} z={6} w={12} d={12} h={106}>
        <Label at={[427.5, 78, 60]} size={4} spacing={0.8}>
          ATC
        </Label>
      </Box>
      <Box x={420} y={60} z={110} w={24} d={24} h={4} />
      <polygon className="ic-halo is-on" points={topQuad(410, 50, 454, 94, 114)} />
      <Box x={418} y={58} z={114} w={28} d={28} h={12} left="ic-glass is-on ic-fsoft" right="ic-glass is-on ic-fsoft" />
      <path className="ic-mull" d={segs(mullions)} />
      <Box x={416} y={56} z={126} w={32} d={32} h={3} />
      <path className="ic-ln" d={segs([[[432, 72, 129], [432, 72, 144]]])} />
      <circle className="ic-beacon ic-blink" cx={r2(sx(432, 72))} cy={r2(sy(432, 72, 145))} r={1.6} />
    </Hit>
  );
}

type Flight = { id: number; cleared: number; gate: number; leaving?: number };
type AirportSim = { time: number; flights: Flight[]; queued: number; landed: number; freeAt: number; nextId: number; lights: boolean };

const AIRPORT_START: AirportSim = {
  time: 0,
  flights: [{ id: 1, cleared: -2.4, gate: 0 }],
  queued: 1,
  landed: 0,
  freeAt: -Infinity,
  nextId: 2,
  lights: true,
};

function stepAirport(sim: AirportSim, dt: number): AirportSim {
  const time = sim.time + dt;
  let { flights, queued, landed, freeAt, nextId } = sim;
  landed += flights.filter((f) => f.cleared + APPROACH > sim.time && f.cleared + APPROACH <= time).length;
  const onRunway = flights.some((f) => time - f.cleared < ON_RUNWAY);
  if (onRunway) freeAt = time;
  flights = flights.filter((f) => f.leaving === undefined || time - f.leaving < 2.4);
  if (!onRunway && queued > 0 && time - freeAt > 1.2) {
    const parked = flights.filter((f) => f.leaving === undefined);
    const taken = new Set(parked.map((f) => f.gate));
    let gate = [0, 1, 2].find((g) => !taken.has(g));
    if (gate === undefined) {
      const oldest = parked.reduce((a, b) => (a.cleared < b.cleared ? a : b));
      gate = oldest.gate;
      flights = flights.map((f) => (f.id === oldest.id ? { ...f, leaving: time } : f));
    }
    flights = [...flights, { id: nextId, cleared: time, gate }];
    nextId += 1;
    queued -= 1;
  }
  return { ...sim, time, flights, queued, landed, freeAt, nextId };
}

function airportStatus(sim: AirportSim) {
  const inbound = sim.flights
    .filter((f) => f.leaving === undefined)
    .map((f) => ({ f, t: sim.time - f.cleared }))
    .filter(({ f, t }) => t < routeLength(AIRPORT_ROUTES[f.gate]))
    .sort((a, b) => a.t - b.t)[0];
  let phase = "standing by";
  if (inbound) {
    if (inbound.t < APPROACH) phase = "cleared to land";
    else if (inbound.t < APPROACH + ROLLOUT) phase = "rolling out";
    else phase = `taxi to A${inbound.f.gate + 1}`;
  }
  const parts = ["rwy 27", sim.lights ? "" : "lights off", phase, `${sim.landed} landed`, sim.queued > 0 ? `${sim.queued} queued` : ""];
  return parts.filter(Boolean).join(" · ");
}

function AirportScene({ live, keys, reduced, still }: SceneProps) {
  const [sim, setSim] = useState<AirportSim>(AIRPORT_START);
  useFrame(live && !still, (dt) => setSim((current) => stepAirport(current, dt)));
  const clear = () => setSim((current) => ({ ...current, queued: current.queued + 1 }));
  useSceneKeys(keys, (key) => {
    if (key === " ") clear();
    else if (key === "l") setSim((current) => ({ ...current, lights: !current.lights }));
    else return false;
    return true;
  });

  const planes = sim.flights.map((flight) => {
    const route = AIRPORT_ROUTES[flight.gate];
    let t = sim.time - flight.cleared;
    if (still && flight.id === 1) t = 3.2;
    const pose = poseAt(route, Math.min(t, routeLength(route)));
    let opacity = 1;
    if (flight.leaving !== undefined) {
      const k = clamp01((sim.time - flight.leaving) / 2.4);
      pose.y += k * 22;
      opacity = 1 - k;
    }
    return { flight, pose, opacity };
  });
  const airborne = planes.filter((p) => p.pose.z > 0.5);
  const ground = planes.filter((p) => p.pose.z <= 0.5);

  return (
    <Figure
      status={airportStatus(sim)}
      label="Regional airport: runway 27 with approach lights, taxiway, control tower, terminal with jet bridges and a hangar."
    >
      <g transform={`${centerOn(250, 150, 0)} translate(0 4)`} className={reduced ? "is-reduced" : ""}>
        <AirportGround lights={sim.lights} />
        <AirportBuildings />
        {ground.map(({ flight, pose, opacity }) => (
          <Aircraft key={flight.id} pose={pose} opacity={opacity} beacon={!still} />
        ))}
        <ControlTower onPress={clear} />
        {airborne.map(({ flight, pose, opacity }) => (
          <Aircraft key={flight.id} pose={pose} opacity={opacity} beacon={!still} />
        ))}
      </g>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

type SceneDef = { id: IsometricCitiesSceneId; title: string; hint: string; Scene: ComponentType<SceneProps> };

const SCENES: SceneDef[] = [
  { id: "tower", title: "Office tower", hint: "Click a floor · ↑↓ + space · n night shift · o all off", Scene: TowerScene },
  { id: "apartments", title: "Apartment block", hint: "Press 1–7 or the call buttons", Scene: ApartmentScene },
  { id: "lighthouse", title: "Lighthouse", hint: "Click the lantern · ← → speed · h horn", Scene: LighthouseScene },
  { id: "harbor", title: "Harbor", hint: "Space or click the crane to load · s to sail", Scene: HarborScene },
  { id: "metro", title: "Metro station", hint: "Press 1 · 2 or click a platform button", Scene: MetroScene },
  { id: "grid", title: "Power grid", hint: "Press A · B · C · D to switch districts · X blackout", Scene: GridScene },
  { id: "intersection", title: "Intersection", hint: "Click a signal or space to switch · A auto-cycle", Scene: IntersectionScene },
  { id: "airport", title: "Airport", hint: "Space or click the tower to clear a landing · L runway lights", Scene: AirportScene },
  { id: "observatory", title: "Observatory", hint: "O or click dome: slit · ←/→ rotate · space: expose", Scene: ObservatoryScene },
  { id: "diner", title: "Night diner", hint: "N or click the sign · 1 / 2 or click a pump · S stop", Scene: DinerScene },
];

const ACCENTS: { id: IsometricCitiesAccent; label: string; color: string }[] = [
  { id: "sodium", label: "Sodium", color: "#ff9a2e" },
  { id: "tungsten", label: "Tungsten", color: "#ffd166" },
  { id: "neon", label: "Neon", color: "#ff4fa3" },
  { id: "signal", label: "Signal", color: "#3ee8a0" },
  { id: "dusk", label: "Dusk", color: "#6f9dff" },
  { id: "moon", label: "Moon", color: "#dfe7f5" },
];

const SECTIONS = [
  { label: "Objects", count: 10, icon: "M8 2.2 13.3 5v6L8 13.8 2.7 11V5zM2.7 5 8 7.9 13.3 5M8 7.9v5.9" },
  { label: "Cities", count: 10, icon: "M3 13.5V6.5h4v7M7 13.5V3h6v10.5M2 13.5h12M9 5.5h2M9 8h2M9 10.5h2M4.5 9h1" },
  { label: "3D demo", count: 12, icon: "M1.8 8s2.4-4 6.2-4 6.2 4 6.2 4-2.4 4-6.2 4S1.8 8 1.8 8zM8 6.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z" },
  { label: "Lumen", count: 12, icon: "M5 2.5h6l1.2 6H3.8zM8 8.5v4M5.5 13.5h5" },
  { label: "Anatomy", count: 4, icon: "M8 2v12M3 5l10 6M13 5 3 11" },
] as const;

const FONT_HREF = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap";

const sceneIndex = (id: IsometricCitiesSceneId) => Math.max(0, SCENES.findIndex((scene) => scene.id === id));

function FilterDefs({ uid }: { uid: string }) {
  return (
    <svg className="ic-defs" aria-hidden="true" focusable="false">
      <defs>
        <filter id={`${uid}-glow`} filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-soft`} filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-bloom`} filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
    </svg>
  );
}

const filterVars = (uid: string) =>
  ({
    "--ic-glow": `url(#${uid}-glow)`,
    "--ic-soft": `url(#${uid}-soft)`,
    "--ic-bloom": `url(#${uid}-bloom)`,
  }) as CSSProperties;

function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.2 20.6 7v10L12 21.8 3.4 17V7z" fill="currentColor" />
      <path d="M12 12 20.6 7M12 12 3.4 7M12 12v9.8" fill="none" stroke="var(--bg)" strokeWidth="1.6" />
      <circle cx="12" cy="8.4" r="1.7" fill="var(--accent)" />
    </svg>
  );
}

/** Lazily mounted figure for the stacked narrow layout. */
function StackFigure({ scene, n, reduced }: { scene: SceneDef; n: number; reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const { Scene } = scene;
  return (
    <div className="ic-stack-item">
      <h3>
        <span>{String(n).padStart(2, "0")}</span>
        {scene.title}
      </h3>
      <section ref={ref} className="ic-stage" data-fig={scene.id} aria-label={`Fig ${n} · ${scene.title}`}>
        {mounted ? (
          <FrameContext value={{ n, title: scene.title, hint: scene.hint, still: false }}>
            <Scene live={visible} keys={false} reduced={reduced} />
          </FrameContext>
        ) : (
          <div className="ic-loading">Loading</div>
        )}
      </section>
    </div>
  );
}

export default function IsometricCities({
  initialScene = "tower",
  initialAccent = "sodium",
  initialTheme = "dark",
  syncHash = true,
  className = "",
}: IsometricCitiesProps) {
  const uid = `ic${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [chosen, setChosen] = useState(() => sceneIndex(initialScene));
  const [accent, setAccent] = useState<IsometricCitiesAccent>(initialAccent);
  const [theme, setTheme] = useState<IsometricCitiesTheme>(initialTheme);
  const [compact, setCompact] = useState(false);
  const [inView, setInView] = useState(false);
  /** Shortcuts only listen after the reader clicks or tabs into the component, so the page keeps its own keys. */
  const [engaged, setEngaged] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion, readMotion, () => false);
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const hashIndex = syncHash ? SCENES.findIndex(({ id }) => `#${id}` === hash) : -1;
  const active = hashIndex >= 0 ? hashIndex : chosen;
  const scene = SCENES[active];

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const resize = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < 760));
    const view = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.3), {
      threshold: [0, 0.3, 0.6, 1],
    });
    const away = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || !element.contains(event.target)) setEngaged(false);
    };
    resize.observe(element);
    view.observe(element);
    document.addEventListener("pointerdown", away);
    return () => {
      resize.disconnect();
      view.disconnect();
      document.removeEventListener("pointerdown", away);
    };
  }, []);

  const select = (index: number) => {
    setChosen(index);
    if (!syncHash) return;
    window.history.replaceState(null, "", `#${SCENES[index].id}`);
    window.dispatchEvent(new Event(HASH_EVENT));
  };

  const onNavKey = (event: ReactKeyboardEvent<HTMLElement>) => {
    const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, Home: -active, End: SCENES.length - 1 - active };
    const move = moves[event.key];
    if (move === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    const next = (active + move + SCENES.length) % SCENES.length;
    select(next);
    navRef.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  };

  const swatches = (
    <div className="ic-swatches" role="radiogroup" aria-label="Glow colour">
      {ACCENTS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={accent === item.id}
          aria-label={item.label}
          title={item.label}
          className="ic-swatch"
          style={{ "--sw": item.color } as CSSProperties}
          onClick={() => setAccent(item.id)}
        >
          <i />
        </button>
      ))}
    </div>
  );

  const credit = (
    <aside className="ic-credit">
      {swatches}
      <span className="by">
        Visual reference <span className="nm">iso-glow</span>
      </span>
      <a href="https://isoglow.dev/demo/cities" target="_blank" rel="noopener noreferrer">
        by April Zhu <span className="ar">↗</span>
      </a>
      <span className="cr">Redrawn in SVG · original artwork by its author.</span>
    </aside>
  );

  return (
    <div
      ref={rootRef}
      className={`ic-root ${compact ? "is-compact" : ""} ${className}`}
      data-theme={theme}
      data-accent={accent}
      data-reduced={reduced || undefined}
      style={filterVars(uid)}
      onPointerDown={() => setEngaged(true)}
      onFocus={() => setEngaged(true)}
    >
      <ComponentStyles css={ISOMETRIC_CITIES_CSS} />
      <link rel="stylesheet" href={FONT_HREF} precedence="default" />
      <FilterDefs uid={uid} />
      <header className="ic-head">
        <span className="ic-brand">
          <BrandMark />
          iso·city <em>· demo</em>
        </span>
        <nav className="ic-seg" aria-label="Collections">
          {SECTIONS.map((section) => (
            <span
              key={section.label}
              aria-current={section.label === "Cities" ? "page" : undefined}
              aria-disabled={section.label === "Cities" ? undefined : true}
              title={section.label === "Cities" ? undefined : "Soon"}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d={section.icon} />
              </svg>
              {section.label}
              <b>{section.count}</b>
            </span>
          ))}
        </nav>
        <button
          type="button"
          className="ic-theme"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 1.8a6.2 6.2 0 0 1 0 12.4z" fill="currentColor" />
          </svg>
        </button>
      </header>

      {compact ? (
        <div className="ic-stack">
          {SCENES.map((item, index) => (
            <StackFigure key={item.id} scene={item} n={index + 1} reduced={reduced} />
          ))}
          {credit}
        </div>
      ) : (
        <div className="ic-layout">
          <nav ref={navRef} className="ic-nav" aria-label="Figures" onKeyDown={onNavKey}>
            {SCENES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className="ic-item"
                aria-current={index === active}
                onClick={(event) => {
                  select(index);
                  if (event.detail > 0) stageRef.current?.focus({ preventScroll: true });
                }}
              >
                <span className="n">{String(index + 1).padStart(2, "0")}</span>
                <span className="t">{item.title}</span>
              </button>
            ))}
          </nav>
          {credit}
          <section
            ref={stageRef}
            className="ic-stage"
            tabIndex={-1}
            data-fig={scene.id}
            aria-label={`Fig ${active + 1} · ${scene.title}`}
          >
            <FrameContext value={{ n: active + 1, title: scene.title, hint: scene.hint, still: false }}>
              <scene.Scene key={scene.id} live={inView} keys={inView && engaged} reduced={reduced} />
            </FrameContext>
          </section>
        </div>
      )}
    </div>
  );
}

/** Still preview for the gallery: one figure per `previewStep`. */
export function IsometricCitiesThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const uid = `ic${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const order = [7, 0, 5, 9, 2, 6, 3, 8, 4, 1];
  const step = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) % order.length : 0;
  const index = order[step];
  const scene = SCENES[index];
  return (
    <div className={`ic-root ic-thumb ${className}`} data-theme="dark" data-accent="sodium" style={filterVars(uid)} aria-hidden="true" inert>
      <ComponentStyles css={ISOMETRIC_CITIES_CSS} />
      <FilterDefs uid={uid} />
      <div className="ic-thumb-art">
        <FrameContext value={{ n: index + 1, title: scene.title, hint: scene.hint, still: true }}>
          <scene.Scene live={false} keys={false} reduced still />
        </FrameContext>
      </div>
      <span className="ic-thumb-cap">
        <b>Fig {index + 1}</b> {scene.title}
      </span>
    </div>
  );
}

const ISOMETRIC_CITIES_CSS = `
.ic-root{--ic-mono:"DM Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace;color-scheme:dark;--bg:#0c0d0e;--panel:#141516;--edge:#222426;--line:#3d4144;--detail:#2b2e30;--body:#17181a;--deck:#1b1d1f;--ink:#868b8f;--ink-hi:#e6e8e9;--live:#f4f5f5;--glass:#0f1011;--recess:#0e0f10;--seg-bg:rgba(22,23,24,.85);--seg-edge:#26292b;--seg-ink:#7d8796;--accent:#ff9a2e;--accent-hi:#ffc77a;--accent-dim:color-mix(in srgb,var(--accent) 10%,transparent);--glass-on:color-mix(in srgb,var(--accent) 9%,#101112);position:relative;display:flex;flex-direction:column;width:100%;box-sizing:border-box;background:var(--bg);color:var(--ink);font-family:var(--ic-mono);font-size:13px;line-height:1.3;-webkit-font-smoothing:antialiased;container:ic/inline-size;isolation:isolate;overflow:hidden}
.ic-root *,.ic-root *::before,.ic-root *::after{box-sizing:border-box}
.ic-root[data-theme="light"]{color-scheme:light;--bg:#e9eaea;--panel:#f6f6f5;--edge:#d6d8d8;--line:#8e9397;--detail:#c3c6c8;--body:#ececeb;--deck:#f3f3f2;--ink:#6a6f73;--ink-hi:#16181a;--live:#0c0d0e;--glass:#dcdede;--recess:#e2e4e4;--seg-bg:rgba(246,246,245,.9);--seg-edge:#d6d8d8;--seg-ink:#6b7075;--glass-on:color-mix(in srgb,var(--accent) 12%,#eef0f0)}
.ic-root[data-accent="tungsten"]{--accent:#ffd166;--accent-hi:#ffe7a8}
.ic-root[data-accent="neon"]{--accent:#ff4fa3;--accent-hi:#ff9fcb}
.ic-root[data-accent="signal"]{--accent:#3ee8a0;--accent-hi:#a3f5cf}
.ic-root[data-accent="dusk"]{--accent:#6f9dff;--accent-hi:#b5ccff}
.ic-root[data-accent="moon"]{--accent:#dfe7f5;--accent-hi:#ffffff}
.ic-root[data-theme="light"][data-accent="moon"]{--accent:#273246;--accent-hi:#3d4a61}
.ic-defs{position:absolute;width:0;height:0;overflow:hidden}
.ic-root button{font:inherit;color:inherit}
.ic-root :focus-visible{outline:1px solid var(--accent);outline-offset:2px}

.ic-head{display:flex;align-items:center;gap:8px 18px;padding:14px 16px 12px}
.ic-brand{display:inline-flex;align-items:center;gap:10px;color:var(--ink-hi);font-size:13px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}
.ic-brand em{font-style:normal;font-weight:400;color:var(--seg-ink)}
.ic-brand svg{width:18px;height:18px;filter:drop-shadow(0 0 4px color-mix(in srgb,var(--accent) 55%,transparent))}
.ic-seg{display:flex;gap:2px;min-width:0;padding:3px;border:1px solid var(--seg-edge);border-radius:999px;background:var(--seg-bg);overflow-x:auto;scrollbar-width:none}
.ic-seg::-webkit-scrollbar{display:none}
.ic-seg span{display:inline-flex;flex:none;align-items:center;gap:7px;padding:5px 12px;border-radius:999px;color:var(--seg-ink);font-size:11px;letter-spacing:.06em;white-space:nowrap;cursor:default}
.ic-seg span[aria-disabled]{opacity:.85}
.ic-seg svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.2;stroke-linejoin:round;stroke-linecap:round}
.ic-seg b{font-weight:400;font-size:10px;color:var(--line)}
.ic-seg [aria-current="page"]{background:var(--bg);color:var(--ink-hi);box-shadow:inset 0 0 0 1px var(--accent)}
.ic-seg [aria-current="page"] svg{color:var(--accent)}
.ic-theme{display:grid;flex:none;place-items:center;width:30px;height:30px;margin-left:auto;padding:0;border:1px solid var(--seg-edge);border-radius:999px;background:var(--seg-bg);color:var(--ink-hi);cursor:pointer}
.ic-theme svg{width:14px;height:14px}

.ic-layout{display:grid;grid-template-columns:230px minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);gap:14px;height:clamp(600px,calc(100svh - 110px),780px);padding:0 16px 16px}
.ic-nav{display:grid;grid-column:1;grid-row:1;align-content:start;gap:4px;padding:14px;border:1px solid var(--edge);border-radius:22px;background:var(--panel)}
.ic-item{display:flex;align-items:center;gap:12px;width:100%;padding:9px 12px;border:1px solid transparent;border-radius:10px;background:none;color:var(--ink);font-size:13px;letter-spacing:.06em;text-align:left;cursor:pointer;transition:color .2s,background-color .2s,border-color .2s}
.ic-item .n{font-size:12px;color:var(--line);transition:color .2s}
.ic-item:hover{color:var(--ink-hi)}
.ic-item[aria-current="true"]{border-color:var(--edge);background:var(--bg);color:var(--ink-hi)}
.ic-item[aria-current="true"] .n{color:var(--accent)}
.ic-credit{display:grid;grid-column:1;grid-row:2;align-content:start;gap:3px;padding:0 16px 22px;font-size:12px;letter-spacing:.04em}
.ic-credit a{color:var(--ink);text-decoration:none;transition:color .2s}
.ic-credit a:hover{color:var(--ink-hi)}
.ic-credit .by,.ic-credit .ar,.ic-credit .cr{color:var(--line)}
.ic-credit .nm{color:var(--ink)}
.ic-credit .cr{margin-top:14px;font-size:11px;line-height:1.5}
.ic-swatches{display:flex;gap:4px;width:max-content;margin:0 0 14px -4px;padding:4px;border:1px solid var(--edge);border-radius:999px}
.ic-swatch{display:grid;place-items:center;width:26px;height:26px;padding:0;border:1px solid transparent;border-radius:50%;background:none;cursor:pointer}
.ic-swatch i{display:block;width:12px;height:12px;border:1px solid var(--line);border-radius:50%;background:var(--sw)}
.ic-swatch[aria-checked="true"]{border-color:var(--line)}
.ic-swatch[aria-checked="true"] i{box-shadow:0 0 10px 1px var(--sw)}
.ic-root[data-theme="light"] .ic-swatch[aria-checked="true"] i{box-shadow:0 0 0 2px var(--panel),0 0 0 3px var(--sw)}
.ic-stage{position:relative;display:grid;grid-column:2;grid-row:1 / span 2;grid-template-rows:17px minmax(0,1fr) 38px;min-width:0;min-height:0;padding:22px 26px;border:1px solid var(--edge);border-radius:22px;background:var(--panel);outline:none}
.ic-root .ic-stage:focus-visible{outline:none}
.ic-cap{display:flex;flex-wrap:wrap;align-items:flex-start;align-content:flex-start;justify-content:space-between;gap:4px 18px;letter-spacing:.14em;text-transform:uppercase}
.ic-cap .hi{color:var(--ink-hi);letter-spacing:.05em;text-transform:none}
.ic-foot{align-content:flex-end}
.ic-art{position:relative;min-height:0}
.ic-ambient{position:absolute;inset:12% 18%;background:radial-gradient(closest-side,color-mix(in srgb,var(--accent) 6%,transparent),transparent);pointer-events:none}
.ic-root[data-theme="light"] .ic-ambient{display:none}
.ic-art>.ic-svg{position:absolute;inset:0}
.ic-svg{display:block;width:100%;height:100%;overflow:visible;user-select:none;-webkit-user-select:none}

.ic-stack{display:grid;gap:26px;padding:6px 16px 24px}
.ic-stack-item h3{display:flex;gap:10px;margin:0 0 10px;color:var(--accent);font-size:12px;font-weight:500;letter-spacing:.14em;text-transform:uppercase}
.ic-stack-item h3 span{opacity:.7}
.ic-stack .ic-stage{height:clamp(320px,82cqw,460px);grid-template-rows:auto minmax(0,1fr) auto;gap:8px;padding:16px}
.ic-stack .ic-cap{font-size:11px}
.ic-stack .ic-credit{grid-row:auto;grid-column:auto;padding:8px 0 0}
.ic-loading{display:grid;grid-row:1 / -1;place-items:center;color:var(--line);font-size:11px;letter-spacing:.14em;text-transform:uppercase}
@container ic (max-width:760px){.ic-head{flex-wrap:wrap}.ic-seg{order:3;width:100%}}

.ic-thumb{display:grid;grid-template-rows:minmax(0,1fr) auto;height:100%;min-height:0;padding:6px 10px 10px;background:var(--panel)}
.ic-thumb-art{position:relative;min-height:0}
.ic-thumb-art>.ic-svg{position:absolute;inset:0}
.ic-thumb-cap{font-size:9px;letter-spacing:.14em;text-transform:uppercase}
.ic-thumb-cap b{margin-right:8px;color:var(--ink-hi);font-weight:400;letter-spacing:.05em;text-transform:none}

.ic-face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round;transition:fill .3s,stroke .3s}
.ic-face.ic-top{fill:var(--deck)}
.ic-face.ic-rc,.ic-face.ic-asph{fill:var(--recess)}
.ic-face.ic-apron{fill:var(--body)}
.ic-dt{fill:none;stroke:var(--detail);stroke-width:1;vector-effect:non-scaling-stroke}
.ic-ln{fill:none;stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke}
.ic-dash{stroke-dasharray:4 4}
.ic-mark{fill:var(--line)}
.ic-mark-line{fill:none;stroke:var(--line);stroke-width:2;transition:stroke .3s}
.is-on>.ic-mark-line{stroke:color-mix(in srgb,var(--accent-hi) 55%,var(--line))}
.ic-label{fill:var(--ink);font-family:var(--ic-mono);font-weight:400}
.ic-rwy-num{fill:var(--line)}
.ic-glass{fill:var(--glass);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;transition:fill .3s,stroke .3s}
.ic-glass.is-on,.ic-face.ic-glass.is-on{fill:var(--glass-on);stroke:var(--accent)}
.ic-mull{fill:none;stroke:color-mix(in srgb,var(--accent) 55%,transparent);stroke-width:1;vector-effect:non-scaling-stroke}
.ic-halo{fill:var(--accent);opacity:0;filter:var(--ic-bloom);transition:opacity .4s;pointer-events:none}
.ic-halo.is-on{opacity:.22}
.ic-halo-strong.is-on{opacity:.34}
.ic-rwy{fill:transparent;transition:fill .4s}
.ic-rwy.is-on{fill:color-mix(in srgb,var(--accent) 16%,var(--recess))}
.ic-field{fill:var(--accent-hi);filter:var(--ic-soft)}
.ic-root[data-theme="light"] .ic-halo{display:none}
.ic-lamp{fill:var(--line);transition:fill .25s}
.ic-lamp.is-on{fill:var(--accent-hi);filter:var(--ic-soft)}
.ic-edl{fill:var(--ink)}
.ic-face.ic-lit{fill:var(--accent);stroke:var(--accent-hi)}
.ic-face.ic-top.ic-lit{fill:var(--accent-hi)}
.ic-als{filter:var(--ic-soft)}
.ic-strobe{fill:transparent}
.ic-strobe.is-on{filter:var(--ic-glow);animation:ic-rabbit 1.3s linear infinite}
.ic-shadow{fill:#000;opacity:.32}
.ic-root[data-theme="light"] .ic-shadow{opacity:.1}
.ic-cabin{fill:var(--accent-hi)}
.ic-navlight{fill:var(--accent-hi);filter:var(--ic-soft)}
.ic-beacon{fill:var(--accent-hi);filter:var(--ic-glow)}
.ic-fsoft{filter:var(--ic-soft)}
.ic-faint{opacity:.55}
.ic-floor{cursor:pointer}
.ic-floor:hover .ic-band{stroke:var(--ink)}
.ic-face.ic-band{fill:var(--body)}
.ic-pn{fill:var(--recess);stroke:var(--detail);stroke-width:1;vector-effect:non-scaling-stroke;transition:fill .35s ease var(--d,0s),stroke .35s ease var(--d,0s),opacity .35s ease var(--d,0s)}
.is-lit .ic-pn{fill:var(--accent);stroke:var(--accent-hi)}
.is-lit .ic-pn.hi{fill:var(--accent-hi)}
.is-lit .ic-pn.dim{opacity:.45}
.is-lit .ic-pn.off{fill:var(--recess);stroke:var(--detail)}
.is-lit .ic-win{filter:var(--ic-soft)}
.ic-fhalo{fill:var(--accent);opacity:0;filter:var(--ic-bloom);transition:opacity .4s ease var(--d,0s);pointer-events:none}
.is-lit .ic-fhalo{opacity:.38}
.ic-root[data-theme="light"] .ic-fhalo{display:none}
.ic-cursor{fill:none;stroke:var(--accent-hi);stroke-width:1.4;vector-effect:non-scaling-stroke;filter:var(--ic-soft);pointer-events:none}
.ic-halo-lobby.is-on{opacity:.16}
.ic-beacon-halo{fill:var(--accent);opacity:.25;filter:var(--ic-bloom)}
.ic-thin{stroke-width:1.2}
.ic-awin{fill:var(--recess);stroke:var(--detail);stroke-width:1;vector-effect:non-scaling-stroke;transition:fill .4s,stroke .4s}
.ic-home.is-lit .ic-awin{fill:var(--accent);stroke:var(--accent-hi)}
.ic-home.is-lit .ic-awin:nth-child(3n){fill:var(--accent-hi)}
.ic-home.is-lit{filter:var(--ic-soft)}
.ic-home .ic-fhalo{transition:opacity .4s}
.ic-home.is-lit .ic-fhalo{opacity:.3}
.ic-label-lit{fill:var(--accent-hi)}
.ic-shaft-back{fill:var(--glass);stroke:var(--detail);stroke-width:1;vector-effect:non-scaling-stroke}
.ic-shaft-glass{fill:color-mix(in srgb,var(--glass) 35%,transparent);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke}
.ic-cable{fill:none;stroke:var(--accent);stroke-width:1.2;vector-effect:non-scaling-stroke;filter:var(--ic-soft)}
.ic-liftcar .ic-face{fill:var(--accent);stroke:var(--accent-hi)}
.ic-liftcar .ic-face.ic-top{fill:var(--accent-hi)}
.ic-liftcar{filter:var(--ic-soft)}
.ic-press .ic-face{transition:fill .6s ease-out,stroke .6s ease-out}
.ic-press.is-lit .ic-face{fill:var(--accent);stroke:var(--accent-hi);transition:none}
.ic-press.is-lit .ic-face.ic-top{fill:var(--accent-hi)}
.ic-press.is-lit{filter:var(--ic-soft)}
.ic-press-num{fill:var(--ink);pointer-events:none}
.ic-press.is-lit .ic-press-num{fill:var(--bg)}
.ic-headlight{fill:var(--accent-hi);filter:var(--ic-glow)}
.ic-wave{fill:none;stroke:var(--detail);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linecap:round}
.ic-beam{filter:var(--ic-soft);pointer-events:none;mix-blend-mode:screen}
.ic-root[data-theme="light"] .ic-beam{mix-blend-mode:multiply;opacity:.7}
.ic-face.ic-lantern{fill:var(--accent);stroke:var(--accent-hi);filter:var(--ic-soft)}
.ic-ripple{fill:none;stroke:var(--accent);stroke-width:1;vector-effect:non-scaling-stroke;pointer-events:none}
.ic-cottage-win .ic-awin{fill:var(--accent);stroke:var(--accent-hi);filter:var(--ic-soft)}
.ic-winbar{fill:none;stroke:color-mix(in srgb,var(--bg) 70%,var(--accent));stroke-width:1;vector-effect:non-scaling-stroke}
.ic-stage{overflow:hidden}
.ic-box-id{fill:var(--line)}
.ic-container.is-hot .ic-face{fill:var(--glass-on);stroke:var(--accent)}
.ic-container.is-hot .ic-face.ic-top{fill:color-mix(in srgb,var(--accent) 22%,var(--deck))}
.ic-container.is-hot .ic-rib{stroke:var(--accent-hi)}
.ic-container.is-hot .ic-box-id{fill:var(--accent-hi)}
.ic-container.is-hot{filter:var(--ic-soft)}
.ic-trolley .ic-face{stroke:var(--ink)}
.ic-spreader .ic-face{fill:var(--accent);stroke:var(--accent-hi)}
.ic-awin.is-lit{fill:var(--accent);stroke:var(--accent-hi)}
.ic-edge-lit{fill:none;stroke:var(--accent);stroke-width:2;vector-effect:non-scaling-stroke;filter:var(--ic-glow)}
.ic-face.ic-board{fill:color-mix(in srgb,var(--accent) 14%,var(--recess));stroke:var(--accent)}
.ic-sign{fill:color-mix(in srgb,var(--accent) 12%,var(--recess));stroke:var(--accent);stroke-width:1;vector-effect:non-scaling-stroke;filter:var(--ic-soft)}
.ic-carwin{fill:var(--accent);stroke:var(--accent-hi);stroke-width:1;vector-effect:non-scaling-stroke}
.ic-district .ic-awin{transition:fill .35s,stroke .35s}
.ic-district.is-lit .ic-awin{fill:var(--accent);stroke:var(--accent-hi)}
.ic-district.is-lit .ic-awin.hi{fill:var(--accent-hi)}
.ic-district.is-lit .ic-awin.off{fill:var(--recess);stroke:var(--detail)}
.ic-district.is-lit .ic-fhalo{opacity:.16}
.ic-district.is-lit{filter:var(--ic-soft)}
.ic-rim{fill:none;stroke:var(--accent);stroke-width:1.4;vector-effect:non-scaling-stroke;filter:var(--ic-glow)}
.ic-saw{fill:var(--recess);stroke:var(--detail);stroke-width:1;vector-effect:non-scaling-stroke;transition:fill .35s}
.ic-district.is-lit .ic-saw{fill:var(--accent);stroke:var(--accent-hi)}
.ic-face.ic-field{fill:var(--recess)}
.ic-field-line{fill:none;stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;transition:stroke .35s}
.ic-district.is-lit .ic-field-line{stroke:var(--accent)}
.ic-flood{fill:var(--line)}
.ic-district.is-lit .ic-flood{fill:var(--accent-hi);filter:var(--ic-glow)}
.ic-cross{fill:none;stroke:var(--line);stroke-width:2.4;vector-effect:non-scaling-stroke}
.ic-district.is-lit .ic-cross{stroke:var(--accent-hi)}
.ic-meter{font-weight:500}
.ic-wire{fill:none;stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke}
.ic-wire.is-on{stroke:var(--accent);stroke-width:1.4;stroke-dasharray:4 6;filter:var(--ic-soft);animation:ic-flow .9s linear infinite}
@keyframes ic-flow{to{stroke-dashoffset:-10}}
.ic-root[data-reduced] .ic-wire.is-on{animation:none;stroke-dasharray:none}
.ic-edge-soft{stroke-width:1.2;filter:var(--ic-soft)}
.ic-pool{fill:var(--accent);opacity:.07;filter:var(--ic-bloom);pointer-events:none}
.ic-root[data-theme="light"] .ic-pool,.ic-root[data-theme="light"] .ic-headbeam{display:none}
.ic-headbeam{fill:var(--accent);opacity:.16;filter:var(--ic-bloom);pointer-events:none}
.ic-signal{fill:var(--recess);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke}
.ic-signal.is-on{fill:var(--accent);stroke:var(--accent-hi);filter:var(--ic-glow)}
.ic-signal.is-go{fill:var(--accent-hi)}
.ic-signal.is-stop{opacity:.75}
.ic-road-edge{fill:none;stroke:var(--line);stroke-width:12;stroke-linejoin:round;stroke-linecap:round}
.ic-road{fill:none;stroke:var(--recess);stroke-width:10;stroke-linejoin:round;stroke-linecap:round}
.ic-road-dash{fill:none;stroke:var(--line);stroke-width:.8;stroke-dasharray:4 5}
.ic-slit{fill:var(--recess);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;transition:fill .5s,stroke .5s}
.ic-slit.is-open{fill:var(--accent);stroke:var(--accent-hi);filter:var(--ic-glow)}
.ic-monitor{fill:color-mix(in srgb,var(--accent) 10%,var(--recess));stroke:var(--accent);stroke-width:1.2;vector-effect:non-scaling-stroke;filter:var(--ic-soft);transition:fill .4s}
.ic-monitor.is-flash{fill:color-mix(in srgb,var(--accent) 45%,var(--recess));transition:none}
.ic-star{fill:var(--accent-hi);animation:ic-twinkle 3s ease-in-out infinite}
.ic-reticle{fill:none;stroke:var(--accent);stroke-width:.5}
@keyframes ic-twinkle{0%,100%{opacity:1}50%{opacity:.35}}
.ic-root[data-reduced] .ic-star{animation:none}
.ic-chrome{fill:none;stroke:var(--line);stroke-width:1.6;vector-effect:non-scaling-stroke}
.ic-stool{fill:var(--recess);opacity:0;transition:opacity .35s}
.ic-district.is-lit .ic-stool{opacity:1}
.ic-counter{fill:none;stroke:var(--recess);stroke-width:1.6;opacity:0;transition:opacity .35s}
.ic-district.is-lit .ic-counter{opacity:1}
.ic-neon-tube{fill:none;stroke:var(--line);stroke-width:1.4;vector-effect:non-scaling-stroke;transition:stroke .3s}
.ic-neon-letter{fill:none;stroke:var(--line);stroke-width:.6;font-family:var(--ic-mono);font-weight:500;letter-spacing:0}
.ic-neon-arrow{fill:none;stroke:var(--line);stroke-width:.7;stroke-linecap:round;stroke-linejoin:round}
.ic-neon.is-on .ic-neon-tube,.ic-neon.is-on .ic-neon-arrow{stroke:var(--accent);filter:var(--ic-glow)}
.ic-neon.is-on .ic-neon-letter{stroke:var(--accent-hi);fill:color-mix(in srgb,var(--accent) 30%,transparent);filter:var(--ic-glow);animation:ic-neon-on .9s steps(1,end) both}
.ic-neon-halo{opacity:0}
.ic-neon.is-on .ic-neon-halo{opacity:.26}
@keyframes ic-neon-on{0%{opacity:.15}20%{opacity:1}30%{opacity:.25}45%{opacity:1}55%{opacity:.4}65%,100%{opacity:1}}
.ic-root[data-reduced] .ic-neon.is-on .ic-neon-letter{animation:none}
.ic-fuel{fill:var(--line);font-weight:500}
.ic-pump-screen{fill:color-mix(in srgb,var(--accent) 12%,var(--recess));stroke:var(--accent);stroke-width:1;vector-effect:non-scaling-stroke;filter:var(--ic-soft)}
.ic-hose{fill:none;stroke:var(--line);stroke-width:1.2;vector-effect:non-scaling-stroke}
.ic-hose.is-on{stroke:var(--accent)}
.ic-ring{fill:none;stroke:var(--accent);stroke-width:1.6;vector-effect:non-scaling-stroke;stroke-linecap:round;filter:var(--ic-glow)}
.ic-door{fill:var(--accent)!important}
.ic-train{filter:none}
.ic-train .ic-carwin{filter:var(--ic-soft)}
.ic-streetlamp{fill:var(--line)}
.ic-streetlamp.is-on{fill:var(--accent-hi);filter:var(--ic-glow)}
.ic-root[data-theme="light"] .ic-beacon-halo{display:none}
.ic-fglow{filter:var(--ic-glow)}
.ic-blink{animation:ic-blink 1.4s steps(1,end) infinite}
.ic-hit{cursor:pointer;outline:none}
.ic-hit:hover .ic-face{stroke:var(--ink)}
.ic-hit:focus-visible .ic-face{stroke:var(--ink-hi)}
@keyframes ic-blink{0%,55%{opacity:1}56%,100%{opacity:.12}}
@keyframes ic-rabbit{0%,8%{fill:var(--accent-hi)}12%,100%{fill:transparent}}
.ic-root[data-reduced] .ic-blink,.ic-root[data-reduced] .ic-strobe.is-on{animation:none}
@media (prefers-reduced-motion:reduce){.ic-root *{transition-duration:.01ms!important}}
`;
