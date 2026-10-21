"use client";

import { ComponentStyles } from "./component-styles";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

export interface NeumorphicNavItem {
  /** Unique key used for selection; it does not need to match a URL. */
  id: string;
  label: string;
  /** Supply a real URL to render a link; otherwise this is a selection button. */
  href?: string;
}

/** Surface colors for the raised and pressed shadows; keep `surface` equal to the page behind. */
export interface NeumorphicPalette {
  surface: string;
  shadow: string;
  light: string;
}

export interface NeumorphicNavbarProps {
  items?: readonly NeumorphicNavItem[];
  /** Text or a custom wordmark. */
  brand?: ReactNode;
  /** Replaces the default orange dot mark, for example with your logo. */
  brandMark?: ReactNode;
  brandHref?: string;
  /** Uncontrolled initial selection. Defaults to the first item. */
  defaultActiveId?: string;
  /** Optional controlled selection. Update it in onNavigate. */
  activeId?: string;
  onNavigate?: (item: NeumorphicNavItem) => void;
  onBrandClick?: () => void;
  /** Set to null to hide the desktop action. */
  actionLabel?: string | null;
  /** Decorative icon shown before the action label. */
  actionIcon?: ReactNode;
  actionHref?: string;
  onAction?: () => void;
  ariaLabel?: string;
  /** Render only the bar, without the demo stage around it (for use as a site header). */
  embedded?: boolean;
  palette?: NeumorphicPalette;
  /** Link element for hrefs, such as Next.js `Link`, so navigation stays client-side. */
  linkAs?: ElementType;
  className?: string;
}

const DEFAULT_NAV_ITEMS: readonly NeumorphicNavItem[] = [
  { id: "home", label: "Home" },
  { id: "products", label: "Products" },
  { id: "pricing", label: "Pricing" },
  { id: "blog", label: "Blog" },
  { id: "contact", label: "Contact" },
];

/*
 * Styling is Tailwind-first. Shared surface tokens live on the root as custom properties
 * (--nn-surface, --nn-shadow, --nn-light). The `[@container_neumorphic-navbar_(max-width:680px)]`
 * variant keeps the original inclusive breakpoint (Tailwind's `@max-*` variants are exclusive)
 * and matches the menu's ResizeObserver, which closes it above 680px. Only the menu keyframes
 * remain in raw CSS. The nn-* class names are kept as readable hooks.
 */
const RAISED_SHADOW = "shadow-[4px_4px_8px_var(--nn-shadow),-4px_-4px_8px_var(--nn-light)]";
const PRESSED_SHADOW = "shadow-[inset_4px_4px_8px_var(--nn-shadow),inset_-4px_-4px_8px_var(--nn-light)]";
const PRESSED_ON_ACTIVE = "active:shadow-[inset_3px_3px_6px_var(--nn-shadow),inset_-3px_-3px_6px_var(--nn-light)]";
// Shared by every link and button. `!` lets the focus ring beat the site-wide unlayered
// :focus-visible outline, as the old raw rule did.
const INTERACTIVE = "[-webkit-tap-highlight-color:transparent] focus-visible:outline-2! focus-visible:outline-[#c44817]! focus-visible:outline-offset-[3px]!";
const ROOT = "@container/neumorphic-navbar w-full min-w-0 bg-(--nn-surface) font-[family-name:Arial,Helvetica,sans-serif] text-[#202020] [--nn-light:#fff] [--nn-shadow:#bcbcbc] [--nn-surface:#e0e0e0]";
const NAVBAR = "relative grid items-center bg-(--nn-surface)";
const BRAND = "inline-flex w-fit min-w-0 max-w-full items-center border-0 bg-transparent p-0 font-bold leading-[1.1] text-[#161616] no-underline";
const TRACK = `relative isolate min-w-0 items-center rounded-[999px] bg-(--nn-surface) ${PRESSED_SHADOW}`;
const HIGHLIGHT = `pointer-events-none absolute left-0 z-0 w-0 rounded-[999px] bg-(--nn-surface) opacity-0 ${RAISED_SHADOW} [transition:transform_.32s_cubic-bezier(.2,.8,.2,1),width_.32s_cubic-bezier(.2,.8,.2,1),opacity_.12s_ease] motion-reduce:[transition:none]`;
const ITEM = "relative z-[1] block flex-[0_0_auto] rounded-[999px] border-0 bg-transparent leading-none whitespace-nowrap text-[#626262] no-underline [transition:color_.2s_ease] hover:text-[#202020] data-[active=true]:text-[#202020] motion-reduce:[transition:none]";
const ACTION = `flex max-w-full items-center gap-2 rounded-[999px] border-0 bg-(--nn-surface) font-bold leading-none whitespace-nowrap text-[#202020] no-underline ${RAISED_SHADOW} [transition:box-shadow_.18s_ease] motion-reduce:[transition:none]`;
const TOGGLE = `flex-[0_0_36px] place-items-center rounded-[50%] [justify-self:end] border-0 bg-(--nn-surface) p-0 text-[#333] ${RAISED_SHADOW}`;
const PANEL = "bg-(--nn-surface) shadow-[8px_8px_18px_var(--nn-shadow),-8px_-8px_18px_var(--nn-light)] animate-[nn-menu-enter_.2s_ease_both] motion-reduce:animate-none";
const MOBILE_ITEM = `block w-full rounded-[999px] border-0 bg-transparent text-left leading-none text-[#626262] no-underline [transition:color_.18s_ease,box-shadow_.18s_ease] hover:text-[#202020] data-[active=true]:text-[#202020] data-[active=true]:shadow-[inset_4px_4px_8px_var(--nn-shadow),inset_-4px_-4px_8px_var(--nn-light)] motion-reduce:[transition:none]`;
const ACTION_CONTROL = `nn-action ${ACTION} ${INTERACTIVE} cursor-pointer px-[18px] py-3 text-[12px] ${PRESSED_ON_ACTIVE}`;

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={compact
        ? "nn-brand-mark grid size-6 flex-[0_0_24px] place-items-center rounded-[50%] bg-(--nn-surface) shadow-[3px_3px_6px_var(--nn-shadow),-3px_-3px_6px_var(--nn-light)]"
        : `nn-brand-mark grid size-9 flex-[0_0_36px] place-items-center rounded-[50%] bg-(--nn-surface) ${RAISED_SHADOW}`}
      aria-hidden="true"
    >
      <span className={`${compact ? "size-[7px]" : "size-[10px]"} rounded-[50%] bg-[#ff7a45] shadow-[0_0_0_1px_rgba(255,122,69,.08)]`} />
    </span>
  );
}

