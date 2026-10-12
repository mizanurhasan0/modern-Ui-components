"use client";

import { ComponentStyles } from "./component-styles";

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

function SlidingIcon({ name, thumbnail = false }: { name: FieldName | SlidingSocialProvider; thumbnail?: boolean }) {
  if (name === "google") return <span className={thumbnail ? "text-[12px] font-[750]" : "text-[22px] font-[750]"}>G</span>;
  if (name === "facebook") return <span className={thumbnail ? "[font:bold_12px_Arial]" : "[font:bold_24px_Arial]"}>f</span>;
  if (name === "linkedin") return <span className={thumbnail ? "[font:bold_10px_Arial] tracking-[-1px]" : "[font:bold_18px_Arial] tracking-[-1px]"}>in</span>;
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
    return <div className="mb-5" key={name}>
      <label className="sr-only" htmlFor={`${id}-${name}`}>{label}</label>
      <div className="relative flex min-h-12 items-center rounded-[7px] bg-[#f2f2f2] has-[input[aria-invalid=true]]:[box-shadow:inset_0_0_0_1px_#b64343]"><input className="w-full min-w-0 rounded-[7px] border-0 bg-transparent py-[15px] pr-11 pl-[18px] text-[14px] text-[#303030] placeholder:text-[#888]" id={`${id}-${name}`} name={name} type={name === "password" ? "password" : name === "email" ? "email" : "text"} placeholder={label} autoComplete={name === "password" ? (registering ? "new-password" : "current-password") : name} maxLength={name === "password" ? 128 : name === "email" ? 254 : 80} value={values[name]} required disabled={pending} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${id}-${name}-error` : undefined} onChange={(event) => { setValues((current) => ({ ...current, [name]: event.target.value })); setErrors((current) => ({ ...current, [name]: undefined })); }} /><span className="absolute right-4 flex" aria-hidden="true"><SlidingIcon name={name} /></span></div>
      {errors[name] && <p className="mt-[7px] text-left text-[11px] leading-[1.5] text-[#b4323b]" id={`${id}-${name}-error`}>{errors[name]}</p>}
    </div>;
  }

  // The colour panel sweeps across (or, in the compact layout, down) while the mode switches.
  const slide = !switching ? "" : registering
    ? "animate-[sa-slide-right_.9s_cubic-bezier(.65,0,.35,1)] [@container(max-width:650px)]:[animation-name:sa-slide-down]"
    : "animate-[sa-slide-left_.9s_cubic-bezier(.65,0,.35,1)] [@container(max-width:650px)]:[animation-name:sa-slide-up]";

  return <section className={`sliding-auth relative flex w-full min-w-0 flex-col isolate text-[#303030] [font-family:Arial,Helvetica,sans-serif] [--sa-blue:#7b9fe0] @container ${className}`} aria-label="Sliding login and registration">
    <ComponentStyles css={SLIDING_STYLES} />
    <div className="grid min-h-[620px] flex-[1_0_auto] place-items-center bg-[linear-gradient(100deg,#e4e8eb,#e2e8fa)] px-6 py-[34px] [@container(max-width:650px)]:min-h-[750px] [@container(max-width:650px)]:px-4 [@container(max-width:650px)]:py-5">
      <div className="relative min-h-[550px] w-full max-w-[850px] overflow-hidden rounded-[30px] bg-white [box-shadow:0_0_30px_#0002] [@container(max-width:650px)]:min-h-[710px] [@container(max-width:650px)]:max-w-[420px] [@container(max-width:650px)]:rounded-[24px]" data-register={registering} data-switching={switching}>
        <div className="relative ml-[50%] flex min-h-[550px] w-1/2 flex-col justify-center p-10 text-center [transition:margin-left_.9s_cubic-bezier(.65,0,.35,1)] in-data-[register=true]:ml-0 in-data-[switching=true]:animate-[sa-content_.9s_both] [@container(max-width:650px)]:mt-[240px] [@container(max-width:650px)]:ml-0 [@container(max-width:650px)]:min-h-[470px] [@container(max-width:650px)]:w-full [@container(max-width:650px)]:px-7 [@container(max-width:650px)]:py-[35px] [@container(max-width:650px)]:in-data-[register=true]:mt-0 [@container(max-width:650px)]:in-data-[register=true]:mb-[240px]" inert={switching}>
          <h2 className="sa-title mb-7 text-[34px] leading-[1.2] font-[750] tracking-[-1.2px] [@container(max-width:650px)]:text-[30px]" ref={headingRef} tabIndex={-1}>{completed ? "All set!" : title}</h2>
          {completed ? <div><span className="inline-grid size-14 place-items-center rounded-[50%] bg-[#edf3ff] text-[28px] text-[#6087cf]" aria-hidden="true">✓</span><p className="my-5 text-[14px] leading-[1.8]" role="status">{message}</p><button type="button" className={PRIMARY_BUTTON} onClick={() => changeMode("login")}>Back to login</button></div> : <>
            <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending}>
              {mode === "reset" && <p className="mb-[25px] text-[13px] leading-[1.7]">Enter your email and we’ll help you get back in.</p>}
              {mode !== "reset" && field("username")}
              {mode !== "login" && field("email")}
              {mode !== "reset" && field("password")}
              {mode === "login" && <button type="button" className={`-mt-px ${TEXT_BUTTON}`} disabled={pending} onClick={() => changeMode("reset")}>Forgot Password?</button>}
              <button type="submit" className={PRIMARY_BUTTON} disabled={pending}>{pending ? "Please wait…" : registering ? "Register" : mode === "reset" ? "Send reset link" : "Login"}</button>
            </form>
            {mode === "reset" ? <button type="button" className={`mt-[18px] ${TEXT_BUTTON}`} disabled={pending} onClick={() => changeMode("login")}>Back to login</button> : <><p className="mt-[19px] mb-[15px] text-[12px] text-[#555]">or {registering ? "register" : "login"} with social platforms</p><div className="flex justify-center gap-3">{PROVIDERS.map((provider) => <button type="button" className={`grid h-[41px] w-[43px] place-items-center rounded-[7px] border border-[#d5d5d5] bg-white text-[#333] hover:border-(--sa-blue) hover:bg-[#f2f5fc] ${BUTTON_STATES}`} key={provider} disabled={pending} aria-label={`Continue with ${PROVIDER_NAMES[provider]}`} onClick={() => void runAction(onSocialSignIn ? () => onSocialSignIn(provider) : undefined, `${PROVIDER_NAMES[provider]} demo selected. Connect onSocialSignIn to continue with a provider.`, "Provider sign-in completed.", false)}><SlidingIcon name={provider} /></button>)}</div></>}
            {message && <p className={failed ? "mt-4 text-left text-[12px] leading-[1.6] text-[#b4323b]" : "mt-4 text-[12px] leading-[1.6]"} role={failed ? "alert" : "status"}>{message}</p>}
          </>}
        </div>
        <div className={`absolute inset-y-0 left-0 z-2 flex w-1/2 items-center justify-center rounded-[0_150px_150px_0] bg-(--sa-blue) text-white in-data-[register=true]:left-1/2 in-data-[register=true]:rounded-[150px_0_0_150px] [@container(max-width:650px)]:top-0 [@container(max-width:650px)]:bottom-auto [@container(max-width:650px)]:left-0 [@container(max-width:650px)]:h-[240px] [@container(max-width:650px)]:w-full [@container(max-width:650px)]:rounded-[0_0_95px_95px] [@container(max-width:650px)]:in-data-[register=true]:top-[calc(100%-240px)] [@container(max-width:650px)]:in-data-[register=true]:left-0 [@container(max-width:650px)]:in-data-[register=true]:rounded-[95px_95px_0_0] ${slide}`}>
          <div className="sa-welcome w-full px-5 py-[30px] text-center in-data-[switching=true]:animate-[sa-content_.9s_both]" inert={switching}>
            <h2 className="mb-[13px] text-[32px] leading-[1.15] font-[750] tracking-[-1px] [@container(max-width:650px)]:text-[29px]">{registering ? "Welcome Back!" : "Hello, Welcome!"}</h2>
            <p className="mb-[23px] text-[13px] [@container(max-width:650px)]:mb-4">{registering ? "Already have an account?" : "Don’t have an account?"}</p>
            <button type="button" className={`inline-flex min-h-[42px] min-w-[150px] items-center justify-center rounded-[8px] border-2 border-[#fffc] px-[25px] py-2.5 text-[14px] font-[650] text-white hover:bg-[#ffffff17] ${BUTTON_STATES}`} disabled={pending || switching} onClick={() => changeMode(registering ? "login" : "register")}>{registering ? "Login" : "Register"}</button>
          </div>
        </div>
      </div>
    </div>
  </section>;
}

