"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface RedBullCardProps {
  className?: string;
  title?: string;
  description?: string;
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
      <path d="M29 38c9-15 20-20 32-17 8 2 13 8 17 14 5-7 12-12 21-13 11-1 21 5 27 16-9-3-15-2-20 2 8 0 13 4 16 10-9-2-16-1-23 2-6 3-11 7-16 13l-9-7-8 7c-6-6-10-10-16-13-7-3-14-4-23-2 3-6 8-10 16-10-5-4-11-5-20-2Z" fill="#F8C838" />
      <path d="M39 37c8-8 16-9 24-6 5 2 9 5 14 11-5 0-10 1-15 4-6-6-13-9-23-9Zm67-1c-8-7-16-8-23-5-5 2-9 5-14 10 5 0 10 2 15 5 6-6 13-9 22-10Z" fill="#E6313D" />
      <path d="M19 39c4 11 14 17 27 15-9-5-14-10-17-19l-10 4Zm106-4c-3 10-9 16-22 19 9-6 14-11 17-21l5 2Z" fill="#E6313D" />
      <text x="72" y="72" textAnchor="middle" fill="#F04452" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="800" letterSpacing="-.8">Red Bull</text>
    </svg>
  );
}

function EnergyCan() {
  const id = useId().replaceAll(":", "");

  return (
    <svg className="rb-can" viewBox="0 0 190 340" role="img" aria-label="Illustration of a chilled blue and silver energy drink can">
      <defs>
        <linearGradient id={`${id}-can-body`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#dce6f8" />
          <stop offset=".18" stopColor="#fff" />
          <stop offset=".43" stopColor="#c7d2e8" />
          <stop offset=".7" stopColor="#f9fbff" />
          <stop offset="1" stopColor="#a7b4d0" />
        </linearGradient>
        <linearGradient id={`${id}-can-blue`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#293b82" />
          <stop offset=".55" stopColor="#121d50" />
          <stop offset="1" stopColor="#334e9a" />
        </linearGradient>
        <linearGradient id={`${id}-can-tab`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#8e9bb5" />
        </linearGradient>
        <filter id={`${id}-can-shadow`} x="-30%" y="-20%" width="170%" height="150%">
          <feDropShadow dx="7" dy="14" stdDeviation="10" floodColor="#050b21" floodOpacity=".55" />
        </filter>
      </defs>
      <g filter={`url(#${id}-can-shadow)`}>
        <path d="M56 28c0-9 7-16 16-16h47c9 0 16 7 16 16l10 22-9 240c-.6 14-12 25-26 25H78c-14 0-25-11-26-25L43 50l13-22Z" fill={`url(#${id}-can-body)`} />
        <path d="m56 49 75 1-8 218-65-1L56 49Z" fill={`url(#${id}-can-blue)`} />
        <path d="M57 51h18l8 215H65L57 51Z" fill="#f5f7fd" opacity=".88" />
        <path d="M118 51h12l-8 218h-12l8-218Z" fill="#e8edf8" opacity=".9" />
        <path d="M52 48c14-7 59-8 77 0l-2 9c-21-6-54-6-73 0l-2-9Zm1 220c21 7 52 8 68 1l-.4 13c-17 8-48 7-66-1l-1.6-13Z" fill="#c7d1e5" />
        <path d="M68 14c13-6 43-6 56 0l-4 9c-14-5-34-5-48 0l-4-9Z" fill="#d7dfed" stroke="#8794ad" strokeWidth="2" />
        <ellipse cx="96" cy="14" rx="28" ry="7" fill={`url(#${id}-can-tab)`} stroke="#7887a3" strokeWidth="2" />
        <ellipse cx="96" cy="13" rx="7" ry="2.7" fill="#66748e" />
        <path d="M96 8c5 0 9 2 9 4 0 2-3 3-6 3l4 5c-5 1-10-1-11-4l-2-6c0-1 2-2 6-2Z" fill="#aebad0" />
        <g transform="translate(60 112) scale(.5)"><RedBullMark compact /></g>
        <text x="96" y="194" textAnchor="middle" fill="#f24a55" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="800" fontStyle="italic" transform="rotate(-8 96 194)">Red Bull</text>
        <text x="96" y="214" textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" letterSpacing="2">ENERGY DRINK</text>
        <path d="M49 61c4 1 7 1 10 0m75 0c-3 1-6 1-9 0" stroke="#fff" strokeOpacity=".8" strokeWidth="2" />
        <path d="M61 265h70" stroke="#fff" strokeOpacity=".38" strokeWidth="2" />
        <text x="96" y="287" textAnchor="middle" fill="#e9eef9" fontFamily="Arial, sans-serif" fontSize="8" letterSpacing="1.3">250 ml ·  ENERGY</text>
      </g>
    </svg>
  );
}

const PARTICLES = [
  [9, 18, 2, 1.2], [18, 81, 3, 1.8], [28, 30, 2, 2.4], [38, 89, 2, 1.5],
  [49, 12, 3, 2.1], [61, 91, 2, 1.7], [72, 23, 2, 2.8], [83, 77, 3, 1.4],
  [92, 36, 2, 2.2], [14, 55, 2, 2.5], [77, 52, 2, 1.9], [54, 70, 3, 2.7],
] as const;

/** A glowing logo that opens into a small, animated energy drink product card. */
export default function RedBullCard({
  className = "",
  title = "REDBULL",
  description = "Red Bull gives you wings. A refreshing energy drink that revitalizes body and mind.",
  autoPlay = true,
  onShopNow,
}: RedBullCardProps) {
  const [phase, setPhase] = useState<"compact" | "card" | "expanded">("compact");
  const [shopMessage, setShopMessage] = useState("");
  const manualRef = useRef(false);
  const expanded = phase === "expanded";

  useEffect(() => {
    if (!autoPlay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setTimeout>;
    const cycle = () => {
      timer = setTimeout(() => {
        if (manualRef.current) return;
        setPhase("card");
        timer = setTimeout(() => {
          if (manualRef.current) return;
          setPhase("expanded");
          timer = setTimeout(() => {
            if (manualRef.current) return;
            setPhase("card");
            timer = setTimeout(() => {
              if (manualRef.current) return;
              setPhase("compact");
              timer = setTimeout(cycle, 1400);
            }, 450);
          }, 3400);
        }, 450);
      }, 1800);
    };
    cycle();

    return () => {
      clearTimeout(timer);
    };
  }, [autoPlay]);

  function toggleExpanded() {
    manualRef.current = true;
    setPhase((value) => value === "expanded" ? "compact" : "expanded");
  }

  return (
    <section className={`redbull-card ${className}`} aria-label="Red Bull card animation demo">
      <style>{REDBULL_STYLES}</style>
      <div className="rb-demo">
        <header className="rb-heading">
          <h1>RedBull Card Animation</h1>
          <p>Using HTML CSS</p>
        </header>
        <div className="rb-showcase-border">
          <div className="rb-preview-shell">
            <div className="rb-preview">
              <div className="rb-night-sky" aria-hidden="true">
                {PARTICLES.map(([x, y, size, delay], index) => (
                  <span
                    className="rb-particle"
                    key={index}
                    style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, animationDelay: `${delay}s` }}
                  />
                ))}
              </div>
              <article className="rb-product-panel" data-phase={phase}>
                <div className="rb-panel-shine" aria-hidden="true" />
                <div className="rb-logo-wrap" aria-hidden="true"><RedBullMark /></div>

                <div className="rb-copy" aria-hidden={!expanded}>
                  <h2>{title}</h2>
                  <p className="rb-description">{description}</p>
                  <button
                    className="rb-shop-button"
                    type="button"
                    onClick={() => {
                      if (onShopNow) onShopNow();
                      else setShopMessage("This is a preview card; no shop destination is linked yet.");
                    }}
                    tabIndex={expanded ? 0 : -1}
                  >
                    Shop Now
                  </button>
                </div>

                <div className="rb-can-wrap" aria-hidden={!expanded}><EnergyCan /></div>

                <button
                  className="rb-toggle"
                  type="button"
                  aria-expanded={expanded}
                  aria-label={expanded ? "Collapse product card" : "Expand product card"}
                  onClick={toggleExpanded}
                >
                  <span className="rb-toggle-label">{expanded ? "Close" : "Open"}</span>
                  <span className="rb-toggle-icon" aria-hidden="true">{expanded ? "×" : "+"}</span>
                </button>
              </article>
            </div>
          </div>
        </div>
        <p className="rb-status" role="status" aria-live="polite">{shopMessage}</p>
      </div>
    </section>
  );
}

const REDBULL_STYLES = `
.redbull-card{container-type:inline-size;width:100%;min-width:0;color:#f7f8ff;font-family:Arial,Helvetica,sans-serif;isolation:isolate}.redbull-card *{box-sizing:border-box}.redbull-card button{font:inherit}.redbull-card button:focus-visible{outline:3px solid #a9c6ff;outline-offset:4px}.rb-demo{width:100%;padding:clamp(20px,5cqw,48px);background:#22212e}.rb-heading{margin:0 0 clamp(16px,3cqw,24px)}.rb-heading h1{margin:0 0 8px;color:#5894ff;font-size:clamp(27px,5.6cqw,42px);font-weight:700;letter-spacing:-.035em;line-height:1.1}.rb-heading p{margin:0;color:#f7f7fb;font-size:clamp(24px,4.8cqw,36px);font-weight:700;letter-spacing:-.025em;line-height:1.15}.rb-showcase-border{padding:clamp(12px,3cqw,22px);border:1px solid #d7d6df}.rb-preview-shell{padding:1px;border:1px solid #dad9e1}.rb-preview{position:relative;display:grid;place-items:center;container-type:inline-size;width:100%;aspect-ratio:16/9;overflow:hidden;background:#030406;isolation:isolate}.rb-night-sky{position:absolute;inset:0;overflow:hidden;pointer-events:none;background:radial-gradient(ellipse at 50% 53%,#10172d80,transparent 43%)}.rb-night-sky::before,.rb-night-sky::after{position:absolute;inset:-20%;content:"";border-radius:50%;filter:blur(30px);opacity:.38}.rb-night-sky::before{background:radial-gradient(ellipse at 35% 55%,#254cae52 0,transparent 37%)}.rb-night-sky::after{background:radial-gradient(ellipse at 70% 48%,#6b3aaf30 0,transparent 38%)}.rb-particle{position:absolute;display:block;border-radius:50%;background:#c6d0f2;box-shadow:0 0 8px 2px #658fff43;opacity:.34;animation:rb-twinkle 3.8s ease-in-out infinite alternate}.rb-product-panel{position:relative;z-index:1;width:22cqw;height:22cqw;max-width:90%;overflow:hidden;border:1px solid #ffffff0c;border-radius:50%;background:radial-gradient(circle at 50% 48%,#111319 0 49%,#080a10 70%);box-shadow:0 0 12px #506eff72,0 0 34px #3159da35,inset 0 0 0 1px #9daaff21;transition:width .65s cubic-bezier(.2,.8,.2,1),height .65s cubic-bezier(.2,.8,.2,1),border-radius .55s ease,box-shadow .55s ease,background .5s ease}.rb-product-panel[data-phase=card]{width:22cqw;height:22cqw;border-radius:17px;background:linear-gradient(145deg,#2e3e7c,#202e65 55%,#172552);box-shadow:0 0 21px #546ff34a,0 0 60px #3159da32,inset 0 1px #ffffff18}.rb-product-panel[data-phase=expanded]{width:56cqw;height:32cqw;max-width:88%;border-radius:12px;background:linear-gradient(125deg,#293a78 0%,#263875 58%,#1e2c66 100%);box-shadow:0 0 24px #586fff65,0 0 80px #3159da3d,inset 0 1px #ffffff1c}.rb-panel-shine{position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 5%,#ffffff0b 38%,transparent 73%);opacity:.75}.rb-logo-wrap{position:absolute;inset:0;display:grid;place-items:center;opacity:1;transform:scale(1);transition:opacity .3s ease,transform .55s cubic-bezier(.2,.8,.2,1)}.rb-mark{display:block;width:73%;height:auto;filter:drop-shadow(0 4px 10px #060a24a8)}.rb-product-panel[data-phase=expanded] .rb-logo-wrap{opacity:0;transform:scale(.55);pointer-events:none}.rb-copy{position:absolute;z-index:2;top:50%;left:8%;width:49%;max-width:230px;opacity:0;transform:translate(-12px,-48%);transition:opacity .38s ease,transform .65s cubic-bezier(.2,.8,.2,1);pointer-events:none}.rb-product-panel[data-phase=expanded] .rb-copy{opacity:1;transform:translate(0,-48%);transition-delay:.19s;pointer-events:auto}.rb-copy h2{margin:0 0 8px;color:#fff;font-size:clamp(12px,4.2cqw,20px);font-weight:800;letter-spacing:.015em;line-height:1.05}.rb-description{max-width:220px;margin:0;color:#d0d9f4;font-size:clamp(7px,1.95cqw,10px);line-height:1.45}.rb-shop-button{display:inline-flex;align-items:center;justify-content:center;min-height:clamp(22px,5cqw,30px);margin-top:9px;padding:0 clamp(8px,2.5cqw,13px);border:0;border-radius:4px;background:#e8502f;color:#fff;font-size:clamp(8px,1.65cqw,10px);font-weight:700;box-shadow:0 4px 12px #0c153c60;cursor:pointer;transition:transform .2s ease,background .2s ease,box-shadow .2s ease}.rb-shop-button:hover{transform:translateY(-2px);background:#ff7041;box-shadow:0 7px 16px #0c153c70}.rb-can-wrap{position:absolute;z-index:1;top:50%;right:8%;width:35%;height:145%;opacity:0;transform:translate(20px,-45%) rotate(13deg) scale(.77);transform-origin:50% 50%;transition:opacity .4s ease,transform .8s cubic-bezier(.18,.8,.22,1)}.rb-product-panel[data-phase=expanded] .rb-can-wrap{opacity:1;transform:translate(0,-48%) rotate(13deg) scale(1);transition-delay:.18s}.rb-can{display:block;width:auto;height:100%;max-width:100%;overflow:visible;filter:drop-shadow(0 10px 12px #080d2580)}.rb-toggle{position:absolute;z-index:4;inset:0;display:grid;place-items:center;width:100%;height:100%;padding:0;border:0;border-radius:inherit;background:transparent;color:#fff;cursor:pointer;transform:none;transition:inset .35s,width .35s,height .35s,background .2s}.rb-toggle-label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}.rb-toggle-icon{display:grid;place-items:center;width:30px;height:30px;border:1px solid #ffffff36;border-radius:50%;background:#101a3b80;color:#fff;font-size:20px;line-height:1;opacity:0;transition:opacity .2s,transform .2s}.rb-product-panel:not([data-phase=expanded]) .rb-toggle:hover .rb-toggle-icon,.rb-product-panel:not([data-phase=expanded]) .rb-toggle:focus-visible .rb-toggle-icon{opacity:1;transform:scale(1.08)}.rb-product-panel[data-phase=expanded] .rb-toggle{top:8px;right:8px;bottom:auto;left:auto;width:28px;height:28px;border-radius:50%}.rb-product-panel[data-phase=expanded] .rb-toggle:hover .rb-toggle-icon,.rb-product-panel[data-phase=expanded] .rb-toggle:focus-visible .rb-toggle-icon{opacity:1;transform:scale(1.08)}.rb-status{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
@keyframes rb-twinkle{0%{opacity:.18;transform:scale(.75)}100%{opacity:.72;transform:scale(1.2)}}
@container(max-width:500px){.rb-demo{padding:22px 16px}.rb-heading{margin-bottom:14px}.rb-showcase-border{padding:10px}.rb-product-panel[data-phase=expanded]{width:66cqw;height:38cqw;max-width:94%}.rb-copy{left:7%;width:51%}.rb-description{font-size:clamp(7px,2.3cqw,10px)}.rb-shop-button{margin-top:7px}.rb-can-wrap{right:5%;width:37%;height:145%}}
@media(prefers-reduced-motion:reduce){.redbull-card *,.redbull-card *::before,.redbull-card *::after{animation:none!important;scroll-behavior:auto!important;transition:none!important}.rb-particle{opacity:.35}.rb-product-panel{transition:none}}
`;
