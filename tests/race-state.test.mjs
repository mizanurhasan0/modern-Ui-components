import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

function loadTypeScript(file) {
  const source = fs.readFileSync(path.join(testDirectory, "..", file), "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const compiledModule = { exports: {} };
  new Function("module", "exports", result.outputText)(
    compiledModule,
    compiledModule.exports,
  );
  return compiledModule.exports;
}

const race = loadTypeScript("components/site/desk/race-state.ts");
const {
  CAR_LENGTH,
  CAR_WIDTH,
  COIN_SCORE,
  COLLISION_GAP,
  COUNTDOWN_SECONDS,
  CRASH_DURATION,
  DEFAULT_SEED,
  LANES,
  MAX_SPEED,
  MIN_SPEED,
  NEAR_MISS_SCORE,
  REMOVE_BEHIND,
  SIM_STEP,
  SPAWN_AHEAD,
  TRUCK_LENGTH,
  VIEW_AHEAD,
  VIEW_BEHIND,
  advance,
  createRace,
  drainEvents,
  entityLength,
  entitySpeed,
  isNewBest,
  pauseRace,
  resumeRace,
  setTargetLane,
  speedAt,
  speedKmh,
  startRace,
  steer,
} = race;

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------

/** Advance `seconds` in frames of `frame` seconds. */
function run(state, seconds, frame = 1 / 60) {
  const frames = Math.round(seconds / frame);
  for (let i = 0; i < frames; i += 1) advance(state, frame);
}

/** A race that has just reached GO with nothing on the road. */
function goRace(options) {
  const state = createRace(options);
  startRace(state);
  run(state, COUNTDOWN_SECONDS, 1 / 120);
  assert.equal(state.status, "running");
  state.entities.length = 0;
  drainEvents(state);
  return state;
}

/** Put a stationary-traffic entity on the road (unknown ids move at world speed 0). */
function inject(state, kind, lane, ahead) {
  const ids = state.entities.map((e) => e.id);
  const id = Math.max(10000, ...ids) + 1;
  state.entities.push({ id, kind, lane, ahead, variant: 0 });
  state.entities.sort((a, b) => b.ahead - a.ahead);
  return id;
}

/** A ghost player is never beside any traffic, so it can sample the generator at any speed. */
function ghostRun(state, seconds, onFrame, frame = 1 / 30) {
  const frames = Math.round(seconds / frame);
  for (let i = 0; i < frames; i += 1) {
    state.laneX = -100;
    advance(state, frame);
    assert.equal(state.status, "running");
    onFrame(state, i);
  }
}

function assertFinite(value, label = "state") {
  if (typeof value === "number") {
    assert.ok(Number.isFinite(value), `${label} is not finite: ${value}`);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => assertFinite(item, `${label}[${index}]`));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) assertFinite(item, `${label}.${key}`);
  }
}

const snapshot = (state) => JSON.parse(JSON.stringify(state));

function obstacles(state) {
  return state.entities.filter((e) => e.kind !== "coin");
}

/** Lanes blocked by obstacles overlapping the window [from, from + CAR_LENGTH] along the road. */
function blockedLanes(state, from) {
  const lanes = new Set();
  for (const e of obstacles(state)) {
    if (e.ahead < from + CAR_LENGTH - 1e-6 && e.ahead + entityLength(e.kind) > from + 1e-6) lanes.add(e.lane);
  }
  return lanes;
}

// ---------------------------------------------------------------------------------------------
// Construction, constants, determinism
// ---------------------------------------------------------------------------------------------

test("createRace starts in a quiet ready state and honours seed and best", () => {
  const state = createRace();
  assert.equal(state.status, "ready");
  assert.equal(state.countdown, 0);
  assert.equal(state.speed, MIN_SPEED);
  assert.equal(state.score, 0);
  assert.equal(state.best, 0);
  assert.deepEqual(state.entities, []);
  assert.deepEqual(state.events, []);
  assert.ok(state.targetLane >= 0 && state.targetLane < LANES);
  assert.equal(state.laneX, state.targetLane);
  assert.equal(createRace({ best: 1234 }).best, 1234);
  assert.equal(createRace({ best: -5 }).best, 0);
  assert.equal(createRace({ best: Number.NaN }).best, 0);
  assert.notDeepEqual(createRace({ seed: 1 }).internal, createRace({ seed: 2 }).internal);
  assert.deepEqual(createRace().internal, createRace({ seed: DEFAULT_SEED }).internal);
});

test("frozen contract constants and helpers keep their documented values", () => {
  assert.equal(LANES, 4);
  assert.equal(VIEW_AHEAD, 100);
  assert.equal(VIEW_BEHIND, 18);
  assert.equal(CAR_LENGTH, 9);
  assert.equal(CAR_WIDTH, 0.62);
  assert.equal(MIN_SPEED, 34);
  assert.equal(MAX_SPEED, 92);
  assert.equal(entityLength("car"), CAR_LENGTH);
  assert.equal(entityLength("truck"), 15);
  assert.equal(TRUCK_LENGTH, 15);
  assert.equal(entityLength("coin"), 3);
  assert.equal(SIM_STEP, 1 / 120);
  assert.ok(Math.abs(COLLISION_GAP - (CAR_WIDTH + 0.06)) < 1e-12);
});

