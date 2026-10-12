"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { ComponentStyles } from "./component-styles";

export type NeonAuthView = "login" | "signup" | "reset";
export interface NeonLoginCredentials { email: string; password: string; remember: boolean }
export interface NeonSignUpDetails { fullName: string; email: string; password: string }
export interface NeonResetDetails { email: string }
export interface NeonRingAuthProps {
  onLogin?: (credentials: NeonLoginCredentials, signal: AbortSignal) => void | Promise<void>;
  onSignUp?: (details: NeonSignUpDetails, signal: AbortSignal) => void | Promise<void>;
  onResetPassword?: (details: NeonResetDetails, signal: AbortSignal) => void | Promise<void>;
  initialView?: NeonAuthView;
  className?: string;
}

type NeonNotice = { kind: "success" | "error"; message: string };

function NeonEye({ visible = false }: { visible?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />{visible && <path d="m4 3 16 18" stroke="currentColor" strokeWidth="1.5" />}</svg>;
}

function waitForNeonAction(action: (signal: AbortSignal) => void | Promise<void>, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => signal.removeEventListener("abort", abort);
    const abort = () => { cleanup(); reject(new DOMException("Cancelled", "AbortError")); };
    if (signal.aborted) { abort(); return; }
    signal.addEventListener("abort", abort, { once: true });
    try { Promise.resolve(action(signal)).then(() => { cleanup(); resolve(); }, (reason) => { cleanup(); reject(reason); }); }
    catch (reason) { cleanup(); reject(reason); }
  });
}

const NEON_PARTICLES = [
  { position: "top-[78%] left-[20%] size-[3px]", motion: "animate-[nr-particle-float_7s_ease-in-out_-1s_infinite_alternate]" },
  { position: "top-[79%] left-[71%] size-[2px]", motion: "animate-[nr-particle-float_7s_ease-in-out_-3s_infinite_alternate]" },
  { position: "top-[67%] left-[82%] size-[3px]", motion: "animate-[nr-particle-float_7s_ease-in-out_-5s_infinite_alternate]" },
  { position: "top-[86%] left-[34%] size-[2px]", motion: "animate-[nr-particle-float_7s_ease-in-out_-2s_infinite_alternate]" },
  { position: "top-[13%] left-[64%] size-[2px]", motion: "animate-[nr-particle-float_7s_ease-in-out_-4s_infinite_alternate]" },
  { position: "top-[43%] left-[16%] size-[2px]", motion: "animate-[nr-particle-float_7s_ease-in-out_-6s_infinite_alternate]" },
];

function NeonParticles({ still = false }: { still?: boolean }) {
  return <div className="pointer-events-none absolute inset-0" aria-hidden="true">
    {NEON_PARTICLES.map(({ position, motion }) => <span key={position} className={`absolute rounded-[50%] bg-[#72e8ff77] shadow-[0_0_6px_#00d9ff77] ${position} ${still ? "animate-none" : motion}`} />)}
  </div>;
}

