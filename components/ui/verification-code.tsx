"use client";

import { ComponentStyles } from "./component-styles";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

export interface VerificationCodeProps {
  /** Supply your server verification action. Without it, any four digits run the local demo. */
  onVerify?: (code: string) => boolean | Promise<boolean>;
  onResend?: () => void | Promise<void>;
  onVerified?: (code: string) => void;
  resendDelay?: number;
  className?: string;
}

type VerificationState =
  "idle" | "checking" | "verifying" | "success" | "error";

/*
 * Tailwind classes shared by the live component and its gallery thumbnail.
 * Sizes live on each element so the thumbnail can render a compact copy.
 * `group/card` carries `data-state`, which drives every state style below.
 */
const stageClass =
  "verification-code @container grid place-items-center bg-[#fafafa] font-[family-name:Arial,Helvetica,sans-serif] text-[#121820]";
const cardClass =
  "group/card relative flex flex-col items-center bg-white shadow-[0_8px_40px_#182c4210]";
const titleClass = "m-0 block text-center font-bold leading-[1.25]";
const descriptionClass = "mb-0 text-center leading-[1.6] text-[#878b8e]";
const inputAreaClass = "relative grid w-full place-items-center";
/* The track line behind the tiles fades out once the tiles start merging. */
const inputsClass =
  "relative flex w-full items-center justify-center before:absolute before:top-1/2 before:h-1 before:w-[78%] before:rounded-[3px] before:bg-[#ddebf0] before:content-[''] before:[transition:opacity_.2s] motion-reduce:before:transition-none group-data-[state=verifying]/card:before:opacity-0 group-data-[state=success]/card:before:opacity-0 group-data-[state=success]/card:invisible group-data-[state=success]/card:opacity-0 motion-reduce:group-data-[state=verifying]/card:opacity-60";
/* `after:` draws the glossy highlight; the error ring outranks the filled style. */
const tileClass =
  "relative block shrink-0 bg-[linear-gradient(155deg,#fff_35%,#f9fcfe)] shadow-[0_0_0_1px_#eef2f5,0_6px_3px_-5px_#308abe80,0_4px_10px_#192b4210] [transition:background_.2s,box-shadow_.2s] motion-reduce:transition-none after:pointer-events-none after:absolute after:inset-x-[5px] after:top-[2px] after:h-[3px] after:rounded-[50%] after:bg-[#fff9] after:content-[''] data-[filled=true]:bg-[linear-gradient(150deg,#82d3f9,#509de4_45%,#286bc7)] data-[filled=true]:shadow-[inset_0_1px_2px_#fff8,0_4px_9px_#2681ce45] group-data-[state=error]/card:shadow-[0_0_0_1px_#dc7373,0_4px_10px_#b2232310]!";
const digitClass =
  "grid size-full place-items-center rounded-xl border-0 bg-transparent p-0 text-center text-white";
const footerClass = "text-center text-[#81878b]";
const secureClass = "flex items-center justify-center gap-[5px] text-[#43bfa0]";
const resendClass =
  "cursor-pointer border-0 bg-transparent p-0 text-[#3578a9] underline underline-offset-2";
/** Each spark's travel offset, passed to CSS as custom properties. */
const SPARKS: React.CSSProperties[] = [
  { "--vc-spark-x": "-42px", "--vc-spark-y": "-28px" },
  { "--vc-spark-x": "43px", "--vc-spark-y": "-15px" },
  { "--vc-spark-x": "-32px", "--vc-spark-y": "33px" },
  { "--vc-spark-x": "30px", "--vc-spark-y": "39px" },
].map((offset) => offset as React.CSSProperties);

function LockArtwork({
  verified = false,
  compact = false,
}: {
  verified?: boolean;
  compact?: boolean;
}) {
  const gradientId = useId().replace(/:/g, "");
  return (
    <span
      className={`grid place-items-center bg-[radial-gradient(ellipse_at_40%_35%,#edf7fb,#f7f9fc_72%)] shadow-[0_5px_22px_#91b3d016] ${compact ? "mb-[14px] size-16 rounded-[18px]" : "mb-6 size-[108px] rounded-[28px]"}`}
      aria-hidden="true"
    >
      {verified ? (
        <svg
          viewBox="0 0 64 64"
          className={`animate-[vc-pop_.5s_cubic-bezier(.2,1.8,.5,1)_both] motion-reduce:animate-none ${compact ? "size-11" : "size-[67px]"}`}
        >
          <circle cx="32" cy="32" r="24" fill="#20d77a" />
          <path
            d="m22 32 7 7 14-15"
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 64 64"
          className={`animate-[vc-lock-sway_3s_ease-in-out_infinite] motion-reduce:animate-none ${compact ? "size-11" : "size-[68px]"}`}
        >
          <defs>
            <linearGradient id={`${gradientId}-blue`} x2="0" y2="1">
              <stop stopColor="#68bef5" />
              <stop offset="1" stopColor="#3177d0" />
            </linearGradient>
          </defs>
          <ellipse cx="33" cy="55" rx="14" ry="2" fill="#d7e1eb" />
          <g transform="rotate(-14 32 29)">
            <path
              d="M23 28V17a9 9 0 0 1 18 0v9"
              fill="none"
              stroke="#f2c76b"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <rect
              x="18"
              y="26"
              width="30"
              height="25"
              rx="4"
              fill={`url(#${gradientId}-blue)`}
            />
            <path d="M20 28h26" stroke="#8fd6ff" strokeWidth="2" />
            <circle cx="33" cy="36" r="3" fill="#fff" />
            <path
              d="M33 37v5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </svg>
      )}
    </span>
  );
}

