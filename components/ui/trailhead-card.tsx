"use client";

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
    <div className="trailhead-lenses absolute inset-0" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((layer) => (
        <span key={layer} className="trailhead-lens absolute flex items-center justify-center rounded-full" style={{ "--lens": layer } as CSSProperties}>
          {layer === 4 && <TrailheadIcon name="compass" />}
        </span>
      ))}
    </div>
  );
}

function CardLayers() {
  return (
    <>
      <div className="trailhead-base absolute inset-0" aria-hidden="true" />
      <div className="trailhead-glass absolute" aria-hidden="true" />
      <div className="trailhead-edge absolute" aria-hidden="true" />
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
    <section className={`trailhead-stage relative isolate grid w-full place-items-center overflow-hidden ${className}`} aria-label={`${title} interactive card`}>
      <TrailheadStyles />
      <p className="sr-only" id={`${id}-instructions`}>Move your pointer or touch the card to explore its layers. With the card focused, use arrow keys to tilt, and Home or Escape to reset.</p>
      <div className="trailhead-scene relative" onPointerMove={followPointer} onPointerDown={(event) => { if (event.pointerType !== "mouse") followPointer(event); }} onPointerLeave={(event) => { if (event.pointerType === "mouse") resetTilt(); }} onPointerUp={(event) => { if (event.pointerType !== "mouse") resetTimer.current = setTimeout(resetTilt, 650); }} onPointerCancel={resetTilt}>
        <div ref={card} className="trailhead-card relative h-full w-full" tabIndex={0} role="group" aria-labelledby={`${id}-title`} aria-describedby={`${id}-instructions`} onKeyDown={handleKeyDown} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) resetTilt(); }}>
          <CardLayers />
          <div className="trailhead-copy absolute">
            <h2 id={`${id}-title`} className="trailhead-title font-bold">{title}</h2>
            <p className="trailhead-description">{description}</p>
          </div>
          <div className="trailhead-footer absolute flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button type="button" className="trailhead-action inline-flex items-center justify-center rounded-full" onClick={toggleSave} aria-label={saved ? "Remove from saved adventures" : "Save adventure"} aria-pressed={saved} disabled={saving} title={saved ? "Saved adventure" : "Save adventure"}>
                <TrailheadIcon name="heart" filled={saved} />
              </button>
              <button type="button" className="trailhead-action inline-flex items-center justify-center rounded-full" onClick={(event) => openDetails(event.currentTarget, "elevation")} aria-label="Preview elevation profile" title="Elevation profile">
                <TrailheadIcon name="mountain" />
              </button>
              <button type="button" className="trailhead-action inline-flex items-center justify-center rounded-full" onClick={downloadChecklist} disabled={downloading} aria-label="Download trip checklist" title="Download trip checklist">
                <TrailheadIcon name="download" />
              </button>
            </div>
            <button type="button" className="trailhead-open inline-flex items-center gap-1 font-bold uppercase" onClick={(event) => openDetails(event.currentTarget, "overview")} aria-label={`Open ${title} details`}>
              <span>Open</span><TrailheadIcon name="chevron" />
            </button>
          </div>
        </div>
      </div>
      <p className="trailhead-feedback absolute text-center text-xs leading-5 text-cyan-50" role="status" aria-live="polite">{feedback}</p>

      <dialog ref={dialog} className="trailhead-dialog fixed m-auto overflow-hidden rounded-3xl border-0 p-0 shadow-2xl" aria-labelledby={`${id}-dialog-title`} onClose={() => opener.current?.focus()} onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
      }}>
        <div className="relative px-7 pb-6 pt-7">
          <button type="button" className="trailhead-close absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full" aria-label="Close trail details" onClick={() => dialog.current?.close()}><TrailheadIcon name="close" /></button>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.22em] text-[#587b98]">Adventure, prepared.</p>
          <h2 id={`${id}-dialog-title`} className="text-3xl font-bold tracking-tight text-[#17354f]">{title}</h2>
          <div className="mt-6 flex gap-2" aria-label="Trail details view">
            {(["overview", "elevation"] as const).map((view) => <button key={view} type="button" className="trailhead-view rounded-full px-4 py-2 text-xs font-semibold capitalize" aria-pressed={detailView === view} onClick={() => setDetailView(view)}>{view}</button>)}
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
            <button type="button" className="trailhead-detail-button flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold" onClick={downloadChecklist} disabled={downloading}>Download a trip checklist <TrailheadIcon name="download" /></button>
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
    <div className={`trailhead-stage trailhead-thumbnail relative isolate grid w-full place-items-center overflow-hidden ${className}`} aria-hidden="true">
      <TrailheadStyles />
      <div className="trailhead-scene relative"><div className="trailhead-card relative h-full w-full" style={{ "--tilt-x": `${[5, -9, 8, -3][previewStep % 4]}deg`, "--tilt-y": `${[-8, 13, -12, 5][previewStep % 4]}deg`, "--lens-lift": previewStep % 2 ? 1 : .25 } as CSSProperties}>
        <CardLayers />
        <div className="trailhead-copy absolute"><p className="trailhead-title font-bold">Trailhead</p><p className="trailhead-description">{DEFAULT_DESCRIPTION}</p></div>
        <div className="trailhead-footer absolute flex items-center justify-between"><div className="flex items-center gap-2">{(["heart", "mountain", "download"] as const).map((name) => <span className="trailhead-action inline-flex items-center justify-center rounded-full" key={name}><TrailheadIcon name={name} /></span>)}</div><span className="trailhead-open inline-flex items-center gap-1 font-bold uppercase"><span>Open</span><TrailheadIcon name="chevron" /></span></div>
      </div></div>
    </div>
  );
}

