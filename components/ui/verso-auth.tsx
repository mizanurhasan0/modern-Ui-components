"use client";

import { ComponentStyles } from "./component-styles";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

export type VersoAuthMode = "login" | "register";
export interface VersoLoginValues { identifier: string; password: string; remember: boolean }
export interface VersoRegisterValues { name: string; email: string; password: string }
export interface VersoAuthProps {
  initialMode?: VersoAuthMode;
  brandName?: string;
  onLogin?: (values: VersoLoginValues) => void | Promise<void>;
  onRegister?: (values: VersoRegisterValues) => void | Promise<void>;
  onResetPassword?: (email: string) => void | Promise<void>;
  className?: string;
}

type Mode = VersoAuthMode | "reset";
type Field = "identifier" | "name" | "email" | "password";

function VersoIcon({ name, hidden = false }: { name: "user" | "mail" | "eye"; hidden?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "user" && <><circle cx="12" cy="7" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>}
    {name === "mail" && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>}
    {name === "eye" && <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" />{hidden && <path d="m3 3 18 18" />}</>}
  </svg>;
}

/** The dark side of the card; the thumbnail uses smaller type and never takes the narrow-container layout. */
function VersoStory({ registering, brandName, thumbnail = false }: { registering: boolean; brandName: string; thumbnail?: boolean }) {
  return <div className="va-story pointer-events-none absolute z-3 text-[#e9ead2]">
    <span className={thumbnail ? "va-brand mb-[9px] block text-[5px] font-semibold tracking-[2px] text-[#c7b67b]" : "va-brand mb-[18px] block text-[10px] font-semibold tracking-[4px] text-[#c7b67b] [@container(max-width:580px)]:mb-[13px]"}>{brandName}</span>
    <h2 className={thumbnail ? "mb-[11px] font-[Georgia,'Times_New_Roman',serif] text-[23px] leading-[.98] font-normal tracking-[-1px]" : "mb-[21px] font-[Georgia,'Times_New_Roman',serif] text-[42px] leading-[.98] font-normal tracking-[-2px] [@container(max-width:580px)]:mb-[13px] [@container(max-width:580px)]:text-[35px]"}>{registering ? "Start the" : "Welcome"}<br /><em className="font-normal text-[#d4c78e]">{registering ? "first page." : "back."}</em></h2>
    <p className={thumbnail ? "max-w-[265px] text-[7px] leading-[1.65] text-[#97afa0]" : "max-w-[265px] text-[13px] leading-[1.7] text-[#97afa0] [@container(max-width:580px)]:max-w-[280px] [@container(max-width:580px)]:text-[12px]"}>{registering ? "One account for every board, every draft and every device you own." : "Your boards, your drafts and your people are exactly where you left them."}</p>
  </div>;
}

const TEXT_BUTTON = "va-text-button border-none bg-transparent p-0 [font-size:inherit] whitespace-nowrap underline underline-offset-3";
const SWITCH_BUTTON = `${TEXT_BUTTON} font-[650] text-[#263d2c] decoration-[#b69b55]`;
const SUBMIT = "va-submit flex w-full items-center justify-center rounded-[40px] border-none bg-[linear-gradient(#19573e,#052f20)] text-[#f7f9ec] [box-shadow:0_6px_13px_#082c2933,inset_0_1px_#b5d1a521] [transition:filter_.2s,transform_.2s] hover:brightness-[1.12] hover:[transform:translateY(-1px)]";

/** A diagonal transition with real form validation and optional service callbacks. */
export default function VersoAuth({ initialMode = "login", brandName = "VERSO", onLogin, onRegister, onResetPassword, className = "" }: VersoAuthProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [moving, setMoving] = useState(false);
  const [values, setValues] = useState({ identifier: "", name: "", email: "", password: "", remember: true });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [complete, setComplete] = useState(false);
  const mounted = useRef(false);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const registering = mode === "register";
  const passwordLength = Math.min(4, Math.floor(values.password.length / 2));

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; if (timer.current) clearTimeout(timer.current); };
  }, []);

  function switchMode(next: Mode) {
    if (busy.current || moving) return;
    const animate = (next === "register") !== registering && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMoving(animate);
    setMode(next);
    setValues((current) => ({ ...current, password: "" }));
    setVisible(false);
    setErrors({});
    setMessage("");
    setFailed(false);
    setComplete(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { setMoving(false); heading.current?.focus({ preventScroll: true }); }, animate ? 950 : 0);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const clean = { ...values, identifier: values.identifier.trim(), name: values.name.trim(), email: values.email.trim() };
    const invalid: Partial<Record<Field, string>> = {};
    if (mode === "login" && !clean.identifier) invalid.identifier = "Enter your username or email.";
    if (registering && !clean.name) invalid.name = "Enter your full name.";
    if (mode !== "login" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) invalid.email = "Enter a valid email address.";
    if (mode !== "reset" && !clean.password) invalid.password = "Enter your password.";
    else if (registering && clean.password.length < 8) invalid.password = "Use 8 characters or more.";
    setErrors(invalid);
    const first = Object.keys(invalid)[0];
    if (first) { (formRef.current?.elements.namedItem(first) as HTMLInputElement | null)?.focus(); return; }
    busy.current = true;
    setPending(true);
    setFailed(false);
    setMessage("");
    const hasHandler = mode === "login" ? Boolean(onLogin) : registering ? Boolean(onRegister) : Boolean(onResetPassword);
    try {
      if (mode === "login") await onLogin?.({ identifier: clean.identifier, password: clean.password, remember: clean.remember });
      else if (registering) await onRegister?.({ name: clean.name, email: clean.email, password: clean.password });
      else await onResetPassword?.(clean.email);
      if (!mounted.current) return;
      setComplete(true);
      setValues((current) => ({ ...current, password: "" }));
      setVisible(false);
      setMessage(hasHandler ? mode === "reset" ? "If this email matches an account, a reset link is on its way." : registering ? "Your account is ready. Your first page is waiting." : "You’re signed in. Welcome back." : mode === "reset" ? "Demo complete. No reset email was sent." : registering ? "Demo complete. No account was created." : "Demo complete. No account was signed in.");
    } catch {
      if (mounted.current) { setFailed(true); setMessage("We couldn’t complete that request. Please try again."); }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  function field(name: Field, label: string) {
    return <div className="va-field-group mb-[25px]" key={name}>
      <div className="va-field group/field relative min-h-[53px] border-b border-b-[#b9bcaa] focus-within:border-[#ab914e] focus-within:[box-shadow:0_2px_0_#ab914e22] data-[invalid=true]:border-[#b24d43]" data-filled={Boolean(values[name])} data-invalid={Boolean(errors[name])}>
        <label className="va-label pointer-events-none absolute bottom-2 left-0 origin-top-left text-[15px] text-[#7b8071] [transition:transform_.18s,bottom_.18s,color_.18s] group-focus-within/field:bottom-[33px] group-focus-within/field:text-[#9b844a] group-focus-within/field:[transform:scale(.72)] group-data-[filled=true]/field:bottom-[33px] group-data-[filled=true]/field:text-[#9b844a] group-data-[filled=true]/field:[transform:scale(.72)]" htmlFor={`${id}-${name}`}>{label}</label>
        <input className="relative z-1 min-h-[53px] w-full rounded-none border-none bg-transparent pt-6 pr-[30px] pb-[7px] pl-0 text-[15px] text-[#20352a] [outline:none]" id={`${id}-${name}`} name={name} value={values[name]} type={name === "password" ? visible ? "text" : "password" : name === "email" ? "email" : "text"} required maxLength={name === "password" ? 128 : name === "email" ? 254 : 100} autoComplete={name === "password" ? registering ? "new-password" : "current-password" : name === "identifier" ? "username" : name} disabled={pending} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${id}-${name}-error` : registering && name === "password" ? `${id}-password-hint` : undefined} onChange={(event) => { setValues((current) => ({ ...current, [name]: event.target.value })); setErrors((current) => ({ ...current, [name]: undefined })); }} />
        {name === "password" ? <button className="va-eye absolute -right-1 bottom-0 z-2 grid h-[35px] w-[30px] place-items-center border-none bg-transparent p-1 text-[#8b927e] hover:text-[#284d39]" type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} disabled={pending} onClick={() => setVisible((current) => !current)}><VersoIcon name="eye" hidden={visible} /></button> : <span className="va-input-icon absolute -right-1 bottom-0 z-2 grid h-[35px] w-[30px] place-items-center border-none bg-transparent p-1 text-[#8b927e]"><VersoIcon name={name === "email" ? "mail" : "user"} /></span>}
      </div>
      {errors[name] && <p className="va-error mt-[5px] text-[11px] leading-[1.5] text-[#a44135]" id={`${id}-${name}-error`}>{errors[name]}</p>}
    </div>;
  }

  return <section className={`verso-auth @container relative isolate flex w-full min-w-0 flex-col font-[Arial,Helvetica,sans-serif] text-[#233323] ${className}`} aria-label={`${brandName} sign in and registration`}>
    <ComponentStyles css={VERSO_STYLES} />
    <div className="va-stage grid min-h-[650px] flex-auto place-items-center bg-[radial-gradient(ellipse_at_53%_0,#153b28,#03140c_76%)] px-6 py-[45px] [@container(max-width:580px)]:min-h-[790px] [@container(max-width:580px)]:px-[15px] [@container(max-width:580px)]:py-6"><div className="va-card relative isolate w-full max-w-[930px] overflow-hidden border border-[#b7c7a244] bg-[linear-gradient(130deg,#fcfaf1,#eeeada)] [box-shadow:0_30px_50px_#0005] min-h-[520px] rounded-[25px] [@container(max-width:580px)]:flex [@container(max-width:580px)]:min-h-[740px] [@container(max-width:580px)]:max-w-[440px] [@container(max-width:580px)]:flex-col [@container(max-width:580px)]:rounded-[22px]" data-register={registering} data-moving={moving}>
      <div className="va-form-panel relative flex min-h-[520px] flex-col justify-center py-[38px] [@container(max-width:580px)]:min-h-[450px] [@container(max-width:580px)]:px-7 [@container(max-width:580px)]:py-[35px]" inert={moving}>
        <h2 className="va-title mb-[19px] text-[23px] leading-[1.2] font-semibold tracking-[-.8px] after:mt-3 after:block after:h-[2px] after:w-[43px] after:bg-[#b69b55] after:content-[''] focus:[outline:none]" ref={heading} tabIndex={-1}>{complete ? "You’re all set" : registering ? "Create account" : mode === "reset" ? "Reset password" : "Sign in"}</h2>
        {complete ? <div className="va-complete"><span className="mt-[10px] inline-grid h-[45px] w-[45px] place-items-center rounded-[50%] bg-[#dce4d2] text-[24px] text-[#215039]" aria-hidden="true">✓</span><p className="mt-5 mb-7 text-[13px] leading-[1.8]" role="status">{message}</p><button className={`${SUBMIT} min-h-[46px] px-[15px] py-3 text-[13px]`} type="button" onClick={() => switchMode("login")}>Back to sign in</button></div> : <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending}>
          {mode === "reset" && <p className="va-reset-copy mb-[15px] text-[13px] leading-[1.7] text-[#7c8270]">A fresh start is one email away. Enter the address linked to your account.</p>}
          {mode === "login" && field("identifier", "Username or email")}
          {registering && field("name", "Full name")}
          {mode !== "login" && field("email", "Email address")}
          {mode !== "reset" && field("password", "Password")}
          {registering && <div className="va-password-hint -mt-[15px] mb-[26px] flex items-center justify-between gap-2 text-[9px] leading-[1.4] text-[#727965]" id={`${id}-password-hint`}><span className="va-length flex w-[30%] min-w-[70px] gap-1" aria-hidden="true">{[1, 2, 3, 4].map((segment) => <i className="h-[2px] flex-1 bg-[#dedccf] data-[filled=true]:bg-[#739274]" key={segment} data-filled={segment <= passwordLength} />)}</span><span>{values.password.length >= 8 ? "8 characters or more — ready." : "Use 8 characters or more."}</span></div>}
          {mode === "login" && <div className="va-options mt-px mb-[19px] flex items-center justify-between gap-2 text-[11px] text-[#7b8172]"><label className="va-remember flex cursor-pointer items-center gap-1.5"><input className="m-0 h-[14px] w-[14px] accent-[#20543d]" type="checkbox" checked={values.remember} disabled={pending} onChange={(event) => setValues((current) => ({ ...current, remember: event.target.checked }))} /><span>Keep me signed in</span></label><button className={`${TEXT_BUTTON} text-[#877440] hover:text-[#3a5136]`} type="button" disabled={pending} onClick={() => switchMode("reset")}>Forgot password?</button></div>}
          <button className={`${SUBMIT} min-h-[46px] px-[15px] py-3 text-[13px]`} type="submit" disabled={pending}>{pending ? "Please wait…" : registering ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}</button>
          {message && <p className={failed ? "va-error va-feedback mt-[15px] text-[11px] leading-[1.6] text-[#a44135]" : "va-feedback mt-[15px] leading-[1.6]"} role={failed ? "alert" : "status"}>{message}</p>}
          <p className="va-switch-copy mt-[19px] text-[11px] leading-[1.7] text-[#7e8474]">{registering ? "Already have an account? " : mode === "reset" ? "Remember your password? " : `New to ${brandName}? `}<button type="button" className={SWITCH_BUTTON} disabled={pending || moving} onClick={() => switchMode(registering || mode === "reset" ? "login" : "register")}>{registering || mode === "reset" ? "Sign in" : "Create an account"}</button></p>
        </form>}
      </div>
      <div className="va-band pointer-events-none absolute -inset-px z-2 [filter:drop-shadow(-2px_0_1px_#b49b4f99)]" aria-hidden="true" />
      <VersoStory registering={registering} brandName={brandName} />
    </div></div>
  </section>;
}

/** Inert stills of the two sides of the diagonal sweep. */
export function VersoAuthThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const registering = Math.abs(Math.trunc(previewStep)) % 2 === 1;
  return <div className={`verso-auth va-thumbnail @container pointer-events-none isolate h-full min-w-0 font-[Arial,Helvetica,sans-serif] text-[#233323] ${className}`} aria-hidden="true" inert>
    <ComponentStyles css={VERSO_STYLES} />
    <div className="va-stage grid h-full min-h-0 flex-auto place-items-center bg-[radial-gradient(ellipse_at_53%_0,#153b28,#03140c_76%)] px-4 py-[26px]"><div className="va-card relative isolate w-full max-w-[930px] overflow-hidden border border-[#b7c7a244] bg-[linear-gradient(130deg,#fcfaf1,#eeeada)] [box-shadow:0_30px_50px_#0005] min-h-[238px] rounded-[13px]" data-register={registering}>
      <div className="va-form-panel relative flex min-h-[238px] flex-col justify-center py-[23px]">
        <h2 className="va-title mb-3 text-[12px] leading-[1.2] font-semibold tracking-[-.3px] after:mt-[6px] after:block after:h-px after:w-[23px] after:bg-[#b69b55] after:content-['']">{registering ? "Create account" : "Sign in"}</h2>
        <div className="va-fake-field mb-[13px] flex h-[29px] items-center justify-between border-b border-b-[#c9cabc] text-[7px] text-[#808673] [&>svg]:h-[10px] [&>svg]:w-[10px]">{registering ? "Full name" : "Username or email"}<VersoIcon name="user" /></div>
        {registering && <div className="va-fake-field mb-[13px] flex h-[29px] items-center justify-between border-b border-b-[#c9cabc] text-[7px] text-[#808673] [&>svg]:h-[10px] [&>svg]:w-[10px]">Email address<VersoIcon name="mail" /></div>}
        <div className="va-fake-field mb-[13px] flex h-[29px] items-center justify-between border-b border-b-[#c9cabc] text-[7px] text-[#808673] [&>svg]:h-[10px] [&>svg]:w-[10px]">Password<VersoIcon name="eye" /></div>
        {registering ? <p className="va-password-hint -mt-[6px] mb-[13px] flex items-center justify-between gap-2 text-[5px] leading-[1.4] text-[#727965]">Use 8 characters or more.</p> : <div className="va-options mb-[10px] flex items-center justify-between gap-[3px] text-[5px] text-[#7b8172]"><span>☑ Keep me signed in</span><span className={`${TEXT_BUTTON} text-[#877440] hover:text-[#3a5136]`}>Forgot password?</span></div>}
        <span className={`${SUBMIT} min-h-[24px] p-[5px] text-[7px]`}>{registering ? "Create account" : "Sign in"}</span>
        <p className="va-switch-copy mt-[10px] text-[6px] leading-[1.7] text-[#7e8474]">{registering ? "Already have an account? " : "New to VERSO? "}<span className={SWITCH_BUTTON}>{registering ? "Sign in" : "Create an account"}</span></p>
      </div>
      <div className="va-band pointer-events-none absolute -inset-px z-2 [filter:drop-shadow(-2px_0_1px_#b49b4f99)]" />
      <VersoStory registering={registering} brandName="VERSO" thumbnail />
    </div></div>
  </div>;
}

/* Tailwind can't cleanly express these: base control states, keyframes, and the diagonal layout keyed on the card's register/moving state. */
const VERSO_STYLES = `
.verso-auth button{cursor:pointer}.verso-auth button:disabled{cursor:wait;opacity:.6}
.verso-auth button:focus-visible,.verso-auth input[type=checkbox]:focus-visible{outline:2px solid #b79749;outline-offset:4px}
.verso-auth .va-form-panel{z-index:1;width:38%;margin-left:4.5%}.verso-auth .va-card[data-register=true] .va-form-panel{margin-left:58.5%;width:37%}
.verso-auth .va-band{background:linear-gradient(155deg,#0b3020 15%,#154f39 47%,#021a10 100%);clip-path:polygon(47% 0,100% 0,100% 100%,60% 100%)}.verso-auth .va-card[data-register=true] .va-band{clip-path:polygon(0 0,39% 0,53% 100%,0 100%);background:linear-gradient(120deg,#062719,#031b0f 60%,#103c2c)}
.verso-auth .va-story{left:59%;top:50%;transform:translateY(-50%);width:34%}.verso-auth .va-card[data-register=true] .va-story{left:5%;width:32%}
.verso-auth .va-card[data-moving=true][data-register=true] .va-band{animation:va-sweep-left .95s cubic-bezier(.65,0,.3,1) both}.verso-auth .va-card[data-moving=true][data-register=false] .va-band{animation:va-sweep-right .95s cubic-bezier(.65,0,.3,1) both}.verso-auth .va-card[data-moving=true] .va-form-panel,.verso-auth .va-card[data-moving=true] .va-story{animation:va-content .95s both}
@keyframes va-sweep-left{0%{clip-path:polygon(47% 0,100% 0,100% 100%,60% 100%)}42%,55%{clip-path:polygon(-15% 0,100% 0,115% 100%,0 100%)}100%{clip-path:polygon(0 0,39% 0,53% 100%,0 100%)}}@keyframes va-sweep-right{0%{clip-path:polygon(0 0,39% 0,53% 100%,0 100%)}42%,55%{clip-path:polygon(-15% 0,100% 0,115% 100%,0 100%)}100%{clip-path:polygon(47% 0,100% 0,100% 100%,60% 100%)}}@keyframes va-content{0%,52%{opacity:0}100%{opacity:1}}
@container(max-width:580px){.verso-auth:not(.va-thumbnail) .va-form-panel,.verso-auth:not(.va-thumbnail) .va-card[data-register=true] .va-form-panel{width:auto;margin:0;z-index:4}.verso-auth:not(.va-thumbnail) .va-card[data-register=true] .va-form-panel{margin-top:275px;margin-bottom:0}.verso-auth:not(.va-thumbnail) .va-card[data-register=false] .va-form-panel{margin-bottom:280px}.verso-auth:not(.va-thumbnail) .va-band{clip-path:polygon(0 60%,100% 66%,100% 100%,0 100%)}.verso-auth:not(.va-thumbnail) .va-card[data-register=true] .va-band{clip-path:polygon(0 0,100% 0,100% 38%,0 32%)}.verso-auth:not(.va-thumbnail) .va-story{left:28px;top:auto;bottom:35px;width:calc(100% - 56px);transform:none}.verso-auth:not(.va-thumbnail) .va-card[data-register=true] .va-story{left:28px;top:35px;bottom:auto;width:calc(100% - 56px)}.verso-auth:not(.va-thumbnail) .va-card[data-moving=true][data-register=true] .va-band{animation-name:va-sweep-up}.verso-auth:not(.va-thumbnail) .va-card[data-moving=true][data-register=false] .va-band{animation-name:va-sweep-down}.verso-auth:not(.va-thumbnail) .va-card[data-moving=true] .va-form-panel{z-index:1}}
@keyframes va-sweep-up{0%{clip-path:polygon(0 60%,100% 66%,100% 100%,0 100%)}42%,55%{clip-path:polygon(0 -10%,100% 0,100% 110%,0 100%)}100%{clip-path:polygon(0 0,100% 0,100% 38%,0 32%)}}@keyframes va-sweep-down{0%{clip-path:polygon(0 0,100% 0,100% 38%,0 32%)}42%,55%{clip-path:polygon(0 -10%,100% 0,100% 110%,0 100%)}100%{clip-path:polygon(0 60%,100% 66%,100% 100%,0 100%)}}
.verso-auth.va-thumbnail .va-band{transition:clip-path .95s cubic-bezier(.65,0,.3,1)}.verso-auth.va-thumbnail .va-story{transition:left .95s cubic-bezier(.65,0,.3,1),width .95s}.verso-auth.va-thumbnail .va-form-panel{transition:margin-left .95s cubic-bezier(.65,0,.3,1),width .95s}
@media(prefers-reduced-motion:reduce){.verso-auth *,.verso-auth *::before,.verso-auth *::after{animation:none!important;transition:none!important}}
`;