test("the engine never reads the clock or Math.random", () => {
  const { now } = Date;
  const { random } = Math;
  Date.now = () => {
    throw new Error("Date.now used");
  };
  Math.random = () => {
    throw new Error("Math.random used");
  };
  try {
    const state = createRace({ seed: 77 });
    startRace(state);
    run(state, 20);
    assert.ok(state.entities.length > 0);
  } finally {
    Date.now = now;
    Math.random = random;
  }
});

test("the same seed gives an identical state after the same inputs", () => {
  const a = createRace({ seed: 424242 });
  const b = createRace({ seed: 424242 });
  for (const state of [a, b]) {
    startRace(state);
    for (let i = 0; i < 900; i += 1) {
      if (i === 300) setTargetLane(state, 3);
      if (i === 600) steer(state, -1);
      advance(state, 1 / 60);
    }
  }
  assert.deepEqual(snapshot(a), snapshot(b));
  assert.ok(a.entities.length > 0);
});

test("different seeds produce different traffic", () => {
  const layouts = [1, 2, 3].map((seed) => {
    const state = createRace({ seed });
    startRace(state);
    run(state, 3.2);
    return JSON.stringify(state.entities.map((e) => [e.lane, e.kind, e.variant, Math.round(e.ahead)]));
  });
  assert.equal(new Set(layouts).size, 3);
});

test("frame rate does not change the simulation", () => {
  const outcomes = [];
  for (const [frames, frame] of [
    [600, 1 / 60],
    [100, 0.1],
    [1200, 1 / 120],
    [1000, 0.01],
  ]) {
    const state = createRace({ seed: 9 });
    startRace(state);
    for (let i = 0; i < frames; i += 1) advance(state, frame);
    outcomes.push(state);
  }
  const [first, ...rest] = outcomes;
  assert.ok(first.distance > 0 || first.status === "crashed");
  for (const other of rest) {
    assert.equal(other.status, first.status);
    assert.ok(Math.abs(other.distance - first.distance) < 1e-6, `${other.distance} vs ${first.distance}`);
    assert.equal(other.score, first.score);
    assert.ok(Math.abs(other.time - first.time) < 1e-9);
    assert.equal(other.entities.length, first.entities.length);
    other.entities.forEach((e, index) => {
      assert.equal(e.id, first.entities[index].id);
      assert.ok(Math.abs(e.ahead - first.entities[index].ahead) < 1e-6);
    });
  }
});

test("frame rate independence also holds across a crash, with uneven frames", () => {
  const results = [];
  for (const pattern of [[1 / 60], [0.1], [0.013, 0.007, 0.021, 0.0042], [1 / 144]]) {
    const state = createRace({ seed: 5 });
    startRace(state);
    let elapsed = 0;
    for (let i = 0; elapsed < 14; i += 1) {
      const dt = pattern[i % pattern.length];
      advance(state, dt);
      elapsed += dt;
    }
    results.push(state);
  }
  for (const other of results.slice(1)) {
    assert.equal(other.status, results[0].status);
    assert.equal(other.coins, results[0].coins);
    assert.equal(other.nearMisses, results[0].nearMisses);
    // Uneven patterns stop at slightly different wall times, so compare the crash itself.
    if (results[0].status === "crashed") assert.equal(other.score, results[0].score);
  }
  assert.equal(results[0].status, "crashed", "an idle player eventually crashes");
});

test("frames longer than 0.1 s are clamped", () => {
  const state = goRace();
  advance(state, 5);
  assert.ok(Math.abs(state.time - 0.1) < 1e-9, `time ${state.time}`);
  const other = goRace();
  for (let i = 0; i < 60; i += 1) advance(other, 1 / 6);
  assert.ok(Math.abs(other.time - 6) < 1e-6, `time ${other.time}`);
});

// ---------------------------------------------------------------------------------------------
// Countdown and states
// ---------------------------------------------------------------------------------------------

test("a ready race ignores advance, steer, pause and resume", () => {
  const state = createRace();
  const before = snapshot(state);
  advance(state, 1);
  steer(state, 1);
  setTargetLane(state, 3);
  pauseRace(state);
  resumeRace(state);
  assert.deepEqual(snapshot(state), before);
});

test("countdown runs 3 to 0, emits start then go, and does not score", () => {
  const state = createRace();
  startRace(state);
  assert.equal(state.status, "countdown");
  assert.equal(state.countdown, COUNTDOWN_SECONDS);
  assert.deepEqual(
    state.events.map((e) => e.type),
    ["start"],
  );
  run(state, 1, 1 / 120);
  assert.ok(Math.abs(state.countdown - 2) < 1e-9, `countdown ${state.countdown}`);
  run(state, 1.5, 1 / 120);
  assert.equal(state.status, "countdown");
  assert.ok(Math.abs(state.countdown - 0.5) < 1e-9);
  assert.equal(state.distance, 0);
  assert.equal(state.score, 0);
  assert.equal(state.time, 0);
  run(state, 0.49, 1 / 120);
  assert.equal(state.status, "countdown");
  advance(state, 1 / 120);
  advance(state, 1 / 120);
  assert.equal(state.status, "running");
  assert.equal(state.countdown, 0);
  assert.deepEqual(
    drainEvents(state).map((e) => e.type),
    ["start", "go"],
  );
});

