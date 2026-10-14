"use client";

/* eslint-disable @next/next/no-img-element -- Reference artwork is embedded in portable source. */

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
import { ComponentStyles } from "./component-styles";

export interface ChromeProfileLayer {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  /** Depth during the turn. Flat resting geometry remains unchanged. */
  depth?: number;
}

export interface ChromeProfileSlide {
  id: string;
  name: string;
  background: string;
  color: string;
  panel: [number, number, number, number];
  headings: [string, number, number][];
  layers: ChromeProfileLayer[];
}

export interface ChromeProfileCarouselProps {
  slides?: readonly ChromeProfileSlide[];
  initialIndex?: number;
  autoPlay?: boolean;
  interval?: number;
  onProfileChange?: (profile: ChromeProfileSlide) => void;
  onLayerSelect?: (layer: ChromeProfileLayer, profile: ChromeProfileSlide) => void;
  className?: string;
}

const REFERENCE_WIDTH = 720;
const REFERENCE_HEIGHT = 810;
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeMotion(notify: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}
function subscribeVisibility(notify: () => void) {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
}
const reducedMotionSnapshot = () => window.matchMedia(MOTION_QUERY).matches;
const visibilitySnapshot = () => document.visibilityState === "visible";
const falseSnapshot = () => false;
const trueSnapshot = () => true;
function wrap(value: number, count: number) {
  return ((value % count) + count) % count;
}
function placement(x: number, y: number, width: number, height?: number): CSSProperties {
  return {
    left: `${x / REFERENCE_WIDTH * 100}%`,
    top: `${y / REFERENCE_HEIGHT * 100}%`,
    width: `${width / REFERENCE_WIDTH * 100}%`,
    ...(height === undefined ? {} : { height: `${height / REFERENCE_HEIGHT * 100}%` }),
  };
}

