"use client";

import { useEffect, useRef, useState } from "react";

export interface LuxuryClockProps {
  className?: string;
  /** Fix the display to this instant; use an ISO timestamp with an explicit offset. */
  date?: Date | string | number;
  /** An IANA zone, for example "Asia/Dhaka". Defaults to the browser's local zone. */
  timeZone?: string;
  brand?: string;
  ariaLabel?: string;
}

type ClockReading = {
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
};

function fixedInstant(value: LuxuryClockProps["date"]): number | null {
  if (value === undefined) return null;
  const instant =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(instant) ? instant : null;
}

function zoneOrUtc(zone: string | undefined): string {
  if (!zone) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone }).format(0);
    return zone;
  } catch {
    return "UTC";
  }
}

function readClock(instant: number | null, zone: string): ClockReading {
  // A stable first frame prevents server/client disagreement before local time is known.
  if (instant === null)
    return {
      hours: 10,
      minutes: 10,
      seconds: 0,
      label: "Waiting for local time",
    };
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: zone,
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    hours: value("hour"),
    minutes: value("minute"),
    seconds: value("second"),
    label: parts.map((part) => part.value).join(""),
  };
}

function Crown() {
  return (
    <svg
      className="lux-clock-crown absolute top-[20.5%] left-1/2 h-[calc(var(--lux-clock-size)*.054)] w-[calc(var(--lux-clock-size)*.065)] -translate-x-1/2 text-[#9f8522] drop-shadow-[0_0_2px_rgba(255,215,0,.2)]"
      viewBox="0 0 46 31"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m8 8 5 16h20l5-16-8 11-7-15-7 15L8 8Zm7 18h16v3H15z" />
      <circle cx="6" cy="6" r="2.7" />
      <circle cx="14" cy="3.8" r="2.7" />
      <circle cx="23" cy="2.8" r="2.7" />
      <circle cx="32" cy="3.8" r="2.7" />
      <circle cx="40" cy="6" r="2.7" />
    </svg>
  );
}

/** Every dial measurement scales from --lux-clock-size, set by the stage or thumbnail. */
const NUMBER_CLASS =
  "lux-clock-number absolute [font:700_calc(var(--lux-clock-size)*.069)/1_Arial,sans-serif] tracking-[-.035em] text-[#f8df67] text-shadow-[0_0_9px_rgba(255,215,0,.55)]";
const HAND_CLASS =
  "lux-clock-hand pointer-events-none absolute bottom-1/2 left-1/2 origin-bottom rounded-[10px]";

function ClockDial({
  reading,
  brand,
  thumbnail = false,
}: {
  reading: ClockReading;
  brand: string;
  thumbnail?: boolean;
}) {
  const hour =
    (reading.hours % 12) * 30 + reading.minutes * 0.5 + reading.seconds / 120;
  const minute = reading.minutes * 6 + reading.seconds * 0.1;
  const second = reading.seconds * 6;
  // Gallery frames step the hands, so only the thumbnail eases between positions.
  const handMotion = thumbnail
    ? "[transition:transform_.7s_ease] motion-reduce:[transition:none]"
    : "";
  return (
    <div className="lux-clock-dial size-(--lux-clock-size) rounded-[50%] bg-[#252525] p-[calc(var(--lux-clock-size)*.022)] shadow-[10px_14px_25px_rgba(0,0,0,.42),-4px_-3px_14px_rgba(255,255,255,.025)]">
      <div className="lux-clock-face relative size-full rounded-[50%] bg-[#101010] shadow-[inset_0_0_10px_rgba(0,0,0,.15)]">
        <span
          className={`${NUMBER_CLASS} top-[4.5%] left-1/2 -translate-x-1/2`}
        >
          12
        </span>
        <span
          className={`${NUMBER_CLASS} top-1/2 right-[4.4%] -translate-y-1/2`}
        >
          3
        </span>
        <span
          className={`${NUMBER_CLASS} bottom-[4.4%] left-1/2 -translate-x-1/2`}
        >
          6
        </span>
        <span
          className={`${NUMBER_CLASS} top-1/2 left-[4.4%] -translate-y-1/2`}
        >
          9
        </span>
        <Crown />
        <span
          className={`lux-clock-brand absolute top-[27.3%] left-1/2 -translate-x-1/2 tracking-[.01em] text-[#006039] ${thumbnail ? "[font:700_calc(var(--lux-clock-size)*.048)/1_Georgia,serif]" : "[font:700_calc(var(--lux-clock-size)*.047)/1_Georgia,serif]"}`}
        >
          {brand}
        </span>
        <span
          className={`${HAND_CLASS} z-1 h-[23.333%] w-[calc(var(--lux-clock-size)*.021)] bg-[#fff] opacity-90 ${handMotion}`}
          data-hand="hour"
          style={{ transform: `translateX(-50%) rotate(${hour}deg)` }}
        />
        <span
          className={`${HAND_CLASS} z-2 h-[33.333%] w-[calc(var(--lux-clock-size)*.015)] bg-[#f1f1f1] ${handMotion}`}
          data-hand="minute"
          style={{ transform: `translateX(-50%) rotate(${minute}deg)` }}
        />
        <span
          className={`${HAND_CLASS} z-3 h-[40%] w-[calc(var(--lux-clock-size)*.0075)] bg-[#ffd700] shadow-[0_0_15px_#ffd700] ${handMotion}`}
          data-hand="second"
          style={{ transform: `translateX(-50%) rotate(${second}deg)` }}
        />
        <span className="lux-clock-pin absolute top-1/2 left-1/2 z-4 size-[calc(var(--lux-clock-size)*.052)] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[#ffd700] shadow-[0_0_14px_rgba(255,215,0,.55)]" />
      </div>
    </div>
  );
}