/* The orb drops in while verifying, then sparks fly out on success. */
function SuccessOrb({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute rounded-[40%] bg-[radial-gradient(circle_at_35%_15%,#a0f8d8,#35d5a4_40%,#05a674_70%,#078c62)] opacity-0 shadow-[inset_0_3px_3px_#fff9,inset_0_-3px_7px_#00644360,0_8px_18px_#12ce9360] before:absolute before:h-[5px] before:-rotate-10 before:rounded-[50%] before:bg-[#ecfff4b0] before:content-[''] group-data-[state=verifying]/card:animate-[vc-drop_.85s_.65s_both] group-data-[state=success]/card:animate-[vc-orb-settle_.45s_both] group-data-[state=success]/card:opacity-100 motion-reduce:animate-none! ${compact ? "top-[calc(50%-18px)] left-[calc(50%-18px)] size-9 before:top-1 before:left-2 before:w-5" : "top-[calc(50%-29px)] left-[calc(50%-29px)] size-[58px] before:top-[6px] before:left-[13px] before:w-[31px]"}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 32 32"
        className={`size-full ${compact ? "p-1" : "p-[9px]"}`}
      >
        <path
          d="m9 16 5 5 10-11"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {SPARKS.map((spark, index) => (
        <i
          key={index}
          className="absolute top-1/2 left-1/2 size-1 rounded-[50%] bg-[#53e9bc] opacity-0 group-data-[state=success]/card:animate-[vc-spark_.65s_both] motion-reduce:animate-none!"
          style={spark}
        />
      ))}
    </span>
  );
}

/** Four input tiles tumble into a bouncing green verification orb. */
export default function VerificationCode({
  onVerify,
  onResend,
  onVerified,
  resendDelay = 30,
  className = "",
}: VerificationCodeProps) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [state, setState] = useState<VerificationState>("idle");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const run = useRef(0);
  const busy = useRef(false);
  const mounted = useRef(false);
  const focusAfterReset = useRef(false);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const isBusy =
    state === "checking" ||
    state === "verifying" ||
    state === "success" ||
    resending;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      run.current += 1;
      if (animationTimer.current) clearTimeout(animationTimer.current);
    };
  }, []);

  useEffect(() => {
    if (state === "idle" && focusAfterReset.current) {
      focusAfterReset.current = false;
      inputs.current[0]?.focus();
    }
  }, [state, digits]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(
      () => setCooldown((remaining) => remaining - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function verify(code: string) {
    if (busy.current) return;
    busy.current = true;
    const currentRun = ++run.current;
    setState("checking");
    setError("");
    try {
      const result = onVerify ? await onVerify(code) : true;
      if (!mounted.current || currentRun !== run.current) return;
      if (!result) {
        busy.current = false;
        setState("error");
        setError("That code didn’t match. Try again.");
        inputs.current[0]?.focus();
        inputs.current[0]?.select();
        return;
      }
      setState("verifying");
      const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
        ? 0
        : 1400;
      animationTimer.current = setTimeout(() => {
        if (!mounted.current || currentRun !== run.current) return;
        setState("success");
        busy.current = false;
        onVerified?.(code);
      }, duration);
    } catch {
      if (!mounted.current || currentRun !== run.current) return;
      busy.current = false;
      setState("error");
      setError("Couldn’t verify your code. Please try again.");
      inputs.current[0]?.focus();
    }
  }

  function updateDigits(next: string[], nextFocus: number) {
    setDigits(next);
    setError("");
    setState("idle");
    if (next.every(Boolean)) void verify(next.join(""));
    else inputs.current[Math.min(3, nextFocus)]?.focus();
  }

  function enter(value: string, index: number) {
    if (isBusy) return;
    const clean = value.replace(/\D/g, "");
    const next = [...digits];
    if (!clean) next[index] = "";
    else
      [...clean.slice(0, 4 - index)].forEach((digit, offset) => {
        next[index + offset] = digit;
      });
    updateDigits(next, clean ? index + clean.length : index);
  }

  function paste(event: ClipboardEvent<HTMLInputElement>, index: number) {
    event.preventDefault();
    const code = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    if (code) enter(code, code.length === 4 ? 0 : index);
  }

  function navigate(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      inputs.current[
        Math.max(0, Math.min(3, index + (event.key === "ArrowLeft" ? -1 : 1)))
      ]?.focus();
    } else if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      updateDigits(next, index - 1);
    } else if (event.key === "Enter" && digits.every(Boolean) && !isBusy) {
      event.preventDefault();
      void verify(digits.join(""));
    }
  }

  function reset() {
    run.current += 1;
    if (animationTimer.current) clearTimeout(animationTimer.current);
    busy.current = false;
    focusAfterReset.current = true;
    setDigits(["", "", "", ""]);
    setState("idle");
    setError("");
    inputs.current[0]?.focus();
  }

  async function resend() {
    if (resending || cooldown > 0 || isBusy) return;
    setResending(true);
    setError("");
    const currentRun = ++run.current;
    try {
      await onResend?.();
      if (!mounted.current || currentRun !== run.current) return;
      reset();
      setCooldown(
        Math.max(
          0,
          Math.floor(Number.isFinite(resendDelay) ? resendDelay : 30),
        ),
      );
    } catch {
      if (mounted.current && currentRun === run.current)
        setError("Couldn’t resend the code. Please try again.");
    } finally {
      if (mounted.current) setResending(false);
    }
  }

  return (
    <section
      className={`${stageClass} min-h-[560px] w-full px-4 py-8 ${className}`}
      aria-label="Code verification"
    >
      <ComponentStyles css={VERIFICATION_STYLES} />
      <div
        className={`${cardClass} min-h-[505px] w-full max-w-[416px] rounded-[18px] px-[30px] pt-10 pb-[29px] [@container(max-width:350px)]:min-h-[475px] [@container(max-width:350px)]:px-4 [@container(max-width:350px)]:py-8`}
        data-state={state}
      >
        <LockArtwork verified={state === "success"} />
        <h2
          id={`${id}-title`}
          className={`${titleClass} text-[23px] tracking-[-0.9px] [@container(max-width:350px)]:text-[22px]`}
        >
          Verification Code
        </h2>
        <p
          id={`${id}-description`}
          className={`${descriptionClass} mt-3 min-h-[42px] text-[13px]`}
        >
          {state === "success" ? (
            "Your number has been verified."
          ) : (
            <>
              Enter the 4-digit code sent to your
              <br />
              registered device.
            </>
          )}
        </p>
        <div className={`${inputAreaClass} mt-5 h-[116px]`}>
          <div
            className={`${inputsClass} gap-5 [@container(max-width:350px)]:gap-3`}
            role="group"
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-description`}
            aria-busy={state === "checking" || state === "verifying"}
          >
            {digits.map((digit, index) => (
              <span
                key={index}
                className={`${tileClass} h-[58px] w-[55px] rounded-xl [--vc-shift:75px] group-data-[state=verifying]/card:animate-[vc-merge_1.2s_cubic-bezier(.55,0,.3,1)_both] motion-reduce:animate-none! [@container(max-width:350px)]:h-[52px] [@container(max-width:350px)]:w-12 [@container(max-width:350px)]:[--vc-shift:60px]`}
                data-filled={Boolean(digit)}
                style={{ "--vc-index": index } as React.CSSProperties}
              >
                <input
                  ref={(element) => {
                    inputs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${index + 1} of 4`}
                  aria-invalid={state === "error"}
                  aria-describedby={error ? `${id}-error` : undefined}
                  value={digit}
                  maxLength={4}
                  readOnly={isBusy}
                  tabIndex={state === "success" ? -1 : 0}
                  onChange={(event) => enter(event.target.value, index)}
                  onFocus={(event) => event.target.select()}
                  onPaste={(event) => paste(event, index)}
                  onKeyDown={(event) => navigate(event, index)}
                  className={`${digitClass} caret-[#377ca8] outline-none [font:700_24px_Arial] focus-visible:[outline:2px_solid_#83a9bd]! focus-visible:outline-offset-2!`}
                />
              </span>
            ))}
          </div>
          <SuccessOrb />
        </div>
        <div className={`${footerClass} mt-[22px] min-h-12 text-[12px]`}>
          {state === "success" ? (
            <>
              <span className={`${secureClass} text-[12px]`}>
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="size-[13px] fill-none stroke-current stroke-[1.3]"
                >
                  <rect x="4" y="7" width="8" height="7" rx="1.5" />
                  <path d="M6 7V4a2 2 0 0 1 4 0v3" />
                </svg>
                Verified and secure
              </span>
              <button
                type="button"
                className="mx-auto mt-3 mb-0 block cursor-pointer border-0 bg-transparent text-[#9aa4ab] underline underline-offset-3 [font:11px_Arial]"
                onClick={reset}
              >
                Try another code
              </button>
            </>
          ) : (
            <p className="m-0">
              Didn’t receive the code?{" "}
              <button
                type="button"
                onClick={() => void resend()}
                disabled={isBusy || cooldown > 0}
                className={`${resendClass} [font:600_12px_Arial] disabled:cursor-default disabled:opacity-50`}
              >
                {resending
                  ? "Sending…"
                  : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Resend OTP"}
              </button>
            </p>
          )}
        </div>
        <p
          className="mt-1.5 mb-0 min-h-4 text-center text-[11px] text-[#be5353] empty:hidden not-data-[error=true]:absolute not-data-[error=true]:size-px not-data-[error=true]:overflow-hidden not-data-[error=true]:[clip-path:inset(50%)]"
          data-error={Boolean(error)}
          role="status"
          id={`${id}-error`}
        >
          {error ||
            (state === "checking" || state === "verifying"
              ? "Verifying your code…"
              : state === "success"
                ? "Verification complete."
                : cooldown > 0
                  ? "A new code has been requested."
                  : "")}
        </p>
      </div>
    </section>
  );
}

