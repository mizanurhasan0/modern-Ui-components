"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";

import { CharacterScene, type SceneFrame } from "./creative-login-scene";

export interface CreativeLoginValues {
  firstName: string;
  surname: string;
  email: string;
}

export interface CreativeLoginProps {
  className?: string;
  /** Connect your server here. A rejected promise keeps the form open to retry. */
  onSubmit?: (values: CreativeLoginValues) => void | Promise<void>;
  /** Set false to skip the character's entrance. Remount the component to replay. */
  intro?: boolean;

}

type Step = "details" | "review" | "success";
type FieldName = keyof CreativeLoginValues;
type FieldErrors = Partial<Record<FieldName, string>>;

const EMPTY_VALUES: CreativeLoginValues = {
  firstName: "",
  surname: "",
  email: "",
};
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotion(onChange: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia(MOTION_QUERY).matches;
}

function getServerMotionPreference() {
  return false;
}

function FormIcon({ name }: { name: "person" | "email" | "check" | "arrow" }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "person" && (
        <>
          <circle cx="12" cy="7" r="3.5" />
          <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
        </>
      )}
      {name === "email" && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </>
      )}
      {name === "check" && <path d="m5 12 4.5 4.5L19 7" />}
      {name === "arrow" && <path d="M5 12h14m-5-5 5 5-5 5" />}
    </svg>
  );
}