/** Shared backdrop; the root is the container the stage breakpoints query. */
const ROOT_CLASS =
  "lux-clock-root @container relative isolate flex w-full items-center justify-center overflow-hidden bg-[image:radial-gradient(ellipse_at_55%_48%,rgba(27,57,66,.24),transparent_70%),linear-gradient(135deg,#0f2027,#203a43_55%,#2c5364)] text-[#f8df67]";

/** A gold-accented analog clock. Only a visible live clock owns a one-second timer. */
export default function LuxuryClock({
  className = "",
  date,
  timeZone,
  brand = "ROLEX",
  ariaLabel = "Luxury analog clock",
}: LuxuryClockProps) {
  const fixed = fixedInstant(date);
  const [display, setDisplay] = useState(() => ({
    instant: fixed,
    zone: zoneOrUtc(timeZone),
  }));
  const rootRef = useRef<HTMLDivElement>(null);
  const reading = readClock(display.instant, display.zone);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let visible = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const localZone = zoneOrUtc(
      timeZone ?? new Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    const update = () =>
      setDisplay({ instant: fixed ?? Date.now(), zone: localZone });
    const synchronize = () => {
      if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
      if (!visible || document.hidden) return;
      update();
      if (fixed === null) timer = setInterval(update, 1000);
    };
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              visible = entry.isIntersecting;
              synchronize();
            },
            { threshold: 0.01 },
          );
    observer?.observe(root);
    document.addEventListener("visibilitychange", synchronize);
    // Defer the first local-time read until hydration has completed.
    const firstFrame = requestAnimationFrame(synchronize);
    return () => {
      cancelAnimationFrame(firstFrame);
      if (timer !== undefined) clearInterval(timer);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
    };
  }, [fixed, timeZone]);

  return (
    <div ref={rootRef} className={`${ROOT_CLASS} ${className}`}>
      <div
        className="lux-clock-stage grid min-h-[580px] w-full place-items-center self-stretch [container-type:size] [--lux-clock-size:max(min(390px,74cqw),min(66cqh,74cqw,760px))] @max-[520px]:min-h-[450px] @max-[520px]:[--lux-clock-size:max(min(340px,78cqw),min(66cqh,78cqw))] @max-[380px]:min-h-[390px] @max-[380px]:[--lux-clock-size:78cqw]"
        role="img"
        aria-label={`${ariaLabel}: ${reading.label}${display.instant === null ? "" : ` (${display.zone})`}`}
      >
        <ClockDial reading={reading} brand={brand} />
      </div>
      <time
        className="lux-clock-sr-only sr-only"
        dateTime={
          display.instant === null
            ? undefined
            : new Date(display.instant).toISOString()
        }
      >
        {reading.label}
      </time>
    </div>
  );
}

/** Deterministic gallery frames; no clock, timer, focus target or handlers are mounted. */
export function LuxuryClockThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  const step = Number.isFinite(previewStep) ? Math.floor(previewStep) : 0;
  const second = (((step * 9) % 60) + 60) % 60;
  return (
    <div
      className={`${ROOT_CLASS} lux-clock-thumbnail h-full min-h-[250px] [--lux-clock-size:min(242px,66cqw)] ${className}`}
      aria-hidden="true"
    >
      <ClockDial
        reading={{ hours: 10, minutes: 8, seconds: second, label: "" }}
        brand="ROLEX"
        thumbnail
      />
    </div>
  );
}
