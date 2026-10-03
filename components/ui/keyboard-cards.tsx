"use client";

import { useEffect, useId, useRef, useState, type PointerEvent } from "react";

export type KeyboardFinish = { name: string; color: string };
export type KeyboardCard = {
  id: string;
  name: string;
  description: string;
  theme: "leaf" | "topo" | "panda";
  finishes: readonly KeyboardFinish[];
};
export type KeyboardCardsProps = {
  keyboards?: readonly KeyboardCard[];
  onSelect?: (keyboard: KeyboardCard, finish: KeyboardFinish) => void;
  className?: string;
};

const DEFAULT_KEYBOARDS: readonly KeyboardCard[] = [
  { id: "leaf", name: "LeafKey", description: "A keyboard that brings the tranquility of the forest to your fingertips.", theme: "leaf", finishes: [{ name: "Golden fern", color: "#e8c665" }, { name: "Spring leaf", color: "#b2e269" }, { name: "Fresh mint", color: "#4ed6b2" }] },
  { id: "topo", name: "TopoKey", description: "Custom illuminated keyboard with neon topology mapped out in every key.", theme: "topo", finishes: [{ name: "Electric blue", color: "#08a8fa" }, { name: "Ultraviolet", color: "#e23cf8" }, { name: "Neon green", color: "#15e750" }] },
  { id: "panda", name: "PandaKey", description: "Panda, panda, panda, panda, panda, panda… panda.", theme: "panda", finishes: [{ name: "Midnight panda", color: "#16161b" }, { name: "Snow panda", color: "#f3f2f5" }] },
];
const LEGENDS = ["esc", "1", "2", "3", "4", "⌫", "tab", "Q", "W", "E", "R", "T", "ctrl", "A", "S", "D", "F", "G", "⇧", "Z", "X", "C", "V", "B", "fn", "Y", "U", "I", "O", "P", "alt", "H", "J", "K", "L", "↵", "cmd", "N", "M", ",", ".", "/", "◁", "7", "8", "9", "↑", "▷", "✦", "4", "5", "6", "↓", "⌘"];

/** Vector keycaps with individual bevels, printed legends, and decorative finishes. */
function KeyboardArtwork({ theme, accent }: { theme: KeyboardCard["theme"]; accent: string }) {
  const white = theme === "panda" && accent === "#f3f2f5";
  const shell = theme === "leaf" ? "#8fb896" : white ? "#d8d8dc" : "#111116";
  const cap = theme === "leaf" ? "#a4c2a3" : white ? "#f8f8f9" : "#15161c";
  const legend = theme === "leaf" ? "#edf4d8" : white ? "#14141a" : theme === "topo" ? accent : "#fafafa";
  return (
    <svg viewBox="0 0 186 305" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="180" height="294" rx="8" fill="#000" opacity=".2" />
      <rect x="1" y="1" width="182" height="294" rx="7" fill={shell} stroke={white ? "#bbbcc3" : "#ffffff30"} strokeWidth="2" />
      <path d="M7 288h170M177 8v276" stroke="#000" strokeOpacity=".35" strokeWidth="4" />
      {LEGENDS.map((key, index) => {
        const column = index % 6, row = Math.floor(index / 6), x = 8 + column * 28, y = 9 + row * 29;
        const decorated = theme === "topo" || (theme === "leaf" && (row < 2 || column === 0));
        return <g key={index} transform={`translate(${x} ${y})`}>
          <rect width="25" height="26" rx="3" fill={theme === "leaf" ? "#6c926e" : white ? "#b7b8bd" : "#030307"} />
          <rect x="1" y="1" width="23" height="21" rx="3" fill={cap} stroke={theme === "leaf" ? "#cbe0b080" : "#ffffff15"} strokeWidth=".6" />
          <path d="M4 3h16" stroke="#fff" strokeOpacity=".13" />
          {decorated && <g stroke={accent} strokeWidth={theme === "leaf" ? 1.8 : .85} opacity={row < 2 ? .95 : .5}>
            {theme === "leaf" ? <><path d="M6 20 17 3M8 17 4 12M11 12 6 6M14 8 12 3M8 17l9-2M12 12l9-3M15 6l6-2" /><path d="m5 20 2-9m9-2 4-7" opacity=".5" /></> : <><path d="M2 5c5-4 7 8 11 6s1-9 9-7M2 10c4-4 5 9 10 6s2-11 10-7M2 16c5-2 6 7 12 3s1-8 8-5" /><path d="M4 2c1 9 7 2 8 0M17 22c-3-3 2-6 5-4" /></>}
          </g>}
          {theme === "panda" && index < 6 ? <g fill={legend} opacity=".8"><circle cx="8" cy="8" r="2" /><circle cx="17" cy="8" r="2" /><ellipse cx="12.5" cy="13" rx="6" ry="5.5" /><circle cx="10" cy="12.5" r="1.6" fill={cap} /><circle cx="15" cy="12.5" r="1.6" fill={cap} /><path d="m11 15 1.5 1 1.5-1" stroke={cap} /></g> : <text x="12.5" y="15" textAnchor="middle" fontSize={key.length > 1 ? 5.6 : 7.5} fill={legend} fontFamily="Arial, sans-serif">{key}</text>}
        </g>;
      })}
      <rect x="8" y="273" width="166" height="14" rx="3" fill={theme === "panda" ? (white ? "#18181d" : "#f0f0f1") : cap} stroke="#ffffff22" />
      <path d="M60 280h60" stroke={theme === "topo" ? accent : theme === "panda" ? (white ? "#fff" : "#222") : "#d4e7c5"} strokeWidth="1.2" />
      <circle cx="167" cy="280" r="1.4" fill={accent} />
    </svg>
  );
}

