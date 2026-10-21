"use client";

import { ComponentStyles } from "./component-styles";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";

export type GlassyLoginV3Mode = "signin" | "signup";
export type GlassyLoginV3Provider = "google" | "apple";

export interface GlassyLoginV3SignInValues {
  email: string;
  password: string;
  remember: boolean;
}

export interface GlassyLoginV3SignUpValues {
  name: string;
  email: string;
  password: string;
}

export interface GlassyLoginV3Props {
  className?: string;
  /** The form shown on first render. Later changes are ignored. */
  initialMode?: GlassyLoginV3Mode;
  /** Resolve to confirm the sign-in, or reject to show the message under the title. */
  onSignIn?: (values: GlassyLoginV3SignInValues) => void | Promise<void>;
  /** Resolve to confirm the account, or reject to show the message under the title. */
  onSignUp?: (values: GlassyLoginV3SignUpValues) => void | Promise<void>;
  /** Called when a provider button is pressed in either form. */
  onSocialSignIn?: (provider: GlassyLoginV3Provider, mode: GlassyLoginV3Mode) => void | Promise<void>;
  onForgotPassword?: (email: string) => void;
  /** Called as soon as the liquid-glass switch begins. */
  onModeChange?: (mode: GlassyLoginV3Mode) => void;
}

type Fields = {
  name: string;
  email: string;
  password: string;
  confirm: string;
  remember: boolean;
  terms: boolean;
};
type FieldName = "name" | "email" | "password" | "confirm" | "terms";
type Status = "idle" | "busy" | "done";
type ContentState = "idle" | "leaving" | "entering";

const EMPTY_FIELDS: Fields = { name: "", email: "", password: "", confirm: "", remember: true, terms: true };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Timings (ms) follow the recorded switch: content out, tabs merge, ripple, content in. */
const SWITCH_AT = 730;
const SWITCH_DONE = 1450;
const REDUCED_SWITCH_AT = 140;
const REDUCED_SWITCH_DONE = 380;

const CARD_WIDTH = 452;
const CARD_HEIGHT = 414;

type Point = [number, number];

/** Round each corner of a polygon with a quadratic curve; `offsets` is the distance the curve starts from each vertex. */
function roundedPath(points: Point[], offsets: number[]): string {
  const count = points.length;
  let path = "";
  points.forEach((corner, index) => {
    const before = points[(index + count - 1) % count];
    const after = points[(index + 1) % count];
    const toward = (target: Point): Point => {
      const dx = target[0] - corner[0];
      const dy = target[1] - corner[1];
      const length = Math.hypot(dx, dy) || 1;
      const offset = Math.min(offsets[index], length / 2);
      return [corner[0] + (dx / length) * offset, corner[1] + (dy / length) * offset];
    };
    const start = toward(before);
    const end = toward(after);
    path += `${index === 0 ? "M" : "L"}${start[0].toFixed(2)} ${start[1].toFixed(2)}Q${corner[0]} ${corner[1]} ${end[0].toFixed(2)} ${end[1].toFixed(2)}`;
  });
  return `${path}Z`;
}

const CUT = 82;
const CARD_PATH = roundedPath(
  [
    [CUT, 0],
    [CARD_WIDTH, 0],
    [CARD_WIDTH, CARD_HEIGHT - CUT],
    [CARD_WIDTH - CUT, CARD_HEIGHT],
    [0, CARD_HEIGHT],
    [0, CUT],
  ],
  [13, 25, 13, 13, 25, 13],
);

const TAB = 68;
const TAB_PATH = roundedPath(
  [
    [0, 0],
    [TAB, 0],
    [0, TAB],
  ],
  [15, 6.5, 6.5],
);

function row(index: number, total: number): CSSProperties {
  return { "--gl3-i": index, "--gl3-r": total - 1 - index } as CSSProperties;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ---------------------------------------------------------------- icons */

function Icon({ children, size = 14 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const MailIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.5 7.5 8.5 6 8.5-6" />
  </Icon>
);
const LockIcon = () => (
  <Icon>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Icon>
);
const UserIcon = () => (
  <Icon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
  </Icon>
);
const EyeIcon = ({ off }: { off: boolean }) => (
  <Icon size={13}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="m4 4 16 16" />}
  </Icon>
);
const ArrowIcon = () => (
  <Icon size={13}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);
const CheckIcon = () => (
  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m2.4 6.4 2.4 2.4 4.8-5.2" />
  </svg>
);
const GoogleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3A7.2 7.2 0 0 1 5.36 14.3H1.4v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.36 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l3.96-3.1Z" />
    <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.4 6.6l3.96 3.1A7.15 7.15 0 0 1 12 4.75Z" />
  </svg>
);
const AppleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M16.37 12.62c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.19-1.73-1.35-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.4 6.63 1.1 8.8.73 1.06 1.6 2.25 2.75 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.87.69 1.19-.02 1.94-1.08 2.66-2.15.84-1.23 1.19-2.42 1.2-2.48-.03-.01-2.3-.88-2.33-3.5ZM14.2 6.17c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.68-.92 2.67.97.07 1.96-.49 2.56-1.22Z" />
  </svg>
);

/* ------------------------------------------------------------ backdrop */

/** The chrome-and-neon scene behind the glass, extracted from the reference recording. */
function Backdrop() {
  return <div className="gl3-backdrop" aria-hidden="true" />;
}

/* ------------------------------------------------------------ the card */

