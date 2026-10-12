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

/** The identical stacked plates of one tile; `--iso-i` drives each plate's lift and opacity. */
function Layers({ count, icon }: { count: number; icon: ReactNode }) {
  return Array.from({ length: count }, (_, index) => (
    <span key={index} className="iso-layer" style={{ "--iso-i": index } as CSSProperties} aria-hidden="true">
      <span className="iso-glyph">{icon}</span>
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
    <div className={`iso-stage ${className}`}>
      <ComponentStyles css={ISOMETRIC_SOCIAL_CSS} />
      <nav className="iso-nav" aria-label="Social media">
        <ul className="iso-list" style={{ "--iso-n": count } as CSSProperties}>
          {links.map((link) => (
            <li key={link.id} className="iso-item">
              <a
                className="iso-link"
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
    <div className={`iso-stage iso-thumbnail ${className}`} aria-hidden="true" inert>
      <ComponentStyles css={ISOMETRIC_SOCIAL_CSS} />
      <div className="iso-nav">
        <div className="iso-list" style={{ "--iso-n": DEFAULT_LAYERS } as CSSProperties}>
          {links.map((link, index) => (
            <div key={link.id} className="iso-item">
              <span
                className={`iso-link${index === step ? " iso-link--raised" : ""}`}
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
 * Geometry: the list is drawn in a plane turned by rotate(-25deg) skew(25deg). In that plane a
 * straight-down screen offset maps to (-0.9326, 1) per unit, so the two side faces are skewed
 * by atan(0.9326) = 43deg and its complement 47deg to read as one solid slab under each tile.
 * Fast lift (.3s) on hover / focus, slow 1.5s ease-out settle when released.
 */
const ISOMETRIC_SOCIAL_CSS = `
.iso-stage { --iso-bg: #00071c; --iso-tile: #2a2a2a; position: relative; isolation: isolate; box-sizing: border-box; display: flex; align-items: center; justify-content: center; width: 100%; min-width: 0; min-height: 520px; padding: 48px 16px; overflow: hidden; background: var(--iso-bg); color: #fff; container-type: inline-size; }
.iso-stage *, .iso-stage *::before, .iso-stage *::after { box-sizing: border-box; }
.iso-stage .iso-nav { display: flex; justify-content: center; width: 100%; }

.iso-stage .iso-list { --iso-size: min(88px, 15cqw); --iso-depth: calc(var(--iso-size) / 6); --iso-step: calc(var(--iso-size) / 6); display: flex; gap: calc(var(--iso-size) * 2 / 3); margin: 0; padding: 0; list-style: none; transform: rotate(-25deg) skew(25deg); }
.iso-stage .iso-item { position: relative; flex: none; width: var(--iso-size); height: var(--iso-size); margin: 0; }
.iso-stage .iso-item::before { content: ""; position: absolute; top: 100%; left: 0; width: 100%; height: var(--iso-depth); background: #232323; transform-origin: top; transform: skewX(-43deg); }
.iso-stage .iso-item::after { content: ""; position: absolute; top: 0; right: 100%; width: calc(var(--iso-depth) * .9326); height: 100%; background: #1d1d1d; transform-origin: right; transform: skewY(-47deg); }

.iso-stage .iso-link { position: absolute; inset: 0; z-index: 0; display: block; color: #fff; text-decoration: none; outline: none; -webkit-tap-highlight-color: transparent; transition: z-index 0s linear 1.5s; }
.iso-stage .iso-layer { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: var(--iso-tile); transform: translate(0, 0); transition: transform 1.5s ease-out, opacity 1.5s ease-out, background-color 1.5s ease-out, box-shadow 1.5s ease-out; }
.iso-stage .iso-glyph { display: flex; width: 46%; height: 46%; pointer-events: none; }
.iso-stage .iso-glyph svg { width: 100%; height: 100%; fill: currentColor; }

.iso-stage .iso-link:is(:hover, :focus-visible), .iso-stage .iso-link--raised { z-index: 2; transition-delay: 0s; }
.iso-stage .iso-link:is(:hover, :focus-visible) .iso-layer, .iso-stage .iso-link--raised .iso-layer { background: var(--iso-color); opacity: calc((var(--iso-i) + 1) / var(--iso-n)); transform: translate(calc(var(--iso-i) * var(--iso-step)), calc(var(--iso-i) * var(--iso-step) * -1)); box-shadow: -1px 1px 1px rgba(0, 0, 0, .5); transition-duration: .3s; transition-timing-function: ease; }
.iso-stage .iso-link:focus-visible .iso-layer:last-child { outline: 2px solid #fff; outline-offset: 4px; }

.iso-stage.iso-thumbnail { height: 100%; min-height: 0; aspect-ratio: 16 / 9; padding: 12px; }
.iso-stage.iso-thumbnail .iso-list { --iso-size: min(88px, 10.5cqw); }

@container (max-width: 320px) {
  .iso-stage:not(.iso-thumbnail) .iso-list { --iso-size: min(88px, 19cqw); display: grid; grid-template-columns: repeat(2, var(--iso-size)); }
}
@media (prefers-reduced-motion: reduce) {
  .iso-stage .iso-link, .iso-stage .iso-layer { transition: none; }
}
`;
