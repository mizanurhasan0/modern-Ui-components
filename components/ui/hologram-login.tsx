"use client";

import { ComponentStyles } from "./component-styles";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

export interface HologramLoginValues {
  username: string;
  password: string;
}

export interface HologramLoginProps {
  className?: string;
  /** Heading shown at the top of the hologram panel. */
  title?: string;
  /** Resolve after authentication succeeds, or reject to show an error. */
  onSubmit?: (values: HologramLoginValues) => void | Promise<void>;
}

type Field = keyof HologramLoginValues;
type FieldErrors = Partial<Record<Field, string>>;
type Status = "idle" | "pending" | "success";

const EMPTY_VALUES: HologramLoginValues = { username: "", password: "" };
const DEMO_DELAY = 1200;
const FIELDS: { name: Field; label: string; placeholder: string }[] = [
  { name: "username", label: "Username", placeholder: "UserName" },
  { name: "password", label: "Password", placeholder: "PassWord" },
];

/*
 * Shared Tailwind class lists. The interactive login lives in a container named `hl`;
 * `[@container_hl_(max-width:…)]` variants keep the original inclusive breakpoints and
 * never reach the thumbnail, which uses an unnamed container.
 */
const FONT = "font-[family-name:Arial,Helvetica,sans-serif]";
const PANEL = "relative z-3 flex min-h-[303px] flex-col gap-[18px] rounded-lg border-4 border-white bg-[rgba(0,255,240,.52)] p-7 shadow-[0_0_16px_1px_#82e1ff99,inset_0_0_40px_4px_#a8f6ffe6] backdrop-blur-[3.5px] [transition:box-shadow_.4s,background-color_.4s] motion-reduce:transition-none data-[state=success]:justify-center data-[state=success]:bg-[rgba(0,255,240,.6)] data-[state=success]:shadow-[0_0_30px_4px_#82e1ffcc,inset_0_0_44px_6px_#c8fffcf0]";
const TITLE_BASE = "m-0 block text-center font-semibold text-white text-shadow-[0_0_16px_rgb(243,243,243)]";
const TITLE = `${TITLE_BASE} text-[2.3rem] leading-[42px] tracking-[9px]`;
const WELCOME = `${TITLE_BASE} text-[1.6rem] leading-[1.3] tracking-[4px] wrap-anywhere`;
const FORM = "m-0 flex flex-col gap-[18px]";
const SUCCESS = "flex flex-col gap-[18px] text-center";
const SUCCESS_NOTE = "m-0 block text-[13px] leading-normal tracking-[.5px] text-white text-shadow-[0_1px_4px_rgb(66,66,66)]";
const INPUT_BASE = `hl-input m-0 flex h-[42px] w-full items-center rounded-md border-2 border-white bg-[rgba(139,255,247,.486)] px-2 py-px text-[15px] leading-[1.2] text-white shadow-[0_0_1px_3px_#9ee5e3,inset_0_4px_4px_0_#181a6040] ${FONT} [transition:background-color_.2s,box-shadow_.2s] hover:bg-[rgba(139,189,255,.59)] motion-reduce:transition-none`;
/** Thumbnail stand-in for an input: placeholder styling until `data-filled` is true. */
const STATIC_INPUT = `${INPUT_BASE} font-light tracking-[.1rem] text-shadow-[0_1px_5px_rgb(66,66,66)] data-[filled=true]:font-bold data-[filled=true]:tracking-[1.6px] data-[filled=true]:text-shadow-[0_1px_4px_rgb(243,243,243)]`;
const BUTTON_BASE = `hl-button m-0 flex w-full items-center justify-center rounded-xs border-2 border-white bg-[linear-gradient(144deg,#9c11ffce,#2000eeb6_50%,#15efffbb)] p-0 text-center font-normal leading-none text-white ${FONT} [transition:translate_.2s,box-shadow_.2s,background_.2s] motion-reduce:transition-none`;
const BUTTON_ACTIONS = "cursor-pointer hover:not-disabled:-translate-y-1 hover:not-disabled:bg-[linear-gradient(144deg,#9c11ff,#2000ee_50%,#15eff3)] hover:not-disabled:shadow-[0_0_2px_2px_#fff] focus-visible:shadow-[0_0_2px_2px_#fff,0_0_18px_#82e1ff] motion-reduce:hover:not-disabled:translate-y-0 [@container_hl_(max-width:340px)]:h-[54px] [@container_hl_(max-width:340px)]:text-[21px] [@container_hl_(max-width:340px)]:enabled:tracking-[.28rem]";
const BUTTON_LARGE = "h-[60px] text-[24px] tracking-[.37rem]";
const BUTTON_SMALL = "hl-button-small h-12 text-[18px] tracking-[.25rem]";
const RAYS = "relative z-2 -mt-4 h-[148px] bg-[linear-gradient(180deg,#2f4d53_16px,#314f55_28px,#288392_73px,#13bed7_118px,#09d7f8_137px,#00e1ff)] [clip-path:polygon(0_0,100%_0,100%_16px,calc(50%+22px)_100%,calc(50%-22px)_100%,0_16px)] motion-reduce:opacity-[.85]";
const EMITTER = "relative z-1 mt-[-17px] h-[49px] before:absolute before:inset-[11px_0_0] before:rounded-[0_0_50%_50%/0_0_13px_13px] before:bg-[linear-gradient(90deg,#101010,#262626_22%,#303030_50%,#262626_78%,#101010)] before:shadow-[0_0_10px_#ffffff38,0_8px_14px_#0009] after:absolute after:inset-[0_0_auto] after:h-[23px] after:rounded-[50%] after:border after:border-[#3a3a3a] after:bg-[radial-gradient(ellipse_at_50%_45%,#070707_30%,#141414_62%,#2c2c2c)] after:shadow-[inset_0_-2px_4px_#000]";
const LENS = "absolute top-1.5 left-1/2 z-1 h-[11px] w-[65px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_50%_50%,#12d6ff_0_48%,#0a6aa6_60%,#08436f_74%,#062b48_84%,transparent_88%)] shadow-[0_0_8px_#00c8ff,0_0_18px_#00a8ff70]";

