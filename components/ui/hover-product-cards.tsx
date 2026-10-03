"use client";

/* eslint-disable @next/next/no-img-element -- Embedded artwork keeps this file portable outside Next.js. */

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

export interface HoverProductColor {
  name: string;
  color: string;
  image?: string;
  /** Optional CSS filter for a color variant of the same artwork. */
  imageFilter?: string;
}
export interface HoverProduct {
  id: string;
  name: string;
  image: string;
  imageAlt?: string;
  brand?: string;
  background?: string;
  /** Optional CSS silhouette mask; omit for your own clean transparent images. */
  imageClipPath?: string;
  sizes: readonly string[];
  colors: readonly HoverProductColor[];
}
export interface HoverProductSelection {
  product: HoverProduct;
  size: string;
  color: HoverProductColor;
}
export interface HoverProductCardsProps {
  products?: readonly HoverProduct[];
  /** Resolve to confirm the selection; reject to show a retryable error. */
  onBuy?: (selection: HoverProductSelection) => void | Promise<void>;
  className?: string;
}

function ShoeArtwork({ product, color }: { product: HoverProduct; color: HoverProductColor }) {
  return <span className="hpc-shoe-shadow"><img src={color.image ?? product.image} alt={`${color.name} ${product.imageAlt ?? product.name}`} draggable={false} style={{ filter: color.imageFilter, clipPath: product.imageClipPath }} /></span>;
}

function ProductCard({ product, onBuy }: { product: HoverProduct; onBuy?: HoverProductCardsProps["onBuy"] }) {
  const [expanded, setExpanded] = useState(false);
  const [size, setSize] = useState<string | null>(null);
  const [colorIndex, setColorIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const cardRef = useRef<HTMLElement>(null);
  const sizeRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const hovered = useRef(false);
  const pinned = useRef(false);
  const busy = useRef(false);
  const mounted = useRef(false);
  const id = useId();
  const selectedColor = Math.min(colorIndex, Math.max(0, product.colors.length - 1));
  const color = product.colors[selectedColor] ?? { name: "Original", color: "#03a9f4" };
  const selectedSize = size && product.sizes.includes(size) ? size : null;
  const pending = status === "pending";

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  function resetFeedback() {
    setStatus("idle");
    setFeedback("");
  }

  async function buy() {
    if (busy.current || status === "success") return;
    if (!selectedSize) {
      setStatus("error");
      setFeedback(product.sizes.length ? "Choose a size to continue." : "No sizes are currently available.");
      sizeRefs.current[0]?.focus();
      return;
    }
    busy.current = true;
    setStatus("pending");
    setFeedback("");
    try {
      await onBuy?.({ product, size: selectedSize, color });
      if (!mounted.current) return;
      setStatus("success");
      setFeedback(onBuy ? `${color.name}, size ${selectedSize} confirmed.` : `Size ${selectedSize} selected. Demo only; no purchase made.`);
    } catch {
      if (mounted.current) { setStatus("error"); setFeedback("Couldn’t complete that. Please try again."); }
    } finally {
      busy.current = false;
    }
  }

  return <article
    ref={cardRef}
    className="hpc-card"
    data-expanded={expanded}
    style={{ "--hpc-accent": color.color, "--hpc-background": product.background ?? "#edf3f3" } as CSSProperties}
    onPointerEnter={(event) => { if (event.pointerType === "mouse") { hovered.current = true; setExpanded(true); } }}
    onPointerLeave={(event) => {
      if (event.pointerType !== "mouse") return;
      hovered.current = false;
      if (!pinned.current && !event.currentTarget.contains(document.activeElement)) setExpanded(false);
    }}
    onFocusCapture={() => setExpanded(true)}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget) && !hovered.current && !pinned.current) setExpanded(false); }}
  >
    <span className="hpc-circle" aria-hidden="true" />
    <span className="hpc-brand" aria-hidden="true">{product.brand ?? "NIKE"}</span>
    <button
      className="hpc-image-button"
      type="button"
      aria-label={`Customize ${color.name} ${product.name}`}
      aria-expanded={expanded}
      aria-controls={`${id}-options`}
      onClick={() => { pinned.current = !pinned.current; setExpanded(pinned.current || hovered.current || Boolean(cardRef.current?.contains(document.activeElement))); }}
    >
      <ShoeArtwork product={product} color={color} />
    </button>
    <div className="hpc-content">
      <h2>{product.name}</h2>
      <div className="hpc-options" id={`${id}-options`} inert={!expanded}>
        <fieldset className="hpc-option-row" disabled={pending}>
          <legend className="hpc-sr-only">Choose a shoe size</legend>
          <span className="hpc-option-label" aria-hidden="true">SIZE :</span>
          <div className="hpc-sizes">{product.sizes.map((option, index) => <button
            key={option}
            ref={(element) => { sizeRefs.current[index] = element; }}
            type="button"
            className="hpc-size"
            aria-label={`Size ${option}`}
            aria-pressed={option === selectedSize}
            onClick={() => { setSize(option); resetFeedback(); }}
          >{option}</button>)}</div>
        </fieldset>
        {product.colors.length > 0 && <fieldset className="hpc-option-row" disabled={pending}>
          <legend className="hpc-sr-only">Choose a shoe color</legend>
          <span className="hpc-option-label" aria-hidden="true">COLOR :</span>
          <div className="hpc-colors">{product.colors.map((option, index) => <button
            type="button"
            key={option.name}
            className="hpc-color"
            aria-label={option.name}
            aria-pressed={index === selectedColor}
            title={option.name}
            onClick={() => { setColorIndex(index); resetFeedback(); }}
          ><span style={{ background: option.color }} /></button>)}</div>
        </fieldset>}
        <button type="button" className="hpc-buy" disabled={pending || status === "success" || !product.sizes.length} onClick={() => void buy()}>{pending ? "Please wait…" : status === "success" ? "Selected ✓" : !product.sizes.length ? "Unavailable" : "Buy Now"}</button>
        <p className="hpc-feedback" role={status === "error" ? "alert" : "status"} data-error={status === "error"}>{feedback}</p>
      </div>
    </div>
  </article>;
}