test("traffic is already approaching when the countdown ends", () => {
  const state = createRace();
  startRace(state);
  run(state, COUNTDOWN_SECONDS, 1 / 120);
  assert.equal(state.status, "running");
  assert.ok(state.entities.length > 0);
  const nearest = state.entities[state.entities.length - 1];
  assert.ok(nearest.ahead > 20, `first traffic ${nearest.ahead} units away`);
  assert.ok(nearest.ahead < SPAWN_AHEAD);
});

test("startRace is ignored while counting down, running or paused", () => {
  const state = createRace();
  startRace(state);
  run(state, 1);
  const before = snapshot(state);
  startRace(state);
  assert.deepEqual(snapshot(state), before);
  run(state, 2.1);
  assert.equal(state.status, "running");
  startRace(state);
  assert.equal(state.status, "running");
  pauseRace(state);
  startRace(state);
  assert.equal(state.status, "paused");
});

test("steering works while counting down and running, and is clamped", () => {
  const state = createRace();
  startRace(state);
  setTargetLane(state, 0);
  assert.equal(state.targetLane, 0);
  steer(state, -1);
  assert.equal(state.targetLane, 0);
  for (let i = 0; i < 10; i += 1) steer(state, 1);
  assert.equal(state.targetLane, LANES - 1);
  setTargetLane(state, -7);
  assert.equal(state.targetLane, 0);
  setTargetLane(state, 99);
  assert.equal(state.targetLane, LANES - 1);
  setTargetLane(state, 1.4);
  assert.equal(state.targetLane, 1);
  setTargetLane(state, 1.6);
  assert.equal(state.targetLane, 2);
  setTargetLane(state, Number.NaN);
  assert.equal(state.targetLane, 2);
  run(state, 3.2);
  steer(state, 1);
  assert.equal(state.targetLane, 3);
});

test("paused and crashed races ignore steering", () => {
  const state = goRace();
  pauseRace(state);
  steer(state, 1);
  setTargetLane(state, 3);
  assert.equal(state.targetLane, 1);
  resumeRace(state);
  inject(state, "car", 1, 5);
  run(state, 0.3);
  assert.equal(state.status, "crashed");
  const lane = state.targetLane;
  steer(state, 1);
  setTargetLane(state, 0);
  assert.equal(state.targetLane, lane);
});

test("pause freezes everything and resume continues exactly", () => {
  const state = goRace();
  run(state, 1);
  pauseRace(state);
  const frozen = snapshot(state);
  run(state, 5);
  assert.deepEqual(snapshot(state), frozen);
  const reference = goRace();
  run(reference, 1);
  resumeRace(state);
  run(state, 1);
  run(reference, 1);
  assert.deepEqual(snapshot(state), snapshot(reference));
  resumeRace(state);
  assert.equal(state.status, "running");
});

test("pause is ignored outside running", () => {
  const state = createRace();
  pauseRace(state);
  assert.equal(state.status, "ready");
  startRace(state);
  pauseRace(state);
  assert.equal(state.status, "countdown");
  resumeRace(state);
  assert.equal(state.status, "countdown");
});

test("drainEvents returns the events once and clears them", () => {
  const state = createRace();
  startRace(state);
  const first = drainEvents(state);
  assert.equal(first.length, 1);
  assert.equal(first[0].type, "start");
  assert.deepEqual(state.events, []);
  assert.deepEqual(drainEvents(state), []);
});

test("undrained events are capped", () => {
  const state = goRace();
  for (let i = 0; i < 200; i += 1) {
    state.laneX = 1;
    inject(state, "coin", 1, 0.2);
    advance(state, 1 / 60);
  }
  assert.ok(state.events.length <= 64);
  assert.ok(state.coins >= 100);
});

// ---------------------------------------------------------------------------------------------
// Player motion
// ---------------------------------------------------------------------------------------------

test("lane changes ease without overshoot and settle", () => {
  const state = goRace();
  setTargetLane(state, 3);
  let previous = state.laneX;
  let at016 = 0;
  for (let i = 1; i <= 240; i += 1) {
    advance(state, 1 / 120);
    assert.ok(state.laneX >= previous - 1e-12, "monotonic");
    assert.ok(state.laneX <= 3 + 1e-12, "never past the target");
    previous = state.laneX;
    if (i === 19) at016 = (state.laneX - 1) / 2;
  }
  assert.equal(state.laneX, 3, "settles exactly on the target lane");
  assert.ok(at016 > 0.4 && at016 < 0.75, `about half-way after ~0.16 s, got ${at016}`);
});

test("a one-lane change clears the collision band in about a quarter of a second", () => {
  const state = goRace();
  setTargetLane(state, 2);
  let cleared = null;
  for (let i = 1; i <= 120 && cleared === null; i += 1) {
    advance(state, 1 / 120);
    if (state.laneX >= 1 + COLLISION_GAP) cleared = i / 120;
  }
  assert.ok(cleared > 0.15 && cleared < 0.26, `cleared after ${cleared}s`);
});

