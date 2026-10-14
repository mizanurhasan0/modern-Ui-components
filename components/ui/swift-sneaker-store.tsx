"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ComponentStyles } from "./component-styles";

/* eslint-disable @next/next/no-img-element -- Reference cutouts are portable product assets. */

export interface SwiftSneakerProduct {
  id: string;
  name: string;
  color: string;
  background: string;
  image: string;
  detailImage?: string;
  imageFilter?: string;
  /** Percentages for a catalog image whose crop differs from the default cutout. */
  imageTop?: number;
  imageLeft?: number;
  imageHeight?: number;
  price: number;
  description: string;
}

export interface SwiftSneakerStoreProps {
  /** Use native video cutouts when exact original pixels are preferred. */
  artwork?: "enhanced" | "reference";
  products?: readonly SwiftSneakerProduct[];
  initialIndex?: number;
  sizes?: readonly string[];
  onAddToCart?: (product: SwiftSneakerProduct, size: string) => void | Promise<void>;
  className?: string;
}

/** Original product cutouts from the supplied 240 × 240 storefront recording. */
const REFERENCE_PRODUCTS: readonly SwiftSneakerProduct[] = [
  { id: "swift-grey", name: "Swift Grey", color: "WHT", background: "#78786e", image: "/swift-sneaker-store/white-angle.webp", detailImage: "/swift-sneaker-store/red-side.webp", imageFilter: "grayscale(1)", imageTop: 22, imageLeft: 28, imageHeight: 48, price: 49, description: "A light, everyday runner with a soft knit upper and a clean white sole." },
  { id: "swift-red", name: "Swift Red", color: "WHT", background: "#a51e10", image: "/swift-sneaker-store/red-angle.webp", detailImage: "/swift-sneaker-store/red-side.webp", price: 49, description: "The perfect balance of comfort and character. A breathable knit upper, supportive fit, and lightweight cushioning, made to move with you." },
  { id: "swift-sand", name: "Swift Sand", color: "WHT", background: "#d9b78e", image: "/swift-sneaker-store/sand-angle.webp", price: 49, description: "Warm sand, soft textures, and an effortless fit. Your new everyday essential." },
  { id: "swift-navy", name: "Swift Navy", color: "ART", background: "#263b73", image: "/swift-sneaker-store/navy-angle.webp", price: 59, description: "A sculpted navy runner with a textured upper and bold contrast cushioning." },
];
/** Reference-guided high-resolution artwork; original crops remain available. */
const HD_ARTWORK: Record<string, Pick<SwiftSneakerProduct, "image" | "detailImage">> = {
  "swift-grey": { image: "/swift-sneaker-store/white-angle-hd.webp", detailImage: "/swift-sneaker-store/red-side-hd.webp" },
  "swift-red": { image: "/swift-sneaker-store/red-angle-hd.webp", detailImage: "/swift-sneaker-store/red-side-hd.webp" },
  "swift-sand": { image: "/swift-sneaker-store/sand-angle-hd.webp" },
  "swift-navy": { image: "/swift-sneaker-store/navy-angle-hd.webp" },
};
const DEFAULT_PRODUCTS = REFERENCE_PRODUCTS.map((product) => ({ ...product, ...HD_ARTWORK[product.id] }));
const DEFAULT_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44"];
type StoreView = "gallery" | "product" | "details";

