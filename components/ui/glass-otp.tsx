"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";

export interface GlassOtpProps {
  /** Return true only after your server has accepted the code. Without this, demo mode accepts any four digits. */
  onVerify?: (code: string) => boolean | Promise<boolean>;
  onResend?: () => void | Promise<void>;
  resendSeconds?: number;
  className?: string;
}

type VerificationState = "idle" | "verifying" | "success" | "error";
type IconName = "key" | "shield" | "check" | "arrow";
const EMPTY_CODE = ["", "", "", ""];

function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "key" && (
        <>
          <path d="M15.5 3a5.5 5.5 0 0 0-5.2 7.3L3 17.6V21h3.4v-3.2h3.2v-3.1l1.9-1.9A5.5 5.5 0 1 0 15.5 3Z" />
          <path d="M16.8 7.2h.01" strokeWidth="3" />
        </>
      )}
      {name === "shield" && (
        <>
          <path d="M12 3c2.1 1.9 4.4 2.9 8 3v6c0 4.5-3.5 7.7-8 9-4.5-1.3-8-4.5-8-9V6c3.6-.1 5.9-1.1 8-3Z" />
          <path d="m8.5 11.8 2.3 2.3 4.7-4.7" />
        </>
      )}
      {name === "check" && <path d="m5 12 4.5 4.5L19 7" strokeWidth="3" />}
      {name === "arrow" && (
        <>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </>
      )}
    </svg>
  );
}

/** The artwork is inline SVG, so the copied component needs no image assets. */
export function GlassOtpBackdrop() {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className="otp-backdrop absolute inset-0 h-full w-full"
      viewBox="0 0 900 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#110d08" />
          <stop offset=".22" stopColor="#3c2813" />
          <stop offset=".42" stopColor="#bb8944" />
          <stop offset=".48" stopColor="#e1bf76" />
          <stop offset=".53" stopColor="#72502a" />
          <stop offset=".66" stopColor="#24170c" />
          <stop offset="1" stopColor="#080709" />
        </linearGradient>
        <linearGradient id={`${id}-silver`} x1="0" y1="0" x2=".8" y2="1">
          <stop offset="0" stopColor="#030305" />
          <stop offset=".34" stopColor="#18181c" />
          <stop offset=".46" stopColor="#75757c" />
          <stop offset=".5" stopColor="#babac0" />
          <stop offset=".55" stopColor="#3b3b43" />
          <stop offset=".68" stopColor="#101014" />
          <stop offset="1" stopColor="#030305" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e4c387" />
          <stop offset=".25" stopColor="#654525" />
          <stop offset=".7" stopColor="#e7c38c" />
          <stop offset="1" stopColor="#3d2716" />
        </linearGradient>
        <radialGradient id={`${id}-shade`}>
          <stop offset=".15" stopColor="#050407" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".45" />
        </radialGradient>
      </defs>
      <rect width="900" height="700" fill="#070609" />
      <g fill="none">
        <path
          d="M180-230C333 70 605 109 1020 119"
          stroke={`url(#${id}-silver)`}
          strokeWidth="115"
        />
        <path
          d="M195-216C345 66 620 136 1030 133"
          stroke="#d1c4a4"
          strokeOpacity=".35"
          strokeWidth="2"
        />
        <path
          d="M115-123C405 150 520 143 1025 175"
          stroke="#080709"
          strokeWidth="12"
        />
        <path
          d="M91-129C331 117 622 213 1020 216"
          stroke={`url(#${id}-edge)`}
          strokeOpacity=".48"
          strokeWidth="2"
        />
        <path
          d="M-190-221C92 93 337 257 993 370"
          stroke={`url(#${id}-gold)`}
          strokeWidth="116"
        />
        <path
          d="M-172-230C108 94 352 252 988 360"
          stroke="#efce88"
          strokeOpacity=".48"
          strokeWidth="3"
        />
        <path
          d="M-191-184C92 132 333 300 1001 405"
          stroke="#000"
          strokeWidth="9"
        />
        <path
          d="M-186-175C69 135 330 303 1001 413"
          stroke={`url(#${id}-edge)`}
          strokeOpacity=".8"
          strokeWidth="2.5"
        />
        <path
          d="M-169 38C141 321 319 552 1001 759"
          stroke={`url(#${id}-gold)`}
          strokeWidth="43"
        />
        <path
          d="M-166 29C141 317 324 551 1001 750"
          stroke={`url(#${id}-edge)`}
          strokeWidth="3"
        />
        <path
          d="M-171 53C127 329 321 567 987 772"
          stroke="#050406"
          strokeWidth="9"
        />
        <path
          d="M-151 268C52 431 172 623 351 854"
          stroke={`url(#${id}-silver)`}
          strokeWidth="132"
        />
        <path
          d="M-151 216C90 443 202 604 415 830"
          stroke="#92929a"
          strokeOpacity=".42"
          strokeWidth="3"
        />
        <path
          d="M-164 225C76 450 188 614 409 843"
          stroke="#050507"
          strokeWidth="17"
        />
        <path
          d="M-159 350C31 491 122 656 268 797"
          stroke="#050507"
          strokeWidth="22"
        />
      </g>
      <rect width="900" height="700" fill={`url(#${id}-shade)`} />
    </svg>
  );
}

