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

const crm = loadTypeScript("components/site/desk/crm-state.ts");
const {
  COLUMN_CAP,
  STAGES,
  autoplayStep,
  canMoveTo,
  countIn,
  createInitialState,
  formatAge,
  formatMoney,
  isFull,
  leadsIn,
  moveLead,
  receiveLead,
  reset,
  stageCount,
  wonRevenue,
} = crm;

const ids = (state, stage) => leadsIn(state, stage).map((lead) => lead.id);

function snapshot(state) {
  return JSON.parse(JSON.stringify(state));
}

test("initial state is deterministic and fits every column", () => {
  const a = createInitialState();
  const b = createInitialState();
  assert.deepEqual(snapshot(a), snapshot(b));
  assert.deepEqual(STAGES, ["new", "calling", "won"]);
  assert.deepEqual(ids(a, "new"), ["lead-1", "lead-2", "lead-3"]);
  assert.deepEqual(ids(a, "calling"), ["lead-4", "lead-5"]);
  assert.deepEqual(ids(a, "won"), ["lead-6"]);
  for (const stage of STAGES) assert.ok(countIn(a, stage) <= COLUMN_CAP);
  assert.equal(new Set(a.leads.map((lead) => lead.id)).size, a.leads.length);
});

test("lead data is fictional and compact enough for a small card", () => {
  const state = createInitialState();
  for (const lead of state.leads) {
    assert.ok(lead.person.length <= 12, lead.person);
    assert.ok(lead.company.length <= 14, lead.company);
    assert.ok(lead.value > 0);
  }
});

test("moveLead puts the lead on top of the target column without mutating", () => {
  const start = createInitialState();
  const before = snapshot(start);
  const moved = moveLead(start, "lead-5", "won");
  assert.deepEqual(snapshot(start), before);
  assert.notEqual(moved, start);
  assert.deepEqual(ids(moved, "won"), ["lead-5", "lead-6"]);
  assert.deepEqual(ids(moved, "calling"), ["lead-4"]);
  assert.equal(moved.leads.length, start.leads.length);

  const backwards = moveLead(moved, "lead-5", "new");
  assert.deepEqual(ids(backwards, "new"), ["lead-5", "lead-1", "lead-2", "lead-3"]);
});

test("moveLead returns the same state for unknown ids and no-op moves", () => {
  const start = createInitialState();
  assert.equal(moveLead(start, "missing", "won"), start);
  assert.equal(moveLead(start, "lead-1", "new"), start);
  assert.equal(canMoveTo(start, "missing", "won"), false);
  assert.equal(canMoveTo(start, "lead-1", "new"), false);
  assert.equal(canMoveTo(start, "lead-1", "calling"), true);
});

test("columns other than Won refuse a sixth card", () => {
  let state = createInitialState();
  state = moveLead(state, "lead-1", "calling");
  state = moveLead(state, "lead-2", "calling");
  state = moveLead(state, "lead-3", "calling");
  assert.equal(countIn(state, "calling"), COLUMN_CAP);
  assert.equal(isFull(state, "calling"), true);

  const extra = receiveLead(state);
  assert.equal(countIn(extra, "new"), 1);
  assert.equal(moveLead(extra, extra.leads[0].id, "calling"), extra);
  assert.equal(canMoveTo(extra, extra.leads[0].id, "calling"), false);
});

test("receiveLead stops at the New cap and returns the same state", () => {
  let state = createInitialState();
  state = receiveLead(state);
  state = receiveLead(state);
  assert.equal(countIn(state, "new"), COLUMN_CAP);
  assert.equal(isFull(state, "new"), true);
  assert.equal(receiveLead(state), state);
  assert.equal(state.received, 2);
});

test("receiveLead adds the next queued lead on top and ages the rest", () => {
  const start = createInitialState();
  const next = receiveLead(start);
  const arrived = next.leads[0];
  assert.equal(arrived.stage, "new");
  assert.equal(arrived.age, 0);
  assert.equal(arrived.id, "inbound-1");
  assert.equal(next.received, 1);
  assert.equal(next.leads.length, start.leads.length + 1);
  assert.deepEqual(
    next.leads.slice(1).map((lead) => lead.age),
    start.leads.map((lead) => lead.age + 1),
  );
  // Deterministic: the same call always yields the same lead.
  assert.deepEqual(snapshot(receiveLead(createInitialState())), snapshot(next));
});

test("the inbound queue wraps with unique ids", () => {
  let state = createInitialState();
  const seen = new Set(state.leads.map((lead) => lead.id));
  for (let index = 0; index < 25; index += 1) {
    state = receiveLead(state);
    const arrived = state.leads[0];
    assert.ok(!seen.has(arrived.id), arrived.id);
    seen.add(arrived.id);
    // Clear the board so "New" never fills up.
    state = moveLead(state, arrived.id, "won");
  }
  assert.equal(state.received, 25);
});

