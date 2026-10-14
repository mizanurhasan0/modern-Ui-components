"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import { ComponentStyles } from "./component-styles";

export interface TravelDestination {
  id: string;
  name: string;
  country: string;
  image: string;
  thumbnail?: string;
}

export interface TravelBooking {
  destination: TravelDestination;
  checkIn: string;
  checkOut: string;
  adults: number;
}

export interface TravelAccountRequest {
  action: "login" | "signup";
  email: string;
}

export interface GlobeTravelExplorerProps {
  destinations?: readonly TravelDestination[];
  initialDestination?: string;
  initialView?: "world" | "country" | "destination";
  globeImage?: string;
  globeStillImage?: string;
  brand?: string;
  onBook?: (booking: TravelBooking) => void | Promise<void>;
  onAccountAction?: (request: TravelAccountRequest) => void | Promise<void>;
  className?: string;
}

// The globe retains the supplied video's native frames and 30 fps timing.
// The mountain image restores the reference's landscape beneath recorded UI;
// occluded details were reconstructed with imagegen. See asset attribution.
// The gallery's source exporter embeds these assets in the copied component.
const GLOBE = "/reference-travel/travelo-globe-spin.webp";
const GLOBE_STILL = "/reference-travel/travelo-globe-still.webp";
const DESTINATIONS: readonly TravelDestination[] = [
  { id: "great-wall", name: "Great Wall", country: "China", image: "/reference-travel/great-wall-reference.webp", thumbnail: "/reference-travel/great-wall-reference.webp" },
  { id: "zhangjiajie", name: "Zhangjiajie", country: "China", image: "/reference-travel/zhangjiajie-restored-hd.webp", thumbnail: "/reference-travel/zhangjiajie-restored-hd.webp" },
];

