"use client";

/* eslint-disable @next/next/no-img-element -- Reference artwork is embedded in portable source. */

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
import { ComponentStyles } from "./component-styles";

export interface ClassicMicrocar {
  id: string;
  name: string;
  country: string;
  years: string;
  model?: string;
  color: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  titleWidth: number;
  description: string;
  gallery?: readonly string[];
  specifications?: readonly [string, string][];
}
export interface ClassicMicrocarsProps {
  slides?: readonly ClassicMicrocar[];
  initialIndex?: number;
  autoPlay?: boolean;
  interval?: number;
  onDiscover?: (car: ClassicMicrocar) => void;
  className?: string;
}

const CARS: readonly ClassicMicrocar[] = [
  {
    id: "bmw-isetta", name: "BMW ISETTA", country: "GERMANY ITALY", years: "1955-1962", color: "#9e886b",
    image: "/classic-microcars/bmw-isetta.webp", imageWidth: 273, imageHeight: 158, titleWidth: 380,
    description: "La Isetta è una microvettura che venne prodotta dalla casa automobilistica italiana Iso di Bresso tra il 1953 ed il 1956 e, su licenza, dalla tedesca BMW tra il 1955 ed il 1962. La BMW Isetta, nel 1955, è stata la prima automobile al mondo, prodotta in serie, a basso consumo di carburante.",
    gallery: ["/classic-microcars/bmw-gallery-1.webp", "/classic-microcars/bmw-gallery-2.webp", "/classic-microcars/bmw-gallery-3.webp"],
    specifications: [["Versioni", "Monovolume · Cabrio · Pick-Up"], ["Anni di produzione", "dal 1955 al 1962"], ["Lunghezza", "2285 mm"], ["Larghezza", "1380 mm"], ["Altezza", "1340 mm"], ["Passo", "1473 mm"], ["Massa", "350 kg"], ["Stessa famiglia", "BMW 600"], ["Esemplari prodotti", "161.360"], ["Note", "Prodotta a Monaco di Baviera"]],
  },
  {
    id: "fiat-cinquecento", name: "FIAT CINQUECENTO", country: "ITALY", years: "1957-1975", color: "#8c8a97",
    image: "/classic-microcars/fiat-cinquecento.webp", imageWidth: 354, imageHeight: 171, titleWidth: 560,
    description: "La Fiat Nuova 500, anche conosciuta come Fiat 500 o con il popolare appellativo Cinquino, è un'automobile superutilitaria della casa torinese, prodotta dal 1957 al 1975.",
    specifications: [["Paese", "Italia"], ["Anni di produzione", "1957–1975"], ["Modello", "Fiat Nuova 500"]],
  },
  {
    id: "messerschmitt", name: "MESSERSCHMITT", country: "GERMANY", years: "1955-1964", model: "KR200", color: "#899d7c",
    image: "/classic-microcars/messerschmitt.webp", imageWidth: 357, imageHeight: 161, titleWidth: 522,
    description: "The Messerschmitt KR200, or Kabinenroller (cabin scooter), was a three-wheeled bubble car designed by the aircraft engineer Fritz Fend and produced in the factory of the German aircraft manufacturer Messerschmitt from 1955 to 1964.",
    specifications: [["Country", "Germany"], ["Production", "1955–1964"], ["Model", "KR200"], ["Designer", "Fritz Fend"]],
  },
];

