"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { ComponentStyles } from "./component-styles";

export type OrbitAuthView = "login" | "signup" | "reset";
export type OrbitSocialProvider = "facebook" | "x" | "google";
export interface OrbitLoginCredentials { email: string; password: string }
export interface OrbitSignUpDetails { fullName: string; email: string; password: string }
export interface OrbitResetDetails { email: string }
export interface OrbitLoginProps {
  onLogin?: (credentials: OrbitLoginCredentials, signal: AbortSignal) => void | Promise<void>;
  onSignUp?: (details: OrbitSignUpDetails, signal: AbortSignal) => void | Promise<void>;
  onResetPassword?: (details: OrbitResetDetails, signal: AbortSignal) => void | Promise<void>;
  onSocialAuth?: (provider: OrbitSocialProvider, signal: AbortSignal) => void | Promise<void>;
  socialProviders?: readonly OrbitSocialProvider[];
  initialView?: OrbitAuthView;
  className?: string;
}

type OrbitNotice = { kind: "success" | "error"; message: string };
const SOCIAL_PROVIDERS: readonly OrbitSocialProvider[] = ["facebook", "x", "google"];
const SOCIAL_NAMES = { facebook: "Facebook", x: "X", google: "Google" } as const;

function OrbitIcon({ name }: { name: "email" | "password" | "name" }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
    {name === "email" ? <path d="M3 4h18a1 1 0 0 1 1 1v1L12 13 2 6V5a1 1 0 0 1 1-1Zm-1 4.4V19a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V8.4l-9.4 6.4a1 1 0 0 1-1.2 0L2 8.4Z" /> : name === "password" ? <path d="M7 10V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1Zm2 0h6V7a3 3 0 0 0-6 0v3Z" /> : <><circle cx="12" cy="7" r="4" /><path d="M4 21v-3a8 8 0 0 1 16 0v3H4Z" /></>}
  </svg>;
}

function OrbitTicks({ offset = 0, thumbnail = false }: { offset?: number; thumbnail?: boolean }) {
  return <svg className="ol-ticks" data-static={thumbnail} viewBox="0 0 560 560" fill="none" aria-hidden="true" focusable="false" style={thumbnail ? { transform: `rotate(${offset}deg)` } : undefined}>
    {Array.from({ length: 60 }, (_, index) => <line key={index} className="ol-tick" data-lit={index >= 45 && index < 55} x1="280" y1="12" x2="280" y2="34" strokeWidth="7" strokeLinecap="round" transform={`rotate(${index * 6} 280 280)`} />)}
  </svg>;
}

function waitForOrbitAction(action: (signal: AbortSignal) => void | Promise<void>, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => signal.removeEventListener("abort", abort);
    const abort = () => { cleanup(); reject(new DOMException("Cancelled", "AbortError")); };
    if (signal.aborted) { abort(); return; }
    signal.addEventListener("abort", abort, { once: true });
    try { Promise.resolve(action(signal)).then(() => { cleanup(); resolve(); }, (reason) => { cleanup(); reject(reason); }); }
    catch (reason) { cleanup(); reject(reason); }
  });
}

