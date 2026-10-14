"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { ComponentStyles } from "./component-styles";

export type GarmentColor = { name: string; hex: string };
export type ClothingProduct = {
  id: string;
  title: string;
  description?: string;
  productImage: string;
  /** Same dimensions as the image. White recolors; black/transparent protects. */
  garmentMask?: string;
  initialColor?: string;
  availableColors?: readonly GarmentColor[];
  /** Explicit opt-in for plain cutouts only; alpha alone cannot protect logos. */
  recolorAllOpaquePixels?: boolean;
};
export type ClothingColorCustomizerProps = {
  productImage?: string;
  garmentMask?: string;
  productTitle?: string;
  description?: string;
  initialColor?: string;
  availableColors?: readonly GarmentColor[];
  products?: readonly ClothingProduct[];
  recolorAllOpaquePixels?: boolean;
  onColorChange?: (hex: string, selection: { productId: string; isOriginal: boolean }) => void;
  className?: string;
};

export const GARMENT_COLORS: readonly GarmentColor[] = [
  { name: "Ink", hex: "#252629" },
  { name: "Chalk", hex: "#F1EEE7" },
  { name: "Stone", hex: "#AAA294" },
  { name: "Cobalt", hex: "#3956A3" },
  { name: "Forest", hex: "#425E4C" },
  { name: "Bordeaux", hex: "#793E49" },
  { name: "Clay", hex: "#BE7860" },
  { name: "Lavender", hex: "#A49ABF" },
];

const DEMO_PRODUCTS: readonly ClothingProduct[] = [
  { id: "tee", title: "The everyday tee", description: "A considered essential. Relaxed proportions, a classic crew neck, and a color that’s entirely yours.", productImage: "/clothing-customizer/tee.webp", garmentMask: "/clothing-customizer/tee-mask.png", initialColor: "#D9DDE0" },
  { id: "hoodie", title: "The studio hoodie", description: "An easy layer with a generous hood and a kangaroo pocket. Find your everyday shade.", productImage: "/clothing-customizer/hoodie.webp", garmentMask: "/clothing-customizer/hoodie-mask.png", initialColor: "#E4E3E9" },
];