test("retargeting mid-move never leaves the road or crosses the new target", () => {
  const state = goRace();
  const script = [3, 0, 2, 2, 1, 3, 1, 0, 3];
  for (const lane of script) {
    setTargetLane(state, lane);
    for (let i = 0; i < 17; i += 1) {
      advance(state, 1 / 120);
      assert.ok(state.laneX >= 0 && state.laneX <= LANES - 1);
    }
  }
  setTargetLane(state, 2);
  let side = Math.sign(state.laneX - 2);
  for (let i = 0; i < 300; i += 1) {
    advance(state, 1 / 120);
    const now = Math.sign(state.laneX - 2);
    if (side !== 0 && now !== 0) assert.equal(now, side, "no overshoot");
    if (side === 0) side = now;
  }
  assert.equal(state.laneX, 2);
});

test("player speed ramps from MIN toward MAX and reaches about 85% of max after a minute", () => {
  assert.equal(speedAt(0), MIN_SPEED);
  const at60 = speedAt(60);
  assert.ok(at60 > 0.8 * MAX_SPEED && at60 < 0.9 * MAX_SPEED, `speed at 60 s: ${at60}`);
  assert.ok(speedAt(600) < MAX_SPEED + 1e-9);
  const state = goRace();
  let previous = state.speed;
  assert.equal(previous, MIN_SPEED);
  ghostRun(state, 60, (s) => {
    assert.ok(s.speed >= previous - 1e-12);
    assert.ok(s.speed <= MAX_SPEED);
    previous = s.speed;
  });
  assert.ok(Math.abs(state.speed - at60) < 0.5);
  assert.ok(Math.abs(state.time - 60) < 0.05);
  assert.equal(speedKmh(state), Math.round(state.speed * 2.1));
});

test("score is half the distance plus bonuses", () => {
  const state = goRace();
  ghostRun(state, 20, () => {});
  assert.equal(state.score, Math.floor(state.distance / 2));
  assert.ok(state.distance > 20 * MIN_SPEED);
  assert.ok(state.distance < 20 * MAX_SPEED);
  assert.equal(state.coins, 0);
});

// ---------------------------------------------------------------------------------------------
// Traffic generation and fairness
// ---------------------------------------------------------------------------------------------

test("traffic spawns beyond the view, is removed behind it, stays sorted and unique", () => {
  const state = createRace({ seed: 31 });
  startRace(state);
  const seen = new Set();
  let removed = 0;
  let previousIds = new Set();
  ghostRunFromCountdown(state, 60, (s) => {
    for (const e of s.entities) {
      assert.ok(e.ahead >= -REMOVE_BEHIND, `entity left behind: ${e.ahead}`);
      if (!seen.has(e.id)) {
        seen.add(e.id);
        assert.ok(e.ahead >= VIEW_AHEAD + 10 - 1e-9, `spawned at ${e.ahead}`);
      }
    }
    for (let i = 1; i < s.entities.length; i += 1) assert.ok(s.entities[i - 1].ahead >= s.entities[i].ahead);
    const ids = new Set(s.entities.map((e) => e.id));
    assert.equal(ids.size, s.entities.length);
    for (const id of previousIds) if (!ids.has(id)) removed += 1;
    previousIds = ids;
  }, 1 / 120);
  assert.ok(seen.size > 60);
  assert.ok(removed > 30);
});

/** Like ghostRun, but starts in the countdown. */
function ghostRunFromCountdown(state, seconds, onFrame, frame = 1 / 30) {
  const frames = Math.round((seconds + COUNTDOWN_SECONDS) / frame);
  for (let i = 0; i < frames; i += 1) {
    state.laneX = -100;
    advance(state, frame);
    assert.notEqual(state.status, "crashed");
    onFrame(state, i);
  }
}

test("traffic speeds stay in 12-26 and trucks are slower than cars", () => {
  const state = createRace({ seed: 8 });
  startRace(state);
  let cars = 0;
  let trucks = 0;
  let slowestCar = Infinity;
  let fastestTruck = 0;
  ghostRunFromCountdown(state, 200, (s) => {
    for (const e of s.entities) {
      const v = entitySpeed(s, e);
      assert.ok(v >= 12 - 1e-9 && v <= 26 + 1e-9, `speed ${v}`);
      assert.ok(v < s.speed, "traffic is always slower than the player");
      if (e.kind === "truck") {
        trucks += 1;
        fastestTruck = Math.max(fastestTruck, v);
      } else if (e.kind === "car") {
        cars += 1;
        slowestCar = Math.min(slowestCar, v);
      }
    }
  });
  assert.ok(cars > 0 && trucks > 0, "both cars and trucks appear");
  assert.ok(fastestTruck <= 17 + 1e-9, `fastest truck ${fastestTruck}`);
  assert.ok(slowestCar >= 12);
});

