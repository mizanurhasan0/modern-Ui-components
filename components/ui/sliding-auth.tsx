"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

export type SlidingAuthMode = "login" | "register";
export type SlidingSocialProvider = "google" | "facebook" | "github" | "linkedin";
export interface SlidingLoginValues { username: string; password: string }
export interface SlidingRegistrationValues extends SlidingLoginValues { email: string }
export interface SlidingAuthProps {
  initialMode?: SlidingAuthMode;
  onLogin?: (values: SlidingLoginValues) => void | Promise<void>;
  onRegister?: (values: SlidingRegistrationValues) => void | Promise<void>;
  onResetPassword?: (email: string) => void | Promise<void>;
  onSocialSignIn?: (provider: SlidingSocialProvider) => void | Promise<void>;
  className?: string;
}

type FormMode = SlidingAuthMode | "reset";
type FieldName = "username" | "email" | "password";
const PROVIDERS: SlidingSocialProvider[] = ["google", "facebook", "github", "linkedin"];
const PROVIDER_NAMES = { google: "Google", facebook: "Facebook", github: "GitHub", linkedin: "LinkedIn" };

function SlidingIcon({ name }: { name: FieldName | SlidingSocialProvider }) {
  if (name === "google") return <span className="sa-google">G</span>;
  if (name === "facebook") return <span className="sa-facebook">f</span>;
  if (name === "linkedin") return <span className="sa-linkedin">in</span>;
  return <svg width="18" height="18" viewBox="0 0 24 24" fill={name === "github" ? "currentColor" : "none"} stroke={name === "github" ? "none" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "username" && <><circle cx="12" cy="7.5" r="3.3" fill="currentColor" stroke="none" /><path d="M5.5 20v-2.3a6.5 6.5 0 0 1 13 0V20Z" fill="currentColor" stroke="none" /></>}
    {name === "email" && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>}
    {name === "password" && <><rect x="6" y="10" width="12" height="11" rx="2" fill="currentColor" stroke="none" /><path d="M8.5 10V6a3.5 3.5 0 0 1 7 0v4" /><path d="M12 14v3" stroke="#fff" /></>}
    {name === "github" && <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.61-3.37-1.18-3.37-1.18-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.64-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.67-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.69 1.03 1.58 1.03 2.67 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />}
  </svg>;
}