const CSS = `
.sss-root{container-type:inline-size;position:relative;display:grid;place-items:center;width:100%;background:linear-gradient(140deg,#eac79c 0%,#d3b187 48%,#b49a77 100%);font-family:Arial,Helvetica,sans-serif;color:#fff;isolation:isolate}
.sss-interactive{width:min(100%,900px);margin-inline:auto}
.sss-live{display:grid;place-items:center;width:100%;aspect-ratio:1}
.sss-frame{position:relative;width:91%;aspect-ratio:1.61;overflow:hidden;background:#faf8ef;box-shadow:0 2.5cqw 5cqw -1cqw #49321b66,0 .3cqw 1cqw #49321b40;container-type:inline-size}
.sss-panels{position:absolute;inset:0;display:flex;overflow:hidden}
.sss-panel{position:relative;flex:1;min-width:0;border:0;padding:0;text-align:left;color:#fff;cursor:pointer;background:var(--sss-color);transition:flex .7s cubic-bezier(.22,.8,.25,1),opacity .35s;outline-offset:-4px}
.sss-panel-content{position:absolute;inset:0;display:block;overflow:hidden}
.sss-panel[data-hovered=true]{flex:2.35;z-index:2}
.sss-panel::before,.sss-panel::after{content:'';position:absolute;top:var(--sss-edge-y,50%);width:2.6cqw;height:65%;border-radius:50%;background:var(--sss-color);transform:translateY(-50%) scaleX(0);transition:transform .45s cubic-bezier(.22,.8,.25,1);pointer-events:none}
.sss-panel::before{left:-1.3cqw}.sss-panel::after{right:-1.3cqw}
.sss-panel[data-hovered=true]::before,.sss-panel[data-hovered=true]::after{transform:translateY(-50%) scaleX(1)}
.sss-panels[data-opening=true] .sss-panel::before,.sss-panels[data-opening=true] .sss-panel::after{display:none}
.sss-panels[data-opening=true] .sss-panel{flex:0;opacity:0;pointer-events:none}
.sss-panels[data-opening=true] .sss-panel[data-opening=true]{flex:1;opacity:1}
.sss-opening-shoe{position:absolute;left:7%;top:28%;width:40%;height:auto;z-index:3;pointer-events:none;animation:sss-opening-shoe .45s .45s both}
.sss-panel:focus-visible{outline:2px solid #fff}
.sss-panel-top{position:absolute;top:6%;left:10%;right:10%;display:flex;justify-content:space-between;font-size:clamp(5px,.9cqw,10px);opacity:.64;white-space:nowrap;letter-spacing:.12em}
.sss-panel-image{position:absolute;left:var(--sss-image-left,10%);top:var(--sss-image-top,17%);height:var(--sss-image-height,66%);width:auto;max-width:none;object-fit:contain;transition:transform .7s cubic-bezier(.22,.8,.25,1);transform:translateY(0);pointer-events:none}
.sss-panel[data-hovered=true] .sss-panel-image{transform:translateY(-2%)}
.sss-panels[data-opening=true] .sss-panel[data-opening=true] .sss-panel-image{transform:translate(12%,5%) rotate(-40deg);height:62%;opacity:0;transition:transform .7s cubic-bezier(.22,.8,.25,1),opacity .4s .45s}
.sss-panel-caption{position:absolute;bottom:8%;left:14%;right:14%;display:flex;align-items:center;justify-content:space-between;gap:8px;opacity:0;transform:translateY(10px);transition:opacity .3s,transform .4s;font-size:clamp(8px,2.5cqw,24px);line-height:1.06}
.sss-panel[data-hovered=true] .sss-panel-caption,.sss-panel:focus-visible .sss-panel-caption{opacity:1;transform:none}
.sss-panel-arrow{display:grid;place-items:center;flex-shrink:0;border-radius:50%;width:3.8cqw;height:3.8cqw;background:#f8e5bc;color:#4a3428;font-size:2cqw}
.sss-product{position:absolute;inset:0;background:#faf8ef;color:#36362f;animation:sss-content-in .7s ease both}
.sss-product-color{position:absolute;inset:0 0 50%;background:var(--sss-color);animation:sss-color-fold .9s .65s cubic-bezier(.22,.8,.25,1) both}
.sss-header{position:absolute;inset:5% 5% auto;display:flex;align-items:center;justify-content:space-between;z-index:3;font-size:clamp(6px,.85cqw,11px);letter-spacing:.08em}
.sss-header button{border:0;background:none;padding:3px;color:inherit;font:inherit;cursor:pointer}
.sss-brand{font-weight:800;font-style:italic;letter-spacing:-.08em;font-size:1.5cqw}
.sss-header-links{display:flex;gap:2cqw;align-items:center}
.sss-product[data-view=product] .sss-header{color:#fff}
.sss-hero-image{position:absolute;left:7%;top:28%;width:40%;height:auto;object-fit:contain;filter:var(--sss-filter,none);z-index:2}
.sss-hero-image[data-angle=true]{top:20%;width:34%;transform:rotate(-40deg)}
.sss-product-title{position:absolute;top:21%;left:59%;color:#fff;margin:0;font-size:5.2cqw;line-height:1.05;font-weight:600;letter-spacing:-.03em;animation:sss-content-in .5s .2s both}
.sss-product-title small{display:block;margin-top:1.2cqw;font-size:clamp(6px,.8cqw,12px);letter-spacing:.13em;font-weight:400;opacity:.6}
.sss-buy{position:absolute;left:59%;right:6%;top:59%;display:flex;flex-direction:column;gap:1.5cqw;animation:sss-content-in .5s 1.05s both}
.sss-price{margin:0;font-size:3cqw;line-height:1;letter-spacing:.08em}
.sss-price small{font-size:.5em}
.sss-buy-row{display:flex;align-items:stretch;gap:1cqw}
.sss-size{min-width:0;width:38%;border:1px solid #d4cfc1;background:transparent;padding:.7cqw;color:inherit;font-size:clamp(8px,1cqw,14px);border-radius:0}
.sss-add{flex:1;border:0;background:var(--sss-color);color:white;cursor:pointer;padding:.9cqw .6cqw;font-size:clamp(7px,1cqw,14px);white-space:nowrap;letter-spacing:.04em}
.sss-add:disabled{opacity:.6;cursor:wait}
.sss-status{min-height:1.5em;font-size:clamp(8px,1cqw,13px);line-height:1.25;letter-spacing:0}
.sss-color-options{position:absolute;left:8%;bottom:17%;display:flex;gap:1.6cqw;align-items:center;z-index:2}
.sss-color-option{width:3.5cqw;height:2.8cqw;min-width:16px;min-height:14px;display:grid;place-items:center;border:1px solid transparent;background:transparent;padding:.3cqw;cursor:pointer}
.sss-color-option img{width:100%;height:100%;object-fit:contain;filter:var(--sss-filter,none)}
.sss-color-option[aria-pressed=true]{border-color:#aeb0a1}
.sss-specs-button{position:absolute;right:6%;bottom:0;border:0;background:#f5e5c2;padding:1.2cqw 2cqw;color:#403c30;font-size:clamp(8px,1cqw,13px);cursor:pointer;min-width:35%;text-align:left}
.sss-specs{position:absolute;right:0;top:15%;bottom:0;width:40%;background:#f6e5c0;padding:3cqw 3cqw 2cqw;overflow:auto;animation:sss-specs-in .65s cubic-bezier(.22,.8,.25,1) both}
.sss-specs h3{margin:0 0 1.2cqw;font-size:clamp(10px,1.6cqw,19px)}
.sss-specs p{margin:0 0 2cqw;font-size:clamp(8px,1.05cqw,14px);line-height:1.7}
.sss-specs dl{display:grid;grid-template-columns:1fr 1fr;gap:1.3cqw;font-size:clamp(8px,1cqw,13px);line-height:1.55;margin:0}
.sss-specs dt{font-weight:600}.sss-specs dd{margin:0}
.sss-product[data-view=details] .sss-hero-image{top:28%;animation:none}
.sss-info-popover{position:absolute;top:13%;right:5%;z-index:5;width:42%;padding:2cqw;background:#faf8ef;color:#36362f;border:1px solid #ded9ca;box-shadow:0 1cqw 3cqw #0002;font-size:clamp(9px,1.2cqw,16px);line-height:1.7}
.sss-info-popover p{margin:0}.sss-info-popover a{color:inherit}
.sss-empty{padding:40px;color:#493a2a;text-align:center}
@keyframes sss-color-fold{from{bottom:0}to{bottom:50%}}
@keyframes sss-content-in{from{opacity:0;translate:0 10px}to{opacity:1;translate:0 0}}
@keyframes sss-opening-shoe{from{opacity:0;transform:translate(20%,15%) rotate(20deg)}to{opacity:1;transform:none}}
@keyframes sss-specs-in{from{translate:100% 0;opacity:0}to{translate:0 0;opacity:1}}
@container (max-width:480px){.sss-live .sss-frame{width:91%;aspect-ratio:1.61}.sss-header{font-size:8px}.sss-brand{font-size:11px}.sss-panel-top{font-size:5px}.sss-panel-caption{font-size:10px}.sss-panel-arrow{width:18px;height:18px;font-size:10px}.sss-panel-image{height:var(--sss-image-height,66%);top:var(--sss-image-top,17%)}.sss-buy{left:53%;right:4%;top:60%;gap:8px}.sss-price{font-size:15px}.sss-buy-row{flex-wrap:wrap;gap:5px}.sss-size{width:100%;padding:4px}.sss-add{padding:6px}.sss-product-title{left:53%;font-size:6cqw;top:23%}.sss-hero-image{left:5%;width:44%;top:38%}.sss-specs-button{min-width:43%;padding:7px 10px}.sss-specs{width:47%;top:17%;padding:12px}.sss-specs p{font-size:9px;line-height:1.55}.sss-specs dl{font-size:8px;gap:9px}.sss-header-links{gap:7px}.sss-color-options{bottom:13%}.sss-info-popover{width:65%;padding:12px}}
@container (max-width:480px){.sss-live[data-view=product],.sss-live[data-view=details]{aspect-ratio:auto;padding-block:6%}.sss-live[data-view=product] .sss-frame,.sss-live[data-view=details] .sss-frame{aspect-ratio:.8;min-height:340px}.sss-header button{min-height:32px;font-size:9px}.sss-buy{top:54%;gap:4px}.sss-size,.sss-add{font-size:11px;min-height:32px}.sss-status{font-size:10px;line-height:1.2;max-height:2.4em;overflow:auto}.sss-specs-button{min-height:32px;font-size:11px}.sss-specs h3{font-size:12px}.sss-specs p{font-size:11px}.sss-specs dl{font-size:10px}.sss-color-option{min-width:24px;min-height:24px}.sss-product-title{top:25%}.sss-product[data-view=details] .sss-hero-image{top:35%}}
@media(prefers-reduced-motion:reduce){.sss-root *{animation:none!important;transition:none!important}}
`;