/** Accept #RGB and #RRGGBB, returning a canonical six-digit HEX. */
export function normalizeGarmentHex(value: string): string | null {
  const hex = value.trim().replace(/^#/, "");
  if (/^[\da-f]{3}$/i.test(hex)) return `#${hex.split("").map((digit) => digit + digit).join("").toUpperCase()}`;
  return /^[\da-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null;
}

const linear = (value: number) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
const srgb = (value: number) => Math.round(255 * (value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055));
const LINEAR_CHANNELS = Float32Array.from({ length: 256 }, (_, index) => linear(index / 255));

export type GarmentPixelSource = {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
  coverage: Float32Array;
  shading: Float32Array;
};

/** Cache luminance and coverage once; preserve source alpha and protected pixels. */
export function prepareGarmentPixels(source: ImageData, mask: ImageData | null, useAlpha = false): GarmentPixelSource {
  if (mask && (mask.width !== source.width || mask.height !== source.height)) throw new Error("The garment mask must match the image dimensions.");
  const count = source.width * source.height;
  const coverage = new Float32Array(count);
  const shading = new Float32Array(count);
  const histogram = new Float64Array(256);
  let weight = 0;
  for (let pixel = 0; pixel < count; pixel++) {
    const i = pixel * 4;
    const alpha = source.data[i + 3] / 255;
    // Mask brightness multiplied by alpha also accepts white-on-transparent masks.
    const amount = mask ? (mask.data[i] * 0.2126 + mask.data[i + 1] * 0.7152 + mask.data[i + 2] * 0.0722) / 255 * mask.data[i + 3] / 255 : useAlpha ? 1 : 0;
    coverage[pixel] = alpha > 0 ? amount : 0;
    const luminance = LINEAR_CHANNELS[source.data[i]] * 0.2126 + LINEAR_CHANNELS[source.data[i + 1]] * 0.7152 + LINEAR_CHANNELS[source.data[i + 2]] * 0.0722;
    shading[pixel] = luminance;
    if (amount > 0.5 && alpha > 0.5) {
      histogram[Math.round(luminance * 255)] += amount;
      weight += amount;
    }
  }
  if (weight === 0) throw new Error("The mask contains no visible recolorable area. Use white for the garment and black for protected regions.");
  let accumulated = 0;
  let reference = 1;
  // A bright diffuse reference leaves room for folds when switching to white.
  for (let index = 0; index < histogram.length; index++) {
    accumulated += histogram[index];
    if (accumulated >= weight * 0.8) { reference = Math.max(0.015, index / 255); break; }
  }
  for (let pixel = 0; pixel < count; pixel++) shading[pixel] /= reference;
  return { width: source.width, height: source.height, pixels: new Uint8ClampedArray(source.data), coverage, shading };
}

/** Linear-light diffuse tint with a small neutral highlight for very dark colors. */
export function recolorGarmentPixels(source: GarmentPixelSource, hex: string | null, output: Uint8ClampedArray): void {
  if (output.length !== source.pixels.length) throw new Error("Output dimensions must match the source.");
  output.set(source.pixels);
  if (hex === null) return;
  const normalized = normalizeGarmentHex(hex);
  if (!normalized) throw new Error("Use a valid HEX color.");
  const target = [1, 3, 5].map((offset) => LINEAR_CHANNELS[parseInt(normalized.slice(offset, offset + 2), 16)]);
  const tint = new Uint8ClampedArray(4096 * 3);
  const tintLinear = new Float32Array(4096 * 3);
  for (let step = 0; step < 4096; step++) {
    const ratio = step / 1024;
    const diffuse = Math.min(1, ratio);
    const highlight = Math.min(0.24, Math.max(0, ratio - 1) * 0.18);
    const sheen = Math.max(0, diffuse - 0.45) * 0.008;
    for (let channel = 0; channel < 3; channel++) {
      const value = Math.min(1, target[channel] * diffuse * (1 - highlight) + highlight + sheen);
      tintLinear[step * 3 + channel] = value;
      tint[step * 3 + channel] = srgb(value);
    }
  }
  for (let pixel = 0; pixel < source.coverage.length; pixel++) {
    const amount = source.coverage[pixel];
    if (!amount) continue;
    const step = Math.min(4095, Math.max(0, Math.round(source.shading[pixel] * 1024))) * 3;
    for (let channel = 0; channel < 3; channel++) {
      const i = pixel * 4 + channel;
      output[i] = amount >= 0.999 ? tint[step + channel] : srgb(LINEAR_CHANNELS[source.pixels[i]] * (1 - amount) + tintLinear[step + channel] * amount);
    }
  }
}

// Bounded decoded cache. Failed loads never poison the cache; canvas buffers are reused.
const sourceCache = new Map<string, GarmentPixelSource>();
const MAX_PROCESSING_SIDE = 1400;
function createSurface(width: number, height: number) {
  const surface = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(width, height) : document.createElement("canvas");
  surface.width = width;
  surface.height = height;
  const context = surface.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!context) throw new Error("Canvas image processing is unavailable in this browser.");
  return context;
}

function loadGarmentImage(url: string, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    const cleanup = () => { image.onload = null; image.onerror = null; signal.removeEventListener("abort", abort); };
    const abort = () => { cleanup(); image.src = ""; reject(new DOMException("Image loading cancelled", "AbortError")); };
    image.onload = () => { cleanup(); resolve(image); };
    image.onerror = () => { cleanup(); reject(new Error("Unable to load the product image or mask. Check the asset URL and cross-origin permissions.")); };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) { abort(); return; }
    image.src = url;
  });
}