for (const seed of [DEFAULT_SEED, 1, 2025, 987654321]) {
  test(`fairness: every wave leaves a lane free and layouts stay passable (seed ${seed === DEFAULT_SEED ? "default" : seed})`, () => {
    const state = createRace({ seed });
    startRace(state);
    const known = new Set();
    const waves = { sizes: new Set(), trucks: 0, coinTrails: 0 };
    ghostRunFromCountdown(state, 240, (s) => {
      // Group what appeared this frame into a wave.
      const fresh = s.entities.filter((e) => !known.has(e.id));
      fresh.forEach((e) => known.add(e.id));
      const wave = fresh.filter((e) => e.kind !== "coin");
      if (wave.length > 0) {
        const lanes = new Set(wave.map((e) => e.lane));
        assert.equal(lanes.size, wave.length, "one obstacle per lane in a wave");
        assert.ok(wave.length >= 1 && wave.length <= 3, `wave of ${wave.length}`);
        assert.ok(lanes.size <= LANES - 1, "at least one lane free across the wave");
        waves.sizes.add(wave.length);
        if (wave.some((e) => e.kind === "truck")) waves.trucks += 1;
        const coins = fresh.filter((e) => e.kind === "coin");
        if (coins.length > 0) {
          assert.ok(coins.length >= 3 && coins.length <= 5, `${coins.length} coins`);
          assert.equal(new Set(coins.map((c) => c.lane)).size, 1, "a trail sits in a single lane");
          assert.ok(!lanes.has(coins[0].lane), "coins sit in a free lane");
          waves.coinTrails += 1;
        }
      }
      // Dynamic invariants over everything on the road right now.
      const list = obstacles(s);
      const edges = new Set();
      for (const e of list) {
        edges.add(e.ahead);
        edges.add(e.ahead + entityLength(e.kind) - CAR_LENGTH);
      }
      for (const from of edges) {
        const blocked = blockedLanes(s, from);
        assert.ok(blocked.size <= LANES - 1, `all lanes blocked in window ${from.toFixed(2)} at t=${s.time.toFixed(2)}`);
      }
      // No two things share road space in a lane (cars never drive through each other).
      const byLane = new Map();
      for (const e of s.entities) {
        const spans = byLane.get(e.lane) ?? [];
        spans.push([e.ahead, e.ahead + entityLength(e.kind)]);
        byLane.set(e.lane, spans);
      }
      for (const spans of byLane.values()) {
        spans.sort((a, b) => a[0] - b[0]);
        for (let i = 1; i < spans.length; i += 1) {
          assert.ok(spans[i][0] >= spans[i - 1][1] - 1e-9, `overlap in lane at t=${s.time.toFixed(2)}`);
        }
      }
    });
    assert.deepEqual([...waves.sizes].sort(), [1, 2, 3]);
    assert.ok(waves.trucks > 3, `${waves.trucks} truck waves`);
    assert.ok(waves.coinTrails > 5, `${waves.coinTrails} coin trails`);
  });
}

test("the generator budgets lane changes: gaps between waves leave time to move over", () => {
  // Reconstruct, from the road itself, when each wave's tail clears the player and when the next
  // wave's head arrives, and check a generous lane-change budget fits between the two.
  const state = createRace({ seed: 606 });
  startRace(state);
  const waves = [];
  const known = new Set();
  ghostRunFromCountdown(state, 150, (s) => {
    const fresh = s.entities.filter((e) => !known.has(e.id) && e.kind !== "coin");
    fresh.forEach((e) => known.add(e.id));
    s.entities.forEach((e) => known.add(e.id));
    if (fresh.length === 0) return;
    const lanes = new Set(fresh.map((e) => e.lane));
    const free = [0, 1, 2, 3].filter((l) => !lanes.has(l));
    waves.push({ ids: fresh.map((e) => e.id), free, born: s.time, speed: entitySpeed(s, fresh[0]) });
  });
  assert.ok(waves.length > 40);
  // Re-simulate and measure when each wave's tail clears the player and when its head arrives.
  const replay = createRace({ seed: 606 });
  startRace(replay);
  const clearAt = new Map();
  const arriveAt = new Map();
  ghostRunFromCountdown(replay, 150, (s) => {
    const byId = new Map(s.entities.map((e) => [e.id, e]));
    waves.forEach((wave, index) => {
      const alive = wave.ids.map((id) => byId.get(id)).filter(Boolean);
      if (alive.length === 0) return;
      if (!arriveAt.has(index) && alive.length === wave.ids.length && Math.min(...alive.map((e) => e.ahead)) <= 0) {
        arriveAt.set(index, s.time);
      }
      if (!clearAt.has(index) && Math.max(...alive.map((e) => e.ahead + entityLength(e.kind))) <= -CAR_LENGTH) {
        clearAt.set(index, s.time);
      }
    });
  }, 1 / 120);
  let checked = 0;
  let tightest = Infinity;
  for (let w = 0; w + 1 < waves.length; w += 1) {
    if (!clearAt.has(w) || !arriveAt.has(w + 1)) continue;
    const lanes = Math.min(...waves[w].free.flatMap((f) => waves[w + 1].free.map((g) => Math.abs(f - g))));
    const window = arriveAt.get(w + 1) - clearAt.get(w);
    // Real lane changes take about 0.19 / 0.26 / 0.31 s for 1 / 2 / 3 lanes: demand at least that, plus a margin.
    const needed = [0, 0.19, 0.26, 0.31][lanes] + 0.05;
    assert.ok(window >= needed, `wave ${w}: ${window.toFixed(3)}s window for ${lanes} lanes`);
    tightest = Math.min(tightest, window - needed);
    checked += 1;
  }
  assert.ok(checked > 30);
});