/** A complete client-side demo. Supply onSubmit to save registrations on your server. */
export default function CreativeLogin({
  className = "",
  onSubmit,
  intro = true,
}: CreativeLoginProps) {
  const id = useId();
  const reducedMotion = useSyncExternalStore(
    subscribeToMotion,
    getMotionPreference,
    getServerMotionPreference,
  );
  const [phase, setPhase] = useState<"waiting" | "revealing" | "settled">(intro ? "waiting" : "settled");
  const [sceneError, setSceneError] = useState(false);
  const [replay, setReplay] = useState(0);
  const ready = phase === "settled" || reducedMotion || !intro;
  const formPosition = useRef<HTMLDivElement>(null);

  function handleFrame(frame: SceneFrame) {
    const next = !intro || reducedMotion || frame.phase === "waiting" || frame.elapsed >= 5
      ? "settled" : frame.elapsed >= 4.125 ? "revealing" : "waiting";
    const form = formPosition.current;
    const scene = form?.parentElement?.querySelector<HTMLElement>(".cl-character-layer");
    if (form && scene) {
      form.style.transform = next === "revealing"
        ? calculateFormTransform(frame.corners, frame.restingCorners, scene.clientWidth,
          scene.clientHeight, form.offsetLeft - scene.offsetLeft, form.offsetTop - scene.offsetTop)
        : "none";
    }
    setPhase((current) => current === next ? current : next);
  }

  const [step, setStep] = useState<Step>("details");
  const [values, setValues] = useState<CreativeLoginValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fields = useRef<Partial<Record<FieldName, HTMLInputElement | null>>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  const busy = useRef(false);
  const hasNavigated = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);


  useEffect(() => {
    if (!hasNavigated.current) return;
    if (step === "details") fields.current.firstName?.focus({ preventScroll: true });
    else heading.current?.focus({ preventScroll: true });
  }, [step]);

  function updateField(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function reviewDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = {
      firstName: values.firstName.trim(),
      surname: values.surname.trim(),
      email: values.email.trim(),
    };
    const nextErrors: FieldErrors = {};
    if (!clean.firstName) nextErrors.firstName = "Please enter your first name.";
    if (!clean.surname) nextErrors.surname = "Please enter your surname.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }
    setErrors(nextErrors);
    const firstError = (Object.keys(nextErrors) as FieldName[])[0];
    if (firstError) {
      fields.current[firstError]?.focus();
      return;
    }
    setValues(clean);
    hasNavigated.current = true;
    setStep("review");
  }

  async function completeRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit?.({ ...values });
      if (mounted.current) setStep("success");
    } catch {
      if (mounted.current) {
        setSubmitError("We couldn’t complete your registration. Please try again.");
      }
    } finally {
      busy.current = false;
      if (mounted.current) setSubmitting(false);
    }
  }

  function startAgain() {
    setValues(EMPTY_VALUES);
    setErrors({});
    setSubmitError("");
    setStep("details");
  }

  function renderField(field: FieldName, placeholder: string) {
    const isEmail = field === "email";
    return (
      <div className="cl-field-group">
        <div className="cl-field relative flex items-center" data-invalid={!!errors[field]}>
          <span className="cl-field-icon pointer-events-none absolute">
            <FormIcon name={isEmail ? "email" : "person"} />
          </span>
          <label className="sr-only" htmlFor={`${id}-${field}`}>
            {isEmail ? "Email address" : field === "firstName" ? "First name" : "Surname"}
          </label>
          <input
            ref={(node) => {
              fields.current[field] = node;
            }}
            id={`${id}-${field}`}
            name={field}
            type={isEmail ? "email" : "text"}
            inputMode={isEmail ? "email" : "text"}
            autoComplete={isEmail ? "email" : field === "firstName" ? "given-name" : "family-name"}
            maxLength={isEmail ? 254 : 80}
            placeholder={placeholder}
            value={values[field]}
            onChange={(event) => updateField(field, event.target.value)}
            aria-invalid={!!errors[field]}
            aria-describedby={errors[field] ? `${id}-${field}-error` : undefined}
            required
          />
        </div>
        {errors[field] && (
          <p id={`${id}-${field}-error`} className="cl-field-error" role="alert">
            {errors[field]}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`creative-login cl-stage relative isolate w-full overflow-hidden ${className}`} data-intro={ready ? "settled" : phase}>
      <CreativeLoginStyles />
      <div className="cl-scene">
        <div className="cl-character-layer" aria-hidden="true">
          {sceneError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/creative-login/poster.png" alt="" className="h-full w-full object-contain" />
          ) : (
            <CharacterScene key={replay} intro={intro} reducedMotion={reducedMotion} onProgress={handleFrame}
              onError={() => { setSceneError(true); setPhase("settled"); }} />
          )}
        </div>
        <div ref={formPosition} className="cl-form-position" data-step={step} inert={!ready}>
          {step === "details" ? (
            <form
              key="details"
              className="cl-form cl-enter"
              onSubmit={reviewDetails}
              aria-labelledby={`${id}-title`}
              noValidate
            >
              <h2 id={`${id}-title`} className="cl-heading">Register now</h2>
              <p className="cl-description">Secure your spot in our upcoming live webinar</p>
              <fieldset className="m-0 min-w-0 border-0 p-0">
                <legend className="cl-label">What’s your name? <span aria-hidden="true">*</span></legend>
                <div className="cl-name-fields flex flex-col">
                  {renderField("firstName", "Name")}
                  {renderField("surname", "Surname")}
                </div>
              </fieldset>
              <p className="cl-label cl-email-label" aria-hidden="true">Enter your email address <span>*</span></p>
              {renderField("email", "Ex. yourname@company.com")}
              <button className="cl-primary flex w-full items-center justify-center" type="submit">
                Next
              </button>
            </form>
          ) : step === "review" ? (
            <form
              key="review"
              className="cl-form cl-step-enter"
              onSubmit={completeRegistration}
              aria-labelledby={`${id}-review-title`}
              aria-busy={submitting}
            >
              <h2 ref={heading} tabIndex={-1} id={`${id}-review-title`} className="cl-heading">One last check</h2>
              <p className="cl-description">Everything looking good?</p>
              <dl className="cl-review text-left">
                <div><dt>Your name</dt><dd>{values.firstName} {values.surname}</dd></div>
                <div><dt>Email address</dt><dd>{values.email}</dd></div>
              </dl>
              {submitError && <p className="cl-submit-error" role="alert">{submitError}</p>}
              <button type="submit" className="cl-primary flex w-full items-center justify-center gap-2" disabled={submitting}>
                {submitting ? <><span className="cl-spinner" aria-hidden="true" /> Registering…</> : <>Complete registration <FormIcon name="arrow" /></>}
              </button>
              <button
                type="button"
                className="cl-secondary"
                disabled={submitting}
                onClick={() => { setSubmitError(""); setStep("details"); }}
              >
                Back to edit
              </button>
            </form>
          ) : (
            <div className="cl-form cl-step-enter cl-success text-center" aria-labelledby={`${id}-success-title`}>
              <span className="cl-success-icon mx-auto flex items-center justify-center"><FormIcon name="check" /></span>
              <h2 ref={heading} tabIndex={-1} id={`${id}-success-title`} className="cl-heading">You’re all set, {values.firstName}!</h2>
              <p className="cl-description">{onSubmit ? "Your registration is complete. See you there!" : "Your preview registration is complete."}</p>
              <button type="button" className="cl-primary w-full" onClick={startAgain}>Start again</button>
            </div>
          )}
          <button type="button" className="cl-replay" aria-label="Replay character entrance" onClick={() => { setPhase(intro ? "waiting" : "settled"); setReplay((value) => value + 1); }}>
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" aria-hidden="true"><path d="m1 1 8 8M9 1 1 9" /></svg>
          </button>
          <a className="cl-credit" href="https://www.visme.co/" target="_blank" rel="noreferrer">Character by Visme</a>
        </div>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {!ready ? "Getting your registration form ready." : submitting ? "Completing your registration." : ""}
      </span>
    </div>
  );
}

