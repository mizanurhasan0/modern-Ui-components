"use client";

import { ComponentStyles } from "./component-styles";

import { useEffect, useId, useRef, useState, type FormEvent, type PointerEvent } from "react";

export interface LampLoginValues {
  username: string;
  password: string;
}

export interface LampLoginProps {
  className?: string;
  /** Start with the lamp switched on and the form visible. */
  defaultOn?: boolean;
  /** Called whenever the pull cord switches the lamp. */
  onToggle?: (on: boolean) => void;
  /** Resolve after authentication succeeds, or reject to show an error. */
  onSubmit?: (values: LampLoginValues) => void | Promise<void>;
}

type Field = keyof LampLoginValues;
type FieldErrors = Partial<Record<Field, string>>;
type Status = "idle" | "pending" | "success";
type CordDrag = { pointerId: number; startY: number; unitsPerPixel: number; pull: number };

const EMPTY_VALUES: LampLoginValues = { username: "", password: "" };
const DEMO_DELAY = 1200;
/** Lamp artwork is drawn on a 280 × 400 grid; cord distances use the same units. */
const LAMP_HEIGHT = 400;
const MAX_PULL = 64;
const PULL_THRESHOLD = 22;
const TUG_PULL = 26;
const TUG_DURATION = 140;
const FIELDS: { name: Field; label: string; placeholder: string }[] = [
  { name: "username", label: "Username", placeholder: "Enter name" },
  { name: "password", label: "Password", placeholder: "Enter Password" },
];

/** Mushroom desk lamp: dome shade, stem, base and a pull cord with a bead. */
function LampArt() {
  return (
    <svg className="ll-lamp-svg" viewBox="0 0 280 400" aria-hidden="true" focusable="false">
      <ellipse className="ll-inner-glow" cx="140" cy="160" rx="88" ry="16" />
      <rect className="ll-lamp-base" x="129" y="150" width="23" height="192" />
      <rect className="ll-lamp-base" x="86" y="336" width="108" height="17" rx="8.5" />
      <line className="ll-cord-line" x1="180.5" y1="152" x2="180.5" y2="248" />
      <circle className="ll-cord-bead" cx="180.5" cy="255" r="8" />
      <path
        className="ll-lamp-shade"
        d="M45 141C45 102 88 84 140 84S235 102 235 141C235 149 233 153 226 154.5Q140 168 54 154.5C47 153 45 149 45 141Z"
      />
    </svg>
  );
}

/**
 * A dark scene with a desk lamp. Pull the cord (drag, click or keyboard) to switch
 * the light on and reveal the login form. Credentials stay in memory unless a callback is supplied.
 */
