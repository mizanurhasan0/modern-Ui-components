/**
 * Desk Racer: canvas renderer. No React here.
 *
 * Coordinate system ("canonical frame"): x runs across the lanes (lane 0 at x = 0 side) and y runs
 * along the road with "ahead" pointing UP the canvas (smaller y = further ahead). Vertical screens use
 * it as is. Horizontal screens rotate the whole world by 90 degrees so lane 0 is the top lane and the
 * road scrolls right to left, cars facing right. Text, the HUD and overlays stay in screen space.
 *
 * Everything that is expensive (road tile, vehicle sprites, shadows) is pre-rendered to offscreen
 * canvases when the size or the device pixel ratio changes; the per-frame path allocates nothing.
 */

import { CAR_LENGTH, CAR_WIDTH, LANES, MAX_SPEED, VIEW_AHEAD, VIEW_BEHIND, entityLength } from "./race-state";
import type { EntityKind, RaceEvent, RaceState } from "./race-state";

export type Orientation = "horizontal" | "vertical";

export type Layout = {
  orientation: Orientation;
  /** CSS size of the canvas. */
  w: number;
  h: number;
  dpr: number;
  /** Size of the canonical frame: cross (across lanes) and along (the road). */
  cw: number;
  ch: number;
  /** Non-road width on the lane-0 / last-lane side, kerb excluded. */
  shL: number;
  shR: number;
  kerb: number;
  roadX0: number;
  roadX1: number;
  laneW: number;
  carW: number;
  carLen: number;
  /** Screen pixels per world unit along the road. */
  ppu: number;
  /** y of the player's nose in the canonical frame. */
  noseY: number;
};

export type Renderer = {
  readonly layout: Layout;
  /** Resize the backing store and rebuild the sprites. Cheap when nothing changed. */
  resize(w: number, h: number, dpr: number): void;
  /** Drop particles, popups and the crash animation (a new run starts). */
  reset(): void;
  /** Advance the purely cosmetic state (road scroll, particles, crash animation). */
  update(state: RaceState, dt: number, reduced: boolean): void;
  /** React to engine events (coin sparkle, near-miss, crash burst). */
  handleEvents(events: readonly RaceEvent[], state: RaceState, reduced: boolean): void;
  draw(state: RaceState, reduced: boolean): void;
  /** Lane under a point given in CSS pixels relative to the canvas. */
  laneAt(x: number, y: number): number;
  /** True while something still animates after the engine has stopped (crash, particles). */
  busy(): boolean;
};

/* ------------------------------------------------------------------ constants */

const TILE_UNITS = 24;
const DASH_PERIOD = 12;
const KERB_STRIPE = 4;
const STRIPE_UNITS = 8;
const CAR_ASPECT = 1.55;
const IDLE_SPEED = 16;
const SPAWN_SPACING = 8.5;
const SIGN_SPACING = 58;

const PAINTS = ["#e8543e", "#f2b93c", "#57aa98", "#edf1ee", "#7b6ff0", "#5f6f86"];
const TRAILERS = ["#e9eeea", "#c9d8e8", "#efdcb2", "#b9cdc2", "#dde3ee", "#f1e6e1"];
const PLAYER_BLUE = "#3a86ff";
const MINT = "#9be8cf";
const AMBER = "#f2b93c";

const BIOME_STEPS = 16;
const GRASS_A = "#6f9c7f";
const GRASS_B = "#79a78a";
const SAND_A = "#dcc79a";
const SAND_B = "#e3d0a6";

const NP = 260;
const K_SPARK = 1;
const K_SMOKE = 2;
const K_SPARKLE = 3;
const K_RING = 4;
const GROUND_FOLLOW = [0, 0.3, 0.85, 1, 1];
const POPUP_SLOTS = 3;

const LENGTHS: Record<EntityKind, number> = { car: entityLength("car"), truck: entityLength("truck"), coin: entityLength("coin") };

/* ------------------------------------------------------------------ small helpers */

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function smooth(t: number): number {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
}

function hash(n: number): number {
  let x = (n | 0) + 0x6d2b79f5;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}

function hv(i: number, side: number, k: number): number {
  return hash(i * 131 + side * 977 + k * 7919);
}

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

function ramp(a: string, b: string, steps: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < steps; i++) out.push(mix(a, b, i / (steps - 1)));
  return out;
}

const SHORE_A = ramp(GRASS_A, SAND_A, BIOME_STEPS);
const SHORE_B = ramp(GRASS_B, SAND_B, BIOME_STEPS);

/** 0 = grass, 1 = sand, as a function of the distance along the world. */
function biome(world: number): number {
  const p = ((world % 2200) + 2200) % 2200;
  if (p < 700) return 0;
  if (p < 850) return smooth((p - 700) / 150);
  if (p < 1500) return 1;
  if (p < 1650) return 1 - smooth((p - 1500) / 150);
  return 0;
}

function lengthOf(kind: EntityKind): number {
  return LENGTHS[kind];
}

/** Rounded rectangle path with one radius per corner (tl, tr, br, bl). */
function rr4(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tl: number, tr: number, br: number, bl: number): void {
  c.beginPath();
  c.moveTo(x + tl, y);
  c.lineTo(x + w - tr, y);
  c.arcTo(x + w, y, x + w, y + tr, tr);
  c.lineTo(x + w, y + h - br);
  c.arcTo(x + w, y + h, x + w - br, y + h, br);
  c.lineTo(x + bl, y + h);
  c.arcTo(x, y + h, x, y + h - bl, bl);
  c.lineTo(x, y + tl);
  c.arcTo(x, y, x + tl, y, tl);
  c.closePath();
}

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  rr4(c, x, y, w, h, k, k, k, k);
}

function trapezoid(c: CanvasRenderingContext2D, y0: number, x0a: number, x0b: number, y1: number, x1a: number, x1b: number): void {
  c.beginPath();
  c.moveTo(x0a, y0);
  c.lineTo(x0b, y0);
  c.lineTo(x1b, y1);
  c.lineTo(x1a, y1);
  c.closePath();
}

/* ------------------------------------------------------------------ sprites */

type Sprite = { canvas: HTMLCanvasElement; w: number; h: number; pad: number };

function makeSprite(w: number, h: number, pad: number, dpr: number, paint: (c: CanvasRenderingContext2D) => void): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil((w + pad * 2) * dpr));
  canvas.height = Math.max(1, Math.ceil((h + pad * 2) * dpr));
  const c = canvas.getContext("2d");
  if (c) {
    c.scale(dpr, dpr);
    c.translate(pad, pad);
    paint(c);
  }
  return { canvas, w: canvas.width / dpr, h: canvas.height / dpr, pad };
}

function glass(c: CanvasRenderingContext2D, y0: number, y1: number): CanvasGradient {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, "#27406c");
  g.addColorStop(1, "#0f1a30");
  return g;
}

function paintWheels(c: CanvasRenderingContext2D, w: number, ys: number[], len: number): void {
  c.fillStyle = "#0b1426";
  for (const y of ys) {
    rr(c, -1.5, y, 3, len, 1.2);
    c.fill();
    rr(c, w - 1.5, y, 3, len, 1.2);
    c.fill();
  }
}

