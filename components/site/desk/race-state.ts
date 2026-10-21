/**
 * Desk Racer: pure game logic. No React, no DOM, no timers, no Math.random / Date: everything is
 * deterministic from a seed, so it can be tested with `node --test` and replayed.
 *
 * World model: the road runs along "ahead" (world units in front of the player's nose; negative =
 * behind) and is LANES wide. The renderer decides whether the road is drawn vertically (portrait
 * screens) or horizontally (ultrawide monitor); lane 0 is the left lane when vertical and the top
 * lane when horizontal. Traffic drives the same way as the player but slower, so it approaches.
 *
 * Longitudinal geometry (the one rule every consumer must use): the player car occupies
 * [-CAR_LENGTH, 0] along the road, its nose at 0. An entity occupies
 * [ahead, ahead + entityLength(kind)] in front of that nose.
 *
 * Engine notes
 * - `advance` runs a fixed 1/120 s sub-step (the leftover fraction is carried over), so results do not
 *   depend on the frame rate. Frames longer than MAX_FRAME_DT are clamped.
 * - The PRNG is mulberry32. `createRace` seeds it (DEFAULT_SEED when none is given) and `startRace`
 *   continues the same stream, so restarts differ from each other but replay identically.
 * - Traffic comes in waves of 1-3 obstacles that move rigidly (one speed per wave). The generator
 *   never produces an impossible layout: every wave leaves at least one lane free over its whole
 *   footprint, footprints of different waves never overlap, and the gap to the previous wave is
 *   always large enough for a player standing in the previous free lane to reach the next free lane
 *   (lane change budgeted at LANE_TIME_PER_LANE per lane plus a safety margin, at the speed the player
 *   will have when the wave arrives). Spawning does not depend on the player's position or input.
 */

export const LANES = 4;
/** The renderer draws entities with `ahead` in [-VIEW_BEHIND, VIEW_AHEAD]; the engine spawns beyond VIEW_AHEAD. */
export const VIEW_AHEAD = 100;
export const VIEW_BEHIND = 18;
/** Length (along the road, world units) of the player's car and of a standard traffic car. */
export const CAR_LENGTH = 9;
/** Width of any car as a fraction of one lane. */
export const CAR_WIDTH = 0.62;
export const MIN_SPEED = 34;
export const MAX_SPEED = 92;

/** Seed used when `createRace` gets none. Never the clock. */
export const DEFAULT_SEED = 0x2f6e2b1;
/** Fixed internal simulation step in seconds (1/120). */
export const SIM_STEP = 1 / 120;
/** Longest frame `advance` will simulate; longer frames are clamped to this. */
export const MAX_FRAME_DT = 0.1;
export const COUNTDOWN_SECONDS = 3;
/** Lane the player starts in (and returns to when a new race starts). */
export const START_LANE = 1;
export const TRUCK_LENGTH = 15;
export const COIN_LENGTH = 3;
/** Entities spawn at `ahead` >= SPAWN_AHEAD (just beyond what the renderer draws). */
export const SPAWN_AHEAD = VIEW_AHEAD + 10;
/** Entities are removed once `ahead` drops below -REMOVE_BEHIND. */
export const REMOVE_BEHIND = VIEW_BEHIND + 20;
/** Cars and trucks collide when |entity.lane - laneX| < COLLISION_GAP (and overlap longitudinally). */
export const COLLISION_GAP = CAR_WIDTH + 0.06;
/** Coins are picked up when |coin.lane - laneX| < COIN_PICKUP_GAP (and overlap longitudinally). */
export const COIN_PICKUP_GAP = 0.5;
export const COIN_SCORE = 50;
export const NEAR_MISS_SCORE = 10;
/** A car passing alongside counts as a near miss when COLLISION_GAP <= |lane gap| < NEAR_MISS_MAX_GAP. */
export const NEAR_MISS_MAX_GAP = 1;
/** No near miss is awarded within this many seconds of the player changing target lane. */
export const NEAR_MISS_LANE_COOLDOWN = 0.3;
/** Smooth time (seconds) of the critically damped lane change. A lane change clears the collision band in ~0.19 s. */
export const LANE_RESPONSE = 0.16;
/** Seconds the crash animation takes to bring `speed` to 0. */
export const CRASH_DURATION = 0.9;
/** Traffic speed range in world units per second (trucks and the convoys around them are slower). */
export const TRAFFIC_MIN_SPEED = 12;
export const TRAFFIC_MAX_SPEED = 26;
export const TRUCK_MAX_SPEED = 17;
/** Time constant of the player's speed ramp: speed(60 s) is about 85% of MAX_SPEED. */
export const SPEED_RAMP_SECONDS = 41.8;
/** Seconds the generator budgets per lane of lateral movement (the real maximum is about 0.3 s). */
export const LANE_TIME_PER_LANE = 0.25;