/** A warm orange login panel framed by sixty rotating radial ticks. */
export default function OrbitLogin({ onLogin, onSignUp, onResetPassword, onSocialAuth, socialProviders = SOCIAL_PROVIDERS, initialView = "login", className = "" }: OrbitLoginProps) {
  const [view, setView] = useState<OrbitAuthView>(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<OrbitNotice | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  const focusOnSwitchRef = useRef(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    mountedRef.current = true;
    const root = rootRef.current;
    let inView = true;
    const updateMotion = () => { if (root) root.dataset.running = String(inView && !document.hidden); };
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; updateMotion(); }, { threshold: .05 });
    if (root) observer?.observe(root);
    document.addEventListener("visibilitychange", updateMotion);
    updateMotion();
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", updateMotion);
    };
  }, []);
  useLayoutEffect(() => {
    if (!focusOnSwitchRef.current) return;
    focusOnSwitchRef.current = false;
    firstInputRef.current?.focus({ preventScroll: true });
  }, [view]);

  function cancel() {
    requestRef.current?.abort();
    requestRef.current = null;
    setPending(false);
  }

  function changeView(next: OrbitAuthView) {
    cancel();
    setNotice(null);
    setPassword("");
    setVisiblePassword(false);
    focusOnSwitchRef.current = true;
    setView(next);
  }

  async function runAction(action: (signal: AbortSignal) => void | Promise<void>, message: string) {
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setPending(true);
    setNotice(null);
    try {
      await waitForOrbitAction(action, controller.signal);
      if (mountedRef.current && requestRef.current === controller && !controller.signal.aborted) setNotice({ kind: "success", message });
    } catch (reason) {
      if (mountedRef.current && requestRef.current === controller && !controller.signal.aborted) setNotice({ kind: "error", message: reason instanceof Error && reason.message ? reason.message : "Something went wrong. Please try again." });
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        if (mountedRef.current) setPending(false);
      }
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) { event.currentTarget.reportValidity(); return; }
    if (view === "signup" && fullName.trim().length < 2) {
      setNotice({ kind: "error", message: "Please enter your full name using at least two characters." });
      firstInputRef.current?.focus();
      return;
    }
    if (view === "signup") {
      void runAction((signal) => onSignUp?.({ fullName: fullName.trim(), email: email.trim(), password }, signal), onSignUp ? "Account created successfully." : "Demo sign-up complete.");
    } else if (view === "reset") {
      void runAction((signal) => onResetPassword?.({ email: email.trim() }, signal), onResetPassword ? "Password reset instructions requested." : "Demo reset request complete. No email was sent.");
    } else {
      void runAction((signal) => onLogin?.({ email: email.trim(), password }, signal), onLogin ? "Login complete." : "Demo login complete.");
    }
  }

  return <section ref={rootRef} className={`orbit-login relative flex w-full items-center justify-center ${className}`} aria-label="Orbit authentication">
    <ComponentStyles css={ORBIT_LOGIN_STYLES} />
    <div className="ol-stage"><div className="ol-dial"><OrbitTicks /></div>
      <div className="ol-panel">
        <h2 id={`${id}-title`}>{view === "signup" ? "SIGN UP" : view === "reset" ? "RESET PASSWORD" : "LOGIN"}</h2>
        <form aria-labelledby={`${id}-title`} onSubmit={submit}>
          <fieldset disabled={pending} className="ol-fields">
            {view === "signup" && <label className="ol-field"><span className="ol-sr-only">Full name</span><input ref={firstInputRef} name="fullName" type="text" autoComplete="name" placeholder="Full Name" required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} /><span className="ol-field-icon"><OrbitIcon name="name" /></span></label>}
            <label className="ol-field"><span className="ol-sr-only">Email address</span><input ref={view === "signup" ? undefined : firstInputRef} name="email" type="email" autoComplete="email" placeholder="Email" required value={email} onChange={(event) => setEmail(event.target.value)} /><span className="ol-field-icon"><OrbitIcon name="email" /></span></label>
            {view !== "reset" && <label className="ol-field"><span className="ol-sr-only">Password</span><input name="password" aria-label="Password" type={visiblePassword ? "text" : "password"} autoComplete={view === "signup" ? "new-password" : "current-password"} placeholder="Password" required minLength={view === "signup" ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} /><button className="ol-field-icon ol-password-toggle" type="button" aria-label={visiblePassword ? "Hide password" : "Show password"} aria-pressed={visiblePassword} onClick={() => setVisiblePassword((visible) => !visible)}><OrbitIcon name="password" /></button></label>}
          </fieldset>
          {view === "login" && <button className="ol-forgot" type="button" onClick={() => changeView("reset")}>Forget Your Password ?</button>}
          {view === "reset" && <p className="ol-reset-copy">Enter your email to request a password reset.</p>}
          <button className="ol-submit" type="submit" disabled={pending} aria-busy={pending}>{pending ? "Please wait…" : view === "signup" ? "CREATE ACCOUNT" : view === "reset" ? "SEND RESET LINK" : "LOGIN"}</button>
        </form>
        {view === "login" && socialProviders.length > 0 && <div className="ol-social"><p>log in with</p><div>{socialProviders.map((provider) => <button key={provider} className={`ol-social-button ol-${provider}`} type="button" disabled={pending} aria-label={`Continue with ${SOCIAL_NAMES[provider]}`} onClick={() => void runAction((signal) => onSocialAuth?.(provider, signal), onSocialAuth ? `${SOCIAL_NAMES[provider]} sign-in complete.` : `${SOCIAL_NAMES[provider]} selected in this local demo.`)}>{provider === "facebook" ? "F" : provider === "google" ? "G" : "X"}</button>)}</div></div>}
        <button className="ol-switch" type="button" onClick={() => changeView(view === "login" ? "signup" : "login")}>{view === "login" ? "Sign Up" : "Back to Login"}</button>
        {notice && <p className="ol-notice" data-kind={notice.kind} role={notice.kind === "error" ? "alert" : "status"}>{notice.message}</p>}
        {pending && <button className="ol-cancel" type="button" onClick={cancel}>Cancel</button>}
      </div>
    </div>
  </section>;
}

