/**
 * Pure state machine for the MyPick marketplace demo screen.
 *
 * Flow: idle -> listed -> shared -> ordered -> paid -> (next product) idle.
 * All money is stored as integer cents so commission maths stays exact.
 * No React, no Date, no Math.random: every value here is deterministic.
 */

export type MarketStep = "idle" | "listed" | "shared" | "ordered" | "paid";
export type MarketActor = "seller" | "promoter" | "shopper";

export const MARKET_STEPS: readonly MarketStep[] = [
  "idle",
  "listed",
  "shared",
  "ordered",
  "paid",
];

/** Promoter commission on every paid order (8%). */
export const COMMISSION_RATE = 0.08;
/** How many recent orders the ledger keeps. */
export const LEDGER_LIMIT = 3;
/** Orders and commission (cents) shown before anything happens. */
export const INITIAL_ORDERS = 12;
export const INITIAL_COMMISSION = 124000;

export interface MarketProduct {
  id: string;
  name: string;
  /** Price in cents. */
  price: number;
}

export const PRODUCTS: readonly MarketProduct[] = [
  { id: "linen-tote", name: "Linen tote", price: 5000 },
  { id: "pour-over-kit", name: "Pour-over kit", price: 7500 },
  { id: "desk-lamp", name: "Desk lamp", price: 12500 },
];

export interface LedgerEntry {
  orderId: string;
  productId: string;
  product: string;
  /** Order amount in cents. */
  amount: number;
  /** Promoter commission in cents. */
  commission: number;
}

export interface MarketState {
  step: MarketStep;
  /** Index into PRODUCTS: the product listed (or about to be listed). */
  productIndex: number;
  orders: number;
  /** Total promoter commission in cents. */
  commission: number;
  /** Newest first, never longer than LEDGER_LIMIT. */
  ledger: readonly LedgerEntry[];
}

export function commissionFor(amount: number): number {
  return Math.round(amount * COMMISSION_RATE);
}

export function formatOrderId(orderNumber: number): string {
  return `MP-${1000 + orderNumber}`;
}

/** "$1,240" for whole dollars, "$12.50" otherwise. Locale independent. */
export function formatMoney(cents: number): string {
  const rounded = Math.round(cents);
  const sign = rounded < 0 ? "-" : "";
  const absolute = Math.abs(rounded);
  const dollars = String(Math.floor(absolute / 100)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );
  const remainder = absolute % 100;
  const fraction = remainder === 0 ? "" : `.${String(remainder).padStart(2, "0")}`;
  return `${sign}$${dollars}${fraction}`;
}

function seedLedger(): LedgerEntry[] {
  const seed: [number, string][] = [
    [12, "desk-lamp"],
    [11, "pour-over-kit"],
    [10, "linen-tote"],
  ];
  return seed.map(([orderNumber, productId]) => {
    const product = PRODUCTS.find((item) => item.id === productId) ?? PRODUCTS[0];
    return {
      orderId: formatOrderId(orderNumber),
      productId: product.id,
      product: product.name,
      amount: product.price,
      commission: commissionFor(product.price),
    };
  });
}

export function createMarketState(): MarketState {
  return {
    step: "idle",
    productIndex: 0,
    orders: INITIAL_ORDERS,
    commission: INITIAL_COMMISSION,
    ledger: seedLedger(),
  };
}

export function stepIndex(step: MarketStep): number {
  return MARKET_STEPS.indexOf(step);
}

export function productFor(state: MarketState): MarketProduct {
  const count = PRODUCTS.length;
  return PRODUCTS[((state.productIndex % count) + count) % count];
}

/** The actor whose turn it is (also the actor highlighted on screen). */
export function currentActor(step: MarketStep): MarketActor {
  switch (step) {
    case "idle":
      return "seller";
    case "listed":
      return "promoter";
    case "shared":
    case "ordered":
      return "shopper";
    case "paid":
      return "promoter";
  }
}

/** Label of the one primary button for this step, or null while payment settles. */
export function primaryActionLabel(step: MarketStep): string | null {
  switch (step) {
    case "idle":
      return "Add product";
    case "listed":
      return "Share link";
    case "shared":
      return "Place order";
    case "ordered":
      return null;
    case "paid":
      return "Run another order";
  }
}

/** Choose the product to list. Only possible before it has been listed. */
export function selectProduct(state: MarketState, index: number): MarketState {
  if (state.step !== "idle") return state;
  if (!Number.isInteger(index) || index < 0 || index >= PRODUCTS.length) {
    return state;
  }
  if (index === state.productIndex) return state;
  return { ...state, productIndex: index };
}