export type RaceStatus = "ready" | "countdown" | "running" | "paused" | "crashed";
export type EntityKind = "car" | "truck" | "coin";

export type Entity = {
  id: number;
  kind: EntityKind;
  /** Integer lane for cars/trucks/coins, 0 .. LANES - 1. */
  lane: number;
  /**
   * Distance from the player's nose to the entity's rear edge, in world units along the road.
   * The entity occupies [ahead, ahead + entityLength(kind)] in front of the nose; the player car
   * occupies [-CAR_LENGTH, 0]. Negative once the entity's rear edge is behind the nose.
   */
  ahead: number;
  /** 0..5: which paint colour the renderer uses (cars/trucks); 0 for coins. */
  variant: number;
};

export type RaceEvent = {
  type: "start" | "go" | "coin" | "near-miss" | "crash";
  lane: number;
  ahead: number;
};

export type RaceState = {
  status: RaceStatus;
  /** Seconds left while status === "countdown" (3 -> 0), otherwise 0. */
  countdown: number;
  /** Lane the player is steering toward (integer). */
  targetLane: number;
  /** Player's continuous lane position, eases toward targetLane (0 .. LANES - 1). */
  laneX: number;
  /**
   * Player speed, world units per second, MIN_SPEED .. MAX_SPEED while ready, counting down and
   * running (the road already rolls at MIN_SPEED during the countdown, but no distance, time or score
   * accrues). Eases down to 0 during the crash animation.
   */
  speed: number;
  /** Total world units driven since the run started (GO). Frozen at the crash. */
  distance: number;
  /** Integer score: floor(distance / 2) plus coin (+50) and near-miss (+10) bonuses. */
  score: number;
  coins: number;
  nearMisses: number;
  /** Best score ever (supplied by the caller; the engine raises it at the moment a run beats it). */
  best: number;
  /** Seconds simulated since GO (excludes the countdown). */
  time: number;
  /** Seconds since the crash while status === "crashed", otherwise 0. */
  crashTime: number;
  /** Camera shake 0..1, decays on its own. */
  shake: number;
  /** Live entities, sorted far -> near (descending `ahead`). */
  entities: Entity[];
  /** Transient events since the last drainEvents() call. */
  events: RaceEvent[];
  /** Internal engine bookkeeping (PRNG state, spawn cursors...). The renderer must not read it. */
  internal: Record<string, number>;
};

export type RaceOptions = { seed?: number; best?: number };

const STEPS_PER_SECOND = 120;
const MAX_EVENTS = 64;
const LANE_OMEGA = 2 / LANE_RESPONSE;
const LANE_DECAY = Math.exp(-LANE_OMEGA * SIM_STEP);
const SHAKE_DECAY = 1.5;
const COUNTDOWN_STEPS = COUNTDOWN_SECONDS * STEPS_PER_SECOND;
const NEAR_MISS_COOLDOWN_STEPS = Math.round(NEAR_MISS_LANE_COOLDOWN * STEPS_PER_SECOND);

// Wave generator tuning.
const EARLY_SECONDS = 10;
const TRUCK_AFTER_SECONDS = 8;
const STAGGER = 6;
const COIN_SPACING = 5;
const BASE_GAP_SLOW = 48;
const BASE_GAP_FAST = 40;
const BASE_GAP_JITTER = 16;
const MIN_SEPARATION = 6;
const LANE_MARGIN_SECONDS = 0.22;
const LANE_MARGIN_FACTOR = 1.5;
const SHRINK_BUDGET = 30;
const MIN_WAVE_GAP = CAR_LENGTH + 1;
/** Odds of the next free lane being 0, 1, 2, 3 lanes away from the previous one. */
const FREE_LANE_WEIGHTS = [0.2, 0.42, 0.26, 0.12];

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

