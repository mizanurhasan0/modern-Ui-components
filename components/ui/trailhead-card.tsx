"use client";

import { ComponentStyles } from "./component-styles";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

export interface TrailheadCardProps {
  title?: string;
  description?: string;
  initiallySaved?: boolean;
  /** Resolve to accept the change; reject to leave the previous saved state intact. */
  onSaveChange?: (saved: boolean) => void | Promise<void>;
  /** Replaces the built-in overview dialog when provided. */
  onOpen?: () => void;
  /** Replaces the local trip-checklist download when provided. */
  onDownload?: () => void | Promise<void>;
  className?: string;
}

type TrailheadIconName = "heart" | "mountain" | "download" | "compass" | "chevron" | "close" | "check";
const DEFAULT_DESCRIPTION =
  "Offline maps, elevation profiles, and turn-by-turn routing for every trail you run, ride, or hike.";
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/* Shared Tailwind classes for the interactive card and its gallery thumbnail; each adds its own sizes. */
const STAGE_CLASS =
  "trailhead-stage @container/trailhead relative isolate grid w-full place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,#0a1723_0%,#03111a_57%,#041019_100%)] [font-family:Arial,Helvetica,sans-serif]";
const SCENE_CLASS = "trailhead-scene relative aspect-[1.13] touch-pan-y perspective-[900px]";
const CARD_CLASS =
  "trailhead-card relative h-full w-full rounded-[14%] text-[#244376] transform-3d [--tilt-x:0deg] [--tilt-y:0deg] [--lens-lift:0] [--light-x:30%] [--light-y:15%] [transform:rotateX(var(--tilt-x))_rotateY(var(--tilt-y))] [transition:transform_480ms_cubic-bezier(.2,.7,.2,1)] motion-reduce:[transform:none] motion-reduce:[transition:none]";
const COPY_CLASS = "trailhead-copy absolute top-[32.8%] left-[7.5%] w-[79%] [transform:translateZ(20px)]";
const TITLE_CLASS = "trailhead-title m-0 font-bold leading-[1.3] tracking-[-.035em]";
const DESCRIPTION_CLASS = "trailhead-description m-0 font-medium leading-[1.5] tracking-[-.018em]";
const FOOTER_CLASS = "trailhead-footer absolute inset-x-[5%] bottom-[5%] flex items-center justify-between [transform:translateZ(25px)]";
const ACTION_CLASS =
  "trailhead-action inline-flex items-center justify-center rounded-full bg-[#f5fdfff5] text-[#465b7b] shadow-[0_6px_11px_#1f477529,inset_0_1px_0_#fff] [transition:background_180ms_ease,color_180ms_ease,transform_180ms_ease] motion-reduce:[transition:none]";
const OPEN_CLASS = "trailhead-open inline-flex items-center gap-1 py-2 pr-0 pl-2 font-bold uppercase tracking-[.07em] text-[#3c5dca]";
const INTERACTIVE_ACTION_CLASS = `${ACTION_CLASS} size-[34px] hover:bg-[#133652] hover:text-[#d9f7ff] hover:[transform:translateY(-2px)] aria-pressed:bg-[#133652] aria-pressed:text-[#d9f7ff] aria-pressed:[transform:translateY(-2px)] disabled:cursor-wait disabled:opacity-60 @max-[420.02px]/trailhead:size-[30px] *:size-[15px]`;

function TrailheadIcon({ name, filled = false }: { name: TrailheadIconName; filled?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === "heart" && <path d="M20.5 4.7a5.4 5.4 0 0 0-7.6 0L12 5.6l-.9-.9a5.4 5.4 0 0 0-7.6 7.6L12 21l8.5-8.7a5.4 5.4 0 0 0 0-7.6Z" />}
      {name === "mountain" && <><path d="m2 20 6.5-14 4 8 3-6L22 20Z" /><path d="m6 11 2.5 2L11 11m3.2 0 1.3 1 1.3-1" /></>}
      {name === "download" && <><path d="M12 3v12m-4-4 4 4 4-4M5 17v3h14v-3" /></>}
      {name === "compass" && <><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5Z" /></>}
      {name === "chevron" && <path d="m8 10 4 4 4-4" />}
      {name === "close" && <path d="m6 6 12 12M6 18 18 6" />}
      {name === "check" && <path d="m5 12 4 4 10-10" />}
    </svg>
  );
}

