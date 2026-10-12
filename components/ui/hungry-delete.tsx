"use client";

import { ComponentStyles } from "./component-styles";

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

// Shared Tailwind class lists (complete literals, so Tailwind can detect them).
const ROOT =
  "@container min-w-0 isolate font-[family-name:Arial,Helvetica,sans-serif] text-[#19181c] **:box-border";
/** The playground's full-screen mode: centre a 4:3 stage on a dotted backdrop. */
const FULLSCREEN_ROOT =
  "in-data-[fullscreen=true]:flex in-data-[fullscreen=true]:max-w-none in-data-[fullscreen=true]:@container-size in-data-[fullscreen=true]:items-center in-data-[fullscreen=true]:justify-center in-data-[fullscreen=true]:bg-[#eee9d7] in-data-[fullscreen=true]:bg-[radial-gradient(#d8d3c4_.8px,transparent_.8px)] in-data-[fullscreen=true]:bg-[length:calc(min(100cqw,133.333cqh)*.025)_calc(min(100cqw,133.333cqh)*.025)] in-data-[fullscreen=true]:bg-center";
const STAGE =
  "@container relative w-full overflow-hidden bg-[#eee9d7] bg-[radial-gradient(#d8d3c4_.8px,transparent_.8px)] bg-[length:2.5cqw_2.5cqw]";
const PANEL =
  "absolute top-[27.6cqw] left-[12.5cqw] h-[38.6cqw] w-[75cqw] rounded-[3.6cqw] border-[.45cqw] border-solid border-[#19181c] bg-[#fffaf1] shadow-[1.3cqw_1.3cqw_0_#19181c]";
const ACTIONS =
  "absolute inset-x-[4.8cqw] top-[10.8cqw] flex items-center justify-between gap-[3.5cqw]";
const TOOLS =
  "absolute inset-x-0 bottom-[3cqw] flex items-center justify-center gap-[1.3cqw] text-[1.65cqw] font-bold";
const SOUND =
  "inline-flex items-center justify-center rounded-[20cqw] border-[.3cqw] border-solid border-[#19181c] bg-[#c3fa42] px-[1.65cqw] py-[1.05cqw] [font-family:inherit] [font-size:inherit] leading-[1.2] [font-weight:inherit] text-[#19181c] shadow-[.3cqw_.35cqw_0_#19181c] cursor-pointer";
const COUNT =
  "rounded-[20cqw] bg-[#19181c] px-[2cqw] py-[1.4cqw] leading-[1.2] text-[#c3fa42]";

/** Phases where the button shrinks to a filled bin while the word is "digested". */
function isCollapsed(phase: Phase) {
  return phase === "digesting" || phase === "success" || phase === "error";
}