// A bot with perfect knowledge of the future: it searches lane plans on cloned engine states
// (clones include the PRNG, so spawns are exactly the real ones) and follows the first step.
function makeBot({ slot = 0.25, depth = 24, budget = 40000 } = {}) {
  function simulate(state, lane) {
    const next = structuredClone(state);
    setTargetLane(next, lane);
    for (let i = 0; i < 5; i += 1) advance(next, slot / 5);
    return next;
  }
  function plan(state, remaining, counter) {
    if (remaining === 0) return [];
    const current = state.targetLane;
    const options = [current, current - 1, current + 1, current - 2, current + 2, current - 3, current + 3].filter(
      (lane, index, all) => lane >= 0 && lane < LANES && all.indexOf(lane) === index,
    );
    for (const lane of options) {
      if (counter.nodes > budget) return null;
      counter.nodes += 1;
      const next = simulate(state, lane);
      if (next.status === "crashed") continue;
      const rest = plan(next, remaining - 1, counter);
      if (rest) return [lane, ...rest];
    }
    return null;
  }
  return {
    slot,
    choose(state) {
      for (const horizon of [depth, 16, 8, 4, 2]) {
        const found = plan(state, horizon, { nodes: 0 });
        if (found) return found[0];
      }
      return state.targetLane;
    },
  };
}

function runBot(seed, seconds) {
  const bot = makeBot();
  const state = createRace({ seed });
  startRace(state);
  run(state, COUNTDOWN_SECONDS, 1 / 60);
  const slots = Math.round(seconds / bot.slot);
  for (let i = 0; i < slots && state.status === "running"; i += 1) {
    setTargetLane(state, bot.choose(state));
    for (let k = 0; k < 5; k += 1) advance(state, bot.slot / 5);
    assertFinite(state);
  }
  return state;
}

test("a perfect bot survives 120 s of play (default seed)", () => {
  const state = runBot(DEFAULT_SEED, 120);
  assert.equal(state.status, "running", `crashed at ${state.time}s`);
  assert.ok(state.time > 119.9);
  assert.ok(state.speed > 0.8 * MAX_SPEED);
  assert.ok(state.score > 3000);
  assert.ok(state.coins > 0, "the bot picks up coins on its way");
});

test("a perfect bot survives on other seeds too", () => {
  for (const seed of [7, 31337]) {
    const state = runBot(seed, 90);
    assert.equal(state.status, "running", `seed ${seed} crashed at ${state.time}s`);
  }
});

test("a player who never steers eventually crashes (and the engine never breaks)", () => {
  const state = createRace({ seed: 3 });
  startRace(state);
  run(state, 60);
  assert.equal(state.status, "crashed");
  assert.ok(state.time < 40);
});

// ---------------------------------------------------------------------------------------------
// Collisions, crash, coins, near misses
// ---------------------------------------------------------------------------------------------

test("hitting a car crashes: speed drops to zero, best updates, events and timers behave", () => {
  const state = goRace({ best: 10 });
  run(state, 2, 1 / 120);
  state.entities.length = 0;
  inject(state, "car", state.targetLane, 25);
  const injectedAt = state.time;
  for (let i = 0; i < 240 && state.status === "running"; i += 1) advance(state, 1 / 120);
  assert.equal(state.status, "crashed");
  const crashedAfter = state.time - injectedAt;
  assert.ok(crashedAfter > 0.5 && crashedAfter < 0.8, `crash ${crashedAfter}s after the car appeared`);
  const events = drainEvents(state);
  assert.equal(events.filter((e) => e.type === "crash").length, 1);
  assert.equal(events.find((e) => e.type === "crash").lane, state.targetLane);
  assert.equal(state.shake, 1);
  assert.ok(state.best >= state.score && state.best > 10);
  assert.equal(isNewBest(state), true);
  const frozen = {
    distance: state.distance,
    score: state.score,
    ahead: state.entities.map((e) => e.ahead),
    laneX: state.laneX,
  };
  const startSpeed = state.speed;
  assert.ok(startSpeed > 0);
  let previousSpeed = startSpeed;
  let previousTime = state.crashTime;
  for (let i = 0; i < 360; i += 1) {
    advance(state, 1 / 120);
    assert.ok(state.speed <= previousSpeed + 1e-12);
    assert.ok(state.crashTime > previousTime);
    previousSpeed = state.speed;
    previousTime = state.crashTime;
  }
  assert.equal(state.speed, 0);
  assert.ok(state.crashTime >= 3 - 1e-9);
  assert.ok(state.crashTime > CRASH_DURATION);
  assert.equal(state.shake, 0, "shake decays on its own");
  assert.equal(state.distance, frozen.distance);
  assert.equal(state.score, frozen.score);
  assert.equal(state.laneX, frozen.laneX);
  assert.deepEqual(
    state.entities.map((e) => e.ahead),
    frozen.ahead,
    "traffic freezes",
  );
  assert.deepEqual(drainEvents(state), [], "no further events after the crash");
  assert.equal(state.status, "crashed");
});

test("a lower score does not replace the best", () => {
  const state = goRace({ best: 5000 });
  inject(state, "car", state.targetLane, 10);
  run(state, 0.5);
  assert.equal(state.status, "crashed");
  assert.equal(state.best, 5000);
  assert.equal(isNewBest(state), false);
});