function speedKey(id: number): string {
  return `v${id}`;
}

/** Player speed after `runTime` seconds of running: eases from MIN_SPEED toward MAX_SPEED. */
export function speedAt(runTime: number): number {
  const t = runTime > 0 ? runTime : 0;
  return MIN_SPEED + (MAX_SPEED - MIN_SPEED) * (1 - Math.exp(-t / SPEED_RAMP_SECONDS));
}

/** Length (world units along the road) of an entity kind: car CAR_LENGTH, truck 15, coin 3. */
export function entityLength(kind: EntityKind): number {
  return kind === "truck" ? TRUCK_LENGTH : kind === "coin" ? COIN_LENGTH : CAR_LENGTH;
}

/** Speedometer value for the HUD (world units -> km/h, a display scale only). */
export function speedKmh(state: RaceState): number {
  return Math.round(state.speed * 2.1);
}

/** World speed of an entity along the road (units/s). Traffic and the coins riding with it; 0 for unknown ids. */
export function entitySpeed(state: RaceState, entity: Entity): number {
  return state.internal[speedKey(entity.id)] || 0;
}

/** True once the finished run beat the best score that was set before it (valid while "crashed"). */
export function isNewBest(state: RaceState): boolean {
  return state.status === "crashed" && state.internal.newBest === 1;
}

// ---------------------------------------------------------------------------------------------
// PRNG (mulberry32). The state lives in `internal.rng` so a race is fully described by its state.
// ---------------------------------------------------------------------------------------------