export default function GlobeTravelExplorer({ destinations = DESTINATIONS, initialDestination = "zhangjiajie", initialView = "world", globeImage = GLOBE, globeStillImage = GLOBE_STILL, brand = "TRAVELÓ", onBook, onAccountAction, className = "" }: GlobeTravelExplorerProps) {
  const [view, setView] = useState(initialView);
  const [selectedId, setSelectedId] = useState(initialDestination);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [accountAction, setAccountAction] = useState<TravelAccountRequest["action"] | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const [accountPending, setAccountPending] = useState(false);
  const accountDialog = useRef<HTMLDialogElement>(null);
  const accountInput = useRef<HTMLInputElement>(null);
  const accountTrigger = useRef<HTMLButtonElement | null>(null);
  const accountRequest = useRef(0);
  const id = useId();
  const destination = destinations.find((item) => item.id === selectedId) ?? destinations[0];

  useEffect(() => {
    const dialog = accountDialog.current;
    if (!dialog) return;
    if (accountAction && !dialog.open) { dialog.showModal(); accountInput.current?.focus(); }
    if (!accountAction && dialog.open) dialog.close();
  }, [accountAction]);

  function openAccount(action: TravelAccountRequest["action"], trigger: HTMLButtonElement) {
    accountRequest.current += 1;
    accountTrigger.current = trigger;
    setAccountStatus("");
    setAccountPending(false);
    setAccountAction(action);
  }

  function closeAccount() {
    accountRequest.current += 1;
    accountDialog.current?.close();
    setAccountAction(null);
    setAccountPending(false);
    accountTrigger.current?.focus();
  }

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accountAction || accountPending) return;
    const request = ++accountRequest.current;
    setAccountPending(true);
    setAccountStatus("");
    try {
      await onAccountAction?.({ action: accountAction, email: accountEmail.trim() });
      if (request === accountRequest.current) setAccountStatus(onAccountAction ? "Your email has been passed to the connected account flow." : "This is a local demo. No email was sent and no account was created. Connect the account callback to your sign-in flow in your own project.");
    } catch {
      if (request === accountRequest.current) setAccountStatus("Could not continue. Please try again.");
    } finally {
      if (request === accountRequest.current) setAccountPending(false);
    }
  }

  function openDestination(item: TravelDestination) {
    setSelectedId(item.id);
    setView("destination");
    setMenuOpen(false);
    setStatus("");
  }

  function navigate(event: KeyboardEvent<HTMLElement>) {
    if (accountAction) return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    if (event.key === "Escape") {
      setMenuOpen(false);
      if (!menuOpen) setView(view === "destination" ? "country" : "world");
    }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && destinations.length) {
      event.preventDefault();
      const current = Math.max(0, destinations.findIndex((item) => item.id === selectedId));
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setSelectedId(destinations[(current + direction + destinations.length) % destinations.length].id);
      setView("country");
    }
  }

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!destination || pending) return;
    if (!checkIn || !checkOut || checkOut <= checkIn) { setStatus("Choose a check-out date after your check-in date."); return; }
    setPending(true);
    try {
      await onBook?.({ destination, checkIn, checkOut, adults });
      setStatus(onBook ? `Your ${destination.name} trip request has been sent.` : `${destination.name}: ${adults} ${adults === 1 ? "traveler" : "travelers"}, ${checkIn} to ${checkOut}.`);
    } catch { setStatus("We could not send your request. Please try again."); }
    finally { setPending(false); }
  }

  function renderBooking(mobile = false) {
    return <form className={`gte-booking ${mobile ? "gte-mobile-booking" : ""} flex items-stretch bg-[#f9ffff] text-[#536663]`} onSubmit={book}>
      <label>Check in<input type="date" required value={checkIn} aria-label="Check in" onChange={(event) => setCheckIn(event.target.value)} /></label>
      <label>Check out<input type="date" required min={checkIn || undefined} value={checkOut} aria-label="Check out" onChange={(event) => setCheckOut(event.target.value)} /></label>
      <label>Adults<select aria-label="Adults" value={adults} onChange={(event) => setAdults(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
      <button type="submit" disabled={pending} aria-label="Find your trip">{pending ? "…" : "→"}</button>
    </form>;
  }

  return <section className={`globe-travel-explorer @container relative isolate w-full overflow-hidden bg-[linear-gradient(125deg,#45e1e8,#42b9d6_48%,#2568b8)] font-[Arial,Helvetica,sans-serif] text-[#e9fffc] ${className}`} aria-label="Interactive world travel explorer" onKeyDown={navigate}>
    <ComponentStyles css={STYLES} />
    <div className="gte-viewport relative overflow-hidden rounded-[2cqw] bg-[#05236a]" data-view={view}>
      <div className="gte-space absolute inset-0" aria-hidden="true"><Stars /><span className="gte-flare" /></div>
      {destination && <div className="gte-scenery absolute inset-0" aria-hidden="true">
        {/* Standard images keep the copied component portable. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={destination.image} alt="" className="size-full object-cover" />
      </div>}
      <header className="gte-header absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-[#ffffff0b]">
        <button type="button" className="gte-brand inline-flex items-center gap-[.9cqw] border-0 bg-transparent font-bold tracking-[.08em]" onClick={() => { setView("world"); setMenuOpen(false); }} aria-label={`${brand} home`}>
          <svg viewBox="0 0 28 26" className="gte-logo" aria-hidden="true"><path fill="currentColor" d="M27 1C11 0 0 8 0 20c0 5 5 7 8 5C1 10 16 3 27 1Zm-1 4C13 7 6 14 8 22c1 4 5 5 8 2C7 18 17 9 26 5Z" /></svg>{brand}
        </button>
        <div className="gte-header-actions flex items-center gap-[2.5cqw]">
          <button type="button" className="gte-text-button" onClick={(event) => openAccount("login", event.currentTarget)}>LOGIN</button>
          <button type="button" className="gte-text-button" onClick={(event) => openAccount("signup", event.currentTarget)}>SIGN UP</button>
          <button type="button" className="gte-icon-button" aria-label="Search destinations" onClick={() => { setView("country"); setMenuOpen(true); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg></button>
          <button type="button" className="gte-icon-button gte-menu-button" aria-label="Destination menu" aria-expanded={menuOpen} aria-controls={`${id}-menu`} onClick={() => setMenuOpen((open) => !open)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M5 8h14M5 12h14M5 16h14" /></svg></button>
        </div>
      </header>
      <div className="gte-page-dots absolute z-10 flex flex-col gap-[1.7cqw]" aria-label="Explorer views">
        {(["world", "country", "destination"] as const).map((item) => <button type="button" key={item} className="gte-page-dot" aria-label={`Show ${item} view`} aria-pressed={view === item} onClick={() => setView(item)} />)}
      </div>
      <div className="gte-world-heading pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true"><div><span className="gte-world-eyebrow block text-[1.45cqw] font-normal text-[#9fe5f7]">EXPLORE YOUR</span><span className="gte-world-word flex justify-between text-[9.8cqw] leading-[.95] font-black">{"WORLD".split("").map((letter, index) => <span key={index}>{letter}</span>)}</span></div></div>
      <button type="button" className="gte-globe absolute z-10 border-0 bg-transparent p-0" disabled={view === "destination"} tabIndex={view === "destination" ? -1 : 0} onClick={() => { setView(view === "world" ? "country" : "world"); setMenuOpen(false); }} aria-label={view === "world" ? "Explore China and its destinations" : "Return to the world"}>
        <span className="gte-globe-glow absolute inset-[8%] rounded-full" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={globeImage} alt="Rotating Earth with photographed continents and illuminated oceans" className="gte-globe-spin relative size-full object-contain" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={globeStillImage} alt="" className="gte-globe-still relative size-full object-contain" draggable={false} />
      </button>
      <div className="gte-country-heading pointer-events-none absolute z-10 text-[6.7cqw] leading-none font-black tracking-[.025em]" aria-hidden={view !== "country"}>{destination?.country ?? "China"}</div>
      {view === "country" && destination && <nav className="gte-destination-rail absolute z-20" aria-label="China destinations">
        {destinations.map((item) => <div key={item.id} className="gte-destination-option" data-selected={item.id === destination.id}>
          <button type="button" className="gte-destination-name" aria-pressed={item.id === destination.id} onClick={() => setSelectedId(item.id)}>{item.name}<span /></button>
          {item.id === destination.id && <button type="button" className="gte-destination-card" aria-label={`Explore ${item.name}`} onClick={() => openDestination(item)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.thumbnail ?? item.image} alt={item.name} /><span>VISIT →</span>
          </button>}
        </div>)}
      </nav>}
      {view === "destination" && destination && <div key={destination.id} className="gte-destination-content absolute inset-0 z-10 flex flex-col items-center">
        <h2 className="gte-destination-title m-0 text-center uppercase"><span className="block font-extralight">{destination.country}</span><strong className="block font-black">{destination.name}</strong></h2>
        {renderBooking()}
        <p role="status" className="gte-booking-status m-0 text-center">{status}</p>
        <button type="button" className="gte-return" onClick={() => setView("country")}>← Back to the globe</button>
      </div>}
      {menuOpen && <nav id={`${id}-menu`} className="gte-menu absolute z-30 rounded-[1.2cqw] border border-[#ffffff26] bg-[#07295de8] p-[2.5cqw] backdrop-blur-xl" aria-label="Choose a destination"><h3 className="m-0 mb-[1.5cqw] text-[1.4cqw] font-normal tracking-[.2em] uppercase">Explore China</h3>{destinations.map((item) => <button key={item.id} type="button" className="block w-full border-0 border-b border-[#ffffff18] bg-transparent py-[1.5cqw] text-left text-[2cqw]" onClick={() => openDestination(item)}>{item.name} <span className="float-right">↗</span></button>)}</nav>}
    </div>
    <div className="gte-mobile-controls" aria-label="Travel controls">
      <div className="gte-mobile-navigation"><button type="button" onClick={() => { setView(view === "destination" ? "country" : "world"); setMenuOpen(false); }} aria-label="Back to the globe">← Globe</button><button type="button" onClick={() => setView("country")} aria-pressed={view === "country"}>Explore China</button></div>
      <div className="gte-mobile-destinations">{destinations.map((item) => <button type="button" key={item.id} onClick={() => openDestination(item)} aria-pressed={view === "destination" && destination?.id === item.id}>{item.name} ↗</button>)}</div>
      {view === "destination" && destination && <><h3 className="gte-mobile-title">Plan your {destination.name} trip</h3>{renderBooking(true)}<p role="status" className="gte-mobile-status">{status}</p></>}
    </div>
    <dialog ref={accountDialog} className="gte-account-dialog" aria-labelledby={`${id}-account-title`} aria-describedby={`${id}-account-description`} onCancel={(event) => { event.preventDefault(); closeAccount(); }}>
      <button type="button" className="gte-account-close" aria-label="Close account dialog" onClick={closeAccount}>×</button>
      <p className="gte-account-brand">{brand}</p>
      <h2 id={`${id}-account-title`}>{accountAction === "signup" ? "Sign up" : "Log in"}</h2>
      <p id={`${id}-account-description`}>Enter your email to continue your travel planning.</p>
      <form onSubmit={submitAccount}>
        <label htmlFor={`${id}-account-email`}>Email address</label>
        <input ref={accountInput} id={`${id}-account-email`} type="email" required autoComplete="email" value={accountEmail} onChange={(event) => setAccountEmail(event.target.value)} placeholder="you@example.com" />
        <button type="submit" disabled={accountPending}>{accountPending ? "Continuing…" : "Continue with email"} <span aria-hidden="true">→</span></button>
      </form>
      <p className="gte-account-note">Demo preview · No password is requested.</p>
      <p className="gte-account-status" role="status">{accountStatus}</p>
    </dialog>
  </section>;
}

function Stars() {
  return <div className="gte-stars absolute inset-0">{Array.from({ length: 54 }, (_, index) => <i key={index} className="absolute rounded-full bg-[#ddffff]" style={{ left: `${(index * 37 + 9) % 97}%`, top: `${(index * 53 + 7) % 96}%`, width: index % 11 === 0 ? ".5%" : ".18%", aspectRatio: "1", opacity: index % 4 === 0 ? .5 : .18, "--star-delay": `${(index % 7) * -.45}s` } as CSSProperties} />)}</div>;
}

export function GlobeTravelExplorerThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Number.isFinite(previewStep) ? Math.abs(Math.trunc(previewStep)) % 3 : 0;
  return <div className={`globe-travel-explorer gte-thumbnail @container relative isolate h-full w-full overflow-hidden bg-[linear-gradient(125deg,#45e1e8,#42b9d6_48%,#2568b8)] font-[Arial,Helvetica,sans-serif] text-[#e9fffc] ${className}`} aria-hidden="true" inert>
    <ComponentStyles css={STYLES} />
    <div className="gte-thumbnail-canvas relative">
    <div className="gte-viewport relative overflow-hidden rounded-[2cqw] bg-[#05236a]" data-view={step === 2 ? "destination" : step === 1 ? "country" : "world"}>
      <div className="gte-space absolute inset-0"><Stars /><span className="gte-flare" /></div>
      {step === 2 && <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={DESTINATIONS[1].image} alt="" className="size-full object-cover" />
      </div>}
      <div className="gte-header absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-[#ffffff0b]"><span className="gte-brand font-bold tracking-[.08em]">◜ TRAVELÓ</span><span className="gte-header-actions text-[.9cqw]">LOGIN　 SIGN UP　 ☰</span></div>
      {step < 2 && <><div className="gte-world-heading absolute inset-0 flex items-center justify-center"><div><span className="gte-world-eyebrow block text-[1.45cqw] text-[#9fe5f7]">EXPLORE YOUR</span><span className="gte-world-word flex justify-between text-[9.8cqw] leading-[.95] font-black">{"WORLD".split("").map((letter, index) => <span key={index}>{letter}</span>)}</span></div></div><div className="gte-globe absolute z-10"><span className="gte-globe-glow absolute inset-[8%] rounded-full" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={GLOBE_STILL} alt="" className="relative size-full object-contain" />
      </div>{step === 1 && <span className="gte-country-heading absolute z-10 text-[6.7cqw] leading-none font-black">CHINA</span>}</>}
      {step === 2 && <div className="gte-destination-content absolute inset-0 z-10 flex flex-col items-center"><div className="gte-destination-title text-center uppercase"><span className="block font-extralight">China</span><strong className="block font-black">Zhangjiajie</strong></div><div className="gte-booking flex bg-[#f9ffff] text-[#536663]"><span className="flex-1 px-[1cqw] py-[.7cqw] text-[.8cqw]">Check in　　Check out　　Adults</span><span className="bg-[#f13b52] px-[1cqw] text-white">→</span></div></div>}
    </div>
    </div>
  </div>;
}

const STYLES = `
.globe-travel-explorer{container-type:inline-size}
.globe-travel-explorer:not(.gte-thumbnail){width:min(100%,960px);margin-inline:auto}
.gte-viewport{width:93%;height:52.3cqw;margin:24cqw auto 23.7cqw;box-shadow:0 5cqw 4cqw -2cqw #002749a3,0 1cqw 5cqw #0b307530}
.gte-space{background:radial-gradient(ellipse at 48% 45%,#249ed9 0%,#126dbb 38%,#082f7f 76%,#051b61 100%)}
.gte-flare{position:absolute;left:59%;top:28%;width:10%;height:18%;background:radial-gradient(ellipse,#d6fff8 0%,#64f4fcaa 25%,transparent 70%);filter:blur(.65cqw)}
.gte-stars i{animation:gte-twinkle 3s var(--star-delay) infinite alternate}
.gte-header{height:4.5cqw;padding:0 3cqw 0 .65cqw;color:#e9fffc}
.gte-brand{font-size:1.3cqw;line-height:1}
.gte-logo{width:3.1cqw;height:2.8cqw}
.gte-text-button{border:0;background:transparent;padding:0;color:inherit;font-size:.8cqw;opacity:.65}
.gte-icon-button{border:0;background:transparent;padding:0;display:grid;place-items:center;width:1.2cqw;height:1.2cqw;color:inherit}
.gte-icon-button svg{width:100%;height:100%}
.gte-menu-button{width:2.7cqw;height:2.7cqw;padding:.7cqw;border-radius:50%;background:#ffffff12}
.gte-page-dots{left:1.4cqw;top:45%;transform:translateY(-50%)}
.gte-page-dot{width:.35cqw;height:.35cqw;padding:0;background:#ddffff55;border:0;border-radius:50%;box-shadow:0 0 0 .7cqw transparent}
.gte-page-dot[aria-pressed=true]{background:#eaffff}
.gte-world-heading{transition:opacity .45s,transform .75s;color:#e9fffc}
.gte-world-heading>div{transform:translateX(4.5cqw)}
.gte-world-word{display:grid;grid-template-columns:16% 51% 12% 10% 11%;width:60cqw}
.gte-world-word>span:nth-child(2){visibility:hidden}
.gte-world-eyebrow{margin-bottom:.45cqw}
.gte-globe{width:40.5%;aspect-ratio:1;left:50%;top:50%;transform:translate(-50%,-50%);transition:left 1s cubic-bezier(.22,.7,.25,1),transform 1.4s cubic-bezier(.7,0,.3,1),opacity .7s;cursor:pointer}
.gte-globe-glow{background:radial-gradient(circle,transparent 64%,#5df6fc40 70%,#5df6fc80 75%,transparent 81%);box-shadow:0 0 3cqw #6dfff955,0 0 7cqw #2ceffd33}
.gte-globe-spin{z-index:1}
.gte-globe-still{display:block;position:absolute;inset:0}
.gte-country-heading{left:37.1%;top:42%;font-size:7.7cqw;text-transform:uppercase;opacity:0;transform:translateY(20%);transition:opacity .7s .2s,transform .7s .2s;pointer-events:none}
.gte-viewport[data-view=country] .gte-globe{left:33.5%}
.gte-viewport[data-view=country] .gte-world-heading,.gte-viewport[data-view=destination] .gte-world-heading{opacity:0;transform:translateY(-2cqw)}
.gte-viewport[data-view=country] .gte-country-heading{opacity:1;transform:translateY(0)}
.gte-viewport[data-view=destination] .gte-globe{left:30%;transform:translate(-50%,-50%) scale(7);opacity:0;pointer-events:none}
.gte-destination-rail{right:4.5cqw;top:10.5cqw;width:16.7cqw;border-right:1px solid #b9e8ff40}
.gte-destination-option{position:relative;margin-bottom:4.7cqw}
.gte-destination-name{position:relative;display:block;width:100%;border:0;background:transparent;padding:0 2cqw 1cqw 0;text-align:right;font-size:.95cqw;line-height:1.2;text-transform:uppercase;color:#b3dafa}
.gte-destination-name>span{position:absolute;right:-.32cqw;top:.1cqw;width:.58cqw;height:.58cqw;border-radius:50%;background:#b3dafa55}
.gte-destination-name[aria-pressed=true]>span{background:#eaffff;box-shadow:0 0 0 .4cqw #c6f7fc33}
.gte-destination-card{position:relative;display:block;width:calc(100% - 1.4cqw);aspect-ratio:1.65;margin-top:1cqw;border:0;padding:0;background:#083b70;animation:gte-card-in .5s both}
.gte-destination-card img{width:100%;height:100%;object-fit:cover}
.gte-destination-card>span{position:absolute;top:20%;left:-.6cqw;background:#f44251;color:#fff;padding:.4cqw .8cqw;font-size:.75cqw;line-height:1}
.gte-scenery{opacity:0;transform:translateY(30%) scale(1.3);transition:opacity .9s .5s,transform 1.8s cubic-bezier(.22,.75,.2,1)}
.gte-viewport[data-view=destination] .gte-scenery{opacity:1;transform:translateY(0) scale(1)}
.gte-destination-content{padding-top:9cqw;animation:gte-copy-in 1.4s both}
.gte-destination-title{color:#e8fbf3;line-height:1.1;max-width:97%;transform:translateX(1cqw)}
.gte-destination-title>span{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-size:6.7cqw;letter-spacing:-.025em;font-weight:100}
.gte-destination-title>strong{font-size:9.5cqw;letter-spacing:.02em;line-height:.94}
.gte-booking{width:48%;min-height:4.3cqw;margin-top:2cqw;box-shadow:0 .2cqw 1cqw #0b403933;flex-shrink:0}
.gte-booking label{display:flex;min-width:0;flex:1;flex-direction:column;justify-content:center;padding:.65cqw 1.1cqw;font-size:.8cqw;line-height:1.2}
.gte-booking input,.gte-booking select{border:0;border-radius:0;background:transparent;color:#536663;font-family:inherit;font-size:.85cqw;line-height:1.2;padding:.3cqw 0 0;min-width:0;max-width:100%;width:100%;outline-offset:0}
.gte-booking input::-webkit-calendar-picker-indicator{width:.8cqw;opacity:.5;margin:0;padding:0}
.gte-booking label:nth-child(3){flex:.5}
.gte-booking>button{width:4.4cqw;flex-shrink:0;border:0;background:#f34256;color:#fff;font-size:2cqw}
.gte-booking-status{min-height:2cqw;max-width:75%;padding-top:1cqw;font-size:1.2cqw;color:#edfffc;text-shadow:0 1px 3px #002c20}
.gte-return{border:0;background:#092f3540;color:#e8fffb;padding:.5cqw 1cqw;border-radius:2cqw;font-size:1.1cqw}
.gte-menu{right:3cqw;top:5.3cqw;width:29cqw;box-shadow:0 1cqw 3cqw #07162844}
.gte-mobile-controls{display:none}
.gte-account-dialog{position:fixed;inset:0;width:min(380px,calc(100vw - 32px));max-height:calc(100dvh - 32px);margin:auto;padding:28px;border:1px solid #c5fff36b;border-radius:22px;background:linear-gradient(145deg,#113b67,#09264e);color:#eefffc;box-shadow:0 24px 90px #03122680;overflow:auto;font:14px/1.5 Arial,Helvetica,sans-serif;box-sizing:border-box}
.gte-account-dialog::backdrop{background:#031528a6;backdrop-filter:blur(8px)}
.gte-account-close{position:absolute;top:12px;right:12px;display:grid;place-items:center;width:36px;height:36px;border:1px solid #edffff36;border-radius:50%;background:#ffffff0a;color:#f1fffe;font-size:24px;line-height:1}
.gte-account-brand{margin:0 0 20px;color:#b4eee9;font-size:11px;font-weight:700;letter-spacing:.16em}
.gte-account-dialog h2{margin:0 0 8px;font:700 30px/1.2 Arial,sans-serif;letter-spacing:-.04em}
.gte-account-dialog h2+p{margin:0 0 22px;color:#b7d5df;font-size:13px}
.gte-account-dialog form{display:flex;flex-direction:column;gap:9px}
.gte-account-dialog form label{font-size:12px;font-weight:600}
.gte-account-dialog form input{display:block;min-width:0;width:100%;height:44px;padding:10px 12px;box-sizing:border-box;border:1px solid #d6fdf044;border-radius:10px;background:#effffb0b;color:#f0fffd;font:14px/1.4 Arial,sans-serif}
.gte-account-dialog form input::placeholder{color:#a4c0ce}
.gte-account-dialog form button{display:flex;align-items:center;justify-content:space-between;min-height:44px;padding:10px 14px;border:0;border-radius:10px;background:#e8fffa;color:#133d55;font:600 13px/1.4 Arial,sans-serif}
.gte-account-dialog form button:disabled{opacity:.65;cursor:wait}
.gte-account-note{margin:16px 0 0;color:#a7c6d1;font-size:11px}
.gte-account-status{margin:12px 0 0;color:#d6fff1;font-size:12px;overflow-wrap:anywhere}
.gte-account-status:empty{display:none}
.globe-travel-explorer button:focus-visible,.globe-travel-explorer input:focus-visible,.globe-travel-explorer select:focus-visible{outline:2px solid #b9fff3;outline-offset:3px}
.gte-booking input:focus-visible,.gte-booking select:focus-visible{outline-color:#106966;outline-offset:1px}
.gte-thumbnail{aspect-ratio:auto;display:flex;align-items:center;justify-content:center}
.gte-thumbnail-canvas{aspect-ratio:1;height:100%;max-width:100%;container-type:inline-size;display:flex;align-items:center;width:auto}
.gte-thumbnail .gte-viewport{margin:0 auto;height:52.3cqw;width:93%}
.gte-thumbnail *{animation:none!important;transition:none!important}
@keyframes gte-twinkle{to{opacity:.55;transform:scale(1.5)}}
@keyframes gte-copy-in{0%,45%{opacity:0;transform:translateY(8cqw)}100%{opacity:1;transform:translateY(0)}}
@keyframes gte-card-in{from{opacity:0;transform:translateY(1cqw)}to{opacity:1;transform:translateY(0)}}
@container(max-width:480px){
 .globe-travel-explorer:not(.gte-thumbnail) .gte-header{height:36px;padding:0 7px}
 .globe-travel-explorer:not(.gte-thumbnail) .gte-header-actions{gap:6px}
 .globe-travel-explorer:not(.gte-thumbnail) .gte-logo{width:14px;height:16px}
 .globe-travel-explorer:not(.gte-thumbnail) .gte-brand{font-size:10px}
 .globe-travel-explorer:not(.gte-thumbnail) .gte-text-button{font-size:11px;min-height:32px}
 .globe-travel-explorer:not(.gte-thumbnail) .gte-icon-button{width:28px;height:32px;padding:7px}
 .globe-travel-explorer:not(.gte-thumbnail) .gte-menu-button{width:28px;height:28px;padding:7px}
 .globe-travel-explorer:not(.gte-thumbnail) .gte-destination-content{padding-top:max(9cqw,38px)}
 .globe-travel-explorer:not(.gte-thumbnail) .gte-destination-content .gte-booking,.globe-travel-explorer:not(.gte-thumbnail) .gte-destination-content .gte-return,.globe-travel-explorer:not(.gte-thumbnail) .gte-booking-status{display:none}
 .globe-travel-explorer:not(.gte-thumbnail) .gte-viewport{margin-bottom:7cqw}
 .gte-mobile-controls{display:block;margin:0 3.5% 20px;padding:12px;border:1px solid #c5fffa55;border-radius:16px;background:#074c8290;box-shadow:0 8px 25px #124b7e30}
 .gte-mobile-navigation,.gte-mobile-destinations{display:flex;gap:8px;flex-wrap:wrap}
 .gte-mobile-destinations{margin-top:8px}
 .gte-mobile-controls button{min-height:36px;border:1px solid #f0ffff44;border-radius:8px;background:#e5ffff12;color:#e9fffc;font:12px/1.3 Arial,sans-serif;padding:7px 11px}
 .gte-mobile-controls button[aria-pressed=true]{background:#eaffff;color:#164d62}
 .gte-mobile-title{margin:15px 0 8px;font:600 13px/1.4 Arial,sans-serif}
 .gte-mobile-controls .gte-mobile-booking{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);width:100%;margin:0;min-height:0;border-radius:10px;overflow:hidden;padding:5px;gap:4px}
 .gte-mobile-booking label{padding:5px 6px;font-size:11px;gap:4px}
 .gte-mobile-booking input,.gte-mobile-booking select{font-size:12px;min-height:32px;padding:4px 0}
 .gte-mobile-booking input::-webkit-calendar-picker-indicator{width:12px}
 .gte-mobile-booking>button{align-self:end;width:100%;height:36px;min-height:36px;margin-bottom:5px;border:0;border-radius:7px;background:#f34256;color:#fff;font-size:20px}
 .gte-mobile-status{margin:8px 0 0;font:12px/1.5 Arial,sans-serif}
 .globe-travel-explorer:not(.gte-thumbnail) .gte-destination-name{font-size:1.35cqw}
 .globe-travel-explorer:not(.gte-thumbnail) .gte-destination-card>span{font-size:1cqw}
 .globe-travel-explorer:not(.gte-thumbnail) .gte-menu{width:65cqw;top:38px;max-height:calc(100% - 42px);overflow-y:auto;padding:12px}
 .globe-travel-explorer:not(.gte-thumbnail) .gte-menu h3{font-size:11px}
 .globe-travel-explorer:not(.gte-thumbnail) .gte-menu button{font-size:13px;min-height:36px}
}
@media(prefers-reduced-motion:reduce){.globe-travel-explorer *{animation:none!important;transition:none!important}.gte-globe-spin{display:none}.gte-globe-still{display:block}}
`;
