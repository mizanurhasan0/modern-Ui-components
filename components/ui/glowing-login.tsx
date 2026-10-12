"use client";

import { ComponentStyles } from "./component-styles";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

export interface GlowingLoginValues {
  username: string;
  password: string;
}

export interface GlowingSignUpValues extends GlowingLoginValues {
  email: string;
}

export interface GlowingLoginProps {
  className?: string;
  defaultExpanded?: boolean;
  /** Resolve after authentication succeeds, or reject to keep the form open. */
  onSubmit?: (values: GlowingLoginValues) => void | Promise<void>;
  onSignUp?: (values: GlowingSignUpValues) => void | Promise<void>;
  onForgotPassword?: (email: string) => void | Promise<void>;
}

type Mode = "login" | "signup" | "reset";
type Field = keyof GlowingSignUpValues;
type FieldErrors = Partial<Record<Field, string>>;
const EMPTY_VALUES: GlowingSignUpValues = { username: "", email: "", password: "" };
const TITLES: Record<Mode, string> = { login: "Login", signup: "Sign up", reset: "Reset" };

function LoginSymbol({ heart = false }: { heart?: boolean }) {
  return (
    <svg className="shrink-0 text-[#ff2770] [filter:drop-shadow(0_0_6px_#ff2770)_drop-shadow(0_0_12px_#ff277066)]" width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {heart ? (
        <path d="M12 21s-9-5.3-9-12.1C3 5.5 5.3 3 8.4 3c1.5 0 2.8.7 3.6 1.8C12.8 3.7 14.1 3 15.6 3 18.7 3 21 5.5 21 8.9 21 15.7 12 21 12 21Z" />
      ) : (
        <>
          <path d="M15 2h4a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3h-4v-3h4V5h-4V2Z" />
          <path d="m10 5 7 7-7 7v-4H2V9h8V5Z" />
        </>
      )}
    </svg>
  );
}

function EyeIcon({ revealed }: { revealed: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {revealed && <path d="m3 3 18 18" />}
    </svg>
  );
}