function CardFrame({ uid }: { uid: string }) {
  const tabId = (name: string) => `${uid}-${name}`;
  return (
    <>
      <svg className="gl3-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={`${uid}-clip`} clipPathUnits="objectBoundingBox">
            <path d={CARD_PATH} transform={`scale(${1 / CARD_WIDTH} ${1 / CARD_HEIGHT})`} />
          </clipPath>
        </defs>
      </svg>
      <div className="gl3-glass" style={{ clipPath: `url(#${uid}-clip)` }}>
        <div className="gl3-tint" />
        <div className="gl3-frost" />
      </div>
      <svg className="gl3-outline" viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={tabId("edge")} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={CARD_WIDTH} y2={CARD_HEIGHT}>
            <stop offset="0" stopColor="#e3f0ff" stopOpacity=".92" />
            <stop offset=".3" stopColor="#a9c8e8" stopOpacity=".5" />
            <stop offset=".62" stopColor="#8fb2d6" stopOpacity=".42" />
            <stop offset="1" stopColor="#e3f0ff" stopOpacity=".9" />
          </linearGradient>
        </defs>
        <path d={CARD_PATH} fill="none" stroke={`url(#${tabId("edge")})`} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
    </>
  );
}

function Tab({ corner, uid }: { corner: "tl" | "br"; uid: string }) {
  const glass = `${uid}-tab-glass-${corner}`;
  const blue = `${uid}-tab-blue-${corner}`;
  return (
    <span className={`gl3-tab gl3-tab--${corner}`} aria-hidden="true">
      <svg className="gl3-tab-svg gl3-tab-glass" viewBox="-1 -1 70 70" focusable="false">
        <defs>
          <linearGradient id={glass} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b4c61" stopOpacity=".82" />
            <stop offset="1" stopColor="#101a28" stopOpacity=".78" />
          </linearGradient>
        </defs>
        <path d={TAB_PATH} fill={`url(#${glass})`} stroke="#c4d8ee" strokeOpacity=".62" strokeWidth="1.2" />
      </svg>
      <svg className="gl3-tab-svg gl3-tab-blue" viewBox="-1 -1 70 70" focusable="false">
        <defs>
          <linearGradient id={blue} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4cc4ff" />
            <stop offset=".55" stopColor="#2392e4" />
            <stop offset="1" stopColor="#1167b6" />
          </linearGradient>
        </defs>
        <path d={TAB_PATH} fill={`url(#${blue})`} stroke="#bfe7ff" strokeOpacity=".95" strokeWidth="1.3" />
      </svg>
    </span>
  );
}

function Effects() {
  return (
    <div className="gl3-fx" aria-hidden="true">
      <span className="gl3-lens" />
      <span className="gl3-ring gl3-ring--a" />
      <span className="gl3-ring gl3-ring--b" />
      <span className="gl3-slit" />
    </div>
  );
}

/* ------------------------------------------------------------- the form */

type FieldProps = {
  label: string;
  icon: ReactNode;
  id: string;
  type?: string;
  value: string;
  placeholder: string;
  autoComplete: string;
  invalid?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  /** Adds a show/hide control for password fields. */
  reveal?: { shown: boolean; toggle: () => void; label: string };
  inputRef?: (element: HTMLInputElement | null) => void;
};