/** Inert frames mirror the real panel while the homepage controls their playback. */
export function OrbitLoginThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.max(0, Math.floor(previewStep)) % 6 : 0;
  const signup = step === 4;
  const reset = step === 5;
  return <div className={`orbit-login ol-thumbnail ${className}`} aria-hidden="true" inert><ComponentStyles css={ORBIT_LOGIN_STYLES} /><div className="ol-stage"><div className="ol-dial"><OrbitTicks thumbnail offset={step * 54} /></div><div className="ol-panel"><h3>{signup ? "SIGN UP" : reset ? "RESET PASSWORD" : "LOGIN"}</h3><div className="ol-fields">
    {signup && <span className="ol-field"><span>Full Name</span><span className="ol-field-icon"><OrbitIcon name="name" /></span></span>}
    <span className="ol-field" data-preview-active={step === 1}><span>{step >= 1 && step <= 3 ? "hello@example.com" : "Email"}</span><span className="ol-field-icon"><OrbitIcon name="email" /></span></span>
    {!reset && <span className="ol-field" data-preview-active={step === 2}><span>{step === 2 || step === 3 ? "••••••••" : "Password"}</span><span className="ol-field-icon"><OrbitIcon name="password" /></span></span>}
  </div>{!signup && !reset && <span className="ol-forgot">Forget Your Password ?</span>}<span className="ol-submit" data-preview-active={step === 3}>{signup ? "CREATE ACCOUNT" : reset ? "SEND RESET LINK" : "LOGIN"}</span>{!signup && !reset && <div className="ol-social"><p>log in with</p><div>{SOCIAL_PROVIDERS.map((provider) => <span key={provider} className={`ol-social-button ol-${provider}`}>{provider === "facebook" ? "F" : provider === "google" ? "G" : "X"}</span>)}</div></div>}<span className="ol-switch">{signup || reset ? "Back to Login" : "Sign Up"}</span></div></div></div>;
}