function rnd(inn: Record<string, number>): number {
  const a = (inn.rng + 0x6d2b79f5) | 0;
  inn.rng = a >>> 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function normaliseSeed(seed: number | undefined): number {
  if (typeof seed !== "number" || !Number.isFinite(seed)) return DEFAULT_SEED >>> 0;
  return Math.floor(seed) >>> 0;
}

function resetInternal(inn: Record<string, number>): void {
  const rng = inn.rng;
  const nextId = inn.nextId;
  for (const key of Object.keys(inn)) delete inn[key];
  inn.rng = rng;
  inn.nextId = nextId;
  inn.pending = 0;
  inn.cd = 0;
  inn.run = 0;
  inn.crash = 0;
  inn.tick = 0;
  inn.laneTick = -1000;
  inn.laneV = 0;
  inn.bonus = 0;
  inn.newBest = 0;
  inn.hasWave = 0;
  inn.lastHi = 0;
  inn.lastMaxRear = 0;
  inn.lastSpeed = 0;
  inn.lastFree = 0;
  inn.crashSpeed = 0;
}

/** A fresh race in status "ready" (nothing moving). `seed` defaults to a constant, never to the clock. */
export function createRace(options: RaceOptions = {}): RaceState {
  const best =
    typeof options.best === "number" && Number.isFinite(options.best) && options.best > 0
      ? Math.floor(options.best)
      : 0;
  const internal: Record<string, number> = {
    rng: normaliseSeed(options.seed),
    nextId: 1,
  };
  resetInternal(internal);
  return {
    status: "ready",
    countdown: 0,
    targetLane: START_LANE,
    laneX: START_LANE,
    speed: MIN_SPEED,
    distance: 0,
    score: 0,
    coins: 0,
    nearMisses: 0,
    best,
    time: 0,
    crashTime: 0,
    shake: 0,
    entities: [],
    events: [],
    internal,
  };
}

function emit(state: RaceState, type: RaceEvent["type"], lane: number, ahead: number): void {
  const events = state.events;
  events.push({ type, lane, ahead });
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
}

/**
 * "ready" | "crashed" -> "countdown" (resets the run but keeps `best`). Ignored in other states.
 * Emits a "start" event immediately; the PRNG stream continues from where the previous run left it.
 * The car keeps its current lane position and eases back to START_LANE during the countdown.
 */
export function startRace(state: RaceState): void {
  if (state.status !== "ready" && state.status !== "crashed") return;
  resetInternal(state.internal);
  state.internal.cd = COUNTDOWN_STEPS;
  state.status = "countdown";
  state.countdown = COUNTDOWN_SECONDS;
  state.targetLane = START_LANE;
  state.speed = MIN_SPEED;
  state.distance = 0;
  state.score = 0;
  state.coins = 0;
  state.nearMisses = 0;
  state.time = 0;
  state.crashTime = 0;
  state.shake = 0;
  state.entities = [];
  emit(state, "start", state.targetLane, 0);
}

function canSteer(state: RaceState): boolean {
  return state.status === "running" || state.status === "countdown";
}

function applyTargetLane(state: RaceState, lane: number): void {
  if (lane === state.targetLane) return;
  state.targetLane = lane;
  state.internal.laneTick = state.internal.tick;
}

/** Move the target lane one step: -1 = toward lane 0, +1 = toward lane LANES - 1. Clamped. Only while running or counting down. */
export function steer(state: RaceState, direction: -1 | 1): void {
  if (!canSteer(state)) return;
  if (direction !== -1 && direction !== 1) return;
  applyTargetLane(state, clamp(state.targetLane + direction, 0, LANES - 1));
}

/** Jump the target lane directly (pointer / touch steering). Clamped and rounded. Only while running or counting down. */
export function setTargetLane(state: RaceState, lane: number): void {
  if (!canSteer(state)) return;
  if (typeof lane !== "number" || Number.isNaN(lane)) return;
  applyTargetLane(state, clamp(Math.round(lane), 0, LANES - 1));
}

/** running -> paused. Ignored otherwise. */
export function pauseRace(state: RaceState): void {
  if (state.status === "running") state.status = "paused";
}

/** paused -> running. Ignored otherwise. */
export function resumeRace(state: RaceState): void {
  if (state.status === "paused") state.status = "running";
}

/** Return and clear `state.events`. */
export function drainEvents(state: RaceState): RaceEvent[] {
  return state.events.splice(0, state.events.length);
}

// ---------------------------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------------------------

/**
 * Advance the simulation by `dt` seconds (clamped to MAX_FRAME_DT = 0.1; internally sub-stepped at
 * 1/120 s so results do not depend on frame rate). Handles the countdown, speed ramp, traffic
 * spawning, collisions, coins, near misses, score, best and the crash animation timer. No-op in
 * "ready" and "paused", and for dt that is zero, negative or NaN.
 */
export function advance(state: RaceState, dt: number): void {
  const status = state.status;
  if (status === "ready" || status === "paused") return;
  if (!(dt > 0)) return;
  const inn = state.internal;
  inn.pending += Math.min(dt, MAX_FRAME_DT) * STEPS_PER_SECOND;
  let steps = Math.floor(inn.pending + 1e-6);
  inn.pending = Math.max(0, inn.pending - steps);
  while (steps > 0) {
    steps -= 1;
    stepOnce(state);
  }
}

function stepOnce(state: RaceState): void {
  state.internal.tick += 1;
  switch (state.status) {
    case "countdown":
      stepCountdown(state);
      break;
    case "running":
      stepRunning(state);
      break;
    case "crashed":
      stepCrashed(state);
      break;
    default:
      break;
  }
}

/** Critically damped spring toward targetLane, solved exactly per step; never overshoots the target. */
function stepLane(state: RaceState): void {
  const inn = state.internal;
  const e0 = state.laneX - state.targetLane;
  const v0 = inn.laneV;
  if (e0 === 0 && v0 === 0) return;
  const c = v0 + LANE_OMEGA * e0;
  let e1 = (e0 + c * SIM_STEP) * LANE_DECAY;
  let v1 = (v0 - LANE_OMEGA * c * SIM_STEP) * LANE_DECAY;
  if (e0 !== 0 && e1 * e0 <= 0) {
    e1 = 0;
    v1 = 0;
  } else if (Math.abs(e1) < 5e-4 && Math.abs(v1) < 5e-3) {
    e1 = 0;
    v1 = 0;
  }
  state.laneX = state.targetLane + e1;
  inn.laneV = v1;
}

function stepCountdown(state: RaceState): void {
  const inn = state.internal;
  stepLane(state);
  moveWorld(state, MIN_SPEED, false);
  trySpawn(state, 0, MIN_SPEED);
  inn.cd -= 1;
  if (inn.cd <= 0) {
    inn.cd = 0;
    state.countdown = 0;
    state.status = "running";
    emit(state, "go", state.targetLane, 0);
  } else {
    state.countdown = inn.cd / STEPS_PER_SECOND;
  }
}

function stepRunning(state: RaceState): void {
  const inn = state.internal;
  stepLane(state);
  inn.run += 1;
  state.time = inn.run / STEPS_PER_SECOND;
  const speed = speedAt(state.time);
  state.speed = speed;
  const hit = moveWorld(state, speed, true);
  state.distance += speed * SIM_STEP;
  state.score = Math.floor(state.distance / 2) + inn.bonus;
  if (state.shake > 0) state.shake = Math.max(0, state.shake - SHAKE_DECAY * SIM_STEP);
  if (hit) {
    crash(state, hit);
    return;
  }
  trySpawn(state, state.time, speed);
}

function stepCrashed(state: RaceState): void {
  const inn = state.internal;
  inn.crash += 1;
  state.crashTime = inn.crash / STEPS_PER_SECOND;
  const k = Math.min(1, state.crashTime / CRASH_DURATION);
  state.speed = inn.crashSpeed * (1 - k) * (1 - k);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - SHAKE_DECAY * SIM_STEP);
}

