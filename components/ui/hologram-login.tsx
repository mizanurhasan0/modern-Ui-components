"use client";

import { ComponentStyles } from "./component-styles";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

export interface HologramLoginValues {
  username: string;
  password: string;
}

export interface HologramLoginProps {
  className?: string;
  /** Heading shown at the top of the hologram panel. */
  title?: string;
  /** Resolve after authentication succeeds, or reject to show an error. */
  onSubmit?: (values: HologramLoginValues) => void | Promise<void>;
}

type Field = keyof HologramLoginValues;
type FieldErrors = Partial<Record<Field, string>>;
type Status = "idle" | "pending" | "success";

const EMPTY_VALUES: HologramLoginValues = { username: "", password: "" };
const DEMO_DELAY = 1200;
const FIELDS: { name: Field; label: string; placeholder: string }[] = [
  { name: "username", label: "Username", placeholder: "UserName" },
  { name: "password", label: "Password", placeholder: "PassWord" },
];

/** Light cone and projector puck drawn beneath the floating panel. */
function Projector() {
  return (
    <>
      <div className="hl-rays" aria-hidden="true" />
      <div className="hl-emitter" aria-hidden="true">
        <span className="hl-lens" />
      </div>
    </>
  );
}

/** A floating holographic login panel. Credentials stay in memory unless a callback is supplied. */
export default function HologramLogin({ className = "", title = "Login", onSubmit }: HologramLoginProps) {
  const [values, setValues] = useState<HologramLoginValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState("");
  const [welcomeName, setWelcomeName] = useState("");
  const fields = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});
  const successHeading = useRef<HTMLHeadingElement>(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  const focusAfterChange = useRef(false);
  const id = useId();
  const pending = status === "pending";

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!focusAfterChange.current) return;
    focusAfterChange.current = false;
    if (status === "success") successHeading.current?.focus({ preventScroll: true });
    else if (status === "idle") fields.current.username?.focus({ preventScroll: true });
  }, [status]);

  function updateField(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const clean = { username: values.username.trim(), password: values.password };
    const nextErrors: FieldErrors = {};
    if (!clean.username) nextErrors.username = "Enter your username.";
    if (!clean.password) nextErrors.password = "Enter your password.";

    setErrors(nextErrors);
    const firstError = FIELDS.find(({ name }) => nextErrors[name])?.name;
    if (firstError) {
      fields.current[firstError]?.focus();
      return;
    }

    busy.current = true;
    setStatus("pending");
    setSubmitError("");
    try {
      if (onSubmit) await onSubmit(clean);
      else await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY));

      if (mounted.current) {
        focusAfterChange.current = true;
        setWelcomeName(clean.username);
        setValues(EMPTY_VALUES);
        setStatus("success");
      }
    } catch {
      if (mounted.current) {
        setStatus("idle");
        setSubmitError("Access denied. Check your details and try again.");
      }
    } finally {
      busy.current = false;
    }
  }

  function signOut() {
    focusAfterChange.current = true;
    setErrors({});
    setSubmitError("");
    setWelcomeName("");
    setStatus("idle");
  }

  return (
    <section className={`hl-stage relative flex w-full flex-col items-center overflow-hidden ${className}`} aria-label="Hologram login">
      <ComponentStyles css={HOLOGRAM_LOGIN_CSS} />
      <div className="hl-rig">
        <div className="hl-panel" data-state={status}>
          {status === "success" ? (
            <div className="hl-success">
              <h2 className="hl-title hl-welcome" tabIndex={-1} ref={successHeading}>
                Welcome, <span className="hl-welcome-name">{welcomeName}</span>
              </h2>
              <p className="hl-success-note">
                {onSubmit ? "Hologram link established." : "Demo only — no account was signed in."}
              </p>
              <button className="hl-button hl-button-small" type="button" onClick={signOut}>Sign out</button>
            </div>
          ) : (
            <>
              <h2 className="hl-title" id={`${id}-title`}>{title}</h2>
              <form className="hl-form" onSubmit={submit} noValidate aria-labelledby={`${id}-title`} aria-busy={pending}>
                {FIELDS.map(({ name, label, placeholder }) => {
                  const error = errors[name];
                  return (
                    <div className="hl-field" key={name}>
                      <label className="hl-sr-only" htmlFor={`${id}-${name}`}>{label}</label>
                      <input
                        id={`${id}-${name}`}
                        ref={(element) => { fields.current[name] = element; }}
                        className="hl-input"
                        name={name}
                        type={name === "password" ? "password" : "text"}
                        autoComplete={name === "password" ? "current-password" : "username"}
                        autoCapitalize="none"
                        spellCheck={false}
                        placeholder={placeholder}
                        maxLength={name === "password" ? 128 : 80}
                        value={values[name]}
                        required
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? `${id}-${name}-error` : undefined}
                        disabled={pending}
                        onChange={(event) => updateField(name, event.target.value)}
                      />
                      {error && <p className="hl-field-error" id={`${id}-${name}-error`}>{error}</p>}
                    </div>
                  );
                })}
                <button className="hl-button" type="submit" disabled={pending} aria-busy={pending}>
                  {pending ? "Verifying…" : "Continue"}
                </button>
                {submitError && <p className="hl-submit-error" role="alert">{submitError}</p>}
              </form>
            </>
          )}
        </div>
        <Projector />
      </div>
    </section>
  );
}