/** Inert gallery artwork, driven by the gallery's shared playback clock. */
export function VerificationCodeThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  const step = Math.abs(Math.trunc(previewStep)) % 6;
  const count = Math.min(4, step);
  const verified = step === 5;
  return (
    <div className={`${stageClass} h-full min-h-full p-5 ${className}`}>
      <ComponentStyles css={VERIFICATION_STYLES} />
      <div
        className={`${cardClass} h-[290px] min-h-0 w-[255px] max-w-full rounded-[14px] px-[18px] pt-[22px] pb-4`}
        data-state={verified ? "success" : "idle"}
      >
        <LockArtwork verified={verified} compact />
        <span className={`${titleClass} text-[15px] tracking-[-0.5px]`}>
          Verification Code
        </span>
        <p className={`${descriptionClass} mt-[7px] min-h-[26px] text-[8px]`}>
          {verified ? (
            "Your number has been verified."
          ) : (
            <>
              Enter the 4-digit code sent to your
              <br />
              registered device.
            </>
          )}
        </p>
        <div className={`${inputAreaClass} mt-[9px] h-[70px]`}>
          <div className={`${inputsClass} gap-[11px]`}>
            {["1", "5", "9", "6"].map((digit, index) => (
              <span
                key={index}
                className={`${tileClass} h-9 w-[34px] rounded-[7px]`}
                data-filled={index < count}
              >
                <span className={`${digitClass} [font:700_15px_Arial]`}>
                  {index < count ? digit : ""}
                </span>
              </span>
            ))}
          </div>
          <SuccessOrb compact />
        </div>
        <div className={`${footerClass} mt-3 min-h-4 text-[7px]`}>
          {verified ? (
            <span className={`${secureClass} text-[7px]`}>
              ♧ Verified and secure
            </span>
          ) : (
            <p className="m-0">
              Didn’t receive the code?{" "}
              <span className={`${resendClass} [font:600_7px_Arial]`}>
                Resend OTP
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* Only the keyframes stay raw; Tailwind references them via animate-[...]. */
const VERIFICATION_STYLES = `
@keyframes vc-lock-sway{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(5deg)}}
@keyframes vc-pop{from{transform:scale(.5) rotate(-15deg);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes vc-merge{0%,12%{transform:translateX(0)}35%{transform:translateX(0) rotate(calc((var(--vc-index) - 1.5) * -14deg))}67%{transform:translateX(calc((1.5 - var(--vc-index)) * var(--vc-shift))) scale(.75) rotate(0)}80%,100%{transform:translateX(calc((1.5 - var(--vc-index)) * var(--vc-shift))) scale(0);opacity:0}}
@keyframes vc-drop{0%{opacity:0;transform:translateY(-75px) scale(.12)}10%{opacity:1}35%{transform:translateY(-65px) scale(.45)}68%{transform:translateY(6px) scale(1.08,.82)}84%{transform:translateY(-12px) scale(.92,1.06)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes vc-orb-settle{from{transform:scale(1.08,.9)}to{transform:scale(1)}}
@keyframes vc-spark{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(var(--vc-spark-x),var(--vc-spark-y))}}
`;
