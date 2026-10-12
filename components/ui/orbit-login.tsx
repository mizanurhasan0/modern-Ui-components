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
const SOCIAL_COLORS = { facebook: "ol-facebook bg-[#3b5998]", x: "ol-x bg-black", google: "ol-google bg-[#db4437]" } as const;

/* Class lists shared by the live panel and its inert thumbnail. */
const ROOT = "orbit-login @container/orbit relative isolate w-full min-w-0 overflow-hidden bg-[linear-gradient(135deg,#1e293b,#263b49)] text-[#cbd2db] [font-family:Arial,Helvetica,sans-serif]";
const STAGE = "ol-stage relative flex w-full items-center justify-center";
const DIAL = "ol-dial pointer-events-none absolute top-1/2 left-1/2 aspect-square -translate-x-1/2 -translate-y-1/2";
const PANEL = "ol-panel relative z-1 w-[280px] rounded-[20px] bg-[rgba(29,42,56,.78)] px-7 pt-[30px] pb-8 shadow-[0_20px_40px_#0005] backdrop-blur-[4px]";
const TITLE = "m-0 mb-[25px] text-center text-[27px] leading-[1.2] font-semibold tracking-[1px] text-[#ffbc3c]";
const FIELDS = "ol-fields m-0 flex min-w-0 flex-col gap-5 border-0 p-0";
const FIELD = "ol-field relative flex h-[38px] w-full items-center rounded-[25px] border border-[#ffffff40] bg-[#ffffff1a] p-0 [transition:border-color_.2s,box-shadow_.2s] focus-within:border-[#ffbc3c] focus-within:shadow-[0_0_12px_#ffa50033] data-[preview-active=true]:border-[#ffbc3c] data-[preview-active=true]:shadow-[0_0_12px_#ffa50033] motion-reduce:transition-none";
const INPUT = "block size-full rounded-[inherit] border-0 bg-transparent py-2.5 pr-[38px] pl-[13px] text-[12px] leading-none text-white placeholder:text-[#cbd2db] placeholder:opacity-100";
const FIELD_ICON = "ol-field-icon absolute top-1/2 right-3 grid h-5 w-[17px] -translate-y-1/2 place-items-center text-[#b7c1ce]";
const FORGOT = "ol-forgot mt-[13px] mr-0 mb-[21px] ml-auto block border-0 bg-transparent p-0 text-right text-[10px] leading-[1.3] text-[#d6dbe3] hover:text-[#ffbc3c]";
const SUBMIT = "ol-submit relative mt-[25px] flex min-h-10 w-full items-center justify-center overflow-hidden rounded-[25px] border border-[#ffc354] bg-[linear-gradient(90deg,#ffa500,#ff8c00)] px-3.5 py-[11px] text-center text-[14px] leading-[1.2] font-semibold tracking-[.3px] text-white shadow-[0_7px_25px_#ffa50033] [transition:transform_.2s,box-shadow_.2s] hover:[transform:translateY(-2px)] hover:shadow-[0_8px_28px_#ffa50077] data-[preview-active=true]:[transform:translateY(-2px)] data-[preview-active=true]:shadow-[0_8px_28px_#ffa50077] motion-reduce:transition-none [.ol-forgot+&]:mt-0";
const SOCIAL = "ol-social mt-6 text-center";
const SOCIAL_LABEL = "m-0 mb-3 text-[14px] leading-[1.3]";
const SOCIAL_ROW = "flex justify-center gap-[13px]";
const SOCIAL_BUTTON = "ol-social-button grid size-[34px] place-items-center rounded-[50%] border-0 p-0 text-[14px] leading-none text-white [transition:transform_.2s,box-shadow_.2s] hover:[transform:translateY(-3px)] hover:shadow-[0_6px_15px_#0005] motion-reduce:transition-none";
const THUMB_VALUE = "pl-[13px] text-[12px] leading-none text-[#cbd2db]";
const SWITCH = "ol-switch mx-auto mt-[25px] mb-0 block w-fit border-0 bg-transparent p-0 text-center text-[12px] leading-[1.3] text-[#ffbc3c] hover:underline hover:underline-offset-3";

function OrbitIcon({ name }: { name: "email" | "password" | "name" }) {
  return <svg className="size-3.5" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
    {name === "email" ? <path d="M3 4h18a1 1 0 0 1 1 1v1L12 13 2 6V5a1 1 0 0 1 1-1Zm-1 4.4V19a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V8.4l-9.4 6.4a1 1 0 0 1-1.2 0L2 8.4Z" /> : name === "password" ? <path d="M7 10V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1Zm2 0h6V7a3 3 0 0 0-6 0v3Z" /> : <><circle cx="12" cy="7" r="4" /><path d="M4 21v-3a8 8 0 0 1 16 0v3H4Z" /></>}
  </svg>;
}