/** Inert gallery artwork: empty → username → password + glowing button → welcome. */
export function HologramLoginThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) % 4 : 0;
  const success = step === 3;

  return (
    <div className={`hl-stage hl-thumbnail relative flex h-full w-full flex-col items-center overflow-hidden ${className}`} aria-hidden="true" inert>
      <ComponentStyles css={HOLOGRAM_LOGIN_CSS} />
      <div className="hl-rig">
        <div className="hl-panel" data-state={success ? "success" : "idle"}>
          {success ? (
            <div className="hl-success">
              <span className="hl-title hl-welcome">Welcome, <span className="hl-welcome-name">alex</span></span>
              <span className="hl-success-note">Hologram link established.</span>
              <span className="hl-button hl-button-small">Sign out</span>
            </div>
          ) : (
            <>
              <span className="hl-title">Login</span>
              <div className="hl-form">
                <span className="hl-input hl-input-static" data-filled={step >= 1}>{step >= 1 ? "alex" : "UserName"}</span>
                <span className="hl-input hl-input-static" data-filled={step >= 2}>{step >= 2 ? "••••••••" : "PassWord"}</span>
                <span className="hl-button" data-hover={step === 2}>Continue</span>
              </div>
            </>
          )}
        </div>
        <Projector />
      </div>
    </div>
  );
}