function Field({ label, icon, id, type = "text", value, placeholder, autoComplete, invalid, disabled, onChange, reveal, inputRef }: FieldProps) {
  return (
    <div className="gl3-block">
      <label className="gl3-label" htmlFor={id}>{label}</label>
      <div className="gl3-field" data-invalid={invalid || undefined}>
        <span className="gl3-field-icon">{icon}</span>
        <input
          ref={inputRef}
          id={id}
          className="gl3-input"
          type={reveal && reveal.shown ? "text" : type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
        />
        {reveal && (
          <button type="button" className="gl3-eye" onClick={reveal.toggle} aria-label={reveal.label} aria-pressed={reveal.shown} disabled={disabled}>
            <EyeIcon off={reveal.shown} />
          </button>
        )}
      </div>
    </div>
  );
}

function Checkbox({ id, checked, onChange, invalid, disabled, children }: { id: string; checked: boolean; onChange: (checked: boolean) => void; invalid?: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <label className="gl3-check" htmlFor={id} data-invalid={invalid || undefined}>
      <input id={id} type="checkbox" checked={checked} disabled={disabled} aria-invalid={invalid || undefined} onChange={(event) => onChange(event.target.checked)} />
      <span className="gl3-check-box"><CheckIcon /></span>
      <span>{children}</span>
    </label>
  );
}

function Title({ lead, accent }: { lead: string; accent: string }) {
  return (
    <>
      {lead} <span className="gl3-title-accent">{accent}</span>
    </>
  );
}

/** A single-file demo. Credentials stay in memory unless a callback is supplied. */
export default function GlassyLoginV3({
  className = "",
  initialMode = "signin",
  onSignIn,
  onSignUp,
  onSocialSignIn,
  onForgotPassword,
  onModeChange,
}: GlassyLoginV3Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [mode, setMode] = useState<GlassyLoginV3Mode>(initialMode === "signup" ? "signup" : "signin");
  const [phase, setPhase] = useState<"idle" | "run">("idle");
  const [contentState, setContentState] = useState<ContentState>("idle");
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [shown, setShown] = useState({ password: false, confirm: false });
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<{ field?: FieldName; message: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const refs = useRef<Partial<Record<FieldName, HTMLInputElement | null>>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const focusHeading = useRef(false);
  const mounted = useRef(false);

  const switching = phase === "run";
  const busy = status === "busy" || switching;

  useEffect(() => {
    const pending = timers.current;
    mounted.current = true;
    return () => {
      mounted.current = false;
      pending.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!focusHeading.current || switching) return;
    focusHeading.current = false;
    heading.current?.focus({ preventScroll: true });
  }, [switching, mode]);

  function later(callback: () => void, delay: number) {
    timers.current.push(setTimeout(() => { if (mounted.current) callback(); }, delay));
  }

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
    setError((current) => (current && (!current.field || current.field === key) ? null : current));
  }

  function switchTo(next: GlassyLoginV3Mode) {
    if (busy || next === mode) return;
    const reduced = prefersReducedMotion();
    focusHeading.current = true;
    setError(null);
    setPhase("run");
    setContentState("leaving");
    onModeChange?.(next);
    later(() => {
      setMode(next);
      setStatus("idle");
      setShown({ password: false, confirm: false });
      setFields((current) => ({ ...EMPTY_FIELDS, email: current.email, remember: current.remember }));
      setContentState("entering");
      setAnnouncement(next === "signup" ? "Create account form" : "Sign in form");
    }, reduced ? REDUCED_SWITCH_AT : SWITCH_AT);
    later(() => {
      setPhase("idle");
      setContentState("idle");
    }, reduced ? REDUCED_SWITCH_DONE : SWITCH_DONE);
  }

  function fail(field: FieldName | undefined, message: string) {
    setError({ field, message });
    if (field) refs.current[field]?.focus({ preventScroll: true });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || status === "done") return;
    const email = fields.email.trim();
    const name = fields.name.trim();

    if (mode === "signup" && !name) return fail("name", "Tell us your name to continue.");
    if (!EMAIL_PATTERN.test(email)) return fail("email", "Enter a valid email address.");
    if (mode === "signin" && !fields.password) return fail("password", "Enter your password.");
    if (mode === "signup" && fields.password.length < 8) return fail("password", "Use at least 8 characters.");
    if (mode === "signup" && fields.confirm !== fields.password) return fail("confirm", "Those passwords do not match.");
    if (mode === "signup" && !fields.terms) return fail("terms", "Agree to the terms to continue.");

    setError(null);
    setStatus("busy");
    try {
      if (mode === "signin") {
        await (onSignIn ? onSignIn({ email, password: fields.password, remember: fields.remember }) : new Promise((resolve) => setTimeout(resolve, 900)));
      } else {
        await (onSignUp ? onSignUp({ name, email, password: fields.password }) : new Promise((resolve) => setTimeout(resolve, 900)));
      }
      if (!mounted.current) return;
      setStatus("done");
      later(() => setStatus("idle"), 2200);
    } catch (reason) {
      if (!mounted.current) return;
      setStatus("idle");
      setError({ message: reason instanceof Error && reason.message ? reason.message : "Something went wrong. Try again." });
    }
  }

  function social(provider: GlassyLoginV3Provider) {
    if (busy) return;
    void Promise.resolve(onSocialSignIn?.(provider, mode)).catch((reason: unknown) => {
      if (mounted.current) setError({ message: reason instanceof Error && reason.message ? reason.message : "That provider is unavailable right now." });
    });
  }

  const signin = mode === "signin";
  const total = signin ? 9 : 10;
  const failing = (field: FieldName) => error?.field === field;
  const submitLabel = status === "done" ? (signin ? "Signed in" : "Account created") : status === "busy" ? (signin ? "Signing in…" : "Creating…") : signin ? "Sign In" : "Create Account";

  return (
    <div className={`gl3-stage ${className}`.trim()} data-phase={phase} data-mode={mode}>
      <ComponentStyles css={STYLES} />
      <Backdrop />
      <p className="gl3-sr" role="status" aria-live="polite">{announcement}</p>

      <div className="gl3-card" aria-busy={switching || undefined}>
        <CardFrame uid={uid} />
        <Effects />
        <Tab corner="tl" uid={uid} />
        <Tab corner="br" uid={uid} />

        <form key={mode} className="gl3-content" data-state={contentState} data-mode={mode} noValidate onSubmit={submit} inert={contentState === "leaving" || undefined}>
          <header className="gl3-header">
            <h2 ref={heading} tabIndex={-1} className="gl3-title gl3-row" style={row(0, total)}>
              {signin ? <Title lead="Welcome" accent="Back" /> : <Title lead="Create" accent="Account" />}
            </h2>
            <p className="gl3-subtitle gl3-row" style={row(1, total)} data-error={error ? "true" : undefined} role={error ? "alert" : undefined}>
              {error ? error.message : signin ? "Enter your credentials to access your secure account" : "Join us today to access your secure workspace"}
            </p>
          </header>

          <div className="gl3-body">
            {!signin && (
              <div className="gl3-row" style={row(2, total)}>
                <Field label="Full Name" icon={<UserIcon />} id={`${uid}-name`} value={fields.name} placeholder="Alex Johnson" autoComplete="name" invalid={failing("name")} disabled={busy} onChange={(value) => update("name", value)} inputRef={(element) => { refs.current.name = element; }} />
              </div>
            )}
            <div className="gl3-row" style={row(signin ? 2 : 3, total)}>
              <Field label="Email Address" icon={<MailIcon />} id={`${uid}-email`} type="email" value={fields.email} placeholder="name@domain.com" autoComplete="email" invalid={failing("email")} disabled={busy} onChange={(value) => update("email", value)} inputRef={(element) => { refs.current.email = element; }} />
            </div>

            {signin ? (
              <div className="gl3-row" style={row(3, total)}>
                <Field label="Password" icon={<LockIcon />} id={`${uid}-password`} type="password" value={fields.password} placeholder="••••••••••••" autoComplete="current-password" invalid={failing("password")} disabled={busy} onChange={(value) => update("password", value)} reveal={{ shown: shown.password, toggle: () => setShown((current) => ({ ...current, password: !current.password })), label: shown.password ? "Hide password" : "Show password" }} inputRef={(element) => { refs.current.password = element; }} />
              </div>
            ) : (
              <div className="gl3-pair gl3-row" style={row(4, total)}>
                <Field label="Password" icon={<LockIcon />} id={`${uid}-password`} type="password" value={fields.password} placeholder="••••••••" autoComplete="new-password" invalid={failing("password")} disabled={busy} onChange={(value) => update("password", value)} reveal={{ shown: shown.password, toggle: () => setShown((current) => ({ ...current, password: !current.password })), label: shown.password ? "Hide password" : "Show password" }} inputRef={(element) => { refs.current.password = element; }} />
                <Field label="Confirm Password" icon={<LockIcon />} id={`${uid}-confirm`} type="password" value={fields.confirm} placeholder="••••••••" autoComplete="new-password" invalid={failing("confirm")} disabled={busy} onChange={(value) => update("confirm", value)} reveal={{ shown: shown.confirm, toggle: () => setShown((current) => ({ ...current, confirm: !current.confirm })), label: shown.confirm ? "Hide confirmation" : "Show confirmation" }} inputRef={(element) => { refs.current.confirm = element; }} />
              </div>
            )}

            {signin ? (
              <div className="gl3-options gl3-row" style={row(4, total)}>
                <Checkbox id={`${uid}-remember`} checked={fields.remember} disabled={busy} onChange={(checked) => update("remember", checked)}>Remember me</Checkbox>
                <button type="button" className="gl3-link gl3-link--muted" disabled={busy} onClick={() => onForgotPassword?.(fields.email.trim())}>Forgot password?</button>
              </div>
            ) : (
              <div className="gl3-options gl3-row" style={row(5, total)}>
                <Checkbox id={`${uid}-terms`} checked={fields.terms} disabled={busy} invalid={failing("terms")} onChange={(checked) => update("terms", checked)}>I agree to the Terms &amp; Privacy Policy</Checkbox>
              </div>
            )}

            <div className="gl3-row" style={row(signin ? 5 : 6, total)}>
              <button type="submit" className="gl3-primary" data-status={status} disabled={busy}>
                <span>{submitLabel}</span>
                {status === "idle" && <ArrowIcon />}
                {status === "busy" && <span className="gl3-spinner" aria-hidden="true" />}
                {status === "done" && <CheckIcon />}
              </button>
            </div>

            <div className="gl3-divider gl3-row" style={row(signin ? 6 : 7, total)}>
              <span>{signin ? "Or continue with" : "Or sign up with"}</span>
            </div>

            <div className="gl3-socials gl3-row" style={row(signin ? 7 : 8, total)}>
              <button type="button" className="gl3-social" disabled={busy} onClick={() => social("google")}><GoogleIcon />Google</button>
              <button type="button" className="gl3-social" disabled={busy} onClick={() => social("apple")}><AppleIcon />Apple</button>
            </div>

            <p className="gl3-switch gl3-row" style={row(signin ? 8 : 9, total)}>
              {signin ? "Don’t have an account?" : "Already have an account?"}{" "}
              <button type="button" className="gl3-link" disabled={busy} onClick={() => switchTo(signin ? "signup" : "signin")}>{signin ? "Sign Up" : "Sign In"}</button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- thumbnail */

function StaticField({ icon, children, wide = true }: { icon: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className="gl3-block" style={wide ? undefined : { flex: 1 }}>
      <span className="gl3-field gl3-static"><span className="gl3-field-icon">{icon}</span><span className="gl3-input">{children}</span></span>
    </div>
  );
}

/** A static preview: no inputs or buttons nested inside a gallery link. */
export function GlassyLoginV3Thumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) % 4 : 0;
  const signin = step < 2;
  const merged = step % 2 === 1;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <div className={`gl3-stage gl3-thumbnail ${className}`.trim()} data-merged={merged} data-mode={signin ? "signin" : "signup"} aria-hidden="true" inert>
      <ComponentStyles css={STYLES} />
      <Backdrop />
      <div className="gl3-card">
        <CardFrame uid={uid} />
        <Effects />
        <Tab corner="tl" uid={uid} />
        <Tab corner="br" uid={uid} />
        <div className="gl3-content gl3-static-content" data-state="idle" data-mode={signin ? "signin" : "signup"}>
          <div className="gl3-header">
            <p className="gl3-title">{signin ? <Title lead="Welcome" accent="Back" /> : <Title lead="Create" accent="Account" />}</p>
            <p className="gl3-subtitle">{signin ? "Enter your credentials to access your secure account" : "Join us today to access your secure workspace"}</p>
          </div>
          <div className="gl3-body">
            {!signin && <div><span className="gl3-label">Full Name</span><StaticField icon={<UserIcon />}>Alex Johnson</StaticField></div>}
            <div><span className="gl3-label">Email Address</span><StaticField icon={<MailIcon />}>name@domain.com</StaticField></div>
            {signin ? (
              <div><span className="gl3-label">Password</span><StaticField icon={<LockIcon />}>••••••••••••</StaticField></div>
            ) : (
              <div className="gl3-pair">
                <div><span className="gl3-label">Password</span><StaticField icon={<LockIcon />}>••••••••</StaticField></div>
                <div><span className="gl3-label">Confirm Password</span><StaticField icon={<LockIcon />}>••••••••</StaticField></div>
              </div>
            )}
            <div className="gl3-options">
              <span className="gl3-check"><span className="gl3-check-box" data-static="true"><CheckIcon /></span><span>{signin ? "Remember me" : "I agree to the Terms & Privacy Policy"}</span></span>
              {signin && <span className="gl3-link gl3-link--muted">Forgot password?</span>}
            </div>
            <span className="gl3-primary"><span>{signin ? "Sign In" : "Create Account"}</span><ArrowIcon /></span>
            <div className="gl3-divider"><span>{signin ? "Or continue with" : "Or sign up with"}</span></div>
            <div className="gl3-socials"><span className="gl3-social"><GoogleIcon />Google</span><span className="gl3-social"><AppleIcon />Apple</span></div>
            <p className="gl3-switch">{signin ? "Don’t have an account?" : "Already have an account?"} <span className="gl3-link">{signin ? "Sign Up" : "Sign In"}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- styles */

const STYLES = `
@font-face{font-family:"GL3 Jakarta";src:url("/glassy-login-v3/plus-jakarta-sans-latin.woff2") format("woff2");font-weight:200 800;font-style:normal;font-display:swap}

.gl3-stage{--gl3-font:"GL3 Jakarta","Plus Jakarta Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;position:relative;isolation:isolate;display:grid;place-items:center;width:100%;min-height:600px;overflow:hidden;padding:28px 16px;box-sizing:border-box;background:#05070a;color:#fff;font-family:var(--gl3-font);-webkit-font-smoothing:antialiased;container-type:inline-size}
.gl3-stage *,.gl3-stage *::before,.gl3-stage *::after{box-sizing:border-box}
.gl3-thumbnail{min-height:100%;height:100%;padding:0}
.gl3-thumbnail .gl3-backdrop{--gl3-k:.68}
.gl3-thumbnail .gl3-card{transform:scale(.68);flex:none}
.gl3-backdrop{--gl3-cw:min(${CARD_WIDTH}px,calc(100cqw - 32px));--gl3-k:1;position:absolute;inset:0;z-index:0;overflow:hidden;background:#05070a}
.gl3-backdrop::before,.gl3-backdrop::after{content:"";position:absolute}
.gl3-backdrop::before{inset:-90px;background:url("/glassy-login-v3/backdrop-fill.webp") center/cover no-repeat;filter:blur(34px) saturate(1.1)}
.gl3-backdrop::after{background:url("/glassy-login-v3/backdrop.webp") center/100% 100% no-repeat}
.gl3-backdrop::after{left:50%;top:50%;width:calc(var(--gl3-cw) * var(--gl3-k) * 1.5177);aspect-ratio:686/564;transform:translate(-50%,-50%);-webkit-mask-image:linear-gradient(90deg,transparent,#000 130px,#000 calc(100% - 130px),transparent),linear-gradient(180deg,transparent,#000 36px,#000 calc(100% - 36px),transparent);-webkit-mask-composite:source-in;mask-image:linear-gradient(90deg,transparent,#000 130px,#000 calc(100% - 130px),transparent),linear-gradient(180deg,transparent,#000 36px,#000 calc(100% - 36px),transparent);mask-composite:intersect}
.gl3-defs{position:absolute;width:0;height:0}
.gl3-sr{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

.gl3-card{--gl3-mx:calc(50cqw - 35px);--gl3-my:calc(50cqh - 35px);position:relative;z-index:1;width:min(${CARD_WIDTH}px,100%);height:${CARD_HEIGHT}px;container-type:size;color:#eef5ff}

/* Frosted glass, clipped to the chamfered silhouette. */
.gl3-glass{position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.085),rgba(255,255,255,.018) 40%,rgba(255,255,255,.035));-webkit-backdrop-filter:blur(15px) saturate(1.4);backdrop-filter:blur(15px) saturate(1.4)}
.gl3-tint{position:absolute;inset:0;background:radial-gradient(90% 62% at 16% 4%,rgba(48,150,215,.4),transparent 72%),radial-gradient(34% 34% at 100% 34%,rgba(36,140,210,.26),transparent 100%),linear-gradient(165deg,rgba(12,26,42,.36) 0%,rgba(6,14,24,.52) 52%,rgba(3,8,15,.66) 100%)}
.gl3-frost{position:absolute;inset:0;opacity:0;background:linear-gradient(150deg,rgba(150,180,215,.11),rgba(110,140,175,.06) 60%,rgba(90,120,155,.08))}
.gl3-outline{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;filter:drop-shadow(0 0 7px rgba(70,160,255,.22)) drop-shadow(0 18px 38px rgba(0,0,0,.55))}

/* The two corner tabs. */
.gl3-tab{position:absolute;z-index:3;width:70px;height:70px;pointer-events:none}
.gl3-tab--tl{left:-1px;top:-1px;--gl3-s:1}
.gl3-tab--br{right:-1px;bottom:-1px;--gl3-s:-1}
.gl3-tab-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.gl3-tab--br .gl3-tab-svg{rotate:180deg}
.gl3-tab-blue{opacity:0;filter:drop-shadow(0 0 7px rgba(60,170,255,.75)) drop-shadow(0 0 18px rgba(30,120,255,.4))}

/* Fx: ripple rings, lens and the slit of light between the halves. */
.gl3-fx{position:absolute;inset:0;z-index:2;pointer-events:none}
.gl3-ring,.gl3-lens,.gl3-slit{position:absolute;left:50%;top:50%;opacity:0;border-radius:50%}
.gl3-ring{width:110px;height:110px;margin:-55px 0 0 -55px;border:4px solid rgba(70,160,255,.5);box-shadow:0 0 26px rgba(40,140,255,.5),inset 0 0 26px rgba(40,140,255,.45);filter:blur(2.4px)}
.gl3-lens{width:230px;height:230px;margin:-115px 0 0 -115px;background:radial-gradient(circle,rgba(175,198,218,.4) 0%,rgba(118,150,182,.22) 42%,rgba(70,110,160,0) 70%);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);-webkit-mask-image:radial-gradient(circle,#000 52%,transparent 72%);mask-image:radial-gradient(circle,#000 52%,transparent 72%)}
.gl3-slit{width:62px;height:5px;margin:-2.5px 0 0 -31px;rotate:-45deg;background:linear-gradient(90deg,transparent,rgba(238,247,255,.95),transparent);filter:blur(2.2px)}

/* The form. */
.gl3-content{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;margin:0;padding:23px 33px 0}
.gl3-header{padding-left:29.5px}
.gl3-title{margin:0;font-size:24px;line-height:28px;font-weight:700;letter-spacing:-.025em;color:#f3f8ff;outline:none;white-space:nowrap}
.gl3-title-accent{background:linear-gradient(90deg,#9ad6ff,#5cb2f2);-webkit-background-clip:text;background-clip:text;color:transparent}
.gl3-subtitle{margin:2px 0 0;min-height:14px;font-size:10px;line-height:14px;font-weight:500;color:rgba(196,214,232,.62);transition:color .2s}
.gl3-subtitle[data-error]{color:#ffa4b3}
.gl3-body{display:flex;flex:1;flex-direction:column;justify-content:flex-end;padding-bottom:20px}
.gl3-content[data-mode="signup"] .gl3-body{padding-bottom:7px}

.gl3-block{display:block}
.gl3-body>.gl3-row+.gl3-row{margin-top:9px}
.gl3-label{display:block;margin:0 0 6px;font-size:10.3px;line-height:14px;font-weight:600;letter-spacing:.005em;color:rgba(236,244,252,.92)}
.gl3-field{position:relative;display:flex;align-items:center;height:32px;border:1px solid rgba(255,255,255,.06);border-radius:9px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.018));box-shadow:inset 0 1px 0 rgba(255,255,255,.03);transition:border-color .2s,box-shadow .2s,background .2s}
.gl3-field:hover{border-color:rgba(255,255,255,.13)}
.gl3-field:focus-within{border-color:rgba(92,182,255,.6);background:linear-gradient(180deg,rgba(80,170,255,.09),rgba(255,255,255,.03));box-shadow:0 0 0 3px rgba(60,160,255,.14),0 0 16px rgba(60,160,255,.18)}
.gl3-field[data-invalid]{border-color:rgba(255,128,148,.7);box-shadow:0 0 0 3px rgba(255,100,130,.12)}
.gl3-field-icon{position:absolute;left:11px;display:grid;place-items:center;color:rgba(255,255,255,.42);transition:color .2s}
.gl3-field:focus-within .gl3-field-icon{color:rgba(150,212,255,.9)}
.gl3-input{width:100%;min-width:0;height:100%;padding:0 30px 0 34px;border:0;background:transparent;color:#eaf3ff;font:500 10.8px/1 var(--gl3-font);outline:none}
.gl3-input::placeholder{color:rgba(255,255,255,.26);opacity:1}
.gl3-input:-webkit-autofill{-webkit-text-fill-color:#eaf3ff;transition:background-color 9999s}
.gl3-input:disabled{opacity:.7}
.gl3-eye{position:absolute;right:5px;display:grid;place-items:center;width:24px;height:24px;border:0;border-radius:7px;background:transparent;color:rgba(255,255,255,.4);cursor:pointer;transition:color .2s,background .2s}
.gl3-eye:hover{color:rgba(255,255,255,.85);background:rgba(255,255,255,.06)}
.gl3-pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.gl3-pair .gl3-input{padding-right:28px}

.gl3-options{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:16px}
.gl3-check{position:relative;display:inline-flex;align-items:center;gap:7px;font-size:10.3px;line-height:16px;font-weight:500;color:rgba(255,255,255,.6);cursor:pointer}
.gl3-check input{position:absolute;inset:0 auto 0 0;width:14px;height:14px;margin:auto 0;opacity:0;cursor:pointer}
.gl3-check-box{display:grid;flex:none;place-items:center;width:13px;height:13px;border:1px solid rgba(255,255,255,.28);border-radius:3.5px;color:transparent;background:rgba(255,255,255,.04);transition:background .2s,border-color .2s,color .2s,box-shadow .2s}
.gl3-check input:checked+.gl3-check-box,.gl3-check-box[data-static]{border-color:#4cb4fb;background:linear-gradient(180deg,#46b8ff,#1c8de4);color:#06243f;box-shadow:0 0 8px rgba(60,170,255,.4)}
.gl3-check input:focus-visible+.gl3-check-box{outline:2px solid #8fd3ff;outline-offset:2px}
.gl3-check[data-invalid] .gl3-check-box{border-color:rgba(255,128,148,.85);box-shadow:0 0 0 3px rgba(255,100,130,.14)}

.gl3-link{padding:0;border:0;background:none;color:#4db4f7;font:700 10.3px/16px var(--gl3-font);cursor:pointer;transition:color .2s,text-shadow .2s}
.gl3-link:hover{color:#9ad8ff;text-shadow:0 0 12px rgba(90,190,255,.7);text-decoration:underline;text-underline-offset:3px}
.gl3-link--muted{color:rgba(255,255,255,.6);font-weight:500;text-shadow:none}
.gl3-link--muted:hover{color:#fff;text-shadow:none}
.gl3-stage button:focus-visible{outline:2px solid #8fd3ff;outline-offset:2px;border-radius:6px}

.gl3-primary{position:relative;display:flex;align-items:center;justify-content:center;gap:7px;width:100%;height:35px;border:0;border-radius:9px;background:linear-gradient(180deg,#86daff 0%,#47b6fb 50%,#2aa0f0 100%);color:#07243f;font:700 12px/1 var(--gl3-font);letter-spacing:.005em;cursor:pointer;box-shadow:0 7px 20px rgba(30,150,255,.34),inset 0 1px 0 rgba(255,255,255,.6),inset 0 -1px 0 rgba(0,60,130,.25);transition:filter .2s,transform .2s,box-shadow .2s}
.gl3-primary:hover:not(:disabled){filter:brightness(1.1) saturate(1.05);box-shadow:0 9px 26px rgba(40,165,255,.5),inset 0 1px 0 rgba(255,255,255,.7),inset 0 -1px 0 rgba(0,60,130,.25)}
.gl3-primary:active:not(:disabled){transform:translateY(1px) scale(.996)}
.gl3-primary:disabled{cursor:progress}
.gl3-primary[data-status="done"]{background:linear-gradient(180deg,#7be3c0,#2fbf94);box-shadow:0 7px 20px rgba(40,200,150,.3),inset 0 1px 0 rgba(255,255,255,.6)}
.gl3-spinner{width:12px;height:12px;border:2px solid rgba(7,36,63,.28);border-top-color:#07243f;border-radius:50%;animation:gl3-spin .7s linear infinite}

.gl3-divider{display:flex;align-items:center;gap:11px;margin-block:2px;font-size:7.8px;line-height:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:rgba(170,200,232,.3)}
.gl3-divider::before,.gl3-divider::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(130,180,235,.2))}
.gl3-divider::after{background:linear-gradient(270deg,transparent,rgba(130,180,235,.2))}
.gl3-socials{display:flex;justify-content:center;gap:11px}
.gl3-social{display:inline-flex;flex:0 1 116px;align-items:center;justify-content:center;gap:7px;height:29px;border:1px solid rgba(255,255,255,.085);border-radius:9px;background:rgba(255,255,255,.045);color:rgba(255,255,255,.86);font:500 10.2px/1 var(--gl3-font);cursor:pointer;transition:background .2s,border-color .2s,transform .2s,box-shadow .2s}
.gl3-social:hover:not(:disabled){background:rgba(255,255,255,.1);border-color:rgba(150,205,255,.4);transform:translateY(-1px);box-shadow:0 6px 16px rgba(0,0,0,.28),0 0 14px rgba(70,160,255,.14)}
.gl3-social:active:not(:disabled){transform:translateY(0)}
.gl3-switch{margin:0;text-align:center;font-size:10.3px;line-height:16px;font-weight:500;color:rgba(255,255,255,.56)}
.gl3-stage button:disabled{cursor:default}

/* Static thumbnail typography keeps the real layout. */
.gl3-static-content .gl3-body{gap:9px}
.gl3-static-content .gl3-body>div>.gl3-label{display:block}
.gl3-static.gl3-field{display:flex}
.gl3-static .gl3-input{display:flex;align-items:center;color:rgba(255,255,255,.28)}
.gl3-static-content .gl3-body>*+*{margin-top:0}
.gl3-static-content .gl3-primary{cursor:default}

/* Content choreography. */
.gl3-content[data-state="leaving"] .gl3-row{animation:gl3-out 160ms cubic-bezier(.4,0,.6,1) both;animation-delay:calc(var(--gl3-r) * 4ms)}
.gl3-content[data-state="entering"] .gl3-row{animation:gl3-in 420ms cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--gl3-i) * 32ms)}
.gl3-content[data-state="leaving"]{pointer-events:none}

/* Liquid-glass switch: tabs light up, meet in the middle, ripple, then return. */
.gl3-stage[data-phase="run"] .gl3-tab{animation:gl3-travel 1100ms linear both}
.gl3-stage[data-phase="run"] .gl3-tab-glass{animation:gl3-tab-glass 1100ms linear both}
.gl3-stage[data-phase="run"] .gl3-tab-blue{animation:gl3-tab-blue 1100ms linear both}
.gl3-stage[data-phase="run"] .gl3-frost{animation:gl3-frost 1450ms ease-in-out both}
.gl3-stage[data-phase="run"] .gl3-tint{animation:gl3-tint 1450ms ease-in-out both}
.gl3-stage[data-phase="run"] .gl3-ring{animation:gl3-ring 660ms cubic-bezier(.1,.7,.2,1) both}
.gl3-stage[data-phase="run"] .gl3-ring--a{animation-delay:540ms}
.gl3-stage[data-phase="run"] .gl3-ring--b{animation-delay:620ms;animation-duration:620ms}
.gl3-stage[data-phase="run"] .gl3-lens{animation:gl3-lens 760ms cubic-bezier(.2,.6,.2,1) 640ms both}
.gl3-stage[data-phase="run"] .gl3-slit{animation:gl3-slit 340ms ease-out 680ms both}

@keyframes gl3-travel{
  0%,8.6%{translate:0 0;scale:1;animation-timing-function:cubic-bezier(.3,.05,.2,1)}
  49.5%,63.2%{translate:calc(var(--gl3-s) * var(--gl3-mx)) calc(var(--gl3-s) * var(--gl3-my));scale:1.1;animation-timing-function:cubic-bezier(.3,.4,.5,1)}
  100%{translate:0 0;scale:1}
}
@keyframes gl3-tab-glass{
  0%,5%{opacity:1;filter:none}
  9%,70%{opacity:0;filter:none}
  80%{opacity:1;filter:brightness(2.6) saturate(.5)}
  90%{filter:brightness(1.8) saturate(.6)}
  100%{opacity:1;filter:none}
}
@keyframes gl3-tab-blue{
  0%{opacity:0}
  7%{opacity:1}
  70%{opacity:1}
  84%,100%{opacity:0}
}
@keyframes gl3-tint{0%{opacity:1}11%,60%{opacity:.2}100%{opacity:1}}
@keyframes gl3-frost{0%{opacity:0}11%,60%{opacity:1}100%{opacity:0}}
@keyframes gl3-ring{
  0%{opacity:0;transform:scale(.5)}
  14%{opacity:1}
  100%{opacity:0;transform:scale(3.35)}
}
@keyframes gl3-lens{
  0%{opacity:0;transform:scale(.35)}
  28%{opacity:1}
  100%{opacity:0;transform:scale(1.85)}
}
@keyframes gl3-slit{0%{opacity:0;transform:scaleX(.4)}30%{opacity:.9}100%{opacity:0;transform:scaleX(1.25)}}
@keyframes gl3-out{from{opacity:1;filter:blur(0);transform:none}to{opacity:0;filter:blur(9px);transform:scale(.985)}}
@keyframes gl3-in{from{opacity:0;filter:blur(10px);transform:translateY(7px) scale(.985)}to{opacity:1;filter:blur(0);transform:none}}
@keyframes gl3-spin{to{rotate:360deg}}

/* Thumbnail states: the same pieces, held at the two key moments. */
.gl3-thumbnail .gl3-tab{transition:translate .9s cubic-bezier(.2,.7,.2,1),scale .9s cubic-bezier(.2,.7,.2,1)}
.gl3-thumbnail .gl3-tab-glass,.gl3-thumbnail .gl3-tab-blue,.gl3-thumbnail .gl3-tint,.gl3-thumbnail .gl3-frost,.gl3-thumbnail .gl3-static-content{transition:opacity .6s ease,filter .6s ease}
.gl3-thumbnail[data-merged="true"] .gl3-tab{translate:calc(var(--gl3-s) * var(--gl3-mx)) calc(var(--gl3-s) * var(--gl3-my));scale:1.1}
.gl3-thumbnail[data-merged="true"] .gl3-tab-glass{opacity:0}
.gl3-thumbnail[data-merged="true"] .gl3-tab-blue{opacity:1}
.gl3-thumbnail[data-merged="true"] .gl3-tint{opacity:.2}
.gl3-thumbnail[data-merged="true"] .gl3-frost{opacity:1}
.gl3-thumbnail[data-merged="true"] .gl3-static-content{opacity:0;filter:blur(8px)}
.gl3-thumbnail[data-merged="true"] .gl3-ring--a{opacity:.9;transform:scale(1.35);animation:gl3-pulse 2.2s ease-in-out infinite}
.gl3-thumbnail[data-merged="true"] .gl3-ring--b{opacity:.55;transform:scale(2.15)}
.gl3-thumbnail[data-merged="true"] .gl3-lens{opacity:.8;transform:scale(.9)}
@keyframes gl3-pulse{0%,100%{transform:scale(1.25);opacity:.9}50%{transform:scale(1.55);opacity:.55}}

@container (max-width:400px){
  .gl3-card{height:448px}
  .gl3-pair{gap:10px}
  .gl3-header{padding-left:22px}
  .gl3-content{padding-inline:26px}
}

@media (prefers-reduced-motion: reduce){
  .gl3-stage[data-phase="run"] .gl3-tab,
  .gl3-stage[data-phase="run"] .gl3-tab-glass,
  .gl3-stage[data-phase="run"] .gl3-tab-blue,
  .gl3-stage[data-phase="run"] .gl3-tint,
  .gl3-stage[data-phase="run"] .gl3-frost,
  .gl3-stage[data-phase="run"] .gl3-ring,
  .gl3-stage[data-phase="run"] .gl3-lens,
  .gl3-stage[data-phase="run"] .gl3-slit{animation:none}
  .gl3-content[data-state="leaving"] .gl3-row{animation:gl3-fade-out 120ms linear both}
  .gl3-content[data-state="entering"] .gl3-row{animation:gl3-fade-in 220ms linear both;animation-delay:0ms}
  .gl3-spinner{animation-duration:1.6s}
  .gl3-thumbnail .gl3-tab{transition:none}
}
@keyframes gl3-fade-out{to{opacity:0}}
@keyframes gl3-fade-in{from{opacity:0}to{opacity:1}}
`;