/** Inert artwork: safe to nest inside a gallery link, with no inputs or buttons. */
export function CreativeLoginThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  return (
    <div className={`creative-login cl-thumbnail relative isolate h-full w-full overflow-hidden ${className}`} aria-hidden="true">
      <CreativeLoginStyles />
      <div className="cl-thumbnail-scene relative">
        <div className="cl-character-layer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/creative-login/poster.png" alt="" className="h-full w-full object-contain" />
        </div>
        <div className="cl-form-position absolute">
          <div className="cl-form">
            <p className="cl-heading">Register now</p>
            <p className="cl-description">Secure your spot in our upcoming live webinar</p>
            <p className="cl-label">What’s your name? *</p>
            <div className="cl-name-fields flex flex-col">
              <div className="cl-static-field flex items-center"><FormIcon name="person" /><span>{previewStep % 4 >= 1 ? "Alex" : "Name"}</span></div>
              <div className="cl-static-field flex items-center"><FormIcon name="person" /><span>{previewStep % 4 >= 2 ? "Morgan" : "Surname"}</span></div>
            </div>
            <p className="cl-label cl-email-label">Enter your email address *</p>
            <div className="cl-static-field flex items-center"><FormIcon name="email" /><span>{previewStep % 4 >= 3 ? "alex@example.com" : "Ex. yourname@company.com"}</span></div>
            <div className="cl-primary flex w-full items-center justify-center">{previewStep % 4 === 3 ? "Ready to continue ✓" : "Next"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreativeLoginStyles() {
  return (
    <style>{`
      @font-face { font-family: "Creative Login Fira Sans"; src: url("/creative-login/font-regular.ttf") format("truetype"); font-weight: 400; font-display: swap; }
      @font-face { font-family: "Creative Login Fira Sans"; src: url("/creative-login/font-bold.ttf") format("truetype"); font-weight: 700; font-display: swap; }
      .creative-login {
        --cl-blue: #4b6bff;
        color: #fff;
        background: var(--cl-blue);
        font-family: "Creative Login Fira Sans", "Fira Sans", Arial, sans-serif;
        font-synthesis: none;
        -webkit-font-smoothing: antialiased;
        container: creative-login / inline-size;
      }
      .creative-login *,
      .creative-login *::before,
      .creative-login *::after { box-sizing: border-box; }
      .creative-login.cl-stage { min-height: 0; aspect-ratio: auto; }
      .creative-login .cl-scene,
      .creative-login .cl-thumbnail-scene {
        position: relative;
        isolation: isolate;
        display: flow-root;
        width: 100%;
        min-height: 63.125cqi;
        container: creative-login-scene / inline-size;
      }
      .creative-login .cl-scene::after,
      .creative-login .cl-thumbnail-scene::after {
        content: "";
        position: absolute;
        z-index: 5;
        inset: 0;
        border: .15625cqi solid #ffffffd9;
        border-radius: .46875cqi;
        pointer-events: none;
      }

      /* The artwork always uses the original 640 × 404 coordinate plane. */
      .creative-login .cl-character-layer {
        position: absolute;
        z-index: 2;
        inset: 0 auto auto 0;
        width: 100%;
        height: 63.125cqi;
        overflow: hidden;
        pointer-events: none;
      }
      .creative-login .cl-character-layer canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      /* At 640px: x218, y94, width256. In-flow content can grow on validation. */
      .creative-login .cl-form-position {
        position: relative;
        z-index: 1;
        top: auto;
        left: 34.0625%;
        width: 40%;
        max-width: none;
        margin: 14.6875cqi 0 10.9375cqi;
        transform-origin: 0 0;
      }
      .creative-login .cl-form {
        position: relative;
        width: 100%;
        text-align: center;
        transform-origin: 50% 50%;
        backface-visibility: visible;
      }
      .creative-login .cl-heading {
        margin: 0;
        font-size: 2.8125cqi;
        font-weight: 700;
        line-height: 3.75cqi;
        letter-spacing: 0;
        overflow-wrap: anywhere;
      }
      .creative-login .cl-description {
        margin: .625cqi 0 1.5625cqi;
        color: #eef2ff;
        font-size: 1.5625cqi;
        font-weight: 400;
        line-height: 2.1875cqi;
      }
      .creative-login .cl-label {
        display: block;
        width: 100%;
        margin: 0 0 .78125cqi;
        padding: 0;
        color: #f3f5ff;
        font-size: 1.5625cqi;
        font-weight: 400;
        line-height: 2.1875cqi;
        text-align: center;
      }
      .creative-login .cl-form fieldset {
        min-width: 0;
        margin: 0;
        padding: 0;
        border: 0;
      }
      .creative-login .cl-name-fields {
        display: flex;
        flex-direction: column;
        gap: 1.40625cqi;
      }
      .creative-login .cl-field {
        position: relative;
        display: flex;
        align-items: center;
        min-height: 4.53125cqi;
        color: #707780;
        background: #fff;
        border-radius: .46875cqi;
        box-shadow: 0 .15625cqi .15625cqi #18295514;
      }
      .creative-login .cl-field-icon {
        position: absolute;
        left: 1.09375cqi;
        display: flex;
        pointer-events: none;
      }
      .creative-login .cl-field-icon svg {
        width: 2.03125cqi;
        height: 2.03125cqi;
      }
      .creative-login .cl-field input {
        display: block;
        width: 100%;
        min-width: 0;
        height: 4.53125cqi;
        margin: 0;
        padding: .625cqi 1.25cqi .625cqi 3.90625cqi;
        border: .15625cqi solid #dfe4ed;
        border-radius: .46875cqi;
        outline: none;
        background: transparent;
        color: #333c49;
        font-family: inherit;
        font-size: 1.328125cqi;
        font-weight: 400;
        line-height: 2.03125cqi;
        transition: border-color .15s, box-shadow .15s;
      }
      .creative-login .cl-field input::placeholder { color: #707985; opacity: 1; }
      .creative-login .cl-field input:focus {
        border-color: #a4ffce;
        box-shadow: 0 0 0 .46875cqi #c7ffe14d;
      }
      .creative-login .cl-field[data-invalid="true"] input {
        border-color: #ffb5b5;
        box-shadow: 0 0 0 .3125cqi #ffb5b54d;
      }
      .creative-login .cl-field-error {
        margin: .625cqi 0 0;
        color: #fff2d6;
        font-size: 1.5625cqi;
        line-height: 2.1875cqi;
        overflow-wrap: anywhere;
        text-align: left;
      }
      .creative-login .cl-email-label { margin-top: 1.875cqi; }
      .creative-login .cl-primary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: .9375cqi;
        width: 100%;
        min-height: 4.375cqi;
        margin-top: 2.03125cqi;
        padding: .625cqi 1.5625cqi;
        border: .15625cqi solid #55d3a1;
        border-radius: .3125cqi;
        background: #19b780;
        color: #fff;
        font-family: inherit;
        font-size: 1.5625cqi;
        font-weight: 700;
        line-height: 2.1875cqi;
        cursor: pointer;
        transition: background .15s, transform .15s;
      }
      .creative-login .cl-primary:not(:disabled):hover { background: #12a672; }
      .creative-login .cl-primary:not(:disabled):active { transform: translateY(.15625cqi); }
      .creative-login .cl-primary svg { width: 2.1875cqi; height: 2.1875cqi; flex-shrink: 0; }
      .creative-login button:disabled { opacity: .65; cursor: wait; }
      .creative-login button:focus-visible { outline: max(2px, .3125cqi) solid #fff; outline-offset: max(3px, .46875cqi); }
      .creative-login .cl-heading:focus { outline: none; }
      .creative-login .cl-heading:focus-visible { outline: max(2px, .3125cqi) solid #ffffff80; outline-offset: max(3px, .46875cqi); }

      /* Optional unobtrusive replay control and an accurate creator credit. */
      .creative-login .cl-replay {
        position: absolute;
        top: -3.59375cqi;
        right: -2.8125cqi;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 5cqi;
        height: 5cqi;
        padding: 0;
        border: 0;
        background: transparent;
        color: #ffffff80;
        cursor: pointer;
      }
      .creative-login .cl-replay svg { width: .9375cqi; height: .9375cqi; }
      .creative-login .cl-replay:hover { color: #fff; }
      .creative-login .cl-credit {
        position: absolute;
        top: calc(100% + 3.59375cqi);
        right: -2.03125cqi;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 10.9375cqi;
        height: 2.1875cqi;
        padding: .3125cqi .46875cqi;
        border: .15625cqi solid #d9dde6;
        border-radius: .15625cqi;
        background: #fff;
        color: #697180;
        font-size: .859375cqi;
        font-weight: 400;
        line-height: 1.25cqi;
        white-space: nowrap;
      }

      .creative-login .cl-review {
        margin: 2.1875cqi 0 0;
        padding: 2.1875cqi;
        border: .15625cqi solid #ffffff38;
        border-radius: .625cqi;
        background: #ffffff0d;
        text-align: left;
      }
      .creative-login .cl-review div + div { margin-top: 2.1875cqi; }
      .creative-login .cl-review dt { margin: 0 0 .625cqi; color: #e7ecff; font-size: 1.5625cqi; line-height: 2.1875cqi; }
      .creative-login .cl-review dd { margin: 0; color: #fff; font-size: 1.875cqi; line-height: 2.65625cqi; overflow-wrap: anywhere; }
      .creative-login .cl-secondary {
        display: inline-block;
        margin-top: 1.09375cqi;
        padding: 1.25cqi;
        border: 0;
        background: transparent;
        color: #fff;
        font-family: inherit;
        font-size: 1.5625cqi;
        line-height: 2.1875cqi;
        text-decoration: underline;
        text-underline-offset: .46875cqi;
        cursor: pointer;
      }
      .creative-login .cl-secondary:hover { color: #daffe8; }
      .creative-login .cl-submit-error { margin: 1.5625cqi 0 0; color: #fff2d6; font-size: 1.5625cqi; line-height: 2.34375cqi; overflow-wrap: anywhere; }
      .creative-login .cl-success { padding-top: 1.875cqi; }
      .creative-login .cl-success-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 6.5625cqi;
        height: 6.5625cqi;
        margin: 0 auto 2.8125cqi;
        border-radius: 50%;
        background: #19b780;
        box-shadow: 0 0 0 1.09375cqi #ffffff0a;
      }
      .creative-login .cl-success-icon svg { width: 3.4375cqi; height: 3.4375cqi; }
      .creative-login .cl-spinner {
        width: 1.875cqi;
        height: 1.875cqi;
        border: .3125cqi solid #ffffff40;
        border-top-color: #fff;
        border-radius: 50%;
        animation: cl-spin .75s linear infinite;
      }

      .creative-login[data-intro="waiting"] .cl-form-position { visibility: hidden; pointer-events: none; }
      .creative-login[data-intro="revealing"] .cl-form-position { pointer-events: none; }
      .creative-login .cl-step-enter { animation: cl-step-entrance .22s ease-out both; }

      @keyframes cl-step-entrance {
        from { opacity: 0; transform: translateY(1.09375cqi); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes cl-spin { to { transform: rotate(360deg); } }

      /* Gallery artwork retains the canonical ratio at every card width. */
      .creative-login.cl-thumbnail {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        min-height: 0;
      }
      .creative-login .cl-thumbnail-scene { flex-shrink: 0; transform: none; }
      .creative-login .cl-static-field {
        display: flex;
        align-items: center;
        gap: .78125cqi;
        height: 4.53125cqi;
        padding: .625cqi 1.09375cqi;
        border: .15625cqi solid #dfe4ed;
        border-radius: .46875cqi;
        background: #fff;
        color: #707985;
        font-size: 1.328125cqi;
        line-height: 2.03125cqi;
        text-align: left;
      }
      .creative-login .cl-static-field svg { width: 2.03125cqi; height: 2.03125cqi; flex-shrink: 0; }
      .creative-login .cl-static-field span { min-width: 0; overflow: hidden; white-space: nowrap; }

      @container creative-login-scene (max-width: 499px) {
        .creative-login.cl-stage .cl-character-layer {
          width: 640px;
          height: 404px;
          left: calc(34.0625% - 218px);
          top: calc(max(44px, 14.6875cqi) - 94px);
        }
        .creative-login.cl-stage .cl-form-position {
          left: 34.0625%;
          width: 58%;
          margin-top: max(44px, 14.6875cqi);
          margin-bottom: max(38px, 10.9375cqi);
        }
        .creative-login.cl-stage .cl-heading { font-size: 18px; line-height: 24px; }
        .creative-login.cl-stage .cl-description { margin: 4px 0 10px; font-size: 10px; line-height: 14px; }
        .creative-login.cl-stage .cl-label { margin-bottom: 5px; font-size: 10px; line-height: 14px; }
        .creative-login.cl-stage .cl-name-fields { gap: 9px; }
        .creative-login.cl-stage .cl-field { min-height: 32px; border-radius: 3px; }
        .creative-login.cl-stage .cl-field-icon { left: 7px; }
        .creative-login.cl-stage .cl-field-icon svg { width: 13px; height: 13px; }
        .creative-login.cl-stage .cl-field input {
          height: 32px;
          padding: 5px 8px 5px 25px;
          border-width: 1px;
          border-radius: 3px;
          font-size: 12px;
          line-height: 20px;
        }
        .creative-login.cl-stage .cl-field-error { margin-top: 4px; font-size: 10px; line-height: 14px; }
        .creative-login.cl-stage .cl-email-label { margin-top: 12px; }
        .creative-login.cl-stage .cl-primary {
          gap: 6px;
          min-height: 32px;
          margin-top: 13px;
          padding: 5px 8px;
          border-width: 1px;
          border-radius: 2px;
          font-size: 11px;
          line-height: 18px;
        }
        .creative-login.cl-stage .cl-primary svg { width: 13px; height: 13px; }
        .creative-login.cl-stage .cl-review { margin-top: 14px; padding: 12px; border-width: 1px; border-radius: 4px; }
        .creative-login.cl-stage .cl-review div + div { margin-top: 14px; }
        .creative-login.cl-stage .cl-review dt { margin-bottom: 4px; font-size: 10px; line-height: 14px; }
        .creative-login.cl-stage .cl-review dd { font-size: 12px; line-height: 17px; }
        .creative-login.cl-stage .cl-secondary { margin-top: 7px; padding: 8px; font-size: 11px; line-height: 16px; }
        .creative-login.cl-stage .cl-submit-error { margin-top: 10px; font-size: 10px; line-height: 15px; }
        .creative-login.cl-stage .cl-success { padding-top: 12px; }
        .creative-login.cl-stage .cl-success-icon { width: 42px; height: 42px; margin-bottom: 18px; }
        .creative-login.cl-stage .cl-success-icon svg { width: 22px; height: 22px; }
        .creative-login.cl-stage .cl-spinner { width: 12px; height: 12px; border-width: 2px; }
        .creative-login.cl-stage .cl-replay { top: -23px; right: -12px; width: 32px; height: 32px; }
        .creative-login.cl-stage .cl-replay svg { width: 7px; height: 7px; }
        .creative-login.cl-stage .cl-credit { top: calc(100% + 14px); right: 0; min-width: 66px; height: 13px; padding: 2px 3px; border-width: 1px; font-size: 5.5px; line-height: 8px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .creative-login *,
        .creative-login *::before,
        .creative-login *::after { animation: none !important; transition: none !important; }
        .creative-login[data-intro="waiting"] .cl-form-position { visibility: visible; pointer-events: auto; }
        .creative-login[data-intro="revealing"] .cl-form-position { pointer-events: auto; }
      }
    `}</style>
  );
}

/** A projected point normalized to the scene's width and height. */
export type ProjectedPoint = Readonly<{ x: number; y: number }>;

type Matrix3 = [number, number, number, number, number, number, number, number, number];

// Keeping an unprojectable frame hidden avoids flashing the resting form while
// the animated plane is exactly edge-on to the camera.
const HIDDEN_TRANSFORM = "matrix3d(0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1)";

function multiply(a: Matrix3, b: Matrix3): Matrix3 {
  const result = Array<number>(9).fill(0) as Matrix3;
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 3; column++) {
      for (let index = 0; index < 3; index++) {
        result[row * 3 + column] += a[row * 3 + index] * b[index * 3 + column];
      }
    }
  }
  return result;
}

