/**
 * Pure pipeline logic for the sales CRM screen. No React, no clocks, no
 * randomness: every function returns a new state (or the very same reference
 * when nothing changed) so the UI can compare by identity.
 */

export type Stage = "new" | "calling" | "won";

export type Lead = {
  readonly id: string;
  readonly person: string;
  readonly company: string;
  /** Deal value in whole dollars. */
  readonly value: number;
  /** Minutes since the lead showed up (0 renders as "just now"). */
  readonly age: number;
  readonly stage: Stage;
  /** Index into the avatar palette. */
  readonly tone: number;
};

export type CrmState = {
  /** Newest-first: the array order is the top-to-bottom order inside a column. */
  readonly leads: readonly Lead[];
  /** How many leads have been taken from the inbound queue so far. */
  readonly received: number;
  /** Won leads that scrolled off the board; they still count as revenue. */
  readonly archivedWon: number;
  readonly archivedRevenue: number;
};

export type AutoplayEvent =
  | { readonly kind: "move"; readonly id: string; readonly from: Stage; readonly to: Stage }
  | { readonly kind: "receive"; readonly id: string }
  | { readonly kind: "idle" };

export const STAGES: readonly Stage[] = ["new", "calling", "won"];

export const STAGE_LABELS: Readonly<Record<Stage, string>> = {
  new: "New",
  calling: "Calling",
  won: "Won",
};

/** No column ever shows more than this many cards, so the UI cannot overflow. */
export const COLUMN_CAP = 5;
/** Number of avatar colours the UI provides. */
export const AVATAR_TONES = 6;
/** Ages stop growing here ("59m ago") so long sessions stay readable. */
export const MAX_AGE = 59;

type LeadSeed = Pick<Lead, "person" | "company" | "value">;

const INITIAL_LEADS: readonly Lead[] = [
  { id: "lead-1", person: "Maya Chen", company: "Brightwave Co", value: 4200, age: 2, stage: "new", tone: 0 },
  { id: "lead-2", person: "Tomas Reyes", company: "Pinecrest Co", value: 2800, age: 6, stage: "new", tone: 1 },
  { id: "lead-3", person: "Amara Okafor", company: "Lumen Studio", value: 6500, age: 11, stage: "new", tone: 2 },
  { id: "lead-4", person: "Jonas Weber", company: "Acme Ltd", value: 9800, age: 18, stage: "calling", tone: 3 },
  { id: "lead-5", person: "Sofia Rossi", company: "Harbor & Pine", value: 3600, age: 27, stage: "calling", tone: 4 },
  { id: "lead-6", person: "Daniel Park", company: "Kite Logistics", value: 7400, age: 41, stage: "won", tone: 5 },
];

/** Fictional inbound leads, handed out in this order and then repeated. */
const LEAD_QUEUE: readonly LeadSeed[] = [
  { person: "Elena Petrov", company: "Cedar & Co", value: 5200 },
  { person: "Marcus Bell", company: "Nimbus Works", value: 3100 },
  { person: "Yuki Tanaka", company: "Orbit Foods", value: 8400 },
  { person: "Isla Murphy", company: "Fernhill Labs", value: 2400 },
  { person: "Omar Haddad", company: "Copperline Ltd", value: 12000 },
  { person: "Chloe Dubois", company: "Maple Row", value: 3900 },
  { person: "Lars Nielsen", company: "Tidewater Co", value: 6100 },
  { person: "Nadia Karim", company: "Willow Data", value: 7200 },
  { person: "Ben Alvarez", company: "Summit Bakery", value: 1900 },
  { person: "Hana Sato", company: "Quillmark", value: 4700 },
];

export function createInitialState(): CrmState {
  return {
    leads: INITIAL_LEADS,
    received: 0,
    // Two earlier wins so the revenue chip and the Won count start non-zero.
    archivedWon: 2,
    archivedRevenue: 11800,
  };
}

export function reset(): CrmState {
  return createInitialState();
}

export function leadsIn(state: CrmState, stage: Stage): Lead[] {
  return state.leads.filter((lead) => lead.stage === stage);
}