/** A passenger car facing up. shape: 0 sedan, 1 hatch, 2 sport. */
function paintCar(c: CanvasRenderingContext2D, w: number, h: number, base: string, shape: number, player: boolean): void {
  const hi = mix(base, "#ffffff", 0.3);
  const lo = mix(base, "#0b1428", 0.3);
  const roof = mix(base, "#ffffff", 0.18);

  paintWheels(c, w, [h * 0.15, h * 0.67], h * 0.17);

  const g = c.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, hi);
  g.addColorStop(0.45, base);
  g.addColorStop(1, lo);
  rr4(c, 0, 0, w, h, w * 0.4, w * 0.4, w * 0.27, w * 0.27);
  c.fillStyle = g;
  c.fill();
  c.lineWidth = 1;
  c.strokeStyle = "rgba(8,16,34,0.28)";
  c.stroke();

  // clip everything else to the body
  c.save();
  rr4(c, 0, 0, w, h, w * 0.4, w * 0.4, w * 0.27, w * 0.27);
  c.clip();

  // hood sheen
  c.fillStyle = "rgba(255,255,255,0.16)";
  c.beginPath();
  c.ellipse(w * 0.36, h * 0.13, w * 0.24, h * 0.07, 0, 0, Math.PI * 2);
  c.fill();

  // stripes
  if (player) {
    c.fillStyle = MINT;
    c.fillRect(w * 0.43, 0, w * 0.14, h);
    c.fillStyle = "rgba(255,255,255,0.45)";
    c.fillRect(w * 0.43, 0, w * 0.04, h);
  } else if (shape === 2) {
    c.fillStyle = "rgba(255,255,255,0.5)";
    c.fillRect(w * 0.35, 0, w * 0.09, h);
    c.fillRect(w * 0.56, 0, w * 0.09, h);
  }

  // glass and roof
  const roofTop = h * 0.37;
  const roofBot = shape === 0 ? h * 0.6 : shape === 1 ? h * 0.68 : h * 0.55;
  const rearEnd = shape === 0 ? h * 0.71 : shape === 1 ? h * 0.78 : h * 0.66;
  trapezoid(c, h * 0.235, w * 0.13, w * 0.87, roofTop, w * 0.2, w * 0.8);
  c.fillStyle = glass(c, h * 0.235, roofTop);
  c.fill();
  trapezoid(c, roofBot, w * 0.2, w * 0.8, rearEnd, w * 0.14, w * 0.86);
  c.fillStyle = glass(c, roofBot, rearEnd);
  c.fill();
  rr(c, w * 0.15, roofTop - 0.5, w * 0.7, roofBot - roofTop + 1, w * 0.1);
  c.fillStyle = roof;
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.26)";
  rr(c, w * 0.2, roofTop + 2, w * 0.2, roofBot - roofTop - 4, w * 0.08);
  c.fill();
  if (player) {
    c.fillStyle = MINT;
    c.fillRect(w * 0.45, roofTop, w * 0.1, roofBot - roofTop);
  }

  // glass glint
  c.fillStyle = "rgba(255,255,255,0.22)";
  trapezoid(c, h * 0.245, w * 0.2, w * 0.36, roofTop - 1, w * 0.26, w * 0.38);
  c.fill();

  // trunk line and spoiler
  c.strokeStyle = "rgba(8,16,34,0.2)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(w * 0.12, rearEnd + 1);
  c.lineTo(w * 0.88, rearEnd + 1);
  c.stroke();
  if (shape === 2 || player) {
    rr(c, w * 0.08, h * 0.865, w * 0.84, h * 0.055, 1.5);
    c.fillStyle = player ? "#1c3b78" : lo;
    c.fill();
  }
  c.restore();

  // mirrors
  c.fillStyle = lo;
  rr(c, -w * 0.07, h * 0.29, w * 0.1, h * 0.055, 1.4);
  c.fill();
  rr(c, w * 0.97, h * 0.29, w * 0.1, h * 0.055, 1.4);
  c.fill();

  // lights with a small glow
  c.save();
  c.shadowBlur = 5;
  c.shadowColor = "rgba(255,238,170,0.95)";
  c.fillStyle = "#fff7d6";
  rr(c, w * 0.09, h * 0.018, w * 0.25, h * 0.055, 1.8);
  c.fill();
  rr(c, w * 0.66, h * 0.018, w * 0.25, h * 0.055, 1.8);
  c.fill();
  c.shadowColor = "rgba(255,70,55,0.9)";
  c.fillStyle = "#ff5b48";
  if (shape === 2) {
    rr(c, w * 0.1, h * 0.93, w * 0.8, h * 0.04, 1.4);
    c.fill();
  } else {
    rr(c, w * 0.08, h * 0.925, w * 0.26, h * 0.05, 1.6);
    c.fill();
    rr(c, w * 0.66, h * 0.925, w * 0.26, h * 0.05, 1.6);
    c.fill();
  }
  c.restore();
}

/** Cab and trailer, facing up. */
function paintTruck(c: CanvasRenderingContext2D, w: number, h: number, cab: string, trailer: string): void {
  const cabH = h * 0.315;
  const trailTop = h * 0.345;
  const hi = mix(cab, "#ffffff", 0.3);
  const lo = mix(cab, "#0b1428", 0.32);

  paintWheels(c, w, [h * 0.07, h * 0.7, h * 0.84], h * 0.1);

  // trailer
  const tg = c.createLinearGradient(0, 0, w, 0);
  tg.addColorStop(0, mix(trailer, "#ffffff", 0.35));
  tg.addColorStop(0.5, trailer);
  tg.addColorStop(1, mix(trailer, "#0b1428", 0.26));
  rr4(c, w * 0.03, trailTop, w * 0.94, h - trailTop, w * 0.1, w * 0.1, w * 0.07, w * 0.07);
  c.fillStyle = tg;
  c.fill();
  c.strokeStyle = "rgba(8,16,34,0.3)";
  c.lineWidth = 1;
  c.stroke();
  c.save();
  rr4(c, w * 0.03, trailTop, w * 0.94, h - trailTop, w * 0.1, w * 0.1, w * 0.07, w * 0.07);
  c.clip();
  c.strokeStyle = "rgba(8,16,34,0.1)";
  for (let y = trailTop + h * 0.07; y < h; y += h * 0.07) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }
  c.fillStyle = "rgba(255,255,255,0.28)";
  c.fillRect(w * 0.16, trailTop, w * 0.16, h);
  c.fillStyle = cab;
  c.globalAlpha = 0.9;
  c.fillRect(w * 0.03, h * 0.58, w * 0.94, h * 0.075);
  c.globalAlpha = 1;
  c.restore();
  c.fillStyle = "#16233d";
  rr(c, w * 0.1, h * 0.975, w * 0.8, h * 0.02, 1);
  c.fill();

  // coupling
  c.fillStyle = "#1a2742";
  c.fillRect(w * 0.4, cabH - 1, w * 0.2, trailTop - cabH + 2);

  // cab
  const cg = c.createLinearGradient(0, 0, w, 0);
  cg.addColorStop(0, hi);
  cg.addColorStop(0.5, cab);
  cg.addColorStop(1, lo);
  rr4(c, 0, 0, w, cabH, w * 0.3, w * 0.3, w * 0.14, w * 0.14);
  c.fillStyle = cg;
  c.fill();
  c.strokeStyle = "rgba(8,16,34,0.3)";
  c.stroke();
  trapezoid(c, h * 0.05, w * 0.1, w * 0.9, h * 0.115, w * 0.17, w * 0.83);
  c.fillStyle = glass(c, h * 0.05, h * 0.115);
  c.fill();
  rr(c, w * 0.14, h * 0.125, w * 0.72, h * 0.14, w * 0.1);
  c.fillStyle = mix(cab, "#ffffff", 0.16);
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.26)";
  rr(c, w * 0.2, h * 0.135, w * 0.18, h * 0.12, w * 0.07);
  c.fill();

  // mirrors
  c.fillStyle = "#16233d";
  rr(c, -w * 0.09, h * 0.07, w * 0.12, h * 0.04, 1.4);
  c.fill();
  rr(c, w * 0.97, h * 0.07, w * 0.12, h * 0.04, 1.4);
  c.fill();

  // lights
  c.save();
  c.shadowBlur = 5;
  c.shadowColor = "rgba(255,238,170,0.95)";
  c.fillStyle = "#fff7d6";
  rr(c, w * 0.08, h * 0.012, w * 0.22, h * 0.03, 1.5);
  c.fill();
  rr(c, w * 0.7, h * 0.012, w * 0.22, h * 0.03, 1.5);
  c.fill();
  c.shadowColor = "rgba(255,70,55,0.9)";
  c.fillStyle = "#ff5b48";
  rr(c, w * 0.08, h * 0.955, w * 0.22, h * 0.022, 1.2);
  c.fill();
  rr(c, w * 0.7, h * 0.955, w * 0.22, h * 0.022, 1.2);
  c.fill();
  c.restore();
}