/** Hover, focus, or tap to reveal product options. Default purchases are local demos. */
export default function HoverProductCards({ products = DEFAULT_PRODUCTS, onBuy, className = "" }: HoverProductCardsProps) {
  return <section className={`hover-product-cards relative w-full ${className}`} aria-label="Interactive shoe collection"><style>{HOVER_PRODUCT_STYLES}</style><div className="hpc-stage">{products.map((product) => <ProductCard key={product.id} product={product} onBuy={onBuy} />)}{!products.length && <p className="hpc-empty">No products to display.</p>}</div></section>;
}

/** The gallery selects the frame. No timers, hooks, inputs, or buttons are rendered. */
export function HoverProductCardsThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) % 4 : 0;
  return <div className={`hover-product-cards hpc-thumbnail ${className}`} aria-hidden="true" inert><style>{HOVER_PRODUCT_STYLES}</style><div className="hpc-stage">{DEFAULT_PRODUCTS.map((product, index) => {
    const active = step < 2 ? index === 0 : index === 1;
    const colorIndex = index === 0 && step === 1 ? 1 : index === 1 && step === 3 ? 2 : 0;
    const color = product.colors[colorIndex];
    return <div className="hpc-card" key={product.id} data-expanded={active} style={{ "--hpc-accent": color.color, "--hpc-background": "#edf3f3" } as CSSProperties}><span className="hpc-circle" /><span className="hpc-brand">NIKE</span><div className="hpc-image-button"><ShoeArtwork product={product} color={color} /></div><div className="hpc-content"><h2>{product.name}</h2><div className="hpc-options"><div className="hpc-option-row"><span className="hpc-option-label">SIZE :</span><div className="hpc-sizes">{product.sizes.map((size, sizeIndex) => <span className="hpc-size" data-selected={sizeIndex === step % 4} key={size}>{size}</span>)}</div></div><div className="hpc-option-row"><span className="hpc-option-label">COLOR :</span><div className="hpc-colors">{product.colors.map((option) => <span className="hpc-color" key={option.name}><span style={{ background: option.color }} /></span>)}</div></div><span className="hpc-buy">Buy Now</span></div></div></div>;
  })}</div></div>;
}