// Original condensed lettering, expressed as small reusable vector glyphs.
const GLYPHS: Record<string, string> = {
  A: "M3 100 12 3H20L29 100M7 64H25", B: "M4 100V3H17Q29 3 29 20V35Q29 48 17 49H4M17 49Q30 49 30 65V82Q30 100 17 100H4",
  C: "M29 16Q29 3 17 3H15Q3 3 3 17V86Q3 100 15 100H17Q29 100 29 86", E: "M29 3H4V100H29M4 49H25",
  F: "M29 3H4V100M4 49H25", H: "M4 3V100M29 3V100M4 49H29", I: "M16 3V100",
  M: "M3 100V3H7L16 72 25 3H29V100", N: "M4 100V3L29 100V3", O: "M16 3Q3 3 3 17V86Q3 100 16 100T29 86V17Q29 3 16 3Z",
  Q: "M16 3Q3 3 3 17V86Q3 100 16 100T29 86V17Q29 3 16 3ZM19 79 32 103",
  R: "M4 100V3H17Q29 3 29 20V35Q29 49 17 49H4M16 49 30 100",
  S: "M29 17Q29 3 16 3T3 17V34Q3 45 16 51T29 68V85Q29 100 16 100T3 85",
  T: "M0 3H32M16 3V100", U: "M3 3V86Q3 100 16 100T29 86V3", W: "M1 3 8 100H12L17 29 22 100H26L33 3",
  D: "M4 3H15Q30 3 30 20V83Q30 100 15 100H4Z", G: "M29 18Q29 3 16 3T3 18V84Q3 100 16 100T29 84V57H17",
  J: "M29 3V84Q29 100 16 100T3 84", K: "M4 3V100M29 3 4 53 30 100", L: "M4 3V100H30",
  P: "M4 100V3H17Q29 3 29 20V35Q29 49 17 49H4", V: "M2 3 13 100H19L30 3", X: "M3 3 29 100M29 3 3 100",
  Y: "M2 3 16 53 30 3M16 53V100", Z: "M3 3H29L3 100H29", "-": "M4 52H28",
  "0": "M16 3Q3 3 3 17V86Q3 100 16 100T29 86V17Q29 3 16 3Z",
  "1": "M9 15 17 3V100", "2": "M3 18Q3 3 16 3T29 18V29Q29 41 16 54T3 78V100H29",
  "3": "M3 16Q3 3 16 3T29 17V35Q29 49 16 49M16 49Q29 49 29 63V86Q29 100 16 100T3 87",
  "4": "M24 100V3H20L3 70H31", "5": "M29 3H4V49H17Q29 49 29 64V85Q29 100 16 100T3 86",
  "6": "M29 17Q29 3 16 3T3 18V85Q3 100 16 100T29 85V65Q29 50 16 50H3",
  "7": "M3 3H29L9 100", "8": "M16 3Q3 3 3 18V34Q3 49 16 49T29 34V18Q29 3 16 3ZM16 49Q3 49 3 64V85Q3 100 16 100T29 85V64Q29 49 16 49Z",
  "9": "M29 51H16Q3 51 3 36V18Q3 3 16 3T29 18V85Q29 100 16 100T3 85",
};

const GLYPH_WIDTHS: Record<string, number> = { M: 44, W: 52, I: 7, "1": 9, T: 28, E: 29, F: 29, "-": 18 };

function CondensedTitle({ text, className = "", style }: { text: string; className?: string; style?: CSSProperties }) {
  let cursor = 0;
  const letters = [...text.toUpperCase()].map((letter, index) => {
    const x = cursor;
    const width = GLYPH_WIDTHS[letter] ?? 31;
    cursor += letter === " " ? 18 : width + 9;
    return letter === " " ? null : GLYPHS[letter] ? <path key={index} d={GLYPHS[letter]} transform={`translate(${x} 0) scale(${width / (letter === "I" || letter === "1" ? 7 : 32)} 1)${letter === "I" || letter === "1" ? " translate(-12 0)" : ""}`} /> : <text key={index} x={x} y={100} fontSize={100} textLength={width} lengthAdjust="spacingAndGlyphs" fill="currentColor" stroke="none">{letter}</text>;
  });
  return <svg className={className} style={{ aspectRatio: `${cursor - 9} / 106`, ...style }} viewBox={`0 0 ${cursor - 9} 106`} preserveAspectRatio="none" role="img" aria-label={text} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="butt" strokeLinejoin="round">{letters}</svg>;
}

