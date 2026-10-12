"use client";

import { ComponentStyles } from "./component-styles";

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
      className="pointer-events-none absolute inset-0 -z-1 h-full w-full"
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
      {/* Frosted surface with clipped corners; its green glow fades in on success. */}
      <div className="absolute inset-0 rounded-[27px] bg-[linear-gradient(120deg,rgba(105,102,110,0.32),rgba(28,26,31,0.48)_51%,rgba(21,18,25,0.57))] backdrop-blur-[10px] [clip-path:polygon(20.5%_0,100%_0,100%_79.5%,81%_100%,0_100%,0_22%)] after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_50%_45%,rgba(32,151,77,0.23),rgba(15,90,46,0.07))] after:opacity-0 after:[transition:opacity_0.7s] after:content-[''] group-data-[status=success]/otp:after:opacity-100" />
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
        className="absolute top-[-4px] left-[-4px] h-auto w-[15%] drop-shadow-[0_3px_8px_#0003]"
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
        className="absolute right-[-4px] bottom-[-4px] h-auto w-[15%] rotate-180 drop-shadow-[0_3px_8px_#0003]"
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

/*
 * Shared Tailwind classes for the live component and its gallery thumbnail.
 * Compact sizes are applied only to the live stage, through the `glass-otp`
 * container queries (`@max-[…]/glass-otp:`).
 */
const ROOT_CLASS =
  "glass-otp relative isolate overflow-hidden bg-[#070609] font-[Arial,Helvetica,sans-serif] text-[#f8f7fa] @container/glass-otp [--otp-accent:#e5c43c] [--otp-spacing:73px]";
const CONTENT_CLASS =
  "relative flex h-full flex-col items-center px-[28px] py-[30px]";
const KEY_CLASS =
  "mx-auto mb-[10px] flex size-[45px] shrink-0 items-center justify-center rounded-[15px] border border-[#b8993b48] bg-[#b99b2910] text-(--otp-accent) shadow-[0_0_24px_#b99b290d,inset_0_0_0_1px_#ffed7b05] [transition:all_0.5s] group-data-[status=success]/otp:border-[#44c8754d] group-data-[status=success]/otp:bg-[#22ae6215] group-data-[status=success]/otp:shadow-[0_0_25px_#25cb5b17]";
const TITLE_CLASS =
  "text-[26px] leading-[1.35] font-semibold tracking-[-0.55px] text-[#f5f4f7]";
const ACCENT_CLASS = "text-(--otp-accent) [transition:color_0.5s]";
const DESCRIPTION_CLASS =
  "mt-[5px] text-[12px] leading-[1.6] font-normal text-[#b5afb6]";
/** `otp-digit` keeps its slot/orbit transform in the scoped CSS below. */
const DIGIT_CLASS =
  "otp-digit absolute top-1/2 left-1/2 size-[58px] rounded-[16px] border-[1.5px] bg-[#15121ae0]";
// Plain box-shadow lists (not shadow-*) keep the orbit transition identical.
const DIGIT_SHADOW_CLASS = "[box-shadow:inset_0_0_0_1px_#ffffff02,0_3px_8px_#0001]";
const DIGIT_FOCUS_CLASS =
  "border-[#ebcd53] [box-shadow:0_0_0_1px_#e5c43c18,0_0_24px_#e5c43c24]";
const DIGIT_TEXT_CLASS =
  "flex size-full items-center justify-center rounded-[inherit] text-center text-[27px] font-semibold text-white caret-[#e5c43c] [-webkit-text-fill-color:#fff]";
const RESEND_CLASS =
  "mb-[45px] text-[12px] leading-[1.5] whitespace-nowrap text-[#a9a3ac]";
const SUBMIT_CLASS =
  "flex min-h-[44px] w-[252px] max-w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-[#dbbf4440] bg-[linear-gradient(180deg,#c7b136,#b09823)] px-[18px] py-[10px] text-[14px] leading-[22px] font-semibold text-[#161308] shadow-[inset_0_1px_0_#fff2,0_5px_18px_#0001] [transition:filter_0.2s,transform_0.2s,background_0.5s,box-shadow_0.5s]";