const ORBIT_LOGIN_STYLES = `
.orbit-login{container:orbit-login / inline-size;position:relative;isolation:isolate;width:100%;min-width:0;overflow:hidden;background:linear-gradient(135deg,#1e293b,#263b49);color:#cbd2db;font-family:Arial,Helvetica,sans-serif}
.orbit-login *{box-sizing:border-box}
.orbit-login :where(button,input){font-family:inherit}
.ol-stage{position:relative;display:flex;align-items:center;justify-content:center;width:100%;min-height:640px;padding:70px 24px}
.ol-dial{position:absolute;left:50%;top:50%;width:560px;aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none}
.ol-ticks{display:block;width:100%;height:100%;overflow:visible;transform-origin:center;animation:ol-orbit-turn 18s linear infinite}
.ol-ticks[data-static=true]{animation:none}
.ol-tick{stroke:#4a5f7f;opacity:.65}
.ol-tick[data-lit=true]{stroke:#ffa500;opacity:1;filter:drop-shadow(0 0 6px #ffa500b3)}
.ol-panel{position:relative;z-index:1;width:280px;max-width:100%;padding:30px 28px 32px;border-radius:20px;background:rgba(29,42,56,.78);box-shadow:0 20px 40px #0005;backdrop-filter:blur(4px)}
.ol-panel h2,.ol-panel h3{margin:0 0 25px;color:#ffbc3c;font-size:27px;font-weight:600;line-height:1.2;letter-spacing:1px;text-align:center}
.ol-fields{display:flex;flex-direction:column;gap:20px;min-width:0;padding:0;margin:0;border:0}
.ol-field{position:relative;display:flex;align-items:center;width:100%;height:38px;padding:0;border:1px solid #ffffff40;border-radius:25px;background:#ffffff1a;transition:border-color .2s,box-shadow .2s}
.ol-field:focus-within,.ol-field[data-preview-active=true]{border-color:#ffbc3c;box-shadow:0 0 12px #ffa50033}
.ol-field input{display:block;width:100%;height:100%;padding:10px 38px 10px 13px;border:0;border-radius:inherit;background:transparent;color:#fff;font-size:12px;line-height:1;outline:0}
.ol-field input::placeholder{color:#cbd2db;opacity:1}
.ol-fields:disabled{opacity:.7}
.ol-field-icon{position:absolute;right:12px;top:50%;display:grid;place-items:center;width:17px;height:20px;transform:translateY(-50%);color:#b7c1ce}
.ol-field-icon svg{width:14px;height:14px}
.ol-password-toggle{padding:0;border:0;background:transparent;cursor:pointer}
.ol-forgot{display:block;margin:13px 0 21px auto;padding:0;border:0;background:transparent;color:#d6dbe3;font-size:10px;line-height:1.3;text-align:right;cursor:pointer}
.ol-forgot:hover{color:#ffbc3c}
.ol-reset-copy{margin:18px 0 22px;color:#cbd2db;font-size:12px;line-height:1.5;text-align:center}
.ol-submit{position:relative;display:flex;align-items:center;justify-content:center;width:100%;min-height:40px;margin-top:25px;padding:11px 14px;border:1px solid #ffc354;border-radius:25px;background:linear-gradient(90deg,#ffa500,#ff8c00);color:white;font-size:14px;font-weight:600;line-height:1.2;letter-spacing:.3px;text-align:center;cursor:pointer;overflow:hidden;box-shadow:0 7px 25px #ffa50033;transition:transform .2s,box-shadow .2s}
.ol-forgot+.ol-submit{margin-top:0}
.ol-submit:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,#ffffff40,transparent);transform:translateX(-110%);transition:transform .6s}
.ol-submit:hover,.ol-submit[data-preview-active=true]{transform:translateY(-2px);box-shadow:0 8px 28px #ffa50077}
.ol-submit:hover:before{transform:translateX(110%)}
.ol-submit:disabled{cursor:wait;opacity:.7;transform:none}
.ol-social{margin-top:24px;text-align:center}
.ol-social p{margin:0 0 12px;font-size:14px;line-height:1.3}
.ol-social>div{display:flex;justify-content:center;gap:13px}
.ol-social-button{display:grid;place-items:center;width:34px;height:34px;padding:0;border:0;border-radius:50%;color:#fff;font-size:14px;line-height:1;cursor:pointer;transition:transform .2s,box-shadow .2s}
.ol-social-button:hover{transform:translateY(-3px);box-shadow:0 6px 15px #0005}
.ol-social-button:disabled{opacity:.6;cursor:wait}
.ol-facebook{background:#3b5998}.ol-x{background:#000}.ol-google{background:#db4437}
.ol-switch{display:block;width:fit-content;margin:25px auto 0;padding:0;border:0;background:transparent;color:#ffbc3c;font-size:12px;line-height:1.3;text-align:center;cursor:pointer}
.ol-switch:hover{text-decoration:underline;text-underline-offset:3px}
.ol-notice{margin:18px 0 0;padding:10px;border:1px solid #ffbc3c55;border-radius:10px;color:#fbd181;font-size:12px;line-height:1.5;text-align:center;overflow-wrap:anywhere}
.ol-notice[data-kind=error]{border-color:#ff787866;color:#ffb9b9}
.ol-cancel{display:block;margin:12px auto 0;padding:2px;border:0;background:transparent;color:#cbd2db;font-size:11px;text-decoration:underline;cursor:pointer}
.orbit-login button:focus-visible{outline:2px solid #ffbc3c;outline-offset:4px}
.ol-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@keyframes ol-orbit-turn{to{transform:rotate(360deg)}}
.orbit-login[data-running=false] .ol-ticks{animation-play-state:paused}
@container orbit-login (max-width:520px){.orbit-login:not(.ol-thumbnail) .ol-stage{min-height:590px;padding:64px 24px}.orbit-login:not(.ol-thumbnail) .ol-dial{width:500px}.orbit-login:not(.ol-thumbnail) .ol-panel{width:280px}}
.ol-thumbnail{height:100%;min-height:0}
.ol-thumbnail .ol-stage{height:100%;min-height:0;padding:16px}
.ol-thumbnail .ol-dial{width:330px}
.ol-thumbnail .ol-panel{width:280px;flex-shrink:0;max-width:none;transform:scale(.65);padding:30px 28px 32px}
.ol-thumbnail .ol-fields>.ol-field>span:first-child{padding-left:13px;font-size:12px;line-height:1;color:#cbd2db}
.ol-thumbnail .ol-submit,.ol-thumbnail .ol-social-button,.ol-thumbnail .ol-switch,.ol-thumbnail .ol-forgot{cursor:default}
@media(prefers-reduced-motion:reduce){.orbit-login *{animation:none!important;transition:none!important}}
`;