// Individual photographic layers extracted from the supplied motion reference.
const DEFAULT_PROFILES: readonly ChromeProfileSlide[] = [
  {
    "id": "june",
    "layers": [
      {
        "src": "/chrome-profiles/june-location.webp",
        "x": 94,
        "y": 220,
        "width": 240,
        "height": 70,
        "label": "Explore June’s location"
      },
      {
        "src": "/chrome-profiles/june-map.webp",
        "x": 119,
        "y": 370,
        "width": 151,
        "height": 193,
        "label": "Explore June’s map"
      },
      {
        "src": "/chrome-profiles/june-shopping.webp",
        "x": 362,
        "y": 444,
        "width": 266,
        "height": 105,
        "label": "Explore June’s shopping"
      },
      {
        "src": "/chrome-profiles/june-portrait.webp",
        "x": 254,
        "y": 232,
        "width": 200,
        "height": 243
      },
      {
        "src": "/chrome-profiles/june-bag.webp",
        "x": 409,
        "y": 157,
        "width": 167,
        "height": 167,
        "label": "Explore June’s bag"
      },
      {
        "src": "/chrome-profiles/june-bookmark.webp",
        "x": 423,
        "y": 351,
        "width": 127,
        "height": 38,
        "label": "Explore June’s bookmark"
      },
      {
        "src": "/chrome-profiles/june-map-icon.webp",
        "x": 105,
        "y": 352,
        "width": 41,
        "height": 42
      },
      {
        "src": "/chrome-profiles/june-shopping-icon.webp",
        "x": 597,
        "y": 420,
        "width": 39,
        "height": 39
      }
    ],
    "name": "June",
    "background": "#e8f0fe",
    "color": "#1a73e7",
    "panel": [
      203,
      77,
      311,
      584
    ],
    "headings": [
      [
        "June’s",
        357,
        151
      ],
      [
        "Chrome",
        357,
        607
      ]
    ]
  },
  {
    "id": "mary",
    "layers": [
      {
        "src": "/chrome-profiles/mary-crochet.webp",
        "x": 158,
        "y": 128,
        "width": 154,
        "height": 196,
        "label": "Explore Mary’s crochet"
      },
      {
        "src": "/chrome-profiles/mary-bookmarks.webp",
        "x": 104,
        "y": 406,
        "width": 204,
        "height": 181,
        "label": "Explore Mary’s bookmarks"
      },
      {
        "src": "/chrome-profiles/mary-video.webp",
        "x": 429,
        "y": 406,
        "width": 154,
        "height": 196,
        "label": "Explore Mary’s video"
      },
      {
        "src": "/chrome-profiles/mary-portrait.webp",
        "x": 265,
        "y": 242,
        "width": 187,
        "height": 210
      },
      {
        "src": "/chrome-profiles/mary-sweater.webp",
        "x": 391,
        "y": 124,
        "width": 166,
        "height": 164,
        "label": "Explore Mary’s sweater"
      },
      {
        "src": "/chrome-profiles/mary-passwords.webp",
        "x": 420,
        "y": 289,
        "width": 171,
        "height": 38,
        "label": "Explore Mary’s passwords"
      },
      {
        "src": "/chrome-profiles/mary-crochet-icon.webp",
        "x": 148,
        "y": 111,
        "width": 28,
        "height": 29
      },
      {
        "src": "/chrome-profiles/mary-sweater-icon.webp",
        "x": 499,
        "y": 114,
        "width": 41,
        "height": 42
      },
      {
        "src": "/chrome-profiles/mary-video-icon.webp",
        "x": 570,
        "y": 393,
        "width": 28,
        "height": 28
      }
    ],
    "name": "Mary",
    "background": "#fce8e6",
    "color": "#ea4234",
    "panel": [
      53,
      182,
      611,
      367
    ],
    "headings": [
      [
        "Mary’s",
        151,
        360
      ],
      [
        "Chrome",
        560,
        360
      ]
    ]
  },
  {
    "id": "diana",
    "layers": [
      {
        "src": "/chrome-profiles/diana-location.webp",
        "x": 94,
        "y": 194,
        "width": 242,
        "height": 66,
        "label": "Explore Diana’s location"
      },
      {
        "src": "/chrome-profiles/diana-shopping.webp",
        "x": 425,
        "y": 193,
        "width": 237,
        "height": 96,
        "label": "Explore Diana’s shopping"
      },
      {
        "src": "/chrome-profiles/diana-beach.webp",
        "x": 109,
        "y": 338,
        "width": 167,
        "height": 213,
        "label": "Explore Diana’s beach"
      },
      {
        "src": "/chrome-profiles/diana-portrait.webp",
        "x": 261,
        "y": 178,
        "width": 198,
        "height": 280
      },
      {
        "src": "/chrome-profiles/diana-headphones.webp",
        "x": 385,
        "y": 370,
        "width": 142,
        "height": 183,
        "label": "Explore Diana’s headphones"
      },
      {
        "src": "/chrome-profiles/diana-bookmarks.webp",
        "x": 430,
        "y": 322,
        "width": 180,
        "height": 39,
        "label": "Explore Diana’s bookmarks"
      },
      {
        "src": "/chrome-profiles/diana-location-icon.webp",
        "x": 93,
        "y": 177,
        "width": 32,
        "height": 32
      },
      {
        "src": "/chrome-profiles/diana-shopping-icon.webp",
        "x": 645,
        "y": 187,
        "width": 29,
        "height": 29
      }
    ],
    "name": "Diana",
    "background": "#fef6df",
    "color": "#fbbc05",
    "panel": [
      208,
      76,
      302,
      583
    ],
    "headings": [
      [
        "El Chrome",
        359,
        150
      ],
      [
        "de Diana",
        359,
        573
      ]
    ]
  },
  {
    "id": "vittorio",
    "layers": [
      {
        "src": "/chrome-profiles/vittorio-location.webp",
        "x": 105,
        "y": 200,
        "width": 231,
        "height": 75,
        "label": "Explore Vittorio’s location"
      },
      {
        "src": "/chrome-profiles/vittorio-video.webp",
        "x": 465,
        "y": 134,
        "width": 152,
        "height": 195,
        "label": "Explore Vittorio’s video"
      },
      {
        "src": "/chrome-profiles/vittorio-map.webp",
        "x": 116,
        "y": 340,
        "width": 166,
        "height": 212,
        "label": "Explore Vittorio’s map"
      },
      {
        "src": "/chrome-profiles/vittorio-portrait.webp",
        "x": 258,
        "y": 209,
        "width": 199,
        "height": 258
      },
      {
        "src": "/chrome-profiles/vittorio-drone.webp",
        "x": 338,
        "y": 415,
        "width": 248,
        "height": 133,
        "label": "Explore Vittorio’s drone"
      },
      {
        "src": "/chrome-profiles/vittorio-bookmarks.webp",
        "x": 424,
        "y": 350,
        "width": 161,
        "height": 39,
        "label": "Explore Vittorio’s bookmarks"
      },
      {
        "src": "/chrome-profiles/vittorio-video-icon.webp",
        "x": 602,
        "y": 121,
        "width": 27,
        "height": 28
      },
      {
        "src": "/chrome-profiles/vittorio-map-icon.webp",
        "x": 104,
        "y": 321,
        "width": 31,
        "height": 31
      }
    ],
    "name": "Vittorio",
    "background": "#e5f3e9",
    "color": "#33a852",
    "panel": [
      180,
      76,
      358,
      583
    ],
    "headings": [
      [
        "Il Chrome",
        359,
        146
      ],
      [
        "di Vittorio",
        359,
        596
      ]
    ]
  }
];