function crash(state: RaceState, into: Entity): void {
  const inn = state.internal;
  state.status = "crashed";
  state.crashTime = 0;
  state.shake = 1;
  inn.crash = 0;
  inn.crashSpeed = state.speed;
  inn.newBest = state.score > state.best ? 1 : 0;
  if (state.score > state.best) state.best = state.score;
  emit(state, "crash", into.lane, into.ahead);
}

/**
 * Move every entity (and the tracked previous wave) by one sub-step, and when `interact` is set
 * resolve coins, near misses and collisions. Returns the entity the player ran into, if any.
 */
function moveWorld(state: RaceState, speed: number, interact: boolean): Entity | null {
  const inn = state.internal;
  const entities = state.entities;
  if (inn.hasWave === 1) {
    const shift = (speed - inn.lastSpeed) * SIM_STEP;
    inn.lastHi -= shift;
    inn.lastMaxRear -= shift;
  }
  const cooldownOver = inn.tick - inn.laneTick >= NEAR_MISS_COOLDOWN_STEPS;
  let hit: Entity | null = null;
  let keep = 0;
  let sorted = true;
  for (let i = 0; i < entities.length; i += 1) {
    const e = entities[i];
    const before = e.ahead;
    const after = before - (speed - (inn[speedKey(e.id)] || 0)) * SIM_STEP;
    e.ahead = after;
    let consumed = false;
    if (interact) {
      const length = entityLength(e.kind);
      const gap = Math.abs(e.lane - state.laneX);
      const overlaps = after < 0 && after + length > -CAR_LENGTH;
      if (e.kind === "coin") {
        if (overlaps && gap < COIN_PICKUP_GAP) {
          consumed = true;
          inn.bonus += COIN_SCORE;
          state.coins += 1;
          state.score = Math.floor(state.distance / 2) + inn.bonus;
          emit(state, "coin", e.lane, after);
        }
      } else if (overlaps && gap < COLLISION_GAP) {
        if (!hit) hit = e;
      } else if (gap >= COLLISION_GAP && gap < NEAR_MISS_MAX_GAP && cooldownOver) {
        // Mid-pass: the middle of the car crosses the middle of the player's car.
        const half = (length + CAR_LENGTH) / 2;
        if (before + half >= 0 && after + half < 0) {
          inn.bonus += NEAR_MISS_SCORE;
          state.nearMisses += 1;
          emit(state, "near-miss", e.lane, after);
        }
      }
    }
    if (consumed || after < -REMOVE_BEHIND) {
      delete inn[speedKey(e.id)];
      continue;
    }
    if (keep > 0 && entities[keep - 1].ahead < after) sorted = false;
    entities[keep] = e;
    keep += 1;
  }
  entities.length = keep;
  if (!sorted) sortFarToNear(entities);
  if (interact) state.score = Math.floor(state.distance / 2) + inn.bonus;
  return hit;
}

function sortFarToNear(entities: Entity[]): void {
  for (let i = 1; i < entities.length; i += 1) {
    const item = entities[i];
    let j = i - 1;
    while (j >= 0 && entities[j].ahead < item.ahead) {
      entities[j + 1] = entities[j];
      j -= 1;
    }
    entities[j + 1] = item;
  }
}