/** Static states for a gallery; no timers, forms, or interactive descendants. */
export function SlidingAuthThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const registering = Math.abs(Math.trunc(previewStep)) % 2 === 1;
  const fakeField = "relative mb-[11px] flex h-[25px] min-h-0 items-center justify-between rounded-[3px] bg-[#f2f2f2] px-2.5 py-[7px] text-[7px] text-[#888] [&>svg]:size-[9px]";
  return <div className={`sliding-auth sa-thumbnail pointer-events-none flex h-full min-h-0 min-w-0 flex-col isolate text-[#303030] [font-family:Arial,Helvetica,sans-serif] [--sa-blue:#7b9fe0] @container ${className}`} aria-hidden="true" inert>
    <ComponentStyles css={SLIDING_STYLES} />
    <div className="grid h-full min-h-0 flex-[1_0_auto] place-items-center bg-[linear-gradient(100deg,#e4e8eb,#e2e8fa)] px-5 py-7">
      <div className="relative min-h-[245px] w-full max-w-[430px] overflow-hidden rounded-[16px] bg-white [box-shadow:0_0_30px_#0002]" data-register={registering}>
        <div className="relative ml-[50%] flex min-h-[245px] w-1/2 flex-col justify-center px-[15px] py-5 text-center [transition:margin-left_.9s_cubic-bezier(.65,0,.35,1)] in-data-[register=true]:ml-0">
          <h2 className="mb-[15px] text-[17px] leading-[1.2] font-[750] tracking-[-0.4px]">{registering ? "Registration" : "Login"}</h2>
          <div className={fakeField}>Username<SlidingIcon name="username" /></div>
          {registering && <div className={fakeField}>Email<SlidingIcon name="email" /></div>}
          <div className={fakeField}>Password<SlidingIcon name="password" /></div>
          {!registering && <span className="mx-auto -mt-px mb-[9px] block text-[6px] text-[#555]">Forgot Password?</span>}
          <span className="flex min-h-[23px] w-full items-center justify-center rounded-[3px] bg-(--sa-blue) p-[5px] text-[7px] font-[650] text-white [box-shadow:0_2px_5px_#0001]">{registering ? "Register" : "Login"}</span>
          <p className="mt-[10px] mb-2 text-[6px] text-[#555]">or {registering ? "register" : "login"} with social platforms</p>
          <div className="flex justify-center gap-[6px]">{PROVIDERS.map((provider) => <span className="grid size-[21px] place-items-center rounded-[4px] border border-[#d5d5d5] bg-white text-[#333] [&>svg]:size-[11px]" key={provider}><SlidingIcon name={provider} thumbnail /></span>)}</div>
        </div>
        <div className="absolute inset-y-0 left-0 z-2 flex w-1/2 items-center justify-center rounded-[0_70px_70px_0] bg-(--sa-blue) text-white [transition:left_.9s_cubic-bezier(.65,0,.35,1),border-radius_.9s] in-data-[register=true]:left-1/2 in-data-[register=true]:rounded-[70px_0_0_70px]">
          <div className="w-full px-[9px] py-[15px] text-center">
            <h2 className="mb-2 text-[17px] leading-[1.15] font-[750] tracking-[-0.5px]">{registering ? "Welcome Back!" : "Hello, Welcome!"}</h2>
            <p className="mb-[13px] text-[7px]">{registering ? "Already have an account?" : "Don’t have an account?"}</p>
            <span className="inline-flex min-h-[23px] min-w-[74px] items-center justify-center rounded-[4px] border border-[#fffc] px-2.5 py-[5px] text-[7px] font-[650] text-white">{registering ? "Login" : "Register"}</span>
          </div>
        </div>
      </div>
    </div>
  </div>;
}