const CSS = `
.cpc-root{width:100%;overflow:hidden;font-family:Arial,Helvetica,sans-serif;transition:background-color .75s ease}
.cpc-root:not(.cpc-thumbnail){width:min(100%,640px);margin-inline:auto}
.cpc-stage{position:relative;container-type:inline-size;width:100%;max-width:640px;aspect-ratio:8/9;margin-inline:auto;perspective:1200px;touch-action:pan-y}
.cpc-scene{position:absolute;inset:0;transform-style:preserve-3d;transform-origin:50% 45%;backface-visibility:hidden}
.cpc-panel{position:absolute;border-radius:3.75cqw}
.cpc-heading{position:absolute;margin:0;white-space:nowrap;color:#f8f5e8;font-size:5.78cqw;font-weight:400;letter-spacing:-.025em;line-height:1.08;transform:translate(-50%,-50%)}
.cpc-layer{position:absolute;display:block;padding:0;border:0;background:none;transform:translateZ(0);transition:filter .2s,scale .2s;outline-offset:4px}
.cpc-layer img{display:block;width:100%;height:100%;object-fit:contain;user-select:none;pointer-events:none}
.cpc-layer[data-interactive=true]{cursor:pointer}
.cpc-layer[data-interactive=true]:hover{filter:brightness(1.025);scale:1.025}
.cpc-dots{position:absolute;bottom:6.2%;left:50%;display:flex;align-items:center;justify-content:center;gap:1.4cqw;transform:translateX(-50%);z-index:4}
.cpc-dot{display:grid;place-items:center;flex:none;width:6cqw;height:6cqw;min-width:32px;min-height:32px;border:0;background:none;border-radius:50%;padding:0;cursor:pointer;outline-offset:2px}
.cpc-dot span{display:block;width:3cqw;height:3cqw;min-width:11px;min-height:11px;border:1px solid var(--dot-color);border-radius:50%;background:transparent;transition:background .2s,transform .2s}
.cpc-dot[aria-current=true] span{background:var(--dot-color)}
.cpc-dot:hover span{transform:scale(1.15)}
.cpc-enter{animation:cpc-enter .42s cubic-bezier(.18,.65,.25,1) .24s both}
.cpc-exit{animation:cpc-exit .3s cubic-bezier(.45,0,.8,.45) both;pointer-events:none}
.cpc-enter .cpc-layer{animation:cpc-layer-enter .42s cubic-bezier(.18,.65,.25,1) .24s both}
.cpc-exit .cpc-layer{animation:cpc-layer-exit .3s cubic-bezier(.45,0,.8,.45) both}
.cpc-thumbnail .cpc-stage{height:100%;width:auto;max-width:100%;margin-inline:auto;aspect-ratio:8/9}
.cpc-thumbnail{display:flex;align-items:center;justify-content:center;height:100%;min-height:0}
@keyframes cpc-enter{0%{transform:rotateY(90deg);opacity:0}12%{opacity:1}100%{transform:rotateY(0);opacity:1}}
@keyframes cpc-exit{0%{transform:rotateY(0);opacity:1}90%{opacity:1}100%{transform:rotateY(-90deg);opacity:0}}
@keyframes cpc-layer-enter{from{transform:translateZ(var(--cpc-depth,100px))}to{transform:translateZ(0)}}
@keyframes cpc-layer-exit{from{transform:translateZ(0)}to{transform:translateZ(var(--cpc-depth,100px))}}
@media(prefers-reduced-motion:reduce){.cpc-root,.cpc-dot span,.cpc-layer{transition:none}.cpc-enter,.cpc-exit,.cpc-enter .cpc-layer,.cpc-exit .cpc-layer{animation:none}.cpc-exit{display:none}}
`;

