"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { components } from "@/lib/component-registry";
import { GalleryThumbnail, getReducedMotion, subscribeReducedMotion } from "./gallery-thumbnail";
import { ArrowUpRight } from "@/components/site/icons";
import padStyles from "./helicopter-pad.module.css";

const categories = [
  "All components",
  ...new Set(components.map((item) => item.category)),
];
const primaryCategories = categories.slice(0, 11);
const initialComponentCount = 12;

function subscribeViewport(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getVisibleCategoryCount() {
  if (window.innerWidth >= 1280) return 11;
  if (window.innerWidth >= 1024) return 7;
  if (window.innerWidth >= 640) return 4;
  return 2;
}

export function ComponentGallery() {
  const [category, setCategory] = useState("All components");
  const [query, setQuery] = useState("");
  const [previewsPaused, setPreviewsPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(initialComponentCount);
  const searchRef = useRef<HTMLInputElement>(null);
  const moreRef = useRef<HTMLDetailsElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const visibleCategoryCount = useSyncExternalStore(subscribeViewport, getVisibleCategoryCount, () => 11);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true);
  const moreSelected = categories.indexOf(category) >= visibleCategoryCount;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") moreRef.current?.removeAttribute("open");
    }
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !moreRef.current?.contains(event.target)) {
        moreRef.current?.removeAttribute("open");
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  function selectCategory(item: string) {
    setCategory(item);
    moreRef.current?.removeAttribute("open");
  }

  const filtered = components.filter((item) => {
    const matchesCategory =
      category === "All components" || category === item.category;
    const searchable = `${item.title} ${item.description} ${item.category} ${item.tags.join(" ")}`;
    return (
      matchesCategory &&
      searchable.toLowerCase().includes(query.trim().toLowerCase())
    );
  });
  const hasActiveFilter = category !== "All components" || query.trim().length > 0;
  const visibleComponents = hasActiveFilter ? filtered : filtered.slice(0, visibleCount);
  const canLoadMore = !hasActiveFilter && visibleComponents.length < filtered.length;

  // Scrolling the "Show more components" button into view loads the next batch, so the button
  // only needs a click for keyboard users or when IntersectionObserver is unavailable. The
  // observer is recreated per batch: it reports straight away if the button is still in view.
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!canLoadMore || !node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => Math.min(count + initialComponentCount, components.length));
        }
      },
      { rootMargin: "0px 0px 120px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, visibleCount]);

  return (
    <section
      id="collection"
      aria-labelledby="collection-heading"
      className="scroll-mt-28"
    >
      <div data-helicopter-clearance className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="collection-heading"
            className="flex items-center gap-3 text-[26px] leading-tight font-semibold tracking-[-0.045em] text-[#111318]"
          >
            The collection
            <span className="rounded-full border border-[#e4e7ed] bg-[#f5f6f8] px-2 py-0.5 font-mono text-[11px] font-medium tracking-normal text-[#697384]">
              {String(components.length).padStart(2, "0")}
            </span>
          </h2>
          <p className="mt-1 text-[13px] text-[#596273]">
            Individually crafted components. Ready to explore.
          </p>
        </div>
        <label data-helicopter-pad="search" className={`${padStyles.pad} relative block w-full shrink-0 sm:w-[340px] lg:w-[380px]`}>
          <span className="sr-only">Search components</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#647084]"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a component..."
            className="h-11 w-full rounded-xl border border-[#e4e8ee] bg-white pr-14 pl-11 text-[13px] text-[#434b5c] shadow-[0_2px_8px_rgba(20,32,55,0.04)] outline-none placeholder:text-[#626e80] focus:border-[#8997af] focus:ring-2 focus:ring-[#e9ecf2]"
          />
          <kbd aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-[#e8ebf0] px-1.5 py-0.5 font-sans text-[10px] text-[#626e80] sm:block">
            ⌘ K
          </kbd>
        </label>
      </div>
      <div className={`${padStyles.controls} mt-6 mb-7 flex flex-wrap items-center justify-between gap-x-4 gap-y-3`}>
        <div data-helicopter-tabs className="flex min-w-0 flex-wrap items-center gap-1" role="group" aria-label="Filter components by category">
          {primaryCategories.map((item, index) => {
            const visibility = index < 2 ? "" : index < 4 ? "hidden sm:inline-flex" : index < 7 ? "hidden lg:inline-flex" : "hidden xl:inline-flex";
            return (
              <button
                key={item}
                type="button"
                onClick={() => selectCategory(item)}
                aria-pressed={category === item}
                data-helicopter-tab={item}
                className={`${padStyles.pad} shrink-0 items-center rounded-xl px-3 py-2.5 text-[12px] leading-none whitespace-nowrap transition-colors ${visibility} ${category === item ? "bg-[#0b0d12] font-medium text-white shadow-[0_4px_10px_rgba(11,13,18,0.16)]" : "text-[#667085] hover:text-[#0b0d12]"}`}
              >
                {item}
                {item === "All components" && <span className="ml-2 opacity-70">{components.length}</span>}
              </button>
            );
          })}
          <details ref={moreRef} className="group relative shrink-0">
            <summary
              data-helicopter-tab="more"
              data-helicopter-active={moreSelected}
              className={`${padStyles.pad} flex cursor-pointer list-none items-center gap-1.5 rounded-xl px-3 py-2.5 text-[12px] leading-none transition-colors [&::-webkit-details-marker]:hidden ${moreSelected ? "bg-[#0b0d12] font-medium text-white shadow-[0_4px_10px_rgba(11,13,18,0.16)]" : "text-[#667085] hover:text-[#0b0d12]"}`}
              aria-label={moreSelected ? `More categories, selected: ${category}` : "More categories"}
            >
              More
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="size-3.5 transition-transform group-open:rotate-180">
                <path d="m3.5 6 4.5 4 4.5-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="absolute top-full right-0 z-30 mt-2 max-h-[min(60vh,360px)] min-w-[180px] overflow-y-auto rounded-xl border border-[#e4e8ee] bg-white p-1.5 shadow-[0_16px_40px_rgba(24,35,58,0.14)]">
              {categories.slice(2).map((item, index) => {
                const categoryIndex = index + 2;
                const visibility = categoryIndex < 4 ? "sm:hidden" : categoryIndex < 7 ? "lg:hidden" : categoryIndex < 11 ? "xl:hidden" : "";
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectCategory(item)}
                    aria-label={item}
                    aria-pressed={category === item}
                    className={`w-full rounded-lg px-3 py-2 text-left text-[12px] ${visibility} ${category === item ? "bg-[#0b0d12] font-medium text-white" : "text-[#667085] hover:text-[#0b0d12]"}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </details>
        </div>
        {reducedMotion ? <span className="text-[11px] text-[#596273]">Reduced motion · previews paused</span> : (
          <button
            type="button"
            aria-pressed={previewsPaused}
            aria-label={previewsPaused ? "Play animated previews" : "Pause animated previews"}
            onClick={() => setPreviewsPaused((paused) => !paused)}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[#e4e8ee] bg-white px-3.5 text-[12px] text-[#657084] shadow-[0_2px_8px_rgba(20,32,55,0.04)] hover:text-[#0b0d12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4866d9]"
          >
            <span aria-hidden="true">{previewsPaused ? "▶" : "Ⅱ"}</span>
            {previewsPaused ? "Play previews" : "Pause previews"}
          </button>
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        {filtered.length} component{filtered.length === 1 ? "" : "s"} found. Showing {visibleComponents.length}.
      </p>
      <div id="component-grid" className="grid items-stretch gap-6 md:grid-cols-2">
        {visibleComponents.map((item) => {
          return (
            <Link
              key={item.slug}
              data-component-guide={item.slug}
              href={`/components/${item.slug}`}
              className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e2e6ed] bg-white shadow-[0_3px_12px_#1c294803] transition-[box-shadow,border-color] duration-300 hover:border-[#cbd3e6] hover:shadow-[0_12px_40px_#28344e0b] motion-reduce:transition-none"
            >
              <div className="relative h-[310px] overflow-hidden bg-[#09090d] sm:h-[360px] md:h-[310px] lg:h-[350px]">
                <GalleryThumbnail slug={item.slug} paused={previewsPaused || reducedMotion} />
                <span className="absolute top-4 left-4 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 font-mono text-[9px] tracking-[0.06em] text-white/75 backdrop-blur-md">
                  EXPERIMENT {item.number}
                </span>
                <span className="absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[9px] text-white/70 backdrop-blur-md">
                  <span className="size-1 rounded-full bg-[#d0b24e]" />
                  Live demo
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.14em] text-[#5b6574] uppercase">
                    {item.category}{" "}
                    <span className="mx-1.5 text-[#d3d8e2]">/</span>{" "}
                    {item.number}
                  </span>
                  {item.slug === components[0]?.slug && (
                    <span className="flex items-center gap-1.5 text-[10px] text-[#6174c5]">
                      <span className="size-1.5 rounded-full bg-[#7188e6]" />
                      Latest addition
                    </span>
                  )}
                </div>
                <h3 className="mt-5 text-[28px] leading-tight font-medium tracking-[-1px] text-[#242a38]">
                  {item.title}
                  <span className="text-[#bec7dd]">.</span>
                </h3>
                <p className="mt-2 text-[13px] leading-[1.85] text-[#586170]">
                  {item.description}
                </p>
                <div className="mt-4 mb-6 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded border border-[#e9ecf1] bg-[#fbfcfe] px-2 py-1 text-[10px] text-[#5e6878]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-[#eceef3] pt-4">
                  <span className="text-[12px] font-medium text-[#454f65] group-hover:text-[#4866e9]">
                    View component
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-full border border-[#e4e8f0] text-[#5e6b85] transition-colors group-hover:border-[#4866e9] group-hover:bg-[#4866e9] group-hover:text-white">
                    <ArrowUpRight className="size-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {canLoadMore && (
        <div ref={loadMoreRef} className="mt-8 flex justify-center">
          <button
            type="button"
            aria-controls="component-grid"
            onClick={() => setVisibleCount((count) => Math.min(count + initialComponentCount, filtered.length))}
            className="rounded-xl border border-[#d9deea] bg-white px-6 py-3 text-sm font-medium text-[#303b51] shadow-[0_3px_12px_#1c29480a] transition-colors hover:border-[#9daace] hover:bg-[#f8faff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4866d9]"
          >
            Show more components
          </button>
        </div>
      )}
      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#dce1eb] py-20 text-center">
          <h3 className="text-base font-medium">No components found</h3>
          <p className="mt-2 text-sm text-[#596273]">
            Try a different name or category.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("All components");
            }}
            className="mt-5 text-sm font-medium text-[#4866e9]"
          >
            Clear filters
          </button>
        </div>
      )}
      <div className="mt-5 flex items-center justify-between gap-4 text-[10px] text-[#606b7c]">
        <span>
          {String(visibleComponents.length).padStart(2, "0")} /{" "}
          {String(components.length).padStart(2, "0")} components
        </span>
        <span className="flex items-center gap-2">
          <span className="size-1 rounded-full bg-[#a9b1c1]" />
          More experiments on the way.
        </span>
      </div>
    </section>
  );
}
