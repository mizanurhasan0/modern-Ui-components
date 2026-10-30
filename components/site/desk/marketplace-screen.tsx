"use client";

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ScreenMode } from "./screen-mode";
import {
  COMMISSION_RATE,
  PRODUCTS,
  actorStatus,
  advance,
  completedMarketState,
  createMarketState,
  currentActor,
  describeStep,
  formatMoney,
  phaseOf,
  primaryActionLabel,
  selectProduct,
  stepIndex,
  type MarketActor,
  type MarketPhase,
  type MarketState,
} from "./marketplace-state";
import styles from "./marketplace-screen.module.css";

/** Preview autoplay: time spent on each step. */
const PREVIEW_STEP_MS = 1400;
/** Interactive mode: how long the payment takes to settle after "Place order". */
const SETTLE_MS = 1100;

const ACTORS: readonly { id: MarketActor; label: string }[] = [
  { id: "seller", label: "Seller" },
  { id: "promoter", label: "Promoter" },
  { id: "shopper", label: "Shopper" },
];

const PHASES: readonly { id: MarketPhase; label: string }[] = [
  { id: "catalog", label: "Catalog" },
  { id: "order", label: "Order" },
  { id: "commission", label: "Commission" },
];

function ActorIcon({ actor }: { actor: MarketActor }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
  };
  if (actor === "seller") {
    return (
      <svg {...common}>
        <path d="M4 9.5 5.6 4.5h12.8L20 9.5a2.8 2.8 0 0 1-5.3 1.3 2.8 2.8 0 0 1-5.4 0A2.8 2.8 0 0 1 4 9.5Z" />
        <path d="M5.5 12.5V20h13v-7.5M10 20v-4h4v4" />
      </svg>
    );
  }
  if (actor === "promoter") {
    return (
      <svg {...common}>
        <path d="M4 10.5v3l10 4.5V6L4 10.5Z" />
        <path d="M17.5 9.5a3.5 3.5 0 0 1 0 5M7 14.5l1.2 4.5H11" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M6 8.5h12l1 11.5H5l1-11.5Z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </svg>
  );
}

function Arrow({ lit }: { lit: boolean }) {
  return (
    <svg
      className={styles.arrow}
      data-lit={lit ? "true" : "false"}
      viewBox="0 0 20 12"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M1 6h15m-4.5-3.8L16 6l-4.5 3.8" />
    </svg>
  );
}

function ActorNode({
  actor,
  label,
  active,
  statusShort,
  statusLong,
  interactive,
  children,
}: {
  actor: MarketActor;
  label: string;
  active: boolean;
  statusShort: string;
  statusLong: string;
  interactive: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={styles.node}
      data-actor={actor}
      data-active={active ? "true" : "false"}
      aria-current={interactive && active ? "step" : undefined}
    >
      <span className={styles.avatar}>
        <ActorIcon actor={actor} />
      </span>
      <span className={styles.name}>{label}</span>
      <span className={styles.status}>
        <span className={styles.statusShort}>{statusShort}</span>
        <span className={styles.statusLong}>{statusLong}</span>
      </span>
      {children ? <div className={styles.actions}>{children}</div> : null}
    </div>
  );
}

/**
 * Radio-style product chips. Rendered twice in interactive mode (inside the
 * seller step for the narrow stepper, and as a catalog shelf for the wide
 * layout); CSS shows exactly one of them, the other is display:none.
 */