/* Tailwind classes shared by the live form and its gallery thumbnail. */
const nr = {
  root: "neon-ring-auth @container/neon-ring-auth relative isolate w-full min-w-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_44%,#0c1a28,#050a12_72%)] font-[Arial,Helvetica,sans-serif] text-[#bac9d4]",
  stage: "relative flex w-full flex-col items-center justify-center gap-6 self-stretch",
  ring: "group relative isolate size-(--nr-size) shrink-0 rounded-[50%] perspective-[1100px] before:absolute before:-inset-[2px] before:-z-1 before:rounded-[50%] before:bg-[conic-gradient(from_0deg,#00fff6_0deg,#00dce7_65deg,#a400d8_80deg,#f000e8_105deg,#00d8ed_125deg,#00faff_200deg,#00e0f2_270deg,#00fff6_360deg)] before:shadow-[0_0_15px_#00ffff99,0_0_35px_#00cfff88,0_0_75px_#00a4ff44] before:content-['']",
  disc: "pointer-events-none absolute inset-[3px] rounded-[50%] bg-[radial-gradient(ellipse_at_38%_22%,#233340,#0c1722_63%,#050c13)] shadow-[inset_0_0_35px_#050b12]",
  face: "absolute inset-0 flex items-center justify-center backface-hidden",
  formBody: "relative w-[260px] text-center",
  title: "m-0 text-[28px] leading-[1.2] font-bold text-[#bfffff] text-shadow-[0_0_7px_#00ffffcc,0_0_17px_#00ffff66]",
  subtitle: "mx-0 mt-1.5 mb-[27px] text-[12px] leading-[1.2] text-[#8ea1af]",
  fields: "m-0 flex min-w-0 flex-col gap-[18px] border-none p-0",
  field: "nr-field relative block h-[42px] w-full rounded-[999px] border border-[#152330] bg-[#050f1b] shadow-[inset_0_2px_7px_#0007] [transition:border-color_.2s,box-shadow_.2s]",
  fieldText: "absolute top-1/2 left-[17px] -translate-y-1/2 text-[12px] leading-none text-[#8fa3b3]",
  eye: "absolute top-1/2 right-[14px] grid h-5 w-[17px] -translate-y-1/2 place-items-center border-none bg-transparent p-0 text-[#8498a8] *:size-3.5",
  options: "nr-options mt-[15px] flex items-center justify-between gap-2.5 text-[11px] leading-[1.2] text-[#8193a3]",
  optionLink: "border-none bg-transparent p-0 text-[11px] leading-[1.2] text-[#60e6e7]",
  submit: "mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-[999px] border border-[#4dc4cb] bg-[#07304466] px-3 py-[11px] text-[12px] leading-[1.2] font-semibold tracking-[2px] text-[#e3fbff] shadow-[0_0_8px_#00dfe555,inset_0_0_10px_#00ffff11] [transition:border-color_.2s,box-shadow_.2s,background_.2s]",
  switch: "m-0 mt-10 text-[11px] leading-[1.4] text-[#8193a3]",
  switchLink: "border-none bg-transparent p-0 [font:inherit] text-[#00ffff] text-shadow-[0_0_6px_#00ffff77]",
};

/* The live form adds interaction states and shrinks below 520px / 360px of container width. */
const live = {
  stage: `${nr.stage} min-h-[640px] px-6 py-16 [--nr-size:460px] @max-[520px]:min-h-[570px] @max-[520px]:px-[18px] @max-[520px]:pt-[60px] @max-[520px]:pb-[70px] @max-[520px]:[--nr-size:max(320px,min(360px,calc(100cqw_-_36px)))]`,
  ring: `${nr.ring} before:animate-[nr-ring-spin_8s_linear_infinite]`,
  face: `${nr.face} aria-hidden:pointer-events-none`,
  formBody: `${nr.formBody} max-w-[70%] @max-[520px]:w-[226px]`,
  title: `${nr.title} @max-[520px]:text-[24px] @max-[360px]:text-[21px]`,
  subtitle: `${nr.subtitle} @max-[520px]:mb-5 @max-[520px]:text-[11px] @max-[360px]:mb-4 @max-[360px]:text-[10px]`,
  fields: `${nr.fields} disabled:opacity-70 @max-[520px]:gap-3.5 @max-[360px]:gap-2.5`,
  field: `${nr.field} focus-within:border-[#00e9e9] focus-within:shadow-[0_0_6px_#00ffff99,0_0_15px_#00ffff33,inset_0_2px_7px_#0007] @max-[520px]:h-10 @max-[360px]:h-9`,
  input: "peer block h-full w-full rounded-[inherit] border-none bg-transparent py-[11px] pr-[38px] pl-[17px] text-[12px] leading-none text-[#e0f4ff]",
  floating: `${nr.fieldText} pointer-events-none [transition:top_.2s,font-size_.2s,color_.2s] peer-[:is(:focus,:not(:placeholder-shown))]:top-0 peer-[:is(:focus,:not(:placeholder-shown))]:-ml-[5px] peer-[:is(:focus,:not(:placeholder-shown))]:bg-[#10202b] peer-[:is(:focus,:not(:placeholder-shown))]:px-1.5 peer-[:is(:focus,:not(:placeholder-shown))]:py-0.5 peer-[:is(:focus,:not(:placeholder-shown))]:text-[9px] peer-[:is(:focus,:not(:placeholder-shown))]:text-[#5be6e7]`,
  eye: `${nr.eye} cursor-pointer`,
  options: `${nr.options} @max-[520px]:mt-3 @max-[520px]:text-[10px] @max-[360px]:text-[9px]`,
  optionLink: `${nr.optionLink} cursor-pointer @max-[520px]:text-[10px] @max-[360px]:text-[9px]`,
  submit: `${nr.submit} cursor-pointer disabled:cursor-wait disabled:opacity-60 [&:hover]:border-[#00ffff] [&:hover]:bg-[#06394799] [&:hover]:shadow-[0_0_11px_#00ffffaa,0_0_25px_#00ffff44,inset_0_0_12px_#00ffff22] aria-busy:after:size-3 aria-busy:after:animate-[nr-spinner_.7s_linear_infinite] aria-busy:after:rounded-[50%] aria-busy:after:border-2 aria-busy:after:border-[#ffffff40] aria-busy:after:border-t-[#00ffff] aria-busy:after:content-[''] @max-[520px]:mt-[17px] @max-[520px]:min-h-10 @max-[520px]:text-[11px] @max-[360px]:min-h-9 @max-[360px]:text-[9px] @max-[360px]:tracking-[1.3px]`,
  switch: `${nr.switch} @max-[520px]:mt-[27px] @max-[520px]:text-[10px] @max-[360px]:mt-5`,
  switchLink: `${nr.switchLink} cursor-pointer [&:hover]:underline [&:hover]:underline-offset-3`,
};

