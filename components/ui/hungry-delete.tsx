"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

export interface HungryDeleteProps {
  /** Resolve after deleting; reject to restore the letters and announce an error. */
  onDelete?: () => void | Promise<void>;
  onError?: (error: unknown) => void;
  label?: string;
  disabled?: boolean;
  initialLettersEaten?: number;
  initialSoundEnabled?: boolean;
  className?: string;
}

type Variant = "success" | "failure";
type Phase =
  "idle" | "eating" | "digesting" | "success" | "error" | "returning";
type Wait = {
  timer: ReturnType<typeof setTimeout>;
  resolve: (active: boolean) => void;
};

function Bin() {
  return (
    <svg className="hd-bin" viewBox="0 0 32 38" fill="none" aria-hidden="true">
      <path
        className="hd-bin-body"
        d="m7 12 2 22h14l2-22Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <g
        className="hd-bin-lid"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9h26M11 5h10l2 4H9l2-4Z" />
      </g>
    </svg>
  );
}

function DeleteControl({
  variant,
  phase,
  label,
  disabled,
  onClick,
}: {
  variant: Variant;
  phase: Phase;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const busy = phase !== "idle";
  return (
    <div className={`hd-control hd-${variant}`}>
      <button
        type="button"
        className="hd-action"
        data-phase={phase}
        disabled={disabled}
        aria-label={`${variant === "failure" ? "Try failed deletion demo" : label}${busy ? " — processing" : ""}`}
        aria-busy={busy}
        aria-disabled={busy || disabled}
        onClick={onClick}
      >
        <span className="hd-orbit" aria-hidden="true" />
        <Bin />
        <span className="hd-letters" aria-hidden="true">
          {Array.from(label).map((letter, index) => (
            <span
              key={`${index}-${letter}`}
              className="hd-letter"
              style={
                {
                  "--delay": `${index * 95}ms`,
                  "--return-delay": `${(label.length - index - 1) * 65}ms`,
                  "--travel": `${-(5.4 + index * 2.12)}cqw`,
                  "--spin": `${index % 2 ? 65 : -55}deg`,
                } as CSSProperties
              }
            >
              {letter === " " ? "\u00a0" : letter}
            </span>
          ))}
        </span>
      </button>
      <span className="hd-caption">
        {variant === "success" ? "Succeeds" : "Fails · spits it back"}
      </span>
    </div>
  );
}

function Heading() {
  return (
    <header className="hd-heading">
      <p>Micro-interaction Nº 02</p>
      <h2>
        Hungry <span>Delete</span>
      </h2>
      <div>Press a button. The bin eats the word.</div>
    </header>
  );
}

/** A self-contained, replayable deletion interaction with a simulated failure path. */
export default function HungryDelete({
  onDelete,
  onError,
  label = "Delete",
  disabled = false,
  initialLettersEaten = 18,
  initialSoundEnabled = true,
  className = "",
}: HungryDeleteProps) {
  const [phases, setPhases] = useState<Record<Variant, Phase>>({
    success: "idle",
    failure: "idle",
  });
  const [lettersEaten, setLettersEaten] = useState(initialLettersEaten);
  const [soundEnabled, setSoundEnabled] = useState(initialSoundEnabled);
  const [feedback, setFeedback] = useState("");
  const mounted = useRef(false);
  const pending = useRef(new Set<Variant>());
  const waits = useRef(new Set<Wait>());
  const audio = useRef<AudioContext | null>(null);
  const statusId = useId();

  useEffect(() => {
    mounted.current = true;
    const activeWaits = waits.current;
    return () => {
      mounted.current = false;
      activeWaits.forEach(({ timer, resolve }) => {
        clearTimeout(timer);
        resolve(false);
      });
      activeWaits.clear();
      void audio.current?.close().catch(() => {});
    };
  }, []);

  function wait(milliseconds: number) {
    return new Promise<boolean>((resolve) => {
      const entry: Wait = {
        timer: setTimeout(() => {
          waits.current.delete(entry);
          resolve(mounted.current);
        }, milliseconds),
        resolve,
      };
      waits.current.add(entry);
    });
  }

  function tone(frequency: number, endFrequency: number) {
    if (!soundEnabled) return;
    try {
      audio.current ??= new AudioContext();
      const context = audio.current;
      void context.resume().catch(() => {});
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        endFrequency,
        context.currentTime + 0.12,
      );
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.14);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.15);
    } catch {
      /* Audio is an optional enhancement. */
    }
  }

  async function run(variant: Variant) {
    if (disabled || pending.current.has(variant)) return;
    pending.current.add(variant);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const update = (phase: Phase) => {
      if (mounted.current)
        setPhases((previous) => ({ ...previous, [variant]: phase }));
    };
    setFeedback(
      variant === "failure" ? "Trying the failed deletion demo…" : "Deleting…",
    );
    tone(420, 180);
    update(reducedMotion ? "digesting" : "eating");
    // Catch immediately so a fast rejection cannot become an unhandled promise.
    const result =
      variant === "failure"
        ? Promise.resolve({
            ok: false,
            error: new Error("Demo deletion failed"),
          })
        : Promise.resolve()
            .then(() => onDelete?.())
            .then(
              () => ({ ok: true, error: undefined }),
              (error: unknown) => ({ ok: false, error }),
            );
    const countDuringAnimation =
      variant === "success" && !onDelete && !reducedMotion;
    if (countDuringAnimation) {
      Array.from(label).forEach((letter, index) => {
        if (!letter.trim()) return;
        void wait(550 + index * 95).then((active) => {
          if (active) setLettersEaten((count) => count + 1);
        });
      });
    }
    if (!(await wait(reducedMotion ? 0 : 600 + Array.from(label).length * 95)))
      return;
    update("digesting");
    const [outcome, active] = await Promise.all([
      result,
      wait(reducedMotion ? 0 : 700),
    ]);
    if (!active || !mounted.current) return;
    if (outcome.ok) {
      if (!countDuringAnimation)
        setLettersEaten(
          (count) =>
            count + Array.from(label).filter((letter) => letter.trim()).length,
        );
      setFeedback(
        onDelete
          ? "Deleted successfully."
          : "Success demo complete. The bin ate the word.",
      );
      update("success");
      tone(520, 880);
    } else {
      setFeedback(
        variant === "failure"
          ? "Demo deletion failed. The bin is returning the letters."
          : "Deletion failed. Your item is unchanged; try again.",
      );
      update("error");
      tone(220, 100);
      if (variant === "success") {
        try {
          onError?.(outcome.error);
        } catch {
          /* Consumer error reporting must not block the reset. */
        }
      }
    }
    if (!(await wait(reducedMotion ? 0 : 600))) return;
    update("returning");
    if (!(await wait(reducedMotion ? 0 : 700 + Array.from(label).length * 65)))
      return;
    update("idle");
    pending.current.delete(variant);
  }

  return (
    <section
      className={`hungry-delete relative mx-auto w-full ${className}`}
      aria-label="Hungry Delete interactive demo"
      aria-describedby={statusId}
    >
      <style>{HUNGRY_DELETE_STYLES}</style>
      <div className="hd-stage">
        <Heading />
        <div className="hd-panel">
          <div className="hd-actions flex items-center justify-between">
            <DeleteControl
              variant="success"
              phase={phases.success}
              label={label}
              disabled={disabled}
              onClick={() => void run("success")}
            />
            <DeleteControl
              variant="failure"
              phase={phases.failure}
              label={label}
              disabled={disabled}
              onClick={() => void run("failure")}
            />
          </div>
          <div className="hd-tools flex items-center justify-center">
            <button
              type="button"
              className="hd-sound"
              aria-pressed={soundEnabled}
              onClick={() => setSoundEnabled((value) => !value)}
            >
              Sound {soundEnabled ? "on" : "off"}
            </button>
            <span className="hd-count">{lettersEaten} letters eaten</span>
          </div>
        </div>
        <p
          className="hd-feedback"
          id={statusId}
          role="status"
          aria-live="polite"
        >
          {feedback}
        </p>
      </div>
    </section>
  );
}