// ---------------------------------------------------------------------------------------------
// Traffic generation
// ---------------------------------------------------------------------------------------------

type PlannedItem = { lane: number; kind: EntityKind; rear: number; variant: number };
type PlannedWave = {
  items: PlannedItem[];
  speed: number;
  /** The lane the fairness guarantee is computed for (always free of obstacles). */
  free: number;
  /** Front edge of the footprint, relative to the wave's first rear edge (obstacles and coins). */
  hi: number;
  maxRear: number;
  /** Smallest gap (previous footprint front -> this footprint rear) at which the wave may spawn. */
  need: number;
};

/**
 * Draw the next wave from the PRNG and compute how much room it needs behind the previous wave.
 * The caller restores the PRNG when the wave cannot spawn yet, so planning is free of side effects.
 */
function planWave(state: RaceState, time: number, speed: number): PlannedWave {
  const inn = state.internal;
  const frac = clamp((speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED), 0, 1);
  const hasPrev = inn.hasWave === 1;
  const prevFree = hasPrev ? inn.lastFree : -1;
  const early = time < EARLY_SECONDS;

  // How many obstacles (1-3).
  const rCount = rnd(inn);
  const p3 = early ? 0 : 0.12 + 0.22 * frac;
  const count = rCount < p3 ? 3 : rCount < p3 + 0.4 ? 2 : 1;

  // The designated free lane, biased toward small moves from the previous one.
  let free = 0;
  if (prevFree < 0) {
    free = Math.min(LANES - 1, Math.floor(rnd(inn) * LANES));
  } else {
    let total = 0;
    for (let lane = 0; lane < LANES; lane += 1) total += FREE_LANE_WEIGHTS[Math.abs(lane - prevFree)];
    let pick = rnd(inn) * total;
    free = LANES - 1;
    for (let lane = 0; lane < LANES; lane += 1) {
      pick -= FREE_LANE_WEIGHTS[Math.abs(lane - prevFree)];
      if (pick < 0) {
        free = lane;
        break;
      }
    }
  }

  // Obstacle lanes: a random subset of the other lanes.
  const others: number[] = [];
  for (let lane = 0; lane < LANES; lane += 1) if (lane !== free) others.push(lane);
  for (let i = others.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd(inn) * (i + 1));
    const swap = others[i];
    others[i] = others[j];
    others[j] = swap;
  }
  const lanes = others.slice(0, count);
  const unused = others.slice(count);

  // Speed: a wave moves rigidly. It may not be slower than the previous wave by more than what keeps
  // the two footprints apart until the previous one is gone (a bounded "shrink budget").
  let truck = rnd(inn) < (time < TRUCK_AFTER_SECONDS ? 0 : 0.1 + 0.12 * frac);
  let lowest = TRAFFIC_MIN_SPEED;
  if (hasPrev) {
    const closingPrev = Math.max(1, speed - inn.lastSpeed);
    const toGo = Math.max(0, inn.lastMaxRear + REMOVE_BEHIND);
    if (toGo > 0) lowest = Math.max(lowest, inn.lastSpeed - (SHRINK_BUDGET * closingPrev) / toGo);
  }
  if (truck && lowest > TRUCK_MAX_SPEED) truck = false;
  const classMin = truck ? TRAFFIC_MIN_SPEED : 14;
  const classMax = truck ? TRUCK_MAX_SPEED : TRAFFIC_MAX_SPEED;
  const waveSpeed = Math.min(classMax, Math.max(classMin + rnd(inn) * (classMax - classMin), lowest));

  // Obstacles, staggered a little along the road.
  const items: PlannedItem[] = [];
  let minRear = Infinity;
  for (let i = 0; i < lanes.length; i += 1) {
    const rear = rnd(inn) * STAGGER;
    minRear = Math.min(minRear, rear);
    items.push({
      lane: lanes[i],
      kind: truck && i === 0 ? "truck" : "car",
      rear,
      variant: Math.floor(rnd(inn) * 6) % 6,
    });
  }
  let hi = 0;
  let maxRear = 0;
  for (const item of items) {
    item.rear -= minRear;
    hi = Math.max(hi, item.rear + entityLength(item.kind));
    maxRear = Math.max(maxRear, item.rear);
  }

  // Sometimes a coin trail in a free lane (usually the designated one).
  const rCoin = rnd(inn);
  const rCoinCount = rnd(inn);
  const rCoinLane = rnd(inn);
  const rCoinStart = rnd(inn);
  if (rCoin < 0.3) {
    const coinCount = 3 + Math.min(2, Math.floor(rCoinCount * 3));
    const freeLanes = [free, ...unused];
    const coinLane = rCoinLane < 0.65 ? free : freeLanes[Math.floor(rCoinLane * freeLanes.length) % freeLanes.length];
    const start = rCoinStart * 4;
    for (let c = 0; c < coinCount; c += 1) {
      const rear = start + c * COIN_SPACING;
      items.push({ lane: coinLane, kind: "coin", rear, variant: 0 });
      hi = Math.max(hi, rear + COIN_LENGTH);
      maxRear = Math.max(maxRear, rear);
    }
  }

  // Room needed behind the previous wave.
  const base = BASE_GAP_SLOW - (BASE_GAP_SLOW - BASE_GAP_FAST) * frac + rnd(inn) * BASE_GAP_JITTER;
  let need = base;
  if (hasPrev) {
    const closingPrev = Math.max(1, speed - inn.lastSpeed);
    const slower = Math.max(0, inn.lastSpeed - waveSpeed);
    // Player speed when this wave reaches it: an upper bound, since the player only gets faster.
    const arrival = SPAWN_AHEAD / Math.max(1, speed - waveSpeed);
    const closingNew = speedAt(time + arrival) - waveSpeed;
    const lanesToMove = Math.abs(free - prevFree);
    const laneSeconds = LANE_MARGIN_SECONDS + LANE_TIME_PER_LANE * LANE_MARGIN_FACTOR * lanesToMove;
    // The player leaves the previous free lane once the previous footprint has cleared its tail ...
    const toClear = Math.max(0, inn.lastHi + CAR_LENGTH + 1);
    const shrinkClear = (slower * toClear) / closingPrev;
    // ... and must be in the new free lane before the new footprint reaches its nose.
    need = Math.max(need, CAR_LENGTH + 1 + shrinkClear + closingNew * laneSeconds);
    // Footprints must stay apart until the previous wave is gone, so cars never drive through each other.
    const toGo = Math.max(0, inn.lastMaxRear + REMOVE_BEHIND);
    need = Math.max(need, MIN_SEPARATION + (slower * toGo) / closingPrev);
  }
  return { items, speed: waveSpeed, free, hi, maxRear, need };
}

