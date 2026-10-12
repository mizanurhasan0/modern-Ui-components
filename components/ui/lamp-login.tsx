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

/*
 * Shared Tailwind class lists. The stage is the theme root (`group/ll`, data-on) and the
 * container for every `@max-[…]`/`@min-[…]` query; the lamp is `group/lamp` (data-dragging, data-tug).
 */
const STAGE =
  "ll-stage group/ll @container relative isolate box-border flex w-full min-w-0 items-center justify-center overflow-hidden " +
  "[--accent-color:#d4a373] [--bg-color:#121417] [--error-color:#f28b82] [--glow-color:rgba(255,214,110,.3)] [--lamp-base:#d1ccc2] [--lamp-shade:#f5f0e6] " +
  "bg-(--bg-color) font-[Inter,system-ui,-apple-system,sans-serif] text-white " +
  // Warm room glow that fades in with the light.
  "before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:bg-[radial-gradient(circle_at_50%_40%,var(--glow-color),transparent_70%)] " +
  "before:opacity-0 before:transition-opacity before:duration-500 before:ease-in-out before:content-[''] data-[on=true]:before:opacity-100";
const LAMP = "ll-lamp group/lamp relative h-[400px] w-[280px] flex-none select-none [--ll-pull:0]";
/** The cord stretches with `--ll-pull` (inline, from JS) and springs back; the thumbnail plays a keyframed tug. */
const CORD_MOTION =
  "transition-[transform] duration-550 ease-[cubic-bezier(.34,1.56,.64,1)] group-data-[dragging]/lamp:transition-none motion-reduce:transition-none";
const PANEL = "ll-panel relative w-[340px] max-w-full flex-none";
const CARD =
  "ll-card pointer-events-none relative w-full rounded-[30px] border border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.05)] p-10 " +
  "opacity-0 shadow-[0_20px_40px_rgba(0,0,0,.3)] backdrop-blur-[20px] transition-[opacity,translate] duration-700 ease-[cubic-bezier(.175,.885,.32,1.275)] " +
  "motion-safe:translate-y-[30px] group-data-[on=true]/ll:pointer-events-auto group-data-[on=true]/ll:translate-y-0 group-data-[on=true]/ll:opacity-100 " +
  // Reduced motion: no slide, only a short fade.
  "motion-reduce:transition-opacity motion-reduce:duration-300 motion-reduce:ease-[ease]";
const TITLE = "ll-title block text-center text-2xl leading-[1.3] font-medium text-white";
const FIELD = "ll-field mb-[1.2rem]";
const LABEL = "ll-label mb-2 ml-[5px] block text-[.85rem] leading-[1.3] text-[#999]";
const INPUT =
  "ll-input block w-full rounded-[15px] border border-transparent bg-[rgba(255,255,255,.07)] px-[18px] py-[14px] text-base leading-[1.25] " +
  "transition-[border-color,background-color] duration-300 ease-[ease]";
/** Thumbnail stand-in for an input: placeholder grey until "typed", accent border while "focused". */
const STATIC_INPUT =
  `${INPUT} ll-input-static overflow-hidden whitespace-nowrap text-[#767a80] data-[filled=true]:text-white ` +
  "data-[focus=true]:border-(--accent-color) data-[focus=true]:bg-[rgba(255,255,255,.12)]";
const BUTTON =
  "ll-btn mt-2.5 block w-full rounded-[15px] border-none bg-[linear-gradient(135deg,#bf953f,#fcf6ba,#b38728,#fcf6ba,#aa771c)] p-[15px] " +
  "text-center text-base leading-[1.25] font-semibold text-[#121417] transition-[scale,background] duration-300 ease-[ease]";
const BUTTON_LIVE =
  `${BUTTON} cursor-pointer enabled:hover:bg-none enabled:hover:bg-(--lamp-shade) motion-safe:enabled:hover:scale-[1.02] disabled:cursor-wait disabled:opacity-80`;