export default function LampLogin({ className = "", defaultOn = false, onToggle, onSubmit }: LampLoginProps) {
  const [on, setOn] = useState(defaultOn);
  const [values, setValues] = useState<LampLoginValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState("");
  const [welcomeName, setWelcomeName] = useState("");
  const fields = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});
  const successHeading = useRef<HTMLHeadingElement>(null);
  const lamp = useRef<HTMLDivElement>(null);
  const drag = useRef<CordDrag | null>(null);
  const suppressClick = useRef(false);
  const tugTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const busy = useRef(false);
  const mounted = useRef(false);
  const focusAfterChange = useRef(false);
  const id = useId();
  const pending = status === "pending";

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(tugTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!focusAfterChange.current) return;
    focusAfterChange.current = false;
    if (status === "success") successHeading.current?.focus({ preventScroll: true });
    else if (status === "idle") fields.current.username?.focus({ preventScroll: true });
  }, [status]);

  /** Stretch the cord by `units` on the lamp's 400-unit grid; 0 lets it spring back. */
  function setPull(units: number) {
    lamp.current?.style.setProperty("--ll-pull", String(units));
  }

  function toggleLamp() {
    const next = !on;
    setOn(next);
    onToggle?.(next);
  }

  function handleCordPointerDown(event: PointerEvent<HTMLButtonElement>) {
    suppressClick.current = false;
    if (event.button !== 0 || !lamp.current) return;
    const { height } = lamp.current.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, startY: event.clientY, unitsPerPixel: LAMP_HEIGHT / (height || LAMP_HEIGHT), pull: 0 };
    lamp.current.dataset.dragging = "true";
  }

  function handleCordPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    current.pull = Math.min(MAX_PULL, Math.max(0, (event.clientY - current.startY) * current.unitsPerPixel));
    setPull(current.pull);
  }

  function endCordDrag(event: PointerEvent<HTMLButtonElement>, cancelled: boolean) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    if (lamp.current) delete lamp.current.dataset.dragging;
    setPull(0);
    // A real pull switches the lamp here; shorter presses fall through to the click handler.
    if (!cancelled && current.pull >= PULL_THRESHOLD) {
      suppressClick.current = true;
      toggleLamp();
    }
  }

  /** Clicks and Enter/Space give the cord a short tug before switching the lamp. */
  function handleCordClick() {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    clearTimeout(tugTimer.current);
    setPull(TUG_PULL);
    tugTimer.current = setTimeout(() => setPull(0), TUG_DURATION);
    toggleLamp();
  }

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
        setSubmitError("Sign in failed. Check your details and try again.");
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
    <section className={`ll-stage relative w-full overflow-hidden ${className}`} data-on={on} aria-label="Lamp login">
      <ComponentStyles css={LAMP_LOGIN_CSS} />
      <div className="ll-scene">
        <div className="ll-lamp" ref={lamp}>
          <LampArt />
          <button
            className="ll-cord-button"
            type="button"
            aria-pressed={on}
            aria-label="Lamp light"
            onClick={handleCordClick}
            onPointerDown={handleCordPointerDown}
            onPointerMove={handleCordPointerMove}
            onPointerUp={(event) => endCordDrag(event, false)}
            onPointerCancel={(event) => endCordDrag(event, true)}
          />
        </div>

        <div className="ll-panel">
          <p className="ll-hint" aria-hidden={on}>Pull the cord to switch on the light</p>
          <div className="ll-card" data-state={status} inert={!on}>
            {status === "success" ? (
              <div className="ll-success">
                <h2 className="ll-title ll-welcome" tabIndex={-1} ref={successHeading}>
                  Welcome back, <span className="ll-welcome-name">{welcomeName}</span>
                </h2>
                <p className="ll-note">{onSubmit ? "You’re signed in." : "Demo only — no account was signed in."}</p>
                <button className="ll-btn" type="button" onClick={signOut}>Sign out</button>
              </div>
            ) : (
              <>
                <h2 className="ll-title" id={`${id}-title`}>Welcome</h2>
                <form className="ll-form" onSubmit={submit} noValidate aria-labelledby={`${id}-title`} aria-busy={pending}>
                  {FIELDS.map(({ name, label, placeholder }) => {
                    const error = errors[name];
                    return (
                      <div className="ll-field" key={name}>
                        <label className="ll-label" htmlFor={`${id}-${name}`}>{label}</label>
                        <input
                          id={`${id}-${name}`}
                          ref={(element) => { fields.current[name] = element; }}
                          className="ll-input"
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
                        {error && <p className="ll-field-error" id={`${id}-${name}-error`}>{error}</p>}
                      </div>
                    );
                  })}
                  <button className="ll-btn" type="submit" disabled={pending} aria-busy={pending}>
                    {pending ? "Signing in…" : "Sign In"}
                  </button>
                  {submitError && <p className="ll-submit-error" role="alert">{submitError}</p>}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Inert gallery artwork: lamp off → cord tug, light on → typing → hovering Sign In. */
export function LampLoginThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) % 4 : 0;
  const on = step > 0;
  const typing = step >= 2;

  return (
    <div className={`ll-stage ll-thumbnail relative h-full w-full overflow-hidden ${className}`} data-on={on} aria-hidden="true" inert>
      <ComponentStyles css={LAMP_LOGIN_CSS} />
      <div className="ll-scene">
        <div className="ll-lamp" data-tug={step === 1}>
          <LampArt />
        </div>
        <div className="ll-panel">
          <div className="ll-card">
            <span className="ll-title">Welcome</span>
            <div className="ll-form">
              <div className="ll-field">
                <span className="ll-label">Username</span>
                <span className="ll-input ll-input-static" data-filled={typing}>{typing ? "alex" : "Enter name"}</span>
              </div>
              <div className="ll-field">
                <span className="ll-label">Password</span>
                <span className="ll-input ll-input-static" data-filled={typing} data-focus={step === 2}>
                  {typing ? "••••••••" : "Enter Password"}
                </span>
              </div>
              <span className="ll-btn" data-hover={step === 3}>Sign In</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const LAMP_LOGIN_CSS = `
.ll-stage {
  --bg-color: #121417;
  --lamp-shade: #f5f0e6;
  --lamp-base: #d1ccc2;
  --glow-color: rgba(255, 214, 110, .3);
  --accent-color: #d4a373;
  --error-color: #f28b82;
  --on: 0;
  --transition: .5s cubic-bezier(.4, 0, .2, 1);
  box-sizing: border-box; container-type: inline-size; display: flex; align-items: center; justify-content: center;
  min-width: 0; min-height: 600px; padding: 40px 16px; background: var(--bg-color); color: #fff;
  font-family: "Inter", system-ui, -apple-system, sans-serif; isolation: isolate;
}
.ll-stage[data-on="true"] { --on: 1; }
.ll-stage *, .ll-stage *::before, .ll-stage *::after { box-sizing: border-box; }
.ll-stage::before { content: ""; position: absolute; inset: 0; z-index: -1; background: radial-gradient(circle at 50% 40%, var(--glow-color), transparent 70%); opacity: var(--on); transition: opacity var(--transition); pointer-events: none; }
.ll-stage .ll-scene { display: flex; align-items: center; justify-content: center; gap: clamp(28px, 6cqw, 56px); width: 100%; }

/* Lamp */
.ll-stage .ll-lamp { --ll-pull: 0; position: relative; flex: none; width: 280px; height: 400px; -webkit-user-select: none; user-select: none; }
.ll-stage .ll-lamp-svg { display: block; width: 100%; height: 100%; overflow: visible; }
.ll-stage .ll-lamp-shade { fill: var(--lamp-shade); filter: drop-shadow(0 0 30px rgba(255, 255, 200, 0)); transition: fill var(--transition), filter var(--transition); }
.ll-stage[data-on="true"] .ll-lamp-shade { fill: #fff; filter: drop-shadow(0 0 30px rgba(255, 255, 200, .4)); }
.ll-stage .ll-lamp-base { fill: var(--lamp-base); }
.ll-stage .ll-inner-glow { fill: #ffdb8a; opacity: 0; filter: blur(15px); transition: opacity var(--transition); }
.ll-stage[data-on="true"] .ll-inner-glow { opacity: .6; }
.ll-stage .ll-cord-line { stroke: #555; stroke-width: 2; transform-box: fill-box; transform-origin: 50% 0; transform: scaleY(calc(1 + var(--ll-pull) / 96)); }
.ll-stage .ll-cord-bead { fill: var(--accent-color); transform: translateY(calc(var(--ll-pull) * 1px)); }
.ll-stage .ll-cord-line, .ll-stage .ll-cord-bead { transition: transform .55s cubic-bezier(.34, 1.56, .64, 1); }
.ll-stage .ll-lamp[data-dragging] .ll-cord-line, .ll-stage .ll-lamp[data-dragging] .ll-cord-bead { transition: none; }
.ll-stage .ll-lamp[data-tug="true"] .ll-cord-line { animation: ll-tug-line .7s ease-out; }
.ll-stage .ll-lamp[data-tug="true"] .ll-cord-bead { animation: ll-tug-bead .7s ease-out; }
.ll-stage .ll-cord-button { position: absolute; left: 64.5%; top: 37.5%; width: max(15.7%, 44px); height: 35%; transform: translateX(-50%); margin: 0; padding: 0; border: 0; border-radius: 22px; background: transparent; cursor: grab; touch-action: none; -webkit-tap-highlight-color: transparent; }
.ll-stage .ll-lamp[data-dragging] .ll-cord-button { cursor: grabbing; }
.ll-stage .ll-cord-button:focus-visible { outline: 2px solid var(--accent-color); outline-offset: 2px; }

/* Login card */
.ll-stage .ll-panel { position: relative; flex: none; width: 340px; max-width: 100%; }
.ll-stage .ll-hint { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; margin: 0; padding: 0 24px; color: #6b7078; font-size: .9rem; line-height: 1.5; text-align: center; -webkit-user-select: none; user-select: none; transition: opacity var(--transition); pointer-events: none; }
.ll-stage[data-on="true"] .ll-hint { opacity: 0; }
.ll-stage .ll-card { position: relative; width: 100%; padding: 2.5rem; border: 1px solid rgba(255, 255, 255, .1); border-radius: 30px; background: rgba(255, 255, 255, .05); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px); box-shadow: 0 20px 40px rgba(0, 0, 0, .3); opacity: 0; transform: translateY(30px); pointer-events: none; transition: opacity .7s cubic-bezier(.175, .885, .32, 1.275), transform .7s cubic-bezier(.175, .885, .32, 1.275); }
.ll-stage[data-on="true"] .ll-card { opacity: 1; transform: translateY(0); pointer-events: auto; }
.ll-stage .ll-title { display: block; margin: 0 0 1.5rem; color: #fff; font-size: 1.5rem; line-height: 1.3; font-weight: 500; text-align: center; }
.ll-stage .ll-form { margin: 0; }
.ll-stage .ll-field { margin-bottom: 1.2rem; }
.ll-stage .ll-label { display: block; margin: 0 0 .5rem 5px; color: #999; font-size: .85rem; line-height: 1.3; }

.ll-stage .ll-input { display: block; width: 100%; margin: 0; padding: 14px 18px; border: 1px solid transparent; border-radius: 15px; outline: none; background: rgba(255, 255, 255, .07); color: #fff; font: inherit; font-size: 1rem; line-height: 1.25; transition: border-color .3s, background-color .3s; }
.ll-stage .ll-input::placeholder { color: #767a80; opacity: 1; }
.ll-stage .ll-input:focus, .ll-stage .ll-input[data-focus="true"] { border-color: var(--accent-color); background: rgba(255, 255, 255, .12); }
.ll-stage .ll-input[aria-invalid="true"] { border-color: var(--error-color); }
.ll-stage .ll-input:disabled { opacity: .6; cursor: wait; }
.ll-stage .ll-input:-webkit-autofill { -webkit-text-fill-color: #fff; -webkit-box-shadow: inset 0 0 0 100px #2b2c2e; caret-color: #fff; }
.ll-stage .ll-input-static { color: #767a80; white-space: nowrap; overflow: hidden; }
.ll-stage .ll-input-static[data-filled="true"] { color: #fff; }

.ll-stage .ll-btn { display: block; width: 100%; margin: 10px 0 0; padding: 15px; border: none; border-radius: 15px; background: linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fcf6ba, #aa771c); color: #121417; font: inherit; font-size: 1rem; line-height: 1.25; font-weight: 600; text-align: center; transition: transform .3s, background .3s; }
.ll-stage button.ll-btn { cursor: pointer; }
.ll-stage button.ll-btn:hover:not(:disabled), .ll-stage .ll-btn[data-hover="true"] { transform: scale(1.02); background: var(--lamp-shade); }
.ll-stage button.ll-btn:focus-visible { outline: 2px solid var(--accent-color); outline-offset: 3px; }
.ll-stage button.ll-btn:disabled { cursor: wait; opacity: .8; }

.ll-stage .ll-field-error { margin: 6px 0 0 5px; color: var(--error-color); font-size: .8rem; line-height: 1.4; }
.ll-stage .ll-submit-error { margin: 14px 0 0; padding: 10px 12px; border: 1px solid rgba(242, 139, 130, .35); border-radius: 12px; background: rgba(242, 139, 130, .1); color: #f9c4bf; font-size: .85rem; line-height: 1.45; text-align: center; }
.ll-stage .ll-success { text-align: center; }
.ll-stage .ll-welcome { margin-bottom: .75rem; overflow-wrap: anywhere; }
.ll-stage .ll-welcome:focus { outline: none; }
.ll-stage .ll-welcome:focus-visible { outline: 2px solid var(--accent-color); outline-offset: 4px; border-radius: 6px; }
.ll-stage .ll-welcome-name { color: var(--accent-color); }
.ll-stage .ll-note { margin: 0 0 1.25rem; color: #999; font-size: .9rem; line-height: 1.5; }

/* Gallery thumbnail: the desktop scene, scaled to fit the card. */
.ll-stage.ll-thumbnail { min-height: 0; padding: 0; }
.ll-stage.ll-thumbnail .ll-scene { flex: none; width: 720px; gap: 52px; transform: scale(.5); }
@container (max-width: 380px) { .ll-stage.ll-thumbnail .ll-scene { transform: scale(.44); } }
@container (min-width: 480px) { .ll-stage.ll-thumbnail .ll-scene { transform: scale(.6); } }

@keyframes ll-tug-line { 0% { transform: scaleY(1); } 25% { transform: scaleY(1.27); } 55% { transform: scaleY(.95); } 100% { transform: scaleY(1); } }
@keyframes ll-tug-bead { 0% { transform: translateY(0); } 25% { transform: translateY(26px); } 55% { transform: translateY(-5px); } 100% { transform: translateY(0); } }

/* Narrow containers: stack the lamp above the card. */
@container (max-width: 640px) {
  .ll-stage:not(.ll-thumbnail) .ll-scene { flex-direction: column; gap: 0; }
  .ll-stage:not(.ll-thumbnail) .ll-lamp { width: 196px; height: 280px; margin: -48px 0 -12px; }
  .ll-stage:not(.ll-thumbnail) .ll-hint { align-items: flex-start; padding-top: 32px; }
  .ll-stage:not(.ll-thumbnail)::before { background: radial-gradient(circle at 50% 28%, var(--glow-color), transparent 70%); }
}
@container (max-width: 380px) {
  .ll-stage:not(.ll-thumbnail) .ll-card { padding: 2rem 1.5rem; border-radius: 26px; }
}
@media (prefers-reduced-motion: reduce) {
  .ll-stage .ll-cord-line, .ll-stage .ll-cord-bead { transition: none; animation: none !important; }
  .ll-stage .ll-card { transform: none !important; transition: opacity .3s ease; }
  .ll-stage button.ll-btn:hover:not(:disabled), .ll-stage .ll-btn[data-hover="true"] { transform: none; }
}
`;
