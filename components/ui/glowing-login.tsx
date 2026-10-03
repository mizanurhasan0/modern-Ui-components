"use client";

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
    <svg className="gl-symbol" width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
      <div className="gl-field-group" key={field}>
        <div className="gl-field" data-invalid={Boolean(errors[field])}>
          <label className="gl-sr-only" htmlFor={`${id}-${field}`}>{label}</label>
          <input
            id={`${id}-${field}`}
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
            <button className="gl-reveal" type="button" aria-label={revealed ? "Hide password" : "Show password"} aria-pressed={revealed} disabled={pending} onClick={() => setRevealed((current) => !current)}>
              <EyeIcon revealed={revealed} />
            </button>
          )}
        </div>
        {errors[field] && <p className="gl-field-error" id={`${id}-${field}-error`}>{errors[field]}</p>}
      </div>
    );
  }

  const isDemo = mode === "login" ? !onSubmit : mode === "signup" ? !onSignUp : !onForgotPassword;
  const successTitle = isDemo ? "Demo complete" : mode === "reset" ? "Check your inbox" : mode === "signup" ? "Account created" : "Welcome back";
  const successDescription = isDemo
    ? mode === "login" ? "This preview doesn’t sign you into an account." : mode === "signup" ? "No account was created in this preview." : "No reset email was sent in this preview."
    : mode === "reset" ? "If an account matches this email, you’ll receive a reset link." : mode === "signup" ? "Your new account is ready." : "You’re signed in.";

  return (
    <section className={`gl-stage relative flex min-h-[640px] w-full items-center justify-center overflow-hidden ${className}`} aria-label="Glowing animated login form">
      <style>{STYLES}</style>
      <div
        className="gl-box"
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
        <div className="gl-frame" aria-hidden="true" />
        <div className="gl-inner">
          <div className="gl-content" data-completed={completed}>
            <h2 className="gl-title">
              <button
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
            <div className="gl-body" id={`${id}-form`} inert={!expanded} aria-hidden={!expanded}>
              {completed ? (
                <div className="gl-success">
                  <span className="gl-success-mark" aria-hidden="true">✓</span>
                  <h3 tabIndex={-1} ref={successHeading}>{successTitle}</h3>
                  <p>{successDescription}</p>
                  <button className="gl-submit" type="button" onClick={() => changeMode("login")}>Back to login</button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate aria-busy={pending}>
                  {mode === "reset" && <p className="gl-reset-note">Enter your email to reset your password.</p>}
                  <div className="gl-fields">
                    {mode !== "reset" && renderField("username")}
                    {mode !== "login" && renderField("email")}
                    {mode !== "reset" && renderField("password")}
                  </div>
                  <button className="gl-submit" type="submit" disabled={pending}>
                    {pending ? "Please wait…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
                  </button>
                  {submitError && <p className="gl-submit-error" role="alert">{submitError}</p>}
                  <div className="gl-links">
                    {mode === "login" ? (
                      <>
                        <button type="button" disabled={pending} onClick={() => changeMode("reset")}>Forgot Password</button>
                        <button type="button" disabled={pending} onClick={() => changeMode("signup")}>Sign up</button>
                      </>
                    ) : <button type="button" disabled={pending} onClick={() => changeMode("login")}>Back to login</button>}
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
    <div className={`gl-stage gl-thumbnail relative flex h-full min-h-[260px] w-full items-center justify-center overflow-hidden ${className}`} aria-hidden="true" inert>
      <style>{STYLES}</style>
      <div className="gl-box" data-open={previewStep % 3 !== 1}>
        <div className="gl-frame" />
        <div className="gl-inner">
          <div className="gl-content">
            <div className="gl-title"><span><LoginSymbol /><span>Login</span><LoginSymbol heart /></span></div>
            <div className="gl-body">
              <div className="gl-fields"><span className="gl-static-field">{previewStep % 3 === 2 ? "alex.design" : "Username"}</span><span className="gl-static-field">{previewStep % 3 === 2 ? "••••••••" : "Password"}</span></div>
              <span className="gl-submit">Sign in</span>
              <div className="gl-links"><span>Forgot Password</span><span>Sign up</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STYLES = `
.gl-stage { container-type: inline-size; min-width: 0; color: #fff; background: #252431; font-family: "Poppins", Arial, sans-serif; isolation: isolate; }
.gl-stage *, .gl-stage *::before, .gl-stage *::after { box-sizing: border-box; }
.gl-stage button, .gl-stage input { font-family: inherit; }
.gl-box { position: relative; width: 400px; max-width: calc(100% - 36px); height: 200px; flex-shrink: 0; overflow: hidden; border-radius: 20px; background: #25252b; box-shadow: 0 18px 45px #000a; transition: width .5s, height .5s; }
.gl-box[data-open="true"] { width: 450px; height: 500px; }
.gl-box::before, .gl-box::after { content: ""; position: absolute; left: 50%; top: 50%; width: 800px; height: 800px; background: repeating-conic-gradient(from 0deg, #45f3ff 0deg 20deg, transparent 21deg 179deg, #45f3ff 180deg 200deg, transparent 201deg 359deg); animation: gl-border-turn 4s linear infinite; }
.gl-box::after { background: repeating-conic-gradient(from 0deg, #ff2770 0deg 20deg, transparent 21deg 179deg, #ff2770 180deg 200deg, transparent 201deg 359deg); animation-delay: -1s; }
.gl-frame { position: absolute; z-index: 1; inset: 4px; border: 6px solid #25252d; border-radius: 16px; background: #2d2d39; box-shadow: inset 0 0 4px #0003; }
.gl-inner { position: absolute; z-index: 2; inset: 60px; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: #0003; box-shadow: inset 0 10px 20px #0008; border-bottom: 2px solid #ffffff80; transition: inset .5s; overflow: hidden; }
.gl-box[data-open="true"] .gl-inner { inset: 40px; }
.gl-content { position: absolute; left: 50%; top: 50%; width: 260px; max-width: calc(100% - 42px); transform: translate(-50%, -15px); transition: transform .5s; }
.gl-box[data-open="true"] .gl-content { transform: translate(-50%, -50%); }
.gl-title { display: flex; justify-content: center; margin: 0 0 23px; color: #fff; font-size: 24px; line-height: 30px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px; white-space: nowrap; }
.gl-title > button, .gl-title > span { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; letter-spacing: inherit; text-transform: inherit; }
.gl-title > button { cursor: pointer; }
.gl-symbol { flex-shrink: 0; color: #ff2770; filter: drop-shadow(0 0 6px #ff2770) drop-shadow(0 0 12px #ff277066); }
.gl-fields { display: grid; gap: 19px; }
.gl-field { display: flex; align-items: center; position: relative; height: 47px; border: 2px solid #efeff7; border-radius: 999px; background: #00000008; transition: border-color .2s, box-shadow .2s; }
.gl-field:focus-within { border-color: #45f3ff; box-shadow: 0 0 0 2px #45f3ff16; }
.gl-field[data-invalid="true"] { border-color: #ff7b9b; }
.gl-field input { min-width: 0; width: 100%; height: 100%; border: 0; outline: 0; border-radius: inherit; padding: 0 19px; background: transparent; color: #fff; font-size: 16px; line-height: 1.3; }
.gl-field input[type="password"], .gl-field:has(.gl-reveal) input { padding-right: 44px; }
.gl-field input::placeholder { color: #aaa7b3; opacity: 1; }
.gl-field input:focus-visible { outline: none; }
.gl-field input:-webkit-autofill { -webkit-text-fill-color: #fff; box-shadow: 0 0 0 100px #25242f inset; }
.gl-reveal { display: grid; place-items: center; flex-shrink: 0; width: 40px; height: 40px; position: absolute; right: 2px; border: 0; border-radius: 50%; background: transparent; color: #c4c0ce; cursor: pointer; opacity: 0; transition: opacity .2s; }
.gl-field:hover .gl-reveal, .gl-field:focus-within .gl-reveal { opacity: 1; }
.gl-submit { display: flex; width: 100%; min-height: 44px; align-items: center; justify-content: center; margin-top: 20px; border: 0; border-radius: 999px; padding: 10px 16px; background: #45f3ff; color: #17232a; font-size: 16px; line-height: 1.4; font-weight: 500; text-align: center; transition: box-shadow .25s, background .25s; }
.gl-stage button.gl-submit { cursor: pointer; }
.gl-stage button.gl-submit:hover { box-shadow: 0 0 10px #45f3ff, 0 0 28px #45f3ff77; background: #65f6ff; }
.gl-links { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 16px; }
.gl-links > button, .gl-links > span { padding: 4px 0; border: 0; background: transparent; color: #f4f0fa; font-size: 15px; line-height: 1.5; text-align: left; white-space: nowrap; }
.gl-links > :nth-child(2) { color: #ff2770; font-weight: 600; }
.gl-links button:hover { text-decoration: underline; text-underline-offset: 4px; }
.gl-stage button:focus-visible { outline: 2px solid #45f3ff; outline-offset: 4px; }
.gl-stage button:disabled { opacity: .55; cursor: wait; }
.gl-field input:disabled { opacity: .6; }
.gl-field-error { margin: 6px 8px 0; color: #ffa0b8; font-size: 11px; line-height: 1.35; }
.gl-submit-error { margin: 10px 2px 0; color: #ffa0b8; font-size: 12px; line-height: 1.5; }
.gl-reset-note { margin: 0 0 20px; color: #c7c3d0; font-size: 13px; line-height: 1.6; text-align: center; }
.gl-success { text-align: center; }
.gl-success-mark { display: grid; place-items: center; width: 50px; height: 50px; margin: 8px auto 18px; border: 1px solid #45f3ff80; border-radius: 50%; background: #45f3ff10; color: #45f3ff; font-size: 26px; }
.gl-success h3 { margin: 0; color: #fff; font-size: 19px; font-weight: 500; }
.gl-success h3:focus { outline: none; }
.gl-success p { margin: 14px 0 25px; color: #c7c3d0; font-size: 13px; line-height: 1.7; }
.gl-static-field { display: flex; align-items: center; height: 47px; padding: 0 19px; border: 2px solid #efeff7; border-radius: 999px; color: #aaa7b3; font-size: 16px; }
.gl-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.gl-thumbnail .gl-box { transform: scale(.49); max-width: none; }
.gl-thumbnail .gl-box::before { animation: none; transform: translate(-50%, -50%) rotate(12deg); }
.gl-thumbnail .gl-box::after { animation: none; transform: translate(-50%, -50%) rotate(102deg); }
@keyframes gl-border-turn { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
@media (hover: none) { .gl-reveal { opacity: 1; } }
@container (max-width: 480px) {
  .gl-stage:not(.gl-thumbnail) { min-height: 600px; }
  .gl-stage:not(.gl-thumbnail) .gl-box { max-width: calc(100% - 28px); }
  .gl-stage:not(.gl-thumbnail) .gl-inner { inset: 52px 30px; }
  .gl-stage:not(.gl-thumbnail) .gl-box[data-open="true"] .gl-inner { inset: 34px 24px; }
  .gl-stage:not(.gl-thumbnail) .gl-content { max-width: calc(100% - 32px); }
  .gl-stage:not(.gl-thumbnail) .gl-title { font-size: clamp(16px, 5cqw, 24px); letter-spacing: 2px; }
  .gl-stage:not(.gl-thumbnail) .gl-title > button { gap: 8px; }
  .gl-stage:not(.gl-thumbnail) .gl-symbol { width: 20px; height: 20px; }
  .gl-stage:not(.gl-thumbnail) .gl-links { flex-wrap: wrap; gap: 4px 12px; }
  .gl-stage:not(.gl-thumbnail) .gl-links > button { font-size: 13px; min-height: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  .gl-stage *, .gl-stage *::before, .gl-stage *::after { animation: none !important; transition: none !important; }
  .gl-box::before { transform: translate(-50%, -50%) rotate(12deg); }
  .gl-box::after { transform: translate(-50%, -50%) rotate(102deg); }
}
`;
