"use client";

import { ComponentStyles } from "./component-styles";

import { useEffect, useId, useRef, useState, type Ref } from "react";

export interface RedBullCardProps {
  className?: string;
  title?: string;
  description?: string;
  /** Playback stops after a manual action and pauses while hovered, focused, or hidden. */
  autoPlay?: boolean;
  onShopNow?: () => void;
}

function RedBullMark({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={compact ? "rb-mark rb-mark-compact" : "rb-mark"}
      viewBox="0 0 144 78"
      fill="none"
    >
      <path
        d="M29 38c9-15 20-20 32-17 8 2 13 8 17 14 5-7 12-12 21-13 11-1 21 5 27 16-9-3-15-2-20 2 8 0 13 4 16 10-9-2-16-1-23 2-6 3-11 7-16 13l-9-7-8 7c-6-6-10-10-16-13-7-3-14-4-23-2 3-6 8-10 16-10-5-4-11-5-20-2Z"
        fill="#F8C838"
      />
      <path
        d="M39 37c8-8 16-9 24-6 5 2 9 5 14 11-5 0-10 1-15 4-6-6-13-9-23-9Zm67-1c-8-7-16-8-23-5-5 2-9 5-14 10 5 0 10 2 15 5 6-6 13-9 22-10Z"
        fill="#E6313D"
      />
      <path
        d="M19 39c4 11 14 17 27 15-9-5-14-10-17-19l-10 4Zm106-4c-3 10-9 16-22 19 9-6 14-11 17-21l5 2Z"
        fill="#E6313D"
      />
      <text
        x="72"
        y="72"
        textAnchor="middle"
        fill="#F04452"
        fontFamily="Arial, sans-serif"
        fontSize="22"
        fontWeight="800"
        letterSpacing="-.8"
      >
        Red Bull
      </text>
    </svg>
  );
}

/** Real product photography, embedded by the Code tab for standalone reuse. */
function EnergyCan() {
  return (
    // A native image keeps the copied component usable outside Next.js.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="rb-can"
      src="/redbull/energy-drink-can.webp"
      alt="Chilled 250 ml Red Bull Energy Drink can"
      width={686}
      height={1751}
      draggable={false}
      decoding="async"
    />
  );
}

const PARTICLES = [
  [9, 18, 2, 1.2],
  [18, 81, 3, 1.8],
  [28, 30, 2, 2.4],
  [38, 89, 2, 1.5],
  [49, 12, 3, 2.1],
  [61, 91, 2, 1.7],
  [72, 23, 2, 2.8],
  [83, 77, 3, 1.4],
  [92, 36, 2, 2.2],
  [14, 55, 2, 2.5],
  [77, 52, 2, 1.9],
  [54, 70, 3, 2.7],
] as const;

type CardPhase = "compact" | "card" | "expanded";
const DEFAULT_DESCRIPTION =
  "Red Bull gives you wings. A refreshing energy drink that revitalizes body and mind.";
const PLAYBACK_STEPS: ReadonlyArray<{ phase: CardPhase; delay: number }> = [
  { phase: "card", delay: 1800 },
  { phase: "expanded", delay: 450 },
  { phase: "card", delay: 3400 },
  { phase: "compact", delay: 450 },
];