/** Solve the eight independent homography coefficients with partial pivoting. */
function solveHomography(source: readonly ProjectedPoint[], target: readonly ProjectedPoint[]): Matrix3 | null {
  const rows: number[][] = [];
  for (let index = 0; index < 4; index++) {
    const { x, y } = source[index];
    const { x: u, y: v } = target[index];
    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }

  for (let column = 0; column < 8; column++) {
    let pivot = column;
    for (let row = column + 1; row < 8; row++) {
      if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column])) pivot = row;
    }
    if (Math.abs(rows[pivot][column]) < 1e-13) return null;
    [rows[column], rows[pivot]] = [rows[pivot], rows[column]];
    const divisor = rows[column][column];
    for (let index = column; index < 9; index++) rows[column][index] /= divisor;

    for (let row = 0; row < 8; row++) {
      if (row === column) continue;
      const factor = rows[row][column];
      for (let index = column; index < 9; index++) {
        rows[row][index] -= factor * rows[column][index];
      }
    }
  }
  return [...rows.map((row) => row[8]), 1] as Matrix3;
}

/**
 * Map the entire HTML form through the original animated 3D form plane.
 *
 * Corners must be in matching order: top-left, top-right, bottom-right,
 * bottom-left, as emitted by CharacterScene. The two quads describe the plane,
 * not the HTML wrapper; points outside the plane are projected correctly too.
 *
 * All size/offset parameters are CSS pixels, NOT canvas drawing-buffer pixels.
 * Set the wrapper's transform-origin to "0 0". Keep its normal left/top values.
 * Do not add another CSS perspective or animated transform to its ancestors.
 *
 * The normalized homography H becomes the wrapper-local transform:
 *   T(-left, -top) × S(width, height) × H × S(1/width, 1/height) × T(left, top).
 */