/* The thumbnail is static: data-preview-active stands in for focus and hover. */
const preview = {
  stage: `${nr.stage} h-full min-h-0 p-[10px] [--nr-size:280px]`,
  ring: `${nr.ring} before:[transform:rotate(var(--nr-preview-turn,0deg))] before:[transition:transform_.6s_ease]`,
  formBody: `${nr.formBody} max-w-none shrink-0 scale-60`,
  field: `${nr.field} data-[preview-active=true]:border-[#00e9e9] data-[preview-active=true]:shadow-[0_0_6px_#00ffff99,0_0_15px_#00ffff33,inset_0_2px_7px_#0007]`,
  submit: `${nr.submit} cursor-default data-[preview-active=true]:border-[#00ffff] data-[preview-active=true]:bg-[#06394799] data-[preview-active=true]:shadow-[0_0_11px_#00ffffaa,0_0_25px_#00ffff44,inset_0_0_12px_#00ffff22]`,
};

/** A cyan-ring login form that flips into a complete sign-up form. */
export default function NeonRingAuth({ onLogin, onSignUp, onResetPassword, initialView = "login", className = "" }: NeonRingAuthProps) {
  const [view, setView] = useState<NeonAuthView>(initialView);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<NeonNotice | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  const focusOnSwitchRef = useRef(false);
  const loginFirstRef = useRef<HTMLInputElement>(null);
  const signupFirstRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const signup = view === "signup";
  const reset = view === "reset";

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
    (view === "signup" ? signupFirstRef : loginFirstRef).current?.focus({ preventScroll: true });
  }, [view]);

  function cancel() {
    requestRef.current?.abort();
    requestRef.current = null;
    setPending(false);
  }

  function changeView(next: NeonAuthView) {
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
      await waitForNeonAction(action, controller.signal);
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

  function submit(event: FormEvent<HTMLFormElement>, mode: NeonAuthView) {
    event.preventDefault();
    if (mode !== view || !event.currentTarget.checkValidity()) { event.currentTarget.reportValidity(); return; }
    if (mode === "signup" && fullName.trim().length < 2) {
      setNotice({ kind: "error", message: "Please enter your full name using at least two characters." });
      signupFirstRef.current?.focus();
      return;
    }
    if (mode === "signup") {
      void runAction((signal) => onSignUp?.({ fullName: fullName.trim(), email: email.trim(), password }, signal), onSignUp ? "Account created successfully." : "Demo sign-up complete.");
    } else if (mode === "reset") {
      void runAction((signal) => onResetPassword?.({ email: email.trim() }, signal), onResetPassword ? "Password reset instructions requested." : "Demo reset request complete. No email was sent.");
    } else {
      void runAction((signal) => onLogin?.({ email: email.trim(), password, remember }, signal), onLogin ? "Login complete." : "Demo login complete.");
    }
  }

  function passwordField(suffix: string) {
    return <label className={live.field}><input className={live.input} id={`${id}-${suffix}-password`} name="password" aria-label="Password" type={visiblePassword ? "text" : "password"} autoComplete={suffix === "signup" ? "new-password" : "current-password"} placeholder=" " required minLength={suffix === "signup" ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} /><span className={live.floating}>Password</span><button type="button" className={live.eye} aria-label={visiblePassword ? "Hide password" : "Show password"} aria-pressed={visiblePassword} onClick={() => setVisiblePassword((visible) => !visible)}><NeonEye visible={visiblePassword} /></button></label>;
  }

  return <section ref={rootRef} className={`${nr.root} flex items-center justify-center ${className}`} aria-label="Neon ring authentication">
    <ComponentStyles css={NEON_RING_STYLES} />
    <div className={live.stage}><NeonParticles /><div className={live.ring} data-view={view}>
      <div className={nr.disc} />
      <div className="relative h-full w-full transition-[transform] duration-800 ease-[cubic-bezier(.22,.68,.2,1)] transform-3d group-data-[view=signup]:rotate-y-180">
        <div className={live.face} aria-hidden={signup} inert={signup}>
          <div className={live.formBody}>
            <h2 className={live.title} id={`${id}-login-title`}>{reset ? "RESET PASSWORD" : "WELCOME"}</h2><p className={live.subtitle}>{reset ? "Recover your account" : "Login to your account"}</p>
            <form aria-labelledby={`${id}-login-title`} onSubmit={(event) => submit(event, reset ? "reset" : "login")}>
              <fieldset className={live.fields} disabled={pending || signup}>
                <label className={live.field}><input className={live.input} ref={loginFirstRef} id={`${id}-login-email`} name="email" type="email" autoComplete="email" placeholder=" " required value={email} onChange={(event) => setEmail(event.target.value)} /><span className={live.floating}>Email Address</span></label>
                {!reset && passwordField("login")}
              </fieldset>
              {!reset && <div className={live.options}><label className="flex cursor-pointer items-center gap-[5px]"><input className="m-0 size-[11px] accent-[#00e5e5]" name="remember" type="checkbox" checked={remember} disabled={pending || signup} onChange={(event) => setRemember(event.target.checked)} /><span>Remember me</span></label><button className={live.optionLink} type="button" onClick={() => changeView("reset")} disabled={signup}>Forgot?</button></div>}
              {reset && <p className="m-0 mt-4.5 text-[12px] leading-[1.5] text-[#8fa3b3]">Enter your email to request reset instructions.</p>}
              <button className={live.submit} type="submit" disabled={pending || signup} aria-busy={pending}>{pending ? "PLEASE WAIT" : reset ? "SEND RESET LINK" : "LOGIN"}</button>
            </form>
            <p className={live.switch}>{reset ? "Remember your password?" : "Don’t have an account?"} <button className={live.switchLink} type="button" disabled={signup} onClick={() => changeView(reset ? "login" : "signup")}>{reset ? "Login" : "Sign Up"}</button></p>
          </div>
        </div>
        <div className={`${live.face} rotate-y-180`} aria-hidden={!signup} inert={!signup}>
          <div className={live.formBody}><h2 className={live.title} id={`${id}-signup-title`}>SIGN UP</h2><p className={live.subtitle}>Create your account</p>
            <form aria-labelledby={`${id}-signup-title`} onSubmit={(event) => submit(event, "signup")}><fieldset className={live.fields} disabled={pending || !signup}>
              <label className={live.field}><input className={live.input} ref={signupFirstRef} id={`${id}-signup-name`} name="fullName" type="text" autoComplete="name" placeholder=" " required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} /><span className={live.floating}>Full Name</span></label>
              <label className={live.field}><input className={live.input} id={`${id}-signup-email`} name="email" type="email" autoComplete="email" placeholder=" " required value={email} onChange={(event) => setEmail(event.target.value)} /><span className={live.floating}>Email Address</span></label>
              {passwordField("signup")}
            </fieldset><button className={live.submit} type="submit" disabled={pending || !signup} aria-busy={pending}>{pending ? "PLEASE WAIT" : "CREATE ACCOUNT"}</button></form>
            <p className={live.switch}>Already have an account? <button className={live.switchLink} type="button" disabled={!signup} onClick={() => changeView("login")}>Login</button></p>
          </div>
        </div>
      </div>
    </div>
    {(notice || pending) && <div className="relative w-[360px] max-w-full flex-none text-center">{notice && <p className="m-0 rounded-[12px] border border-[#00e7e755] bg-[#0b1f2ddd] px-3 py-2.5 text-[12px] leading-[1.5] wrap-anywhere text-[#adf9f9] data-[kind=error]:border-[#ff6f8866] data-[kind=error]:text-[#ffb9c7]" data-kind={notice.kind} role={notice.kind === "error" ? "alert" : "status"}>{notice.message}</p>}{pending && <button className="mx-0 mt-2 mb-0 cursor-pointer border-none bg-transparent p-0.5 text-[11px] text-[#a8d6df] underline" type="button" onClick={cancel}>Cancel</button>}</div>}
    </div>
  </section>;
}

