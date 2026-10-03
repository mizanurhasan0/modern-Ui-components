"use client";

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
    <div className={`dest-root w-full ${className}`}>
      <style>{DESTINATION_STYLES}</style>
      <div
        ref={stageRef}
        className="dest-stage relative isolate overflow-hidden bg-stone-950 text-white"
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
          className="dest-background absolute inset-0"
          style={photoStyle(background)}
          aria-hidden="true"
        />
        {expansion && (
          <div
            ref={expansionRef}
            className="dest-expansion"
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
          className="dest-shade absolute inset-0 pointer-events-none"
          aria-hidden="true"
        />
        {imageStatus[active.image] === "error" && (
          <p className="dest-photo-unavailable" role="status">
            The destination photo is unavailable.
          </p>
        )}

        <header className="dest-header absolute flex items-center justify-between">
          <button
            type="button"
            className="dest-brand inline-flex items-center"
            onClick={() => goTo(0)}
            aria-label="Globe Express, first destination"
          >
            <DestinationIcon name="globe" size={17} />
            <span>Globe Express</span>
          </button>
          <nav
            className="dest-nav flex items-center"
            aria-label="Destination navigation"
          >
            <button
              type="button"
              className="dest-nav-active"
              onClick={() => goTo(0)}
            >
              Home
            </button>
            <button type="button" onClick={() => openPanel("destinations")}>
              Destinations
            </button>
            <button type="button" onClick={() => openPanel("saved")}>
              Saved
              {saved.length > 0 && (
                <span className="dest-saved-count">{saved.length}</span>
              )}
            </button>
            <button
              type="button"
              className="dest-search-button"
              onClick={() => openPanel("destinations")}
              aria-label="Search destinations"
            >
              <DestinationIcon name="search" size={15} />
            </button>
          </nav>
        </header>

        <div
          key={active.id}
          className="dest-details dest-details-enter absolute"
          role="group"
          aria-roledescription="slide"
          aria-label={`${currentIndex + 1} of ${destinations.length}: ${active.title.join(" ")}`}
        >
          <div className="dest-eyebrow">
            <span className="dest-small-rule" />
            <p>{active.country}</p>
          </div>
          <h2 className="dest-title">
            <span>{active.title[0]}</span>
            <span>{active.title[1]}</span>
          </h2>
          <p className="dest-description">{active.description}</p>
          <div className="dest-actions flex items-center">
            <button
              type="button"
              className="dest-bookmark inline-flex shrink-0 items-center justify-center"
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
              className="dest-discover"
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
                className="dest-card absolute overflow-hidden text-left"
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
                <span className="dest-card-gradient absolute inset-0" />
                <span className="dest-card-copy absolute">
                  <span className="dest-small-rule" />
                  <span className="dest-card-country">{slide.country}</span>
                  <span className="dest-card-title">
                    {slide.title[0]}
                    <br />
                    {slide.title[1]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="dest-controls absolute flex items-center">
          <button
            type="button"
            className="dest-round-control"
            onClick={() => goTo(currentIndex - 1)}
            disabled={!canNavigate}
            aria-disabled={!canNavigate || !!expansion}
            aria-label="Previous destination"
          >
            <DestinationIcon name="left" />
          </button>
          <button
            type="button"
            className="dest-round-control"
            onClick={() => goTo(currentIndex + 1)}
            disabled={!canNavigate}
            aria-disabled={!canNavigate || !!expansion}
            aria-label="Next destination"
          >
            <DestinationIcon name="right" />
          </button>
          <div className="dest-progress" aria-hidden="true">
            <span
              style={{
                width: `${((currentIndex + 1) / destinations.length) * 100}%`,
              }}
            />
          </div>
          <span className="dest-slide-number" aria-hidden="true">
            {String(currentIndex + 1).padStart(2, "0")}
          </span>
          <button
            type="button"
            className="dest-play-control"
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
          className="dest-sr-only"
          aria-live={isRunning || expansion ? "off" : "polite"}
          aria-atomic="true"
        >
          {active.title.join(" ")}. {active.country}. Destination{" "}
          {currentIndex + 1} of {destinations.length}.
        </p>

        <dialog
          ref={dialogRef}
          className="dest-dialog"
          aria-labelledby={`${id}-dialog-title`}
          onClose={() => setPanel(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) closePanel();
          }}
        >
          <div className="dest-dialog-body">
            <button
              type="button"
              className="dest-dialog-close"
              aria-label="Close destination details"
              onClick={closePanel}
            >
              <DestinationIcon name="close" />
            </button>
            {panel === "details" ? (
              <>
                <div
                  className="dest-dialog-photo"
                  style={photoStyle(active)}
                  role="img"
                  aria-label={active.title.join(" ")}
                />
                <div className="dest-dialog-content">
                  <p className="dest-dialog-eyebrow">{active.country}</p>
                  <h2 id={`${id}-dialog-title`}>{active.title.join(" ")}</h2>
                  <p>{active.description}</p>
                  <dl className="dest-facts">
                    {active.bestTime && (
                      <div>
                        <dt>When to explore</dt>
                        <dd>{active.bestTime}</dd>
                      </div>
                    )}
                    {active.experience && (
                      <div>
                        <dt>The experience</dt>
                        <dd>{active.experience}</dd>
                      </div>
                    )}
                  </dl>
                  <button
                    type="button"
                    className="dest-dialog-save"
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
              <div className="dest-dialog-content">
                <p className="dest-dialog-eyebrow">Globe Express</p>
                <h2 id={`${id}-dialog-title`}>
                  {panel === "saved"
                    ? "Your saved places"
                    : "Find your next escape"}
                </h2>
                <label className="dest-filter">
                  <DestinationIcon name="search" size={18} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search destinations…"
                    aria-label="Search destinations"
                  />
                </label>
                <div className="dest-destination-list">
                  {matchingDestinations.map((slide) => (
                    <button
                      type="button"
                      key={slide.id}
                      onClick={() => {
                        closePanel();
                        goTo(destinations.indexOf(slide));
                      }}
                    >
                      <span
                        className="dest-list-photo"
                        style={photoStyle(slide)}
                      />
                      <span>
                        <strong>{slide.title.join(" ")}</strong>
                        <small>{slide.country}</small>
                      </span>
                      <DestinationIcon name="right" size={17} />
                    </button>
                  ))}
                </div>
                {matchingDestinations.length === 0 && (
                  <p className="dest-empty">
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
    <div className={`dest-root dest-thumbnail ${className}`} aria-hidden="true">
      <style>{DESTINATION_STYLES}</style>
      <div className="dest-stage dest-thumbnail-stage">
        <div
          key={active.id}
          className="dest-background"
          style={photoStyle(active)}
        />
        <div className="dest-shade" />
        <div className="dest-thumb-brand">
          <DestinationIcon name="globe" size={10} /> Globe Express
        </div>
        <div className="dest-thumb-nav">
          Home <span>Destinations</span> Saved
        </div>
        <div className="dest-details">
          <div className="dest-eyebrow">
            <span className="dest-small-rule" />
            <p>{active.country}</p>
          </div>
          <div className="dest-title">
            <span>{active.title[0]}</span>
            <span>{active.title[1]}</span>
          </div>
          <p className="dest-description">
            {active.experience}
          </p>
          <div className="dest-thumb-discover">
            <span />
            Discover location
          </div>
        </div>
        {upcoming.map((slide, position) => (
          <div
            key={slide.id}
            className="dest-card"
            style={
              {
                ...photoStyle(slide),
                "--dest-position": position,
              } as CSSProperties
            }
          >
            <span className="dest-card-gradient" />
            <span className="dest-card-copy">
              <span className="dest-small-rule" />
              <span className="dest-card-country">{slide.country}</span>
              <span className="dest-card-title">
                {slide.title[0]}
                <br />
                {slide.title[1]}
              </span>
            </span>
          </div>
        ))}
        <div className="dest-thumb-controls">
          <span>‹</span>
          <span>›</span>
          <i />
          <b>{String(selected + 1).padStart(2, "0")}</b>
        </div>
      </div>
    </div>
  );
}

const DESTINATION_STYLES = `
  @font-face {
    font-family: "Destination Condensed";
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: url("https://fonts.gstatic.com/s/oswald/v57/TK3_WkUHHAIjg75cFRf3bXL8LICs18NvsUZiZSSUhiCXAA.woff2")
      format("woff2");
  }
  .dest-root {
    container-type: inline-size;
    width: 100%;
    font-family: Arial, Helvetica, sans-serif;
    color: #fff;
  }
  .dest-root * {
    box-sizing: border-box;
  }
  .dest-stage {
    --dest-card-left: 55%;
    --dest-card-width: 14%;
    --dest-card-step: 17%;
    --dest-card-top: 55%;
    --dest-card-height: 33%;
    position: relative;
    isolation: isolate;
    overflow: hidden;
    width: 100%;
    aspect-ratio: 3/2;
    background: #14221e;
    color: #fff;
    touch-action: pan-y;
    outline-offset: -4px;
  }
  .dest-stage button {
    font: inherit;
    color: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .dest-stage button:focus-visible,
  .dest-stage:focus-visible {
    outline: 2px solid #ffd167;
    outline-offset: 5px;
  }
  .dest-stage button:disabled {
    cursor: default;
  }
  .dest-background,
  .dest-expansion {
    position: absolute;
    background-size: cover;
    background-repeat: no-repeat;
  }
  .dest-background {
    inset: 0;
    z-index: 0;
    background-color: #203a30;
  }
  .dest-expansion {
    z-index: 1;
    will-change: width, height, left, top;
  }
  .dest-shade {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background:
      linear-gradient(90deg, rgba(5, 13, 12, 0.46), rgba(5, 13, 12, 0.09) 62%),
      linear-gradient(
        0deg,
        rgba(2, 10, 8, 0.38),
        transparent 45%,
        rgba(2, 10, 8, 0.12)
      );
  }
  .dest-header {
    top: 4.6%;
    left: 4%;
    right: 4%;
    z-index: 5;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .dest-brand {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 0;
    background: none;
    padding: 4px 0;
    font-size: clamp(8px, 1.05cqw, 13px) !important;
    font-weight: 700 !important;
    letter-spacing: 0.025em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .dest-nav {
    display: flex;
    align-items: center;
    gap: 2.35cqw;
  }
  .dest-nav > button {
    position: relative;
    background: transparent;
    border: 0;
    padding: 6px 0;
    font-size: clamp(8px, 0.9cqw, 11px);
    font-weight: 600;
    letter-spacing: 0.015em;
    text-transform: uppercase;
  }
  .dest-nav > button:hover {
    color: #ffd167;
  }
  .dest-nav-active:after {
    position: absolute;
    content: "";
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: #e9bb41;
  }
  .dest-saved-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 100%;
    margin-left: 5px;
    width: 14px;
    height: 14px;
    background: #edbb36;
    color: #13211d;
    font-size: 8px;
  }
  .dest-search-button {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dest-details {
    position: absolute;
    z-index: 3;
    left: 4%;
    top: 27%;
    width: 36%;
    text-shadow: 0 1px 8px #0004;
  }
  .dest-small-rule {
    display: block;
    width: 22px;
    height: 3px;
    background: #fff;
    margin-bottom: 9px;
  }
  .dest-eyebrow p {
    margin: 0 0 13px;
    font-size: clamp(10px, 1.3cqw, 16px);
    line-height: 1.4;
    font-weight: 500;
  }
  .dest-title {
    display: flex;
    flex-direction: column;
    margin: 0 0 12px;
    font-family: "Destination Condensed", Impact, "Arial Narrow", sans-serif;
    font-size: clamp(32px, 5.9cqw, 96px);
    line-height: 1.14;
    letter-spacing: -0.035em;
    text-transform: uppercase;
    font-weight: 500;
  }
  .dest-title > span {
    display: block;
    white-space: nowrap;
  }
  .dest-description {
    margin: 0;
    max-width: 34em;
    font-size: clamp(10px, 1.17cqw, 16px);
    font-weight: 400;
    line-height: 1.5;
  }
  .dest-actions {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-top: 20px;
  }
  .dest-bookmark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 33px;
    height: 33px;
    border: 0;
    border-radius: 50%;
    background: #eebc32;
    box-shadow: 0 0 15px #edbd3140;
    transition:
      background 0.2s,
      transform 0.2s;
  }
  .dest-bookmark:hover {
    background: #ffce4e;
    transform: translateY(-2px);
  }
  .dest-bookmark[aria-pressed="true"] svg {
    fill: currentColor;
  }
  .dest-discover {
    min-height: 33px;
    padding: 0 17px;
    border: 1px solid #ffffffa3;
    border-radius: 999px;
    background: #11231e15;
    font-size: clamp(8px, 0.89cqw, 12px) !important;
    font-weight: 600 !important;
    text-transform: uppercase;
    transition:
      background 0.2s,
      border-color 0.2s;
  }
  .dest-discover:hover {
    background: #ffffff1f;
    border-color: #fff;
  }
  .dest-card {
    position: absolute;
    z-index: 4;
    left: calc(
      var(--dest-card-left) + var(--dest-position) * var(--dest-card-step)
    );
    top: var(--dest-card-top);
    width: var(--dest-card-width);
    height: var(--dest-card-height);
    overflow: hidden;
    border: 0;
    border-radius: 7px;
    background-size: cover;
    background-repeat: no-repeat;
    text-align: left;
    padding: 0;
    box-shadow: 4px 8px 25px #0005;
    transition:
      left 0.7s cubic-bezier(0.22, 0.75, 0.18, 1),
      opacity 0.45s,
      box-shadow 0.2s;
  }
  .dest-card[aria-hidden="true"] {
    visibility: hidden;
  }
  .dest-card:hover:not(:disabled) {
    box-shadow:
      0 0 0 1.5px #fff9,
      4px 8px 25px #0005;
  }
  .dest-card:focus-visible {
    outline-offset: 3px !important;
  }
  .dest-card-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(0deg, #050d0cdc, transparent 69%);
    pointer-events: none;
  }
  .dest-card-copy {
    position: absolute;
    left: 9%;
    right: 7%;
    bottom: 7%;
    color: #fff;
  }
  .dest-card-copy .dest-small-rule {
    width: 15px;
    height: 2px;
    margin-bottom: 7px;
  }
  .dest-card-country {
    display: block;
    font-size: clamp(6px, 0.75cqw, 11px);
    line-height: 1.35;
    margin-bottom: 4px;
  }
  .dest-card-title {
    display: block;
    font-family: "Destination Condensed", Impact, "Arial Narrow", sans-serif;
    font-weight: 500;
    font-size: clamp(11px, 1.53cqw, 23px);
    line-height: 1.23;
    text-transform: uppercase;
    letter-spacing: -0.02em;
  }
  .dest-controls {
    position: absolute;
    z-index: 5;
    left: 55%;
    right: 4%;
    top: 91%;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dest-round-control {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid #ffffff70;
    border-radius: 50%;
    background: transparent;
    transition:
      background 0.2s,
      border-color 0.2s;
  }
  .dest-round-control:hover:not(:disabled) {
    background: #ffffff20;
    border-color: #fff;
  }
  .dest-round-control:disabled {
    opacity: 0.45;
  }
  .dest-progress {
    height: 2px;
    margin: 0 8px;
    background: #ffffff4d;
    flex: 1;
    overflow: hidden;
  }
  .dest-progress > span {
    display: block;
    height: 100%;
    background: #f2c346;
    transition: width 0.8s cubic-bezier(0.22, 0.75, 0.18, 1);
  }
  .dest-slide-number {
    font-family: "Destination Condensed", Impact, "Arial Narrow", sans-serif;
    font-size: clamp(19px, 3.2cqw, 40px);
    font-weight: 500;
    line-height: 1;
  }
  .dest-play-control {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 28px;
    padding: 0;
    border: 0;
    background: transparent;
    opacity: 0.85;
  }
  .dest-play-control:hover {
    opacity: 1;
  }
  .dest-play-control:disabled {
    opacity: 0.4;
  }
  .dest-details-enter .dest-eyebrow,
  .dest-details-enter .dest-title > span,
  .dest-details-enter .dest-description,
  .dest-details-enter .dest-actions {
    animation: dest-rise 0.6s both cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  .dest-details-enter .dest-eyebrow {
    animation-delay: 0.27s;
  }
  .dest-details-enter .dest-title > span:first-child {
    animation-delay: 0.33s;
  }
  .dest-details-enter .dest-title > span:last-child {
    animation-delay: 0.39s;
  }
  .dest-details-enter .dest-description {
    animation-delay: 0.45s;
  }
  .dest-details-enter .dest-actions {
    animation-delay: 0.51s;
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
  .dest-photo-unavailable {
    position: absolute;
    bottom: 4%;
    left: 4%;
    z-index: 3;
    margin: 0;
    font-size: 10px;
    color: #fff9;
  }
  .dest-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .dest-dialog {
    position: fixed;
    inset: 0;
    width: min(520px, calc(100vw - 32px));
    max-height: 85dvh;
    margin: auto;
    padding: 0;
    border: 1px solid #e3e1d7;
    border-radius: 16px;
    background: #faf9f5;
    color: #1a2420;
    box-shadow: 0 28px 90px #0006;
    font-family: Arial, Helvetica, sans-serif;
    overflow: auto;
  }
  .dest-dialog::backdrop {
    background: #07110ddb;
    backdrop-filter: blur(6px);
  }
  .dest-dialog-body {
    position: relative;
  }
  .dest-dialog button {
    color: inherit;
    cursor: pointer;
  }
  .dest-dialog button:focus-visible,
  .dest-dialog input:focus-visible {
    outline: 2px solid #b07908;
    outline-offset: 3px;
  }
  .dest-dialog-close {
    position: absolute;
    right: 16px;
    top: 16px;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid #ddd8cb;
    border-radius: 50%;
    background: #faf9f5ed;
  }
  .dest-dialog-photo {
    height: 215px;
    background-size: cover;
    background-position: center;
  }
  .dest-dialog-content {
    padding: 30px;
  }
  .dest-dialog-eyebrow {
    margin: 0 0 9px !important;
    color: #857134;
    font-size: 10px !important;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-weight: 700;
  }
  .dest-dialog h2 {
    font-family: "Destination Condensed", Impact, "Arial Narrow", sans-serif;
    font-size: 32px;
    font-weight: 500;
    line-height: 1.2;
    margin: 0 22px 15px 0;
    text-transform: uppercase;
  }
  .dest-dialog p {
    font-size: 13px;
    line-height: 1.7;
    margin: 0 0 20px;
    color: #626960;
  }
  .dest-facts {
    display: grid;
    gap: 17px;
    margin: 24px 0;
    border-top: 1px solid #dfdfd4;
    padding-top: 20px;
  }
  .dest-facts dt {
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #797d71;
    margin-bottom: 6px;
  }
  .dest-facts dd {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
  }
  .dest-dialog-save {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    width: 100%;
    padding: 12px 14px;
    border: 0;
    border-radius: 7px;
    background: #e9bb41;
    font-size: 12px !important;
    font-weight: 600 !important;
  }
  .dest-dialog-save[aria-pressed="true"] svg {
    fill: currentColor;
  }
  .dest-filter {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 23px 0 15px;
    border: 1px solid #d8dace;
    border-radius: 7px;
    background: #fff;
    padding: 11px 12px;
  }
  .dest-filter input {
    min-width: 0;
    width: 100%;
    border: 0;
    background: transparent;
    font: inherit;
    font-size: 13px;
    color: #263329;
  }
  .dest-destination-list {
    display: grid;
    gap: 6px;
  }
  .dest-destination-list > button {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 8px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    text-align: left;
  }
  .dest-destination-list > button:hover {
    background: #ecece2;
  }
  .dest-list-photo {
    display: block;
    flex-shrink: 0;
    width: 56px;
    height: 58px;
    border-radius: 5px;
    background-size: cover;
  }
  .dest-destination-list > button > span:nth-child(2) {
    flex: 1;
  }
  .dest-destination-list strong {
    display: block;
    font-size: 13px;
    font-weight: 600;
  }
  .dest-destination-list small {
    display: block;
    margin-top: 5px;
    font-size: 10px;
    color: #777f74;
  }
  .dest-empty {
    padding: 15px 0;
  }
  .dest-thumbnail-stage {
    aspect-ratio: 1.57;
    pointer-events: none;
  }
  .dest-thumbnail .dest-details {
    top: 26%;
    width: 42%;
  }
  .dest-thumbnail .dest-title {
    font-size: 7.7cqw;
    margin-bottom: 7px;
    line-height: 1.06;
  }
  .dest-thumbnail .dest-eyebrow p {
    font-size: 2cqw;
    margin-bottom: 7px;
  }
  .dest-thumbnail .dest-small-rule {
    width: 12px;
    height: 2px;
    margin-bottom: 5px;
  }
  .dest-thumbnail .dest-description {
    font-size: 1.75cqw;
    max-width: 31cqw;
    line-height: 1.4;
  }
  .dest-thumbnail .dest-card {
    border-radius: 4px;
  }
  .dest-thumbnail .dest-card-country {
    font-size: 1.3cqw;
    margin-bottom: 3px;
  }
  .dest-thumbnail .dest-card-title {
    font-size: 2.5cqw;
  }
  .dest-thumb-brand,
  .dest-thumb-nav {
    position: absolute;
    z-index: 4;
    top: 6%;
    font-size: 1.6cqw;
    font-weight: 700;
    text-transform: uppercase;
  }
  .dest-thumb-brand {
    left: 4%;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .dest-thumb-nav {
    right: 4%;
    display: flex;
    gap: 12px;
  }
  .dest-thumb-nav span {
    color: #f9d172;
  }
  .dest-thumb-discover {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 10px;
    font-size: 1.35cqw;
    text-transform: uppercase;
  }
  .dest-thumb-discover > span {
    width: 10px;
    height: 10px;
    background: #f0c031;
    border-radius: 50%;
  }
  .dest-thumb-controls {
    position: absolute;
    z-index: 4;
    left: 55%;
    right: 4%;
    top: 91%;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .dest-thumb-controls > span {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #fff8;
    border-radius: 50%;
    width: 13px;
    height: 13px;
    font-size: 10px;
  }
  .dest-thumb-controls i {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, #f5be2f 25%, #fff5 25%);
    margin: 0 5px;
  }
  .dest-thumb-controls b {
    font-size: 3cqw;
    font-weight: 500;
  }
  @container (max-width:650px) {
    .dest-stage:not(.dest-thumbnail-stage) .dest-details {
      width: 43%;
      top: 25%;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-title {
      font-size: 6.5cqw;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-description {
      font-size: 10px;
      line-height: 1.5;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-actions {
      margin-top: 13px;
      gap: 7px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-bookmark {
      width: 28px;
      height: 28px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-discover {
      min-height: 28px;
      padding: 0 11px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-round-control {
      width: 26px;
      height: 26px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-controls {
      gap: 5px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-progress {
      margin: 0 4px;
    }
  }
  @container (max-width:480px) {
    .dest-stage:not(.dest-thumbnail-stage) {
      aspect-ratio: auto;
      height: 720px;
      --dest-card-left: 6%;
      --dest-card-width: 26%;
      --dest-card-step: 30%;
      --dest-card-top: 66%;
      --dest-card-height: 23%;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-shade {
      background:
        linear-gradient(90deg, #07181077, transparent),
        linear-gradient(0deg, #081a13aa, transparent 30%, #07181033);
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-header {
      top: 5%;
      left: 6%;
      right: 6%;
      align-items: center;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-brand {
      font-size: 9px !important;
      gap: 5px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-brand svg {
      width: 15px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-nav {
      gap: 13px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-nav > button {
      font-size: 8px;
      padding: 8px 0;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-nav > button:first-child,
    .dest-stage:not(.dest-thumbnail-stage) .dest-search-button {
      display: none;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-details {
      left: 6%;
      top: 18%;
      width: 88%;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-eyebrow p {
      font-size: 12px;
      margin-bottom: 14px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-title {
      font-size: clamp(32px, 13cqw, 63px);
      line-height: 1.08;
      margin-bottom: 15px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-description {
      font-size: 12px;
      line-height: 1.55;
      max-width: 290px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-actions {
      margin-top: 19px;
      gap: 10px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-bookmark {
      width: 35px;
      height: 35px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-discover {
      min-height: 35px;
      font-size: 9px !important;
      padding: 0 17px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-card-copy {
      bottom: 9%;
      left: 10%;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-card-country {
      font-size: 7px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-card-title {
      font-size: 15px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-controls {
      left: 6%;
      right: 8%;
      top: 92%;
      gap: 9px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-round-control {
      width: 31px;
      height: 31px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-slide-number {
      font-size: 28px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-progress {
      margin: 0 6px;
    }
  }
  @container (max-width:320px) {
    .dest-stage:not(.dest-thumbnail-stage) {
      height: 730px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-details {
      top: 16%;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-description {
      font-size: 11px;
      line-height: 1.5;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-card-title {
      font-size: 12px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-card-country {
      font-size: 6px;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-brand {
      font-size: 8px !important;
    }
    .dest-stage:not(.dest-thumbnail-stage) .dest-nav {
      gap: 9px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dest-root * {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }
  }
`;