function normalizeIndex(index: number, length: number) {
  return Number.isFinite(index) ? Math.max(0, Math.min(length - 1, Math.trunc(index))) : 0;
}

function SneakerPanels({ products, hovered, expanding = null, onHover, onSelect }: {
  products: readonly SwiftSneakerProduct[];
  hovered: number | null;
  expanding?: number | null;
  onHover?: (index: number | null) => void;
  onSelect?: (index: number) => void;
}) {
  return <div className="sss-panels" data-opening={expanding !== null} onPointerLeave={() => onHover?.(null)}>
    {products.map((product, index) => {
      const content = <>
        <span className="sss-panel-top"><span>{index === 0 ? "SWIFT" : index === products.length - 1 ? "CONTACTS" : "swft"}</span><span>{index === products.length - 1 ? "BAG 0" : "↗"}</span></span>
        <img className="sss-panel-image" src={product.image} alt={onSelect ? `${product.name} ${product.color} sneaker` : ""} style={{ filter: product.imageFilter, ...(product.imageTop === undefined ? {} : { "--sss-image-top": `${product.imageTop}%` }), ...(product.imageLeft === undefined ? {} : { "--sss-image-left": `${product.imageLeft}%` }), ...(product.imageHeight === undefined ? {} : { "--sss-image-height": `${product.imageHeight}%` }) } as CSSProperties} draggable={false} />
        <span className="sss-panel-caption"><span>{product.name}<br />{product.color}</span><span className="sss-panel-arrow" aria-hidden="true">↗</span></span>
      </>;
      const style = { "--sss-color": product.background } as CSSProperties;
      return onSelect ? <button key={product.id} type="button" className="sss-panel" style={style} data-hovered={hovered === index} data-opening={expanding === index} onPointerEnter={() => onHover?.(index)} onPointerMove={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty("--sss-edge-y", `${Math.max(0, Math.min(100, (event.clientY - bounds.top) / Math.max(1, bounds.height) * 100))}%`); }} onFocus={() => onHover?.(index)} onClick={() => onSelect(index)} aria-label={`Explore ${product.name} ${product.color}`}><span className="sss-panel-content">{content}</span></button>
        : <div key={product.id} className="sss-panel" style={style} data-hovered={hovered === index}><span className="sss-panel-content">{content}</span></div>;
    })}
    {expanding !== null && products[expanding]?.detailImage && <img className="sss-opening-shoe" src={products[expanding].detailImage} alt="" draggable={false} style={{ filter: products[expanding].imageFilter }} />}
  </div>;
}

