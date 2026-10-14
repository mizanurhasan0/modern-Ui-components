"use client";

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { loadComponentSource } from "@/app/components/actions";
import { CodeBlock, copyText } from "./code-block";

type ComponentPlaygroundProps = {
  slug: string;
  fileName: string;
  title: string;
  usage: string;
  demoNote: string;
  children: ReactNode;
};

type Tab = "preview" | "code";
type Viewport = "desktop" | "mobile";
type IconName =
  | "preview"
  | "code"
  | "desktop"
  | "mobile"
  | "replay"
  | "copy"
  | "expand"
  | "collapse";

function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "preview" && (
        <>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
      {name === "code" && (
        <>
          <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
        </>
      )}
      {name === "desktop" && (
        <>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </>
      )}
      {name === "mobile" && (
        <>
          <rect x="6.5" y="2" width="11" height="20" rx="2.5" />
          <path d="M11 18h2" />
        </>
      )}
      {name === "replay" && (
        <>
          <path d="M3 10a9 9 0 1 1 1.6 7M3 4v6h6" />
        </>
      )}
      {name === "copy" && (
        <>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
        </>
      )}
      {name === "expand" && (
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      )}
      {name === "collapse" && (
        <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
      )}
    </svg>
  );
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4666ee]";

const FULLSCREEN_PARAM = "fullscreen";

function subscribeToNothing() {
  return () => {};
}

/** `?fullscreen` opens the preview expanded, which also makes the view linkable. */
function readFullscreenParam() {
  return new URLSearchParams(window.location.search).has(FULLSCREEN_PARAM);
}

/**
 * Expands an element to cover the screen. The native Fullscreen API is used when
 * the browser allows it; otherwise a fixed overlay gives the same layout.
 */
function useFullscreen(target: RefObject<HTMLElement | null>) {
  const linked = useSyncExternalStore(
    subscribeToNothing,
    readFullscreenParam,
    () => false,
  );
  const [requested, setRequested] = useState<boolean | null>(null);
  const active = requested ?? linked;

  useEffect(() => {
    if (!active) return;

    function handleFullscreenChange() {
      if (!document.fullscreenElement) setRequested(false);
    }
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      // Native fullscreen handles Escape itself; leave component dialogs alone.
      const componentModalOpen = Array.from(
        document.querySelectorAll("dialog[open], [aria-modal='true']"),
      ).some((modal) => modal !== target.current);
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        document.fullscreenElement ||
        componentModalOpen
      )
        return;
      setRequested(false);
    }

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      root.style.overflow = previousOverflow;
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, target]);

  function enter() {
    setRequested(true);
    // The overlay stays in place if the browser declines native fullscreen.
    target.current?.requestFullscreen?.().catch(() => {});
  }

  function exit() {
    setRequested(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    const url = new URL(window.location.href);
    if (url.searchParams.has(FULLSCREEN_PARAM)) {
      url.searchParams.delete(FULLSCREEN_PARAM);
      window.history.replaceState(window.history.state, "", url);
    }
  }

  return { active, enter, exit };
}

function ViewportToggle({
  viewport,
  onChange,
  tone = "light",
}: {
  viewport: Viewport;
  onChange: (viewport: Viewport) => void;
  tone?: "light" | "dark";
}) {
  const idle =
    tone === "dark"
      ? "text-white/70 hover:bg-white/10 hover:text-white"
      : "text-[#707b8e] hover:bg-[#f4f5f8] hover:text-[#505b6d]";
  const selected =
    tone === "dark" ? "bg-white/15 text-white" : "bg-[#edf0fc] text-[#4666ee]";

  return (
    <div
      className="hidden items-center gap-1 sm:flex"
      role="group"
      aria-label="Preview viewport"
    >
      {(["desktop", "mobile"] as const).map((device) => {
        const label = `${device === "desktop" ? "Desktop" : "Mobile"} preview`;
        return (
          <button
            key={device}
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={viewport === device}
            onClick={() => onChange(device)}
            className={`grid size-8 place-items-center rounded-md transition motion-reduce:transition-none ${focusRing} ${viewport === device ? selected : idle}`}
          >
            <Icon name={device} />
          </button>
        );
      })}
    </div>
  );
}