function trySpawn(state: RaceState, time: number, speed: number): void {
  const inn = state.internal;
  const hasPrev = inn.hasWave === 1;
  const gapNow = hasPrev ? SPAWN_AHEAD - inn.lastHi : Infinity;
  if (gapNow < MIN_WAVE_GAP) return;
  const saved = inn.rng;
  const wave = planWave(state, time, speed);
  if (gapNow < wave.need || overlapsExisting(state.entities, wave)) {
    inn.rng = saved;
    return;
  }
  const fresh: Entity[] = [];
  for (const item of wave.items) {
    const id = inn.nextId;
    inn.nextId = id + 1;
    inn[speedKey(id)] = wave.speed;
    fresh.push({ id, kind: item.kind, lane: item.lane, ahead: SPAWN_AHEAD + item.rear, variant: item.variant });
  }
  sortFarToNear(fresh);
  state.entities.unshift(...fresh);
  if (state.entities.length > fresh.length) sortFarToNear(state.entities);
  inn.hasWave = 1;
  inn.lastHi = SPAWN_AHEAD + wave.hi;
  inn.lastMaxRear = SPAWN_AHEAD + wave.maxRear;
  inn.lastSpeed = wave.speed;
  inn.lastFree = wave.free;
}

/** Defensive: never place anything on top of an entity that already exists. */
function overlapsExisting(entities: Entity[], wave: PlannedWave): boolean {
  for (const item of wave.items) {
    const rear = SPAWN_AHEAD + item.rear - 1;
    const front = SPAWN_AHEAD + item.rear + entityLength(item.kind) + 1;
    for (const e of entities) {
      if (e.lane === item.lane && rear < e.ahead + entityLength(e.kind) && front > e.ahead) return true;
    }
  }
  return false;
}
