"use client";

import { ComponentStyles } from "./component-styles";

import type { CSSProperties, ReactNode } from "react";

export interface IsometricSocialLink {
  /** Stable key for the link. */
  id: string;
  /** Accessible name, e.g. "Facebook". */
  label: string;
  href: string;
  /** Background of the raised layers on hover / focus. */
  color: string;
  /** Icon drawn on every layer; use `currentColor` so it inherits the white glyph colour. */
  icon: ReactNode;
}

export interface IsometricSocialIconsProps {
  links?: IsometricSocialLink[];
  className?: string;
  /** Number of stacked layers per tile (2–8). */
  layers?: number;
  /** Open links in a new tab. */
  newTab?: boolean;
}

const DEFAULT_LAYERS = 5;
const MIN_LAYERS = 2;
const MAX_LAYERS = 8;

/** Square 24×24 brand glyph that inherits the tile's text colour. */
function BrandIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export const DEFAULT_ISOMETRIC_SOCIAL_LINKS: IsometricSocialLink[] = [
  {
    id: "facebook",
    label: "Facebook",
    href: "https://facebook.com",
    color: "#52e19f",
    icon: <BrandIcon><path d="M13.6 23v-9.8h3.3l.5-3.9h-3.8V6.9c0-1.1.3-1.9 1.9-1.9h2V1.5c-.35-.05-1.55-.15-2.95-.15-2.9 0-4.9 1.8-4.9 5.05v2.9H6.4v3.9h3.25V23h3.95Z" /></BrandIcon>,
  },
  {
    id: "twitter",
    label: "Twitter",
    href: "https://twitter.com",
    color: "#2c3456",
    icon: <BrandIcon><path d="M23.953 4.57a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 0 0-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 0 0-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 0 1-2.228-.616v.06a4.923 4.923 0 0 0 3.946 4.827 4.996 4.996 0 0 1-2.212.085 4.936 4.936 0 0 0 4.604 3.417 9.867 9.867 0 0 1-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0 0 7.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0 0 24 4.59Z" /></BrandIcon>,
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://instagram.com",
    color: "#ea6e96",
    icon: (
      <BrandIcon>
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <circle cx="17.6" cy="6.4" r="1.4" />
      </BrandIcon>
    ),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://linkedin.com",
    color: "#fceb00",
    icon: <BrandIcon><path d="M5.1 3.2a2.1 2.1 0 1 1-4.2 0 2.1 2.1 0 0 1 4.2 0ZM1.2 7h3.7v14.8H1.2V7Zm6 0h3.55v2.02h.05c.5-.95 1.7-2 3.5-2 3.75 0 4.45 2.47 4.45 5.68v9.1h-3.7v-8.07c0-1.93-.03-4.4-2.68-4.4-2.68 0-3.09 2.1-3.09 4.27v8.2H7.2V7Z" /></BrandIcon>,
  },
];

/** Integer layer count within the supported range; invalid input falls back to the default. */
function clampLayers(layers: number) {
  if (!Number.isFinite(layers)) return DEFAULT_LAYERS;
  return Math.min(MAX_LAYERS, Math.max(MIN_LAYERS, Math.round(layers)));
}

/*
 * Geometry: the list is drawn in a plane turned by rotate(-25deg) skew(25deg). In that plane a
 * straight-down screen offset maps to (-0.9326, 1) per unit, so the two side faces are skewed
 * by atan(0.9326) = 43deg and its complement 47deg to read as one solid slab under each tile.
 * Fast lift (.3s) on hover / focus, slow 1.5s ease-out settle when released.
 */
const STAGE_CLASS =
  "iso-stage relative isolate box-border flex w-full min-w-0 items-center justify-center overflow-hidden bg-(--iso-bg) text-white [--iso-bg:#00071c] [--iso-tile:#2a2a2a] @container";

/** Tile size drives the slab depth, the lift per plate and the gap between tiles. */
const LIST_CLASS =
  "iso-list m-0 flex list-none gap-[calc(var(--iso-size)*2/3)] p-0 [--iso-depth:calc(var(--iso-size)/6)] [--iso-step:calc(var(--iso-size)/6)] [transform:rotate(-25deg)_skew(25deg)]";

/** Each tile carries its two shaded side faces as pseudo-elements. */
const ITEM_CLASS =
  "iso-item relative m-0 size-(--iso-size) flex-none " +
  "before:absolute before:top-full before:left-0 before:h-(--iso-depth) before:w-full before:origin-top before:-skew-x-43 before:bg-[#232323] before:content-[''] " +
  "after:absolute after:top-0 after:right-full after:h-full after:w-[calc(var(--iso-depth)*.9326)] after:origin-right after:-skew-y-47 after:bg-[#1d1d1d] after:content-['']";

/** z-index drops back only after the 1.5s settle, so a falling stack stays above its neighbours. */
const LINK_CLASS =
  "iso-link group/link absolute inset-0 block text-white no-underline [-webkit-tap-highlight-color:transparent] transition-[z-index] duration-0 ease-linear motion-reduce:[transition:none]";