function ProductScene({
  phase,
  title = "REDBULL",
  description = DEFAULT_DESCRIPTION,
  interactive = false,
  contentId,
  toggleRef,
  onToggle,
  onShopNow,
}: {
  phase: CardPhase;
  title?: string;
  description?: string;
  interactive?: boolean;
  contentId?: string;
  toggleRef?: Ref<HTMLButtonElement>;
  onToggle?: () => void;
  onShopNow?: () => void;
}) {
  const expanded = phase === "expanded";
  return (
    <div className="rb-preview">
      <div className="rb-night-sky" aria-hidden="true">
        {PARTICLES.map(([x, y, size, delay], index) => (
          <span
            className="rb-particle"
            key={index}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>
      <article
        className="rb-product-panel"
        data-phase={phase}
        aria-label="Red Bull energy drink"
      >
        <div className="rb-panel-shine" aria-hidden="true" />
        <div className="rb-logo-wrap" aria-hidden="true">
          <RedBullMark />
        </div>
        <div
          id={contentId}
          className="rb-copy"
          aria-hidden={!expanded}
          inert={!expanded}
        >
          <h3>{title}</h3>
          <p className="rb-description">{description}</p>
          {interactive ? (
            <button
              className="rb-shop-button"
              type="button"
              onClick={onShopNow}
              tabIndex={expanded ? 0 : -1}
            >
              Shop Now
            </button>
          ) : (
            <span className="rb-shop-button">Shop Now</span>
          )}
        </div>
        <div className="rb-can-wrap" aria-hidden="true">
          <EnergyCan />
        </div>
        {interactive && (
          <button
            ref={toggleRef}
            className="rb-toggle"
            type="button"
            aria-expanded={expanded}
            aria-controls={contentId}
            aria-label={
              expanded ? "Collapse product card" : "Expand product card"
            }
            onClick={onToggle}
          >
            <span className="rb-toggle-label">
              {expanded ? "Close" : "Open"}
            </span>
            <span className="rb-toggle-icon" aria-hidden="true">
              {expanded ? "×" : "+"}
            </span>
          </button>
        )}
      </article>
    </div>
  );
}

/** A glowing logo that opens into a small, animated energy drink product card. */
export default function RedBullCard({
  className = "",
  title = "REDBULL",
  description = DEFAULT_DESCRIPTION,
  autoPlay = true,
  onShopNow,
}: RedBullCardProps) {
  const [phase, setPhase] = useState<CardPhase>("compact");
  const [shopMessage, setShopMessage] = useState("");
  const manualRef = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pointerWithin = useRef(false);
  const focusWithin = useRef(false);
  const playbackRef = useRef<(() => void) | null>(null);
  const contentId = useId();
  const expanded = phase === "expanded";

  useEffect(() => {
    if (!autoPlay || manualRef.current) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = typeof IntersectionObserver === "undefined";
    let disposed = false;
    let step = 0;
    let remaining = PLAYBACK_STEPS[0].delay;
    let deadline = 0;

    function synchronize() {
      if (disposed) return;
      const running =
        visible &&
        !document.hidden &&
        !motion.matches &&
        !manualRef.current &&
        !pointerWithin.current &&
        !focusWithin.current;
      if (!running) {
        if (timer !== undefined) {
          remaining = Math.max(0, deadline - performance.now());
          clearTimeout(timer);
          timer = undefined;
        }
        return;
      }
      if (timer !== undefined) return;
      deadline = performance.now() + remaining;
      timer = setTimeout(() => {
        timer = undefined;
        if (disposed || manualRef.current) return;
        setPhase(PLAYBACK_STEPS[step].phase);
        step = (step + 1) % PLAYBACK_STEPS.length;
        remaining = PLAYBACK_STEPS[step].delay;
        synchronize();
      }, remaining);
    }

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              visible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
              synchronize();
            },
            { threshold: [0, 0.15] },
          );
    if (stageRef.current) observer?.observe(stageRef.current);
    playbackRef.current = synchronize;
    document.addEventListener("visibilitychange", synchronize);
    motion.addEventListener("change", synchronize);
    synchronize();
    return () => {
      disposed = true;
      if (timer !== undefined) clearTimeout(timer);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
      motion.removeEventListener("change", synchronize);
      if (playbackRef.current === synchronize) playbackRef.current = null;
    };
  }, [autoPlay]);

  function stopPlayback() {
    manualRef.current = true;
    playbackRef.current?.();
  }

  function toggleExpanded() {
    stopPlayback();
    setShopMessage("");
    setPhase((value) => (value === "expanded" ? "compact" : "expanded"));
  }

  return (
    <section
      className={`redbull-card ${className}`}
      aria-label="Red Bull card animation demo"
    >
      <ComponentStyles css={REDBULL_STYLES} />
      <div
        ref={stageRef}
        className="rb-demo"
        onPointerEnter={() => {
          pointerWithin.current = true;
          playbackRef.current?.();
        }}
        onPointerLeave={() => {
          pointerWithin.current = false;
          playbackRef.current?.();
        }}
        onFocusCapture={() => {
          focusWithin.current = true;
          playbackRef.current?.();
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            focusWithin.current = false;
            playbackRef.current?.();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && expanded) {
            event.preventDefault();
            stopPlayback();
            setPhase("compact");
            setShopMessage("");
            toggleRef.current?.focus();
          }
        }}
      >
        <header className="rb-heading">
          <h2>RedBull Card Animation</h2>
          <p>Using HTML CSS</p>
        </header>
        <div className="rb-showcase-border">
          <div className="rb-preview-shell">
            <ProductScene
              phase={phase}
              title={title}
              description={description}
              interactive
              contentId={contentId}
              toggleRef={toggleRef}
              onToggle={toggleExpanded}
              onShopNow={() => {
                stopPlayback();
                if (onShopNow) onShopNow();
                else
                  setShopMessage(
                    "This is a preview card; no shop destination is linked yet.",
                  );
              }}
            />
          </div>
        </div>
        <p className="rb-status" role="status" aria-live="polite">
          {shopMessage}
        </p>
      </div>
    </section>
  );
}

