"use client";

import { ComponentStyles } from "./component-styles";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

export interface DestinationSlide {
  id: string;
  country: string;
  title: [string, string];
  description: string;
  image: string;
  imagePosition?: string;
  bestTime?: string;
  experience?: string;
}

export interface DestinationCarouselProps {
  slides?: DestinationSlide[];
  initialIndex?: number;
  autoPlay?: boolean;
  /** Time between transitions, in milliseconds. Minimum: 2,000. */
  interval?: number;
  /** Supply your own destination action, or omit to open the built-in details. */
  onDiscover?: (destination: DestinationSlide) => void;
  className?: string;
}

const DEFAULT_SLIDES: DestinationSlide[] = [
  {
    id: "swiss-alps",
    country: "Switzerland · Alps",
    title: ["Saint", "Antonien"],
    description:
      "Tucked away in the Swiss Alps, Saint Antönien offers an idyllic retreat for those seeking tranquility and adventure alike. Discover alpine trails, quiet villages, and a world beyond the everyday.",
    image: "https://assets.codepen.io/3685267/timed-cards-1.jpg",
    bestTime: "June – September",
    experience:
      "Alpine hikes, mountain lakes, and slow mornings in the Swiss Alps.",
  },
  {
    id: "japan",
    country: "Japan · Japanese Alps",
    title: ["Nagano", "Prefecture"],
    description:
      "Ancient traditions meet extraordinary mountain landscapes. Wander quiet streets, discover tucked-away temples, and find your own rhythm in the heart of Japan.",
    image: "https://assets.codepen.io/3685267/timed-cards-2.jpg",
    bestTime: "March – May · October – November",
    experience:
      "Historic streets, mountain escapes, and Japan’s changing seasons.",
  },
  {
    id: "morocco",
    country: "Sahara Desert · Morocco",
    title: ["Marrakech", "Merzouga"],
    description:
      "The journey from the vibrant souks and palaces of Marrakech to the tranquil, starlit dunes of Merzouga showcases the diverse splendor of Morocco. A world of wonder, shaped by sand and time.",
    image: "https://assets.codepen.io/3685267/timed-cards-3.jpg",
    bestTime: "March – May · September – November",
    experience:
      "Golden dunes, desert sunsets, and nights beneath a sky full of stars.",
  },
  {
    id: "yosemite",
    country: "California · United States",
    title: ["Yosemite", "National Park"],
    description:
      "Towering granite cliffs rise above ancient forests and open meadows. Follow the sound of waterfalls and discover the breathtaking scale of California’s unforgettable wilderness.",
    image: "https://assets.codepen.io/3685267/timed-cards-4.jpg",
    bestTime: "May – October",
    experience:
      "Waterfall walks, granite peaks, and peaceful trails through the valley.",
  },
  {
    id: "spain",
    country: "Tarifa · Spain",
    title: ["Los Lances", "Beach"],
    description:
      "Where the Atlantic breeze meets endless golden sands, life slows to the rhythm of the ocean. Lose yourself in wild coastlines, salt air, and the last light of a perfect day.",
    image: "https://assets.codepen.io/3685267/timed-cards-5.jpg",
    bestTime: "May – September",
    experience: "Coastal walks, open horizons, and sunset by the Atlantic.",
  },
  {
    id: "turkey",
    country: "Cappadocia · Türkiye",
    title: ["Göreme", "Valley"],
    description:
      "A dreamlike landscape of sculpted stone, hidden cave dwellings, and soft morning light. Watch the valley awaken as colorful balloons drift above a place unlike anywhere else.",
    image: "https://assets.codepen.io/3685267/timed-cards-6.jpg",
    bestTime: "April – June · September – October",
    experience:
      "Fairy chimneys, historic cave villages, and unforgettable dawn views.",
  },
];

type IconName =
  | "globe"
  | "left"
  | "right"
  | "bookmark"
  | "pause"
  | "play"
  | "close"
  | "search";

function DestinationIcon({
  name,
  size = 18,
}: {
  name: IconName;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "globe" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
          <path d="M3 12h18M5 6.5h14M5 17.5h14" />
        </>
      )}
      {name === "left" && <path d="m14.5 6-6 6 6 6" />}
      {name === "right" && <path d="m9.5 6 6 6-6 6" />}
      {name === "bookmark" && <path d="M6 4h12v17l-6-4-6 4V4Z" />}
      {name === "pause" && (
        <>
          <path d="M9 6v12M15 6v12" strokeWidth="3" />
        </>
      )}
      {name === "play" && (
        <path d="m9 5 10 7-10 7V5Z" fill="currentColor" stroke="none" />
      )}
      {name === "close" && <path d="m6 6 12 12M6 18 18 6" />}
      {name === "search" && (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </>
      )}
    </svg>
  );
}

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

const getReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getPageHidden = () => document.hidden;
const getServerSnapshot = () => false;
const wrap = (index: number, length: number) =>
  ((index % length) + length) % length;
const photoStyle = (slide: DestinationSlide): CSSProperties => ({
  backgroundImage: `url(${JSON.stringify(slide.image)})`,
  backgroundPosition: slide.imagePosition ?? "center",
});

interface Expansion {
  target: number;
  left: number;
  top: number;
  width: number;
  height: number;
  radius: string;
}

/*
 * Shared Tailwind class sets. Container breakpoints mirror the original inclusive
 * `max-width` queries (≤ 650 / 480 / 320px): Tailwind's `@max-[x]` means
 * `width < x`, so each is offset by 0.01px, finer than layout precision.
 */
const DISPLAY_FONT =
  "font-['Destination_Condensed',Impact,'Arial_Narrow',sans-serif] font-medium";
const REDUCED_MOTION =
  "motion-reduce:**:animate-none! motion-reduce:**:[transition:none]! motion-reduce:**:scroll-auto!";
const STAGE =
  "dest-stage relative isolate w-full overflow-hidden bg-[#14221e] text-white touch-pan-y -outline-offset-4 [--dest-card-height:33%] [--dest-card-left:55%] [--dest-card-step:17%] [--dest-card-top:55%] [--dest-card-width:14%]";
const SHADE =
  "dest-shade pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(90deg,rgba(5,13,12,0.46),rgba(5,13,12,0.09)_62%),linear-gradient(0deg,rgba(2,10,8,0.38),transparent_45%,rgba(2,10,8,0.12))]";
const BACKGROUND =
  "dest-background absolute inset-0 z-0 bg-[#203a30] bg-cover bg-no-repeat";
const DETAILS =
  "dest-details absolute left-[4%] z-[3] [text-shadow:0_1px_8px_#0004]";
const CARD =
  "dest-card absolute top-(--dest-card-top) left-[calc(var(--dest-card-left)+var(--dest-position)*var(--dest-card-step))] z-[4] h-(--dest-card-height) w-(--dest-card-width) overflow-hidden border-none bg-cover bg-no-repeat p-0 text-left [box-shadow:4px_8px_25px_#0005] [transition:left_0.7s_cubic-bezier(0.22,0.75,0.18,1),opacity_0.45s,box-shadow_0.2s]";
const CARD_GRADIENT =
  "dest-card-gradient pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,#050d0cdc,transparent_69%)]";
const CARD_COPY = "dest-card-copy absolute right-[7%] bottom-[7%] left-[9%] text-white";
/** Every control: pointer cursor and no tap flash. Focus rings live in DESTINATION_STYLES. */
const CONTROL =
  "cursor-pointer [-webkit-tap-highlight-color:transparent] disabled:cursor-default";
const NAV_BUTTON = `${CONTROL} relative border-none bg-transparent px-0 py-[6px] text-[clamp(8px,0.9cqw,11px)] font-semibold tracking-[0.015em] uppercase hover:text-[#ffd167] @max-[480.01px]:py-[8px] @max-[480.01px]:text-[8px]`;
const ROUND_CONTROL = `${CONTROL} dest-round-control inline-flex size-[32px] shrink-0 items-center justify-center rounded-[50%] border border-[#ffffff70] bg-transparent p-0 [transition:background_0.2s,border-color_0.2s] enabled:hover:border-white enabled:hover:bg-[#ffffff20] disabled:opacity-45 @max-[650.01px]:size-[26px] @max-[480.01px]:size-[31px]`;
const DIALOG_TEXT = "m-0 mb-[20px] text-[13px] leading-[1.7] text-[#626960]";
const DIALOG_TITLE = `${DISPLAY_FONT} m-0 mr-[22px] mb-[15px] text-[32px] leading-[1.2] uppercase`;
const FACT_TERM = "mb-[6px] text-[10px] tracking-[0.08em] text-[#797d71] uppercase";
const FACT_DETAIL = "m-0 text-[13px] leading-[1.6]";
const THUMB_ARROW =
  "flex size-[13px] items-center justify-center rounded-[50%] border border-[#fff8] text-[10px]";