/** Light cone and projector puck drawn beneath the floating panel. */
function Projector({ thumbnail = false }: { thumbnail?: boolean }) {
  return (
    <>
      <div
        className={thumbnail
          ? `${RAYS} w-[254px]`
          : `${RAYS} w-[min(254px,calc(100cqw-54px))] animate-[hl-rays_2s_ease-in-out_infinite] motion-reduce:animate-none`}
        aria-hidden="true"
      />
      <div
        className={thumbnail ? `${EMITTER} w-[164px]` : `${EMITTER} w-[164px] [@container_hl_(max-width:340px)]:w-[148px]`}
        aria-hidden="true"
      >
        <span className={LENS} />
      </div>
    </>
  );
}

/** A floating holographic login panel. Credentials stay in memory unless a callback is supplied. */
export default function HologramLogin({ className = "", title = "Login", onSubmit }: HologramLoginProps) {
  const [values, setValues] = useState<HologramLoginValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState("");
  const [welcomeName, setWelcomeName] = useState("");
  const fields = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});
  const successHeading = useRef<HTMLHeadingElement>(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  const focusAfterChange = useRef(false);
  const id = useId();
  const pending = status === "pending";

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!focusAfterChange.current) return;
    focusAfterChange.current = false;
    if (status === "success") successHeading.current?.focus({ preventScroll: true });
    else if (status === "idle") fields.current.username?.focus({ preventScroll: true });
  }, [status]);

  function updateField(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const clean = { username: values.username.trim(), password: values.password };
    const nextErrors: FieldErrors = {};
    if (!clean.username) nextErrors.username = "Enter your username.";
    if (!clean.password) nextErrors.password = "Enter your password.";

    setErrors(nextErrors);
    const firstError = FIELDS.find(({ name }) => nextErrors[name])?.name;
    if (firstError) {
      fields.current[firstError]?.focus();
      return;
    }

    busy.current = true;
    setStatus("pending");
    setSubmitError("");
    try {
      if (onSubmit) await onSubmit(clean);
      else await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY));

      if (mounted.current) {
        focusAfterChange.current = true;
        setWelcomeName(clean.username);
        setValues(EMPTY_VALUES);
        setStatus("success");
      }
    } catch {
      if (mounted.current) {
        setStatus("idle");
        setSubmitError("Access denied. Check your details and try again.");
      }
    } finally {
      busy.current = false;
    }
  }

  function signOut() {
    focusAfterChange.current = true;
    setErrors({});
    setSubmitError("");
    setWelcomeName("");
    setStatus("idle");
  }

  return (
    // The ::after spacer lifts the rig toward center only when the stage has a definite height (e.g. full screen).
    <section
      className={`hl-stage @container/hl relative isolate flex min-h-[600px] w-full min-w-0 flex-col items-center justify-end overflow-hidden bg-[#212121] pt-12 pb-10 text-white ${FONT} after:h-[calc(50%-240px)] after:flex-[0_1_auto] ${className}`}
      aria-label="Hologram login"
    >
      <ComponentStyles css={HOLOGRAM_LOGIN_CSS} />
      <div className="flex w-full shrink-0 flex-col items-center [@container_hl_(max-width:480px)]:pb-2">
        <div
          className={`${PANEL} w-[min(276px,calc(100cqw-32px))] animate-[hl-float_2s_ease-in-out_infinite] motion-reduce:animate-none [@container_hl_(max-width:340px)]:gap-4 [@container_hl_(max-width:340px)]:p-[22px_18px]`}
          data-state={status}
        >
          {status === "success" ? (
            <div className={SUCCESS}>
              <h2
                className={`${WELCOME} hl-welcome focus-visible:rounded-[4px] [@container_hl_(max-width:340px)]:text-[1.35rem] [@container_hl_(max-width:340px)]:tracking-[3px]`}
                tabIndex={-1}
                ref={successHeading}
              >
                Welcome, <span className="block">{welcomeName}</span>
              </h2>
              <p className={SUCCESS_NOTE}>
                {onSubmit ? "Hologram link established." : "Demo only — no account was signed in."}
              </p>
              <button className={`${BUTTON_BASE} ${BUTTON_SMALL} ${BUTTON_ACTIONS}`} type="button" onClick={signOut}>Sign out</button>
            </div>
          ) : (
            <>
              <h2
                className={`${TITLE} [@container_hl_(max-width:340px)]:text-[1.9rem] [@container_hl_(max-width:340px)]:tracking-[7px]`}
                id={`${id}-title`}
              >
                {title}
              </h2>
              <form className={FORM} onSubmit={submit} noValidate aria-labelledby={`${id}-title`} aria-busy={pending}>
                {FIELDS.map(({ name, label, placeholder }) => {
                  const error = errors[name];
                  return (
                    <div className="flex flex-col gap-1.5" key={name}>
                      <label className="sr-only" htmlFor={`${id}-${name}`}>{label}</label>
                      <input
                        id={`${id}-${name}`}
                        ref={(element) => { fields.current[name] = element; }}
                        className={`${INPUT_BASE} font-bold tracking-[1.6px] text-shadow-[0_1px_4px_rgb(243,243,243)] placeholder:font-light placeholder:tracking-[.1rem] placeholder:text-white placeholder:opacity-100 placeholder:text-shadow-[0_1px_5px_rgb(66,66,66)] focus-visible:bg-[rgba(139,189,255,.59)] focus-visible:shadow-[0_0_1px_4px_#9ee5e3] aria-invalid:border-[#ffd3e4] aria-invalid:shadow-[0_0_1px_3px_#ff9cc6,inset_0_4px_4px_0_#181a6040] disabled:cursor-wait disabled:opacity-70`}
                        name={name}
                        type={name === "password" ? "password" : "text"}
                        autoComplete={name === "password" ? "current-password" : "username"}
                        autoCapitalize="none"
                        spellCheck={false}
                        placeholder={placeholder}
                        maxLength={name === "password" ? 128 : 80}
                        value={values[name]}
                        required
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? `${id}-${name}-error` : undefined}
                        disabled={pending}
                        onChange={(event) => updateField(name, event.target.value)}
                      />
                      {error && (
                        <p
                          className="m-[2px_2px_0] text-[12px] leading-[1.35] font-bold tracking-[.3px] text-[#ffe1ee] text-shadow-[0_1px_3px_#6a0a3c99]"
                          id={`${id}-${name}-error`}
                        >
                          {error}
                        </p>
                      )}
                    </div>
                  );
                })}
                <button
                  className={`${BUTTON_BASE} ${BUTTON_LARGE} ${BUTTON_ACTIONS} disabled:cursor-wait disabled:tracking-[.2rem] disabled:opacity-85`}
                  type="submit"
                  disabled={pending}
                  aria-busy={pending}
                >
                  {pending ? "Verifying…" : "Continue"}
                </button>
                {submitError && (
                  <p
                    className="m-[-4px_0_0] rounded-md border border-[#ffd3e4] bg-[#6a0a3c40] px-2.5 py-[7px] text-center text-[12px] leading-[1.4] text-white"
                    role="alert"
                  >
                    {submitError}
                  </p>
                )}
              </form>
            </>
          )}
        </div>
        <Projector />
      </div>
    </section>
  );
}