function Product({ keyboard, onSelect }: { keyboard: KeyboardCard; onSelect: (finish: KeyboardFinish) => void }) {
  const [finishIndex, setFinishIndex] = useState(0);
  const selectedIndex = Math.max(0, Math.min(finishIndex, keyboard.finishes.length - 1));
  const finish = keyboard.finishes[selectedIndex] ?? keyboard.finishes[0] ?? { name: "Original", color: "#08a8fa" };
  function tilt(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--kc-pointer", `${((event.clientX - box.left) / box.width - .5) * 10}deg`);
  }
  return (
    <article className="kc-card" data-theme={keyboard.theme} onPointerMove={tilt} onPointerLeave={(event) => event.currentTarget.style.setProperty("--kc-pointer", "0deg")}>
      <button type="button" className="kc-model" aria-label={`Explore ${keyboard.name}, ${finish.name}`} onClick={() => onSelect(finish)}><KeyboardArtwork theme={keyboard.theme} accent={finish.color} /></button>
      <div className="kc-copy"><h3>{keyboard.name}</h3><p>{keyboard.description}</p></div>
      <div className="kc-finishes" role="group" aria-label={`${keyboard.name} finish`}>
        {keyboard.finishes.map((option, index) => <button key={option.name} type="button" style={{ background: option.color }} onClick={() => setFinishIndex(index)} aria-pressed={index === selectedIndex} aria-label={option.name} title={option.name} />)}
      </div>
    </article>
  );
}

/** Three independently configurable, keyboard-accessible product cards. */
export default function KeyboardCards({ keyboards = DEFAULT_KEYBOARDS, onSelect, className = "" }: KeyboardCardsProps) {
  const [selection, setSelection] = useState<{ keyboard: KeyboardCard; finish: KeyboardFinish } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (selection && !dialog.current?.open) dialog.current?.showModal();
    if (!selection && dialog.current?.open) dialog.current.close();
  }, [selection]);
  return <section className={`kc-root relative isolate w-full ${className}`} aria-label="Mechanical keyboard collection">
    <style>{STYLES}</style>
    <div className="kc-stage">{keyboards.map((keyboard) => <Product key={keyboard.id} keyboard={keyboard} onSelect={(finish) => { if (onSelect) onSelect(keyboard, finish); else setSelection({ keyboard, finish }); }} />)}{!keyboards.length && <p>No keyboards to display.</p>}</div>
    <dialog ref={dialog} className="kc-dialog" aria-labelledby={titleId} onCancel={() => setSelection(null)} onClose={() => setSelection(null)} onClick={(event) => { if (event.target === event.currentTarget) setSelection(null); }}>
      <div className="kc-detail"><button type="button" className="kc-close" aria-label="Close keyboard details" onClick={() => setSelection(null)}>×</button>
        <div className="kc-detail-art">{selection && <KeyboardArtwork theme={selection.keyboard.theme} accent={selection.finish.color} />}</div>
        <div><span className="kc-eyebrow">MECHANICAL / COLLECTION</span><h2 id={titleId}>{selection?.keyboard.name ?? "Keyboard details"}</h2><p>{selection?.keyboard.description}</p><p className="kc-selected-finish">Finish · {selection?.finish.name}</p><small>Illustrative keyboard concept. Choose your own product action with the onSelect callback.</small></div>
      </div>
    </dialog>
  </section>;
}

export function KeyboardCardsThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const frame = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) : 0;
  return <div className={`kc-root kc-thumbnail ${className}`} aria-hidden="true" inert><style>{STYLES}</style><div className="kc-stage">{DEFAULT_KEYBOARDS.map((keyboard, index) => <div className="kc-card" data-theme={keyboard.theme} data-active={frame % 3 === index} key={keyboard.id}><div className="kc-model"><KeyboardArtwork theme={keyboard.theme} accent={keyboard.finishes[frame % keyboard.finishes.length].color} /></div><div className="kc-copy"><h3>{keyboard.name}</h3><p>{keyboard.description}</p></div><div className="kc-finishes">{keyboard.finishes.map((finish) => <i key={finish.name} style={{ background: finish.color }} />)}</div></div>)}</div></div>;
}