/** A static, non-focusable illustration for component gallery cards. */
export function GlassOtpThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  return (
    <div
      className={`${ROOT_CLASS} flex min-h-[300px] w-full h-full items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <GlassOtpStyles />
      <GlassOtpBackdrop />
      <div className="h-[484px] w-[520px] shrink-0 scale-[0.69] @max-[400.02px]/glass-otp:scale-[0.57] @max-[260.02px]/glass-otp:scale-[0.46]">
        <div className="relative h-[484px] w-[520px] max-w-[520px] text-center">
          <GlassFrame />
          <div className={CONTENT_CLASS}>
            <div className={KEY_CLASS}>
              <Icon name="key" className="size-[22px]" />
            </div>
            <p className={TITLE_CLASS}>
              Verify <span className={ACCENT_CLASS}>OTP</span>
            </p>
            <p className={DESCRIPTION_CLASS}>
              Enter the 4-digit security code sent to your device
            </p>
            <div className="relative min-h-[167px] w-full min-w-0 flex-1">
              {["5", "6", "2", "9"].map((digit, index) => index < (previewStep + 2) % 5 ? digit : "").map((digit, index) => (
                <div
                  key={index}
                  style={digitStyle(index)}
                  className={`${DIGIT_CLASS} ${index === (previewStep + 2) % 5 ? DIGIT_FOCUS_CLASS : `${DIGIT_SHADOW_CLASS} ${digit ? "border-[#a68b367e]" : "border-[#66606b65]"}`}`}
                >
                  <span className={DIGIT_TEXT_CLASS}>
                    {digit}
                    {index === (previewStep + 2) % 5 && <span className="h-[29px] w-[1.5px] bg-[#e5c43c]" />}
                  </span>
                </div>
              ))}
            </div>
            <p className={RESEND_CLASS}>
              Didn’t receive the code? <span className="font-medium text-[#e3c641]">Resend in 00:38</span>
            </p>
            <span className={SUBMIT_CLASS}>
              Verify &amp; Proceed <Icon name="arrow" className="size-[18px]" />
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
      className={`${ROOT_CLASS} flex min-h-[590px] w-full items-center justify-center px-[clamp(16px,5%,38px)] py-[52px] max-[600.02px]:min-h-[534px] max-[600.02px]:py-[42px] ${className}`}
    >
      <GlassOtpStyles />
      <GlassOtpBackdrop />
      <form
        onSubmit={verify}
        noValidate
        className="group/otp relative h-[484px] w-full max-w-[520px] text-center data-[status=success]:[--otp-accent:#39c773] @max-[520.02px]/glass-otp:h-[450px] @max-[400.02px]/glass-otp:[--otp-spacing:61px] @max-[260.02px]/glass-otp:[--otp-spacing:45px]"
        data-status={status}
        aria-labelledby={`${id}-title`}
        aria-busy={status === "verifying"}
      >
        <GlassFrame />
        <div
          className={`${CONTENT_CLASS} @max-[520.02px]/glass-otp:px-[16px] @max-[520.02px]/glass-otp:py-[27px] @max-[260.02px]/glass-otp:px-[12px]`}
        >
          <div className={KEY_CLASS}>
            <Icon name={isSuccess ? "shield" : "key"} className="size-[22px]" />
          </div>
          <h2
            id={`${id}-title`}
            className={`${TITLE_CLASS} @max-[520.02px]/glass-otp:text-[23px] @max-[400.02px]/glass-otp:text-[21px] @max-[260.02px]/glass-otp:text-[19px]`}
          >
            {isSuccess ? (
              <>
                Verified <span className={ACCENT_CLASS}>Successfully</span>
              </>
            ) : (
              <>
                Verify <span className={ACCENT_CLASS}>OTP</span>
              </>
            )}
          </h2>
          <p
            id={`${id}-description`}
            className={`${DESCRIPTION_CLASS} @max-[520.02px]/glass-otp:max-w-[265px] @max-[520.02px]/glass-otp:text-[11px] @max-[400.02px]/glass-otp:max-w-[230px]`}
          >
            {isSuccess
              ? "Your security verification code has been confirmed."
              : "Enter the 4-digit security code sent to your device"}
          </p>

          <fieldset
            className="relative min-h-[150px] w-full min-w-0 flex-1"
            disabled={locked}
            aria-describedby={`${id}-description${error ? ` ${id}-error` : ""}`}
          >
            <legend className="sr-only">Four-digit security code</legend>
            <div className="absolute inset-0 group-data-[status=verifying]/otp:animate-[otp-spin_1.8s_0.5s_linear_infinite]">
              {digits.map((digit, index) => (
                <div
                  className={`${DIGIT_CLASS} ${DIGIT_SHADOW_CLASS} ${digit ? "border-[#a68b367e]" : "border-[#66606b65]"} focus-within:border-[#ebcd53] focus-within:[box-shadow:0_0_0_1px_#e5c43c18,0_0_24px_#e5c43c24] @max-[400.02px]/glass-otp:h-[54px] @max-[400.02px]/glass-otp:w-[50px] @max-[400.02px]/glass-otp:rounded-[14px] @max-[260.02px]/glass-otp:h-[46px] @max-[260.02px]/glass-otp:w-[38px] @max-[260.02px]/glass-otp:rounded-[11px]`}
                  style={digitStyle(index)}
                  key={index}
                >
                  <input
                    ref={(node) => {
                      inputs.current[index] = node;
                    }}
                    className={`${DIGIT_TEXT_CLASS} group-data-[status=verifying]/otp:animate-[otp-counter-spin_1.8s_0.5s_linear_infinite] @max-[260.02px]/glass-otp:text-[22px]`}
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
              <div className="absolute top-1/2 left-1/2 flex size-[58px] animate-[otp-confirm_0.55s_cubic-bezier(0.2,0.8,0.2,1.2)_both] items-center justify-center rounded-[16px] border-[3px] border-[#39bc73] bg-[#17151b] shadow-[0_0_0_1px_#bfa83475,0_0_24px_#27c87924] [transform:translate(-50%,-50%)]">
                <Icon name="check" className="size-[30px]" />
              </div>
            )}
          </fieldset>

          <div
            className="mt-[-8px] min-h-[17px] text-[11px] leading-[17px] text-[#ffb8ae]"
            id={`${id}-error`}
            role="alert"
          >
            {error}
          </div>
          <p
            className={`${RESEND_CLASS} @max-[520.02px]/glass-otp:mb-[34px] @max-[520.02px]/glass-otp:text-[11px] @max-[400.02px]/glass-otp:text-[10px] @max-[260.02px]/glass-otp:whitespace-normal`}
          >
            Didn’t receive the code?{" "}
            <button
              type="button"
              className="cursor-pointer pl-[3px] font-medium text-[#e3c641] enabled:hover:text-[#fbe681] enabled:hover:underline enabled:hover:underline-offset-4 disabled:cursor-default"
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
            className={`${SUBMIT_CLASS} enabled:hover:brightness-[1.13] enabled:hover:[transform:translateY(-1px)] enabled:active:[transform:translateY(0)] disabled:cursor-default group-data-[status=success]/otp:border-[#35d69770] group-data-[status=success]/otp:bg-[linear-gradient(180deg,#24cb91,#0faf7d)] group-data-[status=success]/otp:text-[#e7fff3] group-data-[status=success]/otp:shadow-[0_0_30px_#16c98430,inset_0_1px_0_#ffffff25] @max-[260.02px]/glass-otp:px-[10px] @max-[260.02px]/glass-otp:text-[12px] @max-[260.02px]/glass-otp:whitespace-nowrap`}
            type="submit"
            disabled={locked}
          >
            {isSuccess ? (
              <>
                <Icon name="shield" className="size-[18px]" /> Verified &amp; Secured
              </>
            ) : status === "verifying" ? (
              <>
                <span
                  className="size-4 animate-[otp-spin_0.75s_linear_infinite] rounded-[50%] border-[1.5px] border-[#17140735] border-t-[#171407]"
                  aria-hidden="true"
                /> Verifying
                Code…
              </>
            ) : (
              <>
                Verify &amp; Proceed <Icon name="arrow" className="size-[18px]" />
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

/**
 * Styling lives in Tailwind classes on the markup. This scoped CSS keeps only
 * what utilities can't express cleanly: the digit transforms composed from
 * custom properties (and their orbit/success states), rules that must outrank
 * the site's global unlayered :focus-visible and ::selection styles, keyframes,
 * and the blanket reduced-motion override.
 */
function GlassOtpStyles() {
  return (
    <ComponentStyles css={`
      .glass-otp .otp-digit {
        transform: translate(-50%, -50%)
          translateX(calc((var(--otp-slot) - 1.5) * var(--otp-spacing)));
        transition:
          transform 0.6s cubic-bezier(0.3, 0.8, 0.2, 1),
          border-color 0.25s,
          box-shadow 0.25s,
          opacity 0.4s;
      }
      .glass-otp [data-status="verifying"] .otp-digit {
        transform: translate(-50%, -50%)
          translate(var(--otp-orbit-x), var(--otp-orbit-y)) rotate(45deg);
        border-color: #bfa33c9c;
        box-shadow:
          0 2px 0 #b7652e90,
          0 0 18px #b3921f0d;
      }
      .glass-otp [data-status="success"] .otp-digit {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.7);
      }
      .glass-otp .otp-digit input {
        outline: 0;
      }
      .glass-otp .otp-digit input::selection {
        color: #fff;
        background: #a18d364f;
      }
      .glass-otp button:focus-visible {
        outline: 2px solid #f6e5a1;
        outline-offset: 5px;
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
      @media (prefers-reduced-motion: reduce) {
        .glass-otp *,
        .glass-otp *::before,
        .glass-otp *::after {
          animation: none !important;
          transition: none !important;
        }
      }
    `} />
  );
}