function GlassFrame() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="otp-cut-surface absolute inset-0" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 610 565"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M126 1H579Q609 1 609 32V440Q609 451 601 459L508 554Q498 564 484 564H31Q1 564 1 534V129Q1 119 10 110L110 11Q120 1 126 1Z"
          stroke="rgba(220,211,190,.34)"
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <svg
        className="otp-corner otp-corner-start"
        viewBox="0 0 90 90"
        fill="none"
      >
        <path
          d="M1 79V26Q1 1 26 1H78Q92 1 82 12L12 82Q1 93 1 79Z"
          fill="rgba(181,171,163,.09)"
          stroke="rgba(226,213,187,.48)"
          strokeWidth="1.1"
        />
      </svg>
      <svg
        className="otp-corner otp-corner-end"
        viewBox="0 0 90 90"
        fill="none"
      >
        <path
          d="M1 79V26Q1 1 26 1H78Q92 1 82 12L12 82Q1 93 1 79Z"
          fill="rgba(181,171,163,.09)"
          stroke="rgba(226,213,187,.48)"
          strokeWidth="1.1"
        />
      </svg>
    </div>
  );
}

function digitStyle(index: number): CSSProperties {
  return {
    "--otp-slot": index,
    "--otp-orbit-x": `${[-42, 42, 42, -42][index]}px`,
    "--otp-orbit-y": `${[-42, -42, 42, 42][index]}px`,
  } as CSSProperties;
}

