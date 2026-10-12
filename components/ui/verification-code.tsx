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

function LockArtwork({ verified = false }: { verified?: boolean }) {
  const gradientId = useId().replace(/:/g, "");
  return (
    <span className="vc-emblem" aria-hidden="true">
      {verified ? (
        <svg viewBox="0 0 64 64" className="vc-verified-icon">
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
        <svg viewBox="0 0 64 64" className="vc-lock-icon">
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

function SuccessOrb() {
  return (
    <span className="vc-orb" aria-hidden="true">
      <svg viewBox="0 0 32 32">
        <path
          d="m9 16 5 5 10-11"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <i />
      <i />
      <i />
      <i />
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
      className={`verification-code vc-stage grid w-full place-items-center ${className}`}
      aria-label="Code verification"
    >
      <ComponentStyles css={VERIFICATION_STYLES} />
      <div className="vc-card" data-state={state}>
        <LockArtwork verified={state === "success"} />
        <h2 id={`${id}-title`} className="vc-title">
          Verification Code
        </h2>
        <p id={`${id}-description`} className="vc-description">
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
        <div className="vc-input-area">
          <div
            className="vc-inputs"
            role="group"
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-description`}
            aria-busy={state === "checking" || state === "verifying"}
          >
            {digits.map((digit, index) => (
              <span
                key={index}
                className="vc-tile"
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
                />
              </span>
            ))}
          </div>
          <SuccessOrb />
        </div>
        <div className="vc-footer">
          {state === "success" ? (
            <>
              <span className="vc-secure">
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="4" y="7" width="8" height="7" rx="1.5" />
                  <path d="M6 7V4a2 2 0 0 1 4 0v3" />
                </svg>
                Verified and secure
              </span>
              <button type="button" className="vc-retry" onClick={reset}>
                Try another code
              </button>
            </>
          ) : (
            <p>
              Didn’t receive the code?{" "}
              <button
                type="button"
                onClick={() => void resend()}
                disabled={isBusy || cooldown > 0}
                className="vc-resend"
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
          className="vc-status"
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
    <div className={`verification-code vc-stage vc-thumbnail ${className}`}>
      <ComponentStyles css={VERIFICATION_STYLES} />
      <div className="vc-card" data-state={verified ? "success" : "idle"}>
        <LockArtwork verified={verified} />
        <span className="vc-title">Verification Code</span>
        <p className="vc-description">
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
        <div className="vc-input-area">
          <div className="vc-inputs">
            {["1", "5", "9", "6"].map((digit, index) => (
              <span key={index} className="vc-tile" data-filled={index < count}>
                <span className="vc-static-digit">
                  {index < count ? digit : ""}
                </span>
              </span>
            ))}
          </div>
          <SuccessOrb />
        </div>
        <div className="vc-footer">
          {verified ? (
            <span className="vc-secure">♧ Verified and secure</span>
          ) : (
            <p>
              Didn’t receive the code?{" "}
              <span className="vc-resend">Resend OTP</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const VERIFICATION_STYLES = `
.verification-code{font-family:Arial,Helvetica,sans-serif;color:#121820;container-type:inline-size;box-sizing:border-box}
.verification-code *{box-sizing:border-box}
.verification-code.vc-stage{background:#fafafa;min-height:560px;padding:32px 16px;display:grid;place-items:center}
.verification-code .vc-card{position:relative;width:100%;max-width:416px;min-height:505px;padding:40px 30px 29px;border-radius:18px;background:#fff;box-shadow:0 8px 40px #182c4210;display:flex;align-items:center;flex-direction:column}
.verification-code .vc-emblem{display:grid;place-items:center;width:108px;height:108px;border-radius:28px;background:radial-gradient(ellipse at 40% 35%,#edf7fb,#f7f9fc 72%);box-shadow:0 5px 22px #91b3d016;margin-bottom:24px}
.verification-code .vc-lock-icon{width:68px;height:68px;animation:vc-lock-sway 3s ease-in-out infinite}
.verification-code .vc-verified-icon{width:67px;height:67px;animation:vc-pop .5s cubic-bezier(.2,1.8,.5,1) both}
.verification-code .vc-title{display:block;font-size:23px;font-weight:700;line-height:1.25;letter-spacing:-.9px;margin:0;text-align:center}
.verification-code .vc-description{font-size:13px;color:#878b8e;line-height:1.6;text-align:center;margin:12px 0 0;min-height:42px}
.verification-code .vc-input-area{position:relative;width:100%;height:116px;margin-top:20px;display:grid;place-items:center}
.verification-code .vc-inputs{display:flex;gap:20px;position:relative;align-items:center;justify-content:center;width:100%}
.verification-code .vc-inputs:before{content:'';position:absolute;height:4px;background:#ddebf0;width:78%;top:50%;border-radius:3px;transition:opacity .2s}
.verification-code .vc-tile{position:relative;display:block;width:55px;height:58px;border-radius:12px;background:linear-gradient(155deg,#fff 35%,#f9fcfe);box-shadow:0 0 0 1px #eef2f5,0 6px 3px -5px #308abe80,0 4px 10px #192b4210;transition:background .2s,box-shadow .2s;flex-shrink:0}
.verification-code .vc-tile:after{content:'';position:absolute;inset:2px 5px auto;height:3px;background:#fff9;border-radius:50%;pointer-events:none}
.verification-code .vc-tile input,.verification-code .vc-static-digit{width:100%;height:100%;display:grid;place-items:center;text-align:center;border:0;border-radius:12px;background:transparent;font:700 24px Arial;color:#fff;outline:none;caret-color:#377ca8;padding:0}
.verification-code .vc-tile input:focus-visible{outline:2px solid #83a9bd;outline-offset:2px}
.verification-code .vc-tile[data-filled=true]{background:linear-gradient(150deg,#82d3f9,#509de4 45%,#286bc7);box-shadow:inset 0 1px 2px #fff8,0 4px 9px #2681ce45}
.verification-code .vc-card[data-state=error] .vc-tile{box-shadow:0 0 0 1px #dc7373,0 4px 10px #b2232310}
.verification-code .vc-footer{min-height:48px;margin-top:22px;font-size:12px;color:#81878b;text-align:center}
.verification-code .vc-footer p{margin:0}
.verification-code .vc-resend{border:0;background:none;padding:0;font:600 12px Arial;color:#3578a9;text-decoration:underline;text-underline-offset:2px;cursor:pointer}
.verification-code .vc-resend:disabled{opacity:.5;cursor:default}
.verification-code .vc-status{font-size:11px;text-align:center;color:#be5353;min-height:16px;margin:6px 0 0}
.verification-code .vc-status:empty{display:none}
.verification-code .vc-status:not([data-error=true]){position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
.verification-code .vc-secure{display:flex;align-items:center;justify-content:center;gap:5px;color:#43bfa0;font-size:12px}
.verification-code .vc-secure svg{width:13px;height:13px;stroke:currentColor;stroke-width:1.3;fill:none}
.verification-code .vc-retry{display:block;margin:12px auto 0;background:none;border:0;font:11px Arial;color:#9aa4ab;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.verification-code .vc-orb{position:absolute;left:calc(50% - 29px);top:calc(50% - 29px);width:58px;height:58px;border-radius:40%;background:radial-gradient(circle at 35% 15%,#a0f8d8,#35d5a4 40%,#05a674 70%,#078c62);box-shadow:inset 0 3px 3px #fff9,inset 0 -3px 7px #00644360,0 8px 18px #12ce9360;opacity:0;pointer-events:none}
.verification-code .vc-orb:before{content:'';position:absolute;left:13px;top:6px;width:31px;height:5px;border-radius:50%;background:#ecfff4b0;transform:rotate(-10deg)}
.verification-code .vc-orb svg{width:100%;height:100%;padding:9px}
.verification-code .vc-orb i{position:absolute;width:4px;height:4px;background:#53e9bc;border-radius:50%;left:50%;top:50%;opacity:0}
.verification-code .vc-card[data-state=verifying] .vc-tile{animation:vc-merge 1.2s cubic-bezier(.55,0,.3,1) both;--vc-x:calc((1.5 - var(--vc-index)) * 75px)}
.verification-code .vc-card[data-state=verifying] .vc-inputs:before,.verification-code .vc-card[data-state=success] .vc-inputs:before{opacity:0}
.verification-code .vc-card[data-state=verifying] .vc-orb{animation:vc-drop .85s .65s both}
.verification-code .vc-card[data-state=success] .vc-inputs{opacity:0;visibility:hidden}
.verification-code .vc-card[data-state=success] .vc-orb{opacity:1;animation:vc-orb-settle .45s both}
.verification-code .vc-card[data-state=success] .vc-orb i{animation:vc-spark .65s both}
.verification-code .vc-orb i:nth-of-type(1){--vc-spark-x:-42px;--vc-spark-y:-28px}.verification-code .vc-orb i:nth-of-type(2){--vc-spark-x:43px;--vc-spark-y:-15px}.verification-code .vc-orb i:nth-of-type(3){--vc-spark-x:-32px;--vc-spark-y:33px}.verification-code .vc-orb i:nth-of-type(4){--vc-spark-x:30px;--vc-spark-y:39px}
@keyframes vc-lock-sway{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(5deg)}}
@keyframes vc-pop{from{transform:scale(.5) rotate(-15deg);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes vc-merge{0%,12%{transform:translateX(0)}35%{transform:translateX(0) rotate(calc((var(--vc-index) - 1.5) * -14deg))}67%{transform:translateX(var(--vc-x)) scale(.75) rotate(0)}80%,100%{transform:translateX(var(--vc-x)) scale(0);opacity:0}}
@keyframes vc-drop{0%{opacity:0;transform:translateY(-75px) scale(.12)}10%{opacity:1}35%{transform:translateY(-65px) scale(.45)}68%{transform:translateY(6px) scale(1.08,.82)}84%{transform:translateY(-12px) scale(.92,1.06)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes vc-orb-settle{from{transform:scale(1.08,.9)}to{transform:scale(1)}}
@keyframes vc-spark{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(var(--vc-spark-x),var(--vc-spark-y))}}
.verification-code.vc-thumbnail{min-height:100%;height:100%;padding:20px}
.verification-code.vc-thumbnail .vc-card{width:255px;max-width:100%;min-height:0;height:290px;padding:22px 18px 16px;border-radius:14px}
.verification-code.vc-thumbnail .vc-emblem{width:64px;height:64px;border-radius:18px;margin-bottom:14px}.verification-code.vc-thumbnail .vc-emblem svg{width:44px;height:44px}
.verification-code.vc-thumbnail .vc-title{font-size:15px;letter-spacing:-.5px}.verification-code.vc-thumbnail .vc-description{font-size:8px;line-height:1.6;min-height:26px;margin-top:7px}
.verification-code.vc-thumbnail .vc-input-area{height:70px;margin-top:9px}.verification-code.vc-thumbnail .vc-inputs{gap:11px}.verification-code.vc-thumbnail .vc-tile{width:34px;height:36px;border-radius:7px}.verification-code.vc-thumbnail .vc-static-digit{font-size:15px}
.verification-code.vc-thumbnail .vc-footer{font-size:7px;min-height:16px;margin-top:12px}.verification-code.vc-thumbnail .vc-resend,.verification-code.vc-thumbnail .vc-secure{font-size:7px}.verification-code.vc-thumbnail .vc-orb{width:36px;height:36px;left:calc(50% - 18px);top:calc(50% - 18px)}.verification-code.vc-thumbnail .vc-orb svg{padding:4px}.verification-code.vc-thumbnail .vc-orb:before{left:8px;width:20px;top:4px}
@container(max-width:350px){.verification-code:not(.vc-thumbnail) .vc-card{padding:32px 16px;min-height:475px}.verification-code:not(.vc-thumbnail) .vc-title{font-size:22px}.verification-code:not(.vc-thumbnail) .vc-inputs{gap:12px}.verification-code:not(.vc-thumbnail) .vc-tile{width:48px;height:52px}.verification-code:not(.vc-thumbnail) .vc-card[data-state=verifying] .vc-tile{--vc-x:calc((1.5 - var(--vc-index)) * 60px)}}
@media(prefers-reduced-motion:reduce){.verification-code *, .verification-code *:before{animation:none!important;transition:none!important}.verification-code .vc-card[data-state=verifying] .vc-inputs{opacity:.6}}
`;
