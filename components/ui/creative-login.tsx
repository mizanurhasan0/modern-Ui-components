"use client";

import { ComponentStyles } from "./component-styles";

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

/**
 * Tailwind class lists. Large scenes scale with the 640 × 404 artwork (cqi of
 * the scene container); compact scenes (`@max-[500px]/cl-scene:`, under 500px)
 * switch to fixed pixels. Every class is written in full so Tailwind can find it.
 */
const styles = {
  root: "creative-login relative isolate w-full overflow-hidden bg-[#4b6bff] font-['Creative_Login_Fira_Sans','Fira_Sans',Arial,sans-serif] text-white [font-synthesis:none] [-webkit-font-smoothing:antialiased] @container/creative-login",
  frame: "after:pointer-events-none after:absolute after:inset-0 after:z-5 after:rounded-[.46875cqi] after:border-[.15625cqi] after:border-[#ffffffd9] after:content-['']",
  scene: "relative isolate flow-root min-h-[63.125cqi] w-full @container/cl-scene",
  characterLayer: "cl-character-layer pointer-events-none absolute top-0 left-0 z-2 h-[63.125cqi] w-full overflow-hidden",
  formPosition: "cl-form-position relative left-[34.0625%] z-1 mt-[14.6875cqi] mb-[10.9375cqi] w-[40%] origin-top-left",
  form: "cl-form relative w-full text-center",
  heading: "cl-heading text-[2.8125cqi] leading-[3.75cqi] font-bold tracking-normal wrap-anywhere",
  headingCompact: "@max-[500px]/cl-scene:text-[18px] @max-[500px]/cl-scene:leading-[24px]",
  description: "cl-description mt-[.625cqi] mb-[1.5625cqi] text-[1.5625cqi] leading-[2.1875cqi] font-normal text-[#eef2ff]",
  descriptionCompact: "@max-[500px]/cl-scene:mt-[4px] @max-[500px]/cl-scene:mb-[10px] @max-[500px]/cl-scene:text-[10px] @max-[500px]/cl-scene:leading-[14px]",
  label: "cl-label mb-[.78125cqi] block w-full text-center text-[1.5625cqi] leading-[2.1875cqi] font-normal text-[#f3f5ff]",
  labelCompact: "@max-[500px]/cl-scene:mb-[5px] @max-[500px]/cl-scene:text-[10px] @max-[500px]/cl-scene:leading-[14px]",
  nameFields: "cl-name-fields flex flex-col gap-[1.40625cqi]",
  primary: "cl-primary mt-[2.03125cqi] flex min-h-[4.375cqi] w-full cursor-pointer items-center justify-center gap-[.9375cqi] rounded-[.3125cqi] border-[.15625cqi] border-[#55d3a1] bg-[#19b780] px-[1.5625cqi] py-[.625cqi] text-[1.5625cqi] leading-[2.1875cqi] font-bold text-white transition-[background,transform] duration-150 ease-[ease] [&_svg]:size-[2.1875cqi] [&_svg]:shrink-0",
  primaryStates: "enabled:hover:bg-[#12a672] enabled:active:[transform:translateY(.15625cqi)] disabled:cursor-wait disabled:opacity-65",
  primaryCompact: "@max-[500px]/cl-scene:mt-[13px] @max-[500px]/cl-scene:min-h-[32px] @max-[500px]/cl-scene:gap-[6px] @max-[500px]/cl-scene:rounded-[2px] @max-[500px]/cl-scene:border-[1px] @max-[500px]/cl-scene:px-[8px] @max-[500px]/cl-scene:py-[5px] @max-[500px]/cl-scene:text-[11px] @max-[500px]/cl-scene:leading-[18px] @max-[500px]/cl-scene:[&_svg]:size-[13px]",
  field: "cl-field relative flex min-h-[4.53125cqi] items-center rounded-[.46875cqi] bg-white text-[#707780] shadow-[0_.15625cqi_.15625cqi_#18295514] @max-[500px]/cl-scene:min-h-[32px] @max-[500px]/cl-scene:rounded-[3px]",
  fieldIcon: "cl-field-icon pointer-events-none absolute left-[1.09375cqi] flex [&_svg]:size-[2.03125cqi] @max-[500px]/cl-scene:left-[7px] @max-[500px]/cl-scene:[&_svg]:size-[13px]",
  input: "block h-[4.53125cqi] w-full min-w-0 rounded-[.46875cqi] border-[.15625cqi] border-[#dfe4ed] py-[.625cqi] pr-[1.25cqi] pl-[3.90625cqi] text-[1.328125cqi] leading-[2.03125cqi] font-normal text-[#333c49] transition-[border-color,box-shadow] duration-150 ease-[ease] placeholder:text-[#707985] placeholder:opacity-100 focus:border-[#a4ffce] focus:shadow-[0_0_0_.46875cqi_#c7ffe14d] aria-invalid:border-[#ffb5b5] aria-invalid:shadow-[0_0_0_.3125cqi_#ffb5b54d]",
  inputCompact: "@max-[500px]/cl-scene:h-[32px] @max-[500px]/cl-scene:rounded-[3px] @max-[500px]/cl-scene:border-[1px] @max-[500px]/cl-scene:py-[5px] @max-[500px]/cl-scene:pr-[8px] @max-[500px]/cl-scene:pl-[25px] @max-[500px]/cl-scene:text-[12px] @max-[500px]/cl-scene:leading-[20px]",
  fieldError: "cl-field-error mt-[.625cqi] text-left text-[1.5625cqi] leading-[2.1875cqi] text-[#fff2d6] wrap-anywhere @max-[500px]/cl-scene:mt-[4px] @max-[500px]/cl-scene:text-[10px] @max-[500px]/cl-scene:leading-[14px]",
  staticField: "cl-static-field flex h-[4.53125cqi] items-center gap-[.78125cqi] rounded-[.46875cqi] border-[.15625cqi] border-[#dfe4ed] bg-white px-[1.09375cqi] py-[.625cqi] text-left text-[1.328125cqi] leading-[2.03125cqi] text-[#707985] [&_svg]:size-[2.03125cqi] [&_svg]:shrink-0",
  staticText: "min-w-0 overflow-hidden whitespace-nowrap",
  reviewTerm: "mb-[.625cqi] text-[1.5625cqi] leading-[2.1875cqi] text-[#e7ecff] @max-[500px]/cl-scene:mb-[4px] @max-[500px]/cl-scene:text-[10px] @max-[500px]/cl-scene:leading-[14px]",
  reviewValue: "text-[1.875cqi] leading-[2.65625cqi] text-white wrap-anywhere @max-[500px]/cl-scene:text-[12px] @max-[500px]/cl-scene:leading-[17px]",
} as const;

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
        <div className={styles.field} data-invalid={!!errors[field]}>
          <span className={styles.fieldIcon}>
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
            className={`${styles.input} ${styles.inputCompact}`}
          />
        </div>
        {errors[field] && (
          <p id={`${id}-${field}-error`} className={styles.fieldError} role="alert">
            {errors[field]}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.root} ${styles.frame} cl-stage group/login flex min-h-0 flex-col aspect-auto ${className}`} data-intro={ready ? "settled" : phase}>
      <CreativeLoginStyles />
      {/* Never taller than the screen: short, wide viewports letterbox the artwork instead. */}
      <div className={`cl-scene ${styles.scene} m-auto max-w-[calc(100svh*640/404)]`}>
        <div className={`${styles.characterLayer} @max-[500px]/cl-scene:top-[calc(max(44px,14.6875cqi)-94px)] @max-[500px]/cl-scene:left-[calc(34.0625%-218px)] @max-[500px]/cl-scene:h-[404px] @max-[500px]/cl-scene:w-[640px]`} aria-hidden="true">
          {sceneError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/creative-login/poster.png" alt="" className="h-full w-full object-contain" />
          ) : (
            <CharacterScene key={replay} intro={intro} reducedMotion={reducedMotion} onProgress={handleFrame}
              onError={() => { setSceneError(true); setPhase("settled"); }} />
          )}
        </div>
        {/* At 640px: x218, y94, width256. In-flow content can grow on validation. */}
        <div
          ref={formPosition}
          className={`${styles.formPosition} @max-[500px]/cl-scene:mt-[max(44px,14.6875cqi)] @max-[500px]/cl-scene:mb-[max(38px,10.9375cqi)] @max-[500px]/cl-scene:w-[58%] group-data-[intro=revealing]/login:motion-safe:pointer-events-none group-data-[intro=waiting]/login:motion-safe:pointer-events-none group-data-[intro=waiting]/login:motion-safe:invisible`}
          data-step={step}
          inert={!ready}
        >
          {step === "details" ? (
            <form
              key="details"
              className={`${styles.form} cl-enter`}
              onSubmit={reviewDetails}
              aria-labelledby={`${id}-title`}
              noValidate
            >
              <h2 id={`${id}-title`} className={`${styles.heading} ${styles.headingCompact}`}>Register now</h2>
              <p className={`${styles.description} ${styles.descriptionCompact}`}>Secure your spot in our upcoming live webinar</p>
              <fieldset className="m-0 min-w-0 border-0 p-0">
                <legend className={`${styles.label} ${styles.labelCompact}`}>What’s your name? <span aria-hidden="true">*</span></legend>
                <div className={`${styles.nameFields} @max-[500px]/cl-scene:gap-[9px]`}>
                  {renderField("firstName", "Name")}
                  {renderField("surname", "Surname")}
                </div>
              </fieldset>
              <p className={`${styles.label} ${styles.labelCompact} cl-email-label mt-[1.875cqi] @max-[500px]/cl-scene:mt-[12px]`} aria-hidden="true">Enter your email address <span>*</span></p>
              {renderField("email", "Ex. yourname@company.com")}
              <button className={`${styles.primary} ${styles.primaryStates} ${styles.primaryCompact}`} type="submit">
                Next
              </button>
            </form>
          ) : step === "review" ? (
            <form
              key="review"
              className={`${styles.form} cl-step-enter animate-[cl-step-entrance_.22s_ease-out_both]`}
              onSubmit={completeRegistration}
              aria-labelledby={`${id}-review-title`}
              aria-busy={submitting}
            >
              <h2 ref={heading} tabIndex={-1} id={`${id}-review-title`} className={`${styles.heading} ${styles.headingCompact}`}>One last check</h2>
              <p className={`${styles.description} ${styles.descriptionCompact}`}>Everything looking good?</p>
              <dl className="cl-review mt-[2.1875cqi] rounded-[.625cqi] border-[.15625cqi] border-[#ffffff38] bg-[#ffffff0d] p-[2.1875cqi] text-left @max-[500px]/cl-scene:mt-[14px] @max-[500px]/cl-scene:rounded-[4px] @max-[500px]/cl-scene:border-[1px] @max-[500px]/cl-scene:p-[12px]">
                <div><dt className={styles.reviewTerm}>Your name</dt><dd className={styles.reviewValue}>{values.firstName} {values.surname}</dd></div>
                <div className="mt-[2.1875cqi] @max-[500px]/cl-scene:mt-[14px]"><dt className={styles.reviewTerm}>Email address</dt><dd className={styles.reviewValue}>{values.email}</dd></div>
              </dl>
              {submitError && (
                <p className="cl-submit-error mt-[1.5625cqi] text-[1.5625cqi] leading-[2.34375cqi] text-[#fff2d6] wrap-anywhere @max-[500px]/cl-scene:mt-[10px] @max-[500px]/cl-scene:text-[10px] @max-[500px]/cl-scene:leading-[15px]" role="alert">
                  {submitError}
                </p>
              )}
              <button type="submit" className={`${styles.primary} ${styles.primaryStates} ${styles.primaryCompact}`} disabled={submitting}>
                {submitting ? (
                  <><span className="cl-spinner size-[1.875cqi] animate-[cl-spin_.75s_linear_infinite] rounded-[50%] border-[.3125cqi] border-[#ffffff40] border-t-white @max-[500px]/cl-scene:size-[12px] @max-[500px]/cl-scene:border-[2px]" aria-hidden="true" /> Registering…</>
                ) : <>Complete registration <FormIcon name="arrow" /></>}
              </button>
              <button
                type="button"
                className="cl-secondary mt-[1.09375cqi] inline-block cursor-pointer p-[1.25cqi] text-[1.5625cqi] leading-[2.1875cqi] text-white underline underline-offset-[.46875cqi] hover:text-[#daffe8] disabled:cursor-wait disabled:opacity-65 @max-[500px]/cl-scene:mt-[7px] @max-[500px]/cl-scene:p-[8px] @max-[500px]/cl-scene:text-[11px] @max-[500px]/cl-scene:leading-[16px]"
                disabled={submitting}
                onClick={() => { setSubmitError(""); setStep("details"); }}
              >
                Back to edit
              </button>
            </form>
          ) : (
            <div className={`${styles.form} cl-step-enter cl-success animate-[cl-step-entrance_.22s_ease-out_both] pt-[1.875cqi] @max-[500px]/cl-scene:pt-[12px]`} aria-labelledby={`${id}-success-title`}>
              <span className="cl-success-icon mx-auto mb-[2.8125cqi] flex size-[6.5625cqi] items-center justify-center rounded-[50%] bg-[#19b780] shadow-[0_0_0_1.09375cqi_#ffffff0a] [&_svg]:size-[3.4375cqi] @max-[500px]/cl-scene:mb-[18px] @max-[500px]/cl-scene:size-[42px] @max-[500px]/cl-scene:[&_svg]:size-[22px]">
                <FormIcon name="check" />
              </span>
              <h2 ref={heading} tabIndex={-1} id={`${id}-success-title`} className={`${styles.heading} ${styles.headingCompact}`}>You’re all set, {values.firstName}!</h2>
              <p className={`${styles.description} ${styles.descriptionCompact}`}>{onSubmit ? "Your registration is complete. See you there!" : "Your preview registration is complete."}</p>
              <button type="button" className={`${styles.primary} ${styles.primaryStates} ${styles.primaryCompact}`} onClick={startAgain}>Start again</button>
            </div>
          )}
          {/* Optional unobtrusive replay control and an accurate creator credit. */}
          <button
            type="button"
            className="cl-replay absolute top-[-3.59375cqi] right-[-2.8125cqi] flex size-[5cqi] cursor-pointer items-center justify-center text-[#ffffff80] hover:text-white [&_svg]:size-[.9375cqi] @max-[500px]/cl-scene:top-[-23px] @max-[500px]/cl-scene:right-[-12px] @max-[500px]/cl-scene:size-[32px] @max-[500px]/cl-scene:[&_svg]:size-[7px]"
            aria-label="Replay character entrance"
            onClick={() => { setPhase(intro ? "waiting" : "settled"); setReplay((value) => value + 1); }}
          >
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" aria-hidden="true"><path d="m1 1 8 8M9 1 1 9" /></svg>
          </button>
          <a
            className="cl-credit absolute top-[calc(100%+3.59375cqi)] right-[-2.03125cqi] flex h-[2.1875cqi] min-w-[10.9375cqi] items-center justify-center rounded-[.15625cqi] border-[.15625cqi] border-[#d9dde6] bg-white px-[.46875cqi] py-[.3125cqi] text-[.859375cqi] leading-[1.25cqi] font-normal whitespace-nowrap text-[#697180] @max-[500px]/cl-scene:top-[calc(100%+14px)] @max-[500px]/cl-scene:right-0 @max-[500px]/cl-scene:h-[13px] @max-[500px]/cl-scene:min-w-[66px] @max-[500px]/cl-scene:border-[1px] @max-[500px]/cl-scene:px-[3px] @max-[500px]/cl-scene:py-[2px] @max-[500px]/cl-scene:text-[5.5px] @max-[500px]/cl-scene:leading-[8px]"
            href="https://www.visme.co/"
            target="_blank"
            rel="noreferrer"
          >
            Character by Visme
          </a>
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
    <div className={`${styles.root} cl-thumbnail flex h-full min-h-0 w-full items-center justify-center ${className}`} aria-hidden="true">
      <CreativeLoginStyles />
      {/* Gallery artwork retains the canonical ratio at every card width. */}
      <div className={`cl-thumbnail-scene ${styles.scene} ${styles.frame} shrink-0`}>
        <div className={styles.characterLayer}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/creative-login/poster.png" alt="" className="h-full w-full object-contain" />
        </div>
        <div className={styles.formPosition}>
          <div className={styles.form}>
            <p className={styles.heading}>Register now</p>
            <p className={styles.description}>Secure your spot in our upcoming live webinar</p>
            <p className={styles.label}>What’s your name? *</p>
            <div className={styles.nameFields}>
              <div className={styles.staticField}><FormIcon name="person" /><span className={styles.staticText}>{previewStep % 4 >= 1 ? "Alex" : "Name"}</span></div>
              <div className={styles.staticField}><FormIcon name="person" /><span className={styles.staticText}>{previewStep % 4 >= 2 ? "Morgan" : "Surname"}</span></div>
            </div>
            <p className={`${styles.label} cl-email-label mt-[1.875cqi]`}>Enter your email address *</p>
            <div className={styles.staticField}><FormIcon name="email" /><span className={styles.staticText}>{previewStep % 4 >= 3 ? "alex@example.com" : "Ex. yourname@company.com"}</span></div>
            <div className={styles.primary}>{previewStep % 4 === 3 ? "Ready to continue ✓" : "Next"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Only what utilities cannot express: fonts, keyframes, and cascade-sensitive rules. */
function CreativeLoginStyles() {
  return (
    <ComponentStyles css={`
      @font-face { font-family: "Creative Login Fira Sans"; src: url("/creative-login/font-regular.ttf") format("truetype"); font-weight: 400; font-display: swap; }
      @font-face { font-family: "Creative Login Fira Sans"; src: url("/creative-login/font-bold.ttf") format("truetype"); font-weight: 700; font-display: swap; }

      /* Focus styles stay unlayered so they outrank the app's global :focus-visible ring. */
      .creative-login .cl-field input { outline: none; }
      .creative-login button:focus-visible { outline: max(2px, .3125cqi) solid #fff; outline-offset: max(3px, .46875cqi); }
      .creative-login .cl-heading:focus { outline: none; }
      .creative-login .cl-heading:focus-visible { outline: max(2px, .3125cqi) solid #ffffff80; outline-offset: max(3px, .46875cqi); }

      @keyframes cl-step-entrance {
        from { opacity: 0; transform: translateY(1.09375cqi); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes cl-spin { to { transform: rotate(360deg); } }

      @media (prefers-reduced-motion: reduce) {
        .creative-login *,
        .creative-login *::before,
        .creative-login *::after { animation: none !important; transition: none !important; }
      }
    `} />
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
