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

function NeonParticles() {
  return <div className="nr-particles" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>;
}

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
    return <label className="nr-field"><input id={`${id}-${suffix}-password`} name="password" aria-label="Password" type={visiblePassword ? "text" : "password"} autoComplete={suffix === "signup" ? "new-password" : "current-password"} placeholder=" " required minLength={suffix === "signup" ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} /><span className="nr-floating">Password</span><button type="button" className="nr-eye" aria-label={visiblePassword ? "Hide password" : "Show password"} aria-pressed={visiblePassword} onClick={() => setVisiblePassword((visible) => !visible)}><NeonEye visible={visiblePassword} /></button></label>;
  }

  return <section ref={rootRef} className={`neon-ring-auth relative flex w-full items-center justify-center ${className}`} aria-label="Neon ring authentication">
    <ComponentStyles css={NEON_RING_STYLES} />
    <div className="nr-stage"><NeonParticles /><div className="nr-ring" data-view={view}>
      <div className="nr-disc" />
      <div className="nr-flipper">
        <div className="nr-face nr-login-face" aria-hidden={signup} inert={signup}>
          <div className="nr-form-body">
            <h2 id={`${id}-login-title`}>{reset ? "RESET PASSWORD" : "WELCOME"}</h2><p className="nr-subtitle">{reset ? "Recover your account" : "Login to your account"}</p>
            <form aria-labelledby={`${id}-login-title`} onSubmit={(event) => submit(event, reset ? "reset" : "login")}>
              <fieldset className="nr-fields" disabled={pending || signup}>
                <label className="nr-field"><input ref={loginFirstRef} id={`${id}-login-email`} name="email" type="email" autoComplete="email" placeholder=" " required value={email} onChange={(event) => setEmail(event.target.value)} /><span className="nr-floating">Email Address</span></label>
                {!reset && passwordField("login")}
              </fieldset>
              {!reset && <div className="nr-options"><label><input name="remember" type="checkbox" checked={remember} disabled={pending || signup} onChange={(event) => setRemember(event.target.checked)} /><span>Remember me</span></label><button type="button" onClick={() => changeView("reset")} disabled={signup}>Forgot?</button></div>}
              {reset && <p className="nr-reset-copy">Enter your email to request reset instructions.</p>}
              <button className="nr-submit" type="submit" disabled={pending || signup} aria-busy={pending}>{pending ? "PLEASE WAIT" : reset ? "SEND RESET LINK" : "LOGIN"}</button>
            </form>
            <p className="nr-switch">{reset ? "Remember your password?" : "Don’t have an account?"} <button type="button" disabled={signup} onClick={() => changeView(reset ? "login" : "signup")}>{reset ? "Login" : "Sign Up"}</button></p>
          </div>
        </div>
        <div className="nr-face nr-signup-face" aria-hidden={!signup} inert={!signup}>
          <div className="nr-form-body"><h2 id={`${id}-signup-title`}>SIGN UP</h2><p className="nr-subtitle">Create your account</p>
            <form aria-labelledby={`${id}-signup-title`} onSubmit={(event) => submit(event, "signup")}><fieldset className="nr-fields" disabled={pending || !signup}>
              <label className="nr-field"><input ref={signupFirstRef} id={`${id}-signup-name`} name="fullName" type="text" autoComplete="name" placeholder=" " required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} /><span className="nr-floating">Full Name</span></label>
              <label className="nr-field"><input id={`${id}-signup-email`} name="email" type="email" autoComplete="email" placeholder=" " required value={email} onChange={(event) => setEmail(event.target.value)} /><span className="nr-floating">Email Address</span></label>
              {passwordField("signup")}
            </fieldset><button className="nr-submit" type="submit" disabled={pending || !signup} aria-busy={pending}>{pending ? "PLEASE WAIT" : "CREATE ACCOUNT"}</button></form>
            <p className="nr-switch">Already have an account? <button type="button" disabled={!signup} onClick={() => changeView("login")}>Login</button></p>
          </div>
        </div>
      </div>
    </div>
    {(notice || pending) && <div className="nr-feedback">{notice && <p data-kind={notice.kind} role={notice.kind === "error" ? "alert" : "status"}>{notice.message}</p>}{pending && <button type="button" onClick={cancel}>Cancel</button>}</div>}
    </div>
  </section>;
}