/** Move one step forward. paid wraps to idle with the next product selected. */
export function advance(state: MarketState): MarketState {
  switch (state.step) {
    case "idle":
      return { ...state, step: "listed" };
    case "listed":
      return { ...state, step: "shared" };
    case "shared":
      return { ...state, step: "ordered" };
    case "ordered": {
      const product = productFor(state);
      const orders = state.orders + 1;
      const entry: LedgerEntry = {
        orderId: formatOrderId(orders),
        productId: product.id,
        product: product.name,
        amount: product.price,
        commission: commissionFor(product.price),
      };
      return {
        ...state,
        step: "paid",
        orders,
        commission: state.commission + entry.commission,
        ledger: [entry, ...state.ledger].slice(0, LEDGER_LIMIT),
      };
    }
    case "paid":
      return {
        ...state,
        step: "idle",
        productIndex: (state.productIndex + 1) % PRODUCTS.length,
      };
  }
}

/** Advance until the target step is reached (at most one full loop). */
export function advanceTo(state: MarketState, target: MarketStep): MarketState {
  let next = state;
  for (let guard = 0; guard < MARKET_STEPS.length && next.step !== target; guard += 1) {
    next = advance(next);
  }
  return next;
}

/** A finished order: used for the static (reduced motion / no-JS) frame. */
export function completedMarketState(): MarketState {
  return advanceTo(createMarketState(), "paid");
}

/** Order id of the order currently being processed (or the one just paid). */
export function activeOrderId(state: MarketState): string {
  return state.step === "paid" && state.ledger[0]
    ? state.ledger[0].orderId
    : formatOrderId(state.orders + 1);
}

export type StatusVariant = "short" | "long";

/** Status copy for an actor card. "short" fits a ~70px preview card. */
export function actorStatus(
  state: MarketState,
  actor: MarketActor,
  variant: StatusVariant,
): string {
  const product = productFor(state);
  const price = formatMoney(product.price);
  const commission = formatMoney(commissionFor(product.price));
  const long = variant === "long";
  const { step } = state;

  switch (actor) {
    case "seller":
      if (step === "idle") {
        return long ? "Choose a product to list in the catalog." : "Ready to list";
      }
      return long ? `Listed ${product.name} for ${price}.` : product.name;
    case "promoter":
      switch (step) {
        case "idle":
          return long ? "Waiting for a product to promote." : "Waiting";
        case "listed":
          return long ? "The product is live. Share your promo link." : "Ready to share";
        case "shared":
          return long ? "Link shared with a shopper." : "Link shared";
        case "ordered":
          return long ? "Waiting for the payment to clear." : "Link shared";
        case "paid":
          return long ? `Earned ${commission} commission (8%).` : `+${commission}`;
      }
      return "";
    case "shopper":
      switch (step) {
        case "idle":
        case "listed":
          return long ? "Browsing the marketplace." : "Browsing";
        case "shared":
          return long ? "Opened the promoter's link." : "Ready to buy";
        case "ordered":
          return long ? `Order placed for ${price}.` : `Order ${price}`;
        case "paid":
          return long ? `Paid ${price}. Order complete.` : `Paid ${price}`;
      }
      return "";
  }
}

/** Screen-reader announcement for the state we just moved into. */
export function describeStep(state: MarketState): string {
  const product = productFor(state);
  const price = formatMoney(product.price);
  switch (state.step) {
    case "idle":
      return `Ready for another order. Seller's turn. Next product is ${product.name}.`;
    case "listed":
      return `Seller listed ${product.name} for ${price}. Promoter's turn: share the link.`;
    case "shared":
      return "Promoter shared the link. Shopper's turn: place the order.";
    case "ordered":
      return `Shopper ordered ${product.name} for ${price}. Payment is settling.`;
    case "paid": {
      const entry = state.ledger[0];
      const credited = entry ? formatMoney(entry.commission) : formatMoney(0);
      return `Order ${activeOrderId(state)} paid. Commission of ${credited} credited to the promoter wallet. ${state.orders} orders and ${formatMoney(state.commission)} commission in total.`;
    }
  }
}

/** Phase of the progress track the flow is currently in. */
export type MarketPhase = "catalog" | "order" | "commission";

export function phaseOf(step: MarketStep): MarketPhase {
  switch (step) {
    case "idle":
    case "listed":
    case "shared":
      return "catalog";
    case "ordered":
      return "order";
    case "paid":
      return "commission";
  }
}