function ProfileArtwork({ profile, motion = "", onLayerSelect }: {
  profile: ChromeProfileSlide;
  motion?: string;
  onLayerSelect?: ChromeProfileCarouselProps["onLayerSelect"];
}) {
  const [x, y, width, height] = profile.panel;
  return (
    <div className={`cpc-scene ${motion}`} aria-hidden={motion === "cpc-exit" || undefined}>
      <div className="cpc-panel" style={{ ...placement(x, y, width, height), backgroundColor: profile.color }} />
      {profile.headings.map(([text, left, top]) => (
        <p key={text} className="cpc-heading" style={{ left: `${left / REFERENCE_WIDTH * 100}%`, top: `${top / REFERENCE_HEIGHT * 100}%` }}>{text}</p>
      ))}
      {profile.layers.map((layer) => {
        const content = <img src={layer.src} alt="" width={layer.width} height={layer.height} draggable={false} />;
        const productOrPortrait = /portrait|bag|sweater|headphones|drone/.test(layer.src);
        const style = { ...placement(layer.x, layer.y, layer.width, layer.height), "--cpc-depth": `${(layer.depth ?? (productOrPortrait ? 180 : 90)) / REFERENCE_WIDTH * 100}cqw` } as CSSProperties;
        return onLayerSelect && layer.label && motion !== "cpc-exit" ? (
          <button key={layer.src} type="button" className="cpc-layer" style={style} data-interactive="true" aria-label={layer.label} onClick={() => onLayerSelect(layer, profile)}>{content}</button>
        ) : <div key={layer.src} className="cpc-layer" style={style}>{content}</div>;
      })}
    </div>
  );
}