// Exact shoe pixels cropped from the supplied video, with transparent WebP assets.
// A CSS silhouette removes remaining background fragments around the small source crops.
// The source footage limits their resolution; replace these images for larger production cards.
const BLUE_SHOE = "data:image/webp;base64,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";
const RED_SHOE = "data:image/webp;base64,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";
const SHOE_SILHOUETTE = "polygon(4% 76%,10% 68%,20% 57%,28% 47%,31% 34%,39% 32%,40% 27%,49% 30%,52% 18%,62% 23%,70% 17%,74% 7%,81% 9%,86% 17%,88% 30%,94% 42%,93% 49%,82% 59%,64% 72%,42% 82%,18% 90%,10% 91%,5% 88%)";
const DEFAULT_PRODUCTS: readonly HoverProduct[] = [
  {
    id: "nike-blue", name: "Nike Shoes", brand: "NIKE", image: BLUE_SHOE,
    imageAlt: "Nike running shoe with a white swoosh", imageClipPath: SHOE_SILHOUETTE,
    sizes: ["7", "8", "9", "10"],
    colors: [
      { name: "Blue", color: "#03a9f4", image: BLUE_SHOE },
      { name: "Cyan", color: "#00c6df", image: BLUE_SHOE, imageFilter: "hue-rotate(-20deg)" },
      { name: "Pink", color: "#ff367e", image: RED_SHOE, imageFilter: "hue-rotate(325deg)" },
    ],
  },
  {
    id: "nike-red", name: "Nike Shoes", brand: "NIKE", image: RED_SHOE,
    imageAlt: "Nike running shoe with a white swoosh", imageClipPath: SHOE_SILHOUETTE,
    sizes: ["7", "8", "9", "10"],
    colors: [
      { name: "Red", color: "#fb0012", image: RED_SHOE },
      { name: "Blue", color: "#03a9f4", image: BLUE_SHOE },
      { name: "Pink", color: "#ff367e", image: RED_SHOE, imageFilter: "hue-rotate(325deg)" },
    ],
  },
];