const QUERY = "(prefers-reduced-motion: reduce)";
function subscribeMotion(notify: () => void) { const media = window.matchMedia(QUERY); media.addEventListener("change", notify); return () => media.removeEventListener("change", notify); }
const motionSnapshot = () => window.matchMedia(QUERY).matches;
const serverMotion = () => false;
function wrap(value: number, length: number) { return ((value % length) + length) % length; }

const CSS = `
.cm-root{width:100%;overflow:hidden;background:#f8ebda;font-family:Arial,Helvetica,sans-serif;color:#eae2c9;container-type:inline-size;container-name:microcar}
.cm-root:not(.cm-thumbnail){width:min(100%,960px);margin-inline:auto}
.cm-stage{position:relative;container-type:inline-size;width:100%;max-width:960px;aspect-ratio:4/3;margin:auto}
.cm-surface{position:absolute;inset:11.833% 4.75% 12.5%;overflow:hidden;box-shadow:0 5cqw 5cqw -5cqw #50472f99;transition:background .7s ease}
.cm-header{position:absolute;left:28.8%;right:28.8%;top:5.5%;display:flex;align-items:center;gap:1.2cqw;white-space:nowrap;font-size:1.55cqw;font-weight:600;letter-spacing:.075em}
.cm-header:before,.cm-header:after{content:'';height:1px;flex:1;background:#eae2c955}
.cm-icon-button{position:absolute;top:2%;display:grid;place-items:center;width:4.4cqw;height:4.4cqw;border:0;padding:1.5cqw;background:none;color:inherit;z-index:5;cursor:pointer}
.cm-menu{left:.6%}.cm-search{right:.6%}.cm-icon-button svg{width:100%;height:100%}
.cm-car-group{position:absolute;inset:0}
.cm-car-group[data-entering=true]{animation:cm-arrive .7s cubic-bezier(.2,.75,.25,1) both}
.cm-car-group.cm-exit{animation:cm-leave .7s cubic-bezier(.2,.75,.25,1) both;pointer-events:none}
.cm-car-heading{position:absolute;top:20.7%;height:23.3%;color:#eae2c9;transform:translateX(-50%);overflow:visible}
.cm-meta{position:absolute;top:14.3%;display:flex;justify-content:space-between;transform:translateX(-50%);line-height:1}
.cm-meta svg{width:auto;height:2.8cqw;overflow:visible;flex:none}
.cm-model{position:absolute;top:45.75%;right:12.7%;width:auto;height:4cqw;overflow:visible}
.cm-car{position:absolute;bottom:29.7%;height:auto;object-fit:contain;transform:translateX(-50%);z-index:2;filter:drop-shadow(0 1cqw .6cqw #38342150);user-select:none}
.cm-neighbor{position:absolute;bottom:34.6%;display:block;width:30%;height:auto;border:0;padding:0;background:none;cursor:pointer;z-index:3;transition:translate .7s ease}
.cm-neighbor img{display:block;width:100%;height:auto;filter:drop-shadow(0 .6cqw .5cqw #38342140)}
.cm-neighbor-left{left:-20.5%}.cm-neighbor-right{right:-20.5%}
.cm-timeline{position:absolute;left:25.6%;width:48.6%;top:72%;height:7%;display:flex;align-items:center;justify-content:space-between;z-index:4}
.cm-timeline:before{content:'';position:absolute;left:0;right:0;top:50%;border-top:1px dashed #eae2c970}
.cm-timeline button,.cm-timeline-marker{position:relative;width:3.3cqw;height:3.3cqw;border:0;display:grid;place-items:center;background:none;border-radius:50%;color:inherit;padding:0;cursor:pointer}
.cm-timeline span{width:.8cqw;height:.8cqw;min-width:3px;min-height:3px;background:currentColor;border-radius:50%}
.cm-timeline button[aria-current=true]:after,.cm-timeline-marker[aria-current=true]:after{content:'';position:absolute;inset:.6cqw;border:1px solid #eae2c999;border-radius:50%}
.cm-description{position:absolute;left:15.5%;right:15.5%;top:80.5%;margin:0;text-align:center;font-size:.8cqw;line-height:1.4;letter-spacing:.16em;text-transform:uppercase}
.cm-discover{position:absolute;top:89%;left:50%;transform:translateX(-50%);width:16.5%;height:4.8%;border:0;border-radius:99px;background:#eae2c9;color:#897c61;font-size:.67cqw;font-weight:600;letter-spacing:.18em;text-transform:uppercase;cursor:pointer;transition:background .2s}
.cm-discover:hover{background:#fff5df}
.cm-details{position:absolute;inset:3.3% 2%;z-index:10;background:#fff;color:#343434;animation:cm-detail-in .5s cubic-bezier(.22,.8,.25,1) both}
.cm-details[data-closing=true]{animation:cm-detail-out .4s cubic-bezier(.5,0,.75,.4) both;pointer-events:none}
.cm-close{position:absolute;right:1%;top:1%;width:4cqw;height:4cqw;background:none;border:0;color:#666;font-size:2.7cqw;line-height:1;cursor:pointer;z-index:5}
.cm-gallery{position:absolute;left:2.9%;top:8%;width:51.7%;height:85.5%;object-fit:cover;background:#999b8e;animation:cm-photo-in .7s cubic-bezier(.22,.8,.25,1) .25s both}
.cm-details-title{position:absolute;left:59%;top:9%;width:34%;height:12%;color:#080808}
.cm-roundel{position:absolute;left:57.8%;top:8%;width:8.1%;height:13.4%;object-fit:contain}
.cm-details[data-bmw=true] .cm-details-title{left:68%;width:24.7%}
.cm-details-copy{position:absolute;left:57.8%;right:6%;top:25%;font-size:.74cqw;line-height:2.7;letter-spacing:.11em}
.cm-details-copy p{margin:0 0 2.7cqw}.cm-details-copy dl{margin:0}.cm-details-copy dt,.cm-details-copy dd{display:inline;margin:0}.cm-details-copy dd{padding-left:.8cqw}.cm-details-copy dl>div{line-height:2.7}
.cm-gallery-dots{position:absolute;left:2.9%;bottom:1.5%;width:51.7%;display:flex;justify-content:center;gap:.2cqw}
.cm-gallery-dots button{border:0;padding:.5cqw;background:none;cursor:pointer}.cm-gallery-dots span{display:block;width:.8cqw;height:.8cqw;min-width:3px;min-height:3px;background:#d4d4d4;border-radius:50%}.cm-gallery-dots button[aria-current=true] span{background:#111}
.cm-menu-panel{position:absolute;left:2%;top:11%;display:flex;flex-direction:column;gap:.5cqw;padding:2cqw;background:#f8ebd9;color:#6d604c;z-index:9;box-shadow:0 1cqw 3cqw #0002}.cm-menu-panel button{border:0;padding:1cqw;text-align:left;background:none;font-size:1.5cqw;color:inherit;cursor:pointer}
.cm-search-panel{position:absolute;right:3%;top:11%;z-index:9;width:38%;padding:1.5cqw;background:#f8ebd9;color:#6d604c;font-size:1.5cqw}.cm-search-panel input{width:100%;background:white;padding:1cqw;border:1px solid #cabba3;margin-bottom:1cqw}.cm-search-panel button{display:block;border:0;background:none;color:inherit;padding:1cqw;text-align:left}
.cm-thumbnail{display:flex;height:100%;align-items:center;justify-content:center}.cm-thumbnail .cm-stage{height:100%;width:auto;max-width:100%;flex:none;aspect-ratio:4/3}
.cm-thumbnail .cm-car-group{animation:none}
.cm-mobile-info{display:none}
@keyframes cm-arrive{from{transform:translateX(var(--cm-enter,100%))}to{transform:translateX(0)}}
@keyframes cm-leave{from{transform:translateX(0)}to{transform:translateX(var(--cm-exit,-100%))}}
@keyframes cm-detail-in{from{transform:translateY(105%)}to{transform:translateY(0)}}
@keyframes cm-detail-out{from{transform:translateY(0)}to{transform:translateY(105%)}}
@keyframes cm-photo-in{from{clip-path:inset(49% 0 49% 0)}to{clip-path:inset(0)}}
@container(max-width:480px){.cm-discover{width:27%;height:7%;top:87%;font-size:1.3cqw}.cm-description{font-size:1cqw;top:79.5%;left:10%;right:10%;line-height:1.25}.cm-meta{font-size:3.5cqw}.cm-icon-button{width:8cqw;height:8cqw;padding:2.8cqw;top:0}.cm-timeline button{width:8cqw;height:8cqw}.cm-timeline button[aria-current=true]:after{inset:3cqw}.cm-close{width:8cqw;height:8cqw;font-size:5cqw}.cm-gallery-dots button{padding:1.5cqw}.cm-details-copy{font-size:1cqw;line-height:1.7;right:3%}.cm-details-copy dl>div{line-height:1.7}.cm-details-copy p{margin-bottom:2cqw}.cm-search-panel,.cm-menu-panel button{font-size:3cqw}}
@container microcar (max-width:480px){
 .cm-root:not(.cm-thumbnail) .cm-stage[data-details=true]{aspect-ratio:auto;min-height:620px}
 .cm-root:not(.cm-thumbnail) .cm-stage[data-details=true] .cm-surface{inset:12px;overflow:hidden}
 .cm-root:not(.cm-thumbnail) .cm-details{inset:8px;display:flex;flex-direction:column;gap:12px;padding:46px 14px 20px;overflow:auto}
 .cm-root:not(.cm-thumbnail) .cm-details-title,.cm-root:not(.cm-thumbnail) .cm-details[data-bmw=true] .cm-details-title{position:static;order:-2;left:auto;top:auto;width:100%;height:55px;min-height:55px}
 .cm-root:not(.cm-thumbnail) .cm-roundel{display:none}
 .cm-root:not(.cm-thumbnail) .cm-gallery{position:static;left:auto;top:auto;width:100%;height:auto;aspect-ratio:1;flex:none;object-fit:cover}
 .cm-root:not(.cm-thumbnail) .cm-gallery-dots{position:static;order:1;width:100%;gap:5px}
 .cm-root:not(.cm-thumbnail) .cm-gallery-dots button{width:32px;height:32px;padding:10px}.cm-root:not(.cm-thumbnail) .cm-gallery-dots span{width:7px;height:7px}
 .cm-root:not(.cm-thumbnail) .cm-details-copy{position:static;order:2;font-size:11px;line-height:1.8;letter-spacing:.04em;color:#454545}
 .cm-root:not(.cm-thumbnail) .cm-details-copy p{margin:0 0 18px}.cm-root:not(.cm-thumbnail) .cm-details-copy dl>div{display:grid;grid-template-columns:1fr 1fr;gap:10px;line-height:1.8;margin-bottom:6px}.cm-root:not(.cm-thumbnail) .cm-details-copy dd{padding:0}
 .cm-root:not(.cm-thumbnail) .cm-close{position:absolute;right:5px;top:5px;width:36px;height:36px;font-size:28px;background:white}
 .cm-root:not(.cm-thumbnail) .cm-discover{min-height:28px;top:85.5%;font-size:7px;width:90px}
 .cm-root:not(.cm-thumbnail) .cm-icon-button{width:32px;height:32px;padding:10px}.cm-root:not(.cm-thumbnail) .cm-timeline button{width:32px;height:32px}
 .cm-mobile-info{display:block;padding:0 18px 20px;color:#72634b;font-size:11px;line-height:1.7}.cm-mobile-info h3{font-size:14px;letter-spacing:.08em;margin:0 0 8px}.cm-mobile-info p{margin:0 0 14px}.cm-mobile-info nav{display:flex;justify-content:space-between;gap:12px}.cm-mobile-info button{min-height:36px;padding:6px 14px;border:1px solid #cdbda5;border-radius:99px;background:#f4e6d0;color:inherit;font-size:11px}
}
@media(prefers-reduced-motion:reduce){.cm-surface,.cm-neighbor,.cm-discover{transition:none}.cm-car-group,.cm-details,.cm-gallery{animation:none}}
`;