/** Soft blurred shadow for a vehicle footprint (baked upright; drawn offset, never rotated with the world). */
function makeShadow(w: number, h: number, dpr: number): Sprite {
  const blur = Math.max(3, w * 0.16);
  const pad = Math.ceil(blur * 2);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil((w + pad * 2) * dpr);
  canvas.height = Math.ceil((h + pad * 2) * dpr);
  const c = canvas.getContext("2d");
  if (c) {
    c.scale(dpr, dpr);
    // draw the shape far off-canvas so only its blurred shadow lands on the sprite
    const far = 2000;
    c.shadowColor = "rgba(8,18,38,0.5)";
    c.shadowBlur = blur * dpr;
    c.shadowOffsetX = far * dpr;
    rr(c, pad - far + w * 0.04, pad + h * 0.03, w * 0.92, h * 0.94, w * 0.3);
    c.fillStyle = "#000";
    c.fill();
  }
  return { canvas, w: canvas.width / dpr, h: canvas.height / dpr, pad };
}

function makeCone(w: number, h: number, narrow: number, dpr: number): Sprite {
  return makeSprite(w, h, 0, dpr, (c) => {
    const g = c.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, "rgba(255,246,205,0.26)");
    g.addColorStop(0.5, "rgba(255,246,205,0.07)");
    g.addColorStop(1, "rgba(255,246,205,0)");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(w / 2 - narrow / 2, h);
    c.lineTo(w / 2 + narrow / 2, h);
    c.lineTo(w, 0);
    c.lineTo(0, 0);
    c.closePath();
    c.fill();
  });
}

/* ------------------------------------------------------------------ renderer */

