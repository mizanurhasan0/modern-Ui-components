"use client";

import { useEffect, useRef, useState } from "react";
import { ComponentStyles } from "./component-styles";

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
      className="lux-clock-crown"
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

function ClockDial({
  reading,
  brand,
  className = "",
}: {
  reading: ClockReading;
  brand: string;
  className?: string;
}) {
  const hour =
    (reading.hours % 12) * 30 + reading.minutes * 0.5 + reading.seconds / 120;
  const minute = reading.minutes * 6 + reading.seconds * 0.1;
  const second = reading.seconds * 6;
  return (
    <div className={`lux-clock-dial ${className}`}>
      <div className="lux-clock-face">
        <span className="lux-clock-number lux-clock-twelve">12</span>
        <span className="lux-clock-number lux-clock-three">3</span>
        <span className="lux-clock-number lux-clock-six">6</span>
        <span className="lux-clock-number lux-clock-nine">9</span>
        <Crown />
        <span className="lux-clock-brand">{brand}</span>
        <span
          className="lux-clock-hand lux-clock-hour"
          data-hand="hour"
          style={{ transform: `translateX(-50%) rotate(${hour}deg)` }}
        />
        <span
          className="lux-clock-hand lux-clock-minute"
          data-hand="minute"
          style={{ transform: `translateX(-50%) rotate(${minute}deg)` }}
        />
        <span
          className="lux-clock-hand lux-clock-second"
          data-hand="second"
          style={{ transform: `translateX(-50%) rotate(${second}deg)` }}
        />
        <span className="lux-clock-pin" />
      </div>
    </div>
  );
}

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
    <div
      ref={rootRef}
      className={`lux-clock-root relative isolate flex w-full items-center justify-center overflow-hidden ${className}`}
    >
      <ComponentStyles css={LUXURY_CLOCK_CSS} />
      <div
        className="lux-clock-stage"
        role="img"
        aria-label={`${ariaLabel}: ${reading.label}${display.instant === null ? "" : ` (${display.zone})`}`}
      >
        <ClockDial reading={reading} brand={brand} />
      </div>
      <time
        className="lux-clock-sr-only"
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
      className={`lux-clock-root lux-clock-thumbnail ${className}`}
      aria-hidden="true"
    >
      <ComponentStyles css={LUXURY_CLOCK_CSS} />
      <ClockDial
        reading={{ hours: 10, minutes: 8, seconds: second, label: "" }}
        brand="ROLEX"
      />
    </div>
  );
}

const LUXURY_CLOCK_CSS = `
.lux-clock-root{container-type:inline-size;position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;width:100%;overflow:hidden;background:radial-gradient(ellipse at 55% 48%,rgba(27,57,66,.24),transparent 70%),linear-gradient(135deg,#0f2027,#203a43 55%,#2c5364);color:#f8df67;--lux-clock-size:min(390px,74cqw)}.lux-clock-root *{box-sizing:border-box}.lux-clock-stage{width:100%;min-height:580px;display:grid;place-items:center}.lux-clock-dial{width:var(--lux-clock-size);height:var(--lux-clock-size);padding:calc(var(--lux-clock-size)*.022);border-radius:50%;background:#252525;box-shadow:10px 14px 25px rgba(0,0,0,.42),-4px -3px 14px rgba(255,255,255,.025)}.lux-clock-face{position:relative;width:100%;height:100%;border-radius:50%;background:#101010;box-shadow:inset 0 0 10px rgba(0,0,0,.15)}.lux-clock-number{position:absolute;font:700 calc(var(--lux-clock-size)*.069)/1 Arial,sans-serif;letter-spacing:-.035em;color:#f8df67;text-shadow:0 0 9px rgba(255,215,0,.55)}.lux-clock-twelve{top:4.5%;left:50%;transform:translateX(-50%)}.lux-clock-three{right:4.4%;top:50%;transform:translateY(-50%)}.lux-clock-six{bottom:4.4%;left:50%;transform:translateX(-50%)}.lux-clock-nine{left:4.4%;top:50%;transform:translateY(-50%)}.lux-clock-crown{position:absolute;width:calc(var(--lux-clock-size)*.065);height:calc(var(--lux-clock-size)*.054);top:20.5%;left:50%;transform:translateX(-50%);color:#9f8522;filter:drop-shadow(0 0 2px rgba(255,215,0,.2))}.lux-clock-brand{position:absolute;top:27.3%;left:50%;transform:translateX(-50%);font:700 calc(var(--lux-clock-size)*.047)/1 Georgia,serif;color:#006039;letter-spacing:.01em}.lux-clock-hand{position:absolute;left:50%;bottom:50%;transform-origin:50% 100%;border-radius:10px;pointer-events:none}.lux-clock-hour{height:23.333%;width:calc(var(--lux-clock-size)*.021);background:#fff;opacity:.9;z-index:1}.lux-clock-minute{height:33.333%;width:calc(var(--lux-clock-size)*.015);background:#f1f1f1;z-index:2}.lux-clock-second{height:40%;width:calc(var(--lux-clock-size)*.0075);background:#ffd700;box-shadow:0 0 15px #ffd700;z-index:3}.lux-clock-pin{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:calc(var(--lux-clock-size)*.052);height:calc(var(--lux-clock-size)*.052);border-radius:50%;background:#ffd700;box-shadow:0 0 14px rgba(255,215,0,.55);z-index:4}.lux-clock-sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.lux-clock-thumbnail{min-height:250px;height:100%;--lux-clock-size:min(242px,66cqw)}.lux-clock-thumbnail .lux-clock-hand{transition:transform .7s ease}.lux-clock-thumbnail .lux-clock-brand{font-size:calc(var(--lux-clock-size)*.048)}@container(max-width:520px){.lux-clock-stage{min-height:450px;--lux-clock-size:min(340px,78cqw)}}@container(max-width:380px){.lux-clock-stage{min-height:390px;--lux-clock-size:78cqw}}@media(prefers-reduced-motion:reduce){.lux-clock-thumbnail .lux-clock-hand{transition:none}}
`;