const BUTTON_STATES = "cursor-pointer disabled:cursor-wait disabled:opacity-65";
const PRIMARY_BUTTON = `flex min-h-[45px] w-full items-center justify-center rounded-[7px] bg-(--sa-blue) px-[15px] py-3 text-[14px] font-[650] text-white [box-shadow:0_2px_5px_#0001] hover:bg-[#6b90d1] ${BUTTON_STATES}`;
const TEXT_BUTTON = `mx-auto mb-[17px] block text-[12px] text-[#555] hover:underline ${BUTTON_STATES}`;

// Only what utilities cannot do stays here: focus rings must beat the host app's unlayered
// global :focus-visible outline, keyframes, and a blanket reduced-motion reset.
const SLIDING_STYLES = `
.sliding-auth button:focus-visible,.sliding-auth input:focus-visible{outline:3px solid #3c63b5;outline-offset:4px}.sliding-auth input:focus-visible{outline-offset:2px}.sliding-auth .sa-welcome button:focus-visible{outline-color:#fff}.sliding-auth .sa-title:focus{outline:none}
@keyframes sa-slide-right{0%{left:0;width:50%;border-radius:0 150px 150px 0}45%{left:0;width:100%;border-radius:0}100%{left:50%;width:50%;border-radius:150px 0 0 150px}}@keyframes sa-slide-left{0%{left:50%;width:50%;border-radius:150px 0 0 150px}45%{left:0;width:100%;border-radius:0}100%{left:0;width:50%;border-radius:0 150px 150px 0}}@keyframes sa-content{0%,46%{opacity:0}100%{opacity:1}}
@keyframes sa-slide-down{0%{top:0;height:240px;border-radius:0 0 95px 95px}45%{top:0;height:100%;border-radius:0}100%{top:calc(100% - 240px);height:240px;border-radius:95px 95px 0 0}}@keyframes sa-slide-up{0%{top:calc(100% - 240px);height:240px;border-radius:95px 95px 0 0}45%{top:0;height:100%;border-radius:0}100%{top:0;height:240px;border-radius:0 0 95px 95px}}
@media(prefers-reduced-motion:reduce){.sliding-auth *,.sliding-auth *::before,.sliding-auth *::after{animation:none!important;transition:none!important}}
`;