test("lateral overlap rule: a car one lane away is safe, a car in the lane is not", () => {
  const safe = goRace();
  inject(safe, "car", safe.targetLane + 1, 10);
  inject(safe, "car", safe.targetLane - 1, 10);
  run(safe, 1);
  assert.equal(safe.status, "running");
  const hit = goRace();
  inject(hit, "car", hit.targetLane, 10);
  run(hit, 1);
  assert.equal(hit.status, "crashed");
});

test("the collision band is |lane gap| < CAR_WIDTH + 0.06", () => {
  for (const [offset, crashes] of [
    [COLLISION_GAP - 0.02, true],
    [COLLISION_GAP + 0.03, false],
  ]) {
    const state = goRace();
    state.targetLane = 2;
    state.laneX = 2 - offset;
    state.internal.laneV = 0;
    // Hold the continuous lane position by re-asserting it each frame (the spring would pull it to 2).
    inject(state, "car", 2, 6);
    for (let i = 0; i < 60 && state.status === "running"; i += 1) {
      state.laneX = 2 - offset;
      state.internal.laneV = 0;
      advance(state, 1 / 120);
    }
    assert.equal(state.status === "crashed", crashes, `offset ${offset}`);
  }
});

test("a truck is longer than a car, so it is hit from further behind its rear edge", () => {
  for (const [kind, length] of [
    ["car", CAR_LENGTH],
    ["truck", TRUCK_LENGTH],
  ]) {
    const state = goRace();
    // Place it so it has just passed: front edge a hair past the player's tail.
    inject(state, kind, state.targetLane, -length - CAR_LENGTH + 0.5);
    run(state, 0.05, 1 / 120);
    assert.equal(state.status, "crashed", `${kind} overlapping the tail`);
    const clear = goRace();
    inject(clear, kind, clear.targetLane, -length - CAR_LENGTH - 0.5);
    run(clear, 0.05, 1 / 120);
    assert.equal(clear.status, "running", `${kind} already behind`);
  }
});

test("coins are collected on overlap for +50 once, only in the player's lane", () => {
  const state = goRace();
  const lane = state.targetLane;
  inject(state, "coin", lane, 20);
  inject(state, "coin", lane + 1, 20);
  run(state, 1.5, 1 / 120);
  assert.equal(state.status, "running");
  assert.equal(state.coins, 1);
  assert.equal(state.score, Math.floor(state.distance / 2) + COIN_SCORE);
  const events = drainEvents(state);
  assert.equal(events.filter((e) => e.type === "coin").length, 1);
  assert.equal(events.find((e) => e.type === "coin").lane, lane);
  run(state, 1, 1 / 120);
  assert.equal(state.coins, 1);
});

test("a near miss pays +10, once per car, when dodging a car that passes the lane just left", () => {
  const state = goRace();
  state.targetLane = 2;
  state.laneX = 2;
  inject(state, "car", 2, 12);
  setTargetLane(state, 1);
  run(state, 1.5, 1 / 120);
  assert.equal(state.status, "running");
  assert.equal(state.nearMisses, 1);
  assert.equal(state.score, Math.floor(state.distance / 2) + NEAR_MISS_SCORE);
  const events = drainEvents(state);
  assert.equal(events.filter((e) => e.type === "near-miss").length, 1);
  run(state, 3, 1 / 120);
  assert.equal(state.nearMisses, 1, "never counted twice");
});

test("no near miss for a settled player beside traffic, a distant car, or right after a lane change", () => {
  const settled = goRace();
  inject(settled, "car", settled.targetLane + 1, 12);
  run(settled, 1.5);
  assert.equal(settled.nearMisses, 0);

  const far = goRace();
  far.targetLane = 0;
  far.laneX = 0;
  inject(far, "car", 2, 12);
  run(far, 1.5);
  assert.equal(far.nearMisses, 0);

  // A car passes while the player is squeezed beside it mid-lane: only counts when no lane change just happened.
  const allowed = goRace();
  allowed.targetLane = 2;
  allowed.laneX = 1.85;
  allowed.internal.laneV = 0;
  inject(allowed, "car", 1, -8.9);
  advance(allowed, 1 / 120);
  advance(allowed, 1 / 120);
  assert.equal(allowed.nearMisses, 1);

  const cooling = goRace();
  cooling.targetLane = 2;
  cooling.laneX = 1.85;
  cooling.internal.laneV = 0;
  setTargetLane(cooling, 3);
  setTargetLane(cooling, 2);
  inject(cooling, "car", 1, -8.9);
  advance(cooling, 1 / 120);
  advance(cooling, 1 / 120);
  assert.equal(cooling.nearMisses, 0, "a lane change within the last 0.3 s blocks the bonus");
});