/** A dependency-free, card-to-background travel carousel. Copy this entire file. */
export default function DestinationCarousel({
  slides = DEFAULT_SLIDES,
  initialIndex = 0,
  autoPlay = true,
  interval = 5000,
  onDiscover,
  className = "",
}: DestinationCarouselProps) {
  const destinations = slides.length ? slides : DEFAULT_SLIDES;
  const start = wrap(
    Number.isFinite(initialIndex) ? Math.trunc(initialIndex) : 0,
    destinations.length,
  );
  const [index, setIndex] = useState(start);
  const [backgroundIndex, setBackgroundIndex] = useState(start);
  const [expansion, setExpansion] = useState<Expansion | null>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const [imageStatus, setImageStatus] = useState<
    Record<string, "loaded" | "error">
  >({});
  const [saved, setSaved] = useState<string[]>([]);
  const [panel, setPanel] = useState<
    "details" | "destinations" | "saved" | null
  >(null);
  const [search, setSearch] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const expansionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<number, HTMLButtonElement>());
  const dialogRef = useRef<HTMLDialogElement>(null);
  const transitionLock = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const id = useId();
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerSnapshot,
  );
  const pageHidden = useSyncExternalStore(
    subscribeVisibility,
    getPageHidden,
    getServerSnapshot,
  );
  const currentIndex = wrap(index, destinations.length);
  const imageSources = JSON.stringify(destinations.map((slide) => slide.image));
  const slideIdentity = destinations.map((slide) => slide.id).join("\u0000");
  const active = destinations[currentIndex];
  const background = destinations[wrap(backgroundIndex, destinations.length)];
  const canNavigate = destinations.length > 1;
  const isSaved = saved.includes(active.id);
  const isRunning =
    playing &&
    !hovered &&
    !focused &&
    !panel &&
    !pageHidden &&
    inView &&
    !reducedMotion &&
    !expansion &&
    canNavigate &&
    imageStatus[
      destinations[wrap(currentIndex + 1, destinations.length)].image
    ] === "loaded";

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const photos = (JSON.parse(imageSources) as string[]).map((source) => {
      const photo = new Image();
      const update = (status: "loaded" | "error") => {
        if (!cancelled)
          setImageStatus((previous) => ({ ...previous, [source]: status }));
      };
      photo.onload = () => update("loaded");
      photo.onerror = () => update("error");
      photo.src = source;
      return photo;
    });
    return () => {
      cancelled = true;
      photos.forEach((photo) => {
        photo.onload = null;
        photo.onerror = null;
      });
    };
  }, [imageSources]);

  const goTo = useCallback(
    (requestedIndex: number) => {
      const target = wrap(requestedIndex, destinations.length);
      if (target === currentIndex || transitionLock.current) return;

      const stage = stageRef.current;
      const distance = wrap(target - currentIndex, destinations.length);
      const visibleTarget = distance > 0 && distance <= 3;
      const card = cardRefs.current.get(
        visibleTarget
          ? target
          : wrap(
              currentIndex + Math.min(3, destinations.length - 1),
              destinations.length,
            ),
      );
      if (
        stage &&
        Array.from(cardRefs.current.values()).some(
          (destinationCard) => destinationCard === document.activeElement,
        )
      )
        stage.focus({ preventScroll: true });
      if (!stage || reducedMotion) {
        setIndex(target);
        setBackgroundIndex(target);
        return;
      }

      const stageBounds = stage.getBoundingClientRect();
      const cardBounds = card?.getBoundingClientRect();
      // Use the actual card bounds so the photograph opens from its exact position.
      // Previous / offscreen destinations enter from the trailing card position.
      const origin =
        card && cardBounds
          ? {
              left: cardBounds.left - stageBounds.left,
              top: cardBounds.top - stageBounds.top,
              width: cardBounds.width,
              height: cardBounds.height,
              radius: getComputedStyle(card).borderRadius,
            }
          : {
              left: stageBounds.width * 0.85,
              top: stageBounds.height * 0.55,
              width: stageBounds.width * 0.14,
              height: stageBounds.height * 0.33,
              radius: "8px",
            };

      transitionLock.current = true;
      setExpansion({ target, ...origin });
      setIndex(target);
    },
    [currentIndex, destinations.length, reducedMotion],
  );

  useEffect(() => {
    if (!expansion || !expansionRef.current) return;
    const animation = expansionRef.current.animate(
      [
        {
          left: `${expansion.left}px`,
          top: `${expansion.top}px`,
          width: `${expansion.width}px`,
          height: `${expansion.height}px`,
          borderRadius: expansion.radius,
        },
        {
          left: "0px",
          top: "0px",
          width: "100%",
          height: "100%",
          borderRadius: "0px",
        },
      ],
      {
        duration: reducedMotion ? 0 : 800,
        easing: "cubic-bezier(.22,.75,.18,1)",
        fill: "forwards",
      },
    );
    animation.onfinish = () => {
      setBackgroundIndex(expansion.target);
      setExpansion(null);
      transitionLock.current = false;
    };
    return () => animation.cancel();
  }, [expansion, reducedMotion, slideIdentity]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setTimeout(
      () => goTo(currentIndex + 1),
      Number.isFinite(interval) ? Math.max(2000, interval) : 5000,
    );
    return () => window.clearTimeout(timer);
  }, [currentIndex, goTo, interval, isRunning]);

  // Native modal dialogs provide focus trapping, Escape, and focus restoration.
  useEffect(() => {
    if (panel && dialogRef.current && !dialogRef.current.open)
      dialogRef.current.showModal();
  }, [panel]);

  function openPanel(nextPanel: "details" | "destinations" | "saved") {
    setSearch("");
    setPanel(nextPanel);
  }

  function closePanel() {
    dialogRef.current?.close();
    setPanel(null);
  }

  function toggleSaved() {
    setSaved((previous) =>
      previous.includes(active.id)
        ? previous.filter((value) => value !== active.id)
        : [...previous, active.id],
    );
  }

  function toggleAutoplay() {
    if (playing) {
      setPlaying(false);
      return;
    }

    // An explicit start overrides the hover/focus that activated this button.
    // The next pointer entry or focus change will pause playback again.
    setHovered(false);
    setFocused(false);
    setPlaying(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      panel ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(currentIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
  }

  const matchingDestinations = destinations.filter(
    (slide) =>
      (panel !== "saved" || saved.includes(slide.id)) &&
      `${slide.title.join(" ")} ${slide.country}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );

  return (
    <div
      className={`dest-root @container flex min-h-0 w-full flex-col font-[Arial,Helvetica,sans-serif] text-white ${REDUCED_MOTION} ${className}`}
    >
      <ComponentStyles css={DESTINATION_STYLES} />
      <div
        ref={stageRef}
        className={`${STAGE} aspect-[3/2] min-h-[56.25cqw] flex-[1_1_auto] @max-[480.01px]:aspect-auto @max-[480.01px]:h-[720px] @max-[480.01px]:min-h-[720px] @max-[480.01px]:[--dest-card-height:23%] @max-[480.01px]:[--dest-card-left:6%] @max-[480.01px]:[--dest-card-step:30%] @max-[480.01px]:[--dest-card-top:66%] @max-[480.01px]:[--dest-card-width:26%] @max-[320.01px]:h-[730px] @max-[320.01px]:min-h-[730px]`}
        role="region"
        aria-roledescription="carousel"
        aria-label="Explore destinations"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setFocused(false);
        }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          if (!touchStart.current || panel) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - touchStart.current.x;
          const dy = touch.clientY - touchStart.current.y;
          touchStart.current = null;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4)
            goTo(currentIndex + (dx < 0 ? 1 : -1));
        }}
      >
        <div
          className={BACKGROUND}
          style={photoStyle(background)}
          aria-hidden="true"
        />
        {expansion && (
          <div
            ref={expansionRef}
            className="dest-expansion absolute z-[1] bg-cover bg-no-repeat will-change-[width,height,left,top]"
            aria-hidden="true"
            style={{
              ...photoStyle(
                destinations[wrap(expansion.target, destinations.length)],
              ),
              left: expansion.left,
              top: expansion.top,
              width: expansion.width,
              height: expansion.height,
              borderRadius: expansion.radius,
            }}
          />
        )}
        <div
          className={`${SHADE} @max-[480.01px]:bg-[linear-gradient(90deg,#07181077,transparent),linear-gradient(0deg,#081a13aa,transparent_30%,#07181033)]`}
          aria-hidden="true"
        />
        {imageStatus[active.image] === "error" && (
          <p
            className="dest-photo-unavailable absolute bottom-[4%] left-[4%] z-[3] m-0 text-[10px] text-[#fff9]"
            role="status"
          >
            The destination photo is unavailable.
          </p>
        )}

        <header className="dest-header absolute top-[4.6%] right-[4%] left-[4%] z-[5] flex items-center justify-between @max-[480.01px]:top-[5%] @max-[480.01px]:right-[6%] @max-[480.01px]:left-[6%]">
          <button
            type="button"
            className={`${CONTROL} dest-brand inline-flex items-center gap-[7px] border-none bg-none px-0 py-[4px] text-[clamp(8px,1.05cqw,13px)] font-bold tracking-[0.025em] whitespace-nowrap uppercase @max-[480.01px]:gap-[5px] @max-[480.01px]:text-[9px] @max-[480.01px]:[&>svg]:w-[15px] @max-[320.01px]:text-[8px]`}
            onClick={() => goTo(0)}
            aria-label="Globe Express, first destination"
          >
            <DestinationIcon name="globe" size={17} />
            <span>Globe Express</span>
          </button>
          <nav
            className="dest-nav flex items-center gap-[2.35cqw] @max-[480.01px]:gap-[13px] @max-[320.01px]:gap-[9px]"
            aria-label="Destination navigation"
          >
            <button
              type="button"
              className={`${NAV_BUTTON} dest-nav-active after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-[#e9bb41] after:content-[''] @max-[480.01px]:hidden`}
              onClick={() => goTo(0)}
            >
              Home
            </button>
            <button
              type="button"
              className={NAV_BUTTON}
              onClick={() => openPanel("destinations")}
            >
              Destinations
            </button>
            <button
              type="button"
              className={NAV_BUTTON}
              onClick={() => openPanel("saved")}
            >
              Saved
              {saved.length > 0 && (
                <span className="dest-saved-count ml-[5px] inline-flex size-[14px] items-center justify-center rounded-[100%] bg-[#edbb36] text-[8px] text-[#13211d]">
                  {saved.length}
                </span>
              )}
            </button>
            <button
              type="button"
              className={`${NAV_BUTTON} dest-search-button flex items-center justify-center @max-[480.01px]:hidden`}
              onClick={() => openPanel("destinations")}
              aria-label="Search destinations"
            >
              <DestinationIcon name="search" size={15} />
            </button>
          </nav>
        </header>

        <div
          key={active.id}
          className={`${DETAILS} top-[27%] w-[36%] @max-[650.01px]:top-[25%] @max-[650.01px]:w-[43%] @max-[480.01px]:top-[18%] @max-[480.01px]:left-[6%] @max-[480.01px]:w-[88%] @max-[320.01px]:top-[16%]`}
          role="group"
          aria-roledescription="slide"
          aria-label={`${currentIndex + 1} of ${destinations.length}: ${active.title.join(" ")}`}
        >
          <div className="dest-eyebrow animate-[dest-rise_0.6s_cubic-bezier(0.2,0.7,0.2,1)_0.27s_both]">
            <span className="dest-small-rule mb-[9px] block h-[3px] w-[22px] bg-white" />
            <p className="m-0 mb-[13px] text-[clamp(10px,1.3cqw,16px)] leading-[1.4] font-medium @max-[480.01px]:mb-[14px] @max-[480.01px]:text-[12px]">
              {active.country}
            </p>
          </div>
          <h2
            className={`${DISPLAY_FONT} dest-title m-0 mb-[12px] flex flex-col text-[clamp(32px,5.9cqw,96px)] leading-[1.14] tracking-[-0.035em] uppercase @max-[650.01px]:text-[6.5cqw] @max-[480.01px]:mb-[15px] @max-[480.01px]:text-[clamp(32px,13cqw,63px)] @max-[480.01px]:leading-[1.08]`}
          >
            <span className="block animate-[dest-rise_0.6s_cubic-bezier(0.2,0.7,0.2,1)_0.33s_both] whitespace-nowrap">
              {active.title[0]}
            </span>
            <span className="block animate-[dest-rise_0.6s_cubic-bezier(0.2,0.7,0.2,1)_0.39s_both] whitespace-nowrap">
              {active.title[1]}
            </span>
          </h2>
          <p className="dest-description m-0 max-w-[34em] animate-[dest-rise_0.6s_cubic-bezier(0.2,0.7,0.2,1)_0.45s_both] text-[clamp(10px,1.17cqw,16px)] leading-[1.5] font-normal @max-[650.01px]:text-[10px] @max-[650.01px]:leading-[1.5] @max-[480.01px]:max-w-[290px] @max-[480.01px]:text-[12px] @max-[480.01px]:leading-[1.55] @max-[320.01px]:text-[11px] @max-[320.01px]:leading-[1.5]">
            {active.description}
          </p>
          <div className="dest-actions mt-[20px] flex animate-[dest-rise_0.6s_cubic-bezier(0.2,0.7,0.2,1)_0.51s_both] items-center gap-[11px] @max-[650.01px]:mt-[13px] @max-[650.01px]:gap-[7px] @max-[480.01px]:mt-[19px] @max-[480.01px]:gap-[10px]">
            <button
              type="button"
              className={`${CONTROL} dest-bookmark inline-flex size-[33px] shrink-0 items-center justify-center rounded-[50%] border-none bg-[#eebc32] [box-shadow:0_0_15px_#edbd3140] [transition:background_0.2s,transform_0.2s] hover:bg-[#ffce4e] hover:[transform:translateY(-2px)] aria-pressed:[&_svg]:fill-current @max-[650.01px]:size-[28px] @max-[480.01px]:size-[35px]`}
              aria-label={
                isSaved
                  ? `Remove ${active.title.join(" ")} from saved destinations`
                  : `Save ${active.title.join(" ")}`
              }
              aria-pressed={isSaved}
              onClick={toggleSaved}
            >
              <DestinationIcon name="bookmark" size={17} />
            </button>
            <button
              type="button"
              className={`${CONTROL} dest-discover min-h-[33px] rounded-[999px] border border-[#ffffffa3] bg-[#11231e15] px-[17px] py-0 text-[clamp(8px,0.89cqw,12px)] font-semibold uppercase [transition:background_0.2s,border-color_0.2s] hover:border-white hover:bg-[#ffffff1f] @max-[650.01px]:min-h-[28px] @max-[650.01px]:px-[11px] @max-[480.01px]:min-h-[35px] @max-[480.01px]:px-[17px] @max-[480.01px]:text-[9px]`}
              onClick={() =>
                onDiscover ? onDiscover(active) : openPanel("details")
              }
            >
              Discover location
            </button>
          </div>
        </div>

        <div className="dest-card-rail" aria-label="Upcoming destinations">
          {destinations.map((slide, slideIndex) => {
            const position =
              wrap(slideIndex - currentIndex, destinations.length) - 1;
            const visible = position >= 0 && position < 3;
            return (
              <button
                type="button"
                key={slide.id}
                ref={(node) => {
                  if (node) cardRefs.current.set(slideIndex, node);
                  else cardRefs.current.delete(slideIndex);
                }}
                className={`${CARD} ${CONTROL} rounded-[7px] enabled:hover:[box-shadow:0_0_0_1.5px_#fff9,4px_8px_25px_#0005] aria-hidden:invisible`}
                style={
                  {
                    ...photoStyle(slide),
                    "--dest-position": position,
                    opacity: visible ? 1 : 0,
                  } as CSSProperties
                }
                aria-label={`Explore ${slide.title.join(" ")}, ${slide.country}`}
                aria-hidden={!visible}
                tabIndex={visible ? 0 : -1}
                disabled={!visible || !!expansion}
                onClick={() => goTo(slideIndex)}
              >
                <span className={CARD_GRADIENT} />
                <span
                  className={`${CARD_COPY} @max-[480.01px]:bottom-[9%] @max-[480.01px]:left-[10%]`}
                >
                  <span className="dest-small-rule mb-[7px] block h-[2px] w-[15px] bg-white" />
                  <span className="dest-card-country mb-[4px] block text-[clamp(6px,0.75cqw,11px)] leading-[1.35] @max-[480.01px]:text-[7px] @max-[320.01px]:text-[6px]">
                    {slide.country}
                  </span>
                  <span
                    className={`${DISPLAY_FONT} dest-card-title block text-[clamp(11px,1.53cqw,23px)] leading-[1.23] tracking-[-0.02em] uppercase @max-[480.01px]:text-[15px] @max-[320.01px]:text-[12px]`}
                  >
                    {slide.title[0]}
                    <br />
                    {slide.title[1]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="dest-controls absolute top-[91%] right-[4%] left-[55%] z-[5] flex items-center gap-[8px] @max-[650.01px]:gap-[5px] @max-[480.01px]:top-[92%] @max-[480.01px]:right-[8%] @max-[480.01px]:left-[6%] @max-[480.01px]:gap-[9px]">
          <button
            type="button"
            className={ROUND_CONTROL}
            onClick={() => goTo(currentIndex - 1)}
            disabled={!canNavigate}
            aria-disabled={!canNavigate || !!expansion}
            aria-label="Previous destination"
          >
            <DestinationIcon name="left" />
          </button>
          <button
            type="button"
            className={ROUND_CONTROL}
            onClick={() => goTo(currentIndex + 1)}
            disabled={!canNavigate}
            aria-disabled={!canNavigate || !!expansion}
            aria-label="Next destination"
          >
            <DestinationIcon name="right" />
          </button>
          <div
            className="dest-progress mx-[8px] my-0 h-[2px] flex-1 overflow-hidden bg-[#ffffff4d] @max-[650.01px]:mx-[4px] @max-[480.01px]:mx-[6px]"
            aria-hidden="true"
          >
            <span
              className="block h-full bg-[#f2c346] [transition:width_0.8s_cubic-bezier(0.22,0.75,0.18,1)]"
              style={{
                width: `${((currentIndex + 1) / destinations.length) * 100}%`,
              }}
            />
          </div>
          <span
            className={`${DISPLAY_FONT} dest-slide-number text-[clamp(19px,3.2cqw,40px)] leading-none @max-[480.01px]:text-[28px]`}
            aria-hidden="true"
          >
            {String(currentIndex + 1).padStart(2, "0")}
          </span>
          <button
            type="button"
            className={`${CONTROL} dest-play-control flex h-[28px] w-[24px] items-center justify-center border-none bg-transparent p-0 opacity-85 hover:opacity-100 disabled:opacity-40`}
            disabled={!canNavigate || reducedMotion}
            onClick={toggleAutoplay}
            aria-label={
              reducedMotion
                ? "Autoplay disabled for reduced motion"
                : playing
                  ? "Pause autoplay"
                  : "Start autoplay"
            }
            aria-pressed={playing && !reducedMotion}
          >
            <DestinationIcon
              name={playing && !reducedMotion ? "pause" : "play"}
              size={14}
            />
          </button>
        </div>
        <p
          className="dest-sr-only absolute -m-px h-px w-px overflow-hidden border-none p-0 whitespace-nowrap [clip:rect(0,0,0,0)]"
          aria-live={isRunning || expansion ? "off" : "polite"}
          aria-atomic="true"
        >
          {active.title.join(" ")}. {active.country}. Destination{" "}
          {currentIndex + 1} of {destinations.length}.
        </p>

        <dialog
          ref={dialogRef}
          className="dest-dialog fixed inset-0 m-auto max-h-[85dvh] w-[min(520px,calc(100vw-32px))] overflow-auto rounded-[16px] border border-[#e3e1d7] bg-[#faf9f5] p-0 font-[Arial,Helvetica,sans-serif] text-[#1a2420] [box-shadow:0_28px_90px_#0006] backdrop:bg-[#07110ddb] backdrop:[backdrop-filter:blur(6px)]"
          aria-labelledby={`${id}-dialog-title`}
          onClose={() => setPanel(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) closePanel();
          }}
        >
          <div className="dest-dialog-body relative">
            <button
              type="button"
              className={`${CONTROL} dest-dialog-close absolute top-[16px] right-[16px] z-[1] flex size-[32px] items-center justify-center rounded-[50%] border border-[#ddd8cb] bg-[#faf9f5ed] p-0`}
              aria-label="Close destination details"
              onClick={closePanel}
            >
              <DestinationIcon name="close" />
            </button>
            {panel === "details" ? (
              <>
                <div
                  className="dest-dialog-photo h-[215px] bg-cover bg-center"
                  style={photoStyle(active)}
                  role="img"
                  aria-label={active.title.join(" ")}
                />
                <div className="dest-dialog-content p-[30px]">
                  <p className="dest-dialog-eyebrow m-0 mb-[9px] text-[10px] leading-[1.7] font-bold tracking-[0.14em] text-[#626960] uppercase">
                    {active.country}
                  </p>
                  <h2 id={`${id}-dialog-title`} className={DIALOG_TITLE}>
                    {active.title.join(" ")}
                  </h2>
                  <p className={DIALOG_TEXT}>{active.description}</p>
                  <dl className="dest-facts mx-0 my-[24px] grid gap-[17px] border-t border-t-[#dfdfd4] pt-[20px]">
                    {active.bestTime && (
                      <div>
                        <dt className={FACT_TERM}>When to explore</dt>
                        <dd className={FACT_DETAIL}>{active.bestTime}</dd>
                      </div>
                    )}
                    {active.experience && (
                      <div>
                        <dt className={FACT_TERM}>The experience</dt>
                        <dd className={FACT_DETAIL}>{active.experience}</dd>
                      </div>
                    )}
                  </dl>
                  <button
                    type="button"
                    className={`${CONTROL} dest-dialog-save inline-flex w-full items-center justify-center gap-[9px] rounded-[7px] border-none bg-[#e9bb41] px-[14px] py-[12px] text-[12px] font-semibold aria-pressed:[&_svg]:fill-current`}
                    onClick={toggleSaved}
                    aria-pressed={isSaved}
                  >
                    <DestinationIcon name="bookmark" size={16} />
                    {isSaved
                      ? "Saved to your destinations"
                      : "Save this destination"}
                  </button>
                </div>
              </>
            ) : (
              <div className="dest-dialog-content p-[30px]">
                <p className="dest-dialog-eyebrow m-0 mb-[9px] text-[10px] leading-[1.7] font-bold tracking-[0.14em] text-[#626960] uppercase">
                  Globe Express
                </p>
                <h2 id={`${id}-dialog-title`} className={DIALOG_TITLE}>
                  {panel === "saved"
                    ? "Your saved places"
                    : "Find your next escape"}
                </h2>
                <label className="dest-filter mx-0 mt-[23px] mb-[15px] flex items-center gap-[10px] rounded-[7px] border border-[#d8dace] bg-white px-[12px] py-[11px]">
                  <DestinationIcon name="search" size={18} />
                  <input
                    className="w-full min-w-0 border-none bg-transparent text-[13px] text-[#263329]"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search destinations…"
                    aria-label="Search destinations"
                  />
                </label>
                <div className="dest-destination-list grid gap-[6px]">
                  {matchingDestinations.map((slide) => (
                    <button
                      type="button"
                      key={slide.id}
                      className={`${CONTROL} flex w-full items-center gap-[12px] rounded-[8px] border-none bg-transparent p-[8px] text-left hover:bg-[#ecece2]`}
                      onClick={() => {
                        closePanel();
                        goTo(destinations.indexOf(slide));
                      }}
                    >
                      <span
                        className="dest-list-photo block h-[58px] w-[56px] shrink-0 rounded-[5px] bg-cover"
                        style={photoStyle(slide)}
                      />
                      <span className="flex-1">
                        <strong className="block text-[13px] font-semibold">
                          {slide.title.join(" ")}
                        </strong>
                        <small className="mt-[5px] block text-[10px] text-[#777f74]">
                          {slide.country}
                        </small>
                      </span>
                      <DestinationIcon name="right" size={17} />
                    </button>
                  ))}
                </div>
                {matchingDestinations.length === 0 && (
                  <p className={`dest-empty ${DIALOG_TEXT} py-[15px]`}>
                    {panel === "saved" && !saved.length
                      ? "Save a place with the bookmark button, and find it here whenever inspiration strikes."
                      : "No destinations found. Try another place or country."}
                  </p>
                )}
              </div>
            )}
          </div>
        </dialog>
      </div>
    </div>
  );
}

/** Static gallery artwork: no timer, controls, dialogs, or nested interactive elements. */
export function DestinationCarouselThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  const selected = previewStep % DEFAULT_SLIDES.length;
  const active = DEFAULT_SLIDES[selected];
  const upcoming = [1, 2, 3].map((offset) => DEFAULT_SLIDES[(selected + offset) % DEFAULT_SLIDES.length]);
  return (
    <div
      className={`dest-root dest-thumbnail @container w-full font-[Arial,Helvetica,sans-serif] text-white ${REDUCED_MOTION} ${className}`}
      aria-hidden="true"
    >
      <ComponentStyles css={DESTINATION_STYLES} />
      <div className={`${STAGE} dest-thumbnail-stage pointer-events-none aspect-[1.57]`}>
        <div
          key={active.id}
          className={BACKGROUND}
          style={photoStyle(active)}
        />
        <div className={SHADE} />
        <div className="absolute top-[6%] left-[4%] z-[4] flex items-center gap-[4px] text-[1.6cqw] font-bold uppercase">
          <DestinationIcon name="globe" size={10} /> Globe Express
        </div>
        <div className="absolute top-[6%] right-[4%] z-[4] flex gap-[12px] text-[1.6cqw] font-bold uppercase">
          Home <span className="text-[#f9d172]">Destinations</span> Saved
        </div>
        <div className={`${DETAILS} top-[26%] w-[42%]`}>
          <div>
            <span className="mb-[5px] block h-[2px] w-[12px] bg-white" />
            <p className="m-0 mb-[7px] text-[2cqw] leading-[1.4] font-medium">
              {active.country}
            </p>
          </div>
          <div
            className={`${DISPLAY_FONT} m-0 mb-[7px] flex flex-col text-[7.7cqw] leading-[1.06] tracking-[-0.035em] uppercase`}
          >
            <span className="block whitespace-nowrap">{active.title[0]}</span>
            <span className="block whitespace-nowrap">{active.title[1]}</span>
          </div>
          <p className="m-0 max-w-[31cqw] text-[1.75cqw] leading-[1.4] font-normal">
            {active.experience}
          </p>
          <div className="mt-[10px] flex items-center gap-[5px] text-[1.35cqw] uppercase">
            <span className="size-[10px] rounded-[50%] bg-[#f0c031]" />
            Discover location
          </div>
        </div>
        {upcoming.map((slide, position) => (
          <div
            key={slide.id}
            className={`${CARD} rounded-[4px]`}
            style={
              {
                ...photoStyle(slide),
                "--dest-position": position,
              } as CSSProperties
            }
          >
            <span className={CARD_GRADIENT} />
            <span className={CARD_COPY}>
              <span className="mb-[5px] block h-[2px] w-[12px] bg-white" />
              <span className="mb-[3px] block text-[1.3cqw] leading-[1.35]">
                {slide.country}
              </span>
              <span
                className={`${DISPLAY_FONT} block text-[2.5cqw] leading-[1.23] tracking-[-0.02em] uppercase`}
              >
                {slide.title[0]}
                <br />
                {slide.title[1]}
              </span>
            </span>
          </div>
        ))}
        <div className="absolute top-[91%] right-[4%] left-[55%] z-[4] flex items-center gap-[5px]">
          <span className={THUMB_ARROW}>‹</span>
          <span className={THUMB_ARROW}>›</span>
          <i className="mx-[5px] my-0 h-px flex-1 bg-[linear-gradient(90deg,#f5be2f_25%,#fff5_25%)]" />
          <b className="text-[3cqw] font-medium">
            {String(selected + 1).padStart(2, "0")}
          </b>
        </div>
      </div>
    </div>
  );
}

/**
 * Only what Tailwind cannot express: the display web font, the copy entrance
 * keyframes, and focus rings that must outrank a host page's unlayered
 * :focus-visible style (layered utilities always lose to it).
 */
const DESTINATION_STYLES = `
  @font-face {
    font-family: "Destination Condensed";
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: url("https://fonts.gstatic.com/s/oswald/v57/TK3_WkUHHAIjg75cFRf3bXL8LICs18NvsUZiZSSUhiCXAA.woff2")
      format("woff2");
  }
  @keyframes dest-rise {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .dest-stage:focus-visible,
  .dest-stage button:focus-visible {
    outline: 2px solid #ffd167;
    outline-offset: 5px;
  }
  .dest-stage .dest-card:focus-visible {
    outline-offset: 3px;
  }
  .dest-dialog button:focus-visible,
  .dest-dialog input:focus-visible {
    outline: 2px solid #b07908;
    outline-offset: 3px;
  }
`;