export function ComponentPlayground({
  slug,
  fileName,
  title,
  usage,
  demoNote,
  children,
}: ComponentPlaygroundProps) {
  const requiresThree = fileName === "creative-login.tsx";
  const [activeTab, setActiveTab] = useState<Tab>("preview");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [replay, setReplay] = useState(0);
  const [source, setSource] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState("");
  const [sourceAttempt, setSourceAttempt] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const previewHint = demoNote.replace(/^[^·]*·\s*/, "").split(". ")[0].replace(/\.?$/, ".");
  const id = useId();
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const stageRef = useRef<HTMLDivElement>(null);
  const enterButtonRef = useRef<HTMLButtonElement>(null);
  const exitButtonRef = useRef<HTMLButtonElement>(null);
  const fullscreen = useFullscreen(stageRef);
  const wasFullscreen = useRef(false);

  // Keep keyboard focus with the control that changed the view.
  useEffect(() => {
    if (fullscreen.active) exitButtonRef.current?.focus();
    else if (wasFullscreen.current) enterButtonRef.current?.focus();
    wasFullscreen.current = fullscreen.active;
  }, [fullscreen.active]);

  // Load portable source on demand, keeping large embedded artwork off the initial page.
  useEffect(() => {
    if (activeTab !== "code" || source) return;
    let cancelled = false;
    loadComponentSource(slug)
      .then((result) => {
        if (cancelled) return;
        if (result.success) setSource(result.source);
        else setSourceError("Couldn’t load the source. Please try again.");
      })
      .catch(() => {
        if (!cancelled)
          setSourceError("Couldn’t load the source. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, source, slug, sourceAttempt]);

  useEffect(() => {
    if (copyState === "idle") return;
    const timeout = window.setTimeout(() => setCopyState("idle"), 3000);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  async function handleCopySource() {
    try {
      let text = source;
      if (!text) {
        const result = await loadComponentSource(slug);
        if (!result.success) throw new Error("Source unavailable");
        text = result.source;
        setSource(text);
      }
      await copyText(text);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    let nextTab: Tab;
    if (event.key === "Home") nextTab = "preview";
    else if (event.key === "End") nextTab = "code";
    else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      nextTab = activeTab === "preview" ? "code" : "preview";
    } else return;

    event.preventDefault();
    setActiveTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  }

  return (
    <div id="playground" className="scroll-mt-28 space-y-8">
      <section
        aria-label={`${title} playground`}
        className="detail-playground overflow-hidden rounded-[22px] border border-[#e2e6ed] bg-white shadow-[0_16px_46px_-32px_rgba(24,35,58,0.3)]"
      >
        <div className="detail-playground-toolbar flex min-h-[68px] items-center justify-between gap-2 border-b border-[#e7e9ee] px-3 sm:px-5">
          <div
            role="tablist"
            aria-label="Component view"
            className="flex items-center gap-1 rounded-xl bg-[#f2f3f6] p-1"
          >
            {(["preview", "code"] as const).map((tab) => (
              <button
                key={tab}
                ref={(element) => {
                  tabRefs.current[tab] = element;
                }}
                type="button"
                role="tab"
                id={`${id}-${tab}-tab`}
                aria-controls={`${id}-${tab}-panel`}
                aria-selected={activeTab === tab}
                tabIndex={activeTab === tab ? 0 : -1}
                onClick={() => setActiveTab(tab)}
                onKeyDown={handleTabKeyDown}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition motion-reduce:transition-none sm:px-3.5 ${focusRing} ${activeTab === tab ? "bg-[#0b0d12] text-white shadow-[0_3px_8px_rgba(11,13,18,0.18)]" : "text-[#687386] hover:text-[#252e40]"}`}
              >
                <Icon name={tab} />
                {tab === "preview" ? "Preview" : "Code"}
              </button>
            ))}
          </div>
          {activeTab === "preview" && (
            <div className="flex items-center gap-2 sm:gap-4">
              <ViewportToggle viewport={viewport} onChange={setViewport} />
              <span
                className="hidden h-5 w-px bg-[#e8eaf0] sm:block"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setReplay((value) => value + 1)}
                aria-label="Restart component preview"
                title="Restart preview"
                className={`grid size-8 place-items-center rounded-md text-[#6a7588] transition hover:bg-[#f3f4f7] hover:text-[#344054] motion-reduce:transition-none ${focusRing}`}
              >
                <Icon name="replay" />
              </button>
              <button
                ref={enterButtonRef}
                type="button"
                onClick={fullscreen.enter}
                aria-label="Open preview in full screen"
                title="Full screen"
                className={`grid size-8 place-items-center rounded-md text-[#6a7588] transition hover:bg-[#f3f4f7] hover:text-[#344054] motion-reduce:transition-none ${focusRing}`}
              >
                <Icon name="expand" />
              </button>
            </div>
          )}
          {activeTab === "code" && (
            <span className="hidden text-[11px] text-[#707b8e] sm:block">
              {source ? "Copy. Customize. Make it yours." : "Loading source…"}
            </span>
          )}
        </div>

        <div
          role="tabpanel"
          id={`${id}-preview-panel`}
          aria-labelledby={`${id}-preview-tab`}
          hidden={activeTab !== "preview"}
        >
          <div className="flex items-start gap-2.5 border-b border-[#edf0f4] bg-[#fbfcfd] px-4 py-3 text-[11px] leading-5 text-[#697586] sm:px-5">
            <span aria-hidden="true" className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-[#aecfc3] text-[10px] font-semibold text-[#4a9b79]">i</span>
            <span>{previewHint}</span>
          </div>
          {/* The same element is expanded in place, so component state survives. */}
          <div
            ref={stageRef}
            role={fullscreen.active ? "dialog" : undefined}
            aria-modal={fullscreen.active || undefined}
            aria-label={fullscreen.active ? `${title} full screen preview` : undefined}
            data-fullscreen={fullscreen.active}
            className={
              fullscreen.active
                ? "fixed inset-0 z-[100] flex bg-[#0b0d12]"
                : "detail-preview-stage grid min-h-[540px] place-items-center p-2 sm:min-h-[570px] sm:p-3"
            }
          >
            <div
              className={
                fullscreen.active
                  ? `mx-auto flex h-full w-full flex-col overflow-auto [&>*]:w-full [&>*]:flex-1 ${viewport === "mobile" ? "max-w-[390px]" : ""}`
                  : `w-full transition-[max-width] duration-300 motion-reduce:transition-none ${viewport === "mobile" ? "max-w-[390px]" : "max-w-[1080px]"}`
              }
            >
              <Fragment key={replay}>{children}</Fragment>
            </div>
            {fullscreen.active && (
              <div className="absolute top-3 right-3 z-[101] flex items-center gap-1 rounded-xl border border-white/10 bg-[#11141b]/80 p-1 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                <ViewportToggle
                  viewport={viewport}
                  onChange={setViewport}
                  tone="dark"
                />
                <button
                  type="button"
                  onClick={() => setReplay((value) => value + 1)}
                  aria-label="Restart component preview"
                  title="Restart preview"
                  className={`grid size-8 place-items-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white motion-reduce:transition-none ${focusRing}`}
                >
                  <Icon name="replay" />
                </button>
                <button
                  ref={exitButtonRef}
                  type="button"
                  onClick={fullscreen.exit}
                  title="Exit full screen (Esc)"
                  className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium text-white/85 transition hover:bg-white/10 hover:text-white motion-reduce:transition-none ${focusRing}`}
                >
                  <Icon name="collapse" />
                  Exit full screen
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7e9ee] px-4 py-3 text-[11px] text-[#6b7587] sm:px-5">
            <span className="flex items-center gap-2">
              <span
                className="size-2 rounded-full bg-[#48a885]"
                aria-hidden="true"
              />
              Live interactive preview
            </span>
            <span className="hidden text-[#8791a0] md:inline">Explore the interaction, then make it yours.</span>
            <button
              type="button"
              onClick={handleCopySource}
              className={`inline-flex h-9 items-center gap-2 rounded-lg border border-[#e2e6ed] bg-white px-3 text-[11px] font-medium text-[#3f4b5c] transition hover:border-[#cbd2de] hover:bg-[#f7f8fa] ${focusRing}`}
            >
              <Icon name="copy" className="size-3.5" />
              {copyState === "copied" ? "Copied!" : copyState === "error" ? "Copy failed" : "Copy code"}
            </button>
            <span className="sr-only" role="status">{copyState === "copied" ? "Component code copied to clipboard." : copyState === "error" ? "Could not copy component code." : ""}</span>
          </div>
        </div>

        <div
          role="tabpanel"
          id={`${id}-code-panel`}
          aria-labelledby={`${id}-code-tab`}
          hidden={activeTab !== "code"}
          className="bg-[#f7f8fa] p-3 sm:p-5"
        >
          {source ? (
            <>
              {requiresThree && <ThreeDependencies />}
              <CodeBlock source={source} fileName={fileName} />
              <p className="px-1 pt-4 pb-1 text-xs leading-5 text-[#6b7587]">
                {requiresThree
                  ? "One component file with its 3D assets included. Install Three.js, then copy or download the source."
                  : "One self-contained component. Copy it into your project and make it your own."}
              </p>
            </>
          ) : (
            <div
              className="grid min-h-[280px] place-items-center text-center text-[12px] text-[#7c8493]"
              role="status"
            >
              {sourceError ? (
                <div>
                  <p>{sourceError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSourceError("");
                      setSourceAttempt((attempt) => attempt + 1);
                    }}
                    className="mt-3 rounded-lg bg-[#edf0fc] px-4 py-2 font-medium text-[#4666ee]"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                "Loading component source…"
              )}
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby={`${id}-usage-heading`} className="detail-usage rounded-[22px] border border-[#e2e6ed] bg-white p-5 shadow-[0_3px_15px_rgba(20,32,55,0.03)] sm:p-7">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] text-[#8b94a3] uppercase">Quick start</p>
            <h2 id={`${id}-usage-heading`} className="mt-2 text-[24px] font-semibold tracking-[-0.045em] text-[#171b24]">Make it yours.</h2>
          </div>
          <p className="max-w-[420px] text-[12px] leading-[1.7] text-[#788291]">
            Save <code className="rounded bg-[#f2f4f8] px-1.5 py-1 font-mono text-[11px] text-[#536176]">{fileName}</code> in your components folder, then import it below. Requires React and Tailwind CSS{requiresThree ? ", plus Three.js." : "."}
          </p>
        </div>
        {requiresThree && <ThreeDependencies />}
        <CodeBlock source={usage} fileName="app/page.tsx" compact />
      </section>
    </div>
  );
}

function ThreeDependencies() {
  return (
    <div className="mb-4 rounded-lg border border-[#e2e7f2] bg-[#f5f7fc] p-4">
      <p className="text-xs font-medium text-[#39465f]">
        Install the 3D renderer
      </p>
      <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-6 text-[#536176]">
        <code>{"npm install three\nnpm install --save-dev @types/three"}</code>
      </pre>
      <p className="mt-2 text-[11px] leading-5 text-[#6b7587]">
        The second command adds TypeScript definitions. Models, animations,
        fonts, and the fallback image are included in the copied file.
      </p>
    </div>
  );
}