/** The gallery supplies the frame; this preview contains no interactive elements. */
export function NeonRingAuthThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.max(0, Math.floor(previewStep)) % 6 : 0;
  const signup = step === 3 || step === 4;
  const reset = step === 5;
  return <div className={`${nr.root} h-full min-h-0 ${className}`} aria-hidden="true" inert><ComponentStyles css={NEON_RING_STYLES} /><div className={preview.stage}><NeonParticles still /><div className={preview.ring} data-view={signup ? "signup" : "login"} style={{ "--nr-preview-turn": `${step * 62}deg` } as React.CSSProperties}><div className={nr.disc} /><div className={nr.face}><div className={preview.formBody}><h3 className={nr.title}>{signup ? "SIGN UP" : reset ? "RESET PASSWORD" : "WELCOME"}</h3><p className={nr.subtitle}>{signup ? "Create your account" : reset ? "Recover your account" : "Login to your account"}</p><div className={nr.fields}>
    {signup && <span className={preview.field}><span className={nr.fieldText}>Full Name</span></span>}
    <span className={preview.field} data-preview-active={step === 1 || step === 4}><span className={nr.fieldText}>{step === 1 || step === 2 || step === 4 ? "hello@example.com" : "Email Address"}</span></span>
    {!reset && <span className={preview.field} data-preview-active={step === 2}><span className={nr.fieldText}>{step === 2 ? "••••••••" : "Password"}</span><span className={`${nr.eye} cursor-default`}><NeonEye /></span></span>}
  </div>{!signup && !reset && <div className={nr.options}><span className="flex items-center gap-[5px]"><span className="size-[10px] rounded-[1px] bg-[#e6f0f5]" />Remember me</span><span className={`${nr.optionLink} cursor-default`}>Forgot?</span></div>}<span className={preview.submit} data-preview-active={step === 2 || step === 4}>{signup ? "CREATE ACCOUNT" : reset ? "SEND RESET LINK" : "LOGIN"}</span><p className={nr.switch}>{signup ? "Already have an account?" : reset ? "Remember your password?" : "Don’t have an account?"} <span className={`${nr.switchLink} cursor-default`}>{signup || reset ? "Login" : "Sign Up"}</span></p></div></div></div></div></div>;
}

/* Only what utilities cannot express: scoped resets, outlines that must beat the site's
   unlayered :focus-visible rule, keyframes, and motion overrides for every descendant. */
const NEON_RING_STYLES = `
.neon-ring-auth *{box-sizing:border-box}
.neon-ring-auth :where(button,input){font-family:inherit}
.nr-field input{outline:0}
.neon-ring-auth button:focus-visible,.nr-options input:focus-visible{outline:2px solid #00e9e9;outline-offset:4px}
@keyframes nr-ring-spin{to{transform:rotate(360deg)}}
@keyframes nr-spinner{to{transform:rotate(360deg)}}
@keyframes nr-particle-float{from{transform:translateY(0);opacity:.25}to{transform:translateY(-16px);opacity:.9}}
.neon-ring-auth[data-running=false] *,.neon-ring-auth[data-running=false] *:before,.neon-ring-auth[data-running=false] *:after{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){.neon-ring-auth *,.neon-ring-auth *:before,.neon-ring-auth *:after{animation:none!important;transition:none!important}}
`;