/** Inert gallery artwork: empty → username → password + glowing button → welcome. */
export function HologramLoginThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) % 4 : 0;
  const success = step === 3;

  return (
    <div
      className={`hl-stage hl-thumbnail @container relative isolate flex h-full min-h-[260px] w-full min-w-0 flex-col items-center justify-center overflow-hidden bg-[#212121] p-0 text-white ${FONT} ${className}`}
      aria-hidden="true"
      inert
    >
      <ComponentStyles css={HOLOGRAM_LOGIN_CSS} />
      <div className="flex w-full shrink-0 scale-50 flex-col items-center">
        <div className={`${PANEL} w-[276px]`} data-state={success ? "success" : "idle"}>
          {success ? (
            <div className={SUCCESS}>
              <span className={WELCOME}>Welcome, <span className="block">alex</span></span>
              <span className={SUCCESS_NOTE}>Hologram link established.</span>
              <span className={`${BUTTON_BASE} ${BUTTON_SMALL}`}>Sign out</span>
            </div>
          ) : (
            <>
              <span className={TITLE}>Login</span>
              <div className={FORM}>
                <span className={STATIC_INPUT} data-filled={step >= 1}>{step >= 1 ? "alex" : "UserName"}</span>
                <span className={STATIC_INPUT} data-filled={step >= 2}>{step >= 2 ? "••••••••" : "PassWord"}</span>
                <span
                  className={`${BUTTON_BASE} ${BUTTON_LARGE} data-[hover=true]:-translate-y-1 data-[hover=true]:bg-[linear-gradient(144deg,#9c11ff,#2000ee_50%,#15eff3)] data-[hover=true]:shadow-[0_0_2px_2px_#fff]`}
                  data-hover={step === 2}
                >
                  Continue
                </span>
              </div>
            </>
          )}
        </div>
        <Projector thumbnail />
      </div>
    </div>
  );
}

/*
 * Only what Tailwind cannot express: keyframes, Chrome's autofill repaint, and focus outlines,
 * which stay unlayered so a host page's global :focus-visible outline cannot override them.
 */
const HOLOGRAM_LOGIN_CSS = `
@keyframes hl-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
@keyframes hl-rays { 0%, 100% { opacity: .6; } 50% { opacity: 1; } }
.hl-stage .hl-input:focus-visible, .hl-stage .hl-welcome:focus { outline: none; }
.hl-stage button.hl-button:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
.hl-stage .hl-welcome:focus-visible { outline: 2px solid #fff; outline-offset: 4px; }
.hl-stage .hl-input:-webkit-autofill { -webkit-text-fill-color: #fff; -webkit-box-shadow: 0 0 1px 3px #9ee5e3, inset 0 0 0 100px #52c9cf; caret-color: #fff; }
`;