/** Sliding registration and login. Supply callbacks to connect your own service. */
export default function SlidingAuth({ initialMode = "login", onLogin, onRegister, onResetPassword, onSocialSignIn, className = "" }: SlidingAuthProps) {
  const [mode, setMode] = useState<FormMode>(initialMode);
  const [switching, setSwitching] = useState(false);
  const [values, setValues] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const mounted = useRef(false);
  const busy = useRef(false);
  const switchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const registering = mode === "register";
  const title = registering ? "Registration" : mode === "reset" ? "Reset Password" : "Login";

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (switchTimer.current) clearTimeout(switchTimer.current);
    };
  }, []);

  function changeMode(next: FormMode) {
    if (busy.current || switching) return;
    const animate = (mode === "register") !== (next === "register") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMode(next);
    setErrors({});
    setMessage("");
    setCompleted(false);
    setValues((current) => ({ ...current, password: "" }));
    setSwitching(animate);
    if (switchTimer.current) clearTimeout(switchTimer.current);
    switchTimer.current = setTimeout(() => {
      setSwitching(false);
      headingRef.current?.focus({ preventScroll: true });
    }, animate ? 900 : 0);
  }

  async function runAction(action: (() => void | Promise<void>) | undefined, demo: string, success: string, showComplete = true) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setMessage("");
    setFailed(false);
    try {
      await action?.();
      if (!mounted.current) return;
      setMessage(action ? success : demo);
      setCompleted(showComplete);
      setValues((current) => ({ ...current, password: "" }));
    } catch {
      if (mounted.current) { setMessage("Something went wrong. Please try again."); setFailed(true); }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const clean = { ...values, username: values.username.trim(), email: values.email.trim() };
    const nextErrors: Partial<Record<FieldName, string>> = {};
    if (mode !== "reset" && !clean.username) nextErrors.username = "Enter your username.";
    if (mode !== "login" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) nextErrors.email = "Enter a valid email address.";
    if (mode !== "reset" && !clean.password) nextErrors.password = "Enter your password.";
    else if (registering && clean.password.length < 8) nextErrors.password = "Use at least 8 characters.";
    setErrors(nextErrors);
    const invalid = Object.keys(nextErrors)[0];
    if (invalid) { (formRef.current?.elements.namedItem(invalid) as HTMLInputElement | null)?.focus(); return; }
    if (mode === "login") void runAction(onLogin ? () => onLogin({ username: clean.username, password: clean.password }) : undefined, "Demo complete. No account was signed in.", "You’re signed in.");
    else if (registering) void runAction(onRegister ? () => onRegister(clean) : undefined, "Demo complete. No account was created.", "Your account is ready.");
    else void runAction(onResetPassword ? () => onResetPassword(clean.email) : undefined, "Demo complete. No reset email was sent.", "If your account exists, a reset link is on its way.");
  }

  function field(name: FieldName) {
    const label = name === "username" ? "Username" : name === "email" ? "Email" : "Password";
    return <div className="sa-field-group" key={name}>
      <label className="sa-sr-only" htmlFor={`${id}-${name}`}>{label}</label>
      <div className="sa-input-wrap"><input id={`${id}-${name}`} name={name} type={name === "password" ? "password" : name === "email" ? "email" : "text"} placeholder={label} autoComplete={name === "password" ? (registering ? "new-password" : "current-password") : name} maxLength={name === "password" ? 128 : name === "email" ? 254 : 80} value={values[name]} required disabled={pending} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${id}-${name}-error` : undefined} onChange={(event) => { setValues((current) => ({ ...current, [name]: event.target.value })); setErrors((current) => ({ ...current, [name]: undefined })); }} /><span aria-hidden="true"><SlidingIcon name={name} /></span></div>
      {errors[name] && <p className="sa-error" id={`${id}-${name}-error`}>{errors[name]}</p>}
    </div>;
  }

  return <section className={`sliding-auth relative w-full ${className}`} aria-label="Sliding login and registration">
    <style>{SLIDING_STYLES}</style>
    <div className="sa-stage"><div className="sa-card" data-register={registering} data-switching={switching}>
      <div className="sa-form-panel" inert={switching}>
        <h2 className="sa-title" ref={headingRef} tabIndex={-1}>{completed ? "All set!" : title}</h2>
        {completed ? <div className="sa-completed"><span className="sa-check" aria-hidden="true">✓</span><p role="status">{message}</p><button type="button" className="sa-primary" onClick={() => changeMode("login")}>Back to login</button></div> : <>
          <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending}>
            {mode === "reset" && <p className="sa-reset-copy">Enter your email and we’ll help you get back in.</p>}
            {mode !== "reset" && field("username")}
            {mode !== "login" && field("email")}
            {mode !== "reset" && field("password")}
            {mode === "login" && <button type="button" className="sa-forgot" disabled={pending} onClick={() => changeMode("reset")}>Forgot Password?</button>}
            <button type="submit" className="sa-primary" disabled={pending}>{pending ? "Please wait…" : registering ? "Register" : mode === "reset" ? "Send reset link" : "Login"}</button>
          </form>
          {mode === "reset" ? <button type="button" className="sa-forgot" disabled={pending} onClick={() => changeMode("login")}>Back to login</button> : <><p className="sa-social-copy">or {registering ? "register" : "login"} with social platforms</p><div className="sa-socials">{PROVIDERS.map((provider) => <button type="button" key={provider} disabled={pending} aria-label={`Continue with ${PROVIDER_NAMES[provider]}`} onClick={() => void runAction(onSocialSignIn ? () => onSocialSignIn(provider) : undefined, `${PROVIDER_NAMES[provider]} demo selected. Connect onSocialSignIn to continue with a provider.`, "Provider sign-in completed.", false)}><SlidingIcon name={provider} /></button>)}</div></>}
          {message && <p className={failed ? "sa-error sa-feedback" : "sa-feedback"} role={failed ? "alert" : "status"}>{message}</p>}
        </>}
      </div>
      <div className="sa-color-panel"><div className="sa-welcome" inert={switching}>
        <h2>{registering ? "Welcome Back!" : "Hello, Welcome!"}</h2>
        <p>{registering ? "Already have an account?" : "Don’t have an account?"}</p>
        <button type="button" disabled={pending || switching} onClick={() => changeMode(registering ? "login" : "register")}>{registering ? "Login" : "Register"}</button>
      </div></div>
    </div></div>
  </section>;
}

/** Static states for a gallery; no timers, forms, or interactive descendants. */
export function SlidingAuthThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const registering = Math.abs(Math.trunc(previewStep)) % 2 === 1;
  return <div className={`sliding-auth sa-thumbnail ${className}`} aria-hidden="true" inert><style>{SLIDING_STYLES}</style><div className="sa-stage"><div className="sa-card" data-register={registering}><div className="sa-form-panel"><h2 className="sa-title">{registering ? "Registration" : "Login"}</h2><div className="sa-input-wrap sa-fake-field">Username<SlidingIcon name="username" /></div>{registering && <div className="sa-input-wrap sa-fake-field">Email<SlidingIcon name="email" /></div>}<div className="sa-input-wrap sa-fake-field">Password<SlidingIcon name="password" /></div>{!registering && <span className="sa-forgot">Forgot Password?</span>}<span className="sa-primary">{registering ? "Register" : "Login"}</span><p className="sa-social-copy">or {registering ? "register" : "login"} with social platforms</p><div className="sa-socials">{PROVIDERS.map((provider) => <span key={provider}><SlidingIcon name={provider} /></span>)}</div></div><div className="sa-color-panel"><div className="sa-welcome"><h2>{registering ? "Welcome Back!" : "Hello, Welcome!"}</h2><p>{registering ? "Already have an account?" : "Don’t have an account?"}</p><span className="sa-switch-look">{registering ? "Login" : "Register"}</span></div></div></div></div></div>;
}

const SLIDING_STYLES = `
.sliding-auth{--sa-blue:#7b9fe0;container-type:inline-size;font-family:Arial,Helvetica,sans-serif;color:#303030;isolation:isolate;min-width:0}
.sliding-auth *{box-sizing:border-box}.sliding-auth button,.sliding-auth input{font:inherit}.sliding-auth button{cursor:pointer}.sliding-auth button:disabled{cursor:wait;opacity:.65}.sliding-auth button:focus-visible,.sliding-auth input:focus-visible{outline:3px solid #3c63b5;outline-offset:4px}.sliding-auth .sa-title:focus{outline:none}
.sliding-auth .sa-stage{display:grid;place-items:center;min-height:620px;padding:34px 24px;background:linear-gradient(100deg,#e4e8eb,#e2e8fa)}
.sliding-auth .sa-card{position:relative;width:100%;max-width:850px;min-height:550px;background:#fff;border-radius:30px;box-shadow:0 0 30px #0002;overflow:hidden}
.sliding-auth .sa-form-panel{position:relative;display:flex;flex-direction:column;justify-content:center;min-height:550px;width:50%;margin-left:50%;padding:40px;transition:margin-left .9s cubic-bezier(.65,0,.35,1);text-align:center}
.sliding-auth .sa-card[data-register=true] .sa-form-panel{margin-left:0}.sliding-auth .sa-title{font-size:34px;line-height:1.2;font-weight:750;margin:0 0 28px;letter-spacing:-1.2px}.sliding-auth .sa-field-group{margin:0 0 20px}.sliding-auth .sa-input-wrap{position:relative;display:flex;align-items:center;min-height:48px;background:#f2f2f2;border-radius:7px}.sliding-auth .sa-input-wrap input{width:100%;min-width:0;border:0;border-radius:7px;background:transparent;padding:15px 44px 15px 18px;font-size:14px;color:#303030;outline-offset:2px}.sliding-auth .sa-input-wrap input::placeholder{color:#888}.sliding-auth .sa-input-wrap>span{position:absolute;right:16px;display:flex}.sliding-auth .sa-input-wrap:has(input[aria-invalid=true]){box-shadow:inset 0 0 0 1px #b64343}
.sliding-auth .sa-forgot{display:block;border:0;background:none;font-size:12px;color:#555;margin:-1px auto 17px;padding:0;text-decoration:none}.sliding-auth button.sa-forgot:hover{text-decoration:underline}.sliding-auth .sa-primary{display:flex;align-items:center;justify-content:center;min-height:45px;width:100%;border:0;border-radius:7px;background:var(--sa-blue);box-shadow:0 2px 5px #0001;color:#fff;font-size:14px;font-weight:650;padding:12px 15px}.sliding-auth .sa-primary:hover{background:#6b90d1}.sliding-auth .sa-social-copy{margin:19px 0 15px;font-size:12px;color:#555}.sliding-auth .sa-socials{display:flex;justify-content:center;gap:12px}.sliding-auth .sa-socials>button,.sliding-auth .sa-socials>span{display:grid;place-items:center;width:43px;height:41px;border:1px solid #d5d5d5;border-radius:7px;background:#fff;color:#333}.sliding-auth .sa-socials>button:hover{background:#f2f5fc;border-color:var(--sa-blue)}.sliding-auth .sa-google{font-weight:750;font-size:22px}.sliding-auth .sa-facebook{font:bold 24px Arial}.sliding-auth .sa-linkedin{font:bold 18px Arial;letter-spacing:-1px}
.sliding-auth .sa-color-panel{position:absolute;z-index:2;inset:0 auto 0 0;width:50%;background:var(--sa-blue);border-radius:0 150px 150px 0;display:flex;align-items:center;justify-content:center;color:#fff}.sliding-auth .sa-card[data-register=true] .sa-color-panel{left:50%;border-radius:150px 0 0 150px}.sliding-auth .sa-welcome{width:100%;text-align:center;padding:30px 20px}.sliding-auth .sa-welcome h2{font-size:32px;font-weight:750;letter-spacing:-1px;line-height:1.15;margin:0 0 13px}.sliding-auth .sa-welcome p{font-size:13px;margin:0 0 23px}.sliding-auth .sa-welcome button,.sliding-auth .sa-switch-look{display:inline-flex;align-items:center;justify-content:center;min-width:150px;min-height:42px;border:2px solid #fffc;border-radius:8px;padding:10px 25px;background:transparent;color:#fff;font-size:14px;font-weight:650}.sliding-auth .sa-welcome button:hover{background:#ffffff17}.sliding-auth .sa-welcome button:focus-visible{outline-color:#fff}
.sliding-auth .sa-card[data-switching=true][data-register=true] .sa-color-panel{animation:sa-slide-right .9s cubic-bezier(.65,0,.35,1)}.sliding-auth .sa-card[data-switching=true][data-register=false] .sa-color-panel{animation:sa-slide-left .9s cubic-bezier(.65,0,.35,1)}.sliding-auth .sa-card[data-switching=true] .sa-form-panel,.sliding-auth .sa-card[data-switching=true] .sa-welcome{animation:sa-content .9s both}.sliding-auth .sa-error{margin:7px 0 0;color:#b4323b;text-align:left;font-size:11px;line-height:1.5}.sliding-auth .sa-feedback{margin:16px 0 0;font-size:12px;line-height:1.6}.sliding-auth .sa-completed p{font-size:14px;line-height:1.8;margin:20px 0}.sliding-auth .sa-check{display:inline-grid;place-items:center;width:56px;height:56px;border-radius:50%;background:#edf3ff;color:#6087cf;font-size:28px}.sliding-auth .sa-reset-copy{font-size:13px;line-height:1.7;margin:0 0 25px}.sliding-auth .sa-sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.sliding-auth .sa-form-panel>button.sa-forgot{margin-top:18px}
@keyframes sa-slide-right{0%{left:0;width:50%;border-radius:0 150px 150px 0}45%{left:0;width:100%;border-radius:0}100%{left:50%;width:50%;border-radius:150px 0 0 150px}}@keyframes sa-slide-left{0%{left:50%;width:50%;border-radius:150px 0 0 150px}45%{left:0;width:100%;border-radius:0}100%{left:0;width:50%;border-radius:0 150px 150px 0}}@keyframes sa-content{0%,46%{opacity:0}100%{opacity:1}}
@container(max-width:650px){.sliding-auth:not(.sa-thumbnail) .sa-stage{padding:20px 16px;min-height:750px}.sliding-auth:not(.sa-thumbnail) .sa-card{min-height:710px;max-width:420px;border-radius:24px}.sliding-auth:not(.sa-thumbnail) .sa-form-panel{width:100%;min-height:470px;margin:240px 0 0;padding:35px 28px}.sliding-auth:not(.sa-thumbnail) .sa-card[data-register=true] .sa-form-panel{margin:0 0 240px}.sliding-auth:not(.sa-thumbnail) .sa-color-panel{width:100%;height:240px;left:0;top:0;bottom:auto;border-radius:0 0 95px 95px}.sliding-auth:not(.sa-thumbnail) .sa-card[data-register=true] .sa-color-panel{left:0;top:calc(100% - 240px);border-radius:95px 95px 0 0}.sliding-auth:not(.sa-thumbnail) .sa-welcome h2{font-size:29px}.sliding-auth:not(.sa-thumbnail) .sa-welcome p{margin-bottom:16px}.sliding-auth:not(.sa-thumbnail) .sa-card[data-switching=true][data-register=true] .sa-color-panel{animation-name:sa-slide-down}.sliding-auth:not(.sa-thumbnail) .sa-card[data-switching=true][data-register=false] .sa-color-panel{animation-name:sa-slide-up}.sliding-auth:not(.sa-thumbnail) .sa-title{font-size:30px}}
@keyframes sa-slide-down{0%{top:0;height:240px;border-radius:0 0 95px 95px}45%{top:0;height:100%;border-radius:0}100%{top:calc(100% - 240px);height:240px;border-radius:95px 95px 0 0}}@keyframes sa-slide-up{0%{top:calc(100% - 240px);height:240px;border-radius:95px 95px 0 0}45%{top:0;height:100%;border-radius:0}100%{top:0;height:240px;border-radius:0 0 95px 95px}}
.sliding-auth.sa-thumbnail{height:100%;min-height:0;pointer-events:none}.sliding-auth.sa-thumbnail .sa-stage{height:100%;min-height:0;padding:28px 20px}.sliding-auth.sa-thumbnail .sa-card{min-height:245px;max-width:430px;border-radius:16px}.sliding-auth.sa-thumbnail .sa-form-panel{min-height:245px;padding:20px 15px}.sliding-auth.sa-thumbnail .sa-title{font-size:17px;letter-spacing:-.4px;margin-bottom:15px}.sliding-auth.sa-thumbnail .sa-fake-field{font-size:7px;height:25px;min-height:0;padding:7px 10px;margin-bottom:11px;justify-content:space-between;color:#888;border-radius:3px}.sliding-auth.sa-thumbnail .sa-fake-field svg{width:9px;height:9px}.sliding-auth.sa-thumbnail .sa-primary{min-height:23px;padding:5px;font-size:7px;border-radius:3px}.sliding-auth.sa-thumbnail .sa-forgot{font-size:6px;margin-bottom:9px}.sliding-auth.sa-thumbnail .sa-social-copy{font-size:6px;margin:10px 0 8px}.sliding-auth.sa-thumbnail .sa-socials{gap:6px}.sliding-auth.sa-thumbnail .sa-socials>span{width:21px;height:21px;border-radius:4px}.sliding-auth.sa-thumbnail .sa-socials svg{width:11px;height:11px}.sliding-auth.sa-thumbnail .sa-google,.sliding-auth.sa-thumbnail .sa-facebook{font-size:12px}.sliding-auth.sa-thumbnail .sa-linkedin{font-size:10px}.sliding-auth.sa-thumbnail .sa-welcome{padding:15px 9px}.sliding-auth.sa-thumbnail .sa-welcome h2{font-size:17px;letter-spacing:-.5px;margin-bottom:8px}.sliding-auth.sa-thumbnail .sa-welcome p{font-size:7px;margin-bottom:13px}.sliding-auth.sa-thumbnail .sa-switch-look{min-width:74px;min-height:23px;padding:5px 10px;font-size:7px;border-width:1px;border-radius:4px}.sliding-auth.sa-thumbnail .sa-color-panel{border-radius:0 70px 70px 0;transition:left .9s cubic-bezier(.65,0,.35,1),border-radius .9s}.sliding-auth.sa-thumbnail .sa-card[data-register=true] .sa-color-panel{border-radius:70px 0 0 70px}
@media(prefers-reduced-motion:reduce){.sliding-auth *,.sliding-auth *::before,.sliding-auth *::after{animation:none!important;transition:none!important}}
`;
