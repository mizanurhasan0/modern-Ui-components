"use client";

import { useEffect, useRef, useState } from "react";
import { createRenderer } from "./race-draw";
import {
  MAX_SPEED,
  MIN_SPEED,
  advance,
  createRace,
  drainEvents,
  isNewBest,
  pauseRace,
  resumeRace,
  setTargetLane,
  speedKmh,
  startRace,
  steer,
} from "./race-state";
import type { RaceState, RaceStatus } from "./race-state";
import styles from "./race-screen.module.css";

const BEST_KEY = "desk-racer-best";
/** Seconds the crash animation plays before a retry is accepted (and before the card shows). */
const RETRY_DELAY = 0.8;
/** Seconds after which the crash animation, not the game, counts as finished. */
const CRASH_ANIMATION = 2.6;
const GO_MS = 800;
const LABEL =
  "Desk Racer, a mini racing game. Use arrow keys or W A S D to steer, Space to start or pause, Escape to exit.";

type Result = { score: number; best: number; coins: number; near: number; fresh: boolean };

type Ui = {
  status: RaceStatus;
  /** 3, 2, 1 while counting down, otherwise 0. */
  count: number;
  /** Shows the "GO!" flash right after the countdown. */
  go: boolean;
  /** Paused because focus, visibility or scroll position was lost (as opposed to a deliberate pause). */
  away: boolean;
  result: Result | null;
  /** Text for the visually hidden live region. */
  say: string;
};

const INITIAL_UI: Ui = { status: "ready", count: 0, go: false, away: false, result: null, say: "" };