function BrandLabel({ children }: { children: ReactNode }) {
  return <span className="min-w-0 truncate">{children}</span>;
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
  actionIcon,
  actionHref,
  onAction,
  ariaLabel = "Main navigation",
  embedded = false,
  palette,
  linkAs: Link = "a",
  brandMark,
  className = "",
}: NeumorphicNavbarProps) {
  const mark = brandMark ?? <BrandMark />;
  const paletteStyle = palette
    ? ({ "--nn-surface": palette.surface, "--nn-shadow": palette.shadow, "--nn-light": palette.light } as CSSProperties)
    : undefined;
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
      className: mobile
        ? `nn-mobile-item ${MOBILE_ITEM} ${INTERACTIVE} cursor-pointer px-4 py-3 text-[14px]`
        : `nn-item ${ITEM} ${INTERACTIVE} cursor-pointer px-[15px] py-[10px] text-[13px]`,
      "data-active": active,
      "aria-current": active ? "page" as const : undefined,
      onClick: () => selectItem(item, mobile),
      ref: mobile ? undefined : (element: HTMLAnchorElement | HTMLButtonElement | null) => {
        if (element) desktopItemsRef.current.set(item.id, element);
        else desktopItemsRef.current.delete(item.id);
      },
    };
    return item.href ? (
      <Link key={item.id} {...shared} href={item.href}>{item.label}</Link>
    ) : (
      <button key={item.id} {...shared} type="button" aria-pressed={active}>{item.label}</button>
    );
  }

  return (
    <div ref={rootRef} className={`nn-root ${ROOT} ${className}`} style={paletteStyle}>
      <ComponentStyles css={NEUMORPHIC_NAVBAR_STYLES} />
      <div className={embedded ? "nn-stage relative" : "nn-stage min-h-[460px] px-[18px] pt-[22px] pb-10 in-data-[fullscreen=true]:pt-[72px]"}>
        <nav ref={navRef} className={`nn-navigation relative mx-auto w-full ${embedded ? "" : "max-w-[1100px]"}`} aria-label={ariaLabel}>
          <div className={`nn-navbar ${NAVBAR} min-h-[62px] rounded-[999px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-[14px] px-3 py-[10px] shadow-[8px_8px_18px_var(--nn-shadow),-8px_-8px_18px_var(--nn-light)] [@container_neumorphic-navbar_(max-width:680px)]:grid-cols-[minmax(0,1fr)_auto] [@container_neumorphic-navbar_(max-width:680px)]:gap-[10px]`}>
            {brandHref ? (
              <Link className={`nn-brand ${BRAND} ${INTERACTIVE} gap-[10px] text-[16px]`} href={brandHref} onClick={onBrandClick}>
                {mark}<BrandLabel>{brand}</BrandLabel>
              </Link>
            ) : onBrandClick ? (
              <button className={`nn-brand ${BRAND} ${INTERACTIVE} gap-[10px] text-[16px]`} type="button" onClick={onBrandClick}>
                {mark}<BrandLabel>{brand}</BrandLabel>
              </button>
            ) : (
              <span className={`nn-brand ${BRAND} gap-[10px] text-[16px]`}>{mark}<BrandLabel>{brand}</BrandLabel></span>
            )}
            <div ref={trackRef} className={`nn-track ${TRACK} flex p-[5px] [@container_neumorphic-navbar_(max-width:680px)]:hidden`}>
              <span ref={highlightRef} className={`nn-highlight ${HIGHLIGHT} top-[5px] bottom-[5px]`} aria-hidden="true" />
              {items.map((item) => renderItem(item))}
            </div>
            {actionLabel && (
              <div className="nn-action-wrap flex min-w-0 justify-end [@container_neumorphic-navbar_(max-width:680px)]:hidden">
                {actionHref ? (
                  <Link className={ACTION_CONTROL} href={actionHref} onClick={onAction}>{actionIcon}{actionLabel}</Link>
                ) : (
                  <button className={ACTION_CONTROL} type="button" onClick={onAction}>{actionIcon}{actionLabel}</button>
                )}
              </div>
            )}
            <button
              ref={toggleRef}
              className={`nn-toggle ${TOGGLE} ${INTERACTIVE} hidden size-9 cursor-pointer ${PRESSED_ON_ACTIVE} [@container_neumorphic-navbar_(max-width:680px)]:grid`}
              type="button"
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isOpen}
              aria-controls={menuId}
              onClick={() => setIsOpen((open) => !open)}
            >
              <MenuIcon />
            </button>
          </div>
          <div id={menuId} className={`nn-mobile-panel ${PANEL} ${embedded ? "absolute inset-x-0 top-full z-10 mt-3" : "mt-[18px]"} hidden rounded-[28px] p-[10px] [@container_neumorphic-navbar_(max-width:680px)]:block`} hidden={!isOpen}>
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
    <div className={`nn-root nn-thumbnail ${mobile ? "nn-thumbnail-mobile" : ""} ${ROOT} h-full min-h-0 overflow-hidden ${className}`} aria-hidden="true" inert>
      <ComponentStyles css={NEUMORPHIC_NAVBAR_STYLES} />
      <div className="nn-stage h-full min-h-0 px-4 pt-10 pb-5">
        <div className={`nn-navigation mx-auto w-full ${mobile ? "max-w-[280px]" : "max-w-[1100px]"}`}>
          <div className={`nn-navbar ${NAVBAR} min-h-[46px] gap-[7px] rounded-[30px] p-2 shadow-[6px_6px_13px_var(--nn-shadow),-6px_-6px_13px_var(--nn-light)] ${mobile ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"}`}>
            <span className={`nn-brand ${BRAND} gap-[6px] ${mobile ? "text-[13px]" : "text-[length:clamp(9px,2.3cqw,13px)]"}`}>
              <BrandMark compact /><BrandLabel>Brandly</BrandLabel>
            </span>
            {!mobile && (
              <div className={`nn-track ${TRACK} grid h-[29px] w-[clamp(155px,43cqw,250px)] grid-cols-5 p-0`}>
                <span className={`nn-highlight ${HIGHLIGHT} top-[2px] bottom-[2px]`} style={highlightStyle} />
                {DEFAULT_NAV_ITEMS.map((item, itemIndex) => (
                  <span
                    key={item.id}
                    className={`nn-item ${ITEM} cursor-default px-[3px] py-0 text-center text-[length:clamp(7px,1.85cqw,10px)]`}
                    data-active={itemIndex === index}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            )}
            {mobile ? <span className={`nn-toggle ${TOGGLE} grid size-7 cursor-default`}><MenuIcon /></span> : (
              <span className="nn-action-wrap flex min-w-0 justify-end">
                <span className={`nn-action ${ACTION} cursor-default px-[11px] py-[9px] text-[length:clamp(7px,1.85cqw,10px)]`}>Get started</span>
              </span>
            )}
          </div>
          {mobile && open && (
            <div className={`nn-mobile-panel ${PANEL} mt-[15px] block rounded-[22px] p-2`}>
              {DEFAULT_NAV_ITEMS.map((item, itemIndex) => (
                <span
                  key={item.id}
                  className={`nn-mobile-item ${MOBILE_ITEM} cursor-default px-3 py-[10px] text-[11px]`}
                  data-active={itemIndex === index}
                >
                  {item.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const NEUMORPHIC_NAVBAR_STYLES = `
@keyframes nn-menu-enter{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
`;