const LINK_RESTING_CLASS = "z-0 delay-1500";
const LINK_RAISED_CLASS = "iso-link--raised z-2 delay-0";

const LAYER_CLASS =
  "iso-layer absolute inset-0 flex items-center justify-center bg-(--iso-tile) [transform:translate(0,0)] transition-[transform,opacity,background-color,box-shadow] duration-1500 ease-[ease-out] motion-reduce:[transition:none] " +
  "group-focus-visible/link:last:outline-2 group-focus-visible/link:last:outline-offset-4 group-focus-visible/link:last:outline-white";

const GLYPH_CLASS = "iso-glyph pointer-events-none flex size-[46%] [&_svg]:size-full [&_svg]:fill-current";

/** The identical stacked plates of one tile; `--iso-i` drives each plate's lift and opacity. */
function Layers({ count, icon }: { count: number; icon: ReactNode }) {
  return Array.from({ length: count }, (_, index) => (
    <span key={index} className={LAYER_CLASS} style={{ "--iso-i": index } as CSSProperties} aria-hidden="true">
      <span className={GLYPH_CLASS}>{icon}</span>
    </span>
  ));
}

/** Isometric row of social tiles that fan out into a coloured stack on hover or keyboard focus. */
export default function IsometricSocialIcons({
  links = DEFAULT_ISOMETRIC_SOCIAL_LINKS,
  className = "",
  layers = DEFAULT_LAYERS,
  newTab = true,
}: IsometricSocialIconsProps) {
  const count = clampLayers(layers);

  return (
    <div className={`${STAGE_CLASS} min-h-[520px] px-4 py-12 ${className}`}>
      <ComponentStyles css={ISOMETRIC_SOCIAL_CSS} />
      <nav className="iso-nav flex w-full justify-center" aria-label="Social media">
        <ul
          className={`${LIST_CLASS} [--iso-size:min(15cqw,clamp(88px,9cqw,144px))] [@container(max-width:320px)]:grid [@container(max-width:320px)]:grid-cols-[repeat(2,var(--iso-size))] [@container(max-width:320px)]:[--iso-size:min(88px,19cqw)]`}
          style={{ "--iso-n": count } as CSSProperties}
        >
          {links.map((link) => (
            <li key={link.id} className={ITEM_CLASS}>
              <a
                className={`${LINK_CLASS} ${LINK_RESTING_CLASS} hover:z-2 hover:delay-0 focus-visible:z-2 focus-visible:delay-0`}
                href={link.href}
                style={{ "--iso-color": link.color } as CSSProperties}
                aria-label={newTab ? `${link.label} (opens in a new tab)` : link.label}
                target={newTab ? "_blank" : undefined}
                rel={newTab ? "noopener noreferrer" : undefined}
              >
                <Layers count={count} icon={link.icon} />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** Inert gallery artwork: steps raise Facebook → Twitter → Instagram → LinkedIn, then rest. */
export function IsometricSocialIconsThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const links = DEFAULT_ISOMETRIC_SOCIAL_LINKS;
  const step = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) % (links.length + 1) : 0;

  return (
    <div className={`${STAGE_CLASS} iso-thumbnail aspect-video h-full min-h-0 p-3 ${className}`} aria-hidden="true" inert>
      <ComponentStyles css={ISOMETRIC_SOCIAL_CSS} />
      <div className="iso-nav flex w-full justify-center">
        <div className={`${LIST_CLASS} [--iso-size:min(88px,10.5cqw)]`} style={{ "--iso-n": DEFAULT_LAYERS } as CSSProperties}>
          {links.map((link, index) => (
            <div key={link.id} className={ITEM_CLASS}>
              <span
                className={`${LINK_CLASS} ${index === step ? LINK_RAISED_CLASS : LINK_RESTING_CLASS}`}
                style={{ "--iso-color": link.color } as CSSProperties}
              >
                <Layers count={DEFAULT_LAYERS} icon={link.icon} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/*
 * Kept as CSS: the link's focus ring is drawn on its top plate instead, and this reset has to beat
 * unlayered global :focus-visible rules that a utility class cannot. The raised state computes each
 * plate's colour, opacity and offset from the tile (--iso-color, --iso-n) and its own index (--iso-i)
 * whenever the parent link is hovered, keyboard-focused or raised by the gallery thumbnail.
 */
const ISOMETRIC_SOCIAL_CSS = `
.iso-stage .iso-link { outline: none; }
.iso-stage .iso-link:is(:hover, :focus-visible) .iso-layer, .iso-stage .iso-link--raised .iso-layer { background: var(--iso-color); opacity: calc((var(--iso-i) + 1) / var(--iso-n)); transform: translate(calc(var(--iso-i) * var(--iso-step)), calc(var(--iso-i) * var(--iso-step) * -1)); box-shadow: -1px 1px 1px rgba(0, 0, 0, .5); transition-duration: .3s; transition-timing-function: ease; }
`;
