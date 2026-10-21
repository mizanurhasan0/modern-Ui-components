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

const market = loadTypeScript("components/site/desk/marketplace-state.ts");
const {
  PRODUCTS,
  LEDGER_LIMIT,
  advance,
  advanceTo,
  actorStatus,
  commissionFor,
  completedMarketState,
  createMarketState,
  currentActor,
  describeStep,
  formatMoney,
  formatOrderId,
  phaseOf,
  primaryActionLabel,
  selectProduct,
} = market;

const STEP_ORDER = ["idle", "listed", "shared", "ordered", "paid"];

function runOrder(state) {
  let next = state;
  for (let index = 0; index < STEP_ORDER.length; index += 1) {
    next = advance(next);
  }
  return next;
}

test("initial state is deterministic: 12 orders and $1,240 commission", () => {
  const first = createMarketState();
  const second = createMarketState();
  assert.deepEqual(first, second);
  assert.equal(first.step, "idle");
  assert.equal(first.orders, 12);
  assert.equal(formatMoney(first.commission), "$1,240");
  assert.equal(first.ledger.length, LEDGER_LIMIT);
  assert.deepEqual(
    first.ledger.map((entry) => entry.orderId),
    ["MP-1012", "MP-1011", "MP-1010"],
  );
  assert.equal(PRODUCTS.length, 3);
});

test("commission is 8% of the order amount in integer cents", () => {
  assert.equal(commissionFor(5000), 400);
  assert.equal(commissionFor(7500), 600);
  assert.equal(commissionFor(12500), 1000);
  assert.equal(commissionFor(0), 0);
  assert.ok(Number.isInteger(commissionFor(4999)));
  for (const entry of createMarketState().ledger) {
    assert.equal(entry.commission, commissionFor(entry.amount));
  }
});

test("money and order ids format without locale dependence", () => {
  assert.equal(formatMoney(124000), "$1,240");
  assert.equal(formatMoney(5000), "$50");
  assert.equal(formatMoney(1250), "$12.50");
  assert.equal(formatMoney(1250000), "$12,500");
  assert.equal(formatMoney(0), "$0");
  assert.equal(formatOrderId(13), "MP-1013");
});

test("a full order walks idle -> listed -> shared -> ordered -> paid", () => {
  let state = createMarketState();
  const seen = [state.step];
  for (let index = 0; index < 4; index += 1) {
    state = advance(state);
    seen.push(state.step);
  }
  assert.deepEqual(seen, STEP_ORDER);
  assert.deepEqual(advanceTo(createMarketState(), "paid"), state);
  assert.deepEqual(completedMarketState(), state);
});

test("only the paid step credits the promoter and adds a ledger row", () => {
  const start = createMarketState();
  const ordered = advanceTo(start, "ordered");
  assert.equal(ordered.orders, start.orders);
  assert.equal(ordered.commission, start.commission);
  assert.deepEqual(ordered.ledger, start.ledger);

  const paid = advance(ordered);
  assert.equal(paid.step, "paid");
  assert.equal(paid.orders, 13);
  assert.equal(paid.commission, start.commission + 400);
  assert.equal(paid.ledger.length, LEDGER_LIMIT);
  assert.deepEqual(paid.ledger[0], {
    orderId: "MP-1013",
    productId: "linen-tote",
    product: "Linen tote",
    amount: 5000,
    commission: 400,
  });
});

test("run another order loops back to idle with the next product", () => {
  let state = createMarketState();
  const listed = [];
  for (let index = 0; index < PRODUCTS.length + 1; index += 1) {
    listed.push(PRODUCTS[state.productIndex].id);
    state = runOrder(state);
    assert.equal(state.step, "idle");
  }
  assert.deepEqual(listed, [
    PRODUCTS[0].id,
    PRODUCTS[1].id,
    PRODUCTS[2].id,
    PRODUCTS[0].id,
  ]);
});

test("the ledger is capped at three rows, newest first, and totals stay exact", () => {
  let state = createMarketState();
  let expectedCommission = state.commission;
  for (let order = 0; order < 7; order += 1) {
    const product = PRODUCTS[state.productIndex];
    expectedCommission += commissionFor(product.price);
    state = runOrder(state);
    assert.ok(state.ledger.length <= LEDGER_LIMIT);
  }
  assert.equal(state.orders, 19);
  assert.equal(state.commission, expectedCommission);
  assert.deepEqual(
    state.ledger.map((entry) => entry.orderId),
    ["MP-1019", "MP-1018", "MP-1017"],
  );
});

test("advance never mutates the state it receives", () => {
  const state = createMarketState();
  const snapshot = JSON.stringify(state);
  const ordered = advanceTo(state, "ordered");
  const orderedSnapshot = JSON.stringify(ordered);
  advance(ordered);
  assert.equal(JSON.stringify(state), snapshot);
  assert.equal(JSON.stringify(ordered), orderedSnapshot);
});

test("selectProduct only changes the pick before listing and ignores bad indexes", () => {
  const idle = createMarketState();
  assert.equal(selectProduct(idle, 2).productIndex, 2);
  assert.equal(selectProduct(idle, 0), idle);
  assert.equal(selectProduct(idle, -1), idle);
  assert.equal(selectProduct(idle, 3), idle);
  assert.equal(selectProduct(idle, 1.5), idle);

  const listed = advance(selectProduct(idle, 2));
  assert.equal(listed.productIndex, 2);
  assert.equal(selectProduct(listed, 1), listed);
  assert.equal(describeStep(listed).includes(PRODUCTS[2].name), true);
});

test("each step has one acting actor, one primary label and a phase", () => {
  assert.deepEqual(STEP_ORDER.map(currentActor), [
    "seller",
    "promoter",
    "shopper",
    "shopper",
    "promoter",
  ]);
  assert.deepEqual(STEP_ORDER.map(primaryActionLabel), [
    "Add product",
    "Share link",
    "Place order",
    null,
    "Run another order",
  ]);
  assert.deepEqual(STEP_ORDER.map(phaseOf), [
    "catalog",
    "catalog",
    "catalog",
    "order",
    "commission",
  ]);
});

test("status copy and announcements are non-empty for every step and actor", () => {
  let state = createMarketState();
  for (let index = 0; index < 6; index += 1) {
    assert.ok(describeStep(state).length > 0);
    for (const actor of ["seller", "promoter", "shopper"]) {
      assert.ok(actorStatus(state, actor, "short").length > 0);
      assert.ok(actorStatus(state, actor, "long").length > 0);
    }
    state = advance(state);
  }
  const paid = completedMarketState();
  assert.match(describeStep(paid), /MP-1013/);
  assert.match(describeStep(paid), /\$4 /);
  assert.match(describeStep(paid), /13 orders/);
  assert.equal(actorStatus(paid, "promoter", "short"), "+$4");
});