function OrbitTicks({ offset = 0, thumbnail = false }: { offset?: number; thumbnail?: boolean }) {
  return <svg className="ol-ticks block size-full origin-center overflow-visible animate-[ol-orbit-turn_18s_linear_infinite] data-[static=true]:animate-none group-data-[running=false]/orbit:[animation-play-state:paused] motion-reduce:animate-none" data-static={thumbnail} viewBox="0 0 560 560" fill="none" aria-hidden="true" focusable="false" style={thumbnail ? { transform: `rotate(${offset}deg)` } : undefined}>
    {Array.from({ length: 60 }, (_, index) => <line key={index} className="stroke-[#4a5f7f] opacity-65 data-[lit=true]:stroke-[#ffa500] data-[lit=true]:opacity-100 data-[lit=true]:[filter:drop-shadow(0_0_6px_#ffa500b3)]" data-lit={index >= 45 && index < 55} x1="280" y1="12" x2="280" y2="34" strokeWidth="7" strokeLinecap="round" transform={`rotate(${index * 6} 280 280)`} />)}
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

  return <section ref={rootRef} className={`${ROOT} group/orbit flex items-center justify-center ${className}`} aria-label="Orbit authentication">
    <ComponentStyles css={ORBIT_LOGIN_STYLES} />
    <div className={`${STAGE} min-h-[640px] px-6 py-[70px] [@container_orbit_(max-width:520px)]:min-h-[590px] [@container_orbit_(max-width:520px)]:py-16`}><div className={`${DIAL} w-[560px] [@container_orbit_(max-width:520px)]:w-[500px]`}><OrbitTicks /></div>
      <div className={`${PANEL} max-w-full`}>
        <h2 id={`${id}-title`} className={TITLE}>{view === "signup" ? "SIGN UP" : view === "reset" ? "RESET PASSWORD" : "LOGIN"}</h2>
        <form aria-labelledby={`${id}-title`} onSubmit={submit}>
          <fieldset disabled={pending} className={`${FIELDS} disabled:opacity-70`}>
            {view === "signup" && <label className={FIELD}><span className="sr-only">Full name</span><input ref={firstInputRef} name="fullName" type="text" className={INPUT} autoComplete="name" placeholder="Full Name" required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} /><span className={FIELD_ICON}><OrbitIcon name="name" /></span></label>}
            <label className={FIELD}><span className="sr-only">Email address</span><input ref={view === "signup" ? undefined : firstInputRef} name="email" type="email" className={INPUT} autoComplete="email" placeholder="Email" required value={email} onChange={(event) => setEmail(event.target.value)} /><span className={FIELD_ICON}><OrbitIcon name="email" /></span></label>
            {view !== "reset" && <label className={FIELD}><span className="sr-only">Password</span><input name="password" aria-label="Password" type={visiblePassword ? "text" : "password"} className={INPUT} autoComplete={view === "signup" ? "new-password" : "current-password"} placeholder="Password" required minLength={view === "signup" ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} /><button className={`${FIELD_ICON} ol-password-toggle cursor-pointer border-0 bg-transparent p-0`} type="button" aria-label={visiblePassword ? "Hide password" : "Show password"} aria-pressed={visiblePassword} onClick={() => setVisiblePassword((visible) => !visible)}><OrbitIcon name="password" /></button></label>}
          </fieldset>
          {view === "login" && <button className={`${FORGOT} cursor-pointer`} type="button" onClick={() => changeView("reset")}>Forget Your Password ?</button>}
          {view === "reset" && <p className="ol-reset-copy mx-0 mt-[18px] mb-[22px] text-center text-[12px] leading-[1.5] text-[#cbd2db]">Enter your email to request a password reset.</p>}
          <button className={`${SUBMIT} cursor-pointer disabled:cursor-wait disabled:[transform:none] disabled:opacity-70`} type="submit" disabled={pending} aria-busy={pending}>{pending ? "Please wait…" : view === "signup" ? "CREATE ACCOUNT" : view === "reset" ? "SEND RESET LINK" : "LOGIN"}</button>
        </form>
        {view === "login" && socialProviders.length > 0 && <div className={SOCIAL}><p className={SOCIAL_LABEL}>log in with</p><div className={SOCIAL_ROW}>{socialProviders.map((provider) => <button key={provider} className={`${SOCIAL_BUTTON} ${SOCIAL_COLORS[provider]} cursor-pointer disabled:cursor-wait disabled:opacity-60`} type="button" disabled={pending} aria-label={`Continue with ${SOCIAL_NAMES[provider]}`} onClick={() => void runAction((signal) => onSocialAuth?.(provider, signal), onSocialAuth ? `${SOCIAL_NAMES[provider]} sign-in complete.` : `${SOCIAL_NAMES[provider]} selected in this local demo.`)}>{provider === "facebook" ? "F" : provider === "google" ? "G" : "X"}</button>)}</div></div>}
        <button className={`${SWITCH} cursor-pointer`} type="button" onClick={() => changeView(view === "login" ? "signup" : "login")}>{view === "login" ? "Sign Up" : "Back to Login"}</button>
        {notice && <p className="ol-notice mx-0 mt-[18px] mb-0 rounded-[10px] border border-[#ffbc3c55] p-2.5 text-center text-[12px] leading-[1.5] text-[#fbd181] [overflow-wrap:anywhere] data-[kind=error]:border-[#ff787866] data-[kind=error]:text-[#ffb9b9]" data-kind={notice.kind} role={notice.kind === "error" ? "alert" : "status"}>{notice.message}</p>}
        {pending && <button className="ol-cancel mx-auto mt-3 mb-0 block cursor-pointer border-0 bg-transparent p-0.5 text-[11px] text-[#cbd2db] underline" type="button" onClick={cancel}>Cancel</button>}
      </div>
    </div>
  </section>;
}