/** Noninteractive, deterministic still frames for a component gallery. */
export function HungryDeleteThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  const step = Math.abs(Math.trunc(previewStep)) % 4;
  return (
    <div
      className={`hungry-delete hd-thumbnail ${className}`}
      aria-hidden="true"
      inert
    >
      <style>{HUNGRY_DELETE_STYLES}</style>
      <div className="hd-stage">
        <Heading />
        <div className="hd-panel">
          <div className="hd-actions flex items-center justify-between">
            <DeleteControl
              variant="success"
              phase={step === 1 ? "digesting" : "idle"}
              label="Delete"
            />
            <DeleteControl
              variant="failure"
              phase={
                step === 2 ? "digesting" : step === 3 ? "returning" : "idle"
              }
              label="Delete"
            />
          </div>
          <div className="hd-tools flex items-center justify-center">
            <span className="hd-sound">Sound on</span>
            <span className="hd-count">{step ? 24 : 18} letters eaten</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const HUNGRY_DELETE_STYLES = `
.hungry-delete{container-type:inline-size;max-width:840px;min-width:0;isolation:isolate;font-family:Arial,Helvetica,sans-serif;color:#19181c}.hungry-delete *{box-sizing:border-box}.hungry-delete .hd-stage{container-type:inline-size;width:100%;aspect-ratio:4/3;position:relative;overflow:hidden;background-color:#eee9d7;background-image:radial-gradient(#d8d3c4 .8px,transparent .8px);background-size:2.5cqw 2.5cqw}.hungry-delete .hd-heading{position:absolute;left:0;right:0;top:1.25cqw;text-align:center}.hungry-delete .hd-heading p{margin:0 0 1.1cqw;text-transform:uppercase;font-size:1.65cqw;letter-spacing:.3cqw;font-weight:600;color:#787369}.hungry-delete .hd-heading h2{margin:0;display:flex;align-items:center;justify-content:center;gap:1.7cqw;font-size:8.2cqw;font-weight:800;line-height:1;letter-spacing:-.35cqw}.hungry-delete .hd-heading h2>span{display:inline-block;background:#c3fa42;border:.45cqw solid #17161c;border-radius:2cqw;padding:.3cqw 1.3cqw .4cqw;box-shadow:.6cqw .6cqw 0 #17161c;transform:rotate(-3deg);letter-spacing:-.35cqw}.hungry-delete .hd-heading>div{margin-top:2.3cqw;font-size:2cqw;color:#5e584f;line-height:1.4}.hungry-delete .hd-panel{position:absolute;left:12.5cqw;top:27.6cqw;width:75cqw;height:38.6cqw;border:.45cqw solid #19181c;border-radius:3.6cqw;background:#fffaf1;box-shadow:1.3cqw 1.3cqw 0 #19181c}.hungry-delete .hd-actions{position:absolute;left:4.8cqw;right:4.8cqw;top:10.8cqw;gap:3.5cqw}.hungry-delete .hd-control{position:relative;width:27.6cqw;height:17cqw;display:flex;flex-direction:column;align-items:center;flex-shrink:0}.hungry-delete .hd-action{position:relative;display:block;border:0;width:27.6cqw;height:11.4cqw;border-radius:20cqw;flex-shrink:0;background:linear-gradient(155deg,#45444c 0%,#17161d 65%,#111016 100%);box-shadow:0 2cqw 3.5cqw #28252d30,inset 0 .2cqw .3cqw #ffffff30;color:#c1fb3f;cursor:pointer;transition:width .35s cubic-bezier(.22,1,.36,1),transform .2s,box-shadow .2s;overflow:visible;outline:none;-webkit-tap-highlight-color:transparent}.hungry-delete .hd-failure .hd-action{background:linear-gradient(145deg,#7c7bff 0%,#4141fa 45%,#1616e9 100%);box-shadow:0 1.6cqw 4cqw #4545f83d,inset 0 .2cqw .3cqw #ffffff50;color:#fff}.hungry-delete .hd-action:hover:not([aria-disabled=true]){transform:translateY(-.4cqw)}.hungry-delete .hd-action:focus-visible,.hungry-delete .hd-sound:focus-visible{outline:.4cqw solid #7671d9;outline-offset:.8cqw}.hungry-delete .hd-action:disabled{opacity:.4;cursor:not-allowed}.hungry-delete .hd-action[aria-disabled=true]{cursor:wait}.hungry-delete .hd-bin{position:absolute;left:4cqw;top:2.9cqw;width:4.2cqw;height:5cqw;overflow:visible;transition:left .35s}.hungry-delete .hd-bin-lid{transform-origin:25px 9px}.hungry-delete .hd-bin-body{transition:fill .2s}.hungry-delete .hd-letters{position:absolute;left:10.5cqw;top:3.2cqw;display:flex;white-space:nowrap;font-size:4.1cqw;font-weight:700;line-height:1.2;letter-spacing:-.06cqw}.hungry-delete .hd-letter{display:block;transform-origin:center bottom}.hungry-delete .hd-caption{position:absolute;top:14.5cqw;font-size:1.4cqw;color:#89847d;text-transform:uppercase;font-weight:700;letter-spacing:.17cqw;white-space:nowrap}.hungry-delete .hd-tools{position:absolute;bottom:3cqw;left:0;right:0;gap:1.3cqw;font-size:1.65cqw;font-weight:700}.hungry-delete .hd-sound{display:inline-flex;align-items:center;justify-content:center;border:.3cqw solid #19181c;border-radius:20cqw;background:#c3fa42;box-shadow:.3cqw .35cqw 0 #19181c;padding:1.05cqw 1.65cqw;font-family:inherit;font-size:inherit;font-weight:inherit;color:#19181c;cursor:pointer;line-height:1.2}.hungry-delete .hd-sound[aria-pressed=false]{background:#eee9d7}.hungry-delete .hd-count{padding:1.4cqw 2cqw;border-radius:20cqw;line-height:1.2;background:#19181c;color:#c3fa42}.hungry-delete .hd-feedback{position:absolute;left:5%;right:5%;bottom:1.5cqw;margin:0;text-align:center;font-size:1.5cqw;line-height:1.5;color:#5e584f}.hungry-delete .hd-orbit{position:absolute;inset:-1.4cqw;border:.3cqw solid transparent;border-top-color:#19181c;border-right-color:#19181c;border-radius:50%;opacity:0;pointer-events:none}.hungry-delete .hd-action[data-phase=eating] .hd-bin-lid{animation:hd-open-lid .26s ease forwards}.hungry-delete .hd-action[data-phase=eating] .hd-bin{animation:hd-chomp .22s ease .2s 5}.hungry-delete .hd-action[data-phase=eating] .hd-letter{animation:hd-eat-letter .6s cubic-bezier(.4,0,.35,1) var(--delay) both}.hungry-delete .hd-action:is([data-phase=digesting],[data-phase=success],[data-phase=error]){width:11.4cqw}.hungry-delete .hd-action:is([data-phase=digesting],[data-phase=success],[data-phase=error]) .hd-bin{left:3.6cqw}.hungry-delete .hd-action:is([data-phase=digesting],[data-phase=success],[data-phase=error]) .hd-bin-body{fill:currentColor}.hungry-delete .hd-action:is([data-phase=digesting],[data-phase=success],[data-phase=error]) .hd-letters{opacity:0}.hungry-delete .hd-action[data-phase=digesting] .hd-orbit{opacity:1;animation:hd-spin .7s linear infinite}.hungry-delete .hd-action[data-phase=success]{animation:hd-burp .4s ease}.hungry-delete .hd-action[data-phase=error]{animation:hd-nope .4s ease}.hungry-delete .hd-action[data-phase=returning] .hd-letter{animation:hd-return-letter .5s cubic-bezier(.2,.8,.2,1) var(--return-delay) both}.hungry-delete .hd-failure .hd-action[data-phase=returning] .hd-bin-lid{animation:hd-spit-lid .5s ease}.hungry-delete .hd-action[data-phase=returning] .hd-orbit{animation:hd-ring-fade .4s ease both}
.hungry-delete .hd-success .hd-action[data-phase=returning] .hd-letter{animation:hd-label-back .4s ease .25s both}
@keyframes hd-label-back{from{opacity:0;transform:translateY(.4cqw)}to{opacity:1;transform:translateY(0)}}@keyframes hd-eat-letter{0%{transform:translate(0,0) rotate(0);opacity:1}40%{transform:translate(calc(var(--travel) * .4),-5cqw) rotate(var(--spin));opacity:1}85%{transform:translate(var(--travel),.3cqw) rotate(-30deg) scale(.4);opacity:1}100%{transform:translate(var(--travel),1cqw) scale(0);opacity:0}}@keyframes hd-open-lid{to{transform:translateY(-3px) rotate(35deg)}}@keyframes hd-chomp{50%{transform:rotate(-9deg)}100%{transform:rotate(0)}}@keyframes hd-spin{to{transform:rotate(360deg)}}@keyframes hd-burp{40%{transform:scale(1.12,.9)}75%{transform:scale(.96,1.05)}}@keyframes hd-nope{25%,75%{transform:translateX(-.8cqw) rotate(-7deg)}50%{transform:translateX(.8cqw) rotate(7deg)}}@keyframes hd-return-letter{0%{opacity:0;transform:translate(var(--travel),1cqw) scale(0)}35%{opacity:1;transform:translate(calc(var(--travel) * .55),-4cqw) rotate(var(--spin))}100%{opacity:1;transform:translate(0,0) rotate(0)}}@keyframes hd-spit-lid{35%{transform:translateY(-4px) rotate(-35deg)}100%{transform:rotate(0)}}@keyframes hd-ring-fade{from{opacity:1;transform:scale(.7)}to{opacity:0;transform:scale(1.3)}}
.hungry-delete.hd-thumbnail{max-width:none;height:100%;pointer-events:none}.hungry-delete.hd-thumbnail .hd-stage{height:100%;aspect-ratio:auto;min-height:0}.hungry-delete.hd-thumbnail *{animation:none!important}.hungry-delete.hd-thumbnail .hd-action[data-phase=digesting] .hd-orbit{opacity:1;transform:rotate(35deg)}.hungry-delete.hd-thumbnail .hd-action[data-phase=returning] .hd-letter:nth-child(-n+3){transform:translate(-2cqw,-3cqw) rotate(-25deg)}
@media(prefers-reduced-motion:reduce){.hungry-delete *,.hungry-delete *::before,.hungry-delete *::after{animation:none!important;transition:none!important}.hungry-delete .hd-action[data-phase=eating] .hd-letters{opacity:0}}
`;