/** Mushroom desk lamp: dome shade, stem, base and a pull cord with a bead. */
function LampArt() {
  return (
    <svg className="ll-lamp-svg block size-full overflow-visible" viewBox="0 0 280 400" aria-hidden="true" focusable="false">
      <ellipse
        className="ll-inner-glow fill-[#ffdb8a] opacity-0 blur-[15px] transition-opacity duration-500 ease-in-out group-data-[on=true]/ll:opacity-60"
        cx="140"
        cy="160"
        rx="88"
        ry="16"
      />
      <rect className="ll-lamp-base fill-(--lamp-base)" x="129" y="150" width="23" height="192" />
      <rect className="ll-lamp-base fill-(--lamp-base)" x="86" y="336" width="108" height="17" rx="8.5" />
      <line
        className={`ll-cord-line origin-top stroke-[#555] stroke-2 transform-fill [transform:scaleY(calc(1_+_var(--ll-pull)_/_96))] motion-safe:group-data-[tug=true]/lamp:animate-[ll-tug-line_.7s_ease-out] ${CORD_MOTION}`}
        x1="180.5"
        y1="152"
        x2="180.5"
        y2="248"
      />
      <circle
        className={`ll-cord-bead fill-(--accent-color) [transform:translateY(calc(var(--ll-pull)_*_1px))] motion-safe:group-data-[tug=true]/lamp:animate-[ll-tug-bead_.7s_ease-out] ${CORD_MOTION}`}
        cx="180.5"
        cy="255"
        r="8"
      />
      <path
        className="ll-lamp-shade fill-(--lamp-shade) [filter:drop-shadow(0_0_30px_rgba(255,255,200,0))] transition-[fill,filter] duration-500 ease-in-out group-data-[on=true]/ll:fill-white group-data-[on=true]/ll:[filter:drop-shadow(0_0_30px_rgba(255,255,200,.4))]"
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
    <section
      className={`${STAGE} min-h-[600px] px-4 py-10 @max-[640px]:before:bg-[radial-gradient(circle_at_50%_28%,var(--glow-color),transparent_70%)] ${className}`}
      data-on={on}
      aria-label="Lamp login"
    >
      <ComponentStyles css={LAMP_LOGIN_CSS} />
      {/* Narrow containers stack the lamp above the card. */}
      <div className="ll-scene flex w-full items-center justify-center gap-[clamp(28px,6cqw,56px)] @max-[640px]:flex-col @max-[640px]:gap-0">
        <div className={`${LAMP} @max-[640px]:-mt-12 @max-[640px]:-mb-3 @max-[640px]:h-[280px] @max-[640px]:w-[196px]`} ref={lamp}>
          <LampArt />
          <button
            className="ll-cord-button absolute top-[37.5%] left-[64.5%] h-[35%] w-[max(15.7%,44px)] -translate-x-1/2 rounded-[22px] bg-transparent touch-none [-webkit-tap-highlight-color:transparent]"
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

        <div className={PANEL}>
          <p
            className="ll-hint pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-[.9rem] leading-normal text-[#6b7078] select-none transition-opacity duration-500 ease-in-out group-data-[on=true]/ll:opacity-0 @max-[640px]:items-start @max-[640px]:pt-8"
            aria-hidden={on}
          >
            Pull the cord to switch on the light
          </p>
          <div className={`${CARD} @max-[380px]:rounded-[26px] @max-[380px]:px-6 @max-[380px]:py-8`} data-state={status} inert={!on}>
            {status === "success" ? (
              <div className="ll-success text-center">
                <h2
                  className={`${TITLE} ll-welcome mb-3 wrap-anywhere focus-visible:rounded-[6px]`}
                  tabIndex={-1}
                  ref={successHeading}
                >
                  Welcome back, <span className="ll-welcome-name text-(--accent-color)">{welcomeName}</span>
                </h2>
                <p className="ll-note mb-5 text-[.9rem] leading-normal text-[#999]">
                  {onSubmit ? "You’re signed in." : "Demo only — no account was signed in."}
                </p>
                <button className={BUTTON_LIVE} type="button" onClick={signOut}>Sign out</button>
              </div>
            ) : (
              <>
                <h2 className={`${TITLE} mb-6`} id={`${id}-title`}>Welcome</h2>
                <form className="ll-form" onSubmit={submit} noValidate aria-labelledby={`${id}-title`} aria-busy={pending}>
                  {FIELDS.map(({ name, label, placeholder }) => {
                    const error = errors[name];
                    return (
                      <div className={FIELD} key={name}>
                        <label className={LABEL} htmlFor={`${id}-${name}`}>{label}</label>
                        <input
                          id={`${id}-${name}`}
                          ref={(element) => { fields.current[name] = element; }}
                          className={`${INPUT} text-white placeholder:text-[#767a80] focus:border-(--accent-color) focus:bg-[rgba(255,255,255,.12)] aria-invalid:border-(--error-color) disabled:cursor-wait disabled:opacity-60`}
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
                        {error && (
                          <p className="ll-field-error mt-[6px] ml-[5px] text-[.8rem] leading-[1.4] text-(--error-color)" id={`${id}-${name}-error`}>
                            {error}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  <button className={BUTTON_LIVE} type="submit" disabled={pending} aria-busy={pending}>
                    {pending ? "Signing in…" : "Sign In"}
                  </button>
                  {submitError && (
                    <p
                      className="ll-submit-error mt-[14px] rounded-xl border border-[rgba(242,139,130,.35)] bg-[rgba(242,139,130,.1)] px-3 py-2.5 text-center text-[.85rem] leading-[1.45] text-[#f9c4bf]"
                      role="alert"
                    >
                      {submitError}
                    </p>
                  )}
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
    <div className={`${STAGE} ll-thumbnail h-full min-h-0 ${className}`} data-on={on} aria-hidden="true" inert>
      <ComponentStyles css={LAMP_LOGIN_CSS} />
      {/* The desktop scene, scaled to fit the gallery card. */}
      <div className="ll-scene flex w-[720px] flex-none scale-50 items-center justify-center gap-[52px] @max-[380px]:scale-[.44] @min-[480px]:scale-60">
        <div className={LAMP} data-tug={step === 1}>
          <LampArt />
        </div>
        <div className={PANEL}>
          <div className={CARD}>
            <span className={`${TITLE} mb-6`}>Welcome</span>
            <div className="ll-form">
              <div className={FIELD}>
                <span className={LABEL}>Username</span>
                <span className={STATIC_INPUT} data-filled={typing}>{typing ? "alex" : "Enter name"}</span>
              </div>
              <div className={FIELD}>
                <span className={LABEL}>Password</span>
                <span className={STATIC_INPUT} data-filled={typing} data-focus={step === 2}>
                  {typing ? "••••••••" : "Enter Password"}
                </span>
              </div>
              <span
                className={`${BUTTON} data-[hover=true]:bg-none data-[hover=true]:bg-(--lamp-shade) motion-safe:data-[hover=true]:scale-[1.02]`}
                data-hover={step === 3}
              >
                Sign In
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * Only what Tailwind can't express cleanly stays here:
 * - cord cursors and focus outlines: the site's unlayered `button:not(:disabled)` cursor and
 *   `:focus-visible` outline rules would beat layered utilities;
 * - Chrome autofill colours on the -webkit-autofill pseudo-class;
 * - the keyframes referenced by the thumbnail's tug animation.
 */
const LAMP_LOGIN_CSS = `
.ll-stage .ll-cord-button { cursor: grab; }
.ll-stage .ll-lamp[data-dragging] .ll-cord-button { cursor: grabbing; }
.ll-stage .ll-cord-button:focus-visible { outline: 2px solid var(--accent-color); outline-offset: 2px; }
.ll-stage .ll-btn:focus-visible { outline: 2px solid var(--accent-color); outline-offset: 3px; }
.ll-stage .ll-welcome:focus { outline: none; }
.ll-stage .ll-welcome:focus-visible { outline: 2px solid var(--accent-color); outline-offset: 4px; }
.ll-stage .ll-input { outline: none; }
.ll-stage .ll-input:-webkit-autofill { -webkit-text-fill-color: #fff; -webkit-box-shadow: inset 0 0 0 100px #2b2c2e; caret-color: #fff; }

@keyframes ll-tug-line { 0% { transform: scaleY(1); } 25% { transform: scaleY(1.27); } 55% { transform: scaleY(.95); } 100% { transform: scaleY(1); } }
@keyframes ll-tug-bead { 0% { transform: translateY(0); } 25% { transform: translateY(26px); } 55% { transform: translateY(-5px); } 100% { transform: translateY(0); } }
`;