test("wonRevenue sums won deals and follows leads in and out of Won", () => {
  const start = createInitialState();
  assert.equal(wonRevenue(start), 11800 + 7400);
  const won = moveLead(start, "lead-4", "won");
  assert.equal(wonRevenue(won), 11800 + 7400 + 9800);
  assert.equal(stageCount(won, "won"), 2 + 2);
  const undone = moveLead(won, "lead-4", "calling");
  assert.equal(wonRevenue(undone), wonRevenue(start));
});

test("a full Won column archives its oldest card but keeps the revenue", () => {
  let state = createInitialState();
  state = moveLead(state, "lead-4", "won");
  state = moveLead(state, "lead-5", "won");
  state = moveLead(state, "lead-1", "won");
  state = moveLead(state, "lead-2", "won");
  assert.equal(countIn(state, "won"), COLUMN_CAP);
  assert.equal(isFull(state, "won"), false);
  const revenueBefore = wonRevenue(state);
  const countBefore = stageCount(state, "won");

  const overflow = moveLead(state, "lead-3", "won");
  assert.equal(countIn(overflow, "won"), COLUMN_CAP);
  assert.equal(overflow.archivedWon, state.archivedWon + 1);
  assert.equal(ids(overflow, "won")[0], "lead-3");
  assert.ok(!overflow.leads.some((lead) => lead.id === "lead-6"));
  assert.equal(wonRevenue(overflow), revenueBefore + 6500);
  assert.equal(stageCount(overflow, "won"), countBefore + 1);
});

test("reset returns the initial state", () => {
  let state = createInitialState();
  state = receiveLead(moveLead(state, "lead-4", "won"));
  assert.notDeepEqual(snapshot(state), snapshot(createInitialState()));
  assert.deepEqual(snapshot(reset()), snapshot(createInitialState()));
});

test("autoplay runs a deterministic New -> Calling -> Won -> arrival cycle", () => {
  const first = autoplayStep(createInitialState(), 0);
  assert.deepEqual(first.event, { kind: "move", id: "lead-3", from: "new", to: "calling" });
  const second = autoplayStep(first.state, 1);
  assert.deepEqual(second.event, { kind: "move", id: "lead-5", from: "calling", to: "won" });
  assert.ok(wonRevenue(second.state) > wonRevenue(createInitialState()));
  const third = autoplayStep(second.state, 2);
  assert.deepEqual(third.event, { kind: "receive", id: "inbound-1" });
  assert.equal(third.state.leads[0].id, "inbound-1");
});

test("autoplay can loop forever without breaking a cap", () => {
  const run = () => {
    let state = createInitialState();
    const events = [];
    for (let tick = 0; tick < 120; tick += 1) {
      const step = autoplayStep(state, tick);
      state = step.state;
      events.push(step.event);
      for (const stage of STAGES) {
        assert.ok(countIn(state, stage) <= COLUMN_CAP, `${stage} at tick ${tick}`);
      }
      assert.equal(
        new Set(state.leads.map((lead) => lead.id)).size,
        state.leads.length,
      );
    }
    return { state, events };
  };
  const a = run();
  const b = run();
  assert.deepEqual(snapshot(a.state), snapshot(b.state));
  assert.deepEqual(a.events, b.events);
  assert.ok(a.events.every((event) => event.kind !== "idle"));
  // Nothing is lost: every lead is on the board or counted as archived.
  assert.equal(
    a.state.leads.length + a.state.archivedWon,
    6 + 2 + a.state.received,
  );
  // Revenue only ever grows during the loop.
  assert.ok(wonRevenue(a.state) > wonRevenue(createInitialState()));
});

test("autoplay stays idle instead of failing on an empty column", () => {
  let state = createInitialState();
  for (const id of ["lead-1", "lead-2", "lead-3"]) state = moveLead(state, id, "calling");
  state = { ...state, leads: state.leads.filter((lead) => lead.stage !== "new") };
  const step = autoplayStep(state, 0);
  assert.deepEqual(step.event, { kind: "idle" });
  assert.equal(step.state, state);
});

test("formatters stay short enough for a card chip", () => {
  assert.equal(formatMoney(950), "$950");
  assert.equal(formatMoney(4200), "$4.2k");
  assert.equal(formatMoney(12000), "$12k");
  assert.equal(formatMoney(19200), "$19.2k");
  assert.equal(formatMoney(1_000_000), "$1M");
  assert.equal(formatMoney(2_450_000), "$2.5M");
  assert.equal(formatAge(0), "just now");
  assert.equal(formatAge(2), "2m ago");
  assert.equal(formatAge(59), "59m ago");
  assert.equal(formatAge(125), "2h ago");
});