/** Expanding product panels become a working, size-selectable storefront. */
export default function SwiftSneakerStore({ artwork = "enhanced", products = artwork === "reference" ? REFERENCE_PRODUCTS : DEFAULT_PRODUCTS, initialIndex = 1, sizes = DEFAULT_SIZES, onAddToCart, className = "" }: SwiftSneakerStoreProps) {
  const id = useId();
  const [view, setView] = useState<StoreView>("gallery");
  const [active, setActive] = useState(normalizeIndex(initialIndex, products.length));
  const [hovered, setHovered] = useState<number | null>(null);
  const [size, setSize] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [popover, setPopover] = useState<"contacts" | "bag" | null>(null);
  const [expanding, setExpanding] = useState<number | null>(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  const root = useRef<HTMLElement>(null);
  const previousView = useRef<StoreView>("gallery");
  const selected = products[normalizeIndex(active, products.length)];

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (expanding === null) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => {
      setView("product");
      setExpanding(null);
    }, reducedMotion ? 0 : 900);
    return () => clearTimeout(timer);
  }, [expanding]);
  useEffect(() => {
    if (previousView.current === view) return;
    const from = previousView.current;
    previousView.current = view;
    if (view === "product") root.current?.querySelector<HTMLButtonElement>(from === "details" ? ".sss-specs-button" : ".sss-header button")?.focus({ preventScroll: true });
    else if (view === "gallery") root.current?.querySelectorAll<HTMLButtonElement>(".sss-panel")[normalizeIndex(active, products.length)]?.focus({ preventScroll: true });
    else root.current?.querySelector<HTMLElement>(".sss-specs")?.focus({ preventScroll: true });
  }, [view, active, products.length]);

  function choose(index: number) {
    if (expanding !== null) return;
    setActive(index);
    setExpanding(index);
    setStatus("");
    setPopover(null);
  }
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      setExpanding(null);
      if (popover) setPopover(null);
      else setView((current) => current === "details" ? "product" : "gallery");
    }
  }
  async function addToCart() {
    if (!selected || pending.current) return;
    if (!size) { setStatus("Choose your size first."); return; }
    pending.current = true;
    setBusy(true);
    setStatus("");
    try {
      await onAddToCart?.(selected, size);
      if (!mounted.current) return;
      setCartCount((count) => count + 1);
      setStatus(`${selected.name}, size ${size}, added to your bag.`);
    } catch (error) {
      if (mounted.current) setStatus(error instanceof Error ? error.message : "Could not add this pair. Please try again.");
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return <section ref={root} className={`sss-root sss-interactive ${className}`} data-view={view} aria-label="Swift sneaker storefront" aria-busy={expanding !== null || busy} onKeyDown={handleKeyDown}>
    <ComponentStyles css={CSS} />
    {selected && <link rel="preload" as="image" href={selected.detailImage ?? selected.image} />}
    <div className="sss-live" data-view={view}><div className="sss-frame">
      {!selected ? <p className="sss-empty">Add a product to explore the collection.</p> : view === "gallery" ? <SneakerPanels products={products} hovered={hovered} expanding={expanding} onHover={setHovered} onSelect={choose} /> : <div className="sss-product" data-view={view} style={{ "--sss-color": selected.background, "--sss-filter": selected.imageFilter ?? "none" } as CSSProperties}>
        {view === "product" && <div className="sss-product-color" />}
        <header className="sss-header">
          <button type="button" onClick={() => { setView("gallery"); setPopover(null); }} aria-label="Back to sneaker collection">← &nbsp; BACK</button>
          <span className="sss-brand">swft</span>
          <div className="sss-header-links"><button type="button" onClick={() => setPopover((current) => current === "contacts" ? null : "contacts")}>CONTACTS</button><button type="button" onClick={() => setPopover((current) => current === "bag" ? null : "bag")} aria-label={`Shopping bag, ${cartCount} items`}>BAG {cartCount}</button></div>
        </header>
        <img key={selected.id} className="sss-hero-image" data-angle={!selected.detailImage} src={selected.detailImage ?? selected.image} alt={`${selected.name} ${selected.color} sneaker side view`} draggable={false} />
        {view === "product" && <>
          <h2 className="sss-product-title">{selected.name}<br />{selected.color}<small>LIGHTWEIGHT / EVERYDAY</small></h2>
          <div className="sss-buy">
            <p className="sss-price"><small>$</small> {Number.isFinite(selected.price) ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(selected.price) : "—"}</p>
            <div className="sss-buy-row"><label className="sr-only" htmlFor={`${id}-size`}>Shoe size</label><select id={`${id}-size`} className="sss-size" value={size} onChange={(event) => { setSize(event.target.value); setStatus(""); }}><option value="">SIZE · EU</option>{sizes.map((value) => <option key={value} value={value}>{value}</option>)}</select><button type="button" className="sss-add" disabled={busy || !sizes.length} onClick={addToCart}>{busy ? "ADDING…" : "ADD TO BAG"}</button></div>
            <span className="sss-status" role="status">{status}</span>
          </div>
          <button type="button" className="sss-specs-button" onClick={() => { setView("details"); setPopover(null); }}>More info <span aria-hidden="true" className="float-right">↗</span></button>
        </>}
        <div className="sss-color-options" aria-label="Choose sneaker color">{products.map((product, index) => <button key={product.id} type="button" className="sss-color-option" aria-label={`Choose ${product.name}`} aria-pressed={active === index} onClick={() => { setActive(index); setStatus(""); }} style={{ "--sss-filter": product.imageFilter ?? "none" } as CSSProperties}><img src={product.detailImage ?? product.image} alt="" /></button>)}</div>
        {view === "details" && <aside className="sss-specs" tabIndex={-1} aria-label={`${selected.name} specifications`}><h3>{selected.name} {selected.color}</h3><p>{selected.description}</p><dl><div><dt>Color</dt><dd>{selected.name.replace("Swift ", "")}</dd></div><div><dt>Lining</dt><dd>Soft textile</dd></div><div><dt>Sole</dt><dd>Lightweight Phylon</dd></div><div><dt>Upper</dt><dd>Knit / mesh</dd></div><div><dt>Product code</dt><dd>{selected.id.toUpperCase()}</dd></div><div><dt>Size</dt><dd>{sizes[0] ?? "—"}–{sizes.at(-1) ?? "—"} EU</dd></div></dl><button type="button" className="sss-add mt-4 w-full" onClick={() => setView("product")}>CHOOSE YOUR SIZE</button></aside>}
        {popover && <aside className="sss-info-popover" aria-label={popover === "bag" ? "Shopping bag" : "Contact the store"}>{popover === "bag" ? <p>{cartCount ? `${cartCount} ${cartCount === 1 ? "pair" : "pairs"} in your bag.` : "Your bag is empty. Choose a pair and your size to get started."}</p> : <p>Questions about your perfect fit?<br /><a href="mailto:hello@swift.example">hello@swift.example</a><br />Monday–Friday · 9:00–18:00</p>}</aside>}
      </div>}
    </div></div>
  </section>;
}

/** Lightweight, inert gallery art; no storefront state or network work. */
export function SwiftSneakerStoreThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.max(0, Math.trunc(previewStep)) : 0;
  const hovered = step === 0 ? null : (step - 1) % DEFAULT_PRODUCTS.length;
  return <div className={`sss-root ${className}`} aria-hidden="true"><ComponentStyles css={CSS} /><div className="sss-frame"><SneakerPanels products={DEFAULT_PRODUCTS} hovered={hovered} /></div></div>;
}