export function calculateFormTransform(
  currentCorners: readonly ProjectedPoint[],
  restingCorners: readonly ProjectedPoint[],
  stageWidth: number,
  stageHeight: number,
  formOffsetLeft: number,
  formOffsetTop: number,
): string {
  const dimensions = [stageWidth, stageHeight, formOffsetLeft, formOffsetTop];
  const points = [...currentCorners, ...restingCorners];
  if (
    currentCorners.length !== 4 || restingCorners.length !== 4 ||
    stageWidth <= 0 || stageHeight <= 0 ||
    !dimensions.every(Number.isFinite) ||
    !points.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))
  ) return HIDDEN_TRANSFORM;

  const homography = solveHomography(restingCorners, currentCorners);
  if (!homography) return HIDDEN_TRANSFORM;

  const fromLocal: Matrix3 = [
    1 / stageWidth, 0, formOffsetLeft / stageWidth,
    0, 1 / stageHeight, formOffsetTop / stageHeight,
    0, 0, 1,
  ];
  const toLocal: Matrix3 = [
    stageWidth, 0, -formOffsetLeft,
    0, stageHeight, -formOffsetTop,
    0, 0, 1,
  ];
  const h = multiply(toLocal, multiply(homography, fromLocal));
  if (!h.every(Number.isFinite)) return HIDDEN_TRANSFORM;

  // CSS matrix3d is column-major. The last row carries the perspective divide.
  const css = [
    h[0], h[3], 0, h[6],
    h[1], h[4], 0, h[7],
    0, 0, 1, 0,
    h[2], h[5], 0, h[8],
  ];
  return `matrix3d(${css.map((value) => Math.abs(value) < 1e-13 ? "0" : value.toPrecision(12)).join(",")})`;
}