function TrailheadStyles() {
  return <style>{`
    .trailhead-stage { container-type: inline-size; container-name: trailhead; min-height: 500px; padding: 76px 28px; background: radial-gradient(ellipse at 50% 45%, #0a1723 0%, #03111a 57%, #041019 100%); font-family: Arial, Helvetica, sans-serif; }
    .trailhead-stage .trailhead-scene { width: min(340px, 76cqw); aspect-ratio: 1.13; perspective: 900px; touch-action: pan-y; }
    .trailhead-stage .trailhead-card { --tilt-x: 0deg; --tilt-y: 0deg; --lens-lift: 0; --light-x: 30%; --light-y: 15%; transform-style: preserve-3d; transform: rotateX(var(--tilt-x)) rotateY(var(--tilt-y)); transition: transform 480ms cubic-bezier(.2,.7,.2,1); border-radius: 14%; color: #244376; }
    .trailhead-stage .trailhead-base { border-radius: 14%; background: linear-gradient(125deg, #4bceee 5%, #4bbcee 36%, #4488ec 63%, #353fe4 100%); box-shadow: 0 22px 55px -20px #172a6680, 0 3px 8px #6bd5ff21, inset 1px 1px 1px #a5f8ff80; }
    .trailhead-stage .trailhead-glass { inset: 4px; border-radius: 13% 90% 11% 12% / 15% 86% 12% 14%; background: linear-gradient(140deg, #dff5f8f0 0%, #c4edf8e6 28%, #a4d9f4df 55%, #98b6f1c9 100%); box-shadow: inset 1px 1px 1px #ffffffb3; transform: translateZ(5px); }
    .trailhead-stage .trailhead-glass::after { content: ''; position: absolute; inset: 0; border-radius: inherit; background: radial-gradient(circle at var(--light-x) var(--light-y), #ffffff4d, transparent 70%); }
    .trailhead-stage .trailhead-edge { inset: 4px; border-radius: 13% 90% 11% 12% / 15% 86% 12% 14%; border: 1px solid #d4fbff5e; border-bottom-color: #dbf5ff99; transform: translateZ(7px); pointer-events: none; }
    .trailhead-stage .trailhead-lenses { transform-style: preserve-3d; pointer-events: none; }
    .trailhead-stage .trailhead-lens { top: 2%; right: 2%; width: calc(53% - var(--lens) * 8.4%); aspect-ratio: 1; background: linear-gradient(135deg, #e0f8ff38 5%, #c9eeff88 58%, #a0daedab 100%); border-top: 1px solid #e1f8ff40; box-shadow: -9px 11px 22px #386cb52b, inset 1px 1px 10px #eafaff16; transform: translateZ(calc(4px + var(--lens) * 5px + var(--lens-lift) * (18px + var(--lens) * 13px))); transition: transform 550ms cubic-bezier(.2,.75,.2,1); }
    .trailhead-stage .trailhead-lens:last-child { color: #f4ffff; background: linear-gradient(135deg, #ebfcff35, #c3e9f4a6); }
    .trailhead-stage .trailhead-lens svg { width: 37%; height: 37%; }
    .trailhead-stage .trailhead-copy { left: 7.5%; top: 32.8%; width: 79%; transform: translateZ(20px); }
    .trailhead-stage .trailhead-title { margin: 0; font-size: 20px; line-height: 1.3; letter-spacing: -.035em; }
    .trailhead-stage .trailhead-description { margin: 15px 0 0; font-size: 15px; line-height: 1.5; font-weight: 500; letter-spacing: -.018em; }
    .trailhead-stage .trailhead-footer { left: 5%; right: 5%; bottom: 5%; transform: translateZ(25px); }
    .trailhead-stage .trailhead-action { width: 34px; height: 34px; color: #465b7b; background: #f5fdfff5; box-shadow: 0 6px 11px #1f477529, inset 0 1px 0 #fff; transition: background 180ms ease, color 180ms ease, transform 180ms ease; }
    .trailhead-stage .trailhead-action svg { width: 15px; height: 15px; }
    .trailhead-stage .trailhead-action:hover, .trailhead-stage .trailhead-action[aria-pressed='true'] { color: #d9f7ff; background: #133652; transform: translateY(-2px); }
    .trailhead-stage .trailhead-action:disabled { opacity: .6; cursor: wait; }
    .trailhead-stage .trailhead-open { padding: 8px 0 8px 8px; font-size: 11px; letter-spacing: .07em; color: #3c5dca; }
    .trailhead-stage .trailhead-open span { text-decoration: underline; text-underline-offset: 3px; }
    .trailhead-stage .trailhead-open svg { width: 15px; height: 15px; }
    .trailhead-stage .trailhead-open:hover { color: #163b8f; }
    .trailhead-stage .trailhead-card:focus-visible { outline: 2px solid #a6eaff; outline-offset: 12px; }
    .trailhead-stage button:focus-visible { outline: 2px solid #204778; outline-offset: 4px; }
    .trailhead-stage .trailhead-feedback { left: 20px; right: 20px; bottom: 22px; min-height: 20px; }
    .trailhead-stage .trailhead-dialog { width: min(440px, calc(100vw - 32px)); max-height: 90dvh; overflow-y: auto; background: linear-gradient(145deg,#f4fbfc,#eaf2f8); color: #24445c; }
    .trailhead-stage .trailhead-dialog::backdrop { background: #020d16b8; backdrop-filter: blur(8px); }
    .trailhead-stage .trailhead-close { background: #e1edf3; color: #375871; }
    .trailhead-stage .trailhead-close:hover { background: #cfe2eb; }
    .trailhead-stage .trailhead-view { color: #547389; background: #e0ecf1; transition: background 150ms ease, color 150ms ease; }
    .trailhead-stage .trailhead-view[aria-pressed='true'], .trailhead-stage .trailhead-detail-button { color: #effaff; background: #254a64; }
    .trailhead-stage .trailhead-detail-button:hover { background: #17394f; }
    .trailhead-stage.trailhead-thumbnail { min-height: 330px; padding: 45px 24px; pointer-events: none; }
    .trailhead-thumbnail .trailhead-scene { width: min(250px, 75cqw); }
    .trailhead-thumbnail .trailhead-card { --tilt-x: 5deg; --tilt-y: -8deg; --lens-lift: .45; }
    .trailhead-thumbnail .trailhead-title { font-size: 15px; }
    .trailhead-thumbnail .trailhead-description { margin-top: 11px; font-size: 11px; }
    .trailhead-thumbnail .trailhead-action { width: 25px; height: 25px; }
    .trailhead-thumbnail .trailhead-action svg { width: 11px; height: 11px; }
    .trailhead-thumbnail .trailhead-open { font-size: 8px; }
    .trailhead-thumbnail .trailhead-open svg { width: 11px; height: 11px; }
    @container trailhead (max-width: 420px) {
      .trailhead-stage:not(.trailhead-thumbnail) .trailhead-scene { width: 82cqw; }
      .trailhead-stage:not(.trailhead-thumbnail) .trailhead-title { font-size: clamp(16px, 5cqw, 20px); }
      .trailhead-stage:not(.trailhead-thumbnail) .trailhead-description { margin-top: 11px; font-size: clamp(11px, 3.5cqw, 15px); }
      .trailhead-stage:not(.trailhead-thumbnail) .trailhead-action { width: 30px; height: 30px; }
      .trailhead-stage:not(.trailhead-thumbnail) .trailhead-footer { left: 6%; right: 6%; }
      .trailhead-stage:not(.trailhead-thumbnail) .trailhead-open { font-size: 9px; }
      .trailhead-thumbnail .trailhead-scene { width: 74cqw; }
    }
    @media (prefers-reduced-motion: reduce) {
      .trailhead-stage *, .trailhead-stage *::before, .trailhead-stage *::after { transition: none !important; }
      .trailhead-stage .trailhead-card { transform: none; }
      .trailhead-stage .trailhead-lens { transform: none; }
    }
  `}</style>;
}