const STYLES = `
.kc-root{container-type:inline-size;background:#ededee;color:#131318;font-family:Arial,Helvetica,sans-serif;overflow:hidden}
.kc-root *{box-sizing:border-box}
.kc-stage{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:center;gap:5%;padding:120px 7% 65px;min-height:480px;perspective:1000px}
.kc-card{position:relative;flex:0 0 28%;height:260px;max-width:220px;background:#80b568;box-shadow:0 14px 17px #52695036;border-radius:2px;color:#fff;isolation:isolate;--kc-pointer:0deg}
.kc-card[data-theme=topo]{background:#202020;box-shadow:0 14px 17px #0003}
.kc-card[data-theme=panda]{background:#fbfbfc;color:#17171b;box-shadow:0 14px 17px #0002}
.kc-model{position:absolute;inset:auto 8% 24%;height:118%;padding:0;border:0;background:transparent;cursor:pointer;transform-origin:50% 72%;transform:perspective(650px) rotateX(16deg) rotateY(-12deg) rotateZ(-23deg);transition:transform .65s cubic-bezier(.2,.7,.2,1);filter:drop-shadow(3px 10px 5px #0004);z-index:-1;mask-image:linear-gradient(#000 0%,#000 55%,transparent 90%)}
.kc-model svg{width:100%;height:100%;overflow:visible}
.kc-card[data-theme=leaf] .kc-model{transform:perspective(650px) rotateX(14deg) rotateY(10deg) rotateZ(-6deg)}
.kc-card:hover .kc-model,.kc-card:focus-within .kc-model,.kc-card[data-active=true] .kc-model{transform:perspective(650px) translateY(-13px) rotateX(8deg) rotateY(var(--kc-pointer)) rotateZ(-2deg)}
.kc-model:focus-visible{outline:2px solid #5888f7;outline-offset:5px;mask-image:none;border-radius:8px}
.kc-copy{position:absolute;inset:auto 10% 12%;pointer-events:none}
.kc-copy h3{font-size:15px;line-height:1.2;font-weight:700;margin:0 0 8px}
.kc-copy p{font-size:10px;line-height:1.4;margin:0;max-width:170px}
.kc-finishes{position:absolute;right:7%;bottom:4%;display:flex;gap:8px;align-items:center}
.kc-finishes button,.kc-finishes i{display:block;width:18px;height:18px;border:1px solid #0001;border-radius:2px;padding:0;cursor:pointer;box-shadow:0 1px 3px #0002}
.kc-finishes button{position:relative}
.kc-finishes button::before{content:"";position:absolute;inset:-5px -3px}
.kc-finishes button[aria-pressed=true]{outline:1px solid currentColor;outline-offset:2px}
.kc-finishes button:focus-visible{outline:2px solid #567bef;outline-offset:4px}
.kc-dialog{padding:0;border:0;border-radius:16px;width:min(90vw,600px);max-height:85dvh;overflow:auto;background:#f6f6f7;color:#222;font-family:Arial,Helvetica,sans-serif;box-shadow:0 20px 90px #0006;margin:auto}
.kc-dialog::backdrop{background:#13131bcc;backdrop-filter:blur(6px)}
.kc-detail{display:grid;grid-template-columns:150px 1fr;gap:30px;padding:45px;position:relative;align-items:center}
.kc-detail-art svg{width:100%;max-height:280px;filter:drop-shadow(0 15px 8px #0003)}
.kc-close{position:absolute;right:12px;top:10px;width:34px;height:34px;border:0;background:#e8e8ed;border-radius:50%;font-size:24px;cursor:pointer}
.kc-eyebrow{font-size:9px;letter-spacing:.15em;color:#85858c}
.kc-detail h2{font-size:32px;margin:12px 0}
.kc-detail p{font-size:13px;line-height:1.7}
.kc-selected-finish{font-weight:700}
.kc-detail small{font-size:11px;line-height:1.6;color:#777;display:block}
.kc-thumbnail{height:100%;min-height:0}
.kc-thumbnail .kc-stage{height:100%;min-height:0;padding:19% 7% 10%;gap:6%}
.kc-thumbnail .kc-card{height:42cqw;max-height:250px;flex-basis:28%}
.kc-thumbnail .kc-copy h3{font-size:2.4cqw;margin-bottom:1cqw}
.kc-thumbnail .kc-copy p{font-size:1.5cqw}
.kc-thumbnail .kc-finishes{gap:.8cqw}
.kc-thumbnail .kc-finishes i{width:2cqw;height:1.5cqw}
@container(max-width:600px){.kc-root:not(.kc-thumbnail) .kc-stage{padding:115px 28px 50px;gap:34px;min-height:440px;flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:thin;scrollbar-color:#aaa transparent}.kc-root:not(.kc-thumbnail) .kc-card{flex:0 0 210px;height:260px;scroll-snap-align:center}.kc-root:not(.kc-thumbnail) .kc-copy h3{font-size:16px}.kc-root:not(.kc-thumbnail) .kc-copy p{font-size:11px}.kc-root:not(.kc-thumbnail) .kc-finishes button{width:18px;height:18px}}
@media(max-width:500px){.kc-detail{grid-template-columns:1fr;padding:36px;gap:12px}.kc-detail-art svg{height:180px}.kc-detail h2{font-size:26px}}
@media(prefers-reduced-motion:reduce){.kc-root .kc-model{transition:none!important}.kc-card:hover .kc-model,.kc-card:focus-within .kc-model{transform:perspective(650px) rotateX(8deg)}}
`;