const HOVER_PRODUCT_STYLES = `
.hover-product-cards{container-type:inline-size;min-width:0;isolation:isolate;background:white;color:#151b1e;font-family:Arial,Helvetica,sans-serif}.hover-product-cards *{box-sizing:border-box}.hover-product-cards button{font:inherit;cursor:pointer}.hover-product-cards button:disabled{cursor:default;opacity:.65}.hover-product-cards button:focus-visible{outline:3px solid #176bd0;outline-offset:4px}
.hover-product-cards .hpc-stage{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:36px;min-height:570px;padding:60px 24px}.hover-product-cards .hpc-card{container-type:inline-size;position:relative;flex:0 0 auto;width:300px;aspect-ratio:320/450;overflow:hidden;border-radius:11px;background:var(--hpc-background,#edf3f3);isolation:isolate}.hover-product-cards .hpc-circle{position:absolute;z-index:0;inset:0;background:var(--hpc-accent,#03a9f4);clip-path:circle(47cqw at 80% 20%);transition:clip-path .65s ease,background-color .4s}.hover-product-cards .hpc-card[data-expanded=true] .hpc-circle{clip-path:circle(94cqw at 80% -20%)}.hover-product-cards .hpc-brand{position:absolute;z-index:1;top:23%;left:-20%;font-size:60cqw;line-height:1.2;font-weight:800;font-style:italic;letter-spacing:-5px;color:#fff;opacity:.65;pointer-events:none;user-select:none}
.hover-product-cards .hpc-image-button{position:absolute;z-index:3;top:50%;left:0;display:flex;align-items:center;justify-content:center;transform:translateY(-50%);width:100%;height:68.75cqw;padding:0;background:transparent;border:0;transition:top .55s ease,transform .55s ease;-webkit-tap-highlight-color:transparent}.hover-product-cards .hpc-image-button:focus-visible{outline-offset:-8px;border-radius:12px}.hover-product-cards .hpc-card[data-expanded=true] .hpc-image-button{top:0;transform:translateY(0)}.hover-product-cards .hpc-shoe-shadow{display:block;width:96%;filter:drop-shadow(0 4px 2px #1729421c);pointer-events:none}.hover-product-cards .hpc-shoe-shadow img{display:block;width:100%;height:auto;user-select:none;transition:filter .45s}
.hover-product-cards .hpc-content{position:absolute;z-index:4;bottom:0;left:0;width:100%;height:31.25cqw;text-align:center;transition:height .55s ease;padding:0 12px}.hover-product-cards .hpc-card[data-expanded=true] .hpc-content{height:67.5cqw}.hover-product-cards .hpc-content h2{margin:0 0 8px;color:#1c2425;font-size:20px;font-weight:650;line-height:1.25;letter-spacing:.6px}.hover-product-cards .hpc-options{opacity:0;visibility:hidden;transform:translateY(14px);transition:opacity .25s ease,transform .35s ease,visibility .25s}.hover-product-cards .hpc-card[data-expanded=true] .hpc-options{opacity:1;visibility:visible;transform:translateY(0);transition-delay:.1s}.hover-product-cards .hpc-option-row{display:flex;align-items:center;justify-content:center;gap:9px;min-width:0;min-height:31px;margin:0;padding:0;border:0}.hover-product-cards .hpc-option-label{color:#78888c;letter-spacing:1px;font-size:11px;font-weight:400}.hover-product-cards .hpc-sizes{display:flex;gap:5px}.hover-product-cards .hpc-size{display:grid;place-items:center;width:28px;height:28px;padding:0;border:0;border-radius:3px;background:#141b1c;color:#fff;font-size:11px;transition:background .15s}.hover-product-cards .hpc-size:hover,.hover-product-cards .hpc-size[aria-pressed=true],.hover-product-cards .hpc-size[data-selected=true]{background:#217cc9}.hover-product-cards .hpc-colors{display:flex;gap:1px}.hover-product-cards .hpc-color{display:grid;place-items:center;flex-shrink:0;width:29px;height:29px;border:0;background:transparent;border-radius:50%;padding:5px}.hover-product-cards .hpc-color>span{display:block;width:19px;height:19px;border-radius:50%;box-shadow:0 0 0 1px #00000006}.hover-product-cards .hpc-color[aria-pressed=true]>span{outline:1px solid #81919a;outline-offset:3px}.hover-product-cards .hpc-buy{display:inline-flex;align-items:center;justify-content:center;min-width:94px;min-height:34px;padding:8px 17px;border:0;border-radius:3px;background:#11191a;color:#fff;font-size:12px;font-weight:600;margin-top:8px;transition:background .2s}.hover-product-cards .hpc-buy:hover:not(:disabled){background:#2c393d}.hover-product-cards .hpc-feedback{min-height:29px;margin:8px 0 0;font-size:10px;line-height:1.45;color:#506b61}.hover-product-cards .hpc-feedback[data-error=true]{color:#a63532}.hover-product-cards .hpc-sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.hover-product-cards .hpc-empty{color:#71818a;font-size:14px}
@container(max-width:650px){.hover-product-cards:not(.hpc-thumbnail) .hpc-stage{gap:32px;padding:38px 20px}.hover-product-cards:not(.hpc-thumbnail) .hpc-card{width:min(300px,100%)}}
.hover-product-cards.hpc-thumbnail{height:100%;pointer-events:none}.hover-product-cards.hpc-thumbnail .hpc-stage{height:100%;min-height:0;padding:28px 18px;gap:7%}.hover-product-cards.hpc-thumbnail .hpc-card{width:38%;max-width:190px;border-radius:6px}.hover-product-cards.hpc-thumbnail .hpc-content{padding:0 5px}.hover-product-cards.hpc-thumbnail .hpc-content h2{font-size:6.5cqw;margin-bottom:3cqw;letter-spacing:.3px}.hover-product-cards.hpc-thumbnail .hpc-option-row{gap:2cqw;min-height:10cqw}.hover-product-cards.hpc-thumbnail .hpc-option-label{font-size:3.4cqw;letter-spacing:.3px}.hover-product-cards.hpc-thumbnail .hpc-sizes{gap:1.5cqw}.hover-product-cards.hpc-thumbnail .hpc-size{width:8cqw;height:8cqw;font-size:3.7cqw;border-radius:1px}.hover-product-cards.hpc-thumbnail .hpc-color{width:9cqw;height:9cqw;padding:1.5cqw}.hover-product-cards.hpc-thumbnail .hpc-color>span{width:6cqw;height:6cqw}.hover-product-cards.hpc-thumbnail .hpc-buy{min-width:30cqw;min-height:11cqw;padding:2.4cqw 4cqw;font-size:4cqw;margin-top:2cqw;border-radius:1px}.hover-product-cards.hpc-thumbnail .hpc-brand{letter-spacing:-2px}
@media(prefers-reduced-motion:reduce){.hover-product-cards *,.hover-product-cards *::before,.hover-product-cards *::after{transition:none!important;animation:none!important}}
`;