/** Number of cards currently on the board in a column. */
export function countIn(state: CrmState, stage: Stage): number {
  let count = 0;
  for (const lead of state.leads) if (lead.stage === stage) count += 1;
  return count;
}

/** The number shown in a column header (Won also counts archived wins). */
export function stageCount(state: CrmState, stage: Stage): number {
  return countIn(state, stage) + (stage === "won" ? state.archivedWon : 0);
}

/**
 * Whether a column has no room left. Won is never "full": its oldest card is
 * archived instead (its value stays in the revenue total).
 */
export function isFull(state: CrmState, stage: Stage): boolean {
  return stage !== "won" && countIn(state, stage) >= COLUMN_CAP;
}

export function findLead(state: CrmState, id: string): Lead | undefined {
  return state.leads.find((lead) => lead.id === id);
}

export function canMoveTo(state: CrmState, id: string, to: Stage): boolean {
  const lead = findLead(state, id);
  return lead !== undefined && lead.stage !== to && !isFull(state, to);
}

/**
 * Moves a lead to the top of another column. Returns the same state when the
 * lead is unknown, already there, or the target column is full.
 */
export function moveLead(state: CrmState, id: string, to: Stage): CrmState {
  const lead = findLead(state, id);
  if (!lead || lead.stage === to || isFull(state, to)) return state;

  let leads: readonly Lead[] = [
    { ...lead, stage: to },
    ...state.leads.filter((candidate) => candidate.id !== id),
  ];
  let { archivedWon, archivedRevenue } = state;

  if (to === "won") {
    const won = leads.filter((candidate) => candidate.stage === "won");
    if (won.length > COLUMN_CAP) {
      const oldest = won[won.length - 1];
      leads = leads.filter((candidate) => candidate.id !== oldest.id);
      archivedWon += 1;
      archivedRevenue += oldest.value;
    }
  }

  return { ...state, leads, archivedWon, archivedRevenue };
}

/**
 * Adds the next queued lead to the top of "New" and ages everyone else by a
 * minute. Returns the same state when "New" is full.
 */
export function receiveLead(state: CrmState): CrmState {
  if (isFull(state, "new")) return state;
  const seed = LEAD_QUEUE[state.received % LEAD_QUEUE.length];
  const lead: Lead = {
    id: `inbound-${state.received + 1}`,
    person: seed.person,
    company: seed.company,
    value: seed.value,
    age: 0,
    stage: "new",
    tone: (state.received + 3) % AVATAR_TONES,
  };
  return {
    ...state,
    leads: [
      lead,
      ...state.leads.map((existing) => ({
        ...existing,
        age: Math.min(existing.age + 1, MAX_AGE),
      })),
    ],
    received: state.received + 1,
  };
}

export function wonRevenue(state: CrmState): number {
  let total = state.archivedRevenue;
  for (const lead of state.leads) if (lead.stage === "won") total += lead.value;
  return total;
}

function advanceOldest(
  state: CrmState,
  from: Stage,
  to: Stage,
): { state: CrmState; event: AutoplayEvent } {
  const column = leadsIn(state, from);
  const oldest = column[column.length - 1];
  if (!oldest) return { state, event: { kind: "idle" } };
  const next = moveLead(state, oldest.id, to);
  if (next === state) return { state, event: { kind: "idle" } };
  return { state: next, event: { kind: "move", id: oldest.id, from, to } };
}

/**
 * One step of the preview loop, a repeating three-beat cycle:
 * New -> Calling, Calling -> Won, then a fresh lead arrives.
 */
export function autoplayStep(
  state: CrmState,
  tick: number,
): { state: CrmState; event: AutoplayEvent } {
  const beat = ((tick % 3) + 3) % 3;
  if (beat === 0) return advanceOldest(state, "new", "calling");
  if (beat === 1) return advanceOldest(state, "calling", "won");
  const next = receiveLead(state);
  if (next === state) return { state, event: { kind: "idle" } };
  return { state: next, event: { kind: "receive", id: next.leads[0].id } };
}

export function formatMoney(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `$${amount}`;
}

export function formatAge(minutes: number): string {
  if (minutes <= 0) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}