async function loadGarmentSource(imageUrl: string, maskUrl: string | undefined, useAlpha: boolean, signal: AbortSignal) {
  const key = JSON.stringify([imageUrl, maskUrl, useAlpha]);
  const cached = sourceCache.get(key);
  if (cached) { sourceCache.delete(key); sourceCache.set(key, cached); return cached; }
  const [image, mask] = await Promise.all([loadGarmentImage(imageUrl, signal), maskUrl ? loadGarmentImage(maskUrl, signal) : null]);
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
  if (mask && (image.naturalWidth !== mask.naturalWidth || image.naturalHeight !== mask.naturalHeight)) throw new Error("The garment mask must have the same dimensions as the original product image.");
  const scale = Math.min(1, MAX_PROCESSING_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = createSurface(width, height);
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  let maskPixels: ImageData | null = null;
  if (mask) { context.clearRect(0, 0, width, height); context.drawImage(mask, 0, 0, width, height); maskPixels = context.getImageData(0, 0, width, height); }
  const result = prepareGarmentPixels(pixels, maskPixels, useAlpha);
  sourceCache.set(key, result);
  let totalPixels = [...sourceCache.values()].reduce((sum, item) => sum + item.width * item.height, 0);
  while (sourceCache.size > 3 || totalPixels > 4_000_000) {
    const oldest = sourceCache.keys().next().value;
    if (oldest === undefined) break;
    const old = sourceCache.get(oldest)!;
    totalPixels -= old.width * old.height;
    sourceCache.delete(oldest);
  }
  return result;
}

export function useGarmentRecolor({ productImage, garmentMask, recolorAllOpaquePixels = false, color }: { productImage: string; garmentMask?: string; recolorAllOpaquePixels?: boolean; color: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceKey = JSON.stringify([productImage, garmentMask, recolorAllOpaquePixels]);
  const [loaded, setLoad] = useState<{ key?: string; source?: GarmentPixelSource; error?: string }>({});
  const load = loaded.key === sourceKey ? loaded : {};
  const [retry, setRetry] = useState(0);
  const output = useRef<ImageData | null>(null);
  const canRecolor = Boolean(garmentMask || recolorAllOpaquePixels);
  useEffect(() => {
    if (!canRecolor) return;
    const controller = new AbortController();
    loadGarmentSource(productImage, garmentMask, recolorAllOpaquePixels, controller.signal)
      .then((source) => { if (!controller.signal.aborted) setLoad({ key: sourceKey, source }); })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        controller.abort();
        setLoad({ key: sourceKey, error: error instanceof DOMException && error.name === "SecurityError" ? "This image blocks canvas access. Use a local asset or enable CORS on the image server." : error instanceof Error ? error.message : "Unable to prepare this garment." });
      });
    return () => controller.abort();
  }, [productImage, garmentMask, recolorAllOpaquePixels, canRecolor, retry, sourceKey]);

  useEffect(() => {
    if (!load.source) return;
    const frame = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const source = load.source!;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      if (!context) { setLoad({ key: sourceKey, error: "Canvas previews are unavailable in this browser." }); return; }
      if (canvas.width !== source.width || canvas.height !== source.height) { canvas.width = source.width; canvas.height = source.height; }
      if (!output.current || output.current.width !== source.width || output.current.height !== source.height) output.current = context.createImageData(source.width, source.height);
      recolorGarmentPixels(source, color, output.current.data);
      context.putImageData(output.current, 0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [load.source, color, sourceKey]);
  return { canvasRef, ready: Boolean(load.source), error: load.error, canRecolor, retry: () => { setLoad({}); setRetry((value) => value + 1); } };
}

const css = `
.gcc-root{container-type:inline-size;width:100%;background:#fff;color:#20211f;font-family:Arial,Helvetica,sans-serif;box-sizing:border-box;border-radius:16px;overflow:hidden}
.gcc-root *{box-sizing:border-box}.gcc-root button,.gcc-root input,.gcc-root select{font:inherit}.gcc-root button{cursor:pointer}.gcc-root button:disabled{cursor:not-allowed;opacity:.4}.gcc-root button:focus-visible,.gcc-root input:focus-visible,.gcc-root select:focus-visible{outline:2px solid #282b29;outline-offset:4px}
.gcc-top{display:flex;align-items:center;justify-content:space-between;padding:24px 30px;border-bottom:1px solid #efefec;gap:16px}.gcc-brand{font-size:15px;font-weight:700;letter-spacing:-.6px}.gcc-brand span{font-weight:400;color:#94968f;margin-left:7px}.gcc-top-note{font-size:10px;letter-spacing:.13em;color:#777b73;text-transform:uppercase}
.gcc-layout{display:grid;grid-template-columns:1.18fr 1fr;gap:0}.gcc-preview{position:relative;display:flex;align-items:center;justify-content:center;background:#f5f5f1;margin:18px 0 18px 18px;border-radius:10px;min-width:0;min-height:490px;overflow:hidden}.gcc-art{position:relative;width:100%;max-width:560px;line-height:0}.gcc-art img{width:100%;height:auto;display:block}.gcc-art canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.gcc-art canvas[hidden]{display:none}.gcc-preview-tag{position:absolute;top:20px;left:20px;font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:#73776e;z-index:1}.gcc-preview-footer{position:absolute;bottom:19px;left:20px;right:20px;display:flex;justify-content:space-between;gap:10px;font-size:10px;color:#85887f}.gcc-preview-footer span:last-child{display:flex;align-items:center;gap:6px}.gcc-dot{width:5px;height:5px;border-radius:50%;background:#667b62}.gcc-image-error{padding:60px 25px;text-align:center;font-size:13px;line-height:1.6}
.gcc-controls{padding:36px 32px 28px;min-width:0;display:flex;flex-direction:column;justify-content:center}.gcc-eyebrow{font-size:10px;color:#7d8078;letter-spacing:.13em;text-transform:uppercase;margin:0 0 13px}.gcc-controls h2{font-size:clamp(25px,3.7cqw,40px);line-height:1.12;letter-spacing:-1.6px;font-weight:500;margin:0 0 13px}.gcc-description{font-size:12px;line-height:1.8;color:#85877f;max-width:310px;margin:0 0 27px}.gcc-product-label{font-size:10px;color:#777b73;display:flex;align-items:center;gap:12px;margin-bottom:25px}.gcc-select{min-width:0;border:1px solid #e6e6e0;border-radius:7px;padding:8px 26px 8px 10px;background:white;color:#30322d;font-size:11px!important;min-height:36px;flex:1}.gcc-color-heading{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:14px;font-size:11px;font-weight:600}.gcc-color-heading span:last-child{font-weight:400;color:#777b73}.gcc-swatches{display:flex;flex-wrap:wrap;gap:9px;margin:0 0 25px;padding:0;border:0}.gcc-swatch{height:36px;width:36px;border-radius:50%;border:1px solid #0000000d;position:relative;display:grid;place-items:center;padding:0}.gcc-swatch[aria-pressed=true]::after{content:"";position:absolute;inset:-4px;border:1px solid #353931;border-radius:50%}.gcc-swatch svg{width:12px;height:12px}.gcc-custom{border-top:1px solid #eeeee9;padding-top:22px}.gcc-custom label{font-size:11px;font-weight:600}.gcc-custom-line{display:flex;gap:8px;align-items:center;margin-top:12px}.gcc-native{position:relative;width:44px;height:44px;border-radius:8px;border:1px solid #e6e6df;overflow:hidden;flex-shrink:0}.gcc-native input{position:absolute;inset:-8px;width:60px;height:60px;cursor:pointer;padding:0;border:0;opacity:0}.gcc-native:focus-within{outline:2px solid #282b29;outline-offset:3px}.gcc-hex{height:44px;border:1px solid #e6e6df;border-radius:8px;display:flex;align-items:center;flex:1;min-width:0;padding:0 12px;gap:8px}.gcc-hex span{font-size:10px;color:#85877f;letter-spacing:.05em}.gcc-hex input{border:0;background:none;outline:none;min-width:0;width:100%;font-family:monospace;font-size:12px;color:#383b34}.gcc-hex:focus-within{border-color:#62685d}.gcc-hex:has([aria-invalid=true]){border-color:#a13d38}.gcc-field-error{font-size:11px;color:#a13d38;margin:9px 0 0}.gcc-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 0 21px}.gcc-selected{display:flex;gap:8px;align-items:center;font-size:10px;color:#797d73}.gcc-selected i{width:8px;height:8px;border-radius:50%;border:1px solid #0001}.gcc-selected code{font-size:10px;color:#363c32}.gcc-reset{border:0;background:transparent;padding:6px 0;min-height:32px;font-size:10px!important;color:#5f645b;display:flex;align-items:center;gap:6px}.gcc-reset svg{width:12px;height:12px}.gcc-bottom{border-top:1px solid #eeeee9;padding-top:17px;display:flex;justify-content:space-between;gap:12px;font-size:9px;line-height:1.6;color:#999c92}.gcc-bottom strong{font-weight:400;color:#5e6659}.gcc-alert{font-size:11px;line-height:1.6;color:#92554b;background:#fff5f2;padding:12px;border-radius:7px;margin-bottom:15px}.gcc-alert button{background:none;border:0;text-decoration:underline;padding:4px;color:inherit;display:block}.gcc-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@container(max-width:680px){.gcc-top{padding:18px 20px}.gcc-top-note{font-size:8px}.gcc-layout{grid-template-columns:1fr}.gcc-preview{margin:12px 12px 0;min-height:0;aspect-ratio:1.12}.gcc-art{width:86%;max-width:390px}.gcc-controls{padding:26px 24px}.gcc-controls h2{font-size:30px}.gcc-description{max-width:100%;margin-bottom:20px}.gcc-product-label{margin-bottom:20px}.gcc-swatch{width:40px;height:40px}.gcc-swatches{gap:11px}.gcc-preview-tag{top:16px;left:16px}.gcc-preview-footer{bottom:14px;left:16px;right:16px;font-size:9px}.gcc-bottom{font-size:10px}.gcc-color-heading,.gcc-custom label{font-size:12px}}
.gcc-thumbnail{height:100%;min-height:0;border-radius:0;pointer-events:none;display:flex;flex-direction:column}.gcc-thumbnail .gcc-top{padding:5% 6%;border:0}.gcc-thumbnail .gcc-brand{font-size:clamp(8px,2.9cqw,15px)}.gcc-thumbnail .gcc-top-note{font-size:clamp(5px,1.5cqw,9px)}.gcc-thumb-layout{flex:1;display:grid;grid-template-columns:1.1fr 1fr;min-height:0;padding:0 5% 5%;gap:6%}.gcc-thumb-image{position:relative;background:#f5f5f1;border-radius:8px;overflow:hidden;display:grid;place-items:center;min-width:0}.gcc-thumb-photo{position:relative;width:115%;line-height:0}.gcc-thumb-photo img{width:100%;max-width:none}.gcc-thumb-tint{position:absolute;inset:0;mix-blend-mode:multiply}.gcc-thumb-copy{align-self:center;font-size:clamp(5px,1.7cqw,10px);color:#8c8f86}.gcc-thumb-copy h3{font-size:clamp(12px,5cqw,27px);line-height:1.06;letter-spacing:-.05em;color:#292c25;font-weight:500;margin:7% 0 9%}.gcc-thumb-swatches{display:flex;gap:6%;margin:12% 0 16%}.gcc-thumb-swatches i{width:14%;aspect-ratio:1;border-radius:50%;border:1px solid #0001}.gcc-thumb-input{padding:8%;border:1px solid #e8e9e2;border-radius:5px;color:#464d3d;font-family:monospace}
`;

export function ProductImagePreview({ product, canvasRef, ready, color, isDemo }: { product: ClothingProduct; canvasRef: RefObject<HTMLCanvasElement | null>; ready: boolean; color: string | null; isDemo: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className="gcc-preview">
    <span className="gcc-preview-tag">{isDemo ? "Studio photograph" : "Product preview"} / 01</span>
    {failed ? <div className="gcc-image-error" role="alert">This product image couldn’t be loaded.<br />Check the image URL and <button type="button" onClick={() => setFailed(false)}>try again</button>.</div> : <div className="gcc-art">
      <img src={product.productImage} alt={`${product.title} — ${color && ready ? color : "original color"}`} style={{ opacity: ready && color !== null ? 0 : 1 }} onError={() => setFailed(true)} draggable={false} />
      <canvas ref={canvasRef} hidden={!ready || color === null} aria-hidden="true" />
    </div>}
    <div className="gcc-preview-footer"><span>{isDemo ? "Real fabric · prepared garment mask" : "Fabric details preserved"}</span><span><i className="gcc-dot" />{ready ? "Live preview" : "Original image"}</span></div>
  </div>;
}

export function ColorSwatchSelector({ colors, selected, disabled, onSelect }: { colors: readonly GarmentColor[]; selected: string | null; disabled: boolean; onSelect: (hex: string) => void }) {
  return <fieldset className="gcc-swatches" disabled={disabled}><legend className="gcc-sr">Available garment colors</legend>{colors.map((color) => {
    const hex = normalizeGarmentHex(color.hex);
    if (!hex) return null;
    const dark = parseInt(hex.slice(1, 3), 16) * .2126 + parseInt(hex.slice(3, 5), 16) * .7152 + parseInt(hex.slice(5, 7), 16) * .0722 < 145;
    return <button type="button" className="gcc-swatch" key={`${color.name}-${hex}`} style={{ background: hex, color: dark ? "white" : "#252925" }} aria-label={`${color.name} (${hex})`} title={color.name} aria-pressed={selected === hex} onClick={() => onSelect(hex)}>{selected === hex && <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.5" /></svg>}</button>;
  })}</fieldset>;
}

export function CustomColorPicker({ value, draft, invalid, disabled, onDraft, onSelect }: { value: string; draft: string; invalid: boolean; disabled: boolean; onDraft: (value: string) => void; onSelect: (value: string) => void }) {
  const id = useId();
  return <div className="gcc-custom">
    <label htmlFor={`${id}-hex`}>Or create your own</label>
    <div className="gcc-custom-line">
      <div className="gcc-native" style={{ background: value }}><input type="color" value={value} disabled={disabled} onInput={(event) => onSelect(event.currentTarget.value)} aria-label="Choose a custom garment color" /></div>
      <div className="gcc-hex"><span aria-hidden="true">HEX</span><input id={`${id}-hex`} value={draft} maxLength={7} spellCheck={false} autoComplete="off" disabled={disabled} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} onChange={(event) => onDraft(event.target.value)} /></div>
    </div>
    {invalid && <p id={`${id}-error`} className="gcc-field-error">Enter a HEX color, such as #3956A3 or #36A.</p>}
  </div>;
}

function GarmentSession({ product, products, index, onProduct, onColorChange, isDemo }: { product: ClothingProduct; products: readonly ClothingProduct[]; index: number; onProduct: (index: number) => void; onColorChange: ClothingColorCustomizerProps["onColorChange"]; isDemo: boolean }) {
  const id = useId();
  const original = normalizeGarmentHex(product.initialColor ?? "#D4D2CC") ?? "#D4D2CC";
  const [color, setColor] = useState<string | null>(null);
  const [draft, setDraft] = useState(original);
  const { canvasRef, ready, error, canRecolor, retry } = useGarmentRecolor({ ...product, color });
  const colors = product.availableColors ?? GARMENT_COLORS;
  const selectedName = color === null ? "Original" : colors.find((item) => normalizeGarmentHex(item.hex) === color)?.name ?? "Custom";
  const disabled = !ready || Boolean(error);
  function select(value: string) {
    const hex = normalizeGarmentHex(value);
    if (!hex) return;
    setColor(hex);
    setDraft(hex);
    onColorChange?.(hex, { productId: product.id, isOriginal: false });
  }
  function reset() {
    setColor(null); setDraft(original);
    onColorChange?.(original, { productId: product.id, isOriginal: true });
  }
  return <div className="gcc-layout">
    <ProductImagePreview product={product} canvasRef={canvasRef} ready={ready} color={color} isDemo={isDemo} />
    <div className="gcc-controls">
      <p className="gcc-eyebrow">The essentials / Color studio</p>
      <h2>{product.title}</h2>
      <p className="gcc-description">{product.description ?? "Find your shade. Explore the palette or create a color of your own."}</p>
      {products.length > 1 && <label className="gcc-product-label" htmlFor={`${id}-product`}>Style<select className="gcc-select" id={`${id}-product`} value={index} onChange={(event) => onProduct(Number(event.target.value))}>{products.map((item, position) => <option key={`${item.id}-${position}`} value={position}>{item.title}</option>)}</select></label>}
      {!canRecolor && <p className="gcc-alert" role="status">Add a garment mask to enable color previews. A mask protects the background, labels, and other details.</p>}
      {error && <div className="gcc-alert" role="alert">{error}<button type="button" onClick={retry}>Retry image processing</button></div>}
      <div className="gcc-color-heading"><span>Choose your color</span><span>{selectedName}</span></div>
      <ColorSwatchSelector colors={colors} selected={color} disabled={disabled} onSelect={select} />
      <CustomColorPicker value={color ?? original} draft={draft} invalid={!normalizeGarmentHex(draft)} disabled={disabled} onSelect={select} onDraft={(value) => { setDraft(value); const hex = normalizeGarmentHex(value); if (hex) { setColor(hex); onColorChange?.(hex, { productId: product.id, isOriginal: false }); } }} />
      <div className="gcc-summary"><span className="gcc-selected"><i style={{ background: color ?? original }} />Selected <code>{color ?? original}</code></span><button className="gcc-reset" type="button" disabled={color === null && draft === original} onClick={reset}><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 6a5 5 0 1 1-.1 4M3 2v4h4" stroke="currentColor" strokeWidth="1.3" /></svg>Reset to original</button></div>
      <div className="gcc-bottom"><span>Made for your everyday.</span><strong>Your shade. Your essential.</strong></div>
      <span className="gcc-sr" role="status" aria-live="polite">{error ? "Color preview unavailable." : !canRecolor ? "Garment mask required." : !ready ? "Preparing color preview." : `${selectedName} color selected: ${color ?? original}.`}</span>
    </div>
  </div>;
}

/** Browser-only color transformations with locally bundled garment photographs. */
export default function ClothingColorCustomizer({ productImage, garmentMask, productTitle = "Your everyday essential", description, initialColor, availableColors, products, recolorAllOpaquePixels = false, onColorChange, className = "" }: ClothingColorCustomizerProps) {
  const [index, setIndex] = useState(0);
  const isDemo = products === undefined && productImage === undefined;
  const catalog: readonly ClothingProduct[] = products ?? (productImage ? [{ id: "product", title: productTitle, description, productImage, garmentMask, initialColor, availableColors, recolorAllOpaquePixels }] : DEMO_PRODUCTS.map((product) => ({ ...product, availableColors, initialColor: initialColor ?? product.initialColor })));
  const activeIndex = Math.min(index, Math.max(0, catalog.length - 1));
  const product = catalog[activeIndex];
  return <section className={`gcc-root ${className}`} aria-label="Clothing color customizer">
    <ComponentStyles css={css} />
    <div className="gcc-top"><div className="gcc-brand">form<span>/ essentials</span></div><span className="gcc-top-note">A palette of possibilities</span></div>
    {product ? <GarmentSession key={JSON.stringify([product.id, product.productImage, product.garmentMask, product.initialColor, product.recolorAllOpaquePixels])} product={product} products={catalog} index={activeIndex} onProduct={(next) => { setIndex(next); const item = catalog[next]; if (item) onColorChange?.(normalizeGarmentHex(item.initialColor ?? "#D4D2CC") ?? "#D4D2CC", { productId: item.id, isOriginal: true }); }} onColorChange={onColorChange} isDemo={isDemo} /> : <p className="gcc-image-error">Add a clothing product to start customizing.</p>}
  </section>;
}

/** Inert artwork: the interactive preview performs the actual masked pixel processing. */
export function ClothingColorCustomizerThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const color = GARMENT_COLORS[Math.floor(previewStep / 40) % 4 + 3];
  const thumbnailMask = "/clothing-customizer/tee-mask.png";
  return <div className={`gcc-root gcc-thumbnail ${className}`} aria-hidden="true" inert>
    <ComponentStyles css={css} />
    <div className="gcc-top"><div className="gcc-brand">form<span>/ essentials</span></div><span className="gcc-top-note">Color studio</span></div>
    <div className="gcc-thumb-layout"><div className="gcc-thumb-image"><div className="gcc-thumb-photo"><img src={DEMO_PRODUCTS[0].productImage} alt="" /><div className="gcc-thumb-tint" style={{ background: color.hex, maskImage: `url("${thumbnailMask}")`, maskMode: "luminance", maskSize: "100% 100%", maskPosition: "center", maskRepeat: "no-repeat" }} /></div></div><div className="gcc-thumb-copy"><span>THE ESSENTIALS</span><h3>The everyday<br />tee.</h3><span>Choose your color / {color.name}</span><div className="gcc-thumb-swatches">{GARMENT_COLORS.slice(0, 5).map((item) => <i key={item.hex} style={{ background: item.hex }} />)}</div><div className="gcc-thumb-input">{color.hex}</div></div></div>
  </div>;
}