test("the generator never spawns on top of an entity that is already there", () => {
  const state = goRace();
  state.internal.hasWave = 0; // make the generator eager
  for (let lane = 0; lane < LANES; lane += 1) inject(state, "car", lane, SPAWN_AHEAD + 2);
  const wall = new Set(state.entities.map((e) => e.id));
  let spawnedAfterWall = 0;
  for (let i = 0; i < 240; i += 1) {
    state.laneX = -100;
    advance(state, 1 / 120);
    const byLane = new Map();
    for (const e of state.entities) {
      const spans = byLane.get(e.lane) ?? [];
      spans.push([e.ahead, e.ahead + entityLength(e.kind)]);
      byLane.set(e.lane, spans);
      if (!wall.has(e.id)) spawnedAfterWall += 1;
    }
    for (const spans of byLane.values()) {
      spans.sort((a, b) => a[0] - b[0]);
      for (let k = 1; k < spans.length; k += 1) assert.ok(spans[k][0] >= spans[k - 1][1], "no overlap");
    }
  }
  assert.ok(spawnedAfterWall > 0, "traffic resumes once the space is free");
});

test("entitySpeed reports the wave speed, and 0 for entities the engine did not create", () => {
  const state = goRace();
  const id = inject(state, "car", 0, 50);
  const stray = state.entities.find((e) => e.id === id);
  assert.equal(entitySpeed(state, stray), 0);
  run(state, 3, 1 / 60);
  const spawned = state.entities.filter((e) => e.id !== id);
  assert.ok(spawned.length > 0);
  for (const e of spawned) assert.ok(entitySpeed(state, e) >= 12 && entitySpeed(state, e) <= 26);
});

// ---------------------------------------------------------------------------------------------
// Restart
// ---------------------------------------------------------------------------------------------

test("startRace after a crash resets the run but keeps best and continues the PRNG stream", () => {
  const state = createRace({ seed: 11 });
  startRace(state);
  run(state, 60);
  assert.equal(state.status, "crashed");
  const best = state.best;
  assert.ok(best > 0);
  const firstRun = JSON.stringify(state.entities.map((e) => [e.lane, e.kind]));
  const rngBefore = state.internal.rng;
  startRace(state);
  assert.equal(state.status, "countdown");
  assert.equal(state.countdown, COUNTDOWN_SECONDS);
  assert.equal(state.best, best);
  assert.equal(state.distance, 0);
  assert.equal(state.score, 0);
  assert.equal(state.coins, 0);
  assert.equal(state.nearMisses, 0);
  assert.equal(state.time, 0);
  assert.equal(state.crashTime, 0);
  assert.equal(state.shake, 0);
  assert.equal(state.speed, MIN_SPEED);
  assert.equal(state.targetLane, 1);
  assert.deepEqual(state.entities, []);
  assert.equal(isNewBest(state), false);
  assert.equal(state.internal.rng, rngBefore, "the stream continues, it is not reseeded");
  assert.ok(drainEvents(state).some((e) => e.type === "start"));
  run(state, 3.5);
  assert.notEqual(JSON.stringify(state.entities.map((e) => [e.lane, e.kind])), firstRun);
});

test("restarts are reproducible from the seed", () => {
  const play = () => {
    const state = createRace({ seed: 99 });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      startRace(state);
      run(state, 45);
      assert.equal(state.status, "crashed");
    }
    return snapshot(state);
  };
  assert.deepEqual(play(), play());
});

test("restart leaves no stale traffic speeds behind", () => {
  const state = createRace({ seed: 12 });
  startRace(state);
  run(state, 30);
  assert.equal(state.status, "crashed");
  startRace(state);
  assert.deepEqual(
    Object.keys(state.internal).filter((key) => /^v\d+$/.test(key)),
    [],
  );
  run(state, 20);
  const live = new Set(state.entities.map((e) => `v${e.id}`));
  for (const key of Object.keys(state.internal)) {
    if (/^v\d+$/.test(key)) assert.ok(live.has(key), `leaked ${key}`);
  }
});

// ---------------------------------------------------------------------------------------------
// Robustness
// ---------------------------------------------------------------------------------------------

test("dt of zero, NaN, negative or huge never produces NaN or Infinity", () => {
  const dts = [0, -1, -0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1e9, 1e-12, 0.05, 5];
  const state = createRace({ seed: 4 });
  for (const dt of dts) {
    advance(state, dt);
    assertFinite(state);
  }
  startRace(state);
  let longest = 0;
  for (let round = 0; round < 40; round += 1) {
    for (const dt of dts) {
      advance(state, dt);
      assertFinite(state);
      longest = Math.max(longest, state.time);
    }
    if (state.status === "crashed") startRace(state);
    if (round === 5) pauseRace(state);
    if (round === 6) resumeRace(state);
  }
  assert.ok(longest > 1, "the race really ran");
});

test("non-positive and NaN frames change nothing", () => {
  const state = goRace();
  run(state, 0.5);
  const before = snapshot(state);
  advance(state, 0);
  advance(state, -3);
  advance(state, Number.NaN);
  assert.deepEqual(snapshot(state), before);
});

test("long soak: a ghost lap of 10 minutes stays finite and bounded", () => {
  const state = createRace({ seed: 1234 });
  startRace(state);
  let peak = 0;
  ghostRunFromCountdown(
    state,
    600,
    (s) => {
      peak = Math.max(peak, s.entities.length);
      if ((s.internal.tick & 255) === 0) assertFinite(s);
    },
    1 / 20,
  );
  assertFinite(state);
  assert.ok(peak < 60, `peak entities ${peak}`);
  assert.ok(state.speed <= MAX_SPEED);
  assert.ok(Object.keys(state.internal).length < 100, "internal bookkeeping stays small");
});
