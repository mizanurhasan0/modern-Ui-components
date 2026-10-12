"use client";

import { ComponentStyles } from "./component-styles";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

export interface NeumorphicNavItem {
  /** Unique key used for selection; it does not need to match a URL. */
  id: string;
  label: string;
  /** Supply a real URL to render a link; otherwise this is a selection button. */
  href?: string;
}

export interface NeumorphicNavbarProps {
  items?: readonly NeumorphicNavItem[];
  brand?: string;
  brandHref?: string;
  /** Uncontrolled initial selection. Defaults to the first item. */
  defaultActiveId?: string;
  /** Optional controlled selection. Update it in onNavigate. */
  activeId?: string;
  onNavigate?: (item: NeumorphicNavItem) => void;
  onBrandClick?: () => void;
  /** Set to null to hide the desktop action. */
  actionLabel?: string | null;
  actionHref?: string;
  onAction?: () => void;
  ariaLabel?: string;
  className?: string;
}

const DEFAULT_NAV_ITEMS: readonly NeumorphicNavItem[] = [
  { id: "home", label: "Home" },
  { id: "products", label: "Products" },
  { id: "pricing", label: "Pricing" },
  { id: "blog", label: "Blog" },
  { id: "contact", label: "Contact" },
];

function BrandMark() {
  return <span className="nn-brand-mark" aria-hidden="true"><span /></span>;
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M6 6h12M6 12h12M6 18h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** A soft raised navbar with a sliding desktop highlight and a mobile disclosure. */
export default function NeumorphicNavbar({
  items = DEFAULT_NAV_ITEMS,
  brand = "Brandly",
  brandHref,
  defaultActiveId,
  activeId,
  onNavigate,
  onBrandClick,
  actionLabel = "Get started",
  actionHref,
  onAction,
  ariaLabel = "Main navigation",
  className = "",
}: NeumorphicNavbarProps) {
  const [selectedId, setSelectedId] = useState(defaultActiveId ?? items[0]?.id);
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const desktopItemsRef = useRef(new Map<string, HTMLAnchorElement | HTMLButtonElement>());
  const requestedId = activeId ?? selectedId;
  const currentId = items.some((item) => item.id === requestedId) ? requestedId : items[0]?.id;

  // Measure the actual labels so custom text still gets a precisely sized highlight.
  // DOM-only updates avoid an extra render and preserve the sliding CSS transition.
  useLayoutEffect(() => {
    const track = trackRef.current;
    const highlight = highlightRef.current;
    if (!track || !highlight) return;
    const updateHighlight = () => {
      const item = currentId ? desktopItemsRef.current.get(currentId) : undefined;
      if (!item || !item.offsetWidth) {
        highlight.style.opacity = "0";
        return;
      }
      highlight.style.width = `${item.offsetWidth}px`;
      highlight.style.transform = `translateX(${item.offsetLeft}px)`;
      highlight.style.opacity = "1";
    };
    updateHighlight();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateHighlight);
    observer?.observe(track);
    for (const item of desktopItemsRef.current.values()) observer?.observe(item);
    window.addEventListener("resize", updateHighlight);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateHighlight);
    };
  }, [currentId, items]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !navRef.current?.contains(event.target)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsOpen(false);
      toggleRef.current?.focus();
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver((entries) => {
      if (entries[0]?.contentRect.width > 680) setIsOpen(false);
    });
    if (rootRef.current) observer?.observe(rootRef.current);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      observer?.disconnect();
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function selectItem(item: NeumorphicNavItem, fromMobile = false) {
    if (activeId === undefined) setSelectedId(item.id);
    if (fromMobile) {
      setIsOpen(false);
      toggleRef.current?.focus();
    }
    onNavigate?.(item);
  }

  function renderItem(item: NeumorphicNavItem, mobile = false) {
    const active = item.id === currentId;
    const shared = {
      className: mobile ? "nn-mobile-item" : "nn-item",
      "data-active": active,
      "aria-current": active ? "page" as const : undefined,
      onClick: () => selectItem(item, mobile),
      ref: mobile ? undefined : (element: HTMLAnchorElement | HTMLButtonElement | null) => {
        if (element) desktopItemsRef.current.set(item.id, element);
        else desktopItemsRef.current.delete(item.id);
      },
    };
    return item.href ? (
      <a key={item.id} {...shared} href={item.href}>{item.label}</a>
    ) : (
      <button key={item.id} {...shared} type="button" aria-pressed={active}>{item.label}</button>
    );
  }

  return (
    <div ref={rootRef} className={`nn-root w-full bg-[#e0e0e0] text-neutral-900 ${className}`}>
      <ComponentStyles css={NEUMORPHIC_NAVBAR_STYLES} />
      <div className="nn-stage">
        <nav ref={navRef} className="nn-navigation" aria-label={ariaLabel}>
          <div className="nn-navbar">
            {brandHref ? (
              <a className="nn-brand" href={brandHref} onClick={onBrandClick}>
                <BrandMark /><span>{brand}</span>
              </a>
            ) : onBrandClick ? (
              <button className="nn-brand" type="button" onClick={onBrandClick}>
                <BrandMark /><span>{brand}</span>
              </button>
            ) : (
              <span className="nn-brand"><BrandMark /><span>{brand}</span></span>
            )}
            <div ref={trackRef} className="nn-track">
              <span ref={highlightRef} className="nn-highlight" aria-hidden="true" />
              {items.map((item) => renderItem(item))}
            </div>
            {actionLabel && (
              <div className="nn-action-wrap">
                {actionHref ? (
                  <a className="nn-action" href={actionHref} onClick={onAction}>{actionLabel}</a>
                ) : (
                  <button className="nn-action" type="button" onClick={onAction}>{actionLabel}</button>
                )}
              </div>
            )}
            <button
              ref={toggleRef}
              className="nn-toggle"
              type="button"
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isOpen}
              aria-controls={menuId}
              onClick={() => setIsOpen((open) => !open)}
            >
              <MenuIcon />
            </button>
          </div>
          <div id={menuId} className="nn-mobile-panel" hidden={!isOpen}>
            {items.map((item) => renderItem(item, true))}
          </div>
        </nav>
      </div>
    </div>
  );
}