/** A single-file demo. Credentials stay in memory unless a callback is supplied. */
export default function GlowingLogin({
  className = "",
  defaultExpanded = false,
  onSubmit,
  onSignUp,
  onForgotPassword,
}: GlowingLoginProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [mode, setMode] = useState<Mode>("login");
  const [values, setValues] = useState<GlowingSignUpValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [completed, setCompleted] = useState(false);
  const fields = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});
  const successHeading = useRef<HTMLHeadingElement>(null);
  const hovered = useRef(false);
  const pinned = useRef(defaultExpanded);
  const busy = useRef(false);
  const mounted = useRef(false);
  const focusAfterNavigation = useRef(false);
  const id = useId();

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!focusAfterNavigation.current) return;
    focusAfterNavigation.current = false;
    if (completed) successHeading.current?.focus({ preventScroll: true });
    else fields.current[mode === "reset" ? "email" : "username"]?.focus({ preventScroll: true });
  }, [mode, completed]);

  function changeMode(nextMode: Mode) {
    if (busy.current) return;
    focusAfterNavigation.current = true;
    pinned.current = true;
    setExpanded(true);
    setMode(nextMode);
    setCompleted(false);
    setRevealed(false);
    setErrors({});
    setSubmitError("");
    setValues((current) => ({ ...current, password: "" }));
  }

  function updateField(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const clean = { ...values, username: values.username.trim(), email: values.email.trim() };
    const nextErrors: FieldErrors = {};

    if (mode !== "reset" && !clean.username) nextErrors.username = "Enter your username.";
    if (mode !== "login" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (mode !== "reset" && !clean.password) nextErrors.password = "Enter your password.";
    else if (mode === "signup" && clean.password.length < 8) nextErrors.password = "Use at least 8 characters.";

    setErrors(nextErrors);
    const firstError = (Object.keys(nextErrors) as Field[])[0];
    if (firstError) {
      fields.current[firstError]?.focus();
      return;
    }

    busy.current = true;
    pinned.current = true;
    setPending(true);
    setSubmitError("");
    try {
      if (mode === "login") await onSubmit?.({ username: clean.username, password: clean.password });
      else if (mode === "signup") await onSignUp?.(clean);
      else await onForgotPassword?.(clean.email);

      if (mounted.current) {
        focusAfterNavigation.current = true;
        setValues((current) => ({ ...current, password: "" }));
        setRevealed(false);
        setCompleted(true);
      }
    } catch {
      if (mounted.current) setSubmitError("That didn’t work. Check your details and try again.");
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  function renderField(field: Field) {
    const label = field === "username" ? "Username" : field === "email" ? "Email address" : "Password";
    const isPassword = field === "password";

    return (
      <div key={field}>
        <div className={FIELD} data-invalid={Boolean(errors[field])}>
          <label className="sr-only" htmlFor={`${id}-${field}`}>{label}</label>
          <input
            id={`${id}-${field}`}
            className={`${INPUT} ${isPassword ? "pr-[44px]" : "pr-[19px]"}`}
            ref={(element) => { fields.current[field] = element; }}
            name={field}
            type={isPassword ? (revealed ? "text" : "password") : field === "email" ? "email" : "text"}
            autoComplete={isPassword ? (mode === "signup" ? "new-password" : "current-password") : field === "email" ? "email" : "username"}
            autoCapitalize="none"
            spellCheck={false}
            placeholder={label}
            value={values[field]}
            maxLength={field === "email" ? 254 : field === "password" ? 128 : 80}
            required
            aria-invalid={Boolean(errors[field])}
            aria-describedby={errors[field] ? `${id}-${field}-error` : undefined}
            disabled={pending}
            onChange={(event) => updateField(field, event.target.value)}
          />
          {isPassword && (
            <button className={REVEAL} type="button" aria-label={revealed ? "Hide password" : "Show password"} aria-pressed={revealed} disabled={pending} onClick={() => setRevealed((current) => !current)}>
              <EyeIcon revealed={revealed} />
            </button>
          )}
        </div>
        {errors[field] && <p className="mx-2 mt-1.5 text-[11px] leading-[1.35] text-[#ffa0b8]" id={`${id}-${field}-error`}>{errors[field]}</p>}
      </div>
    );
  }

  const isDemo = mode === "login" ? !onSubmit : mode === "signup" ? !onSignUp : !onForgotPassword;
  const successTitle = isDemo ? "Demo complete" : mode === "reset" ? "Check your inbox" : mode === "signup" ? "Account created" : "Welcome back";
  const successDescription = isDemo
    ? mode === "login" ? "This preview doesn’t sign you into an account." : mode === "signup" ? "No account was created in this preview." : "No reset email was sent in this preview."
    : mode === "reset" ? "If an account matches this email, you’ll receive a reset link." : mode === "signup" ? "Your new account is ready." : "You’re signed in.";

  return (
    <section className={`gl-stage ${STAGE} min-h-[640px] [@container(max-width:480px)]:min-h-[600px] ${className}`} aria-label="Glowing animated login form">
      <ComponentStyles css={STYLES} />
      <div
        className={`${BOX} max-w-[calc(100%-36px)] [@container(max-width:480px)]:max-w-[calc(100%-28px)]`}
        data-open={expanded}
        onPointerEnter={(event) => {
          if (event.pointerType !== "mouse") return;
          hovered.current = true;
          setExpanded(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== "mouse") return;
          hovered.current = false;
          if (!pinned.current && !event.currentTarget.contains(document.activeElement)) setExpanded(false);
        }}
        onFocusCapture={(event) => {
          if (event.target.matches(":focus-visible") || event.target.tagName === "INPUT") setExpanded(true);
        }}
        onBlurCapture={(event) => {
          if (!hovered.current && !pinned.current && !event.currentTarget.contains(event.relatedTarget)) setExpanded(false);
        }}
      >
        <div className={FRAME} aria-hidden="true" />
        <div className={`${INNER} [@container(max-width:480px)]:inset-[52px_30px] [@container(max-width:480px)]:group-data-[open=true]/box:inset-[34px_24px]`}>
          <div className={`${CONTENT} [@container(max-width:480px)]:max-w-[calc(100%-32px)]`} data-completed={completed}>
            <h2 className={`${TITLE} [@container(max-width:480px)]:text-[length:clamp(16px,5cqw,24px)] [@container(max-width:480px)]:tracking-[2px]`}>
              <button
                className={`${TITLE_ROW} cursor-pointer uppercase [@container(max-width:480px)]:gap-2 [@container(max-width:480px)]:[&>svg]:size-5 ${BUTTON_STATES}`}
                type="button"
                aria-label={`${expanded ? "Collapse" : "Open"} ${TITLES[mode].toLowerCase()} form`}
                aria-expanded={expanded}
                aria-controls={`${id}-form`}
                onClick={() => {
                  pinned.current = !expanded;
                  setExpanded(!expanded);
                }}
              >
                <LoginSymbol />
                <span>{TITLES[mode]}</span>
                <LoginSymbol heart />
              </button>
            </h2>
            <div id={`${id}-form`} inert={!expanded} aria-hidden={!expanded}>
              {completed ? (
                <div className="text-center">
                  <span className="mx-auto mt-2 mb-[18px] grid size-[50px] place-items-center rounded-[50%] border border-[#45f3ff80] bg-[#45f3ff10] text-[26px] text-[#45f3ff]" aria-hidden="true">✓</span>
                  <h3 className="text-[19px] font-medium text-white" tabIndex={-1} ref={successHeading}>{successTitle}</h3>
                  <p className="mt-3.5 mb-[25px] text-[13px] leading-[1.7] text-[#c7c3d0]">{successDescription}</p>
                  <button className={SUBMIT_BUTTON} type="button" onClick={() => changeMode("login")}>Back to login</button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate aria-busy={pending}>
                  {mode === "reset" && <p className="mb-5 text-center text-[13px] leading-[1.6] text-[#c7c3d0]">Enter your email to reset your password.</p>}
                  <div className={FIELDS}>
                    {mode !== "reset" && renderField("username")}
                    {mode !== "login" && renderField("email")}
                    {mode !== "reset" && renderField("password")}
                  </div>
                  <button className={SUBMIT_BUTTON} type="submit" disabled={pending}>
                    {pending ? "Please wait…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
                  </button>
                  {submitError && <p className="mx-0.5 mt-2.5 text-[12px] leading-[1.5] text-[#ffa0b8]" role="alert">{submitError}</p>}
                  <div className={`${LINKS} [@container(max-width:480px)]:flex-wrap [@container(max-width:480px)]:gap-y-1`}>
                    {mode === "login" ? (
                      <>
                        <button className={`${LINK_BUTTON} text-[#f4f0fa]`} type="button" disabled={pending} onClick={() => changeMode("reset")}>Forgot Password</button>
                        <button className={`${LINK_BUTTON} ${LINK_ACCENT}`} type="button" disabled={pending} onClick={() => changeMode("signup")}>Sign up</button>
                      </>
                    ) : <button className={`${LINK_BUTTON} text-[#f4f0fa]`} type="button" disabled={pending} onClick={() => changeMode("login")}>Back to login</button>}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A static preview, with no inputs or buttons nested inside a gallery link. */
export function GlowingLoginThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  return (
    <div className={`gl-stage gl-thumbnail ${STAGE} h-full min-h-[260px] ${className}`} aria-hidden="true" inert>
      <ComponentStyles css={STYLES} />
      <div className={`${BOX} max-w-none [transform:scale(.49)]`} data-open={previewStep % 3 !== 1}>
        <div className={FRAME} />
        <div className={INNER}>
          <div className={CONTENT}>
            <div className={TITLE}><span className={TITLE_ROW}><LoginSymbol /><span>Login</span><LoginSymbol heart /></span></div>
            <div>
              <div className={FIELDS}><span className={STATIC_FIELD}>{previewStep % 3 === 2 ? "alex.design" : "Username"}</span><span className={STATIC_FIELD}>{previewStep % 3 === 2 ? "••••••••" : "Password"}</span></div>
              <span className={SUBMIT}>Sign in</span>
              <div className={LINKS}><span className={`${LINK} text-[#f4f0fa]`}>Forgot Password</span><span className={`${LINK} ${LINK_ACCENT}`}>Sign up</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * Shared Tailwind class lists. Responsive overrides use the exact original
 * container query, `[@container(max-width:480px)]:`, and are only added to the
 * interactive component (the thumbnail is scaled and never reflows).
 */
const STAGE = "@container relative isolate flex w-full min-w-0 items-center justify-center overflow-hidden bg-[#252431] font-['Poppins',Arial,sans-serif] text-white";
const BOX = "gl-box group/box relative h-[200px] w-[400px] shrink-0 overflow-hidden rounded-[20px] bg-[#25252b] shadow-[0_18px_45px_#000a] transition-[width,height] duration-500 ease-[ease] data-[open=true]:h-[500px] data-[open=true]:w-[450px]";
const FRAME = "absolute inset-1 z-1 rounded-2xl border-6 border-[#25252d] bg-[#2d2d39] shadow-[inset_0_0_4px_#0003]";
const INNER = "absolute inset-[60px] z-2 flex items-center justify-center overflow-hidden rounded-[10px] border-b-2 border-b-[#ffffff80] bg-[#0003] shadow-[inset_0_10px_20px_#0008] transition-[inset] duration-500 ease-[ease] group-data-[open=true]/box:inset-10";
const CONTENT = "absolute top-1/2 left-1/2 w-[260px] max-w-[calc(100%-42px)] [transform:translate(-50%,-15px)] transition-[transform] duration-500 ease-[ease] group-data-[open=true]/box:[transform:translate(-50%,-50%)]";
const TITLE = "mb-[23px] flex justify-center text-[24px] leading-[30px] font-semibold tracking-[3px] whitespace-nowrap text-white uppercase";
const TITLE_ROW = "flex items-center justify-center gap-3";
const FIELDS = "grid gap-[19px]";
const FIELD = "group/field relative flex h-[47px] items-center rounded-[999px] border-2 border-[#efeff7] bg-[#00000008] transition-[border-color,box-shadow] duration-200 ease-[ease] focus-within:border-[#45f3ff] focus-within:shadow-[0_0_0_2px_#45f3ff16] data-[invalid=true]:border-[#ff7b9b]";
const INPUT = "h-full w-full min-w-0 rounded-[inherit] bg-transparent pl-[19px] text-[16px] leading-[1.3] text-white [outline:0] placeholder:text-[#aaa7b3] placeholder:opacity-100 autofill:shadow-[inset_0_0_0_100px_#25242f] autofill:[-webkit-text-fill-color:#fff] disabled:opacity-60";
const BUTTON_STATES = "disabled:cursor-wait disabled:opacity-55";
/* Shown while its field is hovered or focused (`!` beats the disabled dimming), and on touch screens unless disabled. */
const REVEAL = `absolute right-0.5 grid size-10 shrink-0 place-items-center rounded-[50%] text-[#c4c0ce] cursor-pointer opacity-0 transition-opacity duration-200 ease-[ease] ${BUTTON_STATES} [@media(hover:none)]:enabled:opacity-100 group-[:hover]/field:opacity-100! group-focus-within/field:opacity-100!`;
const SUBMIT = "mt-5 flex min-h-11 w-full items-center justify-center rounded-[999px] bg-[#45f3ff] px-4 py-2.5 text-center text-[16px] leading-[1.4] font-medium text-[#17232a] transition-[box-shadow,background] duration-[.25s] ease-[ease]";
/* `[&:hover]` (not `hover:`) keeps the original unconditional :hover, including tap-hover on touch screens. */
const SUBMIT_BUTTON = `${SUBMIT} cursor-pointer [&:hover]:bg-[#65f6ff] [&:hover]:shadow-[0_0_10px_#45f3ff,0_0_28px_#45f3ff77] ${BUTTON_STATES}`;
const LINKS = "mt-4 flex items-center justify-between gap-3";
const LINK = "py-1 text-left text-[15px] leading-[1.5] whitespace-nowrap";
const LINK_ACCENT = "font-semibold text-[#ff2770]";
const LINK_BUTTON = `${LINK} [&:hover]:underline [&:hover]:underline-offset-4 [@container(max-width:480px)]:min-h-9 [@container(max-width:480px)]:text-[13px] ${BUTTON_STATES}`;
const STATIC_FIELD = "flex h-[47px] items-center rounded-[999px] border-2 border-[#efeff7] px-[19px] text-[16px] text-[#aaa7b3]";

/*
 * Raw CSS keeps only what utilities cannot express: the conic-gradient border
 * pseudo-elements (also targeted by gallery-thumbnail.css) and their keyframes,
 * focus outlines that must stay unlayered to beat the site's global
 * :focus-visible ring, and the reduced-motion reset.
 */
const STYLES = `
.gl-box::before, .gl-box::after { content: ""; position: absolute; left: 50%; top: 50%; width: 800px; height: 800px; background: repeating-conic-gradient(from 0deg, #45f3ff 0deg 20deg, transparent 21deg 179deg, #45f3ff 180deg 200deg, transparent 201deg 359deg); animation: gl-border-turn 4s linear infinite; }
.gl-box::after { background: repeating-conic-gradient(from 0deg, #ff2770 0deg 20deg, transparent 21deg 179deg, #ff2770 180deg 200deg, transparent 201deg 359deg); animation-delay: -1s; }
.gl-thumbnail .gl-box::before { animation: none; transform: translate(-50%, -50%) rotate(12deg); }
.gl-thumbnail .gl-box::after { animation: none; transform: translate(-50%, -50%) rotate(102deg); }
.gl-stage button:focus-visible { outline: 2px solid #45f3ff; outline-offset: 4px; }
.gl-stage input:focus-visible, .gl-stage h3:focus { outline: none; }
@keyframes gl-border-turn { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .gl-stage *, .gl-stage *::before, .gl-stage *::after { animation: none !important; transition: none !important; }
  .gl-box::before { transform: translate(-50%, -50%) rotate(12deg); }
  .gl-box::after { transform: translate(-50%, -50%) rotate(102deg); }
}
`;