const HOLOGRAM_LOGIN_CSS = `
.hl-stage { box-sizing: border-box; container-type: inline-size; min-width: 0; min-height: 600px; justify-content: flex-end; padding: 48px 0 40px; background: #212121; color: #fff; font-family: Arial, Helvetica, sans-serif; isolation: isolate; }
.hl-stage *, .hl-stage *::before, .hl-stage *::after { box-sizing: border-box; }
.hl-stage .hl-rig { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; width: 100%; }

.hl-stage .hl-panel { position: relative; z-index: 3; display: flex; flex-direction: column; gap: 18px; width: min(276px, calc(100cqw - 32px)); min-height: 303px; padding: 28px; border: 4px solid #fff; border-radius: .5rem; background: rgba(0, 255, 240, .52); box-shadow: 0 0 16px 1px #82e1ff99, inset 0 0 40px 4px #a8f6ffe6; -webkit-backdrop-filter: blur(3.5px); backdrop-filter: blur(3.5px); animation: hl-float 2s ease-in-out infinite; transition: box-shadow .4s, background-color .4s; }
.hl-stage .hl-panel[data-state="success"] { justify-content: center; background: rgba(0, 255, 240, .6); box-shadow: 0 0 30px 4px #82e1ffcc, inset 0 0 44px 6px #c8fffcf0; }
.hl-stage .hl-title { display: block; margin: 0; color: #fff; font-size: 2.3rem; line-height: 42px; font-weight: 600; letter-spacing: 9px; text-align: center; text-shadow: 0 0 16px rgb(243, 243, 243); }
.hl-stage .hl-form { display: flex; flex-direction: column; gap: 18px; margin: 0; }
.hl-stage .hl-field { display: flex; flex-direction: column; gap: 6px; }

.hl-stage .hl-input { display: flex; align-items: center; width: 100%; height: 42px; margin: 0; padding: 1px 8px; border: 2px solid #fff; border-radius: 6px; background: rgba(139, 255, 247, .486); box-shadow: 0 0 1px 3px #9ee5e3, inset 0 4px 4px 0 #181a6040; color: #fff; font: bold 15px/1.2 Arial, Helvetica, sans-serif; letter-spacing: 1.6px; text-shadow: 0 1px 4px rgb(243, 243, 243); transition: background-color .2s, box-shadow .2s; }
.hl-stage .hl-input::placeholder { color: #fff; opacity: 1; font-weight: 300; letter-spacing: .1rem; text-shadow: 0 1px 5px rgb(66, 66, 66); }
.hl-stage .hl-input:hover { background: rgba(139, 189, 255, .59); }
.hl-stage .hl-input:focus-visible { outline: none; background: rgba(139, 189, 255, .59); box-shadow: 0 0 1px 4px #9ee5e3; }
.hl-stage .hl-input[aria-invalid="true"] { border-color: #ffd3e4; box-shadow: 0 0 1px 3px #ff9cc6, inset 0 4px 4px 0 #181a6040; }
.hl-stage .hl-input:disabled { opacity: .7; cursor: wait; }
.hl-stage .hl-input:-webkit-autofill { -webkit-text-fill-color: #fff; -webkit-box-shadow: 0 0 1px 3px #9ee5e3, inset 0 0 0 100px #52c9cf; caret-color: #fff; }
.hl-stage .hl-input-static { font-weight: 300; letter-spacing: .1rem; text-shadow: 0 1px 5px rgb(66, 66, 66); }
.hl-stage .hl-input-static[data-filled="true"] { font-weight: bold; letter-spacing: 1.6px; text-shadow: 0 1px 4px rgb(243, 243, 243); }

.hl-stage .hl-button { display: flex; align-items: center; justify-content: center; width: 100%; height: 60px; margin: 0; padding: 0; border: 2px solid #fff; border-radius: 2px; background: linear-gradient(144deg, #9c11ffce, #2000eeb6 50%, #15efffbb); color: #fff; font: 400 24px/1 Arial, Helvetica, sans-serif; letter-spacing: .37rem; text-align: center; transition: transform .2s, box-shadow .2s, background .2s; }
.hl-stage button.hl-button { cursor: pointer; }
.hl-stage button.hl-button:hover:not(:disabled), .hl-stage .hl-button[data-hover="true"] { transform: translateY(-4px); background: linear-gradient(144deg, #9c11ff, #2000ee 50%, #15eff3); box-shadow: 0 0 2px 2px #fff; }
.hl-stage button.hl-button:focus-visible { outline: 2px solid #fff; outline-offset: 3px; box-shadow: 0 0 2px 2px #fff, 0 0 18px #82e1ff; }
.hl-stage button.hl-button:disabled { cursor: wait; opacity: .85; letter-spacing: .2rem; }
.hl-stage .hl-button-small { height: 48px; font-size: 18px; letter-spacing: .25rem; }

.hl-stage .hl-field-error { margin: 2px 2px 0; color: #ffe1ee; font-size: 12px; line-height: 1.35; font-weight: bold; letter-spacing: .3px; text-shadow: 0 1px 3px #6a0a3c99; }
.hl-stage .hl-submit-error { margin: -4px 0 0; padding: 7px 10px; border: 1px solid #ffd3e4; border-radius: 6px; background: #6a0a3c40; color: #fff; font-size: 12px; line-height: 1.4; text-align: center; }
.hl-stage .hl-success { display: flex; flex-direction: column; gap: 18px; text-align: center; }
.hl-stage .hl-welcome { font-size: 1.6rem; line-height: 1.3; letter-spacing: 4px; overflow-wrap: anywhere; }
.hl-stage .hl-welcome:focus { outline: none; }
.hl-stage .hl-welcome:focus-visible { outline: 2px solid #fff; outline-offset: 4px; border-radius: 4px; }
.hl-stage .hl-welcome-name { display: block; }
.hl-stage .hl-success-note { display: block; margin: 0; color: #fff; font-size: 13px; line-height: 1.5; letter-spacing: .5px; text-shadow: 0 1px 4px rgb(66, 66, 66); }
.hl-stage .hl-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

.hl-stage .hl-rays { position: relative; z-index: 2; width: min(254px, calc(100cqw - 54px)); height: 148px; margin-top: -16px; background: linear-gradient(180deg, #2f4d53 16px, #314f55 28px, #288392 73px, #13bed7 118px, #09d7f8 137px, #00e1ff); clip-path: polygon(0 0, 100% 0, 100% 16px, calc(50% + 22px) 100%, calc(50% - 22px) 100%, 0 16px); animation: hl-rays 2s ease-in-out infinite; }

.hl-stage .hl-emitter { position: relative; z-index: 1; width: 164px; height: 49px; margin-top: -17px; }
.hl-stage .hl-emitter::before { content: ""; position: absolute; inset: 11px 0 0; border-radius: 0 0 50% 50% / 0 0 13px 13px; background: linear-gradient(90deg, #101010, #262626 22%, #303030 50%, #262626 78%, #101010); box-shadow: 0 0 10px #ffffff38, 0 8px 14px #0009; }
.hl-stage .hl-emitter::after { content: ""; position: absolute; inset: 0 0 auto; height: 23px; border: 1px solid #3a3a3a; border-radius: 50%; background: radial-gradient(ellipse at 50% 45%, #070707 30%, #141414 62%, #2c2c2c); box-shadow: inset 0 -2px 4px #000; }
.hl-stage .hl-lens { position: absolute; z-index: 1; left: 50%; top: 6px; width: 65px; height: 11px; border-radius: 50%; transform: translateX(-50%); background: radial-gradient(ellipse at 50% 50%, #12d6ff 0 48%, #0a6aa6 60%, #08436f 74%, #062b48 84%, transparent 88%); box-shadow: 0 0 8px #00c8ff, 0 0 18px #00a8ff70; }

.hl-stage.hl-thumbnail { min-height: 260px; justify-content: center; padding: 0; }
.hl-stage.hl-thumbnail .hl-rig { transform: scale(.5); }
.hl-stage.hl-thumbnail .hl-panel { width: 276px; animation: none; }
.hl-stage.hl-thumbnail .hl-rays { width: 254px; animation: none; }

@keyframes hl-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
@keyframes hl-rays { 0%, 100% { opacity: .6; } 50% { opacity: 1; } }

@container (max-width: 480px) {
  .hl-stage:not(.hl-thumbnail) .hl-rig { padding-bottom: 8px; }
}
@container (max-width: 340px) {
  .hl-stage:not(.hl-thumbnail) .hl-panel { padding: 22px 18px; gap: 16px; }
  .hl-stage:not(.hl-thumbnail) .hl-title { font-size: 1.9rem; letter-spacing: 7px; }
  .hl-stage:not(.hl-thumbnail) .hl-welcome { font-size: 1.35rem; letter-spacing: 3px; }
  .hl-stage:not(.hl-thumbnail) .hl-button { height: 54px; font-size: 21px; letter-spacing: .28rem; }
  .hl-stage:not(.hl-thumbnail) .hl-emitter { width: 148px; }
}
@media (prefers-reduced-motion: reduce) {
  .hl-stage .hl-panel, .hl-stage .hl-rays { animation: none; }
  .hl-stage .hl-rays { opacity: .85; }
  .hl-stage .hl-panel, .hl-stage .hl-input, .hl-stage .hl-button { transition: none; }
  .hl-stage button.hl-button:hover:not(:disabled) { transform: none; }
}
`;