/** Homepage frames contain only inert artwork; the gallery controls playback. */
export function NeumorphicNavbarThumbnail({
  className = "",
  previewStep = 0,
}: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.max(0, Math.floor(previewStep)) % 12 : 0;
  const mobile = step >= 5;
  const open = step >= 6 && step <= 10;
  const index = mobile ? Math.max(0, step - 6) % DEFAULT_NAV_ITEMS.length : step;
  const highlightStyle = {
    width: `${100 / DEFAULT_NAV_ITEMS.length}%`,
    transform: `translateX(${index * 100}%)`,
    opacity: 1,
  } satisfies CSSProperties;

  return (
    <div className={`nn-root nn-thumbnail ${mobile ? "nn-thumbnail-mobile" : ""} w-full ${className}`} aria-hidden="true" inert>
      <ComponentStyles css={NEUMORPHIC_NAVBAR_STYLES} />
      <div className="nn-stage">
        <div className="nn-navigation">
          <div className="nn-navbar">
            <span className="nn-brand"><BrandMark /><span>Brandly</span></span>
            {!mobile && (
              <div className="nn-track">
                <span className="nn-highlight" style={highlightStyle} />
                {DEFAULT_NAV_ITEMS.map((item, itemIndex) => (
                  <span key={item.id} className="nn-item" data-active={itemIndex === index}>{item.label}</span>
                ))}
              </div>
            )}
            {mobile ? <span className="nn-toggle"><MenuIcon /></span> : (
              <span className="nn-action-wrap"><span className="nn-action">Get started</span></span>
            )}
          </div>
          {mobile && open && (
            <div className="nn-mobile-panel">
              {DEFAULT_NAV_ITEMS.map((item, itemIndex) => (
                <span key={item.id} className="nn-mobile-item" data-active={itemIndex === index}>{item.label}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const NEUMORPHIC_NAVBAR_STYLES = `
.nn-root{--nn-surface:#e0e0e0;--nn-shadow:#bcbcbc;--nn-light:#fff;container:neumorphic-navbar / inline-size;min-width:0;width:100%;background:var(--nn-surface);color:#202020;font-family:Arial,Helvetica,sans-serif}
.nn-root *{box-sizing:border-box}
.nn-root button,.nn-root a{font-family:inherit;-webkit-tap-highlight-color:transparent}
.nn-stage{min-height:460px;padding:22px 18px 40px}
.nn-navigation{width:100%;max-width:1100px;margin:0 auto}
.nn-navbar{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:14px;min-height:62px;padding:10px 12px;border-radius:999px;background:var(--nn-surface);box-shadow:8px 8px 18px var(--nn-shadow),-8px -8px 18px var(--nn-light)}
.nn-brand{display:inline-flex;align-items:center;gap:10px;min-width:0;width:fit-content;max-width:100%;padding:0;border:0;background:transparent;color:#161616;font-size:16px;font-weight:700;line-height:1.1;text-decoration:none}
.nn-brand>span:last-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nn-brand-mark{display:grid;place-items:center;flex:0 0 36px;width:36px;height:36px;border-radius:50%;background:var(--nn-surface);box-shadow:4px 4px 8px var(--nn-shadow),-4px -4px 8px var(--nn-light)}
.nn-brand-mark>span{width:10px;height:10px;border-radius:50%;background:#ff7a45;box-shadow:0 0 0 1px rgba(255,122,69,.08)}
.nn-track{position:relative;isolation:isolate;display:flex;align-items:center;min-width:0;padding:5px;border-radius:999px;background:var(--nn-surface);box-shadow:inset 4px 4px 8px var(--nn-shadow),inset -4px -4px 8px var(--nn-light)}
.nn-highlight{position:absolute;z-index:0;left:0;top:5px;bottom:5px;width:0;opacity:0;border-radius:999px;background:var(--nn-surface);box-shadow:4px 4px 8px var(--nn-shadow),-4px -4px 8px var(--nn-light);pointer-events:none;transition:transform .32s cubic-bezier(.2,.8,.2,1),width .32s cubic-bezier(.2,.8,.2,1),opacity .12s ease}
.nn-item{position:relative;z-index:1;display:block;flex:0 0 auto;border:0;border-radius:999px;padding:10px 15px;background:transparent;color:#626262;font-size:13px;line-height:1;white-space:nowrap;text-decoration:none;cursor:pointer;transition:color .2s ease}
.nn-item[data-active=true],.nn-mobile-item[data-active=true]{color:#202020}
.nn-item:hover,.nn-mobile-item:hover{color:#202020}
.nn-action-wrap{display:flex;justify-content:flex-end;min-width:0}
.nn-action{display:block;max-width:100%;padding:12px 18px;border:0;border-radius:999px;background:var(--nn-surface);color:#202020;font-size:12px;font-weight:700;line-height:1;white-space:nowrap;text-decoration:none;cursor:pointer;box-shadow:4px 4px 8px var(--nn-shadow),-4px -4px 8px var(--nn-light);transition:box-shadow .18s ease}
.nn-action:active,.nn-toggle:active{box-shadow:inset 3px 3px 6px var(--nn-shadow),inset -3px -3px 6px var(--nn-light)}
.nn-toggle{display:none;place-items:center;justify-self:end;flex:0 0 36px;width:36px;height:36px;padding:0;border:0;border-radius:50%;background:var(--nn-surface);color:#333;cursor:pointer;box-shadow:4px 4px 8px var(--nn-shadow),-4px -4px 8px var(--nn-light)}
.nn-root :is(a,button):focus-visible{outline:2px solid #c44817;outline-offset:3px}
.nn-mobile-panel{display:none;margin-top:18px;padding:10px;border-radius:28px;background:var(--nn-surface);box-shadow:8px 8px 18px var(--nn-shadow),-8px -8px 18px var(--nn-light);animation:nn-menu-enter .2s ease both}
.nn-mobile-panel[hidden]{display:none!important}
.nn-mobile-item{display:block;width:100%;padding:12px 16px;border:0;border-radius:999px;background:transparent;color:#626262;font-size:14px;line-height:1;text-align:left;text-decoration:none;cursor:pointer;transition:color .18s ease,box-shadow .18s ease}
.nn-mobile-item[data-active=true]{box-shadow:inset 4px 4px 8px var(--nn-shadow),inset -4px -4px 8px var(--nn-light)}
@keyframes nn-menu-enter{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
@container neumorphic-navbar (max-width:680px){
.nn-root:not(.nn-thumbnail) .nn-stage{padding:22px 18px 40px}
.nn-root:not(.nn-thumbnail) .nn-navbar{grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:10px 12px}
.nn-root:not(.nn-thumbnail) .nn-track,.nn-root:not(.nn-thumbnail) .nn-action-wrap{display:none}
.nn-root:not(.nn-thumbnail) .nn-toggle{display:grid}
.nn-root:not(.nn-thumbnail) .nn-mobile-panel{display:block}
}
.nn-thumbnail{height:100%;min-height:0;overflow:hidden}
.nn-thumbnail .nn-stage{min-height:0;height:100%;padding:40px 16px 20px}
.nn-thumbnail .nn-navbar{min-height:46px;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:7px;padding:8px;border-radius:30px;box-shadow:6px 6px 13px var(--nn-shadow),-6px -6px 13px var(--nn-light)}
.nn-thumbnail .nn-brand{gap:6px;font-size:clamp(9px,2.3cqw,13px)}
.nn-thumbnail .nn-brand-mark{flex-basis:24px;width:24px;height:24px;box-shadow:3px 3px 6px var(--nn-shadow),-3px -3px 6px var(--nn-light)}
.nn-thumbnail .nn-brand-mark>span{width:7px;height:7px}
.nn-thumbnail .nn-track{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));padding:0;min-width:0;width:clamp(155px,43cqw,250px);height:29px}
.nn-thumbnail .nn-highlight{top:2px;bottom:2px}
.nn-thumbnail .nn-item{padding:0 3px;text-align:center;font-size:clamp(7px,1.85cqw,10px);cursor:default}
.nn-thumbnail .nn-action{padding:9px 11px;font-size:clamp(7px,1.85cqw,10px);cursor:default}
.nn-thumbnail-mobile .nn-navigation{max-width:280px}
.nn-thumbnail-mobile .nn-navbar{grid-template-columns:minmax(0,1fr) auto}
.nn-thumbnail-mobile .nn-brand{font-size:13px}
.nn-thumbnail-mobile .nn-toggle{display:grid;width:28px;height:28px;cursor:default}
.nn-thumbnail-mobile .nn-mobile-panel{display:block;margin-top:15px;padding:8px;border-radius:22px}
.nn-thumbnail-mobile .nn-mobile-item{font-size:11px;padding:10px 12px;cursor:default}
@media(prefers-reduced-motion:reduce){.nn-highlight,.nn-item,.nn-mobile-item,.nn-action{transition:none}.nn-mobile-panel{animation:none}}
`;