function CarScene({ car, previous, next, onPrevious, onNext, exiting = false, entering = false, direction = 1 }: { car: ClassicMicrocar; previous: ClassicMicrocar; next: ClassicMicrocar; onPrevious?: () => void; onNext?: () => void; exiting?: boolean; entering?: boolean; direction?: 1 | -1 }) {
  const titleWidth = car.titleWidth / 724 * 100;
  return <>
    <div key={car.id} className={`cm-car-group${exiting ? " cm-exit" : ""}`} style={{ "--cm-enter": direction === 1 ? "100%" : "-100%", "--cm-exit": direction === 1 ? "-100%" : "100%" } as CSSProperties} data-entering={entering} aria-hidden={exiting || undefined}>
      <div className="cm-meta" style={{ left: "50%", width: `${titleWidth}%` }}><CondensedTitle text={car.country} /><CondensedTitle text={car.years} /></div>
      <CondensedTitle text={car.name} className="cm-car-heading" style={{ left: "50%", width: `${titleWidth}%` }} />
      {car.model && <CondensedTitle text={car.model} className="cm-model" />}
      <img className="cm-car" src={car.image} alt={car.name} width={car.imageWidth} height={car.imageHeight} draggable={false} style={{ left: "50%", width: `${car.imageWidth / 724 * 100}%` }} />
    </div>
    {!exiting && (onPrevious ? <button type="button" className="cm-neighbor cm-neighbor-left" style={{ bottom: previous.id === "messerschmitt" ? "36.7%" : "34.6%" }} aria-label={`View ${previous.name}`} onClick={onPrevious}><img src={previous.image} alt="" draggable={false} /></button> : <div className="cm-neighbor cm-neighbor-left" style={{ bottom: previous.id === "messerschmitt" ? "36.7%" : "34.6%" }}><img src={previous.image} alt="" draggable={false} /></div>)}
    {!exiting && (onNext ? <button type="button" className="cm-neighbor cm-neighbor-right" style={{ bottom: next.id === "messerschmitt" ? "36.7%" : "34.6%" }} aria-label={`View ${next.name}`} onClick={onNext}><img src={next.image} alt="" draggable={false} /></button> : <div className="cm-neighbor cm-neighbor-right" style={{ bottom: next.id === "messerschmitt" ? "36.7%" : "34.6%" }}><img src={next.image} alt="" draggable={false} /></div>)}
  </>;
}