/** Four international browser profiles, recreated as separate layers on a 3D carousel. */
export default function ChromeProfileCarousel({
  slides = DEFAULT_PROFILES,
  initialIndex = 0,
  autoPlay = true,
  interval = 2100,
  onProfileChange,
  onLayerSelect,
  className = "",
}: ChromeProfileCarouselProps) {
  const profiles = slides.length ? slides : DEFAULT_PROFILES;
  const [index, setIndex] = useState(() => wrap(Number.isFinite(initialIndex) ? Math.trunc(initialIndex) : 0, profiles.length));
  const [previous, setPrevious] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const gesture = useRef<number | null>(null);
  const reportedProfile = useRef<string | null>(null);
  const currentIndex = wrap(index, profiles.length);
  const current = profiles[currentIndex];
  const reducedMotion = useSyncExternalStore(subscribeMotion, reducedMotionSnapshot, falseSnapshot);
  const visible = useSyncExternalStore(subscribeVisibility, visibilitySnapshot, trueSnapshot);

  useEffect(() => {
    if (!autoPlay || paused || focused || hovered || reducedMotion || !visible || profiles.length < 2) return;
    const timer = window.setTimeout(() => {
      setPrevious(currentIndex);
      setIndex((value) => wrap(value + 1, profiles.length));
    }, Number.isFinite(interval) ? Math.max(1200, interval) : 2100);
    return () => window.clearTimeout(timer);
  }, [autoPlay, currentIndex, focused, hovered, interval, paused, profiles.length, reducedMotion, visible]);

  useEffect(() => {
    if (previous === null) return;
    const timer = window.setTimeout(() => setPrevious(null), reducedMotion ? 0 : 680);
    return () => window.clearTimeout(timer);
  }, [previous, currentIndex, reducedMotion]);

  useEffect(() => {
    if (reportedProfile.current === current.id) return;
    reportedProfile.current = current.id;
    onProfileChange?.(current);
  }, [current, onProfileChange]);

  function select(next: number) {
    const selected = wrap(next, profiles.length);
    if (selected === currentIndex) return;
    setPrevious(currentIndex);
    setIndex(selected);
  }
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      select(currentIndex + (event.key === "ArrowLeft" ? -1 : 1));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      select(event.key === "Home" ? 0 : profiles.length - 1);
    } else if (event.code === "Space" && event.target === event.currentTarget) {
      event.preventDefault();
      setPaused((value) => !value);
    }
  }

  return (
    <section className={`cpc-root relative ${className}`} style={{ backgroundColor: current.background }} role="region" aria-roledescription="carousel" aria-label="Chrome personal profiles" tabIndex={0}
      onKeyDown={handleKeyDown} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <ComponentStyles css={CSS} />
      <div className="cpc-stage" onPointerDown={(event) => { if (!(event.target as HTMLElement).closest("button")) gesture.current = event.clientX; }}
        onPointerUp={(event) => { if (gesture.current !== null && Math.abs(event.clientX - gesture.current) > 35) select(currentIndex + (event.clientX < gesture.current ? 1 : -1)); gesture.current = null; }}
        onPointerCancel={() => { gesture.current = null; }}>
        {previous !== null && <ProfileArtwork key={`previous-${previous}`} profile={profiles[wrap(previous, profiles.length)]} motion="cpc-exit" />}
        <ProfileArtwork key={current.id} profile={current} motion={previous === null ? "" : "cpc-enter"} onLayerSelect={onLayerSelect} />
        <div className="cpc-dots" aria-label="Choose a profile">
          {profiles.map((profile, profileIndex) => <button key={profile.id} type="button" className="cpc-dot" style={{ "--dot-color": profile.color } as CSSProperties} aria-label={`Show ${profile.name}'s Chrome profile`} aria-current={profileIndex === currentIndex} onClick={() => select(profileIndex)}><span /></button>)}
        </div>
      </div>
      <p className="sr-only" aria-live={autoPlay && !focused && !hovered ? "off" : "polite"}>{current.name}, profile {currentIndex + 1} of {profiles.length}. Use the arrow keys to browse and Space to pause automatic playback.</p>
    </section>
  );
}

export function ChromeProfileCarouselThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const profile = DEFAULT_PROFILES[wrap(Number.isFinite(previewStep) ? Math.trunc(previewStep) : 0, DEFAULT_PROFILES.length)];
  return <div className={`cpc-root cpc-thumbnail ${className}`} style={{ backgroundColor: profile.background }} aria-hidden="true"><ComponentStyles css={CSS} /><div className="cpc-stage"><ProfileArtwork profile={profile} /><div className="cpc-dots">{DEFAULT_PROFILES.map((item) => <span key={item.id} className="cpc-dot" style={{ "--dot-color": item.color } as CSSProperties} aria-current={item.id === profile.id}><span /></span>)}</div></div></div>;
}