/** The gallery supplies the frame; this preview contains no interactive elements. */
export function NeonRingAuthThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.max(0, Math.floor(previewStep)) % 6 : 0;
  const signup = step === 3 || step === 4;
  const reset = step === 5;
  return <div className={`neon-ring-auth nr-thumbnail ${className}`} aria-hidden="true" inert><ComponentStyles css={NEON_RING_STYLES} /><div className="nr-stage"><NeonParticles /><div className="nr-ring" data-view={signup ? "signup" : "login"} style={{ "--nr-preview-turn": `${step * 62}deg` } as React.CSSProperties}><div className="nr-disc" /><div className="nr-preview-face"><div className="nr-form-body"><h3>{signup ? "SIGN UP" : reset ? "RESET PASSWORD" : "WELCOME"}</h3><p className="nr-subtitle">{signup ? "Create your account" : reset ? "Recover your account" : "Login to your account"}</p><div className="nr-fields">
    {signup && <span className="nr-field"><span className="nr-static-label">Full Name</span></span>}
    <span className="nr-field" data-preview-active={step === 1 || step === 4}><span className="nr-static-label">{step === 1 || step === 2 || step === 4 ? "hello@example.com" : "Email Address"}</span></span>
    {!reset && <span className="nr-field" data-preview-active={step === 2}><span className="nr-static-label">{step === 2 ? "••••••••" : "Password"}</span><span className="nr-eye"><NeonEye /></span></span>}
  </div>{!signup && !reset && <div className="nr-options"><span className="nr-preview-remember"><span />Remember me</span><span>Forgot?</span></div>}<span className="nr-submit" data-preview-active={step === 2 || step === 4}>{signup ? "CREATE ACCOUNT" : reset ? "SEND RESET LINK" : "LOGIN"}</span><p className="nr-switch">{signup ? "Already have an account?" : reset ? "Remember your password?" : "Don’t have an account?"} <span>{signup || reset ? "Login" : "Sign Up"}</span></p></div></div></div></div></div>;
}