/** Inert frames mirror the real panel while the homepage controls their playback. */
export function OrbitLoginThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.max(0, Math.floor(previewStep)) % 6 : 0;
  const signup = step === 4;
  const reset = step === 5;
  return <div className={`${ROOT} ol-thumbnail h-full min-h-0 ${className}`} aria-hidden="true" inert><ComponentStyles css={ORBIT_LOGIN_STYLES} /><div className={`${STAGE} h-full min-h-0 p-4`}><div className={`${DIAL} w-[330px]`}><OrbitTicks thumbnail offset={step * 54} /></div><div className={`${PANEL} max-w-none shrink-0 scale-65`}><h3 className={TITLE}>{signup ? "SIGN UP" : reset ? "RESET PASSWORD" : "LOGIN"}</h3><div className={FIELDS}>
    {signup && <span className={FIELD}><span className={THUMB_VALUE}>Full Name</span><span className={FIELD_ICON}><OrbitIcon name="name" /></span></span>}
    <span className={FIELD} data-preview-active={step === 1}><span className={THUMB_VALUE}>{step >= 1 && step <= 3 ? "hello@example.com" : "Email"}</span><span className={FIELD_ICON}><OrbitIcon name="email" /></span></span>
    {!reset && <span className={FIELD} data-preview-active={step === 2}><span className={THUMB_VALUE}>{step === 2 || step === 3 ? "••••••••" : "Password"}</span><span className={FIELD_ICON}><OrbitIcon name="password" /></span></span>}
  </div>{!signup && !reset && <span className={`${FORGOT} cursor-default`}>Forget Your Password ?</span>}<span className={`${SUBMIT} cursor-default`} data-preview-active={step === 3}>{signup ? "CREATE ACCOUNT" : reset ? "SEND RESET LINK" : "LOGIN"}</span>{!signup && !reset && <div className={SOCIAL}><p className={SOCIAL_LABEL}>log in with</p><div className={SOCIAL_ROW}>{SOCIAL_PROVIDERS.map((provider) => <span key={provider} className={`${SOCIAL_BUTTON} ${SOCIAL_COLORS[provider]} cursor-default`}>{provider === "facebook" ? "F" : provider === "google" ? "G" : "X"}</span>)}</div></div>}<span className={`${SWITCH} cursor-default`}>{signup || reset ? "Back to Login" : "Sign Up"}</span></div></div></div>;
}

/* Only what utilities cannot express: keyframes, focus rules that must stay unlayered to
   override the host page's unlayered :focus-visible outline, and the submit shine sweep. */
const ORBIT_LOGIN_STYLES = `
@keyframes ol-orbit-turn{to{transform:rotate(360deg)}}
.orbit-login button:focus-visible{outline:2px solid #ffbc3c;outline-offset:4px}
.ol-field input{outline:0}
.ol-submit:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,#ffffff40,transparent);transform:translateX(-110%);transition:transform .6s}
.ol-submit:hover:before{transform:translateX(110%)}
`;
