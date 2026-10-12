"use client";

import { ComponentStyles } from "./component-styles";

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

/* Shared by the interactive cards and the gallery thumbnail; each adds its own sizing. */
const ROOT_CLASS = "kc-root @container flex flex-col overflow-hidden bg-[#ededee] font-[Arial,Helvetica,sans-serif] text-[#131318] **:box-border";
const STAGE_CLASS = "kc-stage flex flex-auto flex-wrap justify-center perspective-[1000px]";
const CARD_CLASS = "kc-card relative isolate max-w-[220px] flex-[0_0_28%] rounded-[2px] bg-[#80b568] text-white shadow-[0_14px_17px_#52695036] [--kc-pointer:0deg] data-[theme=panda]:bg-[#fbfbfc] data-[theme=panda]:text-[#17171b] data-[theme=panda]:shadow-[0_14px_17px_#0002] data-[theme=topo]:bg-[#202020] data-[theme=topo]:shadow-[0_14px_17px_#0003]";
const MODEL_CLASS = "kc-model absolute inset-[auto_8%_24%] -z-1 h-[118%] origin-[50%_72%] cursor-pointer border-none bg-transparent p-0 [filter:drop-shadow(3px_10px_5px_#0004)] [mask-image:linear-gradient(#000_0%,#000_55%,transparent_90%)] [transition:transform_.65s_cubic-bezier(.2,.7,.2,1)] focus-visible:rounded-lg focus-visible:[mask-image:none] motion-reduce:[transition:none] *:size-full *:overflow-visible";
const COPY_CLASS = "kc-copy pointer-events-none absolute inset-[auto_10%_12%]";
const FINISHES_CLASS = "kc-finishes absolute right-[7%] bottom-[4%] flex items-center";
const SWATCH_CLASS = "block cursor-pointer rounded-[2px] border border-[#0001] p-0 shadow-[0_1px_3px_#0002]";

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
    <article className={`${CARD_CLASS} h-[260px] @min-[1100px]:h-[clamp(260px,22cqw,340px)] @min-[1100px]:max-w-[clamp(220px,18.5cqw,290px)] [@container(max-width:600px)]:flex-[0_0_210px] [@container(max-width:600px)]:snap-center`} data-theme={keyboard.theme} onPointerMove={tilt} onPointerLeave={(event) => event.currentTarget.style.setProperty("--kc-pointer", "0deg")}>
      <button type="button" className={MODEL_CLASS} aria-label={`Explore ${keyboard.name}, ${finish.name}`} onClick={() => onSelect(finish)}><KeyboardArtwork theme={keyboard.theme} accent={finish.color} /></button>
      <div className={COPY_CLASS}>
        <h3 className="m-[0_0_8px] text-[15px] leading-[1.2] font-bold @min-[1100px]:text-[18px] [@container(max-width:600px)]:text-[16px]">{keyboard.name}</h3>
        <p className="m-0 max-w-[170px] text-[10px] leading-[1.4] @min-[1100px]:max-w-[210px] @min-[1100px]:text-[12px] [@container(max-width:600px)]:text-[11px]">{keyboard.description}</p>
      </div>
      <div className={`${FINISHES_CLASS} gap-2`} role="group" aria-label={`${keyboard.name} finish`}>
        {keyboard.finishes.map((option, index) => <button key={option.name} type="button" className={`${SWATCH_CLASS} relative size-[18px] before:absolute before:inset-[-5px_-3px] aria-pressed:outline-1 aria-pressed:outline-offset-2 aria-pressed:outline-current @min-[1100px]:size-[22px]`} style={{ background: option.color }} onClick={() => setFinishIndex(index)} aria-pressed={index === selectedIndex} aria-label={option.name} title={option.name} />)}
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
  return <section className={`${ROOT_CLASS} relative isolate w-full ${className}`} aria-label="Mechanical keyboard collection">
    <ComponentStyles css={STYLES} />
    <div className={`${STAGE_CLASS} min-h-[480px] items-center gap-[5%] p-[155px_7%_65px] [@container(max-width:600px)]:min-h-[440px] [@container(max-width:600px)]:flex-nowrap [@container(max-width:600px)]:justify-start [@container(max-width:600px)]:gap-[34px] [@container(max-width:600px)]:overflow-x-auto [@container(max-width:600px)]:p-[130px_28px_50px] [@container(max-width:600px)]:snap-x [@container(max-width:600px)]:[scrollbar-color:#aaa_transparent] [@container(max-width:600px)]:[scrollbar-width:thin]`}>{keyboards.map((keyboard) => <Product key={keyboard.id} keyboard={keyboard} onSelect={(finish) => { if (onSelect) onSelect(keyboard, finish); else setSelection({ keyboard, finish }); }} />)}{!keyboards.length && <p>No keyboards to display.</p>}</div>
    <dialog ref={dialog} className="kc-dialog m-auto max-h-[85dvh] w-[min(90vw,600px)] overflow-auto rounded-2xl border-none bg-[#f6f6f7] p-0 font-[Arial,Helvetica,sans-serif] text-[#222] shadow-[0_20px_90px_#0006] backdrop:bg-[#13131bcc] backdrop:backdrop-blur-[6px]" aria-labelledby={titleId} onCancel={() => setSelection(null)} onClose={() => setSelection(null)} onClick={(event) => { if (event.target === event.currentTarget) setSelection(null); }}>
      <div className="kc-detail relative grid grid-cols-[150px_1fr] items-center gap-[30px] p-[45px] [@media(max-width:500px)]:grid-cols-[1fr] [@media(max-width:500px)]:gap-3 [@media(max-width:500px)]:p-9"><button type="button" className="kc-close absolute top-[10px] right-3 size-[34px] cursor-pointer rounded-[50%] border-none bg-[#e8e8ed] text-[24px]" aria-label="Close keyboard details" onClick={() => setSelection(null)}>×</button>
        <div className="kc-detail-art *:max-h-[280px] *:w-full *:[filter:drop-shadow(0_15px_8px_#0003)] [@media(max-width:500px)]:*:h-[180px]">{selection && <KeyboardArtwork theme={selection.keyboard.theme} accent={selection.finish.color} />}</div>
        <div><span className="kc-eyebrow text-[9px] tracking-[.15em] text-[#85858c]">MECHANICAL / COLLECTION</span><h2 id={titleId} className="m-[12px_0] text-[32px] [@media(max-width:500px)]:text-[26px]">{selection?.keyboard.name ?? "Keyboard details"}</h2><p className="text-[13px] leading-[1.7]">{selection?.keyboard.description}</p><p className="kc-selected-finish text-[13px] leading-[1.7] font-bold">Finish · {selection?.finish.name}</p><small className="block text-[11px] leading-[1.6] text-[#777]">Illustrative keyboard concept. Choose your own product action with the onSelect callback.</small></div>
      </div>
    </dialog>
  </section>;
}