function Bin({ variant, phase }: { variant: Variant; phase: Phase }) {
  const collapsed = isCollapsed(phase);
  return (
    <svg
      className={`absolute top-[2.9cqw] h-[5cqw] w-[4.2cqw] overflow-visible [transition:left_.35s] ${collapsed ? "left-[3.6cqw]" : "left-[4cqw]"} ${phase === "eating" ? "animate-[hd-chomp_.22s_ease_.2s_5]" : ""}`}
      viewBox="0 0 32 38"
      fill="none"
      aria-hidden="true"
    >
      <path
        className={`[transition:fill_.2s] ${collapsed ? "fill-current" : ""}`}
        d="m7 12 2 22h14l2-22Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <g
        className={`origin-[25px_9px] ${
          phase === "eating"
            ? "animate-[hd-open-lid_.26s_ease_forwards]"
            : phase === "returning" && variant === "failure"
              ? "animate-[hd-spit-lid_.5s_ease]"
              : ""
        }`}
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
  const collapsed = isCollapsed(phase);
  return (
    <div className="relative flex h-[17cqw] w-[27.6cqw] shrink-0 flex-col items-center">
      <button
        type="button"
        className={`hd-action relative block h-[11.4cqw] shrink-0 cursor-pointer overflow-visible rounded-[20cqw] border-none outline-none [-webkit-tap-highlight-color:transparent] [transition:width_.35s_cubic-bezier(.22,1,.36,1),transform_.2s,box-shadow_.2s] hover:not-aria-disabled:transform-[translateY(-.4cqw)] disabled:opacity-40 ${
          variant === "failure"
            ? "bg-[linear-gradient(145deg,#7c7bff_0%,#4141fa_45%,#1616e9_100%)] text-white shadow-[0_1.6cqw_4cqw_#4545f83d,inset_0_.2cqw_.3cqw_#ffffff50]"
            : "bg-[linear-gradient(155deg,#45444c_0%,#17161d_65%,#111016_100%)] text-[#c1fb3f] shadow-[0_2cqw_3.5cqw_#28252d30,inset_0_.2cqw_.3cqw_#ffffff30]"
        } ${collapsed ? "w-[11.4cqw]" : "w-[27.6cqw]"} ${
          phase === "success"
            ? "animate-[hd-burp_.4s_ease]"
            : phase === "error"
              ? "animate-[hd-nope_.4s_ease]"
              : ""
        }`}
        data-phase={phase}
        disabled={disabled}
        aria-label={`${variant === "failure" ? "Try failed deletion demo" : label}${busy ? " — processing" : ""}`}
        aria-busy={busy}
        aria-disabled={busy || disabled}
        onClick={onClick}
      >
        <span
          className={`hd-orbit pointer-events-none absolute -inset-[1.4cqw] rounded-[50%] border-[.3cqw] border-solid border-transparent border-t-[#19181c] border-r-[#19181c] ${
            phase === "digesting"
              ? "opacity-100 animate-[hd-spin_.7s_linear_infinite]"
              : phase === "returning"
                ? "opacity-0 animate-[hd-ring-fade_.4s_ease_both]"
                : "opacity-0"
          }`}
          aria-hidden="true"
        />
        <Bin variant={variant} phase={phase} />
        <span
          className={`absolute top-[3.2cqw] left-[10.5cqw] flex text-[4.1cqw] leading-[1.2] font-bold tracking-[-.06cqw] whitespace-nowrap ${
            collapsed
              ? "opacity-0"
              : phase === "eating"
                ? "motion-reduce:opacity-0"
                : ""
          }`}
          aria-hidden="true"
        >
          {Array.from(label).map((letter, index) => (
            <span
              key={`${index}-${letter}`}
              className={`hd-letter block origin-bottom ${
                phase === "eating"
                  ? "animate-[hd-eat-letter_.6s_cubic-bezier(.4,0,.35,1)_var(--delay)_both]"
                  : phase === "returning"
                    ? variant === "success"
                      ? "animate-[hd-label-back_.4s_ease_.25s_both]"
                      : "animate-[hd-return-letter_.5s_cubic-bezier(.2,.8,.2,1)_var(--return-delay)_both]"
                    : ""
              }`}
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
      <span className="absolute top-[14.5cqw] text-[1.4cqw] font-bold tracking-[.17cqw] whitespace-nowrap text-[#89847d] uppercase">
        {variant === "success" ? "Succeeds" : "Fails · spits it back"}
      </span>
    </div>
  );
}

function Heading() {
  return (
    <header className="absolute inset-x-0 top-[1.25cqw] text-center">
      <p className="m-0 mb-[1.1cqw] text-[1.65cqw] font-semibold tracking-[.3cqw] text-[#787369] uppercase">
        Micro-interaction Nº 02
      </p>
      <h2 className="m-0 flex items-center justify-center gap-[1.7cqw] text-[8.2cqw] leading-none font-extrabold tracking-[-.35cqw]">
        Hungry{" "}
        <span className="inline-block -rotate-3 rounded-[2cqw] border-[.45cqw] border-solid border-[#17161c] bg-[#c3fa42] px-[1.3cqw] pt-[.3cqw] pb-[.4cqw] tracking-[-.35cqw] shadow-[.6cqw_.6cqw_0_#17161c]">
          Delete
        </span>
      </h2>
      <div className="mt-[2.3cqw] text-[2cqw] leading-[1.4] text-[#5e584f]">
        Press a button. The bin eats the word.
      </div>
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
      className={`hungry-delete ${ROOT} relative mx-auto w-full max-w-[840px] ${FULLSCREEN_ROOT} ${className}`}
      aria-label="Hungry Delete interactive demo"
      aria-describedby={statusId}
    >
      <ComponentStyles css={HUNGRY_DELETE_STYLES} />
      <div
        className={`${STAGE} aspect-[4/3] in-data-[fullscreen=true]:w-[min(100cqw,133.333cqh)] in-data-[fullscreen=true]:flex-none in-data-[fullscreen=true]:[background:none]`}
      >
        <Heading />
        <div className={PANEL}>
          <div className={ACTIONS}>
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
          <div className={TOOLS}>
            <button
              type="button"
              className={`hd-sound ${SOUND} aria-[pressed=false]:bg-[#eee9d7]`}
              aria-pressed={soundEnabled}
              onClick={() => setSoundEnabled((value) => !value)}
            >
              Sound {soundEnabled ? "on" : "off"}
            </button>
            <span className={COUNT}>{lettersEaten} letters eaten</span>
          </div>
        </div>
        <p
          className="absolute inset-x-[5%] bottom-[1.5cqw] m-0 text-center text-[1.5cqw] leading-[1.5] text-[#5e584f]"
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
      className={`hungry-delete hd-thumbnail ${ROOT} pointer-events-none h-full ${className}`}
      aria-hidden="true"
      inert
    >
      <ComponentStyles css={HUNGRY_DELETE_STYLES} />
      <div className={`${STAGE} h-full min-h-0`}>
        <Heading />
        <div className={PANEL}>
          <div className={ACTIONS}>
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
          <div className={TOOLS}>
            <span className={SOUND}>Sound on</span>
            <span className={COUNT}>{step ? 24 : 18} letters eaten</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Raw CSS is limited to keyframes, the gallery's frozen thumbnail poses, the
// reduced-motion reset, and two state rules that must outrank the host page's
// unlayered global button-cursor and :focus-visible styles.
const HUNGRY_DELETE_STYLES = `
.hungry-delete .hd-action[aria-disabled=true]{cursor:wait}.hungry-delete .hd-action:focus-visible,.hungry-delete .hd-sound:focus-visible{outline:.4cqw solid #7671d9;outline-offset:.8cqw}
@keyframes hd-label-back{from{opacity:0;transform:translateY(.4cqw)}to{opacity:1;transform:translateY(0)}}@keyframes hd-eat-letter{0%{transform:translate(0,0) rotate(0);opacity:1}40%{transform:translate(calc(var(--travel) * .4),-5cqw) rotate(var(--spin));opacity:1}85%{transform:translate(var(--travel),.3cqw) rotate(-30deg) scale(.4);opacity:1}100%{transform:translate(var(--travel),1cqw) scale(0);opacity:0}}@keyframes hd-open-lid{to{transform:translateY(-3px) rotate(35deg)}}@keyframes hd-chomp{50%{transform:rotate(-9deg)}100%{transform:rotate(0)}}@keyframes hd-spin{to{transform:rotate(360deg)}}@keyframes hd-burp{40%{transform:scale(1.12,.9)}75%{transform:scale(.96,1.05)}}@keyframes hd-nope{25%,75%{transform:translateX(-.8cqw) rotate(-7deg)}50%{transform:translateX(.8cqw) rotate(7deg)}}@keyframes hd-return-letter{0%{opacity:0;transform:translate(var(--travel),1cqw) scale(0)}35%{opacity:1;transform:translate(calc(var(--travel) * .55),-4cqw) rotate(var(--spin))}100%{opacity:1;transform:translate(0,0) rotate(0)}}@keyframes hd-spit-lid{35%{transform:translateY(-4px) rotate(-35deg)}100%{transform:rotate(0)}}@keyframes hd-ring-fade{from{opacity:1;transform:scale(.7)}to{opacity:0;transform:scale(1.3)}}
.hungry-delete.hd-thumbnail *{animation:none!important}.hungry-delete.hd-thumbnail .hd-action[data-phase=digesting] .hd-orbit{transform:rotate(35deg)}.hungry-delete.hd-thumbnail .hd-action[data-phase=returning] .hd-letter:nth-child(-n+3){transform:translate(-2cqw,-3cqw) rotate(-25deg)}
@media(prefers-reduced-motion:reduce){.hungry-delete *,.hungry-delete *::before,.hungry-delete *::after{animation:none!important;transition:none!important}}
`;