/** Gallery frames share the illustration without timers, handlers, or nested buttons. */
export function RedBullCardThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  const phases: readonly CardPhase[] = ["compact", "card", "expanded", "card"];
  const phase = phases[Math.abs(Math.trunc(previewStep)) % phases.length];
  return (
    <div
      className={`redbull-card rb-thumbnail ${className}`}
      aria-hidden="true"
      inert
    >
      <ComponentStyles css={REDBULL_STYLES} />
      <div className="rb-demo">
        <div className="rb-heading">
          <h2>RedBull Card Animation</h2>
          <p>Using HTML CSS</p>
        </div>
        <div className="rb-showcase-border">
          <div className="rb-preview-shell">
            <ProductScene phase={phase} />
          </div>
        </div>
      </div>
    </div>
  );
}

const REDBULL_STYLES = `.redbull-card{container-type:inline-size;width:100%;min-width:0;color:#f7f8ff;font-family:Arial,Helvetica,sans-serif;isolation:isolate}.redbull-card *{box-sizing:border-box}.redbull-card button{font:inherit}.redbull-card button:focus-visible{outline:3px solid #a9c6ff;outline-offset:4px}.redbull-card .rb-demo{width:100%;padding:clamp(20px,5cqw,48px);background:#22212e}.redbull-card .rb-heading{margin:0 0 clamp(16px,3cqw,24px)}.redbull-card .rb-heading h2{margin:0 0 8px;color:#5894ff;font-size:clamp(27px,5.6cqw,42px);font-weight:700;letter-spacing:-.035em;line-height:1.1}.redbull-card .rb-heading p{margin:0;color:#f7f7fb;font-size:clamp(24px,4.8cqw,36px);font-weight:700;letter-spacing:-.025em;line-height:1.15}.redbull-card .rb-showcase-border{padding:clamp(12px,3cqw,22px);border:1px solid #d7d6df}.redbull-card .rb-preview-shell{padding:1px;border:1px solid #dad9e1}.redbull-card .rb-preview{position:relative;display:grid;place-items:center;container-type:inline-size;width:100%;aspect-ratio:16/9;overflow:hidden;background:#030406;isolation:isolate}.redbull-card .rb-night-sky{position:absolute;inset:0;overflow:hidden;pointer-events:none;background:radial-gradient(ellipse at 50% 53%,#10172d80,transparent 43%)}.redbull-card .rb-night-sky::before,.redbull-card .rb-night-sky::after{position:absolute;inset:-20%;content:"";border-radius:50%;filter:blur(30px);opacity:.38}.redbull-card .rb-night-sky::before{background:radial-gradient(ellipse at 35% 55%,#254cae52 0,transparent 37%)}.redbull-card .rb-night-sky::after{background:radial-gradient(ellipse at 70% 48%,#6b3aaf30 0,transparent 38%)}.redbull-card .rb-particle{position:absolute;display:block;border-radius:50%;background:#c6d0f2;box-shadow:0 0 8px 2px #658fff43;opacity:.34;animation:rb-twinkle 3.8s ease-in-out infinite alternate}.redbull-card .rb-product-panel{position:relative;z-index:1;width:22cqw;height:22cqw;max-width:90%;overflow:hidden;border:1px solid #ffffff0c;border-radius:50%;background:radial-gradient(circle at 50% 48%,#111319 0 49%,#080a10 70%);box-shadow:0 0 12px #506eff72,0 0 34px #3159da35,inset 0 0 0 1px #9daaff21;transition:width .65s cubic-bezier(.2,.8,.2,1),height .65s cubic-bezier(.2,.8,.2,1),border-radius .55s ease,box-shadow .55s ease,background .5s ease}.redbull-card .rb-product-panel[data-phase=card]{width:22cqw;height:22cqw;border-radius:17px;background:linear-gradient(145deg,#2e3e7c,#202e65 55%,#172552);box-shadow:0 0 21px #546ff34a,0 0 60px #3159da32,inset 0 1px #ffffff18}.redbull-card .rb-product-panel[data-phase=expanded]{width:56cqw;height:32cqw;max-width:88%;border-radius:12px;background:linear-gradient(125deg,#293a78 0%,#263875 58%,#1e2c66 100%);box-shadow:0 0 24px #586fff65,0 0 80px #3159da3d,inset 0 1px #ffffff1c}.redbull-card .rb-panel-shine{position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 5%,#ffffff0b 38%,transparent 73%);opacity:.75}.redbull-card .rb-logo-wrap{position:absolute;inset:0;display:grid;place-items:center;opacity:1;transform:scale(1);transition:opacity .3s ease,transform .55s cubic-bezier(.2,.8,.2,1)}.redbull-card .rb-mark{display:block;width:73%;height:auto;filter:drop-shadow(0 4px 10px #060a24a8)}.redbull-card .rb-product-panel[data-phase=expanded] .rb-logo-wrap{opacity:0;transform:scale(.55);pointer-events:none}.redbull-card .rb-copy{position:absolute;z-index:2;top:50%;left:8%;width:49%;max-width:230px;opacity:0;transform:translate(-12px,-48%);transition:opacity .38s ease,transform .65s cubic-bezier(.2,.8,.2,1);pointer-events:none}.redbull-card .rb-product-panel[data-phase=expanded] .rb-copy{opacity:1;transform:translate(0,-48%);transition-delay:.19s;pointer-events:auto}.redbull-card .rb-copy h3{margin:0 0 8px;color:#fff;font-size:clamp(12px,4.2cqw,20px);font-weight:800;letter-spacing:.015em;line-height:1.05}.redbull-card .rb-description{max-width:220px;margin:0;color:#d0d9f4;font-size:clamp(7px,1.95cqw,10px);line-height:1.45}.redbull-card .rb-shop-button{display:inline-flex;align-items:center;justify-content:center;min-height:clamp(22px,5cqw,30px);margin-top:9px;padding:0 clamp(8px,2.5cqw,13px);border:0;border-radius:4px;background:#e8502f;color:#fff;font-size:clamp(8px,1.65cqw,10px);font-weight:700;box-shadow:0 4px 12px #0c153c60;cursor:pointer;transition:transform .2s ease,background .2s ease,box-shadow .2s ease}.redbull-card .rb-shop-button:hover{transform:translateY(-2px);background:#ff7041;box-shadow:0 7px 16px #0c153c70}.redbull-card .rb-can-wrap{position:absolute;display:grid;place-items:center;z-index:1;top:50%;right:8%;width:35%;height:94%;opacity:0;transform:translate(20px,-45%) rotate(13deg) scale(.77);transform-origin:50% 50%;transition:opacity .4s ease,transform .8s cubic-bezier(.18,.8,.22,1)}.redbull-card .rb-product-panel[data-phase=expanded] .rb-can-wrap{opacity:1;transform:translate(0,-48%) rotate(13deg) scale(1);transition-delay:.18s}.redbull-card .rb-can{display:block;width:100%;height:100%;min-width:0;min-height:0;max-width:100%;object-fit:contain;overflow:visible;filter:drop-shadow(0 10px 12px #080d2580)}.redbull-card .rb-toggle{position:absolute;z-index:4;inset:0;display:grid;place-items:center;width:100%;height:100%;padding:0;border:0;border-radius:inherit;background:transparent;color:#fff;cursor:pointer;transform:none;transition:inset .35s,width .35s,height .35s,background .2s}.redbull-card .rb-toggle-label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}.redbull-card .rb-toggle-icon{display:grid;place-items:center;width:30px;height:30px;border:1px solid #ffffff36;border-radius:50%;background:#101a3b80;color:#fff;font-size:20px;line-height:1;opacity:0;transition:opacity .2s,transform .2s}.redbull-card .rb-product-panel:not([data-phase=expanded]) .rb-toggle:hover .rb-toggle-icon,.redbull-card .rb-product-panel:not([data-phase=expanded]) .rb-toggle:focus-visible .rb-toggle-icon{opacity:1;transform:scale(1.08)}.redbull-card .rb-product-panel[data-phase=expanded] .rb-toggle{top:2px;right:2px;bottom:auto;left:auto;width:44px;height:44px;border-radius:50%}.redbull-card .rb-product-panel[data-phase=expanded] .rb-toggle .rb-toggle-icon{opacity:1;transform:scale(1.08)}.redbull-card .rb-status{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
@keyframes rb-twinkle{0%{opacity:.18;transform:scale(.75)}100%{opacity:.72;transform:scale(1.2)}}
@container(max-width:500px){.redbull-card .rb-demo{padding:22px 16px}.redbull-card .rb-heading{margin-bottom:14px}.redbull-card .rb-showcase-border{padding:10px}.redbull-card .rb-product-panel[data-phase=expanded]{width:82cqw;height:48cqw;max-width:94%}.redbull-card .rb-copy{left:7%;width:51%}.redbull-card .rb-description{font-size:clamp(9px,2.7cqw,11px)}.redbull-card .rb-shop-button{margin-top:7px;min-height:32px;font-size:10px}.redbull-card .rb-can-wrap{right:5%;width:37%;height:94%}}
@media(prefers-reduced-motion:reduce){.redbull-card *,.redbull-card *::before,.redbull-card *::after{animation:none!important;scroll-behavior:auto!important;transition:none!important}.redbull-card .rb-particle{opacity:.35}.redbull-card .rb-product-panel{transition:none}}
.redbull-card.rb-thumbnail{height:100%;pointer-events:none}.redbull-card.rb-thumbnail .rb-demo{height:100%;padding:14px;display:flex;flex-direction:column}.redbull-card.rb-thumbnail .rb-heading{margin-bottom:10px}.redbull-card.rb-thumbnail .rb-heading h2{font-size:16px;margin-bottom:4px;letter-spacing:-.03em}.redbull-card.rb-thumbnail .rb-heading p{font-size:13px}.redbull-card.rb-thumbnail .rb-showcase-border{flex:1;min-height:0;padding:6px;display:flex}.redbull-card.rb-thumbnail .rb-preview-shell{width:100%;height:100%}.redbull-card.rb-thumbnail .rb-preview{height:100%;aspect-ratio:auto}.redbull-card.rb-thumbnail .rb-product-panel[data-phase=expanded]{width:68cqw;height:40cqw;max-width:94%}.redbull-card.rb-thumbnail .rb-copy{left:7%;width:50%}.redbull-card.rb-thumbnail .rb-copy h3{font-size:12px;margin-bottom:4px}.redbull-card.rb-thumbnail .rb-description{font-size:7px;line-height:1.3}.redbull-card.rb-thumbnail .rb-shop-button{min-height:16px;margin-top:5px;padding:0 6px;font-size:6px}.redbull-card.rb-thumbnail .rb-can-wrap{right:4%;width:38%}.redbull-card.rb-thumbnail *,.redbull-card.rb-thumbnail *::before,.redbull-card.rb-thumbnail *::after{animation:none!important}.redbull-card.rb-thumbnail .rb-copy,.redbull-card.rb-thumbnail .rb-can-wrap{transition-delay:0s}
`;