export function createRenderer(canvas: HTMLCanvasElement, fontFamily: string): Renderer | null {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;
  const c: CanvasRenderingContext2D = ctx;

  let L: Layout = {
    orientation: "horizontal",
    w: 1,
    h: 1,
    dpr: 1,
    cw: 1,
    ch: 1,
    shL: 0,
    shR: 0,
    kerb: 0,
    roadX0: 0,
    roadX1: 1,
    laneW: 1,
    carW: 1,
    carLen: 1,
    ppu: 1,
    noseY: 1,
  };
  let reqW = 0;
  let reqH = 0;
  let reqDpr = 0;
  let tile: Sprite | null = null;
  let carSprites: Sprite[] = [];
  let truckSprites: Sprite[] = [];
  let playerSprite: Sprite | null = null;
  let shadowCar: Sprite | null = null;
  let shadowTruck: Sprite | null = null;
  let cone: Sprite | null = null;
  let glow: Sprite | null = null;
  // shadow offsets in the canonical frame, and the screen scale of scenery
  let sdx = 2;
  let sdy = 3;
  let unit = 1;

  // cosmetic state
  let t = 0;
  let scroll = 0;
  let viewSpeed = IDLE_SPEED;
  let flash = 0;
  let crashDir = 1;
  let smokeTimer = 0;
  let lastStatus = "";

  // particles (struct of arrays)
  const px = new Float32Array(NP);
  const py = new Float32Array(NP);
  const pvx = new Float32Array(NP);
  const pvy = new Float32Array(NP);
  const plife = new Float32Array(NP);
  const pmax = new Float32Array(NP);
  const psize = new Float32Array(NP);
  const pseed = new Float32Array(NP);
  const pkind = new Uint8Array(NP);
  let pHead = 0;

  const popLife = new Float32Array(POPUP_SLOTS);
  const popX = new Float32Array(POPUP_SLOTS);
  const popY = new Float32Array(POPUP_SLOTS);
  let popHead = 0;

  // speed lines
  const SL = 26;
  const slX = new Float32Array(SL);
  const slV = new Float32Array(SL);
  const slO = new Float32Array(SL);
  const slLen = new Float32Array(SL);
  for (let i = 0; i < SL; i++) {
    slX[i] = hash(i * 17 + 3);
    slV[i] = 1.3 + hash(i * 17 + 5) * 1.3;
    slO[i] = hash(i * 17 + 7);
    slLen[i] = 0.06 + hash(i * 17 + 11) * 0.14;
  }

  let seed = 0x2f6e2b1;
  function rnd(): number {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  }

  /* ---------------------------------------------------------- layout and sprites */

  function computeLayout(w: number, h: number, dpr: number): Layout {
    const horizontal = w > h;
    const cw = horizontal ? h : w;
    const ch = horizontal ? w : h;
    const kerb = clamp(cw * 0.02, 3.5, 9);
    let shL: number;
    let shR: number;
    if (horizontal) {
      shL = clamp(cw * 0.15, 44, 66);
      shR = clamp(cw * 0.07, 14, 36);
    } else {
      shL = shR = clamp(cw * 0.085, 14, 42);
    }
    const free = cw - kerb * 2;
    if (shL + shR > free * 0.45) {
      const f = (free * 0.45) / (shL + shR);
      shL *= f;
      shR *= f;
    }
    const roadX0 = shL + kerb;
    const roadX1 = cw - shR - kerb;
    const laneW = (roadX1 - roadX0) / LANES;
    const carW = CAR_WIDTH * laneW;
    // The screen may show at most VIEW_BEHIND units behind the nose and VIEW_AHEAD units in front, so
    // vehicles never pop in or out of existence on screen.
    const ppuCar = (carW * CAR_ASPECT) / CAR_LENGTH;
    const ppuView = ch / (VIEW_AHEAD + VIEW_BEHIND * 0.95);
    let ppu = Math.max(ppuCar, ppuView);
    const tilePx = Math.max(1, Math.round(TILE_UNITS * ppu * dpr)) / dpr;
    ppu = tilePx / TILE_UNITS;
    const behind = Math.min(VIEW_BEHIND * 0.95 * ppu, ch * 0.4);
    return {
      orientation: horizontal ? "horizontal" : "vertical",
      w,
      h,
      dpr,
      cw,
      ch,
      shL,
      shR,
      kerb,
      roadX0,
      roadX1,
      laneW,
      carW,
      carLen: CAR_LENGTH * ppu,
      ppu,
      noseY: ch - behind,
    };
  }

  function buildTile(l: Layout): Sprite {
    const outer = 7;
    const bandW = l.roadX1 - l.roadX0 + l.kerb * 2;
    const th = TILE_UNITS * l.ppu;
    const roadW = l.roadX1 - l.roadX0;
    return makeSprite(bandW + outer * 2, th, 0, l.dpr, (g) => {
      g.translate(outer, 0);
      // asphalt
      const base = g.createLinearGradient(l.kerb, 0, l.kerb + roadW, 0);
      base.addColorStop(0, "#2b3852");
      base.addColorStop(0.5, "#38476a");
      base.addColorStop(1, "#2b3852");
      g.fillStyle = base;
      g.fillRect(l.kerb, 0, roadW, th);

      // faint wheel tracks in every lane
      for (let i = 0; i < LANES; i++) {
        const cx = l.kerb + (i + 0.5) * l.laneW;
        for (const side of [-1, 1]) {
          const tx = cx + side * l.carW * 0.28;
          const tg = g.createLinearGradient(tx - 4, 0, tx + 4, 0);
          tg.addColorStop(0, "rgba(10,18,36,0)");
          tg.addColorStop(0.5, "rgba(10,18,36,0.16)");
          tg.addColorStop(1, "rgba(10,18,36,0)");
          g.fillStyle = tg;
          g.fillRect(tx - 4, 0, 8, th);
        }
      }

      // asphalt speckle (wrapped so the tile repeats cleanly)
      let s = 0x1234abcd;
      const next = () => {
        s ^= s << 13;
        s ^= s >>> 17;
        s ^= s << 5;
        return (s >>> 0) / 4294967296;
      };
      const dots = Math.round((roadW * th) / 55);
      for (let i = 0; i < dots; i++) {
        const x = l.kerb + next() * roadW;
        const y = next() * th;
        const r = 0.5 + next() * 0.9;
        g.fillStyle = next() < 0.5 ? "rgba(255,255,255,0.07)" : "rgba(6,12,26,0.16)";
        g.fillRect(x, y, r * 1.4, r);
        if (y < 2) g.fillRect(x, y + th, r * 1.4, r);
      }
      for (let i = 0; i < 6; i++) {
        const x = l.kerb + next() * roadW;
        const y = next() * th;
        g.fillStyle = "rgba(255,255,255,0.025)";
        g.beginPath();
        g.ellipse(x, y, 10 + next() * 14, 5 + next() * 8, next() * 3, 0, Math.PI * 2);
        g.fill();
      }

      // kerb stripes
      const stripe = KERB_STRIPE * l.ppu;
      const kerbX = [0, l.kerb + roadW];
      for (const kx of kerbX) {
        for (let k = 0; k * stripe < th + 1; k++) {
          g.fillStyle = k % 2 === 0 ? "#e8543e" : "#f3f6f1";
          g.fillRect(kx, k * stripe, l.kerb, stripe + 0.5);
        }
        g.fillStyle = "rgba(8,16,34,0.18)";
        g.fillRect(kx === 0 ? 0 : kx + l.kerb - 1, 0, 1, th);
      }
      // soft shadows: kerb onto the grass, kerb onto the asphalt
      const og = g.createLinearGradient(-outer, 0, 0, 0);
      og.addColorStop(0, "rgba(10,22,40,0)");
      og.addColorStop(1, "rgba(10,22,40,0.28)");
      g.fillStyle = og;
      g.fillRect(-outer, 0, outer, th);
      const og2 = g.createLinearGradient(l.kerb + roadW + l.kerb, 0, l.kerb + roadW + l.kerb + outer, 0);
      og2.addColorStop(0, "rgba(10,22,40,0.28)");
      og2.addColorStop(1, "rgba(10,22,40,0)");
      g.fillStyle = og2;
      g.fillRect(l.kerb + roadW + l.kerb, 0, outer, th);
      const ig = g.createLinearGradient(l.kerb, 0, l.kerb + 6, 0);
      ig.addColorStop(0, "rgba(6,12,26,0.35)");
      ig.addColorStop(1, "rgba(6,12,26,0)");
      g.fillStyle = ig;
      g.fillRect(l.kerb, 0, 6, th);
      const ig2 = g.createLinearGradient(l.kerb + roadW, 0, l.kerb + roadW - 6, 0);
      ig2.addColorStop(0, "rgba(6,12,26,0.35)");
      ig2.addColorStop(1, "rgba(6,12,26,0)");
      g.fillStyle = ig2;
      g.fillRect(l.kerb + roadW - 6, 0, 6, th);

      // edge lines and dashed lane dividers
      g.fillStyle = "rgba(244,247,242,0.62)";
      g.fillRect(l.kerb + 2.5, 0, 1.6, th);
      g.fillRect(l.kerb + roadW - 4.1, 0, 1.6, th);
      const dashW = Math.max(2, l.laneW * 0.05);
      g.fillStyle = "rgba(244,247,242,0.8)";
      for (let i = 1; i < LANES; i++) {
        const x = l.kerb + i * l.laneW - dashW / 2;
        for (let k = 0; k < TILE_UNITS / DASH_PERIOD; k++) {
          rr(g, x, (k * DASH_PERIOD + 3.5) * l.ppu, dashW, 5 * l.ppu, dashW / 2);
          g.fill();
        }
      }
    });
  }

  function rebuild(): void {
    const l = L;
    tile = buildTile(l);
    const cw = l.carW;
    const ch = l.carLen;
    const truckLen = lengthOf("truck") * l.ppu;
    carSprites = [];
    for (let shape = 0; shape < 3; shape++) {
      for (let v = 0; v < PAINTS.length; v++) {
        carSprites.push(makeSprite(cw, ch, 3, l.dpr, (g) => paintCar(g, cw, ch, PAINTS[v], shape, false)));
      }
    }
    truckSprites = [];
    for (let v = 0; v < PAINTS.length; v++) {
      truckSprites.push(makeSprite(cw, truckLen, 3, l.dpr, (g) => paintTruck(g, cw, truckLen, PAINTS[v], TRAILERS[v])));
    }
    playerSprite = makeSprite(cw, ch, 3, l.dpr, (g) => paintCar(g, cw, ch, PLAYER_BLUE, 2, true));
    shadowCar = makeShadow(cw, ch, l.dpr);
    shadowTruck = makeShadow(cw, truckLen, l.dpr);
    cone = makeCone(l.laneW * 1.3, ch * 3.4, cw * 0.78, l.dpr);
    const gr = Math.max(8, l.laneW * 0.34);
    glow = makeSprite(gr * 2, gr * 2, 0, l.dpr, (g) => {
      const rg = g.createRadialGradient(gr, gr, 0, gr, gr, gr);
      rg.addColorStop(0, "rgba(255,214,102,0.55)");
      rg.addColorStop(1, "rgba(255,214,102,0)");
      g.fillStyle = rg;
      g.fillRect(0, 0, gr * 2, gr * 2);
    });

    unit = clamp(Math.min(l.laneW, 90) / 60, 0.6, 1.5);
    // light comes from the top left of the screen: offset (2.4, 3.4) screen px, expressed in the canonical frame
    const sx = 2.6 * unit;
    const sy = 3.6 * unit;
    if (l.orientation === "vertical") {
      sdx = sx;
      sdy = sy;
    } else {
      sdx = sy;
      sdy = -sx;
    }
  }

  function resize(w: number, h: number, dpr: number): void {
    const width = Math.max(1, w);
    const height = Math.max(1, h);
    if (reqW === width && reqH === height && reqDpr === dpr && tile !== null) return;
    reqW = width;
    reqH = height;
    reqDpr = dpr;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    // the real bitmap-to-CSS ratio, so a fractional CSS size still maps 1:1 onto device pixels
    L = computeLayout(width, height, canvas.width / width);
    rebuild();
  }

  /* ---------------------------------------------------------- particles */

  function spawn(kind: number, x: number, y: number, vx: number, vy: number, life: number, size: number): void {
    const i = pHead;
    pHead = (pHead + 1) % NP;
    px[i] = x;
    py[i] = y;
    pvx[i] = vx;
    pvy[i] = vy;
    plife[i] = life;
    pmax[i] = life;
    psize[i] = size;
    pseed[i] = rnd();
    pkind[i] = kind;
  }

  function popup(x: number, y: number): void {
    popLife[popHead] = 1;
    popX[popHead] = x;
    popY[popHead] = y;
    popHead = (popHead + 1) % POPUP_SLOTS;
  }

  function laneCenter(lane: number): number {
    return L.roadX0 + (lane + 0.5) * L.laneW;
  }

  function reset(): void {
    plife.fill(0);
    popLife.fill(0);
    flash = 0;
    smokeTimer = 0;
    crashDir = 1;
  }

  function burstSmoke(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      spawn(K_SMOKE, x + (rnd() - 0.5) * L.carW * 0.7, y + (rnd() - 0.5) * L.carW * 0.5, (rnd() - 0.5) * 34 * unit, -10 - rnd() * 30 * unit, 0.8 + rnd() * 0.9, L.laneW * (0.1 + rnd() * 0.1));
    }
  }

  function handleEvents(events: readonly RaceEvent[], state: RaceState, reduced: boolean): void {
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (e.type === "start") {
        reset();
      } else if (e.type === "coin") {
        if (reduced) continue;
        const x = laneCenter(e.lane);
        const y = L.noseY - (e.ahead + lengthOf("coin") / 2) * L.ppu;
        spawn(K_RING, x, y, 0, 0, 0.42, L.laneW * 0.16);
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2 + rnd() * 0.5;
          const sp = (60 + rnd() * 90) * unit;
          spawn(K_SPARKLE, x, y, Math.cos(a) * sp, Math.sin(a) * sp, 0.42 + rnd() * 0.3, (2.6 + rnd() * 2.2) * unit);
        }
      } else if (e.type === "near-miss") {
        if (reduced) continue;
        const px0 = laneCenter(state.laneX < e.lane ? state.laneX + 0.5 : state.laneX - 0.5);
        const y = L.noseY + L.carLen * 0.4;
        const side = e.lane < state.laneX ? -1 : 1;
        for (let k = 0; k < 6; k++) {
          spawn(K_SPARKLE, laneCenter(state.laneX) + side * L.carW * 0.55, y - k * L.carLen * 0.12, side * (30 + rnd() * 50) * unit, 40 + rnd() * 60, 0.3 + rnd() * 0.2, (1.8 + rnd() * 1.4) * unit);
        }
        popup(px0, L.noseY - L.carLen * 0.2);
      } else if (e.type === "crash") {
        const x = laneCenter(state.laneX);
        const y = L.noseY + L.carLen * 0.1;
        crashDir = e.lane > state.laneX ? -1 : e.lane < state.laneX ? 1 : t % 2 < 1 ? 1 : -1;
        if (reduced) continue;
        flash = 1;
        const sx = x + (laneCenter(e.lane) - x) * 0.45;
        for (let k = 0; k < 30; k++) {
          const a = rnd() * Math.PI * 2;
          const sp = (90 + rnd() * 330) * unit;
          spawn(K_SPARK, sx, y, Math.cos(a) * sp, Math.sin(a) * sp - 40 * unit, 0.28 + rnd() * 0.45, (1.2 + rnd() * 1.4) * unit);
        }
        burstSmoke(x, y + L.carLen * 0.2, 12);
      }
    }
  }

  /* ---------------------------------------------------------- update */

  function update(state: RaceState, dt: number, reduced: boolean): void {
    t += dt;
    const status = state.status;
    const idle = reduced ? 7 : IDLE_SPEED;
    let target = 0;
    let rate = 3;
    if (status === "running") {
      target = state.speed;
      rate = 10;
    } else if (status === "countdown") {
      target = state.speed;
      rate = 3.5;
    } else if (status === "ready") {
      target = idle;
    } else if (status === "crashed") {
      target = state.speed;
      rate = 8;
    }
    if (status !== "paused") viewSpeed += (target - viewSpeed) * (1 - Math.exp(-rate * dt));
    scroll += viewSpeed * dt * (reduced ? 0.7 : 1);
    if (status !== lastStatus) {
      if (status === "countdown" || status === "ready") flash = 0;
      lastStatus = status;
    }

    if (flash > 0) flash = Math.max(0, flash - dt * 3.2);

    const drift = viewSpeed * L.ppu * dt;
    for (let i = 0; i < NP; i++) {
      if (plife[i] <= 0) continue;
      plife[i] -= dt;
      if (plife[i] <= 0) {
        plife[i] = 0;
        continue;
      }
      const k = pkind[i];
      const f = Math.exp(-(k === K_SPARK ? 2.4 : k === K_SMOKE ? 1.5 : 3) * dt);
      pvx[i] *= f;
      pvy[i] *= f;
      px[i] += pvx[i] * dt;
      py[i] += pvy[i] * dt + drift * GROUND_FOLLOW[k];
    }
    for (let i = 0; i < POPUP_SLOTS; i++) if (popLife[i] > 0) popLife[i] = Math.max(0, popLife[i] - dt * 1.25);

    if (status === "crashed" && !reduced && state.crashTime < 1.8) {
      smokeTimer -= dt;
      if (smokeTimer <= 0) {
        smokeTimer = 0.06;
        burstSmoke(laneCenter(state.laneX), L.noseY + L.carLen * 0.35, 1);
      }
    }
  }

  function busy(): boolean {
    if (flash > 0) return true;
    for (let i = 0; i < NP; i++) if (plife[i] > 0) return true;
    for (let i = 0; i < POPUP_SLOTS; i++) if (popLife[i] > 0) return true;
    return false;
  }

  /* ---------------------------------------------------------- drawing */

  function setBase(ox: number, oy: number): void {
    const d = L.dpr;
    if (L.orientation === "vertical") c.setTransform(d, 0, 0, d, ox * d, oy * d);
    else c.setTransform(0, d, -d, 0, (L.w + ox) * d, oy * d);
  }

  function snap(v: number): number {
    return Math.round(v * L.dpr) / L.dpr;
  }

  function drawSprite(s: Sprite, x: number, y: number): void {
    c.drawImage(s.canvas, snap(x - s.pad), snap(y - s.pad), s.w, s.h);
  }

  function drawShoulders(aMin: number, aMax: number): void {
    const stripeH = STRIPE_UNITS * L.ppu;
    const k0 = Math.floor((scroll + aMin) / STRIPE_UNITS);
    const k1 = Math.floor((scroll + aMax) / STRIPE_UNITS);
    const over = 24;
    for (let k = k0; k <= k1; k++) {
      const world = k * STRIPE_UNITS;
      const yBottom = L.noseY - (world - scroll) * L.ppu;
      const step = Math.round(biome(world + STRIPE_UNITS / 2) * (BIOME_STEPS - 1));
      c.fillStyle = (k & 1) === 0 ? SHORE_A[step] : SHORE_B[step];
      const y = Math.floor(yBottom - stripeH);
      const hh = Math.ceil(stripeH) + 1;
      c.fillRect(-over, y, L.roadX0 + over + 2, hh);
      c.fillRect(L.roadX1 - 2, y, L.cw - L.roadX1 + over + 2, hh);
    }
  }

  function treeShadow(x: number, y: number, r: number): void {
    c.fillStyle = "rgba(10,28,28,0.2)";
    c.beginPath();
    c.arc(x + sdx * (r / 9) * 1.4, y + sdy * (r / 9) * 1.4, r * 1.02, 0, Math.PI * 2);
    c.fill();
  }

  function canopy(x: number, y: number, r: number, kind: number, tone: number): void {
    if (kind === 0) {
      // round tree
      c.fillStyle = tone < 0.5 ? "#4a8468" : "#52906f";
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = tone < 0.5 ? "#5c9a7b" : "#66a584";
      c.beginPath();
      c.arc(x - r * 0.12, y - r * 0.14, r * 0.74, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "rgba(255,255,255,0.16)";
      c.beginPath();
      c.arc(x - r * 0.3, y - r * 0.34, r * 0.34, 0, Math.PI * 2);
      c.fill();
    } else if (kind === 1) {
      // pine: stacked rings
      c.fillStyle = "#3b7660";
      c.beginPath();
      c.arc(x, y, r * 0.92, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#468569";
      c.beginPath();
      c.arc(x, y, r * 0.66, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#58987a";
      c.beginPath();
      c.arc(x - r * 0.06, y - r * 0.08, r * 0.36, 0, Math.PI * 2);
      c.fill();
    } else {
      // palm: a handful of leaves
      c.fillStyle = "#6a9a5a";
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + tone;
        c.beginPath();
        c.ellipse(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.55, r * 0.2, a, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = "#4d7f43";
      c.beginPath();
      c.arc(x, y, r * 0.2, 0, Math.PI * 2);
      c.fill();
    }
  }

  function bush(x: number, y: number, r: number, sand: boolean): void {
    c.fillStyle = "rgba(10,28,28,0.18)";
    c.beginPath();
    c.arc(x + sdx * 0.6, y + sdy * 0.6, r * 1.1, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = sand ? "#a99363" : "#5a9376";
    c.beginPath();
    c.arc(x - r * 0.45, y + r * 0.1, r * 0.7, 0, Math.PI * 2);
    c.arc(x + r * 0.5, y - r * 0.05, r * 0.62, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = sand ? "#bda676" : "#6aa788";
    c.beginPath();
    c.arc(x, y - r * 0.15, r * 0.78, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.18)";
    c.beginPath();
    c.arc(x - r * 0.25, y - r * 0.38, r * 0.3, 0, Math.PI * 2);
    c.fill();
  }

  function rock(x: number, y: number, r: number, seedV: number, sand: boolean): void {
    c.fillStyle = "rgba(10,28,28,0.2)";
    c.beginPath();
    c.ellipse(x + sdx * 0.7, y + sdy * 0.7, r * 1.05, r * 0.85, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = sand ? "#b9ab93" : "#8d9c97";
    c.beginPath();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + seedV * 2;
      const rad = r * (0.78 + hash(i * 31 + ((seedV * 1000) | 0)) * 0.34);
      const vx = x + Math.cos(a) * rad;
      const vy = y + Math.sin(a) * rad * 0.85;
      if (i === 0) c.moveTo(vx, vy);
      else c.lineTo(vx, vy);
    }
    c.closePath();
    c.fill();
    c.fillStyle = sand ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.22)";
    c.beginPath();
    c.arc(x - r * 0.22, y - r * 0.24, r * 0.4, 0, Math.PI * 2);
    c.fill();
  }

  function cactus(x: number, y: number, r: number): void {
    c.fillStyle = "rgba(60,40,10,0.2)";
    c.beginPath();
    c.ellipse(x + sdx * 0.6, y + sdy * 0.6, r * 0.8, r * 0.8, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#5d9a72";
    rr(c, x - r * 0.28, y - r * 0.8, r * 0.56, r * 1.6, r * 0.28);
    c.fill();
    rr(c, x - r * 0.85, y - r * 0.25, r * 0.7, r * 0.34, r * 0.17);
    c.fill();
    rr(c, x + r * 0.15, y + r * 0.05, r * 0.7, r * 0.34, r * 0.17);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.22)";
    rr(c, x - r * 0.16, y - r * 0.7, r * 0.16, r * 1.2, r * 0.08);
    c.fill();
  }

  function tuft(x: number, y: number, r: number, tone: number, sand: boolean): void {
    if (sand) {
      c.fillStyle = "rgba(150,120,70,0.35)";
      c.beginPath();
      c.arc(x, y, r * 0.35, 0, Math.PI * 2);
      c.arc(x + r * 0.7, y + r * 0.2, r * 0.22, 0, Math.PI * 2);
      c.fill();
      return;
    }
    c.fillStyle = tone < 0.34 ? AMBER : tone < 0.67 ? "#f4f6f1" : "#ee7e6d";
    c.beginPath();
    c.arc(x, y, r * 0.28, 0, Math.PI * 2);
    c.arc(x + r * 0.7, y + r * 0.25, r * 0.22, 0, Math.PI * 2);
    c.arc(x - r * 0.55, y + r * 0.4, r * 0.2, 0, Math.PI * 2);
    c.fill();
  }

  /** pass 0: ground level things and tree shadows. pass 1: tree canopies, with a touch of parallax. */
  function drawScenery(pass: number, aMin: number, aMax: number): void {
    const i0 = Math.floor((scroll + aMin) / SPAWN_SPACING) - 1;
    const i1 = Math.floor((scroll + aMax) / SPAWN_SPACING) + 1;
    for (let side = 0; side < 2; side++) {
      const sw = side === 0 ? L.shL : L.shR;
      const scale = clamp(sw / 32, 0.55, 1.5);
      for (let i = i0; i <= i1; i++) {
        const r0 = hv(i, side, 1);
        if (r0 < 0.2) continue;
        const world = i * SPAWN_SPACING + (hv(i, side, 2) - 0.5) * SPAWN_SPACING * 0.8;
        const sand = biome(world) > 0.5;
        const lateral = 0.2 + 0.6 * hv(i, side, 3);
        const x = side === 0 ? sw * lateral : L.cw - sw * lateral;
        const yGround = L.noseY - (world - scroll) * L.ppu;
        const size = (0.65 + hv(i, side, 4) * 0.7) * scale;
        const tone = hv(i, side, 5);
        const pick = hv(i, side, 6);
        if (sand) {
          const r = 7 * size;
          if (pick < 0.2) {
            if (pass === 0) cactus(x, yGround, r);
          } else if (pick < 0.4) {
            if (pass === 0) bush(x, yGround, r, true);
          } else if (pick < 0.56) {
            if (pass === 0) rock(x, yGround, r * 0.9, tone, true);
          } else if (pick < 0.66) {
            const rp = 9 * size;
            if (pass === 0) treeShadow(x, yGround, rp * 0.9);
            else canopy(x, yGround + (yGround - L.noseY) * 0.07, rp, 2, tone);
          } else if (pass === 0) tuft(x, yGround, r, tone, true);
        } else {
          if (pick < 0.3) {
            const rt = 9 * size;
            if (pass === 0) treeShadow(x, yGround, rt);
            else canopy(x, yGround + (yGround - L.noseY) * 0.07, rt, 0, tone);
          } else if (pick < 0.42) {
            const rt = 8 * size;
            if (pass === 0) treeShadow(x, yGround, rt * 0.9);
            else canopy(x, yGround + (yGround - L.noseY) * 0.07, rt, 1, tone);
          } else if (pick < 0.58) {
            if (pass === 0) bush(x, yGround, 6 * size, false);
          } else if (pick < 0.66) {
            if (pass === 0) rock(x, yGround, 6 * size, tone, false);
          } else if (pick < 0.8 && pass === 0) tuft(x, yGround, 6 * size, tone, false);
        }
      }
    }
    if (pass !== 0) return;
    // road signs: rare, near the kerb
    const j0 = Math.floor((scroll + aMin) / SIGN_SPACING) - 1;
    const j1 = Math.floor((scroll + aMax) / SIGN_SPACING) + 1;
    for (let j = j0; j <= j1; j++) {
      if (hv(j, 9, 1) < 0.35) continue;
      const side = hv(j, 9, 2) < 0.5 ? 0 : 1;
      const sw = side === 0 ? L.shL : L.shR;
      const world = j * SIGN_SPACING + hv(j, 9, 3) * 20;
      const yy = L.noseY - (world - scroll) * L.ppu;
      const x = side === 0 ? sw * 0.5 : L.cw - sw * 0.5;
      sign(x, yy, clamp(sw * 0.2, 5, 11), Math.floor(hv(j, 9, 4) * 3));
    }
  }

  function sign(x: number, y: number, s: number, kind: number): void {
    c.fillStyle = "rgba(10,28,28,0.22)";
    rr(c, x - s + sdx * 0.9, y - s + sdy * 0.9, s * 2, s * 2, s * 0.45);
    c.fill();
    c.fillStyle = "#26334d";
    rr(c, x - s * 1.08, y - s * 1.08, s * 2.16, s * 2.16, s * 0.5);
    c.fill();
    if (kind === 0) {
      c.fillStyle = "#2f9d77";
      rr(c, x - s * 0.92, y - s * 0.92, s * 1.84, s * 1.84, s * 0.4);
      c.fill();
      c.strokeStyle = "#fff";
      c.lineWidth = Math.max(1.4, s * 0.26);
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(x - s * 0.5, y + s * 0.2);
      c.lineTo(x, y - s * 0.4);
      c.lineTo(x + s * 0.5, y + s * 0.2);
      c.stroke();
    } else if (kind === 1) {
      c.fillStyle = "#f4f6f1";
      rr(c, x - s * 0.92, y - s * 0.92, s * 1.84, s * 1.84, s * 0.9);
      c.fill();
      c.strokeStyle = "#e8543e";
      c.lineWidth = Math.max(1.4, s * 0.3);
      c.beginPath();
      c.arc(x, y, s * 0.68, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = "#26334d";
      c.fillRect(x - s * 0.36, y - s * 0.12, s * 0.72, s * 0.24);
    } else {
      c.fillStyle = AMBER;
      rr(c, x - s * 0.92, y - s * 0.92, s * 1.84, s * 1.84, s * 0.4);
      c.fill();
      c.strokeStyle = "#26334d";
      c.lineWidth = Math.max(1.4, s * 0.26);
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(x - s * 0.45, y + s * 0.5);
      c.lineTo(x - s * 0.45, y - s * 0.1);
      c.lineTo(x + s * 0.45, y - s * 0.1);
      c.moveTo(x + s * 0.1, y - s * 0.5);
      c.lineTo(x + s * 0.5, y - s * 0.1);
      c.lineTo(x + s * 0.1, y + s * 0.3);
      c.stroke();
    }
  }

  function drawRoad(): void {
    if (!tile) return;
    const th = TILE_UNITS * L.ppu;
    const off = snap((scroll * L.ppu) % th);
    const x = L.roadX0 - L.kerb - 7;
    for (let y = off - th; y < L.ch + th; y += th) {
      c.drawImage(tile.canvas, snap(x), snap(y), tile.w, tile.h + 0.5 / L.dpr);
    }
  }

  function drawCoin(x: number, y: number, phase: number): void {
    const r = clamp(lengthOf("coin") * L.ppu * 0.5, 5, L.laneW * 0.24);
    const spin = 0.2 + 0.8 * Math.abs(Math.cos(phase));
    if (glow) c.drawImage(glow.canvas, snap(x - glow.w / 2), snap(y - glow.h / 2), glow.w, glow.h);
    c.fillStyle = "rgba(8,18,38,0.22)";
    c.beginPath();
    c.ellipse(x + sdx * 0.9, y + sdy * 0.9, r * 0.9, r * 0.9, 0, 0, Math.PI * 2);
    c.fill();
    c.save();
    c.translate(x, y);
    if (L.orientation === "vertical") c.scale(spin, 1);
    else c.scale(1, spin);
    c.fillStyle = "#c98a14";
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = AMBER;
    c.beginPath();
    c.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "rgba(190,125,16,0.6)";
    c.lineWidth = r * 0.13;
    c.beginPath();
    c.arc(0, 0, r * 0.52, 0, Math.PI * 2);
    c.stroke();
    // highlight sweeping across the face
    const sweep = Math.sin(phase * 0.5) * r * 0.32;
    c.fillStyle = "rgba(255,255,255,0.62)";
    c.beginPath();
    c.ellipse(-r * 0.18 + sweep, -r * 0.3, r * 0.17, r * 0.4, 0.5, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function vehicleSprite(kind: EntityKind, id: number, variant: number): Sprite | undefined {
    const v = ((variant % PAINTS.length) + PAINTS.length) % PAINTS.length;
    if (kind === "truck") return truckSprites[v];
    return carSprites[(id % 3) * PAINTS.length + v];
  }

  function drawEntities(state: RaceState): void {
    const list = state.entities;
    // coins first so vehicles always cover them
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.kind !== "coin") continue;
      const y = L.noseY - (e.ahead + lengthOf("coin") / 2) * L.ppu;
      if (y < -30 || y > L.ch + 30) continue;
      drawCoin(laneCenter(e.lane), y, t * 5.2 + e.id * 1.7);
    }
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.kind === "coin") continue;
      const len = lengthOf(e.kind) * L.ppu;
      const top = L.noseY - (e.ahead + lengthOf(e.kind)) * L.ppu;
      if (top > L.ch + 10 || top + len < -10) continue;
      const spr = vehicleSprite(e.kind, e.id, e.variant);
      if (!spr) continue;
      const x = laneCenter(e.lane) - L.carW / 2;
      const sh = e.kind === "truck" ? shadowTruck : shadowCar;
      if (sh) c.drawImage(sh.canvas, snap(x - sh.pad + sdx), snap(top - sh.pad + sdy), sh.w, sh.h);
      drawSprite(spr, x, top);
    }
  }

  function drawPlayer(state: RaceState, reduced: boolean): void {
    if (!playerSprite || !shadowCar) return;
    const crashed = state.status === "crashed";
    let lane = state.laneX;
    if (state.status === "ready" || state.status === "countdown") lane += Math.sin(t * 1.4) * 0.025;
    let cx = laneCenter(lane);
    let cy = L.noseY + L.carLen / 2;
    let angle = clamp((state.targetLane - state.laneX) * 0.24, -0.22, 0.22);
    if (state.status === "ready") angle = Math.sin(t * 1.4) * 0.02;
    if (crashed) {
      const k = 1 - Math.exp(-state.crashTime * 3.4);
      const wob = Math.sin(state.crashTime * 11) * Math.exp(-state.crashTime * 3) * 0.08;
      angle = reduced ? crashDir * 0.25 : crashDir * (1.15 * k) + wob;
      if (!reduced) {
        cx += crashDir * L.laneW * 0.16 * k;
        cy += L.carLen * 0.1 * k;
      }
    }
    // cone and shadow stay upright; the body leans / spins
    if (cone && !crashed) {
      c.drawImage(cone.canvas, snap(cx - cone.w / 2), snap(L.noseY - cone.h + L.carLen * 0.04), cone.w, cone.h);
    }
    c.drawImage(shadowCar.canvas, snap(cx - L.carW / 2 - shadowCar.pad + sdx), snap(cy - L.carLen / 2 - shadowCar.pad + sdy), shadowCar.w, shadowCar.h);
    c.save();
    c.translate(cx, cy);
    c.rotate(angle);
    c.drawImage(playerSprite.canvas, -L.carW / 2 - playerSprite.pad, -L.carLen / 2 - playerSprite.pad, playerSprite.w, playerSprite.h);
    c.restore();
  }

  function drawParticles(): void {
    const dpx = 1 / L.dpr;
    void dpx;
    // smoke
    c.fillStyle = "#2c3a56";
    for (let i = 0; i < NP; i++) {
      if (plife[i] <= 0 || pkind[i] !== K_SMOKE) continue;
      const f = plife[i] / pmax[i];
      c.globalAlpha = 0.5 * f * Math.min(1, (1 - f) * 8 + 0.2);
      c.beginPath();
      c.arc(px[i], py[i], psize[i] * (1 + 1.9 * (1 - f)), 0, Math.PI * 2);
      c.fill();
    }
    // sparks
    c.lineCap = "round";
    for (let i = 0; i < NP; i++) {
      if (plife[i] <= 0 || pkind[i] !== K_SPARK) continue;
      const f = plife[i] / pmax[i];
      c.globalAlpha = Math.min(1, f * 1.6);
      c.strokeStyle = pseed[i] < 0.5 ? "#ffd45e" : "#fff6dc";
      c.lineWidth = psize[i];
      c.beginPath();
      c.moveTo(px[i], py[i]);
      c.lineTo(px[i] - pvx[i] * 0.05, py[i] - pvy[i] * 0.05);
      c.stroke();
    }
    // sparkles
    for (let i = 0; i < NP; i++) {
      if (plife[i] <= 0 || pkind[i] !== K_SPARKLE) continue;
      const f = plife[i] / pmax[i];
      const s = psize[i] * (0.4 + f);
      const x = px[i];
      const y = py[i];
      c.globalAlpha = Math.min(1, f * 1.8);
      c.fillStyle = pseed[i] < 0.5 ? "#fff3c4" : "#ffcf55";
      c.beginPath();
      c.moveTo(x, y - s);
      c.lineTo(x + s * 0.28, y - s * 0.28);
      c.lineTo(x + s, y);
      c.lineTo(x + s * 0.28, y + s * 0.28);
      c.lineTo(x, y + s);
      c.lineTo(x - s * 0.28, y + s * 0.28);
      c.lineTo(x - s, y);
      c.lineTo(x - s * 0.28, y - s * 0.28);
      c.closePath();
      c.fill();
    }
    // rings
    c.strokeStyle = "#ffd45e";
    c.lineWidth = 2;
    for (let i = 0; i < NP; i++) {
      if (plife[i] <= 0 || pkind[i] !== K_RING) continue;
      const f = plife[i] / pmax[i];
      c.globalAlpha = f * 0.85;
      c.beginPath();
      c.arc(px[i], py[i], psize[i] * (1 + 2.6 * (1 - f)), 0, Math.PI * 2);
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  function drawSpeedLines(state: RaceState): void {
    if (state.status !== "running") return;
    const k = clamp((state.speed / MAX_SPEED - 0.7) / 0.3, 0, 1);
    if (k <= 0) return;
    c.strokeStyle = "#ffffff";
    c.lineWidth = 1.3;
    c.lineCap = "round";
    c.globalAlpha = 0.07 + 0.2 * k;
    const span = L.ch + L.ch * 0.25;
    for (let i = 0; i < SL; i++) {
      const len = slLen[i] * L.ch * (0.6 + k * 0.7);
      const y = ((slO[i] + (t * slV[i] * (0.5 + k * 0.6)) / 1.2) % 1) * span - len;
      const x = slX[i] * L.cw;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y + len);
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  function drawPopups(): void {
    let active = false;
    for (let i = 0; i < POPUP_SLOTS; i++) if (popLife[i] > 0) active = true;
    if (!active) return;
    c.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
    c.font = `700 ${Math.round(clamp(12 * unit, 11, 15))}px ${fontFamily}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.lineJoin = "round";
    c.lineWidth = 3.5;
    for (let i = 0; i < POPUP_SLOTS; i++) {
      const life = popLife[i];
      if (life <= 0) continue;
      const age = 1 - life;
      const sx = L.orientation === "vertical" ? popX[i] : L.w - popY[i];
      const sy = L.orientation === "vertical" ? popY[i] : popX[i];
      c.globalAlpha = Math.min(1, life * 2.4) * Math.min(1, age * 8 + 0.1);
      const yy = sy - age * 26 - 8;
      c.strokeStyle = "rgba(16,28,51,0.8)";
      c.strokeText("Close call!", sx, yy);
      c.fillStyle = MINT;
      c.fillText("Close call!", sx, yy);
    }
    c.globalAlpha = 1;
  }

  function draw(state: RaceState, reduced: boolean): void {
    if (!tile) return;
    let ox = 0;
    let oy = 0;
    if (!reduced && state.shake > 0.002) {
      const a = state.shake * state.shake * 9 * unit;
      ox = Math.sin(t * 71) * a;
      oy = Math.cos(t * 59 + 1.3) * a * 0.8;
    }
    const aMin = -(L.ch - L.noseY) / L.ppu - 4;
    const aMax = L.noseY / L.ppu + 4;

    c.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
    c.fillStyle = SHORE_A[Math.round(biome(scroll) * (BIOME_STEPS - 1))];
    c.fillRect(0, 0, L.w + 1, L.h + 1);

    setBase(ox, oy);
    drawShoulders(aMin, aMax);
    drawScenery(0, aMin, aMax);
    drawRoad();
    drawEntities(state);
    drawPlayer(state, reduced);
    drawScenery(1, aMin, aMax);
    if (!reduced) {
      drawParticles();
      drawSpeedLines(state);
    }

    c.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
    if (!reduced) {
      drawPopups();
      if (flash > 0) {
        c.fillStyle = "#ffffff";
        c.globalAlpha = flash * 0.38;
        c.fillRect(0, 0, L.w, L.h);
        c.globalAlpha = 1;
      }
    }
  }

  function laneAt(x: number, y: number): number {
    const across = L.orientation === "horizontal" ? y : x;
    return clamp(Math.floor((across - L.roadX0) / L.laneW), 0, LANES - 1);
  }

  return {
    get layout() {
      return L;
    },
    resize,
    reset,
    update,
    handleEvents,
    draw,
    laneAt,
    busy,
  };
}