function LensLayers() {
  return (
    <div className="trailhead-lenses pointer-events-none absolute inset-0 transform-3d" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((layer) => (
        <span
          key={layer}
          className="trailhead-lens absolute top-[2%] right-[2%] flex aspect-[1] w-[calc(53%_-_var(--lens)_*_8.4%)] items-center justify-center rounded-full border-t border-t-[#e1f8ff40] bg-[linear-gradient(135deg,#e0f8ff38_5%,#c9eeff88_58%,#a0daedab_100%)] shadow-[-9px_11px_22px_#386cb52b,inset_1px_1px_10px_#eafaff16] [transform:translateZ(calc(4px_+_var(--lens)_*_5px_+_var(--lens-lift)_*_(18px_+_var(--lens)_*_13px)))] [transition:transform_550ms_cubic-bezier(.2,.75,.2,1)] *:size-[37%] last:bg-[linear-gradient(135deg,#ebfcff35,#c3e9f4a6)] last:text-[#f4ffff] motion-reduce:[transform:none] motion-reduce:[transition:none]"
          style={{ "--lens": layer } as CSSProperties}
        >
          {layer === 4 && <TrailheadIcon name="compass" />}
        </span>
      ))}
    </div>
  );
}

function CardLayers() {
  return (
    <>
      <div className="trailhead-base absolute inset-0 rounded-[14%] bg-[linear-gradient(125deg,#4bceee_5%,#4bbcee_36%,#4488ec_63%,#353fe4_100%)] shadow-[0_22px_55px_-20px_#172a6680,0_3px_8px_#6bd5ff21,inset_1px_1px_1px_#a5f8ff80]" aria-hidden="true" />
      <div className="trailhead-glass absolute inset-[4px] rounded-[13%_90%_11%_12%/15%_86%_12%_14%] bg-[linear-gradient(140deg,#dff5f8f0_0%,#c4edf8e6_28%,#a4d9f4df_55%,#98b6f1c9_100%)] shadow-[inset_1px_1px_1px_#ffffffb3] [transform:translateZ(5px)] after:absolute after:inset-0 after:rounded-[inherit] after:bg-[radial-gradient(circle_at_var(--light-x)_var(--light-y),#ffffff4d,transparent_70%)] after:content-['']" aria-hidden="true" />
      <div className="trailhead-edge pointer-events-none absolute inset-[4px] rounded-[13%_90%_11%_12%/15%_86%_12%_14%] border border-[#d4fbff5e] border-b-[#dbf5ff99] [transform:translateZ(7px)]" aria-hidden="true" />
      <LensLayers />
    </>
  );
}