function formatNumber(n: number): string {
  return String(Math.max(0, Math.floor(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function readBest(): number {
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    if (raw === null) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 && n < 1e9 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function writeBest(n: number): void {
  try {
    window.localStorage.setItem(BEST_KEY, String(Math.floor(n)));
  } catch {
    /* storage can be blocked; the run still counts for this session */
  }
}

export function RaceScreen(props: { onExit: () => void; autoFocus?: boolean; className?: string }) {
  const { onExit, autoFocus, className } = props;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const meterRef = useRef<HTMLElement>(null);
  const bestRef = useRef<HTMLSpanElement>(null);
  const coinsRef = useRef<HTMLSpanElement>(null);
  const attractBestRef = useRef<HTMLParagraphElement>(null);
  const exitRef = useRef(onExit);
  const [ui, setUi] = useState<Ui>(INITIAL_UI);

  useEffect(() => {
    exitRef.current = onExit;
  });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const scoreEl = scoreRef.current;
    const speedEl = speedRef.current;
    const meterEl = meterRef.current;
    const bestEl = bestRef.current;
    const coinsEl = coinsRef.current;
    const attractBestEl = attractBestRef.current;

    const renderer = createRenderer(canvas, getComputedStyle(root).fontFamily || "system-ui, sans-serif");
    let savedBest = readBest();
    const race: RaceState = createRace({ best: savedBest });

    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reduceQuery.matches;
    let inView = true;
    let hidden = document.hidden;
    let focused = document.activeElement === root;
    let horizontal = true;
    let sized = false;
    let width = 0;
    let height = 0;

    let raf = 0;
    let last = 0;
    let awayFlag = false;
    let goUntil = 0;
    let prevStatus: RaceStatus = race.status;
    let sayCount = 0;
    let pendingSay = "";
    let shown: Ui = INITIAL_UI;
    let dragging = false;
    let dragId = -1;

    // last values written into the HUD, so the DOM is only touched when something changed
    let hScore = -1;
    let hSpeed = -1;
    let hMeter = -1;
    let hBest = -1;
    let hCoins = -1;

    const say = (message: string) => {
      sayCount += 1;
      pendingSay = sayCount % 2 === 0 ? message : `${message}\u200b`;
    };

    const pulse = (el: HTMLElement | null) => {
      if (!el || reduced || typeof el.animate !== "function") return;
      el.animate([{ transform: "scale(1.22)" }, { transform: "scale(1)" }], { duration: 280, easing: "ease-out" });
    };

    const updateHud = () => {
      const score = Math.floor(race.score);
      if (scoreEl && score !== hScore) {
        hScore = score;
        scoreEl.textContent = formatNumber(score);
      }
      const kmh = race.status === "ready" ? 0 : Math.round(speedKmh(race));
      if (speedEl && kmh !== hSpeed) {
        hSpeed = kmh;
        speedEl.textContent = String(kmh);
      }
      const meter = race.status === "ready" ? 0 : Math.round(Math.max(0, Math.min(1, (race.speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED))) * 100);
      if (meterEl && meter !== hMeter) {
        hMeter = meter;
        meterEl.style.width = `${meter}%`;
      }
      const best = Math.max(race.best, savedBest);
      if (bestEl && best !== hBest) {
        hBest = best;
        bestEl.textContent = formatNumber(best);
        if (attractBestEl) attractBestEl.textContent = best > 0 ? `Best ${formatNumber(best)}` : "";
      }
      if (coinsEl && race.coins !== hCoins) {
        hCoins = race.coins;
        coinsEl.textContent = String(race.coins);
      }
    };

    const syncUi = (now: number) => {
      const status = race.status;
      const count = status === "countdown" ? Math.min(3, Math.max(1, Math.ceil(race.countdown))) : 0;
      let go = shown.go;
      if (prevStatus === "countdown" && status === "running") {
        go = true;
        goUntil = now + GO_MS;
        say("Race started");
      }
      if (go && (now > goUntil || status !== "running")) go = false;
      let result = shown.result;
      if (status === "crashed" && result === null) {
        const fresh = isNewBest(race);
        const score = Math.floor(race.score);
        const best = Math.max(race.best, score);
        if (best > savedBest) {
          savedBest = best;
          writeBest(best);
        }
        result = { score, best, coins: race.coins, near: race.nearMisses, fresh };
        say(fresh ? `Crashed. Score ${score}. New best ${score}` : `Crashed. Score ${score}`);
      } else if (status !== "crashed" && status !== "paused" && result !== null) {
        result = null;
      }
      prevStatus = status;
      const away = status === "paused" && awayFlag;
      const message = pendingSay !== "" ? pendingSay : shown.say;
      pendingSay = "";
      if (
        status === shown.status &&
        count === shown.count &&
        go === shown.go &&
        away === shown.away &&
        result === shown.result &&
        message === shown.say
      ) {
        return;
      }
      shown = { status, count, go, away, result, say: message };
      setUi(shown);
    };

    const isActive = () => inView && !hidden && focused;

    const shouldAnimate = () => {
      if (!renderer || !sized || !inView || hidden) return false;
      switch (race.status) {
        case "countdown":
        case "running":
          return true;
        case "crashed":
          return race.crashTime < CRASH_ANIMATION || renderer.busy();
        case "ready":
          return !reduced;
        default:
          return false;
      }
    };

    const render = () => {
      if (!renderer || !sized) return;
      renderer.draw(race, reduced);
    };

    const handleEvents = () => {
      if (race.events.length === 0) return;
      const events = drainEvents(race);
      if (renderer) renderer.handleEvents(events, race, reduced);
      for (let i = 0; i < events.length; i++) {
        const type = events[i].type;
        if (type === "coin") pulse(coinsEl?.closest("div") ?? null);
        else if (type === "near-miss") pulse(scoreEl?.closest("div") ?? null);
      }
    };

    const pauseNow = (away: boolean) => {
      if (race.status !== "running") return;
      pauseRace(race);
      awayFlag = away;
      say("Paused");
      syncUi(performance.now());
    };

    const frame = (now: number) => {
      raf = 0;
      // the attract screen only needs 30 fps
      if (race.status === "ready" && now - last < 30) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      advance(race, dt);
      handleEvents();
      if (race.status === "running" && !isActive()) pauseNow(true);
      if (renderer) renderer.update(race, dt, reduced);
      render();
      updateHud();
      syncUi(now);
      if (shouldAnimate()) raf = requestAnimationFrame(frame);
    };

    const ensureLoop = () => {
      if (raf !== 0 || !shouldAnimate()) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const repaint = () => {
      if (!renderer || !sized) return;
      renderer.update(race, 0, reduced);
      render();
      updateHud();
    };

    const begin = () => {
      if (race.status !== "ready" && race.status !== "crashed") return;
      if (race.status === "crashed" && race.crashTime < RETRY_DELAY) return;
      awayFlag = false;
      startRace(race);
      if (renderer) renderer.reset();
      handleEvents();
      syncUi(performance.now());
      updateHud();
      ensureLoop();
    };

    const resume = () => {
      if (race.status !== "paused") return;
      resumeRace(race);
      awayFlag = false;
      say("Resumed");
      syncUi(performance.now());
      ensureLoop();
    };

    const togglePause = () => {
      if (race.status === "running") pauseNow(false);
      else if (race.status === "paused") resume();
    };

    /* ------------------------------------------------------------ size */

    const applySize = () => {
      if (!renderer || width < 2 || height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.resize(width, height, dpr);
      horizontal = width > height;
      sized = true;
      repaint();
      ensureLoop();
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const box = entries[entries.length - 1].contentRect;
      width = box.width;
      height = box.height;
      applySize();
    });
    resizeObserver.observe(root);
    const onWindowResize = () => applySize();
    window.addEventListener("resize", onWindowResize);

    /* ------------------------------------------------------------ visibility */

    const onVisibility = () => {
      hidden = document.hidden;
      if (hidden) pauseNow(true);
      else ensureLoop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    let intersection: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      intersection = new IntersectionObserver(
        (entries) => {
          inView = entries[entries.length - 1].isIntersecting;
          if (!inView) pauseNow(true);
          else ensureLoop();
        },
        { threshold: 0.25 },
      );
      intersection.observe(root);
    }

    const onReduceChange = () => {
      reduced = reduceQuery.matches;
      repaint();
      ensureLoop();
    };
    reduceQuery.addEventListener("change", onReduceChange);

    const onFocus = () => {
      focused = true;
    };
    const onBlur = () => {
      focused = false;
      pauseNow(true);
    };
    root.addEventListener("focus", onFocus);
    root.addEventListener("blur", onBlur);

    /* ------------------------------------------------------------ keyboard */

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key;
      const playing = race.status === "running" || race.status === "countdown";
      let direction: -1 | 0 | 1 = 0;
      let handled = true;
      switch (key) {
        case "ArrowUp":
          if (horizontal) direction = -1;
          break;
        case "ArrowDown":
          if (horizontal) direction = 1;
          break;
        case "ArrowLeft":
          if (!horizontal) direction = -1;
          break;
        case "ArrowRight":
          if (!horizontal) direction = 1;
          break;
        case "w":
        case "W":
          if (horizontal) direction = -1;
          else handled = false;
          break;
        case "s":
        case "S":
          if (horizontal) direction = 1;
          else handled = false;
          break;
        case "a":
        case "A":
          if (!horizontal) direction = -1;
          else handled = false;
          break;
        case "d":
        case "D":
          if (!horizontal) direction = 1;
          else handled = false;
          break;
        case " ":
        case "Spacebar":
          if (!event.repeat) {
            if (race.status === "running") pauseNow(false);
            else if (race.status === "paused") resume();
            else begin();
          }
          break;
        case "Enter":
          if (!event.repeat) {
            if (race.status === "paused") resume();
            else begin();
          }
          break;
        case "p":
        case "P":
          if (!event.repeat) togglePause();
          break;
        case "Escape":
          event.stopPropagation();
          exitRef.current();
          break;
        default:
          handled = false;
      }
      if (!handled) return;
      event.preventDefault();
      if (direction !== 0 && playing && !event.repeat) steer(race, direction);
    };
    root.addEventListener("keydown", onKeyDown);

    /* ------------------------------------------------------------ pointer */

    const steerToPointer = (event: PointerEvent) => {
      if (!renderer || (race.status !== "running" && race.status !== "countdown")) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const x = ((event.clientX - rect.left) / rect.width) * width;
      const y = ((event.clientY - rect.top) / rect.height) * height;
      setTargetLane(race, renderer.laneAt(x, y));
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      root.focus({ preventScroll: true });
      if (race.status === "paused") resume();
      else if (race.status === "ready" || race.status === "crashed") begin();
      dragging = true;
      dragId = event.pointerId;
      try {
        root.setPointerCapture(event.pointerId);
      } catch {
        /* capture can fail for synthetic pointers; steering still works while the pointer is over the game */
      }
      steerToPointer(event);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragging && event.pointerId === dragId) steerToPointer(event);
    };
    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== dragId) return;
      dragging = false;
      dragId = -1;
      try {
        root.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    };
    // long-press on touch screens must not open the context menu; a mouse right click keeps it
    const onContextMenu = (event: Event) => {
      if ((event as PointerEvent).pointerType !== "mouse") event.preventDefault();
    };
    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", onPointerEnd);
    root.addEventListener("pointercancel", onPointerEnd);
    root.addEventListener("contextmenu", onContextMenu);

    if (autoFocus) root.focus({ preventScroll: true });
    updateHud();

    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      raf = 0;
      resizeObserver.disconnect();
      intersection?.disconnect();
      window.removeEventListener("resize", onWindowResize);
      document.removeEventListener("visibilitychange", onVisibility);
      reduceQuery.removeEventListener("change", onReduceChange);
      root.removeEventListener("focus", onFocus);
      root.removeEventListener("blur", onBlur);
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", onPointerEnd);
      root.removeEventListener("pointercancel", onPointerEnd);
      root.removeEventListener("contextmenu", onContextMenu);
    };
    // The game owns its own lifecycle; autoFocus only matters on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { status, count, go, away, result, say: liveText } = ui;
  const rootClass = className ? `${styles.root} ${className}` : styles.root;

  return (
    <div
      ref={rootRef}
      className={rootClass}
      tabIndex={0}
      role="application"
      aria-label={LABEL}
      data-status={status}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.shade} aria-hidden="true" />

      {status === "ready" ? (
        <div className={styles.overlay} data-kind="ready" aria-hidden="true">
          <div className={styles.titleBlock}>
            <span className={styles.eyebrow}>Mini game</span>
            <h2 className={styles.title}>
              Desk <em>Racer</em>
            </h2>
            <span className={styles.flag} />
          </div>
          <p className={styles.keys}>
            <span className={styles.keysH}>
              <kbd>↑</kbd>
              <kbd>↓</kbd>
              <span>or</span>
              <kbd>W</kbd>
              <kbd>S</kbd>
              <span>to steer</span>
            </span>
            <span className={styles.keysV}>
              <kbd>←</kbd>
              <kbd>→</kbd>
              <span>or</span>
              <kbd>A</kbd>
              <kbd>D</kbd>
              <span>to steer</span>
            </span>
          </p>
          <p className={styles.cta}>Press Space or tap to start</p>
          <p ref={attractBestRef} className={styles.bestLine} />
        </div>
      ) : null}

      {status === "countdown" ? (
        <div className={styles.overlay} data-kind="count" aria-hidden="true">
          <span key={count} className={styles.num}>
            {count}
          </span>
        </div>
      ) : null}

      {go ? (
        <div className={styles.overlay} data-kind="go" aria-hidden="true">
          <span className={styles.go}>GO!</span>
        </div>
      ) : null}

      {status === "paused" ? (
        <div className={styles.overlay} data-kind="paused" aria-hidden="true">
          <div className={styles.card}>
            <span className={styles.pauseIcon} />
            <p className={styles.cardTitle}>{away ? "Paused – click to resume" : "Paused"}</p>
            {away ? null : <p className={styles.cardHint}>Press Space or tap to resume</p>}
            <p className={styles.cardFoot}>Esc to exit</p>
          </div>
        </div>
      ) : null}

      {status === "crashed" && result ? (
        <div className={styles.overlay} data-kind="over" aria-hidden="true">
          <div className={`${styles.card} ${styles.over}`}>
            <p className={styles.kicker}>Crashed</p>
            <p className={styles.bigScore}>
              <span className={styles.scoreLabel}>Score</span>
              {formatNumber(result.score)}
            </p>
            <p className={styles.bestRow}>
              <span>Best {formatNumber(result.best)}</span>
              {result.fresh ? <span className={styles.badge}>New best!</span> : null}
            </p>
            <p className={styles.stats}>
              {result.coins} {result.coins === 1 ? "coin" : "coins"} · {result.near} close {result.near === 1 ? "call" : "calls"}
            </p>
            <p className={styles.retry}>Press Space to retry</p>
            <p className={styles.cardFoot}>Esc to exit</p>
          </div>
        </div>
      ) : null}

      <div className={styles.hud} aria-hidden="true">
        <div className={styles.group}>
          <div className={styles.chip}>
            <span className={styles.label}>Score</span>
            <span ref={scoreRef} className={`${styles.value} ${styles.score}`}>
              0
            </span>
          </div>
          <div className={`${styles.chip} ${styles.speedChip}`}>
            <span className={styles.label}>Speed</span>
            <span className={styles.value}>
              <span ref={speedRef}>0</span>
              <small className={styles.unit}>km/h</small>
            </span>
            <span className={styles.meter}>
              <i ref={meterRef} />
            </span>
          </div>
        </div>
        <div className={styles.group}>
          <div className={styles.chip}>
            <span className={styles.label}>Best</span>
            <span ref={bestRef} className={styles.value}>
              0
            </span>
          </div>
          <div className={styles.chip}>
            <span className={styles.label}>Coins</span>
            <span className={styles.value}>
              <i className={styles.coinIcon} />
              <span ref={coinsRef}>0</span>
            </span>
          </div>
        </div>
      </div>

      <p className={styles.sr} role="status" aria-live="polite">
        {liveText}
      </p>
    </div>
  );
}