function ProductChips({
  variant,
  name,
  selected,
  disabled,
  onSelect,
  labelId,
}: {
  variant: "shelf" | "step";
  name: string;
  selected: number;
  disabled: boolean;
  onSelect: (index: number) => void;
  labelId?: string;
}) {
  return (
    <div
      className={variant === "shelf" ? styles.chips : styles.stepChips}
      role="radiogroup"
      aria-labelledby={labelId}
      aria-label={labelId ? undefined : "Product to list"}
    >
      {PRODUCTS.map((item, index) => (
        <label className={styles.chip} key={item.id}>
          <input
            className={styles.chipInput}
            type="radio"
            name={name}
            value={item.id}
            checked={selected === index}
            disabled={disabled}
            onChange={() => onSelect(index)}
          />
          <span className={styles.chipBody}>
            <span className={styles.chipName}>{item.name}</span>
            <span className={styles.chipPrice}>{formatMoney(item.price)}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

export function MarketplaceScreen({ mode }: { mode: ScreenMode }) {
  const interactive = mode === "interactive";
  // Preview starts from the finished frame: that is also the static frame for
  // reduced motion and for the server render, so nothing flashes on hydrate.
  const [state, setState] = useState<MarketState>(() =>
    interactive ? createMarketState() : completedMarketState(),
  );
  const [message, setMessage] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const keepFocus = useRef(false);
  const groupName = useId();
  const groupLabelId = useId();

  // Preview: autoplay loop, paused off-screen, in a hidden tab, or when the
  // visitor prefers reduced motion (the static frame is shown instead).
  useEffect(() => {
    if (mode !== "preview") return;
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canObserve = typeof IntersectionObserver !== "undefined";
    let onScreen = !canObserve;
    let timer: number | undefined;

    const stop = () => {
      if (timer === undefined) return;
      window.clearInterval(timer);
      timer = undefined;
    };
    const sync = () => {
      stop();
      if (reduced.matches || document.hidden || !onScreen) return;
      timer = window.setInterval(() => setState(advance), PREVIEW_STEP_MS);
    };

    const observer = canObserve
      ? new IntersectionObserver((entries) => {
          const latest = entries[entries.length - 1];
          if (!latest) return;
          onScreen = latest.isIntersecting;
          sync();
        })
      : null;
    observer?.observe(root);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    sync();

    return () => {
      stop();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [mode]);

  // Interactive: payment settles on its own shortly after "Place order".
  useEffect(() => {
    if (!interactive || state.step !== "ordered") return;
    const timer = window.setTimeout(() => {
      const next = advance(state);
      setState(next);
      setMessage(describeStep(next));
    }, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [interactive, state]);

  // Interactive: the pressed button disappears when the turn passes on, so
  // hand keyboard focus to the next primary action (or the flow while paying).
  useEffect(() => {
    if (!interactive || !keepFocus.current) return;
    const root = rootRef.current;
    const active = document.activeElement;
    if (
      root &&
      active &&
      active !== document.body &&
      !root.contains(active)
    ) {
      keepFocus.current = false;
      return;
    }
    if (primaryRef.current) {
      primaryRef.current.focus();
      keepFocus.current = false;
    } else {
      flowRef.current?.focus({ preventScroll: true });
    }
  }, [interactive, state.step]);

  const turn = currentActor(state.step);
  const actionLabel = primaryActionLabel(state.step);
  const phase = phaseOf(state.step);
  const progress = stepIndex(state.step);

  const onPrimary = () => {
    keepFocus.current = true;
    const next = advance(state);
    setState(next);
    setMessage(describeStep(next));
  };

  const selectIndex = (index: number) => setState(selectProduct(state, index));

  const primaryButton = actionLabel ? (
    <button
      ref={primaryRef}
      type="button"
      className={styles.primary}
      onClick={onPrimary}
    >
      {actionLabel}
    </button>
  ) : null;

  const actionsFor = (actor: MarketActor): ReactNode => {
    if (!interactive || turn !== actor) return null;
    if (actor === "seller" && state.step === "idle") {
      return (
        <>
          <ProductChips
            variant="step"
            name={`${groupName}-step`}
            selected={state.productIndex}
            disabled={false}
            onSelect={selectIndex}
          />
          {primaryButton}
        </>
      );
    }
    return primaryButton;
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-mode={mode}
      data-step={state.step}
      role={interactive ? "group" : undefined}
      aria-label={interactive ? "Multi-vendor marketplace flow demo" : undefined}
      aria-hidden={interactive ? undefined : true}
      inert={interactive ? undefined : true}
    >
      <div className={styles.bar}>
        <span className={styles.winDots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className={styles.barTitle}>marketplace flow</span>
        <span className={styles.barTag}>MP</span>
      </div>

      <div className={styles.body}>
        <div
          ref={flowRef}
          className={styles.flow}
          tabIndex={interactive ? -1 : undefined}
        >
          <div className={styles.actors}>
            {ACTORS.map((actor, index) => (
              <Fragment key={actor.id}>
                {index > 0 ? <Arrow lit={progress >= index} /> : null}
                <ActorNode
                  actor={actor.id}
                  label={actor.label}
                  active={turn === actor.id}
                  statusShort={actorStatus(state, actor.id, "short")}
                  statusLong={actorStatus(state, actor.id, "long")}
                  interactive={interactive}
                >
                  {actionsFor(actor.id)}
                </ActorNode>
              </Fragment>
            ))}
          </div>

          {interactive ? (
            <div className={styles.shelf}>
              <span className={styles.shelfLabel} id={groupLabelId}>
                {state.step === "idle"
                  ? "Catalog: choose a product to list"
                  : "Catalog: listed product"}
              </span>
              <ProductChips
                variant="shelf"
                name={`${groupName}-shelf`}
                selected={state.productIndex}
                disabled={state.step !== "idle"}
                onSelect={selectIndex}
                labelId={groupLabelId}
              />
            </div>
          ) : null}

          <div className={styles.trackWrap} aria-hidden={interactive ? true : undefined}>
            <div className={styles.track}>
              <span className={styles.line} />
              <span className={styles.fill} />
              {PHASES.map((item, index) => (
                <span
                  key={item.id}
                  className={styles.stop}
                  data-i={index}
                  data-done={
                    (index === 0 && progress >= 1) ||
                    (index === 1 && progress >= 3) ||
                    (index === 2 && progress >= 4)
                      ? "true"
                      : "false"
                  }
                />
              ))}
              <span className={styles.token}>
                <span className={styles.tokenGlyph}>$</span>
              </span>
            </div>
            <p className={styles.caption}>
              {PHASES.map((item, index) => (
                <Fragment key={item.id}>
                  {index > 0 ? (
                    <span className={styles.sep} aria-hidden="true">
                      {" · "}
                    </span>
                  ) : null}
                  <span
                    className={styles.phase}
                    data-on={phase === item.id ? "true" : "false"}
                  >
                    {item.label}
                  </span>
                </Fragment>
              ))}
            </p>
          </div>
        </div>

        <aside
          className={styles.wallet}
          aria-label={interactive ? "Promoter wallet" : undefined}
        >
          <div className={styles.walletHead}>
            <span className={styles.walletTitle}>Promoter wallet</span>
            <span className={styles.rate}>
              {Math.round(COMMISSION_RATE * 100)}% rate
            </span>
          </div>
          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt>Orders</dt>
              <dd
                key={state.orders}
                data-fresh={state.step === "paid" ? "true" : "false"}
              >
                {state.orders}
              </dd>
            </div>
            <div className={styles.stat}>
              <dt>Commission</dt>
              <dd
                key={state.commission}
                data-fresh={state.step === "paid" ? "true" : "false"}
              >
                {formatMoney(state.commission)}
              </dd>
            </div>
          </dl>
          <div className={styles.ledgerBlock}>
            <p className={styles.ledgerTitle}>Recent orders</p>
            <ol className={styles.ledger}>
              {state.ledger.map((entry, index) => (
                <li
                  key={entry.orderId}
                  className={styles.row}
                  data-fresh={
                    index === 0 && state.step === "paid" ? "true" : "false"
                  }
                >
                  <span className={styles.rowProduct}>{entry.product}</span>
                  <span className={styles.rowAmount}>
                    {formatMoney(entry.amount)}
                  </span>
                  <span className={styles.rowId}>{entry.orderId}</span>
                  <span className={styles.rowCommission}>
                    +{formatMoney(entry.commission)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <p className={styles.walletNote}>
            Commission is credited the moment an order is paid.
          </p>
        </aside>
      </div>

      {interactive ? (
        <p
          className={styles.srOnly}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