const NEON_RING_STYLES = `
.neon-ring-auth{container:neon-ring-auth / inline-size;position:relative;isolation:isolate;overflow:hidden;min-width:0;width:100%;background:radial-gradient(ellipse at 50% 44%,#0c1a28,#050a12 72%);color:#bac9d4;font-family:Arial,Helvetica,sans-serif}
.neon-ring-auth *{box-sizing:border-box}
.neon-ring-auth :where(button,input){font-family:inherit}
.nr-stage{--nr-size:460px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;min-height:640px;width:100%;padding:64px 24px}
.nr-ring{position:relative;isolation:isolate;flex-shrink:0;width:var(--nr-size);height:var(--nr-size);border-radius:50%;perspective:1100px}
.nr-ring:before{content:"";position:absolute;inset:-2px;z-index:-1;border-radius:50%;background:conic-gradient(from 0deg,#00fff6 0deg,#00dce7 65deg,#a400d8 80deg,#f000e8 105deg,#00d8ed 125deg,#00faff 200deg,#00e0f2 270deg,#00fff6 360deg);box-shadow:0 0 15px #00ffff99,0 0 35px #00cfff88,0 0 75px #00a4ff44;animation:nr-ring-spin 8s linear infinite}
.nr-disc{position:absolute;inset:3px;border-radius:50%;background:radial-gradient(ellipse at 38% 22%,#233340,#0c1722 63%,#050c13);box-shadow:inset 0 0 35px #050b12;pointer-events:none}
.nr-flipper{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.22,.68,.2,1)}
.nr-ring[data-view=signup] .nr-flipper{transform:rotateY(180deg)}
.nr-face,.nr-preview-face{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.nr-face[aria-hidden=true]{pointer-events:none}
.nr-signup-face{transform:rotateY(180deg)}
.nr-form-body{position:relative;width:260px;max-width:70%;text-align:center}
.nr-form-body h2,.nr-form-body h3{margin:0;color:#bfffff;font-size:28px;font-weight:700;line-height:1.2;text-shadow:0 0 7px #00ffffcc,0 0 17px #00ffff66}
.nr-subtitle{margin:6px 0 27px;color:#8ea1af;font-size:12px;line-height:1.2}
.nr-fields{display:flex;flex-direction:column;gap:18px;min-width:0;margin:0;padding:0;border:0}
.nr-fields:disabled{opacity:.7}
.nr-field{position:relative;display:block;height:42px;width:100%;border:1px solid #152330;border-radius:999px;background:#050f1b;box-shadow:inset 0 2px 7px #0007;transition:border-color .2s,box-shadow .2s}
.nr-field:focus-within,.nr-field[data-preview-active=true]{border-color:#00e9e9;box-shadow:0 0 6px #00ffff99,0 0 15px #00ffff33,inset 0 2px 7px #0007}
.nr-field input{display:block;width:100%;height:100%;padding:11px 38px 11px 17px;border:0;border-radius:inherit;background:transparent;color:#e0f4ff;font-size:12px;line-height:1;outline:0}
.nr-floating{position:absolute;left:17px;top:50%;transform:translateY(-50%);color:#8fa3b3;font-size:12px;line-height:1;pointer-events:none;transition:top .2s,font-size .2s,color .2s}
.nr-field input:focus+.nr-floating,.nr-field input:not(:placeholder-shown)+.nr-floating{top:0;padding:2px 6px;margin-left:-5px;background:#10202b;color:#5be6e7;font-size:9px}
.nr-eye{position:absolute;right:14px;top:50%;display:grid;place-items:center;width:17px;height:20px;padding:0;border:0;background:transparent;transform:translateY(-50%);color:#8498a8;cursor:pointer}
.nr-eye svg{width:14px;height:14px}
.nr-options{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:15px;color:#8193a3;font-size:11px;line-height:1.2}
.nr-options label{display:flex;align-items:center;gap:5px;cursor:pointer}
.nr-options input{width:11px;height:11px;margin:0;accent-color:#00e5e5}
.nr-options button,.nr-options>span:last-child{padding:0;border:0;background:transparent;color:#60e6e7;font-size:11px;line-height:1.2;cursor:pointer}
.nr-submit{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:44px;margin-top:20px;padding:11px 12px;border:1px solid #4dc4cb;border-radius:999px;background:#07304466;color:#e3fbff;font-size:12px;font-weight:600;line-height:1.2;letter-spacing:2px;cursor:pointer;box-shadow:0 0 8px #00dfe555,inset 0 0 10px #00ffff11;transition:border-color .2s,box-shadow .2s,background .2s}
.nr-submit:hover,.nr-submit[data-preview-active=true]{border-color:#00ffff;background:#06394799;box-shadow:0 0 11px #00ffffaa,0 0 25px #00ffff44,inset 0 0 12px #00ffff22}
.nr-submit:disabled{opacity:.6;cursor:wait}
.nr-submit[aria-busy=true]:after{content:"";width:12px;height:12px;border:2px solid #ffffff40;border-top-color:#00ffff;border-radius:50%;animation:nr-spinner .7s linear infinite}
.nr-switch{margin:40px 0 0;color:#8193a3;font-size:11px;line-height:1.4}
.nr-switch button,.nr-switch>span{padding:0;border:0;background:transparent;color:#00ffff;font:inherit;cursor:pointer;text-shadow:0 0 6px #00ffff77}
.nr-switch button:hover{text-decoration:underline;text-underline-offset:3px}
.nr-reset-copy{margin:18px 0 0;color:#8fa3b3;font-size:12px;line-height:1.5}
.nr-feedback{position:relative;flex:0 0 auto;width:360px;max-width:100%;text-align:center}
.nr-feedback p{margin:0;padding:10px 12px;border:1px solid #00e7e755;border-radius:12px;background:#0b1f2ddd;color:#adf9f9;font-size:12px;line-height:1.5;overflow-wrap:anywhere}
.nr-feedback p[data-kind=error]{border-color:#ff6f8866;color:#ffb9c7}
.nr-feedback button{margin:8px 0 0;padding:2px;border:0;background:transparent;color:#a8d6df;font-size:11px;text-decoration:underline;cursor:pointer}
.neon-ring-auth button:focus-visible,.nr-options input:focus-visible{outline:2px solid #00e9e9;outline-offset:4px}
.nr-particles{position:absolute;inset:0;pointer-events:none}
.nr-particles span{position:absolute;width:3px;height:3px;border-radius:50%;background:#72e8ff77;box-shadow:0 0 6px #00d9ff77;animation:nr-particle-float 7s ease-in-out infinite alternate}
.nr-particles span:nth-child(1){left:20%;top:78%;animation-delay:-1s}.nr-particles span:nth-child(2){left:71%;top:79%;width:2px;height:2px;animation-delay:-3s}.nr-particles span:nth-child(3){left:82%;top:67%;animation-delay:-5s}.nr-particles span:nth-child(4){left:34%;top:86%;width:2px;height:2px;animation-delay:-2s}.nr-particles span:nth-child(5){left:64%;top:13%;width:2px;height:2px;animation-delay:-4s}.nr-particles span:nth-child(6){left:16%;top:43%;width:2px;height:2px;animation-delay:-6s}
@keyframes nr-ring-spin{to{transform:rotate(360deg)}}
@keyframes nr-spinner{to{transform:rotate(360deg)}}
@keyframes nr-particle-float{from{transform:translateY(0);opacity:.25}to{transform:translateY(-16px);opacity:.9}}
.neon-ring-auth[data-running=false] *,.neon-ring-auth[data-running=false] *:before,.neon-ring-auth[data-running=false] *:after{animation-play-state:paused!important}
@container neon-ring-auth (max-width:520px){
.neon-ring-auth:not(.nr-thumbnail) .nr-stage{--nr-size:max(320px,min(360px,calc(100cqw - 36px)));min-height:570px;padding:60px 18px 70px}
.neon-ring-auth:not(.nr-thumbnail) .nr-form-body{width:226px;max-width:70%}
.neon-ring-auth:not(.nr-thumbnail) .nr-form-body h2{font-size:24px}
.neon-ring-auth:not(.nr-thumbnail) .nr-subtitle{font-size:11px;margin-bottom:20px}
.neon-ring-auth:not(.nr-thumbnail) .nr-fields{gap:14px}
.neon-ring-auth:not(.nr-thumbnail) .nr-field{height:40px}
.neon-ring-auth:not(.nr-thumbnail) .nr-options{font-size:10px;margin-top:12px}
.neon-ring-auth:not(.nr-thumbnail) .nr-options button{font-size:10px}
.neon-ring-auth:not(.nr-thumbnail) .nr-submit{min-height:40px;margin-top:17px;font-size:11px}
.neon-ring-auth:not(.nr-thumbnail) .nr-switch{margin-top:27px;font-size:10px}
}
@container neon-ring-auth (max-width:360px){.neon-ring-auth:not(.nr-thumbnail) .nr-form-body h2{font-size:21px}.neon-ring-auth:not(.nr-thumbnail) .nr-subtitle{font-size:10px;margin-bottom:16px}.neon-ring-auth:not(.nr-thumbnail) .nr-field{height:36px}.neon-ring-auth:not(.nr-thumbnail) .nr-fields{gap:10px}.neon-ring-auth:not(.nr-thumbnail) .nr-switch{margin-top:20px}.neon-ring-auth:not(.nr-thumbnail) .nr-submit{min-height:36px;font-size:9px;letter-spacing:1.3px}.neon-ring-auth:not(.nr-thumbnail) .nr-options{font-size:9px}.neon-ring-auth:not(.nr-thumbnail) .nr-options button{font-size:9px}}
.nr-thumbnail{height:100%;min-height:0}
.nr-thumbnail .nr-stage{--nr-size:280px;height:100%;min-height:0;padding:10px}
.nr-thumbnail .nr-ring:before{animation:none;transform:rotate(var(--nr-preview-turn,0deg));transition:transform .6s ease}
.nr-thumbnail .nr-particles span{animation:none}
.nr-thumbnail .nr-form-body{width:260px;max-width:none;transform:scale(.6);flex-shrink:0}
.nr-static-label{position:absolute;left:17px;top:50%;transform:translateY(-50%);font-size:12px;line-height:1;color:#8fa3b3}
.nr-preview-remember{display:flex;align-items:center;gap:5px}
.nr-preview-remember>span{width:10px;height:10px;background:#e6f0f5;border-radius:1px}
.nr-thumbnail .nr-eye,.nr-thumbnail .nr-submit,.nr-thumbnail .nr-switch>span,.nr-thumbnail .nr-options>span:last-child{cursor:default}
@media(prefers-reduced-motion:reduce){.neon-ring-auth *,.neon-ring-auth *:before,.neon-ring-auth *:after{animation:none!important;transition:none!important}}
`;
