"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { components } from "@/lib/component-registry";
import { GalleryThumbnail, getReducedMotion, subscribeReducedMotion } from "./gallery-thumbnail";
import { ArrowUpRight } from "@/components/site/icons";

const categories = [
  "All components",
  ...new Set(components.map((item) => item.category)),
];

export function ComponentGallery() {
  const [category, setCategory] = useState("All components");
  const [query, setQuery] = useState("");
  const [previewsPaused, setPreviewsPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true);
  const filtered = components.filter((item) => {
    const matchesCategory =
      category === "All components" || category === item.category;
    const searchable = `${item.title} ${item.description} ${item.category} ${item.tags.join(" ")}`;
    return (
      matchesCategory &&
      searchable.toLowerCase().includes(query.trim().toLowerCase())
    );
  });

  return (
    <section
      id="collection"
      aria-labelledby="collection-heading"
      className="scroll-mt-28"
    >
      <div className="flex items-center justify-between border-b border-[#e3e7ee] pb-5">
        <h2
          id="collection-heading"
          className="flex items-center gap-3 text-[19px] font-medium tracking-[-0.5px]"
        >
          The collection
          <span className="rounded-md border border-[#e1e5ed] bg-white px-1.5 py-0.5 font-mono text-[10px] tracking-normal text-[#8e95a2]">
            {String(components.length).padStart(2, "0")}
          </span>
        </h2>
        <span className="hidden font-mono text-[10px] tracking-[0.03em] text-[#969daa] sm:inline">
          Individually crafted. Ready to explore.
        </span>
      </div>
      <div className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center">
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter components by category"
        >
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={`rounded-md px-3 py-2 text-[12px] transition-colors ${category === item ? "bg-[#e9edfb] font-medium text-[#4866d9]" : "text-[#858c99] hover:bg-[#eef0f5] hover:text-[#333c4d]"}`}
            >
              {item}
              {item === "All components" && (
                <span className="ml-2 text-[10px] opacity-70">
                  {components.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:w-[232px]">
          <span className="sr-only">Search components</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="pointer-events-none absolute top-2.5 left-3 size-4 text-[#9ba2af]"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a component..."
            className="h-9 w-full rounded-lg border border-[#e2e6ed] bg-white pr-3 pl-9 text-[12px] text-[#434b5c] outline-none placeholder:text-[#a0a6b1] focus:border-[#8da0ed] focus:ring-2 focus:ring-[#e8edff]"
          />
        </label>
      </div>
      <div className="mb-5 flex items-center justify-between gap-3 text-[11px] text-[#858c99]">
        <span>Little previews. A closer look inside.</span>
        {reducedMotion ? <span>Reduced motion · previews paused</span> : (
          <button
            type="button"
            aria-pressed={previewsPaused}
            aria-label="Pause animated previews"
            onClick={() => setPreviewsPaused((paused) => !paused)}
            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-[#dfe4ed] bg-white px-3 py-2 text-[#59657b] hover:bg-[#f2f4fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4866d9]"
          >
            <span aria-hidden="true">{previewsPaused ? "▶" : "Ⅱ"}</span>
            {previewsPaused ? "Play previews" : "Pause previews"}
          </button>
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        {filtered.length} component{filtered.length === 1 ? "" : "s"} found.
      </p>
      <div className="grid items-stretch gap-6 md:grid-cols-2">
        {filtered.map((item) => {
          return (
            <Link
              key={item.slug}
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
                  <span className="font-mono text-[10px] tracking-[0.14em] text-[#9299a5] uppercase">
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
                <p className="mt-2 text-[13px] leading-[1.85] text-[#828995]">
                  {item.description}
                </p>
                <div className="mt-4 mb-6 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded border border-[#e9ecf1] bg-[#fbfcfe] px-2 py-1 text-[10px] text-[#8b93a2]"
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
      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#dce1eb] py-20 text-center">
          <h3 className="text-base font-medium">No components found</h3>
          <p className="mt-2 text-sm text-[#838b9a]">
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
      <div className="mt-5 flex items-center justify-between gap-4 text-[10px] text-[#989faa]">
        <span>
          {String(filtered.length).padStart(2, "0")} /{" "}
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