/** A static, non-focusable illustration for component gallery cards. */
export function GlassOtpThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  return (
    <div
      className={`glass-otp otp-thumbnail relative isolate overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <GlassOtpStyles />
      <GlassOtpBackdrop />
      <div className="otp-thumbnail-scale">
        <div className="otp-panel relative text-center">
          <GlassFrame />
          <div className="otp-panel-content relative flex h-full flex-col items-center">
            <div className="otp-key flex items-center justify-center">
              <Icon name="key" />
            </div>
            <p className="otp-title">
              Verify <span>OTP</span>
            </p>
            <p className="otp-description">
              Enter the 4-digit security code sent to your device
            </p>
            <div className="otp-code-track relative w-full flex-1">
              {["5", "6", "2", "9"].map((digit, index) => index < (previewStep + 2) % 5 ? digit : "").map((digit, index) => (
                <div
                  key={index}
                  style={digitStyle(index)}
                  className={`otp-digit ${digit ? "is-filled" : ""} ${index === (previewStep + 2) % 5 ? "is-focused" : ""}`}
                >
                  <span className="otp-static-digit">
                    {digit}
                    {index === (previewStep + 2) % 5 && <span className="otp-static-caret" />}
                  </span>
                </div>
              ))}
            </div>
            <p className="otp-resend">
              Didn’t receive the code? <span>Resend in 00:38</span>
            </p>
            <span className="otp-submit flex items-center justify-center gap-2">
              Verify &amp; Proceed <Icon name="arrow" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GlassOtp({
  onVerify,
  onResend,
  resendSeconds = 45,
  className = "",
}: GlassOtpProps) {
  const id = useId();
  const cooldown = Number.isFinite(resendSeconds)
    ? Math.max(0, Math.floor(resendSeconds))
    : 45;
  const [digits, setDigits] = useState<string[]>(EMPTY_CODE);
  const [status, setStatus] = useState<VerificationState>("idle");
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(cooldown);
  const [resendCount, setResendCount] = useState(0);
  const [resending, setResending] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const mounted = useRef(false);
  const busy = useRef(false);
  const resendBusy = useRef(false);
  const deadline = useRef(0);
  const attempt = useRef(0);
  const timers = useRef(new Map<number, () => void>());
  const pendingFocus = useRef<number | null>(null);
  const locked = status === "verifying" || status === "success" || resending;
  const isSuccess = status === "success";

  useEffect(() => {
    mounted.current = true;
    const pendingTimers = timers.current;
    return () => {
      mounted.current = false;
      attempt.current += 1;
      pendingTimers.forEach((resolve, timer) => {
        window.clearTimeout(timer);
        resolve();
      });
      pendingTimers.clear();
    };
  }, []);

  useEffect(() => {
    deadline.current = Date.now() + cooldown * 1000;
    const timer = window.setInterval(() => {
      setSecondsLeft(
        Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)),
      );
    }, 250);
    return () => window.clearInterval(timer);
  }, [cooldown, resendCount]);

  useEffect(() => {
    // Wait for React to re-enable the fields before restoring keyboard focus.
    if (!locked && pendingFocus.current !== null) {
      inputs.current[pendingFocus.current]?.focus();
      pendingFocus.current = null;
    }
  }, [locked, status, digits]);

  function focusDigit(index: number) {
    inputs.current[Math.max(0, Math.min(3, index))]?.focus();
  }

  function focusAfterRender(index: number) {
    pendingFocus.current = Math.max(0, Math.min(3, index));
  }

  function updateDigits(value: string, index: number) {
    if (locked) return;
    const numbers = value.replace(/\D/g, "").slice(0, 4);
    if (value && !numbers) return;
    const next = [...digits];
    const start = numbers.length === 4 ? 0 : index;
    if (!numbers) next[index] = "";
    else
      numbers.split("").forEach((digit, offset) => {
        if (start + offset < 4) next[start + offset] = digit;
      });
    setDigits(next);
    setError("");
    setStatus("idle");
    setAnnouncement("");
    if (numbers) focusDigit(Math.min(start + numbers.length, 3));
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>, index: number) {
    event.preventDefault();
    updateDigits(event.clipboardData.getData("text"), index);
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      focusDigit(index + (event.key === "ArrowLeft" ? -1 : 1));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      focusDigit(event.key === "Home" ? 0 : 3);
    } else if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      setError("");
      setStatus("idle");
      focusDigit(index - 1);
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || resendBusy.current || isSuccess) return;
    if (digits.some((digit) => !digit)) {
      setError("Please enter all four digits to continue.");
      setStatus("error");
      focusDigit(digits.findIndex((digit) => !digit));
      return;
    }

    busy.current = true;
    const currentAttempt = ++attempt.current;
    setStatus("verifying");
    setError("");
    setAnnouncement("Verifying your security code.");
    // Run the request and visual transition together. Always verify real codes on your server.
    const verification = Promise.resolve()
      .then(() => (onVerify ? onVerify(digits.join("")) : true))
      .catch(() => false);
    const animation = new Promise<void>((resolve) => {
      const timer = window.setTimeout(
        () => {
          timers.current.delete(timer);
          resolve();
        },
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 250
          : 2300,
      );
      timers.current.set(timer, resolve);
    });
    const [accepted] = await Promise.all([verification, animation]);
    if (!mounted.current || currentAttempt !== attempt.current) return;
    busy.current = false;
    if (accepted === true) {
      setStatus("success");
      setAnnouncement(
        "Verified successfully. Your security code has been confirmed.",
      );
    } else {
      setStatus("error");
      setError("We couldn’t verify that code. Please try again.");
      setAnnouncement("");
      focusAfterRender(0);
    }
  }

  async function resend() {
    if (secondsLeft > 0 || busy.current || resendBusy.current || isSuccess)
      return;
    resendBusy.current = true;
    setResending(true);
    setError("");
    try {
      await onResend?.();
      if (!mounted.current) return;
      setDigits([...EMPTY_CODE]);
      setStatus("idle");
      setResendCount((count) => count + 1);
      setSecondsLeft(cooldown);
      setAnnouncement("A new code was requested. Please check your device.");
      focusAfterRender(0);
    } catch {
      if (!mounted.current) return;
      setError("The code couldn’t be resent. Please try again.");
    } finally {
      resendBusy.current = false;
      if (mounted.current) setResending(false);
    }
  }

  return (
    <div
      className={`glass-otp otp-stage relative isolate flex w-full items-center justify-center overflow-hidden ${className}`}
    >
      <GlassOtpStyles />
      <GlassOtpBackdrop />
      <form
        onSubmit={verify}
        noValidate
        className="otp-panel relative w-full text-center"
        data-status={status}
        aria-labelledby={`${id}-title`}
        aria-busy={status === "verifying"}
      >
        <GlassFrame />
        <div className="otp-panel-content relative flex h-full flex-col items-center">
          <div className="otp-key flex items-center justify-center">
            <Icon name={isSuccess ? "shield" : "key"} />
          </div>
          <h2 id={`${id}-title`} className="otp-title">
            {isSuccess ? (
              <>
                Verified <span>Successfully</span>
              </>
            ) : (
              <>
                Verify <span>OTP</span>
              </>
            )}
          </h2>
          <p id={`${id}-description`} className="otp-description">
            {isSuccess
              ? "Your security verification code has been confirmed."
              : "Enter the 4-digit security code sent to your device"}
          </p>

          <fieldset
            className="otp-code-track relative w-full flex-1"
            disabled={locked}
            aria-describedby={`${id}-description${error ? ` ${id}-error` : ""}`}
          >
            <legend className="sr-only">Four-digit security code</legend>
            <div className="otp-orbit absolute inset-0">
              {digits.map((digit, index) => (
                <div
                  className={`otp-digit ${digit ? "is-filled" : ""}`}
                  style={digitStyle(index)}
                  key={index}
                >
                  <input
                    ref={(node) => {
                      inputs.current[index] = node;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    name={`${id}-digit-${index + 1}`}
                    aria-label={`Digit ${index + 1} of 4`}
                    aria-invalid={status === "error" || undefined}
                    value={digit}
                    onChange={(event) =>
                      updateDigits(event.target.value, index)
                    }
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    onPaste={(event) => handlePaste(event, index)}
                    onFocus={(event) => event.target.select()}
                    spellCheck={false}
                  />
                </div>
              ))}
            </div>
            {isSuccess && (
              <div className="otp-success-check absolute">
                <Icon name="check" />
              </div>
            )}
          </fieldset>

          <div className="otp-feedback" id={`${id}-error`} role="alert">
            {error}
          </div>
          <p className="otp-resend">
            Didn’t receive the code?{" "}
            <button
              type="button"
              onClick={resend}
              disabled={secondsLeft > 0 || locked}
            >
              {resending
                ? "Sending…"
                : secondsLeft > 0
                  ? `Resend in ${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`
                  : "Resend code"}
            </button>
          </p>
          <button
            className="otp-submit flex items-center justify-center gap-2"
            type="submit"
            disabled={locked}
          >
            {isSuccess ? (
              <>
                <Icon name="shield" /> Verified &amp; Secured
              </>
            ) : status === "verifying" ? (
              <>
                <span className="otp-spinner" aria-hidden="true" /> Verifying
                Code…
              </>
            ) : (
              <>
                Verify &amp; Proceed <Icon name="arrow" />
              </>
            )}
          </button>
          <span
            className="sr-only"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {announcement}
          </span>
        </div>
      </form>
    </div>
  );
}

function GlassOtpStyles() {
  return (
    <style>{`
      .glass-otp {
        --otp-accent: #e5c43c;
        --otp-spacing: 73px;
        container: glass-otp / inline-size;
        color: #f8f7fa;
        font-family: Arial, Helvetica, sans-serif;
        background: #070609;
      }
      .glass-otp *,
      .glass-otp *::before,
      .glass-otp *::after {
        box-sizing: border-box;
      }
      .glass-otp.otp-stage {
        min-height: 590px;
        padding: 52px clamp(16px, 5%, 38px);
      }
      .glass-otp .otp-backdrop {
        pointer-events: none;
        z-index: -1;
      }
      .glass-otp .otp-panel {
        width: 100%;
        max-width: 520px;
        height: 484px;
      }
      .glass-otp .otp-cut-surface {
        border-radius: 27px;
        clip-path: polygon(20.5% 0, 100% 0, 100% 79.5%, 81% 100%, 0 100%, 0 22%);
        background: linear-gradient(
          120deg,
          rgba(105, 102, 110, 0.32),
          rgba(28, 26, 31, 0.48) 51%,
          rgba(21, 18, 25, 0.57)
        );
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .glass-otp .otp-cut-surface::after {
        content: "";
        position: absolute;
        inset: 0;
        opacity: 0;
        background: radial-gradient(
          ellipse at 50% 45%,
          rgba(32, 151, 77, 0.23),
          rgba(15, 90, 46, 0.07)
        );
        transition: opacity 0.7s;
      }
      .glass-otp .otp-corner {
        position: absolute;
        width: 15%;
        height: auto;
        filter: drop-shadow(0 3px 8px #0003);
      }
      .glass-otp .otp-corner-start {
        left: -4px;
        top: -4px;
      }
      .glass-otp .otp-corner-end {
        right: -4px;
        bottom: -4px;
        transform: rotate(180deg);
      }
      .glass-otp .otp-panel-content {
        padding: 30px 28px 30px;
      }
      .glass-otp .otp-key {
        width: 45px;
        height: 45px;
        flex-shrink: 0;
        margin: 0 auto 10px;
        border: 1px solid #b8993b48;
        border-radius: 15px;
        color: var(--otp-accent);
        background: #b99b2910;
        box-shadow:
          0 0 24px #b99b290d,
          inset 0 0 0 1px #ffed7b05;
        transition: all 0.5s;
      }
      .glass-otp .otp-key svg {
        width: 22px;
        height: 22px;
      }
      .glass-otp .otp-title {
        margin: 0;
        color: #f5f4f7;
        font-size: 26px;
        font-weight: 600;
        line-height: 1.35;
        letter-spacing: -0.55px;
      }
      .glass-otp .otp-title span {
        color: var(--otp-accent);
        transition: color 0.5s;
      }
      .glass-otp .otp-description {
        margin: 5px 0 0;
        color: #b5afb6;
        font-size: 12px;
        font-weight: 400;
        line-height: 1.6;
      }
      .glass-otp .otp-code-track {
        min-width: 0;
        min-height: 150px;
        margin: 0;
        padding: 0;
        border: 0;
      }
      .glass-otp .otp-digit {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 58px;
        height: 58px;
        border: 1.5px solid #66606b65;
        border-radius: 16px;
        background: #15121ae0;
        transform: translate(-50%, -50%)
          translateX(calc((var(--otp-slot) - 1.5) * var(--otp-spacing)));
        transition:
          transform 0.6s cubic-bezier(0.3, 0.8, 0.2, 1),
          border-color 0.25s,
          box-shadow 0.25s,
          opacity 0.4s;
        box-shadow:
          inset 0 0 0 1px #ffffff02,
          0 3px 8px #0001;
      }
      .glass-otp .otp-digit.is-filled {
        border-color: #a68b367e;
      }
      .glass-otp .otp-digit:focus-within,
      .glass-otp .otp-digit.is-focused {
        border-color: #ebcd53;
        box-shadow:
          0 0 0 1px #e5c43c18,
          0 0 24px #e5c43c24;
      }
      .glass-otp .otp-digit input,
      .glass-otp .otp-static-digit {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: 0;
        outline: 0;
        border-radius: inherit;
        color: #fff;
        background: transparent;
        text-align: center;
        font-family: inherit;
        font-size: 27px;
        font-weight: 600;
        caret-color: #e5c43c;
        opacity: 1;
        -webkit-text-fill-color: #fff;
      }
      .glass-otp .otp-digit input::selection {
        color: #fff;
        background: #a18d364f;
      }
      .glass-otp .otp-feedback {
        min-height: 17px;
        margin-top: -8px;
        font-size: 11px;
        line-height: 17px;
        color: #ffb8ae;
      }
      .glass-otp .otp-resend {
        margin: 0 0 45px;
        color: #a9a3ac;
        font-size: 12px;
        line-height: 1.5;
        white-space: nowrap;
      }
      .glass-otp .otp-resend button,
      .glass-otp .otp-resend span {
        color: #e3c641;
        font-weight: 500;
      }
      .glass-otp .otp-resend button {
        border: 0;
        background: transparent;
        padding: 0 0 0 3px;
        font-family: inherit;
        font-size: inherit;
        cursor: pointer;
      }
      .glass-otp .otp-resend button:disabled {
        cursor: default;
      }
      .glass-otp .otp-resend button:not(:disabled):hover {
        color: #fbe681;
        text-decoration: underline;
        text-underline-offset: 4px;
      }
      .glass-otp .otp-submit {
        width: 252px;
        max-width: 100%;
        min-height: 44px;
        flex-shrink: 0;
        padding: 10px 18px;
        border: 1px solid #dbbf4440;
        border-radius: 12px;
        background: linear-gradient(180deg, #c7b136, #b09823);
        color: #161308;
        box-shadow:
          inset 0 1px 0 #fff2,
          0 5px 18px #0001;
        font-family: inherit;
        font-size: 14px;
        font-weight: 600;
        line-height: 22px;
        cursor: pointer;
        transition:
          filter 0.2s,
          transform 0.2s,
          background 0.5s,
          box-shadow 0.5s;
      }
      .glass-otp .otp-submit svg {
        width: 18px;
        height: 18px;
      }
      .glass-otp .otp-submit:not(:disabled):hover {
        filter: brightness(1.13);
        transform: translateY(-1px);
      }
      .glass-otp .otp-submit:not(:disabled):active {
        transform: translateY(0);
      }
      .glass-otp .otp-submit:disabled {
        cursor: default;
        opacity: 1;
      }
      .glass-otp button:focus-visible {
        outline: 2px solid #f6e5a1;
        outline-offset: 5px;
      }
      .glass-otp .otp-spinner {
        width: 16px;
        height: 16px;
        border: 1.5px solid #17140735;
        border-top-color: #171407;
        border-radius: 50%;
        animation: otp-spin 0.75s linear infinite;
      }
      .glass-otp [data-status="verifying"] .otp-orbit {
        animation: otp-spin 1.8s 0.5s linear infinite;
      }
      .glass-otp [data-status="verifying"] .otp-digit {
        transform: translate(-50%, -50%)
          translate(var(--otp-orbit-x), var(--otp-orbit-y)) rotate(45deg);
        border-color: #bfa33c9c;
        box-shadow:
          0 2px 0 #b7652e90,
          0 0 18px #b3921f0d;
      }
      .glass-otp [data-status="verifying"] .otp-digit input {
        animation: otp-counter-spin 1.8s 0.5s linear infinite;
      }
      .glass-otp [data-status="success"] {
        --otp-accent: #39c773;
      }
      .glass-otp [data-status="success"] .otp-cut-surface::after {
        opacity: 1;
      }
      .glass-otp [data-status="success"] .otp-key {
        border-color: #44c8754d;
        background: #22ae6215;
        box-shadow: 0 0 25px #25cb5b17;
      }
      .glass-otp [data-status="success"] .otp-digit {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.7);
      }
      .glass-otp [data-status="success"] .otp-submit {
        color: #e7fff3;
        border-color: #35d69770;
        background: linear-gradient(180deg, #24cb91, #0faf7d);
        box-shadow:
          0 0 30px #16c98430,
          inset 0 1px 0 #ffffff25;
      }
      .glass-otp .otp-success-check {
        left: 50%;
        top: 50%;
        width: 58px;
        height: 58px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid #39bc73;
        border-radius: 16px;
        background: #17151b;
        box-shadow:
          0 0 0 1px #bfa83475,
          0 0 24px #27c87924;
        transform: translate(-50%, -50%);
        animation: otp-confirm 0.55s cubic-bezier(0.2, 0.8, 0.2, 1.2) both;
      }
      .glass-otp .otp-success-check svg {
        width: 30px;
        height: 30px;
      }
      .glass-otp.otp-thumbnail {
        min-height: 300px;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .glass-otp .otp-thumbnail-scale {
        width: 520px;
        height: 484px;
        flex-shrink: 0;
        transform: scale(0.69);
      }
      .glass-otp .otp-thumbnail-scale .otp-panel {
        width: 520px;
      }
      .glass-otp .otp-thumbnail-scale .otp-code-track {
        min-height: 167px;
      }
      .glass-otp .otp-static-caret {
        height: 29px;
        width: 1.5px;
        background: #e5c43c;
      }
      @keyframes otp-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes otp-counter-spin {
        to {
          transform: rotate(-360deg);
        }
      }
      @keyframes otp-confirm {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.45);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }
      @container glass-otp (max-width: 520px) {
        .glass-otp.otp-stage .otp-panel {
          height: 450px;
        }
        .glass-otp.otp-stage .otp-title {
          font-size: 23px;
        }
        .glass-otp.otp-stage .otp-description {
          max-width: 265px;
          font-size: 11px;
        }
        .glass-otp.otp-stage .otp-panel-content {
          padding: 27px 16px;
        }
        .glass-otp.otp-stage .otp-resend {
          margin-bottom: 34px;
          font-size: 11px;
        }
      }
      @container glass-otp (max-width: 400px) {
        .glass-otp.otp-stage .otp-panel {
          --otp-spacing: 61px;
        }
        .glass-otp.otp-stage .otp-digit {
          width: 50px;
          height: 54px;
          border-radius: 14px;
        }
        .glass-otp.otp-stage .otp-title {
          font-size: 21px;
        }
        .glass-otp.otp-stage .otp-description {
          max-width: 230px;
        }
        .glass-otp.otp-stage .otp-resend {
          font-size: 10px;
        }
        .glass-otp .otp-thumbnail-scale {
          transform: scale(0.57);
        }
      }
      @container glass-otp (max-width: 260px) {
        .glass-otp.otp-stage .otp-panel {
          --otp-spacing: 45px;
        }
        .glass-otp.otp-stage .otp-panel-content {
          padding-inline: 12px;
        }
        .glass-otp.otp-stage .otp-digit {
          width: 38px;
          height: 46px;
          border-radius: 11px;
        }
        .glass-otp.otp-stage .otp-digit input {
          font-size: 22px;
        }
        .glass-otp.otp-stage .otp-title {
          font-size: 19px;
        }
        .glass-otp.otp-stage .otp-resend {
          white-space: normal;
        }
        .glass-otp.otp-stage .otp-submit {
          padding-inline: 10px;
          font-size: 12px;
          white-space: nowrap;
        }
        .glass-otp .otp-thumbnail-scale {
          transform: scale(0.46);
        }
      }
      @media (max-width: 600px) {
        .glass-otp.otp-stage {
          padding-top: 42px;
          padding-bottom: 42px;
          min-height: 534px;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .glass-otp *,
        .glass-otp *::before,
        .glass-otp *::after {
          animation: none !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}
