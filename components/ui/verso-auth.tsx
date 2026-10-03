"use client";

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

function VersoStory({ registering, brandName }: { registering: boolean; brandName: string }) {
  return <div className="va-story"><span className="va-brand">{brandName}</span><h2>{registering ? "Start the" : "Welcome"}<br /><em>{registering ? "first page." : "back."}</em></h2><p>{registering ? "One account for every board, every draft and every device you own." : "Your boards, your drafts and your people are exactly where you left them."}</p></div>;
}

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
    return <div className="va-field-group" key={name}>
      <div className="va-field" data-filled={Boolean(values[name])} data-invalid={Boolean(errors[name])}>
        <label className="va-label" htmlFor={`${id}-${name}`}>{label}</label>
        <input id={`${id}-${name}`} name={name} value={values[name]} type={name === "password" ? visible ? "text" : "password" : name === "email" ? "email" : "text"} required maxLength={name === "password" ? 128 : name === "email" ? 254 : 100} autoComplete={name === "password" ? registering ? "new-password" : "current-password" : name === "identifier" ? "username" : name} disabled={pending} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${id}-${name}-error` : registering && name === "password" ? `${id}-password-hint` : undefined} onChange={(event) => { setValues((current) => ({ ...current, [name]: event.target.value })); setErrors((current) => ({ ...current, [name]: undefined })); }} />
        {name === "password" ? <button className="va-eye" type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} disabled={pending} onClick={() => setVisible((current) => !current)}><VersoIcon name="eye" hidden={visible} /></button> : <span className="va-input-icon"><VersoIcon name={name === "email" ? "mail" : "user"} /></span>}
      </div>
      {errors[name] && <p className="va-error" id={`${id}-${name}-error`}>{errors[name]}</p>}
    </div>;
  }

  return <section className={`verso-auth relative w-full ${className}`} aria-label={`${brandName} sign in and registration`}>
    <style>{VERSO_STYLES}</style>
    <div className="va-stage"><div className="va-card" data-register={registering} data-moving={moving}>
      <div className="va-form-panel" inert={moving}>
        <h2 className="va-title" ref={heading} tabIndex={-1}>{complete ? "You’re all set" : registering ? "Create account" : mode === "reset" ? "Reset password" : "Sign in"}</h2>
        {complete ? <div className="va-complete"><span aria-hidden="true">✓</span><p role="status">{message}</p><button className="va-submit" type="button" onClick={() => switchMode("login")}>Back to sign in</button></div> : <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending}>
          {mode === "reset" && <p className="va-reset-copy">A fresh start is one email away. Enter the address linked to your account.</p>}
          {mode === "login" && field("identifier", "Username or email")}
          {registering && field("name", "Full name")}
          {mode !== "login" && field("email", "Email address")}
          {mode !== "reset" && field("password", "Password")}
          {registering && <div className="va-password-hint" id={`${id}-password-hint`}><span className="va-length" aria-hidden="true">{[1, 2, 3, 4].map((segment) => <i key={segment} data-filled={segment <= passwordLength} />)}</span><span>{values.password.length >= 8 ? "8 characters or more — ready." : "Use 8 characters or more."}</span></div>}
          {mode === "login" && <div className="va-options"><label className="va-remember"><input type="checkbox" checked={values.remember} disabled={pending} onChange={(event) => setValues((current) => ({ ...current, remember: event.target.checked }))} /><span>Keep me signed in</span></label><button className="va-text-button" type="button" disabled={pending} onClick={() => switchMode("reset")}>Forgot password?</button></div>}
          <button className="va-submit" type="submit" disabled={pending}>{pending ? "Please wait…" : registering ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}</button>
          {message && <p className={failed ? "va-error va-feedback" : "va-feedback"} role={failed ? "alert" : "status"}>{message}</p>}
          <p className="va-switch-copy">{registering ? "Already have an account? " : mode === "reset" ? "Remember your password? " : `New to ${brandName}? `}<button type="button" className="va-text-button" disabled={pending || moving} onClick={() => switchMode(registering || mode === "reset" ? "login" : "register")}>{registering || mode === "reset" ? "Sign in" : "Create an account"}</button></p>
        </form>}
      </div>
      <div className="va-band" aria-hidden="true" />
      <VersoStory registering={registering} brandName={brandName} />
    </div></div>
  </section>;
}

/** Inert stills of the two sides of the diagonal sweep. */
export function VersoAuthThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const registering = Math.abs(Math.trunc(previewStep)) % 2 === 1;
  return <div className={`verso-auth va-thumbnail ${className}`} aria-hidden="true" inert><style>{VERSO_STYLES}</style><div className="va-stage"><div className="va-card" data-register={registering}><div className="va-form-panel"><h2 className="va-title">{registering ? "Create account" : "Sign in"}</h2><div className="va-fake-field">{registering ? "Full name" : "Username or email"}<VersoIcon name="user" /></div>{registering && <div className="va-fake-field">Email address<VersoIcon name="mail" /></div>}<div className="va-fake-field">Password<VersoIcon name="eye" /></div>{registering ? <p className="va-password-hint">Use 8 characters or more.</p> : <div className="va-options"><span>☑ Keep me signed in</span><span className="va-text-button">Forgot password?</span></div>}<span className="va-submit">{registering ? "Create account" : "Sign in"}</span><p className="va-switch-copy">{registering ? "Already have an account? " : "New to VERSO? "}<span className="va-text-button">{registering ? "Sign in" : "Create an account"}</span></p></div><div className="va-band" /><VersoStory registering={registering} brandName="VERSO" /></div></div></div>;
}

const VERSO_STYLES = `
.verso-auth{container-type:inline-size;min-width:0;isolation:isolate;font-family:Arial,Helvetica,sans-serif;color:#233323}.verso-auth *{box-sizing:border-box}.verso-auth button,.verso-auth input{font:inherit}.verso-auth button{cursor:pointer}.verso-auth button:disabled{cursor:wait;opacity:.6}.verso-auth button:focus-visible,.verso-auth input:focus-visible{outline:2px solid #b79749;outline-offset:4px}.verso-auth .va-title:focus{outline:none}
.verso-auth .va-stage{min-height:650px;padding:45px 24px;display:grid;place-items:center;background:radial-gradient(ellipse at 53% 0,#153b28,#03140c 76%)}.verso-auth .va-card{position:relative;isolation:isolate;min-height:520px;max-width:930px;width:100%;overflow:hidden;border-radius:25px;background:linear-gradient(130deg,#fcfaf1,#eeeada);border:1px solid #b7c7a244;box-shadow:0 30px 50px #0005}
.verso-auth .va-form-panel{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:center;width:38%;min-height:520px;margin-left:4.5%;padding:38px 0}.verso-auth .va-card[data-register=true] .va-form-panel{margin-left:58.5%;width:37%}.verso-auth .va-title{font-size:23px;font-weight:600;line-height:1.2;letter-spacing:-.8px;margin:0 0 19px}.verso-auth .va-title::after{content:'';display:block;height:2px;width:43px;background:#b69b55;margin-top:12px}.verso-auth .va-field-group{margin-bottom:25px}.verso-auth .va-field{position:relative;min-height:53px;border-bottom:1px solid #b9bcaa}.verso-auth .va-field:focus-within{border-color:#ab914e;box-shadow:0 2px 0 #ab914e22}.verso-auth .va-field[data-invalid=true]{border-color:#b24d43}.verso-auth .va-field input{position:relative;z-index:1;width:100%;border:0;outline:none;background:none;color:#20352a;border-radius:0;min-height:53px;padding:24px 30px 7px 0;font-size:15px}.verso-auth .va-label{position:absolute;left:0;bottom:8px;color:#7b8071;font-size:15px;transform-origin:left top;transition:transform .18s,bottom .18s,color .18s;pointer-events:none}.verso-auth .va-field:focus-within .va-label,.verso-auth .va-field[data-filled=true] .va-label{bottom:33px;color:#9b844a;transform:scale(.72)}.verso-auth .va-eye,.verso-auth .va-input-icon{position:absolute;z-index:2;right:-4px;bottom:0;display:grid;place-items:center;width:30px;height:35px;color:#8b927e;background:none;border:0;padding:4px}.verso-auth .va-eye:hover{color:#284d39}
.verso-auth .va-options{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:1px 0 19px;font-size:11px;color:#7b8172}.verso-auth .va-remember{display:flex;align-items:center;gap:6px;cursor:pointer}.verso-auth .va-remember input{width:14px;height:14px;margin:0;accent-color:#20543d}.verso-auth .va-text-button{padding:0;border:0;background:none;color:#877440;text-decoration:underline;text-underline-offset:3px;font-size:inherit;white-space:nowrap}.verso-auth .va-text-button:hover{color:#3a5136}.verso-auth .va-submit{display:flex;align-items:center;justify-content:center;width:100%;min-height:46px;border:0;border-radius:40px;padding:12px 15px;background:linear-gradient(#19573e,#052f20);box-shadow:0 6px 13px #082c2933,inset 0 1px #b5d1a521;color:#f7f9ec;font-size:13px;transition:filter .2s,transform .2s}.verso-auth .va-submit:hover{filter:brightness(1.12);transform:translateY(-1px)}.verso-auth .va-switch-copy{font-size:11px;color:#7e8474;margin:19px 0 0;line-height:1.7}.verso-auth .va-switch-copy .va-text-button{font-weight:650;color:#263d2c;text-decoration-color:#b69b55}.verso-auth .va-password-hint{display:flex;justify-content:space-between;gap:8px;align-items:center;margin:-15px 0 26px;font-size:9px;line-height:1.4;color:#727965}.verso-auth .va-length{display:flex;gap:4px;min-width:70px;width:30%}.verso-auth .va-length i{height:2px;background:#dedccf;flex:1}.verso-auth .va-length i[data-filled=true]{background:#739274}
.verso-auth .va-band{position:absolute;z-index:2;inset:-1px;background:linear-gradient(155deg,#0b3020 15%,#154f39 47%,#021a10 100%);clip-path:polygon(47% 0,100% 0,100% 100%,60% 100%);filter:drop-shadow(-2px 0 1px #b49b4f99);pointer-events:none}.verso-auth .va-card[data-register=true] .va-band{clip-path:polygon(0 0,39% 0,53% 100%,0 100%);background:linear-gradient(120deg,#062719,#031b0f 60%,#103c2c)}.verso-auth .va-story{position:absolute;z-index:3;left:59%;top:50%;transform:translateY(-50%);width:34%;color:#e9ead2;pointer-events:none}.verso-auth .va-card[data-register=true] .va-story{left:5%;width:32%}.verso-auth .va-brand{display:block;font-size:10px;font-weight:600;color:#c7b67b;letter-spacing:4px;margin-bottom:18px}.verso-auth .va-story h2{font:normal 42px/.98 Georgia,'Times New Roman',serif;letter-spacing:-2px;margin:0 0 21px}.verso-auth .va-story h2 em{font-weight:normal;color:#d4c78e}.verso-auth .va-story p{font-size:13px;line-height:1.7;color:#97afa0;margin:0;max-width:265px}.verso-auth .va-card[data-moving=true][data-register=true] .va-band{animation:va-sweep-left .95s cubic-bezier(.65,0,.3,1) both}.verso-auth .va-card[data-moving=true][data-register=false] .va-band{animation:va-sweep-right .95s cubic-bezier(.65,0,.3,1) both}.verso-auth .va-card[data-moving=true] .va-form-panel,.verso-auth .va-card[data-moving=true] .va-story{animation:va-content .95s both}
.verso-auth .va-error{font-size:11px;line-height:1.5;color:#a44135;margin:5px 0 0}.verso-auth .va-feedback{margin-top:15px;line-height:1.6}.verso-auth .va-reset-copy{font-size:13px;line-height:1.7;color:#7c8270;margin:0 0 15px}.verso-auth .va-complete>span{display:inline-grid;place-items:center;width:45px;height:45px;border-radius:50%;background:#dce4d2;color:#215039;font-size:24px;margin:10px 0 0}.verso-auth .va-complete p{font-size:13px;line-height:1.8;margin:20px 0 28px}
@keyframes va-sweep-left{0%{clip-path:polygon(47% 0,100% 0,100% 100%,60% 100%)}42%,55%{clip-path:polygon(-15% 0,100% 0,115% 100%,0 100%)}100%{clip-path:polygon(0 0,39% 0,53% 100%,0 100%)}}@keyframes va-sweep-right{0%{clip-path:polygon(0 0,39% 0,53% 100%,0 100%)}42%,55%{clip-path:polygon(-15% 0,100% 0,115% 100%,0 100%)}100%{clip-path:polygon(47% 0,100% 0,100% 100%,60% 100%)}}@keyframes va-content{0%,52%{opacity:0}100%{opacity:1}}
@container(max-width:580px){.verso-auth:not(.va-thumbnail) .va-stage{padding:24px 15px;min-height:790px}.verso-auth:not(.va-thumbnail) .va-card{min-height:740px;max-width:440px;border-radius:22px;display:flex;flex-direction:column}.verso-auth:not(.va-thumbnail) .va-form-panel,.verso-auth:not(.va-thumbnail) .va-card[data-register=true] .va-form-panel{width:auto;margin:0;padding:35px 28px;min-height:450px;z-index:4}.verso-auth:not(.va-thumbnail) .va-card[data-register=true] .va-form-panel{margin-top:275px;margin-bottom:0}.verso-auth:not(.va-thumbnail) .va-card[data-register=false] .va-form-panel{margin-bottom:280px}.verso-auth:not(.va-thumbnail) .va-band{clip-path:polygon(0 60%,100% 66%,100% 100%,0 100%)}.verso-auth:not(.va-thumbnail) .va-card[data-register=true] .va-band{clip-path:polygon(0 0,100% 0,100% 38%,0 32%)}.verso-auth:not(.va-thumbnail) .va-story{left:28px;top:auto;bottom:35px;width:calc(100% - 56px);transform:none}.verso-auth:not(.va-thumbnail) .va-card[data-register=true] .va-story{left:28px;top:35px;bottom:auto;width:calc(100% - 56px)}.verso-auth:not(.va-thumbnail) .va-story h2{font-size:35px;margin-bottom:13px}.verso-auth:not(.va-thumbnail) .va-brand{margin-bottom:13px}.verso-auth:not(.va-thumbnail) .va-story p{max-width:280px;font-size:12px}.verso-auth:not(.va-thumbnail) .va-card[data-moving=true][data-register=true] .va-band{animation-name:va-sweep-up}.verso-auth:not(.va-thumbnail) .va-card[data-moving=true][data-register=false] .va-band{animation-name:va-sweep-down}.verso-auth:not(.va-thumbnail) .va-card[data-moving=true] .va-form-panel{z-index:1}}
@keyframes va-sweep-up{0%{clip-path:polygon(0 60%,100% 66%,100% 100%,0 100%)}42%,55%{clip-path:polygon(0 -10%,100% 0,100% 110%,0 100%)}100%{clip-path:polygon(0 0,100% 0,100% 38%,0 32%)}}@keyframes va-sweep-down{0%{clip-path:polygon(0 0,100% 0,100% 38%,0 32%)}42%,55%{clip-path:polygon(0 -10%,100% 0,100% 110%,0 100%)}100%{clip-path:polygon(0 60%,100% 66%,100% 100%,0 100%)}}
.verso-auth.va-thumbnail{height:100%;pointer-events:none}.verso-auth.va-thumbnail .va-stage{height:100%;min-height:0;padding:26px 16px}.verso-auth.va-thumbnail .va-card{min-height:238px;border-radius:13px}.verso-auth.va-thumbnail .va-band{transition:clip-path .95s cubic-bezier(.65,0,.3,1)}.verso-auth.va-thumbnail .va-story{transition:left .95s cubic-bezier(.65,0,.3,1),width .95s}.verso-auth.va-thumbnail .va-form-panel{transition:margin-left .95s cubic-bezier(.65,0,.3,1),width .95s}.verso-auth.va-thumbnail .va-form-panel{min-height:238px;padding:23px 0}.verso-auth.va-thumbnail .va-title{font-size:12px;letter-spacing:-.3px;margin-bottom:12px}.verso-auth.va-thumbnail .va-title::after{width:23px;height:1px;margin-top:6px}.verso-auth.va-thumbnail .va-fake-field{display:flex;align-items:center;justify-content:space-between;height:29px;border-bottom:1px solid #c9cabc;margin-bottom:13px;font-size:7px;color:#808673}.verso-auth.va-thumbnail .va-fake-field svg{width:10px;height:10px}.verso-auth.va-thumbnail .va-options{font-size:5px;margin:0 0 10px;gap:3px}.verso-auth.va-thumbnail .va-submit{min-height:24px;padding:5px;font-size:7px}.verso-auth.va-thumbnail .va-switch-copy{font-size:6px;margin-top:10px}.verso-auth.va-thumbnail .va-password-hint{font-size:5px;margin:-6px 0 13px}.verso-auth.va-thumbnail .va-brand{font-size:5px;letter-spacing:2px;margin-bottom:9px}.verso-auth.va-thumbnail .va-story h2{font-size:23px;letter-spacing:-1px;margin-bottom:11px}.verso-auth.va-thumbnail .va-story p{font-size:7px;line-height:1.65}
@media(prefers-reduced-motion:reduce){.verso-auth *,.verso-auth *::before,.verso-auth *::after{animation:none!important;transition:none!important}}
`;