/** A portable CSS-only glass card with pointer, touch, and keyboard tilt. */
export default function TrailheadCard({
  title = "Trailhead",
  description = DEFAULT_DESCRIPTION,
  initiallySaved = false,
  onSaveChange,
  onOpen,
  onDownload,
  className = "",
}: TrailheadCardProps) {
  const [saved, setSaved] = useState(initiallySaved);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [detailView, setDetailView] = useState<"overview" | "elevation">("overview");
  const card = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const tilt = useRef({ x: 0, y: 0 });
  const frame = useRef<number | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingLock = useRef(false);
  const downloadLock = useRef(false);
  const id = useId();

  useEffect(() => {
    const element = card.current;
    const preference = window.matchMedia(MOTION_QUERY);
    function resetMotion() {
      if (!preference.matches) return;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      element?.style.setProperty("--tilt-x", "0deg");
      element?.style.setProperty("--tilt-y", "0deg");
      element?.style.setProperty("--lens-lift", "0");
    }
    preference.addEventListener("change", resetMotion);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      if (resetTimer.current !== null) clearTimeout(resetTimer.current);
      preference.removeEventListener("change", resetMotion);
    };
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(""), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  function setTilt(x: number, y: number, raised = true) {
    if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    if (window.matchMedia(MOTION_QUERY).matches) return;
    tilt.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const element = card.current;
      if (!element) return;
      element.style.setProperty("--tilt-x", `${-tilt.current.y * 12}deg`);
      element.style.setProperty("--tilt-y", `${tilt.current.x * 14}deg`);
      element.style.setProperty("--lens-lift", raised ? "1" : "0");
      element.style.setProperty("--light-x", `${(tilt.current.x + 1) * 50}%`);
      element.style.setProperty("--light-y", `${(tilt.current.y + 1) * 50}%`);
      frame.current = null;
    });
  }

  function followPointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setTilt((event.clientX - bounds.left) / bounds.width * 2 - 1, (event.clientY - bounds.top) / bounds.height * 2 - 1);
  }

  function resetTilt() {
    setTilt(0, 0, false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-0.25, 0], ArrowRight: [0.25, 0],
      ArrowUp: [0, -0.25], ArrowDown: [0, 0.25],
    };
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = directions[event.key];
    if (direction) {
      event.preventDefault();
      setTilt(tilt.current.x + direction[0], tilt.current.y + direction[1]);
    } else if (event.key === "Home" || event.key === "Escape") {
      event.preventDefault();
      resetTilt();
    }
  }

  async function toggleSave() {
    if (savingLock.current) return;
    savingLock.current = true;
    setSaving(true);
    try {
      await onSaveChange?.(!saved);
      setSaved(!saved);
      setFeedback(saved ? "Removed from your saved adventures." : "Saved to your adventures.");
    } catch {
      setFeedback("Could not save your change. Please try again.");
    } finally {
      savingLock.current = false;
      setSaving(false);
    }
  }

  function openDetails(button: HTMLButtonElement, view: "overview" | "elevation") {
    resetTilt();
    if (view === "overview" && onOpen) {
      onOpen();
      return;
    }
    opener.current = button;
    setDetailView(view);
    dialog.current?.showModal();
  }

  async function downloadChecklist() {
    if (downloadLock.current) return;
    downloadLock.current = true;
    setDownloading(true);
    try {
      if (onDownload) {
        await onDownload();
        setFeedback("Your download is ready.");
      } else {
        const checklist = `${title} — trip checklist\n\nBefore you head out\n[ ] Choose your trail and check local conditions.\n[ ] Download a map from your preferred mapping app.\n[ ] Share your route and return time with someone.\n[ ] Pack water, snacks, weather protection, and a first-aid kit.\n[ ] Charge your phone and bring a backup power source.\n\nOn the trail\n[ ] Follow posted signs and respect trail closures.\n[ ] Leave no trace and bring your rubbish home.\n\nThis is a planning checklist, not an offline map or navigation file.\n`;
        const blob = new Blob([checklist], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "trailhead-trip-checklist.txt";
        document.body.appendChild(link);
        link.click();
        link.remove();
        // Defer revocation until the browser has consumed the download URL.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setFeedback("Trip checklist downloaded.");
      }
    } catch {
      setFeedback("Could not start your download. Please try again.");
    } finally {
      downloadLock.current = false;
      setDownloading(false);
    }
  }

  return (
    <section className={`${STAGE_CLASS} min-h-[500px] px-7 py-[76px] ${className}`} aria-label={`${title} interactive card`}>
      <TrailheadStyles />
      <p className="sr-only" id={`${id}-instructions`}>Move your pointer or touch the card to explore its layers. With the card focused, use arrow keys to tilt, and Home or Escape to reset.</p>
      <div className={`${SCENE_CLASS} w-[min(340px,76cqw)] @max-[420.02px]/trailhead:w-[82cqw] @min-[1100px]/trailhead:[scale:1.25] @min-[1500px]/trailhead:[scale:1.45]`} onPointerMove={followPointer} onPointerDown={(event) => { if (event.pointerType !== "mouse") followPointer(event); }} onPointerLeave={(event) => { if (event.pointerType === "mouse") resetTilt(); }} onPointerUp={(event) => { if (event.pointerType !== "mouse") resetTimer.current = setTimeout(resetTilt, 650); }} onPointerCancel={resetTilt}>
        <div ref={card} className={CARD_CLASS} tabIndex={0} role="group" aria-labelledby={`${id}-title`} aria-describedby={`${id}-instructions`} onKeyDown={handleKeyDown} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) resetTilt(); }}>
          <CardLayers />
          <div className={COPY_CLASS}>
            <h2 id={`${id}-title`} className={`${TITLE_CLASS} text-[20px] @max-[420.02px]/trailhead:text-[length:clamp(16px,5cqw,20px)]`}>{title}</h2>
            <p className={`${DESCRIPTION_CLASS} mt-[15px] text-[15px] @max-[420.02px]/trailhead:mt-[11px] @max-[420.02px]/trailhead:text-[length:clamp(11px,3.5cqw,15px)]`}>{description}</p>
          </div>
          <div className={`${FOOTER_CLASS} @max-[420.02px]/trailhead:inset-x-[6%]`}>
            <div className="flex items-center gap-2.5">
              <button type="button" className={INTERACTIVE_ACTION_CLASS} onClick={toggleSave} aria-label={saved ? "Remove from saved adventures" : "Save adventure"} aria-pressed={saved} disabled={saving} title={saved ? "Saved adventure" : "Save adventure"}>
                <TrailheadIcon name="heart" filled={saved} />
              </button>
              <button type="button" className={INTERACTIVE_ACTION_CLASS} onClick={(event) => openDetails(event.currentTarget, "elevation")} aria-label="Preview elevation profile" title="Elevation profile">
                <TrailheadIcon name="mountain" />
              </button>
              <button type="button" className={INTERACTIVE_ACTION_CLASS} onClick={downloadChecklist} disabled={downloading} aria-label="Download trip checklist" title="Download trip checklist">
                <TrailheadIcon name="download" />
              </button>
            </div>
            <button type="button" className={`${OPEN_CLASS} text-[11px] hover:text-[#163b8f] @max-[420.02px]/trailhead:text-[9px] [&>svg]:size-[15px]`} onClick={(event) => openDetails(event.currentTarget, "overview")} aria-label={`Open ${title} details`}>
              <span className="underline underline-offset-3">Open</span><TrailheadIcon name="chevron" />
            </button>
          </div>
        </div>
      </div>
      <p className="trailhead-feedback absolute inset-x-5 bottom-[22px] min-h-5 text-center text-xs leading-5 text-cyan-50" role="status" aria-live="polite">{feedback}</p>

      <dialog ref={dialog} className="trailhead-dialog fixed m-auto max-h-[90dvh] w-[min(440px,calc(100vw_-_32px))] overflow-x-hidden overflow-y-auto rounded-3xl border-0 bg-transparent bg-[linear-gradient(145deg,#f4fbfc,#eaf2f8)] p-0 text-[#24445c] shadow-2xl backdrop:bg-[#020d16b8] backdrop:[backdrop-filter:blur(8px)]" aria-labelledby={`${id}-dialog-title`} onClose={() => opener.current?.focus()} onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
      }}>
        <div className="relative px-7 pb-6 pt-7">
          <button type="button" className="trailhead-close absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#e1edf3] text-[#375871] hover:bg-[#cfe2eb]" aria-label="Close trail details" onClick={() => dialog.current?.close()}><TrailheadIcon name="close" /></button>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.22em] text-[#587b98]">Adventure, prepared.</p>
          <h2 id={`${id}-dialog-title`} className="text-3xl font-bold tracking-tight text-[#17354f]">{title}</h2>
          <div className="mt-6 flex gap-2" aria-label="Trail details view">
            {(["overview", "elevation"] as const).map((view) => <button key={view} type="button" className="trailhead-view rounded-full bg-[#e0ecf1] px-4 py-2 text-xs font-semibold capitalize text-[#547389] [transition:background_150ms_ease,color_150ms_ease] aria-pressed:bg-[#254a64] aria-pressed:text-[#effaff] motion-reduce:[transition:none]" aria-pressed={detailView === view} onClick={() => setDetailView(view)}>{view}</button>)}
          </div>
        </div>
        {detailView === "overview" ? (
          <div className="px-7 pb-7">
            <p className="max-w-sm text-sm leading-6 text-[#48627b]">A little preparation makes room for a lot more adventure. Keep your next day outside in one place.</p>
            <dl className="my-6 divide-y divide-[#d7e6ec]">
              {[
                ["Offline maps", "Keep your bearings, even beyond a signal."],
                ["Elevation profiles", "See the climbs before you lace up."],
                ["Turn-by-turn routes", "Know what is around the next bend."],
              ].map(([heading, text]) => <div key={heading} className="py-3"><dt className="text-sm font-semibold text-[#203f59]">{heading}</dt><dd className="mt-1 text-xs leading-5 text-[#60798c]">{text}</dd></div>)}
            </dl>
            <button type="button" className="trailhead-detail-button flex w-full items-center justify-between rounded-xl bg-[#254a64] px-4 py-3 text-sm font-semibold text-[#effaff] hover:bg-[#17394f]" onClick={downloadChecklist} disabled={downloading}>Download a trip checklist <TrailheadIcon name="download" /></button>
          </div>
        ) : (
          <div className="px-7 pb-7">
            <div className="rounded-2xl border border-[#d4e4eb] bg-white/70 px-4 pb-4 pt-5">
              <div className="flex items-center justify-between gap-4"><h3 className="text-sm font-semibold text-[#24445c]">Ridgeline loop</h3><span className="text-[9px] font-semibold uppercase tracking-wider text-[#66849a]">Sample trail</span></div>
              <svg className="mt-5 h-32 w-full" viewBox="0 0 360 135" role="img" aria-label="Example elevation profile climbs from 180 to 520 metres, then descends along an 8.4 kilometre loop">
                <defs><linearGradient id={`${id}-elevation-fill`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7dcadd" stopOpacity=".7" /><stop offset="1" stopColor="#7dcadd" stopOpacity=".06" /></linearGradient></defs>
                <path d="M0 28H360M0 66H360M0 104H360" stroke="#dce9ed" strokeDasharray="3 5" />
                <path d="M0 115 24 106 45 110 65 88 88 95 110 69 135 81 162 40 182 50 205 15 230 37 252 31 274 73 300 85 329 102 360 113V135H0Z" fill={`url(#${id}-elevation-fill)`} />
                <path d="M0 115 24 106 45 110 65 88 88 95 110 69 135 81 162 40 182 50 205 15 230 37 252 31 274 73 300 85 329 102 360 113" fill="none" stroke="#2b87a0" strokeWidth="2.5" strokeLinejoin="round" />
              </svg>
              <div className="mt-2 flex justify-between text-[10px] text-[#7a91a1]"><span>0 km</span><span>4.2 km</span><span>8.4 km</span></div>
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-3 text-center">{[["Distance", "8.4 km"], ["Ascent", "340 m"], ["Time", "2 h 40 m"]].map(([label, value]) => <div key={label}><dt className="text-[10px] uppercase tracking-wider text-[#6a8495]">{label}</dt><dd className="mt-1.5 text-lg font-semibold text-[#24445c]">{value}</dd></div>)}</dl>
            <p className="mt-5 text-[11px] leading-5 text-[#738996]">An illustrative profile to preview the experience. Connect your own trail data when you use this card.</p>
          </div>
        )}
        <p className="sr-only" role="status" aria-live="polite">{feedback}</p>
      </dialog>
    </section>
  );
}

/** Inert gallery preview, with no pointer handlers or nested focus targets. */
export function TrailheadCardThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  return (
    <div className={`${STAGE_CLASS} trailhead-thumbnail pointer-events-none min-h-[330px] px-6 py-[45px] ${className}`} aria-hidden="true">
      <TrailheadStyles />
      <div className={`${SCENE_CLASS} w-[min(250px,75cqw)] @max-[420.02px]/trailhead:w-[74cqw]`}><div className={CARD_CLASS} style={{ "--tilt-x": `${[5, -9, 8, -3][previewStep % 4]}deg`, "--tilt-y": `${[-8, 13, -12, 5][previewStep % 4]}deg`, "--lens-lift": previewStep % 2 ? 1 : .25 } as CSSProperties}>
        <CardLayers />
        <div className={COPY_CLASS}><p className={`${TITLE_CLASS} text-[15px]`}>Trailhead</p><p className={`${DESCRIPTION_CLASS} mt-[11px] text-[11px]`}>{DEFAULT_DESCRIPTION}</p></div>
        <div className={FOOTER_CLASS}><div className="flex items-center gap-2">{(["heart", "mountain", "download"] as const).map((name) => <span className={`${ACTION_CLASS} size-[25px] *:size-[11px]`} key={name}><TrailheadIcon name={name} /></span>)}</div><span className={`${OPEN_CLASS} text-[8px] [&>svg]:size-[11px]`}><span className="underline underline-offset-3">Open</span><TrailheadIcon name="chevron" /></span></div>
      </div></div>
    </div>
  );
}

function TrailheadStyles() {
  // Kept raw: the site's global unlayered :focus-visible rule would override layered Tailwind outline utilities.
  return <ComponentStyles css={`
    .trailhead-stage .trailhead-card:focus-visible { outline: 2px solid #a6eaff; outline-offset: 12px; }
    .trailhead-stage button:focus-visible { outline: 2px solid #204778; outline-offset: 4px; }
  `} />;
}