export function KeyboardCardsThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const frame = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) : 0;
  return <div className={`${ROOT_CLASS} kc-thumbnail h-full min-h-0 ${className}`} aria-hidden="true" inert><ComponentStyles css={STYLES} /><div className={`${STAGE_CLASS} h-full min-h-0 items-end gap-[6%] p-[19%_7%_10%]`}>{DEFAULT_KEYBOARDS.map((keyboard, index) => <div className={`${CARD_CLASS} h-[42cqw] max-h-[250px]`} data-theme={keyboard.theme} data-active={frame % 3 === index} key={keyboard.id}><div className={MODEL_CLASS}><KeyboardArtwork theme={keyboard.theme} accent={keyboard.finishes[frame % keyboard.finishes.length].color} /></div><div className={COPY_CLASS}><h3 className="m-[0_0_1cqw] text-[2.4cqw] leading-[1.2] font-bold">{keyboard.name}</h3><p className="m-0 max-w-[170px] text-[1.5cqw] leading-[1.4]">{keyboard.description}</p></div><div className={`${FINISHES_CLASS} gap-[.8cqw]`}>{keyboard.finishes.map((finish) => <i key={finish.name} className={`${SWATCH_CLASS} h-[1.5cqw] w-[2cqw]`} style={{ background: finish.color }} />)}</div></div>)}</div></div>;
}

/* Only what utilities cannot cleanly express: the keycap pose chain keyed on card state,
   and focus rings that must outrank a host page's unlayered :focus-visible outline. */
const STYLES = `
.kc-model{transform:perspective(650px) rotateX(16deg) rotateY(-12deg) rotateZ(-23deg)}
.kc-card[data-theme=leaf] .kc-model{transform:perspective(650px) rotateX(14deg) rotateY(10deg) rotateZ(-6deg)}
.kc-card:hover .kc-model,.kc-card:focus-within .kc-model,.kc-card[data-active=true] .kc-model{transform:perspective(650px) translateY(-13px) rotateX(8deg) rotateY(var(--kc-pointer)) rotateZ(-2deg)}
.kc-model:focus-visible{outline:2px solid #5888f7;outline-offset:5px}
.kc-finishes button:focus-visible{outline:2px solid #567bef;outline-offset:4px}
@media(prefers-reduced-motion:reduce){.kc-card:hover .kc-model,.kc-card:focus-within .kc-model{transform:perspective(650px) rotateX(8deg)}}
`;