export default function ClassicMicrocars({ slides = CARS, initialIndex = 0, autoPlay = false, interval = 3200, onDiscover, className = "" }: ClassicMicrocarsProps) {
  const cars = slides.length ? slides : CARS;
  const [index, setIndex] = useState(() => wrap(Number.isFinite(initialIndex) ? Math.trunc(initialIndex) : 0, cars.length));
  const [details, setDetails] = useState(false);
  const [closing, setClosing] = useState(false);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const discoverButton = useRef<HTMLButtonElement>(null);
  const previouslyOpen = useRef(false);
  const closingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipe = useRef<number | null>(null);
  const currentIndex = wrap(index, cars.length);
  const car = cars[currentIndex];
  const gallery = car.gallery?.length ? car.gallery : [car.image];
  const reducedMotion = useSyncExternalStore(subscribeMotion, motionSnapshot, serverMotion);
  useEffect(() => () => {
    if (closingTimer.current !== null) clearTimeout(closingTimer.current);
  }, []);
  useEffect(() => {
    if (!autoPlay || details || menu || search || paused || hovered || focused || reducedMotion || cars.length < 2) return;
    const timer = window.setTimeout(() => { setDirection(1); setPreviousIndex(currentIndex); setIndex((value) => wrap(value + 1, cars.length)); }, Number.isFinite(interval) ? Math.max(1500, interval) : 3200);
    return () => window.clearTimeout(timer);
  }, [autoPlay, cars.length, currentIndex, details, focused, hovered, interval, menu, paused, reducedMotion, search]);
  useEffect(() => { if (details) closeButton.current?.focus(); else if (previouslyOpen.current) discoverButton.current?.focus(); previouslyOpen.current = details; }, [details]);
  useEffect(() => { if (previousIndex === null) return; const timer = window.setTimeout(() => setPreviousIndex(null), reducedMotion ? 0 : 720); return () => window.clearTimeout(timer); }, [currentIndex, previousIndex, reducedMotion]);
  function select(value: number) { const selected = wrap(value, cars.length); if (selected !== currentIndex) { setDirection(wrap(selected - currentIndex, cars.length) <= cars.length / 2 ? 1 : -1); setPreviousIndex(currentIndex); setIndex(selected); } setMenu(false); setSearch(false); setGalleryIndex(0); }
  function close() {
    if (closingTimer.current !== null) return;
    setClosing(true);
    closingTimer.current = setTimeout(() => {
      setDetails(false);
      setClosing(false);
      closingTimer.current = null;
    }, reducedMotion ? 0 : 400);
  }
  function keys(event: KeyboardEvent<HTMLElement>) {
    if ((event.target as HTMLElement).tagName === "INPUT") { if (event.key === "Escape") setSearch(false); return; }
    if (details) {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); setGalleryIndex((value) => wrap(value + (event.key === "ArrowLeft" ? -1 : 1), gallery.length)); }
      if (event.key === "Tab") {
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(".cm-details button"));
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); select(currentIndex + (event.key === "ArrowLeft" ? -1 : 1)); }
    if (event.key === "Home" || event.key === "End") { event.preventDefault(); select(event.key === "Home" ? 0 : cars.length - 1); }
    if (event.key === "Escape") { setMenu(false); setSearch(false); }
    if (event.code === "Space" && event.target === event.currentTarget) { event.preventDefault(); setPaused((value) => !value); }
  }
  return <section className={`cm-root relative ${className}`} role="region" aria-label="Classic Microcars" aria-roledescription="carousel" tabIndex={0} onKeyDown={keys} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <ComponentStyles css={CSS} />
    <div className="cm-stage" data-details={details}><div className="cm-surface" style={{ backgroundColor: car.color }}>
      <div className="absolute inset-0" aria-hidden={details || undefined} inert={details || undefined}
        onPointerDown={(event) => { if (!(event.target as HTMLElement).closest("button,input")) swipe.current = event.clientX; }}
        onPointerUp={(event) => { if (swipe.current !== null && Math.abs(event.clientX - swipe.current) > 40) select(currentIndex + (event.clientX < swipe.current ? 1 : -1)); swipe.current = null; }} onPointerCancel={() => { swipe.current = null; }}>
        <header className="cm-header">CLASSIC MICROCARS</header>
        <button className="cm-icon-button cm-menu" type="button" aria-label="Browse microcars" aria-expanded={menu} onClick={() => { setMenu((value) => !value); setSearch(false); }}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M2 5h12M2 8h12M2 11h12" /></svg></button>
        <button className="cm-icon-button cm-search" type="button" aria-label="Search microcars" aria-expanded={search} onClick={() => { setSearch((value) => !value); setMenu(false); }}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><circle cx="6.5" cy="6.5" r="4" /><path d="m10 10 4 4" /></svg></button>
        {previousIndex !== null && <CarScene car={cars[wrap(previousIndex, cars.length)]} previous={car} next={car} exiting direction={direction} />}
        <CarScene car={car} previous={cars[wrap(currentIndex - 1, cars.length)]} next={cars[wrap(currentIndex + 1, cars.length)]} entering={previousIndex !== null} direction={direction} onPrevious={() => select(currentIndex - 1)} onNext={() => select(currentIndex + 1)} />
        <div className="cm-timeline" aria-label="Choose a microcar">{cars.map((_, position) => { const i = wrap(position - 1, cars.length), item = cars[i]; return <button type="button" key={item.id} aria-label={`View ${item.name}`} aria-current={i === currentIndex} onClick={() => select(i)}><span /></button>; })}</div>
        <p className="cm-description">{car.description}</p>
        <button ref={discoverButton} className="cm-discover" type="button" onClick={() => { if (onDiscover) onDiscover(car); else { setGalleryIndex(0); setDetails(true); } }}>Discover more</button>
        {menu && <div className="cm-menu-panel">{cars.map((item, i) => <button key={item.id} type="button" onClick={() => select(i)}>{item.name}</button>)}</div>}
        {search && <div className="cm-search-panel"><label>Find a microcar<input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="BMW, Fiat, Messerschmitt…" /></label>{cars.map((item, i) => ({ item, i })).filter(({ item }) => item.name.toLowerCase().includes(query.toLowerCase())).map(({ item, i }) => <button key={item.id} type="button" onClick={() => select(i)}>{item.name}</button>)}</div>}
      </div>
      {details && <div className="cm-details" role="dialog" aria-modal="true" aria-label={`${car.name} details`} data-bmw={car.id === "bmw-isetta"} data-closing={closing}>
        <button ref={closeButton} className="cm-close" type="button" aria-label="Close car details" onClick={close}>×</button>
        <img key={`${car.id}-${galleryIndex}`} className="cm-gallery" src={gallery[wrap(galleryIndex, gallery.length)]} alt={`${car.name}, photograph ${galleryIndex + 1}`} style={car.gallery?.length ? undefined : { objectFit: "contain", backgroundColor: car.color }} />
        {car.id === "bmw-isetta" && <img className="cm-roundel" src="/classic-microcars/bmw-roundel.webp" alt="BMW" />}
        <CondensedTitle text={car.name} className="cm-details-title" />
        <div className="cm-details-copy"><p>{car.description}</p><dl>{car.specifications?.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div>
        <div className="cm-gallery-dots" aria-label="Gallery photographs">{gallery.map((photo, i) => <button key={photo} type="button" aria-label={`Show photograph ${i + 1}`} aria-current={i === galleryIndex} onClick={() => setGalleryIndex(i)}><span /></button>)}</div>
      </div>}
    </div></div>
    {!details && <div className="cm-mobile-info"><h3>{car.name}</h3><p>{car.description}</p><nav aria-label="Mobile car controls"><button type="button" onClick={() => select(currentIndex - 1)}>← Previous</button><button type="button" onClick={() => select(currentIndex + 1)}>Next →</button></nav></div>}
    <p className="sr-only" aria-live={autoPlay && !focused && !hovered ? "off" : "polite"}>{car.name}. Use arrow keys or select a car. Discover more opens the gallery.</p>
  </section>;
}

export function ClassicMicrocarsThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const index = wrap(Number.isFinite(previewStep) ? Math.trunc(previewStep) : 0, CARS.length), car = CARS[index];
  return <div className={`cm-root cm-thumbnail ${className}`} aria-hidden="true" inert><ComponentStyles css={CSS} /><div className="cm-stage"><div className="cm-surface" style={{ backgroundColor: car.color }}><header className="cm-header">CLASSIC MICROCARS</header><CarScene car={car} previous={CARS[wrap(index - 1, CARS.length)]} next={CARS[wrap(index + 1, CARS.length)]} /><div className="cm-timeline">{CARS.map((_, position) => { const i = wrap(position - 1, CARS.length); return <div key={CARS[i].id} className="cm-timeline-marker" aria-current={i === index}><span /></div>; })}</div><p className="cm-description">{car.description}</p><span className="cm-discover grid place-items-center">Discover more</span></div></div></div>;
}
